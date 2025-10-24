/**
 * Vendor Catalog Diagnostic Test
 * 
 * Comprehensive test to identify all functional and cosmetic problems
 * in the admin vendor research catalog page.
 */

const axios = require('axios');

class VendorCatalogDiagnosticTest {
    constructor() {
        this.baseUrl = 'http://localhost:3001';
        this.issues = [];
        this.warnings = [];
        this.successes = [];
    }

    async runFullDiagnostic() {
        console.log('\n🔍 VENDOR CATALOG DIAGNOSTIC TEST\n');
        console.log('Identifying all functional and cosmetic problems...\n');

        try {
            await this.testPageLoad();
            await this.testAssetPaths();
            await this.testImageRendering();
            await this.testJavaScriptFunctionality();
            await this.testAPIEndpoints();
            await this.testUIElements();
            
        } catch (error) {
            this.recordIssue('CRITICAL', 'Test Suite Execution', error.message);
        }

        this.printDiagnosticReport();
        return {
            issues: this.issues,
            warnings: this.warnings,
            successes: this.successes
        };
    }

    async testPageLoad() {
        console.log('📄 Testing page load and basic structure...');

        try {
            const response = await axios.get(`${this.baseUrl}/admin/vendor-research/catalog`);
            
            if (response.status !== 200) {
                this.recordIssue('CRITICAL', 'Page Load', `HTTP ${response.status} - Page not accessible`);
                return;
            }

            const html = response.data;
            
            // Check basic HTML structure
            if (!html.includes('<!DOCTYPE html>')) {
                this.recordIssue('HIGH', 'HTML Structure', 'Missing DOCTYPE declaration');
            }
            
            if (!html.includes('<title>')) {
                this.recordIssue('MEDIUM', 'HTML Structure', 'Missing page title');
            }

            this.recordSuccess('Page loads successfully');

        } catch (error) {
            this.recordIssue('CRITICAL', 'Page Load', `Failed to load page: ${error.message}`);
        }
    }

