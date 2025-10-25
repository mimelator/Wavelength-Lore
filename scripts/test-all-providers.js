/**
 * Test All Providers for a Blueprint
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
  console.log('🧪 Testing all providers for first blueprint...\n');
  
  // Get first blueprint
  const { data: blueprints } = await makeRequest('/catalog/blueprints.json');
  const blueprint = blueprints[0];
  
  console.log(`📦 Testing: ${blueprint.title} (ID: ${blueprint.id})\n`);
  
  // Get all providers for this blueprint
  const { data: providers } = await makeRequest(
    `/catalog/blueprints/${blueprint.id}/print_providers.json`
  );
  
  console.log(`Found ${providers.length} providers:\n`);
  
  let viableCount = 0;
  
  for (const provider of providers) {
    console.log(`🔍 ${provider.title} (ID: ${provider.id})`);
    
    // Test variants
    const { response: varResp, data: variants } = await makeRequest(
      `/catalog/blueprints/${blueprint.id}/print_providers/${provider.id}/variants.json`
    );
    
    const variantCount = variants?.length || 0;
    console.log(`   Variants: ${varResp.status} - ${variantCount} available`);
    
    if (variantCount > 0) {
      viableCount++;
      console.log(`   ✅ VIABLE! Sample: ${variants[0].title} - $${variants[0].price/100}`);
      
      // Test one more thing - shipping
      const { response: shipResp } = await makeRequest(
        `/catalog/blueprints/${blueprint.id}/print_providers/${provider.id}/shipping.json`
      );
      console.log(`   Shipping: ${shipResp.status}`);
    } else {
      console.log(`   ❌ No variants available`);
    }
    
    console.log('');
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`\n📊 Summary: ${viableCount}/${providers.length} providers are viable for ${blueprint.title}`);
}

main().catch(console.error);