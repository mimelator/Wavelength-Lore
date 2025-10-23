#!/usr/bin/env node

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const axios = require('axios');

async function testPrintifyAPI() {
    const token = process.env.PRINTIFY_API_TOKEN;
    console.log('🔑 API Token Status:');
    console.log(`   Length: ${token ? token.length : 0} characters`);
    console.log(`   Starts with: ${token ? token.substring(0, 20) + '...' : 'undefined'}`);
    
    if (!token) {
        console.log('❌ No API token found');
        return;
    }
    
    const baseURL = 'https://api.printify.com/v1';
    console.log(`\n🌐 Testing API Base URL: ${baseURL}`);
    
    // Test with curl-like request to get more detailed error info
    try {
        const response = await axios({
            method: 'GET',
            url: `${baseURL}/shops.json`,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'User-Agent': 'Wavelength-Lore/1.0'
            },
            timeout: 10000,
            validateStatus: () => true // Don't throw on non-2xx status
        });
        
        console.log(`\n📊 Response Details:`);
        console.log(`   Status: ${response.status} ${response.statusText}`);
        console.log(`   Headers: ${JSON.stringify(response.headers, null, 2)}`);
        console.log(`   Data: ${JSON.stringify(response.data, null, 2).substring(0, 200)}...`);
        
        if (response.status === 200) {
            console.log('✅ API access successful!');
        } else if (response.status === 401) {
            console.log('❌ Authentication failed - token may be invalid or expired');
        } else if (response.status === 403) {
            console.log('❌ Access forbidden - token may lack required permissions');
        } else if (response.status === 404) {
            console.log('❌ Endpoint not found - API structure may have changed');
        }
        
    } catch (error) {
        console.error('❌ Request failed:', error.message);
        if (error.code === 'ENOTFOUND') {
            console.log('   Network issue: Cannot reach api.printify.com');
        }
    }
}

testPrintifyAPI();