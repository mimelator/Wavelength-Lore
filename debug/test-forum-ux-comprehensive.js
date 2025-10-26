#!/usr/bin/env node

/**
 * Comprehensive Forum UX Validation Test
 * Tests all forum panels, data loading, and user experience elements
 */

const http = require('http');

console.log('🎯 Comprehensive Forum UX Validation Test');
console.log('==========================================\n');

/**
 * Make HTTP request to test endpoint
 */
function makeRequest(path, method = 'GET') {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: path,
            method: method,
            timeout: 10000
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: data
                });
            });
        });

        req.on('error', (error) => reject(error));
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.end();
    });
}

/**
 * Test forum home page panels and data
 */
async function testForumHomePage() {
    console.log('🏠 Testing Forum Home Page');
    console.log('---------------------------');
    
    try {
        const response = await makeRequest('/forum');
        
        if (response.statusCode !== 200) {
            console.log(`❌ Forum home failed to load: ${response.statusCode}`);
            return false;
        }

        const body = response.body;
        const results = {
            pageLoads: true,
            hasRecentPosts: body.includes('recent-posts') || body.includes('Recent Posts'),
            hasPopularPosts: body.includes('popular-posts') || body.includes('Popular Posts'),
            hasCategoryNavigation: body.includes('category') || body.includes('Categories'),
            hasSearchBox: body.includes('search') && body.includes('input'),
            hasCreatePostButton: body.includes('Create Post') || body.includes('create-post'),
            hasUserProfile: body.includes('profile') || body.includes('user-info'),
            hasForumStats: body.includes('stats') || body.includes('total'),
            hasNavigation: body.includes('forum-nav') || body.includes('navigation'),
            hasFooter: body.includes('footer')
        };

        console.log(`  ✅ Page loads: ${results.pageLoads}`);
        console.log(`  📝 Recent posts panel: ${results.hasRecentPosts ? '✅' : '❌'}`);
        console.log(`  🔥 Popular posts panel: ${results.hasPopularPosts ? '✅' : '❌'}`);
        console.log(`  📁 Category navigation: ${results.hasCategoryNavigation ? '✅' : '❌'}`);
        console.log(`  🔍 Search functionality: ${results.hasSearchBox ? '✅' : '❌'}`);
        console.log(`  ➕ Create post button: ${results.hasCreatePostButton ? '✅' : '❌'}`);
        console.log(`  👤 User profile area: ${results.hasUserProfile ? '✅' : '❌'}`);
        console.log(`  📊 Forum statistics: ${results.hasForumStats ? '✅' : '❌'}`);
        console.log(`  🧭 Navigation menu: ${results.hasNavigation ? '✅' : '❌'}`);
        console.log(`  👣 Footer present: ${results.hasFooter ? '✅' : '❌'}`);

        return Object.values(results).every(Boolean);

    } catch (error) {
        console.log(`❌ Forum home test failed: ${error.message}`);
        return false;
    }
}

/**
 * Test forum data loading endpoints
 */
async function testForumDataEndpoints() {
    console.log('\n📊 Testing Forum Data Endpoints');
    console.log('--------------------------------');

    const endpoints = [
        { path: '/forum/api/posts/recent', name: 'Recent Posts API' },
        { path: '/forum/api/posts/popular', name: 'Popular Posts API' },
        { path: '/forum/api/categories', name: 'Categories API' },
        { path: '/forum/api/stats', name: 'Forum Stats API' }
    ];

    let allPass = true;

    for (const endpoint of endpoints) {
        try {
            console.log(`🔍 Testing: ${endpoint.name}`);
            const response = await makeRequest(endpoint.path);
            
            if (response.statusCode === 200) {
                try {
                    const data = JSON.parse(response.body);
                    console.log(`  ✅ ${endpoint.name}: Working`);
                    console.log(`  📦 Response keys: ${Object.keys(data).join(', ')}`);
                } catch (parseError) {
                    console.log(`  ⚠️ ${endpoint.name}: Non-JSON response`);
                }
            } else if (response.statusCode === 404) {
                console.log(`  ❌ ${endpoint.name}: Not implemented (404)`);
                allPass = false;
            } else {
                console.log(`  ❌ ${endpoint.name}: Error ${response.statusCode}`);
                allPass = false;
            }
        } catch (error) {
            console.log(`  ❌ ${endpoint.name}: ${error.message}`);
            allPass = false;
        }
    }

    return allPass;
}

/**
 * Test forum page navigation and consistency
 */
