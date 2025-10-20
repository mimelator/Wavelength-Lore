const express = require('express');
const { fetchDataAsAdmin } = require('../helpers/firebase-admin-utils');

const router = express.Router();

/**
 * GET /api/user/admin-status
 * Check if current user has admin privileges
 */
router.get('/admin-status', async (req, res) => {
    try {
        // Get user from Firebase Auth token
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, error: 'No auth token provided' });
        }

        const token = authHeader.substring(7);
        const admin = require('firebase-admin');
        const decodedToken = await admin.app('admin').auth().verifyIdToken(token);
        
        // Get user groups from database
        const userData = await fetchDataAsAdmin(`forum/users/${decodedToken.uid}`);
        const userGroups = userData?.groups || [];
        
        const isAdmin = userGroups.includes('admin') || userGroups.includes('super_admin');
        
        res.json({ 
            success: true, 
            isAdmin,
            groups: userGroups,
            uid: decodedToken.uid,
            email: decodedToken.email
        });
        
    } catch (error) {
        console.error('Admin status check error:', error);
        res.status(500).json({ success: false, error: 'Failed to check admin status' });
    }
});

module.exports = router;