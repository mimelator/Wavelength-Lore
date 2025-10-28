#!/usr/bin/env node

/**
 * 🔍 CRITICAL IMAGE BUFFER DIAGNOSTICS TEST
 * 
 * This test simulates the exact flow that's failing in the merchandise store
 * to capture the enhanced diagnostic logging we added to identify the root cause
 * of "Failed to upload image: Operation failed."
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testImageBufferFlow() {
  console.log('🌊 WAVELENGTH: Testing Critical Image Buffer Flow');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎯 Goal: Trigger the image buffer flow and capture diagnostics');
  console.log('📋 Flow: Gallery Image → Download → Buffer → Printify Upload');
  
  try {
    // Step 1: Get available images from gallery
    console.log('\n📋 STEP 1: Getting available gallery images...');
    const galleryResponse = await axios.get(`${BASE_URL}/api/merchandise/gallery-images`);
    
    if (!galleryResponse.data?.success || !galleryResponse.data?.images || galleryResponse.data.images.length === 0) {
      throw new Error('No gallery images available for testing');
    }
    
    // Use the first available image
    const testImage = galleryResponse.data.images[0];
    console.log('✅ Selected test image:');
    console.log('   ID:', testImage.id);
    console.log('   Title:', testImage.title);
    console.log('   URL:', testImage.url);
    
    // Step 2: Get available product types
    console.log('\n📋 STEP 2: Getting available product types...');
    const productTypesResponse = await axios.get(`${BASE_URL}/api/merchandise/product-types`);
    
    if (!productTypesResponse.data?.allProducts || productTypesResponse.data.allProducts.length === 0) {
      throw new Error('No product types available for testing');
    }
    
    // Use the first validated product type
    const testProduct = productTypesResponse.data.allProducts.find(p => p.id.startsWith('validated-'));
    if (!testProduct) {
      throw new Error('No validated product types found');
    }
    
    console.log('✅ Selected test product:');
    console.log('   ID:', testProduct.id);
    console.log('   Name:', testProduct.name);
    console.log('   Blueprint ID:', testProduct.blueprintId);
    console.log('   Provider ID:', testProduct.printProviderId);
    
    // Step 3: Simulate login (create a test session)
    console.log('\n📋 STEP 3: Creating test authentication session...');
    
    // Note: In a real test, we'd need proper authentication
    // For now, let's try the API call and see what authentication error we get
    
    // Step 4: Make the critical API call that's failing
    console.log('\n📋 STEP 4: Making the critical API call...');
    console.log('🔥 This is where the "Failed to upload image: Operation failed" occurs');
    console.log('🔍 Enhanced diagnostics should show detailed error information');
    
    const testPayload = {
      imageId: testImage.id,
      imageUrl: testImage.url,
      imageTitle: testImage.title || testImage.id,
      productType: testProduct.id,
      blueprintId: testProduct.blueprintId,
      printProviderId: testProduct.printProviderId,
      imageContext: {
        effects: {
          warmth: true,
          glow: true
        },
        borderEnabled: true,
        borderColor: '#00FFFF',
        borderWidth: 3,
        borderWidthPixels: 30
      }
    };
    
    console.log('📤 Payload being sent:');
    console.log('   imageId:', testPayload.imageId);
    console.log('   imageUrl:', testPayload.imageUrl.substring(0, 60) + '...');
    console.log('   productType:', testPayload.productType);
    console.log('   blueprintId:', testPayload.blueprintId);
    console.log('   printProviderId:', testPayload.printProviderId);
    console.log('   effects:', testPayload.imageContext.effects);
    console.log('   borders:', { enabled: testPayload.imageContext.borderEnabled, color: testPayload.imageContext.borderColor });
    
    // This will likely fail with authentication error, but we should see the enhanced diagnostics
    const createResponse = await axios.post(`${BASE_URL}/api/merchandise/create-guided-product`, testPayload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 60000 // 60 second timeout for the complex image processing
    });
    
    console.log('\n✅ UNEXPECTED SUCCESS!');
    console.log('Product created:', createResponse.data);
    
  } catch (error) {
    console.log('\n🔍 EXPECTED ERROR - ANALYZING RESPONSE:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (error.response) {
      console.log('📊 Response Status:', error.response.status);
      console.log('📊 Response Data:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 401) {
        console.log('🔐 Authentication required - this is expected');
        console.log('✅ API endpoint is accessible, authentication is the only blocker');
      } else if (error.response.status === 400) {
        console.log('❌ BAD REQUEST - This might be our image buffer issue!');
        console.log('🔍 Check server logs for enhanced diagnostics');
      } else {
        console.log('🤔 Unexpected status code');
      }
    } else {
      console.log('❌ Network Error:', error.message);
    }
  }
  
  console.log('\n🌊 Test Complete');
  console.log('📋 Next Steps:');
  console.log('   1. Check server console for enhanced diagnostic output');
  console.log('   2. Look for the detailed logging we added to identify buffer issues');
  console.log('   3. Review the complete flow from gallery → buffer → Printify');
}

// Run the test
testImageBufferFlow().catch(console.error);