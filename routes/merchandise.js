/**
 * Merchandise Store Routes
 * 
 * API routes for custom merchandise creation and ordering
 * integrating user gallery images with Printify print-on-demand
 */

const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const AutoEnhancedPrintifyService = require('../services/auto-enhanced-printify-service');
const MerchandiseDatabase = require('../services/merchandise-database');
const galleryStorage = require('../utils/gallery/storage');
const axios = require('axios');
const { 
  ProductTypes, 
  generateProductName, 
  generateProductDescription, 
  generateProductTags,
  findProductById,
  getAllProducts,
  getProductsByCategory 
} = require('../config/product-types');

// Use the singleton instances of the services.
const merchandiseDB = require('../services/merchandise-database'); 
const printifyService = new AutoEnhancedPrintifyService();

/**
 * Ensure database is ready for operations
 * @param {Object} res - Express response object
 * @returns {boolean} True if database is ready, false if error response sent
 */
function ensureDatabaseReady(res) {
  try {
    // With the singleton, the database is always ready.
    return merchandiseDB.isDatabaseReady();
  } catch (error) {
    console.error('Database availability check failed:', error);
    res.status(503).json({
      success: false,
      error: 'Database service temporarily unavailable',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Service initialization error'
    });
    return false;
  }
}

/**
 * GET /merchandise
 * Render the merchandise store page
 */
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    res.render('merchandise-store', {
      title: 'Custom Merchandise Store',
      pageTitle: 'Custom Merchandise - Create Your Own Products',
      pageDescription: 'Create custom merchandise from your gallery images using our print-on-demand service.',
      user: req.user,
      cdnUrl: process.env.CDN_URL,
      version: `v${Date.now()}`
    });
  } catch (error) {
    console.error('Error rendering merchandise store page:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Unable to load merchandise store',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

/**
 * GET /api/merchandise/enhancement-status
 * Check if AI enhancement is available and configured
 */
router.get('/enhancement-status', (req, res) => {
  try {
    const status = printifyService.getEnhancementStatus();
    res.json({
      success: true,
      enhancement: status
    });
  } catch (error) {
    console.error('Error checking enhancement status:', error);
    res.json({
      success: true,
      enhancement: {
        available: false,
        services: { sharp: true },
        recommendation: 'Basic upscaling only',
        error: error.message
      }
    });
  }
});

/**
 * GET /api/merchandise/gallery-images
 * Get user's gallery images suitable for merchandise
 */
router.get('/gallery-images', ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.user.uid;
    const images = await galleryStorage.listUserGalleryImages(userId);
    
    // Filter and format images for merchandise use
    const merchandiseImages = images.map(image => ({
      id: image.relativePath,
      url: image.url,
      thumbnailUrl: image.url,
      title: image.originalName || image.fileName,
      size: image.size,
      dimensions: image.dimensions,
      uploadedAt: image.uploadedAt || image.lastModified,
      suitableForPrint: image.size > 1000000 // Basic size check (>1MB likely good quality)
    }));
    
    res.json({
      success: true,
      images: merchandiseImages
    });
    
  } catch (error) {
    console.error('Error fetching gallery images for merchandise:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch gallery images'
    });
  }
});

/**
 * GET /api/merchandise/product-types
 * Get available product types for guided creation (public endpoint)
 */
router.get('/product-types', async (req, res) => {
  try {
    res.json({
      success: true,
      productTypes: ProductTypes,
      allProducts: getAllProducts()
    });
  } catch (error) {
    console.error('Error fetching product types:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product types'
    });
  }
});

/**
 * GET /api/merchandise/product-types/:category
 * Get products by category (public endpoint)
 */
router.get('/product-types/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const products = getProductsByCategory(category);
    
    if (!products.length && !ProductTypes[category]) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }
    
    res.json({
      success: true,
      category: ProductTypes[category],
      products: products
    });
  } catch (error) {
    console.error('Error fetching products by category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products by category'
    });
  }
});

/**
 * POST /api/merchandise/create-guided-product
 * Create a product using guided selection (no user naming required)
 */
