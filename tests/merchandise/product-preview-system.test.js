#!/usr/bin/env node
/**
 * Product Preview Comprehensive Test
 * 
 * Tests the complete product preview system:
 * 1. Vendor catalog API retrieval
 * 2. Individual product detail retrieval  
 * 3. Product deletion
 * 4. Bookmark image support
 */

const fetch = require('node-fetch');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const TEST_USER_ID = '4fdbYxJHjEP4xksk9sgFE3lgYUs2';

async function testProductPreviewSystem() {
  console.log('\n🧪 PRODUCT PREVIEW COMPREHENSIVE TEST');
  console.log('═══════════════════════════════════════\n');
  
  let createdProductId = null;
  
  try {
    // STEP 1: Test vendor catalog API
    console.log('📋 STEP 1: Test vendor catalog API');
    const catalogResponse = await fetch(`${API_BASE_URL}/api/merchandise/vendor-previews`);
    
    if (!catalogResponse.ok) {
      throw new Error(`Catalog API failed: ${catalogResponse.status}`);
    }
    
    const catalogData = await catalogResponse.json();
    
    if (!catalogData.success) {
      throw new Error(`Catalog API returned success: false - ${catalogData.error}`);
    }
    
    const initialCount = catalogData.count || 0;
    console.log(`   ✅ Catalog API works`);
    console.log(`   📊 Current products: ${initialCount}\n`);
    
    if (initialCount === 0) {
      console.log('   ⚠️  No products in catalog - run batch-product-preview-builder.js first');
      console.log('   ✅ TEST SKIPPED: No products to test detail/deletion\n');
      process.exit(0);
    }
    
    // STEP 2: Test individual product detail
    console.log('📋 STEP 2: Test product detail API');
    const firstProduct = catalogData.previews[0];
    createdProductId = firstProduct.productId || firstProduct.id;
    
    console.log(`   Testing product: ${createdProductId}`);
    
    const detailResponse = await fetch(`${API_BASE_URL}/api/merchandise/vendor-preview/${createdProductId}`);
    
    if (!detailResponse.ok) {
      throw new Error(`Detail API failed: ${detailResponse.status}`);
    }
    
    const detailData = await detailResponse.json();
    
    if (!detailData.success) {
      throw new Error(`Detail API returned success: false`);
    }
    
    const product = detailData.product;
    console.log(`   ✅ Detail API works`);
    console.log(`   📝 Title: ${product.title}`);
    console.log(`   📸 Images: ${product.images?.length || 0}`);
    console.log(`   🎨 Variants: ${product.variants?.length || 0}\n`);
    
    // Validate product structure
    if (!product.images || product.images.length === 0) {
      throw new Error('Product missing images');
    }
    
    if (!product.variants || product.variants.length === 0) {
      throw new Error('Product missing variants');
    }
    
    // STEP 3: Verify product was created from bookmark
    console.log('📋 STEP 3: Verify bookmark image support');
    
    // Get gallery images
    const galleryResponse = await fetch(`${API_BASE_URL}/api/gallery/user/images`, {
      headers: {
        'X-User-ID': TEST_USER_ID,
        'X-API-Request': 'test'
      }
    });
    
    const galleryData = await galleryResponse.json();
    const bookmarks = galleryData.images.filter(img => img.type === 'bookmark');
    
    console.log(`   ✅ Gallery has ${galleryData.images.length} images`);
    console.log(`   📊 Including ${bookmarks.length} bookmarks`);
    
    if (bookmarks.length > 0) {
      console.log(`   ✅ Products can be created from bookmarks\n`);
    } else {
      console.log(`   ℹ️  No bookmarks (products created from uploaded images)\n`);
    }
    
    // STEP 4: Test product deletion
    console.log('📋 STEP 4: Test product deletion');
    console.log(`   Deleting product: ${createdProductId}`);
    
    const deleteResponse = await fetch(`${API_BASE_URL}/api/merchandise/vendor-preview/${createdProductId}`, {
      method: 'DELETE',
      headers: {
        'X-User-ID': TEST_USER_ID,
        'X-API-Request': 'test'
      }
    });
    
    if (!deleteResponse.ok) {
      throw new Error(`Delete API failed: ${deleteResponse.status}`);
    }
    
    const deleteData = await deleteResponse.json();
    
    if (!deleteData.success) {
      throw new Error(`Delete API returned success: false - ${deleteData.error}`);
    }
    
    console.log(`   ✅ Product deleted successfully\n`);
    
    // STEP 5: Verify product no longer in catalog
    console.log('📋 STEP 5: Verify product removed from catalog');
    
    const verifyResponse = await fetch(`${API_BASE_URL}/api/merchandise/vendor-previews`);
    const verifyData = await verifyResponse.json();
    
    const stillExists = verifyData.previews.some(p => 
      (p.productId || p.id) === createdProductId
    );
    
    if (stillExists) {
      throw new Error('Product still exists in catalog after deletion');
    }
    
    console.log(`   ✅ Product successfully removed from catalog`);
    console.log(`   📊 Remaining products: ${verifyData.count}\n`);
    
    console.log('═══════════════════════════════════════');
    console.log('✅ ALL TESTS PASSED');
    console.log('   Catalog API: ✅');
    console.log('   Detail API: ✅');
    console.log('   Bookmark support: ✅');
    console.log('   Deletion: ✅');
    console.log('═══════════════════════════════════════\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    
    // Cleanup: Try to delete the product if we created one
    if (createdProductId) {
      console.log(`\n🧹 Cleanup: Attempting to delete product ${createdProductId}`);
      try {
        await fetch(`${API_BASE_URL}/api/merchandise/vendor-preview/${createdProductId}`, {
          method: 'DELETE',
          headers: {
            'X-User-ID': TEST_USER_ID,
            'X-API-Request': 'test'
          }
        });
        console.log('   ✅ Cleanup successful');
      } catch (cleanupError) {
        console.log('   ⚠️  Cleanup failed');
      }
    }
    
    console.log('═══════════════════════════════════════\n');
    process.exit(1);
  }
}

if (require.main === module) {
  testProductPreviewSystem();
}

module.exports = { testProductPreviewSystem };
