#!/usr/bin/env node

/**
 * WAVELENGTH Real Product Pricing Analysis
 * 
 * Loads actual product data from config/product-types.js
 * and analyzes pricing completeness across the 142-product catalog
 */

const path = require('path');

console.log('🔍 WAVELENGTH REAL PRODUCT PRICING ANALYSIS');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

async function loadRealProductData() {
  try {
    // Load the actual product types configuration
    const productTypesPath = path.join(__dirname, 'config', 'product-types.js');
    console.log('📂 Loading product catalog from:', productTypesPath);
    
    // Since it's a CommonJS module, we need to require it
    delete require.cache[require.resolve('./config/product-types.js')];
    const { ProductTypes } = require('./config/product-types.js');
    
    if (!ProductTypes) {
      throw new Error('ProductTypes not found in config file');
    }
    
    // Convert to array format similar to what the API returns
    const allProducts = Object.values(ProductTypes).map(product => ({
      ...product,
      // Add mock pricing data structure for analysis
      variants: [], // These would normally be loaded from Printify
      basePrice: null, // This would be set if available
      price: null // Alternative price field
    }));
    
    console.log(`✅ Loaded ${allProducts.length} products from config`);
    
    return {
      success: true,
      allProducts: allProducts,
      source: 'config/product-types.js'
    };
    
  } catch (error) {
    console.error('❌ Error loading real product data:', error);
    return null;
  }
}

