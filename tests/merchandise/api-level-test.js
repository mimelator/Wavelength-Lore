/**
 * API Level Test for Merchandise Product Creation
 * 
 * Tests the API endpoints directly without browser automation
 */

const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

async function testMerchandiseAPI() {
  console.log('🧪 Starting API Level Tests\n');
  
  try {
    // Test 1: Check Printify configuration
    console.log('1️⃣ Testing Printify configuration...');
    const configTest = await axios.get(`${BASE_URL}/api/merchandise/enhancement-status`);
    console.log('✅ Enhancement status:', configTest.data);
    
    // Test 2: Get gallery images
    console.log('\n2️⃣ Testing gallery images endpoint...');
    const galleryTest = await axios.get(`${BASE_URL}/api/merchandise/gallery-images`, {
      headers: { 'Authorization': 'Bearer dev-bypass' }
    });
    console.log('✅ Gallery images count:', galleryTest.data.images?.length || 0);
    
    if (galleryTest.data.images?.length > 0) {
      const testImage = galleryTest.data.images[0];
      console.log('📸 Test image:', {
        id: testImage.id,
        title: testImage.title,
        url: testImage.url
      });
      
      // Test 3: Try to create product with minimal payload
      console.log('\n3️⃣ Testing product creation API...');
      const productPayload = {
        imageId: testImage.id,
        imageUrl: testImage.url,
        imageTitle: testImage.title || 'Test Product',
        productOptions: {}
      };
      
      console.log('📤 Sending payload:', productPayload);
      
      try {
        const productTest = await axios.post(`${BASE_URL}/api/merchandise/create-product`, productPayload, {
          headers: { 
            'Authorization': 'Bearer dev-bypass',
            'Content-Type': 'application/json'
          }
        });
        console.log('✅ Product creation successful:', productTest.data);
      } catch (productError) {
        console.log('❌ Product creation failed:');
        console.log('   Status:', productError.response?.status);
        console.log('   Error:', productError.response?.data);
        
        // Check if it's a Printify API issue
        if (productError.response?.data?.details) {
          console.log('   API Details:', productError.response.data.details);
        }
      }
    } else {
      console.log('⚠️ No gallery images found for testing');
    }
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

// Run the test
testMerchandiseAPI().catch(console.error);