#!/usr/bin/env node

/**
 * 🌊 WAVELENGTH: Direct Merchandise API Test
 * Tests the exact API call that's failing with enhanced diagnostics
 */

const https = require('https');
const http = require('http');

console.log('🌊 WAVELENGTH: Testing merchandise create-guided-product API...\n');

// This simulates the exact API call that fails
const testData = {
  imageId: 'seasonal-borders/christmas-lights-border.png',
  imageUrl: 'https://wavelength-lore-image-gallery.s3.us-east-1.amazonaws.com/seasonal-borders/christmas-lights-border.png',
  productType: 'Wrapping Papers',
  title: 'Test Product',
  price: 25.99,
  effects: {
    warmth: 0.3,
    glow: 0.2
  },
  customizations: {
    border: {
      color: '#00FFFF',
      width: 10
    }
  }
};

const postData = JSON.stringify(testData);

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/merchandise/create-guided-product',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('🚀 Making API request to create guided product...');
console.log('📋 Request data:', JSON.stringify(testData, null, 2));
console.log('\n⏳ Waiting for response...\n');

const req = http.request(options, (res) => {
  console.log('📡 Response Status:', res.statusCode);
  console.log('📋 Response Headers:', res.headers);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\n📤 Response Body:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
      const response = JSON.parse(data);
      console.log(JSON.stringify(response, null, 2));
      
      if (response.success === false) {
        console.log('\n🚨 API CALL FAILED - This should trigger our enhanced diagnostics!');
        console.log('🔍 Check the server console for detailed error information.');
      } else {
        console.log('\n✅ API CALL SUCCEEDED - Unexpected! Error may be resolved.');
      }
    } catch (parseError) {
      console.log('Raw response (not JSON):');
      console.log(data);
    }
    
    console.log('\n🌊 Direct API test complete!');
  });
});

req.on('error', (err) => {
  console.error('❌ Request Error:', err.message);
});

req.write(postData);
req.end();