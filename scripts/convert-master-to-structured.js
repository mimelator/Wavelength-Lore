#!/usr/bin/env node

/**
 * Convert flat master catalog to structured format for merchandise store
 * Takes the 136-product validated master catalog and organizes it into
 * the ProductTypes structure expected by the merchandise store.
 */

const fs = require('fs');
const path = require('path');

// Load the flat master catalog
const flatMasterCatalog = require('../config/product-types.js');

console.log('🔄 Converting 136-product master catalog to structured format...');

// Category mappings for better organization
const categoryMappings = {
  // T-Shirts and similar apparel
  't-shirt': 'apparel',
  'heavy-cotton-tee': 'apparel', 
  'tank-top': 'apparel',
  'women-tee': 'apparel',
  'premium-tshirt': 'apparel',
  
  // Hoodies and warm clothing
  'hoodie': 'apparel',
  'sweatshirt': 'apparel',
  'zip-hoodie': 'apparel',
  'pullover-hoodie': 'apparel',
  
  // Home items
  'coffee-mug': 'home',
  'travel-mug': 'home',
  'water-bottle': 'home',
  'pillow': 'home',
  'blanket': 'home',
  'canvas': 'home',
  'poster': 'home',
  'mousepad': 'home',
  'apron': 'home',
  
  // Accessories
  'tote-bag': 'accessories',
  'phone-case': 'accessories',
  'sticker': 'accessories',
  'laptop-sleeve': 'accessories',
  'backpack': 'accessories',
  'hat': 'accessories',
  'fanny-pack': 'accessories',
  
  // Special categories
  'infant-wear': 'kids',
  'notebook': 'office',
  'specialty-item': 'specialty'
};

// Category info
const categoryInfo = {
  apparel: {
    name: 'Apparel',
    icon: '👕',
    description: 'Clothing and wearables'
  },
  home: {
    name: 'Home & Living', 
    icon: '🏠',
    description: 'Home decor and kitchen items'
  },
  accessories: {
    name: 'Accessories',
    icon: '🎒', 
    description: 'Bags, cases, and personal accessories'
  },
  kids: {
    name: 'Kids & Baby',
    icon: '👶',
    description: 'Products for children and babies'
  },
  office: {
    name: 'Office & Stationery',
    icon: '📝',
    description: 'Office supplies and stationery items'
  },
  specialty: {
    name: 'Specialty Items',
    icon: '🎁',
    description: 'Unique and specialty products'
  }
};

// Convert flat structure to organized ProductTypes
const ProductTypes = {};

let totalProducts = 0;
const categoryStats = {};

// Process each product from the flat catalog
Object.values(flatMasterCatalog).forEach(product => {
  if (!product.id || !product.category) return;
  
  const structuredCategory = categoryMappings[product.category] || 'specialty';
  
  // Initialize category if it doesn't exist
  if (!ProductTypes[structuredCategory]) {
    ProductTypes[structuredCategory] = {
      ...categoryInfo[structuredCategory],
      products: []
    };
    categoryStats[structuredCategory] = 0;
  }
  
  // Convert product to structured format
  const structuredProduct = {
    id: product.id,
    name: product.name || product.title,
    description: product.description ? 
      product.description.replace(/<[^>]*>/g, ' ').substring(0, 200) + '...' :
      `High-quality ${product.category} with custom design options`,
    blueprintId: product.blueprintId,
    printProviderId: product.printProviderId,
    icon: getProductIcon(product.category),
    category: structuredCategory,
    provider: product.provider || 'Print Provider',
    tags: generateTags(product),
    basePrice: estimatePrice(product.category),
    validated: true
  };
  
  ProductTypes[structuredCategory].products.push(structuredProduct);
  categoryStats[structuredCategory]++;
  totalProducts++;
});

