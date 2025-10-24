/**
 * Vendor Catalog Image Rendering Validation Test
 * 
 * This test validates that product preview images are rendering correctly
 * in the vendor catalog using the new ProductImageUrlResolver system.
 */

const axios = require('axios');
const { JSDOM } = require('jsdom');

class VendorCatalogImageValidationTest {
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
        console.log('\n🧪 VENDOR CATALOG IMAGE RENDERING VALIDATION\n');

        try {
            await this.testCatalogPageStructure();
            await this.testImageElements();
            await this.testClientScriptInclusion();
            await this.testDataAttributes();
            await this.testImageResolutionWorkflow();
            
        } catch (error) {
            this.recordError('Test Suite', error);
        }

        this.printResults();
        return this.testResults;
    }

    async testCatalogPageStructure() {
        console.log('🏗️ Test 1: Catalog page structure');

        try {
            const response = await axios.get(`${this.baseUrl}/admin/vendor-research/catalog`);
            
            if (response.status !== 200) {
                throw new Error(`Catalog page returned status ${response.status}`);
            }

            const html = response.data;
            
            // Basic structure checks
            if (!html.includes('<!DOCTYPE html>')) {
                throw new Error('Invalid HTML structure');
            }

            if (!html.includes('vendor-catalog') && !html.includes('product-card')) {
                throw new Error('Catalog structure not found');
            }

            console.log('✅ Page structure is valid');
            this.recordSuccess('Catalog page structure');

        } catch (error) {
            this.recordError('Catalog page structure', error);
        }
    }

    async testImageElements() {
        console.log('🖼️ Test 2: Image elements validation');

        try {
            const response = await axios.get(`${this.baseUrl}/admin/vendor-research/catalog`);
            const html = response.data;

            // Count product image previews
            const imagePreviewCount = (html.match(/product-image-preview/g) || []).length;
            const dataSourceImageCount = (html.match(/data-source-image=/g) || []).length;
            const loadingImageCount = (html.match(/data:image\/svg\+xml/g) || []).length;

            console.log(`📊 Found ${imagePreviewCount} product image previews`);
            console.log(`📊 Found ${dataSourceImageCount} data-source-image attributes`);
            console.log(`📊 Found ${loadingImageCount} loading placeholder images`);

            if (imagePreviewCount === 0) {
                throw new Error('No product image previews found');
            }

            if (dataSourceImageCount === 0) {
                throw new Error('No data-source-image attributes found');
            }

            if (loadingImageCount === 0) {
                throw new Error('No loading placeholders found');
            }

            // Check that we have the right structure
            if (dataSourceImageCount !== imagePreviewCount && dataSourceImageCount !== loadingImageCount) {
                console.log(`⚠️ Attribute count mismatch: ${imagePreviewCount} previews, ${dataSourceImageCount} attributes`);
            }

            this.recordSuccess('Image elements validation');

        } catch (error) {
            this.recordError('Image elements validation', error);
        }
    }

    async testClientScriptInclusion() {
        console.log('📜 Test 3: Client script inclusion');

        try {
            const response = await axios.get(`${this.baseUrl}/admin/vendor-research/catalog`);
            const html = response.data;

            // Check if client script is included
            if (!html.includes('product-image-url-client.js')) {
                throw new Error('Product image URL client script not included');
            }

            console.log('✅ Client script is included in page');

            // Test if script is accessible
            const scriptResponse = await axios.get(`${this.baseUrl}/js/product-image-url-client.js`);
            
            if (scriptResponse.status !== 200) {
                throw new Error(`Client script returned status ${scriptResponse.status}`);
            }

            if (!scriptResponse.data.includes('ProductImageUrlClient')) {
                throw new Error('Client script content is invalid');
            }

            console.log('✅ Client script is accessible and valid');
            this.recordSuccess('Client script inclusion');

        } catch (error) {
            this.recordError('Client script inclusion', error);
        }
    }

    async testDataAttributes() {
        console.log('🏷️ Test 4: Data attributes validation');

        try {
            const response = await axios.get(`${this.baseUrl}/admin/vendor-research/catalog`);
            const html = response.data;

            // Parse HTML with JSDOM for better testing
            const dom = new JSDOM(html);
            const document = dom.window.document;

            // Find all images with data-source-image
            const imageElements = document.querySelectorAll('img[data-source-image]');
            
            if (imageElements.length === 0) {
                throw new Error('No images with data-source-image attribute found');
            }

            console.log(`📸 Found ${imageElements.length} images with data-source-image`);

            // Validate each image element
            let validCount = 0;
            const sourceImages = new Set();

            imageElements.forEach((img, index) => {
                const sourceImage = img.getAttribute('data-source-image');
                
                if (!sourceImage) {
                    console.log(`❌ Image ${index + 1}: Missing data-source-image value`);
                    return;
                }

                if (sourceImage === 'Unknown') {
                    console.log(`⚠️ Image ${index + 1}: sourceImage is 'Unknown'`);
                    return;
                }

                sourceImages.add(sourceImage);
                validCount++;
                
                console.log(`✅ Image ${index + 1}: ${sourceImage}`);
            });

            console.log(`📊 Valid images: ${validCount}/${imageElements.length}`);
            console.log(`📊 Unique source images: ${sourceImages.size}`);

            if (validCount === 0) {
                throw new Error('No valid data-source-image attributes found');
            }

            this.recordSuccess('Data attributes validation');

        } catch (error) {
            this.recordError('Data attributes validation', error);
        }
    }

    async testImageResolutionWorkflow() {
        console.log('🔄 Test 5: Image resolution workflow simulation');

        try {
            // Get a few sample sourceImages from the catalog
            const response = await axios.get(`${this.baseUrl}/admin/vendor-research/catalog`);
            const html = response.data;

            // Extract sourceImage values
            const sourceImageMatches = html.match(/data-source-image="([^"]+)"/g) || [];
            const sourceImages = sourceImageMatches
                .map(match => match.match(/data-source-image="([^"]+)"/)[1])
                .filter(img => img && img !== 'Unknown')
                .slice(0, 3); // Test with first 3

            if (sourceImages.length === 0) {
                throw new Error('No valid sourceImages found for testing');
            }

            console.log(`🔍 Testing image resolution for: ${sourceImages.join(', ')}`);

            // Test that the resolution API works for these images
            const resolutionResponse = await axios.post(`${this.baseUrl}/api/product-image/resolve-batch`, {
                sourceImageIds: sourceImages
            });

            if (resolutionResponse.status !== 200) {
                throw new Error(`Resolution API returned status ${resolutionResponse.status}`);
            }

            const resolutionData = resolutionResponse.data;

            if (!resolutionData.success || !resolutionData.resolutions) {
                throw new Error('Invalid resolution API response');
            }

            let resolvedCount = 0;
            let fallbackCount = 0;

            resolutionData.resolutions.forEach(resolution => {
                if (resolution.success) {
                    resolvedCount++;
                    console.log(`✅ Resolved: ${resolution.sourceId} → ${resolution.type}`);
                } else {
                    fallbackCount++;
                    console.log(`⚠️ Fallback: ${resolution.sourceId} → ${resolution.type}`);
                }
            });

            console.log(`📊 Resolution results: ${resolvedCount} resolved, ${fallbackCount} fallback`);

            if (resolvedCount + fallbackCount !== sourceImages.length) {
                throw new Error('Resolution count mismatch');
            }

            this.recordSuccess('Image resolution workflow simulation');

        } catch (error) {
            this.recordError('Image resolution workflow simulation', error);
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
        console.log('🧪 VENDOR CATALOG IMAGE VALIDATION RESULTS');
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
            console.log('🎉 ALL TESTS PASSED! Vendor catalog images are properly configured for resolution.');
        } else {
            console.log('⚠️ Some tests failed. Check the errors above for details.');
        }
        
        console.log('='.repeat(60));
    }
}

// Export for use in other test files
module.exports = VendorCatalogImageValidationTest;

// Run tests if called directly
if (require.main === module) {
    const test = new VendorCatalogImageValidationTest();
    test.runAllTests().then(() => {
        process.exit(0);
    }).catch((error) => {
        console.error('Vendor catalog validation test failed:', error);
        process.exit(1);
    });
}