#!/usr/bin/env node
/**
 * Real-world compression test using actual Wavelength images
 * Tests the exact same processing pipeline that's failing in production
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function testRealWorldCompression() {
  console.log('🧪 Testing Real-World Image Compression Pipeline...\n');
  
  // Use an actual Wavelength image similar to what users upload
  const testImagePath = 'static/images/seasons/season3/episodes/episode7/images/PrepareForBattle-22.webp';
  
  if (!fs.existsSync(testImagePath)) {
    console.error(`❌ Test image not found: ${testImagePath}`);
    return;
  }
  
  try {
    const originalBuffer = fs.readFileSync(testImagePath);
    const metadata = await sharp(originalBuffer).metadata();
    
    console.log(`📊 Original: ${metadata.width}x${metadata.height} ${metadata.format.toUpperCase()}, ${(originalBuffer.length / 1024).toFixed(1)}KB\n`);
    
    // Step 1: WebP to PNG conversion (current production logic)
    console.log('🔬 STEP 1: WebP to PNG Conversion');
    let pngBuffer = await sharp(originalBuffer)
      .png({ quality: 90, compressionLevel: 6 }) // Current production settings
      .toBuffer();
      
    let sizeMB = pngBuffer.length / (1024 * 1024);
    console.log(`✅ WebP → PNG: ${sizeMB.toFixed(2)}MB`);
    
    // Step 2: Resize to 1800x1800 for OpenAI (current production logic)
    console.log('\n🔬 STEP 2: Resize for OpenAI Processing');
    let processedBuffer = await sharp(pngBuffer)
      .resize(1800, 1800, { fit: 'cover' })
      .ensureAlpha()
      .toColorspace('srgb')
      .png({ 
        quality: 90, 
        compressionLevel: 6,
        palette: false
      })
      .toBuffer();
      
    sizeMB = processedBuffer.length / (1024 * 1024);
    console.log(`📐 Resized 1800x1800: ${sizeMB.toFixed(2)}MB`);
    console.log(`${sizeMB <= 4 ? '✅' : '❌'} OpenAI limit check: ${sizeMB <= 4 ? 'PASS' : 'FAIL - TOO LARGE'}`);
    
    // Step 3: If too large, try maximum compression (current fallback logic)
    if (sizeMB > 4) {
      console.log('\n🔬 STEP 3: Maximum Compression Fallback');
      processedBuffer = await sharp(pngBuffer)
        .resize(1800, 1800, { fit: 'cover' })
        .ensureAlpha()
        .toColorspace('srgb')
        .png({ 
          quality: 70, 
          compressionLevel: 9,
          palette: false
        })
        .toBuffer();
      
      sizeMB = processedBuffer.length / (1024 * 1024);
      console.log(`🗜️ Maximum compression: ${sizeMB.toFixed(2)}MB`);
      console.log(`${sizeMB <= 4 ? '✅' : '❌'} OpenAI limit check: ${sizeMB <= 4 ? 'PASS' : 'FAIL - STILL TOO LARGE'}`);
    }
    
    // Step 4: Test alternative compression strategies
    console.log('\n🔬 STEP 4: Alternative Strategies');
    
    // Strategy A: More aggressive initial compression
    const aggressiveBuffer = await sharp(pngBuffer)
      .resize(1800, 1800, { fit: 'cover' })
      .ensureAlpha()
      .png({ 
        quality: 60, 
        compressionLevel: 9,
        palette: false,
        colors: 128
      })
      .toBuffer();
      
    const aggressiveSizeMB = aggressiveBuffer.length / (1024 * 1024);
    console.log(`🎯 Aggressive (q60,c9): ${aggressiveSizeMB.toFixed(2)}MB ${aggressiveSizeMB <= 4 ? '✅' : '❌'}`);
    
    // Strategy B: Smaller dimensions
    const smallerBuffer = await sharp(pngBuffer)
      .resize(1400, 1400, { fit: 'cover' })
      .ensureAlpha()
      .png({ 
        quality: 70, 
        compressionLevel: 8,
        palette: false
      })
      .toBuffer();
      
    const smallerSizeMB = smallerBuffer.length / (1024 * 1024);
    console.log(`📐 Smaller (1400x1400): ${smallerSizeMB.toFixed(2)}MB ${smallerSizeMB <= 4 ? '✅' : '❌'}`);
    
    // Summary
    console.log('\n📋 RESULTS SUMMARY:');
    console.log(`Current production: ${sizeMB > 4 ? '❌ FAILS' : '✅ WORKS'} (${sizeMB.toFixed(2)}MB)`);
    console.log(`Aggressive compression: ${aggressiveSizeMB > 4 ? '❌ FAILS' : '✅ WORKS'} (${aggressiveSizeMB.toFixed(2)}MB)`);
    console.log(`Smaller dimensions: ${smallerSizeMB > 4 ? '❌ FAILS' : '✅ WORKS'} (${smallerSizeMB.toFixed(2)}MB)`);
    
    console.log('\n💡 RECOMMENDATION:');
    if (aggressiveSizeMB <= 4) {
      console.log('✅ Simple fix: Use quality=60, compressionLevel=9 as default');
    } else if (smallerSizeMB <= 4) {
      console.log('✅ Alternative: Use 1400x1400 dimensions with current settings');
    } else {
      console.log('❌ Need different approach: OpenAI limits too restrictive for this content');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

if (require.main === module) {
  testRealWorldCompression();
}

module.exports = { testRealWorldCompression };