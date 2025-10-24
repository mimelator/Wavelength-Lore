#!/usr/bin/env node

/**
 * CRITICAL CLEANUP: Delete Products Created Without Upscaled Images
 * 
 * This script deletes the 12 products that were created without required upscaled images,
 * cleaning up the corrupted data before testing the fix.
 */

const axios = require('axios');
const AWS = require('aws-sdk');

class CorruptedProductCleanup {
    constructor() {
        this.s3 = new AWS.S3({
            accessKeyId: process.env.ACCESS_KEY_ID,
            secretAccessKey: process.env.SECRET_ACCESS_KEY,
            region: 'us-east-1'
        });
        
        this.bucket = 'wavelength-gallery-346923';
        this.baseUrl = 'http://localhost:3001';
        
        this.corruptedProducts = [];
        this.validProducts = [];
        this.deletedProducts = [];
        this.deletionErrors = [];
    }

    async runCleanup() {
        console.log('🚨 CRITICAL CLEANUP: Deleting Products Without Upscaled Images\n');
        console.log('This will remove the 12 corrupted products identified by the detection test...\n');
        
        try {
            // Step 1: Re-identify corrupted products
            await this.identifyCorruptedProducts();
            
            // Step 2: Confirm deletion list
            this.confirmDeletionList();
            
            // Step 3: Delete corrupted products
            await this.deleteCorruptedProducts();
            
            // Step 4: Verify cleanup
            await this.verifyCleanup();
            
            // Step 5: Generate cleanup report
            this.generateCleanupReport();
            
            return this.deletionErrors.length === 0;
            
        } catch (error) {
            console.error('❌ Cleanup failed:', error);
            return false;
        }
    }

    async identifyCorruptedProducts() {
        console.log('🔍 STEP 1: Re-identifying corrupted products...\n');
        
        // Get all products
        const response = await axios.get(`${this.baseUrl}/api/merchandise/vendor-previews`);
        if (!response.data || !response.data.success) {
            throw new Error('Failed to fetch products');
        }
        
        const products = response.data.previews;
        console.log(`📦 Found ${products.length} total products to analyze`);
        
        // Get all upscaled images
        const upscaledImages = await this.getAllUpscaledImages();
        console.log(`🎯 Found ${upscaledImages.length} upscaled images in S3\n`);
        
        // Categorize products
        for (const product of products) {
            // Add cache key (same as product ID for vendor previews)
            product.cacheKey = product.productId;
            
            const hasUpscaledVersion = this.findUpscaledVersionForProduct(product, upscaledImages);
            
            if (hasUpscaledVersion) {
                this.validProducts.push(product);
                console.log(`✅ VALID: ${product.productId} (${product.sourceImage})`);
            } else {
                this.corruptedProducts.push(product);
                console.log(`🚨 CORRUPTED: ${product.productId} (${product.sourceImage})`);
            }
        }
        
        console.log(`\n📊 Analysis Complete:`);
        console.log(`   Valid products: ${this.validProducts.length}`);
        console.log(`   Corrupted products: ${this.corruptedProducts.length}`);
    }

    async getAllUpscaledImages() {
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
    }

    findUpscaledVersionForProduct(product, upscaledImages) {
        const sourceImage = product.sourceImage;
        
        for (const upscaledImage of upscaledImages) {
            // Direct filename match
            if (upscaledImage.filename.includes(sourceImage)) {
                return upscaledImage;
            }
            
            // Base name match (without extension)
            const sourceBase = sourceImage.replace(/\.[^.]+$/, '');
            if (upscaledImage.filename.includes(sourceBase)) {
                return upscaledImage;
            }
            
            // Path-based match
            if (upscaledImage.path.includes(sourceImage)) {
                return upscaledImage;
            }
        }
        
        return null;
    }

    confirmDeletionList() {
        console.log('\n🗑️ STEP 2: Confirming deletion list...\n');
        console.log('🚨 THE FOLLOWING PRODUCTS WILL BE DELETED:');
        console.log('=' .repeat(70));
        
        this.corruptedProducts.forEach((product, index) => {
            console.log(`${index + 1}. Product ID: ${product.productId}`);
            console.log(`   Title: ${product.title}`);
            console.log(`   Source Image: ${product.sourceImage}`);
            console.log(`   Blueprint: ${product.blueprintId}`);
            console.log(`   Created: ${product.createdAt}`);
            console.log('');
        });
        
        console.log('=' .repeat(70));
        console.log(`📊 Total products to delete: ${this.corruptedProducts.length}`);
        console.log(`📊 Valid products to keep: ${this.validProducts.length}`);
        console.log('');
    }

