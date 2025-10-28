#!/usr/bin/env node
require('dotenv').config();
const https = require('https');

/**
 * WAVELENGTH VARIANTS DEBUG
 * ========================
 * 
 * Debug what the variants API actually returns
 */

class VariantsDebug {
    constructor() {
        this.apiToken = process.env.PRINTIFY_API_TOKEN;
        this.baseUrl = 'https://api.printify.com/v1';
        
        console.log('🌊 WAVELENGTH VARIANTS DEBUG');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

    async makeApiRequest(endpoint, method = 'GET', data = null) {
        return new Promise((resolve, reject) => {
            const url = `${this.baseUrl}${endpoint}`;
            const options = {
                method,
                headers: {
                    'Authorization': `Bearer ${this.apiToken}`,
                    'Content-Type': 'application/json'
                }
            };

            const req = https.request(url, options, (res) => {
                let responseData = '';
                res.on('data', chunk => responseData += chunk);
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(responseData);
                        resolve({ status: res.statusCode, data: parsed, headers: res.headers });
                    } catch (error) {
                        resolve({ status: res.statusCode, data: responseData, headers: res.headers });
                    }
                });
            });

            req.on('error', error => reject(error));
            
            if (data) {
                req.write(JSON.stringify(data));
            }
            
            req.end();
        });
    }

    async debugVariants() {
        console.log('🔍 Testing Mug 11oz variants (68-1)...');
        
        try {
            const response = await this.makeApiRequest('/catalog/blueprints/68/print_providers/1/variants.json');
            
            console.log(`📊 Status: ${response.status}`);
            console.log('📄 Raw response type:', typeof response.data);
            console.log('📄 Raw response:', JSON.stringify(response.data, null, 2));
            
            if (Array.isArray(response.data)) {
                console.log(`✅ Response is array with ${response.data.length} items`);
            } else if (response.data && typeof response.data === 'object') {
                console.log('📋 Response is object with keys:', Object.keys(response.data));
                
                // Check if it has data property
                if (response.data.data && Array.isArray(response.data.data)) {
                    console.log(`✅ Found data array with ${response.data.data.length} items`);
                }
            }
            
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
    }
}

// Run the debug
const debug = new VariantsDebug();
debug.debugVariants();