/**
 * Check Shop Access - What can we actually access?
 */

require('dotenv').config();

const PRINTIFY_API_BASE = 'https://api.printify.com/v1';
const PRINTIFY_TOKEN = process.env.PRINTIFY_API_TOKEN;
const SHOP_ID = process.env.PRINTIFY_SHOP_ID;

async function makeRequest(endpoint) {
  const response = await fetch(`${PRINTIFY_API_BASE}${endpoint}`, {
    headers: { 'Authorization': `Bearer ${PRINTIFY_TOKEN}` }
  });
  return { response, data: response.ok ? await response.json() : null };
}

async function main() {
  console.log('🔍 Checking Printify account access...\n');
  
  // 1. Check shops
  console.log('1. Checking shops...');
  const { response: shopsResp, data: shops } = await makeRequest('/shops.json');
  console.log(`   Status: ${shopsResp.status}`);
  if (shops) {
    console.log(`   Found ${shops.length} shops`);
    shops.forEach(shop => {
      console.log(`   - ${shop.title} (ID: ${shop.id})`);
    });
  }
  
  // 2. Check existing products in your shop
  console.log(`\n2. Checking products in shop ${SHOP_ID}...`);
  const { response: productsResp, data: products } = await makeRequest(`/shops/${SHOP_ID}/products.json`);
  console.log(`   Status: ${productsResp.status}`);
  if (products) {
    console.log(`   Found ${products.data?.length || 0} existing products`);
    if (products.data?.length > 0) {
      console.log(`   Sample product: ${products.data[0].title}`);
      console.log(`   Blueprint ID: ${products.data[0].blueprint_id}`);
      console.log(`   Provider ID: ${products.data[0].print_provider_id}`);
    }
  }
  
  // 3. Check catalog access
  console.log(`\n3. Checking catalog access...`);
  const { response: catalogResp, data: catalog } = await makeRequest('/catalog/blueprints.json?limit=5');
  console.log(`   Status: ${catalogResp.status}`);
  if (catalog) {
    console.log(`   Can access ${catalog.length} blueprints (showing first 5)`);
    catalog.forEach((bp, i) => {
      console.log(`   ${i+1}. ${bp.title} (ID: ${bp.id})`);
    });
  }
  
  // 4. Test a simple blueprint that should work
  console.log(`\n4. Testing basic blueprint access...`);
  if (catalog?.length > 0) {
    const testBlueprint = catalog[0];
    const { response: providersResp, data: providers } = await makeRequest(
      `/catalog/blueprints/${testBlueprint.id}/print_providers.json`
    );
    console.log(`   Providers for ${testBlueprint.title}: ${providersResp.status}`);
    if (providers?.length > 0) {
      console.log(`   Found ${providers.length} providers`);
      
      // Test variants for first provider
      const { response: varResp, data: variants } = await makeRequest(
        `/catalog/blueprints/${testBlueprint.id}/print_providers/${providers[0].id}/variants.json`
      );
      console.log(`   Variants for ${providers[0].title}: ${varResp.status} - ${variants?.length || 0} variants`);
      
      if (variants?.length > 0) {
        console.log(`   ✅ FOUND WORKING COMBINATION!`);
        console.log(`      Blueprint: ${testBlueprint.id} (${testBlueprint.title})`);
        console.log(`      Provider: ${providers[0].id} (${providers[0].title})`);
        console.log(`      Variants: ${variants.length}`);
        console.log(`      Sample: ${variants[0].title} - $${variants[0].price/100}`);
      }
    }
  }
}

main().catch(console.error);