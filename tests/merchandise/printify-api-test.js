/**
 * Direct Printify API Test
 * 
 * Tests Printify API directly to diagnose configuration issues
 */

require('dotenv').config();
const axios = require('axios');

const PRINTIFY_API_TOKEN = process.env.PRINTIFY_API_TOKEN;
const PRINTIFY_SHOP_ID = process.env.PRINTIFY_SHOP_ID;
const PRINTIFY_API_URL = process.env.PRINTIFY_API_URL || 'https://api.printify.com/v1';

async function testPrintifyAPI() {
  console.log('🔧 Testing Printify API Configuration\n');
  
  console.log('Config:', {
    apiUrl: PRINTIFY_API_URL,
    shopId: PRINTIFY_SHOP_ID,
    hasToken: !!PRINTIFY_API_TOKEN,
    tokenLength: PRINTIFY_API_TOKEN?.length
  });
  
  const api = axios.create({
    baseURL: PRINTIFY_API_URL,
    headers: {
      'Authorization': `Bearer ${PRINTIFY_API_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });
  
  try {
    // Test 0: Get user shops first
    console.log('\n0️⃣ Getting user shops...');
    const shopsResponse = await api.get('/shops.json');
    console.log('✅ Available shops:', shopsResponse.data.map(shop => ({ id: shop.id, title: shop.title })));
    
    // Test 1: Try different shop endpoint formats
    console.log('\n1️⃣ Testing shop access formats...');
    
    try {
      const shopResponse1 = await api.get(`/shops/${PRINTIFY_SHOP_ID}.json`);
      console.log('✅ Format 1 (.json) successful:', shopResponse1.data.title);
    } catch (e) {
      console.log('❌ Format 1 (.json) failed:', e.response?.status);
    }
    
    try {
      const shopResponse2 = await api.get(`/shops/${PRINTIFY_SHOP_ID}`);
      console.log('✅ Format 2 (no .json) successful:', shopResponse2.data.title);
    } catch (e) {
      console.log('❌ Format 2 (no .json) failed:', e.response?.status);
    }
    
    // Test 2: Get blueprints (skip shop-specific test for now)
    console.log('\n2️⃣ Testing blueprints...');
    const blueprintsResponse = await api.get('/catalog/blueprints.json');
    console.log('✅ Blueprints loaded:', blueprintsResponse.data.length);
    
    // Find a t-shirt blueprint
    const tshirtBlueprint = blueprintsResponse.data.find(bp => 
      bp.title.toLowerCase().includes('shirt') || bp.title.toLowerCase().includes('tee')
    );
    if (tshirtBlueprint) {
      console.log('📋 Found t-shirt blueprint:', tshirtBlueprint.id, '-', tshirtBlueprint.title);
    }
    
    // Test 3: Try to upload a small test image
    console.log('\n3️⃣ Testing image upload...');
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='; // 1x1 pixel
    
    const uploadPayload = {
      file_name: 'test.png',
      contents: testImageBase64
    };
    
    try {
      const uploadResponse = await api.post('/uploads/images.json', uploadPayload);
      console.log('✅ Image upload successful:', uploadResponse.data.id);
      
      // Test 4: Get print providers for the blueprint
      if (tshirtBlueprint) {
        console.log('\n4️⃣ Getting print providers for blueprint...');
        const providersResponse = await api.get(`/catalog/blueprints/${tshirtBlueprint.id}/print_providers.json`);
        console.log('✅ Print providers:', providersResponse.data.length);
        
        const firstProvider = providersResponse.data[0];
        console.log('🏭 Using provider:', firstProvider.id, '-', firstProvider.title);
        
        // Test 5: Get variants for this blueprint/provider combo
        console.log('\n5️⃣ Getting variants...');
        const variantsResponse = await api.get(`/catalog/blueprints/${tshirtBlueprint.id}/print_providers/${firstProvider.id}/variants.json`);
        console.log('✅ Variants available:', variantsResponse.data.variants.length);
        
        const firstVariant = variantsResponse.data.variants[0];
        console.log('👕 Using variant:', firstVariant.id, '-', firstVariant.title);
        
        // Test 6: Try to create a simple product with correct data
        console.log('\n6️⃣ Testing product creation...');
        const productPayload = {
          title: 'Test Wavelength Product',
          description: 'Test product from Wavelength Lore',
          blueprint_id: tshirtBlueprint.id,
          print_provider_id: firstProvider.id,
          variants: [{
            id: firstVariant.id,
            price: 2099,
            is_enabled: true
          }],
          print_areas: [{
            variant_ids: [firstVariant.id],
            placeholders: [{
              position: 'front',
              images: [{
                id: uploadResponse.data.id,
                x: 0.5,
                y: 0.5,
                scale: 1,
                angle: 0
              }]
            }]
          }]
        };
        
        const productResponse = await api.post(`/shops/${PRINTIFY_SHOP_ID}/products.json`, productPayload);
        console.log('✅ Product creation successful:', productResponse.data.id);
      }
    } catch (uploadError) {
      console.log('❌ Image upload failed:', uploadError.response?.status, uploadError.response?.data);
    }
    
    console.log('\n🎉 All Printify API tests passed!');
    
  } catch (error) {
    console.error('\n❌ Printify API test failed:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message || error.message);
    console.error('Details:', error.response?.data);
  }
}

testPrintifyAPI().catch(console.error);