// Helper functions
function getProductIcon(category) {
  const icons = {
    't-shirt': '👕',
    'heavy-cotton-tee': '👕', 
    'tank-top': '👕',
    'women-tee': '👕',
    'premium-tshirt': '👕',
    'hoodie': '🥽',
    'sweatshirt': '🥽',
    'zip-hoodie': '🥽',
    'pullover-hoodie': '🥽',
    'coffee-mug': '☕',
    'travel-mug': '☕',
    'water-bottle': '🍼',
    'pillow': '🛏️',
    'blanket': '🛏️',
    'canvas': '🖼️',
    'poster': '🖼️',
    'mousepad': '🖱️',
    'apron': '👩‍🍳',
    'tote-bag': '🛍️',
    'phone-case': '📱',
    'sticker': '✨',
    'laptop-sleeve': '💻',
    'backpack': '🎒',
    'hat': '🧢',
    'fanny-pack': '👜',
    'infant-wear': '👶',
    'notebook': '📝',
    'specialty-item': '🎁'
  };
  return icons[category] || '📦';
}

function generateTags(product) {
  const baseTags = [product.category];
  
  // Add category-specific tags
  if (product.category.includes('shirt') || product.category.includes('tee')) {
    baseTags.push('apparel', 'shirt', 'custom');
  } else if (product.category.includes('hoodie') || product.category.includes('sweatshirt')) {
    baseTags.push('apparel', 'warm', 'casual');
  } else if (product.category.includes('mug') || product.category.includes('bottle')) {
    baseTags.push('home', 'drinkware', 'kitchen');
  } else if (product.category.includes('bag') || product.category.includes('case')) {
    baseTags.push('accessories', 'storage', 'portable');
  }
  
  baseTags.push('wavelength', 'custom', 'quality');
  return baseTags.slice(0, 8); // Limit to 8 tags
}

function estimatePrice(category) {
  const priceRanges = {
    't-shirt': 2099,
    'heavy-cotton-tee': 2199,
    'tank-top': 2299,
    'women-tee': 2199,
    'premium-tshirt': 2399,
    'hoodie': 3499,
    'sweatshirt': 3299,
    'zip-hoodie': 3699,
    'pullover-hoodie': 3399,
    'coffee-mug': 1599,
    'travel-mug': 2599,
    'water-bottle': 2799,
    'pillow': 2899,
    'blanket': 4299,
    'canvas': 3999,
    'poster': 1999,
    'mousepad': 1799,
    'apron': 2999,
    'tote-bag': 2799,
    'phone-case': 1999,
    'sticker': 599,
    'laptop-sleeve': 3299,
    'backpack': 4999,
    'hat': 2199,
    'fanny-pack': 2399,
    'infant-wear': 1999,
    'notebook': 1299,
    'specialty-item': 2999
  };
  return priceRanges[category] || 2499;
}

