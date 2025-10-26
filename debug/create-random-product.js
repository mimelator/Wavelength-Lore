/**
 * Random Product Generator
 * 
 * Creates one random merchandise product using a random image 
 * from the authenticated user's gallery. Useful for testing
 * product variety and the merchandise system.
 */

const admin = require('firebase-admin');
const { 
  getAdminDatabase, 
  initializeFirebaseAdmin,
  isFirebaseAdminReady 
} = require('../helpers/firebase-admin-utils');
const AutoEnhancedPrintifyService = require('../services/auto-enhanced-printify-service');
const MerchandiseDatabase = require('../services/merchandise-database');
const axios = require('axios');
const { 
  ProductTypes, 
  generateProductName, 
  generateProductDescription, 
  generateProductTags,
  getAllProducts,
} = require('../config/product-types');

class RandomProductGenerator {
  constructor() {
    this.db = null;
    this.printifyService = new AutoEnhancedPrintifyService();
    this.merchandiseDB = require('../services/merchandise-database');
    this.testUserId = '4fdbYxJHjEP4xksk9sgFE3lgYUs2'; // Default authenticated user
  }

  async initialize() {
    try {
      if (!isFirebaseAdminReady()) {
        console.log('🔥 Initializing Firebase Admin...');
        initializeFirebaseAdmin();
      }
      
      this.db = getAdminDatabase();
      
      if (!this.db) {
        throw new Error('Failed to get Firebase admin database instance');
      }
      
      // Initialize merchandise database
      this.merchandiseDB.initializeDatabase();
      
      console.log('✅ Random product generator initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize generator:', error);
      return false;
    }
  }

  /**
   * Get random gallery image for user (using gallery API methods)
   */
  async getRandomGalleryImage(userId) {
    try {
      console.log(`🖼️ Getting random gallery image for user: ${userId}`);
      
      // Import the gallery utilities
      const galleryStorage = require('../utils/gallery/storage');
      const { getUserBookmarks } = require('../services/firebase/galleryService');
      
      // Get S3 uploaded images
      const s3Images = await galleryStorage.listUserGalleryImages(userId);
      console.log(`📊 Found ${s3Images.length} S3 images for user ${userId}`);
      
      // Get Firebase bookmarks (content image references)
      const bookmarks = await getUserBookmarks(userId);
      console.log(`📊 Found ${bookmarks.length} bookmarked content images for user ${userId}`);
      
      // Combine both types
      const allImages = [...s3Images, ...bookmarks];
      
      if (!allImages || allImages.length === 0) {
        console.log(`❌ No gallery images found for user: ${userId}`);
        return null;
      }
      
      const randomImage = allImages[Math.floor(Math.random() * allImages.length)];
      console.log(`✅ Selected random image: ${randomImage.url || randomImage.title || 'Unknown'}`);
      console.log(`📋 Image details:`, {
        url: randomImage.url,
        title: randomImage.title,
        type: randomImage.type || 'uploaded'
      });
      
      return randomImage;
    } catch (error) {
      console.error('❌ Error getting random gallery image:', error);
      return null;
    }
  }

  async getRandomProductType() {
    const allProducts = getAllProducts();
    
    // Select random product from the flat array
    const randomIndex = Math.floor(Math.random() * allProducts.length);
    const selectedProduct = allProducts[randomIndex];
    
    console.log(`🎲 Selected random product type: ${selectedProduct.name} (${selectedProduct.id})`);
    
    return selectedProduct;
  }

  async downloadImageBuffer(imageUrl) {
    try {
      console.log('📥 Downloading image from URL...');
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 30000
      });
      
