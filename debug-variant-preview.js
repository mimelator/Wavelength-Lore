/**
 * Variant Preview Debug Script
 * Run this in browser console to debug variant selection issues
 */

console.log('🔧 VARIANT PREVIEW DEBUG SCRIPT');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Function to test variant selection
function testVariantSelection() {
  console.log('\n🔍 Looking for variant selectors...');
  
  const variantSelectors = document.querySelectorAll('.variant-selector');
  console.log(`Found ${variantSelectors.length} variant selectors`);
  
  variantSelectors.forEach((selector, index) => {
    const productCard = selector.closest('.product-card');
    const productId = selector.dataset.productId;
    const options = selector.querySelectorAll('option[value]:not([value=""])');
    const productImage = productCard?.querySelector('.gorgeous-mockup-image');
    
    console.log(`\n📦 Variant Selector #${index + 1}:`);
    console.log(`   ├─ Product ID: ${productId || 'Missing'}`);
    console.log(`   ├─ Options count: ${options.length}`);
    console.log(`   ├─ Has product image: ${productImage ? '✅' : '❌'}`);
    console.log(`   └─ Current selection: "${selector.options[selector.selectedIndex]?.textContent}"`);
    
    // Check options for image URLs
    if (options.length > 0) {
      console.log(`   📋 Option details:`);
      options.forEach((option, optIndex) => {
        const imageUrl = option.dataset.imageUrl;
        const price = option.dataset.price;
        console.log(`     ${optIndex + 1}. ${option.textContent}`);
        console.log(`        ├─ Variant ID: ${option.value}`);
        console.log(`        ├─ Price: $${price || 'N/A'}`);
        console.log(`        └─ Image URL: ${imageUrl ? '✅ Present' : '❌ Missing'}`);
        if (imageUrl && imageUrl.length > 80) {
          console.log(`           ${imageUrl.substring(0, 80)}...`);
        } else if (imageUrl) {
          console.log(`           ${imageUrl}`);
        }
      });
    }
  });
  
  console.log('\n🧪 To manually test variant selection:');
  console.log('1. Find a product card with multiple variants');
  console.log('2. Change the dropdown selection');
  console.log('3. Watch console for 🔄 [VARIANT-CHANGE] messages');
  console.log('4. Check if product image updates');
  
  return variantSelectors;
}

// Function to simulate variant selection
function simulateVariantSelection(selectorIndex = 0, optionIndex = 1) {
  const selectors = document.querySelectorAll('.variant-selector');
  if (selectorIndex >= selectors.length) {
    console.error(`❌ Selector index ${selectorIndex} not found (only ${selectors.length} selectors available)`);
    return;
  }
  
  const selector = selectors[selectorIndex];
  const options = selector.querySelectorAll('option[value]:not([value=""])');
  
  if (optionIndex >= options.length) {
    console.error(`❌ Option index ${optionIndex} not found (only ${options.length} options available)`);
    return;
  }
  
  console.log(`\n🎯 Simulating variant selection:`);
  console.log(`   Selector: #${selectorIndex}`);
  console.log(`   Option: #${optionIndex} (${options[optionIndex].textContent})`);
  
  // Store the current image URL for comparison
  const productCard = selector.closest('.product-card');
  const productImage = productCard?.querySelector('.gorgeous-mockup-image');
  const currentImageUrl = productImage?.src;
  
  console.log(`   🖼️ Current image: ${currentImageUrl ? currentImageUrl.substring(0, 60) + '...' : 'None'}`);
  
  // Change the selection
  selector.selectedIndex = optionIndex + 1; // +1 because of "Select a size..." option
  
  // Trigger change event
  const changeEvent = new Event('change', { bubbles: true });
  selector.dispatchEvent(changeEvent);
  
  console.log(`   ✅ Change event dispatched`);
  
  // Check if image changed after a brief delay
  setTimeout(() => {
    const newImageUrl = productImage?.src;
    if (newImageUrl && newImageUrl !== currentImageUrl) {
      console.log(`   🎉 SUCCESS: Image updated!`);
      console.log(`      New image: ${newImageUrl.substring(0, 60)}...`);
    } else if (!productImage) {
      console.log(`   ⚠️ No product image element found to update`);
    } else if (newImageUrl === currentImageUrl) {
      console.log(`   ❌ ISSUE: Image did not change - event handler may not be working`);
      console.log(`      Expected: Image URL to change`);
      console.log(`      Actual: Same URL as before`);
    } else {
      console.log(`   ⚠️ Image element exists but has no src`);
    }
  }, 200);
}

// Function to check event listeners
function checkEventListeners() {
  console.log('\n🎧 Checking event listeners...');
  
  const productsGrid = document.querySelector('.products-grid');
  if (!productsGrid) {
    console.error('❌ Products grid not found');
    return;
  }
  
  // Check if productCardRenderer exists
  if (window.merchandiseStore && window.merchandiseStore.productCardRenderer) {
    console.log('✅ Product card renderer exists');
    
    // Try to manually set up event listeners
    window.merchandiseStore.productCardRenderer.setupEventListeners(productsGrid);
    console.log('✅ Event listeners re-initialized');
  } else {
    console.error('❌ Product card renderer not found');
  }
}

// Run initial test
testVariantSelection();

// Add helper functions to global scope for easy testing
window.testVariantSelection = testVariantSelection;
window.simulateVariantSelection = simulateVariantSelection;
window.checkEventListeners = checkEventListeners;

console.log('\n🎮 Available test functions:');
console.log('- testVariantSelection() - Analyze current variant selectors');
console.log('- simulateVariantSelection(selectorIndex, optionIndex) - Test selection');
console.log('- checkEventListeners() - Re-initialize event listeners');
console.log('\n✅ Debug script loaded!');