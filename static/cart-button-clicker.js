// CART BUTTON CLICKER - Run in browser console after finding cart buttons
// This will help you click the right cart button

console.log('🎯 CART BUTTON CLICKER');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Function to find and click cart buttons
function findAndClickCartButton(productName = null) {
  console.log(`🔍 Looking for cart buttons${productName ? ` for "${productName}"` : ''}...`);
  
  // Find all potential cart buttons
  const cartButtons = document.querySelectorAll(`
    button[data-action*="cart"],
    .add-to-cart-btn,
    .cart-btn,
    button:contains("Add to Cart"),
    button:contains("🛒"),
    [onclick*="cart"],
    [onclick*="addToCart"]
  `);
  
  // Also look for any button that might be cart-related
  const allButtons = Array.from(document.querySelectorAll('button, .btn, [onclick]')).filter(btn => {
    const text = btn.textContent?.toLowerCase() || '';
    const classes = btn.className?.toLowerCase() || '';
    const onclick = btn.getAttribute('onclick')?.toLowerCase() || '';
    
    return text.includes('cart') || 
           text.includes('add') || 
           text.includes('🛒') ||
           classes.includes('cart') ||
           onclick.includes('cart');
  });
  
  console.log(`Found ${allButtons.length} potential cart buttons`);
  
  if (allButtons.length === 0) {
    console.log('❌ No cart buttons found. Try:');
    console.log('   1. Make sure page is fully loaded');
    console.log('   2. Check if you\'re on /merchandise page');
    console.log('   3. Look for any button manually and inspect it');
    return;
  }
  
  // If looking for specific product
  if (productName) {
    const productCard = Array.from(document.querySelectorAll('.product-card, .product-item, .gallery-item')).find(card => {
      const title = card.querySelector('h3, h4, .title, .product-title')?.textContent?.toLowerCase();
      return title?.includes(productName.toLowerCase());
    });
    
    if (productCard) {
      const productButton = productCard.querySelector('button, .btn');
      if (productButton) {
        console.log(`🎯 Found button for "${productName}"`);
        console.log(`   Clicking: "${productButton.textContent?.trim()}"`);
        productButton.click();
        setTimeout(() => {
          console.log('✅ Button clicked! Check cart status:');
          if (window.wavelengthCartDiagnostics) {
            window.wavelengthCartDiagnostics();
          }
        }, 1000);
        return;
      }
    }
  }
  
  // Show all available buttons
  console.log('\n🛒 Available cart buttons:');
  allButtons.forEach((btn, i) => {
    const text = btn.textContent?.trim() || 'no text';
    const parent = btn.closest('.product-card, .product-item');
    const productTitle = parent?.querySelector('h3, h4, .title')?.textContent?.trim() || 'unknown product';
    
    console.log(`${i + 1}. "${text}" for "${productTitle}"`);
  });
  
  // Auto-click first valid button if only one found
  if (allButtons.length === 1) {
    const btn = allButtons[0];
    console.log(`\n🎯 Only one cart button found, clicking it...`);
    console.log(`   Clicking: "${btn.textContent?.trim()}"`);
    btn.click();
    
    setTimeout(() => {
      console.log('✅ Button clicked! Checking cart...');
      if (window.wavelengthCartDiagnostics) {
        window.wavelengthCartDiagnostics();
      }
    }, 1000);
  } else {
    console.log(`\n🎯 Multiple buttons found. To click a specific one:`);
    console.log(`   findAndClickCartButton("tote bag")  // for tote bag`);
    console.log(`   findAndClickCartButton("celestial") // for celestial product`);
    console.log(`   Or click manually and run: wavelengthCartDiagnostics()`);
  }
}

// Make function globally available
window.findAndClickCartButton = findAndClickCartButton;

// Function to click button by index
function clickCartButtonByIndex(index) {
  const allButtons = Array.from(document.querySelectorAll('button, .btn, [onclick]')).filter(btn => {
    const text = btn.textContent?.toLowerCase() || '';
    const classes = btn.className?.toLowerCase() || '';
    return text.includes('cart') || text.includes('add') || classes.includes('cart');
  });
  
  if (allButtons[index - 1]) {
    console.log(`🎯 Clicking button ${index}: "${allButtons[index - 1].textContent?.trim()}"`);
    allButtons[index - 1].click();
    setTimeout(() => {
      console.log('✅ Button clicked! Checking cart...');
      if (window.wavelengthCartDiagnostics) {
        window.wavelengthCartDiagnostics();
      }
    }, 1000);
  } else {
    console.log(`❌ No button found at index ${index}`);
  }
}

window.clickCartButtonByIndex = clickCartButtonByIndex;

console.log('\n🎯 USAGE:');
console.log('• findAndClickCartButton()           - Find and show all cart buttons');
console.log('• findAndClickCartButton("tote")     - Find cart button for tote bag');
console.log('• clickCartButtonByIndex(1)          - Click first cart button found');
console.log('• Just run this script to start!');

// Auto-run the finder
findAndClickCartButton();