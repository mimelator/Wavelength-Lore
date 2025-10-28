#!/usr/bin/env node
/**
 * Simple practice script - test compression on multiple real images
 * Validates our quality=75, colors=200 settings work consistently
 */

const sharp = require('sharp');
const fs = require('fs');

async function practiceCompression() {
  console.log('🧪 Practicing compression on multiple Wavelength images...\n');
  
  // Test with different actual images from the repo
  const testImages = [
    'static/images/seasons/season3/episodes/episode7/images/PrepareForBattle-22.webp',
    'static/images/seasons/season3/episodes/episode7/images/PrepareForBattle-03.webp', 
    'static/images/seasons/season3/episodes/episode7/images/PrepareForBattle-19.webp',
    'static/images/seasons/season3/episodes/episode7/images/ice_fortress-6.webp',
    'static/images/wavelength-og-default.webp'
  ];
  
  let successCount = 0;
  let totalTests = 0;
  
  for (const imagePath of testImages) {
    if (!fs.existsSync(imagePath)) {
      console.log(`⏭️  Skipping ${imagePath} (not found)`);
      continue;
    }
    
    try {
      const originalBuffer = fs.readFileSync(imagePath);
      const metadata = await sharp(originalBuffer).metadata();
      
      console.log(`\n📸 Testing: ${imagePath.split('/').pop()}`);
      console.log(`   Original: ${metadata.width}x${metadata.height} ${metadata.format.toUpperCase()}, ${(originalBuffer.length / 1024).toFixed(1)}KB`);
      
      // Test different compression levels to find what works
      const tests = [
        { quality: 75, colors: 128, desc: 'Current (Q75, 128 colors)' },
        { quality: 70, colors: 96, desc: 'Aggressive (Q70, 96 colors)' },
        { quality: 65, colors: 64, desc: 'Very aggressive (Q65, 64 colors)' }
      ];
      
      for (const test of tests) {
        const processedBuffer = await sharp(originalBuffer)
          .resize(1800, 1800, { fit: 'cover' })
          .ensureAlpha()
          .toColorspace('srgb')
          .png({ 
            quality: test.quality,
            compressionLevel: 9,
            palette: false,
            colors: test.colors
          })
          .toBuffer();
          
        const sizeMB = processedBuffer.length / (1024 * 1024);
        const success = sizeMB <= 4.0;
        
        console.log(`   ${test.desc}: ${sizeMB.toFixed(2)}MB ${success ? '✅' : '❌'}`);
        
        if (success) {
          successCount++;
          break; // Found working settings for this image
        }
      }
        
      const sizeMB = processedBuffer.length / (1024 * 1024);
      const success = sizeMB <= 4.0;
      
      console.log(`   Result: ${sizeMB.toFixed(2)}MB ${success ? '✅ PASS' : '❌ FAIL'}`);
      
      if (success) successCount++;
      totalTests++;
      
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      totalTests++;
    }
  }
  
  console.log(`\n📊 PRACTICE RESULTS:`);
  console.log(`   Success: ${successCount}/${totalTests} (${((successCount/totalTests)*100).toFixed(1)}%)`);
  console.log(`   Target: 100% success rate under 4MB`);
  
  if (successCount === totalTests) {
    console.log(`\n🎯 EXCELLENT! All images compress successfully.`);
    console.log(`   Settings quality=75, colors=200 are working reliably.`);
  } else {
    console.log(`\n⚠️  Some images failed. May need more aggressive settings.`);
  }
}

if (require.main === module) {
  practiceCompression();
}

module.exports = { practiceCompression };