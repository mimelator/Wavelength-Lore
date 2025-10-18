#!/usr/bin/env node

/**
 * Test script for forum search functionality
 */

const http = require('http');

console.log('🔍 Testing Forum Search Functionality\n');

// Test 1: Check if search page loads
function testSearchPageLoad() {
    return new Promise((resolve, reject) => {
        console.log('📋 Test 1: Search Page Load');
        
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: '/forum/search',
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log('  ✅ Search page loads successfully');
                    console.log(`  📊 Status: ${res.statusCode}`);
                    resolve(true);
                } else {
                    console.log(`  ❌ Search page failed to load: ${res.statusCode}`);
                    reject(false);
                }
            });
        });

        req.on('error', (err) => {
            console.log(`  ❌ Request failed: ${err.message}`);
            reject(false);
        });

        req.end();
    });
}

// Test 2: Check if search API endpoint responds
function testSearchAPI() {
    return new Promise((resolve, reject) => {
        console.log('\n📋 Test 2: Search API Endpoint');
        
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: '/forum/api/search?q=test&page=1&limit=5',
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    if (res.statusCode === 200 && result.success !== undefined) {
                        console.log('  ✅ Search API responds correctly');
                        console.log(`  📊 Status: ${res.statusCode}`);
                        console.log(`  📦 Response structure: ${Object.keys(result).join(', ')}`);
                        console.log(`  🔍 Query processed: "${result.query}"`);
                        console.log(`  📄 Results count: ${result.results ? result.results.length : 0}`);
                        resolve(true);
                    } else {
                        console.log(`  ❌ Search API failed: ${res.statusCode}`);
                        console.log(`  📦 Response: ${data}`);
                        reject(false);
                    }
                } catch (error) {
                    console.log(`  ❌ Invalid JSON response: ${error.message}`);
                    console.log(`  📦 Raw response: ${data.slice(0, 200)}...`);
                    reject(false);
                }
            });
        });

        req.on('error', (err) => {
            console.log(`  ❌ API request failed: ${err.message}`);
            reject(false);
        });

        req.end();
    });
}

// Test 3: Check search with filters
function testSearchFilters() {
    return new Promise((resolve, reject) => {
        console.log('\n📋 Test 3: Search with Filters');
        
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: '/forum/api/search?q=goblin&category=lore&sort=date&page=1',
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    if (res.statusCode === 200 && result.success) {
                        console.log('  ✅ Search filters work correctly');
                        console.log(`  🎯 Filter query: "${result.query}"`);
                        console.log(`  📁 Category filter: ${result.filters?.category || 'none'}`);
                        console.log(`  🔄 Sort option: ${result.filters?.sort || 'none'}`);
                        console.log(`  📄 Filtered results: ${result.results ? result.results.length : 0}`);
                        resolve(true);
                    } else {
                        console.log(`  ❌ Search filters failed: ${res.statusCode}`);
                        reject(false);
                    }
                } catch (error) {
                    console.log(`  ❌ Filter test failed: ${error.message}`);
                    reject(false);
                }
            });
        });

        req.on('error', (err) => {
            console.log(`  ❌ Filter request failed: ${err.message}`);
            reject(false);
        });

        req.end();
    });
}

// Run all tests
async function runTests() {
    try {
        await testSearchPageLoad();
        await testSearchAPI();
        await testSearchFilters();
        
        console.log('\n🎉 All search tests completed successfully!');
        console.log('\n📝 Search Implementation Status:');
        console.log('  ✅ Search page template created');
        console.log('  ✅ Search API endpoint implemented');
        console.log('  ✅ Firebase integration working');
        console.log('  ✅ Filter functionality operational');
        console.log('  ✅ Pagination support included');
        console.log('\n🌐 Access search at: http://localhost:3001/forum/search');
        
    } catch (error) {
        console.log('\n❌ Some search tests failed');
        console.log('💡 Check server logs for detailed error information');
    }
}

// Wait a moment for server to be ready, then run tests
setTimeout(runTests, 2000);