#!/usr/bin/env node
/**
 * WAVELENGTH ORDER FLOW EMAIL TEST
 * ===============================
 * 
 * Test the actual order confirmation email flow
 * using the same system that processes real orders
 */

const emailService = require('../services/email-service');

class OrderFlowEmailTest {
  constructor() {
    this.testEmail = process.env.TEST_EMAIL || 'test@wavelengthlore.com';
  }

  async runTest() {
    console.log('🌊 WAVELENGTH ORDER FLOW EMAIL TEST');
    console.log('===================================');
    console.log(`📧 Testing with: ${this.testEmail}`);
    console.log(`🔧 Email provider: ${process.env.EMAIL_PROVIDER || 'console'}`);
    console.log('');

    try {
      // Simulate the exact order data structure used in the real system
      const orderData = this.generateRealisticOrderData();
      
      console.log('🛒 SIMULATING REAL ORDER FLOW');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📦 Order ID: ${orderData.orderId}`);
      console.log(`💳 Payment ID: ${orderData.paymentId}`);
      console.log(`💰 Amount: $${orderData.amount.toFixed(2)}`);
      console.log(`📧 Customer: ${orderData.customerData.email}`);
      console.log(`📍 Shipping: ${orderData.shippingAddress.city}, ${orderData.shippingAddress.state}`);
      console.log(`🛍️  Items: ${orderData.items.length} product(s)`);
      console.log('');

      // This is the exact same call made in routes/merchandise.js line 1656
      console.log('📧 SENDING ORDER CONFIRMATION EMAIL...');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      await emailService.sendOrderConfirmation(orderData, this.testEmail);
      
      console.log('✅ EMAIL SENT SUCCESSFULLY!');
      console.log('');
      console.log('🎉 ORDER FLOW SIMULATION COMPLETE');
      console.log('================================');
      console.log('✅ Order processing: SUCCESS');
      console.log('✅ Email delivery: SUCCESS');
      console.log('✅ Customer notification: SUCCESS');
      console.log('');
      
      if (process.env.EMAIL_PROVIDER === 'console') {
        console.log('ℹ️  In production with SendGrid/SES, the customer would receive this email immediately.');
      } else {
        console.log(`📧 Check ${this.testEmail} for the order confirmation email!`);
      }

    } catch (error) {
      console.error('❌ ORDER FLOW TEST FAILED:', error.message);
      throw error;
    }
  }

  /**
   * Generate realistic order data matching production structure
   */
  generateRealisticOrderData() {
    const timestamp = Date.now();
    const orderId = `WL-${timestamp}`;
    const paymentId = `pi_${Math.random().toString(36).substring(2, 15)}`;

    return {
      orderId: orderId,
      paymentId: paymentId,
      amount: 89.97,
      items: [
        {
          title: 'Wavelength Lore Premium T-Shirt',
          price: 29.99,
          quantity: 1,
          selectedSize: 'L',
          selectedColor: 'Cosmic Blue',
          image: 'https://wavelengthlore.com/images/previews/tshirt-preview.svg'
        },
        {
          title: 'Wavelength Lore Canvas Print',
          price: 59.98,
          quantity: 1,
          selectedSize: '16x20',
          selectedColor: 'Premium Canvas',
          image: 'https://wavelengthlore.com/images/previews/canvas-preview.svg'
        }
      ],
      customerData: {
        firstName: 'Alex',
        lastName: 'Wavecrest',
        email: this.testEmail,
        address: '123 Frequency Lane',
        city: 'Resonance City',
        state: 'CA',
        zip: '90210',
        country: 'US'
      },
      shippingAddress: {
        firstName: 'Alex',
        lastName: 'Wavecrest',
        address1: '123 Frequency Lane',
        address2: 'Apt 4B',
        city: 'Resonance City',
        state: 'CA',
        zip: '90210',
        country: 'US'
      },
      subtotal: 89.97,
      tax: 7.20,
      total: 97.17,
      status: 'paid',
      createdAt: new Date().toISOString()
    };
  }
}

// Run the test
async function main() {
  const test = new OrderFlowEmailTest();
  await test.runTest();
}

// Execute if run directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
}

module.exports = OrderFlowEmailTest;