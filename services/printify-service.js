/**
 * Printify API Service
 * 
 * Service layer for interacting with Printify's Print-on-Demand API
 * Handles product creation, order management, and image processing
 */

const axios = require('axios');
const { PrintifyConfig } = require('../config/printify-config');

class PrintifyService {
  constructor() {
    this.baseUrl = `${PrintifyConfig.api.baseUrl}/${PrintifyConfig.api.version}`;
    this.shopId = PrintifyConfig.api.shopId;
    this.token = PrintifyConfig.api.token;
    
    // Configure axios instance
    this.api = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Wavelength-Lore/1.0'
      }
    });
    
    // Add request/response interceptors for logging and error handling
    this.api.interceptors.request.use(
      (config) => {
        if (PrintifyConfig.development.enableDebugLog) {
          console.log(`🔗 Printify API Request: ${config.method?.toUpperCase()} ${config.url}`);
        }
        return config;
      },
      (error) => {
        console.error('Printify API Request Error:', error);
        return Promise.reject(error);
      }
    );
    
    this.api.interceptors.response.use(
      (response) => {
        if (PrintifyConfig.development.enableDebugLog) {
          console.log(`✅ Printify API Response: ${response.status} ${response.config.url}`);
        }
        return response;
      },
      (error) => {
        console.error('Printify API Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }
  
  /**
   * Upload image to Printify for use in products
   * @param {Buffer} imageBuffer - Image file buffer
   * @param {string} fileName - Original filename
   * @param {string} title - Display title for the image
   * @returns {Object} Upload result with image ID and URL
   */
  async uploadImage(imageBuffer, fileName, title) {
    try {
      // Validate image before upload
      const validation = this.validateImage(imageBuffer, fileName);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
      
      // Create JSON payload for image upload according to Printify API spec
      const base64Image = imageBuffer.toString('base64');
      
      const payload = {
        file_name: fileName,
        contents: base64Image
      };
      
      // Send the request with JSON content type
      const response = await this.api.post('/uploads/images.json', payload);
      
      return {
        success: true,
        imageId: response.data.id,
        fileName: response.data.file_name,
        url: response.data.preview_url,
        width: response.data.width,
        height: response.data.height,
        size: response.data.size,
        mimeType: response.data.mime_type,
        uploadTime: response.data.upload_time
      };
      
    } catch (error) {
      console.error('Error uploading image to Printify:', error);
      
      // Log detailed error information
      if (error.response?.data) {
        console.error('Printify API Error Details:', JSON.stringify(error.response.data, null, 2));
      }
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to upload image',
        details: error.response?.data
      };
    }
  }
  
  /**
   * Create a custom product with user's image
   * @param {string} imageId - Printify image ID from upload
   * @param {Object} productOptions - Product customization options
   * @returns {Object} Created product details
   */
  async createCustomProduct(imageId, productOptions = {}) {
    try {
      const { title, description, tags = [] } = productOptions;
      
      // Get blueprint and variants for the initial product
      const blueprint = PrintifyConfig.products.initial;
      
      // Create product payload
      const productData = {
        title: title || 'Custom Wavelength Merchandise',
        description: description || 'Premium custom t-shirt featuring your favorite Wavelength Lore moment',
        blueprint_id: blueprint.blueprintId,
        print_provider_id: blueprint.printProviderId,
        variants: blueprint.variants.map(variant => ({
          id: variant.id,
          price: blueprint.pricing.total,
          is_enabled: true
        })),
        print_areas: [
          {
            variant_ids: blueprint.variants.map(v => v.id),
            placeholders: [
              {
                position: 'front',
                images: [
                  {
                    id: imageId,
                    x: 0.5,      // Center horizontally (0-1 scale)
                    y: 0.5,      // Center vertically (0-1 scale)
                    scale: 1,    // Full scale
                    angle: 0     // No rotation
                  }
                ]
              }
            ]
          }
        ],
        tags: ['wavelength', 'custom', 'merchandise', ...tags]
      };
      
      const response = await this.api.post(`/shops/${this.shopId}/products.json`, productData);
      
      return {
        success: true,
        productId: response.data.id,
        title: response.data.title,
        description: response.data.description,
        variants: response.data.variants,
        images: response.data.images,
        tags: response.data.tags
      };
      
    } catch (error) {
      console.error('Error creating custom product:', error);
      return {
        success: false,
        error: error.message || 'Failed to create custom product'
      };
    }
  }
  
  /**
   * Create a custom product with specific blueprint (for guided creation)
   * @param {string} imageId - Printify image ID from upload
   * @param {Object} productOptions - Product customization options with blueprint details
   * @returns {Object} Created product details
   */
  async createCustomProductWithBlueprint(imageId, productOptions = {}) {
    try {
      const { 
        title, 
        description, 
        tags = [], 
        blueprintId, 
        printProviderId,
        basePrice = 2099
      } = productOptions;
      
      if (!blueprintId || !printProviderId) {
        throw new Error('Blueprint ID and Print Provider ID are required');
      }
      
      // Get blueprint details to determine variants
      const blueprintDetails = await this.getBlueprintDetails(blueprintId, printProviderId);
      if (!blueprintDetails.success) {
        throw new Error('Failed to get blueprint details');
      }
      
      // Create product payload with specified blueprint
      const productData = {
        title: title || 'Custom Wavelength Merchandise',
        description: description || 'Premium custom merchandise featuring your favorite Wavelength Lore moment',
        blueprint_id: blueprintId,
        print_provider_id: printProviderId,
        variants: blueprintDetails.variants.map(variant => ({
          id: variant.id,
          price: basePrice,
          is_enabled: true
        })),
        print_areas: [
          {
            variant_ids: blueprintDetails.variants.map(v => v.id),
            placeholders: [
              {
                position: 'front',
                images: [
                  {
                    id: imageId,
                    x: 0.5,      // Center horizontally (0-1 scale)
                    y: 0.5,      // Center vertically (0-1 scale)
                    scale: 1,    // Full scale
                    angle: 0     // No rotation
                  }
                ]
              }
            ]
          }
        ],
        tags: ['wavelength', 'custom', 'merchandise', ...tags]
      };
      
      const response = await this.api.post(`/shops/${this.shopId}/products.json`, productData);
      
      return {
        success: true,
        productId: response.data.id,
        title: response.data.title,
        description: response.data.description,
        variants: response.data.variants,
        images: response.data.images,
        tags: response.data.tags
      };
      
    } catch (error) {
      console.error('Error creating custom product with blueprint:', error);
      return {
        success: false,
        error: error.message || 'Failed to create custom product'
      };
    }
  }
  
  /**
   * Get blueprint details including available variants
   * @param {number} blueprintId - Blueprint ID
   * @param {number} printProviderId - Print Provider ID
   * @returns {Object} Blueprint details with variants
   */
  async getBlueprintDetails(blueprintId, printProviderId) {
    try {
      const response = await this.api.get(
        `/catalog/blueprints/${blueprintId}/print_providers/${printProviderId}/variants.json`
      );
      
      return {
        success: true,
        variants: response.data.variants || response.data
      };
      
    } catch (error) {
      console.error('Error getting blueprint details:', error);
      
      // Fallback to default variants if API call fails
      console.log('Using fallback variants for blueprint', blueprintId);
      return {
        success: true,
        variants: this.getDefaultVariantsForBlueprint(blueprintId)
      };
    }
  }
  
  /**
   * Get default variants for a blueprint (fallback)
   * @param {number} blueprintId - Blueprint ID
   * @returns {Array} Default variants
   */
  getDefaultVariantsForBlueprint(blueprintId) {
    // Common variants for different blueprint types
    const defaultVariants = {
      5: [ // T-Shirt
        { id: 17887, title: 'S / Black', size: 'S', color: 'Black' },
        { id: 17888, title: 'M / Black', size: 'M', color: 'Black' },
        { id: 17889, title: 'L / Black', size: 'L', color: 'Black' },
        { id: 17890, title: 'XL / Black', size: 'XL', color: 'Black' }
      ],
      146: [ // Hoodie
        { id: 32090, title: 'S / Black', size: 'S', color: 'Black' },
        { id: 32091, title: 'M / Black', size: 'M', color: 'Black' },
        { id: 32092, title: 'L / Black', size: 'L', color: 'Black' },
        { id: 32093, title: 'XL / Black', size: 'XL', color: 'Black' }
      ],
      17: [ // Mug
        { id: 41070, title: '11oz / White', size: '11oz', color: 'White' },
        { id: 41071, title: '15oz / White', size: '15oz', color: 'White' }
      ]
    };
    
    return defaultVariants[blueprintId] || [
      { id: 1, title: 'Default', size: 'One Size', color: 'Default' }
    ];
  }
  
  /**
   * Get product details including pricing and availability
   * @param {string} productId - Printify product ID
   * @returns {Object} Product details
   */
  async getProduct(productId) {
    try {
      const response = await this.api.get(`/shops/${this.shopId}/products/${productId}.json`);
      
      return {
        success: true,
        product: response.data
      };
      
    } catch (error) {
      console.error('Error getting product details:', error);
      return {
        success: false,
        error: error.message || 'Failed to get product details'
      };
    }
  }
  
  /**
   * Calculate shipping costs for a product
   * @param {Array} lineItems - Array of product items
   * @param {Object} shippingAddress - Destination address
   * @returns {Object} Shipping cost breakdown
   */
  async calculateShipping(lineItems, shippingAddress) {
    try {
      const payload = {
        line_items: lineItems,
        address_to: {
          first_name: shippingAddress.firstName,
          last_name: shippingAddress.lastName,
          email: shippingAddress.email,
          phone: shippingAddress.phone,
          country: shippingAddress.country,
          region: shippingAddress.state,
          address1: shippingAddress.address1,
          address2: shippingAddress.address2 || '',
          city: shippingAddress.city,
          zip: shippingAddress.zip
        }
      };
      
      const response = await this.api.post(`/shops/${this.shopId}/orders/shipping.json`, payload);
      
      return {
        success: true,
        shippingCost: response.data.shipping_cost,
        methods: response.data.shipping_methods || []
      };
      
    } catch (error) {
      console.error('Error calculating shipping:', error);
      return {
        success: false,
        error: error.message || 'Failed to calculate shipping'
      };
    }
  }
  
  /**
   * Create an order for the custom product
   * @param {Array} lineItems - Products to order
   * @param {Object} shippingAddress - Shipping details
   * @param {Object} orderOptions - Additional order options
   * @returns {Object} Order creation result
   */
  async createOrder(lineItems, shippingAddress, orderOptions = {}) {
    try {
      const orderData = {
        external_id: orderOptions.externalId || `WL_${Date.now()}`,
        line_items: lineItems,
        shipping_method: orderOptions.shippingMethod || 1,
        send_shipping_notification: orderOptions.sendNotification !== false,
        address_to: {
          first_name: shippingAddress.firstName,
          last_name: shippingAddress.lastName,
          email: shippingAddress.email,
          phone: shippingAddress.phone,
          country: shippingAddress.country,
          region: shippingAddress.state,
          address1: shippingAddress.address1,
          address2: shippingAddress.address2 || '',
          city: shippingAddress.city,
          zip: shippingAddress.zip
        }
      };
      
      const response = await this.api.post(`/shops/${this.shopId}/orders.json`, orderData);
      
      return {
        success: true,
        orderId: response.data.id,
        status: response.data.status,
        total: response.data.total,
        lineItems: response.data.line_items,
        shippingCost: response.data.shipping_cost,
        totalCost: response.data.total_price
      };
      
    } catch (error) {
      console.error('Error creating order:', error);
      return {
        success: false,
        error: error.message || 'Failed to create order'
      };
    }
  }
  
  /**
   * Submit order for production
   * @param {string} orderId - Printify order ID
   * @returns {Object} Order submission result
   */
  async submitOrder(orderId) {
    try {
      const response = await this.api.post(`/shops/${this.shopId}/orders/${orderId}/actions/send_to_production.json`);
      
      return {
        success: true,
        orderId: response.data.id,
        status: response.data.status
      };
      
    } catch (error) {
      console.error('Error submitting order:', error);
      return {
        success: false,
        error: error.message || 'Failed to submit order'
      };
    }
  }
  
  /**
   * Get order status and tracking information
   * @param {string} orderId - Printify order ID
   * @returns {Object} Order status details
   */
  async getOrderStatus(orderId) {
    try {
      const response = await this.api.get(`/shops/${this.shopId}/orders/${orderId}.json`);
      
      return {
        success: true,
        order: response.data
      };
      
    } catch (error) {
      console.error('Error getting order status:', error);
      return {
        success: false,
        error: error.message || 'Failed to get order status'
      };
    }
  }
  
  /**
   * Get available blueprints (product types)
   * @returns {Array} Available blueprint options
   */
  async getBlueprints() {
    try {
      const response = await this.api.get('/catalog/blueprints.json');
      
      return {
        success: true,
        blueprints: response.data
      };
      
    } catch (error) {
      console.error('Error getting blueprints:', error);
      return {
        success: false,
        error: error.message || 'Failed to get available products'
      };
    }
  }
  
  /**
   * Get print providers for a blueprint
   * @param {number} blueprintId - Blueprint ID
   * @returns {Array} Available print providers
   */
  async getPrintProviders(blueprintId) {
    try {
      const response = await this.api.get(`/catalog/blueprints/${blueprintId}/print_providers.json`);
      
      return {
        success: true,
        providers: response.data
      };
      
    } catch (error) {
      console.error('Error getting print providers:', error);
      return {
        success: false,
        error: error.message || 'Failed to get print providers'
      };
    }
  }
  
  /**
   * Validate image for printing requirements
   * @param {Buffer} imageBuffer - Image file buffer
   * @param {string} fileName - Original filename
   * @returns {Object} Validation result
   */
  validateImage(imageBuffer, fileName) {
    const config = PrintifyConfig.imageProcessing;
    
    // Check file size
    if (imageBuffer.length > config.maxFileSize) {
      return {
        valid: false,
        error: PrintifyConfig.errors.messages.fileSize
      };
    }
    
    // Check file format
    const extension = fileName.split('.').pop().toUpperCase();
    if (!config.supportedFormats.includes(extension)) {
      return {
        valid: false,
        error: PrintifyConfig.errors.messages.format
      };
    }
    
    return { valid: true };
  }
  
  /**
   * Get content type for file extension
   * @param {string} fileName - File name with extension
   * @returns {string} MIME type
   */
  getContentType(fileName) {
    const extension = fileName.split('.').pop().toLowerCase();
    const mimeTypes = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp',
      'gif': 'image/gif'
    };
    
    return mimeTypes[extension] || 'image/jpeg';
  }
}

module.exports = PrintifyService;