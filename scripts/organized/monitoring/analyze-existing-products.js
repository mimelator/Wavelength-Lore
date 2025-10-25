/**
 * Analyze Existing Products - Learn from what's already working
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

async function analyzeExistingProducts() {
  console.log('🔍 Analyzing existing products to understand API patterns...\n');
  
  // Get existing products
  const { data: productsResponse } = await makeRequest(`/shops/${SHOP_ID}/products.json`);
  const products = productsResponse?.data || [];
  
  console.log(`Found ${products.length} existing products in your shop\n`);
  
  if (products.length === 0) {
    console.log('❌ No existing products found');
    return;
  }
  
  // Analyze first few products
  const sampleSize = Math.min(3, products.length);
  
  for (let i = 0; i < sampleSize; i++) {
    const product = products[i];
    console.log(`📦 Product ${i + 1}: ${product.title}`);
    console.log(`   Blueprint ID: ${product.blueprint_id}`);
    console.log(`   Provider ID: ${product.print_provider_id}`);
    console.log(`   Variants: ${product.variants?.length || 0}`);
    console.log(`   Status: ${product.status}`);
    
    // Test the correct variants endpoint pattern
    const variantsEndpoint = `/catalog/blueprints/${product.blueprint_id}/print_providers/${product.print_provider_id}/variants.json`;
    const { response: varResp, data: variants } = await makeRequest(variantsEndpoint);
    
    console.log(`   Variants API: ${varResp.status} - ${variants?.length || 0} available`);
    
    if (variants?.length > 0) {
      console.log(`   ✅ WORKING COMBINATION FOUND!`);
      console.log(`      Endpoint: ${variantsEndpoint}`);
      console.log(`      Sample variant: ${variants[0].title} - $${variants[0].price/100}`);
      
      // This is the pattern that works - let's use it
      return {
        workingPattern: {
          blueprintId: product.blueprint_id,
          providerId: product.print_provider_id,
          endpoint: variantsEndpoint,
          variantCount: variants.length
        }
      };
    }
    
    console.log('');
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

analyzeExistingProducts().catch(console.error);