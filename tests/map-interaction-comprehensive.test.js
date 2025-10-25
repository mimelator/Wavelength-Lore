#!/usr/bin/env node

/**
 * Comprehensive Map Interaction Test Suite
 * Tests both episode preview and full map click/hover behavior
 */

const http = require('http');

const BASE_URL = 'http://localhost:3001';

// Test configuration
const tests = [
    {
        name: 'Episode Preview Map Interactions',
        url: '/season/1/episode/8',
        testType: 'episode_preview'
    },
    {
        name: 'Full World Map Interactions', 
        url: '/map',
        testType: 'full_map'
    }
];

function makeRequest(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

async function testMapInteractions() {
    console.log('🗺️ COMPREHENSIVE MAP INTERACTION TEST SUITE');
    console.log('='.repeat(50));

    let allTestsPassed = true;
    
    for (const test of tests) {
        console.log(`\n🎯 TEST: ${test.name}`);
        console.log('-'.repeat(30));
        
        try {
            const html = await makeRequest(BASE_URL + test.url);
            
            if (test.testType === 'episode_preview') {
                const results = await testEpisodePreviewInteractions(html);
                if (!results.allPassed) allTestsPassed = false;
            } else if (test.testType === 'full_map') {
                const results = await testFullMapInteractions(html);
                if (!results.allPassed) allTestsPassed = false;
            }
            
        } catch (error) {
            console.log(`❌ Failed to fetch ${test.url}: ${error.message}`);
            allTestsPassed = false;
        }
    }
    
    // Overall results
    console.log('\n🏆 COMPREHENSIVE TEST RESULTS');
    console.log('='.repeat(50));
    console.log(`📊 Overall Status: ${allTestsPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    return allTestsPassed;
}

async function testEpisodePreviewInteractions(html) {
    const results = {
        allPassed: true,
        details: {}
    };
    
    console.log('📍 Episode Preview Interaction Tests:');
    
    // 1. Test map disambiguation system availability
    const hasMapModalScript = html.includes('map-modal-fix.js');
    const hasDisambiguationFunction = html.includes('showMapDisambiguationModal');
    const hasSiteData = html.includes('window.allCharacters') && html.includes('window.allLore');
    
    console.log(`   Map modal script loaded: ${hasMapModalScript ? '✅' : '❌'}`);
    console.log(`   Disambiguation function: ${hasDisambiguationFunction ? '✅' : '❌'}`);
    console.log(`   Site data available: ${hasSiteData ? '✅' : '❌'}`);
    
    results.details.mapModalScript = hasMapModalScript;
    results.details.disambiguationFunction = hasDisambiguationFunction;
    results.details.siteData = hasSiteData;
    
    if (!hasMapModalScript || !hasDisambiguationFunction || !hasSiteData) {
        results.allPassed = false;
    }
    
    // 2. Test click handler restoration
    const hasClickHandlers = html.includes('element.onclick = function');
    // Look for the actual patterns in the generated code
    const hasLocationId = html.includes('element.getAttribute') && html.includes('data-location');
    const preventsDefault = html.includes('preventDefault()');
    
    console.log(`   Click handlers restored: ${hasClickHandlers ? '✅' : '❌'}`);
    console.log(`   Location ID extraction: ${hasLocationId ? '✅' : '❌'}`);
    console.log(`   Event prevention: ${preventsDefault ? '✅' : '❌'}`);
    
    results.details.clickHandlers = hasClickHandlers;
    results.details.locationId = hasLocationId;
    results.details.preventsDefault = preventsDefault;
    
    if (!hasClickHandlers || !hasLocationId || !preventsDefault) {
        results.allPassed = false;
    }
    
    // 3. Test hover behavior
    const hasHoverEffects = html.includes('mouseenter');
    const hasTooltips = html.includes('setAttribute') && html.includes('title');
    const hasCursorPointer = html.includes('cursor') && html.includes('pointer');
    
    console.log(`   Hover effects: ${hasHoverEffects ? '✅' : '❌'}`);
    console.log(`   Tooltips: ${hasTooltips ? '✅' : '❌'}`);
    console.log(`   Pointer cursor: ${hasCursorPointer ? '✅' : '❌'}`);
    
    results.details.hoverEffects = hasHoverEffects;
    results.details.tooltips = hasTooltips;
    results.details.cursorPointer = hasCursorPointer;
    
    if (!hasHoverEffects || !hasTooltips || !hasCursorPointer) {
        results.allPassed = false;
    }
    
    // 4. Test that container click handler was removed
    const noContainerClick = !html.includes('previewContainer.addEventListener("click"');
    const hasContainerComment = html.includes('Individual location clicks now handled');
    
    console.log(`   Container click removed: ${noContainerClick ? '✅' : '❌'}`);
    console.log(`   Explanatory comment: ${hasContainerComment ? '✅' : '❌'}`);
    
    results.details.containerClickRemoved = noContainerClick;
    results.details.explanatoryComment = hasContainerComment;
    
    if (!noContainerClick || !hasContainerComment) {
        results.allPassed = false;
    }
    
    // 5. Test auto-zoom still works
    const hasAutoZoom = html.includes('Auto-zoomed to region');
    const hasBoundingBox = html.includes('calculateBoundingBox');
    
    console.log(`   Auto-zoom preserved: ${hasAutoZoom ? '✅' : '❌'}`);
    console.log(`   Bounding box function: ${hasBoundingBox ? '✅' : '❌'}`);
    
    results.details.autoZoom = hasAutoZoom;
    results.details.boundingBox = hasBoundingBox;
    
    if (!hasAutoZoom || !hasBoundingBox) {
        results.allPassed = false;
    }
    
    return results;
}

async function testFullMapInteractions(html) {
    const results = {
        allPassed: true,
        details: {}
    };
    
    console.log('🗺️ Full Map Interaction Tests:');
    
    // 1. Test map disambiguation system
    const hasMapModalScript = html.includes('map-modal-fix.js');
    const hasDisambiguationFunction = html.includes('showMapDisambiguationModal');
    const hasSiteData = html.includes('window.allCharacters') && html.includes('window.allLore');
    
    console.log(`   Map modal script: ${hasMapModalScript ? '✅' : '❌'}`);  
    console.log(`   Disambiguation function: ${hasDisambiguationFunction ? '✅' : '❌'}`);
    console.log(`   Site data available: ${hasSiteData ? '✅' : '❌'}`);
    
    results.details.mapModalScript = hasMapModalScript;
    results.details.disambiguationFunction = hasDisambiguationFunction; 
    results.details.siteData = hasSiteData;
    
    if (!hasMapModalScript || !hasDisambiguationFunction || !hasSiteData) {
        results.allPassed = false;
    }
    
    // 2. Test clickable locations exist
    const hasDataLocations = html.includes('data-location=');
    const hasClickableElements = /data-location="[^"]+"/g.test(html);
    const locationCount = (html.match(/data-location="/g) || []).length;
    
    console.log(`   Has data-location attributes: ${hasDataLocations ? '✅' : '❌'}`);
    console.log(`   Clickable elements found: ${hasClickableElements ? '✅' : '❌'}`);
    console.log(`   Location count: ${locationCount > 0 ? '✅' : '❌'} (${locationCount} locations)`);
    
    results.details.dataLocations = hasDataLocations;
    results.details.clickableElements = hasClickableElements;
    results.details.locationCount = locationCount;
    
    if (!hasDataLocations || !hasClickableElements || locationCount === 0) {
        results.allPassed = false;
    }
    
    // 3. Test specific known locations
    const knownLocations = ['the-shire', 'ice-fortress', 'goblin-king-lair'];
    let foundLocations = 0;
    
    console.log('   Testing known locations:');
    for (const location of knownLocations) {
        const hasLocation = html.includes(`data-location="${location}"`);
        console.log(`      ${location}: ${hasLocation ? '✅' : '❌'}`);
        if (hasLocation) foundLocations++;
    }
    
    results.details.knownLocations = foundLocations;
    
    if (foundLocations < knownLocations.length) {
        results.allPassed = false;
    }
    
    return results;
}

// Enhanced test for specific interaction patterns
async function testSpecificLocationBehavior() {
    console.log('\n🎯 SPECIFIC LOCATION BEHAVIOR TEST');
    console.log('-'.repeat(30));
    
    try {
        const html = await makeRequest(BASE_URL + '/season/1/episode/8');
        
        // Extract JavaScript for pattern analysis
        const jsPattern = /element\.onclick = function\(e\)\s*{[\s\S]*?};/g;
        const clickHandlers = html.match(jsPattern);
        
        if (clickHandlers && clickHandlers.length > 0) {
            console.log('✅ Found click handler patterns:');
            clickHandlers.forEach((handler, index) => {
                const hasPreventDefault = handler.includes('preventDefault()');
                const hasStopPropagation = handler.includes('stopPropagation()');
                const hasModalCall = handler.includes('showMapDisambiguationModal');
                const hasLocationId = handler.includes('locationId');
                
                console.log(`   Handler ${index + 1}:`);
                console.log(`      preventDefault(): ${hasPreventDefault ? '✅' : '❌'}`);
                console.log(`      stopPropagation(): ${hasStopPropagation ? '✅' : '❌'}`);
                console.log(`      Modal call: ${hasModalCall ? '✅' : '❌'}`);
                console.log(`      Location ID: ${hasLocationId ? '✅' : '❌'}`);
            });
            
            return true;
        } else {
            console.log('❌ No click handler patterns found');
            return false;
        }
        
    } catch (error) {
        console.log('❌ Failed to test specific behavior:', error.message);
        return false;
    }
}

// Run all tests
async function runAllTests() {
    console.log('🚀 Starting Comprehensive Map Interaction Tests\\n');
    
    // Main test suite
    const mainResults = await testMapInteractions();
    
    // Specific behavior test
    const behaviorResults = await testSpecificLocationBehavior();
    
    // Final summary
    console.log('\\n📋 FINAL TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`Main Test Suite: ${mainResults ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Behavior Test: ${behaviorResults ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Overall Result: ${mainResults && behaviorResults ? '🎉 SUCCESS' : '💥 FAILURE'}`);
    
    console.log('\\n💡 Next Steps:');
    if (mainResults && behaviorResults) {
        console.log('   1. ✅ All interaction tests passed');
        console.log('   2. 🖱️ Manual testing recommended');
        console.log('   3. 🔍 Verify clicking locations navigates to lore pages');
        console.log('   4. ✨ Test hover tooltips and visual feedback');
    } else {
        console.log('   1. 🔧 Fix failing interaction components');
        console.log('   2. 🔄 Re-run tests after fixes');
        console.log('   3. 📝 Check browser console for JavaScript errors');
    }
    
    process.exit(mainResults && behaviorResults ? 0 : 1);
}

// Run if called directly
if (require.main === module) {
    runAllTests().catch(error => {
        console.error('❌ Test suite failed:', error);
        process.exit(1);
    });
}

module.exports = { testMapInteractions, testEpisodePreviewInteractions, testFullMapInteractions };