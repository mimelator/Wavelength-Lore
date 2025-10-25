/**
 * Import All Printify Products
 * Discovers and imports all available blueprints from Printify API
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const PRINTIFY_API_BASE = 'https://api.printify.com/v1';
const PRINTIFY_TOKEN = process.env.PRINTIFY_API_TOKEN;

if (!PRINTIFY_TOKEN) {
  console.error('❌ PRINTIFY_API_TOKEN not found in environment variables');
  process.exit(1);
}

async function makeRequest(endpoint) {
  const response = await fetch(`${PRINTIFY_API_BASE}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${PRINTIFY_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

async function getAllBlueprints() {
  console.log('🔍 Fetching all Printify blueprints...');
  
  try {
    const blueprints = await makeRequest('/catalog/blueprints.json');
    console.log(`📋 Found ${blueprints.length} total blueprints`);
    
    const categorizedBlueprints = {
      apparel: [],
      home: [],
      accessories: [],
      other: []
    };
    
    for (const blueprint of blueprints) {
      console.log(`\n📦 Processing: ${blueprint.title} (ID: ${blueprint.id})`);
      
      try {
        // Get print providers for this blueprint
        const providers = await makeRequest(`/catalog/blueprints/${blueprint.id}/print_providers.json`);
        
        if (providers.length === 0) {
          console.log('   ⚠️  No print providers available');
          continue;
        }
        
        // Categorize blueprint
        const category = categorizeBlueprint(blueprint);
        
        const blueprintData = {
          id: blueprint.id,
          title: blueprint.title,
          description: blueprint.description,
          brand: blueprint.brand,
          model: blueprint.model,
          images: blueprint.images,
          providers: providers.map(p => ({
            id: p.id,
            title: p.title,
            location: p.location?.country || 'Unknown'
          })),
          category
        };
        
        categorizedBlueprints[category].push(blueprintData);
        console.log(`   ✅ Added to ${category} (${providers.length} providers)`);
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.log(`   ❌ Error processing blueprint: ${error.message}`);
      }
    }
    
    return categorizedBlueprints;
    
  } catch (error) {
    console.error('❌ Error fetching blueprints:', error);
    throw error;
  }
}

function categorizeBlueprint(blueprint) {
  const title = blueprint.title.toLowerCase();
  const description = blueprint.description?.toLowerCase() || '';
  const model = blueprint.model?.toLowerCase() || '';
  
  // Apparel keywords
  if (title.includes('tee') || title.includes('shirt') || title.includes('hoodie') || 
      title.includes('tank') || title.includes('sweatshirt') || title.includes('jersey') ||
      title.includes('apparel') || model.includes('shirt')) {
    return 'apparel';
  }
  
  // Home & Living keywords
  if (title.includes('mug') || title.includes('cup') || title.includes('pillow') ||
      title.includes('poster') || title.includes('canvas') || title.includes('print') ||
      title.includes('wall') || title.includes('home') || title.includes('decor')) {
    return 'home';
  }
  
  // Accessories keywords
  if (title.includes('bag') || title.includes('tote') || title.includes('phone') ||
      title.includes('case') || title.includes('sticker') || title.includes('decal') ||
      title.includes('accessory') || title.includes('keychain') || title.includes('hat')) {
    return 'accessories';
  }
  
  return 'other';
}

async function generateProductConfig(blueprints) {
  console.log('\n🔧 Generating product configuration...');
  
  const productTypes = {
    apparel: {
      name: 'T-Shirts & Apparel',
      icon: '👕',
      description: 'Clothing and wearables',
      products: []
    },
    home: {
      name: 'Home & Living',
      icon: '🏠',
      description: 'Items for your living space',
      products: []
    },
    accessories: {
      name: 'Accessories',
      icon: '🎒',
      description: 'Bags, accessories, and more',
      products: []
    }
  };
  
  // Process each category
  for (const [category, items] of Object.entries(blueprints)) {
    if (category === 'other' || !productTypes[category]) continue;
    
    for (const blueprint of items.slice(0, 10)) { // Limit to top 10 per category
      const product = {
        id: `blueprint-${blueprint.id}`,
        name: blueprint.title,
        description: cleanDescription(blueprint.description),
        blueprintId: blueprint.id,
        printProviderId: blueprint.providers[0]?.id || 3,
        icon: getCategoryIcon(category, blueprint.title),
        genericImage: blueprint.images?.[0] || `https://images.printify.com/mockup/${blueprint.id}/0/1581405237.jpg`,
        tags: generateTags(blueprint),
        basePrice: estimatePrice(blueprint.title),
        popularSizes: getPopularSizes(blueprint.title),
        availableColors: getAvailableColors(blueprint.title),
        printArea: getPrintArea(blueprint.title),
        nameTemplates: [
          'Wavelength {characterName} Memory',
          '{characterName} Chronicles',
          'Episode {episodeNumber} Collection',
          'Wavelength Lore Classic',
          '{seasonName} Season Memory'
        ]
      };
      
      productTypes[category].products.push(product);
    }
  }
  
  return productTypes;
}

function cleanDescription(description) {
  if (!description) return 'Custom Wavelength Lore merchandise';
  
  // Remove HTML tags and clean up
  return description
    .replace(/<[^>]*>/g, '')
    .replace(/\n/g, ' ')
    .trim()
    .substring(0, 200) + (description.length > 200 ? '...' : '');
}

function getCategoryIcon(category, title) {
  const titleLower = title.toLowerCase();
  
  if (category === 'apparel') {
    if (titleLower.includes('hoodie')) return '🧥';
    if (titleLower.includes('tank')) return '🎽';
    if (titleLower.includes('women') || titleLower.includes('ladies')) return '👚';
    if (titleLower.includes('infant') || titleLower.includes('baby')) return '👶';
    return '👕';
  }
  
  if (category === 'home') {
    if (titleLower.includes('mug') || titleLower.includes('cup')) return '☕';
    if (titleLower.includes('pillow')) return '🛋️';
    if (titleLower.includes('poster') || titleLower.includes('print')) return '🖼️';
    return '🏠';
  }
  
  if (category === 'accessories') {
    if (titleLower.includes('bag') || titleLower.includes('tote')) return '👜';
    if (titleLower.includes('phone') || titleLower.includes('case')) return '📱';
    if (titleLower.includes('hat') || titleLower.includes('cap')) return '🧢';
    return '🎒';
  }
  
  return '📦';
}

function generateTags(blueprint) {
  const tags = ['wavelength', 'lore', 'custom'];
  const title = blueprint.title.toLowerCase();
  
  if (title.includes('cotton')) tags.push('cotton');
  if (title.includes('premium')) tags.push('premium');
  if (title.includes('heavy')) tags.push('heavy');
  if (title.includes('soft')) tags.push('soft');
  if (title.includes('unisex')) tags.push('unisex');
  
  return tags;
}

function estimatePrice(title) {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('premium')) return 2099; // $20.99
  if (titleLower.includes('hoodie')) return 3499; // $34.99
  if (titleLower.includes('mug')) return 1599; // $15.99
  if (titleLower.includes('pillow')) return 2499; // $24.99
  if (titleLower.includes('infant') || titleLower.includes('baby')) return 1299; // $12.99
  
  return 1899; // $18.99 default
}

function getPopularSizes(title) {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('infant') || titleLower.includes('baby')) {
    return ['6M', '12M', '18M', '24M'];
  }
  
  if (titleLower.includes('mug') || titleLower.includes('cup')) {
    return ['11oz', '15oz'];
  }
  
  if (titleLower.includes('pillow')) {
    return ['14x14', '16x16', '18x18'];
  }
  
  return ['S', 'M', 'L', 'XL'];
}

function getAvailableColors(title) {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('infant') || titleLower.includes('baby')) {
    return ['White', 'Pink', 'Blue', 'Yellow'];
  }
  
  if (titleLower.includes('women') || titleLower.includes('ladies')) {
    return ['Black', 'White', 'Navy', 'Heather', 'Pink'];
  }
  
  return ['Black', 'White', 'Navy', 'Grey'];
}

function getPrintArea(title) {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('mug') || titleLower.includes('cup')) {
    return { width: 8, height: 4 };
  }
  
  if (titleLower.includes('pillow')) {
    return { width: 14, height: 14 };
  }
  
  if (titleLower.includes('infant') || titleLower.includes('baby')) {
    return { width: 6, height: 8 };
  }
  
  if (titleLower.includes('tank')) {
    return { width: 8, height: 10 };
  }
  
  return { width: 10, height: 12 };
}

async function main() {
  try {
    console.log('🚀 Starting Printify product import...\n');
    
    // Get all blueprints
    const blueprints = await getAllBlueprints();
    
    // Save raw blueprint data
    const blueprintFile = path.join(__dirname, '../config/printify-blueprints-complete.json');
    fs.writeFileSync(blueprintFile, JSON.stringify({
      discoveredAt: new Date().toISOString(),
      totalBlueprints: Object.values(blueprints).flat().length,
      categories: {
        apparel: blueprints.apparel.length,
        home: blueprints.home.length,
        accessories: blueprints.accessories.length,
        other: blueprints.other.length
      },
      blueprints
    }, null, 2));
    
    console.log(`\n💾 Saved complete blueprint data to ${blueprintFile}`);
    
    // Generate product configuration
    const productConfig = await generateProductConfig(blueprints);
    
    // Save product configuration
    const configFile = path.join(__dirname, '../config/product-types-complete.js');
    const configContent = `/**
 * Complete Product Types Configuration
 * Generated from Printify API on ${new Date().toISOString()}
 */

const ProductTypes = ${JSON.stringify(productConfig, null, 2)};

module.exports = {
  ProductTypes,
  // ... other exports from original file
};`;
    
    fs.writeFileSync(configFile, configContent);
    console.log(`💾 Saved product configuration to ${configFile}`);
    
    // Summary
    console.log('\n📊 Import Summary:');
    console.log(`   Apparel: ${blueprints.apparel.length} blueprints`);
    console.log(`   Home & Living: ${blueprints.home.length} blueprints`);
    console.log(`   Accessories: ${blueprints.accessories.length} blueprints`);
    console.log(`   Other: ${blueprints.other.length} blueprints`);
    console.log(`   Total: ${Object.values(blueprints).flat().length} blueprints`);
    
    console.log('\n🎉 Import completed successfully!');
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { getAllBlueprints, generateProductConfig };