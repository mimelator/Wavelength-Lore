/**
 * Product Types Configuration
 * 
 * Defines available product types for guided merchandise creation
 * Users will pick from these predefined options instead of naming products themselves
 */

const ProductTypes = {
  // T-Shirts and Apparel
  apparel: {
    name: 'Apparel',
    icon: '👕',
    description: 'Clothing and wearables',
    products: [
      {
        id: 'premium-tshirt',
        name: 'Premium T-Shirt',
        description: 'High-quality cotton t-shirt perfect for everyday wear',
        blueprintId: 5,
        printProviderId: 3,
        icon: '👕',
        tags: ['apparel', 'tshirt', 'cotton', 'premium'],
        basePrice: 2099, // $20.99
        popularSizes: ['S', 'M', 'L', 'XL'],
        availableColors: ['Black', 'White', 'Navy', 'Grey'],
        printArea: { width: 10, height: 12 }, // inches
        nameTemplates: [
          'Wavelength {characterName} Memory',
          '{characterName} Chronicles Tee',
          'Episode {episodeNumber} Collection',
          'Wavelength Lore Classic',
          '{seasonName} Season Memory'
        ]
      },
      {
        id: 'hoodie',
        name: 'Pullover Hoodie',
        description: 'Cozy hoodie with front pocket perfect for cool weather',
        blueprintId: 146,
        printProviderId: 3,
        icon: '🧥',
        tags: ['apparel', 'hoodie', 'warm', 'comfort'],
        basePrice: 3499, // $34.99
        popularSizes: ['S', 'M', 'L', 'XL'],
        availableColors: ['Black', 'Grey', 'Navy'],
        printArea: { width: 10, height: 12 },
        nameTemplates: [
          'Wavelength {characterName} Hoodie',
          '{characterName} Adventure Hoodie',
          'Episode {episodeNumber} Memories',
          'Wavelength Lore Comfort',
          '{seasonName} Season Hoodie'
        ]
      },
      {
        id: 'tank-top',
        name: 'Tank Top',
        description: 'Light and airy tank top for warm weather',
        blueprintId: 388,
        printProviderId: 3,
        icon: '🎽',
        tags: ['apparel', 'tank', 'summer', 'light'],
        basePrice: 1899, // $18.99
        popularSizes: ['S', 'M', 'L', 'XL'],
        availableColors: ['White', 'Black', 'Grey'],
        printArea: { width: 8, height: 10 },
        nameTemplates: [
          'Wavelength {characterName} Tank',
          '{characterName} Summer Vibes',
          'Episode {episodeNumber} Tank',
          'Wavelength Adventure Tank',
          '{seasonName} Season Tank'
        ]
      }
    ]
  },

  // Home & Living
  home: {
    name: 'Home & Living',
    icon: '🏠',
    description: 'Items for your living space',
    products: [
      {
        id: 'mug',
        name: 'Ceramic Mug',
        description: 'Premium ceramic mug perfect for your morning coffee or tea',
        blueprintId: 17,
        printProviderId: 5,
        icon: '☕',
        tags: ['home', 'mug', 'ceramic', 'coffee'],
        basePrice: 1299, // $12.99
        popularSizes: ['11oz', '15oz'],
        availableColors: ['White', 'Black'],
        printArea: { width: 8.5, height: 3.5 },
        nameTemplates: [
          'Wavelength {characterName} Mug',
          '{characterName} Morning Coffee',
          'Episode {episodeNumber} Memories',
          'Wavelength Lore Brew',
          '{seasonName} Season Mug'
        ]
      },
      {
        id: 'poster',
        name: 'Premium Poster',
        description: 'High-quality poster print perfect for framing',
        blueprintId: 7,
        printProviderId: 1,
        icon: '🖼️',
        tags: ['home', 'poster', 'wall-art', 'decor'],
        basePrice: 899, // $8.99
        popularSizes: ['12x18', '16x24', '18x24'],
        availableColors: ['Matte', 'Glossy'],
        printArea: { width: 16, height: 24 },
        nameTemplates: [
          'Wavelength {characterName} Poster',
          '{characterName} Chronicles Art',
          'Episode {episodeNumber} Print',
          'Wavelength Lore Poster',
          '{seasonName} Season Art'
        ]
      },
      {
        id: 'canvas',
        name: 'Canvas Print',
        description: 'Museum-quality canvas print ready to hang',
        blueprintId: 165,
        printProviderId: 1,
        icon: '🎨',
        tags: ['home', 'canvas', 'art', 'premium'],
        basePrice: 2499, // $24.99
        popularSizes: ['12x16', '16x20', '20x24'],
        availableColors: ['Canvas'],
        printArea: { width: 16, height: 20 },
        nameTemplates: [
          'Wavelength {characterName} Canvas',
          '{characterName} Art Collection',
          'Episode {episodeNumber} Canvas',
          'Wavelength Memories Canvas',
          '{seasonName} Season Canvas'
        ]
      }
    ]
  },

  // Accessories
  accessories: {
    name: 'Accessories',
    icon: '🎒',
    description: 'Bags, accessories, and more',
    products: [
      {
        id: 'tote-bag',
        name: 'Tote Bag',
        description: 'Durable canvas tote bag perfect for everyday use',
        blueprintId: 34,
        printProviderId: 7,
        icon: '👜',
        tags: ['accessories', 'bag', 'canvas', 'practical'],
        basePrice: 1599, // $15.99
        popularSizes: ['Standard'],
        availableColors: ['Natural', 'Black'],
        printArea: { width: 10, height: 12 },
        nameTemplates: [
          'Wavelength {characterName} Tote',
          '{characterName} Adventure Bag',
          'Episode {episodeNumber} Tote',
          'Wavelength Lore Bag',
          '{seasonName} Season Tote'
        ]
      },
      {
        id: 'phone-case',
        name: 'Phone Case',
        description: 'Protective phone case with your favorite design',
        blueprintId: 898,
        printProviderId: 12,
        icon: '📱',
        tags: ['accessories', 'phone', 'case', 'protective'],
        basePrice: 1199, // $11.99
        popularSizes: ['iPhone 12', 'iPhone 13', 'iPhone 14', 'iPhone 15'],
        availableColors: ['Clear', 'Black'],
        printArea: { width: 2.5, height: 5 },
        nameTemplates: [
          'Wavelength {characterName} Case',
          '{characterName} Phone Protection',
          'Episode {episodeNumber} Case',
          'Wavelength Lore Case',
          '{seasonName} Season Case'
        ]
      },
      {
        id: 'sticker',
        name: 'Die-Cut Sticker',
        description: 'Waterproof vinyl sticker perfect for laptops and more',
        blueprintId: 947,
        printProviderId: 15,
        icon: '🏷️',
        tags: ['accessories', 'sticker', 'vinyl', 'waterproof'],
        basePrice: 299, // $2.99
        popularSizes: ['2x2', '3x3', '4x4'],
        availableColors: ['Clear Background'],
        printArea: { width: 3, height: 3 },
        nameTemplates: [
          'Wavelength {characterName} Sticker',
          '{characterName} Mini Art',
          'Episode {episodeNumber} Sticker',
          'Wavelength Lore Sticker',
          '{seasonName} Season Sticker'
        ]
      }
    ]
  }
};

