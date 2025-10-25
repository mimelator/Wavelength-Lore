/**
 * Discover Actual Vendors - Find real blueprint/provider combinations
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

async function main() {
  console.log('🔍 Discovering actual blueprints and providers...\n');
  
  // Get all blueprints
  const { data: blueprints } = await makeRequest('/catalog/blueprints.json');
  console.log(`📋 Found ${blueprints?.length || 0} blueprints`);
  
  if (!blueprints?.length) {
    console.log('❌ No blueprints found');
    return;
  }
  
  // Test first 3 blueprints to find their providers
  for (let i = 0; i < Math.min(3, blueprints.length); i++) {
    const blueprint = blueprints[i];
    console.log(`\n📦 Blueprint ${i + 1}: ${blueprint.title} (ID: ${blueprint.id})`);
    
    // Get providers for this blueprint
    const { response: provResp, data: providers } = await makeRequest(
      `/catalog/blueprints/${blueprint.id}/print_providers.json`
    );
    
    console.log(`   Providers API: ${provResp.status} - ${providers?.length || 0} providers`);
    
    if (providers?.length > 0) {
      console.log(`   First provider: ${providers[0].title} (ID: ${providers[0].id})`);
      
      // Test this real combination
      const { response: varResp, data: variants } = await makeRequest(
        `/catalog/blueprints/${blueprint.id}/print_providers/${providers[0].id}/variants.json`
      );
      console.log(`   Variants for this combo: ${varResp.status} - ${variants?.length || 0} variants`);
      
      if (variants?.length > 0) {
        console.log(`   ✅ VIABLE COMBINATION FOUND!`);
        console.log(`      Blueprint: ${blueprint.id}, Provider: ${providers[0].id}`);
        console.log(`      Sample variant: ${variants[0].title} - $${variants[0].price/100}`);
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

main().catch(console.error);