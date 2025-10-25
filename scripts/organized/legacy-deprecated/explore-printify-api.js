/**
 * Explore Printify API - Discover the correct endpoints for available products
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

async function exploreAPI() {
  console.log('🔍 Exploring Printify API endpoints for available products...\n');
  
  // 1. Check catalog endpoints with different parameters
  console.log('1. Testing catalog endpoints:');
  
  const catalogEndpoints = [
    '/catalog/blueprints.json',
    '/catalog/blueprints.json?limit=10',
    '/catalog/blueprints.json?page=1&limit=5',
    '/catalog/print_providers.json'
  ];
  
  for (const endpoint of catalogEndpoints) {
    const { response, data } = await makeRequest(endpoint);
    console.log(`   ${endpoint}: ${response.status} - ${Array.isArray(data) ? data.length : 'N/A'} items`);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // 2. Check if there's a products endpoint that shows available products
  console.log('\n2. Testing product discovery endpoints:');
  
  const productEndpoints = [
    '/catalog/products.json',
    '/products.json',
    `/shops/${SHOP_ID}/products.json`,
    '/catalog/available_products.json'
  ];
  
  for (const endpoint of productEndpoints) {
    const { response, data } = await makeRequest(endpoint);
    console.log(`   ${endpoint}: ${response.status}`);
    if (response.ok && data) {
      console.log(`      Data type: ${Array.isArray(data) ? 'Array' : typeof data}`);
      if (Array.isArray(data)) {
        console.log(`      Items: ${data.length}`);
      } else if (data.data && Array.isArray(data.data)) {
        console.log(`      Items in data.data: ${data.data.length}`);
      }
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // 3. Test a specific blueprint with different approaches
  console.log('\n3. Testing blueprint 5 (known to exist) with different approaches:');
  
  const blueprintEndpoints = [
    '/catalog/blueprints/5.json',
    '/catalog/blueprints/5/print_providers.json',
    '/catalog/blueprints/5/variants.json',
    '/catalog/blueprints/5/print_areas.json'
  ];
  
  for (const endpoint of blueprintEndpoints) {
    const { response, data } = await makeRequest(endpoint);
    console.log(`   ${endpoint}: ${response.status}`);
    if (response.ok && data) {
      if (Array.isArray(data)) {
        console.log(`      Items: ${data.length}`);
        if (data.length > 0) {
          console.log(`      Sample: ${data[0].title || data[0].id || JSON.stringify(data[0]).substring(0, 50)}`);
        }
      } else {
        console.log(`      Type: ${typeof data}`);
        if (data.title) console.log(`      Title: ${data.title}`);
      }
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // 4. Check if there are query parameters for filtering available products
  console.log('\n4. Testing filtered blueprint queries:');
  
  const filteredEndpoints = [
    '/catalog/blueprints.json?available=true',
    '/catalog/blueprints.json?status=active',
    '/catalog/blueprints.json?has_variants=true',
    '/catalog/blueprints.json?in_stock=true'
  ];
  
  for (const endpoint of filteredEndpoints) {
    const { response, data } = await makeRequest(endpoint);
    console.log(`   ${endpoint}: ${response.status} - ${Array.isArray(data) ? data.length : 'N/A'} items`);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n📋 API Exploration Complete');
}

exploreAPI().catch(console.error);