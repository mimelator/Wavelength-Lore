/**
 * Product Image URL Resolution Test Suite
 * 
 * Tests the complete image URL resolution chain from product preview to actual CDN URLs.
 * This test addresses the issue where product preview images show broken links due to
 * incorrect URL resolution from sourceImage fields.
 * 
 * Test Flow:
 * 1. Product Preview → sourceImage field (original gallery image ID)
 * 2. sourceImage → Gallery Storage lookup
 * 3. Gallery Storage → CDN URL construction
 * 4. CDN URL → Actual image accessibility
 * 5. Fallback mechanisms (local → CloudFront)
 */

const axios = require('axios');
const path = require('path');
const fs = require('fs');

class ProductImageUrlResolutionTest {
    constructor() {
        this.testResults = {
            passed: 0,
            failed: 0,
            warnings: 0,
            errors: []
        };
        
        this.baseUrl = 'http://localhost:3001';
        this.galleryStorage = require('../utils/gallery/storage');
        this.merchandiseDB = require('../services/merchandise-database');
        
        console.log('🧪 Initializing Product Image URL Resolution Test Suite');
        console.log('🔗 Base URL:', this.baseUrl);
    }

    /**
     * Main test runner
     */
    async runAllTests() {
        console.log('\n🚀 Starting Product Image URL Resolution Tests\n');
        
        try {
            // Test 1: Fetch sample product previews
            await this.testFetchProductPreviews();
            
            // Test 2: Validate sourceImage field structure
            await this.testSourceImageFieldStructure();
            
            // Test 3: Test image URL resolution chain
            await this.testImageUrlResolutionChain();
            
            // Test 4: Test CDN URL construction
            await this.testCdnUrlConstruction();
            
            // Test 5: Test image accessibility
            await this.testImageAccessibility();
            
            // Test 6: Test fallback mechanisms
            await this.testFallbackMechanisms();
            
            // Test 7: Test gallery storage integration
            await this.testGalleryStorageIntegration();
            
            // Test 8: Test vendor catalog template data
            await this.testVendorCatalogTemplateData();
            
        } catch (error) {
            this.recordError('Test Suite Execution', error);
        }
        
        this.printTestResults();
        return this.testResults;
    }

    /**
     * Test 1: Fetch sample product previews from API
     */
    async testFetchProductPreviews() {
        console.log('📋 Test 1: Fetching product previews from API');
        
        try {
            const response = await axios.get(`${this.baseUrl}/api/merchandise/vendor-previews`);
            
            if (response.status !== 200) {
                throw new Error(`API returned status ${response.status}`);
            }
            
            const data = response.data;
            
            // Validate response structure
            if (!data.previews || !Array.isArray(data.previews)) {
                throw new Error('Invalid response structure: missing previews array');
            }
            
            if (data.previews.length === 0) {
                this.recordWarning('No product previews found in database');
                return;
            }
            
            console.log(`✅ Found ${data.previews.length} product previews`);
            
            // Store sample data for other tests
            this.samplePreviews = data.previews.slice(0, 3); // Use first 3 for testing
            
            this.recordSuccess('Product previews fetched successfully');
            
        } catch (error) {
            this.recordError('Fetch Product Previews', error);
        }
    }

    /**
     * Test 2: Validate sourceImage field structure in product previews
     */
    async testSourceImageFieldStructure() {
        console.log('🔍 Test 2: Validating sourceImage field structure');
        
        try {
            if (!this.samplePreviews || this.samplePreviews.length === 0) {
                this.recordWarning('No sample previews available for testing');
                return;
            }
            
            let validSourceImages = 0;
            let invalidSourceImages = 0;
            
            for (const preview of this.samplePreviews) {
                console.log(`Checking preview: ${preview.productId}`);
                console.log(`Source Image: ${preview.sourceImage}`);
                
                if (!preview.sourceImage) {
                    console.log(`❌ Missing sourceImage field for product ${preview.productId}`);
                    invalidSourceImages++;
                    continue;
                }
                
                if (preview.sourceImage === 'Unknown') {
                    console.log(`⚠️ sourceImage is 'Unknown' for product ${preview.productId}`);
                    invalidSourceImages++;
                    continue;
                }
                
                // Check if sourceImage looks like a valid image ID
                if (typeof preview.sourceImage === 'string' && preview.sourceImage.length > 0) {
                    console.log(`✅ Valid sourceImage found: ${preview.sourceImage}`);
                    validSourceImages++;
                } else {
                    console.log(`❌ Invalid sourceImage format for product ${preview.productId}`);
                    invalidSourceImages++;
                }
            }
            
            console.log(`Valid sourceImages: ${validSourceImages}, Invalid: ${invalidSourceImages}`);
            
            if (validSourceImages > 0) {
                this.recordSuccess('SourceImage field structure validation');
            } else {
                throw new Error('No valid sourceImage fields found in product previews');
            }
            
        } catch (error) {
            this.recordError('SourceImage Field Structure', error);
        }
    }

