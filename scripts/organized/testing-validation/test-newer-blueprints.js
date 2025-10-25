/**
 * Test Newer Blueprints - Check if newer products have variants
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

async function testNewerBlueprints() {
  console.log('🔍 Testing newer blueprints to see if the issue is with old products...\n');
  
  // Get all blueprints
  const { data: allBlueprints } = await makeRequest('/catalog/blueprints.json');
  
  // Test the last 10 blueprints (newest)
  const newestBlueprints = allBlueprints.slice(-10);
  
  console.log(`Testing ${newestBlueprints.length} newest blueprints:\n`);
  
  const workingCombinations = [];
  
  for (const blueprint of newestBlueprints) {
    console.log(`📦 ${blueprint.title} (ID: ${blueprint.id})`);
    
    // Get providers
    const { data: providers } = await makeRequest(
      `/catalog/blueprints/${blueprint.id}/print_providers.json`
    );
    
    if (!providers?.length) {
      console.log('   ❌ No providers');
      continue;
    }
    
    // Test first provider
    const provider = providers[0];
    const { data: variants } = await makeRequest(
      `/catalog/blueprints/${blueprint.id}/print_providers/${provider.id}/variants.json`
    );
    
    if (variants?.length > 0) {
      console.log(`   ✅ WORKING! ${provider.title} - ${variants.length} variants`);
      console.log(`      Sample: ${variants[0].title} - $${variants[0].price/100}`);
      workingCombinations.push({
        blueprint: { id: blueprint.id, title: blueprint.title },
        provider: { id: provider.id, title: provider.title },
        variantCount: variants.length
      });
    } else {
      console.log(`   ❌ No variants for ${provider.title}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n📊 Results:`);
  console.log(`   Tested: ${newestBlueprints.length} newest blueprints`);
  console.log(`   Working: ${workingCombinations.length} combinations`);
  
  if (workingCombinations.length > 0) {
    console.log(`\n🎉 Found working combinations in newer products:`);
    workingCombinations.forEach((combo, i) => {
      console.log(`   ${i + 1}. Blueprint ${combo.blueprint.id}: ${combo.blueprint.title}`);
      console.log(`      Provider ${combo.provider.id}: ${combo.provider.title} (${combo.variantCount} variants)`);
    });
    
    console.log(`\n💡 The issue may be that older blueprints are discontinued.`);
    console.log(`   Focus validation on newer blueprint IDs (${Math.min(...workingCombinations.map(c => c.blueprint.id))}+)`);
  } else {
    console.log(`\n❌ No working combinations found even in newest blueprints`);
    console.log(`   This suggests an account or API access issue`);
  }
  
  return workingCombinations;
}

testNewerBlueprints().catch(console.error);