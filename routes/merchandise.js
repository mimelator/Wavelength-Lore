/**
 * The Liberation Vault - Merchandise Routes
 *
 * API routes for custom merchandise creation and ordering
 * integrating user gallery images with Printify print-on-demand
 * 🔓 Where liberated minds create symbols of their freedom
 * 🔥 ENHANCED: Real Stripe payment processing integration
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const { ensureAuthenticated } = require('../middleware/auth');
const stripePaymentService = require('../services/stripe-payment-service');
const groupAuth = require('../middleware/groupAuth');
const AutoEnhancedPrintifyService = require('../services/auto-enhanced-printify-service');
const MerchandiseDatabase = require('../services/merchandise-database');
const galleryStorage = require('../utils/gallery/storage');
const { getUserBookmarks } = require('../services/firebase/galleryService');
const axios = require('axios');
const { generateProductTitle, prettifyImageName } = require('../utils/product-name-formatter');
const emailService = require('../services/email-service');
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

/**
 * Map product categories to specification keys based on available specs
 * This creates a single source of truth for all category→spec mappings
 *
 * PRODUCT CATEGORIES (from product-types.js):
 *   - Apparel: t-shirt, women-tee, premium-tshirt, heavy-cotton-tee, hoodie, zip-hoodie, sweatshirt, tank-top
 *   - Home: blanket, pillow, canvas, coffee-mug, travel-mug
 *   - Accessories: backpack, fanny-pack, hat, laptop-sleeve, phone-case, tote-bag, notebook, sticker, infant-wear, specialty-item
 *
 * AVAILABLE SPECIFICATIONS (from productSpecifications.js):
 *   - apparel-tshirt, apparel-hoodie, apparel-tank
 *   - home-blanket, home-pillow-16x16, home-pillow-20x20, home-canvas-24x36
 *   - drinkware-mug-ceramic, drinkware-mug-travel
 */
