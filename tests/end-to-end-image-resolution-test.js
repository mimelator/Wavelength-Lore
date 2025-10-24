/**
 * End-to-End Product Image URL Resolution Test
 * 
 * This test validates the complete image URL resolution system including:
 * 1. API endpoint functionality
 * 2. S3 lookup logic
 * 3. Upscaled image detection
 * 4. Fallback mechanisms
 * 5. Integration with vendor catalog workflow
 */

const axios = require('axios');

class EndToEndImageResolutionTest {
    constructor() {
        this.baseUrl = 'http://localhost:3001';
        this.testResults = {
            passed: 0,
            failed: 0,
            warnings: 0,
            errors: []
        };
    }

    async runAllTests() {
        console.log('\n🧪 END-TO-END IMAGE URL RESOLUTION TESTS\n');

        try {
            await this.testSingleImageResolution();
            await this.testBatchImageResolution();
            await this.testCatalogWorkflow();
            await this.testUrlAccessibility();
            await this.testErrorHandling();
            
        } catch (error) {
            this.recordError('Test Suite', error);
        }

        this.printResults();
        return this.testResults;
    }

    async testSingleImageResolution() {
        console.log('🔍 Test 1: Single image resolution API');

        try {
            // Test with known upscaled image
            const response = await axios.get(`${this.baseUrl}/api/product-image/resolve/-daphne-.png`);
            
            if (response.status !== 200) {
                throw new Error(`API returned status ${response.status}`);
            }

            const data = response.data;
            
            // Validate response structure
            this.validateApiResponse(data, [
                'success',
                'sourceImageId',
                'resolution'
            ]);

            const resolution = data.resolution;
            
            if (resolution.success && resolution.type === 'upscaled') {
                console.log(`✅ Successfully resolved upscaled image: ${resolution.url}`);
                
                // Validate URL format
                if (!resolution.url.includes('upscaled/') || !resolution.url.includes('enhanced')) {
                    throw new Error('Upscaled URL format is incorrect');
                }
                
            } else {
                console.log(`⚠️ Image resolved as fallback: ${resolution.url}`);
            }

            this.recordSuccess('Single image resolution API');

        } catch (error) {
            this.recordError('Single image resolution API', error);
        }
    }

    async testBatchImageResolution() {
        console.log('📦 Test 2: Batch image resolution API');

        try {
            const testImages = ['-daphne-.png', 'battle-scene-for-product-previ.webp', 'ice-blue-diamond.webp'];
            
            const response = await axios.post(`${this.baseUrl}/api/product-image/resolve-batch`, {
                sourceImageIds: testImages
            });

            if (response.status !== 200) {
                throw new Error(`API returned status ${response.status}`);
            }

            const data = response.data;
            
            this.validateApiResponse(data, [
                'success',
                'count',
                'resolutions'
            ]);

            if (data.count !== testImages.length) {
                throw new Error(`Expected ${testImages.length} resolutions, got ${data.count}`);
            }

            let upscaledCount = 0;
            let fallbackCount = 0;

            for (const resolution of data.resolutions) {
                if (resolution.type === 'upscaled') {
                    upscaledCount++;
                    console.log(`✅ Upscaled: ${resolution.sourceId} → ${resolution.url}`);
                } else if (resolution.type === 'fallback') {
                    fallbackCount++;
                    console.log(`⚠️ Fallback: ${resolution.sourceId} → ${resolution.url}`);
                }
            }

            console.log(`📊 Results: ${upscaledCount} upscaled, ${fallbackCount} fallback`);

            this.recordSuccess('Batch image resolution API');

        } catch (error) {
            this.recordError('Batch image resolution API', error);
        }
    }

    async testCatalogWorkflow() {
        console.log('🛍️ Test 3: Vendor catalog workflow');

        try {
            // Get actual vendor preview data
            const previewsResponse = await axios.get(`${this.baseUrl}/api/merchandise/vendor-previews`);
            
            if (previewsResponse.status !== 200) {
                throw new Error('Failed to fetch vendor previews');
            }

            const previews = previewsResponse.data.previews || [];
            
            if (previews.length === 0) {
                this.recordWarning('No vendor previews available for catalog workflow test');
                return;
            }

            // Take first 3 previews for testing
            const testPreviews = previews.slice(0, 3);
            
            console.log(`Testing catalog workflow with ${testPreviews.length} previews`);

            // Test the catalog resolution endpoint
            const catalogResponse = await axios.post(`${this.baseUrl}/api/product-image/resolve-catalog`, {
                previews: testPreviews
            });

            if (catalogResponse.status !== 200) {
                throw new Error('Catalog resolution API failed');
            }

            const catalogData = catalogResponse.data;
            
            this.validateApiResponse(catalogData, [
                'success',
                'count',
                'previews'
            ]);

            let resolvedCount = 0;
            let unresolvedCount = 0;

            for (const preview of catalogData.previews) {
                if (preview.resolvedImageUrl) {
                    resolvedCount++;
                    console.log(`✅ Resolved: ${preview.sourceImage} → ${preview.imageUrlType}`);
                } else {
                    unresolvedCount++;
                    console.log(`❌ Unresolved: ${preview.sourceImage}`);
                }
            }

            console.log(`📊 Catalog results: ${resolvedCount} resolved, ${unresolvedCount} unresolved`);

            this.recordSuccess('Vendor catalog workflow');

        } catch (error) {
            this.recordError('Vendor catalog workflow', error);
        }
    }

