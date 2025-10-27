/**
 * Wavelength Games - VIP Sandbox Environment
 * Dedicated route handler for VIP games hub
 */

const express = require('express');
const router = express.Router();
const { groupAuth } = require('../middleware/groupAuth');
const { generateGamesWithTheme, getActiveTheme } = require('../config/game-themes');

/**
 * Games Hub - Main landing page for games
 * 🎯 GO-LIVE UPDATE: Now accessible to all authenticated members!
 */
router.get('/', groupAuth.requireAction('game_access_member'), (req, res) => {
    const theme = getActiveTheme();
    
    res.render('games/hub', {
        title: `${theme.prefix}: Wavelength Game Hub`,
        currentPage: 'games-hub',
        breadcrumbs: [
            { name: 'Strategic Training Hub', url: null }
        ],
        userGroups: req.userGroups,
        theme: theme,
        cdnUrl: process.env.CDN_URL,
        version: `v${Date.now()}`
    });
});

/**
 * Wavelength Gems - Match-3 Puzzle Game
 * 🎯 GO-LIVE UPDATE: Now accessible to all authenticated members!
 */
router.get('/wavelength-gems', groupAuth.requireAction('game_access_member'), (req, res) => {
    res.render('games/wavelength-gems', {
        title: 'Wavelength Gems',
        currentPage: 'wavelength-gems',
        breadcrumbs: [
            { name: 'Games', url: '/games' },
            { name: 'Wavelength Gems', url: null }
        ],
        cdnUrl: process.env.CDN_URL,
        version: `v${Date.now()}`,
        userGroups: req.userGroups || [] // Pass user groups for permission checks
    });
});

/**
 * 🧩 NEW: Wavelength Lore Jigsaw Puzzle Game
 * Strategic puzzle reconstruction with lore-based imagery
 * 🔒 DEVELOPMENT: Still VIP-only as it's under development
 */
router.get('/wavelength-lore-jigsaw', groupAuth.requireAction('game_access'), (req, res) => {
    const { getActiveTheme } = require('../config/game-themes');
    const theme = getActiveTheme();
    
    res.render('games/wavelength-lore-jigsaw', {
        title: `${theme.prefix}: Lore Tapestry`,
        currentPage: 'wavelength-lore-jigsaw',
        breadcrumbs: [
            { name: 'Games', url: '/games' },
            { name: 'Lore Tapestry', url: null }
        ],
        cdnUrl: process.env.CDN_URL,
        version: `v${Date.now()}`,
        userGroups: req.userGroups || [],
        theme: theme
    });
});

/**
 * Support themed game routes (e.g., /games/shire-lore-tapestry)
 * 🎯 SMART ACCESS CONTROL: Different games have different access levels
 */
