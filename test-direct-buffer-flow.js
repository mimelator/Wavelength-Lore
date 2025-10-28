#!/usr/bin/env node

/**
 * 🌊 WAVELENGTH: Direct Image Buffer Test (No Auth Required)
 * Tests the downloadImageFromS3 and uploadImage functions directly
 */

console.log('🌊 WAVELENGTH: Testing image buffer processing directly...\n');

// Import the required modules directly
const path = require('path');
process.chdir(path.dirname(__filename));

async function testImageBufferFlow() {
  try {
    console.log('📂 Loading modules...');
    
    // Load the merchandise routes module to access downloadImageFromS3
    const routesPath = './routes/merchandise.js';
    delete require.cache[require.resolve(routesPath)];
    
    // Since the module exports a router, we need to access the function differently
    // Let's directly test the auto-enhanced printify service
    const AutoEnhancedPrintifyService = require('./services/auto-enhanced-printify-service.js');
    
    console.log('✅ Modules loaded successfully');
    
    // Create an instance of the service
    const printifyService = new AutoEnhancedPrintifyService();
    
    console.log('🌐 Testing image download from S3...');
    
    // Test image URL (using the same one from our API test)
    const imageUrl = 'https://wavelength-lore-image-gallery.s3.us-east-1.amazonaws.com/seasonal-borders/christmas-lights-border.png';
    
    // We need to manually implement downloadImageFromS3 since it's in the route
    const https = require('https');
    
    const downloadImageFromS3 = async (url) => {
      return new Promise((resolve, reject) => {
        console.log('📥 DOWNLOAD DIAGNOSTICS:');
        console.log('   Original imageUrl:', url);
        
        https.get(url, (response) => {
          console.log('   Response status:', response.statusCode);
          console.log('   Content-Type:', response.headers['content-type']);
          
          if (response.statusCode !== 200) {
            reject(new Error(`Failed to download image: ${response.statusCode}`));
            return;
          }
          
          const chunks = [];
          let totalSize = 0;
          
          response.on('data', (chunk) => {
            chunks.push(chunk);
            totalSize += chunk.length;
          });
          
          response.on('end', () => {
            const buffer = Buffer.concat(chunks);
            console.log('   Data size:', totalSize, 'bytes');
            console.log('   Buffer created successfully');
            
            // Detect image type from buffer
            let imageType = 'UNKNOWN';
            if (buffer.length >= 8) {
              const header = buffer.toString('hex', 0, 8);
              if (header.startsWith('89504e47')) imageType = 'PNG';
              else if (header.startsWith('ffd8ff')) imageType = 'JPEG';
              else if (header.startsWith('47494638')) imageType = 'GIF';
              else if (header.startsWith('52494646') && buffer.toString('ascii', 8, 12) === 'WEBP') imageType = 'WEBP';
            }
            console.log('   Detected image type:', imageType);
            
            resolve(buffer);
          });
        }).on('error', reject);
      });
    };
    
    console.log('\n📥 Downloading image from S3...');
    const imageBuffer = await downloadImageFromS3(imageUrl);
    
    console.log('✅ Image downloaded successfully:', (imageBuffer.length / 1024).toFixed(2), 'KB');
    
    console.log('\n🚀 Testing Printify upload...');
    
    // Test upload with the problematic filename
    const fileName = 'Wrapping Papers'; // This was the original failing case
    const title = 'Test Wavelength Product';
    
    console.log('📤 UPLOAD TEST PARAMETERS:');
    console.log('   fileName:', fileName);
    console.log('   title:', title);
    console.log('   imageBuffer size:', (imageBuffer.length / 1024).toFixed(2), 'KB');
    
    // This should trigger our enhanced diagnostics and show if the error is fixed
    const uploadResult = await printifyService.uploadImage(imageBuffer, fileName, title);
    
    console.log('\n✅ UPLOAD SUCCESSFUL!');
    console.log('📋 Upload result:', uploadResult);
    
  } catch (error) {
    console.error('\n❌ ERROR IN BUFFER TEST:');
    console.error('   Message:', error.message);
    console.error('   Stack:', error.stack);
    
    if (error.message.includes('uploadFileName is not defined')) {
      console.error('\n🚨 CONFIRMED: uploadFileName variable issue detected!');
      console.error('   This confirms our variable scoping problem');
    } else {
      console.error('\n🔍 Different error than expected uploadFileName issue');
    }
  }
}

// Run the test
testImageBufferFlow()
  .then(() => {
    console.log('\n🌊 Direct buffer test complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test runner error:', error.message);
    process.exit(1);
  });