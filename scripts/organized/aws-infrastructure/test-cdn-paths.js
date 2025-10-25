#!/usr/bin/env node

/**
 * CDN Path Validation Test - Standalone
 * Tests image and asset paths using the CloudFront CDN without starting a server
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const CDN_URL = 'https://df5sj8f594cdx.cloudfront.net';

async function testCDNPaths() {
    console.log('🌐 CDN PATH VALIDATION TEST');
    console.log('===========================');
    console.log(`📍 Server: ${BASE_URL}`);
    console.log(`📡 CDN: ${CDN_URL}`);
    console.log('');

    const results = {
        serverStatus: false,
        cdnImages: { working: 0, broken: 0, tested: [] },
        staticAssets: { working: 0, broken: 0, tested: [] },
        pageLoading: { working: 0, broken: 0, tested: [] }
    };

    try {
        // Test 1: Server connectivity
        console.log('🔍 Testing server connectivity...');
        try {
            const response = await axios.get(BASE_URL, { timeout: 5000 });
            if (response.status === 200) {
                console.log('   ✅ Server is responding');
                results.serverStatus = true;
            }
        } catch (error) {
            console.log('   ❌ Server is not responding:', error.message);
            return results;
        }

        // Test 2: CDN Image paths
        console.log('');
        console.log('🖼️  Testing CDN image paths...');
        const testImages = [
            '/images/characters/lucky/lucky_profile.jpg',
            '/images/characters/goblin-king/goblin_king_profile.jpg',
            '/images/lore/goblin-king/goblin_king_throne.jpg',
            '/images/season1/episode1/forest_entrance.jpg',
            '/images/season2/episode8/lucky_village.jpg'
        ];

        for (const imagePath of testImages) {
            const cdnUrl = `${CDN_URL}${imagePath}`;
            try {
                const response = await axios.head(cdnUrl, { timeout: 10000 });
                if (response.status === 200) {
                    console.log(`   ✅ ${imagePath}`);
                    results.cdnImages.working++;
                } else {
                    console.log(`   ❌ ${imagePath} (Status: ${response.status})`);
                    results.cdnImages.broken++;
                }
            } catch (error) {
                console.log(`   ❌ ${imagePath} (${error.response?.status || 'Network Error'})`);
                results.cdnImages.broken++;
            }
            results.cdnImages.tested.push(imagePath);
        }

        // Test 3: Static assets through CDN
        console.log('');
        console.log('📁 Testing static assets through CDN...');
        const testAssets = [
            '/css/styles.css',
            '/css/modal_styles.css',
            '/js/map-modal-fix.js',
            '/images/favicon.svg'
        ];

        for (const assetPath of testAssets) {
            const cdnUrl = `${CDN_URL}${assetPath}`;
            try {
                const response = await axios.head(cdnUrl, { timeout: 10000 });
                if (response.status === 200) {
                    console.log(`   ✅ ${assetPath}`);
                    results.staticAssets.working++;
                } else {
                    console.log(`   ❌ ${assetPath} (Status: ${response.status})`);
                    results.staticAssets.broken++;
                }
            } catch (error) {
                console.log(`   ❌ ${assetPath} (${error.response?.status || 'Network Error'})`);
                results.staticAssets.broken++;
            }
            results.staticAssets.tested.push(assetPath);
        }

        // Test 4: Page loading with CDN assets
        console.log('');
        console.log('📄 Testing page loading with CDN assets...');
        const testPages = [
            '/',
            '/map',
            '/characters',
            '/lore',
            '/episodes'
        ];

        for (const pagePath of testPages) {
            const pageUrl = `${BASE_URL}${pagePath}`;
            try {
                const response = await axios.get(pageUrl, { timeout: 10000 });
                if (response.status === 200) {
                    console.log(`   ✅ ${pagePath}`);
                    results.pageLoading.working++;
                } else {
                    console.log(`   ❌ ${pagePath} (Status: ${response.status})`);
                    results.pageLoading.broken++;
                }
            } catch (error) {
                console.log(`   ❌ ${pagePath} (${error.response?.status || 'Network Error'})`);
                results.pageLoading.broken++;
            }
            results.pageLoading.tested.push(pagePath);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }

    // Summary
    console.log('');
    console.log('📊 CDN VALIDATION SUMMARY:');
    console.log(`   🖼️  CDN Images: ${results.cdnImages.working}/${results.cdnImages.tested.length} working`);
    console.log(`   📁 Static Assets: ${results.staticAssets.working}/${results.staticAssets.tested.length} working`);
    console.log(`   📄 Page Loading: ${results.pageLoading.working}/${results.pageLoading.tested.length} working`);
    
    const totalWorking = results.cdnImages.working + results.staticAssets.working + results.pageLoading.working;
    const totalTested = results.cdnImages.tested.length + results.staticAssets.tested.length + results.pageLoading.tested.length;
    
    console.log(`   🎯 Overall: ${totalWorking}/${totalTested} (${Math.round(totalWorking/totalTested*100)}%)`);
    
    if (totalWorking === totalTested) {
        console.log('   🎉 CDN configuration is working perfectly!');
    } else {
        console.log('   ⚠️  Some CDN paths may need attention');
    }

    return results;
}

// Run the test
testCDNPaths();