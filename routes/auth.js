/**
 * Authentication Routes for Wavelength Lore
 * Handles login/logout redirects and authentication flow
 */

const express = require('express');
const router = express.Router();

/**
 * GET /login
 * Login page with optional redirect support
 */
router.get('/login', (req, res) => {
    console.log('🔐 Login route accessed with redirect:', req.query.redirect);
    const redirectUrl = req.query.redirect || '/';
    
    res.render('auth/login', {
        title: 'Sign In - Wavelength Lore',
        redirectUrl: redirectUrl,
        currentPage: 'login',
        breadcrumbs: [
          { name: 'Home', url: '/' },
          { name: 'Sign In', url: '/login' }
        ],
        cdnUrl: process.env.CDN_URL
    });
});

/**
 * GET /logout  
 * Logout page with redirect support
 */
router.get('/logout', (req, res) => {
    const redirectUrl = req.query.redirect || '/';
    
    res.render('auth/logout', {
        title: 'Sign Out - Wavelength Lore',
        redirectUrl: redirectUrl,
        currentPage: 'logout',
        breadcrumbs: [
          { name: 'Home', url: '/' },
          { name: 'Sign Out', url: '/logout' }
        ],
        cdnUrl: process.env.CDN_URL
    });
});

/**
 * GET /auth/callback
 * Handle authentication callback (for future OAuth implementations)
 */
router.get('/auth/callback', (req, res) => {
    const redirectUrl = req.query.redirect || '/';
    res.redirect(redirectUrl);
});

module.exports = router;