router.post('/create-guided-product', ensureAuthenticated, async (req, res) => {
  try {
    // Ensure database is ready
    if (!ensureDatabaseReady(res)) {
      return; // Error response already sent
    }
    
    const userId = req.user.uid;
    const { imageId, productType, imageContext = {} } = req.body;
    
    if (!imageId || !productType) {
      return res.status(400).json({
        success: false,
        error: 'Image ID and product type are required'
      });
    }
    
    // Find the product configuration
    const productConfig = findProductById(productType);
    if (!productConfig) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product type'
      });
    }
    
    // Verify the image belongs to the user
    const userImages = await galleryStorage.listUserGalleryImages(userId);
    const selectedImage = userImages.find(img => img.relativePath === imageId);
    
    if (!selectedImage) {
      return res.status(403).json({
        success: false,
        error: 'Image not found in your gallery'
      });
    }
    
    // Generate product details automatically
    const productName = generateProductName(productType, {
      ...imageContext,
      imageTitle: selectedImage.originalName
    });
    
    const productDescription = generateProductDescription(productType, {
      ...imageContext,
      imageTitle: selectedImage.originalName
    });
    
    const productTags = generateProductTags(productType, imageContext);
    
    // Download image from S3 for processing with auto-enhancement
    const imageBuffer = await downloadImageFromS3(selectedImage.url);
    if (!imageBuffer) {
      return res.status(400).json({
        success: false,
        error: 'Failed to process image'
      });
    }
    
    console.log('🎯 Creating guided product with auto-enhancement:', productType);
    
    // Create product with auto-enhancement
    const productResult = await printifyService.createCustomProductWithBlueprintAndAutoEnhancement(
      imageBuffer,
      selectedImage.fileName,
      {
        title: productName,
        description: productDescription,
        tags: productTags,
        blueprintId: productConfig.blueprintId,
        printProviderId: productConfig.printProviderId,
        basePrice: productConfig.basePrice,
        userId: userId,
        originalImageId: imageId
      }
    );
    
    if (!productResult.success) {
      return res.status(400).json({
        success: false,
        error: productResult.error
      });
    }
    
    // Store product association with user
    await merchandiseDB.storeUserProduct(userId, {
      productId: productResult.productId,
      imageId: selectedImage.relativePath,
      printifyImageId: productResult.uploadedImage?.id,
      title: productName,
      description: productDescription,
      productType: productType,
      productConfig: productConfig,
      sourceImage: {
        id: selectedImage.relativePath,
        title: selectedImage.originalName,
        url: selectedImage.url
      },
      // Add enhancement info
      enhancement: {
        autoEnhanced: productResult.imageEnhancement?.autoEnhanced || false,
        enhancementSource: productResult.imageEnhancement?.enhancementSource || 'none',
        originalSuitable: productResult.imageEnhancement?.originalImageSuitable
      },
      generatedAt: new Date().toISOString()
    });
    
    // Prepare response message with enhancement info
    let successMessage = `${productConfig.name} created successfully!`;
    if (productResult.imageEnhancement?.autoEnhanced) {
      successMessage += ` Image was automatically enhanced for better print quality.`;
    }
    
    res.json({
      success: true,
      product: {
        id: productResult.productId,
        title: productName,
        description: productDescription,
        tags: productTags,
        productType: productType,
        sourceImage: selectedImage,
        variants: productResult.variants,
        images: productResult.images
      },
      enhancement: {
        autoEnhanced: productResult.imageEnhancement?.autoEnhanced || false,
        enhancementSource: productResult.imageEnhancement?.enhancementSource || 'none',
        qualityImproved: productResult.imageEnhancement?.autoEnhanced && !productResult.imageEnhancement?.originalImageSuitable
      },
      message: successMessage
    });
    
  } catch (error) {
    console.error('Error creating guided product:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create product'
    });
  }
});

/**
 * POST /api/merchandise/create-product
 * Create a custom product from a gallery image with automatic AI enhancement
 */
