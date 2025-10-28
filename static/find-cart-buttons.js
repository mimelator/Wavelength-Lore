// CART BUTTON FINDER - Run in browser console at http://localhost:3001/merchandise
// This will find ALL buttons that might be add-to-cart buttons

console.log('🛍️ COMPREHENSIVE CART BUTTON SEARCH');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Look for ALL possible button elements
const allButtons = document.querySelectorAll('button, .btn, [onclick], [data-action], a[href*="cart"], .add-to-cart, .cart-btn, .product-btn, input[type="button"], input[type="submit"]');
console.log(`🔍 Found ${allButtons.length} total interactive elements`);

let cartButtonsFound = 0;

console.log('\n🛒 CART-RELATED BUTTONS:');
allButtons.forEach((btn, i) => {
  const text = btn.textContent?.trim() || btn.innerHTML?.trim() || btn.value || 'no text';
  const classes = btn.className || '';
  const id = btn.id || '';
  const onclick = btn.getAttribute('onclick') || '';
  const dataAction = btn.getAttribute('data-action') || '';
  
  // Check if this looks like a cart button
  const isCartButton = 
    text.toLowerCase().includes('cart') ||
    text.includes('🛒') ||
    text.toLowerCase().includes('add') ||
    classes.toLowerCase().includes('cart') ||
    onclick.toLowerCase().includes('cart') ||
    dataAction.toLowerCase().includes('cart') ||
    btn.getAttribute('data-product-id');
  
  if (isCartButton) {
    cartButtonsFound++;
    console.log(`\n${cartButtonsFound}. BUTTON FOUND:`);
    console.log(`   Text: "${text}"`);
    console.log(`   Classes: "${classes}"`);
    console.log(`   ID: "${id}"`);
    console.log(`   Tag: ${btn.tagName}`);
    console.log(`   OnClick: "${onclick}"`);
    console.log(`   Data-Action: "${dataAction}"`);
    console.log(`   Product ID: "${btn.getAttribute('data-product-id') || 'none'}"`);
    console.log(`   Enabled: ${!btn.disabled}`);
    console.log(`   Visible: ${btn.offsetParent !== null}`);
    
    // Show parent context
    const parent = btn.closest('.product-card, .product-item, .gallery-item');
    if (parent) {
      const productTitle = parent.querySelector('h3, h4, .title, .product-title')?.textContent?.trim();
      console.log(`   Product: "${productTitle || 'unknown'}"`);
    }
  }
});

console.log(`\n📊 SUMMARY: Found ${cartButtonsFound} cart-related buttons`);

// Also check for product cards with embedded buttons
console.log('\n🏪 PRODUCT CARDS CHECK:');
const productCards = document.querySelectorAll('.product-card, .product-item, .gallery-item, .product');
console.log(`Found ${productCards.length} product cards`);

productCards.forEach((card, i) => {
  const title = card.querySelector('h3, h4, .title, .product-title')?.textContent?.trim();
  const buttons = card.querySelectorAll('button, .btn, [onclick]');
  
  if (buttons.length > 0) {
    console.log(`\n${i + 1}. "${title}" - ${buttons.length} buttons:`);
    buttons.forEach((btn, j) => {
      const btnText = btn.textContent?.trim() || btn.innerHTML?.trim() || 'no text';
      console.log(`   ${j + 1}. "${btnText}" (${btn.tagName})`);
    });
  }
});

// Check store state
console.log('\n🏬 STORE STATUS:');
console.log(`Store loaded: ${window.merchandiseStore ? 'YES' : 'NO'}`);
if (window.merchandiseStore) {
  console.log(`Products: ${window.merchandiseStore.products?.length || 0}`);
  console.log(`Initialized: ${window.merchandiseStore.isInitialized || false}`);
}

console.log('\n🎯 NEXT STEPS:');
console.log('1. Look at the buttons listed above');
console.log('2. Find one that says "Add to Cart" or has 🛒 emoji');
console.log('3. Click it to test cart functionality');
console.log('4. Run: wavelengthCartDiagnostics() to verify');

console.log('\n🔧 If no cart buttons found, the page might need to finish loading');
console.log('   Try refreshing and running this script again');