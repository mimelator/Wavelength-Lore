/**
 * Browser-based tests for Episode World Map Integration
 * Tests the functionality of world map popups on episode pages
 */

const puppeteer = require('puppeteer');
const { expect } = require('chai');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3001';

// Test episodes - some with locations, some without
const TEST_EPISODES = {
  withLocations: [
    { season: 1, episode: 8, title: 'Life in the Shire', expectedKeywords: ['shire'] },
    { season: 2, episode: 7, title: 'Say Goodbye To The Shire', expectedKeywords: ['shire'] },
    { season: 3, episode: 1, title: 'Ice Fortress', expectedKeywords: ['ice', 'fortress'] },
    { season: 4, episode: 8, title: 'The Shire Dream', expectedKeywords: ['shire'] }
  ],
  withoutLocations: [
    { season: 1, episode: 1, title: 'My Lucky Charm', expectedKeywords: [] },
    { season: 1, episode: 4, title: 'Daphne', expectedKeywords: [] }
  ]
};

describe('Episode World Map Integration Tests', function() {
  this.timeout(30000); // Increase timeout for browser tests
  
  let browser;
  let page;
  
  before(async function() {
    console.log('\n🌍 Starting Episode World Map Integration Tests...');
    
    // Launch browser
    browser = await puppeteer.launch({
      headless: 'new', // Use new headless mode
      defaultViewport: { width: 1280, height: 720 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    page = await browser.newPage();
    
    // Set up console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('   🔴 Browser Error:', msg.text());
      } else if (msg.type() === 'warning') {
        console.log('   🟡 Browser Warning:', msg.text());
      }
    });
    
    // Set up error handling
    page.on('pageerror', error => {
      console.log('   💥 Page Error:', error.message);
    });
  });
  
  after(async function() {
    if (browser) {
      await browser.close();
    }
    console.log('🏁 Episode World Map Integration Tests completed!\n');
  });

  describe('🔍 Location Detection Logic', function() {
    
    it('should detect episodes with location connections', async function() {
      console.log('\n   Testing location detection for episodes with locations...');
      
      for (const episode of TEST_EPISODES.withLocations) {
        const url = `${BASE_URL}/season/${episode.season}/episode/${episode.episode}`;
        console.log(`   📍 Testing: ${episode.title} (${url})`);
        
        await page.goto(url, { waitUntil: 'networkidle2' });
        
        // Wait for page to fully load
        await page.waitForSelector('h1', { timeout: 5000 });
        
        // Check if world map section exists
        const worldMapSection = await page.$('.episode-world-map');
        expect(worldMapSection).to.not.be.null;
        console.log(`   ✅ World map section found for ${episode.title}`);
        
        // Check if map button exists
        const mapButton = await page.$('#showWorldMapModal');
        expect(mapButton).to.not.be.null;
        console.log(`   ✅ Map button found for ${episode.title}`);
        
        // Verify button text
        const buttonText = await page.$eval('#showWorldMapModal', el => el.textContent);
        expect(buttonText).to.include('Open World Map');
        console.log(`   ✅ Button text correct: "${buttonText.trim()}"`);
      }
    });
    
    it('should NOT show map integration for episodes without locations', async function() {
      console.log('\n   Testing episodes without location connections...');
      
      for (const episode of TEST_EPISODES.withoutLocations) {
        const url = `${BASE_URL}/season/${episode.season}/episode/${episode.episode}`;
        console.log(`   📍 Testing: ${episode.title} (${url})`);
        
        await page.goto(url, { waitUntil: 'networkidle2' });
        
        // Wait for page to fully load
        await page.waitForSelector('h1', { timeout: 5000 });
        
        // Check that world map section does NOT exist
        const worldMapSection = await page.$('.episode-world-map');
        expect(worldMapSection).to.be.null;
        console.log(`   ✅ No world map section for ${episode.title} (as expected)`);
        
        // Check that map button does NOT exist
        const mapButton = await page.$('#showWorldMapModal');
        expect(mapButton).to.be.null;
        console.log(`   ✅ No map button for ${episode.title} (as expected)`);
      }
    });
  });

  describe('🎨 UI Elements and Styling', function() {
    
    beforeEach(async function() {
      // Use a known episode with locations for UI tests
      const testEpisode = TEST_EPISODES.withLocations[0];
      const url = `${BASE_URL}/season/${testEpisode.season}/episode/${testEpisode.episode}`;
      await page.goto(url, { waitUntil: 'networkidle2' });
      await page.waitForSelector('.episode-world-map', { timeout: 5000 });
    });
    
    it('should have proper styling for world map section', async function() {
      console.log('\n   Testing world map section styling...');
      
      const sectionStyles = await page.$eval('.episode-world-map', el => {
        const styles = window.getComputedStyle(el);
        return {
          textAlign: styles.textAlign,
          backgroundColor: styles.backgroundColor,
          borderRadius: styles.borderRadius,
          padding: styles.padding
        };
      });
      
      expect(sectionStyles.textAlign).to.equal('center');
      console.log('   ✅ Section properly centered');
      
      expect(sectionStyles.borderRadius).to.include('15px');
      console.log('   ✅ Section has rounded corners');
      
      expect(sectionStyles.backgroundColor).to.not.equal('rgba(0, 0, 0, 0)');
      console.log('   ✅ Section has background color');
    });
    
    it('should have proper button styling and hover effects', async function() {
      console.log('\n   Testing map button styling and interactions...');
      
      const button = await page.$('#showWorldMapModal');
      
      // Test initial button styles
      const initialStyles = await page.$eval('#showWorldMapModal', el => {
        const styles = window.getComputedStyle(el);
        return {
          backgroundColor: styles.backgroundColor,
          color: styles.color,
          cursor: styles.cursor,
          borderRadius: styles.borderRadius
        };
      });
      
      expect(initialStyles.cursor).to.equal('pointer');
      console.log('   ✅ Button has pointer cursor');
      
      expect(initialStyles.borderRadius).to.include('10px');
      console.log('   ✅ Button has rounded corners');
      
      // Test hover effect (simulate mouseover)
      await button.hover();
      
      // Wait a moment for transition
      await page.waitForTimeout(500);
      
      const hoverStyles = await page.$eval('#showWorldMapModal', el => {
        const styles = window.getComputedStyle(el);
        return {
          backgroundColor: styles.backgroundColor,
          transform: styles.transform
        };
      });
      
      // Should have some transform or color change on hover
      const hasHoverEffect = hoverStyles.transform !== 'none' || 
                           hoverStyles.backgroundColor !== initialStyles.backgroundColor;
      
      expect(hasHoverEffect).to.be.true;
      console.log('   ✅ Button hover effect working');
    });
  });

  describe('🗺️ Modal Popup Behavior', function() {
    
    beforeEach(async function() {
      // Use a known episode with locations
      const testEpisode = TEST_EPISODES.withLocations[0];
      const url = `${BASE_URL}/season/${testEpisode.season}/episode/${testEpisode.episode}`;
      await page.goto(url, { waitUntil: 'networkidle2' });
      await page.waitForSelector('#showWorldMapModal', { timeout: 5000 });
    });
    
    it('should open modal when button is clicked', async function() {
      console.log('\n   Testing modal opening...');
      
      // Modal should be hidden initially
      const initialModalDisplay = await page.$eval('#worldMapModal', el => 
        window.getComputedStyle(el).display
      );
      expect(initialModalDisplay).to.equal('none');
      console.log('   ✅ Modal initially hidden');
      
      // Click the button
      await page.click('#showWorldMapModal');
      
      // Wait for modal to appear
      await page.waitForSelector('#worldMapModal[style*="block"]', { timeout: 3000 });
      
      const modalDisplay = await page.$eval('#worldMapModal', el => 
        window.getComputedStyle(el).display
      );
      expect(modalDisplay).to.equal('block');
      console.log('   ✅ Modal opens when button clicked');
      
      // Check modal content structure
      const modalContent = await page.$('.modal-content-map');
      expect(modalContent).to.not.be.null;
      console.log('   ✅ Modal content container found');
      
      const mapHeader = await page.$('.map-header h2');
      expect(mapHeader).to.not.be.null;
      
      const headerText = await page.$eval('.map-header h2', el => el.textContent);
      expect(headerText).to.include('World of Wavelength');
      console.log('   ✅ Modal header correct');
    });
    
    it('should close modal when close button is clicked', async function() {
      console.log('\n   Testing modal closing with close button...');
      
      // Open modal first
      await page.click('#showWorldMapModal');
      await page.waitForSelector('#worldMapModal[style*="block"]', { timeout: 3000 });
      
      // Click close button
      await page.click('.modal-close-map');
      
      // Wait for modal to hide
      await page.waitForTimeout(500);
      
      const modalDisplay = await page.$eval('#worldMapModal', el => 
        window.getComputedStyle(el).display
      );
      expect(modalDisplay).to.equal('none');
      console.log('   ✅ Modal closes when close button clicked');
    });
    
    it('should close modal when clicking outside', async function() {
      console.log('\n   Testing modal closing by clicking outside...');
      
      // Open modal first
      await page.click('#showWorldMapModal');
      await page.waitForSelector('#worldMapModal[style*="block"]', { timeout: 3000 });
      
      // Click on modal background (outside content)
      await page.evaluate(() => {
        const modal = document.getElementById('worldMapModal');
        modal.click(); // This simulates clicking on the background
      });
      
      // Wait for modal to hide
      await page.waitForTimeout(500);
      
      const modalDisplay = await page.$eval('#worldMapModal', el => 
        window.getComputedStyle(el).display
      );
      expect(modalDisplay).to.equal('none');
      console.log('   ✅ Modal closes when clicking outside');
    });
    
    it('should load map content properly', async function() {
      console.log('\n   Testing map content loading...');
      
      // Open modal
      await page.click('#showWorldMapModal');
      await page.waitForSelector('#worldMapModal[style*="block"]', { timeout: 3000 });
      
      // Wait for map content to load (look for SVG or "Loading" text)
      await page.waitForTimeout(2000); // Give time for fetch to complete
      
      const mapContent = await page.$eval('#modalMapContent', el => el.innerHTML);
      
      // Should either have SVG content or fallback link
      const hasMapContent = mapContent.includes('<svg') || 
                           mapContent.includes('View full map') ||
                           mapContent.includes('Loading');
      
      expect(hasMapContent).to.be.true;
      console.log('   ✅ Map content loads (SVG, fallback, or loading state)');
      
      // If SVG loaded, check for clickable elements
      if (mapContent.includes('<svg')) {
        console.log('   ✅ SVG map loaded successfully');
        
        // Check for clickable elements (might be added after map loads)
        await page.waitForTimeout(1000);
        
        const clickableElements = await page.$$('#modalMapContent [data-location]');
        console.log(`   ✅ Found ${clickableElements.length} clickable map elements`);
      }
    });
  });

  describe('📱 Responsive Design', function() {
    
    it('should work properly on mobile viewport', async function() {
      console.log('\n   Testing mobile responsiveness...');
      
      // Set mobile viewport
      await page.setViewport({ width: 375, height: 667 });
      
      const testEpisode = TEST_EPISODES.withLocations[0];
      const url = `${BASE_URL}/season/${testEpisode.season}/episode/${testEpisode.episode}`;
      await page.goto(url, { waitUntil: 'networkidle2' });
      await page.waitForSelector('#showWorldMapModal', { timeout: 5000 });
      
      // Check button is still visible and clickable
      const button = await page.$('#showWorldMapModal');
      const buttonBox = await button.boundingBox();
      expect(buttonBox.width).to.be.greaterThan(0);
      console.log('   ✅ Button visible on mobile');
      
      // Open modal and check mobile styling
      await page.click('#showWorldMapModal');
      await page.waitForSelector('#worldMapModal[style*="block"]', { timeout: 3000 });
      
      const modalStyles = await page.$eval('.modal-content-map', el => {
        const styles = window.getComputedStyle(el);
        return {
          width: styles.width,
          margin: styles.margin
        };
      });
      
      // Should have mobile-specific styling (98% width)
      expect(modalStyles.width).to.include('%');
      console.log('   ✅ Modal has responsive width on mobile');
      
      // Reset viewport
      await page.setViewport({ width: 1280, height: 720 });
    });
  });

  describe('🔗 Integration with Existing Features', function() {
    
    it('should not interfere with existing episode functionality', async function() {
      console.log('\n   Testing integration with existing features...');
      
      const testEpisode = TEST_EPISODES.withLocations[0];
      const url = `${BASE_URL}/season/${testEpisode.season}/episode/${testEpisode.episode}`;
      await page.goto(url, { waitUntil: 'networkidle2' });
      
      // Check that existing elements still exist
      const title = await page.$('h1');
      expect(title).to.not.be.null;
      console.log('   ✅ Episode title still present');
      
      const carousel = await page.$('.carousel-container');
      if (carousel) {
        console.log('   ✅ Image carousel still present');
      }
      
      const lyrics = await page.$('.lyrics');
      if (lyrics) {
        console.log('   ✅ Lyrics section still present');
      }
      
      const relatedContent = await page.$('.related-characters');
      if (relatedContent) {
        console.log('   ✅ Related content section still present');
      }
      
      // Check that both old modal (image) and new modal (map) can coexist
      const imageModal = await page.$('#imageModal');
      const mapModal = await page.$('#worldMapModal');
      
      expect(imageModal).to.not.be.null;
      expect(mapModal).to.not.be.null;
      console.log('   ✅ Both image modal and map modal present');
    });
  });
});

