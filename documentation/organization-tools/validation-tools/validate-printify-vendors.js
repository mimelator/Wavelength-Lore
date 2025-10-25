/**
 * Validate Printify Vendors & Products
 * Tests each blueprint/provider combination to ensure they work
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const PRINTIFY_API_BASE = 'https://api.printify.com/v1';
const PRINTIFY_TOKEN = process.env.PRINTIFY_API_TOKEN;
const SHOP_ID = process.env.PRINTIFY_SHOP_ID;

// Rate limiting and progress tracking
const RATE_LIMIT_DELAY = 500; // 0.5 seconds between requests
const PROGRESS_FILE = path.join(__dirname, '../config/validation-progress.json');
const CHECKPOINT_INTERVAL = 2; // Save progress every 2 blueprints

if (!PRINTIFY_TOKEN || !SHOP_ID) {
  console.error('❌ Missing PRINTIFY_API_TOKEN or PRINTIFY_SHOP_ID');
  process.exit(1);
}

async function makeRequest(endpoint, method = 'GET', body = null) {
  // Rate limiting
  await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
  
  const response = await fetch(`${PRINTIFY_API_BASE}${endpoint}`, {
    method,
    headers: {
      'Authorization': `Bearer ${PRINTIFY_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : null
  });
  
  return { response, data: response.ok ? await response.json() : null };
}

async function testBlueprintProvider(blueprint, provider) {
  console.log(`   📊 Checking ${provider.title} (${provider.id})`);
  
  try {
    // Get variants for this blueprint/provider combo
    const { response: variantsResp, data: variants } = await makeRequest(
      `/catalog/blueprints/${blueprint.id}/print_providers/${provider.id}/variants.json`
    );
    
    if (!variantsResp.ok) {
      return { viable: false, reason: `API error: ${variantsResp.status}` };
    }
    
    if (!variants || variants.length === 0) {
      return { viable: false, reason: 'No variants available' };
    }
    
    // Validate variant data structure
    const validVariants = variants.filter(variant => 
      variant.id && 
      variant.title && 
      typeof variant.price === 'number' && 
      variant.price > 0
    );
    
    if (validVariants.length === 0) {
      return { viable: false, reason: 'No valid variants (missing required fields)' };
    }
    
    // Check provider status (if available in provider data)
    if (provider.status && provider.status !== 'active') {
      return { viable: false, reason: `Provider status: ${provider.status}` };
    }
    
    // Get shipping info to verify provider is operational
    const { response: shippingResp, data: shipping } = await makeRequest(
      `/catalog/blueprints/${blueprint.id}/print_providers/${provider.id}/shipping.json`
    );
    
    const shippingAvailable = shippingResp.ok && shipping && Object.keys(shipping).length > 0;
    
    return {
      viable: true,
      variantCount: validVariants.length,
      totalVariants: variants.length,
      shippingAvailable,
      sampleVariant: {
        id: validVariants[0].id,
        title: validVariants[0].title,
        price: validVariants[0].price
      },
      priceRange: {
        min: Math.min(...validVariants.map(v => v.price)),
        max: Math.max(...validVariants.map(v => v.price))
      }
    };
    
  } catch (error) {
    return { viable: false, reason: error.message };
  }
}

function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      const progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
      console.log(`📂 Resuming from blueprint ${progress.lastProcessed + 1}/${progress.total}`);
      return progress;
    } catch (error) {
      console.log('⚠️  Could not load progress file, starting fresh');
    }
  }
  return null;
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

async function validateAllBlueprints() {
  console.log('🔍 Fetching and validating all blueprints...\n');
  
  // Load existing progress
  let progress = loadProgress();
  let blueprints, results;
  
  if (progress) {
    // Resume from checkpoint
    blueprints = progress.blueprints;
    results = {
      viable: progress.viable || [],
      nonViable: progress.nonViable || [],
      summary: progress.summary
    };
  } else {
    // Start fresh
    const { data: fetchedBlueprints } = await makeRequest('/catalog/blueprints.json');
    blueprints = fetchedBlueprints;
    console.log(`📋 Found ${blueprints.length} blueprints to validate\n`);
    
    results = {
      viable: [],
      nonViable: [],
      summary: {
        total: blueprints.length,
        tested: 0,
        viable: 0,
        nonViable: 0
      }
    };
    
    progress = {
      blueprints,
      lastProcessed: -1,
      total: blueprints.length,
      viable: [],
      nonViable: [],
      summary: results.summary
    };
  }
  
  // Process blueprints starting from last checkpoint
  for (let i = progress.lastProcessed + 1; i < blueprints.length; i++) {
    const blueprint = blueprints[i];
    console.log(`📦 [${i + 1}/${blueprints.length}] Testing: ${blueprint.title} (ID: ${blueprint.id})`);
    
    try {
      // Get providers for this blueprint
      const { data: providers } = await makeRequest(
        `/catalog/blueprints/${blueprint.id}/print_providers.json`
      );
      
      if (!providers || providers.length === 0) {
        console.log('   ❌ No providers available\n');
        results.nonViable.push({
          ...blueprint,
          reason: 'No providers available',
          providers: []
        });
        continue;
      }
      
      // Test each provider
      const providerResults = [];
      for (const provider of providers) {
        const test = await testBlueprintProvider(blueprint, provider);
        providerResults.push({ ...provider, ...test });
        
        if (test.viable) {
          console.log(`   ✅ ${provider.title}: ${test.variantCount} variants`);
        } else {
          console.log(`   ❌ ${provider.title}: ${test.reason}`);
        }
        
        // Rate limiting handled in makeRequest
      }
      
      // Check if any provider works
      const viableProviders = providerResults.filter(p => p.viable);
      
      if (viableProviders.length > 0) {
        results.viable.push({
          ...blueprint,
          providers: viableProviders,
          category: categorizeBlueprint(blueprint)
        });
        results.summary.viable++;
        console.log(`   🎉 VIABLE: ${viableProviders.length}/${providers.length} providers work\n`);
      } else {
        results.nonViable.push({
          ...blueprint,
          providers: providerResults,
          reason: 'No viable providers'
        });
        results.summary.nonViable++;
        console.log(`   💀 NON-VIABLE: No working providers\n`);
      }
      
      results.summary.tested++;
      progress.lastProcessed = i;
      
      // Save progress checkpoint
      if ((i + 1) % CHECKPOINT_INTERVAL === 0) {
        progress.viable = results.viable;
        progress.nonViable = results.nonViable;
        progress.summary = results.summary;
        saveProgress(progress);
        console.log(`💾 Checkpoint saved at ${i + 1}/${blueprints.length}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error testing blueprint: ${error.message}\n`);
      results.nonViable.push({
        ...blueprint,
        reason: `Test error: ${error.message}`,
        providers: []
      });
      results.summary.nonViable++;
      progress.lastProcessed = i;
    }
  }
  
  // Final save
  progress.viable = results.viable;
  progress.nonViable = results.nonViable;
  progress.summary = results.summary;
  saveProgress(progress);
  
  return results;
}

function categorizeBlueprint(blueprint) {
  const title = blueprint.title.toLowerCase();
  const description = blueprint.description?.toLowerCase() || '';
  
  if (title.includes('tee') || title.includes('shirt') || title.includes('hoodie') || 
      title.includes('tank') || title.includes('sweatshirt')) {
    return 'apparel';
  }
  
  if (title.includes('mug') || title.includes('cup') || title.includes('pillow') ||
      title.includes('poster') || title.includes('canvas') || title.includes('print')) {
    return 'home';
  }
  
  if (title.includes('bag') || title.includes('tote') || title.includes('phone') ||
      title.includes('case') || title.includes('sticker') || title.includes('hat')) {
    return 'accessories';
  }
  
  return 'other';
}

function generateViableProductConfig(viableBlueprints) {
  console.log('\n🔧 Generating configuration from viable products...');
  
  const categories = {
    apparel: { name: 'T-Shirts & Apparel', icon: '👕', products: [] },
    home: { name: 'Home & Living', icon: '🏠', products: [] },
    accessories: { name: 'Accessories', icon: '🎒', products: [] }
  };
  
  // Group by category
  const grouped = viableBlueprints.reduce((acc, blueprint) => {
    const category = blueprint.category === 'other' ? 'accessories' : blueprint.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(blueprint);
    return acc;
  }, {});
  
  // Generate products for each category
  for (const [category, blueprints] of Object.entries(grouped)) {
    if (!categories[category]) continue;
    
    for (const blueprint of blueprints.slice(0, 8)) { // Limit per category
      const bestProvider = blueprint.providers.reduce((best, current) => 
        current.variantCount > best.variantCount ? current : best
      );
      
      categories[category].products.push({
        id: `bp-${blueprint.id}`,
        name: blueprint.title,
        description: cleanDescription(blueprint.description),
        blueprintId: blueprint.id,
        printProviderId: bestProvider.id,
        icon: getCategoryIcon(category, blueprint.title),
        genericImage: blueprint.images?.[0] || `https://images.printify.com/mockup/${blueprint.id}/0/1581405237.jpg`,
        tags: generateTags(blueprint),
        basePrice: estimatePrice(blueprint.title),
        popularSizes: getPopularSizes(blueprint.title),
        availableColors: ['Black', 'White', 'Navy', 'Grey'],
        printArea: { width: 10, height: 12 },
        nameTemplates: [
          'Wavelength {characterName} Memory',
          '{characterName} Chronicles',
          'Episode {episodeNumber} Collection'
        ],
        verified: true,
        variantCount: bestProvider.variantCount
      });
    }
  }
  
  return categories;
}

function cleanDescription(description) {
  if (!description) return 'Custom Wavelength Lore merchandise';
  return description.replace(/<[^>]*>/g, '').trim().substring(0, 150);
}

function getCategoryIcon(category, title) {
  const t = title.toLowerCase();
  if (category === 'apparel') {
    if (t.includes('hoodie')) return '🧥';
    if (t.includes('tank')) return '🎽';
    if (t.includes('women')) return '👚';
    return '👕';
  }
  if (category === 'home') {
    if (t.includes('mug')) return '☕';
    if (t.includes('pillow')) return '🛋️';
    return '🏠';
  }
  return '🎒';
}

function generateTags(blueprint) {
  const tags = ['wavelength', 'lore'];
  const title = blueprint.title.toLowerCase();
  if (title.includes('cotton')) tags.push('cotton');
  if (title.includes('premium')) tags.push('premium');
  return tags;
}

function estimatePrice(title) {
  const t = title.toLowerCase();
  if (t.includes('hoodie')) return 3499;
  if (t.includes('mug')) return 1599;
  if (t.includes('pillow')) return 2499;
  return 1899;
}

function getPopularSizes(title) {
  const t = title.toLowerCase();
  if (t.includes('mug')) return ['11oz', '15oz'];
  if (t.includes('pillow')) return ['14x14', '16x16'];
  return ['S', 'M', 'L', 'XL'];
}

async function main() {
  try {
    console.log('🚀 Starting Printify vendor validation...\n');
    console.log(`⏱️  Rate limit: ${RATE_LIMIT_DELAY}ms between requests`);
    console.log(`💾 Checkpoints every ${CHECKPOINT_INTERVAL} blueprints\n`);
    
    const results = await validateAllBlueprints();
    
    // Clean up progress file on completion
    if (fs.existsSync(PROGRESS_FILE)) {
      fs.unlinkSync(PROGRESS_FILE);
      console.log('🧹 Cleaned up progress file');
    }
    
    // Save complete results
    const resultsFile = path.join(__dirname, '../config/printify-validation-results.json');
    fs.writeFileSync(resultsFile, JSON.stringify({
      validatedAt: new Date().toISOString(),
      summary: results.summary,
      viable: results.viable,
      nonViable: results.nonViable
    }, null, 2));
    
    // Generate viable product config
    const productConfig = generateViableProductConfig(results.viable);
    const configFile = path.join(__dirname, '../config/product-types-validated.js');
    
    fs.writeFileSync(configFile, `/**
 * Validated Product Types Configuration
 * Generated from working Printify vendors on ${new Date().toISOString()}
 */

const ProductTypes = ${JSON.stringify(productConfig, null, 2)};

module.exports = { ProductTypes };`);
    
    // Summary
    console.log('\n📊 Validation Summary:');
    console.log(`   Total Blueprints: ${results.summary.total}`);
    console.log(`   Tested: ${results.summary.tested}`);
    console.log(`   ✅ Viable: ${results.summary.viable}`);
    console.log(`   ❌ Non-Viable: ${results.summary.nonViable}`);
    console.log(`   Success Rate: ${((results.summary.viable / results.summary.tested) * 100).toFixed(1)}%`);
    
    console.log(`\n💾 Results saved to: ${resultsFile}`);
    console.log(`💾 Config saved to: ${configFile}`);
    console.log('\n🎉 Validation completed!');
    
  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { validateAllBlueprints, generateViableProductConfig };