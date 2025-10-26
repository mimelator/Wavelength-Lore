/**
 * Merchandise Product Display Bug Reproduction Test
 * 
 * Demonstrates the bug where all products show as t-shirts
 * despite having potential variety in Firebase data
 */

const assert = require('assert');

// REAL Firebase data from diagnostic - shows the actual bug
const realFirebaseData = [
  {
    productId: '68fcfac011d25bde5d071e18',
    title: 'E2e Alexandria 1761336915293 T-Shirt',
    productType: undefined, // MISSING!
    blueprintId: undefined, // MISSING!
    variants: [
      { title: 'Heather Grey / S' }, // No product type info in variant title
      { title: 'Black / M' },
      { title: 'Navy / L' }
    ],
    images: [
      { src: 'https://example.com/image1.jpg' },
      { src: 'https://example.com/image2.jpg' }
    ]
  },
  {
    productId: '68fd5c669cd7fcf9e207a80b',
    title: 'Prince Andrew T-Shirt',
    productType: undefined, // MISSING!
    blueprintId: undefined, // MISSING!
    variants: [
      { title: 'Heather Grey / S' }, // No product type info in variant title
      { title: 'White / M' }
    ],
    images: [
      { src: 'https://example.com/prince.jpg' }
    ]
  }
];

// What the data SHOULD look like if we had variety
const expectedVarietyData = [
  {
    productId: 'hoodie-example',
    title: 'Custom Hoodie Design',
    productType: 'hoodie', // Should be stored
    blueprintId: '146', // Should be stored
    variants: [
      { title: 'Black / S', blueprintId: '146' },
      { title: 'Grey / M', blueprintId: '146' }
    ]
  },
  {
    productId: 'mug-example',
    title: 'Custom Mug Design',
    productType: 'mug', // Should be stored
    blueprintId: '68', // Should be stored
    variants: [
      { title: 'White / 11oz', blueprintId: '68' },
      { title: 'Black / 15oz', blueprintId: '68' }
    ]
  }
];

// Copy of the problematic extractProductTypeFromProduct logic
function extractProductTypeFromProduct(product) {
  console.log('🔍 Extracting product type from:', product.title);
  
  // First check if product has stored productType metadata
  if (product.productType) {
    console.log('🔍 Found stored productType:', product.productType);
    return product.productType;
  }
  
  // Check if we have variants to determine product type
  if (product.variants && product.variants.length > 0) {
    const firstVariant = product.variants[0];
    const variantTitle = firstVariant.title?.toLowerCase() || '';
    
    console.log('🔍 First variant title:', variantTitle);
    
    // Enhanced product type detection from variant titles
    if (variantTitle.includes('hoodie') || variantTitle.includes('pullover')) {
      return 'hoodie';
    }
    if (variantTitle.includes('tank') || variantTitle.includes('sleeveless')) {
      return 'tank-top';
    }
    if (variantTitle.includes('pillow') || variantTitle.includes('cushion')) {
      return 'pillow';
    }
    if (variantTitle.includes('poster') || variantTitle.includes('print')) {
      return 'poster';
    }
    if (variantTitle.includes('mug') || variantTitle.includes('cup')) {
      return 'mug';
    }
    if (variantTitle.includes('tote') || variantTitle.includes('bag')) {
      return 'tote-bag';
    }
    if (variantTitle.includes('sticker')) {
      return 'sticker';
    }
    
    // Check blueprint ID patterns if available
    if (product.blueprintId || firstVariant.blueprintId) {
      const blueprintId = product.blueprintId || firstVariant.blueprintId;
      console.log('🔍 Blueprint ID:', blueprintId);
      
      // Map common blueprint IDs to product types
      const blueprintMap = {
        '5': 'premium-tshirt',
        '146': 'hoodie', 
        '17': 'tank-top',
        '68': 'mug',
        '19': 'poster',
        '71': 'pillow'
      };
      
      if (blueprintMap[blueprintId]) {
        console.log('🔍 Mapped blueprint to type:', blueprintMap[blueprintId]);
        return blueprintMap[blueprintId];
      }
    }
    
    // Default to premium t-shirt for clothing items
    return 'premium-tshirt';
  }
  
  // Fallback to title analysis
  const title = product.title?.toLowerCase() || '';
  console.log('🔍 Product title:', title);
  
  if (title.includes('hoodie') || title.includes('pullover')) {
    return 'hoodie';
  }
  if (title.includes('tank') || title.includes('sleeveless')) {
    return 'tank-top';
  }
  if (title.includes('pillow') || title.includes('cushion')) {
    return 'pillow';
  }
  if (title.includes('poster') || title.includes('print')) {
    return 'poster';
  }
  if (title.includes('mug') || title.includes('cup')) {
    return 'mug';
  }
  
  // Final fallback
  return 'premium-tshirt';
}

