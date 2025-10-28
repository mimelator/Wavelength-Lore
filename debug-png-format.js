const sharp = require('sharp');
const fs = require('fs');

async function debugPngFormat() {
  const testImagePath = 'static/images/seasons/season3/episodes/episode7/images/PrepareForBattle-22.webp';
  
  try {
    const originalBuffer = fs.readFileSync(testImagePath);
    
    // Test our compression settings
    const processedBuffer = await sharp(originalBuffer)
      .resize(1800, 1800, { fit: 'cover' })
      .ensureAlpha() // CRITICAL: Ensure image has alpha channel (RGBA) for OpenAI
      .toColorspace('srgb') // Ensure correct colorspace
      .png({ 
        quality: 75,  // Good quality
        compressionLevel: 9, // Maximum compression
        palette: false, // Force RGBA instead of palette-based PNG
        colors: 128   // TESTED: produces ~0.6MB files consistently
      })
      .toBuffer();
    
    // Check the metadata of our processed image
    const processedMetadata = await sharp(processedBuffer).metadata();
    console.log('🔍 Processed Image Metadata:');
    console.log('- Format:', processedMetadata.format);
    console.log('- Width x Height:', processedMetadata.width, 'x', processedMetadata.height);
    console.log('- Channels:', processedMetadata.channels);
    console.log('- Has Alpha:', processedMetadata.hasAlpha);
    console.log('- Space:', processedMetadata.space);
    console.log('- Density:', processedMetadata.density);
    
    // Save to file for manual inspection
    fs.writeFileSync('debug-output.png', processedBuffer);
    console.log('\n💾 Saved processed image as debug-output.png');
    
    // Let's also try a different approach - force RGBA explicitly
    console.log('\n🧪 Testing alternative RGBA approach...');
    const altBuffer = await sharp(originalBuffer)
      .resize(1800, 1800, { fit: 'cover' })
      .toColorspace('srgb')
      .toFormat('png', { 
        quality: 75,
        compressionLevel: 9,
        force: true
      })
      .raw() // Get raw pixel data
      .toBuffer({ resolveWithObject: true });
      
    console.log('Alternative buffer info:', altBuffer.info);
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugPngFormat();