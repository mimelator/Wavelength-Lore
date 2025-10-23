/**
 * Merchandise Database Service
 * 
 * Firebase service for storing user products, orders, and merchandise data
 */

const admin = require('firebase-admin');
const { 
  getAdminDatabase, 
  initializeFirebaseAdmin,
  isFirebaseAdminReady 
} = require('../helpers/firebase-admin-utils');

class MerchandiseDatabase {
  constructor() {
    this.db = null;
    this.productsRef = null;
    this.ordersRef = null;
    this.userProductsRef = null;
    this.userOrdersRef = null;
    this.initialized = false;
  }
  
  /**
   * Initialize Firebase database connections (lazy initialization)
   * Uses the same pattern as other database helpers in the system
   */
  initializeDatabase() {
    if (this.initialized) return; // Already initialized
    
    try {
      // Ensure Firebase Admin is initialized first (same pattern as config/database.js)
      if (!isFirebaseAdminReady()) {
        console.log('🔥 Initializing Firebase Admin for merchandise database...');
        initializeFirebaseAdmin();
      }
      
      // Get the admin database instance
      this.db = getAdminDatabase();
      
      if (!this.db) {
        throw new Error('Failed to get Firebase admin database instance');
      }
      
      // Initialize references
      this.productsRef = this.db.ref('merchandise/products');
      this.ordersRef = this.db.ref('merchandise/orders');
      this.userProductsRef = this.db.ref('merchandise/userProducts');
      this.userOrdersRef = this.db.ref('merchandise/userOrders');
      this.enhancedImagesRef = this.db.ref('merchandise/enhancedImages');
      
      this.initialized = true;
      console.log('✅ Merchandise database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Firebase database for merchandise:', error);
      throw error;
    }
  }
  
  /**
   * Check if database is ready for operations
   * @returns {boolean} True if database is initialized and ready
   */
  isDatabaseReady() {
    return this.initialized && !!this.db && isFirebaseAdminReady();
  }
  
