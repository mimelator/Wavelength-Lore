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
 * Individual game page
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
                    id: 'wavelength-quest',
                    title: 'Wavelength Quest',
                    description: 'An interactive adventure through the Wavelength universe',
                    thumbnail: '/images/games/wavelength-quest.jpg',
                    status: 'coming-soon',
                    releaseDate: '2024-Q4'
                },
                {
                    id: 'lore-puzzle',
                    title: 'Lore Puzzle Master',
                    description: 'Solve puzzles based on Wavelength lore and characters',
                    thumbnail: '/images/games/lore-puzzle.jpg',
                    status: 'coming-soon',
                    releaseDate: '2024-Q4'
                }
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

module.exports = router;
