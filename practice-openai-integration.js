#!/usr/bin/env node
/**
 * Practice script - compress an image and actually send it to OpenAI
 * Tests the full compression + OpenAI API integration
 * 
 * UPDATED with optimal settings from test-real-compression.js findings:
 * - quality=60, compressionLevel=9 produces reliable <4MB results
 * - Tested on real Wavelength images with 100% success rate
 */

// Load environment variables from main .env file
require('dotenv').config();

const sharp = require('sharp');
const fs = require('fs');
const { toFile } = require('openai/uploads');
const OpenAI = require('openai');

async function practiceOpenAIIntegration() {
  console.log('🧪 Practicing OpenAI integration with compressed images...\n');
  
  // Initialize OpenAI exactly like production does
  let openai;
  if (!process.env.OPENAI_API_KEY) {
    console.log('❌ OPENAI_API_KEY not found in .env');
    console.log('Make sure .env file exists and has OPENAI_API_KEY set');
    return;
  }
  
  try {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    console.log('✅ OpenAI client initialized with production API key');
  } catch (error) {
    console.log('❌ OpenAI client failed:', error.message);
    return;
  }
  
  // Test with one of our known good images
  const testImagePath = 'static/images/seasons/season3/episodes/episode7/images/PrepareForBattle-22.webp';
  
  if (!fs.existsSync(testImagePath)) {
    console.log(`❌ Test image not found: ${testImagePath}`);
    return;
  }
  
  try {
    const originalBuffer = fs.readFileSync(testImagePath);
    const metadata = await sharp(originalBuffer).metadata();
    
    console.log(`📸 Original: ${metadata.width}x${metadata.height} ${metadata.format.toUpperCase()}, ${(originalBuffer.length / 1024).toFixed(1)}KB`);
    
    // Step 1: Apply our tested compression settings - OPTIMIZED BASED ON REAL-WORLD TESTING
    console.log('\n🗜️ Step 1: Compressing image...');
    const processedBuffer = await sharp(originalBuffer)
      .resize(1024, 1024, { fit: 'cover' }) // CRITICAL: OpenAI requires exactly 1024x1024
      .ensureAlpha() // Ensure 4-channel RGBA format for OpenAI
      .png({ 
        quality: 60,  // TESTED: Aggressive compression for 100% reliability
        compressionLevel: 9, // Maximum compression (0-9)
        adaptiveFiltering: true, // Additional optimization like the example
        palette: false // Ensure RGBA format for OpenAI compatibility
      })
      .toBuffer();
      
    const sizeMB = processedBuffer.length / (1024 * 1024);
    console.log(`✅ Compressed: 1024x1024 PNG, ${sizeMB.toFixed(2)}MB`);
    
    if (sizeMB > 4) {
      console.log('❌ Still too large for OpenAI');
      return;
    }
    
    // Step 2: Prepare for OpenAI API
    console.log('\n📞 Step 2: Preparing OpenAI API call...');
    const prompt = 'Enhance this illustration with crisp details, vibrant colors, and sharp lines suitable for high-quality printing';
    
    console.log(`📝 Prompt: ${prompt}`);
    console.log(`📊 Image size: ${sizeMB.toFixed(2)}MB (under 4MB limit ✅)`);
    
    // Step 3: Actually call OpenAI API
    console.log('\n🚀 Step 3: Calling OpenAI images.edit API...');
    
    const response = await openai.images.edit({
      image: await toFile(processedBuffer, 'test-image.png', { type: 'image/png' }),
      prompt: prompt,
      n: 1,
      size: '1024x1024'  // OpenAI will return this size
    });
    
    console.log('✅ OpenAI API call successful!');
    console.log(`📊 Response: ${response.data.length} image(s) generated`);
    console.log(`🔗 URL: ${response.data[0].url}`);
    
    // Step 4: Optionally download and analyze the result
    console.log('\n🎯 Step 4: Analyzing result...');
    const resultResponse = await fetch(response.data[0].url);
    const resultBuffer = await resultResponse.arrayBuffer();
    const resultSize = resultBuffer.byteLength;
    
    console.log(`📥 Downloaded result: ${(resultSize / 1024 / 1024).toFixed(2)}MB`);
    console.log('✅ Full pipeline test SUCCESSFUL!');
    
    // Summary
    console.log('\n📋 PIPELINE SUMMARY:');
    console.log(`   Input: ${(originalBuffer.length / 1024).toFixed(1)}KB WebP`);
    console.log(`   Compressed: ${sizeMB.toFixed(2)}MB PNG`);
    console.log(`   OpenAI: ✅ Accepted and processed`);
    console.log(`   Output: ${(resultSize / 1024 / 1024).toFixed(2)}MB enhanced image`);
    
  } catch (error) {
    console.error('\n❌ Pipeline failed:', error.message);
    
    if (error.status === 400) {
      console.log('💡 This might be a format or size issue');
    } else if (error.status === 429) {
      console.log('💡 Rate limit hit - try again later');
    } else {
      console.log('💡 Check OpenAI API key and permissions');
    }
  }
}

if (require.main === module) {
  practiceOpenAIIntegration();
}

module.exports = { practiceOpenAIIntegration };