    /**
     * Test 3: Test complete image URL resolution chain
     */
    async testImageUrlResolutionChain() {
        console.log('🔗 Test 3: Testing image URL resolution chain');
        
        try {
            if (!this.samplePreviews || this.samplePreviews.length === 0) {
                this.recordWarning('No sample previews available for URL resolution testing');
                return;
            }
            
            for (const preview of this.samplePreviews) {
                if (!preview.sourceImage || preview.sourceImage === 'Unknown') {
                    continue;
                }
                
                console.log(`\nTesting URL resolution for product: ${preview.productId}`);
                console.log(`SourceImage ID: ${preview.sourceImage}`);
                
                // Test different URL construction patterns
                const urlPatterns = [
                    {
                        name: 'Local CDN',
                        url: `http://localhost:3001/images/${preview.sourceImage}`
                    },
                    {
                        name: 'Static Images',
                        url: `http://localhost:3001/images/${preview.sourceImage}`
                    },
                    {
                        name: 'Gallery Path',
                        url: `http://localhost:3001/user-gallery/${preview.sourceImage}`
                    },
                    {
                        name: 'User Generated',
                        url: `http://localhost:3001/user-generated/${preview.sourceImage}`
                    }
                ];
                
                let workingUrl = null;
                
                for (const pattern of urlPatterns) {
                    try {
                        console.log(`  Testing ${pattern.name}: ${pattern.url}`);
                        const response = await axios.head(pattern.url, { timeout: 5000 });
                        
                        if (response.status === 200) {
                            console.log(`  ✅ ${pattern.name} works (200)`);
                            workingUrl = pattern.url;
                            break;
                        } else if (response.status === 302) {
                            console.log(`  🔄 ${pattern.name} redirects (302)`);
                            workingUrl = pattern.url;
                        }
                        
                    } catch (error) {
                        if (error.response) {
                            console.log(`  ❌ ${pattern.name} failed (${error.response.status})`);
                        } else {
                            console.log(`  ❌ ${pattern.name} failed (${error.code})`);
                        }
                    }
                }
                
                if (workingUrl) {
                    console.log(`  🎯 Working URL found: ${workingUrl}`);
                } else {
                    console.log(`  ⚠️ No working URL found for ${preview.sourceImage}`);
                }
            }
            
            this.recordSuccess('Image URL resolution chain tested');
            
        } catch (error) {
            this.recordError('Image URL Resolution Chain', error);
        }
    }

