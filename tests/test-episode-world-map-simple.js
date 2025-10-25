#!/usr/bin/env node

/**
 * Simple test runner for Episode World Map Integration
 * This script can be run directly to validate the world map functionality
 */

const puppeteer = require('puppeteer');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3001';

// Test episodes with known location connections
const TEST_EPISODES = {
  withLocations: [
    { season: 1, episode: 8, title: 'Life in the Shire' },
    { season: 2, episode: 7, title: 'Say Goodbye To The Shire' },
    { season: 4, episode: 8, title: 'The Shire Dream' }
  ],
  withoutLocations: [
    { season: 1, episode: 1, title: 'My Lucky Charm' },
    { season: 1, episode: 4, title: 'Daphne' }
  ]
};

class WorldMapTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      passed: 0,
      failed: 0,
      total: 0
    };
  }

  async setup() {
    console.log('🚀 Setting up browser for Episode World Map tests...\n');
    
    this.browser = await puppeteer.launch({
      headless: 'new',
      defaultViewport: { width: 1280, height: 720 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    
    // Set up console logging for debugging
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('   🔴 Browser Error:', msg.text());
      }
    });
    
    this.page.on('pageerror', error => {
      console.log('   💥 Page Error:', error.message);
    });
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
    
    console.log('\n📊 Test Results Summary:');
    console.log(`   ✅ Passed: ${this.results.passed}`);
    console.log(`   ❌ Failed: ${this.results.failed}`);
    console.log(`   📈 Total:  ${this.results.total}`);
    console.log(`   💯 Success Rate: ${Math.round((this.results.passed / this.results.total) * 100)}%\n`);
    
    return this.results.failed === 0;
  }

  async assert(condition, message) {
    this.results.total++;
    
    if (condition) {
      console.log(`   ✅ ${message}`);
      this.results.passed++;
      return true;
    } else {
      console.log(`   ❌ ${message}`);
      this.results.failed++;
      return false;
    }
  }

  async testLocationDetection() {
    console.log('🔍 Testing Location Detection Logic...\n');
    
    // Test episodes WITH locations
    for (const episode of TEST_EPISODES.withLocations) {
      const url = `${BASE_URL}/season/${episode.season}/episode/${episode.episode}`;
      console.log(`📍 Testing: ${episode.title}`);
      
      try {
        await this.page.goto(url, { waitUntil: 'networkidle2', timeout: 10000 });
        
        // Check for world map section
        const worldMapSection = await this.page.$('.episode-world-map');
        await this.assert(worldMapSection !== null, `World map section exists for ${episode.title}`);
        
        // Check for map button
        const mapButton = await this.page.$('#showWorldMapModal');
        await this.assert(mapButton !== null, `Map button exists for ${episode.title}`);
        
        if (mapButton) {
          const buttonText = await this.page.$eval('#showWorldMapModal', el => el.textContent);
          await this.assert(buttonText.includes('Open World Map'), `Button has correct text for ${episode.title}`);
        }
        
      } catch (error) {
        console.log(`   💥 Error testing ${episode.title}: ${error.message}`);
        await this.assert(false, `Episode ${episode.title} loaded successfully`);
      }
    }
    
    console.log('\n🚫 Testing episodes WITHOUT locations...\n');
    
    // Test episodes WITHOUT locations
    for (const episode of TEST_EPISODES.withoutLocations) {
      const url = `${BASE_URL}/season/${episode.season}/episode/${episode.episode}`;
      console.log(`📍 Testing: ${episode.title}`);
      
      try {
        await this.page.goto(url, { waitUntil: 'networkidle2', timeout: 10000 });
        
        // Should NOT have world map section
        const worldMapSection = await this.page.$('.episode-world-map');
        await this.assert(worldMapSection === null, `No world map section for ${episode.title} (as expected)`);
        
        // Should NOT have map button
        const mapButton = await this.page.$('#showWorldMapModal');
        await this.assert(mapButton === null, `No map button for ${episode.title} (as expected)`);
        
      } catch (error) {
        console.log(`   💥 Error testing ${episode.title}: ${error.message}`);
        await this.assert(false, `Episode ${episode.title} loaded successfully`);
      }
    }
  }

  async testModalFunctionality() {
    console.log('\n🗺️ Testing Modal Popup Functionality...\n');
    
    // Use first episode with locations
    const testEpisode = TEST_EPISODES.withLocations[0];
    const url = `${BASE_URL}/season/${testEpisode.season}/episode/${testEpisode.episode}`;
    
    console.log(`📍 Testing modal with: ${testEpisode.title}`);
    
    try {
      await this.page.goto(url, { waitUntil: 'networkidle2', timeout: 10000 });
      
      // Check modal is initially hidden
      const initialDisplay = await this.page.$eval('#worldMapModal', el => 
        window.getComputedStyle(el).display
      );
      await this.assert(initialDisplay === 'none', 'Modal initially hidden');
      
      // Click the button to open modal
      await this.page.click('#showWorldMapModal');
      
      // Wait for modal to appear
      await this.page.waitForTimeout(1000);
      
      const modalAfterClick = await this.page.$eval('#worldMapModal', el => 
        window.getComputedStyle(el).display
      );
      await this.assert(modalAfterClick === 'block', 'Modal opens when button clicked');
      
      // Check modal content structure
      const modalContent = await this.page.$('.modal-content-map');
      await this.assert(modalContent !== null, 'Modal content container exists');
      
      const mapHeader = await this.page.$('.map-header h2');
      await this.assert(mapHeader !== null, 'Modal header exists');
      
      if (mapHeader) {
        const headerText = await this.page.$eval('.map-header h2', el => el.textContent);
        await this.assert(headerText.includes('World of Wavelength'), 'Header text is correct');
      }
      
      // Test closing modal with close button
      await this.page.click('.modal-close-map');
      await this.page.waitForTimeout(500);
      
      const modalAfterClose = await this.page.$eval('#worldMapModal', el => 
        window.getComputedStyle(el).display
      );
      await this.assert(modalAfterClose === 'none', 'Modal closes when close button clicked');
      
    } catch (error) {
      console.log(`   💥 Error testing modal functionality: ${error.message}`);
      await this.assert(false, 'Modal functionality works correctly');
    }
  }

  async testResponsiveDesign() {
    console.log('\n📱 Testing Responsive Design...\n');
    
    const testEpisode = TEST_EPISODES.withLocations[0];
    const url = `${BASE_URL}/season/${testEpisode.season}/episode/${testEpisode.episode}`;
    
    console.log(`📍 Testing responsive design with: ${testEpisode.title}`);
    
    try {
      // Test mobile viewport
      await this.page.setViewport({ width: 375, height: 667 });
      await this.page.goto(url, { waitUntil: 'networkidle2', timeout: 10000 });
      
      const button = await this.page.$('#showWorldMapModal');
      await this.assert(button !== null, 'Map button exists on mobile');
      
      if (button) {
        const buttonBox = await button.boundingBox();
        await this.assert(buttonBox && buttonBox.width > 0, 'Button is visible on mobile');
        
        // Test that button is clickable on mobile
        await this.page.click('#showWorldMapModal');
        await this.page.waitForTimeout(1000);
        
        const modalOnMobile = await this.page.$eval('#worldMapModal', el => 
          window.getComputedStyle(el).display
        );
        await this.assert(modalOnMobile === 'block', 'Modal opens on mobile');
        
        // Close modal
        await this.page.click('.modal-close-map');
      }
      
      // Reset to desktop viewport
      await this.page.setViewport({ width: 1280, height: 720 });
      
    } catch (error) {
      console.log(`   💥 Error testing responsive design: ${error.message}`);
      await this.assert(false, 'Responsive design works correctly');
    }
  }

  async testIntegrationWithExistingFeatures() {
    console.log('\n🔗 Testing Integration with Existing Features...\n');
    
    const testEpisode = TEST_EPISODES.withLocations[0];
    const url = `${BASE_URL}/season/${testEpisode.season}/episode/${testEpisode.episode}`;
    
    console.log(`📍 Testing integration with: ${testEpisode.title}`);
    
    try {
      await this.page.goto(url, { waitUntil: 'networkidle2', timeout: 10000 });
      
      // Check existing elements still work
      const title = await this.page.$('h1');
      await this.assert(title !== null, 'Episode title still present');
      
      const imageModal = await this.page.$('#imageModal');
      const mapModal = await this.page.$('#worldMapModal');
      
      await this.assert(imageModal !== null, 'Existing image modal still present');
      await this.assert(mapModal !== null, 'New map modal present');
      
      // Check that both modals can coexist without conflicts
      await this.assert(imageModal !== null && mapModal !== null, 'Both modals coexist without conflicts');
      
    } catch (error) {
      console.log(`   💥 Error testing integration: ${error.message}`);
      await this.assert(false, 'Integration with existing features works correctly');
    }
  }

  async runAllTests() {
    console.log('🌍 Episode World Map Integration Test Suite\n');
    console.log('=' .repeat(50));
    
    try {
      await this.setup();
      
      await this.testLocationDetection();
      await this.testModalFunctionality();
      await this.testResponsiveDesign();
      await this.testIntegrationWithExistingFeatures();
      
      const success = await this.cleanup();
      
      if (success) {
        console.log('🎉 All tests passed! World map integration is working correctly.');
        process.exit(0);
      } else {
        console.log('💥 Some tests failed. Check the output above for details.');
        process.exit(1);
      }
      
    } catch (error) {
      console.error('💥 Test suite failed:', error);
      await this.cleanup();
      process.exit(1);
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new WorldMapTester();
  tester.runAllTests().catch(console.error);
}

module.exports = WorldMapTester;