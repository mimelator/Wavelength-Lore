// ENHANCED UI TEST - Run in browser console after refreshing page
// This will show you the dramatic improvement in cart button visibility

console.log('🎨 ENHANCED PRODUCT UI TEST');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Wait for page to load
setTimeout(() => {
  console.log('\n🔍 ANALYZING ENHANCED UI...');
  
  // Find all cart buttons
  const cartButtons = document.querySelectorAll('.add-to-cart-btn');
  console.log(`📊 Found ${cartButtons.length} cart buttons`);
  
  if (cartButtons.length > 0) {
    console.log('\n🛒 CART BUTTON ANALYSIS:');
    
    cartButtons.forEach((btn, i) => {
      const rect = btn.getBoundingClientRect();
      const styles = window.getComputedStyle(btn);
      const parentChip = btn.closest('.variant-chip');
      
      console.log(`\n${i + 1}. Cart Button:`);
      console.log(`   Size: ${Math.round(rect.width)}x${Math.round(rect.height)}px`);
      console.log(`   Font Size: ${styles.fontSize}`);
      console.log(`   Background: ${styles.background?.substring(0, 50)}...`);
      console.log(`   Padding: ${styles.padding}`);
      console.log(`   Visible: ${rect.width > 0 && rect.height > 0 ? '✅ YES' : '❌ NO'}`);
      
      if (parentChip) {
        const chipRect = parentChip.getBoundingClientRect();
        console.log(`   Parent Chip: ${Math.round(chipRect.width)}x${Math.round(chipRect.height)}px`);
        
        const variantName = parentChip.querySelector('.variant-name')?.textContent;
        if (variantName) {
          console.log(`   Product: "${variantName}"`);
        }
      }
    });
  }
  
  // Check for variant chips
  const variantChips = document.querySelectorAll('.variant-chip');
  console.log(`\n🎯 Found ${variantChips.length} variant chips`);
  
  if (variantChips.length > 0) {
    console.log('\n📦 VARIANT CHIP ANALYSIS:');
    
    variantChips.forEach((chip, i) => {
      const rect = chip.getBoundingClientRect();
      const styles = window.getComputedStyle(chip);
      const variantName = chip.querySelector('.variant-name')?.textContent || 'Unknown';
      const price = chip.querySelector('.variant-price')?.textContent || 'No price';
      
      console.log(`\n${i + 1}. "${variantName}" - ${price}`);
      console.log(`   Size: ${Math.round(rect.width)}x${Math.round(rect.height)}px`);
      console.log(`   Background: ${styles.backgroundColor}`);
      console.log(`   Border: ${styles.border}`);
      console.log(`   Padding: ${styles.padding}`);
      console.log(`   Visible: ${rect.width > 0 && rect.height > 0 ? '✅ YES' : '❌ NO'}`);
    });
  }
  
  // Test CSS loading
  const cssLoaded = document.querySelector('link[href*="enhanced-product-ui.css"]');
  console.log(`\n🎨 Enhanced CSS loaded: ${cssLoaded ? '✅ YES' : '❌ NO'}`);
  
  if (!cssLoaded) {
    console.log('⚠️ Enhanced CSS not found! The improvements may not be visible.');
    console.log('   Refresh the page to load the new styles.');
  }
  
  console.log('\n🎯 IMPROVEMENT SUMMARY:');
  console.log('✅ Cart buttons should now be much larger (140px+ wide)');
  console.log('✅ Variant chips should be 280px+ wide with better spacing');
  console.log('✅ All text should be much more readable');
  console.log('✅ Green gradient buttons with hover effects');
  console.log('✅ "Add to Cart" text instead of just emoji');
  
  console.log('\n🚀 TRY CLICKING A CART BUTTON NOW!');
  console.log('   The buttons should be impossible to miss!');
  
}, 2000);

// Also provide a function to highlight all cart buttons
window.highlightCartButtons = function() {
  const cartButtons = document.querySelectorAll('.add-to-cart-btn');
  cartButtons.forEach(btn => {
    btn.style.outline = '3px solid #FF0000';
    btn.style.outlineOffset = '3px';
    btn.style.animation = 'pulse 1s infinite';
  });
  
  // Add pulse animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }
  `;
  document.head.appendChild(style);
  
  console.log('🔴 All cart buttons highlighted in red with pulse animation!');
  console.log('   Run: removeHighlights() to remove the highlighting');
};

window.removeHighlights = function() {
  const cartButtons = document.querySelectorAll('.add-to-cart-btn');
  cartButtons.forEach(btn => {
    btn.style.outline = '';
    btn.style.outlineOffset = '';
    btn.style.animation = '';
  });
  console.log('✅ Highlights removed');
};

console.log('\n🛠️ AVAILABLE FUNCTIONS:');
console.log('• highlightCartButtons() - Highlight all cart buttons in red');
console.log('• removeHighlights() - Remove the red highlighting');
console.log('• wavelengthCartDiagnostics() - Check cart status');