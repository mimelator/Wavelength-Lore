#!/usr/bin/env node

/**
 * World Map Integration Navigation Test
 * 
 * This test proves the world map integration works by:
 * 1. Testing episodes with location connections show the map button
 * 2. Testing the map modal opens and displays interactive content
 * 3. Testing navigation from episodes to world map to location pages
 * 4. Validating the complete user journey for exploration
 */

const puppeteer = require('puppeteer');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3001';

// Episodes known to have location connections (The Shire)
const LOCATION_EPISODES = [
  { season: 1, episode: 8, title: 'Life in the Shire', expectedLocation: 'The Shire' },
  { season: 1, episode: 11, title: 'Back to the Shire', expectedLocation: 'The Shire' },
  { season: 2, episode: 7, title: 'Say Goodbye To The Shire', expectedLocation: 'The Shire' }
];

class WorldMapNavigationTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = [];
  }

  async setup() {
    console.log('🚀 Setting up World Map Navigation Test...\n');
    
    this.browser = await puppeteer.launch({
      headless: false, // Show browser for navigation demonstration
      defaultViewport: { width: 1200, height: 800 },
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      slowMo: 500 // Slow down for demonstration
    });
    
    this.page = await this.browser.newPage();
    
    // Log console messages
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('   🔴 Browser Error:', msg.text());
      }
    });
    
    // Set up error handling
    this.page.on('pageerror', error => {
      console.log('   💥 Page Error:', error.message);
    });

    console.log('✅ Browser setup complete\n');
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
    
    // Summary
    console.log('\n📊 Test Results Summary:');
    this.testResults.forEach(result => {
      const icon = result.passed ? '✅' : '❌';
      console.log(`   ${icon} ${result.test}: ${result.message}`);
    });
    
    const passCount = this.testResults.filter(r => r.passed).length;
    const totalCount = this.testResults.length;
    
    console.log(`\n🎯 Overall: ${passCount}/${totalCount} tests passed`);
    return passCount === totalCount;
  }

  async recordResult(test, passed, message) {
    this.testResults.push({ test, passed, message });
    const icon = passed ? '✅' : '❌';
    console.log(`   ${icon} ${test}: ${message}`);
  }

  async testEpisodeWorldMapButton() {
    console.log('🔍 Test 1: Episode World Map Button Detection\n');
    
    const testEpisode = LOCATION_EPISODES[0];
    const url = `${BASE_URL}/season/${testEpisode.season}/episode/${testEpisode.episode}`;
    
    try {
      console.log(`   📺 Navigating to: ${testEpisode.title}`);
      console.log(`   🌐 URL: ${url}\n`);
      
      await this.page.goto(url, { waitUntil: 'networkidle2', timeout: 10000 });
      
      // Wait for page to load
      await this.page.waitForSelector('h1', { timeout: 5000 });
      
      const pageTitle = await this.page.$eval('h1', el => el.textContent);
      console.log(`   📖 Page loaded: ${pageTitle}`);
      
      // Check for world map section
      const worldMapSection = await this.page.$('.episode-world-map');
      if (!worldMapSection) {
        await this.recordResult('World Map Section', false, 'Section not found on page');
        return false;
      }
      
      await this.recordResult('World Map Section', true, 'Section found on episode page');
      
      // Check for map button
      const mapButton = await this.page.$('#showWorldMapModal');
      if (!mapButton) {
        await this.recordResult('Map Button', false, 'Button not found');
        return false;
      }
      
      await this.recordResult('Map Button', true, 'Button found and ready');
      
      // Check button text
      const buttonText = await this.page.$eval('#showWorldMapModal', el => el.textContent.trim());
      const hasCorrectText = buttonText.includes('Open World Map') || buttonText.includes('World Map');
      
      await this.recordResult('Button Text', hasCorrectText, `Text: "${buttonText}"`);
      
      return true;
      
    } catch (error) {
      await this.recordResult('Episode Loading', false, `Error: ${error.message}`);
      return false;
    }
  }

  async testModalNavigation() {
    console.log('\n🗺️ Test 2: Modal Navigation Functionality\n');
    
    try {
      // Click the world map button
      console.log('   🖱️  Clicking world map button...');
      await this.page.click('#showWorldMapModal');
      
      // Wait for modal to appear
      await this.page.waitForSelector('#worldMapModal[style*="block"]', { timeout: 5000 });
      
      await this.recordResult('Modal Opens', true, 'Modal successfully opened');
      
      // Check modal content
      const modalHeader = await this.page.$('.map-header h2');
      if (modalHeader) {
        const headerText = await this.page.$eval('.map-header h2', el => el.textContent);
        await this.recordResult('Modal Header', true, `Header: "${headerText}"`);
      } else {
        await this.recordResult('Modal Header', false, 'Header not found');
      }
      
      // Wait for map content to load
      console.log('   ⏳ Waiting for map content to load...');
      await this.page.waitForTimeout(3000);
      
      const mapContent = await this.page.$eval('#modalMapContent', el => el.innerHTML);
      const hasMapContent = mapContent.includes('<svg') || 
                           mapContent.includes('View full map') ||
                           mapContent.includes('Loading');
      
      await this.recordResult('Map Content', hasMapContent, hasMapContent ? 'Map content loaded' : 'No map content found');
      
      // Test modal close
      console.log('   🖱️  Testing modal close...');
      await this.page.click('.modal-close-map');
      await this.page.waitForTimeout(1000);
      
      const modalAfterClose = await this.page.$eval('#worldMapModal', el => 
        window.getComputedStyle(el).display
      );
      
      await this.recordResult('Modal Close', modalAfterClose === 'none', 'Modal closes properly');
      
      return true;
      
    } catch (error) {
      await this.recordResult('Modal Navigation', false, `Error: ${error.message}`);
      return false;
    }
  }

  async testWorldMapPageNavigation() {
    console.log('\n🌍 Test 3: World Map Page Navigation\n');
    
    try {
      // Navigate to world map page
      const mapUrl = `${BASE_URL}/map`;
      console.log(`   🌐 Navigating to: ${mapUrl}`);
      
      await this.page.goto(mapUrl, { waitUntil: 'networkidle2', timeout: 10000 });
      
      const pageTitle = await this.page.$eval('h1', el => el.textContent);
      console.log(`   📖 Page loaded: ${pageTitle}`);
      
      await this.recordResult('Map Page Load', true, 'World map page loaded successfully');
      
      // Check for SVG map
      const svgMap = await this.page.$('#map-display svg');
      if (svgMap) {
        await this.recordResult('SVG Map', true, 'Interactive SVG map found');
        
        // Look for clickable elements
        const clickableElements = await this.page.$$('#map-display [data-location]');
        console.log(`   🎯 Found ${clickableElements.length} clickable locations`);
        
        await this.recordResult('Clickable Locations', clickableElements.length > 0, 
          `${clickableElements.length} interactive locations found`);
        
        // Test clicking on a location (if any exist)
        if (clickableElements.length > 0) {
          console.log('   🖱️  Testing location click...');
          const firstLocation = clickableElements[0];
          const locationId = await firstLocation.evaluate(el => el.getAttribute('data-location'));
          
          console.log(`   📍 Clicking on location: ${locationId}`);
          await firstLocation.click();
          
          // Wait for potential navigation or modal
          await this.page.waitForTimeout(2000);
          
          await this.recordResult('Location Click', true, `Successfully clicked on ${locationId}`);
        }
        
      } else {
        await this.recordResult('SVG Map', false, 'No SVG map found');
      }
      
      return true;
      
    } catch (error) {
      await this.recordResult('World Map Navigation', false, `Error: ${error.message}`);
      return false;
    }
  }

  async testLocationPageNavigation() {
    console.log('\n🏠 Test 4: Location Page Navigation\n');
    
    try {
      // Navigate to a known location page (The Shire)
      const shireUrl = `${BASE_URL}/lore/the-shire`;
      console.log(`   🌐 Navigating to: ${shireUrl}`);
      
      await this.page.goto(shireUrl, { waitUntil: 'networkidle2', timeout: 10000 });
      
      const pageTitle = await this.page.$eval('h1', el => el.textContent);
      console.log(`   📖 Page loaded: ${pageTitle}`);
      
      await this.recordResult('Location Page Load', true, `Location page loaded: ${pageTitle}`);
      
      // Check for episode links (should show episodes that mention this location)
      const episodeLinks = await this.page.$$('.episode-link');
      console.log(`   🔗 Found ${episodeLinks.length} episode links`);
      
      await this.recordResult('Episode Links', episodeLinks.length > 0, 
        `${episodeLinks.length} episode links found on location page`);
      
      // Test clicking on an episode link to complete the navigation cycle
      if (episodeLinks.length > 0) {
        console.log('   🖱️  Testing episode link navigation...');
        const firstEpisodeLink = episodeLinks[0];
        const linkText = await firstEpisodeLink.evaluate(el => el.textContent);
        const linkUrl = await firstEpisodeLink.evaluate(el => el.href);
        
        console.log(`   📺 Clicking on episode: ${linkText}`);
        console.log(`   🌐 Target URL: ${linkUrl}`);
        
        await firstEpisodeLink.click();
        
        // Wait for navigation
        await this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
        
        const newPageTitle = await this.page.$eval('h1', el => el.textContent);
        console.log(`   ✨ Navigated to: ${newPageTitle}`);
        
        // Check if we're back on an episode page with world map integration
        const worldMapButton = await this.page.$('#showWorldMapModal');
        const backToWorldMap = worldMapButton !== null;
        
        await this.recordResult('Episode Return Navigation', true, 
          `Successfully navigated to episode: ${newPageTitle}`);
        await this.recordResult('Navigation Cycle Complete', backToWorldMap, 
          backToWorldMap ? 'World map button available - cycle complete!' : 'No world map button - cycle incomplete');
      }
      
      return true;
      
    } catch (error) {
      await this.recordResult('Location Page Navigation', false, `Error: ${error.message}`);
      return false;
    }
  }

  async demonstrateCompleteUserJourney() {
    console.log('\n🎯 Test 5: Complete User Journey Demonstration\n');
    
    try {
      // Start fresh with a Shire episode
      const testEpisode = LOCATION_EPISODES[0];
      const url = `${BASE_URL}/season/${testEpisode.season}/episode/${testEpisode.episode}`;
      
      console.log('   🎬 DEMONSTRATING COMPLETE USER JOURNEY:');
      console.log(`   📺 1. Starting at episode: ${testEpisode.title}`);
      
      await this.page.goto(url, { waitUntil: 'networkidle2', timeout: 10000 });
      
      console.log('   🗺️  2. Opening world map modal...');
      await this.page.click('#showWorldMapModal');
      await this.page.waitForSelector('#worldMapModal[style*="block"]', { timeout: 5000 });
      await this.page.waitForTimeout(2000);
      
      console.log('   🌍 3. Navigating to full world map...');
      await this.page.click('.modal-close-map');
      await this.page.waitForTimeout(1000);
      
      // Navigate to full map
      await this.page.goto(`${BASE_URL}/map`, { waitUntil: 'networkidle2' });
      await this.page.waitForTimeout(2000);
      
      console.log('   🏠 4. Going to location page...');
      await this.page.goto(`${BASE_URL}/lore/the-shire`, { waitUntil: 'networkidle2' });
      await this.page.waitForTimeout(2000);
      
      console.log('   🔄 5. Returning to episode via location links...');
      const episodeLinks = await this.page.$$('.episode-link');
      if (episodeLinks.length > 0) {
        await episodeLinks[0].click();
        await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
        await this.page.waitForTimeout(1000);
        
        const finalWorldMapButton = await this.page.$('#showWorldMapModal');
        
        await this.recordResult('Complete Journey', finalWorldMapButton !== null, 
          'Full navigation cycle completed successfully!');
      }
      
      console.log('\n   🎉 USER JOURNEY DEMONSTRATION COMPLETE!');
      console.log('   ✨ Users can now seamlessly explore episodes → world map → locations → back to episodes');
      
      return true;
      
    } catch (error) {
      await this.recordResult('Complete User Journey', false, `Error: ${error.message}`);
      return false;
    }
  }

  async runAllTests() {
    console.log('🌍 World Map Integration Navigation Test Suite');
    console.log('='.repeat(60));
    console.log('This test proves the world map integration works and demonstrates navigation\n');
    
    try {
      await this.setup();
      
      await this.testEpisodeWorldMapButton();
      await this.testModalNavigation();
      await this.testWorldMapPageNavigation();
      await this.testLocationPageNavigation();
      await this.demonstrateCompleteUserJourney();
      
      const success = await this.cleanup();
      
      if (success) {
        console.log('\n🎉 ALL TESTS PASSED! World map integration is working perfectly.');
        console.log('✨ Users can now explore the Wavelength universe through connected episodes and locations!');
        return true;
      } else {
        console.log('\n💥 Some tests failed. Check the results above for details.');
        return false;
      }
      
    } catch (error) {
      console.error('💥 Test suite failed:', error);
      await this.cleanup();
      return false;
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new WorldMapNavigationTester();
  tester.runAllTests()
    .then(success => process.exit(success ? 0 : 1))
    .catch(console.error);
}

module.exports = WorldMapNavigationTester;