// Generate the structured catalog content
const catalogContent = `/**
 * WAVELENGTH Expanded Master Product Types Configuration
 * 
 * Generated from 136 validated blueprint/provider combinations
 * Organized into structured categories for the merchandise store
 * All combinations have been validated against Printify API
 * 
 * Generated: ${new Date().toISOString()}
 * Total Validated Products: ${totalProducts} across ${Object.keys(ProductTypes).length} categories
 */

const ProductTypes = ${JSON.stringify(ProductTypes, null, 2)};

// Character-based naming patterns
const CharacterPatterns = {
  wavelength: ['Wavelength', 'WL', 'Frequency'],
  alex: ['Alexandria', 'Alex', 'A.D.'],
  kai: ['Kai', 'K', 'Navigator'],
  zara: ['Zara', 'Z', 'Engineer'],
  marcus: ['Marcus', 'M', 'Commander']
};

// Episode-based naming patterns  
const EpisodePatterns = {
  pilot: ['Origin', 'Beginning', 'First Contact'],
  discovery: ['Discovery', 'Found', 'Uncovered'],
  conflict: ['Battle', 'War', 'Struggle'],
  resolution: ['Victory', 'Peace', 'Resolution']
};

/**
 * Generate product name based on selected image and product type
 */
function generateProductName(imageTitle, productType, userId) {
  const templates = [
    'Wavelength {character} Memory',
    '{character} Chronicles',
    'Episode {number} Collection',
    'Wavelength Lore {character}',
    '{character} Adventure Series',
    'The {character} Collection'
  ];
  
  const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
  
  // Extract character or episode info from image title
  let characterName = 'Hero';
  if (imageTitle.toLowerCase().includes('alex')) characterName = 'Alexandria';
  if (imageTitle.toLowerCase().includes('kai')) characterName = 'Kai';
  if (imageTitle.toLowerCase().includes('zara')) characterName = 'Zara';
  if (imageTitle.toLowerCase().includes('marcus')) characterName = 'Marcus';
  
  const episodeNumber = Math.floor(Math.random() * 50) + 1;
  
  return randomTemplate
    .replace('{character}', characterName)
    .replace('{number}', episodeNumber)
    .replace('{type}', productType.name);
}

/**
 * Generate product description
 */
function generateProductDescription(imageTitle, productType, userId) {
  const baseDescription = productType.description || 'Custom Wavelength Lore merchandise';
  
  const loreDescriptions = [
    'Featuring iconic moments from the Wavelength universe',
    'Celebrate your favorite character with this exclusive design',
    'Perfect for fans of science fiction and adventure',
    'Show your love for the Wavelength saga',
    'Premium quality meets legendary storytelling'
  ];
  
  const randomLore = loreDescriptions[Math.floor(Math.random() * loreDescriptions.length)];
  
  return \`\${baseDescription}. \${randomLore}.\`;
}

/**
 * Generate product tags
 */
function generateProductTags(imageTitle, productType, userId) {
  const baseTags = productType.tags || [];
  const loreTagsets = [
    ['wavelength', 'scifi', 'adventure', 'space'],
    ['wavelength-lore', 'characters', 'premium', 'exclusive'],
    ['fan-art', 'custom', 'unique', 'collectible'],
    ['adventure', 'heroes', 'story', 'epic']
  ];
  
  const randomTagset = loreTagsets[Math.floor(Math.random() * loreTagsets.length)];
  
  return [...baseTags, ...randomTagset].slice(0, 10); // Max 10 tags
}

/**
 * Find product by ID
 */
function findProductById(productId) {
  for (const category of Object.values(ProductTypes)) {
    const product = category.products.find(p => p.id === productId);
    if (product) {
      return {
        ...product,
        categoryName: category.name,
        categoryIcon: category.icon
      };
    }
  }
  return null;
}

/**
 * Get all products as a flat array
 */
function getAllProducts() {
  const allProducts = [];
  Object.values(ProductTypes).forEach(category => {
    category.products.forEach(product => {
      allProducts.push({
        ...product,
        categoryName: category.name,
        categoryIcon: category.icon
      });
    });
  });
  return allProducts;
}

/**
 * Get products by category
 */
function getProductsByCategory(categoryKey) {
  return ProductTypes[categoryKey]?.products || [];
}

module.exports = {
  ProductTypes,
  CharacterPatterns,
  EpisodePatterns,
  generateProductName,
  generateProductDescription,
  generateProductTags,
  findProductById,
  getAllProducts,
  getProductsByCategory
};

// EXPANDED MASTER CATALOG SUMMARY:
// ================================
// Total Products: ${totalProducts} validated products from 708 blueprint analysis
// Categories: ${Object.keys(ProductTypes).length} (${Object.keys(ProductTypes).join(', ')})
// All blueprint/provider combinations validated against Printify API
// Generated: ${new Date().toISOString()}
// Status: READY FOR MASSIVE PRODUCT CATALOG! 🚀

// CATEGORY BREAKDOWN:
${Object.entries(categoryStats).map(([cat, count]) => `// ${cat}: ${count} products`).join('\\n')}
`;

// Write the structured catalog
const outputPath = path.join(__dirname, '../config/product-types-expanded-master.js');
fs.writeFileSync(outputPath, catalogContent);

console.log('\\n🎉 Structured master catalog generated!');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`✅ File: ${outputPath}`);
console.log(`📊 Total Products: ${totalProducts}`);
console.log(`📋 Categories: ${Object.keys(ProductTypes).length}`);
console.log('\\n📊 Category Breakdown:');
Object.entries(categoryStats).forEach(([category, count]) => {
  console.log(`  ${category}: ${count} products`);
});

console.log('\\n🚀 Next Steps:');
console.log('1. Update merchandise store to use expanded catalog');
console.log('2. Test with expanded product selection');
console.log('3. Deploy to production when ready');
console.log('\\n🌊 WAVELENGTH EXPANDED CATALOG READY!');