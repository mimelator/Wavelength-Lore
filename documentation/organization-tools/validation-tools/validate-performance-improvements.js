#!/usr/bin/env node

/**
 * Performance Validation Suite
 * Tests both admin vendor catalog and user merchandise page performance
 */

const axios = require('axios');
const { performance } = require('perf_hooks');

// Configuration
const BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://wavelengthlore.com' 
    : 'http://localhost:3001';

const TIMEOUT = 30000; // 30 second timeout

// Test endpoints
const ENDPOINTS = {
    // Admin vendor catalog (optimized vs original)
    adminCatalogOptimized: '/admin/vendor-catalog-optimized',
    adminCatalogOriginal: '/admin/vendor-catalog',
    
    // User merchandise pages
    userMerchStore: '/merchandise',
    userMerchCategory: '/merchandise/apparel',
    userMerchProduct: '/merchandise/product/1',
    
    // API endpoints
    apiVendorCatalog: '/api/admin/vendor-catalog-optimized',
    apiMerchProducts: '/api/merchandise/products'
};

// Performance thresholds (ms)
const THRESHOLDS = {
    excellent: 500,
    good: 2000,
    acceptable: 5000,
    poor: 10000
};

class PerformanceValidator {
    constructor() {
        this.results = [];
        this.axios = axios.create({
            timeout: TIMEOUT,
            validateStatus: () => true // Accept all status codes
        });
    }

    async measureEndpoint(name, url, options = {}) {
        console.log(`\n🔍 Testing: ${name}`);
        console.log(`   URL: ${BASE_URL}${url}`);
        
        const start = performance.now();
        
        try {
            const response = await this.axios.get(`${BASE_URL}${url}`, options);
            const end = performance.now();
            const duration = Math.round(end - start);
            
            const result = {
                name,
                url,
                duration,
                status: response.status,
                size: response.headers['content-length'] || 'unknown',
                success: response.status >= 200 && response.status < 400
            };
            
            this.results.push(result);
            this.logResult(result);
            
            return result;
            
        } catch (error) {
            const end = performance.now();
            const duration = Math.round(end - start);
            
            const result = {
                name,
                url,
                duration,
                status: 'ERROR',
                size: 0,
                success: false,
                error: error.message
            };
            
            this.results.push(result);
            this.logResult(result);
            
            return result;
        }
    }

    logResult(result) {
        const { duration, status, success, error } = result;
        
        // Performance rating
        let rating = '🔴 POOR';
        if (duration <= THRESHOLDS.excellent) rating = '🟢 EXCELLENT';
        else if (duration <= THRESHOLDS.good) rating = '🟡 GOOD';
        else if (duration <= THRESHOLDS.acceptable) rating = '🟠 ACCEPTABLE';
        
        console.log(`   ⏱️  ${duration}ms | ${rating}`);
        console.log(`   📊 Status: ${status} | Success: ${success ? '✅' : '❌'}`);
        
        if (error) {
            console.log(`   ❌ Error: ${error}`);
        }
    }

    async validateAdminCatalog() {
        console.log('\n' + '='.repeat(60));
        console.log('🏪 ADMIN VENDOR CATALOG PERFORMANCE');
        console.log('='.repeat(60));
        
        // Test optimized catalog
        const optimized = await this.measureEndpoint(
            'Admin Catalog (Optimized)', 
            ENDPOINTS.adminCatalogOptimized
        );
        
        // Test original catalog (if available)
        const original = await this.measureEndpoint(
            'Admin Catalog (Original)', 
            ENDPOINTS.adminCatalogOriginal
        );
        
        // Test API endpoint
        const api = await this.measureEndpoint(
            'Admin Catalog API', 
            ENDPOINTS.apiVendorCatalog
        );
        
        // Calculate improvement
        if (optimized.success && original.success) {
            const improvement = Math.round((original.duration / optimized.duration) * 100) / 100;
            const savings = original.duration - optimized.duration;
            
            console.log(`\n📈 PERFORMANCE COMPARISON:`);
            console.log(`   Original: ${original.duration}ms`);
            console.log(`   Optimized: ${optimized.duration}ms`);
            console.log(`   Improvement: ${improvement}x faster (${savings}ms saved)`);
        }
        
        return { optimized, original, api };
    }