function mapCategoryToSpecKey(productCategory) {
  // Normalize input
  const category = (productCategory || '').toLowerCase().trim();

  // T-SHIRT VARIANTS - All map to apparel-tshirt
  if (category === 't-shirt' || category === 'women-tee' || category === 'premium-tshirt' || category === 'heavy-cotton-tee') {
    return 'apparel-tshirt';
  }

  // HOODIE/SWEATSHIRT VARIANTS - All map to apparel-hoodie
  if (category === 'hoodie' || category === 'zip-hoodie' || category === 'sweatshirt') {
    return 'apparel-hoodie';
  }

  // TANK TOP VARIANTS
  if (category === 'tank-top') {
    return 'apparel-tank';
  }

  // HOME PRODUCTS
  if (category === 'blanket') {
    return 'home-blanket';
  }

  if (category === 'pillow') {
    return 'home-pillow-20x20';  // Default to larger size for better visual impact
  }

  if (category === 'canvas') {
    return 'home-canvas-24x36';
  }

  // DRINKWARE
  if (category === 'coffee-mug' || category === 'mug') {
    return 'drinkware-mug-ceramic';
  }

  if (category === 'travel-mug') {
    return 'drinkware-mug-travel';
  }

  // UNMAPPED CATEGORIES - Log warning and default to most common spec
  // This handles: backpack, fanny-pack, hat, laptop-sleeve, phone-case, tote-bag, notebook, sticker, infant-wear, specialty-item
  console.warn(`⚠️  Unmapped product category "${category}" - defaulting to apparel-tshirt spec`);
  return 'apparel-tshirt';
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
 * Render the merchandise store page (any authenticated user)
 */
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    res.render('merchandise-store', {
      title: 'The Liberation Vault',
      pageTitle: 'The Liberation Vault - Symbols of Your Freedom',
      pageDescription: 'The Liberation Vault: Where liberated minds create and share symbols of their freedom through custom merchandise.',
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
 * GET /merchandise/badge-demo
 * Badge placement UI demo page (development only)
 */
router.get('/badge-demo', async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).json({ error: 'Not found' });
  }

  try {
    res.sendFile(require('path').join(__dirname, '../static/html/badge-placement-demo.html'));
  } catch (error) {
    console.error('Error serving badge demo page:', error);
    res.status(500).json({ error: 'Failed to load badge demo page' });
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
router.get('/gallery-images', ensureAuthenticated, async (req, res) => {
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
 * Create a product using guided selection (any authenticated user)
 */
router.post('/create-guided-product', ensureAuthenticated, async (req, res) => {
  try {
    console.log('\n' + '🔥'.repeat(80));
    console.log('🔥 DIAGNOSTIC: CREATE GUIDED PRODUCT API CALLED');
    console.log('🔥'.repeat(80));
    
    // Ensure database is ready
    if (!ensureDatabaseReady(res)) {
      return; // Error response already sent
    }

    const userId = req.user.uid;
    const { imageId, imageUrl, imageTitle, productType, blueprintId, printProviderId, imageContext = {} } = req.body;

    console.log('📋 DIAGNOSTIC: API Request payload validation');
    console.log('   userId:', userId);
    console.log('   imageId:', imageId);
    console.log('   imageUrl:', imageUrl ? imageUrl.substring(0, 100) + '...' : 'undefined');
    console.log('   imageTitle:', imageTitle);
    console.log('   productType:', productType);
    console.log('   blueprintId:', blueprintId);
    console.log('   printProviderId:', printProviderId);
    console.log('   imageContext keys:', Object.keys(imageContext));

    // 🚨 STRICT VALIDATION - NO FALLBACKS
    if (!imageId || !imageUrl || !productType) {
      const error = 'Image ID, URL, and product type are required';
      console.error('❌ FATAL ERROR: Missing required parameters');
      console.error('   imageId present:', !!imageId);
      console.error('   imageUrl present:', !!imageUrl);
      console.error('   productType present:', !!productType);
      return res.status(400).json({
        success: false,
        error: error
      });
    }

    // Find the product configuration with comprehensive diagnostics
    console.log('🔍 DIAGNOSTIC: Looking up product configuration');
    console.log('   Searching for productType:', productType);
    console.log('   Expected format: validated-XXX');
    
    const productConfig = findProductById(productType);
    
    if (!productConfig) {
      const error = `Invalid product type: ${productType}`;
      console.error('❌ FATAL ERROR: Product configuration not found');
      console.error('   productType searched:', productType);
      console.error('   findProductById returned:', productConfig);
      console.error('   🎯 This indicates either:');
      console.error('      1. Frontend sent invalid productType ID');
      console.error('      2. findProductById function is broken');
      console.error('      3. Product not in validated catalog');
      
      // Debug: Show available product types
      try {
        const { getAllProducts } = require('../config/product-types');
        const allProducts = getAllProducts();
        console.error('   📊 Available product types (first 5):');
        allProducts.slice(0, 5).forEach(p => {
          console.error(`      ${p.id} (${p.name})`);
        });
        console.error(`   📊 Total available products: ${allProducts.length}`);
      } catch (debugError) {
        console.error('   ❌ Could not load product catalog for debugging:', debugError.message);
      }
      
      return res.status(400).json({
        success: false,
        error: error
      });
    }

    console.log('✅ DIAGNOSTIC: Product configuration found');
    console.log('   productConfig.id:', productConfig.id);
    console.log('   productConfig.name:', productConfig.name);
    console.log('   productConfig.blueprintId:', productConfig.blueprintId);
    console.log('   productConfig.printProviderId:', productConfig.printProviderId);
    console.log('   productConfig.category:', productConfig.category);
    console.log('   productConfig.provider:', productConfig.provider);

    // � STRICT PARAMETER VALIDATION - NO FALLBACKS
    console.log('🔍 DIAGNOSTIC: Blueprint/Provider ID validation');
    console.log('   blueprintId from request:', blueprintId);
    console.log('   printProviderId from request:', printProviderId);
    console.log('   blueprintId from config:', productConfig.blueprintId);
    console.log('   printProviderId from config:', productConfig.printProviderId);

    // Validate that request parameters match product configuration
    if (blueprintId && blueprintId !== productConfig.blueprintId) {
      const error = `Blueprint ID mismatch: request=${blueprintId}, config=${productConfig.blueprintId}`;
      console.error('❌ FATAL ERROR: Blueprint ID validation failed');
      console.error('   Request blueprintId:', blueprintId);
      console.error('   Config blueprintId:', productConfig.blueprintId);
      console.error('   🎯 This indicates frontend/backend parameter mismatch');
      return res.status(400).json({
        success: false,
        error: error
      });
    }

    if (printProviderId && printProviderId !== productConfig.printProviderId) {
      const error = `Provider ID mismatch: request=${printProviderId}, config=${productConfig.printProviderId}`;
      console.error('❌ FATAL ERROR: Provider ID validation failed');
      console.error('   Request printProviderId:', printProviderId);
      console.error('   Config printProviderId:', productConfig.printProviderId);
      console.error('   🎯 This indicates frontend/backend parameter mismatch');
      return res.status(400).json({
        success: false,
        error: error
      });
    }

    // Use validated IDs from product configuration (trust the validated catalog)
    const actualBlueprintId = productConfig.blueprintId;
    const actualPrintProviderId = productConfig.printProviderId;

    console.log('✅ DIAGNOSTIC: Using validated blueprint/provider IDs');
    console.log('   actualBlueprintId:', actualBlueprintId);
    console.log('   actualPrintProviderId:', actualPrintProviderId);
    console.log('   Source: Validated product configuration (NO fallbacks)');

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
    let imageBuffer = await downloadImageFromS3(imageUrl);
    if (!imageBuffer) {
      return res.status(400).json({
        success: false,
        error: 'Failed to process image'
      });
    }

    console.log('✅ Product configuration found:', productConfig.name);
    console.log('✅ Generated Name:', productName);
    console.log('✅ Image cached successfully, size:', (imageBuffer.length / 1024).toFixed(2), 'KB');

    // 🎨 CRITICAL: Apply user customizations (effects, borders) BEFORE upscaling
    console.log('\n🔍 IMAGE BUFFER DIAGNOSTIC BEFORE EFFECTS:');
    console.log('   Buffer size:', (imageBuffer.length / 1024).toFixed(2), 'KB');
    console.log('   Buffer type:', Buffer.isBuffer(imageBuffer) ? 'Buffer' : typeof imageBuffer);

    // 🔥 GITHUB ISSUE #96 FIX: Store effect params to pass to Printify service
    // Effects will be applied AFTER upscaling to ensure they're preserved on quality image
    let effectParams = null;

    if (imageContext && (imageContext.effects || imageContext.borderEnabled)) {
      console.log('\n🔥 GITHUB ISSUE #96 FIX: Preparing effects to apply AFTER upscaling...');
      console.log('   imageContext.effects:', imageContext.effects);
      console.log('   imageContext.borderEnabled:', imageContext.borderEnabled);

      const effectsConfig = require('../config/effectsConfig');

      // 🔥 CRITICAL FIX: Convert boolean effect selections to numeric parameters using presets
      effectParams = {
        saturation: 1.0,
        colorTemperature: 5500,
        bloom: 0,
        vignette: 0,
        blur: 0,
        brightness: 1.0,
        contrast: 1.0,
        lightning: 0,
        borderEnabled: imageContext.borderEnabled || false,
        borderColor: imageContext.borderColor || '#000000',
        borderWidth: imageContext.borderWidth || 0,
        borderWidthPixels: imageContext.borderWidthPixels || 0
      };

      console.log('\n🔍 Converting effect selections to numeric parameters:');
      if (imageContext.effects && Object.keys(imageContext.effects).length > 0) {
        // Merge all selected effect presets
        Object.entries(imageContext.effects).forEach(([effectName, isEnabled]) => {
          if (isEnabled && effectsConfig.effectTypes && effectsConfig.effectTypes[effectName]) {
            const effectPreset = effectsConfig.effectTypes[effectName].preset;
            console.log(`   ✅ ${effectName} selected - merging preset:`, effectPreset);

            // Merge preset values (higher values win for multiplicative params)
            Object.entries(effectPreset).forEach(([paramName, paramValue]) => {
              if (typeof paramValue === 'number') {
                // For multiplicative values (saturation, brightness, contrast), multiply
                if (['saturation', 'brightness', 'contrast'].includes(paramName)) {
                  effectParams[paramName] = (effectParams[paramName] || 1.0) * paramValue;
                } else {
                  // For additive values (bloom, vignette, blur, lightning), add
                  effectParams[paramName] = (effectParams[paramName] || 0) + paramValue;
                }
              }
            });
          }
        });
      }

      console.log('\n✅ Effect parameters prepared for post-upscaling application:');
      console.log('   ', effectParams);
      console.log('   ℹ️ These will be applied to the image AFTER upscaling to preserve quality');
    } else {
      console.log('\nℹ️ No user customizations to apply (no effects or borders)');
    }

    console.log('\n🔍 IMAGE BUFFER DIAGNOSTIC BEFORE PRINTIFY:');
    console.log('   Buffer size being sent to Printify:', (imageBuffer.length / 1024).toFixed(2), 'KB');
    console.log('   This is the buffer that will be uploaded to Printify');

    console.log('\n🖨️ [PRINTIFY API] Creating product with auto-enhancement...');
    console.log('   Product Type:', productType);
    console.log('   Blueprint ID (actual):', actualBlueprintId);
    console.log('   Print Provider (actual):', actualPrintProviderId);
    console.log('   Image buffer size:', (imageBuffer.length / 1024).toFixed(2), 'KB');

    // Create product with auto-enhancement
    const productResult = await printifyService.createCustomProductWithBlueprintAndAutoEnhancement(
      imageBuffer,
      imageTitle || imageId,
      {
        title: productName,
        description: productDescription,
        tags: productTags,
        blueprintId: actualBlueprintId, // Use actual blueprint ID from request or config
        printProviderId: actualPrintProviderId, // Use actual provider ID from request or config
        basePrice: productConfig.basePrice,
        userId: userId,
        originalImageId: imageId,
        effectParams: effectParams // 🔥 Pass effect parameters for post-upscaling application (Issue #96)
      }
    );
    
    if (!productResult.success) {
      console.error('❌ [PRINTIFY API] Failed to create product:', productResult.error);
      return res.status(400).json({
        success: false,
        error: productResult.error
      });
    }

    console.log('\n✅ [PRINTIFY API] PRODUCT CREATED SUCCESSFULLY!');
    console.log('   Product ID:', productResult.productId);
    console.log('   Variants created:', productResult.variants?.length || 0);
    console.log('   Images uploaded:', productResult.images?.length || 0);
    if (productResult.imageEnhancement?.autoEnhanced) {
      console.log('   🔄 Image Auto-Enhanced: YES');
      console.log('      Enhancement Source:', productResult.imageEnhancement.enhancementSource);
    } else {
      console.log('   🔄 Image Auto-Enhanced: NO');
    }

    // Store product association with user INCLUDING variants and images
    console.log('\n💾 Storing product in Firebase database...');
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
    console.log('✅ Product stored in database');
    
    // Prepare response message with enhancement info
    let successMessage = `${productConfig.name} created successfully!`;
    if (productResult.imageEnhancement?.autoEnhanced) {
      successMessage += ` Image was automatically enhanced for better print quality.`;
    }

    console.log('\n📤 Sending response to client...');
    console.log('   Product ID:', productResult.productId);
    console.log('   Message:', successMessage);
    console.log('═'.repeat(80));
    console.log('✅ [OPERATION COMPLETE] Product successfully created and stored\n');

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

/**
 * POST /api/merchandise/create-payment-intent
 * Create Stripe payment intent for checkout
 * 🔥 NEW: Real Stripe payment processing
 */
router.post('/create-payment-intent', ensureAuthenticated, async (req, res) => {
  try {
    const { items, shippingAddress, shippingCost = 0 } = req.body;
    
    console.log('🔑 Creating payment intent for checkout');
    console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
    console.log('📦 Items received:', items);
    console.log('🏠 Shipping address:', shippingAddress);
    
    // Calculate order total including tax and shipping
    const orderTotal = stripePaymentService.calculateOrderTotal(items, shippingAddress, shippingCost);
    
    // Create payment intent
    const paymentIntent = await stripePaymentService.createPaymentIntent(
      orderTotal.total,
      'usd',
      {
        userId: req.user.uid,
        itemCount: items?.length || 0,
        subtotal: orderTotal.subtotal.toString(),
        taxAmount: orderTotal.taxAmount.toString(),
        shippingCost: orderTotal.shippingCost.toString()
      }
    );

    if (!paymentIntent.success) {
      return res.status(400).json(paymentIntent);
    }

    res.json({
      success: true,
      clientSecret: paymentIntent.clientSecret,
      paymentIntentId: paymentIntent.paymentIntentId,
      orderTotal: orderTotal
    });
    
  } catch (error) {
    console.error('❌ Error creating payment intent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create payment intent'
    });
  }
});

/**
 * POST /api/merchandise/confirm-payment
 * Confirm payment and create order after successful Stripe payment
 * 🔥 NEW: Complete payment flow with order creation
 */
router.post('/confirm-payment', ensureAuthenticated, async (req, res) => {
  try {
    const { paymentIntentId, items, shippingAddress } = req.body;
    
    console.log('✅ Confirming payment and creating order');
    console.log('📦 Items received:', JSON.stringify(items, null, 2));
    console.log('📮 Shipping address:', JSON.stringify(shippingAddress, null, 2));
    
    // Confirm payment with Stripe
    const paymentResult = await stripePaymentService.confirmPayment(paymentIntentId);
    
    if (!paymentResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Payment confirmation failed',
        details: paymentResult.error
      });
    }

    // Payment successful - create Printify order
    const printifyOrder = await printifyService.createOrder(items, shippingAddress);
    
    if (!printifyOrder.success) {
      console.error('❌ Order creation failed after successful payment:', printifyOrder.error);
      // Payment succeeded but order failed - this needs manual handling
      return res.status(500).json({
        success: false,
        error: 'Payment succeeded but order creation failed. Please contact support.',
        paymentId: paymentResult.paymentId
      });
    }

    // Store order in our database
    const userOrder = {
      orderId: printifyOrder.orderId,
      paymentId: paymentResult.paymentId,
      amount: paymentResult.amount,
      items: items,
      shippingAddress: shippingAddress,
      status: 'paid',
      createdAt: new Date().toISOString()
    };
    
    await merchandiseDB.storeUserOrder(req.user.uid, userOrder);

    // Send order confirmation email
    try {
      await emailService.sendOrderConfirmation(userOrder, req.user.email);
      console.log('✅ Order confirmation email sent successfully');
    } catch (emailError) {
      console.error('⚠️ Order confirmation email failed (order still successful):', emailError);
      // Don't fail the order if email fails
    }

    res.json({
      success: true,
      orderId: printifyOrder.orderId,
      paymentId: paymentResult.paymentId,
      amount: paymentResult.amount
    });
    
  } catch (error) {
    console.error('❌ Error confirming payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to confirm payment and create order'
    });
  }
});

/**
 * GET /api/merchandise/payment-health
 * Health check for Stripe payment integration
 * 🔧 UTILITY: Check Stripe connection status
 */
router.get('/payment-health', async (req, res) => {
  try {
    const healthCheck = await stripePaymentService.healthCheck();
    
    // Add Stripe public key for frontend initialization
    const response = {
      ...healthCheck,
      stripePublicKey: process.env.STRIPE_PUBLISHABLE_KEY
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Payment service health check failed'
    });
  }
});

/**
 * POST /api/merchandise/stripe-webhook
 * Stripe webhook endpoint for payment status updates
 * 🔔 ENHANCED: Real-time payment tracking and order management
 */
router.post('/stripe-webhook', async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    const payload = req.body;

    console.log('🔔 Stripe webhook received');

    // Verify webhook signature and parse event
    const webhookResult = stripePaymentService.verifyWebhookSignature(
      JSON.stringify(payload), 
      signature
    );

    if (!webhookResult.success) {
      console.error('❌ Webhook verification failed:', webhookResult.error);
      return res.status(400).json({
        success: false,
        error: 'Webhook verification failed'
      });
    }

    // Process the webhook event
    const eventResult = stripePaymentService.processWebhookEvent(webhookResult.event);

    if (!eventResult.success) {
      console.error('❌ Webhook processing failed:', eventResult.error);
      return res.status(500).json({
        success: false,
        error: 'Webhook processing failed'
      });
    }

    // Execute actions based on webhook event
    await executeWebhookActions(eventResult);

    res.json({ 
      success: true, 
      received: true,
      eventType: eventResult.eventType,
      actionsExecuted: eventResult.actions?.length || 0
    });

  } catch (error) {
    console.error('❌ Stripe webhook error:', error);
    res.status(500).json({
      success: false,
      error: 'Webhook processing failed'
    });
  }
});

/**
 * POST /api/merchandise/refund
 * Create refund for a payment
 * 🔧 ADMIN: Refund processing for customer service
 */
router.post('/refund', ensureAuthenticated, async (req, res) => {
  try {
    const { paymentIntentId, amount, reason = 'requested_by_customer' } = req.body;

    console.log(`💸 Processing refund request: ${paymentIntentId}`);

    // Create refund through Stripe
    const refundResult = await stripePaymentService.createRefund(
      paymentIntentId, 
      amount, 
      reason
    );

    if (!refundResult.success) {
      return res.status(400).json(refundResult);
    }

    // Update order status in database
    try {
      await merchandiseDB.updateOrderStatus(paymentIntentId, {
        status: 'refunded',
        refundId: refundResult.refundId,
        refundAmount: refundResult.amount,
        refundedAt: new Date().toISOString()
      });
    } catch (dbError) {
      console.warn('⚠️ Database update failed for refund:', dbError.message);
    }

    res.json({
      success: true,
      refundId: refundResult.refundId,
      amount: refundResult.amount,
      status: refundResult.status
    });

  } catch (error) {
    console.error('❌ Refund processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Refund processing failed'
    });
  }
});

