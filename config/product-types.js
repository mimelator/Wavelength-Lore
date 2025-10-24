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
        id: 'pillow',
        name: 'Square Pillow',
        description: 'Spun polyester square pillow perfect for home decor',
        blueprintId: 220,
        printProviderId: 10,
        icon: '🛋️',
        tags: ['home', 'pillow', 'decor', 'polyester'],
        basePrice: 2499, // $24.99
        popularSizes: ['14x14', '16x16', '18x18'],
        availableColors: ['White'],
        printArea: { width: 14, height: 14 },
        nameTemplates: [
          'Wavelength {characterName} Pillow',
          '{characterName} Comfort Collection',
          'Episode {episodeNumber} Memories',
          'Wavelength Lore Decor',
          '{seasonName} Season Pillow'
        ]
      },
      {
        id: 'womens-tee',
        name: 'Women\'s Favorite Tee',
        description: 'Made to feel like a well-loved favorite with feminine fit',
        blueprintId: 9,
        printProviderId: 3,
        icon: '👕',
        tags: ['apparel', 'tshirt', 'women', 'fitted'],
        basePrice: 1899, // $18.99
        popularSizes: ['S', 'M', 'L', 'XL', '2XL'],
        availableColors: ['Black', 'White', 'Navy', 'Heather'],
        printArea: { width: 9, height: 11 },
        nameTemplates: [
          'Wavelength {characterName} Women\'s Tee',
          '{characterName} Style Collection',
          'Episode {episodeNumber} Favorite',
          'Wavelength Lore Women\'s Tee',
          '{seasonName} Season Style'
        ]
      },
      {
        id: 'heavy-cotton-tee',
        name: 'Heavy Cotton Tee',
        description: 'Dependable classic made for everyday wear',
        blueprintId: 6,
        printProviderId: 3,
        icon: '👕',
        tags: ['apparel', 'tshirt', 'cotton', 'heavy', 'unisex'],
        basePrice: 1699, // $16.99
        popularSizes: ['S', 'M', 'L', 'XL', '2XL', '3XL'],
        availableColors: ['Black', 'White', 'Navy', 'Grey', 'Red'],
        printArea: { width: 10, height: 12 },
        nameTemplates: [
          'Wavelength {characterName} Heavy Tee',
          '{characterName} Classic Collection',
          'Episode {episodeNumber} Tee',
          'Wavelength Lore Classic',
          '{seasonName} Season Tee'
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
        id: 'infant-tee',
        name: 'Infant Fine Jersey Tee',
        description: 'Perfect balance between comfort and toddler-specific durability',
        blueprintId: 34,
        printProviderId: 29,
        icon: '👕',
        tags: ['apparel', 'infant', 'tshirt', 'baby'],
        basePrice: 1299, // $12.99
        popularSizes: ['6M', '12M', '18M', '24M'],
        availableColors: ['White', 'Pink', 'Blue', 'Yellow'],
        printArea: { width: 6, height: 8 },
        nameTemplates: [
          'Wavelength {characterName} Baby Tee',
          '{characterName} Little One',
          'Episode {episodeNumber} Infant',
          'Wavelength Lore Baby',
          '{seasonName} Season Infant'
        ]
      },
      {
        id: 'ultra-cotton-tee',
        name: 'Ultra Cotton Tee',
        description: 'Classic unisex ultra cotton tee with quality construction',
        blueprintId: 36,
        printProviderId: 3,
        icon: '👕',
        tags: ['apparel', 'tshirt', 'cotton', 'ultra', 'unisex'],
        basePrice: 1599, // $15.99
        popularSizes: ['S', 'M', 'L', 'XL', '2XL', '3XL'],
        availableColors: ['Black', 'White', 'Navy', 'Grey', 'Red', 'Royal Blue'],
        printArea: { width: 10, height: 12 },
        nameTemplates: [
          'Wavelength {characterName} Ultra Tee',
          '{characterName} Ultra Collection',
          'Episode {episodeNumber} Tee',
          'Wavelength Lore Ultra',
          '{seasonName} Season Tee'
        ]
      },
      {
        id: 'ultra-cotton-alt',
        name: 'Ultra Cotton Tee (Alt)',
        description: 'Classic unisex ultra cotton tee with quality construction',
        blueprintId: 36,
        printProviderId: 29,
        icon: '👕',
        tags: ['apparel', 'tshirt', 'cotton', 'ultra', 'unisex'],
        basePrice: 1599, // $15.99
        popularSizes: ['S', 'M', 'L', 'XL', '2XL'],
        availableColors: ['Black', 'White', 'Navy', 'Grey'],
        printArea: { width: 10, height: 12 },
        nameTemplates: [
          'Wavelength {characterName} Ultra Tee',
          '{characterName} Ultra Collection',
          'Episode {episodeNumber} Tee',
          'Wavelength Lore Ultra',
          '{seasonName} Season Tee'
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