/**
 * WAVELENGTH Order Management API
 * ==============================
 * 
 * Handles order processing, confirmation emails, and order tracking
 */

const express = require('express');
const OrderEmailService = require('../services/order-email-service');

class OrderAPI {
  constructor() {
    this.router = express.Router();
    this.emailService = new OrderEmailService();
    this.orders = new Map(); // In-memory storage (use database in production)
    this.setupRoutes();
  }

  setupRoutes() {
    // Send order confirmation email
    this.router.post('/send-confirmation', this.sendOrderConfirmation.bind(this));
    
    // Get order details
    this.router.get('/order/:orderId', this.getOrderDetails.bind(this));
    
    // Store order (for testing/demo purposes)
    this.router.post('/store-order', this.storeOrder.bind(this));
    
    // Get order tracking info
    this.router.get('/tracking/:orderId', this.getTrackingInfo.bind(this));
  }

  async sendOrderConfirmation(req, res) {
    try {
      const orderData = req.body;
      
      // Validate required fields
      if (!orderData.orderId || !orderData.customerData || !orderData.items) {
        return res.status(400).json({
          success: false,
          error: 'Missing required order data'
        });
      }

      // Store order in memory (use database in production)
      this.orders.set(orderData.orderId, {
        ...orderData,
        createdAt: new Date().toISOString(),
        status: 'confirmed'
      });

      // Send confirmation email
      const emailResult = await this.emailService.sendOrderConfirmation(orderData);
      
      if (emailResult.success) {
        console.log('✅ Order confirmation email sent for:', orderData.orderId);
        res.json({
          success: true,
          message: 'Order confirmation email sent successfully',
          messageId: emailResult.messageId
        });
      } else {
        console.warn('⚠️  Order confirmation email failed:', emailResult.error);
        res.json({
          success: false,
          error: emailResult.error,
          message: 'Order processed but email failed to send'
        });
      }
    } catch (error) {
      console.error('❌ Order confirmation error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getOrderDetails(req, res) {
    try {
      const { orderId } = req.params;
      
      const order = this.orders.get(orderId);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found'
        });
      }

      res.json({
        success: true,
        order: order
      });
    } catch (error) {
      console.error('❌ Get order details error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async storeOrder(req, res) {
    try {
      const orderData = req.body;
      
      if (!orderData.orderId) {
        return res.status(400).json({
          success: false,
          error: 'Order ID required'
        });
      }

      // Store order
      this.orders.set(orderData.orderId, {
        ...orderData,
        createdAt: new Date().toISOString(),
        status: 'stored'
      });

      res.json({
        success: true,
        message: 'Order stored successfully'
      });
    } catch (error) {
      console.error('❌ Store order error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getTrackingInfo(req, res) {
    try {
      const { orderId } = req.params;
      
      const order = this.orders.get(orderId);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found'
        });
      }

      // Generate demo tracking info
      const trackingInfo = this.generateTrackingInfo(order);
      
      res.json({
        success: true,
        tracking: trackingInfo
      });
    } catch (error) {
      console.error('❌ Get tracking info error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  generateTrackingInfo(order) {
    const createdAt = new Date(order.createdAt);
    const now = new Date();
    const hoursSinceOrder = Math.floor((now - createdAt) / (1000 * 60 * 60));
    
    let status = 'Order Confirmed';
    let statusDescription = 'Your order has been received and is being processed.';
    let estimatedDelivery = new Date(createdAt.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days
    
    if (hoursSinceOrder > 24) {
      status = 'Processing';
      statusDescription = 'Your order is being prepared for shipment.';
      estimatedDelivery = new Date(createdAt.getTime() + (5 * 24 * 60 * 60 * 1000)); // 5 days
    }
    
    if (hoursSinceOrder > 48) {
      status = 'Shipped';
      statusDescription = 'Your order has been shipped and is on its way.';
      estimatedDelivery = new Date(createdAt.getTime() + (3 * 24 * 60 * 60 * 1000)); // 3 days
    }

    return {
      orderId: order.orderId,
      status: status,
      statusDescription: statusDescription,
      estimatedDelivery: estimatedDelivery.toLocaleDateString(),
      trackingNumber: `WL${order.orderId.slice(-8).toUpperCase()}`,
      timeline: [
        {
          status: 'Order Confirmed',
          timestamp: order.createdAt,
          completed: true,
          description: 'Order received and confirmed'
        },
        {
          status: 'Processing',
          timestamp: new Date(createdAt.getTime() + (24 * 60 * 60 * 1000)).toISOString(),
          completed: hoursSinceOrder > 24,
          description: 'Order is being prepared'
        },
        {
          status: 'Shipped',
          timestamp: new Date(createdAt.getTime() + (48 * 60 * 60 * 1000)).toISOString(),
          completed: hoursSinceOrder > 48,
          description: 'Order has been shipped'
        },
        {
          status: 'Delivered',
          timestamp: estimatedDelivery.toISOString(),
          completed: false,
          description: 'Order delivered to customer'
        }
      ]
    };
  }

  getRouter() {
    return this.router;
  }
}

module.exports = OrderAPI;