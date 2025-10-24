#!/usr/bin/env node
/**
 * Product Metadata Consistency Test
 * 
 * Validates that product metadata (icons, tags, sizes, templates) match the actual product type.
 * This catches copy-paste errors where tee-shirts have mug icons, pillows have tee templates, etc.
 */

const { ProductTypes, getAllProducts } = require('../../config/product-types');

// Expected metadata patterns for each product type
const expectedPatterns = {
  tshirt: {
    iconPatterns: ['👕', '🎽'],
    tagPatterns: ['apparel', 'tshirt', 'tee', 'cotton'],
    sizePatterns: ['S', 'M', 'L', 'XL', '2XL', '3XL'],
    avoid: ['mug', 'poster', 'canvas', 'bag', 'phone', 'sticker', 'pillow', 'oz', 'iPhone', 'Clear Background'],
    avoidInSizes: ['x', 'oz', 'iPhone', 'Clear Background']
  },
  hoodie: {
    iconPatterns: ['🧥'],
    tagPatterns: ['apparel', 'hoodie', 'warm'],
    sizePatterns: ['S', 'M', 'L', 'XL'],
    avoid: ['mug', 'poster', 'tshirt']
  },
  tank: {
    iconPatterns: ['🎽'],
    tagPatterns: ['apparel', 'tank'],
    sizePatterns: ['S', 'M', 'L', 'XL'],
    avoid: ['mug', 'poster', 'hoodie']
  },
  pillow: {
    iconPatterns: ['🛋️', '🏠', '☁️'],
    tagPatterns: ['home', 'pillow', 'decor'],
    sizePatterns: ['14x14', '16x16', '18x18', '20x20'],
    avoid: ['apparel', 'tshirt', 'oz', 'iPhone', 'Morning Coffee', 'Mug']
  },
  mug: {
    iconPatterns: ['☕', '🍵'],
    tagPatterns: ['home', 'mug', 'ceramic', 'coffee'],
    sizePatterns: ['11oz', '15oz'],
    avoid: ['apparel', 'pillow', 'poster', 'iPhone', 'Poster', 'Tote', 'Canvas']
  },
  poster: {
    iconPatterns: ['🖼️', '🎨'],
    tagPatterns: ['home', 'poster', 'wall-art', 'decor', 'print'],
    sizePatterns: ['12x18', '16x24', '18x24', '24x36'],
    avoid: ['apparel', 'tshirt', 'oz', 'iPhone', 'Mug', 'Tote', 'Tee']
  },
  canvas: {
    iconPatterns: ['🎨', '🖼️'],
    tagPatterns: ['home', 'canvas', 'art'],
    sizePatterns: ['12x16', '16x20', '20x24'],
    avoid: ['apparel', 'tshirt', 'oz', 'iPhone', 'Mug', 'Tee']
  },
  bag: {
    iconPatterns: ['👜', '🎒', '👝'],
    tagPatterns: ['accessories', 'bag', 'tote'],
    sizePatterns: ['Standard'],
    avoid: ['apparel', 'tshirt', 'poster', 'iPhone', 'Case', 'Tee']
  },
  phonecase: {
    iconPatterns: ['📱'],
    tagPatterns: ['accessories', 'phone', 'case'],
    sizePatterns: ['iPhone', 'Samsung', 'Pixel'],
    avoid: ['apparel', 'tshirt', 'poster', 'Mug', 'Tote', 'Tee']
  },
  sticker: {
    iconPatterns: ['🏷️', '✨'],
    tagPatterns: ['accessories', 'sticker', 'vinyl'],
    sizePatterns: ['2x2', '3x3', '4x4'],
    avoid: ['apparel', 'tshirt', 'poster', 'iPhone', 'Mug', 'Tee']
  }
};

function detectProductType(product) {
  const name = product.name.toLowerCase();
  const id = product.id.toLowerCase();
  
  if (name.includes('tshirt') || name.includes('t-shirt') || name.includes('tee') && !name.includes('pillow')) {
    return 'tshirt';
  }
  if (name.includes('hoodie')) return 'hoodie';
  if (name.includes('tank')) return 'tank';
  if (name.includes('pillow')) return 'pillow';
  if (name.includes('mug')) return 'mug';
  if (name.includes('poster')) return 'poster';
  if (name.includes('canvas')) return 'canvas';
  if (name.includes('bag') || name.includes('tote')) return 'bag';
  if (name.includes('phone') || name.includes('case')) return 'phonecase';
  if (name.includes('sticker')) return 'sticker';
  
  return 'unknown';
}

