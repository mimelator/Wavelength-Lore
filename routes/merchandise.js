/**
 * Merchandise Store Routes
 * 
 * API routes for custom merchandise creation and ordering
 * integrating user gallery images with Printify print-on-demand
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const { ensureAuthenticated } = require('../middleware/auth');
const groupAuth = require('../middleware/groupAuth');
const AutoEnhancedPrintifyService = require('../services/auto-enhanced-printify-service');
const MerchandiseDatabase = require('../services/merchandise-database');
const galleryStorage = require('../utils/gallery/storage');
const { getUserBookmarks } = require('../services/firebase/galleryService');
const axios = require('axios');
const { generateProductTitle, prettifyImageName } = require('../utils/product-name-formatter');
const ImageOptimizer = require('../services/ImageOptimizer');
const productSpecifications = require('../config/productSpecifications');
const productTemplates = require('../config/productTemplates');
const {
  ProductTypes,
  generateProductName,
  generateProductDescription,
  generateProductTags,
  findProductById,
  getAllProducts,
} = require('../config/product-types');

// Helper function to sanitize Firebase keys
function sanitizeFirebaseKey(key) {
  if (!key) return 'unknown';
  return key
    .replace(/[.#$\/\[\]]/g, '_')  // Replace invalid Firebase characters
    .replace(/_{2,}/g, '_')        // Replace multiple underscores with single
    .replace(/^_|_$/g, '');        // Remove leading/trailing underscores
}

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
 * Render the merchandise store page (VIP access required - same as games)
 */
