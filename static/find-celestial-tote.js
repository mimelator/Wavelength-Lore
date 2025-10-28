// Quick diagnostic to find Celestial Tote Bag and check product structure
// Run this in browser console on http://localhost:3001/merchandise

console.log('🔍 SEARCHING FOR CELESTIAL TOTE BAG');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Check if store is available
if (window.merchandiseStore) {
  const store = window.merchandiseStore;
  
  // Look through available products for tote bag
  console.log('📦 PRODUCT SEARCH:');
  if (store.availableProducts && store.availableProducts.length > 0) {
    console.log(`Total products available: ${store.availableProducts.length}`);
    
    // Search for tote bag products
    const toteProducts = store.availableProducts.filter(product => 
      product.title && product.title.toLowerCase().includes('tote')
    );
    
    const celestialProducts = store.availableProducts.filter(product => 
      product.title && product.title.toLowerCase().includes('celestial')
    );
    
    console.log(`Tote bag products found: ${toteProducts.length}`);
    console.log(`Celestial products found: ${celestialProducts.length}`);
    
    if (toteProducts.length > 0) {
      console.log('\n🎒 TOTE BAG PRODUCTS:');
      toteProducts.forEach((product, i) => {
        console.log(`${i + 1}. ${product.title}`);
        console.log(`   ID: ${product.id}`);
        console.log(`   Variants: ${product.variants ? product.variants.length : 0}`);
        if (product.variants && product.variants.length > 0) {
          console.log(`   First variant: ${JSON.stringify(product.variants[0])}`);
        }
        console.log('');
      });
    }
    
    if (celestialProducts.length > 0) {
      console.log('\n⭐ CELESTIAL PRODUCTS:');
      celestialProducts.forEach((product, i) => {
        console.log(`${i + 1}. ${product.title}`);
        console.log(`   ID: ${product.id}`);
        console.log(`   Variants: ${product.variants ? product.variants.length : 0}`);
        console.log('');
      });
    }
    
    // Check product categories
    if (store.productCategories) {
      console.log('\n📂 PRODUCT CATEGORIES:');
      Object.keys(store.productCategories).forEach(category => {
        const products = store.productCategories[category];
        console.log(`- ${category}: ${products.length} products`);
      });
    }
    
  } else {
    console.log('❌ No products loaded yet');
  }
  
  // Check gallery images
  console.log('\n🖼️ GALLERY STATUS:');
  console.log(`Gallery images: ${store.galleryImages ? store.galleryImages.length : 0}`);
  console.log(`Selected image: ${store.selectedImage || 'none'}`);
  
} else {
  console.log('❌ Store not available');
}

console.log('\n🎯 NEXT STEPS:');
console.log('1. If products found above, select a gallery image first');
console.log('2. Look for the Celestial Tote Bag in the product categories that appear');
console.log('3. If not found, the product might need to be loaded or created');