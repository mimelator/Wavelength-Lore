/**
 * Printify API Service
 * 
 * Service layer for interacting with Printify's Print-on-Demand API
 * Handles product creation, order management, and image processing
 */

const axios = require('axios');
const { PrintifyConfig } = require('../config/printify-config');
const RuntimeDiagnostics = require('../utils/runtime-diagnostics');

class PrintifyService {
  constructor() {
    // Enhanced validation and URL construction
    this.validateConfiguration();
    
    // Fix double version issue - use baseUrl directly since it already includes version
    this.baseUrl = PrintifyConfig.api.baseUrl;
    this.shopId = PrintifyConfig.api.shopId;
    this.token = PrintifyConfig.api.token;
    
    console.log(`🔧 PrintifyService initialized with baseURL: ${this.baseUrl}`);
    
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
   * Validate PrintifyService configuration
   * @throws {Error} If configuration is invalid
   */
  validateConfiguration() {
    const errors = [];
    
    if (!PrintifyConfig.api.baseUrl) {
      errors.push('PrintifyConfig.api.baseUrl is required');
    }
    
    if (!PrintifyConfig.api.shopId) {
      errors.push('PrintifyConfig.api.shopId is required');
    }
    
    if (!PrintifyConfig.api.token) {
      errors.push('PrintifyConfig.api.token is required');
    }
    
    // Check for double version in URL
    if (PrintifyConfig.api.baseUrl && PrintifyConfig.api.baseUrl.includes('/v1/v1')) {
      errors.push('PrintifyConfig.api.baseUrl contains duplicate version path');
    }
    
    if (errors.length > 0) {
      const errorMsg = `PrintifyService configuration errors: ${errors.join(', ')}`;
      console.error('😨 PRINTIFY SERVICE CONFIGURATION ERROR:', errorMsg);
      throw new Error(errorMsg);
    }
    
    console.log('✅ PrintifyService configuration validated successfully');
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
      
      // VARIANT LIMITING: Printify allows maximum 100 variants per product
      const MAX_VARIANTS = 100;
      let selectedVariants = blueprintDetails.variants;
      
      if (selectedVariants.length > MAX_VARIANTS) {
        console.log(`⚠️ Blueprint ${blueprintId} has ${selectedVariants.length} variants, limiting to ${MAX_VARIANTS}`);
        
        // Smart variant selection: prioritize common sizes and colors
        selectedVariants = this.selectOptimalVariants(selectedVariants, MAX_VARIANTS);
        
        console.log(`✅ Selected ${selectedVariants.length} optimal variants from ${blueprintDetails.variants.length} available`);
      }
      
      // Create product payload with specified blueprint
      const productData = {
        title: title || 'Custom Wavelength Merchandise',
        description: description || 'Premium custom merchandise featuring your favorite Wavelength Lore moment',
        blueprint_id: blueprintId,
        print_provider_id: printProviderId,
        variants: selectedVariants.map(variant => ({
          id: variant.id,
          price: basePrice,
          is_enabled: true
        })),
        print_areas: [
          {
            variant_ids: selectedVariants.map(v => v.id),
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
      
      // Enhanced error logging for Printify API errors
      if (error.response?.data) {
        console.error('Printify API Response Error:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
        
        // Log specific error details if available
        if (error.response.data.errors) {
          console.error('Printify API Error Details:', error.response.data.errors);
        }
      }
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to create custom product',
        details: error.response?.data
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
      // Use the new getBlueprintVariants method
      const variants = await this.getBlueprintVariants(blueprintId, printProviderId);
      
      return {
        success: true,
        variants: variants
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
   * Get variants for a specific blueprint and print provider combination
   * Used for compatibility testing to prevent 404 errors
   * @param {number} blueprintId - Blueprint ID
   * @param {number} printProviderId - Print Provider ID
   * @returns {Array} Available variants for this combination
   */
  async getBlueprintVariants(blueprintId, printProviderId) {
    try {
      const response = await this.api.get(
        `/catalog/blueprints/${blueprintId}/print_providers/${printProviderId}/variants.json`
      );
      
      return response.data.variants || response.data;
      
    } catch (error) {
      // Re-throw the error so the test can catch 404s specifically
      throw error;
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
    const context = 'validateImage';
    
    // ENHANCED DIAGNOSTICS: Parameter validation with detailed logging
    const diagnostics = new RuntimeDiagnostics('PrintifyService');
    console.log(`🔍 VALIDATE IMAGE DIAGNOSTICS: fileName="${fileName || 'undefined'}", bufferSize=${imageBuffer?.length || 'null'}`);
    
    // Validate parameters first
    if (!imageBuffer || !Buffer.isBuffer(imageBuffer)) {
      console.error('🚨 VALIDATION ERROR: imageBuffer is null, undefined, or not a Buffer');
      console.error('📊 Received imageBuffer:', typeof imageBuffer, imageBuffer);
      return {
        valid: false,
        error: 'Invalid image buffer provided'
      };
    }
    
    // Handle undefined fileName more gracefully
    if (!fileName || typeof fileName !== 'string') {
      console.warn(`⚠️ ${context}: fileName is null, undefined, or not a string - using default`);
      console.warn('📊 Received fileName:', typeof fileName, fileName);
      fileName = 'unknown-image.png'; // Provide default filename
    }
    
    // Ensure filename has proper extension
    if (!fileName.includes('.')) {
      console.warn(`⚠️ ${context}: fileName lacks extension, adding .png:`, fileName);
      fileName = `${fileName}.png`;
    }
    
    // Check file size
    if (imageBuffer.length > config.maxFileSize) {
      return {
        valid: false,
        error: PrintifyConfig.errors.messages.fileSize
      };
    }
    
    // Check file format
    if (!fileName || typeof fileName !== 'string' || !fileName.includes('.')) {
      console.warn(`⚠️ ${context}: Invalid filename format, assuming PNG:`, fileName);
      return { valid: true }; // Allow and assume PNG for cache files
    }
    
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
   * Select optimal variants from a large set, prioritizing common sizes and colors
   * @param {Array} variants - All available variants
   * @param {number} maxVariants - Maximum number of variants to select
   * @returns {Array} Selected variants
   */
  selectOptimalVariants(variants, maxVariants) {
    // Priority order for sizes (most common first)
    const sizePriority = ['S', 'M', 'L', 'XL', 'XXL', 'XS', '3XL', '4XL', '5XL'];
    
    // Priority order for colors (most popular first)
    const colorPriority = [
      'Black', 'White', 'Navy', 'Gray', 'Grey', 'Dark Gray', 'Dark Grey',
      'Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Pink', 'Orange',
      'Heather Grey', 'Heather Gray', 'Royal Blue', 'Forest Green'
    ];
    
    // Score each variant based on size and color priority
    const scoredVariants = variants.map(variant => {
      let score = 0;
      
      // Extract size and color from variant title or properties
      const title = variant.title || variant.name || '';
      const size = variant.size || this.extractSizeFromTitle(title);
      const color = variant.color || this.extractColorFromTitle(title);
      
      // Size scoring (higher score = higher priority)
      const sizeIndex = sizePriority.indexOf(size);
      if (sizeIndex !== -1) {
        score += (sizePriority.length - sizeIndex) * 10;
      }
      
      // Color scoring (higher score = higher priority)
      const colorIndex = colorPriority.indexOf(color);
      if (colorIndex !== -1) {
        score += (colorPriority.length - colorIndex) * 5;
      }
      
      return { ...variant, score, size, color };
    });
    
    // Sort by score (highest first) and take the top variants
    const selectedVariants = scoredVariants
      .sort((a, b) => b.score - a.score)
      .slice(0, maxVariants);
    
    console.log(`🎯 Variant selection summary:`);
    console.log(`   Total available: ${variants.length}`);
    console.log(`   Selected: ${selectedVariants.length}`);
    console.log(`   Top 5 selected: ${selectedVariants.slice(0, 5).map(v => `${v.size || 'N/A'}/${v.color || 'N/A'}`).join(', ')}`);
    
    return selectedVariants;
  }
  
  /**
   * Extract size from variant title
   * @param {string} title - Variant title
   * @returns {string} Extracted size or empty string
   */
  extractSizeFromTitle(title) {
    // First try to match full size names
    const fullSizeMatch = title.match(/\b(Extra Small|Small|Medium|Large|Extra Large)\b/i);
    if (fullSizeMatch) {
      const fullSize = fullSizeMatch[1].toLowerCase();
      const sizeMap = {
        'extra small': 'XS',
        'small': 'S',
        'medium': 'M',
        'large': 'L',
        'extra large': 'XL'
      };
      return sizeMap[fullSize] || '';
    }
    
    // Then try abbreviated sizes
    const sizeMatch = title.match(/\b(XS|S|M|L|XL|XXL|2XL|3XL|4XL|5XL)\b/i);
    return sizeMatch ? sizeMatch[1].toUpperCase() : '';
  }
  
  /**
   * Extract color from variant title
   * @param {string} title - Variant title
   * @returns {string} Extracted color or empty string
   */
  extractColorFromTitle(title) {
    // Single comprehensive regex with longer matches first
    const colorPattern = /\b(Dark Gray|Dark Grey|Light Gray|Light Grey|Heather Grey|Heather Gray|Royal Blue|Forest Green|Navy Blue|Black|White|Navy|Gray|Grey|Red|Blue|Green|Yellow|Purple|Pink|Orange|Maroon|Burgundy|Teal|Turquoise)\b/i;
    
    const match = title.match(colorPattern);
    return match ? match[1] : '';
  }
  
  /**
   * Get content type for file extension
   * @param {string} fileName - File name with extension
   * @returns {string} MIME type
   */
  getContentType(fileName) {
    if (!fileName || !fileName.includes('.')) {
      return 'image/png'; // Default to PNG for cache files
    }
    
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