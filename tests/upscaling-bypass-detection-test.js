#!/usr/bin/env node

/**
 * CRITICAL BUG DETECTION TEST: Upscaling Bypass Validation
 * 
 * This test detects when products are created without required upscaled images,
 * which bypasses the validation systems we built to prevent this exact scenario.
 * 
 * REQUIREMENTS:
 * - ALL vendor preview products MUST have upscaled versions in S3
 * - NO products should exist without corresponding upscaled images
 * - Product creation pipeline MUST enforce upscaling validation
 */

const AWS = require('aws-sdk');
const axios = require('axios');

class UpscalingBypassDetector {
    constructor() {
        this.s3 = new AWS.S3({
            accessKeyId: process.env.ACCESS_KEY_ID,
            secretAccessKey: process.env.SECRET_ACCESS_KEY,
            region: 'us-east-1'
        });
        
        this.bucket = 'wavelength-gallery-346923';
        this.baseUrl = 'http://localhost:3001';
        
        this.violations = [];
        this.validProducts = [];
        this.criticalIssues = [];
    }

    async runComprehensiveValidation() {
        console.log('🚨 CRITICAL BUG DETECTION: Upscaling Bypass Validation\n');
        console.log('Detecting products created without required upscaled images...\n');
        
        try {
            // Step 1: Get all vendor preview products
            const products = await this.getAllVendorPreviewProducts();
            console.log(`📦 Found ${products.length} vendor preview products to validate\n`);
            
            // Step 2: Get all upscaled images from S3
            const upscaledImages = await this.getAllUpscaledImages();
            console.log(`🎯 Found ${upscaledImages.length} upscaled images in S3\n`);
            
            // Step 3: Cross-validate products against upscaled images
            await this.validateProductsAgainstUpscaledImages(products, upscaledImages);
            
            // Step 4: Analyze the validation violations
            this.analyzeViolations();
            
            // Step 5: Generate comprehensive report
            this.generateComprehensiveReport();
            
            // Step 6: Return test result
            return this.violations.length === 0;
            
        } catch (error) {
            console.error('❌ Critical validation failed:', error);
            this.criticalIssues.push({
                type: 'VALIDATION_FAILURE',
                error: error.message,
                timestamp: new Date().toISOString()
            });
            return false;
        }
    }

    async getAllVendorPreviewProducts() {
        try {
            const response = await axios.get(`${this.baseUrl}/admin/vendor-research/catalog`);
            
            if (response.status !== 200) {
                throw new Error(`Failed to load catalog: HTTP ${response.status}`);
            }
            
            // Extract product data from the catalog response
            // This would need to be adapted based on the actual API structure
            const products = await this.extractProductsFromCatalog();
            
            return products;
            
        } catch (error) {
            throw new Error(`Failed to get vendor preview products: ${error.message}`);
        }
    }

    async extractProductsFromCatalog() {
        try {
            // Get actual product data from the merchandise API
            console.log('📡 Fetching vendor preview products from API...');
            const response = await axios.get(`${this.baseUrl}/api/merchandise/vendor-previews`);
            
            if (response.status === 200 && response.data && response.data.success) {
                console.log(`✅ Successfully fetched ${response.data.count} products from API`);
                return response.data.previews.map(product => ({
                    productId: product.productId,
                    sourceImage: product.sourceImage,
                    title: product.title,
                    blueprintId: product.blueprintId,
                    providerId: product.providerId,
                    createdAt: product.createdAt,
                    createdBy: product.createdBy,
                    source: 'API'
                }));
            }
            
            throw new Error('API response invalid or empty');
            
        } catch (error) {
            console.warn(`⚠️ API fetch failed, trying HTML fallback: ${error.message}`);
            
            // Fallback: Extract from catalog page if API not available
            const catalogResponse = await axios.get(`${this.baseUrl}/admin/vendor-research/catalog`);
            const html = catalogResponse.data;
            
            // Parse product data from HTML (basic extraction)
            const products = [];
            const productMatches = html.match(/data-product-id="[^"]*"/g) || [];
            const sourceImageMatches = html.match(/data-source-image="[^"]*"/g) || [];
            
            console.log(`📄 Extracting from HTML: found ${productMatches.length} product IDs`);
            
            for (let i = 0; i < productMatches.length; i++) {
                const productId = productMatches[i].match(/data-product-id="([^"]*)"/)?.[1];
                const sourceImage = sourceImageMatches[i]?.match(/data-source-image="([^"]*)"/)?.[1];
                
                if (productId && sourceImage) {
                    products.push({
                        productId,
                        sourceImage,
                        source: 'HTML_FALLBACK'
                    });
                }
            }
            