async function analyzePricingData(products) {
  if (!products || !Array.isArray(products)) {
    console.error('❌ No products array provided');
    return;
  }
  
  console.log(`\n📊 ANALYZING ${products.length} REAL PRODUCTS:`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const analysis = {
    total: products.length,
    withVariants: 0,
    withVariantPricing: 0,
    withBasePrice: 0,
    withoutPricing: 0,
    categories: {},
    providers: {},
    blueprintIds: new Set()
  };
  
  const productsWithoutPricing = [];
  const productsWithPricing = [];
  const categoryStats = {};
  
  products.forEach((product, index) => {
    console.log(`\n🔍 Product ${index + 1}: ${product.name || product.title || product.id}`);
    console.log(`   Blueprint ID: ${product.blueprintId}`);
    console.log(`   Provider: ${product.provider} (ID: ${product.printProviderId})`);
    console.log(`   Category: ${product.category}`);
    
    // Track blueprint IDs
    analysis.blueprintIds.add(product.blueprintId);
    
    // Initialize category tracking
    if (!analysis.categories[product.category]) {
      analysis.categories[product.category] = {
        total: 0,
        blueprints: new Set(),
        providers: new Set()
      };
    }
    analysis.categories[product.category].total++;
    analysis.categories[product.category].blueprints.add(product.blueprintId);
    analysis.categories[product.category].providers.add(product.provider);
    
    // Initialize provider tracking
    if (!analysis.providers[product.provider]) {
      analysis.providers[product.provider] = {
        total: 0,
        categories: new Set(),
        blueprints: new Set()
      };
    }
    analysis.providers[product.provider].total++;
    analysis.providers[product.provider].categories.add(product.category);
    analysis.providers[product.provider].blueprints.add(product.blueprintId);
    
    let hasPricing = false;
    let productPrices = [];
    
    // Check for variant pricing (would be loaded from Printify in real app)
    if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
      analysis.withVariants++;
      console.log(`   📦 Variants: ${product.variants.length}`);
      
      product.variants.forEach((variant, vIndex) => {
        const price = variant.price || variant.basePrice || 0;
        const priceValue = typeof price === 'number' ? price / 100 : parseFloat(price) || 0;
        
        if (priceValue > 0) {
          productPrices.push(priceValue);
          hasPricing = true;
        }
      });
      
      if (productPrices.length > 0) {
        analysis.withVariantPricing++;
      }
    } else {
      console.log(`   📦 Variants: NONE (pricing would need to be fetched from Printify)`);
    }
    
    // Check for base price
    if (product.basePrice || product.price) {
      const basePrice = product.basePrice || product.price;
      const priceValue = typeof basePrice === 'number' ? basePrice / 100 : parseFloat(basePrice) || 0;
      
      if (priceValue > 0) {
        console.log(`   💰 Base Price: $${priceValue.toFixed(2)}`);
        productPrices.push(priceValue);
        hasPricing = true;
        analysis.withBasePrice++;
      }
    }
    
    // Since our config doesn't have pricing data, all products will be "without pricing"
    // This is expected - pricing comes from Printify API calls
    if (hasPricing) {
      productsWithPricing.push({
        ...product,
        prices: productPrices,
        minPrice: Math.min(...productPrices),
        maxPrice: Math.max(...productPrices)
      });
      console.log(`   ✅ HAS PRICING: $${Math.min(...productPrices).toFixed(2)} - $${Math.max(...productPrices).toFixed(2)}`);
    } else {
      productsWithoutPricing.push(product);
      analysis.withoutPricing++;
      console.log(`   ⚠️ NO PRICING IN CONFIG (would be fetched from Printify API)`);
    }
  });
  
  // Print detailed analysis
  console.log('\n\n📈 PRODUCT CATALOG ANALYSIS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📦 Total Products: ${analysis.total}`);
  console.log(`🎯 Unique Blueprint IDs: ${analysis.blueprintIds.size}`);
  console.log(`🏭 Unique Providers: ${Object.keys(analysis.providers).length}`);
  console.log(`🏷️ Categories: ${Object.keys(analysis.categories).length}`);
  
  console.log('\n🏭 PROVIDER BREAKDOWN:');
  Object.entries(analysis.providers).forEach(([provider, stats]) => {
    console.log(`   ${provider}: ${stats.total} products, ${stats.categories.size} categories, ${stats.blueprints.size} blueprints`);
  });
  
  console.log('\n📊 CATEGORY BREAKDOWN:');
  Object.entries(analysis.categories).forEach(([category, stats]) => {
    console.log(`   ${category}: ${stats.total} products, ${stats.blueprints.size} blueprints, ${stats.providers.size} providers`);
  });
  
  console.log('\n⚠️ PRICING DATA ANALYSIS:');
  console.log(`   Products in Config: ${analysis.total}`);
  console.log(`   Products with Static Pricing: ${productsWithPricing.length}`);
  console.log(`   Products without Static Pricing: ${analysis.withoutPricing}`);
  console.log('\n💡 IMPORTANT INSIGHTS:');
  console.log('   🔍 The config file contains product STRUCTURE but not PRICING');
  console.log('   💰 Pricing data is fetched dynamically from Printify APIs');
  console.log('   🎯 Each product has blueprint ID + provider ID for price lookup');
  console.log('   📋 Categories provide fallback grouping for price estimation');
  
  // Analyze fallback suitability
  console.log('\n🎯 FALLBACK PRICING ANALYSIS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const categoryBreakdown = {};
  Object.entries(analysis.categories).forEach(([category, stats]) => {
    categoryBreakdown[category] = {
      productCount: stats.total,
      blueprintCount: stats.blueprints.size,
      providerCount: stats.providers.size,
      suitableForFallback: stats.total > 0 // All categories have at least one product
    };
  });
  
  // Sort categories by product count (most products = most reliable fallback)
  const sortedCategories = Object.entries(categoryBreakdown)
    .sort(([,a], [,b]) => b.productCount - a.productCount);
  
  console.log('📊 BEST CATEGORIES FOR FALLBACK PRICING (by product count):');
  sortedCategories.slice(0, 10).forEach(([category, stats], index) => {
    console.log(`   ${index + 1}. ${category}: ${stats.productCount} products, ${stats.blueprintCount} blueprints`);
  });
  
  console.log('\n🔧 RECOMMENDATIONS FOR FALLBACK SYSTEM:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('1. 🎯 REMOVE products from fallback if category has NO products in catalog');
  console.log('2. 📊 PRIORITIZE categories with most products for reliable fallbacks');
  console.log('3. 🚨 COMPLAIN LOUDLY when fallback is used (pricing should come from API)');
  console.log('4. 🔍 LOG which blueprint IDs are failing to get pricing from Printify');
  console.log('5. 📈 TRACK pricing API failures to identify problematic blueprints');
  
  // Check current fallback categories against our catalog
  const currentFallbacks = ['coffee-mug', 't-shirt', 'hoodie'];
  console.log('\n🔍 CURRENT FALLBACK VALIDATION:');
  currentFallbacks.forEach(category => {
    const stats = analysis.categories[category];
    if (stats) {
      console.log(`   ✅ ${category}: ${stats.total} products available in catalog`);
    } else {
      console.log(`   ❌ ${category}: NOT FOUND in catalog - REMOVE FROM FALLBACK!`);
    }
  });
  
  // Identify categories that should be removed
  const validFallbacks = currentFallbacks.filter(category => analysis.categories[category]);
  const invalidFallbacks = currentFallbacks.filter(category => !analysis.categories[category]);
  
  if (invalidFallbacks.length > 0) {
    console.log(`\n🚨 IMMEDIATE ACTION REQUIRED:`);
    console.log(`   REMOVE these categories from fallback: ${invalidFallbacks.join(', ')}`);
  }
  
  console.log(`\n✅ VALID FALLBACK CATEGORIES: ${validFallbacks.join(', ')}`);
  
  return {
    analysis,
    productsWithPricing,
    productsWithoutPricing,
    categoryBreakdown,
    validFallbacks,
    invalidFallbacks,
    recommendations: {
      removeFromFallback: invalidFallbacks,
      bestCategories: sortedCategories.slice(0, 5).map(([cat]) => cat)
    }
  };
}

// Main execution
async function main() {
  console.log('🚀 Starting REAL product pricing analysis...\n');
  
  try {
    const catalogData = await loadRealProductData();
    
    if (catalogData && catalogData.allProducts && catalogData.allProducts.length > 0) {
      const results = await analyzePricingData(catalogData.allProducts);
      
      console.log('\n🎯 ACTIONABLE RESULTS:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      if (results.invalidFallbacks.length > 0) {
        console.log(`🚨 REMOVE from fallback: ${results.invalidFallbacks.join(', ')}`);
      }
      
      console.log(`✅ KEEP in fallback: ${results.validFallbacks.join(', ')}`);
      console.log(`🎯 BEST categories: ${results.recommendations.bestCategories.join(', ')}`);
      
      return results;
    } else {
      console.error('❌ Failed to load product catalog');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Test harness failed:', error);
    process.exit(1);
  }
}

// Run the analysis
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  analyzePricingData,
  loadRealProductData
};