    async validateUserMerchandise() {
        console.log('\n' + '='.repeat(60));
        console.log('🛍️  USER MERCHANDISE PERFORMANCE');
        console.log('='.repeat(60));
        
        // Test main merchandise store
        const store = await this.measureEndpoint(
            'Merchandise Store', 
            ENDPOINTS.userMerchStore
        );
        
        // Test category page
        const category = await this.measureEndpoint(
            'Merchandise Category', 
            ENDPOINTS.userMerchCategory
        );
        
        // Test product page
        const product = await this.measureEndpoint(
            'Merchandise Product', 
            ENDPOINTS.userMerchProduct
        );
        
        // Test API endpoint
        const api = await this.measureEndpoint(
            'Merchandise API', 
            ENDPOINTS.apiMerchProducts
        );
        
        return { store, category, product, api };
    }

    async validateCriticalPaths() {
        console.log('\n' + '='.repeat(60));
        console.log('🚨 CRITICAL PATH VALIDATION');
        console.log('='.repeat(60));
        
        const criticalTests = [];
        
        // Test that users don't hit slow admin paths
        console.log('\n🔒 Testing user isolation from admin paths...');
        
        // Simulate user accessing merchandise (should be fast)
        const userPath = await this.measureEndpoint(
            'User Merchandise Access', 
            '/merchandise'
        );
        
        if (userPath.duration > THRESHOLDS.good) {
            console.log('⚠️  WARNING: User merchandise page is slow!');
            criticalTests.push({
                test: 'User Performance',
                status: 'FAIL',
                issue: `User page took ${userPath.duration}ms (threshold: ${THRESHOLDS.good}ms)`
            });
        } else {
            criticalTests.push({
                test: 'User Performance',
                status: 'PASS',
                note: `User page loaded in ${userPath.duration}ms`
            });
        }
        
        return criticalTests;
    }

    generateReport() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 PERFORMANCE VALIDATION REPORT');
        console.log('='.repeat(60));
        
        const successful = this.results.filter(r => r.success);
        const failed = this.results.filter(r => !r.success);
        
        console.log(`\n📈 SUMMARY:`);
        console.log(`   Total Tests: ${this.results.length}`);
        console.log(`   Successful: ${successful.length}`);
        console.log(`   Failed: ${failed.length}`);
        
        if (successful.length > 0) {
            const avgDuration = Math.round(
                successful.reduce((sum, r) => sum + r.duration, 0) / successful.length
            );
            console.log(`   Average Response Time: ${avgDuration}ms`);
        }
        
        // Performance breakdown
        console.log(`\n⚡ PERFORMANCE BREAKDOWN:`);
        successful.forEach(result => {
            let rating = '🔴';
            if (result.duration <= THRESHOLDS.excellent) rating = '🟢';
            else if (result.duration <= THRESHOLDS.good) rating = '🟡';
            else if (result.duration <= THRESHOLDS.acceptable) rating = '🟠';
            
            console.log(`   ${rating} ${result.name}: ${result.duration}ms`);
        });
        
        // Failed tests
        if (failed.length > 0) {
            console.log(`\n❌ FAILED TESTS:`);
            failed.forEach(result => {
                console.log(`   ❌ ${result.name}: ${result.error || 'Unknown error'}`);
            });
        }
        
        // Recommendations
        console.log(`\n💡 RECOMMENDATIONS:`);
        const slowTests = successful.filter(r => r.duration > THRESHOLDS.good);
        
        if (slowTests.length === 0) {
            console.log(`   ✅ All tests performing well!`);
        } else {
            slowTests.forEach(test => {
                console.log(`   ⚠️  Optimize: ${test.name} (${test.duration}ms)`);
            });
        }
        
        return {
            total: this.results.length,
            successful: successful.length,
            failed: failed.length,
            avgDuration: successful.length > 0 ? 
                Math.round(successful.reduce((sum, r) => sum + r.duration, 0) / successful.length) : 0
        };
    }
}

async function main() {
    console.log('🚀 WAVELENGTH LORE PERFORMANCE VALIDATION');
    console.log('==========================================');
    console.log(`Environment: ${BASE_URL}`);
    console.log(`Timeout: ${TIMEOUT}ms`);
    
    const validator = new PerformanceValidator();
    
    try {
        // Run all validation tests
        await validator.validateAdminCatalog();
        await validator.validateUserMerchandise();
        await validator.validateCriticalPaths();
        
        // Generate final report
        const report = validator.generateReport();
        
        // Exit with appropriate code
        if (report.failed > 0) {
            console.log('\n❌ Some tests failed - check logs above');
            process.exit(1);
        } else {
            console.log('\n✅ All performance validations passed!');
            process.exit(0);
        }
        
    } catch (error) {
        console.error('\n💥 Validation suite crashed:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { PerformanceValidator };