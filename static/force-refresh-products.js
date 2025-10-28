// FORCE REFRESH PRODUCT DISPLAY - Run in browser console
// This will re-render the products with the updated logic

console.log('🔄 FORCING PRODUCT DISPLAY REFRESH');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

if (window.merchandiseStore) {
  console.log('✅ Found merchandise store, forcing re-render...');
  
  // Force re-render the products
  if (window.merchandiseStore.render && typeof window.merchandiseStore.render === 'function') {
    try {
      window.merchandiseStore.render();
      console.log('🎉 Products re-rendered with updated logic!');
      
      setTimeout(() => {
        console.log('\n🔍 CHECKING FOR DUPLICATE INFORMATION...');
        
        const singleVariantProducts = document.querySelectorAll('.single-variant-action');
        console.log(`Found ${singleVariantProducts.length} single-variant products`);
        
        singleVariantProducts.forEach((action, i) => {
          const card = action.closest('.product-card');
          const title = card.querySelector('.product-title')?.textContent?.trim();
          const productDetails = card.querySelector('.product-details')?.textContent?.trim();
          
          // Check for duplicates
          const hasSizeInDetails = productDetails.includes('Size:');
          const hasPriceInDetails = productDetails.includes('Price:');
          
          console.log(`\n${i + 1}. "${title}"`);
          console.log(`   Product Details: "${productDetails}"`);
          console.log(`   ❌ Has duplicate Size: ${hasSizeInDetails ? 'YES' : 'NO'}`);
          console.log(`   ❌ Has duplicate Price: ${hasPriceInDetails ? 'YES' : 'NO'}`);
          
          if (!hasSizeInDetails && !hasPriceInDetails) {
            console.log('   ✅ PERFECT! No duplicate information');
          } else {
            console.log('   ⚠️ Still has duplicates - may need page refresh');
          }
        });
        
        console.log('\n🎯 If you still see duplicates, try: location.reload()');
        
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error re-rendering:', error);
      console.log('💡 Try refreshing the page manually: location.reload()');
    }
  } else {
    console.log('⚠️ No render method found, trying to reload products...');
    
    if (window.merchandiseStore.loadProducts && typeof window.merchandiseStore.loadProducts === 'function') {
      window.merchandiseStore.loadProducts();
      console.log('🔄 Attempting to reload products...');
    } else {
      console.log('💡 Please refresh the page: location.reload()');
    }
  }
} else {
  console.log('❌ No merchandise store found');
  console.log('💡 Please refresh the page: location.reload()');
}

// Also provide a simple refresh function
window.forceRefresh = function() {
  console.log('🔄 Forcing page refresh...');
  location.reload();
};

console.log('\n🛠️ AVAILABLE FUNCTIONS:');
console.log('• forceRefresh() - Reload the entire page');
console.log('• location.reload() - Same as above');