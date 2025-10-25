/**
 * Smart Vendor Discovery - Find actually working combinations
 * Tests a sample of blueprints to find viable products quickly
 */

require('dotenv').config();

const PRINTIFY_API_BASE = 'https://api.printify.com/v1';
const PRINTIFY_TOKEN = process.env.PRINTIFY_API_TOKEN;

async function makeRequest(endpoint) {
  const response = await fetch(`${PRINTIFY_API_BASE}${endpoint}`, {
    headers: { 'Authorization': `Bearer ${PRINTIFY_TOKEN}` }
  });
  return { response, data: response.ok ? await response.json() : null };
}

async function findWorkingCombinations() {
  console.log('🎯 Smart discovery: Finding working blueprint/provider combinations...\n');
  
  // Get all blueprints
  const { data: allBlueprints } = await makeRequest('/catalog/blueprints.json');
  console.log(`📋 Found ${allBlueprints.length} total blueprints`);
  
  // Test every 50th blueprint to get a good sample
  const sampleSize = Math.min(50, Math.ceil(allBlueprints.length / 50));
  const sampleBlueprints = [];
  
  for (let i = 0; i < allBlueprints.length; i += Math.floor(allBlueprints.length / sampleSize)) {
    sampleBlueprints.push(allBlueprints[i]);
  }
  
  console.log(`🧪 Testing ${sampleBlueprints.length} sample blueprints...\n`);
  
  const workingCombinations = [];
  
  for (let i = 0; i < sampleBlueprints.length; i++) {
    const blueprint = sampleBlueprints[i];
    console.log(`[${i + 1}/${sampleBlueprints.length}] ${blueprint.title} (ID: ${blueprint.id})`);
    
    // Get providers
    const { data: providers } = await makeRequest(
      `/catalog/blueprints/${blueprint.id}/print_providers.json`
    );
    
    if (!providers?.length) {
      console.log('   ❌ No providers');
      continue;
    }
    
    // Test first provider only (for speed)
    const provider = providers[0];
    const { data: variants } = await makeRequest(
      `/catalog/blueprints/${blueprint.id}/print_providers/${provider.id}/variants.json`
    );
    
    if (variants?.length > 0) {
      console.log(`   ✅ WORKING! ${provider.title} - ${variants.length} variants`);
      workingCombinations.push({
        blueprint: {
          id: blueprint.id,
          title: blueprint.title,
          description: blueprint.description,
          brand: blueprint.brand
        },
        provider: {
          id: provider.id,
          title: provider.title,
          location: provider.location
        },
        variantCount: variants.length,
        sampleVariant: {
          id: variants[0].id,
          title: variants[0].title,
          price: variants[0].price
        }
      });
    } else {
      console.log(`   ❌ No variants for ${provider.title}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 500)); // Rate limit
  }
  
  console.log(`\n📊 Discovery Results:`);
  console.log(`   Tested: ${sampleBlueprints.length} blueprints`);
  console.log(`   Working: ${workingCombinations.length} combinations`);
  console.log(`   Success Rate: ${((workingCombinations.length / sampleBlueprints.length) * 100).toFixed(1)}%`);
  
  if (workingCombinations.length > 0) {
    console.log(`\n🎉 Found working combinations:`);
    workingCombinations.forEach((combo, i) => {
      console.log(`   ${i + 1}. ${combo.blueprint.title} + ${combo.provider.title} (${combo.variantCount} variants)`);
    });
    
    // Save results
    const fs = require('fs');
    const path = require('path');
    const resultsFile = path.join(__dirname, '../config/working-combinations.json');
    
    fs.writeFileSync(resultsFile, JSON.stringify({
      discoveredAt: new Date().toISOString(),
      totalTested: sampleBlueprints.length,
      workingCount: workingCombinations.length,
      combinations: workingCombinations
    }, null, 2));
    
    console.log(`\n💾 Results saved to: ${resultsFile}`);
    console.log('\n💡 Use these working combinations as your viable vendor criteria!');
  } else {
    console.log('\n❌ No working combinations found in sample');
    console.log('   This suggests a broader API access issue');
  }
}

findWorkingCombinations().catch(console.error);