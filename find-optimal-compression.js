#!/usr/bin/env node
/**
 * Find compression settings that target 1.5-2MB file size
 */

const sharp = require('sharp');
const fs = require('fs');

async function findOptimalCompression() {
  console.log('🎯 Finding compression settings for 1.5-2MB target...\n');
  
  const testImagePath = 'static/images/seasons/season3/episodes/episode7/images/PrepareForBattle-22.webp';
  const originalBuffer = fs.readFileSync(testImagePath);
  
  // Test different approaches to hit the 1.5-2MB sweet spot
  const compressionTests = [
    { quality: 90, compression: 9, colors: 64, desc: 'Q90 with 64 colors' },
    { quality: 85, compression: 9, colors: 96, desc: 'Q85 with 96 colors' },
    { quality: 80, compression: 9, colors: 128, desc: 'Q80 with 128 colors' },
    { quality: 75, compression: 9, colors: 160, desc: 'Q75 with 160 colors' },
    { quality: 85, compression: 9, colors: 80, desc: 'Q85 with 80 colors' },
    { quality: 90, compression: 9, colors: 48, desc: 'Q90 with 48 colors' }
  ];
  
  console.log('Testing compression settings for 1800x1800 PNG:\n');
  
  for (const test of compressionTests) {
    const pngOptions = { 
      quality: test.quality, 
      compressionLevel: test.compression,
      palette: false
    };
    
    if (test.colors) {
      pngOptions.colors = test.colors;
    }
    
    const compressed = await sharp(originalBuffer)
      .resize(1800, 1800, { fit: 'cover' })
      .ensureAlpha()
      .toColorspace('srgb')
      .png(pngOptions)
      .toBuffer();
      
    const sizeMB = compressed.length / (1024 * 1024);
    const inTarget = sizeMB >= 1.5 && sizeMB <= 2.0;
    const status = inTarget ? '🎯' : (sizeMB < 1.5 ? '⬇️' : '⬆️');
    
    console.log(`${status} Quality ${test.quality}, Compression ${test.compression}: ${sizeMB.toFixed(2)}MB (${test.desc})`);
  }
  
  console.log('\n🎯 = Target range (1.5-2MB)');
  console.log('⬇️ = Too small (under-compressed)');
  console.log('⬆️ = Too large (over 4MB limit)');
}

if (require.main === module) {
  findOptimalCompression();
}

module.exports = { findOptimalCompression };