router.get('/', ensureAuthenticated, groupAuth.requireAction('game_access'), async (req, res) => {
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
 * GET /merchandise/test-harness
 * Render the PERFECT PRINTING test harness UI
 */
router.get('/test-harness', ensureAuthenticated, groupAuth.requireAction('game_access'), async (req, res) => {
  try {
    res.render('test-harness', {
      title: 'PERFECT PRINTING Test Harness',
      pageTitle: 'Test Harness',
      pageDescription: 'Test the image optimization and product creation pipeline',
      user: req.user,
      cdnUrl: process.env.CDN_URL,
      version: `v${Date.now()}`
    });
  } catch (error) {
    console.error('Error rendering test harness:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Unable to load test harness',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

/**
 * GET /merchandise/debug
 * Debug page for testing merchandise store (development only)
 */
router.get('/debug', async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).json({ error: 'Not found' });
  }

  try {
    res.sendFile(require('path').join(__dirname, '../debug/test-merchandise-simple.html'));
  } catch (error) {
    console.error('Error serving debug page:', error);
    res.status(500).json({ error: 'Failed to load debug page' });
  }
});

/**
 * GET /merchandise/cache-admin
 * Cache administration dashboard (standalone)
 * Shows analytics, metrics, and cache management controls
 */
router.get('/cache-admin', (req, res) => {
  try {
    res.sendFile(require('path').join(__dirname, '../static/html/cache-admin-dashboard.html'));
  } catch (error) {
    console.error('Error serving cache admin dashboard:', error);
    res.status(500).json({ error: 'Failed to load cache admin dashboard' });
  }
});

/**
 * GET /admin/merchandise/perfect-printing-cache
 * Cache administration dashboard integrated into admin panel
 * Shows analytics, metrics, and cache management controls with admin styling
 */
router.get('/admin/merchandise/perfect-printing-cache', ensureAuthenticated, groupAuth.requireAction('admin'), async (req, res) => {
  try {
    console.log('🎨 Loading PERFECT PRINTING cache dashboard for admin...');

    res.render('admin/perfect-printing-cache', {
      title: 'PERFECT PRINTING - Cache Analytics',
      user: req.user,
      adminView: true
    });

  } catch (error) {
    console.error('Error loading PERFECT PRINTING cache dashboard:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load cache dashboard',
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
 * Get user's gallery images suitable for merchandise (includes both uploaded and bookmarked)
 */
router.get('/gallery-images', ensureAuthenticated, groupAuth.requireAction('game_access'), async (req, res) => {
  try {
    const userId = req.user.uid;
    
    // Get both S3 uploaded images AND Firebase bookmarks
    const s3Images = await galleryStorage.listUserGalleryImages(userId);
    const { getUserBookmarks } = require('../services/firebase/galleryService');
    const bookmarks = await getUserBookmarks(userId);
    
    // Format S3 images for merchandise
    const merchandiseS3Images = s3Images.map(image => ({
      id: image.relativePath,
      url: image.url,
      thumbnailUrl: image.url,
      title: image.originalName || image.fileName,
      size: image.size,
      dimensions: image.dimensions,
      uploadedAt: image.uploadedAt || image.lastModified,
      suitableForPrint: image.size > 1000000, // Basic size check (>1MB likely good quality)
      type: 'uploaded',
      relativePath: image.relativePath
    }));
    
    // Format bookmarks for merchandise
    const merchandiseBookmarks = bookmarks.map(bookmark => ({
      id: bookmark.bookmarkId,
      url: bookmark.url,
      thumbnailUrl: bookmark.url,
      title: bookmark.title || bookmark.fileName,
      size: 0, // Bookmarks don't track size
      dimensions: null, // Unknown for bookmarks
      uploadedAt: bookmark.savedAt,
      suitableForPrint: true, // Content images are assumed to be suitable
      type: 'bookmark',
      relativePath: null,
      bookmarkId: bookmark.bookmarkId
    }));
    
    // Combine both types
    const merchandiseImages = [...merchandiseS3Images, ...merchandiseBookmarks];
    
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
 * GET /api/merchandise/categories
 * Get product categories (public endpoint)
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = Object.keys(ProductTypes).map(key => ({
      id: key,
      name: ProductTypes[key].name,
      icon: ProductTypes[key].icon,
      description: ProductTypes[key].description,
      productCount: ProductTypes[key].products.length
    }));
    
    res.json({
      success: true,
      categories: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories'
    });
  }
});

/**
 * GET /api/merchandise/product-types
 * Get available product types for guided creation (public endpoint)
 */
router.get('/product-types', async (req, res) => {
  try {
    // Keep it simple - return the same structure that admin catalog expects
    res.json({
      success: true,
      allProducts: getAllProducts() // Both admin and merchandise store use this
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
router.post('/create-guided-product', ensureAuthenticated, groupAuth.requireAction('game_access'), async (req, res) => {
  try {
    // Ensure database is ready
    if (!ensureDatabaseReady(res)) {
      return; // Error response already sent
    }
    
    const userId = req.user.uid;
    const { imageId, imageUrl, imageTitle, productType, imageContext = {} } = req.body;
    
    if (!imageId || !imageUrl || !productType) {
      return res.status(400).json({
        success: false,
        error: 'Image ID, URL, and product type are required'
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
    
    // Generate product details automatically
    const productName = generateProductName(productType, {
      ...imageContext,
      imageTitle: imageTitle || imageId
    });
    
    const productDescription = generateProductDescription(productType, {
      ...imageContext,
      imageTitle: imageTitle || imageId
    });
    
    const productTags = generateProductTags(productType, imageContext);
    
    // Download image from URL for processing with auto-enhancement
    const imageBuffer = await downloadImageFromS3(imageUrl);
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
      imageTitle || imageId,
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
    
    // Store product association with user INCLUDING variants and images
    await merchandiseDB.storeUserProduct(userId, {
      productId: productResult.productId,
      imageId: sanitizeFirebaseKey(imageId),
      printifyImageId: productResult.uploadedImage?.id,
      title: productName,
      description: productDescription,
      productType: productType,
      productConfig: productConfig,
      sourceImage: {
        id: sanitizeFirebaseKey(imageId),
        title: imageTitle || imageId,
        url: imageUrl
      },
      // CRITICAL FIX: Store variants and images to prevent "broken" products
      variants: productResult.variants || [],
      images: productResult.images || [],
      // Add enhancement info
      enhancement: {
        autoEnhanced: productResult.imageEnhancement?.autoEnhanced || false,
        enhancementSource: productResult.imageEnhancement?.enhancementSource || 'none',
        originalSuitable: productResult.imageEnhancement?.originalImageSuitable || false
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
        sourceImage: { id: imageId, title: imageTitle, url: imageUrl },
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
    
    // Enhanced error logging for debugging
    if (error.response) {
      console.error('API Response Error:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });
    }
    
    // Return more specific error information
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        'Failed to create product';
    
    res.status(500).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? {
        originalError: error.message,
        apiStatus: error.response?.status,
        apiData: error.response?.data
      } : undefined
    });
  }
});

/**
 * POST /api/merchandise/create-product
 * Create a custom product from a gallery image with automatic AI enhancement
 */
router.post('/create-product', ensureAuthenticated, groupAuth.requireAction('game_access'), async (req, res) => {
  try {
    // Ensure database is ready
    if (!ensureDatabaseReady(res)) {
      return; // Error response already sent
    }
    
    const userId = req.user.uid;
    const { imageId, imageUrl, imageTitle, productOptions = {} } = req.body;
    
    console.log('🎯 CREATE PRODUCT REQUEST:', {
      userId,
      imageId,
      imageUrl,
      imageTitle,
      productOptions
    });
    
    if (!imageId || !imageUrl) {
      return res.status(400).json({
        success: false,
        error: 'Image ID and URL are required'
      });
    }
    
    // DEVELOPMENT BYPASS: If Printify is not properly configured, return mock success
    if (process.env.PRINTIFY_MOCK_MODE === 'true') {
      console.log('🔧 MOCK MODE: Simulating successful product creation');
      
      const mockProductId = `mock_${Date.now()}`;
      const mockProduct = {
        id: mockProductId,
        title: `Custom ${imageTitle || 'Product'}`,
        description: `Mock product created from ${imageTitle || imageId}`,
        variants: [
          { id: 'mock_variant_1', title: 'M / Black', price: 2099 },
          { id: 'mock_variant_2', title: 'L / Black', price: 2099 }
        ],
        images: [{ src: imageUrl }],
        sourceImage: { id: imageId, title: imageTitle, url: imageUrl }
      };
      
      // CRITICAL FIX: Store mock product in database to prevent "broken" products
      await merchandiseDB.storeUserProduct(userId, {
        productId: mockProductId,
        imageId: sanitizeFirebaseKey(imageId),
        printifyImageId: null,
        title: mockProduct.title,
        sourceImage: {
          id: sanitizeFirebaseKey(imageId),
          title: imageTitle || imageId,
          url: imageUrl
        },
        variants: mockProduct.variants,
        images: mockProduct.images,
        enhancement: {
          autoEnhanced: false,
          enhancementSource: 'mock',
          originalSuitable: true
        },
        generatedAt: new Date().toISOString()
      });
      
      return res.json({
        success: true,
        product: mockProduct,
        enhancement: {
          autoEnhanced: false,
          enhancementSource: 'mock',
          qualityImproved: false
        },
        message: 'Mock product created successfully! (Development mode)'
      });
    }
    
    // Download image from URL for processing
    console.log('📥 Downloading image from:', imageUrl);
    const imageBuffer = await downloadImageFromS3(imageUrl);
    if (!imageBuffer) {
      console.error('❌ Failed to download image buffer');
      return res.status(400).json({
        success: false,
        error: 'Failed to process image'
      });
    }
    
    console.log('✅ Image downloaded successfully, size:', imageBuffer.length, 'bytes');
    console.log('🎯 Creating merchandise with auto-enhancement for image:', imageTitle || imageId);
    
    // Create product with auto-enhancement
    const productResult = await printifyService.createCustomProductWithAutoEnhancement(
      imageBuffer,
      imageTitle || imageId,
      {
        title: generateProductTitle(imageTitle || imageId, 'T-Shirt'),
        description: `Premium custom t-shirt featuring "${prettifyImageName(imageTitle || imageId)}" from your Wavelength Lore collection`,
        tags: ['wavelength', 'custom', 'gallery', ...(productOptions.tags || [])],
        userId: userId,
        originalImageId: imageId
      }
    );
    
    console.log('🔍 Product creation result:', {
      success: productResult.success,
      error: productResult.error,
      hasProductId: !!productResult.productId
    });
    
    if (!productResult.success) {
      return res.status(400).json({
        success: false,
        error: productResult.error
      });
    }
    
    // Store product association with user INCLUDING variants and images
    await merchandiseDB.storeUserProduct(userId, {
      productId: productResult.productId,
      imageId: sanitizeFirebaseKey(imageId),
      printifyImageId: productResult.uploadedImage?.id,
      title: productResult.title,
      sourceImage: {
        id: sanitizeFirebaseKey(imageId),
        title: imageTitle || imageId,
        url: imageUrl
      },
      // CRITICAL FIX: Store variants and images to prevent "broken" products
      variants: productResult.variants || [],
      images: productResult.images || [],
      // Add enhancement info
      enhancement: {
        autoEnhanced: productResult.imageEnhancement?.autoEnhanced || false,
        enhancementSource: productResult.imageEnhancement?.enhancementSource || 'none',
        originalSuitable: productResult.imageEnhancement?.originalImageSuitable || false
      },
      generatedAt: new Date().toISOString()
    });
    
    res.json({
      success: true,
      product: {
        id: productResult.productId,
        title: productResult.title,
        description: productResult.description,
        variants: productResult.variants,
        images: productResult.images,
        sourceImage: {
          id: sanitizeFirebaseKey(imageId),
          title: imageTitle || imageId,
          url: imageUrl
        }
      },
      enhancement: {
        autoEnhanced: productResult.imageEnhancement?.autoEnhanced || false,
        enhancementSource: productResult.imageEnhancement?.enhancementSource || 'none',
        qualityImproved: productResult.imageEnhancement?.autoEnhanced && !productResult.imageEnhancement?.originalImageSuitable
      }
    });
    
  } catch (error) {
    console.error('Error creating custom product:', error);
    
    // Enhanced error logging for debugging
    if (error.response) {
      console.error('API Response Error:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });
    }
    
    // Return more specific error information
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        'Failed to create custom product';
    
    res.status(500).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? {
        originalError: error.message,
        apiStatus: error.response?.status,
        apiData: error.response?.data
      } : undefined
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
 * DELETE /api/merchandise/products/:productId
 * Delete a user's product
 */
router.delete('/products/:productId', ensureAuthenticated, async (req, res) => {
  try {
    if (!ensureDatabaseReady(res)) {
      return;
    }
    
    const userId = req.user.uid;
    const { productId } = req.params;
    
    console.log(`🗑️ DELETE REQUEST: User product ${productId} for user ${userId}`);
    
    // 1. Verify product belongs to user
    const userProducts = await merchandiseDB.getUserProducts(userId);
    const userProduct = userProducts.find(p => (p.id || p.productId) === productId);
    
    if (!userProduct) {
      console.log(`   ❌ Product not found in user collection`);
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    console.log(`   ✅ Confirmed: ${productId} belongs to user ${userId}`);
    
    // 2. Delete from Printify (if not mock mode)
    if (process.env.PRINTIFY_MOCK_MODE !== 'true') {
      try {
        console.log(`   🗑️ Deleting from Printify...`);
        await printifyService.deleteProduct(productId);
        console.log(`   ✅ Deleted from Printify`);
      } catch (printifyError) {
        console.error(`   ⚠️  Printify deletion failed:`, printifyError.message);
        // Continue with database deletion even if Printify fails
      }
    } else {
      console.log(`   🔧 Mock mode: Skipping Printify deletion`);
    }
    
    // 3. Delete from user products database
    console.log(`   🗑️ Deleting from user products database...`);
    const dbResult = await merchandiseDB.deleteUserProduct(userId, productId);
    
    if (!dbResult) {
      console.log(`   ⚠️  Database deletion failed`);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete product from database'
      });
    }
    
    console.log(`   ✅ Deleted from user products database`);
    console.log(`   ✅ DELETE COMPLETE: ${productId}`);
    
    res.json({
      success: true,
      message: 'Product deleted successfully',
      productId: productId
    });
    
  } catch (error) {
    console.error('Error deleting user product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete product',
      details: error.message
    });
  }
});

/**
 * GET /api/merchandise/vendor-preview/:productId
 * Get vendor preview product details (public endpoint)
 */
router.get('/vendor-preview/:productId', async (req, res) => {
  try {
    // Ensure database is ready
    if (!ensureDatabaseReady(res)) {
      return; // Error response already sent
    }
    
    const { productId } = req.params;
    
    // Use VendorPreviewHelper to lookup vendor preview only
    console.log(`🔍 VENDOR PREVIEW: Looking for vendor preview ${productId}`);
    const VendorPreviewHelper = require('../utils/vendor-preview-helper');
    const previewHelper = new VendorPreviewHelper();
    
    // Only check vendor previews (no user context needed)
    const lookupResult = await previewHelper.getProductByIdWithFallback(productId, null);
    
    if (!lookupResult.found || !lookupResult.isVendorPreview) {
      console.log(`   ❌ RESULT: Vendor preview not found`);
      return res.status(404).json({
        success: false,
        error: 'Vendor preview not found'
      });
    }
    
    console.log(`   ✅ RESULT: Found vendor preview`);
    const productSource = lookupResult.productData;
    
    // Get current product details from Printify
    const productResult = await printifyService.getProduct(productId);
    
    if (!productResult.success) {
      console.log(`   ❌ Printify API Error: ${productResult.error}`);
      return res.status(400).json({
        success: false,
        error: productResult.error
      });
    }
    
    console.log(`   ✅ Printify product data retrieved successfully`);
    
    res.json({
      success: true,
      product: {
        ...productResult.product,
        sourceImage: productSource.sourceImage,
        isVendorPreview: true,
        dataSource: 'vendor-preview',
        // Add vendor preview metadata
        createdBy: productSource.createdBy,
        blueprintId: productSource.blueprintId,
        providerId: productSource.providerId
      }
    });
    
  } catch (error) {
    console.error('Error fetching vendor preview details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vendor preview details'
    });
  }
});

/**
 * DELETE /api/merchandise/vendor-preview/:productId
 * Delete a vendor preview product
 */
router.delete('/vendor-preview/:productId', async (req, res) => {
  try {
    // Ensure database is ready
    if (!ensureDatabaseReady(res)) {
      return; // Error response already sent
    }
    
    const { productId } = req.params;
    console.log(`🗑️ DELETE REQUEST: Vendor preview ${productId}`);
    
    // 1. Verify it's a vendor preview (not a user product)
    const VendorPreviewHelper = require('../utils/vendor-preview-helper');
    const previewHelper = new VendorPreviewHelper();
    
    const lookupResult = await previewHelper.getProductByIdWithFallback(productId, null);
    
    if (!lookupResult.found || !lookupResult.isVendorPreview) {
      console.log(`   ❌ Not a vendor preview or not found`);
      return res.status(404).json({
        success: false,
        error: 'Vendor preview not found'
      });
    }
    
    console.log(`   ✅ Confirmed: ${productId} is a vendor preview`);
    
    // 2. Delete from Printify
    try {
      console.log(`   🗑️ Deleting from Printify...`);
      await printifyService.deleteProduct(productId);
      console.log(`   ✅ Deleted from Printify`);
    } catch (printifyError) {
      console.error(`   ⚠️  Printify deletion failed:`, printifyError.message);
      // Continue with database deletion even if Printify fails
    }
    
    // 3. Delete from vendor preview database
    console.log(`   🗑️ Deleting from vendor preview database...`);
    const dbResult = await merchandiseDB.deleteVendorPreview(productId);
    
    if (!dbResult) {
      console.log(`   ⚠️  Database deletion failed or product not in database`);
    } else {
      console.log(`   ✅ Deleted from vendor preview database`);
    }
    
    console.log(`   ✅ DELETE COMPLETE: ${productId}`);
    
    res.json({
      success: true,
      message: 'Vendor preview deleted successfully',
      productId: productId
    });
    
  } catch (error) {
    console.error('Error deleting vendor preview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete vendor preview',
      details: error.message
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
    
    // REFACTORED: Use VendorPreviewHelper for consistent product lookup
    console.log(`🔍 PRODUCT LOOKUP: Using VendorPreviewHelper for product ${productId}`);
    const VendorPreviewHelper = require('../utils/vendor-preview-helper');
    const previewHelper = new VendorPreviewHelper();
    
    const lookupResult = await previewHelper.getProductByIdWithFallback(productId, userId);
    
    if (!lookupResult.found) {
      console.log(`   ❌ RESULT: Product not found via helper`);
      return res.status(404).json({
        success: false,
        error: 'Product not found',
        details: 'Product not found in user collection or vendor previews'
      });
    }
    
    console.log(`   ✅ RESULT: Found via ${lookupResult.source}`);
    const productSource = lookupResult.productData;
    
    // Get current product details from Printify
    const productResult = await printifyService.getProduct(productId);
    
    if (!productResult.success) {
      console.log(`   ❌ Printify API Error: ${productResult.error}`);
      return res.status(400).json({
        success: false,
        error: productResult.error
      });
    }
    
    console.log(`   ✅ Printify product data retrieved successfully`);
    
    res.json({
      success: true,
      product: {
        ...productResult.product,
        sourceImage: productSource.sourceImage,
        isVendorPreview: lookupResult.isVendorPreview,
        dataSource: lookupResult.source
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
 * GET /merchandise/preview/:productId
 * HTML preview page for vendor preview products
 */
router.get('/preview/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    
    console.log(`🖼️ Loading HTML preview for product: ${productId}`);
    
    // Get product data from vendor preview helper
    const VendorPreviewHelper = require('../utils/vendor-preview-helper');
    const previewHelper = new VendorPreviewHelper();
    
    // For preview pages, we'll use a simplified lookup that doesn't require authentication
    const lookupResult = await previewHelper.getVendorPreviewById(productId);
    
    if (!lookupResult) {
      console.log(`❌ Vendor preview not found: ${productId}`);
      return res.status(404).render('error', {
        title: 'Product Not Found',
        message: 'The requested vendor preview product could not be found.',
        error: { status: 404 }
      });
    }
    
    // Get current product details from Printify
    const productResult = await printifyService.getProduct(productId);
    
    if (!productResult.success) {
      console.log(`❌ Printify API Error: ${productResult.error}`);
      return res.status(500).render('error', {
        title: 'Product Error',
        message: 'Failed to load product details from Printify.',
        error: { status: 500, details: productResult.error }
      });
    }
    
    const product = productResult.product;
    
    console.log(`✅ Rendering preview page for: ${product.title}`);
    
    // Get friendly names for blueprint and provider
    const friendlyNames = require('../utils/printify-friendly-names');
    const providerBlueprintInfo = friendlyNames.formatProviderBlueprintDisplay(
      product.blueprint_id,
      product.print_provider_id
    );
    
    // Render the vendor preview page
    res.render('vendor-preview', {
      title: product.title,
      product: {
        ...product,
        sourceImage: lookupResult.sourceImage,
        createdAt: lookupResult.createdAt,
        createdBy: lookupResult.createdBy
      },
      productId: productId,
      isPreview: true,
      friendlyNames: providerBlueprintInfo
    });
    
  } catch (error) {
    console.error('Error loading vendor preview page:', error);
    res.status(500).render('error', {
      title: 'Preview Error',
      message: 'Failed to load vendor preview page.',
      error: error
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
router.post('/preview-enhancement', ensureAuthenticated, groupAuth.requireAction('game_access'), async (req, res) => {
  console.log('🔍 ROUTE: /api/merchandise/preview-enhancement called');
  console.log('🔍 Request body:', req.body);
  console.log('🔍 User groups:', req.user?.groups);
  
  console.log('✅ VIP access granted');
  
  try {
    // Ensure database is ready
    if (!ensureDatabaseReady(res)) {
      console.log('❌ Database not ready');
      return; // Error response already sent
    }
    
    console.log('✅ Database ready');
    
    const userId = req.user.uid;
    const { imageId } = req.body;
    
    console.log('🔍 Processing request for userId:', userId, 'imageId:', imageId);
    
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
    
    // Check if we already have a cached enhanced version
    const sanitizedImageId = _sanitizeFirebaseKey(imageId);
    console.log(`🔍 Checking cache for enhanced version of: ${imageId}`);
    
    const cachedVersion = await merchandiseDB.getEnhancedImage(sanitizedImageId);
    
    if (cachedVersion && cachedVersion.enhancedImageUrl) {
      console.log(`✅ Using cached enhanced version for: ${imageId}`);
      
      // Return the cached version
      return res.json({
        success: true,
        original: {
          url: selectedImage.url,
          width: cachedVersion.originalDimensions?.width || 1024,
          height: cachedVersion.originalDimensions?.height || 1024,
          suitableForPrint: false
        },
        enhanced: {
          url: cachedVersion.enhancedImageUrl,
          width: cachedVersion.enhancedDimensions?.width || 2048,
          height: cachedVersion.enhancedDimensions?.height || 2048
        },
        analysis: {
          method: cachedVersion.enhancementMethod || 'AI Upscaling',
          improvement: cachedVersion.improvementDescription || 'Quality enhanced for printing',
          scaleFactor: cachedVersion.scaleFactor || 2.0,
          cached: true
        }
      });
    }

    console.log(`🎨 No cached version found, generating new enhancement for: ${imageId}`);
    
    // Generate enhancement preview
    console.log(`🎨 Generating enhancement preview for: ${imageId}`);
    const startTime = Date.now();
    
    const enhancementResult = await printifyService.previewImageEnhancement(
      imageBuffer,
      selectedImage.fileName || selectedImage.originalName,
      { 
        originalImageId: imageId, // Pass originalImageId for caching
        userId: userId // Pass userId for proper S3 path organization
      }
    );
    
    console.log('🔍 Enhancement result:', {
      success: enhancementResult.success,
      error: enhancementResult.error,
      hasEnhancedUrl: !!enhancementResult.enhancedImageUrl,
      originalSuitable: enhancementResult.originalImageSuitable
    });
    
    if (!enhancementResult.success) {
      console.error('❌ Enhancement failed:', enhancementResult.error);
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
        const storeResult = await merchandiseDB.storeEnhancedImage(sanitizedImageId, enhancementData);
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
    console.error('❌ Error previewing enhancement:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Failed to preview enhancement: ' + error.message
    });
  }
});

/**
 * GET /api/merchandise/test-printify
 * Test Printify API connection (development only)
 */
router.get('/test-printify', async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).json({ error: 'Not found' });
  }
  
  try {
    console.log('🔧 Testing Printify API connection...');
    
    // Test basic API connectivity
    const testResult = await printifyService.getBlueprints();
    
    res.json({
      success: true,
      message: 'Printify API connection test',
      config: {
        apiUrl: process.env.PRINTIFY_API_URL,
        shopId: process.env.PRINTIFY_SHOP_ID,
        environment: process.env.PRINTIFY_ENVIRONMENT,
        hasToken: !!process.env.PRINTIFY_API_TOKEN
      },
      testResult: {
        success: testResult.success,
        error: testResult.error,
        blueprintCount: testResult.blueprints?.length || 0
      }
    });
    
  } catch (error) {
    console.error('Printify API test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      config: {
        apiUrl: process.env.PRINTIFY_API_URL,
        shopId: process.env.PRINTIFY_SHOP_ID,
        environment: process.env.PRINTIFY_ENVIRONMENT,
        hasToken: !!process.env.PRINTIFY_API_TOKEN
      }
    });
  }
});

/**
 * POST /api/merchandise/check-enhancement-status
 * Check if an image has a cached enhanced version
 */
router.post('/check-enhancement-status', ensureAuthenticated, groupAuth.requireAction('game_access'), async (req, res) => {
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
    const hasEnhanced = await merchandiseDB.hasEnhancedVersion(imageId);
    
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
 * GET /api/merchandise/vendor-previews
 * Get all vendor preview products for catalog display
 */
router.get('/vendor-previews', async (req, res) => {
  try {
    console.log('📋 Fetching all vendor preview products for catalog...');
    
    const VendorPreviewHelper = require('../utils/vendor-preview-helper');
    const helper = new VendorPreviewHelper();
    
    const previews = await helper.getAllVendorPreviews();
    
    console.log(`✅ Found ${previews.length} vendor preview products`);
    
    res.json({
      success: true,
      count: previews.length,
      previews: previews
    });
    
  } catch (error) {
    console.error('❌ Error fetching vendor preview catalog:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vendor preview catalog',
      details: error.message
    });
  }
});

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
 * GET /api/merchandise/product-status/:productId
 * Check current status of a product and refresh data
 */
router.get('/product-status/:productId', ensureAuthenticated, async (req, res) => {
  try {
    if (!ensureDatabaseReady(res)) {
      return;
    }
    
    const userId = req.user.uid;
    const { productId } = req.params;
    
    // Get current product from Printify
    const productResult = await printifyService.getProduct(productId);
    
    if (!productResult.success) {
      return res.status(400).json({
        success: false,
        error: productResult.error
      });
    }
    
    // Update local database with current data
    const userProducts = await merchandiseDB.getUserProducts(userId);
    const existingProduct = userProducts.find(p => (p.id || p.productId) === productId);
    
    if (existingProduct) {
      const updatedProduct = {
        ...existingProduct,
        productId: productId, // Ensure productId is set
        variants: productResult.product.variants,
        images: productResult.product.images,
        lastUpdated: new Date().toISOString()
      };
      
      // Re-store the updated product (overwrites existing)
      await merchandiseDB.storeUserProduct(userId, updatedProduct);
      
      res.json({
        success: true,
        product: updatedProduct
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Product not found in user collection'
      });
    }
    
  } catch (error) {
    console.error('Error checking product status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check product status'
    });
  }
});

/**
 * POST /api/merchandise/retry-setup/:productId
 * Retry product setup process
 */
router.post('/retry-setup/:productId', ensureAuthenticated, async (req, res) => {
  try {
    console.log('🔧 RETRY SETUP: Starting for productId:', req.params.productId);
    
    if (!ensureDatabaseReady(res)) {
      console.log('❌ RETRY SETUP: Database not ready');
      return;
    }
    
    const userId = req.user.uid;
    const { productId } = req.params;
    
    console.log('🔧 RETRY SETUP: userId:', userId, 'productId:', productId);
    
    // Get the existing product data
    const userProducts = await merchandiseDB.getUserProducts(userId);
    console.log('🔧 RETRY SETUP: Found', userProducts.length, 'user products');
    
    const existingProduct = userProducts.find(p => (p.id || p.productId) === productId);
    console.log('🔧 RETRY SETUP: Existing product found:', !!existingProduct);
    
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    // Try to refresh the product from Printify
    console.log('🔧 RETRY SETUP: Calling Printify API for product:', productId);
    
    // MOCK MODE: For testing, simulate successful product refresh
    let productResult;
    if (process.env.PRINTIFY_MOCK_MODE === 'true') {
      console.log('🔧 RETRY SETUP: Using mock mode');
      productResult = {
        success: true,
        product: {
          variants: [
            { id: 'mock_variant_1', title: 'M / Black', price: 2099, is_enabled: true },
            { id: 'mock_variant_2', title: 'L / Black', price: 2099, is_enabled: true }
          ],
          images: [{ src: existingProduct.sourceImage?.url || 'mock-image.jpg' }]
        }
      };
    } else {
      productResult = await printifyService.getProduct(productId);
    }
    
    console.log('🔧 RETRY SETUP: Printify result:', { success: productResult.success, error: productResult.error });
    
    if (productResult.success) {
      // Update with fresh data
      const updatedProduct = {
        ...existingProduct,
        productId: productId, // Ensure productId is set
        variants: productResult.product.variants,
        images: productResult.product.images,
        lastRetry: new Date().toISOString()
      };
      
      // Re-store the updated product (overwrites existing)
      await merchandiseDB.storeUserProduct(userId, updatedProduct);
      
      res.json({
        success: true,
        product: updatedProduct,
        message: 'Product data refreshed successfully'
      });
    } else {
      // If Printify fails, mark for manual review
      const updatedProduct = {
        ...existingProduct,
        productId: productId, // Ensure productId is set
        status: 'retry_failed',
        lastRetry: new Date().toISOString(),
        retryError: productResult.error
      };
      
      // Re-store the updated product (overwrites existing)
      await merchandiseDB.storeUserProduct(userId, updatedProduct);
      
      res.json({
        success: false,
        error: 'Product setup retry failed. Please contact support.',
        product: updatedProduct
      });
    }
    
  } catch (error) {
    console.error('❌ RETRY SETUP ERROR:', error);
    console.error('❌ RETRY SETUP STACK:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Failed to retry product setup: ' + error.message
    });
  }
});

/**
 * Refund payment (integrate with your payment system)
 */
async function refundPayment(paymentId) {
  // TODO: Implement refund logic with your payment processor
  console.log('Refunding payment:', paymentId);
}

// ========================================
// NEW ENDPOINTS FOR MERCHANDISE REFACTORING
// ========================================

/**
 * GET /api/enhancement/status
 * Get AI image enhancement service status
 * This is an alias to /api/merchandise/enhancement-status
 */
router.get('/enhancement/status', (req, res) => {
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
 * GET /api/product-catalog
 * Get complete product catalog with all available products and categories
 */
router.get('/product-catalog', async (req, res) => {
  try {
    console.log('📚 Fetching complete product catalog...');

    const catalog = {
      success: true,
      allProducts: getAllProducts(),
      categories: Object.keys(ProductTypes).map(key => ({
        id: key,
        name: ProductTypes[key].name,
        description: ProductTypes[key].description,
        icon: ProductTypes[key].icon
      })),
      totalProducts: getAllProducts().length,
      timestamp: new Date().toISOString()
    };

    res.json(catalog);
  } catch (error) {
    console.error('Error fetching product catalog:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product catalog',
      details: error.message
    });
  }
});

/**
 * GET /api/gallery
 * Get user's gallery images (public endpoint, requires authentication)
 * Returns all user gallery images suitable for merchandise creation
 * Includes both uploaded images and bookmarked content images
 */
router.get('/gallery', ensureAuthenticated, async (req, res) => {
  try {
    console.log('🖼️ Fetching gallery images for merchandise...');

    const userId = req.user.uid;

    // Get S3 uploaded images
    const s3Images = await galleryStorage.listUserGalleryImages(userId);
    console.log(`📊 Found ${s3Images.length} S3 images for user ${userId}`);

    // Get Firebase bookmarks (content image references)
    const bookmarks = await getUserBookmarks(userId);
    console.log(`📊 Found ${bookmarks.length} bookmarked content images for user ${userId}`);

    // Format S3 uploaded images
    const formattedS3Images = s3Images.map(image => ({
      id: path.basename(image.relativePath),
      url: image.url,
      title: image.originalName || image.fileName || path.basename(image.relativePath),
      uploadedAt: image.uploadedAt || image.lastModified,
      size: image.size,
      dimensions: image.dimensions,
      format: path.extname(image.relativePath).slice(1).toLowerCase(),
      type: 'uploaded'
    }));

    // Format bookmarked images
    const formattedBookmarks = bookmarks.map(bookmark => ({
      id: bookmark.bookmarkId,
      url: bookmark.url,
      title: bookmark.title,
      uploadedAt: bookmark.savedAt,
      size: 0,
      dimensions: null,
      format: 'unknown',
      type: 'bookmark'
    }));

    // Combine both types
    const allImages = [...formattedS3Images, ...formattedBookmarks];
    console.log(`📤 Sending ${allImages.length} total images (${formattedS3Images.length} uploaded + ${formattedBookmarks.length} bookmarked)`);

    res.json({
      success: true,
      images: allImages,
      total: allImages.length,
      userId: userId
    });
  } catch (error) {
    console.error('Error fetching gallery images:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch gallery images',
      details: error.message
    });
  }
});

/**
 * GET /api/gallery/:imageId
 * Get specific gallery image details
 * Searches both uploaded images and bookmarked content
 */
router.get('/gallery/:imageId', ensureAuthenticated, async (req, res) => {
  try {
    const { imageId } = req.params;
    const userId = req.user.uid;

    console.log(`🖼️ Fetching gallery image: ${imageId}`);

    // Try to find as uploaded image first
    const s3Images = await galleryStorage.listUserGalleryImages(userId);
    let image = s3Images.find(img => path.basename(img.relativePath) === imageId);

    if (image) {
      return res.json({
        success: true,
        image: {
          id: path.basename(image.relativePath),
          url: image.url,
          title: image.originalName || image.fileName || path.basename(image.relativePath),
          uploadedAt: image.uploadedAt || image.lastModified,
          size: image.size,
          dimensions: image.dimensions,
          format: path.extname(image.relativePath).slice(1).toLowerCase(),
          type: 'uploaded'
        }
      });
    }

    // Try to find as bookmark
    const bookmarks = await getUserBookmarks(userId);
    const bookmark = bookmarks.find(bm => bm.bookmarkId === imageId);

    if (bookmark) {
      return res.json({
        success: true,
        image: {
          id: bookmark.bookmarkId,
          url: bookmark.url,
          title: bookmark.title,
          uploadedAt: bookmark.savedAt,
          size: 0,
          dimensions: null,
          format: 'unknown',
          type: 'bookmark'
        }
      });
    }

    // Image not found
    res.status(404).json({
      success: false,
      error: 'Gallery image not found'
    });
  } catch (error) {
    console.error('Error fetching gallery image:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch gallery image',
      details: error.message
    });
  }
});

// ========================================
// PERFECT PRINTING - OPTIMIZATION ENDPOINTS
// ========================================

/**
 * POST /api/merchandise/optimize-for-product
 * Optimize image for a specific product type
 *
 * Handles:
 * - Product specification validation
 * - Image analysis (current dimensions, format)
 * - Intelligent sizing (upscale/downscale/optimize)
 * - Progress reporting (real-time updates to UI)
 * - Transparent user messaging
 *
 * Request body:
 * {
 *   "imageBuffer": base64 or Buffer,
 *   "productKey": "apparel-tshirt",
 *   "fileName": "my-design.png"
 * }
 */
router.post('/optimize-for-product', ensureAuthenticated, async (req, res) => {
  try {
    const { imageBuffer, productKey, fileName } = req.body;

    if (!imageBuffer) {
      return res.status(400).json({
        success: false,
        error: 'Image buffer is required'
      });
    }

    if (!productKey) {
      return res.status(400).json({
        success: false,
        error: 'Product key is required'
      });
    }

    console.log(`🎨 Optimizing image for product: ${productKey}`);

    // Validate product specification exists
    const spec = productSpecifications.getSpecsByProductKey(productKey);
    if (!spec) {
      return res.status(404).json({
        success: false,
        error: `Product "${productKey}" not found in specifications`
      });
    }

    // Convert base64 to Buffer if needed
    let imgBuffer = imageBuffer;
    if (typeof imageBuffer === 'string') {
      imgBuffer = Buffer.from(imageBuffer, 'base64');
    }

    // Create optimizer instance
    const optimizer = new ImageOptimizer();

    // Set up progress callbacks to stream to client via SSE (if requested)
    optimizer.onProgress((event) => {
      // Progress events are logged for debugging
      // In a real scenario, you could use WebSockets or Server-Sent Events
    });

    // CHECK CACHE FIRST - before analyzing
    console.log(`💾 Checking cache for product-specific optimization...`);
    const cacheCheck = await optimizer.checkProductCache(imgBuffer, productKey);

    if (cacheCheck.cached) {
      // Cache hit! Return cached result immediately
      console.log(`✨ CACHE HIT - Returning cached optimization`);

      // Record cache reuse for analytics
      cacheAnalytics.recordCacheReuse(productKey).then(result => {
        console.log(`📊 Cache reuse recorded for ${productKey}:`, result);
      }).catch(err =>
        console.warn('❌ Failed to record cache reuse:', err.message)
      );

      return res.json({
        success: true,
        cacheHit: true,
        cachedOptimization: {
          enhancedImageUrl: cacheCheck.enhancedImageUrl,
          s3Key: cacheCheck.s3Key,
          metadata: cacheCheck.metadata,
          message: `✨ Using cached optimization from ${cacheCheck.metadata.usageCount} other users!`,
          processingTime: 0,
          estimatedSavings: cacheCheck.metadata.processingTime
        },
        product: {
          key: productKey,
          name: spec.name,
          printArea: spec.printArea,
          dpi: spec.imageSpec.recommendedDpi
        },
        nextSteps: [
          '1. Your image was already optimized and cached!',
          '2. Proceed directly to checkout or customization'
        ]
      });
    }

    // Cache miss - proceed with analysis
    console.log(`📦 CACHE MISS - Analyzing image for optimization...`);
    const analysis = await optimizer.analyzeImage(imgBuffer, productKey);

    // Get template recommendations
    const applicableTemplates = productTemplates
      .getAllTemplates()
      .filter(templateId => {
        const template = productTemplates.getTemplateById(templateId);
        return template.productType === productKey;
      })
      .map(templateId => productTemplates.getTemplateInfo(templateId));

    // Return analysis to user for decision
    return res.json({
      success: true,
      cacheHit: false,
      analysis: {
        currentDimensions: analysis.currentDimensions,
        targetDimensions: analysis.targetDimensions,
        strategy: analysis.strategy,
        action: analysis.action,
        message: analysis.message,
        estimatedTime: analysis.estimatedTime,
        scaleFactor: analysis.scaleFactor
      },
      product: {
        key: productKey,
        name: spec.name,
        printArea: spec.printArea,
        dpi: spec.imageSpec.recommendedDpi
      },
      templates: applicableTemplates,
      nextSteps: [
        '1. Review the optimization strategy above',
        '2. Confirm you want to proceed',
        '3. Send request to /optimize-for-product-confirm to perform actual optimization'
      ]
    });

  } catch (error) {
    console.error('Error analyzing image for optimization:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze image',
      details: error.message
    });
  }
});

/**
 * POST /api/merchandise/optimize-for-product-confirm
 * Confirm and execute image optimization
 *
 * After user reviews the analysis from the previous endpoint,
 * they confirm and this performs the actual optimization.
 *
 * Request body:
 * {
 *   "imageBuffer": base64 or Buffer,
 *   "productKey": "apparel-tshirt",
 *   "confirm": true
 * }
 */
router.post('/optimize-for-product-confirm', ensureAuthenticated, async (req, res) => {
  try {
    const { imageBuffer, productKey, confirm } = req.body;

    if (!confirm) {
      return res.status(400).json({
        success: false,
        error: 'Optimization must be confirmed'
      });
    }

    console.log(`⚡ Executing optimization for product: ${productKey}`);

    // Convert base64 to Buffer if needed
    let imgBuffer = imageBuffer;
    if (typeof imageBuffer === 'string') {
      imgBuffer = Buffer.from(imageBuffer, 'base64');
    }

    const optimizer = new ImageOptimizer();

    // Perform actual optimization
    const result = await optimizer.optimizeForProduct(imgBuffer, productKey);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Optimization failed',
        details: result.message
      });
    }

    // Get file statistics
    const stats = optimizer.getStats(imgBuffer, result.optimizedBuffer);

    console.log(`✅ Optimization complete: ${result.message}`);

    // Record optimization for analytics
    console.log(`📊 Recording optimization metrics...`);
    cacheAnalytics.recordOptimization(productKey, {
      processingTime: result.processingTime,
      scaleFactor: result.analysis.scaleFactor,
      costEstimate: result.analysis.strategy === 'UPSCALE' ? 0.08 : 0
    }).then(recordResult => {
      console.log(`📊 Optimization recorded for ${productKey}:`, recordResult);
    }).catch(err =>
      console.warn('❌ Failed to record optimization:', err.message)
    );

    // STORE IN CACHE for future users
    console.log(`💾 Storing optimized image in cache for reuse...`);
    // Note: In a real scenario, this would upload to S3 first and get back the URL
    // For now, we'll create a placeholder that would be filled in during S3 upload
    const cacheResult = await optimizer.storeCachedOptimization(
      imgBuffer,
      result.optimizedBuffer,
      productKey,
      result.analysis,
      result.processingTime,
      'https://placeholder-s3-url.example.com/optimized', // Would be real S3 URL after upload
      `optimized/${productKey}/${Date.now()}-optimized.png` // S3 key
    );

    if (cacheResult.success) {
      console.log(`✨ Optimization cached - future users will get instant results!`);
    }

    return res.json({
      success: true,
      optimizedImage: result.optimizedBuffer.toString('base64'),
      analysis: result.analysis,
      resultMetadata: result.resultMetadata,
      processingTime: result.processingTime,
      message: result.message,
      stats: {
        originalSize: stats.originalSize,
        optimizedSize: stats.optimizedSize,
        saved: stats.saved
      },
      cacheStored: cacheResult.success,
      cacheKey: cacheResult.cacheKey,
      readyForPrintify: true,
      futureUserMessage: cacheResult.success ? `✨ This optimization is now cached and will be instant for other users!` : undefined
    });

  } catch (error) {
    console.error('Error executing optimization:', error);
    res.status(500).json({
      success: false,
      error: 'Optimization failed',
      details: error.message
    });
  }
});

/**
 * GET /api/merchandise/product-specs/:productKey
 * Get product specifications for a specific product
 * Used to display product info and requirements to user
 */
router.get('/product-specs/:productKey', (req, res) => {
  try {
    const { productKey } = req.params;

    const spec = productSpecifications.getSpecsByProductKey(productKey);
    if (!spec) {
      return res.status(404).json({
        success: false,
        error: `Product "${productKey}" not found`
      });
    }

    res.json({
      success: true,
      productKey: productKey,
      name: spec.name,
      category: spec.category,
      printMethod: spec.printMethod,
      printArea: spec.printArea,
      imageSpec: {
        recommendedDpi: spec.imageSpec.recommendedDpi,
        optimalDimensions: spec.imageSpec.optimalDimensions,
        minDimensions: spec.imageSpec.minDimensions,
        maxDimensions: spec.imageSpec.maxDimensions
      },
      placement: spec.placement,
      notes: spec.notes
    });
  } catch (error) {
    console.error('Error fetching product specs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product specifications',
      details: error.message
    });
  }
});

/**
 * GET /api/merchandise/templates
 * Get all available product templates
 */
router.get('/templates', (req, res) => {
  try {
    const allTemplates = productTemplates.getAllTemplates();

    const templateList = allTemplates.map(templateId => {
      const info = productTemplates.getTemplateInfo(templateId);
      return {
        id: templateId,
        ...info
      };
    });

    res.json({
      success: true,
      templates: templateList,
      total: templateList.length
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch templates',
      details: error.message
    });
  }
});

/**
 * GET /api/merchandise/templates/:templateId
 * Get specific template details
 */
router.get('/templates/:templateId', (req, res) => {
  try {
    const { templateId } = req.params;

    const template = productTemplates.getTemplateById(templateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: `Template "${templateId}" not found`
      });
    }

    res.json({
      success: true,
      template: {
        id: template.id,
        name: template.name,
        category: template.category,
        description: template.description,
        productType: template.productType,
        imageOptimization: template.imageOptimization,
        printify: template.printify,
        userMessages: template.userMessages,
        success: template.success
      }
    });
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch template',
      details: error.message
    });
  }
});

/**
 * CACHE ANALYTICS ENDPOINTS
 * Phase 2B: Analytics, metrics, and cache management
 */

// Import analytics services
const CacheAnalyticsService = require('../services/cache-analytics-service');
const CacheLifecycleService = require('../services/cache-lifecycle-service');

const cacheAnalytics = new CacheAnalyticsService();
const cacheLifecycle = new CacheLifecycleService();

/**
 * GET /api/merchandise/cache/statistics
 * Get overall cache performance statistics
 */
router.get('/cache/statistics', async (req, res) => {
  try {
    const stats = await cacheAnalytics.getCacheStatistics();

    if (!stats.success) {
      return res.status(500).json({
        success: false,
        error: stats.error
      });
    }

    res.json({
      success: true,
      cache: stats
    });

  } catch (error) {
    console.error('Error getting cache statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get cache statistics',
      details: error.message
    });
  }
});

/**
 * GET /api/merchandise/cache/product-metrics
 * Get product-specific optimization metrics
 */
router.get('/cache/product-metrics', async (req, res) => {
  try {
    const metrics = await cacheAnalytics.getProductMetrics();

    if (!metrics.success) {
      return res.status(500).json({
        success: false,
        error: metrics.error
      });
    }

    res.json({
      success: true,
      metrics
    });

  } catch (error) {
    console.error('Error getting product metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get product metrics',
      details: error.message
    });
  }
});

/**
 * GET /api/merchandise/cache/health
 * Get cache health recommendations and insights
 */
router.get('/cache/health', async (req, res) => {
  try {
    const health = await cacheAnalytics.getCacheHealthRecommendations();

    if (!health.success) {
      return res.status(500).json({
        success: false,
        error: health.error
      });
    }

    res.json({
      success: true,
      health
    });

  } catch (error) {
    console.error('Error getting cache health:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get cache health',
      details: error.message
    });
  }
});

/**
 * GET /api/merchandise/cache/top-optimizations
 * Get top performing cached optimizations
 */
router.get('/cache/top-optimizations', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const results = await cacheAnalytics.getTopOptimizations(limit);

    if (!results.success) {
      return res.status(500).json({
        success: false,
        error: results.error
      });
    }

    res.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('Error getting top optimizations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get top optimizations',
      details: error.message
    });
  }
});

/**
 * GET /api/merchandise/cache/storage
 * Get cache storage statistics
 */
router.get('/cache/storage', async (req, res) => {
  try {
    const storage = await cacheLifecycle.getCacheStorageStats();

    if (!storage.success) {
      return res.status(500).json({
        success: false,
        error: storage.error
      });
    }

    res.json({
      success: true,
      storage
    });

  } catch (error) {
    console.error('Error getting storage stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get storage statistics',
      details: error.message
    });
  }
});

/**
 * POST /api/merchandise/cache/maintenance
 * Run cache maintenance (cleanup old entries)
 * Query params:
 *   - dryRun: boolean (default: true) - Preview changes without making them
 *   - aggressive: boolean (default: false) - More aggressive cleanup
 *   - maxAge: number (default: 90) - Max age in days
 */
router.post('/cache/maintenance', async (req, res) => {
  try {
    // Require admin authentication in production
    if (process.env.NODE_ENV === 'production' && !req.user?.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const options = {
      dryRun: req.query.dryRun !== 'false', // default true for safety
      aggressive: req.query.aggressive === 'true',
      maxAge: parseInt(req.query.maxAge) || 90
    };

    console.log(`🚀 Starting cache maintenance with options:`, options);
    const result = await cacheLifecycle.runCacheMaintenance(options);

    res.json({
      success: true,
      result
    });

  } catch (error) {
    console.error('Error running cache maintenance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run cache maintenance',
      details: error.message
    });
  }
});

/**
 * GET /api/merchandise/cache/policy
 * Get current cache retention policy
 */
router.get('/cache/policy', (req, res) => {
  try {
    const policy = cacheLifecycle.getRetentionPolicy();

    res.json({
      success: true,
      policy
    });

  } catch (error) {
    console.error('Error getting cache policy:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get cache policy',
      details: error.message
    });
  }
});

/**
 * POST /api/merchandise/cache/policy
 * Update cache retention policy (admin only)
 */
router.post('/cache/policy', (req, res) => {
  try {
    // Require admin authentication in production
    if (process.env.NODE_ENV === 'production' && !req.user?.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const newPolicy = cacheLifecycle.configureRetentionPolicy(req.body);

    res.json({
      success: true,
      policy: newPolicy,
      message: 'Cache retention policy updated'
    });

  } catch (error) {
    console.error('Error updating cache policy:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update cache policy',
      details: error.message
    });
  }
});

/**
 * TEST HARNESS FOR PERFECT PRINTING
 * POST /api/merchandise/test-harness/optimize-random
 *
 * Randomly selects:
 * 1. A gallery image from the authenticated user
 * 2. A product type from the catalog
 * 3. Optimizes the image for that product
 * 4. Creates a product with the optimized image
 *
 * This generates real analytics data and tests the full pipeline
 */
router.post('/test-harness/optimize-random', ensureAuthenticated, groupAuth.requireAction('game_access'), async (req, res) => {
  try {
    console.log('🧪 TEST HARNESS: optimize-random endpoint called');

    const userId = req.user.uid;
    const userName = req.user.displayName || 'Test User';

    // Step 1: Get user's gallery images (both S3 uploads AND bookmarks)
    console.log(`🖼️  Fetching gallery images for user: ${userId}`);
    const s3Images = await galleryStorage.listUserGalleryImages(userId);
    const { getUserBookmarks } = require('../services/firebase/galleryService');
    const bookmarks = await getUserBookmarks(userId);

    // Combine both S3 images and bookmarks
    const allGalleryImages = [];

    if (s3Images && s3Images.length > 0) {
      allGalleryImages.push(...s3Images.map(img => ({
        ...img,
        type: 'uploaded',
        url: img.url || img.url
      })));
    }

    if (bookmarks && bookmarks.length > 0) {
      allGalleryImages.push(...bookmarks.map(bookmark => ({
        fileName: bookmark.title || bookmark.fileName,
        url: bookmark.url,
        type: 'bookmark',
        bookmarkId: bookmark.bookmarkId,
        title: bookmark.title
      })));
    }

    if (!allGalleryImages || allGalleryImages.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No gallery images found. Please upload an image or bookmark content first.',
        details: 'User has no images or bookmarks in their gallery'
      });
    }

    console.log(`✅ Found ${allGalleryImages.length} gallery images (${s3Images?.length || 0} uploads + ${bookmarks?.length || 0} bookmarks)`);

    // Randomly select an image
    const randomImage = allGalleryImages[Math.floor(Math.random() * allGalleryImages.length)];
    console.log(`✅ Selected random image: ${randomImage.fileName}`);

    // Step 2: Get all product types and randomly select one
    const allProducts = getAllProducts();
    const productIds = Object.keys(allProducts);

    if (!productIds || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No product types available in catalog',
        details: 'Product catalog is empty'
      });
    }

    const randomProductId = productIds[Math.floor(Math.random() * productIds.length)];
    const selectedProduct = allProducts[randomProductId];
    console.log(`✅ Selected random product: ${selectedProduct.name} (${randomProductId})`);

    // Step 3: Download image buffer
    console.log(`📥 Downloading image: ${randomImage.url}`);
    let imageBuffer;
    try {
      const response = await axios.get(randomImage.url, {
        responseType: 'arraybuffer',
        timeout: 30000
      });
      imageBuffer = Buffer.from(response.data);
      console.log(`✅ Image downloaded: ${imageBuffer.length} bytes`);
    } catch (error) {
      console.error('❌ Failed to download image:', error.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to download image',
        details: error.message
      });
    }

    // Step 4: Create product with the image
    const productTitle = `[TEST] ${selectedProduct.name} - ${randomImage.fileName}`;
    const productDescription = `Auto-generated test product for PERFECT PRINTING optimization pipeline testing. Product: ${selectedProduct.name}. Source image: ${randomImage.fileName}.`;

    console.log(`🎨 Creating product: ${productTitle}`);

    try {
      // Create the product in the database
      const productKey = sanitizeFirebaseKey(`${selectedProduct.id}-${Date.now()}-test`);

      const newProduct = {
        productId: productKey,
        localId: productKey,
        title: productTitle,
        description: productDescription,
        productType: selectedProduct.category,
        blueprintId: selectedProduct.blueprintId,
        printProviderId: selectedProduct.printProviderId,
        sourceImage: {
          url: randomImage.url,
          title: randomImage.fileName,
          dimensions: randomImage.dimensions
        },
        status: 'test',
        isTestProduct: true,
        createdAt: new Date().toISOString(),
        createdBy: userId,
        createdByName: userName,
        imageBuffer: imageBuffer.toString('base64'),
        imageSize: imageBuffer.length,
        testHarnessRun: true
      };

      // Save to merchandise database
      await merchandiseDB.saveProduct(newProduct);
      console.log(`✅ Product created: ${productKey}`);

      // Step 5: Optimize image for this product
      console.log(`🎨 Optimizing image for product: ${selectedProduct.name}`);

      const optimizer = new ImageOptimizer();
      const spec = productSpecifications.getSpecsByProductKey(selectedProduct.id);

      if (!spec) {
        console.warn(`⚠️  No specs found for ${selectedProduct.id}, using generic optimization`);
      }

      const result = await optimizer.optimize(imageBuffer, spec || {});
      console.log(`✅ Optimization complete: ${result.message}`);

      // Record optimization analytics
      console.log(`📊 Recording optimization analytics...`);
      cacheAnalytics.recordOptimization(selectedProduct.id, {
        processingTime: result.processingTime,
        scaleFactor: result.analysis.scaleFactor,
        costEstimate: result.analysis.strategy === 'UPSCALE' ? 0.08 : 0,
        testRun: true
      }).then(recordResult => {
        console.log(`✅ Analytics recorded:`, recordResult);
      }).catch(err => {
        console.warn(`❌ Failed to record optimization analytics:`, err.message);
      });

      // Return success with detailed info
      res.json({
        success: true,
        message: 'Test harness completed successfully',
        test_run_details: {
          timestamp: new Date().toISOString(),
          userId: userId,
          userName: userName,
          selected_image: {
            name: randomImage.fileName,
            url: randomImage.url,
            size: imageBuffer.length,
            dimensions: randomImage.dimensions
          },
          selected_product: {
            id: selectedProduct.id,
            name: selectedProduct.name,
            category: selectedProduct.category,
            blueprint: selectedProduct.blueprintId
          },
          created_product: {
            productKey: productKey,
            title: productTitle,
            status: 'test'
          },
          optimization_result: {
            message: result.message,
            strategy: result.analysis.strategy,
            scaleFactor: result.analysis.scaleFactor,
            processingTime: result.processingTime,
            originalSize: imageBuffer.length,
            optimizedSize: result.optimizedBuffer ? result.optimizedBuffer.length : 'unknown',
            estimatedCost: result.analysis.strategy === 'UPSCALE' ? 0.08 : 0
          }
        }
      });

    } catch (error) {
      console.error('❌ Error in test harness:', error);
      return res.status(500).json({
        success: false,
        error: 'Test harness encountered an error',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }

  } catch (error) {
    console.error('❌ Test harness error:', error);
    res.status(500).json({
      success: false,
      error: 'Test harness failed',
      details: error.message
    });
  }
});

/**
 * GET /api/merchandise/test-harness/status
 * Check test harness status and availability
 */
router.get('/test-harness/status', (req, res) => {
  res.json({
    success: true,
    message: 'Test harness is available',
    endpoints: {
      'POST /api/merchandise/test-harness/optimize-random': {
        description: 'Run one test cycle: random image + random product + optimization',
        requires: 'Authentication + game_access permission',
        prerequisites: 'User must have at least one image in their gallery'
      }
    },
    note: 'This test harness generates real analytics data for debugging PERFECT PRINTING'
  });
});

module.exports = router;