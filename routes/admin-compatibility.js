/**
 * Admin Compatibility Test Routes
 * 
 * Routes for viewing and managing compatibility test products
 */

const express = require('express');
const router = express.Router();

// Admin authentication middleware (simple check for now)
const requireAdmin = (req, res, next) => {
    // For now, just check if running locally
    if (req.hostname === 'localhost' || req.hostname === '127.0.0.1') {
        next();
    } else {
        res.status(403).json({ error: 'Admin access required' });
    }
};

/**
 * View all compatibility test runs
 */
router.get('/compatibility-tests', requireAdmin, async (req, res) => {
    try {
        const { initializeFirebaseAdmin } = require('../helpers/firebase-admin-utils');
        initializeFirebaseAdmin();
        const admin = require('firebase-admin');
        const db = admin.app('admin').database();
        
        const testRunsSnapshot = await db.ref('admin/compatibility-test-runs').once('value');
        const testRuns = testRunsSnapshot.val() || {};
        
        const testRunsList = Object.entries(testRuns).map(([id, data]) => ({
            id,
            ...data
        })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        res.render('admin-compatibility-tests', {
            title: 'Admin - Compatibility Tests',
            testRuns: testRunsList
        });
        
    } catch (error) {
        console.error('Error loading compatibility tests:', error);
        res.status(500).json({ error: 'Failed to load compatibility tests' });
    }
});

/**
 * View specific compatibility test product
 */
router.get('/compatibility-test/:productId', requireAdmin, async (req, res) => {
    try {
        const { productId } = req.params;
        
        const { initializeFirebaseAdmin } = require('../helpers/firebase-admin-utils');
        initializeFirebaseAdmin();
        const admin = require('firebase-admin');
        const db = admin.app('admin').database();
        
        const testProductSnapshot = await db.ref(`admin/compatibility-tests/${productId}`).once('value');
        const testProduct = testProductSnapshot.val();
        
        if (!testProduct) {
            return res.status(404).json({ error: 'Test product not found' });
        }
        
        // Get actual product from Printify
        const EnhancedPrintifyService = require('../services/enhanced-printify-service');
        const printifyService = new EnhancedPrintifyService();
        
        let printifyProduct = null;
        try {
            const productResult = await printifyService.getProduct(productId);
            printifyProduct = productResult.product;
        } catch (error) {
            console.warn('Failed to fetch Printify product:', error.message);
        }
        
        res.render('admin-compatibility-test-product', {
            title: `Admin - Test Product ${productId}`,
            testProduct,
            printifyProduct
        });
        
    } catch (error) {
        console.error('Error loading test product:', error);
        res.status(500).json({ error: 'Failed to load test product' });
    }
});

/**
 * Cleanup test products
 */
router.post('/cleanup-tests', requireAdmin, async (req, res) => {
    try {
        const { testRunId, deleteProducts } = req.body;
        
        const { initializeFirebaseAdmin } = require('../helpers/firebase-admin-utils');
        initializeFirebaseAdmin();
        const admin = require('firebase-admin');
        const db = admin.app('admin').database();
        
        if (testRunId) {
            // Clean up specific test run
            const testRunSnapshot = await db.ref(`admin/compatibility-test-runs/${testRunId}`).once('value');
            const testRun = testRunSnapshot.val();
            
            if (testRun && deleteProducts) {
                const EnhancedPrintifyService = require('../services/enhanced-printify-service');
                const printifyService = new EnhancedPrintifyService();
                
                let deletedCount = 0;
                for (const product of testRun.products || []) {
                    try {
                        await printifyService.deleteProduct(product.productId);
                        await db.ref(`admin/compatibility-tests/${product.productId}`).remove();
                        deletedCount++;
                    } catch (error) {
                        console.warn(`Failed to delete product ${product.productId}:`, error.message);
                    }
                }
                
                // Mark test run as cleaned up
                await db.ref(`admin/compatibility-test-runs/${testRunId}/status`).set('CLEANED_UP');
                await db.ref(`admin/compatibility-test-runs/${testRunId}/cleanedUpAt`).set(new Date().toISOString());
                
                res.json({ 
                    success: true, 
                    message: `Cleaned up ${deletedCount} test products`,
                    deletedCount 
                });
            } else {
                res.json({ success: true, message: 'Test run marked for cleanup' });
            }
        } else {
            res.status(400).json({ error: 'Test run ID required' });
        }
        
    } catch (error) {
        console.error('Error cleaning up tests:', error);
        res.status(500).json({ error: 'Failed to cleanup tests' });
    }
});

/**
 * Export compatibility matrix
 */
router.get('/export-compatibility', requireAdmin, async (req, res) => {
    try {
        const { initializeFirebaseAdmin } = require('../helpers/firebase-admin-utils');
        initializeFirebaseAdmin();
        const admin = require('firebase-admin');
        const db = admin.app('admin').database();
        
        const testProductsSnapshot = await db.ref('admin/compatibility-tests').once('value');
        const testProducts = testProductsSnapshot.val() || {};
        
        const compatibilityMatrix = {
            exportedAt: new Date().toISOString(),
            totalProducts: Object.keys(testProducts).length,
            working: [],
            failed: [],
            summary: {}
        };
        
        Object.values(testProducts).forEach(product => {
            if (product.status === 'SUCCESS') {
                compatibilityMatrix.working.push({
                    blueprintId: product.blueprintId,
                    vendorId: product.vendorId,
                    name: product.name,
                    productId: product.productId
                });
            } else {
                compatibilityMatrix.failed.push({
                    blueprintId: product.blueprintId,
                    vendorId: product.vendorId,
                    name: product.name,
                    error: product.error
                });
            }
        });
        
        // Generate summary statistics
        const blueprintStats = {};
        const vendorStats = {};
        
        compatibilityMatrix.working.forEach(item => {
            blueprintStats[item.blueprintId] = (blueprintStats[item.blueprintId] || 0) + 1;
            vendorStats[item.vendorId] = (vendorStats[item.vendorId] || 0) + 1;
        });
        
        compatibilityMatrix.summary = {
            blueprintStats,
            vendorStats,
            successRate: Math.round((compatibilityMatrix.working.length / compatibilityMatrix.totalProducts) * 100)
        };
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="compatibility-matrix-${Date.now()}.json"`);
        res.json(compatibilityMatrix);
        
    } catch (error) {
        console.error('Error exporting compatibility matrix:', error);
        res.status(500).json({ error: 'Failed to export compatibility matrix' });
    }
});

/**
 * API endpoint to get compatibility data for customer filtering
 */
router.get('/api/compatibility-matrix', async (req, res) => {
    try {
        const { initializeFirebaseAdmin } = require('../helpers/firebase-admin-utils');
        initializeFirebaseAdmin();
        const admin = require('firebase-admin');
        const db = admin.app('admin').database();
        
        const testProductsSnapshot = await db.ref('admin/compatibility-tests').once('value');
        const testProducts = testProductsSnapshot.val() || {};
        
        const workingCombinations = Object.values(testProducts)
            .filter(product => product.status === 'SUCCESS')
            .map(product => ({
                blueprintId: product.blueprintId,
                vendorId: product.vendorId,
                verified: true,
                testedAt: product.createdAt
            }));
        
        res.json({
            success: true,
            workingCombinations,
            lastUpdated: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error getting compatibility matrix:', error);
        res.status(500).json({ error: 'Failed to get compatibility matrix' });
    }
});

module.exports = router;