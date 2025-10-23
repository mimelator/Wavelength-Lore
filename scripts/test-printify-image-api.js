#!/usr/bin/env node

/**
 * Test Printify Image API endpoints
 * Quick test to identify image upload/retrieval issues
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const axios = require('axios');

class PrintifyImageTester {
    constructor() {
        this.apiKey = process.env.PRINTIFY_API_TOKEN;
        this.baseURL = 'https://api.printify.com/v1';
        
        if (!this.apiKey) {
            throw new Error('PRINTIFY_API_TOKEN environment variable is required');
        }
        
        this.api = axios.create({
            baseURL: this.baseURL,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                'User-Agent': 'Wavelength-Lore/1.0'
            }
        });
    }
    
    async testShopsEndpoint() {
        console.log('🏪 Testing shops endpoint...');
        try {
            const response = await this.api.get('/shops.json');
            console.log(`✅ Found ${response.data.length} shops`);
            return response.data;
        } catch (error) {
            console.error(`❌ Shops test failed: ${error.response?.status} ${error.message}`);
            return [];
        }
    }
    
    async testUploadsEndpoint(shopId = null) {
        console.log('📁 Testing uploads endpoint...');
        
        const endpoints = [
            '/uploads.json',
            shopId ? `/shops/${shopId}/uploads.json` : null
        ].filter(Boolean);
        
        for (const endpoint of endpoints) {
            try {
                console.log(`   Trying: ${endpoint}`);
                const response = await this.api.get(endpoint);
                console.log(`   ✅ ${endpoint}: Found ${response.data.data?.length || response.data.length || 0} uploads`);
                return response.data;
            } catch (error) {
                console.log(`   ❌ ${endpoint}: ${error.response?.status} ${error.message}`);
            }
        }
        
        return null;
    }
    
    async testCatalogEndpoint() {
        console.log('📚 Testing catalog endpoints...');
        
        const endpoints = [
            '/catalog/blueprints.json',
            '/catalog/blueprints',
            '/blueprints.json',
            '/blueprints'
        ];
        
        for (const endpoint of endpoints) {
            try {
                console.log(`   Trying: ${endpoint}`);
                const response = await this.api.get(endpoint);
                console.log(`   ✅ ${endpoint}: Found ${response.data.length} blueprints`);
                return true;
            } catch (error) {
                console.log(`   ❌ ${endpoint}: ${error.response?.status} ${error.message}`);
            }
        }
        
        console.error('❌ All catalog endpoints failed');
        return false;
    }
    
    async run() {
        console.log('🧪 PRINTIFY IMAGE API TESTER');
        console.log('============================\n');
        
        // Test basic API access
        const catalogWorks = await this.testCatalogEndpoint();
        if (!catalogWorks) {
            console.log('❌ Basic API access failed. Check your PRINTIFY_API_TOKEN.');
            return;
        }
        
        // Test shops
        const shops = await this.testShopsEndpoint();
        const shopId = shops.length > 0 ? shops[0].id : null;
        
        if (shopId) {
            console.log(`🏪 Using shop ID: ${shopId} (${shops[0].title})`);
        }
        
        // Test uploads
        await this.testUploadsEndpoint(shopId);
        
        console.log('\n📊 SUMMARY:');
        console.log('• Basic API access: ✅ Working');
        console.log(`• Shops available: ${shops.length > 0 ? '✅' : '❌'} ${shops.length} shops`);
        console.log('• Upload endpoints: Check results above');
        console.log('\n💡 Next steps:');
        console.log('1. If uploads fail, check Printify account permissions');
        console.log('2. Verify shop is properly configured in Printify dashboard');
        console.log('3. Try uploading an image manually in Printify to test account');
    }
}

async function main() {
    try {
        const tester = new PrintifyImageTester();
        await tester.run();
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

if (require.main === module) {
    main().catch(console.error);
}