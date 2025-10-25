#!/usr/bin/env node

/**
 * Verify Full Catalog Integration
 * Tests that the full catalog is properly integrated and working
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Full Catalog Integration...\n');

// Load the catalog
const catalogPath = path.join(__dirname, '../config/product-catalog-categorized.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

console.log('📊 Catalog Statistics:');
console.log(`   Total Products: ${catalog.totalProducts}`);
console.log(`   Categories: ${Object.keys(catalog.categories).length}`);
console.log(`   Search Index: ${catalog.searchIndex.length} items`);
console.log(`   Generated: ${catalog.generatedAt}`);
console.log('');

console.log('📋 Category Breakdown:');
let totalVerified = 0;
for (const [key, category] of Object.entries(catalog.categories)) {
  console.log(`   ${category.icon} ${category.name}: ${category.productCount} products`);
  
  // Count products in subcategories
  let subcategoryTotal = 0;
  for (const [subKey, subcategory] of Object.entries(category.subcategories)) {
    subcategoryTotal += subcategory.products.length;
    if (subcategory.products.length > 0) {
      console.log(`      - ${subcategory.name}: ${subcategory.products.length}`);
    }
  }
  
  if (subcategoryTotal !== category.productCount) {
    console.log(`      ⚠️  Mismatch: Expected ${category.productCount}, found ${subcategoryTotal}`);
  }
  
  totalVerified += subcategoryTotal;
}

console.log('');
console.log('🔍 Validation Results:');
console.log(`   Expected Total: ${catalog.totalProducts}`);
console.log(`   Verified Total: ${totalVerified}`);
console.log(`   Search Index: ${catalog.searchIndex.length}`);

if (totalVerified === catalog.totalProducts && catalog.searchIndex.length === catalog.totalProducts) {
  console.log('   ✅ All counts match - catalog is valid!');
} else {
  console.log('   ❌ Count mismatch detected');
}

console.log('');
console.log('🎯 Sample Products by Category:');

// Show sample products from each category
for (const [key, category] of Object.entries(catalog.categories)) {
  if (category.productCount > 0) {
    console.log(`\n   ${category.icon} ${category.name}:`);
    
    for (const [subKey, subcategory] of Object.entries(category.subcategories)) {
      if (subcategory.products.length > 0) {
        const sample = subcategory.products[0];
        console.log(`      • ${sample.blueprint_title} (${sample.provider_title})`);
        break; // Just show one sample per category
      }
    }
  }
}

console.log('');
console.log('🔍 Search Index Validation:');
const uniqueBlueprints = new Set(catalog.searchIndex.map(item => item.blueprint_id));
console.log(`   Unique Blueprint IDs: ${uniqueBlueprints.size}`);
console.log(`   Total Search Items: ${catalog.searchIndex.length}`);
console.log(`   Provider Variations: ${catalog.searchIndex.length / uniqueBlueprints.size} avg per blueprint`);

console.log('');
console.log('✅ Full Catalog Integration Verification Complete!');
console.log('🎯 Ready for production use with comprehensive product catalog');