#!/usr/bin/env node

/**
 * Test script to verify admin authentication bypasses rate limiting
 */

const { initScriptEnv } = require('./utils/env-loader');

// Initialize environment
initScriptEnv(['ADMIN_SECRET_KEY']);

const axios = require('axios');

const BASE_URL = 'https://wavelengthlore.com';

async function testRateLimitBypass() {
    console.log('🧪 Testing Rate Limit Bypass with Admin Authentication\n');
    
    const adminKey = process.env.ADMIN_SECRET_KEY;
    if (!adminKey) {
        console.error('❌ ADMIN_SECRET_KEY not found in environment');
        process.exit(1);
    }
    
    console.log('🔑 Admin key configured');
    
    // Test multiple rapid requests to trigger rate limiting
    const testRoutes = [
        '/',
        '/about',
        '/map',
        '/gallery',
        '/character/Lucky'
    ];
    
    console.log(`📡 Making rapid requests to test rate limiting bypass...`);
    
    try {
        // Make rapid requests with admin authentication
        const promises = testRoutes.map(async (route, index) => {
            const url = `${BASE_URL}${route}`;
            console.log(`  ${index + 1}. Testing ${route}`);
            
            const response = await axios.get(url, {
                timeout: 15000,
                validateStatus: null,
                headers: {
                    'X-Admin-Key': adminKey,
                    'User-Agent': 'Mozilla/5.0 (compatible; Wavelength-Lore-AdminTest/1.0)'
                }
            });
            
            return {
                route,
                status: response.status,
                success: response.status === 200,
                rateLimited: response.status === 429
            };
        });
        
        const results = await Promise.all(promises);
        
        console.log('\n📊 Results:');
        results.forEach(result => {
            const icon = result.success ? '✅' : 
                        result.rateLimited ? '🚫' : '⚠️';
            console.log(`  ${icon} ${result.route}: ${result.status}`);
        });
        
        const rateLimited = results.filter(r => r.rateLimited).length;
        const successful = results.filter(r => r.success).length;
        
        console.log(`\n🎯 Summary:`);
        console.log(`  ✅ Successful requests: ${successful}/${results.length}`);
        console.log(`  🚫 Rate limited requests: ${rateLimited}/${results.length}`);
        
        if (rateLimited > 0) {
            console.log('\n❌ Admin bypass failed - requests were rate limited');
            process.exit(1);
        } else {
            console.log('\n🎉 Admin bypass successful - no rate limiting detected!');
            process.exit(0);
        }
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        process.exit(1);
    }
}

// Run the test
testRateLimitBypass();