// Helper functions

/**
 * Execute actions based on webhook events
 * 🔔 ENHANCED: Automated order management from Stripe webhooks
 */
async function executeWebhookActions(eventResult) {
  const { paymentIntentId, actions, status, amount } = eventResult;

  console.log(`🤖 Executing ${actions.length} actions for payment ${paymentIntentId}`);

  for (const action of actions) {
    try {
      switch (action) {
        case 'update_order_status_paid':
          await merchandiseDB.updateOrderStatus(paymentIntentId, {
            status: 'paid',
            paidAt: new Date().toISOString(),
            amount: amount
          });
          console.log(`✅ Order status updated to paid: ${paymentIntentId}`);
          break;

        case 'update_order_status_failed':
          await merchandiseDB.updateOrderStatus(paymentIntentId, {
            status: 'payment_failed',
            failedAt: new Date().toISOString()
          });
          console.log(`❌ Order status updated to failed: ${paymentIntentId}`);
          break;

        case 'update_order_status_canceled':
          await merchandiseDB.updateOrderStatus(paymentIntentId, {
            status: 'canceled',
            canceledAt: new Date().toISOString()
          });
          console.log(`🚫 Order status updated to canceled: ${paymentIntentId}`);
          break;

        case 'update_order_status_pending':
          await merchandiseDB.updateOrderStatus(paymentIntentId, {
            status: 'pending_action',
            pendingAt: new Date().toISOString()
          });
          console.log(`⏳ Order status updated to pending: ${paymentIntentId}`);
          break;

        case 'send_confirmation_email':
          // TODO: Implement email service
          console.log(`📧 Email confirmation queued for: ${paymentIntentId}`);
          break;

        case 'send_failure_email':
          // TODO: Implement email service
          console.log(`📧 Failure notification queued for: ${paymentIntentId}`);
          break;

        case 'send_action_required_email':
          // TODO: Implement email service
          console.log(`📧 Action required notification queued for: ${paymentIntentId}`);
          break;

        case 'trigger_fulfillment':
          // TODO: Trigger Printify fulfillment
          console.log(`📦 Fulfillment triggered for: ${paymentIntentId}`);
          break;

        case 'release_inventory':
          // TODO: Release inventory if applicable
          console.log(`📋 Inventory released for: ${paymentIntentId}`);
          break;

        case 'log_event':
          console.log(`📝 Event logged for: ${paymentIntentId}`);
          break;

        default:
          console.warn(`⚠️ Unknown action: ${action}`);
          break;
      }
    } catch (actionError) {
      console.error(`❌ Action failed: ${action}`, actionError.message);
    }
  }

  console.log(`✅ Completed ${actions.length} actions for ${paymentIntentId}`);
}

/**
 * Download image from S3 URL
 */
async function downloadImageFromS3(imageUrl) {
  try {
    // Handle relative URLs (e.g., /upscaled-images/...)
    // Convert to absolute URL using CDN_URL environment variable
    let fullUrl = imageUrl;
    if (imageUrl.startsWith('/')) {
      const cdnUrl = process.env.CDN_URL || 'http://localhost:3001';
      fullUrl = `${cdnUrl}${imageUrl}`;
    }

    console.log('📥 DOWNLOAD DIAGNOSTICS:');
    console.log('   Original imageUrl:', imageUrl);
    console.log('   Full URL:', fullUrl);
    console.log('   CDN_URL env:', process.env.CDN_URL || 'not set');
    
    const response = await axios.get(fullUrl, { 
      responseType: 'arraybuffer',
      timeout: 30000, // 30 second timeout
      maxContentLength: 10 * 1024 * 1024 // 10MB max
    });
    
    console.log('✅ DOWNLOAD SUCCESS:');
    console.log('   Response status:', response.status);
    console.log('   Content-Type:', response.headers['content-type']);
    console.log('   Content-Length:', response.headers['content-length']);
    console.log('   Data size:', response.data.length, 'bytes');
    
    const buffer = Buffer.from(response.data);
    console.log('   Buffer created:', Buffer.isBuffer(buffer), 'size:', buffer.length);
    
    // Validate the buffer contains valid image data
    if (buffer.length === 0) {
      throw new Error('Downloaded image is empty (0 bytes)');
    }
    
    // Quick image format check
    const imageType = getImageType(buffer);
    console.log('   Detected image type:', imageType);
    
    return buffer;
  } catch (error) {
    console.error('❌ DOWNLOAD ERROR:', error.message);
    console.error('   Error type:', error.constructor.name);
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response headers:', error.response.headers);
    }
    if (error.code) {
      console.error('   Error code:', error.code);
    }
    return null;
  }
}

/**
 * Quick image type detection from buffer header
 */
function getImageType(buffer) {
  if (!buffer || buffer.length < 12) return 'unknown';
  
  // Check magic bytes
  if (buffer[0] === 0xFF && buffer[1] === 0xD8) return 'JPEG';
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return 'PNG';
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) return 'GIF';
  if (buffer.slice(8, 12).toString() === 'WEBP') return 'WebP';
  
  return 'unknown';
}

/**
 * Process payment with Stripe integration
 * 🔥 ENHANCED: Real payment processing replacing mock functionality
 */
