#!/usr/bin/env node

/**
 * Update product-types.js with REAL Printify provider IDs
 *
 * Reads from printify-blueprints-complete.json and updates product-types.js
 * to use the actual valid provider IDs instead of hardcoded 999
 */

const fs = require('fs');
const path = require('path');

const blueprintCatalogPath = path.join(__dirname, '../config/printify-blueprints-complete.json');
const productTypesPath = path.join(__dirname, '../config/product-types.js');

// Read the blueprint catalog
const catalogData = JSON.parse(fs.readFileSync(blueprintCatalogPath, 'utf8'));

// Build a map of blueprintId => first valid provider ID
const blueprintProviderMap = {};

Object.values(catalogData.blueprints).forEach(category => {
  category.forEach(blueprint => {
    if (blueprint.providers && blueprint.providers.length > 0) {
      // Use the first provider (usually the default/recommended one)
      blueprintProviderMap[blueprint.id] = blueprint.providers[0].id;
    }
  });
});

console.log('🔍 Found providers for', Object.keys(blueprintProviderMap).length, 'blueprints');
console.log('');
console.log('Sample mappings:');
Object.entries(blueprintProviderMap).slice(0, 10).forEach(([bpId, provId]) => {
  console.log(`  Blueprint ${bpId} → Provider ${provId}`);
});
console.log('');

// Read the current product-types.js
const productTypesContent = fs.readFileSync(productTypesPath, 'utf8');

// Replace all occurrences of "printProviderId: 999" with actual provider IDs
let updatedContent = productTypesContent;
let replacementCount = 0;

// Find all product definitions and update their printProviderId
const productDefRegex = /blueprintId:\s*(\d+),\s*\n\s*printProviderId:\s*\d+/g;

updatedContent = updatedContent.replace(productDefRegex, (match, blueprintId) => {
  const bpId = parseInt(blueprintId, 10);
  const providerId = blueprintProviderMap[bpId];

  if (providerId) {
    replacementCount++;
    return `blueprintId: ${blueprintId},\n    printProviderId: ${providerId}`;
  }

  return match;
});

console.log(`✅ Updated ${replacementCount} provider IDs in product-types.js`);
console.log('');

// Write the updated content
fs.writeFileSync(productTypesPath, updatedContent);

console.log('📝 product-types.js updated successfully!');
console.log('');
console.log('🔥 CRITICAL: Verify that the following were updated correctly:');

// Show some examples of updated products
const examples = updatedContent.match(/id:\s*'validated-\d+',[\s\S]*?blueprintId:\s*\d+,[\s\S]*?printProviderId:\s*\d+/g);
if (examples) {
  examples.slice(0, 5).forEach((ex, i) => {
    const idMatch = ex.match(/id:\s*'(validated-\d+)'/);
    const bpMatch = ex.match(/blueprintId:\s*(\d+)/);
    const provMatch = ex.match(/printProviderId:\s*(\d+)/);

    if (idMatch && bpMatch && provMatch) {
      console.log(`  ${idMatch[1]}: blueprint ${bpMatch[1]} → provider ${provMatch[1]}`);
    }
  });
}

console.log('');
console.log('✨ Provider IDs have been updated from 999 to real Printify provider IDs!');
console.log('The Printify API should now accept these product configurations.');