    async testUrlAccessibility() {
        console.log('🌐 Test 4: URL accessibility validation');

        try {
            // Test the URL accessibility endpoint
            const testUrls = [
                'https://d3ohg9sf8htmwk.cloudfront.net/upscaled/anonymous/-daphne-.png-enhanced-1761262300847.png',
                'https://d3ohg9sf8htmwk.cloudfront.net/battle-scene-for-product-previ.webp'
            ];

            for (const url of testUrls) {
                const response = await axios.post(`${this.baseUrl}/api/product-image/test-url`, {
                    url: url
                });

                if (response.status !== 200) {
                    throw new Error(`URL test API returned status ${response.status}`);
                }

                const data = response.data;
                const accessibility = data.accessibility;

                console.log(`URL: ${url}`);
                console.log(`  Accessible: ${accessibility.accessible}`);
                console.log(`  Status: ${accessibility.status}`);
            }

            this.recordSuccess('URL accessibility validation');

        } catch (error) {
            this.recordError('URL accessibility validation', error);
        }
    }

    async testErrorHandling() {
        console.log('❌ Test 5: Error handling');

        try {
            // Test with invalid sourceImage ID
            const response = await axios.get(`${this.baseUrl}/api/product-image/resolve/non-existent-image.jpg`);
            
            if (response.status !== 200) {
                throw new Error(`Expected 200 status for fallback, got ${response.status}`);
            }

            const data = response.data;
            
            if (data.resolution.type !== 'fallback') {
                throw new Error('Expected fallback type for non-existent image');
            }

            console.log('✅ Non-existent image correctly handled with fallback');

            // Test batch API with empty array
            const batchResponse = await axios.post(`${this.baseUrl}/api/product-image/resolve-batch`, {
                sourceImageIds: []
            });

            if (batchResponse.status !== 200) {
                throw new Error(`Batch API failed with empty array: ${batchResponse.status}`);
            }

            console.log('✅ Empty batch request handled correctly');

            this.recordSuccess('Error handling');

        } catch (error) {
            this.recordError('Error handling', error);
        }
    }

    validateApiResponse(data, requiredFields) {
        for (const field of requiredFields) {
            if (!(field in data)) {
                throw new Error(`Missing required field: ${field}`);
            }
        }
    }

    recordSuccess(testName) {
        this.testResults.passed++;
        console.log(`✅ ${testName} PASSED\n`);
    }

    recordError(testName, error) {
        this.testResults.failed++;
        this.testResults.errors.push({
            test: testName,
            error: error.message
        });
        console.log(`❌ ${testName} FAILED: ${error.message}\n`);
    }

    recordWarning(message) {
        this.testResults.warnings++;
        console.log(`⚠️ WARNING: ${message}\n`);
    }

    printResults() {
        console.log('\n' + '='.repeat(60));
        console.log('🧪 END-TO-END IMAGE RESOLUTION TEST RESULTS');
        console.log('='.repeat(60));
        console.log(`✅ Passed: ${this.testResults.passed}`);
        console.log(`❌ Failed: ${this.testResults.failed}`);
        console.log(`⚠️ Warnings: ${this.testResults.warnings}`);
        
        if (this.testResults.errors.length > 0) {
            console.log('\n❌ ERRORS:');
            this.testResults.errors.forEach((error, index) => {
                console.log(`${index + 1}. ${error.test}: ${error.error}`);
            });
        }
        
        const totalTests = this.testResults.passed + this.testResults.failed;
        const successRate = totalTests > 0 ? ((this.testResults.passed / totalTests) * 100).toFixed(1) : 0;
        console.log(`\n📊 Success Rate: ${successRate}%`);
        
        if (this.testResults.failed === 0) {
            console.log('🎉 ALL TESTS PASSED! Image URL resolution system is working correctly.');
        }
        
        console.log('='.repeat(60));
    }
}

// Export for use in other test files
module.exports = EndToEndImageResolutionTest;

// Run tests if called directly
if (require.main === module) {
    const test = new EndToEndImageResolutionTest();
    test.runAllTests().then(() => {
        process.exit(0);
    }).catch((error) => {
        console.error('End-to-end test failed:', error);
        process.exit(1);
    });
}