  /**
   * Store user product association
   * @param {string} userId - User ID
   * @param {Object} productData - Product data to store
   * @returns {Promise<Object>} Operation result
   */
  async storeUserProduct(userId, productData) {
    try {
      this.initializeDatabase(); // Ensure database is initialized
      
      const productKey = `${userId}_${productData.productId}`;
      
      const productRecord = {
        ...productData,
        userId,
        createdAt: admin.database.ServerValue.TIMESTAMP,
        status: 'active'
      };
      
      // Store in user-specific products
      await this.userProductsRef.child(userId).child(productData.productId).set(productRecord);
      
      // Store in global products index
      await this.productsRef.child(productKey).set(productRecord);
      
      console.log(`✅ Stored product ${productData.productId} for user ${userId}`);
      
      return {
        success: true,
        productKey
      };
      
    } catch (error) {
      console.error('Error storing user product:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Get user's products
   * @param {string} userId - User ID
   * @returns {Promise<Array>} User's products
   */
  async getUserProducts(userId) {
    try {
      this.initializeDatabase(); // Ensure database is initialized
      
      const snapshot = await this.userProductsRef.child(userId).once('value');
      const products = [];
      
      snapshot.forEach((childSnapshot) => {
        const product = childSnapshot.val();
        products.push({
          ...product,
          localId: childSnapshot.key
        });
      });
      
      // Sort by creation date (newest first)
      products.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      
      return products;
      
    } catch (error) {
      console.error('Error getting user products:', error);
      return [];
    }
  }
  
  /**
   * Store user order
   * @param {string} userId - User ID
   * @param {Object} orderData - Order data to store
   * @returns {Promise<Object>} Operation result
   */
  async storeUserOrder(userId, orderData) {
    try {
      this.initializeDatabase(); // Ensure database is initialized
      
      const orderKey = `${userId}_${orderData.orderId}`;
      
      const orderRecord = {
        ...orderData,
        userId,
        createdAt: admin.database.ServerValue.TIMESTAMP,
        updatedAt: admin.database.ServerValue.TIMESTAMP
      };
      
      // Store in user-specific orders
      await this.userOrdersRef.child(userId).child(orderData.orderId).set(orderRecord);
      
      // Store in global orders index
      await this.ordersRef.child(orderKey).set(orderRecord);
      
      console.log(`✅ Stored order ${orderData.orderId} for user ${userId}`);
      
      return {
        success: true,
        orderKey
      };
      
    } catch (error) {
      console.error('Error storing user order:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Get user's orders
   * @param {string} userId - User ID
   * @returns {Promise<Array>} User's orders
   */
  async getUserOrders(userId) {
    try {
      this.initializeDatabase(); // Ensure database is initialized
      
      const snapshot = await this.userOrdersRef.child(userId).once('value');
      const orders = [];
      
      snapshot.forEach((childSnapshot) => {
        const order = childSnapshot.val();
        orders.push({
          ...order,
          localId: childSnapshot.key
        });
      });
      
      // Sort by creation date (newest first)
      orders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      
      return orders;
      
    } catch (error) {
      console.error('Error getting user orders:', error);
      return [];
    }
  }
  
  /**
   * Update order status
   * @param {string} orderId - Printify order ID
   * @param {Object} orderData - Updated order data from webhook
   * @returns {Promise<Object>} Operation result
   */
  async updateOrderStatus(orderId, orderData) {
    try {
      this.initializeDatabase(); // Ensure database is initialized
      
      // Find all records with this order ID
      const ordersSnapshot = await this.ordersRef.orderByChild('orderId').equalTo(orderId).once('value');
      
      const updates = {};
      ordersSnapshot.forEach((childSnapshot) => {
        const orderKey = childSnapshot.key;
        const existingOrder = childSnapshot.val();
        
        // Update both global and user-specific records
        updates[`merchandise/orders/${orderKey}/status`] = orderData.status;
        updates[`merchandise/orders/${orderKey}/updatedAt`] = admin.database.ServerValue.TIMESTAMP;
        updates[`merchandise/orders/${orderKey}/printifyData`] = orderData;
        
        updates[`merchandise/userOrders/${existingOrder.userId}/${orderId}/status`] = orderData.status;
        updates[`merchandise/userOrders/${existingOrder.userId}/${orderId}/updatedAt`] = admin.database.ServerValue.TIMESTAMP;
        updates[`merchandise/userOrders/${existingOrder.userId}/${orderId}/printifyData`] = orderData;
      });
      
      if (Object.keys(updates).length > 0) {
        await this.db.ref().update(updates);
        console.log(`✅ Updated order status for ${orderId}: ${orderData.status}`);
      }
      
      return {
        success: true,
        updatedRecords: Object.keys(updates).length / 4 // Each order has 4 fields updated
      };
      
    } catch (error) {
      console.error('Error updating order status:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Get product by ID and user
   * @param {string} userId - User ID
   * @param {string} productId - Product ID
   * @returns {Promise<Object|null>} Product data or null
   */
  async getUserProduct(userId, productId) {
    try {
      const snapshot = await this.userProductsRef.child(userId).child(productId).once('value');
      
      if (snapshot.exists()) {
        return {
          ...snapshot.val(),
          localId: snapshot.key
        };
      }
      
      return null;
      
    } catch (error) {
      console.error('Error getting user product:', error);
      return null;
    }
  }
  
  /**
   * Get order by ID and user
   * @param {string} userId - User ID
   * @param {string} orderId - Order ID
   * @returns {Promise<Object|null>} Order data or null
   */
  async getUserOrder(userId, orderId) {
    try {
      const snapshot = await this.userOrdersRef.child(userId).child(orderId).once('value');
      
      if (snapshot.exists()) {
        return {
          ...snapshot.val(),
          localId: snapshot.key
        };
      }
      
      return null;
      
    } catch (error) {
      console.error('Error getting user order:', error);
      return null;
    }
  }
  
  /**
   * Delete user product
   * @param {string} userId - User ID
   * @param {string} productId - Product ID
   * @returns {Promise<Object>} Operation result
   */
  async deleteUserProduct(userId, productId) {
    try {
      const productKey = `${userId}_${productId}`;
      
      const updates = {};
      updates[`merchandise/userProducts/${userId}/${productId}`] = null;
      updates[`merchandise/products/${productKey}`] = null;
      
      await this.db.ref().update(updates);
      
      console.log(`🗑️ Deleted product ${productId} for user ${userId}`);
      
      return { success: true };
      
    } catch (error) {
      console.error('Error deleting user product:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Store enhanced image association
   * @param {string} originalImageId - Original gallery image ID
   * @param {Object} enhancementData - Enhancement data
   * @returns {Promise<Object>} Operation result
   */
  async storeEnhancedImage(originalImageId, enhancementData) {
    try {
      this.initializeDatabase(); // Ensure database is initialized
      
      const enhancementRecord = {
        originalImageId,
        enhancedImageUrl: enhancementData.enhancedImageUrl,
        enhancementMethod: enhancementData.enhancementMethod,
        originalDimensions: enhancementData.originalDimensions,
        enhancedDimensions: enhancementData.enhancedDimensions,
        scaleFactor: enhancementData.scaleFactor,
        createdAt: admin.database.ServerValue.TIMESTAMP,
        status: 'active'
      };
      
      // Store with original image ID as key for easy lookup
      await this.enhancedImagesRef.child(originalImageId).set(enhancementRecord);
      
      console.log(`✅ Stored enhanced image association for ${originalImageId}`);
      
      return {
        success: true,
        enhancedImageId: originalImageId
      };
      
    } catch (error) {
      console.error('Error storing enhanced image:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Get enhanced image for original image ID
   * @param {string} originalImageId - Original gallery image ID
   * @returns {Promise<Object|null>} Enhanced image data or null
   */
  async getEnhancedImage(originalImageId) {
    try {
      this.initializeDatabase(); // Ensure database is initialized
      
      const snapshot = await this.enhancedImagesRef.child(originalImageId).once('value');
      
      if (snapshot.exists()) {
        const enhancedData = snapshot.val();
        console.log(`✅ Found enhanced image for ${originalImageId}`);
        return enhancedData;
      }
      
      console.log(`ℹ️ No enhanced image found for ${originalImageId}`);
      return null;
      
    } catch (error) {
      console.error('Error getting enhanced image:', error);
      return null;
    }
  }
  
  /**
   * Check if image has been enhanced
   * @param {string} originalImageId - Original gallery image ID
   * @returns {Promise<boolean>} True if enhanced version exists
   */
  async hasEnhancedVersion(originalImageId) {
    try {
      const enhancedData = await this.getEnhancedImage(originalImageId);
      return !!enhancedData;
    } catch (error) {
      console.error('Error checking enhanced image:', error);
      return false;
    }
  }
  
  /**
   * Delete enhanced image association
   * @param {string} originalImageId - Original gallery image ID
   * @returns {Promise<Object>} Operation result
   */
  async deleteEnhancedImage(originalImageId) {
    try {
      this.initializeDatabase(); // Ensure database is initialized
      
      await this.enhancedImagesRef.child(originalImageId).remove();
      
      console.log(`🗑️ Deleted enhanced image association for ${originalImageId}`);
      
      return { success: true };
      
    } catch (error) {
      console.error('Error deleting enhanced image:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get analytics data for merchandise
   * @returns {Promise<Object>} Analytics data
   */
  async getAnalytics() {
    try {
      const [productsSnapshot, ordersSnapshot] = await Promise.all([
        this.productsRef.once('value'),
        this.ordersRef.once('value')
      ]);
      
      const analytics = {
        totalProducts: 0,
        totalOrders: 0,
        totalRevenue: 0,
        ordersByStatus: {},
        productsByUser: {},
        recentActivity: []
      };
      
      // Count products
      productsSnapshot.forEach(() => {
        analytics.totalProducts++;
      });
      
      // Analyze orders
      ordersSnapshot.forEach((childSnapshot) => {
        const order = childSnapshot.val();
        analytics.totalOrders++;
        
        if (order.total) {
          analytics.totalRevenue += order.total;
        }
        
        const status = order.status || 'unknown';
        analytics.ordersByStatus[status] = (analytics.ordersByStatus[status] || 0) + 1;
        
        const userId = order.userId;
        analytics.productsByUser[userId] = (analytics.productsByUser[userId] || 0) + 1;
      });
      
      return analytics;
      
    } catch (error) {
      console.error('Error getting analytics:', error);
      return {
        totalProducts: 0,
        totalOrders: 0,
        totalRevenue: 0,
        ordersByStatus: {},
        productsByUser: {},
        recentActivity: []
      };
    }
  }
}

// Export the class directly to avoid immediate Firebase initialization
module.exports = MerchandiseDatabase;