router.post('/create-product', ensureAuthenticated, async (req, res) => {
  try {
    // Ensure database is ready
    if (!ensureDatabaseReady(res)) {
      return; // Error response already sent
    }
    
    const userId = req.user.uid;
    const { imageId, productOptions = {} } = req.body;
    
    if (!imageId) {
      return res.status(400).json({
        success: false,
        error: 'Image ID is required'
      });
    }
    
    // Verify the image belongs to the user
    const userImages = await galleryStorage.listUserGalleryImages(userId);
    const selectedImage = userImages.find(img => img.relativePath === imageId);
    
    if (!selectedImage) {
      return res.status(403).json({
        success: false,
        error: 'Image not found in your gallery'
      });
    }
    
    // Download image from S3 for processing
    const imageBuffer = await downloadImageFromS3(selectedImage.url);
    if (!imageBuffer) {
      return res.status(400).json({
        success: false,
        error: 'Failed to process image'
      });
    }
    
    console.log('🎯 Creating merchandise with auto-enhancement for image:', selectedImage.originalName);
    
    // Create product with auto-enhancement
    const productResult = await printifyService.createCustomProductWithAutoEnhancement(
      imageBuffer,
      selectedImage.fileName,
      {
        title: productOptions.title || `Custom ${selectedImage.originalName} T-Shirt`,
        description: productOptions.description || `Premium custom t-shirt featuring "${selectedImage.originalName}" from your Wavelength Lore collection`,
        tags: ['wavelength', 'custom', 'gallery', ...(productOptions.tags || [])],
        userId: userId,
        originalImageId: imageId
      }
    );
    
    if (!productResult.success) {
      return res.status(400).json({
        success: false,
        error: productResult.error
      });
    }
    
    // Store product association with user
    await merchandiseDB.storeUserProduct(userId, {
      productId: productResult.productId,
      imageId: selectedImage.relativePath,
      printifyImageId: productResult.uploadedImage?.id,
      title: productResult.title,
      sourceImage: {
        id: selectedImage.relativePath,
        title: selectedImage.originalName,
        url: selectedImage.url
      },
      // Add enhancement info
      enhancement: {
        autoEnhanced: productResult.imageEnhancement?.autoEnhanced || false,
        enhancementSource: productResult.imageEnhancement?.enhancementSource || 'none',
        originalSuitable: productResult.imageEnhancement?.originalImageSuitable
      }
    });
    
    // Prepare response message with enhancement info
    let successMessage = 'Custom product created successfully!';
    if (productResult.imageEnhancement?.autoEnhanced) {
      successMessage += ' Image was automatically enhanced for better print quality.';
    }
    
    res.json({
      success: true,
      product: {
        id: productResult.productId,
        title: productResult.title,
        description: productResult.description,
        variants: productResult.variants,
        images: productResult.images,
        sourceImage: {
          id: selectedImage.relativePath,
          title: selectedImage.originalName,
          url: selectedImage.url
        }
      },
      enhancement: {
        autoEnhanced: productResult.imageEnhancement?.autoEnhanced || false,
        enhancementSource: productResult.imageEnhancement?.enhancementSource || 'none',
        qualityImproved: productResult.imageEnhancement?.autoEnhanced && !productResult.imageEnhancement?.originalImageSuitable
      },
      message: successMessage
    });
    
  } catch (error) {
    console.error('Error creating custom product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create custom product'
    });
  }
});

/**
 * GET /api/merchandise/products
 * Get user's created products
 */
router.get('/products', ensureAuthenticated, async (req, res) => {
  try {
    // Ensure database is ready
    if (!ensureDatabaseReady(res)) {
      return; // Error response already sent
    }
    
    const userId = req.user.uid;
    const userProducts = await merchandiseDB.getUserProducts(userId);
    
    res.json({
      success: true,
      products: userProducts
    });
    
  } catch (error) {
    console.error('Error fetching user products:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products'
    });
  }
});

/**
 * GET /api/merchandise/product/:productId
 * Get detailed product information including pricing
 */