function validateProduct(product) {
  const errors = [];
  const productType = detectProductType(product);
  
  if (productType === 'unknown') {
    return [`Unknown product type for: ${product.name} (${product.id})`];
  }
  
  const expected = expectedPatterns[productType];
  
  // Check icon
  if (!expected.iconPatterns.includes(product.icon)) {
    errors.push(`❌ ${product.name}: Icon mismatch - has "${product.icon}", expected one of ${expected.iconPatterns.join(', ')}`);
  }
  
  // Check tags
  const hasCorrectTag = product.tags.some(tag => 
    expected.tagPatterns.some(pattern => tag.toLowerCase().includes(pattern))
  );
  if (!hasCorrectTag) {
    errors.push(`❌ ${product.name}: Tags don't match product type - has ${JSON.stringify(product.tags)}, expected one of ${JSON.stringify(expected.tagPatterns)}`);
  }
  
  // Check for avoid patterns in tags
  for (const avoidPattern of expected.avoid) {
    if (product.tags.some(tag => tag.toLowerCase().includes(avoidPattern.toLowerCase()))) {
      errors.push(`❌ ${product.name}: Tags contain wrong product type "${avoidPattern}" - has ${JSON.stringify(product.tags)}`);
    }
  }
  
  // Check sizes
  const hasCorrectSize = product.popularSizes.some(size =>
    expected.sizePatterns.some(pattern => size.includes(pattern))
  );
  if (!hasCorrectSize) {
    errors.push(`❌ ${product.name}: Sizes don't match product type - has ${JSON.stringify(product.popularSizes)}, expected to contain ${JSON.stringify(expected.sizePatterns)}`);
  }
  
  // Check for avoid patterns in sizes
  const sizeAvoidList = expected.avoidInSizes || expected.avoid;
  for (const avoidPattern of sizeAvoidList) {
    if (product.popularSizes.some(size => size.includes(avoidPattern))) {
      errors.push(`❌ ${product.name}: Sizes contain wrong product type "${avoidPattern}" - has ${JSON.stringify(product.popularSizes)}`);
    }
  }
  
  // Check name templates
  for (const avoidPattern of expected.avoid) {
    if (product.nameTemplates.some(template => template.includes(avoidPattern))) {
      errors.push(`❌ ${product.name}: Name templates contain wrong product type "${avoidPattern}"`);
    }
  }
  
  return errors;
}

async function runTest() {
  console.log('\n🧪 PRODUCT METADATA CONSISTENCY TEST');
  console.log('═══════════════════════════════════════\n');
  
  try {
    const allProducts = getAllProducts();
    console.log(`📋 Testing ${allProducts.length} products\n`);
    
    let totalErrors = 0;
    
    for (const product of allProducts) {
      const errors = validateProduct(product);
      
      if (errors.length > 0) {
        console.log(`\n🔍 ${product.name} (${product.id}):`);
        errors.forEach(error => console.log(`   ${error}`));
        totalErrors += errors.length;
      } else {
        console.log(`✅ ${product.name}: Metadata consistent`);
      }
    }
    
    console.log('\n═══════════════════════════════════════');
    if (totalErrors === 0) {
      console.log('✅ ALL TESTS PASSED');
      console.log(`   All ${allProducts.length} products have consistent metadata`);
    } else {
      console.log(`❌ TEST FAILED: ${totalErrors} errors found`);
      console.log(`   Product metadata contains copy-paste errors`);
    }
    console.log('═══════════════════════════════════════\n');
    
    process.exit(totalErrors === 0 ? 0 : 1);
    
  } catch (error) {
    console.error('\n❌ TEST ERROR:', error.message);
    console.error(error.stack);
    console.log('═══════════════════════════════════════\n');
    process.exit(1);
  }
}

if (require.main === module) {
  runTest();
}

module.exports = { runTest, validateProduct, detectProductType };
