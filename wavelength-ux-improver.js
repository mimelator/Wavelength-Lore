#!/usr/bin/env node
/**
 * WAVELENGTH UX Improver Super Power
 * Fixes GitHub Issue #105 - Remove technical jargon from product cards
 * 
 * PROBLEMS TO FIX:
 * 1. "Validated backpack product with 1 provider options" → Customer-friendly descriptions
 * 2. "Pricing Coming Soon" → "Price Available at Checkout"
 * 
 * WAVELENGTH EFFICIENCY: Batch fix all 142 product descriptions + pricing text
 */

const fs = require('fs').promises;
const path = require('path');

console.log('🌊 WAVELENGTH UX IMPROVER: Removing Technical Jargon');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Customer-friendly descriptions based on product categories
const CUSTOMER_FRIENDLY_DESCRIPTIONS = {
  'backpack': 'Durable backpack perfect for daily adventures and carrying your essentials',
  'blanket': 'Cozy blanket ideal for snuggling up at home or outdoor events',
  'cap': 'Stylish cap to complete your look and show your personality',
  'case': 'Protective case to keep your device safe while looking great',
  'clock': 'Unique clock that adds character and functionality to any space',
  'coffee-mug': 'Premium coffee mug for your favorite beverages and daily rituals',
  'coaster': 'Elegant coaster set to protect surfaces while adding style',
  'cutting-board': 'High-quality cutting board that combines function with beautiful design',
  'cushion': 'Comfortable cushion to enhance any seating area with style',
  'doormat': 'Welcome guests with this durable and attractive doormat',
  'flag': 'Bold flag to proudly display your interests and personality',
  'fleece-blanket': 'Soft fleece blanket perfect for warmth and comfort',
  'hoodie': 'Comfortable hoodie for casual wear and staying cozy',
  'jersey': 'Athletic jersey that shows your team spirit and personal style',
  'keychain': 'Stylish keychain to keep your keys organized and add personality',
  'laptop-sleeve': 'Protective laptop sleeve that keeps your device safe in style',
  'magnet': 'Fun magnet to personalize your fridge or magnetic surfaces',
  'mask': 'Comfortable face mask that combines protection with personal style',
  'mouse-pad': 'Smooth mouse pad that enhances your workspace and computing experience',
  'mug': 'Quality mug perfect for your favorite hot or cold beverages',
  'notebook': 'Premium notebook for capturing your thoughts, ideas, and memories',
  'ornament': 'Beautiful ornament to decorate your space and celebrate special moments',
  'phone-case': 'Protective phone case that keeps your device safe while looking amazing',
  'pillow': 'Comfortable pillow that adds both comfort and style to any space',
  'pin': 'Unique pin to express your personality and add flair to clothing or bags',
  'plate': 'Beautiful plate that makes every meal special and shows your style',
  'poster': 'Eye-catching poster to personalize your walls and express your interests',
  'shower-curtain': 'Stylish shower curtain that transforms your bathroom into a personal space',
  'sticker': 'Fun sticker to personalize your belongings and show your personality',
  'sweatshirt': 'Comfortable sweatshirt perfect for casual wear and staying warm',
  't-shirt': 'Classic t-shirt that combines comfort with personal expression',
  'tank-top': 'Comfortable tank top perfect for warm weather and active lifestyles',
  'throw-pillow': 'Decorative throw pillow that adds comfort and style to any room',
  'tote-bag': 'Versatile tote bag perfect for shopping, work, or daily adventures',
  'towel': 'Premium towel that combines functionality with beautiful design',
  'tumbler': 'Insulated tumbler to keep your drinks at the perfect temperature',
  'wall-art': 'Stunning wall art to transform any space and reflect your personality',
  'water-bottle': 'Durable water bottle to keep you hydrated while looking great',
  'zip-hoodie': 'Versatile zip hoodie perfect for layering and casual comfort'
};

async function fixProductDescriptions() {
  const productTypesPath = path.join(__dirname, 'config', 'product-types.js');
  
  console.log('📝 Reading product-types.js...');
  let content = await fs.readFile(productTypesPath, 'utf8');
  
  let changesCount = 0;
  
  // Replace all "Validated X product with Y provider options" descriptions
  const validatedPattern = /description: 'Validated (\w+) product with \d+ provider options'/g;
  
  content = content.replace(validatedPattern, (match, category) => {
    changesCount++;
    const friendlyDescription = CUSTOMER_FRIENDLY_DESCRIPTIONS[category] || 
      `Quality ${category.replace('-', ' ')} that combines style with functionality`;
    
    return `description: '${friendlyDescription}'`;
  });
  
  console.log(`✅ Updated ${changesCount} product descriptions`);
  
  // Write the updated content
  await fs.writeFile(productTypesPath, content, 'utf8');
  console.log('💾 Saved updated product-types.js');
  
  return changesCount;
}

async function fixPricingText() {
  const merchandiseStorePath = path.join(__dirname, 'static', 'js', 'components', 'merchandise-store.js');
  
  console.log('📝 Reading merchandise-store.js...');
  let content = await fs.readFile(merchandiseStorePath, 'utf8');
  
  // Replace "Pricing Coming Soon" with more customer-friendly text
  const beforeCount = (content.match(/Pricing Coming Soon/g) || []).length;
  content = content.replace(/Pricing Coming Soon/g, 'Price Available at Checkout');
  
  console.log(`✅ Updated ${beforeCount} pricing messages`);
  
  // Write the updated content
  await fs.writeFile(merchandiseStorePath, content, 'utf8');
  console.log('💾 Saved updated merchandise-store.js');
  
  return beforeCount;
}

async function main() {
  try {
    console.log('🎯 FIXING GITHUB ISSUE #105: Technical Jargon Removal');
    console.log('');
    
    // Fix product descriptions
    const descriptionChanges = await fixProductDescriptions();
    console.log('');
    
    // Fix pricing text
    const pricingChanges = await fixPricingText();
    console.log('');
    
    console.log('🌊 WAVELENGTH UX IMPROVEMENTS COMPLETE!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Results:`);
    console.log(`   • Product descriptions: ${descriptionChanges} updated`);
    console.log(`   • Pricing messages: ${pricingChanges} updated`);
    console.log('');
    console.log('✅ BEFORE: "Validated backpack product with 1 provider options"');
    console.log('✅ AFTER:  "Durable backpack perfect for daily adventures and carrying your essentials"');
    console.log('');
    console.log('✅ BEFORE: "Pricing Coming Soon"');
    console.log('✅ AFTER:  "Price Available at Checkout"');
    console.log('');
    console.log('🎯 GitHub Issue #105 resolved - customers will see friendly descriptions!');
    
  } catch (error) {
    console.error('❌ Error improving UX:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}