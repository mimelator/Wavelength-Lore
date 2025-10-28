// CONSOLIDATED SINGLE VARIANT TEST - Run in browser console
// This shows the improved single-variant layout with no duplicate information

console.log('🎯 CONSOLIDATED SINGLE VARIANT TEST');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

setTimeout(() => {
  console.log('\n🔍 ANALYZING CONSOLIDATED LAYOUTS...');
  
  // Find all product cards
  const productCards = document.querySelectorAll('.product-card');
  console.log(`📊 Found ${productCards.length} product cards`);
  
  productCards.forEach((card, i) => {
    const title = card.querySelector('.product-title')?.textContent?.trim() || 'Unknown Product';
    const productDetails = card.querySelector('.product-details');
    const singleVariantAction = card.querySelector('.single-variant-action');
    const variantChips = card.querySelectorAll('.variant-chip:not(.more-variants)');
    
    console.log(`\n${i + 1}. "${title}"`);
    
    if (singleVariantAction) {
      console.log('   📦 SINGLE VARIANT - CONSOLIDATED LAYOUT:');
      
      // Check product details section
      const detailsText = productDetails?.textContent?.trim() || '';
      const hasSize = detailsText.includes('Size:');
      const hasPrice = detailsText.includes('Price:');
      
      console.log(`   📋 Product Details: "${detailsText}"`);
      console.log(`   ❌ Duplicate Size: ${hasSize ? 'YES (needs fixing)' : 'NO (good)'}`);
      console.log(`   ❌ Duplicate Price: ${hasPrice ? 'YES (needs fixing)' : 'NO (good)'}`);
      
      // Check single variant action section
      const variantSize = singleVariantAction.querySelector('.variant-size')?.textContent?.trim();
      const variantPrice = singleVariantAction.querySelector('.variant-price')?.textContent?.trim();
      const cartBtn = singleVariantAction.querySelector('.add-to-cart-btn');
      
      console.log(`   ✅ Variant Action Section:`);
      console.log(`     • Size: "${variantSize || 'not found'}"`);
      console.log(`     • Price: "${variantPrice || 'not found'}"`);
      console.log(`     • Cart Button: ${cartBtn ? 'Present' : 'Missing'}`);
      
      // Check for redundancy
      if (!hasSize && !hasPrice && variantSize && variantPrice && cartBtn) {
        console.log('   🎉 PERFECT! No duplicate info, all details in action section');
      } else {
        console.log('   ⚠️ Still has duplicate information');
      }
      
    } else if (variantChips.length > 0) {
      console.log(`   📦 MULTI-VARIANT PRODUCT (${variantChips.length} variants)`);
      console.log('   ✅ Full variant selection preserved');
      
    } else {
      console.log('   ⚠️ No variant display found');
    }
  });
  
  console.log('\n🎯 EXPECTED IMPROVEMENTS:');
  console.log('✅ Single variants: No duplicate size/price in product details');
  console.log('✅ All variant info consolidated in action section');
  console.log('✅ Clean, uncluttered layout');
  console.log('✅ Direct path to cart with all necessary info');
  
  console.log('\n📊 LAYOUT ANALYSIS:');
  const singleVariantProducts = document.querySelectorAll('.single-variant-action').length;
  const multiVariantProducts = document.querySelectorAll('.variant-chips').length;
  
  console.log(`🔹 Single-variant products: ${singleVariantProducts} (should be consolidated)`);
  console.log(`🔹 Multi-variant products: ${multiVariantProducts} (full selection preserved)`);
  
}, 2000);

// Function to highlight consolidated single variants
window.highlightConsolidated = function() {
  const singleVariantActions = document.querySelectorAll('.single-variant-action');
  singleVariantActions.forEach(action => {
    action.style.outline = '3px solid #2196F3';
    action.style.outlineOffset = '3px';
    action.style.animation = 'pulse 2s infinite';
    
    // Also highlight the product details to show they should be minimal
    const card = action.closest('.product-card');
    const details = card?.querySelector('.product-details');
    if (details) {
      details.style.outline = '2px solid #FFC107';
      details.style.outlineOffset = '2px';
    }
  });
  
  console.log(`🔵 Highlighted ${singleVariantActions.length} consolidated layouts`);
  console.log('🟡 Product details sections also highlighted (should be minimal)');
};

console.log('\n🛠️ AVAILABLE FUNCTIONS:');
console.log('• highlightConsolidated() - Highlight consolidated single-variant layouts');
console.log('• removeHighlights() - Remove highlighting');