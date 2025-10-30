/**
 * FX Processing Deep Dive Validation Suite
 * 
 * Comprehensive testing framework for validating all aspects of image effects processing
 * including borders, filters, upscaling, and compatibility testing
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

class FXValidationSuite {
  constructor() {
    this.outputDir = 'tests/fx-validation/output/validation-suite';
    this.testResults = [];
    
    // Create output directory
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Run complete FX validation pipeline
   */
  async runCompleteValidation() {
    console.log('🧪 FX PROCESSING DEEP DIVE VALIDATION SUITE\n');
    console.log('============================================\n');

    try {
      // Test 1: Border Processing Validation
      await this.validateBorderProcessing();
      
      // Test 2: Effects Chain Validation
      await this.validateEffectsChain();
      
      // Test 3: Dimension Preservation
      await this.validateDimensionPreservation();
      
      // Test 4: Image Quality Assessment
      await this.validateImageQuality();
      
      // Test 5: Pipeline Compatibility
      await this.validatePipelineCompatibility();
      
      // Generate comprehensive report
      this.generateValidationReport();
      
    } catch (error) {
      console.error('❌ Validation suite failed:', error);
    }
  }

  /**
   * Test 1: Border Processing Deep Dive
   */
  async validateBorderProcessing() {
    console.log('🎨 TEST 1: Border Processing Deep Dive');
    console.log('=====================================\n');

    const BorderProcessor = require('../../services/BorderProcessor');
    const borderProcessor = new BorderProcessor();

    // Test with multiple gallery images
    const testImages = [
      'static/images/characters/wavelength/alexandria-5.webp',
      'static/images/characters/wavelength/lucky-1.webp',
      'static/images/characters/wavelength/eloquence-2.webp'
    ];

    const borderConfigs = [
      { name: 'thin-red', enabled: true, width: 1, widthPixels: 10, colorHex: '#FF0000' },
      { name: 'medium-green', enabled: true, width: 2, widthPixels: 20, colorHex: '#00FF00' },
      { name: 'thick-blue', enabled: true, width: 3, widthPixels: 30, colorHex: '#0000FF' },
      { name: 'max-yellow', enabled: true, width: 4, widthPixels: 40, colorHex: '#FFFF00' }
    ];

    for (let imgIndex = 0; imgIndex < testImages.length; imgIndex++) {
      const imagePath = testImages[imgIndex];
      const imageName = path.basename(imagePath, path.extname(imagePath));
      
      console.log(`   Testing image ${imgIndex + 1}/3: ${imageName}`);
      
      if (!fs.existsSync(imagePath)) {
        console.log(`   ⚠️  Skipping ${imageName} - file not found`);
        continue;
      }

      const originalBuffer = fs.readFileSync(imagePath);
      const originalInfo = await sharp(originalBuffer).metadata();
      
      // Save original
      await sharp(originalBuffer).toFile(
        path.join(this.outputDir, `${imageName}-original.png`)
      );

      for (const borderConfig of borderConfigs) {
        console.log(`      Applying ${borderConfig.name} border...`);
        
        try {
          const borderedBuffer = await borderProcessor.applyBorder(originalBuffer, borderConfig);
          const borderedInfo = await sharp(borderedBuffer).metadata();
          
          // Save bordered version
          await sharp(borderedBuffer).toFile(
            path.join(this.outputDir, `${imageName}-${borderConfig.name}.png`)
          );
          
          // Validate dimensions preserved
          const dimensionsPreserved = 
            originalInfo.width === borderedInfo.width && 
            originalInfo.height === borderedInfo.height;
          
          this.testResults.push({
            test: 'border_processing',
            image: imageName,
            border: borderConfig.name,
            dimensionsPreserved,
            originalSize: `${originalInfo.width}x${originalInfo.height}`,
            finalSize: `${borderedInfo.width}x${borderedInfo.height}`,
            status: dimensionsPreserved ? 'PASS' : 'FAIL'
          });
          
          console.log(`      ✅ ${borderConfig.name}: ${borderedInfo.width}x${borderedInfo.height}`);
          
        } catch (error) {
          console.log(`      ❌ ${borderConfig.name}: ${error.message}`);
          this.testResults.push({
            test: 'border_processing',
            image: imageName,
            border: borderConfig.name,
            status: 'ERROR',
            error: error.message
          });
        }
      }
      console.log('');
    }
  }

  /**
   * Test 2: Complete Effects Chain Validation
   */
  async validateEffectsChain() {
    console.log('⚡ TEST 2: Complete Effects Chain Validation');
    console.log('==========================================\n');

    const EffectsProcessor = require('../../services/EffectsProcessor');
    const effectsProcessor = new EffectsProcessor();

    // Test comprehensive effects combinations
    const effectsConfigs = [
      {
        name: 'borders-only',
        borderEnabled: true,
        borderWidth: 3,
        borderWidthPixels: 25,
        borderColor: '#FF00FF'
      },
      {
        name: 'saturation-borders',
        saturation: 1.5,
        borderEnabled: true,
        borderWidth: 2,
        borderWidthPixels: 20,
        borderColor: '#00FFFF',
        enabled: true
      },
      {
        name: 'full-effects',
        saturation: 1.3,
        brightness: 1.1,
        contrast: 1.2,
        borderEnabled: true,
        borderWidth: 3,
        borderWidthPixels: 30,
        borderColor: '#FF8000',
        enabled: true
      }
    ];

    const testImage = 'static/images/characters/wavelength/alexandria-5.webp';
    
    if (fs.existsSync(testImage)) {
      const originalBuffer = fs.readFileSync(testImage);
      
      for (const config of effectsConfigs) {
        console.log(`   Testing effects: ${config.name}`);
        
        try {
          const processedBuffer = await effectsProcessor.processImage(originalBuffer, config);
          const processedInfo = await sharp(processedBuffer).metadata();
          
          // Save processed version
          await sharp(processedBuffer).toFile(
            path.join(this.outputDir, `effects-${config.name}.png`)
          );
          
          console.log(`   ✅ ${config.name}: ${processedInfo.width}x${processedInfo.height}`);
          
          this.testResults.push({
            test: 'effects_chain',
            config: config.name,
            status: 'PASS',
            size: `${processedInfo.width}x${processedInfo.height}`
          });
          
        } catch (error) {
          console.log(`   ❌ ${config.name}: ${error.message}`);
          this.testResults.push({
            test: 'effects_chain',
            config: config.name,
            status: 'ERROR',
            error: error.message
          });
        }
      }
    } else {
      console.log('   ⚠️  Test image not found - skipping effects chain test');
    }
    console.log('');
  }

  /**
   * Test 3: Dimension Preservation Under All Conditions
   */
  async validateDimensionPreservation() {
    console.log('📐 TEST 3: Dimension Preservation Validation');
    console.log('==========================================\n');

    // Test with various image sizes
    const testSizes = [
      { width: 400, height: 300, name: 'small' },
      { width: 800, height: 600, name: 'medium' },
      { width: 1200, height: 900, name: 'large' },
      { width: 2048, height: 1536, name: 'xlarge' }
    ];

    const BorderProcessor = require('../../services/BorderProcessor');
    const borderProcessor = new BorderProcessor();

    for (const size of testSizes) {
      console.log(`   Testing ${size.name} size: ${size.width}x${size.height}`);
      
      // Create test image
      const testBuffer = await sharp({
        create: {
          width: size.width,
          height: size.height,
          channels: 3,
          background: { r: 128, g: 128, b: 128 }
        }
      }).png().toBuffer();

      // Apply border
      const borderConfig = {
        enabled: true,
        width: 3,
        widthPixels: Math.min(25, Math.min(size.width, size.height) / 10), // Adaptive border
        colorHex: '#FF0000'
      };

      try {
        const borderedBuffer = await borderProcessor.applyBorder(testBuffer, borderConfig);
        const borderedInfo = await sharp(borderedBuffer).metadata();
        
        const dimensionsPreserved = 
          size.width === borderedInfo.width && 
          size.height === borderedInfo.height;
        
        console.log(`   ${dimensionsPreserved ? '✅' : '❌'} ${size.name}: ${borderedInfo.width}x${borderedInfo.height}`);
        
        // Save for visual inspection
        await sharp(borderedBuffer).toFile(
          path.join(this.outputDir, `dimension-test-${size.name}.png`)
        );
        
        this.testResults.push({
          test: 'dimension_preservation',
          size: size.name,
          expected: `${size.width}x${size.height}`,
          actual: `${borderedInfo.width}x${borderedInfo.height}`,
          status: dimensionsPreserved ? 'PASS' : 'FAIL'
        });
        
      } catch (error) {
        console.log(`   ❌ ${size.name}: ${error.message}`);
      }
    }
    console.log('');
  }

  /**
   * Test 4: Image Quality Assessment
   */
  async validateImageQuality() {
    console.log('🔍 TEST 4: Image Quality Assessment');
    console.log('=================================\n');

    // Test image quality preservation through the pipeline
    const testImage = 'static/images/characters/wavelength/alexandria-5.webp';
    
    if (!fs.existsSync(testImage)) {
      console.log('   ⚠️  Test image not found - skipping quality assessment');
      return;
    }

    const originalBuffer = fs.readFileSync(testImage);
    const originalStats = await this.getImageStats(originalBuffer);
    
    console.log('   Original image stats:');
    console.log(`   - Size: ${(originalStats.size / 1024).toFixed(2)} KB`);
    console.log(`   - Dimensions: ${originalStats.width}x${originalStats.height}`);
    console.log(`   - Channels: ${originalStats.channels}`);

    // Process through complete pipeline
    const EffectsProcessor = require('../../services/EffectsProcessor');
    const effectsProcessor = new EffectsProcessor();
    
    const processedBuffer = await effectsProcessor.processImage(originalBuffer, {
      borderEnabled: true,
      borderWidth: 3,
      borderWidthPixels: 25,
      borderColor: '#00FF00',
      saturation: 1.2,
      brightness: 1.1,
      enabled: true
    });
    
    const processedStats = await this.getImageStats(processedBuffer);
    
    console.log('\n   Processed image stats:');
    console.log(`   - Size: ${(processedStats.size / 1024).toFixed(2)} KB`);
    console.log(`   - Dimensions: ${processedStats.width}x${processedStats.height}`);
    console.log(`   - Channels: ${processedStats.channels}`);
    
    const sizeIncrease = ((processedStats.size - originalStats.size) / originalStats.size * 100).toFixed(1);
    console.log(`   - Size change: +${sizeIncrease}%`);
    
    // Save for comparison
    await sharp(processedBuffer).toFile(
      path.join(this.outputDir, 'quality-test-processed.png')
    );
    
    this.testResults.push({
      test: 'image_quality',
      originalSize: originalStats.size,
      processedSize: processedStats.size,
      sizeIncrease: `+${sizeIncrease}%`,
      dimensionsPreserved: originalStats.width === processedStats.width && originalStats.height === processedStats.height,
      status: 'PASS'
    });
    
    console.log('');
  }

  /**
   * Test 5: Pipeline Compatibility
   */
  async validatePipelineCompatibility() {
    console.log('🔧 TEST 5: Pipeline Compatibility');
    console.log('================================\n');

    // Test the complete processing pipeline
    const testImage = 'static/images/characters/wavelength/alexandria-5.webp';
    
    if (!fs.existsSync(testImage)) {
      console.log('   ⚠️  Test image not found - skipping pipeline compatibility test');
      return;
    }

    console.log('   Running complete processing pipeline...');
    
    // Step 1: Load original
    const originalBuffer = fs.readFileSync(testImage);
    const originalInfo = await sharp(originalBuffer).metadata();
    console.log(`   1. Original: ${originalInfo.width}x${originalInfo.height}`);

    // Step 2: Upscale if needed
    const targetSize = 2048;
    const maxDimension = Math.max(originalInfo.width, originalInfo.height);
    let upscaledBuffer = originalBuffer;
    
    if (maxDimension < targetSize) {
      const scaleFactor = targetSize / maxDimension;
      const newWidth = Math.round(originalInfo.width * scaleFactor);
      const newHeight = Math.round(originalInfo.height * scaleFactor);
      
      upscaledBuffer = await sharp(originalBuffer)
        .resize(newWidth, newHeight, { kernel: sharp.kernel.lanczos3 })
        .png()
        .toBuffer();
      
      const upscaledInfo = await sharp(upscaledBuffer).metadata();
      console.log(`   2. Upscaled: ${upscaledInfo.width}x${upscaledInfo.height} (${scaleFactor.toFixed(2)}x)`);
    } else {
      console.log('   2. No upscaling needed');
    }

    // Step 3: Apply effects with borders
    const EffectsProcessor = require('../../services/EffectsProcessor');
    const effectsProcessor = new EffectsProcessor();
    
    const effectsBuffer = await effectsProcessor.processImage(upscaledBuffer, {
      borderEnabled: true,
      borderWidth: 4,
      borderWidthPixels: 30,
      borderColor: '#00FF00',
      enabled: true
    });
    
    const effectsInfo = await sharp(effectsBuffer).metadata();
    console.log(`   3. With Effects: ${effectsInfo.width}x${effectsInfo.height}`);

    // Step 4: Create output variants
    const outputTargets = [
      { name: 'small', width: 400, height: 300 },
      { name: 'medium', width: 800, height: 600 },
      { name: 'large', width: 1200, height: 900 }
    ];

    console.log('   4. Output variants:');
    for (const target of outputTargets) {
      const rescaledBuffer = await sharp(effectsBuffer)
        .resize(target.width, target.height, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toBuffer();
      
      const rescaledInfo = await sharp(rescaledBuffer).metadata();
      console.log(`      ${target.name}: ${rescaledInfo.width}x${rescaledInfo.height}`);
      
      // Save variant
      await sharp(rescaledBuffer).toFile(
        path.join(this.outputDir, `pipeline-${target.name}.png`)
      );
    }
    
    this.testResults.push({
      test: 'pipeline_compatibility',
      upscalingRequired: maxDimension < targetSize,
      variantsGenerated: outputTargets.length,
      status: 'PASS'
    });
    
    console.log('');
  }

  /**
   * Helper method to get image statistics
   */
  async getImageStats(buffer) {
    const metadata = await sharp(buffer).metadata();
    return {
      size: buffer.length,
      width: metadata.width,
      height: metadata.height,
      channels: metadata.channels,
      format: metadata.format
    };
  }

  /**
   * Generate comprehensive validation report
   */
  generateValidationReport() {
    console.log('📊 VALIDATION REPORT');
    console.log('===================\n');

    // Count test results by status
    const statusCounts = this.testResults.reduce((acc, result) => {
      acc[result.status] = (acc[result.status] || 0) + 1;
      return acc;
    }, {});

    console.log('Overall Results:');
    console.log(`✅ PASS: ${statusCounts.PASS || 0}`);
    console.log(`❌ FAIL: ${statusCounts.FAIL || 0}`);
    console.log(`⚠️  ERROR: ${statusCounts.ERROR || 0}`);
    console.log(`📊 TOTAL: ${this.testResults.length}\n`);

    // Group by test type
    const testGroups = this.testResults.reduce((acc, result) => {
      if (!acc[result.test]) acc[result.test] = [];
      acc[result.test].push(result);
      return acc;
    }, {});

    for (const [testName, results] of Object.entries(testGroups)) {
      console.log(`${testName.toUpperCase().replace('_', ' ')}:`);
      results.forEach(result => {
        const status = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
        console.log(`  ${status} ${result.image || result.config || result.size || 'test'}`);
      });
      console.log('');
    }

    // Save detailed report
    const reportPath = path.join(this.outputDir, 'validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: statusCounts,
      results: this.testResults
    }, null, 2));

    console.log(`📁 Detailed results saved to: ${this.outputDir}/`);
    console.log(`📄 JSON report: ${reportPath}`);
    console.log('\n🎯 Use these results to validate FX processing quality and consistency');
  }
}

// Run validation suite if called directly
if (require.main === module) {
  const suite = new FXValidationSuite();
  suite.runCompleteValidation();
}

module.exports = FXValidationSuite;