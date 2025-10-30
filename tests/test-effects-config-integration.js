#!/usr/bin/env node

/**
 * Effects Config Integration Test
 * Tests how the existing effects config system maps to static overlays
 */

const EffectsProcessor = require('../services/EffectsProcessor');
const effectsConfig = require('../config/effectsConfig');
const Sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

class EffectsConfigIntegrationTest {
  constructor() {
    this.outputDir = path.join(__dirname, '../tests/effects-config-integration');
    this.effectsProcessor = new EffectsProcessor();
  }

  async runIntegrationTests() {
    console.log('🔧 Starting Effects Config Integration Tests...');
    
    try {
      // Ensure output directory exists
      await fs.mkdir(this.outputDir, { recursive: true });
      
      // Test how existing effect toggles can map to static overlays
      await this.testEffectToggleMapping();
      
      // Test combined traditional + static effects
      await this.testCombinedEffects();
      
      // Test effects config building with static overlays
      await this.testConfigIntegration();
      
      console.log('✅ Effects config integration tests completed!');
      console.log(`📁 Check results in: ${this.outputDir}`);
      
    } catch (error) {
      console.error('❌ Integration tests failed:', error.message);
      throw error;
    }
  }

  /**
   * Test how existing effect toggles can map to static overlays
   */
  async testEffectToggleMapping() {
    console.log('🎛️ Testing effect toggle mapping...');
    
    // Create test image
    const testImage = await this.createTestImage();
    
    // Example: Lightning effect toggle → static lightning overlay
    const lightningToggle = {
      lightning: true // Traditional toggle
    };
    
    // Map to static overlay parameters
    const staticParams = this.mapTogglesToStaticOverlays(lightningToggle);
    console.log('Static overlay mapping:', staticParams);
    
    // Apply effects
    const processedBuffer = await this.effectsProcessor.processImage(
      testImage, 
      staticParams
    );
    
    const outputPath = path.join(this.outputDir, 'test-toggle-mapping.png');
    await fs.writeFile(outputPath, processedBuffer);
    
    console.log('✓ Effect toggle mapping test completed');
  }

  /**
   * Test combined traditional effects + static overlays
   */
  async testCombinedEffects() {
    console.log('🎨 Testing combined traditional + static effects...');
    
    const testImage = await this.createTestImage();
    
    // Combine traditional color effects with static overlays
    const combinedParams = {
      // Traditional effects
      saturation: 1.3,
      brightness: 1.1,
      vignette: 0.3,
      // Static overlays
      staticLightning: true,
      staticFireflies: true
    };
    
    const processedBuffer = await this.effectsProcessor.processImage(
      testImage, 
      combinedParams
    );
    
    const outputPath = path.join(this.outputDir, 'test-combined-effects.png');
    await fs.writeFile(outputPath, processedBuffer);
    
    console.log('✓ Combined effects test completed');
  }

  /**
   * Test integration with effects config system
   */
  async testConfigIntegration() {
    console.log('⚙️ Testing effects config integration...');
    
    const testImage = await this.createTestImage();
    
    // Use existing effects config system
    const enabledToggles = {
      lightning: true,
      vibrancy: true
    };
    
    // Build effects from config (existing system)
    const configEffects = effectsConfig.buildEffectsFromToggles(enabledToggles);
    
    // Add static overlay mapping
    const enhancedEffects = {
      ...configEffects,
      ...this.mapTogglesToStaticOverlays(enabledToggles)
    };
    
    console.log('Enhanced effects config:', enhancedEffects);
    
    const processedBuffer = await this.effectsProcessor.processImage(
      testImage, 
      enhancedEffects
    );
    
    const outputPath = path.join(this.outputDir, 'test-config-integration.png');
    await fs.writeFile(outputPath, processedBuffer);
    
    console.log('✓ Config integration test completed');
  }

  /**
   * Map traditional effect toggles to static overlay parameters
   * This is the key integration logic
   */
  mapTogglesToStaticOverlays(toggles) {
    const staticParams = {};
    
    // Lightning toggle → static lightning overlay
    if (toggles.lightning) {
      staticParams.staticLightning = true;
    }
    
    // Could add more mappings:
    // if (toggles.winter) staticParams.staticSnow = true;
    // if (toggles.magical) staticParams.staticFireflies = true;
    // if (toggles.sparkle) staticParams.staticSparkles = true;
    
    return staticParams;
  }

  /**
   * Create test image
   */
  async createTestImage() {
    return await Sharp({
      create: {
        width: 800,
        height: 800,
        channels: 3,
        background: { r: 100, g: 150, b: 200 }
      }
    })
    .png()
    .toBuffer();
  }

  /**
   * Demonstrate how to extend effects config for static overlays
   */
  getExtendedEffectsConfig() {
    return {
      ...effectsConfig.effectTypes,
      // New static overlay effects
      staticLightning: {
        name: '⚡ Lightning Overlay',
        description: 'Pre-generated jagged lightning effects',
        type: 'toggle',
        enabled: false,
        staticOverlay: 'lightning'
      },
      staticSnow: {
        name: '❄️ Snow Overlay',
        description: 'Beautiful snow particle effects',
        type: 'toggle',
        enabled: false,
        staticOverlay: 'snow'
      },
      staticFireflies: {
        name: '🐛 Fireflies Overlay',
        description: 'Magical glowing firefly effects',
        type: 'toggle',
        enabled: false,
        staticOverlay: 'fireflies'
      }
    };
  }
}

// Run integration tests if called directly
if (require.main === module) {
  const tester = new EffectsConfigIntegrationTest();
  
  tester.runIntegrationTests()
    .then(() => {
      console.log('🎉 Effects config integration testing complete!');
    })
    .catch(error => {
      console.error('💥 Integration testing failed:', error.message);
      process.exit(1);
    });
}

module.exports = EffectsConfigIntegrationTest;