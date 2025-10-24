#!/usr/bin/env node
/**
 * SIMPLIFIED API-Only Preview Builder
 * 
 * Uses ONLY existing tested APIs - no complex services that require configuration
 * Reuses existing endpoints exactly as they are
 */

const axios = require('axios');

class SimplifiedAPIBuilder {
    constructor() {
        this.runId = `simplified-${Date.now()}`;
        this.baseUrl = 'http://localhost:3001';
        
        console.log('🚀 SIMPLIFIED API-ONLY BUILDER');
        console.log('==============================');
        console.log('Run ID:', this.runId);
        console.log('✅ Uses ONLY existing tested endpoints');
        console.log('✅ No complex service dependencies');
    }

    /**
     * Test vendor preview catalog endpoint
     */
    async testVendorPreviewCatalog() {
        console.log('\n📋 TESTING VENDOR PREVIEW CATALOG');
        console.log('=================================');

        try {
            console.log('🎯 GET /api/merchandise/vendor-previews');
            
            const response = await axios.get(`${this.baseUrl}/api/merchandise/vendor-previews`);
            
            if (response.status === 200 && response.data.success) {
                const { previews, count } = response.data;
                console.log(`✅ Catalog endpoint works: ${count} previews found`);
                
                if (previews && previews.length > 0) {
                    console.log('📦 Sample previews:');
                    previews.slice(0, 3).forEach((preview, idx) => {
                        console.log(`   ${idx + 1}. ${preview.productId || preview.id} - ${preview.title || 'No title'}`);
                    });
                }
                
                return {
                    success: true,
                    endpoint: '/api/merchandise/vendor-previews',
                    count: count,
                    previews: previews
                };
            } else {
                throw new Error('Invalid response structure');
            }

        } catch (error) {
            console.error('❌ Vendor preview catalog test failed:', error.message);
            return {
                success: false,
                endpoint: '/api/merchandise/vendor-previews',
                error: error.message
            };
        }
    }

    /**
     * Test individual vendor preview endpoint
     */
    async testVendorPreviewDetail(productId) {
        console.log('\n🔍 TESTING VENDOR PREVIEW DETAIL');
        console.log('================================');

        try {
            console.log(`🎯 GET /api/merchandise/vendor-preview/${productId}`);
            
            const response = await axios.get(`${this.baseUrl}/api/merchandise/vendor-preview/${productId}`);
            
            if (response.status === 200 && response.data.success) {
                const product = response.data.product;
                console.log(`✅ Detail endpoint works for: ${product.title || 'Unknown'}`);
                console.log(`📸 Images: ${product.images?.length || 0}`);
                console.log(`🎨 Variants: ${product.variants?.length || 0}`);
                
                return {
                    success: true,
                    endpoint: `/api/merchandise/vendor-preview/${productId}`,
                    productId: productId,
                    product: product
                };
            } else {
                throw new Error('Invalid detail response');
            }

        } catch (error) {
            console.error(`❌ Detail test failed for ${productId}:`, error.message);
            return {
                success: false,
                endpoint: `/api/merchandise/vendor-preview/${productId}`,
                productId: productId,
                error: error.message
            };
        }
    }

    /**
     * Test general merchandise endpoints
     */
    async testMerchandiseEndpoints() {
        console.log('\n🛍️ TESTING MERCHANDISE ENDPOINTS');
        console.log('===============================');

        const endpoints = [
            '/api/merchandise/products'
        ];

        const results = [];

        for (const endpoint of endpoints) {
            try {
                console.log(`🎯 Testing ${endpoint}`);
                
                const response = await axios.get(`${this.baseUrl}${endpoint}`);
                
                if (response.status === 200) {
                    console.log(`✅ ${endpoint} responds correctly`);
                    results.push({
                        success: true,
                        endpoint: endpoint,
                        status: response.status
                    });
                } else {
                    console.log(`⚠️ ${endpoint} returned status ${response.status}`);
                    results.push({
                        success: false,
                        endpoint: endpoint,
                        status: response.status
                    });
                }

            } catch (error) {
                console.error(`❌ ${endpoint} failed:`, error.message);
                results.push({
                    success: false,
                    endpoint: endpoint,
                    error: error.message
                });
            }
        }

        return results;
    }