      return Buffer.from(response.data);
      
    } catch (error) {
      console.error('❌ Error downloading image:', error);
      throw error;
    }
  }

  async createRandomProduct(userId = null) {
    console.log('🎲 RANDOM PRODUCT GENERATOR');
    console.log('═══════════════════════════');
    
    const targetUserId = userId || this.testUserId;
    console.log(`🎯 Target User ID: ${targetUserId}`);
    
    try {
      // Step 1: Get random gallery image
      console.log('\n📋 Step 1: Selecting random gallery image...');
      const randomImage = await this.getRandomGalleryImage(targetUserId);
      
      // Step 2: Select random product type  
      console.log('\n📋 Step 2: Selecting random product type...');
      const randomProductType = await this.getRandomProductType();
      
      // Step 3: Download image
      console.log('\n📋 Step 3: Downloading image...');
      const imageBuffer = await this.downloadImageBuffer(randomImage.url);
      console.log(`✅ Downloaded ${imageBuffer.length} bytes`);
      
      // Step 4: Generate product details
      console.log('\n📋 Step 4: Generating product details...');
      const productName = generateProductName(randomProductType.productId, randomImage.title);
      const productDescription = generateProductDescription(randomProductType.productId, randomImage.title);
      const productTags = generateProductTags(randomProductType.productId, [randomImage.title]);
      
      console.log(`📝 Product Name: ${productName}`);
      console.log(`📝 Product Description: ${productDescription}`);
      console.log(`🏷️ Product Tags: ${productTags.join(', ')}`);
      
      // Step 5: Create product with enhanced service
      console.log('\n📋 Step 5: Creating product with Printify...');
      
      const productOptions = {
        title: productName,
        description: productDescription,
        tags: productTags,
        userId: targetUserId,
        originalImageId: randomImage.id,
        blueprintId: randomProductType.blueprintId,
        printProviderId: randomProductType.printProviderId,
        productType: randomProductType.id, // CRITICAL: Store product type
      };
      
      console.log(`🔧 Using blueprint: ${randomProductType.blueprintId} (${randomProductType.name})`);
      console.log(`🏭 Using provider: ${randomProductType.printProviderId}`);
      
      // Create product with Printify using correct parameters
      const productResult = await this.printifyService.createCustomProductWithBlueprintAndAutoEnhancement(
        imageBuffer,
        `${randomImage.title}.jpg`,
        productOptions
      );
      
      if (!productResult.success) {
        throw new Error('Failed to create product: ' + productResult.error);
      }
      
      console.log(`✅ Product created successfully!`);
      console.log(`   🆔 Product ID: ${productResult.productId}`);
      console.log(`   📊 Variants: ${(productResult.variants || []).length}`);
      console.log(`   🖼️ Images: ${(productResult.images || []).length}`);
      
      // Step 6: Store in Firebase with complete metadata
      console.log('\n📋 Step 6: Storing product in Firebase...');
      
      const productRecord = {
        productId: productResult.productId,
        imageId: randomImage.id,
        printifyImageId: productResult.uploadedImage?.id,
        title: productName,
        description: productDescription,
        productType: randomProductType.id, // CRITICAL: Store product type
        blueprintId: randomProductType.blueprintId, // CRITICAL: Store blueprint ID
        printProviderId: randomProductType.printProviderId,
        productConfig: randomProductType,
        sourceImage: {
          id: randomImage.id,
          title: randomImage.title,
          url: randomImage.url
        },
        variants: productResult.variants || [],
        images: productResult.images || [],
        enhancement: {
          autoEnhanced: productResult.imageEnhancement?.autoEnhanced || false,
          enhancementSource: productResult.imageEnhancement?.enhancementSource || 'none',
          originalSuitable: productResult.imageEnhancement?.originalImageSuitable || false
        },
        generatedAt: new Date().toISOString(),
        isTestProduct: true // Mark as test product
      };
      
      await this.merchandiseDB.storeUserProduct(targetUserId, productRecord);
      
      console.log(`✅ Product stored in Firebase with complete metadata`);
      
      return {
        success: true,
        product: productRecord,
        randomImage,
        randomProductType,
        message: `Random ${randomProductType.name} created successfully from "${randomImage.title}"`
      };
      
    } catch (error) {
      console.error('❌ Error creating random product:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to create random product'
      };
    }
  }

  printSummary(result) {
    console.log('\n📊 RANDOM PRODUCT GENERATION SUMMARY');
    console.log('════════════════════════════════════');
    
    if (result.success) {
      console.log('✅ SUCCESS: Random product created successfully!');
      console.log(`🎲 Image: "${result.randomImage.title}"`);
      console.log(`🎲 Product Type: ${result.randomProductType.name}`);
      console.log(`🆔 Product ID: ${result.product.productId}`);
      console.log(`🏷️ Stored Product Type: ${result.product.productType}`);
      console.log(`🔧 Stored Blueprint ID: ${result.product.blueprintId}`);
      console.log(`📊 Variants: ${(result.product.variants || []).length}`);
      console.log(`🖼️ Images: ${(result.product.images || []).length}`);
      console.log('\n🎯 This product should now display correctly with proper type variety!');
      console.log('🔗 Visit http://localhost:3001/merchandise to see the result');
    } else {
      console.log('❌ FAILURE: Random product generation failed');
      console.log(`💥 Error: ${result.error}`);
    }
  }
}

// Main execution function
async function generateRandomProduct() {
  const generator = new RandomProductGenerator();
  
  if (!(await generator.initialize())) {
    console.error('❌ Failed to initialize generator');
    process.exit(1);
  }
  
  // Get user ID from command line or use default
  const userId = process.argv[2] || generator.testUserId;
  
  console.log(`🎲 Generating random product for user: ${userId}`);
  console.log('🎯 This will test product variety with proper metadata storage');
  console.log('⏳ Starting generation process...\n');
  
  const result = await generator.createRandomProduct(userId);
  generator.printSummary(result);
  
  if (result.success) {
    console.log('\n🎉 Random product generation completed successfully!');
    process.exit(0);
  } else {
    console.log('\n💥 Random product generation failed!');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  generateRandomProduct().catch(error => {
    console.error('❌ Script execution failed:', error);
    process.exit(1);
  });
}

module.exports = { RandomProductGenerator };