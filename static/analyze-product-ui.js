// PRODUCT CARD UI ANALYSIS - Run in browser console
// This will show us exactly how the product cards are currently structured

console.log('🎨 PRODUCT CARD UI ANALYSIS');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Find Cosmic Tote Bag specifically
const cosmicProduct = Array.from(document.querySelectorAll('.product-card, .product-item')).find(card => {
  const title = card.querySelector('h3, h4, .title, .product-title')?.textContent;
  return title && title.toLowerCase().includes('cosmic') && title.toLowerCase().includes('tote');
});

if (cosmicProduct) {
  console.log('🎯 COSMIC TOTE BAG ANALYSIS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Overall card dimensions
  const cardRect = cosmicProduct.getBoundingClientRect();
  console.log(`📦 Card size: ${Math.round(cardRect.width)}x${Math.round(cardRect.height)}px`);
  
  // Find all buttons in this card
  const allButtons = cosmicProduct.querySelectorAll('button, .btn');
  console.log(`\n🔘 Found ${allButtons.length} buttons in card:`);
  
  allButtons.forEach((btn, i) => {
    const rect = btn.getBoundingClientRect();
    const styles = window.getComputedStyle(btn);
    
    console.log(`\n${i + 1}. "${btn.textContent?.trim()}" (${btn.className})`);
    console.log(`   Size: ${Math.round(rect.width)}x${Math.round(rect.height)}px`);
    console.log(`   Position: top=${Math.round(rect.top)}, left=${Math.round(rect.left)}`);
    console.log(`   Visible: ${styles.display !== 'none' && styles.visibility !== 'hidden'}`);
    console.log(`   Z-index: ${styles.zIndex}`);
    console.log(`   Background: ${styles.backgroundColor}`);
    console.log(`   Font size: ${styles.fontSize}`);
    
    // Check if button is actually visible to user
    const isVisibleToUser = rect.width > 0 && rect.height > 0 && 
                           styles.display !== 'none' && 
                           styles.visibility !== 'hidden' &&
                           styles.opacity !== '0';
    console.log(`   User can see: ${isVisibleToUser ? '✅' : '❌'}`);
  });
  
  // Check for variation selectors
  const variations = cosmicProduct.querySelectorAll('select, .variant-selector, .size-selector, .color-selector');
  console.log(`\n🎨 Found ${variations.length} variation selectors:`);
  
  variations.forEach((variation, i) => {
    const rect = variation.getBoundingClientRect();
    const styles = window.getComputedStyle(variation);
    
    console.log(`\n${i + 1}. ${variation.tagName} (${variation.className || 'no class'})`);
    console.log(`   Size: ${Math.round(rect.width)}x${Math.round(rect.height)}px`);
    console.log(`   Visible to user: ${rect.width > 0 && rect.height > 0 && styles.display !== 'none'}`);
    
    if (variation.tagName === 'SELECT' && variation.options) {
      console.log(`   Options: ${Array.from(variation.options).map(opt => opt.textContent).join(', ')}`);
    }
  });
  
  // Check overall card structure
  console.log('\n🏗️ CARD STRUCTURE:');
  const image = cosmicProduct.querySelector('img');
  const title = cosmicProduct.querySelector('h3, h4, .title, .product-title');
  const price = cosmicProduct.querySelector('.price, .product-price');
  
  console.log(`Image: ${image ? '✅' + Math.round(image.getBoundingClientRect().width) + 'x' + Math.round(image.getBoundingClientRect().height) : '❌'}`);
  console.log(`Title: ${title ? '✅ "' + title.textContent?.trim() + '"' : '❌'}`);
  console.log(`Price: ${price ? '✅ "' + price.textContent?.trim() + '"' : '❌'}`);
  
  // Show HTML structure
  console.log('\n📋 CURRENT HTML STRUCTURE:');
  console.log(cosmicProduct.outerHTML.substring(0, 500) + '...');
  
} else {
  console.log('❌ Cosmic Tote Bag not found');
}

// General product card analysis
console.log('\n🏪 GENERAL PRODUCT CARD ANALYSIS:');
const allProductCards = document.querySelectorAll('.product-card, .product-item');
console.log(`Found ${allProductCards.length} product cards total`);

if (allProductCards.length > 0) {
  const firstCard = allProductCards[0];
  const cardStyles = window.getComputedStyle(firstCard);
  
  console.log('\n📐 STANDARD CARD STYLING:');
  console.log(`Display: ${cardStyles.display}`);
  console.log(`Position: ${cardStyles.position}`);
  console.log(`Padding: ${cardStyles.padding}`);
  console.log(`Margin: ${cardStyles.margin}`);
  console.log(`Border: ${cardStyles.border}`);
  console.log(`Background: ${cardStyles.backgroundColor}`);
}

console.log('\n🎯 UI IMPROVEMENT RECOMMENDATIONS:');
console.log('1. Make cart buttons much larger (minimum 40px height)');
console.log('2. Use prominent colors (green/blue for cart buttons)');
console.log('3. Show variation selectors prominently above cart button');
console.log('4. Add clear labeling for variations (Size, Color, etc.)');
console.log('5. Group multiple variations of same product better');
console.log('6. Add hover effects and visual feedback');
console.log('7. Consider modal/popup for variation selection');