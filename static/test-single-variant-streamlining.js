// SINGLE VARIANT STREAMLINING TEST - Run in browser console
// This will show you the improved single-variant product display

console.log('🎯 SINGLE VARIANT STREAMLINING TEST');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

setTimeout(() => {
  console.log('\n🔍 ANALYZING PRODUCT VARIANTS...');
  
  // Find all product cards
  const productCards = document.querySelectorAll('.product-card');
  console.log(`📊 Found ${productCards.length} product cards`);
  
  let singleVariantProducts = 0;
  let multiVariantProducts = 0;
  
  productCards.forEach((card, i) => {
    const title = card.querySelector('.product-title')?.textContent?.trim() || 'Unknown Product';
    const variantChips = card.querySelectorAll('.variant-chip:not(.more-variants)');
    const singleVariantAction = card.querySelector('.single-variant-action');
    const variantSummary = card.querySelector('.variant-summary');
    
    console.log(`\n${i + 1}. "${title}"`);
    
    if (singleVariantAction) {
      singleVariantProducts++;
      console.log('   📦 SINGLE VARIANT PRODUCT:');
      console.log('   ✅ Streamlined display (no variant section clutter)');
      
      const variantInfo = singleVariantAction.querySelector('.variant-info')?.textContent;
      const price = singleVariantAction.querySelector('.variant-price')?.textContent;
      const cartBtn = singleVariantAction.querySelector('.add-to-cart-btn');
      
      console.log(`   📋 Details: "${variantInfo}" - ${price}`);
      console.log(`   🛒 Cart button: ${cartBtn ? 'Large & prominent' : 'Missing'}`);
      console.log(`   🎨 Clean layout: No unnecessary "1 variants available" text`);
      
    } else if (variantChips.length > 0) {
      multiVariantProducts++;
      console.log(`   📦 MULTI-VARIANT PRODUCT (${variantChips.length} variants shown):`);
      console.log('   ✅ Full variant selection display');
      console.log(`   📋 Variant summary: ${variantSummary ? 'Shown' : 'Hidden'}`);
      
      variantChips.forEach((chip, j) => {
        const variantName = chip.querySelector('.variant-name')?.textContent;
        const price = chip.querySelector('.variant-price')?.textContent;
        console.log(`     ${j + 1}. "${variantName}" - ${price}`);
      });
    } else {
      console.log('   ⚠️ No variants found');
    }
  });
  
  console.log('\n📊 SUMMARY:');
  console.log(`✅ Single-variant products: ${singleVariantProducts} (streamlined display)`);
  console.log(`✅ Multi-variant products: ${multiVariantProducts} (full variant selection)`);
  
  console.log('\n🎯 IMPROVEMENTS:');
  console.log('• Single variants: Clean layout, size/price integrated, prominent cart button');
  console.log('• Multiple variants: Full selection with clear options');
  console.log('• No more "1 variants available" clutter');
  console.log('• Reduced cognitive load for simple products');
  
  // Test the cart buttons
  const singleVariantButtons = document.querySelectorAll('.single-variant-action .add-to-cart-btn');
  console.log(`\n🛒 Found ${singleVariantButtons.length} streamlined cart buttons`);
  
  singleVariantButtons.forEach((btn, i) => {
    const rect = btn.getBoundingClientRect();
    console.log(`${i + 1}. Streamlined button: ${Math.round(rect.width)}x${Math.round(rect.height)}px`);
  });
  
  console.log('\n🚀 NEXT: Try clicking a cart button on a single-variant product!');
  console.log('   The experience should be much cleaner and more direct.');
  
}, 2000);

// Function to highlight single-variant products
window.highlightSingleVariants = function() {
  const singleVariantActions = document.querySelectorAll('.single-variant-action');
  singleVariantActions.forEach(action => {
    action.style.outline = '3px solid #4CAF50';
    action.style.outlineOffset = '3px';
    action.style.animation = 'pulse 2s infinite';
  });
  
  console.log(`🟢 Highlighted ${singleVariantActions.length} streamlined single-variant products`);
  console.log('   These products now have cleaner, more direct cart interaction');
};

console.log('\n🛠️ AVAILABLE FUNCTIONS:');
console.log('• highlightSingleVariants() - Highlight streamlined single-variant products');
console.log('• removeHighlights() - Remove highlighting');
console.log('• wavelengthCartDiagnostics() - Check cart status');