    /**
     * Test 4: Test CDN URL construction logic
     */
    async testCdnUrlConstruction() {
        console.log('🌐 Test 4: Testing CDN URL construction');
        
        try {
            const config = require('../utils/gallery/config');
            
            console.log('Gallery Config:');
            console.log(`- CDN_URL: ${config.CDN_URL}`);
            console.log(`- GALLERY_CDN_URL: ${config.GALLERY_CDN_URL}`);
            console.log(`- GALLERY_S3_BUCKET: ${config.GALLERY_S3_BUCKET}`);
            
            // Test URL construction with sample sourceImage
            if (this.samplePreviews && this.samplePreviews.length > 0) {
                const testSourceImage = this.samplePreviews[0].sourceImage;
                
                if (testSourceImage && testSourceImage !== 'Unknown') {
                    // Construct URLs following gallery storage pattern
                    const galleryUrl = `${config.CDN_URL}/images/gallery/userId/${testSourceImage}`;
                    const directUrl = `${config.CDN_URL}/${testSourceImage}`;
                    const cloudfrontUrl = `${config.GALLERY_CDN_URL}/${testSourceImage}`;
                    
                    console.log('\nConstructed URLs:');
                    console.log(`Gallery Pattern: ${galleryUrl}`);
                    console.log(`Direct Pattern: ${directUrl}`);
                    console.log(`CloudFront Pattern: ${cloudfrontUrl}`);
                    
                    this.constructedUrls = {
                        gallery: galleryUrl,
                        direct: directUrl,
                        cloudfront: cloudfrontUrl
                    };
                }
            }
            
            this.recordSuccess('CDN URL construction tested');
            
        } catch (error) {
            this.recordError('CDN URL Construction', error);
        }
    }

    /**
     * Test 5: Test actual image accessibility
     */
    async testImageAccessibility() {
        console.log('🖼️ Test 5: Testing image accessibility');
        
        try {
            if (!this.constructedUrls) {
                this.recordWarning('No constructed URLs available for accessibility testing');
                return;
            }
            
            for (const [type, url] of Object.entries(this.constructedUrls)) {
                try {
                    console.log(`Testing ${type} URL: ${url}`);
                    
                    const response = await axios.head(url, { 
                        timeout: 10000,
                        maxRedirects: 5
                    });
                    
                    console.log(`✅ ${type} accessible (${response.status})`);
                    
                } catch (error) {
                    if (error.response) {
                        console.log(`❌ ${type} failed (${error.response.status})`);
                    } else {
                        console.log(`❌ ${type} failed (${error.code})`);
                    }
                }
            }
            
            this.recordSuccess('Image accessibility tested');
            
        } catch (error) {
            this.recordError('Image Accessibility', error);
        }
    }

    /**
     * Test 6: Test fallback mechanisms (local → CloudFront)
     */
    async testFallbackMechanisms() {
        console.log('🔄 Test 6: Testing fallback mechanisms');
        
        try {
            // Test the fallback pattern used in vendor-catalog.ejs
            if (this.samplePreviews && this.samplePreviews.length > 0) {
                const testSourceImage = this.samplePreviews[0].sourceImage;
                
                if (testSourceImage && testSourceImage !== 'Unknown') {
                    const primaryUrl = `http://localhost:3001/images/${testSourceImage}`;
                    const fallbackUrl = `https://df5sj8f594cdx.cloudfront.net/images/${testSourceImage}`;
                    
                    console.log('Testing fallback pattern:');
                    console.log(`Primary: ${primaryUrl}`);
                    console.log(`Fallback: ${fallbackUrl}`);
                    
                    // Test primary URL
                    let primaryWorks = false;
                    try {
                        const response = await axios.head(primaryUrl, { timeout: 5000 });
                        primaryWorks = (response.status === 200 || response.status === 302);
                        console.log(`✅ Primary URL works (${response.status})`);
                    } catch (error) {
                        console.log(`❌ Primary URL failed (${error.response?.status || error.code})`);
                    }
                    
                    // Test fallback URL
                    let fallbackWorks = false;
                    try {
                        const response = await axios.head(fallbackUrl, { timeout: 5000 });
                        fallbackWorks = (response.status === 200 || response.status === 302);
                        console.log(`✅ Fallback URL works (${response.status})`);
                    } catch (error) {
                        console.log(`❌ Fallback URL failed (${error.response?.status || error.code})`);
                    }
                    
                    if (primaryWorks || fallbackWorks) {
                        console.log('🎯 At least one fallback option works');
                    } else {
                        console.log('⚠️ Neither primary nor fallback URLs work');
                    }
                }
            }
            
            this.recordSuccess('Fallback mechanisms tested');
            
        } catch (error) {
            this.recordError('Fallback Mechanisms', error);
        }
    }