router.get('/product/:productId', ensureAuthenticated, async (req, res) => {
  try {
    // Ensure database is ready
    if (!ensureDatabaseReady(res)) {
      return; // Error response already sent
    }
    
    const userId = req.user.uid;
    const { productId } = req.params;
    
    // Verify product belongs to user
    const userProduct = await merchandiseDB.getUserProduct(userId, productId);
    
    if (!userProduct) {
      return res.status(403).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    // Get current product details from Printify
    const productResult = await printifyService.getProduct(productId);
    
    if (!productResult.success) {
      return res.status(400).json({
        success: false,
        error: productResult.error
      });
    }
    
    res.json({
      success: true,
      product: {
        ...productResult.product,
        sourceImage: userProduct.sourceImage
      }
    });
    
  } catch (error) {
    console.error('Error fetching product details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product details'
    });
  }
});

/**
 * POST /api/merchandise/calculate-shipping
 * Calculate shipping costs for an order
 */
router.post('/calculate-shipping', ensureAuthenticated, async (req, res) => {
  try {
    const { lineItems, shippingAddress } = req.body;
    
    if (!lineItems || !shippingAddress) {
      return res.status(400).json({
        success: false,
        error: 'Line items and shipping address are required'
      });
    }
    
    const shippingResult = await printifyService.calculateShipping(lineItems, shippingAddress);
    
    if (!shippingResult.success) {
      return res.status(400).json({
        success: false,
        error: shippingResult.error
      });
    }
    
    res.json({
      success: true,
      shipping: shippingResult
    });
    
  } catch (error) {
    console.error('Error calculating shipping:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate shipping'
    });
  }
});

/**
 * POST /api/merchandise/create-order
 * Create an order for custom merchandise
 */
router.post('/create-order', ensureAuthenticated, async (req, res) => {
  try {
    // Ensure database is ready
    if (!ensureDatabaseReady(res)) {
      return; // Error response already sent
    }
    
    const userId = req.user.uid;
    const { lineItems, shippingAddress, paymentToken, orderOptions = {} } = req.body;
    
    if (!lineItems || !shippingAddress) {
      return res.status(400).json({
        success: false,
        error: 'Line items and shipping address are required'
      });
    }
    
    // Verify all products belong to the user
    const userProducts = await merchandiseDB.getUserProducts(userId);
    const userProductIds = userProducts.map(p => p.productId);
    
    for (const item of lineItems) {
      if (!userProductIds.includes(item.product_id)) {
        return res.status(403).json({
          success: false,
          error: 'One or more products do not belong to your account'
        });
      }
    }
    
    // Process payment (integrate with existing payment system)
    const paymentResult = await processPayment(paymentToken, lineItems, shippingAddress);
    if (!paymentResult.success) {
      return res.status(400).json({
        success: false,
        error: paymentResult.error
      });
    }
    
    // Create order with Printify
    const orderResult = await printifyService.createOrder(
      lineItems,
      shippingAddress,
      {
        ...orderOptions,
        externalId: `WL_${userId}_${Date.now()}`
      }
    );
    
    if (!orderResult.success) {
      // Refund payment if order creation fails
      await refundPayment(paymentResult.paymentId);
      
      return res.status(400).json({
        success: false,
        error: orderResult.error
      });
    }
    
    // Store order information
    await merchandiseDB.storeUserOrder(userId, {
      orderId: orderResult.orderId,
      paymentId: paymentResult.paymentId,
      lineItems,
      shippingAddress,
      total: orderResult.totalCost,
      status: orderResult.status
    });
    
    res.json({
      success: true,
      order: {
        id: orderResult.orderId,
        status: orderResult.status,
        total: orderResult.totalCost,
        lineItems: orderResult.lineItems,
        shippingCost: orderResult.shippingCost
      }
    });
    
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create order'
    });
  }
});

/**
 * GET /api/merchandise/orders
 * Get user's orders
 */
