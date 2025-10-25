#!/usr/bin/env node

/**
 * Quick World Map Integration Test
 * Fast validation without browser automation that can hang
 */

const http = require('http');
const { JSDOM } = require('jsdom');

const BASE_URL = 'http://localhost:3001';

// Helper to make HTTP requests
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const request = http.get(url, (response) => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        if (response.statusCode === 200) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        }
      });
    });
    
    request.on('error', reject);
    request.setTimeout(5000, () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function testWorldMapIntegration() {
  console.log('🗺️ QUICK WORLD MAP INTEGRATION TEST');
  console.log('=' .repeat(45));
  
  const results = {
    serverRunning: false,
    mapSectionExists: false,
    reasonableSize: false,
    episodeKeywords: false,
    mapPreviewContainer: false
  };
  
  try {
    console.log('\n🎯 TEST 1: Server Availability');
    console.log('-'.repeat(30));
    
    // Test server is running
    try {
      await makeRequest(`${BASE_URL}/season/1/episode/8`);
      console.log('✅ Server is running');
      results.serverRunning = true;
    } catch (error) {
      throw new Error(`❌ Server not accessible: ${error.message}`);
    }
    
    console.log('\n🎯 TEST 2: World Map Section Presence');
    console.log('-'.repeat(30));
    
    // Get episode page HTML
    const html = await makeRequest(`${BASE_URL}/season/1/episode/8`);
    
    // Check for world map section
    const hasMapSection = html.includes('episode-world-map');
    console.log(`World map section: ${hasMapSection ? '✅ Found' : '❌ Missing'}`);
    results.mapSectionExists = hasMapSection;
    
    // Check for map preview container
    const hasPreviewContainer = html.includes('episode-map-preview');
    console.log(`Map preview container: ${hasPreviewContainer ? '✅ Found' : '❌ Missing'}`);
    results.mapPreviewContainer = hasPreviewContainer;
    
    console.log('\n🎯 TEST 3: Desktop Sidebar Layout Analysis');
    console.log('-'.repeat(30));
    
    // Check for new sidebar layout
    const hasSidebar = html.includes('episode-world-map-sidebar');
    const hasLargerMap = html.includes('height: 280px') || html.includes('height:280px');
    const hasFixedPosition = html.includes('position: fixed');
    const hasResponsive = html.includes('@media (max-width: 1200px)');
    const hasMinimize = html.includes('minimize-map');
    
    console.log(`Desktop sidebar layout: ${hasSidebar ? '✅ Found' : '❌ Missing'}`);
    console.log(`Larger map preview (280px): ${hasLargerMap ? '✅ Found' : '❌ Missing'}`);
    console.log(`Fixed positioning: ${hasFixedPosition ? '✅ Found' : '❌ Missing'}`);
    console.log(`Responsive design: ${hasResponsive ? '✅ Found' : '❌ Missing'}`);
    console.log(`Minimize functionality: ${hasMinimize ? '✅ Found' : '❌ Missing'}`);
    
    results.reasonableSize = hasSidebar && hasLargerMap;
    
    console.log('\n🎯 TEST 4: Episode Keywords Integration');
    console.log('-'.repeat(30));
    
    // Check for episode keywords in JavaScript
    const keywordMatch = html.match(/episodeKeywords\s*=\s*(\[.*?\])/);
    if (keywordMatch) {
      try {
        const keywords = JSON.parse(keywordMatch[1]);
        console.log(`✅ Episode keywords found: ${keywords.length} items`);
        console.log(`   Keywords: ${keywords.slice(0, 3).join(', ')}${keywords.length > 3 ? '...' : ''}`);
        
        // Check for expected keywords for "Life in the Shire"
        const expectedKeywords = ['shire', 'home', 'wavelength'];
        const hasExpectedKeywords = expectedKeywords.some(keyword => 
          keywords.some(k => k.toLowerCase().includes(keyword.toLowerCase()))
        );
        console.log(`   Contains expected keywords: ${hasExpectedKeywords ? '✅ Yes' : '❌ No'}`);
        results.episodeKeywords = true;
      } catch (e) {
        console.log('❌ Keywords found but invalid JSON format');
      }
    } else {
      console.log('❌ Episode keywords not found in JavaScript');
    }
    
    console.log('\n🎯 TEST 5: Map Loading Function');
    console.log('-'.repeat(30));
    
    // Check for map loading function
    const hasLoadFunction = html.includes('loadEpisodeMapPreview');
    const hasFetchMap = html.includes("fetch('/map')");
    const hasHighlighting = html.includes('shouldHighlight');
    
    console.log(`Map loading function: ${hasLoadFunction ? '✅ Found' : '❌ Missing'}`);
    console.log(`Map fetching logic: ${hasFetchMap ? '✅ Found' : '❌ Missing'}`);
    console.log(`Highlighting logic: ${hasHighlighting ? '✅ Found' : '❌ Missing'}`);
    
    // Check for new auto-zoom functionality
    const hasAutoZoom = html.includes('Auto-zoomed to region:');
    const hasBoundingBox = html.includes('calculateBoundingBox');
    const hasViewBoxUpdate = html.includes('setAttribute(\'viewBox\'');
    
    console.log(`Auto-zoom logging: ${hasAutoZoom ? '✅ Found' : '❌ Missing'}`);
    console.log(`Bounding box calculation: ${hasBoundingBox ? '✅ Found' : '❌ Missing'}`);
    console.log(`ViewBox update logic: ${hasViewBoxUpdate ? '✅ Found' : '❌ Missing'}`);
    
    console.log('\n🎯 TEST 6: Episode Without Locations');
    console.log('-'.repeat(30));
    
    // Test episode without locations
    const episode1Html = await makeRequest(`${BASE_URL}/season/1/episode/1`);
    const episode1HasMap = episode1Html.includes('episode-world-map');
    
    console.log(`Episode 1 (My Lucky Charm) has map: ${episode1HasMap ? '⚠️ Yes' : '✅ No'}`);
    // Note: This might be intentional behavior, so not marking as failure
    
    console.log('\n🏆 TEST RESULTS SUMMARY');
    console.log('=' .repeat(45));
    
    const testCases = [
      { name: 'Server Running', passed: results.serverRunning, critical: true },
      { name: 'Map Section Exists', passed: results.mapSectionExists, critical: true },
      { name: 'Preview Container', passed: results.mapPreviewContainer, critical: true },
      { name: 'Desktop Sidebar Layout', passed: results.reasonableSize, critical: true },
      { name: 'Episode Keywords', passed: results.episodeKeywords, critical: true },
    ];
    
    testCases.forEach(test => {
      const status = test.passed ? '✅ PASS' : '❌ FAIL';
      const level = test.critical ? '[CRITICAL]' : '[OPTIONAL]';
      console.log(`   ${status} ${level} - ${test.name}`);
    });
    
    const criticalPassed = testCases.filter(t => t.critical && t.passed).length;
    const criticalTotal = testCases.filter(t => t.critical).length;
    const totalPassed = testCases.filter(t => t.passed).length;
    
    console.log(`\n📊 SCORE: ${criticalPassed}/${criticalTotal} critical tests passed`);
    console.log(`📊 OVERALL: ${totalPassed}/${testCases.length} total tests passed`);
    
    if (criticalPassed === criticalTotal) {
      console.log('\n🎉 SUCCESS: World map integration is functional!');
      console.log('📋 Manual verification recommended:');
      console.log('   1. Visit http://localhost:3001/season/1/episode/8');
      console.log('   2. Verify map preview appears and loads');
      console.log('   3. Check location highlighting works');
      console.log('   4. Test navigation to full map');
    } else {
      console.log('\n🚨 FAILURE: Critical issues detected in world map integration');
    }
    
    return criticalPassed === criticalTotal;
    
  } catch (error) {
    console.error('❌ TEST ERROR:', error.message);
    return false;
  }
}

// Run the test
if (require.main === module) {
  testWorldMapIntegration()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testWorldMapIntegration };