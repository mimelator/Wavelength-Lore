/**
 * Test script for variant functionality
 * Run this in browser console to debug variant selection issues
 */

console.log('🧪 Testing Variant Functionality...');

// 1. Check if merchandise modal renderer is loaded
if (typeof window.MerchandiseModalRenderer !== 'undefined') {
  console.log('✅ MerchandiseModalRenderer is loaded');
} else {
  console.error('❌ MerchandiseModalRenderer not found in window');
}

// 2. Check if merchandise store is loaded
if (typeof window.merchandiseStore !== 'undefined') {
  console.log('✅ merchandiseStore is loaded');
} else {
  console.error('❌ merchandiseStore not found in window');
}

// 3. Look for product cards with variants
const productCards = document.querySelectorAll('.product-instance-card');
console.log(`📦 Found ${productCards.length} product cards`);

productCards.forEach((card, index) => {
  const productId = card.dataset.productId;
  const variantSelector = card.querySelector('.variant-selector');
  
  console.log(`\n📦 Product Card #${index + 1}:`);
  console.log(`   ├─ Product ID: ${productId || 'Missing'}`);
  console.log(`   ├─ Has variant selector: ${variantSelector ? '✅ Yes' : '❌ No'}`);
  
  if (variantSelector) {
    const options = variantSelector.querySelectorAll('option');
    console.log(`   ├─ Variant options: ${options.length}`);
    
    options.forEach((option, optIndex) => {
      if (option.value) { // Skip the "Select a size..." option
        const imageUrl = option.dataset.imageUrl;
        const hasImage = option.dataset.hasImage;
        console.log(`   │   ├─ Option ${optIndex}: ${option.textContent}`);
        console.log(`   │   ├─ Variant ID: ${option.value}`);
        console.log(`   │   └─ Has image: ${hasImage === 'true' ? '✅' : '❌'} ${imageUrl ? `(${imageUrl.substring(0, 50)}...)` : '(no URL)'}`);
      }
    });
  }
});

// 4. Check for any variant-related event listeners
console.log('\n🎯 Checking Event Listeners...');
const modals = document.querySelectorAll('.modal');
modals.forEach((modal, index) => {
  console.log(`\n🖼️ Modal #${index + 1}:`);
  const variantSelector = modal.querySelector('.variant-selector');
  console.log(`   ├─ Has variant selector: ${variantSelector ? '✅ Yes' : '❌ No'}`);
  
  if (variantSelector) {
    // Test change event
    const originalHandler = variantSelector.onchange;
    console.log(`   ├─ Has onchange handler: ${originalHandler ? '✅ Yes' : '❌ No'}`);
    
    // Check for event listeners
    const listeners = getEventListeners ? getEventListeners(variantSelector) : null;
    if (listeners) {
      console.log(`   └─ Event listeners:`, listeners);
    } else {
      console.log(`   └─ Cannot check event listeners (getEventListeners not available)`);
    }
  }
});

// 5. Test variant selection manually
console.log('\n🧪 Manual Variant Selection Test:');
console.log('To test variant selection manually:');
console.log('1. Open a product modal');
console.log('2. Find the variant selector dropdown');
console.log('3. Change the selection and check console for logs');
console.log('4. Look for: 🔴 [DROPDOWN-CHANGE] messages');
console.log('5. Check if preview image updates');

console.log('\n✅ Variant Functionality Test Complete');