    /**
     * Run comprehensive API test using ONLY tested endpoints
     */
    async runAPITest() {
        console.log('\n🧪 COMPREHENSIVE API-ONLY TEST');
        console.log('==============================\n');

        const results = {
            runId: this.runId,
            timestamp: new Date().toISOString(),
            tests: [],
            overallSuccess: true,
            endpointsCovered: []
        };

        // Test 1: Vendor preview catalog
        console.log('Test 1: Vendor Preview Catalog');
        const catalogResult = await this.testVendorPreviewCatalog();
        results.tests.push({
            name: 'Vendor Preview Catalog',
            success: catalogResult.success,
            endpoint: catalogResult.endpoint,
            details: catalogResult
        });

        if (catalogResult.success) {
            results.endpointsCovered.push(catalogResult.endpoint);

            // Test 2: Test detail for first preview if available
            if (catalogResult.previews && catalogResult.previews.length > 0) {
                const firstPreview = catalogResult.previews[0];
                const testId = firstPreview.productId || firstPreview.id;
                
                if (testId) {
                    console.log('\nTest 2: Vendor Preview Detail');
                    const detailResult = await this.testVendorPreviewDetail(testId);
                    results.tests.push({
                        name: 'Vendor Preview Detail',
                        success: detailResult.success,
                        endpoint: detailResult.endpoint,
                        details: detailResult
                    });

                    if (detailResult.success) {
                        results.endpointsCovered.push(detailResult.endpoint);
                    } else {
                        results.overallSuccess = false;
                    }
                }
            }
        } else {
            results.overallSuccess = false;
        }

        // Test 3: General merchandise endpoints
        console.log('\nTest 3: General Merchandise Endpoints');
        const merchandiseResults = await this.testMerchandiseEndpoints();
        merchandiseResults.forEach(result => {
            results.tests.push({
                name: `Merchandise API ${result.endpoint}`,
                success: result.success,
                endpoint: result.endpoint,
                details: result
            });

            if (result.success) {
                results.endpointsCovered.push(result.endpoint);
            } else {
                results.overallSuccess = false;
            }
        });

        // Report results
        console.log('\n🎯 API TEST RESULTS');
        console.log('==================');
        console.log(`Run ID: ${results.runId}`);
        console.log(`Overall Success: ${results.overallSuccess ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`Tests Passed: ${results.tests.filter(t => t.success).length}/${results.tests.length}`);
        console.log(`Endpoints Covered: ${results.endpointsCovered.length}`);
        
        console.log('\n📋 Endpoints Tested:');
        results.endpointsCovered.forEach((endpoint, idx) => {
            console.log(`   ${idx + 1}. ${endpoint}`);
        });

        console.log('\n📊 Test Details:');
        results.tests.forEach((test, idx) => {
            const status = test.success ? '✅' : '❌';
            console.log(`   ${idx + 1}. ${status} ${test.name}`);
        });

        if (!results.overallSuccess) {
            console.log('\n⚠️ SOME TESTS FAILED - CHECK ENDPOINTS');
        } else {
            console.log('\n🎉 ALL API TESTS PASSED - ENDPOINTS WORKING');
        }

        return results;
    }
}

// Run the test if called directly
if (require.main === module) {
    (async () => {
        const builder = new SimplifiedAPIBuilder();
        const results = await builder.runAPITest();
        process.exit(results.overallSuccess ? 0 : 1);
    })().catch(error => {
        console.error('❌ Test runner failed:', error.message);
        process.exit(1);
    });
}

module.exports = SimplifiedAPIBuilder;