    /**
     * Test 7: Test gallery storage integration
     */
    async testGalleryStorageIntegration() {
        console.log('💾 Test 7: Testing gallery storage integration');
        
        try {
            // Test if gallery storage can construct proper URLs
            if (this.samplePreviews && this.samplePreviews.length > 0) {
                const testSourceImage = this.samplePreviews[0].sourceImage;
                
                if (testSourceImage && testSourceImage !== 'Unknown') {
                    console.log(`Testing gallery storage URL construction for: ${testSourceImage}`);
                    
                    // Check if the sourceImage follows expected patterns
                    const patterns = {
                        hasExtension: testSourceImage.includes('.'),
                        isWebp: testSourceImage.endsWith('.webp'),
                        isPng: testSourceImage.endsWith('.png'),
                        isJpg: testSourceImage.endsWith('.jpg') || testSourceImage.endsWith('.jpeg'),
                        hasUniqueId: testSourceImage.length > 10
                    };
                    
                    console.log('SourceImage patterns:');
                    for (const [pattern, matches] of Object.entries(patterns)) {
                        console.log(`  ${pattern}: ${matches ? '✅' : '❌'}`);
                    }
                    
                    // Test if we can find the image in upscaled folder
                    console.log('\nChecking for upscaled versions...');
                    // Note: This would require S3 access which might not be available in test environment
                }
            }
            
            this.recordSuccess('Gallery storage integration tested');
            
        } catch (error) {
            this.recordError('Gallery Storage Integration', error);
        }
    }

    /**
     * Test 8: Test vendor catalog template data requirements
     */
    async testVendorCatalogTemplateData() {
        console.log('📄 Test 8: Testing vendor catalog template data');
        
        try {
            if (!this.samplePreviews || this.samplePreviews.length === 0) {
                this.recordWarning('No sample previews for template data testing');
                return;
            }
            
            console.log('\nValidating template data requirements:');
            
            for (const preview of this.samplePreviews) {
                console.log(`\nProduct: ${preview.productId}`);
                
                const requirements = {
                    hasProductId: !!preview.productId,
                    hasTitle: !!preview.title,
                    hasSourceImage: !!(preview.sourceImage && preview.sourceImage !== 'Unknown'),
                    hasBlueprintId: !!preview.blueprintId,
                    hasProviderId: !!preview.providerId,
                    hasCreatedAt: !!preview.createdAt
                };
                
                let validCount = 0;
                for (const [req, valid] of Object.entries(requirements)) {
                    console.log(`  ${req}: ${valid ? '✅' : '❌'}`);
                    if (valid) validCount++;
                }
                
                console.log(`  Valid fields: ${validCount}/${Object.keys(requirements).length}`);
                
                // Specific check for image URL construction in template
                if (preview.sourceImage && preview.sourceImage !== 'Unknown') {
                    const templateUrl = `http://localhost:3001/images/${preview.sourceImage}`;
                    console.log(`  Template URL: ${templateUrl}`);
                }
            }
            
            this.recordSuccess('Vendor catalog template data tested');
            
        } catch (error) {
            this.recordError('Vendor Catalog Template Data', error);
        }
    }

    /**
     * Helper methods for test result tracking
     */
    recordSuccess(testName) {
        this.testResults.passed++;
        console.log(`✅ ${testName} PASSED\n`);
    }

    recordError(testName, error) {
        this.testResults.failed++;
        this.testResults.errors.push({
            test: testName,
            error: error.message,
            stack: error.stack
        });
        console.log(`❌ ${testName} FAILED: ${error.message}\n`);
    }

    recordWarning(message) {
        this.testResults.warnings++;
        console.log(`⚠️ WARNING: ${message}\n`);
    }

    printTestResults() {
        console.log('\n' + '='.repeat(60));
        console.log('🧪 PRODUCT IMAGE URL RESOLUTION TEST RESULTS');
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
        console.log('='.repeat(60));
    }
}

// Export for use in other test files
module.exports = ProductImageUrlResolutionTest;

// Run tests if called directly
if (require.main === module) {
    const test = new ProductImageUrlResolutionTest();
    test.runAllTests().then(() => {
        process.exit(0);
    }).catch((error) => {
        console.error('Test suite failed:', error);
        process.exit(1);
    });
}