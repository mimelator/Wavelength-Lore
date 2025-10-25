/**
 * Explore Vendor Viability - Research Script
 * Manually test specific vendors to understand what makes them viable
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

async function exploreVendor(blueprintId, providerId, vendorName) {
  console.log(`\n🔍 Exploring: ${vendorName} (Blueprint: ${blueprintId}, Provider: ${providerId})`);
  
  // 1. Check variants
  const { response: varResp, data: variants } = await makeRequest(
    `/catalog/blueprints/${blueprintId}/print_providers/${providerId}/variants.json`
  );
  console.log(`   Variants API: ${varResp.status} - ${variants?.length || 0} variants`);
  
  if (variants?.length > 0) {
    console.log(`   Sample variant: ${variants[0].title} - $${variants[0].price/100}`);
  }
  
  // 2. Check shipping
  const { response: shipResp, data: shipping } = await makeRequest(
    `/catalog/blueprints/${blueprintId}/print_providers/${providerId}/shipping.json`
  );
  console.log(`   Shipping API: ${shipResp.status} - ${Object.keys(shipping || {}).length} countries`);
  
  // 3. Check print areas (what can be customized)
  const { response: areasResp, data: printAreas } = await makeRequest(
    `/catalog/blueprints/${blueprintId}/print_providers/${providerId}/print_areas.json`
  );
  console.log(`   Print Areas API: ${areasResp.status} - ${printAreas?.length || 0} areas`);
  
  return {
    variants: varResp.ok && variants?.length > 0,
    shipping: shipResp.ok && shipping && Object.keys(shipping).length > 0,
    printAreas: areasResp.ok && printAreas?.length > 0,
    viable: varResp.ok && variants?.length > 0
  };
}

async function main() {
  console.log('🧪 Exploring vendor viability patterns...\n');
  
  // Test a few known vendors from different categories
  const testCases = [
    { blueprintId: 5, providerId: 1, name: 'Gildan T-Shirt' },
    { blueprintId: 6, providerId: 1, name: 'Bella Canvas T-Shirt' },
    { blueprintId: 377, providerId: 1, name: 'Coffee Mug' },
    { blueprintId: 7, providerId: 1, name: 'Tank Top' }
  ];
  
  const results = [];
  
  for (const test of testCases) {
    const result = await exploreVendor(test.blueprintId, test.providerId, test.name);
    results.push({ ...test, ...result });
    await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit
  }
  
  console.log('\n📊 Results Summary:');
  results.forEach(r => {
    console.log(`${r.viable ? '✅' : '❌'} ${r.name}: variants=${r.variants}, shipping=${r.shipping}, printAreas=${r.printAreas}`);
  });
  
  console.log('\n💡 Based on these results, a viable vendor needs:');
  console.log('   1. Working variants API (products/sizes available)');
  console.log('   2. Working shipping API (can deliver products)');
  console.log('   3. Working print areas API (can customize products)');
}

main().catch(console.error);