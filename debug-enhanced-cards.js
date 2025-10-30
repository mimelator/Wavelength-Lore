// 🕵️ WAVELENGTH Enhanced Cards Diagnostic Script
// Copy and paste this into browser console on merchandise page

console.log('🔍 WAVELENGTH: Enhanced Cards Diagnostic Starting...');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Check 1: Enhanced Renderer Available
const hasRenderer = typeof window.MerchandiseProductCardRenderer !== 'undefined';
console.log(`1. Enhanced Renderer: ${hasRenderer ? '✅ LOADED' : '❌ MISSING'}`);

// Check 2: Enhanced CSS Classes Present
const gorgeousMockups = document.querySelectorAll('.gorgeous-mockup-container');
const enhancedCards = document.querySelectorAll('.product-card.complete-product');
const qualityBadges = document.querySelectorAll('.mockup-quality-badge');

console.log(`2. Gorgeous Mockup Containers: ${gorgeousMockups.length > 0 ? '✅ ' + gorgeousMockups.length + ' found' : '❌ NONE FOUND'}`);
console.log(`3. Enhanced Product Cards: ${enhancedCards.length > 0 ? '✅ ' + enhancedCards.length + ' found' : '❌ NONE FOUND'}`);
console.log(`4. Quality Badges: ${qualityBadges.length > 0 ? '✅ ' + qualityBadges.length + ' found' : '❌ NONE FOUND'}`);

// Check 3: CSS Files Loaded
const enhancedCSS = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).find(link => 
  link.href.includes('enhanced-product-ui.css'));
const gorgeousCSS = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).find(link => 
  link.href.includes('gorgeous-mockups.css'));

console.log(`5. Enhanced Product UI CSS: ${enhancedCSS ? '✅ LOADED (' + enhancedCSS.href.split('?')[1] + ')' : '❌ MISSING'}`);
console.log(`6. Gorgeous Mockups CSS: ${gorgeousCSS ? '✅ LOADED (' + gorgeousCSS.href.split('?')[1] + ')' : '❌ MISSING'}`);

// Check 4: JavaScript Components Loaded  
const hasCardRenderer = typeof window.MerchandiseProductCardRenderer !== 'undefined';
const hasStore = typeof window.MerchandiseStore !== 'undefined';

console.log(`7. Card Renderer Component: ${hasCardRenderer ? '✅ LOADED' : '❌ MISSING'}`);
console.log(`8. Merchandise Store: ${hasStore ? '✅ LOADED' : '❌ MISSING'}`);

// Check 5: Version Detection
const versionElements = document.querySelectorAll('script[src*="?v="], link[href*="?v="]');
const versions = Array.from(versionElements).map(el => (el.src || el.href).split('?v=')[1]).filter(Boolean);
const uniqueVersions = [...new Set(versions)];

console.log(`9. Asset Versions: ${uniqueVersions.length > 0 ? '✅ ' + uniqueVersions.join(', ') : '❌ NO VERSIONING'}`);

// Check 6: Detailed DOM Structure Analysis
if (enhancedCards.length > 0) {
  const firstCard = enhancedCards[0];
  const hasImage = firstCard.querySelector('.gorgeous-mockup-image');
  const hasVariants = firstCard.querySelector('.variant-selector, .variant-chip');
  const hasPrice = firstCard.querySelector('.price-range, .variant-price');
  
  console.log('🔍 FIRST ENHANCED CARD ANALYSIS:');
  console.log(`   └─ Gorgeous Image: ${hasImage ? '✅ Present' : '❌ Missing'}`);
  console.log(`   └─ Variant Controls: ${hasVariants ? '✅ Present' : '❌ Missing'}`);
  console.log(`   └─ Price Display: ${hasPrice ? '✅ Present' : '❌ Missing'}`);
  
  if (hasImage) {
    console.log(`   └─ Image Source: ${hasImage.src.substring(0, 80)}...`);
  }
}

// Summary
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
if (enhancedCards.length > 0 && gorgeousMockups.length > 0 && hasRenderer) {
  console.log('🎉 RESULT: ✅ ENHANCED CARDS ARE WORKING!');
} else if (document.querySelectorAll('.product-item').length > 0) {
  console.log('⚠️  RESULT: ❌ OLD CARDS DETECTED - Enhanced system not active');
  console.log('   Possible causes:');
  console.log('   • CSS cache not cleared');
  console.log('   • JavaScript failed to load');
  console.log('   • Component initialization failed');
} else {
  console.log('🤔 RESULT: ❓ NO PRODUCT CARDS FOUND - Check if products are loading');
}
console.log('🔍 WAVELENGTH: Diagnostic Complete');