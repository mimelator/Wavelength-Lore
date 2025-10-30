/**
 * Printify Pipeline Test
 * Follows the exact same code path as merchandise creation to identify where borders are lost
 * 
 * Pipeline Steps:
 * 1) Original Image
 * 2) Upscaled Image  
 * 3) Upscaled Image with FX (including borders)
 * 4) Rescaled for Printify
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function testPrintifyPipeline() {
  console.log('🧪 Testing Printify Pipeline - Border Tracking\n');
  
  // Create output directory
  const outputDir = 'tests/fx-validation/output/pipeline-test';
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  
  try {
    // ========================================
    // STEP 1: Original Image
    // ========================================
    console.log('📸 STEP 1: Loading Original Image...');
    
    // Use an actual gallery image
    let originalBuffer;
    const galleryImagePath = 'static/images/characters/wavelength/alexandria-5.webp';
    
    if (fs.existsSync(galleryImagePath)) {
      originalBuffer = fs.readFileSync(galleryImagePath);
      console.log('✅ Loaded gallery image:', galleryImagePath);
    } else {
      // Fallback to another image if first choice doesn't exist
      const fallbackPath = 'static/images/characters/wavelength/lucky-1.webp';
      if (fs.existsSync(fallbackPath)) {
        originalBuffer = fs.readFileSync(fallbackPath);
        console.log('✅ Loaded fallback gallery image:', fallbackPath);
      } else {
        throw new Error('No gallery images found! Please check the image paths.');
      }
    }
    
    const originalInfo = await sharp(originalBuffer).metadata();
    console.log(`   Original dimensions: ${originalInfo.width}x${originalInfo.height}`);
    
    // Save Step 1
    await sharp(originalBuffer).toFile(path.join(outputDir, '1-original.png'));
    
    // ========================================
    // STEP 2: Upscaled Image
    // ========================================
    console.log('\n🔍 STEP 2: Upscaling Image...');
    
    // Follow the actual upscaling logic from the codebase
    const targetUpscaleSize = 2048; // Common upscale target
    const maxDimension = Math.max(originalInfo.width, originalInfo.height);
    let upscaledBuffer = originalBuffer;
    
    if (maxDimension < targetUpscaleSize) {
      const scaleFactor = targetUpscaleSize / maxDimension;
      const newWidth = Math.round(originalInfo.width * scaleFactor);
      const newHeight = Math.round(originalInfo.height * scaleFactor);
      
      upscaledBuffer = await sharp(originalBuffer)
        .resize(newWidth, newHeight, {
          kernel: sharp.kernel.lanczos3,
          withoutEnlargement: false
        })
        .png()
        .toBuffer();
      
      const upscaledInfo = await sharp(upscaledBuffer).metadata();
      console.log(`✅ Upscaled: ${originalInfo.width}x${originalInfo.height} → ${upscaledInfo.width}x${upscaledInfo.height}`);
      console.log(`   Scale factor: ${scaleFactor.toFixed(2)}x`);
    } else {
      console.log('✅ No upscaling needed - image already large enough');
    }
    
    // Save Step 2
    await sharp(upscaledBuffer).toFile(path.join(outputDir, '2-upscaled.png'));
    
    // ========================================
    // STEP 3: Apply Effects (Including Borders)
    // ========================================
    console.log('\n🎨 STEP 3: Applying Effects (with borders)...');
    
    // Load the actual EffectsProcessor
    const EffectsProcessor = require('../../services/EffectsProcessor');
    const effectsProcessor = new EffectsProcessor();
    
    // Create comprehensive effect parameters with borders enabled
    const effectParams = {
      // Border settings
      borderEnabled: true,
      borderWidth: 4,           // UI setting (1-4)
      borderWidthPixels: 30,    // Thicker for better visibility
      borderColor: '#00FF00',   // Bright green - highly visible on any image
      
      // Other effects (optional - can enable for full test)
      enabled: true,
      // Add other effects here if needed for comprehensive testing
    };
    
    console.log('🖼️ Effect Parameters:');
    console.log('   borderEnabled:', effectParams.borderEnabled);
    console.log('   borderWidth:', effectParams.borderWidth);
    console.log('   borderWidthPixels:', effectParams.borderWidthPixels);
    console.log('   borderColor:', effectParams.borderColor);
    
    // Apply effects using the actual EffectsProcessor
    const effectsBuffer = await effectsProcessor.processImage(upscaledBuffer, effectParams);
    
    const effectsInfo = await sharp(effectsBuffer).metadata();
    console.log(`✅ Effects applied: ${effectsInfo.width}x${effectsInfo.height}`);
    
    // Save Step 3
    await sharp(effectsBuffer).toFile(path.join(outputDir, '3-with-effects.png'));
    
    // ========================================
    // STEP 4: Rescale for Printify
    // ========================================
    console.log('\n📏 STEP 4: Rescaling for Printify...');
    
    // Common Printify target sizes
    const printifyTargets = [
      { name: 'small', width: 400, height: 300 },
      { name: 'medium', width: 800, height: 600 },
      { name: 'large', width: 1200, height: 900 }
    ];
    
    for (const target of printifyTargets) {
      console.log(`   Rescaling for ${target.name}: ${target.width}x${target.height}`);
      
      const rescaledBuffer = await sharp(effectsBuffer)
        .resize(target.width, target.height, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toBuffer();
      
      const rescaledInfo = await sharp(rescaledBuffer).metadata();
      console.log(`   ✅ ${target.name}: ${rescaledInfo.width}x${rescaledInfo.height}`);
      
      // Save Step 4 variants
      await sharp(rescaledBuffer).toFile(path.join(outputDir, `4-printify-${target.name}.png`));
    }
    
    // ========================================
    // ANALYSIS
    // ========================================
    console.log('\n🔬 ANALYSIS COMPLETE');
    console.log(`📁 Check ${outputDir}/ for step-by-step images:`);
    console.log('   1-original.png       - Original image');
    console.log('   2-upscaled.png       - After upscaling');
    console.log('   3-with-effects.png   - After effects (should have GREEN border)');
    console.log('   4-printify-*.png     - Final Printify sizes');
    console.log('\n🎯 Look for:');
    console.log('   - Is the GREEN border visible in step 3?');
    console.log('   - Does the border survive rescaling in step 4?');
    console.log('   - Are dimensions preserved correctly?');
    
  } catch (error) {
    console.error('❌ Pipeline test failed:', error);
    console.error('Stack:', error.stack);
  }
}

// Run the test
if (require.main === module) {
  testPrintifyPipeline();
}

module.exports = { testPrintifyPipeline };