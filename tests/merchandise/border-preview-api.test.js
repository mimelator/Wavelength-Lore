/**
 * Border Preview API Integration Test
 * 
 * Tests the /api/border-preview/generate endpoint which is used by the
 * product customization modal to show real-time border previews.
 * 
 * Tests:
 * 1. Generate border preview with solid border
 * 2. Generate border preview with gradient
 * 3. Generate border preview with wavelength theme
 * 4. Handle invalid border configurations
 * 5. Handle missing image URLs
 * 6. Verify response format and image quality
 * 7. Test debouncing/caching behavior
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const API_ENDPOINT = '/api/merchandise/border-preview';
const TEST_TIMEOUT = 30000;

class BorderPreviewAPITester {
  constructor() {
    this.results = {
      passed: [],
      failed: [],
      warnings: []
    };
    
    // Sample test image URL (will need to be from actual gallery)
    this.testImageUrl = null;
  }

  async setup() {
    console.log('🔧 Setting up Border Preview API tests...');
    
    // First, we need to get a valid image URL from the merchandise gallery
    try {
      const response = await axios.get(`${BASE_URL}/api/merchandise/gallery-images`, {
        headers: {
          'Authorization': 'Bearer test-token' // Will need actual auth
        },
        timeout: 10000
      });
      
      if (response.data.success && response.data.images && response.data.images.length > 0) {
        this.testImageUrl = response.data.images[0].url;
        console.log(`✅ Got test image URL: ${this.testImageUrl.substring(0, 50)}...`);
        return true;
      } else {
        console.log('⚠️  No gallery images available, will use mock URL');
        this.testImageUrl = 'https://example.com/test-image.jpg';
        return true;
      }
    } catch (error) {
      console.log('⚠️  Could not fetch gallery images:', error.message);
      console.log('   Using mock URL for testing');
      this.testImageUrl = 'https://example.com/test-image.jpg';
      return true;
    }
  }

  async testSolidBorderPreview() {
    console.log('\n🎨 TEST: Generate solid border preview');
    
    try {
      const borderConfig = {
        type: 'solid',
        color: '#000000',
        width: 15,
        opacity: 1
      };
      
      const response = await axios.post(
        `${BASE_URL}${API_ENDPOINT}`,
        {
          sourceImageUrl: this.testImageUrl,
          borderConfig: borderConfig,
          options: {
            format: 'webp',
            quality: 85
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          },
          timeout: TEST_TIMEOUT
        }
      );
      
      if (response.status !== 200) {
        throw new Error(`Unexpected status: ${response.status}`);
      }
      
      // Verify response structure
      if (!response.data || !response.data.success) {
        throw new Error('API returned unsuccessful response');
      }
      
      if (!response.data.borderedImageUrl) {
        throw new Error('No borderedImageUrl in response');
      }
      
      console.log(`   → Got bordered image URL`);
      console.log(`   → Cached: ${response.data.cached}`);
      
      // Fetch the actual image to verify it's valid
      const imageResponse = await axios.get(response.data.borderedImageUrl, {
        responseType: 'arraybuffer',
        timeout: TEST_TIMEOUT
      });
      
      const imageBuffer = Buffer.from(imageResponse.data);
      const metadata = await sharp(imageBuffer).metadata();
      console.log(`   → Image dimensions: ${metadata.width}x${metadata.height}`);
      console.log(`   → Format: ${metadata.format}`);
      
      console.log(`✅ Solid border preview generated successfully`);
      this.results.passed.push('Generate solid border preview');
      return true;
    } catch (error) {
      console.error(`❌ Solid border test failed: ${error.message}`);
      this.results.failed.push({
        test: 'Generate solid border preview',
        error: error.message
      });
      return false;
    }
  }

  async testGradientBorderPreview() {
    console.log('\n🌈 TEST: Generate gradient border preview');
    
    try {
      const borderConfig = {
        type: 'gradient',
        gradientType: 'linear',
        colors: ['#000000', '#ffffff'],
        direction: '45deg',
        width: 15
      };
      
      const response = await axios.post(
        `${BASE_URL}${API_ENDPOINT}`,
        {
          sourceImageUrl: this.testImageUrl,
          borderConfig: borderConfig,
          options: {
            format: 'webp',
            quality: 85
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          },
          timeout: TEST_TIMEOUT
        }
      );
      
      if (!response.data || !response.data.success || !response.data.borderedImageUrl) {
        throw new Error('Invalid response structure');
      }
      
      // Fetch and validate the image
      const imageResponse = await axios.get(response.data.borderedImageUrl, {
        responseType: 'arraybuffer',
        timeout: TEST_TIMEOUT
      });
      
      const imageBuffer = Buffer.from(imageResponse.data);
      const metadata = await sharp(imageBuffer).metadata();
      
      console.log(`   → Image: ${metadata.width}x${metadata.height}, ${imageBuffer.length} bytes`);
      console.log(`✅ Gradient border preview generated successfully`);
      this.results.passed.push('Generate gradient border preview');
      return true;
    } catch (error) {
      console.error(`❌ Gradient border test failed: ${error.message}`);
      this.results.failed.push({
        test: 'Generate gradient border preview',
        error: error.message
      });
      return false;
    }
  }

  async testWavelengthThemeBorder() {
    console.log('\n✨ TEST: Generate wavelength-theme border preview');
    
    try {
      const borderConfig = {
        type: 'wavelength-theme',
        theme: 'goblin-king',
        elements: ['crowns', 'gems'],
        density: 'medium',
        colorScheme: 'dark',
        width: 20
      };
      
      const response = await axios.post(
        `${BASE_URL}${API_ENDPOINT}`,
        {
          sourceImageUrl: this.testImageUrl,
          borderConfig: borderConfig,
          options: {
            format: 'webp',
            quality: 85
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          },
          timeout: TEST_TIMEOUT
        }
      );
      
      if (!response.data || !response.data.success || !response.data.borderedImageUrl) {
        throw new Error('Invalid response structure');
      }
      
      // Fetch and validate the image
      const imageResponse = await axios.get(response.data.borderedImageUrl, {
        responseType: 'arraybuffer',
        timeout: TEST_TIMEOUT
      });
      
      const imageBuffer = Buffer.from(imageResponse.data);
      const metadata = await sharp(imageBuffer).metadata();
      
      console.log(`   → Image: ${metadata.width}x${metadata.height}, ${imageBuffer.length} bytes`);
      console.log(`✅ Wavelength-theme border preview generated successfully`);
      this.results.passed.push('Generate wavelength-theme border preview');
      return true;
    } catch (error) {
      console.error(`❌ Wavelength-theme border test failed: ${error.message}`);
      this.results.failed.push({
        test: 'Generate wavelength-theme border preview',
        error: error.message
      });
      return false;
    }
  }

  async testInvalidBorderConfig() {
    console.log('\n❌ TEST: Handle invalid border configuration');
    
    try {
      const invalidConfig = {
        type: 'invalid-type',
        width: -10 // Invalid width
      };
      
      try {
        await axios.post(
          `${BASE_URL}${API_ENDPOINT}`,
          {
            sourceImageUrl: this.testImageUrl,
            borderConfig: invalidConfig
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer test-token'
            },
            timeout: 10000
          }
        );
        
        // If we get here, the validation didn't work
        throw new Error('API should have rejected invalid border config');
      } catch (error) {
        // We expect an error here
        if (error.response && error.response.status === 400) {
          console.log(`   → API correctly rejected invalid config with 400`);
          console.log(`✅ Invalid border config handled correctly`);
          this.results.passed.push('Handle invalid border configuration');
          return true;
        } else if (error.message.includes('should have rejected')) {
          throw error;
        } else {
          throw new Error(`Unexpected error: ${error.message}`);
        }
      }
    } catch (error) {
      console.error(`❌ Invalid config test failed: ${error.message}`);
      this.results.failed.push({
        test: 'Handle invalid border configuration',
        error: error.message
      });
      return false;
    }
  }

  async testMissingImageUrl() {
    console.log('\n🚫 TEST: Handle missing image URL');
    
    try {
      const borderConfig = {
        type: 'solid',
        color: '#000000',
        width: 15,
        opacity: 1
      };
      
      try {
        await axios.post(
          `${BASE_URL}${API_ENDPOINT}`,
          {
            // Missing imageUrl
            borderConfig: borderConfig
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer test-token'
            },
            timeout: 10000
          }
        );
        
        throw new Error('API should have rejected missing image URL');
      } catch (error) {
        if (error.response && error.response.status === 400) {
          console.log(`   → API correctly rejected missing URL with 400`);
          console.log(`✅ Missing image URL handled correctly`);
          this.results.passed.push('Handle missing image URL');
          return true;
        } else if (error.message.includes('should have rejected')) {
          throw error;
        } else {
          throw new Error(`Unexpected error: ${error.message}`);
        }
      }
    } catch (error) {
      console.error(`❌ Missing URL test failed: ${error.message}`);
      this.results.failed.push({
        test: 'Handle missing image URL',
        error: error.message
      });
      return false;
    }
  }

  async testBorderWidthVariations() {
    console.log('\n📏 TEST: Generate borders with different widths');
    
    try {
      const widths = [5, 15, 30];
      const results = [];
      
      for (const width of widths) {
        const borderConfig = {
          type: 'solid',
          color: '#000000',
          width: width,
          opacity: 1
        };
        
        const response = await axios.post(
          `${BASE_URL}${API_ENDPOINT}`,
          {
            sourceImageUrl: this.testImageUrl,
            borderConfig: borderConfig,
            options: { format: 'webp', quality: 85 }
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer test-token'
            },
            timeout: TEST_TIMEOUT
          }
        );
        
        if (!response.data || !response.data.success || !response.data.borderedImageUrl) {
          throw new Error('Invalid response structure');
        }
        
        // Fetch the actual image
        const imageResponse = await axios.get(response.data.borderedImageUrl, {
          responseType: 'arraybuffer',
          timeout: TEST_TIMEOUT
        });
        
        const imageBuffer = Buffer.from(imageResponse.data);
        const metadata = await sharp(imageBuffer).metadata();
        
        results.push({
          width,
          dimensions: `${metadata.width}x${metadata.height}`,
          size: imageBuffer.length
        });
        
        console.log(`   → Width ${width}px: ${metadata.width}x${metadata.height}, ${imageBuffer.length} bytes`);
      }
      
      // Verify that larger borders result in larger images
      if (results[2].size < results[0].size) {
        this.results.warnings.push('Thicker borders did not result in larger file sizes');
      }
      
      console.log(`✅ Border width variations tested successfully`);
      this.results.passed.push('Generate borders with different widths');
      return true;
    } catch (error) {
      console.error(`❌ Width variations test failed: ${error.message}`);
      this.results.failed.push({
        test: 'Generate borders with different widths',
        error: error.message
      });
      return false;
    }
  }

  async testResponsePerformance() {
    console.log('\n⚡ TEST: Measure border preview generation performance');
    
    try {
      const borderConfig = {
        type: 'solid',
        color: '#000000',
        width: 15,
        opacity: 1
      };
      
      const startTime = Date.now();
      
      const response = await axios.post(
        `${BASE_URL}${API_ENDPOINT}`,
        {
          sourceImageUrl: this.testImageUrl,
          borderConfig: borderConfig,
          options: { format: 'webp', quality: 85 }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          },
          timeout: TEST_TIMEOUT
        }
      );
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`   → Response time: ${duration}ms`);
      
      if (duration > 5000) {
        this.results.warnings.push(`Border generation took ${duration}ms (> 5s)`);
      }
      
      if (!response.data || !response.data.success) {
        throw new Error('Invalid response structure');
      }
      
      console.log(`   → Cached: ${response.data.cached}`);
      
      console.log(`✅ Performance test completed`);
      this.results.passed.push('Measure border preview generation performance');
      return true;
    } catch (error) {
      console.error(`❌ Performance test failed: ${error.message}`);
      this.results.failed.push({
        test: 'Measure border preview generation performance',
        error: error.message
      });
      return false;
    }
  }

  printResults() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 BORDER PREVIEW API TEST RESULTS');
    console.log('='.repeat(80));
    
    console.log(`\n✅ PASSED: ${this.results.passed.length}`);
    this.results.passed.forEach(test => {
      console.log(`   ✓ ${test}`);
    });
    
    if (this.results.warnings.length > 0) {
      console.log(`\n⚠️  WARNINGS: ${this.results.warnings.length}`);
      this.results.warnings.forEach(warning => {
        console.log(`   ⚠ ${warning}`);
      });
    }
    
    if (this.results.failed.length > 0) {
      console.log(`\n❌ FAILED: ${this.results.failed.length}`);
      this.results.failed.forEach(failure => {
        console.log(`   ✗ ${failure.test}`);
        console.log(`     Error: ${failure.error}`);
      });
    }
    
    console.log('\n' + '='.repeat(80));
    
    const total = this.results.passed.length + this.results.failed.length;
    const passRate = total > 0 ? ((this.results.passed.length / total) * 100).toFixed(1) : 0;
    console.log(`Pass Rate: ${passRate}% (${this.results.passed.length}/${total})`);
    console.log('='.repeat(80) + '\n');
    
    return this.results.failed.length === 0;
  }
}

// Run tests
async function runTests() {
  const tester = new BorderPreviewAPITester();
  
  try {
    await tester.setup();
    
    // Run all tests
    await tester.testSolidBorderPreview();
    await tester.testGradientBorderPreview();
    await tester.testWavelengthThemeBorder();
    await tester.testInvalidBorderConfig();
    await tester.testMissingImageUrl();
    await tester.testBorderWidthVariations();
    await tester.testResponsePerformance();
    
    // Print results
    const allPassed = tester.printResults();
    
    process.exit(allPassed ? 0 : 1);
    
  } catch (error) {
    console.error('\n💥 Fatal error during testing:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  runTests();
}

module.exports = BorderPreviewAPITester;
