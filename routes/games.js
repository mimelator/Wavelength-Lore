/**
 * Wavelength Games - VIP Sandbox Environment
 * Dedicated route handler for VIP games hub
 */

const express = require('express');
const router = express.Router();
const { groupAuth } = require('../middleware/groupAuth');
const { generateGamesWithTheme, getActiveTheme } = require('../config/game-themes');

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
 * Now using configurable theme system for easy name iteration!
 */
router.get('/api/list', groupAuth.requireAction('game_access'), async (req, res) => {
    try {
        // Generate games using the active theme configuration
        const themedGames = generateGamesWithTheme();
        const activeTheme = getActiveTheme();
        
        res.json({
            success: true,
            games: themedGames,
            theme: {
                name: activeTheme.prefix,
                atmosphere: activeTheme.atmosphere,
                callToAction: activeTheme.callToAction
            },
            userGroup: req.userGroups[0] || 'user',
            meta: {
                generated: new Date().toISOString(),
                total_games: themedGames.length,
                theme_applied: true
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
 */
router.get('/api/:gameId', groupAuth.requireAction('game_access'), async (req, res) => {
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
 */
router.get('/api/preview-theme/:theme', groupAuth.requireAction('game_access'), async (req, res) => {
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
