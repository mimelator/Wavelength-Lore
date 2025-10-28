#!/usr/bin/env node
require('dotenv').config();
const https = require('https');

/**
 * WAVELENGTH IMAGE UPLOAD DIAGNOSTICS
 * ==================================
 * 
 * Testing different approaches to image upload for Printify API
 */

class ImageUploadDiagnostics {
    constructor() {
        this.apiToken = process.env.PRINTIFY_API_TOKEN;
        this.baseUrl = 'https://api.printify.com/v1';
        
        console.log('🌊 WAVELENGTH IMAGE UPLOAD DIAGNOSTICS');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔍 Testing different image upload approaches');
        console.log('');
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

    async testImageUploadMethod1() {
        console.log('🧪 Method 1: Direct base64 upload');
        
        // Minimal valid PNG as base64
        const minimalPng = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9aIhzIwAAAABJRU5ErkJggg==';
        
        const uploadData = {
            file_name: 'test.png',
            contents: minimalPng
        };

        console.log('   📋 Payload:', JSON.stringify(uploadData, null, 2));

        try {
            const response = await this.makeApiRequest('/uploads/images.json', 'POST', uploadData);
            console.log(`   📊 Status: ${response.status}`);
            console.log('   📄 Response:', JSON.stringify(response.data, null, 2));
            return response.status === 200 || response.status === 201 ? response.data.id : null;
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
            return null;
        }
    }

    async testImageUploadMethod2() {
        console.log('\n🧪 Method 2: Data URL format');
        
        const minimalPng = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9aIhzIwAAAABJRU5ErkJggg==';
        
        const uploadData = {
            file_name: 'test.png',
            contents: `data:image/png;base64,${minimalPng}`
        };

        console.log('   📋 Payload:', JSON.stringify(uploadData, null, 2));

        try {
            const response = await this.makeApiRequest('/uploads/images.json', 'POST', uploadData);
            console.log(`   📊 Status: ${response.status}`);
            console.log('   📄 Response:', JSON.stringify(response.data, null, 2));
            return response.status === 200 || response.status === 201 ? response.data.id : null;
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
            return null;
        }
    }

    async testImageUploadMethod3() {
        console.log('\n🧪 Method 3: URL-based upload');
        
        const uploadData = {
            url: 'https://via.placeholder.com/100x100.png'
        };

        console.log('   📋 Payload:', JSON.stringify(uploadData, null, 2));

        try {
            const response = await this.makeApiRequest('/uploads/images.json', 'POST', uploadData);
            console.log(`   📊 Status: ${response.status}`);
            console.log('   📄 Response:', JSON.stringify(response.data, null, 2));
            return response.status === 200 || response.status === 201 ? response.data.id : null;
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
            return null;
        }
    }

    async checkExistingImages() {
        console.log('\n🧪 Checking existing uploaded images');
        
        try {
            const response = await this.makeApiRequest('/uploads.json');
            console.log(`   📊 Status: ${response.status}`);
            
            if (response.status === 200 && response.data.data) {
                console.log(`   📊 Found ${response.data.data.length} existing images`);
                if (response.data.data.length > 0) {
                    const sample = response.data.data[0];
                    console.log('   📋 Sample image:', JSON.stringify(sample, null, 2));
                    return sample.id;
                }
            } else {
                console.log('   📄 Response:', JSON.stringify(response.data, null, 2));
            }
            return null;
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
            return null;
        }
    }

    async runDiagnostics() {
        console.log('🚀 Starting image upload diagnostics...\n');
        
        // Check if we have existing images we can reuse
        const existingImageId = await this.checkExistingImages();
        
        if (existingImageId) {
            console.log(`\n✅ SOLUTION: Use existing image ID ${existingImageId}`);
            console.log('   We can skip image upload and use existing images!');
            return existingImageId;
        }
        
        // Test different upload methods
        let imageId = await this.testImageUploadMethod1();
        if (imageId) {
            console.log(`\n✅ Method 1 SUCCESS: Image ID ${imageId}`);
            return imageId;
        }
        
        imageId = await this.testImageUploadMethod2();
        if (imageId) {
            console.log(`\n✅ Method 2 SUCCESS: Image ID ${imageId}`);
            return imageId;
        }
        
        imageId = await this.testImageUploadMethod3();
        if (imageId) {
            console.log(`\n✅ Method 3 SUCCESS: Image ID ${imageId}`);
            return imageId;
        }
        
        console.log('\n❌ All upload methods failed');
        return null;
    }
}

// Run the diagnostics
if (require.main === module) {
    const diagnostics = new ImageUploadDiagnostics();
    diagnostics.runDiagnostics().catch(error => {
        console.error('🚨 Diagnostics error:', error);
        process.exit(1);
    });
}

module.exports = ImageUploadDiagnostics;