async function processPayment(paymentToken, lineItems, shippingAddress, shippingCost = 0) {
  console.log('🌊 WAVELENGTH: Processing real payment with Stripe');
  
  try {
    // Use Stripe payment service for real payment processing
    const paymentResult = await stripePaymentService.processPayment(
      paymentToken, 
      lineItems, 
      shippingAddress, 
      shippingCost
    );

    // Convert amount to cents for compatibility with existing code
    if (paymentResult.success && paymentResult.amount) {
      paymentResult.amountInCents = Math.round(paymentResult.amount * 100);
    }

    return paymentResult;
  } catch (error) {
    console.error('❌ Stripe payment processing error:', error);
    return {
      success: false,
      error: error.message || 'Payment processing failed'
    };
  }
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

    // Step 4: Prepare test product metadata
    const productTitle = `[TEST] ${selectedProduct.name} - ${randomImage.fileName}`;
    const productDescription = `Auto-generated test product for PERFECT PRINTING optimization pipeline testing. Product: ${selectedProduct.name}. Source image: ${randomImage.fileName}.`;
    const productKey = sanitizeFirebaseKey(`${selectedProduct.id}-${Date.now()}-test`);

    console.log(`🎨 Prepared test product: ${productTitle} (Key: ${productKey})`);

    try {

      // Step 5: Optimize image for this product
      console.log(`🎨 Optimizing image for product: ${selectedProduct.name}`);

      const optimizer = new ImageOptimizer();

      // Map product category to optimization spec key
      const specKey = mapCategoryToSpecKey(selectedProduct.category);
      console.log(`📋 Using spec key: ${specKey} (product category: ${selectedProduct.category})`);

      const result = await optimizer.optimizeForProduct(imageBuffer, specKey);
      console.log(`✅ Optimization complete - Strategy: ${result.analysis.action}`);

      // Record optimization analytics
      console.log(`📊 Recording optimization analytics...`);
      cacheAnalytics.recordOptimization(selectedProduct.id, {
        processingTime: result.processingTime,
        scaleFactor: result.analysis.scaleFactor || 1.0,
        costEstimate: result.analysis.action === 'upscale' ? 0.08 : 0,
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
            message: `Optimization ${result.optimized ? 'applied' : 'not needed'}`,
            strategy: result.analysis.action,
            scaleFactor: result.analysis.scaleFactor || 1.0,
            processingTime: result.processingTime,
            originalSize: imageBuffer.length,
            optimizedSize: result.optimizedBuffer ? result.optimizedBuffer.length : imageBuffer.length,
            estimatedCost: result.analysis.action === 'upscale' ? 0.08 : 0
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

/**
 * PRODUCT PREVIEW HARNESS - PERFECT PRINTING
 * Demonstrates optimized images on actual vendor products
 * Complete workflow: Optimization → Product Creation → Vendor Preview
 */

/**
 * POST /api/merchandise/preview-harness/optimize-and-preview
 *
 * Runs complete workflow:
 * 1. Selects random gallery image
 * 2. Selects random product type
 * 3. Optimizes image for that product
 * 4. Generates vendor preview showing image on product mockup
 * 5. Returns preview URLs and product details
 */
router.post('/preview-harness/optimize-and-preview', ensureAuthenticated, groupAuth.requireAction('game_access'), async (req, res) => {
  try {
    console.log('🎨 PREVIEW HARNESS: optimize-and-preview endpoint called');

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

    // Step 4: Optimize image for this product
    console.log(`🎨 Optimizing image for product: ${selectedProduct.name}`);

    const optimizer = new ImageOptimizer();
    const specKey = mapCategoryToSpecKey(selectedProduct.category);
    console.log(`📋 Using spec key: ${specKey} (product category: ${selectedProduct.category})`);

    const optimizationResult = await optimizer.optimizeForProduct(imageBuffer, specKey);
    console.log(`✅ Optimization complete - Strategy: ${optimizationResult.analysis.action}`);

    // Record optimization analytics
    console.log(`📊 Recording optimization analytics...`);
    cacheAnalytics.recordOptimization(selectedProduct.id, {
      processingTime: optimizationResult.processingTime,
      scaleFactor: optimizationResult.analysis.scaleFactor || 1.0,
      costEstimate: optimizationResult.analysis.action === 'upscale' ? 0.08 : 0,
      testRun: true
    }).catch(err => {
      console.warn(`❌ Failed to record optimization analytics:`, err.message);
    });

    // Step 5: Create vendor preview with optimized image
    console.log(`🎬 Creating vendor preview with optimized image...`);

    try {
      const VendorPreviewHelper = require('../utils/vendor-preview-helper');
      const previewHelper = new VendorPreviewHelper();

      // For preview purposes, we'll use a simulated vendor preview
      // In production, this would call the actual Printify API or cached vendor data
      const previewProductId = sanitizeFirebaseKey(`preview-${selectedProduct.id}-${Date.now()}`);

      const vendorPreviewData = {
        product: {
          productId: previewProductId,
          title: `[PREVIEW] ${selectedProduct.name}`,
          description: `Optimized preview of ${selectedProduct.name} with Wavelength artwork`,
          type: selectedProduct.category,
          vendor: selectedProduct.provider,
          blueprintId: selectedProduct.blueprintId,
          printProviderId: selectedProduct.printProviderId
        },
        variants: [
          {
            id: 'variant-1',
            title: 'Standard',
            color: 'Black',
            size: 'M',
            price: 2999,
            image: randomImage.url
          }
        ],
        printArea: {
          width: 10,
          height: 12,
          unit: 'inches'
        }
      };

      const previewMetadata = {
        enhancedImageUrl: randomImage.url, // In production, this would be the optimized image
        originalImageUrl: randomImage.url,
        imageSize: imageBuffer.length,
        optimizationStrategy: optimizationResult.analysis.action,
        scaleFactor: optimizationResult.analysis.scaleFactor || 1.0,
        createdAt: new Date().toISOString(),
        sourceImage: randomImage.fileName,
        sourceProduct: selectedProduct.name,
        sourceUser: userId
      };

      // Store the vendor preview
      await previewHelper.storeVendorPreview(vendorPreviewData, previewMetadata);
      console.log(`✅ Vendor preview created: ${previewProductId}`);

      // Return comprehensive preview data
      res.json({
        success: true,
        message: 'Preview harness completed successfully',
        preview_workflow: {
          timestamp: new Date().toISOString(),
          userId: userId,
          userName: userName,

          // Original image selection
          selected_image: {
            name: randomImage.fileName,
            url: randomImage.url,
            size: imageBuffer.length,
            type: randomImage.type,
            dimensions: randomImage.dimensions
          },

          // Product selection
          selected_product: {
            id: selectedProduct.id,
            name: selectedProduct.name,
            category: selectedProduct.category,
            blueprint: selectedProduct.blueprintId,
            provider: selectedProduct.provider
          },

          // Optimization results
          optimization_result: {
            message: `Optimization ${optimizationResult.optimized ? 'applied' : 'not needed'}`,
            strategy: optimizationResult.analysis.action,
            scaleFactor: optimizationResult.analysis.scaleFactor || 1.0,
            processingTime: optimizationResult.processingTime,
            originalSize: imageBuffer.length,
            optimizedSize: optimizationResult.optimizedBuffer ? optimizationResult.optimizedBuffer.length : imageBuffer.length,
            estimatedCost: optimizationResult.analysis.action === 'upscale' ? 0.08 : 0
          },

          // Vendor preview details
          vendor_preview: {
            previewProductId: previewProductId,
            title: vendorPreviewData.product.title,
            vendor: vendorPreviewData.product.vendor,
            printArea: vendorPreviewData.printArea,
            viewUrl: `/api/merchandise/vendor-preview/${previewProductId}`,
            metadata: {
              optimizationStrategy: previewMetadata.optimizationStrategy,
              scaleFactor: previewMetadata.scaleFactor,
              createdAt: previewMetadata.createdAt
            }
          },

          // Quick actions
          actions: {
            viewPreview: `/api/merchandise/vendor-preview/${previewProductId}`,
            runAnotherTest: '/merchandise/preview-harness'
          }
        }
      });

    } catch (error) {
      console.error('❌ Error creating vendor preview:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create vendor preview',
        details: error.message,
        optimization_completed: true,
        message: 'Image was optimized successfully, but vendor preview generation failed'
      });
    }

  } catch (error) {
    console.error('❌ Preview harness error:', error);
    res.status(500).json({
      success: false,
      error: 'Preview harness failed',
      details: error.message
    });
  }
});

/**
 * GET /api/merchandise/preview-harness/status
 * Check preview harness status and capabilities
 */
router.get('/preview-harness/status', (req, res) => {
  res.json({
    success: true,
    message: 'Preview harness is available',
    capabilities: {
      'POST /api/merchandise/preview-harness/optimize-and-preview': {
        description: 'Complete workflow: optimize image + create vendor preview',
        requires: 'Authentication + game_access permission',
        prerequisites: 'User must have at least one image in their gallery',
        outputs: [
          'Optimized image details',
          'Vendor preview product ID',
          'Preview view URL',
          'Analytics data'
        ]
      }
    },
    workflow: [
      '1. Select random gallery image (uploads + bookmarks)',
      '2. Select random product type from 142 products',
      '3. Optimize image for product specifications',
      '4. Generate vendor preview with optimized image',
      '5. Store preview in Firebase',
      '6. Return preview URLs and product mockup details'
    ],
    note: 'This harness demonstrates the complete PERFECT PRINTING workflow from image optimization through vendor product previews'
  });
});

/**
 * GET /merchandise/preview-harness
 * Render the Product Preview Harness UI
 */
router.get('/preview-harness', ensureAuthenticated, groupAuth.requireAction('game_access'), async (req, res) => {
  try {
    res.render('preview-harness', {
      title: 'PERFECT PRINTING Product Preview Harness',
      pageTitle: 'Product Preview Harness',
      pageDescription: 'View optimized images on vendor product mockups',
      user: req.user,
      cdnUrl: process.env.CDN_URL,
      version: `v${Date.now()}`
    });
  } catch (error) {
    console.error('Error rendering preview harness:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Unable to load preview harness',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

/**
 * GET /api/merchandise/templates-list
 * Get list of available product templates for OpenAI upscaler testing
 */
router.get('/templates-list', (req, res) => {
  try {
    const productTemplates = require('../config/productTemplates');

    // Convert templates object to array format for UI
    const templates = Object.values(productTemplates).map(template => ({
      id: template.id,
      name: template.name,
      category: template.category,
      description: template.description,
      imageOptimization: template.imageOptimization,
      userMessages: template.userMessages,
      printify: template.printify
    }));

    res.json({
      success: true,
      templates: templates,
      totalCount: templates.length
    });

  } catch (error) {
    console.error('❌ Templates list error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch templates list',
      details: error.message,
      templates: []
    });
  }
});

/**
 * GET /api/merchandise/gallery-list
 * Get list of user's gallery images for selection
 */
router.get('/gallery-list', ensureAuthenticated, groupAuth.requireAction('game_access'), async (req, res) => {
  try {
    const userId = req.user.uid;

    console.log(`\n📁 Fetching gallery list for user: ${userId}`);

    // Get S3 uploaded images
    const s3Images = await galleryStorage.listUserGalleryImages(userId);
    console.log(`📊 S3 images found: ${s3Images.length}`);

    // Get Firebase bookmarks
    const bookmarks = await getUserBookmarks(userId);
    console.log(`📊 Firebase bookmarks found: ${bookmarks.length}`);

    // Combine both sources
    const allGalleryImages = [...s3Images, ...bookmarks];

    if (allGalleryImages.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No gallery images found',
        images: []
      });
    }

    // Format images for UI dropdown
    const formattedImages = allGalleryImages.map((img, index) => ({
      id: img.id || img._id || img.bookmarkId || index,
      name: img.name || img.title || img.alt || `Image ${index + 1}`,
      url: img.url || img.imageUrl,
      source: img.url && img.url.includes('s3') ? 'S3' : 'Firebase'
    }));

    res.json({
      success: true,
      images: formattedImages,
      totalCount: allGalleryImages.length
    });

  } catch (error) {
    console.error('❌ Gallery list error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch gallery list',
      details: error.message,
      images: []
    });
  }
});

/**
 * POST /api/merchandise/openai-upscaler/test
 * Test OpenAI upscaler with a gallery image
 * Fetches image server-side from Firebase/S3 by ID
 */
router.post('/openai-upscaler/test', ensureAuthenticated, groupAuth.requireAction('game_access'), async (req, res) => {
  try {
    // Verify database is ready
    if (!ensureDatabaseReady(res)) return;

    const userId = req.user.uid;
    const imageId = req.body.imageId;
    const targetWidth = parseInt(req.body.targetWidth) || 3000;
    const targetHeight = parseInt(req.body.targetHeight) || 3600;

    if (!imageId) {
      return res.status(400).json({
        success: false,
        error: 'Missing imageId',
        details: 'Please provide a valid gallery image ID'
      });
    }

    console.log(`\n🤖 OpenAI Upscaler Test Started`);
    console.log(`📁 User ID: ${userId}`);
    console.log(`📁 Image ID: ${imageId}`);
    console.log(`📏 Target: ${targetWidth}x${targetHeight}px`);

    // Fetch image from gallery by ID (server-side)
    console.log(`📊 Fetching image from gallery...`);
    const s3Images = await galleryStorage.listUserGalleryImages(userId);
    const bookmarks = await getUserBookmarks(userId);
    const allGalleryImages = [...s3Images, ...bookmarks];

    // Find image by ID or index
    let imageUrl;
    let imageName;
    let selectedImage;

    // Try to match by ID first
    selectedImage = allGalleryImages.find(img =>
      img.id === imageId ||
      img._id === imageId ||
      img.bookmarkId === imageId
    );

    // If not found by ID, try by index (imageId might be numeric)
    if (!selectedImage && !isNaN(imageId)) {
      selectedImage = allGalleryImages[parseInt(imageId)];
    }

    if (!selectedImage) {
      return res.status(404).json({
        success: false,
        error: 'Image not found',
        details: `Could not find gallery image with ID: ${imageId}`
      });
    }

    // Get image URL from selected image
    if (selectedImage.url && selectedImage.url.includes('s3.amazonaws.com')) {
      imageUrl = selectedImage.url;
      imageName = selectedImage.name || 'gallery-image';
    } else if (selectedImage.imageUrl) {
      imageUrl = selectedImage.imageUrl;
      imageName = selectedImage.title || selectedImage.alt || 'gallery-image';
    } else if (selectedImage.url) {
      imageUrl = selectedImage.url;
      imageName = selectedImage.title || selectedImage.name || 'gallery-image';
    } else {
      return res.status(400).json({
        success: false,
        error: 'No valid image URL',
        details: 'Selected gallery image has no accessible URL'
      });
    }

    console.log(`✅ Found image: ${imageName}`);
    console.log(`📥 Downloading from: ${imageUrl.substring(0, 50)}...`);

    // Download image from URL (server-side)
    const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(imageResponse.data);
    const imageSize = imageBuffer.length;

    console.log(`✅ Downloaded: ${(imageSize / 1024).toFixed(2)} KB`);

    const startTime = Date.now();

    // Use the full upscaling service with Global Image Cache support
    const ImageUpscalingService = require('../services/image-upscaling-service');
    const upscalingService = new ImageUpscalingService();

    console.log(`📊 Upscaling with cache support...`);

    let upscaledResult;
    let upscaledBuffer;
    try {
      upscaledResult = await upscalingService.upscaleImage(
        imageBuffer,
        {
          method: 'openai',
          contentType: 'photo',
          originalDimensions: { width: 100, height: 100 },
          targetDimensions: { width: targetWidth, height: targetHeight }
        }
      );

      if (!upscaledResult.success) {
        throw new Error(upscaledResult.error || 'Upscaling failed');
      }

      console.log(`✅ Upscaling succeeded (Method: ${upscaledResult.method})`);
      upscaledBuffer = upscaledResult.upscaledBuffer;
    } catch (error) {
      console.error(`❌ Upscaling failed:`, error.message);
      throw error;
    }

    const duration = Date.now() - startTime;

    console.log(`✅ Test completed in ${duration}ms`);

    // Save upscaled image to public directory
    console.log(`💾 Saving upscaled image...`);
    const path = require('path');
    const fs = require('fs').promises;

    // Create upscaled-images directory if it doesn't exist
    const upscaledDir = path.join(__dirname, '../public/upscaled-images');
    try {
      await fs.mkdir(upscaledDir, { recursive: true });
    } catch (mkdirError) {
      console.warn(`⚠️ Could not create upscaled-images directory:`, mkdirError.message);
    }

    // Generate unique filename with timestamp and user ID
    const timestamp = Date.now();
    const upscaledFilename = `upscaled-${userId}-${timestamp}.jpg`;
    const upscaledFilepath = path.join(upscaledDir, upscaledFilename);

    try {
      await fs.writeFile(upscaledFilepath, upscaledBuffer);
      console.log(`✅ Saved: ${upscaledFilename}`);
    } catch (saveError) {
      console.error(`⚠️ Could not save upscaled image:`, saveError.message);
      // Continue anyway - return response with or without upscaled image URL
    }

    // Generate viewable URL
    const upscaledImageUrl = `/upscaled-images/${upscaledFilename}`;

    // Return success
    const scaleFactor = Math.max(targetWidth / 100, targetHeight / 100);
    res.json({
      success: true,
      message: 'OpenAI upscaling test completed successfully',
      analysis: {
        action: 'upscale',
        scaleFactor: scaleFactor,
        processingTime: duration,
        originalSize: imageSize,
        targetDimensions: { width: targetWidth, height: targetHeight }
      },
      metadata: {
        imageId: imageId,
        imageName: imageName,
        imageUrl: imageUrl,
        upscaledImageUrl: upscaledImageUrl,
        upscalerUsed: upscaledResult.method || 'openai',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ OpenAI upscaler test error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data || error.message
    });
  }
});

/**
 * POST /api/merchandise/openai-upscaler/test-batch
 * Test OpenAI upscaler with a random gallery image
 * Used for batch testing mode
 */
router.post('/openai-upscaler/test-batch', ensureAuthenticated, groupAuth.requireAction('game_access'), async (req, res) => {
  try {
    // Verify database is ready
    if (!ensureDatabaseReady(res)) return;

    const userId = req.user.uid;
    const targetWidth = parseInt(req.body.targetWidth) || 3000;
    const targetHeight = parseInt(req.body.targetHeight) || 3600;

    console.log(`\n🤖 OpenAI Upscaler Batch Test Started`);
    console.log(`📁 User ID: ${userId}`);

    // Fetch gallery images
    const s3Images = await galleryStorage.listUserGalleryImages(userId);
    const bookmarks = await getUserBookmarks(userId);
    const allGalleryImages = [...s3Images, ...bookmarks];

    if (allGalleryImages.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No gallery images found',
        details: 'User has no images to test'
      });
    }

    // Select random image
    const randomIndex = Math.floor(Math.random() * allGalleryImages.length);
    const selectedImage = allGalleryImages[randomIndex];

    console.log(`✅ Selected random image (${randomIndex + 1}/${allGalleryImages.length})`);

    // Get image URL
    let imageUrl;
    let imageName;

    if (selectedImage.url && selectedImage.url.includes('s3.amazonaws.com')) {
      imageUrl = selectedImage.url;
      imageName = selectedImage.name || 'gallery-image';
    } else if (selectedImage.imageUrl) {
      imageUrl = selectedImage.imageUrl;
      imageName = selectedImage.title || 'gallery-image';
    } else if (selectedImage.url) {
      imageUrl = selectedImage.url;
      imageName = selectedImage.name || selectedImage.title || 'gallery-image';
    } else {
      return res.status(400).json({
        success: false,
        error: 'No valid image URL',
        details: 'Could not find accessible URL for selected image'
      });
    }

    console.log(`📁 Image: ${imageName}`);

    // Download image from URL (server-side)
    const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(imageResponse.data);
    const imageSize = imageBuffer.length;

    console.log(`✅ Downloaded: ${(imageSize / 1024).toFixed(2)} KB`);

    const startTime = Date.now();

    // Create analysis object
    const analysis = {
      originalDimensions: { width: 100, height: 100 },
      targetDimensions: { width: targetWidth, height: targetHeight },
      action: 'upscale',
      scaleFactor: Math.max(targetWidth / 100, targetHeight / 100),
      currentFormat: 'jpeg'
    };

    // Call OpenAI upscaler
    const optimizer = new ImageOptimizer();
    const upscaledBuffer = await optimizer.upscaleWithOpenAI(imageBuffer, analysis);

    const duration = Date.now() - startTime;

    console.log(`✅ Test completed in ${duration}ms`);

    // Save upscaled image to public directory
    console.log(`💾 Saving upscaled image...`);
    const path = require('path');
    const fs = require('fs').promises;

    // Create upscaled-images directory if it doesn't exist
    const upscaledDir = path.join(__dirname, '../public/upscaled-images');
    try {
      await fs.mkdir(upscaledDir, { recursive: true });
    } catch (mkdirError) {
      console.warn(`⚠️ Could not create upscaled-images directory:`, mkdirError.message);
    }

    // Generate unique filename with timestamp and user ID
    const timestamp = Date.now();
    const upscaledFilename = `upscaled-${userId}-${timestamp}.jpg`;
    const upscaledFilepath = path.join(upscaledDir, upscaledFilename);

    try {
      await fs.writeFile(upscaledFilepath, upscaledBuffer);
      console.log(`✅ Saved: ${upscaledFilename}`);
    } catch (saveError) {
      console.error(`⚠️ Could not save upscaled image:`, saveError.message);
      // Continue anyway - return response with or without upscaled image URL
    }

    // Generate viewable URL
    const upscaledImageUrl = `/upscaled-images/${upscaledFilename}`;

    // Return success
    res.json({
      success: true,
      message: 'Batch test completed successfully',
      analysis: {
        action: 'upscale',
        scaleFactor: analysis.scaleFactor,
        processingTime: duration,
        originalSize: imageSize,
        targetDimensions: analysis.targetDimensions
      },
      metadata: {
        imageName: imageName,
        imageUrl: imageUrl,
        upscaledImageUrl: upscaledImageUrl,
        upscalerUsed: 'openai',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Batch test error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data || error.message
    });
  }
});

/**
 * POST /api/merchandise/openai-upscaler/apply-effects
 * Apply visual effects to upscaled images
 * Supports color grading, lighting, and special effects
 */
router.post('/openai-upscaler/apply-effects', ensureAuthenticated, groupAuth.requireAction('game_access'), async (req, res) => {
  try {
    // Verify database is ready
    if (!ensureDatabaseReady(res)) return;

    const userId = req.user.uid;
    const { upscaledImageUrl, effectsPreset, effectParams } = req.body;

    if (!upscaledImageUrl) {
      return res.status(400).json({
        success: false,
        error: 'Missing upscaledImageUrl',
        details: 'Please provide URL of upscaled image to apply effects to'
      });
    }

    console.log(`\n🎨 Applying Effects`);
    console.log(`📁 User ID: ${userId}`);
    console.log(`📷 Image URL: ${upscaledImageUrl.substring(0, 50)}...`);
    console.log(`🎭 Preset: ${effectsPreset || 'custom'}`);

    // Download the upscaled image from local storage
    let imageUrl = upscaledImageUrl;

    // Handle relative URLs
    if (upscaledImageUrl.startsWith('/')) {
      imageUrl = `http://localhost:${process.env.PORT || 3001}${upscaledImageUrl}`;
    }

    console.log(`📥 Downloading image from: ${imageUrl}`);

    const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(imageResponse.data);
    const imageSize = imageBuffer.length;

    console.log(`✅ Downloaded: ${(imageSize / 1024).toFixed(2)} KB`);

    // Prepare effect parameters from enabled toggles
    const EffectsProcessor = require('../services/EffectsProcessor');
    const effectsProcessor = new EffectsProcessor();
    const effectsConfig = require('../config/effectsConfig');

    // Log received effect params for debugging
    console.log(`📥 Received effectParams:`, JSON.stringify(effectParams || {}, null, 2));

    // Build effects from enabled toggles
    const finalEffectParams = effectsConfig.buildEffectsFromToggles(effectParams || {});

    console.log(`📊 Final effects:`, finalEffectParams);

    const startTime = Date.now();

    // Process image with effects
    let processedBuffer;
    try {
      processedBuffer = await effectsProcessor.processImage(imageBuffer, finalEffectParams);
      console.log(`✅ Effects processing succeeded`);
    } catch (error) {
      console.error(`❌ Effects processing failed:`, error.message);
      throw error;
    }

    const duration = Date.now() - startTime;

    // Save processed image
    console.log(`💾 Saving processed image...`);
    const effectHash = effectsProcessor.generateEffectHash(finalEffectParams);
    const baseName = `customized-${userId}-${effectHash}`;

    let saveResult;
    try {
      saveResult = await effectsProcessor.saveProcessedImage(processedBuffer, baseName);
      console.log(`✅ Saved: ${saveResult.filename}`);
    } catch (saveError) {
      console.error(`⚠️ Could not save processed image:`, saveError.message);
      // Continue anyway - return response with buffer if save fails
      saveResult = null;
    }

    console.log(`✅ Effects applied in ${duration}ms`);

    // Return success
    res.json({
      success: true,
      message: 'Effects applied successfully',
      analysis: {
        effectsPreset: effectsPreset || 'custom',
        processingTime: duration,
        originalSize: imageSize,
        processedSize: processedBuffer.length
      },
      metadata: {
        originalUrl: upscaledImageUrl,
        effectParams: finalEffectParams,
        customizedImageUrl: saveResult ? saveResult.url : null,
        customizedImagePath: saveResult ? saveResult.path : null,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Apply effects error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data || error.message
    });
  }
});

/**
 * GET /api/merchandise/openai-upscaler/effects-list
 * Get available effects and categories
 */
router.get('/openai-upscaler/effects-list', (req, res) => {
  try {
    const effectsConfig = require('../config/effectsConfig');

    res.json({
      success: true,
      categories: effectsConfig.categories,
      effectTypes: effectsConfig.effectTypes,
      totalEffects: Object.keys(effectsConfig.effectTypes).length
    });
  } catch (error) {
    console.error('❌ Error loading effects list:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/merchandise/openai-upscaler/border-options
 * Get available border colors and widths for merchandise customization
 */
router.get('/openai-upscaler/border-options', (req, res) => {
  try {
    const effectsConfig = require('../config/effectsConfig');
    const { borderConfig } = effectsConfig;

    res.json({
      success: true,
      borderEnabled: borderConfig.enabled,
      colors: borderConfig.colors,
      widths: borderConfig.widths,
      totalColors: borderConfig.colors.length,
      totalWidths: borderConfig.widths.length
    });
  } catch (error) {
    console.error('❌ Error loading border options:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /merchandise/openai-upscaler
 * Render the OpenAI Upscaler Test Harness UI
 */
router.get('/openai-upscaler', ensureAuthenticated, groupAuth.requireAction('game_access'), async (req, res) => {
  try {
    res.render('openai-upscaler-harness', {
      title: 'OpenAI Upscaler Test Harness',
      pageTitle: 'OpenAI Upscaler Harness',
      pageDescription: 'Test and debug OpenAI image upscaling',
      user: req.user,
      cdnUrl: process.env.CDN_URL,
      version: `v${Date.now()}`
    });
  } catch (error) {
    console.error('Error rendering OpenAI upscaler harness:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Unable to load OpenAI upscaler harness',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

/**
 * GET /api/merchandise/gallery-random-image
 * Get a random image from user's gallery (S3 uploads + Firebase bookmarks)
 */
router.get('/gallery-random-image', ensureAuthenticated, groupAuth.requireAction('game_access'), async (req, res) => {
  try {
    const userId = req.user.uid;

    console.log(`\n📁 Fetching random gallery image for user: ${userId}`);

    // Get S3 uploaded images
    const s3Images = await galleryStorage.listUserGalleryImages(userId);
    console.log(`📊 S3 images found: ${s3Images.length}`);

    // Get Firebase bookmarks
    const bookmarks = await getUserBookmarks(userId);
    console.log(`📊 Firebase bookmarks found: ${bookmarks.length}`);

    // Combine both sources
    const allGalleryImages = [...s3Images, ...bookmarks];

    if (allGalleryImages.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No gallery images found',
        details: 'User has no S3 uploads or bookmarked images'
      });
    }

    // Select random image
    const randomIndex = Math.floor(Math.random() * allGalleryImages.length);
    const randomImage = allGalleryImages[randomIndex];

    console.log(`✅ Selected random image: ${randomImage.name || randomImage.title}`);

    // Determine the source and get proper URL
    let imageUrl;
    let imageName;
    let imageSize;

    if (randomImage.url && randomImage.url.includes('s3.amazonaws.com')) {
      // S3 image
      imageUrl = randomImage.url;
      imageName = randomImage.name || 'gallery-image.jpg';
      imageSize = randomImage.size ? (randomImage.size / 1024).toFixed(2) : 'unknown';
    } else if (randomImage.imageUrl) {
      // Firebase bookmark
      imageUrl = randomImage.imageUrl;
      imageName = randomImage.title || randomImage.alt || 'gallery-image.jpg';
      imageSize = 'unknown';
    } else if (randomImage.url) {
      // Generic image with URL
      imageUrl = randomImage.url;
      imageName = randomImage.title || randomImage.name || 'gallery-image.jpg';
      imageSize = 'unknown';
    } else {
      throw new Error('No valid image URL found in gallery');
    }

    res.json({
      success: true,
      imageName,
      imageUrl,
      size: imageSize,
      source: imageUrl.includes('s3') ? 'S3' : 'Firebase',
      totalImages: allGalleryImages.length
    });

  } catch (error) {
    console.error('❌ Gallery API error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch gallery image',
      details: error.message
    });
  }
});

/**
 * GET /api/merchandise/openai-upscaler/status
 * Get OpenAI upscaler configuration and status
 */
router.get('/openai-upscaler/status', (req, res) => {
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY;

  res.json({
    title: 'OpenAI Upscaler Status',
    status: hasOpenAIKey ? 'ready' : 'not-configured',
    configured: hasOpenAIKey,
    features: {
      'Vision API Analysis': true,
      'Sharpening Enhancement': true,
      'Cubic Interpolation': true,
      'Saturation Boost': true
    },
    endpoints: {
      'POST /api/merchandise/openai-upscaler/test': {
        description: 'Test OpenAI upscaling with a single image',
        requires: 'Authentication + game_access permission',
        parameters: {
          image: 'Binary image file',
          targetWidth: 'Target width in pixels (default: 3000)',
          targetHeight: 'Target height in pixels (default: 3600)'
        }
      },
      'GET /api/merchandise/openai-upscaler/status': {
        description: 'Get OpenAI upscaler configuration status'
      }
    },
    note: 'This harness helps debug OpenAI API integration and test upscaling quality'
  });
});

/**
 * POST /api/merchandise/generate-printify-mockup
 *
 * Generates a Printify product mockup with the customized artwork
 * This creates a product on Printify that shows the artwork on the actual merchandise
 *
 * Request body:
 * {
 *   customizedImageUrl: string - URL to the customized artwork image
 *   productId: string - Blueprint product ID (e.g., "70-999")
 *   productTitle: string - Title for the product
 *   blueprintId: string - Printify blueprint ID
 *   printProviderId: string - Printify print provider ID
 * }
 */
router.post('/generate-printify-mockup', ensureAuthenticated, groupAuth.requireAction('game_access'), async (req, res) => {
  try {
    console.log('🎨 MOCKUP GENERATION: Starting Printify mockup creation');

    const {
      customizedImageUrl,
      productId,
      productTitle,
      blueprintId,
      printProviderId
    } = req.body;

    // Validate required fields
    if (!customizedImageUrl || !productId || !blueprintId || !printProviderId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: customizedImageUrl, productId, blueprintId, printProviderId'
      });
    }

    console.log(`📥 Downloading customized image from: ${customizedImageUrl}`);

    // Download the customized image from the URL
    const imageResponse = await axios.get(customizedImageUrl, {
      responseType: 'arraybuffer',
      timeout: 30000
    });

    const imageBuffer = Buffer.from(imageResponse.data);
    console.log(`✅ Image downloaded: ${(imageBuffer.length / 1024).toFixed(2)} KB`);

    // Create the Printify product with the customized image
    console.log(`🖼️  Creating Printify product with blueprint ${blueprintId}`);

    const mockupResult = await printifyService.createCustomProductWithBlueprintAndAutoEnhancement(
      imageBuffer,
      `customized-${productId}-${Date.now()}.webp`,
      {
        title: productTitle || `Custom Wavelength Merchandise - ${productId}`,
        description: 'Custom merchandise created with Wavelength effects and customization',
        blueprintId: blueprintId,
        printProviderId: printProviderId,
        tags: ['wavelength', 'custom', 'effects'],
        basePrice: 2099,
        userId: req.user.uid,
        originalImageId: productId
      }
    );

    if (!mockupResult.success) {
      console.error('❌ Printify product creation failed:', mockupResult.error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create Printify mockup: ' + mockupResult.error
      });
    }

    console.log('✅ Printify product created successfully');
    console.log(`   Product ID: ${mockupResult.productId}`);
    console.log(`   Variants: ${mockupResult.variants?.length || 0}`);

    // Return the mockup details
    res.json({
      success: true,
      mockup: {
        productId: mockupResult.productId,
        title: mockupResult.title,
        variants: mockupResult.variants,
        images: mockupResult.images,
        tags: mockupResult.tags,
        uploadedImage: mockupResult.uploadedImage,
        imageEnhancement: mockupResult.imageEnhancement
      }
    });

  } catch (error) {
    console.error('❌ Error generating Printify mockup:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate mockup: ' + (error.message || 'Unknown error')
    });
  }
});

/**
 * GET /my-orders
 * User order history page
 * 📦 USER FEATURE: View personal order history and status
 */
router.get('/my-orders', ensureAuthenticated, async (req, res) => {
  try {
    res.render('my-orders', {
      title: 'My Orders',
      pageTitle: 'My Orders',
      pageDescription: 'View your Wavelength Lore merchandise order history',
      user: req.user,
      cdnUrl: process.env.CDN_URL,
      version: `v${Date.now()}`
    });
  } catch (error) {
    console.error('Error rendering my-orders page:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Unable to load order history',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

/**
 * GET /api/merchandise/my-orders
 * Get current user's order history
 * 📦 USER API: Fetch personal order data
 */
router.get('/api/my-orders', ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.user.uid;
    const userOrders = await merchandiseDB.getUserOrders(userId);
    
    res.json({
      success: true,
      orders: userOrders || [],
      count: userOrders?.length || 0
    });
  } catch (error) {
    console.error('❌ Error fetching user orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user orders'
    });
  }
});

/**
 * GET /admin/orders
 * Admin order management dashboard
 * 🛡️ ADMIN ONLY: Order management interface
 */
router.get('/admin/orders', ensureAuthenticated, groupAuth.requireAction('admin_access'), async (req, res) => {
  try {
    res.render('admin-orders', {
      title: 'Order Management',
      pageTitle: 'Order Management',
      pageDescription: 'Manage all Wavelength Lore merchandise orders',
      user: req.user,
      cdnUrl: process.env.CDN_URL,
      version: `v${Date.now()}`
    });
  } catch (error) {
    console.error('Error rendering admin orders page:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Unable to load admin order management',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

/**
 * GET /api/merchandise/admin/all-orders
 * Get all orders for admin management
 * 🛡️ ADMIN API: Fetch all order data
 */
router.get('/api/admin/all-orders', ensureAuthenticated, groupAuth.requireAction('admin_access'), async (req, res) => {
  try {
    const allOrders = await merchandiseDB.getAllOrders();
    
    res.json({
      success: true,
      orders: allOrders || [],
      count: allOrders?.length || 0
    });
  } catch (error) {
    console.error('❌ Error fetching all orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders'
    });
  }
});

/**
 * GET /api/merchandise/admin/order/:orderId
 * Get specific order details for admin
 * 🛡️ ADMIN API: Fetch single order data
 */
router.get('/api/admin/order/:orderId', ensureAuthenticated, groupAuth.requireAction('admin_access'), async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await merchandiseDB.getOrderById(orderId);
    
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
    console.error('❌ Error fetching order details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order details'
    });
  }
});

/**
 * PUT /api/merchandise/admin/order/:orderId/status
 * Update order status
 * 🛡️ ADMIN API: Update order status
 */
router.put('/api/admin/order/:orderId/status', ensureAuthenticated, groupAuth.requireAction('admin_access'), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['paid', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }
    
    await merchandiseDB.updateOrderStatus(orderId, { status, updatedAt: new Date().toISOString() });
    
    res.json({
      success: true,
      message: 'Order status updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating order status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update order status'
    });
  }
});

/**
 * GET /support
 * Customer support page
 * 📞 SUPPORT: Customer support form and help center
 */
router.get('/support', async (req, res) => {
  try {
    res.render('support', {
      title: 'Customer Support',
      pageTitle: 'Customer Support',
      pageDescription: 'Get help with your Wavelength Lore orders and questions',
      user: req.user,
      cdnUrl: process.env.CDN_URL,
      version: `v${Date.now()}`
    });
  } catch (error) {
    console.error('Error rendering support page:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Unable to load support page',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

/**
 * POST /api/support/ticket
 * Create support ticket
 * 📞 SUPPORT API: Submit customer support request
 */
router.post('/api/support/ticket', async (req, res) => {
  try {
    const { subject, orderId, email, message, priority } = req.body;
    
    // Validate required fields
    if (!subject || !email || !message) {
      return res.status(400).json({
        success: false,
        error: 'Subject, email, and message are required'
      });
    }
    
    // Create support ticket
    const ticketId = `TICKET_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const ticket = {
      id: ticketId,
      subject,
      orderId: orderId || null,
      email,
      message,
      priority: priority || 'normal',
      status: 'open',
      userId: req.user?.uid || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Store ticket in database
    await merchandiseDB.createSupportTicket(ticket);
    
    // Send email notifications
    try {
      // Send notification to admin team
      await emailService.sendSupportNotification(ticket);
      console.log('✅ Admin support notification email sent successfully');
      
      // Send acknowledgment to customer
      await emailService.sendSupportAcknowledgment(ticket);
      console.log('✅ Customer support acknowledgment email sent successfully');
    } catch (emailError) {
      console.error('⚠️ Support email notifications failed (ticket still created):', emailError);
      // Don't fail the ticket creation if email fails - customer gets their ticket ID
    }
    
    console.log('📞 New support ticket created:', ticketId);
    
    res.json({
      success: true,
      ticketId: ticketId,
      message: 'Support ticket created successfully'
    });
  } catch (error) {
    console.error('❌ Error creating support ticket:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create support ticket'
    });
  }
});

/**
 * GET /admin/support
 * Admin support ticket management
 * 🛡️ ADMIN: Support ticket dashboard
 */
router.get('/admin/support', ensureAuthenticated, groupAuth.requireAction('admin_access'), async (req, res) => {
  try {
    res.render('admin-support', {
      title: 'Support Management',
      pageTitle: 'Support Management',
      pageDescription: 'Manage customer support tickets and requests',
      user: req.user,
      cdnUrl: process.env.CDN_URL,
      version: `v${Date.now()}`
    });
  } catch (error) {
    console.error('Error rendering admin support page:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Unable to load support management',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

/**
 * GET /api/admin/support/tickets
 * Get all support tickets for admin
 * 🛡️ ADMIN API: Fetch all support tickets
 */
router.get('/api/admin/support/tickets', ensureAuthenticated, groupAuth.requireAction('admin_access'), async (req, res) => {
  try {
    const tickets = await merchandiseDB.getAllSupportTickets();
    
    res.json({
      success: true,
      tickets: tickets || [],
      count: tickets?.length || 0
    });
  } catch (error) {
    console.error('❌ Error fetching support tickets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch support tickets'
    });
  }
});

// 🏆 BADGE-EXCLUSIVE MERCHANDISE ROUTES - THE ULTIMATE NPC QUEST PAYOFF!

/**
 * GET /api/merchandise/badge-collection
 * Get user's badge collection and exclusive merchandise dashboard
 * 🏆 REVOLUTIONARY: Show user their NPC Quest achievements and unlocked exclusive merch
 */
router.get('/badge-collection', ensureAuthenticated, async (req, res) => {
  try {
    const BadgeMerchandiseIntegrationService = require('../services/badge-merchandise-integration');
    const badgeService = new BadgeMerchandiseIntegrationService();
    
    console.log('🏆 Loading badge collection dashboard for user:', req.user.uid);
    
    const dashboard = await badgeService.getBadgeCollectionDashboard(req.user.uid);
    
    if (!dashboard.success) {
      return res.status(500).json({
        success: false,
        error: dashboard.error
      });
    }
    
    console.log(`✅ Badge dashboard loaded: ${dashboard.stats.totalBadgesEarned} badges, ${dashboard.stats.exclusiveDesignsUnlocked} exclusive designs`);
    
    res.json({
      success: true,
      dashboard: dashboard
    });
    
  } catch (error) {
    console.error('❌ Error loading badge collection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load badge collection'
    });
  }
});

/**
 * GET /api/merchandise/badge-exclusives
 * Get badge-exclusive merchandise available to the user
 * 🎯 GAME-CHANGER: Only show merchandise that user can access via earned badges
 */
router.get('/badge-exclusives', ensureAuthenticated, async (req, res) => {
  try {
    const BadgeMerchandiseIntegrationService = require('../services/badge-merchandise-integration');
    const badgeService = new BadgeMerchandiseIntegrationService();
    
    console.log('🛍️ Loading badge-exclusive merchandise for user:', req.user.uid);
    
    const exclusiveMerch = await badgeService.getBadgeExclusiveMerchandise(req.user.uid);
    
    console.log(`✅ Found ${exclusiveMerch.length} badge-exclusive merchandise items`);
    
    res.json({
      success: true,
      exclusiveMerchandise: exclusiveMerch,
      count: exclusiveMerch.length,
      categories: [...new Set(exclusiveMerch.map(item => item.exclusiveInfo.character))]
    });
    
  } catch (error) {
    console.error('❌ Error loading badge-exclusive merchandise:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load badge-exclusive merchandise'
    });
  }
});

/**
 * POST /api/merchandise/check-badge-access
 * Check if user has badge access to a specific design
 * 🔑 GATEKEEPER: Verify badge ownership before allowing exclusive purchase
 */
router.post('/check-badge-access', ensureAuthenticated, async (req, res) => {
  try {
    const { designId } = req.body;
    
    if (!designId) {
      return res.status(400).json({
        success: false,
        error: 'Design ID is required'
      });
    }
    
    const BadgeMerchandiseIntegrationService = require('../services/badge-merchandise-integration');
    const badgeService = new BadgeMerchandiseIntegrationService();
    
    console.log(`🔑 Checking badge access for user ${req.user.uid}, design ${designId}`);
    
    const accessCheck = await badgeService.checkBadgeAccess(req.user.uid, designId);
    
    console.log(`   Access result: ${accessCheck.hasAccess ? 'GRANTED' : 'DENIED'} (${accessCheck.reason})`);
    
    res.json({
      success: true,
      access: accessCheck
    });
    
  } catch (error) {
    console.error('❌ Error checking badge access:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check badge access'
    });
  }
});

/**
 * POST /api/merchandise/award-test-badge
 * Award a test badge to user (development/demo only)
 * 🧪 TESTING: Allow awarding badges to test the integration
 */
router.post('/award-test-badge', ensureAuthenticated, async (req, res) => {
  try {
    // Only allow in development mode
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({
        success: false,
        error: 'Badge awarding only available in development mode'
      });
    }
    
    const { badgeId } = req.body;
    
    if (!badgeId) {
      return res.status(400).json({
        success: false,
        error: 'Badge ID is required'
      });
    }
    
    const BadgeMerchandiseIntegrationService = require('../services/badge-merchandise-integration');
    const badgeService = new BadgeMerchandiseIntegrationService();
    
    console.log(`🧪 TEST: Awarding badge ${badgeId} to user ${req.user.uid}`);
    
    const awardResult = await badgeService.awardBadge(req.user.uid, badgeId);
    
    if (!awardResult.success) {
      return res.status(400).json(awardResult);
    }
    
    console.log(`✅ TEST: Badge awarded successfully, unlocked ${awardResult.merchUnlocked} merchandise items`);
    
    res.json({
      success: true,
      badge: awardResult.badge,
      merchUnlocked: awardResult.merchUnlocked,
      message: awardResult.message
    });
    
  } catch (error) {
    console.error('❌ Error awarding test badge:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to award test badge'
    });
  }
});

/**
 * GET /api/merchandise/badge-integration-status
 * Check the status of badge-merchandise integration
 * 🔍 DIAGNOSTICS: Verify integration is working properly
 */
router.get('/badge-integration-status', async (req, res) => {
  try {
    const BadgeMerchandiseIntegrationService = require('../services/badge-merchandise-integration');
    const badgeService = new BadgeMerchandiseIntegrationService();
    
    console.log('🔍 Validating badge-merchandise integration...');
    
    const validation = await badgeService.validateIntegration();
    
    console.log(`Integration validation: ${validation.success ? 'PASSED' : 'FAILED'}`);
    
    res.json({
      success: true,
      integration: validation,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error checking integration status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check integration status'
    });
  }
});

module.exports = router;