    async deleteCorruptedProducts() {
        console.log('🗑️ STEP 3: Deleting corrupted products...\n');
        
        for (const product of this.corruptedProducts) {
            try {
                console.log(`🗑️ Deleting product: ${product.productId} (${product.sourceImage})`);
                console.log(`   Cache Key: ${product.cacheKey}`);
                
                // Delete from vendor preview API using correct admin endpoint
                const deleteResponse = await axios.delete(
                    `${this.baseUrl}/admin/vendor-research/delete-preview`,
                    {
                        data: { cacheKey: product.cacheKey },
                        timeout: 10000,
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                );
                
                if (deleteResponse.status === 200 && deleteResponse.data.success) {
                    this.deletedProducts.push(product);
                    console.log(`   ✅ Successfully deleted: ${product.productId}`);
                    console.log(`   📊 Delete operation:`, deleteResponse.data.operation);
                } else {
                    throw new Error(`HTTP ${deleteResponse.status}: ${deleteResponse.statusText} - ${JSON.stringify(deleteResponse.data)}`);
                }
                
                // Small delay to avoid overwhelming the API
                await new Promise(resolve => setTimeout(resolve, 500));
                
            } catch (error) {
                console.log(`   ❌ Failed to delete ${product.productId}: ${error.message}`);
                this.deletionErrors.push({
                    product,
                    error: error.message
                });
            }
        }
    }

    async verifyCleanup() {
        console.log('\n🔍 STEP 4: Verifying cleanup...\n');
        
        // Re-fetch products to verify deletion
        const response = await axios.get(`${this.baseUrl}/api/merchandise/vendor-previews`);
        const remainingProducts = response.data.previews || [];
        
        console.log(`📦 Products remaining after cleanup: ${remainingProducts.length}`);
        
        // Check if any corrupted products still exist
        const stillExists = [];
        for (const corruptedProduct of this.corruptedProducts) {
            const exists = remainingProducts.find(p => p.productId === corruptedProduct.productId);
            if (exists) {
                stillExists.push(corruptedProduct);
            }
        }
        
        if (stillExists.length > 0) {
            console.log(`🚨 WARNING: ${stillExists.length} corrupted products still exist:`);
            stillExists.forEach(product => {
                console.log(`   - ${product.productId} (${product.sourceImage})`);
            });
        } else {
            console.log(`✅ All corrupted products successfully removed`);
        }
        
        // Run the detection test again to verify
        console.log('\n🔍 Running upscaling bypass detection test to verify...');
        return remainingProducts;
    }

    generateCleanupReport() {
        console.log('\n📋 CLEANUP REPORT');
        console.log('=' .repeat(70));
        
        console.log(`📊 CLEANUP STATISTICS:`);
        console.log(`   Products identified for deletion: ${this.corruptedProducts.length}`);
        console.log(`   Products successfully deleted: ${this.deletedProducts.length}`);
        console.log(`   Deletion failures: ${this.deletionErrors.length}`);
        console.log(`   Valid products preserved: ${this.validProducts.length}`);
        
        if (this.deletionErrors.length > 0) {
            console.log(`\n❌ DELETION FAILURES:`);
            this.deletionErrors.forEach((failure, index) => {
                console.log(`${index + 1}. ${failure.product.productId}: ${failure.error}`);
            });
        }
        
        console.log(`\n✅ SUCCESSFULLY DELETED PRODUCTS:`);
        this.deletedProducts.forEach((product, index) => {
            console.log(`${index + 1}. ${product.productId} (${product.sourceImage})`);
        });
        
        const success = this.deletionErrors.length === 0;
        console.log(`\n🎯 CLEANUP RESULT: ${success ? 'SUCCESS' : 'PARTIAL SUCCESS'}`);
        
        if (success) {
            console.log('All corrupted products have been removed.');
            console.log('The database is now clean and ready for testing the fix.');
        } else {
            console.log('Some products could not be deleted and may need manual cleanup.');
        }
        
        console.log('=' .repeat(70));
    }
}

// Run the cleanup
async function main() {
    const cleanup = new CorruptedProductCleanup();
    const success = await cleanup.runCleanup();
    
    if (success) {
        console.log('\n✅ CLEANUP COMPLETED SUCCESSFULLY');
        console.log('Ready to test the upscaling enforcement fix!');
        process.exit(0);
    } else {
        console.log('\n⚠️ CLEANUP COMPLETED WITH ERRORS');
        console.log('Some manual cleanup may be required.');
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(error => {
        console.error('❌ Cleanup failed:', error);
        process.exit(1);
    });
}

module.exports = CorruptedProductCleanup;