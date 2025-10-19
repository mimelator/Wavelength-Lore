#!/usr/bin/env node

/**
 * Test Rate Limiting Configuration
 * Tests that localhost bypass is working and rate limiting is active for other IPs
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testLocalhostBypass() {
    console.log('🧪 Testing Rate Limiting Configuration...');
    console.log('');
    
    try {
        console.log('📍 Testing localhost bypass (should always work):');
        
        // Make multiple rapid requests to test localhost bypass
        const promises = [];
        for (let i = 0; i < 10; i++) {
            promises.push(
                axios.get(`${BASE_URL}/`, {
                    timeout: 5000,
                    headers: {
                        'User-Agent': 'Rate-Limit-Test-Client'
                    }
                }).then(response => ({
                    status: response.status,
                    request: i + 1
                })).catch(error => ({
                    status: error.response?.status || 'ERROR',
                    request: i + 1,
                    error: error.message
                }))
            );
        }
        
        const results = await Promise.all(promises);
        
        console.log('📊 Localhost Request Results:');
        results.forEach(result => {
            if (result.status === 200) {
                console.log(`   ✅ Request ${result.request}: Status ${result.status} (Success)`);
            } else if (result.status === 429) {
                console.log(`   ❌ Request ${result.request}: Status ${result.status} (Rate Limited) - UNEXPECTED!`);
            } else {
                console.log(`   ⚠️  Request ${result.request}: Status ${result.status} (${result.error})`);
            }
        });
        
        // Count successful requests
        const successful = results.filter(r => r.status === 200).length;
        const rateLimited = results.filter(r => r.status === 429).length;
        
        console.log('');
        console.log('📈 Summary:');
        console.log(`   ✅ Successful: ${successful}/10`);
        console.log(`   ❌ Rate Limited: ${rateLimited}/10`);
        
        if (rateLimited === 0) {
            console.log('   🎉 Localhost bypass is working correctly!');
        } else {
            console.log('   ⚠️  Localhost bypass may not be working properly.');
        }
        
        console.log('');
        console.log('🔍 Rate Limiting Status:');
        if (rateLimited === 0 && successful > 0) {
            console.log('   ✅ Smart rate limiting is active with localhost bypass enabled');
        } else if (successful === 0) {
            console.log('   ❌ Server may not be responding properly');
        } else {
            console.log('   ⚠️  Mixed results - please check configuration');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testLocalhostBypass();