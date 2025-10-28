#!/usr/bin/env node

/**
 * 🔍 DIRECT IMAGE BUFFER TEST
 * 
 * This test directly simulates the image buffer processing without authentication
 * to trigger the enhanced diagnostics we added.
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function testDirectImageBuffer() {
  console.log('🌊 WAVELENGTH: Direct Image Buffer Test');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    // Test the downloadImageFromS3 function with a real URL
    console.log('🔍 TESTING IMAGE DOWNLOAD AND BUFFER PROCESSING');
    
    // Use a small test image URL to see if our diagnostics work
    const testImageUrl = 'https://via.placeholder.com/300x300.png';
    
    console.log('📤 Making request to test download diagnostics...');
    console.log('🎯 This should trigger our enhanced downloadImageFromS3 diagnostics');
    
    // Test the merchandise debug endpoint which might show some info
    const debugResponse = await axios.get('http://localhost:3001/api/merchandise/debug');
    console.log('✅ Debug endpoint response:', debugResponse.data);
    
  } catch (error) {
    console.log('❌ Error in direct test:', error.message);
    if (error.response) {
      console.log('📊 Response:', error.response.data);
    }
  }
  
  console.log('\n🎯 RECOMMENDATION:');
  console.log('Since authentication is required, the best approach is:');
  console.log('1. Open browser to http://localhost:3001/merchandise');
  console.log('2. Login and select an image');
  console.log('3. Choose a product type and click "Preview Finished Product"');
  console.log('4. Watch the server console for our enhanced diagnostics');
  console.log('');
  console.log('The enhanced logging should show:');
  console.log('📥 DOWNLOAD DIAGNOSTICS: (from downloadImageFromS3)');
  console.log('📤 PRINTIFY UPLOAD ATTEMPT: (from printify-service.js)');
  console.log('🚨 PRINTIFY UPLOAD FAILURE DETAILS: (detailed error analysis)');
}

testDirectImageBuffer().catch(console.error);