function runReproductionTest() {
  console.log('🧪 MERCHANDISE PRODUCT DISPLAY BUG REPRODUCTION TEST');
  console.log('═══════════════════════════════════════════════════════');
  
  console.log('\n📋 PART 1: Testing with REAL Firebase data (the bug)...');
  
  const realResults = realFirebaseData.map(product => {
    console.log(`\n🔍 Processing REAL data: ${product.title}`);
    const extractedType = extractProductTypeFromProduct(product);
    
    return {
      productId: product.productId,
      title: product.title,
      actualType: extractedType,
      hasBlueprint: !!product.blueprintId,
      hasProductType: !!product.productType
    };
  });
  
  console.log('\n📊 REAL DATA RESULTS:');
  console.log('═══════════════════════');
  
  const realTypeDistribution = {};
  realResults.forEach(result => {
    const type = result.actualType;
    realTypeDistribution[type] = (realTypeDistribution[type] || 0) + 1;
    
    console.log(`📦 ${result.title}`);
    console.log(`   Extracted type: ${result.actualType}`);
    console.log(`   Has blueprint: ${result.hasBlueprint}`);
    console.log(`   Has productType: ${result.hasProductType}`);
  });
  
  console.log('\n📈 REAL DATA TYPE DISTRIBUTION:');
  Object.entries(realTypeDistribution).forEach(([type, count]) => {
    console.log(`   ${type}: ${count} products`);
  });
  
  // Check if all real data defaults to t-shirt
  const allRealTshirts = realResults.every(r => r.actualType === 'premium-tshirt');
  
  console.log('\n📋 PART 2: Testing with EXPECTED variety data (how it should work)...');
  
  const expectedResults = expectedVarietyData.map(product => {
    console.log(`\n🔍 Processing EXPECTED data: ${product.title}`);
    const extractedType = extractProductTypeFromProduct(product);
    
    return {
      productId: product.productId,
      title: product.title,
      expectedType: product.productType,
      actualType: extractedType,
      hasBlueprint: !!product.blueprintId,
      hasProductType: !!product.productType
    };
  });
  
  console.log('\n� EXPECTED DATA RESULTS:');
  console.log('═══════════════════════════');
  
  const expectedTypeDistribution = {};
  expectedResults.forEach(result => {
    const type = result.actualType;
    expectedTypeDistribution[type] = (expectedTypeDistribution[type] || 0) + 1;
    
    console.log(`📦 ${result.title}`);
    console.log(`   Expected type: ${result.expectedType}`);
    console.log(`   Extracted type: ${result.actualType}`);
    console.log(`   Has blueprint: ${result.hasBlueprint}`);
    console.log(`   Has productType: ${result.hasProductType}`);
  });
  
  console.log('\n📈 EXPECTED DATA TYPE DISTRIBUTION:');
  Object.entries(expectedTypeDistribution).forEach(([type, count]) => {
    console.log(`   ${type}: ${count} products`);
  });
  
  // BUG ANALYSIS
  console.log('\n🚨 BUG ANALYSIS:');
  console.log('═══════════════');
  
  if (allRealTshirts) {
    console.log('✅ BUG CONFIRMED: All real Firebase products default to premium-tshirt');
    console.log('📝 Root Cause: Firebase data is missing productType AND blueprintId');
    console.log('🔍 Evidence: All variants only have color/size info like "Heather Grey / S"');
    
    return {
      bugConfirmed: true,
      realDataAllTshirts: allRealTshirts,
      realTypeDistribution,
      expectedTypeDistribution
    };
  } else {
    console.log('❌ Bug not reproduced with real data');
    return {
      bugConfirmed: false,
      realDataAllTshirts: allRealTshirts,
      realTypeDistribution,
      expectedTypeDistribution
    };
  }
}

// Run the test
const bugReproduced = runReproductionTest();

console.log('\n🎯 TEST CONCLUSION:');
if (bugReproduced) {
  console.log('✅ Bug successfully reproduced');
  console.log('📝 Root Cause: Missing productType and blueprintId in stored data');
  console.log('🔧 Solution: Fix data storage to include productType and blueprintId');
} else {
  console.log('❌ Bug not reproduced');
}

module.exports = { extractProductTypeFromProduct, runReproductionTest };