#!/usr/bin/env node

/**
 * UI Integration Test for Static Overlay System
 * Tests that the merchandise modal is properly configured for static overlays
 */

const path = require('path');
const fs = require('fs').promises;

class UIIntegrationTester {
  constructor() {
    this.testResults = [];
  }

  async runUIIntegrationTests() {
    console.log('🖥️ Starting UI Integration Tests for Static Overlay System...');
    
    try {
      // Test 1: Verify merchandise modal has static overlay effects
      await this.testMerchandiseModalConfiguration();
      
      // Test 2: Verify static overlays exist
      await this.testStaticOverlayFiles();
      
      // Test 3: Verify EffectsProcessor integration
      await this.testEffectsProcessorIntegration();
      
      // Test 4: Test API endpoint
      await this.testAPIEndpoint();
      
      // Generate report
      this.generateTestReport();
      
      console.log('✅ UI Integration tests completed!');
      
    } catch (error) {
      console.error('❌ UI Integration tests failed:', error.message);
      throw error;
    }
  }

  /**
   * Test merchandise modal configuration
   */
  async testMerchandiseModalConfiguration() {
    console.log('📋 Testing merchandise modal configuration...');
    
    const modalPath = path.join(__dirname, '../static/js/components/merchandise-modal-renderer.js');
    const modalContent = await fs.readFile(modalPath, 'utf8');
    
    // Check for static overlay effects
    const staticEffects = [
      'staticLightning',
      'staticFireflies', 
      'staticSparkles',
      'staticSnow',
      'staticVignette'
    ];
    
    let foundEffects = [];
    let missingEffects = [];
    
    staticEffects.forEach(effect => {
      if (modalContent.includes(effect)) {
        foundEffects.push(effect);
      } else {
        missingEffects.push(effect);
      }
    });
    
    console.log(`  ✅ Found ${foundEffects.length}/5 static effects:`);
    foundEffects.forEach(effect => console.log(`    - ${effect}`));
    
    if (missingEffects.length > 0) {
      console.log(`  ⚠️ Missing ${missingEffects.length} effects:`);
      missingEffects.forEach(effect => console.log(`    - ${effect}`));
    }
    
    this.testResults.push({
      test: 'Merchandise Modal Configuration',
      status: missingEffects.length === 0 ? 'PASS' : 'PARTIAL',
      foundEffects: foundEffects.length,
      totalEffects: staticEffects.length,
      details: { foundEffects, missingEffects }
    });
  }

  /**
   * Test static overlay files exist
   */
  async testStaticOverlayFiles() {
    console.log('📁 Testing static overlay files...');
    
    const overlayDir = path.join(__dirname, '../static-overlays');
    const effects = ['lightning', 'fireflies', 'sparkles', 'snow', 'vignette'];
    
    let existingFiles = [];
    let missingFiles = [];
    
    for (const effect of effects) {
      const masterFile = path.join(overlayDir, effect, `${effect}-master.png`);
      try {
        await fs.access(masterFile);
        existingFiles.push(`${effect}-master.png`);
        console.log(`    ✅ ${effect}-master.png exists`);
      } catch (error) {
        missingFiles.push(`${effect}-master.png`);
        console.log(`    ❌ ${effect}-master.png missing`);
      }
    }
    
    this.testResults.push({
      test: 'Static Overlay Files',
      status: missingFiles.length === 0 ? 'PASS' : 'FAIL',
      existingFiles: existingFiles.length,
      totalFiles: effects.length,
      details: { existingFiles, missingFiles }
    });
  }

  /**
   * Test EffectsProcessor integration
   */
  async testEffectsProcessorIntegration() {
    console.log('⚙️ Testing EffectsProcessor integration...');
    
    const processorPath = path.join(__dirname, '../services/EffectsProcessor.js');
    
    try {
      const EffectsProcessor = require(processorPath);
      const processor = new EffectsProcessor();
      
      // Test that processor has static overlay methods
      const hasApplyStaticOverlays = typeof processor.applyStaticOverlays === 'function';
      const hasLoadAndResizeOverlay = typeof processor.loadAndResizeOverlay === 'function';
      
      console.log(`    ✅ applyStaticOverlays method: ${hasApplyStaticOverlays ? 'Found' : 'Missing'}`);
      console.log(`    ✅ loadAndResizeOverlay method: ${hasLoadAndResizeOverlay ? 'Found' : 'Missing'}`);
      
      this.testResults.push({
        test: 'EffectsProcessor Integration',
        status: (hasApplyStaticOverlays && hasLoadAndResizeOverlay) ? 'PASS' : 'FAIL',
        details: { hasApplyStaticOverlays, hasLoadAndResizeOverlay }
      });
      
    } catch (error) {
      console.log(`    ❌ Error loading EffectsProcessor: ${error.message}`);
      this.testResults.push({
        test: 'EffectsProcessor Integration',
        status: 'FAIL',
        error: error.message
      });
    }
  }

  /**
   * Test API endpoint accessibility
   */
  async testAPIEndpoint() {
    console.log('🌐 Testing API endpoint...');
    
    try {
      const response = await fetch('http://localhost:3001/api/merchandise/openai-upscaler/apply-effects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          upscaledImageUrl: 'test',
          effectParams: { staticLightning: true }
        })
      });
      
      console.log(`    📡 API responded with status: ${response.status}`);
      
      // We expect this to fail with a meaningful error, not a 404
      const isAccessible = response.status !== 404;
      
      this.testResults.push({
        test: 'API Endpoint Accessibility',
        status: isAccessible ? 'PASS' : 'FAIL',
        responseStatus: response.status,
        details: { accessible: isAccessible }
      });
      
    } catch (error) {
      console.log(`    ❌ API test failed: ${error.message}`);
      this.testResults.push({
        test: 'API Endpoint Accessibility',
        status: 'FAIL',
        error: error.message
      });
    }
  }

  /**
   * Generate test report
   */
  generateTestReport() {
    console.log('\n📊 UI Integration Test Report');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    let passCount = 0;
    let totalTests = this.testResults.length;
    
    this.testResults.forEach(result => {
      const statusIcon = result.status === 'PASS' ? '✅' : 
                         result.status === 'PARTIAL' ? '⚠️' : '❌';
      console.log(`${statusIcon} ${result.test}: ${result.status}`);
      
      if (result.status === 'PASS') passCount++;
      
      if (result.details) {
        Object.entries(result.details).forEach(([key, value]) => {
          if (Array.isArray(value) && value.length > 0) {
            console.log(`    ${key}: ${value.join(', ')}`);
          }
        });
      }
      
      if (result.error) {
        console.log(`    Error: ${result.error}`);
      }
    });
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📈 Overall: ${passCount}/${totalTests} tests passed`);
    
    if (passCount === totalTests) {
      console.log('🎉 All integration tests passed! Static overlay system is ready for UI testing.');
    } else if (passCount > totalTests / 2) {
      console.log('⚠️ Most tests passed. System is mostly ready but has some issues.');
    } else {
      console.log('❌ Multiple test failures. System needs fixes before UI testing.');
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new UIIntegrationTester();
  
  tester.runUIIntegrationTests()
    .then(() => {
      console.log('\n🔗 Next Steps:');
      console.log('1. Open http://localhost:3001 in your browser');
      console.log('2. Navigate to merchandise section');
      console.log('3. Click "Customize" on any product');
      console.log('4. Test the static overlay effects in the Atmospheric Effects section');
      console.log('5. Verify "Update Preview" applies overlays correctly');
    })
    .catch(error => {
      console.error('💥 UI integration test failed:', error.message);
      process.exit(1);
    });
}

module.exports = UIIntegrationTester;