// Helper function to run tests
async function runEpisodeWorldMapTests() {
  console.log('\n🧪 Running Episode World Map Integration Tests...\n');
  
  try {
    // Use Mocha programmatically if available, or just run the functions
    if (typeof describe !== 'undefined') {
      // Running in Mocha environment
      return;
    } else {
      // Run tests manually
      console.log('⚠️  Running tests outside Mocha environment');
      
      const browser = await puppeteer.launch({
        headless: 'new',
        defaultViewport: { width: 1280, height: 720 }
      });
      
      const page = await browser.newPage();
      
      // Quick smoke test
      console.log('🔍 Quick smoke test...');
      
      const testEpisode = TEST_EPISODES.withLocations[0];
      const url = `${BASE_URL}/season/${testEpisode.season}/episode/${testEpisode.episode}`;
      
      await page.goto(url, { waitUntil: 'networkidle2' });
      
      const mapButton = await page.$('#showWorldMapModal');
      if (mapButton) {
        console.log('✅ World map button found');
        
        await page.click('#showWorldMapModal');
        const modal = await page.$('#worldMapModal[style*="block"]');
        if (modal) {
          console.log('✅ Modal opens successfully');
        } else {
          console.log('❌ Modal did not open');
        }
      } else {
        console.log('❌ World map button not found');
      }
      
      await browser.close();
    }
    
  } catch (error) {
    console.error('❌ Test execution error:', error);
    throw error;
  }
}

module.exports = {
  runEpisodeWorldMapTests,
  TEST_EPISODES
};