/**
 * Character-specific naming patterns
 * These will be used to generate product names based on the selected image's context
 */
const CharacterPatterns = {
  // Main characters
  'daphne': {
    adjectives: ['Mystical', 'Wise', 'Ancient', 'Powerful'],
    themes: ['Magic', 'Wisdom', 'Forest', 'Nature'],
    titles: ['Oracle', 'Guardian', 'Sage', 'Mystic']
  },
  'lucky': {
    adjectives: ['Brave', 'Bold', 'Adventurous', 'Loyal'],
    themes: ['Adventure', 'Courage', 'Journey', 'Quest'],
    titles: ['Hero', 'Explorer', 'Champion', 'Adventurer']
  },
  'goblin-king': {
    adjectives: ['Regal', 'Mysterious', 'Ancient', 'Powerful'],
    themes: ['Kingdom', 'Magic', 'Shadow', 'Mystery'],
    titles: ['Ruler', 'Sovereign', 'King', 'Lord']
  },
  'felix': {
    adjectives: ['Clever', 'Quick', 'Smart', 'Witty'],
    themes: ['Intelligence', 'Strategy', 'Mind', 'Cleverness'],
    titles: ['Strategist', 'Thinker', 'Genius', 'Scholar']
  }
};

/**
 * Episode-specific naming patterns
 */
