#!/usr/bin/env node

/**
 * Comprehensive Static Resources Summary
 * Provides a controlled validation of static resources
 */

const fetch = require('node-fetch');

const testRoutes = [
    '/',
    '/character/andrew',
    '/lore/goblin',
    '/season/1/episode/1',
    '/characters',
    '/lore',
    '/map',
    '/forum',
    '/about'
];

const staticAssetTypes = {
    css: ['styles.css', 'lore_styles.css', 'modal_styles.css', 'carousel.css', 'character_styles.css'],
    js: ['map-modal-fix.js', 'forum.js'],
    icons: ['favicon.svg', 'episode-icon.svg']
};

async function validateStaticResources() {
    console.log('🧪 Comprehensive Static Resources Validation\n');
    
    // Test direct static asset access
    console.log('📁 Testing Direct Static Asset Access:');
    let totalAssets = 0;
    let workingAssets = 0;
    
    for (const [type, assets] of Object.entries(staticAssetTypes)) {
        console.log(`\n   ${type.toUpperCase()}:`);
        for (const asset of assets) {
            const url = `http://localhost:3001/static/${type === 'icons' ? 'icons' : type}/${asset}`;
            try {
                const response = await fetch(url, { method: 'HEAD' });
                const status = response.status;
                totalAssets++;
                
                if (status === 200) {
                    console.log(`   ✅ ${asset}: ${status}`);
                    workingAssets++;
                } else {
                    console.log(`   ❌ ${asset}: ${status}`);
                }
            } catch (error) {
                console.log(`   ❌ ${asset}: Error`);
                totalAssets++;
            }
        }
    }
    
    // Test a sample of pages for embedded resources
    console.log(`\n🌐 Testing Embedded Resources on Sample Pages:`);
    let pagesWorking = 0;
    
    for (const route of testRoutes.slice(0, 5)) { // Test first 5 to avoid overwhelming
        try {
            const response = await fetch(`http://localhost:3001${route}`);
            if (response.status === 200) {
                console.log(`   ✅ ${route}: Page loads successfully`);
                pagesWorking++;
            } else {
                console.log(`   ❌ ${route}: ${response.status}`);
            }
        } catch (error) {
            console.log(`   ❌ ${route}: Error loading`);
        }
    }
    
    console.log(`\n📊 Static Resources Summary:`);
    console.log(`   📁 Direct Assets: ${workingAssets}/${totalAssets} working (${Math.round(workingAssets/totalAssets*100)}%)`);
    console.log(`   🌐 Page Loading: ${pagesWorking}/${testRoutes.slice(0, 5).length} working (${Math.round(pagesWorking/testRoutes.slice(0, 5).length*100)}%)`);
}

validateStaticResources().catch(console.error);