    async testAssetPaths() {
        console.log('🔗 Testing asset paths and references...');

        try {
            const response = await axios.get(`${this.baseUrl}/admin/vendor-research/catalog`);
            const html = response.data;

            // Check CSS paths
            const cssMatches = html.match(/href="([^"]*\.css[^"]*)"/g) || [];
            for (const match of cssMatches) {
                const path = match.match(/href="([^"]*)"/)[1];
                
                if (path.startsWith('//')) {
                    this.recordIssue('HIGH', 'CSS Assets', `Invalid CSS path: ${path} (double slash)`);
                } else if (path.startsWith('/')) {
                    // Test if accessible
                    try {
                        const assetResponse = await axios.head(`${this.baseUrl}${path}`);
                        if (assetResponse.status !== 200) {
                            this.recordIssue('HIGH', 'CSS Assets', `CSS file not accessible: ${path}`);
                        } else {
                            this.recordSuccess(`CSS accessible: ${path}`);
                        }
                    } catch (error) {
                        this.recordIssue('HIGH', 'CSS Assets', `CSS file error: ${path} - ${error.message}`);
                    }
                }
            }

            // Check JavaScript paths
            const jsMatches = html.match(/src="([^"]*\.js[^"]*)"/g) || [];
            for (const match of jsMatches) {
                const path = match.match(/src="([^"]*)"/)[1];
                
                if (path.includes('data:image')) continue; // Skip SVG data URIs
                
                if (path.startsWith('/')) {
                    try {
                        const assetResponse = await axios.head(`${this.baseUrl}${path}`);
                        if (assetResponse.status !== 200) {
                            this.recordIssue('HIGH', 'JS Assets', `JavaScript file not accessible: ${path}`);
                        } else {
                            this.recordSuccess(`JavaScript accessible: ${path}`);
                        }
                    } catch (error) {
                        this.recordIssue('HIGH', 'JS Assets', `JavaScript file error: ${path} - ${error.message}`);
                    }
                }
            }

        } catch (error) {
            this.recordIssue('HIGH', 'Asset Paths', `Failed to test assets: ${error.message}`);
        }
    }

    async testImageRendering() {
        console.log('🖼️ Testing image rendering and resolution...');

        try {
            const response = await axios.get(`${this.baseUrl}/admin/vendor-research/catalog`);
            const html = response.data;

            // Count different types of image sources
            const loadingPlaceholders = (html.match(/data:image\/svg\+xml/g) || []).length;
            const dataSourceImages = (html.match(/data-source-image="[^"]+"/g) || []).length;
            const hardcodedImages = (html.match(/src="http[^"]*"/g) || []).length;

            console.log(`  📊 Loading placeholders: ${loadingPlaceholders}`);
            console.log(`  📊 Data-source-image attributes: ${dataSourceImages}`);
            console.log(`  📊 Hardcoded image URLs: ${hardcodedImages}`);

            if (loadingPlaceholders > 0 && dataSourceImages === 0) {
                this.recordIssue('HIGH', 'Image Rendering', 'Images stuck on loading placeholders - data-source-image missing');
            }

            if (hardcodedImages > 0) {
                this.recordWarning('Image Rendering', `Found ${hardcodedImages} hardcoded image URLs (may be broken)`);
            }

            // Test image resolution API
            if (dataSourceImages > 0) {
                // Extract a sample sourceImage for testing
                const sourceImageMatch = html.match(/data-source-image="([^"]+)"/);
                if (sourceImageMatch) {
                    const sourceImage = sourceImageMatch[1];
                    
                    try {
                        const resolutionResponse = await axios.get(`${this.baseUrl}/api/product-image/resolve/${encodeURIComponent(sourceImage)}`);
                        
                        if (resolutionResponse.status === 200 && resolutionResponse.data.success) {
                            this.recordSuccess(`Image resolution API working for: ${sourceImage}`);
                        } else {
                            this.recordIssue('MEDIUM', 'Image Resolution', `API returned error for ${sourceImage}`);
                        }
                    } catch (error) {
                        this.recordIssue('HIGH', 'Image Resolution', `Resolution API failed: ${error.message}`);
                    }
                }
            }

        } catch (error) {
            this.recordIssue('HIGH', 'Image Rendering', `Failed to test images: ${error.message}`);
        }
    }

    async testJavaScriptFunctionality() {
        console.log('⚙️ Testing JavaScript functionality...');

        try {
            const response = await axios.get(`${this.baseUrl}/admin/vendor-research/catalog`);
            const html = response.data;

            // Check for JavaScript functions
            const jsInline = html.includes('<script>') && html.includes('</script>');
            const hasModalFunctions = html.includes('openBorderModalFromCard');
            const hasDeleteFunctions = html.includes('deleteProduct');

            if (!jsInline) {
                this.recordIssue('MEDIUM', 'JavaScript', 'No inline JavaScript found');
            }

            if (!hasModalFunctions) {
                this.recordIssue('HIGH', 'JavaScript', 'Border modal functions missing');
            } else {
                this.recordSuccess('Border modal functions present');
            }

            if (!hasDeleteFunctions) {
                this.recordIssue('HIGH', 'JavaScript', 'Delete functions missing');
            } else {
                this.recordSuccess('Delete functions present');
            }

        } catch (error) {
            this.recordIssue('MEDIUM', 'JavaScript', `Failed to test JS: ${error.message}`);
        }
    }

    async testAPIEndpoints() {
        console.log('🌐 Testing API endpoints...');

        const endpoints = [
            '/api/product-image/resolve/test-image.jpg',
            '/api/merchandise/vendor-previews',
            '/api/product-image/resolve-batch'
        ];

        for (const endpoint of endpoints) {
            try {
                let response;
                
                if (endpoint.includes('resolve-batch')) {
                    response = await axios.post(`${this.baseUrl}${endpoint}`, {
                        sourceImageIds: ['test.jpg']
                    });
                } else {
                    response = await axios.get(`${this.baseUrl}${endpoint}`);
                }

                if (response.status === 200) {
                    this.recordSuccess(`API endpoint working: ${endpoint}`);
                } else {
                    this.recordIssue('MEDIUM', 'API Endpoints', `${endpoint} returned ${response.status}`);
                }

            } catch (error) {
                if (error.response && error.response.status === 404) {
                    this.recordIssue('HIGH', 'API Endpoints', `Endpoint not found: ${endpoint}`);
                } else {
                    this.recordIssue('MEDIUM', 'API Endpoints', `${endpoint} error: ${error.message}`);
                }
            }
        }
    }

    async testUIElements() {
        console.log('🎨 Testing UI elements and styling...');

        try {
            const response = await axios.get(`${this.baseUrl}/admin/vendor-research/catalog`);
            const html = response.data;

            // Check for essential UI elements
            const hasProductCards = html.includes('product-card');
            const hasButtons = html.includes('btn');
            const hasModal = html.includes('modal');
            const hasFilters = html.includes('filters');

            if (!hasProductCards) {
                this.recordIssue('HIGH', 'UI Elements', 'Product cards missing');
            } else {
                this.recordSuccess('Product cards present');
            }

            if (!hasButtons) {
                this.recordIssue('MEDIUM', 'UI Elements', 'Buttons missing');
            } else {
                this.recordSuccess('Buttons present');
            }

            if (!hasModal) {
                this.recordIssue('MEDIUM', 'UI Elements', 'Modal structure missing');
            } else {
                this.recordSuccess('Modal structure present');
            }

            // Check for responsive design
            const hasViewport = html.includes('viewport');
            if (!hasViewport) {
                this.recordIssue('MEDIUM', 'Responsive Design', 'Viewport meta tag missing');
            }

        } catch (error) {
            this.recordIssue('MEDIUM', 'UI Elements', `Failed to test UI: ${error.message}`);
        }
    }

    recordIssue(severity, category, message) {
        this.issues.push({ severity, category, message });
        const icon = severity === 'CRITICAL' ? '🚨' : severity === 'HIGH' ? '❌' : '⚠️';
        console.log(`  ${icon} ${severity}: ${category} - ${message}`);
    }

    recordWarning(category, message) {
        this.warnings.push({ category, message });
        console.log(`  ⚠️ WARNING: ${category} - ${message}`);
    }

    recordSuccess(message) {
        this.successes.push(message);
        console.log(`  ✅ ${message}`);
    }

    printDiagnosticReport() {
        console.log('\n' + '='.repeat(80));
        console.log('🔍 VENDOR CATALOG DIAGNOSTIC REPORT');
        console.log('='.repeat(80));

        console.log(`\n📊 SUMMARY:`);
        console.log(`🚨 Critical/High Issues: ${this.issues.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH').length}`);
        console.log(`⚠️ Medium Issues: ${this.issues.filter(i => i.severity === 'MEDIUM').length}`);
        console.log(`⚠️ Warnings: ${this.warnings.length}`);
        console.log(`✅ Successes: ${this.successes.length}`);

        if (this.issues.length > 0) {
            console.log(`\n🚨 ISSUES FOUND:`);
            this.issues.forEach((issue, index) => {
                console.log(`${index + 1}. [${issue.severity}] ${issue.category}: ${issue.message}`);
            });
        }

        if (this.warnings.length > 0) {
            console.log(`\n⚠️ WARNINGS:`);
            this.warnings.forEach((warning, index) => {
                console.log(`${index + 1}. ${warning.category}: ${warning.message}`);
            });
        }

        console.log(`\n🔧 RECOMMENDED FIXES:`);
        
        const cssIssues = this.issues.filter(i => i.category.includes('CSS'));
        if (cssIssues.length > 0) {
            console.log('1. Fix CSS asset paths (remove double slashes)');
        }

        const jsIssues = this.issues.filter(i => i.category.includes('JS'));
        if (jsIssues.length > 0) {
            console.log('2. Fix JavaScript asset paths');
        }

        const imageIssues = this.issues.filter(i => i.category.includes('Image'));
        if (imageIssues.length > 0) {
            console.log('3. Fix image resolution system');
        }

        console.log('='.repeat(80));
    }
}

// Export for use in other test files
module.exports = VendorCatalogDiagnosticTest;

// Run tests if called directly
if (require.main === module) {
    const test = new VendorCatalogDiagnosticTest();
    test.runFullDiagnostic().then(() => {
        process.exit(0);
    }).catch((error) => {
        console.error('Diagnostic test failed:', error);
        process.exit(1);
    });
}