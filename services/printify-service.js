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
    
    // Availability cache to reduce API calls and prevent showing discontinued products
    this.availabilityCache = new Map();
    this.cacheTimeout = 30 * 60 * 1000; // 30 minutes
    
    // Bulk validation cache for product lists
    this.bulkValidationCache = null;
    this.bulkCacheTimestamp = null;
    this.bulkCacheTimeout = 15 * 60 * 1000; // 15 minutes for bulk results
    
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
   * Enrich variants with image data from Printify's images array
   * Maps images to variants using variant_ids array in image objects
   * @param {Array} variants - Variant objects from Printify
   * @param {Array} images - Image objects from Printify
   * @returns {Array} Variants with attached image data
   */
  enrichVariantsWithImages(variants, images) {
    if (!variants || !images || images.length === 0) {
      console.log('⚠️ [ENRICH] No images to map - returning variants as-is');
      return variants;
    }

    console.log(`🔗 [ENRICH] Mapping ${images.length} images to ${variants.length} variants`);

    // Build a Map: variantId → image
    // Each image has a variant_ids array that maps it to multiple variants
    const variantIdToImage = new Map();

    images.forEach((image, imageIndex) => {
      if (!image.variant_ids || !Array.isArray(image.variant_ids)) {
        console.log(`   ⚠️ Image ${imageIndex} has no variant_ids array, skipping`);
        return;
      }

      // For each variant ID in this image's variant_ids array
      image.variant_ids.forEach(variantId => {
        // Only set if we haven't already mapped this variant to an image
        if (!variantIdToImage.has(variantId)) {
          variantIdToImage.set(variantId, image);
        }
      });
    });

    console.log(`   📊 Built variantId→image map with ${variantIdToImage.size} variant mappings`);

    // DEBUG: Log sample of what we're about to use
    if (variantIdToImage.size > 0) {
      const firstMappedImage = Array.from(variantIdToImage.values())[0];
      console.log(`   🔍 Sample mapped image check:`);
      console.log(`      Has src? ${firstMappedImage.src ? '✅' : '❌'}`);
      console.log(`      src value: ${firstMappedImage.src ? firstMappedImage.src.substring(0, 50) + '...' : 'NULL/UNDEFINED'}`);
      console.log(`      position: ${firstMappedImage.position || 'undefined'}`);
    }

    // Enrich each variant with its matched image
    const enrichedVariants = variants.map((variant, variantIndex) => {
      // Look up this variant's image in the map
      const matchedImage = variantIdToImage.get(variant.id);

      if (matchedImage) {
        // Variant has a matching image
        if (variantIndex < 3) {
          console.log(`   📌 Variant ${variant.id}: matchedImage keys = ${Object.keys(matchedImage).join(', ')}, src = ${matchedImage.src ? '✅' : '❌'}`);
        }

        if (matchedImage.src) {
          // Variant has a matching image with src property
          return {
            ...variant,
            image: {
              url: matchedImage.src,  // Use src, not url
              position: matchedImage.position || 'front'
              // Note: Do NOT use matchedImage.id - image objects don't have an id field
            }
          };
        }
      }

      // No matching image found for this variant
      if (variantIndex < 5) {
        // Only log first 5 misses to avoid spam
        console.log(`   ⚠️ Variant ${variant.id} (${variant.title}) - no image found`);
      } else if (variantIndex === 5) {
        console.log(`   ⚠️ ... and ${variants.length - 5} more variants without images`);
      }

      return variant;
    });

    const enrichedCount = enrichedVariants.filter(v => v.image).length;
    console.log(`✅ [ENRICH] Complete - ${enrichedCount}/${enrichedVariants.length} variants have images`);

    // DEBUG: Log structure of enriched variant
    if (enrichedVariants.length > 0 && enrichedVariants[0].image) {
      console.log(`   🔍 First enriched variant image object:  ${JSON.stringify(enrichedVariants[0].image)}`);
      console.log(`   🔍 First enriched variant image.id: ${enrichedVariants[0].image.id || 'NOT DEFINED'}`);
      console.log(`   🔍 First enriched variant image.url: ${enrichedVariants[0].image.url || 'NOT DEFINED'}`);
    }

    return enrichedVariants;
  }

  /**
   * Upload image to Printify for use in products
   * @param {Buffer} imageBuffer - Image file buffer
   * @param {string} fileName - Original filename
   * @param {string} title - Display title for the image
   * @returns {Object} Upload result with image ID and URL
   */
  async uploadImage(imageBuffer, fileName, title) {
    // Declare variables outside try block for error logging access
    let uploadBuffer = imageBuffer;
    let uploadFileName = fileName;
    let base64Image;
    
    try {
      // Validate image before upload
      const validation = this.validateImage(imageBuffer, fileName);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Detect actual image format from buffer and convert WebP to PNG
      // Printify API doesn't support WebP despite what their docs might say
      let actualFormat = 'unknown';
      
      // Detect format from buffer header
      if (imageBuffer.length >= 12) {
        const header = imageBuffer.toString('hex', 0, 12);
        if (header.startsWith('89504e47')) {
          actualFormat = 'png';
        } else if (header.startsWith('ffd8ff')) {
          actualFormat = 'jpeg';
        } else if (header.startsWith('474946383761') || header.startsWith('474946383961')) {
          actualFormat = 'gif';
        } else if (header.startsWith('52494646') && imageBuffer.toString('ascii', 8, 12) === 'WEBP') {
          actualFormat = 'webp';
        }
      }
      
      console.log(`🔍 Detected image format: ${actualFormat} (from buffer analysis)`);
      
      // Convert WebP to PNG regardless of filename
      if (actualFormat === 'webp') {
        console.log('🎨 Converting WebP buffer to PNG for Printify compatibility...');
        try {
          const sharp = require('sharp');
          uploadBuffer = await sharp(imageBuffer).png().toBuffer();
          
          // Ensure filename has proper extension
          if (uploadFileName && !uploadFileName.toLowerCase().endsWith('.png')) {
            if (uploadFileName.toLowerCase().endsWith('.webp')) {
              uploadFileName = uploadFileName.replace(/\.webp$/i, '.png');
            } else {
              uploadFileName = uploadFileName + '.png';
            }
          }
          
          console.log(`✅ WebP buffer conversion successful: ${fileName} → ${uploadFileName}`);
          console.log(`   Original buffer: ${(imageBuffer.length / 1024).toFixed(2)} KB (WebP)`);
          console.log(`   Converted buffer: ${(uploadBuffer.length / 1024).toFixed(2)} KB (PNG)`);
        } catch (conversionError) {
          console.warn('⚠️ WebP buffer conversion failed, attempting original upload:', conversionError.message);
          // Fall through to attempt original upload
        }
      }

      // Create JSON payload for image upload according to Printify API spec
      base64Image = uploadBuffer.toString('base64');

      const payload = {
        file_name: uploadFileName,
        contents: base64Image
      };

      // 🔍 PRE-UPLOAD DIAGNOSTICS
      console.log('📤 PRINTIFY UPLOAD ATTEMPT:');
      console.log('   📁 fileName:', uploadFileName);
      console.log('   📊 Buffer size:', (uploadBuffer.length / 1024).toFixed(2), 'KB');
      console.log('   🔤 Base64 size:', (base64Image.length / 1024).toFixed(2), 'KB');
      console.log('   📏 Payload keys:', Object.keys(payload));
      
      // Validate base64 is not corrupted
      if (!base64Image || base64Image.length === 0) {
        throw new Error('Base64 conversion failed - empty result');
      }
      
      // Check if base64 looks valid (should start with valid data URL patterns)
      const base64Start = base64Image.substring(0, 50);
      console.log('   🔤 Base64 preview:', base64Start + '...');

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
      
      // 🔍 ENHANCED ERROR DIAGNOSTICS
      console.error('🚨 PRINTIFY UPLOAD FAILURE DETAILS:');
      console.error('   📁 Original fileName:', fileName);
      console.error('   📁 Upload fileName:', uploadFileName);
      console.error('   📊 Original buffer size:', (imageBuffer.length / 1024).toFixed(2), 'KB');
      console.error('   📊 Upload buffer size:', (uploadBuffer.length / 1024).toFixed(2), 'KB');
      console.error('   🔤 Base64 length:', base64Image ? (base64Image.length / 1024).toFixed(2) + 'KB' : 'undefined');
      
      // Log detailed error information
      if (error.response?.data) {
        console.error('🚨 Printify API Error Details:', JSON.stringify(error.response.data, null, 2));
        console.error('📡 Response Status:', error.response.status);
        console.error('📡 Response Headers:', error.response.headers);
      }
      
      if (error.response?.status === 400) {
        console.error('🔍 400 BAD REQUEST - Possible causes:');
        console.error('   1. Invalid image format or corrupted data');
        console.error('   2. File too large (current:', (uploadBuffer.length / 1024).toFixed(2), 'KB)');
        console.error('   3. Invalid base64 encoding');
        console.error('   4. Missing required fields in payload');
        console.error('   📋 Payload structure sent:');
        console.error('      file_name:', uploadFileName);
        console.error('      contents: [base64 data -', base64Image ? (base64Image.length / 1024).toFixed(2) + 'KB]' : 'undefined');
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

      // Use working blueprint/provider combination from testing
      const blueprintId = 5; // Unisex Cotton Crew Tee
      const printProviderId = 61; // Dimona Tee

      // CRITICAL FIX: Validate product availability before creating
      console.log(`🔍 Validating product availability before creation (Blueprint ${blueprintId} + Provider ${printProviderId})`);
      const availability = await this.validateProductAvailability(blueprintId, printProviderId);
      
      if (!availability.available) {
        console.error(`❌ Cannot create product - blueprint/provider combination unavailable:`);
        console.error(`   Reason: ${availability.reason}`);
        throw new Error(`Product unavailable: ${availability.reason} (Blueprint ${blueprintId}, Provider ${printProviderId})`);
      }
      
      console.log(`✅ Product availability confirmed - proceeding with creation (${availability.variantCount} variants available)`);

      // Use actual available variants instead of hardcoded ones
      const defaultPrice = 2099; // Fallback price
      
      const variants = availability.enabledVariants.slice(0, 4).map(variant => ({
        id: variant.id,
        price: variant.price || defaultPrice,
        is_enabled: true // We set this for product creation
      }));

      // Create product payload with validated variants
      const productData = {
        title: title || 'Custom Wavelength Merchandise',
        description: description || 'Premium custom t-shirt featuring your favorite Wavelength Lore moment',
        blueprint_id: blueprintId,
        print_provider_id: printProviderId,
        variants: variants,
        print_areas: [
          {
            variant_ids: variants.map(v => v.id),
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

      // LOG VARIANT STRUCTURE FOR DEBUGGING
      console.log('🔍 [PRINTIFY] createCustomProduct - variant structure:');
      if (response.data.variants && response.data.variants.length > 0) {
        const firstVariant = response.data.variants[0];
        console.log(`   Sample variant (first of ${response.data.variants.length}):`);
        console.log(`   - ID: ${firstVariant.id}`);
        console.log(`   - Title: ${firstVariant.title}`);
        console.log(`   - Has image field: ${firstVariant.image ? 'YES' : 'NO'}`);
        if (firstVariant.image) {
          console.log(`   - Image URL: ${firstVariant.image.url || 'NO URL'}`);
        }
        console.log(`   - All keys: ${Object.keys(firstVariant).join(', ')}`);
      }

      // ENRICH VARIANTS WITH IMAGES
      const enrichedVariants = this.enrichVariantsWithImages(response.data.variants, response.data.images);

      // Log results of enrichment
      const enrichedCount = enrichedVariants.filter(v => v.image).length;
      console.log(`\n✅ [ENRICH RESULT] ${enrichedCount}/${enrichedVariants.length} variants now have images`);
      if (enrichedVariants.length > 0 && enrichedVariants[0].image) {
        console.log(`   Sample enriched variant:`);
        console.log(`   - Title: ${enrichedVariants[0].title}`);
        console.log(`   - Image URL: ${enrichedVariants[0].image.url}`);
      }

      return {
        success: true,
        productId: response.data.id,
        title: response.data.title,
        description: response.data.description,
        variants: enrichedVariants,
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

      // LOG VARIANT STRUCTURE FOR DEBUGGING
      console.log('🔍 [PRINTIFY] createCustomProductWithBlueprint - variant structure:');
      if (response.data.variants && response.data.variants.length > 0) {
        const firstVariant = response.data.variants[0];
        console.log(`   Sample variant (first of ${response.data.variants.length}):`);
        console.log(`   - ID: ${firstVariant.id}`);
        console.log(`   - Title: ${firstVariant.title}`);
        console.log(`   - Has image field: ${firstVariant.image ? 'YES' : 'NO'}`);
        if (firstVariant.image) {
          console.log(`   - Image URL: ${firstVariant.image.url || 'NO URL'}`);
        }
        console.log(`   - Options: ${JSON.stringify(firstVariant.options || [])}`);
        console.log(`   - All keys: ${Object.keys(firstVariant).join(', ')}`);
      }

      // LOG IMAGES STRUCTURE
      console.log(`\n🖼️  [PRINTIFY] Images array (${response.data.images?.length || 0} images):`);
      if (response.data.images && response.data.images.length > 0) {
        const firstImage = response.data.images[0];
        console.log(`   Sample image (first of ${response.data.images.length}):`);
        console.log(`   - ID: ${firstImage.id}`);
        console.log(`   - URL: ${firstImage.url}`);
        console.log(`   - Options: ${JSON.stringify(firstImage.options || {})}`);
        console.log(`   - All keys: ${Object.keys(firstImage).join(', ')}`);
      }

      // ENRICH VARIANTS WITH IMAGES
      const enrichedVariants = this.enrichVariantsWithImages(response.data.variants, response.data.images);

      // Log results of enrichment
      const enrichedCount = enrichedVariants.filter(v => v.image).length;
      console.log(`\n✅ [ENRICH RESULT] ${enrichedCount}/${enrichedVariants.length} variants now have images`);
      if (enrichedVariants.length > 0 && enrichedVariants[0].image) {
        console.log(`   Sample enriched variant:`);
        console.log(`   - Title: ${enrichedVariants[0].title}`);
        console.log(`   - Image URL: ${enrichedVariants[0].image.url}`);
      }

      return {
        success: true,
        productId: response.data.id,
        title: response.data.title,
        description: response.data.description,
        variants: enrichedVariants,
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
      const variantsResult = await this.getBlueprintVariants(blueprintId, printProviderId);
      
      if (!variantsResult.success) {
        return variantsResult; // Return the error from getBlueprintVariants
      }
      
      return {
        success: true,
        variants: variantsResult.variants
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
    // Updated variants based on actual API testing
    const defaultVariants = {
      5: [ // T-Shirt (Blueprint 5 with Provider 61)
        { id: 17391, title: 'Heather Grey / S', size: 'S', color: 'Heather Grey' },
        { id: 17392, title: 'Heather Grey / M', size: 'M', color: 'Heather Grey' },
        { id: 17393, title: 'Heather Grey / L', size: 'L', color: 'Heather Grey' },
        { id: 17394, title: 'Heather Grey / XL', size: 'XL', color: 'Heather Grey' }
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
      // Mock response for development/testing
      if (PrintifyConfig.development.mockResponses) {
        console.log('🎭 Using mock response for Printify order creation');
        return {
          success: true,
          orderId: `MOCK_ORDER_${Date.now()}`,
          status: 'draft',
          total: 2099, // $20.99 in cents
          lineItems: lineItems,
          shippingCost: 499, // $4.99
          totalCost: 2598 // $25.98
        };
      }
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
      console.error('❌ PRINTIFY ORDER ERROR:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: error.config ? {
          url: error.config.url,
          method: error.config.method,
          data: error.config.data
        } : 'No config'
      });
      
      return {
        success: false,
        error: error.message || 'Failed to create order',
        statusCode: error.response?.status,
        apiResponse: error.response?.data
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
   * Get cached availability result or create cache key
   * @param {number} blueprintId 
   * @param {number} printProviderId 
   * @returns {string} Cache key
   */
  getCacheKey(blueprintId, printProviderId) {
    return `${blueprintId}:${printProviderId}`;
  }

  /**
   * Check if cached availability result is still valid
   * @param {Object} cacheEntry - Cached entry with timestamp and result
   * @returns {boolean} True if cache is valid
   */
  isCacheValid(cacheEntry) {
    if (!cacheEntry || !cacheEntry.timestamp) return false;
    return (Date.now() - cacheEntry.timestamp) < this.cacheTimeout;
  }

  /**
   * Validate if a blueprint+provider combination is currently available on Printify
   * @param {number} blueprintId - Blueprint ID to check
   * @param {number} printProviderId - Print provider ID to check
   * @param {boolean} useCache - Whether to use cached results (default: true)
   * @returns {Object} Validation result with availability status
   */
  async validateProductAvailability(blueprintId, printProviderId, useCache = true) {
    const cacheKey = this.getCacheKey(blueprintId, printProviderId);
    
    // Check cache first
    if (useCache && this.availabilityCache.has(cacheKey)) {
      const cacheEntry = this.availabilityCache.get(cacheKey);
      if (this.isCacheValid(cacheEntry)) {
        console.log(`� Using cached availability result for ${cacheKey}`);
        return cacheEntry.result;
      }
    }

    try {
      console.log(`�🔍 Validating availability: Blueprint ${blueprintId} + Provider ${printProviderId}`);
      
      // Step 1: Check if blueprint exists
      const blueprintsResult = await this.getBlueprints();
      if (!blueprintsResult.success) {
        const result = {
          available: false,
          reason: 'Failed to fetch blueprint catalog',
          error: blueprintsResult.error
        };
        this.cacheAvailabilityResult(cacheKey, result);
        return result;
      }
      
      const blueprint = blueprintsResult.blueprints.find(bp => bp.id === blueprintId);
      if (!blueprint) {
        const result = {
          available: false,
          reason: 'Blueprint not found',
          blueprintId
        };
        this.cacheAvailabilityResult(cacheKey, result);
        return result;
      }
      
      // Step 2: Check if print provider exists for this blueprint
      const providersResult = await this.getPrintProviders(blueprintId);
      if (!providersResult.success) {
        const result = {
          available: false,
          reason: 'Failed to fetch print providers',
          error: providersResult.error,
          blueprintId
        };
        this.cacheAvailabilityResult(cacheKey, result);
        return result;
      }
      
      const provider = providersResult.providers.find(p => p.id === printProviderId);
      if (!provider) {
        const result = {
          available: false,
          reason: 'Print provider not available for this blueprint',
          blueprintId,
          printProviderId
        };
        this.cacheAvailabilityResult(cacheKey, result);
        return result;
      }
      
      // Step 3: Check if variants are available
      const variantsResult = await this.getBlueprintVariants(blueprintId, printProviderId);
      if (!variantsResult.success) {
        const result = {
          available: false,
          reason: 'Failed to fetch variants',
          error: variantsResult.error,
          blueprintId,
          printProviderId
        };
        this.cacheAvailabilityResult(cacheKey, result);
        return result;
      }
      
      // CRITICAL FIX: Printify API doesn't return is_enabled field
      // All variants returned by the API are considered available/enabled
      const availableVariants = variantsResult.variants || [];
      if (availableVariants.length === 0) {
        const result = {
          available: false,
          reason: 'No variants available for this blueprint/provider combination',
          blueprintId,
          printProviderId
        };
        this.cacheAvailabilityResult(cacheKey, result);
        return result;
      }
      
      console.log(`✅ Product available: Blueprint ${blueprintId} + Provider ${printProviderId} (${availableVariants.length} variants)`);
      
      const result = {
        available: true,
        blueprint: blueprint,
        provider: provider,
        enabledVariants: availableVariants,
        variantCount: availableVariants.length
      };
      
      this.cacheAvailabilityResult(cacheKey, result);
      return result;
      
    } catch (error) {
      console.error(`❌ Error validating product availability (${blueprintId}+${printProviderId}):`, error);
      const result = {
        available: false,
        reason: 'Validation error',
        error: error.message,
        blueprintId,
        printProviderId
      };
      this.cacheAvailabilityResult(cacheKey, result);
      return result;
    }
  }

  /**
   * Cache availability validation result
   * @param {string} cacheKey 
   * @param {Object} result 
   */
  cacheAvailabilityResult(cacheKey, result) {
    this.availabilityCache.set(cacheKey, {
      result,
      timestamp: Date.now()
    });
  }

  /**
   * Bulk validate multiple products for availability
   * @param {Array} products - Array of {blueprintId, printProviderId} objects
   * @param {Object} options - Validation options
   * @returns {Object} Results with available and unavailable products
   */
  async bulkValidateAvailability(products, options = {}) {
    const { 
      maxConcurrent = 5,  // Limit concurrent requests to avoid rate limits
      includeReasons = false,
      useCache = true
    } = options;
    
    // Check if we have a recent bulk cache
    if (useCache && this.bulkValidationCache && this.bulkCacheTimestamp) {
      const cacheAge = Date.now() - this.bulkCacheTimestamp;
      if (cacheAge < this.bulkCacheTimeout) {
        console.log(`💾 Using cached bulk validation results (${Math.round(cacheAge / 1000)}s old)`);
        return this.bulkValidationCache;
      }
    }
    
    console.log(`🔍 Bulk validating ${products.length} products (max ${maxConcurrent} concurrent)`);
    
    const results = {
      available: [],
      unavailable: [],
      errors: [],
      cached: 0,
      validated: 0
    };
    
    // Process in batches to avoid rate limiting
    for (let i = 0; i < products.length; i += maxConcurrent) {
      const batch = products.slice(i, i + maxConcurrent);
      console.log(`📦 Processing batch ${Math.floor(i / maxConcurrent) + 1}/${Math.ceil(products.length / maxConcurrent)}`);
      
      const batchPromises = batch.map(async (product) => {
        try {
          const validation = await this.validateProductAvailability(
            product.blueprintId, 
            product.printProviderId, 
            useCache
          );
          
          // Track cache usage
          const cacheKey = this.getCacheKey(product.blueprintId, product.printProviderId);
          if (useCache && this.availabilityCache.has(cacheKey)) {
            const cacheEntry = this.availabilityCache.get(cacheKey);
            if (this.isCacheValid(cacheEntry)) {
              results.cached++;
            } else {
              results.validated++;
            }
          } else {
            results.validated++;
          }
          
          if (validation.available) {
            results.available.push({
              ...product,
              validation: includeReasons ? validation : undefined
            });
          } else {
            results.unavailable.push({
              ...product,
              reason: validation.reason,
              validation: includeReasons ? validation : undefined
            });
          }
        } catch (error) {
          console.error(`❌ Batch validation error for ${product.blueprintId}+${product.printProviderId}:`, error);
          results.errors.push({
            ...product,
            error: error.message
          });
        }
      });
      
      await Promise.allSettled(batchPromises);
      
      // Small delay between batches to be respectful to API
      if (i + maxConcurrent < products.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    console.log(`✅ Bulk validation complete: ${results.available.length} available, ${results.unavailable.length} unavailable, ${results.errors.length} errors`);
    console.log(`💾 Cache performance: ${results.cached} cached, ${results.validated} validated`);
    
    // Cache the bulk results
    if (useCache) {
      this.bulkValidationCache = results;
      this.bulkCacheTimestamp = Date.now();
    }
    
    return results;
  }

  /**
   * Clear availability caches (useful for testing or force refresh)
   */
  clearAvailabilityCache() {
    this.availabilityCache.clear();
    this.bulkValidationCache = null;
    this.bulkCacheTimestamp = null;
    console.log('🗑️ Availability cache cleared');
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
      
      return {
        success: true,
        variants: response.data.variants || response.data
      };
      
    } catch (error) {
      console.error(`Error getting blueprint variants (${blueprintId}+${printProviderId}):`, error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to get blueprint variants'
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