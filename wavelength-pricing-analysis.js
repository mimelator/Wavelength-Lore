#!/usr/bin/env node

/**
 * WAVELENGTH Product Pricing Analysis Test Harness
 * 
 * Analyzes the 142-product catalog to determine:
 * 1. How many products have pricing data
 * 2. Which products are missing prices
 * 3. Price distribution by category
 * 4. Variant pricing completeness
 * 5. Identifies products suitable for fallback pricing
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 WAVELENGTH PRODUCT PRICING ANALYSIS');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

async function loadProductCatalog() {
  try {
    // Try to load from various possible locations
    const possiblePaths = [
      './services/product-types.js',
      './routes/merchandise.js',
      './static/js/services/merchandise-api-service.js'
    ];
    
    console.log('📂 Searching for product catalog...');
    
    // First, let's try to simulate the API call that loads the products
    console.log('🌐 Simulating product catalog API call...');
    
    // We'll create a mock test to understand the data structure
    return await simulateProductLoad();
    
  } catch (error) {
    console.error('❌ Error loading product catalog:', error);
    return null;
  }
}

async function simulateProductLoad() {
  console.log('🧪 Creating product loading simulation...');
  
  // This simulates what happens in the merchandise store when it loads products
  const mockApiResponse = {
    success: true,
    allProducts: [], // This would be populated from API
    message: 'Simulated load - need real API integration'
  };
  
  console.log('⚠️ SIMULATION MODE: Need to integrate with real product loading logic');
  console.log('📋 To get real data, we need to:');
  console.log('   1. Call the actual /api/merchandise/product-types endpoint');
  console.log('   2. Or load from the merchandise service directly');
  console.log('   3. Or parse the product configuration files');
  
  return mockApiResponse;
}

async function analyzePricingData(products) {
  if (!products || !Array.isArray(products)) {
    console.error('❌ No products array provided');
    return;
  }
  
  console.log(`\n📊 ANALYZING ${products.length} PRODUCTS:`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const analysis = {
    total: products.length,
    withVariants: 0,
    withVariantPricing: 0,
    withBasePrice: 0,
    withoutPricing: 0,
    categories: {},
    pricingMethods: {},
    priceRanges: {
      under10: 0,
      between10and20: 0,
      between20and50: 0,
      over50: 0
    }
  };
  
  const productsWithoutPricing = [];
  const productsWithPricing = [];
  
  products.forEach((product, index) => {
    console.log(`\n🔍 Product ${index + 1}: ${product.name || product.title || product.id}`);
    console.log(`   Blueprint ID: ${product.blueprintId}`);
    console.log(`   Provider ID: ${product.printProviderId}`);
    console.log(`   Category: ${product.category}`);
    
    // Initialize category tracking
    if (!analysis.categories[product.category]) {
      analysis.categories[product.category] = {
        total: 0,
        withPricing: 0,
        withoutPricing: 0,
        averagePrice: 0,
        priceCount: 0
      };
    }
    analysis.categories[product.category].total++;
    
    let hasPricing = false;
    let productPrices = [];
    
    // Check for variant pricing
    if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
      analysis.withVariants++;
      console.log(`   📦 Variants: ${product.variants.length}`);
      
      product.variants.forEach((variant, vIndex) => {
        const price = variant.price || variant.basePrice || 0;
        const priceValue = typeof price === 'number' ? price / 100 : parseFloat(price) || 0;
        
        console.log(`      Variant ${vIndex + 1}: ${variant.title || 'Untitled'} - $${priceValue.toFixed(2)}`);
        
        if (priceValue > 0) {
          productPrices.push(priceValue);
          hasPricing = true;
        }
      });
      
      if (productPrices.length > 0) {
        analysis.withVariantPricing++;
      }
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
    
    // Analyze pricing
    if (hasPricing) {
      productsWithPricing.push({
        ...product,
        prices: productPrices,
        minPrice: Math.min(...productPrices),
        maxPrice: Math.max(...productPrices)
      });
      
      analysis.categories[product.category].withPricing++;
      
      const minPrice = Math.min(...productPrices);
      if (minPrice < 10) analysis.priceRanges.under10++;
      else if (minPrice < 20) analysis.priceRanges.between10and20++;
      else if (minPrice < 50) analysis.priceRanges.between20and50++;
      else analysis.priceRanges.over50++;
      
      console.log(`   ✅ HAS PRICING: $${Math.min(...productPrices).toFixed(2)} - $${Math.max(...productPrices).toFixed(2)}`);
    } else {
      productsWithoutPricing.push(product);
      analysis.withoutPricing++;
      analysis.categories[product.category].withoutPricing++;
      console.log(`   ❌ NO PRICING DATA FOUND`);
    }
  });
  
  // Print summary
  console.log('\n\n📈 PRICING ANALYSIS SUMMARY:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📦 Total Products: ${analysis.total}`);
  console.log(`✅ Products with Pricing: ${productsWithPricing.length} (${((productsWithPricing.length / analysis.total) * 100).toFixed(1)}%)`);
  console.log(`❌ Products without Pricing: ${analysis.withoutPricing} (${((analysis.withoutPricing / analysis.total) * 100).toFixed(1)}%)`);
  console.log(`🎯 Products with Variants: ${analysis.withVariants}`);
  console.log(`💰 Products with Variant Pricing: ${analysis.withVariantPricing}`);
  console.log(`🏷️ Products with Base Price: ${analysis.withBasePrice}`);
  
  // Price range distribution
  console.log('\n💲 PRICE DISTRIBUTION:');
  console.log(`   Under $10: ${analysis.priceRanges.under10} products`);
  console.log(`   $10-$20: ${analysis.priceRanges.between10and20} products`);
  console.log(`   $20-$50: ${analysis.priceRanges.between20and50} products`);
  console.log(`   Over $50: ${analysis.priceRanges.over50} products`);
  
  // Category breakdown
  console.log('\n📊 CATEGORY ANALYSIS:');
  Object.entries(analysis.categories).forEach(([category, stats]) => {
    const pricingRate = ((stats.withPricing / stats.total) * 100).toFixed(1);
    console.log(`   ${category}: ${stats.withPricing}/${stats.total} (${pricingRate}%) have pricing`);
  });
  
  // Products without pricing
  if (productsWithoutPricing.length > 0) {
    console.log('\n❌ PRODUCTS WITHOUT PRICING:');
    productsWithoutPricing.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name || product.id} (Blueprint: ${product.blueprintId}, Category: ${product.category})`);
    });
  }
  
  // Best products for fallback pricing
  console.log('\n🎯 RECOMMENDED FALLBACK PRODUCTS (Reliable Pricing):');
  const categoryFallbacks = {};
  
  productsWithPricing.forEach(product => {
    const category = product.category;
    if (!categoryFallbacks[category] || product.minPrice < categoryFallbacks[category].minPrice) {
      categoryFallbacks[category] = {
        name: product.name || product.id,
        minPrice: product.minPrice,
        maxPrice: product.maxPrice,
        blueprintId: product.blueprintId
      };
    }
  });
  
  Object.entries(categoryFallbacks).forEach(([category, product]) => {
    console.log(`   ${category}: $${product.minPrice.toFixed(2)} (${product.name})`);
  });
  
  console.log('\n🔧 RECOMMENDED ACTIONS:');
  if (analysis.withoutPricing > 0) {
    console.log(`   ⚠️ Fix pricing for ${analysis.withoutPricing} products without price data`);
  }
  console.log(`   ✅ Use ${Object.keys(categoryFallbacks).length} categories for reliable fallback pricing`);
  console.log(`   🎯 Focus on products with variant pricing (${analysis.withVariantPricing} available)`);
  
  return {
    analysis,
    productsWithPricing,
    productsWithoutPricing,
    categoryFallbacks
  };
}

// Main execution
async function main() {
  console.log('🚀 Starting product pricing analysis...\n');
  
  try {
    const catalogData = await loadProductCatalog();
    
    if (catalogData && catalogData.allProducts && catalogData.allProducts.length > 0) {
      await analyzePricingData(catalogData.allProducts);
    } else {
      console.log('\n🧪 RUNNING IN SIMULATION MODE');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('To get real pricing analysis, we need to:');
      console.log('1. 🌐 Make HTTP request to /api/merchandise/product-types');
      console.log('2. 📂 Or load product data from services/product-types.js');
      console.log('3. 🔧 Or integrate with merchandise store initialization');
      console.log('\nFor now, let\'s create a version that can run with real data...');
      
      // Create a more sophisticated test that can actually load data
      await createRealDataTest();
    }
    
  } catch (error) {
    console.error('❌ Test harness failed:', error);
    process.exit(1);
  }
}

async function createRealDataTest() {
  console.log('\n🔧 Creating real data integration test...');
  
  const realTestCode = `
// REAL DATA TEST - Can be run in browser console on merchandise store page
// Or integrated into Node.js with proper HTTP client

async function testRealProductPricing() {
  console.log('🔍 REAL PRODUCT PRICING TEST');
  
  try {
    // This would work in browser context where merchandise store is loaded
    if (typeof window !== 'undefined' && window.merchandiseStore) {
      const store = window.merchandiseStore;
      
      if (store.availableProducts && store.availableProducts.length > 0) {
        console.log(\`📊 Found \${store.availableProducts.length} products in loaded store\`);
        
        // Run the analysis on real data
        await analyzePricingData(store.availableProducts);
        return;
      }
    }
    
    // For Node.js context, make HTTP request
    const fetch = require('node-fetch'); // You may need to install node-fetch
    
    const response = await fetch('http://localhost:3001/api/merchandise/product-types');
    const data = await response.json();
    
    if (data.success && data.allProducts) {
      console.log(\`📊 Loaded \${data.allProducts.length} products from API\`);
      await analyzePricingData(data.allProducts);
    } else {
      console.error('❌ Failed to load product data from API');
    }
    
  } catch (error) {
    console.error('❌ Real data test failed:', error);
  }
}

// Run the test
testRealProductPricing();
`;
  
  console.log('💾 Real data test code generated (see above)');
  console.log('\n🎯 TO RUN WITH REAL DATA:');
  console.log('1. 🌐 Start your server: npm start');
  console.log('2. 📂 Open merchandise store page in browser');
  console.log('3. 🔧 Open browser console and paste the real test code');
  console.log('4. ▶️ Or modify this script to make HTTP requests to your API');
}

// Run the test harness
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  analyzePricingData,
  loadProductCatalog
};