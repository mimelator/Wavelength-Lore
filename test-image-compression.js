#!/usr/bin/env node
/**
 * Quick test script to validate OpenAI image compression pipeline
 * Tests the exact same processing that fails in production
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function testImageCompression() {
  console.log('🧪 Testing OpenAI Image Compression Pipeline...\n');
  
  try {
    // Create a test WebP image similar to what we get (1320x936)
    const testBuffer = await sharp({
      create: {
        width: 1320,
        height: 936,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 1 }
      }
    })
    .png()
    .toBuffer();
    
    console.log(`📊 Created test image: 1320x936, size: ${(testBuffer.length / 1024 / 1024).toFixed(2)}MB`);
    
    // Test 1: Current production logic (what's failing)
    console.log('\n🔬 TEST 1: Current Production Logic');
    let processedBuffer = await sharp(testBuffer)
      .resize(1800, 1800, { fit: 'cover' })
      .ensureAlpha()
      .toColorspace('srgb')
      .png({ 
        quality: 90, 
        compressionLevel: 6,
        palette: false
      })
      .toBuffer();
      
    let fileSizeMB = processedBuffer.length / (1024 * 1024);
    console.log(`📐 Resized to 1800x1800: ${fileSizeMB.toFixed(2)}MB`);
    
    if (fileSizeMB > 4) {
      console.log(`⚠️ Still too large, applying maximum compression...`);
      processedBuffer = await sharp(testBuffer)
        .resize(1800, 1800, { fit: 'cover' })
        .ensureAlpha()
        .toColorspace('srgb')
        .png({ 
          quality: 70, 
          compressionLevel: 9,
          palette: false
        })
        .toBuffer();
      
      fileSizeMB = processedBuffer.length / (1024 * 1024);
      console.log(`🗜️ Maximum compression: ${fileSizeMB.toFixed(2)}MB`);
    }
    
    console.log(`❌ RESULT: ${fileSizeMB > 4 ? 'STILL TOO LARGE' : 'SUCCESS'}`);
    
    // Test 2: More aggressive compression options
    console.log('\n🔬 TEST 2: Aggressive Compression');
    const aggressiveBuffer = await sharp(testBuffer)
      .resize(1800, 1800, { fit: 'cover' })
      .ensureAlpha()
      .png({ 
        quality: 50,           // Much lower quality
        compressionLevel: 9,   // Maximum compression
        palette: false,
        colors: 128           // Limit color palette
      })
      .toBuffer();
      
    const aggressiveSizeMB = aggressiveBuffer.length / (1024 * 1024);
    console.log(`🗜️ Aggressive compression: ${aggressiveSizeMB.toFixed(2)}MB`);
    console.log(`${aggressiveSizeMB <= 4 ? '✅' : '❌'} RESULT: ${aggressiveSizeMB <= 4 ? 'SUCCESS' : 'STILL TOO LARGE'}`);
    
    // Test 3: Try smaller dimensions first, then upscale
    console.log('\n🔬 TEST 3: Smaller Dimensions Strategy');
    const smallerBuffer = await sharp(testBuffer)
      .resize(1600, 1600, { fit: 'cover' })  // Smaller target
      .ensureAlpha()
      .png({ 
        quality: 80, 
        compressionLevel: 8,
        palette: false
      })
      .toBuffer();
      
    const smallerSizeMB = smallerBuffer.length / (1024 * 1024);
    console.log(`📐 Resized to 1600x1600: ${smallerSizeMB.toFixed(2)}MB`);
    console.log(`${smallerSizeMB <= 4 ? '✅' : '❌'} RESULT: ${smallerSizeMB <= 4 ? 'SUCCESS' : 'STILL TOO LARGE'}`);
    
    // Test 4: Try JPEG instead (OpenAI might accept JPEG for some endpoints)
    console.log('\n🔬 TEST 4: JPEG Alternative');
    const jpegBuffer = await sharp(testBuffer)
      .resize(1800, 1800, { fit: 'cover' })
      .jpeg({ 
        quality: 80,
        progressive: true
      })
      .toBuffer();
      
    const jpegSizeMB = jpegBuffer.length / (1024 * 1024);
    console.log(`📐 JPEG 1800x1800: ${jpegSizeMB.toFixed(2)}MB`);
    console.log(`${jpegSizeMB <= 4 ? '✅' : '❌'} RESULT: ${jpegSizeMB <= 4 ? 'SUCCESS (but OpenAI needs PNG)' : 'STILL TOO LARGE'}`);
    
    // Summary and recommendation
    console.log('\n📋 SUMMARY:');
    console.log('Current production logic creates images that are consistently over 4MB');
    console.log('Need to implement more aggressive compression or smaller initial dimensions');
    
    if (aggressiveSizeMB <= 4) {
      console.log('\n💡 RECOMMENDATION: Use aggressive compression settings');
      console.log('   quality: 50, compressionLevel: 9, colors: 128');
    } else if (smallerSizeMB <= 4) {
      console.log('\n💡 RECOMMENDATION: Use smaller initial dimensions (1600x1600)');
      console.log('   Then let OpenAI upscale to final size');
    } else {
      console.log('\n💡 RECOMMENDATION: Need alternative upscaling service or skip upscaling');
      console.log('   OpenAI file size limits are too restrictive for this use case');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

if (require.main === module) {
  testImageCompression();
}

module.exports = { testImageCompression };