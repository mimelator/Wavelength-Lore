/**
 * Wavelength Games - VIP Sandbox Environment
 * Dedicated route handler for VIP games hub
 */

const express = require('express');
const router = express.Router();
const { groupAuth } = require('../middleware/groupAuth');

/**
 * VIP Games Hub - Main landing page for games
 * Accessible only to VIP and higher tier users
 */
router.get('/', groupAuth.requireAction('game_access'), (req, res) => {
    res.render('games/hub', {
        title: 'Wavelength Games Hub',
        currentPage: 'games-hub',
        breadcrumbs: [
            { name: 'Games Hub', url: null }
        ],
        userGroups: req.userGroups,
        cdnUrl: process.env.CDN_URL,
        version: `v${Date.now()}`
    });
});

/**
 * Wavelength Gems - Match-3 Puzzle Game
 */
router.get('/wavelength-gems', groupAuth.requireAction('game_access'), (req, res) => {
    // Collect AdMob environment variables
    const adMobEnvVars = {
        // App IDs
        ADMOB_APP_ID_ANDROID: process.env.ADMOB_APP_ID_ANDROID || '',
        ADMOB_APP_ID_IOS: process.env.ADMOB_APP_ID_IOS || '',
        ADMOB_APP_ID_WEB: process.env.ADMOB_APP_ID_WEB || '',
        
        // Rewarded video ad units
        ADMOB_REWARDED_VIDEO_PROD: process.env.ADMOB_REWARDED_VIDEO_PROD || '',
        ADMOB_REWARDED_EXTRA_LIFE_PROD: process.env.ADMOB_REWARDED_EXTRA_LIFE_PROD || '',
        ADMOB_REWARDED_POWER_GEM_PROD: process.env.ADMOB_REWARDED_POWER_GEM_PROD || '',
        ADMOB_REWARDED_SCORE_MULTI_PROD: process.env.ADMOB_REWARDED_SCORE_MULTI_PROD || '',
        
        // Interstitial ad units
        ADMOB_INTERSTITIAL_PROD: process.env.ADMOB_INTERSTITIAL_PROD || '',
        ADMOB_INTERSTITIAL_LEVEL_PROD: process.env.ADMOB_INTERSTITIAL_LEVEL_PROD || '',
        ADMOB_INTERSTITIAL_GAMEOVER_PROD: process.env.ADMOB_INTERSTITIAL_GAMEOVER_PROD || '',
        
        // Settings
        ADMOB_USE_TEST_ADS: process.env.ADMOB_USE_TEST_ADS || 'true',
        ADMOB_ENABLED: process.env.ADMOB_ENABLED || 'true',
        ADMOB_MIN_TIME_BETWEEN_ADS: process.env.ADMOB_MIN_TIME_BETWEEN_ADS || '60000',
        ADMOB_INTERSTITIAL_FREQUENCY: process.env.ADMOB_INTERSTITIAL_FREQUENCY || '3',
        ADMOB_MAX_CONTENT_RATING: process.env.ADMOB_MAX_CONTENT_RATING || 'PG',
        ADMOB_CHILD_DIRECTED: process.env.ADMOB_CHILD_DIRECTED || 'false',
        ADMOB_UNDER_AGE_CONSENT: process.env.ADMOB_UNDER_AGE_CONSENT || 'false'
    };
    
    res.render('games/wavelength-gems', {
        title: 'Wavelength Gems',
        currentPage: 'wavelength-gems',
        breadcrumbs: [
            { name: 'Games', url: '/games' },
            { name: 'Wavelength Gems', url: null }
        ],
        cdnUrl: process.env.CDN_URL,
        version: `v${Date.now()}`,
        adMobEnvVars: adMobEnvVars, // Pass AdMob env vars to the template
        userGroups: req.userGroups || [] // Pass user groups for permission checks
    });
});

/**
 * Individual game page (generic template for future games)
 * Template for launching hosted games
 */
router.get('/:gameId', groupAuth.requireAction('game_access'), (req, res) => {
    const gameId = req.params.gameId;

    res.render('games/game-page', {
        title: 'Game',
        currentPage: 'game',
        gameId: gameId,
        userGroups: req.userGroups,
        breadcrumbs: [
            { name: 'Games', url: '/games' },
            { name: 'Game', url: null }
        ],
        cdnUrl: process.env.CDN_URL,
        version: `v${Date.now()}`
    });
});

/**
 * API endpoint to fetch available games
 */
router.get('/api/list', groupAuth.requireAction('game_access'), async (req, res) => {
    try {
        // This will be populated with games from Firebase
        // For now, return placeholder structure
        res.json({
            success: true,
            games: [
                {
                    id: 'wavelength-gems',
                    title: 'Wavelength Gems',
                    description: 'Match the ice blue gems in this addictive match-3 puzzle game featuring Wavelength characters and elements',
                    thumbnail: '/images/games/wavelength-gems-ice-diamond.svg',
                    status: 'live',
                    releaseDate: '2024-10-21'
                },
                {
                    id: 'lore-puzzle',
                    title: 'Lore Puzzle Master',
                    description: 'Solve puzzles based on Wavelength lore and characters',
                    thumbnail: '/images/games/lore-puzzle.jpg',
                    status: 'coming-soon',
                    releaseDate: '2026-Q1'
                },
        ],
            userGroup: req.userGroups[0] || 'user'
        });
    } catch (error) {
        console.error('Error fetching games:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch games',
            details: error.message
        });
    }
});

/**
 * API endpoint to get a specific game's metadata
 */
router.get('/api/:gameId', groupAuth.requireAction('game_access'), async (req, res) => {
    try {
        const gameId = req.params.gameId;

        // This will fetch from Firebase in production
        res.json({
            success: true,
            game: {
                id: gameId,
                title: 'Game Title',
                description: 'Game description',
                status: 'coming-soon',
                url: `/games/${gameId}`
            }
        });
    } catch (error) {
        console.error('Error fetching game:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch game'
        });
    }
});

/**
 * Unity Ads Test Page - Development testing interface
 * Only available in development/localhost environments
 */
router.get('/unity-ads-test', (req, res) => {
    // Only allow in development environments
    const isDevelopment = req.get('host').includes('localhost') || 
                         req.get('host').includes('dev') || 
                         process.env.NODE_ENV === 'development';
    
    if (!isDevelopment) {
        return res.status(404).send('Test page not available in production');
    }
    
    res.sendFile(require('path').join(__dirname, '../views/test/unity-ads-test.html'));
});

/**
 * Google IMA Test Page - Development testing interface for real video ads
 * Only available in development/localhost environments
 */
router.get('/google-ima-test', (req, res) => {
    // Only allow in development environments
    const isDevelopment = req.get('host').includes('localhost') || 
                         req.get('host').includes('dev') || 
                         process.env.NODE_ENV === 'development';
    
    if (!isDevelopment) {
        return res.status(404).send('Test page not available in production');
    }
    
    res.sendFile(require('path').join(__dirname, '../views/test/google-ima-test.html'));
});

module.exports = router;
