/**
 * Test Variant Images
 * 
 * Verify that product variants have different preview images
 * (same design on different colored products)
 */

const axios = require('axios');

async function testVariantImages() {
  try {
    console.log('🔍 Testing variant image differences...');
    
    // You'll need to replace this with an actual product ID from your system
    const productId = 'YOUR_PRODUCT_ID_HERE';
    
    // Get product details
    const response = await axios.get(`http://localhost:3001/api/merchandise/product/${productId}`, {
      headers: {
        'Authorization': 'Bearer dev-bypass'
      }
    });
    
    if (!response.data.success) {
      console.error('❌ Failed to get product:', response.data.error);
      return;
    }
    
    const product = response.data.product;
    console.log(`📦 Product: ${product.title}`);
    console.log(`🎨 Total variants: ${product.variants?.length || 0}`);
    console.log(`🖼️ Total images: ${product.images?.length || 0}`);
    
    if (!product.variants || product.variants.length === 0) {
      console.log('⚠️ No variants found');
      return;
    }
    
    if (!product.images || product.images.length === 0) {
      console.log('⚠️ No images found');
      return;
    }
    
    // Check if we have different images for different variants
    console.log('\n🔍 Analyzing variant images:');
    
    const imageUrls = new Set();
    const variantDetails = [];
    
    product.variants.forEach((variant, index) => {
      const variantTitle = variant.title || `Variant ${index + 1}`;
      
      // In Printify, each variant typically has a corresponding image
      // The images array usually corresponds to different variant previews
      const imageIndex = Math.min(index, product.images.length - 1);
      const imageUrl = product.images[imageIndex]?.src;
      
      if (imageUrl) {
        imageUrls.add(imageUrl);
        variantDetails.push({
          variant: variantTitle,
          price: `$${(variant.price / 100).toFixed(2)}`,
          imageUrl: imageUrl,
          imageIndex: imageIndex
        });
      }
    });
    
    console.log(`📊 Unique image URLs: ${imageUrls.size}`);
    console.log(`📊 Total variants: ${product.variants.length}`);
    
    // Display first few variants with their images
    console.log('\n📋 Variant Details:');
    variantDetails.slice(0, 5).forEach((detail, index) => {
      console.log(`  ${index + 1}. ${detail.variant} - ${detail.price}`);
      console.log(`     Image: ${detail.imageUrl.substring(0, 80)}...`);
    });
    
    if (variantDetails.length > 5) {
      console.log(`     ... and ${variantDetails.length - 5} more variants`);
    }
    
    // Analysis
    if (imageUrls.size === 1) {
      console.log('\n⚠️ ANALYSIS: All variants use the same image URL');
      console.log('   This could mean:');
      console.log('   1. Product is still being processed by Printify');
      console.log('   2. Printify is using the same preview for all variants');
      console.log('   3. This is a single-color product type');
    } else if (imageUrls.size === product.variants.length) {
      console.log('\n✅ ANALYSIS: Each variant has a unique image');
      console.log('   This is ideal - each color/size has its own preview');
    } else {
      console.log(`\n📊 ANALYSIS: ${imageUrls.size} unique images for ${product.variants.length} variants`);
      console.log('   This is normal - some variants may share preview images');
    }
    
    // Check if images are actually different (basic check)
    if (imageUrls.size > 1) {
      console.log('\n🔍 Checking if images are actually different...');
      const urlArray = Array.from(imageUrls);
      
      for (let i = 0; i < Math.min(3, urlArray.length); i++) {
        try {
          const response = await axios.head(urlArray[i]);
          const contentLength = response.headers['content-length'];
          console.log(`   Image ${i + 1}: ${contentLength} bytes`);
        } catch (error) {
          console.log(`   Image ${i + 1}: Error checking size`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.response?.status === 404) {
      console.log('\n💡 To run this test:');
      console.log('   1. Create a product in the merchandise store');
      console.log('   2. Copy the product ID from the browser network tab');
      console.log('   3. Replace YOUR_PRODUCT_ID_HERE in this script');
      console.log('   4. Run the test again');
    }
  }
}

// Run the test
testVariantImages();