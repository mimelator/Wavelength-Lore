/**
 * Test Known Working Combinations
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

async function testKnownWorking() {
  console.log('🧪 Testing known working combinations from your config...\n');
  
  const knownWorking = [
    { blueprintId: 5, providerId: 3, name: 'Unisex Cotton Crew Tee + Marco Fine Arts', expectedVariants: 57 },
    { blueprintId: 5, providerId: 29, name: 'Unisex Cotton Crew Tee + Monster Digital', expectedVariants: 111 },
    { blueprintId: 6, providerId: 3, name: 'Unisex Heavy Cotton Tee + Marco Fine Arts', expectedVariants: 131 },
    { blueprintId: 6, providerId: 29, name: 'Unisex Heavy Cotton Tee + Monster Digital', expectedVariants: 252 }
  ];
  
  for (const combo of knownWorking) {
    console.log(`🔍 Testing: ${combo.name}`);
    console.log(`   Expected: ${combo.expectedVariants} variants`);
    
    const { response, data: variants } = await makeRequest(
      `/catalog/blueprints/${combo.blueprintId}/print_providers/${combo.providerId}/variants.json`
    );
    
    const actualVariants = variants?.length || 0;
    console.log(`   Actual: ${response.status} - ${actualVariants} variants`);
    
    if (actualVariants > 0) {
      console.log(`   ✅ SUCCESS! Sample: ${variants[0].title} - $${variants[0].price/100}`);
      
      // This is a viable combination - let's understand what makes it work
      console.log(`   📊 Variant details:`);
      console.log(`      - ID: ${variants[0].id}`);
      console.log(`      - Title: ${variants[0].title}`);
      console.log(`      - Price: $${variants[0].price/100}`);
      console.log(`      - Available: ${variants[0].is_available ? 'Yes' : 'No'}`);
      
    } else if (response.status === 200) {
      console.log(`   ⚠️  API works but 0 variants (maybe discontinued?)`);
    } else {
      console.log(`   ❌ API error: ${response.status}`);
    }
    
    console.log('');
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

testKnownWorking().catch(console.error);