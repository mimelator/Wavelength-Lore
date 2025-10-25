#!/usr/bin/env node

/**
 * Ice Fortress Link Debug Test
 * Specifically tests the ice-fortress click behavior
 */

const http = require('http');

async function debugIceFortressLink() {
    console.log('🏰 DEBUGGING ICE FORTRESS LINK');
    console.log('='.repeat(50));

    try {
        // Check if ice-fortress lore page exists
        console.log('📊 Ice Fortress Availability Check:');
        
        const checks = [
            { url: 'http://localhost:3001/lore/ice-fortress', name: 'Direct lore page' },
            { url: 'http://localhost:3001/map', name: 'Map page with click target' }
        ];
        
        for (const check of checks) {
            try {
                const response = await makeHttpRequest(check.url);
                const statusOk = response.length > 0;
                console.log(`   ${statusOk ? '✅' : '❌'} ${check.name}: ${statusOk ? 'Available' : 'Not found'}`);
                
                if (check.name === 'Direct lore page' && statusOk) {
                    // Check if the page contains expected content
                    const hasTitle = response.includes('Ice Fortress');
                    const hasDescription = response.includes('majestic fortress made of ice');
                    const hasImage = response.includes('/images/seasons/season3/');
                    
                    console.log(`      Title present: ${hasTitle ? '✅' : '❌'}`);
                    console.log(`      Description present: ${hasDescription ? '✅' : '❌'}`);
                    console.log(`      Image present: ${hasImage ? '✅' : '❌'}`);
                }
                
                if (check.name === 'Map page with click target' && statusOk) {
                    // Check if ice-fortress is in the disambiguation data
                    const hasClickTarget = response.includes('data-location="ice-fortress"');
                    const hasLoreData = response.includes('ice-fortress');
                    
                    console.log(`      Click target present: ${hasClickTarget ? '✅' : '❌'}`);
                    console.log(`      Lore data available: ${hasLoreData ? '✅' : '❌'}`);
                }
            } catch (error) {
                console.log(`   ❌ ${check.name}: Error - ${error.message}`);
            }
        }
        
        console.log('\\n🔍 Disambiguation System Check:');
        
        // Check if the disambiguation system has ice-fortress data
        const mapResponse = await makeHttpRequest('http://localhost:3001/map');
        
        // Look for the JavaScript data that gets passed to the page
        const hasAllLore = mapResponse.includes('window.allLore');
        const hasAllCharacters = mapResponse.includes('window.allCharacters');
        const hasAllEpisodes = mapResponse.includes('window.allEpisodes');
        
        console.log(`   Site data injection: ${hasAllLore && hasAllCharacters && hasAllEpisodes ? '✅' : '❌'}`);
        
        // Check if disambiguation function exists
        const hasDisambiguationFunction = mapResponse.includes('showMapDisambiguationModal');
        console.log(`   Disambiguation function: ${hasDisambiguationFunction ? '✅' : '❌'}`);
        
        console.log('\\n🧪 Manual Testing Steps:');
        console.log('   1. Visit http://localhost:3001/map');
        console.log('   2. Open browser console');
        console.log('   3. Click on Ice Fortress (upper left area)');
        console.log('   4. Look for console messages:');
        console.log('      "🎯 Location clicked: ice-fortress"');
        console.log('      "🎯 showMapDisambiguationModal called with locationId: ice-fortress"');
        console.log('   5. Check if disambiguation modal appears');
        console.log('   6. If modal appears, check if ice-fortress is listed as an option');
        
        console.log('\\n🔧 Debug Commands:');
        console.log('   In browser console, try:');
        console.log('   - showMapDisambiguationModal("ice-fortress") - Test modal directly');
        console.log('   - console.log(window.allLore.filter(l => l.id === "ice-fortress")) - Check data');
        console.log('   - debugMapLinks() - Show overlay debug info');
        
        console.log('\\n💡 Possible Issues:');
        console.log('   1. Ice Fortress might not be in the disambiguation data');
        console.log('   2. Click target might be covered by another element');
        console.log('   3. Modal might not have ice-fortress as an option');
        console.log('   4. Link generation might have an issue with the ice-fortress ID');
        
        console.log('\\n🎯 Expected Behavior:');
        console.log('   Click → Modal → "Ice Fortress" option → /lore/ice-fortress page');
        
    } catch (error) {
        console.error('❌ Debug failed:', error.message);
    }
}

function makeHttpRequest(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode !== 200) {
                    reject(new Error(`HTTP ${res.statusCode}`));
                } else {
                    resolve(data);
                }
            });
        }).on('error', reject);
    });
}

if (require.main === module) {
    debugIceFortressLink().catch(console.error);
}

module.exports = { debugIceFortressLink };