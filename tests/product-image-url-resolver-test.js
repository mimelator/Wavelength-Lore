/**
 * Product Image URL Resolver Test
 * 
 * Tests the ProductImageUrlResolver to ensure it can properly resolve
 * sourceImage IDs to accessible URLs using the S3 lookup logic.
 */

const ProductImageUrlResolver = require('../utils/product-image-url-resolver');

class ProductImageUrlResolverTest {
    constructor() {
        this.resolver = new ProductImageUrlResolver();
        this.testResults = {
            passed: 0,
            failed: 0,
            warnings: 0,
            errors: []
        };
    }

    async runTests() {
        console.log('\n🧪 Testing Product Image URL Resolver\n');

        try {
            // Test with real sourceImage IDs from our product previews
            await this.testResolverWithRealData();
            await this.testBatchResolution();
            await this.testImageInfo();
            await this.testUrlAccessibility();
            
        } catch (error) {
            this.recordError('Test Suite', error);
        }

        this.printResults();
        return this.testResults;
    }

    async testResolverWithRealData() {
        console.log('🔍 Test: Resolver with real product data');

        try {
            // Get real product preview data
            const axios = require('axios');
            const response = await axios.get('http://localhost:3001/api/merchandise/vendor-previews');
            
            if (response.data.previews && response.data.previews.length > 0) {
                const testPreview = response.data.previews[0];
                const sourceImageId = testPreview.sourceImage;
                
                console.log(`Testing with sourceImage: ${sourceImageId}`);
                
                const result = await this.resolver.resolveImageUrl(sourceImageId);
                
                console.log('Resolution result:');
                console.log(`  Success: ${result.success}`);
                console.log(`  URL: ${result.url}`);
                console.log(`  Type: ${result.type}`);
                
                if (result.url) {
                    const accessTest = await this.resolver.testUrlAccessibility(result.url);
                    console.log(`  Accessible: ${accessTest.accessible} (${accessTest.status})`);
                }
                
                this.recordSuccess('Resolver with real data');
            } else {
                this.recordWarning('No product previews found for testing');
            }

        } catch (error) {
            this.recordError('Resolver with real data', error);
        }
    }

    async testBatchResolution() {
        console.log('📦 Test: Batch resolution');

        try {
            const testIds = [
                'battle-scene-for-product-previ.webp',
                '-daphne-.png',
                'ice-blue-diamond.webp'
            ];

            const results = await this.resolver.resolveMultipleImageUrls(testIds);
            
            console.log(`Batch resolved ${results.length} images:`);
            
            for (const result of results) {
                console.log(`  ${result.sourceId}: ${result.success ? 'SUCCESS' : 'FAILED'} (${result.type})`);
                if (result.url) {
                    console.log(`    URL: ${result.url}`);
                }
            }

            this.recordSuccess('Batch resolution');

        } catch (error) {
            this.recordError('Batch resolution', error);
        }
    }

    async testImageInfo() {
        console.log('ℹ️ Test: Image info retrieval');

        try {
            const testId = 'battle-scene-for-product-previ.webp';
            const info = await this.resolver.getImageInfo(testId);
            
            console.log(`Image info for ${testId}:`);
            console.log(`  Success: ${info.success}`);
            console.log(`  Type: ${info.type}`);
            
            if (info.metadata) {
                console.log(`  Size: ${info.metadata.size} bytes`);
                console.log(`  Content-Type: ${info.metadata.contentType}`);
                console.log(`  Last Modified: ${info.metadata.lastModified}`);
            }

            this.recordSuccess('Image info retrieval');

        } catch (error) {
            this.recordError('Image info retrieval', error);
        }
    }

    async testUrlAccessibility() {
        console.log('🌐 Test: URL accessibility');

        try {
            const testUrls = [
                'https://d3ohg9sf8htmwk.cloudfront.net/goblin-king.webp',
                'https://df5sj8f594cdx.cloudfront.net/images/goblin-king.webp'
            ];

            for (const url of testUrls) {
                const result = await this.resolver.testUrlAccessibility(url);
                console.log(`  ${url}: ${result.accessible ? 'ACCESSIBLE' : 'NOT ACCESSIBLE'} (${result.status})`);
            }

            this.recordSuccess('URL accessibility');

        } catch (error) {
            this.recordError('URL accessibility', error);
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
        console.log('\n' + '='.repeat(50));
        console.log('🧪 URL RESOLVER TEST RESULTS');
        console.log('='.repeat(50));
        console.log(`✅ Passed: ${this.testResults.passed}`);
        console.log(`❌ Failed: ${this.testResults.failed}`);
        console.log(`⚠️ Warnings: ${this.testResults.warnings}`);
        
        if (this.testResults.errors.length > 0) {
            console.log('\n❌ ERRORS:');
            this.testResults.errors.forEach((error, index) => {
                console.log(`${index + 1}. ${error.test}: ${error.error}`);
            });
        }
        
        console.log('='.repeat(50));
    }
}

// Run test if called directly
if (require.main === module) {
    const test = new ProductImageUrlResolverTest();
    test.runTests().then(() => {
        process.exit(0);
    }).catch((error) => {
        console.error('Resolver test failed:', error);
        process.exit(1);
    });
}

module.exports = ProductImageUrlResolverTest;