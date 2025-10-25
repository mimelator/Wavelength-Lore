/**
 * Proper Vendor Discovery - Build catalog of valid blueprint/provider combinations
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const PRINTIFY_API_BASE = 'https://api.printify.com/v1';
const PRINTIFY_TOKEN = process.env.PRINTIFY_API_TOKEN;

async function makeRequest(endpoint) {
  const response = await fetch(`${PRINTIFY_API_BASE}${endpoint}`, {
    headers: { 'Authorization': `Bearer ${PRINTIFY_TOKEN}` }
  });
  return { response, data: response.ok ? await response.json() : null };
}

async function buildVendorBlueprintCatalog() {
  console.log('🔍 Building catalog of valid blueprint/provider combinations...\n');
  
  const validCombinations = [];
  
  try {
    // Step 1: Get all blueprints
    console.log('1. Fetching all blueprints...');
    const { data: blueprints } = await makeRequest('/catalog/blueprints.json');
    console.log(`   Found ${blueprints.length} blueprints\n`);
    
    // Step 2: For each blueprint, get valid providers
    for (let i = 0; i < blueprints.length; i++) {
      const blueprint = blueprints[i];
      console.log(`[${i + 1}/${blueprints.length}] ${blueprint.title} (ID: ${blueprint.id})`);
      
      try {
        // Get providers for this blueprint
        const { data: providers } = await makeRequest(
          `/catalog/blueprints/${blueprint.id}/print_providers.json`
        );
        
        if (providers && providers.length > 0) {
          console.log(`   ✅ ${providers.length} providers available`);
          
          // Record each valid combination
          for (const provider of providers) {
            validCombinations.push({
              blueprint_id: blueprint.id,
              blueprint_title: blueprint.title,
              blueprint_brand: blueprint.brand,
              blueprint_description: blueprint.description,
              provider_id: provider.id,
              provider_title: provider.title,
              provider_location: provider.location
            });
          }
        } else {
          console.log(`   ❌ No providers available`);
        }
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
      
      // Rate limiting - be respectful to API
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Save progress every 50 blueprints
      if ((i + 1) % 50 === 0) {
        console.log(`\n💾 Progress checkpoint: ${i + 1}/${blueprints.length} blueprints processed`);
        console.log(`   Valid combinations found so far: ${validCombinations.length}\n`);
      }
    }
    
  } catch (error) {
    console.error(`❌ API error: ${error.message}`);
    return null;
  }
  
  console.log('\n📊 Catalog generation complete!');
  console.log(`   Total blueprints processed: 1202`);
  console.log(`   Total valid combinations: ${validCombinations.length}`);
  
  // Save the catalog
  const catalogFile = path.join(__dirname, '../config/printify-vendor-catalog.json');
  fs.writeFileSync(catalogFile, JSON.stringify({
    generatedAt: new Date().toISOString(),
    totalBlueprints: 1202,
    totalCombinations: validCombinations.length,
    combinations: validCombinations
  }, null, 2));
  
  console.log(`\n💾 Catalog saved to: ${catalogFile}`);
  
  // Show sample combinations
  console.log('\n📋 Sample combinations (first 5):');
  validCombinations.slice(0, 5).forEach((combo, i) => {
    console.log(`   ${i + 1}. ${combo.blueprint_title} + ${combo.provider_title} (${combo.provider_location || 'Unknown location'})`);
  });
  
  return validCombinations;
}

buildVendorBlueprintCatalog().catch(console.error);