#!/usr/bin/env node

/**
 * WAVELENGTH Issue #100 Direct Fix Implementation
 * ===============================================
 * 
 * Directly fixes the getProductIcon method to resolve t-shirt fallback issue
 */

const fs = require('fs');
const path = require('path');

console.log('🌊 WAVELENGTH: Implementing Issue #100 Fix');
console.log('==========================================');

const filePath = 'static/js/components/merchandise-store.js';

console.log(`📁 Reading ${filePath}...`);
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔍 Locating getProductIcon method...');

// Find the start and end of the getProductIcon method
const methodStart = content.indexOf('getProductIcon(productType) {');
if (methodStart === -1) {
  console.error('❌ Could not find getProductIcon method!');
  process.exit(1);
}

// Find the method end by counting braces
let braceCount = 0;
let methodEnd = methodStart;
let inMethod = false;

for (let i = methodStart; i < content.length; i++) {
  const char = content[i];
  
  if (char === '{') {
    braceCount++;
    inMethod = true;
  } else if (char === '}') {
    braceCount--;
    if (inMethod && braceCount === 0) {
      methodEnd = i + 1;
      break;
    }
  }
}

console.log(`✅ Found method at position ${methodStart} to ${methodEnd}`);

// The enhanced replacement method
const enhancedMethod = `getProductIcon(productType) {
    // 🎯 COMPREHENSIVE ICON MAPPING FOR ALL 23+ PRODUCT CATEGORIES
    // Fixes Issue #100: Remove unneeded and incorrect t-shirt icon fallback
    const icons = {
      // 🎽 APPAREL CATEGORIES (8 categories)  
      'heavy-cotton-tee': '👕',
      'hoodie': '🧥', 
      'premium-tshirt': '✨',  // Premium gets special sparkle treatment
      'sweatshirt': '🧥',
      't-shirt': '👕',
      'tank-top': '🎽',
      'women-tee': '👚',
      'zip-hoodie': '🧥',
      
      // 🎒 ACCESSORIES CATEGORIES (8 categories)
      'backpack': '🎒',
      'fanny-pack': '🤳',  // Trendy fanny pack icon
      'hat': '🧢',
      'laptop-sleeve': '💻',
      'notebook': '📝',
      'phone-case': '📱',
      'sticker': '🏷️',
      'tote-bag': '🛍️',
      
      // 🏠 HOME & DECOR CATEGORIES (5 categories)
      'blanket': '🛏️',
      'canvas': '🎨',  // Art canvas for wall prints
      'coffee-mug': '☕',
      'pillow': '🛏️',
      'travel-mug': '🥤',  // Travel-specific mug icon
      
      // 👶 SPECIAL CATEGORIES (2 categories)
      'infant-wear': '👶',
      'specialty-item': '⭐',  // Star for special/unique items
      
      // 🔄 LEGACY/COMPATIBILITY MAPPINGS (for backward compatibility)
      'mug': '☕',
      'womens-tee': '👚',
      'infant-tee': '👶',
      'ultra-cotton-tee': '👕',
      'ultra-cotton-alt': '👕',
      'poster': '🖼️',
      'christmas-tree-skirt': '🎄',  // Specific Christmas item
      'tree-skirt': '🎄',
      
      // 📂 CATEGORY GROUPINGS (for category display)
      'home-decor': '🏠',
      'accessories': '🎒',
      'apparel': '👕'
    };
    
    // STEP 1: Direct exact match (fastest path)
    if (icons[productType]) {
      return icons[productType];
    }
    
    // STEP 2: Special case handling for validated product types
    if (productType && productType.startsWith('validated-')) {
      // Extract blueprint ID for special handling
      const blueprintId = productType.replace('validated-', '');
      
      // 🎄 Christmas Tree Skirts (Blueprint 381) - CRITICAL FIX FOR ISSUE #100
      if (blueprintId === '381') {
        return '🎄';
      }
      
      // Future: Add more blueprint-specific icons here as needed
    }
    
    // STEP 3: Intelligent pattern matching for dynamic product types
    const type = productType?.toLowerCase() || '';
    
    // 🎄 Christmas/Holiday items (HIGHEST PRIORITY - Issue #100 fix)
    if (type.includes('christmas') || type.includes('tree') || type.includes('skirt')) {
      return '🎄';
    }
    
    // 👕 Apparel patterns
    if (type.includes('shirt') || type.includes('tee')) return '👕';
    if (type.includes('hoodie') || type.includes('sweatshirt')) return '🧥';
    if (type.includes('tank')) return '🎽';
    if (type.includes('women')) return '👚';
    if (type.includes('infant') || type.includes('baby')) return '👶';
    if (type.includes('premium')) return '✨';
    
    // 🏠 Home decor patterns  
    if (type.includes('canvas') || type.includes('poster')) return '🎨';
    if (type.includes('pillow') || type.includes('cushion')) return '🛏️';
    if (type.includes('blanket')) return '🛏️';
    
    // 🎒 Accessories patterns
    if (type.includes('mug') || type.includes('cup')) return '☕';
    if (type.includes('travel') && type.includes('mug')) return '🥤';
    if (type.includes('bag') || type.includes('tote')) return '🛍️';
    if (type.includes('backpack')) return '🎒';
    if (type.includes('phone') || type.includes('case')) return '📱';
    if (type.includes('laptop')) return '💻';
    if (type.includes('sticker')) return '🏷️';
    if (type.includes('hat') || type.includes('cap')) return '🧢';
    if (type.includes('notebook') || type.includes('journal')) return '📝';
    if (type.includes('fanny')) return '🤳';
    
    // STEP 4: Smart fallback - NO MORE T-SHIRT DEFAULT!
    // Issue #100 fix: Use generic product box instead of t-shirt for unknown items
    return '📦';
  }`;

// Replace the method
const newContent = content.substring(0, methodStart) + enhancedMethod + content.substring(methodEnd);

console.log('💾 Writing enhanced version...');
fs.writeFileSync(filePath, newContent, 'utf8');

console.log('✅ Successfully implemented Issue #100 fix!');
console.log('');
console.log('🎯 CHANGES MADE:');
console.log('• Added comprehensive icon mapping for all 23+ categories');
console.log('• Special handling for Christmas Tree Skirts (validated-381) → 🎄');
console.log('• Canvas products → 🎨 (not t-shirt)');
console.log('• Unknown items → 📦 (not t-shirt)');
console.log('• Enhanced pattern matching for dynamic product types');
console.log('');
console.log('🎄 Issue #100 RESOLVED: Christmas Tree Skirts will now show proper holiday icon!');