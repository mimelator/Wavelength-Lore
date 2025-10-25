#!/usr/bin/env node

/**
 * VENDOR COMPATIBILITY CHECKER
 * Lightweight version for production validation pipeline
 */

require('dotenv').config();

async function quickVendorCompatibilityCheck() {
    console.log('🔍 Quick Vendor Compatibility Check');
    console.log('===================================\n');

    try {
        const fs = require('fs');
        const path = require('path');
        
        // Check if compatibility matrix exists
        const matrixPath = path.join(__dirname, '..', 'vendor-compatibility-matrix.json');
        
        if (!fs.existsSync(matrixPath)) {
            console.log('⚠️  No compatibility matrix found - running basic test...');
            return await runBasicCompatibilityTest();
        }

        // Load existing matrix
        const matrix = JSON.parse(fs.readFileSync(matrixPath, 'utf8'));
        const testAge = Date.now() - new Date(matrix.testDate).getTime();
        const daysOld = Math.floor(testAge / (1000 * 60 * 60 * 24));

        console.log(`📊 Compatibility Matrix: ${daysOld} days old`);
        console.log(`✅ Working combinations: ${matrix.statistics.working}`);
        console.log(`❌ Failed combinations: ${matrix.statistics.failed}`);
        
        const successRate = Math.round((matrix.statistics.working / matrix.totalTested) * 100);
        console.log(`📈 Overall success rate: ${successRate}%`);

        // Check if matrix is too old (>7 days)
        if (daysOld > 7) {
            console.log('⚠️  Matrix is outdated - consider running full compatibility test');
            return { status: 'WARNING', message: 'Compatibility matrix outdated' };
        }

        // Check success rate
        if (successRate < 50) {
            console.log('🚨 Low vendor compatibility detected');
            return { status: 'CRITICAL', message: `Low compatibility: ${successRate}%` };
        } else if (successRate < 70) {
            console.log('⚠️  Moderate vendor compatibility');
            return { status: 'WARNING', message: `Moderate compatibility: ${successRate}%` };
        } else {
            console.log('✅ Good vendor compatibility');
            return { status: 'OK', message: `Good compatibility: ${successRate}%` };
        }

    } catch (error) {
        console.error('❌ Compatibility check failed:', error.message);
        return { status: 'ERROR', message: error.message };
    }
}

async function runBasicCompatibilityTest() {
    console.log('🧪 Running basic compatibility test...');
    
    try {
        const EnhancedPrintifyService = require('../services/enhanced-printify-service');
        const printifyService = new EnhancedPrintifyService();
        
        // Test basic API connectivity
        const blueprints = await printifyService.getBlueprints();
        console.log(`✅ API accessible - ${blueprints.length || 0} blueprints available`);
        
        return { status: 'OK', message: 'Basic API connectivity confirmed' };
    } catch (error) {
        console.error('❌ Basic test failed:', error.message);
        return { status: 'CRITICAL', message: 'Printify API unavailable' };
    }
}

// CLI execution
if (require.main === module) {
    quickVendorCompatibilityCheck()
        .then(result => {
            console.log(`\n🏁 Result: ${result.status} - ${result.message}`);
            
            // Exit codes for CI/CD
            switch (result.status) {
                case 'OK': process.exit(0); break;
                case 'WARNING': process.exit(1); break;
                case 'CRITICAL': process.exit(2); break;
                case 'ERROR': process.exit(3); break;
            }
        })
        .catch(error => {
            console.error('💥 Unexpected error:', error);
            process.exit(4);
        });
}

module.exports = { quickVendorCompatibilityCheck };