const EpisodePatterns = {
  seasonal: {
    spring: ['Renewal', 'Growth', 'Awakening', 'Fresh'],
    summer: ['Adventure', 'Journey', 'Bright', 'Warm'],
    autumn: ['Change', 'Transition', 'Golden', 'Harvest'],
    winter: ['Reflection', 'Quiet', 'Deep', 'Mystical']
  },
  emotions: ['Epic', 'Memorable', 'Legendary', 'Iconic', 'Unforgettable'],
  actions: ['Chronicles', 'Tales', 'Stories', 'Memories', 'Adventures']
};

/**
 * Generate product name based on selected image and product type
 */
function generateProductName(productType, imageContext = {}) {
  const { characterName, episodeNumber, seasonName, imageTitle } = imageContext;
  const product = findProductById(productType);
  
  if (!product || !product.nameTemplates) {
    return `Wavelength ${productType} Collection`;
  }
  
  // Pick a random template
  const template = product.nameTemplates[Math.floor(Math.random() * product.nameTemplates.length)];
  
  // Replace placeholders
  let name = template
    .replace('{characterName}', characterName || 'Lore')
    .replace('{episodeNumber}', episodeNumber || 'Special')
    .replace('{seasonName}', seasonName || 'Classic')
    .replace('{imageTitle}', imageTitle || 'Memory');
  
  return name;
}

/**
 * Generate product description based on image and product type
 */
function generateProductDescription(productType, imageContext = {}) {
  const { characterName, episodeNumber, locationName, imageTitle } = imageContext;
  const product = findProductById(productType);
  
  if (!product) {
    return 'Custom Wavelength Lore merchandise featuring your favorite moments.';
  }
  
  const baseDescription = product.description;
  
  // Add context-specific details
  let contextDescription = '';
  if (characterName) {
    contextDescription += `Featuring ${characterName} from Wavelength Lore. `;
  }
  if (episodeNumber) {
    contextDescription += `From Episode ${episodeNumber}. `;
  }
  if (locationName) {
    contextDescription += `Set in ${locationName}. `;
  }
  
  return `${baseDescription}. ${contextDescription}Perfect for fans of the Wavelength Lore universe.`;
}

/**
 * Generate product tags based on image context and product type
 */
function generateProductTags(productType, imageContext = {}) {
  const { characterName, episodeNumber, seasonName, themes = [] } = imageContext;
  const product = findProductById(productType);
  
  const baseTags = product ? [...product.tags] : ['wavelength', 'lore', 'custom'];
  
  // Add context tags
  if (characterName) {
    baseTags.push(characterName.toLowerCase().replace(/\s+/g, '-'));
  }
  if (episodeNumber) {
    baseTags.push(`episode-${episodeNumber}`);
  }
  if (seasonName) {
    baseTags.push(seasonName.toLowerCase().replace(/\s+/g, '-'));
  }
  
  // Add theme tags
  themes.forEach(theme => {
    baseTags.push(theme.toLowerCase().replace(/\s+/g, '-'));
  });
  
  // Add general tags
  baseTags.push('wavelength-lore', 'custom-merchandise', 'fan-art');
  
  return [...new Set(baseTags)]; // Remove duplicates
}

/**
 * Find product by ID across all categories
 */
function findProductById(productId) {
  for (const category of Object.values(ProductTypes)) {
    const product = category.products.find(p => p.id === productId);
    if (product) return product;
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