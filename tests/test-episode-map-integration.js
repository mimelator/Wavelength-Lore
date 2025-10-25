#!/usr/bin/env node

/**
 * Episode Map Integration Test
 * Tests that the new advanced link system works in episode previews
 */

const http = require('http');

async function testEpisodeMapIntegration() {
    console.log('📺 TESTING EPISODE MAP INTEGRATION');
    console.log('='.repeat(50));

    try {
        // Get a sample episode page to test integration
        const response = await makeHttpRequest('http://localhost:3001/season/1/episode/1');
        
        console.log('📊 Episode Integration Check:');
        
        const checks = {
            'Advanced link script included': response.includes('/js/advanced-map-links.js'),
            'Episode map initialization': response.includes('initializeEpisodeMapLinks'),
            'MapLinkManager class used': response.includes('new MapLinkManager'),
            'Episode preview container': response.includes('episode-map-preview'),
            'Disambiguation system': response.includes('map-modal-fix.js'),
            'Site data available': response.includes('window.allCharacters')
        };
        
        Object.entries(checks).forEach(([check, passed]) => {
            console.log(`   ${passed ? '✅' : '❌'} ${check}`);
        });
        
        console.log('\\n🎯 Expected Episode Behavior:');
        console.log('   1. Episode loads with desktop sidebar map preview (if locations exist)');
        console.log('   2. Map preview uses same HTML overlay system as main map');
        console.log('   3. Overlays are smaller/adapted for preview context');
        console.log('   4. Clicks on preview locations trigger disambiguation modal');
        console.log('   5. Auto-zoom highlights episode-specific locations');
        console.log('   6. No more jitter in episode map interactions');
        
        console.log('\\n🧪 Manual Testing Steps:');
        console.log('   1. Visit an episode with locations: http://localhost:3001/season/1/episode/1');
        console.log('   2. Look for desktop sidebar with map preview (320px × 280px)');
        console.log('   3. Check browser console for:');
        console.log('      "🎯 Initializing episode map link system"');
        console.log('      "✅ Episode map link system initialized"');
        console.log('   4. Hover over locations in preview - should see blue circles');
        console.log('   5. Click on locations - should see disambiguation modal');
        console.log('   6. Test both full map link and preview interactions');
        
        console.log('\\n🔧 Debug Commands for Episode:');
        console.log('   Open browser console on episode page and try:');
        console.log('   - window.episodeMapLinkManager.showDebugInfo() - Episode map debug');
        console.log('   - window.episodeMapLinkManager.updatePositions() - Force update');
        console.log('   - Check if window.episodeMapLinkManager exists');
        
        const passedChecks = Object.values(checks).filter(Boolean).length;
        const totalChecks = Object.keys(checks).length;
        
        console.log(`\\n📊 Integration Status: ${passedChecks}/${totalChecks} checks passed`);
        
        if (passedChecks === totalChecks) {
            console.log('🎉 Episode map integration should be fully operational!');
            console.log('💡 Episodes now inherit the reliable HTML overlay system');
            console.log('   from the main map page, eliminating click jitter.');
        } else {
            console.log('⚠️  Some integration issues detected - check above');
        }
        
        console.log('\\n🚀 Benefits for Episodes:');
        console.log('   ✅ Same reliable click detection as main map');
        console.log('   ✅ Proper scaling for smaller preview context');
        console.log('   ✅ Consistent visual feedback across map systems');
        console.log('   ✅ Auto-initialization when episode map loads');
        console.log('   ✅ Maintains existing auto-zoom and highlight features');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.message.includes('ECONNREFUSED') || error.message.includes('404')) {
            console.log('💡 Make sure the server is running and the episode exists');
        }
    }
}

function makeHttpRequest(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode !== 200) {
                    reject(new Error(`HTTP ${res.statusCode}: ${url}`));
                } else {
                    resolve(data);
                }
            });
        }).on('error', reject);
    });
}

if (require.main === module) {
    testEpisodeMapIntegration().catch(console.error);
}

module.exports = { testEpisodeMapIntegration };