async function testForumPageConsistency() {
    console.log('\n🧭 Testing Forum Page Consistency');
    console.log('----------------------------------');

    const pages = [
        { path: '/forum', name: 'Home' },
        { path: '/forum/recent', name: 'Recent Posts' },
        { path: '/forum/popular', name: 'Popular Posts' },
        { path: '/forum/search', name: 'Search' },
        { path: '/forum/guidelines', name: 'Guidelines' },
        { path: '/forum/help', name: 'Help' },
        { path: '/forum/create', name: 'Create Post' }
    ];

    let allConsistent = true;

    for (const page of pages) {
        try {
            console.log(`🔍 Testing: ${page.name}`);
            const response = await makeRequest(page.path);
            
            if (response.statusCode === 200) {
                const body = response.body;
                const hasNavigation = body.includes('forum-nav') || body.includes('navigation');
                const hasFooter = body.includes('footer');
                const hasTitle = body.includes('<title>') && body.includes('Forum');
                
                console.log(`  ✅ ${page.name}: Loads successfully`);
                console.log(`  🧭 Navigation: ${hasNavigation ? '✅' : '❌'}`);
                console.log(`  👣 Footer: ${hasFooter ? '✅' : '❌'}`);
                console.log(`  📄 Title: ${hasTitle ? '✅' : '❌'}`);
                
                if (!hasNavigation || !hasFooter || !hasTitle) {
                    allConsistent = false;
                }
            } else {
                console.log(`  ❌ ${page.name}: Failed to load (${response.statusCode})`);
                allConsistent = false;
            }
        } catch (error) {
            console.log(`  ❌ ${page.name}: ${error.message}`);
            allConsistent = false;
        }
    }

    return allConsistent;
}

/**
 * Test forum integration with main site
 */
async function testForumIntegration() {
    console.log('\n🔗 Testing Forum Integration');
    console.log('-----------------------------');

    const integrationTests = [
        { path: '/character/lucky', name: 'Character Page', buttonText: 'Create a Post about this Hero' },
        { path: '/lore/the-shire', name: 'Lore Page', buttonText: 'Create a Post about this Lore' },
        { path: '/season/4/episode/2', name: 'Episode Page', buttonText: 'Create a Post for this Episode' }
    ];

    let allIntegrated = true;

    for (const test of integrationTests) {
        try {
            console.log(`🔍 Testing: ${test.name}`);
            const response = await makeRequest(test.path);
            
            if (response.statusCode === 200) {
                const hasForumButton = response.body.includes(test.buttonText) || 
                                     response.body.includes('forum/create') ||
                                     response.body.includes('Create Post');
                
                console.log(`  ✅ ${test.name}: Loads successfully`);
                console.log(`  🔗 Forum integration: ${hasForumButton ? '✅' : '❌'}`);
                
                if (!hasForumButton) {
                    allIntegrated = false;
                }
            } else {
                console.log(`  ❌ ${test.name}: Failed to load (${response.statusCode})`);
                allIntegrated = false;
            }
        } catch (error) {
            console.log(`  ❌ ${test.name}: ${error.message}`);
            allIntegrated = false;
        }
    }

    return allIntegrated;
}

/**
 * Run all forum UX tests
 */
async function runComprehensiveForumTests() {
    console.log('🚀 Starting Comprehensive Forum UX Tests...\n');

    const results = {
        homePage: await testForumHomePage(),
        dataEndpoints: await testForumDataEndpoints(),
        pageConsistency: await testForumPageConsistency(),
        integration: await testForumIntegration()
    };

    console.log('\n📋 Test Results Summary');
    console.log('=======================');
    console.log(`🏠 Forum Home Page: ${results.homePage ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`📊 Data Endpoints: ${results.dataEndpoints ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`🧭 Page Consistency: ${results.pageConsistency ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`🔗 Site Integration: ${results.integration ? '✅ PASS' : '❌ FAIL'}`);

    const overallPass = Object.values(results).every(Boolean);
    console.log(`\n🎯 Overall Result: ${overallPass ? '✅ ALL TESTS PASS' : '❌ SOME TESTS FAILED'}`);

    if (!overallPass) {
        console.log('\n🔧 Issues Found:');
        if (!results.homePage) console.log('  - Forum home page missing panels or data');
        if (!results.dataEndpoints) console.log('  - Forum API endpoints not working');
        if (!results.pageConsistency) console.log('  - Forum pages missing navigation/footer');
        if (!results.integration) console.log('  - Forum integration buttons missing from content pages');
    }

    console.log('\n🌐 Test URLs:');
    console.log('  Forum Home: http://localhost:3001/forum');
    console.log('  Recent Posts: http://localhost:3001/forum/recent');
    console.log('  Search: http://localhost:3001/forum/search');
    console.log('  Guidelines: http://localhost:3001/forum/guidelines');

    return overallPass;
}

// Run the tests
runComprehensiveForumTests().catch(error => {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
});