router.get('/:gameId', (req, res, next) => {
    const gameId = req.params.gameId;
    
    // Check if it's a jigsaw puzzle game with any theme - these are VIP-only (still under development)
    if (gameId.includes('lore-tapestry') || gameId.includes('jigsaw')) {
        return groupAuth.requireAction('game_access')(req, res, next);
    }
    
    // All other games are available to authenticated members
    return groupAuth.requireAction('game_access_member')(req, res, next);
}, (req, res) => {
    const gameId = req.params.gameId;
    
    // Check if it's a jigsaw puzzle game with any theme
    if (gameId.includes('lore-tapestry') || gameId.includes('jigsaw')) {
        const { getActiveTheme } = require('../config/game-themes');
        const theme = getActiveTheme();
        
        return res.render('games/wavelength-lore-jigsaw', {
            title: `${theme.prefix}: Lore Tapestry`,
            currentPage: gameId,
            breadcrumbs: [
                { name: 'Games', url: '/games' },
                { name: 'Lore Tapestry', url: null }
            ],
            cdnUrl: process.env.CDN_URL,
            version: `v${Date.now()}`,
            userGroups: req.userGroups || [],
            theme: theme
        });
    }

    // Generic game page for other games
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
 * Now using configurable theme system for easy name iteration!
 * 🎯 GO-LIVE UPDATE: Available to all authenticated members
 */
router.get('/api/list', groupAuth.requireAction('game_access_member'), async (req, res) => {
    try {
        // Generate games using the active theme configuration
        const allThemedGames = generateGamesWithTheme();
        const activeTheme = getActiveTheme();
        
        // 🎯 GO-LIVE FILTERING: Show different games based on user access level
        const userGroups = req.userGroups || ['user'];
        const hasVipAccess = req.groupAuth && req.groupAuth.canPerform('game_access');
        
        // Filter games based on access level
        const availableGames = allThemedGames.map(game => {
            // Jigsaw puzzle is VIP-only and coming soon
            if (game.id.includes('lore-tapestry') || game.id.includes('jigsaw') || game.vip_exclusive) {
                if (!hasVipAccess) {
                    return {
                        ...game,
                        status: 'vip-required',
                        cta_primary: 'VIP Only - Coming Soon',
                        description: game.description, // Keep the original description which already mentions VIP Only
                        access_note: 'This advanced strategic puzzle experience is exclusive to VIP members.',
                        upgrade_message: 'Upgrade to VIP for exclusive access to development games!'
                    };
                }
                // For VIP users, keep the coming-soon status
                return {
                    ...game,
                    status: 'coming-soon',
                    vip_preview: true
                };
            }
            return game;
        });
        
        res.json({
            success: true,
            games: availableGames,
            theme: {
                name: activeTheme.prefix,
                atmosphere: activeTheme.atmosphere,
                callToAction: activeTheme.callToAction
            },
            userGroup: req.userGroups[0] || 'user',
            userAccess: {
                hasVipAccess: hasVipAccess,
                canPlayAllGames: hasVipAccess,
                memberGames: availableGames.filter(g => !g.id.includes('lore-tapestry')).length,
                vipGames: availableGames.filter(g => g.id.includes('lore-tapestry')).length
            },
            meta: {
                generated: new Date().toISOString(),
                total_games: availableGames.length,
                theme_applied: true,
                go_live_filtering: true
            }
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
 * 🎯 GO-LIVE UPDATE: Smart access control per game
 */
router.get('/api/:gameId', (req, res, next) => {
    const gameId = req.params.gameId;
    
    // Jigsaw puzzle games require VIP access
    if (gameId.includes('lore-tapestry') || gameId.includes('jigsaw')) {
        return groupAuth.requireAction('game_access')(req, res, next);
    }
    
    // Other games available to all authenticated members
    return groupAuth.requireAction('game_access_member')(req, res, next);
}, async (req, res) => {
    try {
        const gameId = req.params.gameId;
        const themedGames = generateGamesWithTheme();
        const game = themedGames.find(g => g.id === gameId);

        if (!game) {
            return res.status(404).json({
                success: false,
                error: 'Game not found',
                available_games: themedGames.map(g => g.id)
            });
        }

        res.json({
            success: true,
            game: {
                ...game,
                url: `/games/${gameId}`,
                launch_ready: game.status === 'live'
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
 * 🎯 EASY THEME ITERATION ENDPOINT
 * For quick testing of different naming themes
 * Usage: GET /games/api/preview-theme/rivendell
 * 🎯 GO-LIVE UPDATE: Available to all authenticated members
 */
router.get('/api/preview-theme/:theme', groupAuth.requireAction('game_access_member'), async (req, res) => {
    try {
        const { switchTheme, getAllThemes } = require('../config/game-themes');
        const requestedTheme = req.params.theme;
        
        // Get preview of games with requested theme
        const previewGames = switchTheme(requestedTheme);
        
        res.json({
            success: true,
            theme: requestedTheme,
            games: previewGames,
            available_themes: getAllThemes(),
            note: 'This is a preview - to activate permanently, update ACTIVE_THEME in config/game-themes.js'
        });
    } catch (error) {
        console.error('Theme preview error:', error);
        res.status(400).json({
            success: false,
            error: error.message,
            available_themes: getAllThemes()
        });
    }
});

module.exports = router;
