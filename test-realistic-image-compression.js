#!/usr/bin/env node
/**
 * Realistic image compression test with complex content
 */

const sharp = require('sharp');

async function testRealImageCompression() {
  console.log('🧪 Testing with Complex Image Content...\n');
  
  try {
    // Create a more complex test image with patterns and gradients
    const complexBuffer = await sharp({
      create: {
        width: 1320,
        height: 936,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 1 }
      }
    })
    .composite([
      // Add some complex patterns to simulate real artwork
      {
        input: await sharp({
          create: {
            width: 200,
            height: 200,
            channels: 3,
            background: { r: 255, g: 100, b: 50 }
          }
        }).png().toBuffer(),
        top: 100,
        left: 100
      },
      {
        input: await sharp({
          create: {
            width: 300,
            height: 300,
            channels: 3,
            background: { r: 50, g: 200, b: 255 }
          }
        }).png().toBuffer(),
        top: 400,
        left: 500
      }
    ])
    .png()
    .toBuffer();
    
    console.log(`📊 Created complex test image: 1320x936, size: ${(complexBuffer.length / 1024 / 1024).toFixed(2)}MB`);
    
    // Test current production logic
    console.log('\n🔬 Current Production Logic on Complex Image');
    let processedBuffer = await sharp(complexBuffer)
      .resize(1800, 1800, { fit: 'cover' })
      .ensureAlpha()
      .toColorspace('srgb')
      .png({ 
        quality: 90, 
        compressionLevel: 6,
        palette: false
      })
      .toBuffer();
      
    let fileSizeMB = processedBuffer.length / (1024 / 1024);
    console.log(`📐 Stage 1 (quality 90): ${fileSizeMB.toFixed(2)}KB`);
    
    // Convert to MB properly
    fileSizeMB = processedBuffer.length / (1024 * 1024);
    
    if (fileSizeMB > 4) {
      console.log(`⚠️ Too large (${fileSizeMB.toFixed(2)}MB), applying maximum compression...`);
      processedBuffer = await sharp(complexBuffer)
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
      console.log(`🗜️ Stage 2 (quality 70): ${fileSizeMB.toFixed(2)}MB`);
    }
    
    console.log(`${fileSizeMB <= 4 ? '✅' : '❌'} Final result: ${fileSizeMB.toFixed(2)}MB`);
    
    // Test ultra-aggressive compression
    if (fileSizeMB > 4) {
      console.log('\n🔬 Ultra-Aggressive Compression Test');
      const ultraBuffer = await sharp(complexBuffer)
        .resize(1800, 1800, { fit: 'cover' })
        .ensureAlpha()
        .png({ 
          quality: 30,           // Very low quality
          compressionLevel: 9,   // Maximum compression
          palette: false,
          colors: 64,           // Very limited color palette
          dither: 1.0           // Add dithering to hide compression artifacts
        })
        .toBuffer();
        
      const ultraSizeMB = ultraBuffer.length / (1024 * 1024);
      console.log(`🗜️ Ultra compression: ${ultraSizeMB.toFixed(2)}MB`);
      console.log(`${ultraSizeMB <= 4 ? '✅' : '❌'} Result: ${ultraSizeMB <= 4 ? 'SUCCESS' : 'STILL TOO LARGE'}`);
      
      // Test with much smaller dimensions
      if (ultraSizeMB > 4) {
        console.log('\n🔬 Small Dimensions Test');
        const smallBuffer = await sharp(complexBuffer)
          .resize(1200, 1200, { fit: 'cover' })  // Much smaller
          .ensureAlpha()
          .png({ 
            quality: 60, 
            compressionLevel: 9,
            palette: false
          })
          .toBuffer();
          
        const smallSizeMB = smallBuffer.length / (1024 * 1024);
        console.log(`📐 Small dimensions (1200x1200): ${smallSizeMB.toFixed(2)}MB`);
        console.log(`${smallSizeMB <= 4 ? '✅' : '❌'} Result: ${smallSizeMB <= 4 ? 'SUCCESS' : 'STILL TOO LARGE'}`);
      }
    }
    
    console.log('\n💡 RECOMMENDATION:');
    if (fileSizeMB <= 4) {
      console.log('Current logic should work - the server might not have the latest code');
    } else {
      console.log('Need to implement fallback: skip OpenAI upscaling and upload original image to Printify');
      console.log('Or use a different upscaling service with higher file size limits');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

if (require.main === module) {
  testRealImageCompression();
}

module.exports = { testRealImageCompression };