            // Remove duplicates
            const uniqueProducts = [];
            const seen = new Set();
            for (const product of products) {
                const key = `${product.productId}-${product.sourceImage}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    uniqueProducts.push(product);
                }
            }
            
            console.log(`📄 Extracted ${uniqueProducts.length} unique products from HTML`);
            return uniqueProducts;
        }
    }

    async getAllUpscaledImages() {
        try {
            const params = {
                Bucket: this.bucket,
                Prefix: 'upscaled/',
                MaxKeys: 1000
            };
            
            const result = await this.s3.listObjectsV2(params).promise();
            
            return result.Contents.map(obj => ({
                key: obj.Key,
                filename: obj.Key.split('/').pop(),
                size: obj.Size,
                lastModified: obj.LastModified,
                path: obj.Key
            }));
            
        } catch (error) {
            throw new Error(`Failed to get upscaled images: ${error.message}`);
        }
    }

    async validateProductsAgainstUpscaledImages(products, upscaledImages) {
        console.log('🔍 VALIDATION: Cross-checking products against upscaled images\n');
        
        for (const product of products) {
            console.log(`📦 Validating product: ${product.productId}`);
            console.log(`   Source: ${product.sourceImage}`);
            
            // Look for corresponding upscaled image
            const hasUpscaledVersion = this.findUpscaledVersionForProduct(product, upscaledImages);
            
            if (hasUpscaledVersion) {
                console.log(`   ✅ VALID: Found upscaled version`);
                this.validProducts.push({
                    ...product,
                    upscaledImage: hasUpscaledVersion,
                    status: 'VALID'
                });
            } else {
                console.log(`   🚨 VIOLATION: No upscaled version found!`);
                this.violations.push({
                    ...product,
                    violationType: 'MISSING_UPSCALED_IMAGE',
                    severity: 'CRITICAL',
                    description: `Product ${product.productId} exists without required upscaled image`,
                    sourceImage: product.sourceImage,
                    timestamp: new Date().toISOString()
                });
            }
            
            console.log('');
        }
    }

    findUpscaledVersionForProduct(product, upscaledImages) {
        const sourceImage = product.sourceImage;
        
        // Multiple matching strategies
        for (const upscaledImage of upscaledImages) {
            // Strategy 1: Direct filename match
            if (upscaledImage.filename.includes(sourceImage)) {
                return upscaledImage;
            }
            
            // Strategy 2: Base name match (without extension)
            const sourceBase = sourceImage.replace(/\.[^.]+$/, '');
            if (upscaledImage.filename.includes(sourceBase)) {
                return upscaledImage;
            }
            
            // Strategy 3: Path-based match
            if (upscaledImage.path.includes(sourceImage)) {
                return upscaledImage;
            }
        }
        
        return null;
    }

    analyzeViolations() {
        console.log('📊 VIOLATION ANALYSIS\n');
        console.log('='.repeat(70));
        
        const totalProducts = this.validProducts.length + this.violations.length;
        const violationRate = (this.violations.length / totalProducts) * 100;
        
        console.log(`Total products analyzed: ${totalProducts}`);
        console.log(`Valid products: ${this.validProducts.length}`);
        console.log(`Violations found: ${this.violations.length}`);
        console.log(`Violation rate: ${violationRate.toFixed(1)}%\n`);
        
        if (this.violations.length > 0) {
            console.log('🚨 CRITICAL VIOLATIONS DETECTED:');
            this.violations.forEach((violation, index) => {
                console.log(`${index + 1}. Product ID: ${violation.productId}`);
                console.log(`   Source Image: ${violation.sourceImage}`);
                console.log(`   Issue: ${violation.description}`);
                console.log('');
            });
        }
    }

    generateComprehensiveReport() {
        console.log('📋 COMPREHENSIVE BUG DETECTION REPORT\n');
        console.log('='.repeat(70));
        
        if (this.violations.length === 0) {
            console.log('✅ NO VIOLATIONS FOUND');
            console.log('All products have required upscaled images.');
            console.log('Upscaling validation is working correctly.\n');
        } else {
            console.log('🚨 CRITICAL BUG CONFIRMED');
            console.log('Products are being created without upscaled images!');
            console.log('This bypasses the validation systems we built.\n');
            
            console.log('📊 VIOLATION BREAKDOWN:');
            const violationTypes = {};
            this.violations.forEach(v => {
                violationTypes[v.violationType] = (violationTypes[v.violationType] || 0) + 1;
            });
            
            Object.entries(violationTypes).forEach(([type, count]) => {
                console.log(`   ${type}: ${count} violations`);
            });
            console.log('');
            
            console.log('🔧 REQUIRED ACTIONS:');
            console.log('1. Fix product creation pipeline to enforce upscaling');
            console.log('2. Add runtime validation to prevent this bug');
            console.log('3. Add comprehensive logging and diagnostics');
            console.log('4. Review all existing products for compliance');
            console.log('5. Implement automated validation checks');
        }
        
        if (this.criticalIssues.length > 0) {
            console.log('\n🚨 CRITICAL SYSTEM ISSUES:');
            this.criticalIssues.forEach((issue, index) => {
                console.log(`${index + 1}. ${issue.type}: ${issue.error}`);
            });
        }
        
        console.log('\n' + '='.repeat(70));
        console.log('🎯 BUG DETECTION COMPLETE');
        console.log('='.repeat(70));
    }
}

// Run the validation
async function main() {
    const detector = new UpscalingBypassDetector();
    const isValid = await detector.runComprehensiveValidation();
    
    if (!isValid) {
        console.log('\n🚨 CRITICAL BUG DETECTED - IMMEDIATE ACTION REQUIRED');
        process.exit(1);
    } else {
        console.log('\n✅ All validation checks passed');
        process.exit(0);
    }
}

if (require.main === module) {
    main().catch(error => {
        console.error('❌ Validation failed:', error);
        process.exit(1);
    });
}

module.exports = UpscalingBypassDetector;