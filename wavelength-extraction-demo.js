#!/usr/bin/env node

/**
 * 🎭 Wavelength Extraction Demo Script
 * 
 * Creates a visual demonstration of successful character extraction
 * Shows before/after comparison with the best extraction method
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const WavelengthIconExtractor = require('./wavelength-tools/research/wavelength-npc-icon-extractor.js');

async function runExtractionDemo() {
  console.log('🎭 WAVELENGTH EXTRACTION DEMO');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const extractor = new WavelengthIconExtractor();
  
  // Check available source images
  const sourceDir = path.join(__dirname, 'assets/source-images');
  const extractedDir = path.join(__dirname, 'assets/extracted-icons');
  const maskDir = path.join(__dirname, 'assets/segmentation-masks');

  if (!fs.existsSync(sourceDir)) {
    console.error('❌ Source images directory not found:', sourceDir);
    return;
  }

  const sourceFiles = fs.readdirSync(sourceDir).filter(f => f.match(/\.(png|jpg|jpeg)$/i));
  
  if (sourceFiles.length === 0) {
    console.error('❌ No source images found in:', sourceDir);
    console.log('💡 Add some character images to assets/source-images/ to test extraction');
    return;
  }

  console.log('📸 Available source images:', sourceFiles);

  // Use the first available image
  const sourceImage = sourceFiles[0];
  const imagePath = path.join(sourceDir, sourceImage);
  const stats = fs.statSync(imagePath);

  console.log('\n🎯 SELECTED IMAGE FOR DEMO:');
  console.log(`   File: ${sourceImage}`);
  console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Path: ${imagePath}`);

  // Run extraction with optimized settings
  const extractionConfig = {
    sourceImage: sourceImage,
    characterId: 'demo-character',
    assetPrompt: 'main character or subject in the image, tight boundaries around the figure',
    outputName: 'demo_extraction_result.png'
  };

  console.log('\n🚀 RUNNING EXTRACTION DEMO...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const success = await extractor.extractAsset(extractionConfig);
    
    if (success) {
      console.log('\n🎉 EXTRACTION SUCCESSFUL!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // Show results
      const outputPath = path.join(extractedDir, 'demo_extraction_result.png');
      const maskPath = path.join(maskDir, 'demo-character_openai_mask.png');

      if (fs.existsSync(outputPath)) {
        const outputStats = fs.statSync(outputPath);
        console.log('✅ Transparent PNG created:');
        console.log(`   File: ${outputPath}`);
        console.log(`   Size: ${(outputStats.size / 1024).toFixed(2)} KB`);
      }

      if (fs.existsSync(maskPath)) {
        console.log('✅ AI-generated mask saved:');
        console.log(`   File: ${maskPath}`);
      }

      console.log('\n📊 EXTRACTION SUMMARY:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('1. 🤖 OpenAI Vision analyzed the image');
      console.log('2. 📐 AI detected character boundaries');  
      console.log('3. 🎨 Smart mask created with edge detection');
      console.log('4. ✨ Transparent PNG generated');
      console.log('5. 🗂️  Files saved to assets/extracted-icons/');

      console.log('\n🔍 VISUAL INSPECTION:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Open these files to see the results:');
      console.log(`📂 Original: ${imagePath}`);
      console.log(`🎭 Extracted: ${outputPath}`);
      console.log(`🎨 Mask: ${maskPath}`);

      // Show all available extractions for comparison
      console.log('\n📚 ALL AVAILABLE EXTRACTIONS:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      if (fs.existsSync(extractedDir)) {
        const allExtractions = fs.readdirSync(extractedDir).filter(f => f.endsWith('.png'));
        allExtractions.forEach((file, index) => {
          const filePath = path.join(extractedDir, file);
          const fileStats = fs.statSync(filePath);
          console.log(`${index + 1}. ${file} (${(fileStats.size / 1024).toFixed(2)} KB)`);
        });
      }

      console.log('\n🎉 DEMO COMPLETE! Check the files above to see your extracted character assets.');

    } else {
      console.error('❌ EXTRACTION FAILED');
      console.log('This could be due to:');
      console.log('- OpenAI API key not configured');
      console.log('- Image format not supported');
      console.log('- Character not clearly detectable in image');
    }

  } catch (error) {
    console.error('❌ Demo failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the demo
if (require.main === module) {
  runExtractionDemo().catch(console.error);
}

module.exports = { runExtractionDemo };