router.get('/orders', ensureAuthenticated, async (req, res) => {
  try {
    // Ensure database is ready
    if (!ensureDatabaseReady(res)) {
      return; // Error response already sent
    }
    
    const userId = req.user.uid;
    const userOrders = await merchandiseDB.getUserOrders(userId);
    
    res.json({
      success: true,
      orders: userOrders
    });
    
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders'
    });
  }
});

/**
 * GET /api/merchandise/order/:orderId
 * Get detailed order information and tracking
 */
router.get('/order/:orderId', ensureAuthenticated, async (req, res) => {
  try {
    // Ensure database is ready
    if (!ensureDatabaseReady(res)) {
      return; // Error response already sent
    }
    
    const userId = req.user.uid;
    const { orderId } = req.params;
    
    // Verify order belongs to user
    const userOrder = await merchandiseDB.getUserOrder(userId, orderId);
    
    if (!userOrder) {
      return res.status(403).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    // Get current order status from Printify
    const orderResult = await printifyService.getOrderStatus(orderId);
    
    if (!orderResult.success) {
      return res.status(400).json({
        success: false,
        error: orderResult.error
      });
    }
    
    res.json({
      success: true,
      order: {
        ...orderResult.order,
        localData: userOrder
      }
    });
    
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order details'
    });
  }
});

/**
 * POST /api/merchandise/webhook
 * Webhook endpoint for Printify order updates
 */
router.post('/webhook', async (req, res) => {
  try {
    const { type, data } = req.body;
    
    console.log(`📦 Printify webhook received: ${type}`, data);
    
    // Update order status in our database
    if (type === 'order:updated') {
      await merchandiseDB.updateOrderStatus(data.id, data);
    }
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('Error handling Printify webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process webhook'
    });
  }
});

// Helper functions

/**
 * Download image from S3 URL
 */
async function downloadImageFromS3(imageUrl) {
  try {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    return Buffer.from(response.data);
  } catch (error) {
    console.error('Error downloading image from S3:', error);
    return null;
  }
}

/**
 * Process payment (integrate with your payment system)
 */
async function processPayment(paymentToken, lineItems, shippingAddress) {
  // TODO: Integrate with Stripe, PayPal, or your payment processor
  console.log('Processing payment:', { paymentToken, lineItems, shippingAddress });
  
  // Mock successful payment for development
  return {
    success: true,
    paymentId: `pay_${Date.now()}`,
    amount: 2099 // $20.99 in cents
  };
}

/**
 * POST /api/merchandise/preview-enhancement
 * Preview AI enhancement for an image before creating products
 */
