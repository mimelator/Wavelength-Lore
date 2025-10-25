/**
 * Alternative Approaches - Test different methods to find available products
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

async function testAlternativeApproaches() {
  console.log('🔍 Testing alternative approaches to find available products...\n');
  
  // Approach 1: Check if there's a different variants endpoint pattern
  console.log('1. Testing alternative variant endpoint patterns:');
  const variantPatterns = [
    '/catalog/blueprints/5/variants.json',
    '/catalog/variants.json?blueprint_id=5',
    '/catalog/variants.json?blueprint=5',
    '/variants.json?blueprint_id=5',
    '/catalog/blueprints/5/available_variants.json'
  ];
  
  for (const pattern of variantPatterns) {
    const { response } = await makeRequest(pattern);
    console.log(`   ${pattern}: ${response.status}`);
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  // Approach 2: Test if there's a products catalog endpoint
  console.log('\n2. Testing product catalog endpoints:');
  const catalogPatterns = [
    '/catalog/products.json',
    '/catalog/available_products.json',
    '/catalog/active_products.json',
    '/products/catalog.json',
    '/catalog.json'
  ];
  
  for (const pattern of catalogPatterns) {
    const { response, data } = await makeRequest(pattern);
    console.log(`   ${pattern}: ${response.status}${data && Array.isArray(data) ? ` (${data.length} items)` : ''}`);
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  // Approach 3: Test marketplace or public catalog endpoints
  console.log('\n3. Testing marketplace/public endpoints:');
  const marketplacePatterns = [
    '/marketplace/products.json',
    '/public/catalog.json',
    '/catalog/marketplace.json',
    '/available.json'
  ];
  
  for (const pattern of marketplacePatterns) {
    const { response } = await makeRequest(pattern);
    console.log(`   ${pattern}: ${response.status}`);
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  // Approach 4: Test if we need different headers or parameters
  console.log('\n4. Testing with different request parameters:');
  const parameterTests = [
    '/catalog/blueprints.json?include_variants=true',
    '/catalog/blueprints.json?expand=variants',
    '/catalog/blueprints.json?with_variants=1',
    '/catalog/blueprints.json?detailed=true'
  ];
  
  for (const test of parameterTests) {
    const { response, data } = await makeRequest(test);
    console.log(`   ${test}: ${response.status}${Array.isArray(data) ? ` (${data.length} items)` : ''}`);
    if (data && Array.isArray(data) && data[0]) {
      const hasVariants = data[0].variants || data[0].available_variants;
      console.log(`      First item has variants: ${!!hasVariants}`);
    }
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  // Approach 5: Test webhook or events endpoints that might show available products
  console.log('\n5. Testing webhook/events endpoints:');
  const webhookPatterns = [
    '/webhooks.json',
    '/events.json',
    '/notifications.json'
  ];
  
  for (const pattern of webhookPatterns) {
    const { response } = await makeRequest(pattern);
    console.log(`   ${pattern}: ${response.status}`);
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  // Approach 6: Test if we can get variant info from existing products
  console.log('\n6. Testing variant extraction from existing products:');
  const { data: productsResponse } = await makeRequest(`/shops/${SHOP_ID}/products.json`);
  const products = productsResponse?.data || [];
  
  if (products.length > 0) {
    const product = products[0];
    console.log(`   Product variants in response: ${product.variants?.length || 0}`);
    
    if (product.variants?.length > 0) {
      console.log(`   ✅ Found variants in product data!`);
      console.log(`      Sample variant: ${product.variants[0].title || 'No title'}`);
      console.log(`      Variant has price: ${!!product.variants[0].price}`);
      console.log(`      This suggests variants are embedded in product responses`);
    }
  }
  
  console.log('\n📋 Alternative approaches tested');
}

testAlternativeApproaches().catch(console.error);