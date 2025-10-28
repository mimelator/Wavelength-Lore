/**
 * Test Upscaling Service Post-Processing Fix
 * 
 * Tests that cached images are properly post-processed to meet Printify's 1800x1800 minimum
 */

const ImageUpscalingService = require('./services/image-upscaling-service');
const fs = require('fs');
const path = require('path');

async function testUpscaling() {
  try {
    console.log('🧪 TESTING UPSCALING SERVICE WITH CACHE POST-PROCESSING...');
    
    // Use a Wavelength character image
    const testImagePath = './static/images/characters/wavelength-character-1.jpg';
    if (!fs.existsSync(testImagePath)) {
      console.error('❌ Test image not found:', testImagePath);
      return;
    }
    
    const imageBuffer = fs.readFileSync(testImagePath);
    console.log('📷 Test image loaded:', imageBuffer.length, 'bytes');
    
    const upscaler = new ImageUpscalingService();
    
    const result = await upscaler.upscaleImageForPrintify(imageBuffer, {
      fileName: 'test-upscale-cache-post-process.png'
    });
    
    console.log('✅ UPSCALING RESULT:');
    console.log('  Success:', result.success);
    console.log('  Method:', result.method);
    console.log('  Cached:', result.cached);
    console.log('  Buffer size:', result.upscaledBuffer ? result.upscaledBuffer.length : 'N/A');
    console.log('  S3 Key:', result.s3Key || 'N/A');
    
    if (result.upscaledBuffer) {
      const sharp = require('sharp');
      const metadata = await sharp(result.upscaledBuffer).metadata();
      console.log('📐 FINAL DIMENSIONS:', `${metadata.width}x${metadata.height}`);
      
      if (metadata.width >= 1800 && metadata.height >= 1800) {
        console.log('🎯 SUCCESS: Image meets Printify requirements!');
      } else {
        console.log('❌ FAILURE: Image too small for Printify!');
      }
    }
    
  } catch (error) {
    console.error('❌ Upscaling test failed:', error.message);
    console.error(error.stack);
  }
}

testUpscaling();