router.post('/preview-enhancement', ensureAuthenticated, async (req, res) => {
  try {
    // Ensure database is ready
    if (!ensureDatabaseReady(res)) {
      return; // Error response already sent
    }
    
    const userId = req.user.uid;
    const { imageId } = req.body;
    
    if (!imageId) {
      return res.status(400).json({
        success: false,
        error: 'Image ID is required'
      });
    }
    
    // Get all user gallery images and find the one we need
    const images = await galleryStorage.listUserGalleryImages(userId);
    const selectedImage = images.find(img => img.relativePath === imageId);
    
    if (!selectedImage) {
      return res.status(404).json({
        success: false,
        error: 'Image not found'
      });
    }
    
    // Download the image buffer from the URL
    const imageBuffer = await downloadImageBuffer(selectedImage.url);
    if (!imageBuffer) {
      return res.status(404).json({
        success: false,
        error: 'Unable to load image data'
      });
    }
    
    // Generate enhancement preview
    const startTime = Date.now();
    const enhancementResult = await printifyService.previewImageEnhancement(
      imageBuffer,
      selectedImage.fileName || selectedImage.originalName
    );
    
    if (!enhancementResult.success) {
      return res.status(400).json({
        success: false,
        error: enhancementResult.error || 'Enhancement preview failed'
      });
    }

    const processingTime = Date.now() - startTime;
    
    // Automatically store the enhanced image association for future use
    // Only store if this is a real enhancement (not just original image)
    if (!enhancementResult.originalImageSuitable && enhancementResult.enhancedImageUrl) {
      try {
        const enhancementData = {
          enhancedImageUrl: enhancementResult.enhancedImageUrl,
          enhancementMethod: enhancementResult.enhancementMethod || 'AI Upscaling',
          originalDimensions: enhancementResult.originalDimensions,
          enhancedDimensions: enhancementResult.enhancedDimensions,
          scaleFactor: Math.round((enhancementResult.enhancedDimensions.width / enhancementResult.originalDimensions.width) * 10) / 10,
          improvementDescription: enhancementResult.improvementDescription || 'Image resolution and quality enhanced'
        };
        
        const sanitizedImageId = _sanitizeFirebaseKey(imageId);
        const storeResult = await merchandiseDatabase.storeEnhancedImage(sanitizedImageId, enhancementData);
        if (storeResult.success) {
          console.log(`✅ Automatically stored enhanced image for ${imageId}`);
        } else {
          console.warn(`⚠️ Failed to store enhanced image association: ${storeResult.error}`);
        }
      } catch (storeError) {
        console.error('Error storing enhanced image association:', storeError);
        // Don't fail the whole request if storing fails
      }
    }
    
    res.json({
      success: true,
      original: {
        id: imageId,
        url: selectedImage.url,
        width: enhancementResult.originalDimensions.width,
        height: enhancementResult.originalDimensions.height,
        suitableForPrint: enhancementResult.originalImageSuitable
      },
      enhanced: {
        url: enhancementResult.enhancedImageUrl,
        width: enhancementResult.enhancedDimensions.width,
        height: enhancementResult.enhancedDimensions.height
      },
      analysis: {
        method: enhancementResult.enhancementMethod || 'AI Upscaling',
        scaleFactor: Math.round((enhancementResult.enhancedDimensions.width / enhancementResult.originalDimensions.width) * 10) / 10,
        improvementDescription: enhancementResult.improvementDescription || 'Image resolution and quality enhanced',
        processingTime: processingTime
      }
    });
    
  } catch (error) {
    console.error('Error previewing enhancement:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to preview enhancement'
    });
  }
});

/**
 * POST /api/merchandise/check-enhancement-status
 * Check if an image has a cached enhanced version
 */
router.post('/check-enhancement-status', ensureAuthenticated, async (req, res) => {
  try {
    // Ensure database is ready
    if (!ensureDatabaseReady(res)) {
      return; // Error response already sent
    }
    
    const { imageId } = req.body;
    
    if (!imageId) {
      return res.status(400).json({
        success: false,
        error: 'Image ID is required'
      });
    }
    
    // Check if enhanced version exists in database
    const hasEnhanced = await merchandiseDatabase.hasEnhancedVersion(imageId);
    
    res.json({
      success: true,
      hasEnhancedVersion: hasEnhanced,
      imageId: imageId
    });
    
  } catch (error) {
    console.error('Error checking enhancement status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check enhancement status'
    });
  }
});

/**
 * Helper function to download image buffer from URL
 * @param {string} imageUrl - The image URL to download
 * @returns {Buffer} Image buffer
 */
async function downloadImageBuffer(imageUrl) {
  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 30000 // 30 second timeout
    });
    return Buffer.from(response.data);
  } catch (error) {
    console.error('Error downloading image buffer:', error);
    throw new Error('Failed to download image from URL');
  }
}

/**
 * Sanitizes a string to be used as a valid Firebase Realtime Database key.
 * This is a local copy to avoid dependency issues and ensure routes are self-contained.
 * Replaces illegal characters ('.', '#', '$', '[', ']', '/') with an underscore.
 * @param {string} key - The string to sanitize.
 * @returns {string} A valid Firebase key.
 */
function _sanitizeFirebaseKey(key) {
  return key.replace(/[.#$\[\]\/]/g, '_');
}
/**
 * Refund payment (integrate with your payment system)
 */
async function refundPayment(paymentId) {
  // TODO: Implement refund logic with your payment processor
  console.log('Refunding payment:', paymentId);
}

module.exports = router;