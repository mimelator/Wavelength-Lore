#!/usr/bin/env node

/**
 * DEBUG 403 ERROR TEST
 * 
 * This test diagnoses the 403 error occurring in batch-product-preview-builder.js
 * Following the methodology: BUILD/ENHANCE THE TEST -> RUN THE TEST -> FIX THE CODE
 */

require('dotenv').config();

async function debug403Error() {
    console.log('\n🔍 DEBUG: 403 ERROR IN PRODUCT PREVIEW BUILDER');
    console.log('==============================================\n');

    try {
        // Test 1: Check Printify API credentials
        console.log('1️⃣ Testing Printify API credentials...');
        const axios = require('axios');
        
        const printifyConfig = {
            baseURL: process.env.PRINTIFY_API_URL || 'https://api.printify.com/v1',
            headers: {
                'Authorization': `Bearer ${process.env.PRINTIFY_API_TOKEN}`,
                'Content-Type': 'application/json'
            }
        };

        console.log(`   Base URL: ${printifyConfig.baseURL}`);
        console.log(`   Token present: ${!!process.env.PRINTIFY_API_TOKEN}`);
        console.log(`   Shop ID: ${process.env.PRINTIFY_SHOP_ID}`);

        // Test 2: Try a simple API call
        console.log('\n2️⃣ Testing basic API access...');
        try {
            const response = await axios.get(`${printifyConfig.baseURL}/shops.json`, {
                headers: printifyConfig.headers
            });
            console.log(`   ✅ Basic API access: ${response.status}`);
            console.log(`   Shops found: ${response.data?.length || 0}`);
        } catch (error) {
            console.log(`   ❌ Basic API failed: ${error.response?.status} - ${error.response?.statusText}`);
            console.log(`   Error details: ${error.response?.data?.message || error.message}`);
        }

        // Test 3: Try accessing blueprints
        console.log('\n3️⃣ Testing blueprint access...');
        try {
            const response = await axios.get(`${printifyConfig.baseURL}/catalog/blueprints.json`, {
                headers: printifyConfig.headers
            });
            console.log(`   ✅ Blueprint access: ${response.status}`);
            console.log(`   Blueprints found: ${response.data?.length || 0}`);
        } catch (error) {
            console.log(`   ❌ Blueprint access failed: ${error.response?.status} - ${error.response?.statusText}`);
            console.log(`   Error details: ${error.response?.data?.message || error.message}`);
        }

        // Test 4: Try creating a product (the failing operation)
        console.log('\n4️⃣ Testing product creation...');
        try {
            const testProduct = {
                title: "Test Product - Debug 403",
                description: "Test product for debugging 403 error",
                blueprint_id: 5, // Unisex Cotton Crew Tee
                print_provider_id: 1, // Marco Fine Arts
                variants: [
                    {
                        id: 17887, // Small, Black
                        price: 2000, // $20.00
                        is_enabled: true
                    }
                ],
                print_areas: [
                    {
                        variant_ids: [17887],
                        placeholders: [
                            {
                                position: "front",
                                images: [
                                    {
                                        id: "test-image-id",
                                        x: 0.5,
                                        y: 0.5,
                                        scale: 1,
                                        angle: 0
                                    }
                                ]
                            }
                        ]
                    }
                ]
            };

            const response = await axios.post(
                `${printifyConfig.baseURL}/shops/${process.env.PRINTIFY_SHOP_ID}/products.json`,
                testProduct,
                { headers: printifyConfig.headers }
            );
            console.log(`   ✅ Product creation: ${response.status}`);
            console.log(`   Product ID: ${response.data?.id}`);
            
            // Clean up test product
            if (response.data?.id) {
                await axios.delete(
                    `${printifyConfig.baseURL}/shops/${process.env.PRINTIFY_SHOP_ID}/products/${response.data.id}.json`,
                    { headers: printifyConfig.headers }
                );
                console.log(`   🗑️ Test product cleaned up`);
            }
        } catch (error) {
            console.log(`   ❌ Product creation failed: ${error.response?.status} - ${error.response?.statusText}`);
            console.log(`   Error details: ${JSON.stringify(error.response?.data, null, 2)}`);
            
            // Analyze the specific error
            if (error.response?.status === 403) {
                console.log('\n🔍 403 ERROR ANALYSIS:');
                console.log('   Possible causes:');
                console.log('   - Invalid or expired API token');
                console.log('   - Insufficient permissions for shop operations');
                console.log('   - Shop ID mismatch');
                console.log('   - API endpoint requires different authentication');
                console.log('   - Rate limiting or account restrictions');
            }
        }

        // Test 5: Check available shops and find correct shop ID
        console.log('\n5️⃣ Finding correct shop ID...');
        try {
            const shopsResponse = await axios.get(`${printifyConfig.baseURL}/shops.json`, {
                headers: printifyConfig.headers
            });
            console.log(`   Available shops: ${shopsResponse.data?.length || 0}`);
            
            if (shopsResponse.data && shopsResponse.data.length > 0) {
                const shop = shopsResponse.data[0];
                console.log(`   ✅ Found shop: ${shop.title} (ID: ${shop.id})`);
                console.log(`   Configured shop ID: ${process.env.PRINTIFY_SHOP_ID}`);
                console.log(`   Shop ID match: ${shop.id == process.env.PRINTIFY_SHOP_ID ? '✅' : '❌'}`);
                
                // Test access to the actual shop
                try {
                    const shopResponse = await axios.get(
                        `${printifyConfig.baseURL}/shops/${shop.id}.json`,
                        { headers: printifyConfig.headers }
                    );
                    console.log(`   ✅ Shop access: ${shopResponse.status}`);
                } catch (shopError) {
                    console.log(`   ❌ Shop access failed: ${shopError.response?.status}`);
                }
            }
        } catch (error) {
            console.log(`   ❌ Shop listing failed: ${error.response?.status} - ${error.response?.statusText}`);
        }

        // Test 6: Check image upload requirements
        console.log('\n6️⃣ Testing image upload for product creation...');
        try {
            // Create a simple test image
            const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');
            
            const formData = new FormData();
            const { Blob } = require('buffer');
            formData.append('file', new Blob([testImageBuffer]), 'test.png');
            
            const uploadResponse = await axios.post(
                `${printifyConfig.baseURL}/uploads/images.json`,
                formData,
                { 
                    headers: {
                        ...printifyConfig.headers,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            
            console.log(`   ✅ Image upload: ${uploadResponse.status}`);
            console.log(`   Image ID: ${uploadResponse.data?.id}`);
            
            if (uploadResponse.data?.id) {
                console.log('   🎯 Now testing product creation with valid image...');
                
                const testProduct = {
                    title: "Test Product - Debug Fix",
                    description: "Test product with valid image",
                    blueprint_id: 5,
                    print_provider_id: 1,
                    variants: [
                        {
                            id: 17887,
                            price: 2000,
                            is_enabled: true
                        }
                    ],
                    print_areas: [
                        {
                            variant_ids: [17887],
                            placeholders: [
                                {
                                    position: "front",
                                    images: [
                                        {
                                            id: uploadResponse.data.id,
                                            x: 0.5,
                                            y: 0.5,
                                            scale: 1,
                                            angle: 0
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                };

                const shopsResponse = await axios.get(`${printifyConfig.baseURL}/shops.json`, {
                    headers: printifyConfig.headers
                });
                const actualShopId = shopsResponse.data[0]?.id;

                const productResponse = await axios.post(
                    `${printifyConfig.baseURL}/shops/${actualShopId}/products.json`,
                    testProduct,
                    { headers: printifyConfig.headers }
                );
                
                console.log(`   ✅ Product creation with valid image: ${productResponse.status}`);
                console.log(`   Product ID: ${productResponse.data?.id}`);
                
                // Clean up
                if (productResponse.data?.id) {
                    await axios.delete(
                        `${printifyConfig.baseURL}/shops/${actualShopId}/products/${productResponse.data.id}.json`,
                        { headers: printifyConfig.headers }
                    );
                    console.log(`   🗑️ Test product cleaned up`);
                }
            }
            
        } catch (error) {
            console.log(`   ❌ Image upload/product creation failed: ${error.response?.status} - ${error.response?.statusText}`);
            if (error.response?.data) {
                console.log(`   Error details: ${JSON.stringify(error.response.data, null, 2)}`);
            }
        }

    } catch (error) {
        console.error('❌ Test setup failed:', error.message);
    }

    console.log('\n📊 DIAGNOSIS COMPLETE');
    console.log('====================');
    console.log('Check the results above to identify the root cause of the 403 error.');
}

if (require.main === module) {
    debug403Error();
}

module.exports = { debug403Error };