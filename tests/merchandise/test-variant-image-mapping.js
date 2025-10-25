/**
 * Test Variant Image Mapping
 * 
 * Test to verify that products have variant-specific images
 * and that our frontend correctly maps them
 */

const axios = require('axios');

async function testVariantImageMapping() {
  try {
    console.log('🔍 Testing variant image mapping...');
    
    // First, let's get a list of user products
    const productsResponse = await axios.get('http://localhost:3001/api/merchandise/products', {
      headers: {
        'Authorization': 'Bearer dev-bypass'
      }
    });
    
    if (!productsResponse.data.success || !productsResponse.data.products.length) {
      console.log('⚠️ No products found. Create a product first to test variant images.');
      return;
    }
    
    const products = productsResponse.data.products;
    console.log(`📦 Found ${products.length} products to test`);
    
    for (const product of products.slice(0, 3)) { // Test first 3 products
      const productId = product.id || product.productId;
      console.log(`\n🔍 Testing product: ${product.title} (ID: ${productId})`);
      
      // Get detailed product info
      const detailResponse = await axios.get(`http://localhost:3001/api/merchandise/product/${productId}`, {
        headers: {
          'Authorization': 'Bearer dev-bypass'
        }
      });
      
      if (!detailResponse.data.success) {
        console.log(`❌ Failed to get details for product ${productId}`);
        continue;
      }
      
      const productDetails = detailResponse.data.product;
      
      console.log(`   📊 Variants: ${productDetails.variants?.length || 0}`);
      console.log(`   🖼️ Images: ${productDetails.images?.length || 0}`);
      
      if (!productDetails.variants || productDetails.variants.length === 0) {
        console.log('   ⚠️ No variants found');
        continue;
      }
      
      if (!productDetails.images || productDetails.images.length === 0) {
        console.log('   ⚠️ No images found');
        continue;
      }
      
      // Analyze image-to-variant mapping
      const imageUrls = new Set();
      const variantImageMap = new Map();
      
      productDetails.variants.forEach((variant, index) => {
        // Our mapping logic: use variant index to select image
        const imageIndex = Math.min(index, productDetails.images.length - 1);
        const imageUrl = productDetails.images[imageIndex]?.src;
        
        if (imageUrl) {
          imageUrls.add(imageUrl);
          variantImageMap.set(variant.id, {
            variantTitle: variant.title,
            imageUrl: imageUrl,
            imageIndex: imageIndex
          });
        }
      });
      
      console.log(`   📈 Unique image URLs: ${imageUrls.size}`);
      console.log(`   🎯 Image-to-variant ratio: ${imageUrls.size}/${productDetails.variants.length}`);
      
      // Show first few mappings
      const mappings = Array.from(variantImageMap.entries()).slice(0, 3);
      mappings.forEach(([variantId, data]) => {
        const shortUrl = data.imageUrl.length > 60 ? 
          data.imageUrl.substring(0, 60) + '...' : data.imageUrl;
        console.log(`   • ${data.variantTitle} → Image ${data.imageIndex}: ${shortUrl}`);
      });
      
      // Analysis
      if (imageUrls.size === 1) {
        console.log('   📝 Analysis: All variants share the same image (common for single-design products)');
      } else if (imageUrls.size === productDetails.variants.length) {
        console.log('   ✅ Analysis: Each variant has a unique image (ideal scenario)');
      } else {
        console.log(`   📊 Analysis: ${imageUrls.size} unique images for ${productDetails.variants.length} variants (normal for grouped variants)`);
      }
      
      // Test if images are actually different (check file sizes)
      if (imageUrls.size > 1) {
        console.log('   🔍 Checking if images are actually different...');
        const urlArray = Array.from(imageUrls).slice(0, 3);
        
        for (let i = 0; i < urlArray.length; i++) {
          try {
            const response = await axios.head(urlArray[i]);
            const contentLength = response.headers['content-length'];
            const lastModified = response.headers['last-modified'];
            console.log(`     Image ${i + 1}: ${contentLength} bytes, modified: ${lastModified}`);
          } catch (error) {
            console.log(`     Image ${i + 1}: Error checking (${error.message})`);
          }
        }
      }
    }
    
    console.log('\n✅ Variant image mapping test complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.response?.status === 401) {
      console.log('💡 Make sure you\'re authenticated and have products created');
    }
  }
}

// Run the test
if (require.main === module) {
  testVariantImageMapping();
}

module.exports = { testVariantImageMapping };