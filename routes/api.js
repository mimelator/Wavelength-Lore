const express = require('express');
const router = express.Router();

/**
 * WAVELENGTH API ROUTES
 * Safe, secure data delivery for complex JSON structures
 */

// Get seasons data - replaces dangerous template embedding
router.get('/seasons', (req, res) => {
    try {
        // Get seasons data from the same source as before
        const videosData = req.app.get('videosData') || {};
        
        // Return clean JSON with proper headers
        res.json({
            success: true,
            data: videosData,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('API Error - seasons:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load seasons data',
            message: error.message
        });
    }
});

// Get specific season data
router.get('/seasons/:seasonId', (req, res) => {
    try {
        const videosData = req.app.get('videosData') || {};
        const seasonId = req.params.seasonId;
        
        if (!videosData[seasonId]) {
            return res.status(404).json({
                success: false,
                error: 'Season not found',
                seasonId
            });
        }
        
        res.json({
            success: true,
            data: videosData[seasonId],
            seasonId,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error(`API Error - season ${req.params.seasonId}:`, error);
        res.status(500).json({
            success: false,
            error: 'Failed to load season data',
            message: error.message
        });
    }
});

// Get all characters data - safe JSON delivery
router.get('/characters', async (req, res) => {
    try {
        const { fetchDataAsAdmin } = require('../helpers/firebase-admin-utils');
        const charactersData = await fetchDataAsAdmin('characters');
        
        res.json({
            success: true,
            data: charactersData || {},
            timestamp: new Date().toISOString(),
            count: Object.keys(charactersData || {}).length
        });
    } catch (error) {
        console.error('API Error - characters:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load characters data',
            message: error.message
        });
    }
});

// Get specific character data
router.get('/characters/:characterId', async (req, res) => {
    try {
        const { fetchDataAsAdmin } = require('../helpers/firebase-admin-utils');
        const characterId = req.params.characterId;
        const characterData = await fetchDataAsAdmin(`characters/${characterId}`);
        
        if (!characterData) {
            return res.status(404).json({
                success: false,
                error: 'Character not found',
                characterId
            });
        }
        
        res.json({
            success: true,
            data: characterData,
            characterId,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error(`API Error - character ${req.params.characterId}:`, error);
        res.status(500).json({
            success: false,
            error: 'Failed to load character data',
            message: error.message
        });
    }
});

// Get all lore data - safe JSON delivery  
router.get('/lore', async (req, res) => {
    try {
        const { fetchDataAsAdmin } = require('../helpers/firebase-admin-utils');
        const loreData = await fetchDataAsAdmin('lore');
        
        res.json({
            success: true,
            data: loreData || {},
            timestamp: new Date().toISOString(),
            count: Object.keys(loreData || {}).length
        });
    } catch (error) {
        console.error('API Error - lore:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load lore data',
            message: error.message
        });
    }
});

// Get specific lore object data
router.get('/lore/:loreId', async (req, res) => {
    try {
        const { fetchDataAsAdmin } = require('../helpers/firebase-admin-utils');
        const loreId = req.params.loreId;
        const loreData = await fetchDataAsAdmin(`lore/${loreId}`);
        
        if (!loreData) {
            return res.status(404).json({
                success: false,
                error: 'Lore object not found',
                loreId
            });
        }
        
        res.json({
            success: true,
            data: loreData,
            loreId,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error(`API Error - lore ${req.params.loreId}:`, error);
        res.status(500).json({
            success: false,
            error: 'Failed to load lore data',
            message: error.message
        });
    }
});

// Get all episodes data - safe JSON delivery
router.get('/episodes', async (req, res) => {
    try {
        const { fetchDataAsAdmin } = require('../helpers/firebase-admin-utils');
        const episodesData = await fetchDataAsAdmin('episodes');
        
        res.json({
            success: true,
            data: episodesData || {},
            timestamp: new Date().toISOString(),
            count: Object.keys(episodesData || {}).length
        });
    } catch (error) {
        console.error('API Error - episodes:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load episodes data',
            message: error.message
        });
    }
});

// Get specific episode data
router.get('/episodes/:episodeId', async (req, res) => {
    try {
        const { fetchDataAsAdmin } = require('../helpers/firebase-admin-utils');
        const episodeId = req.params.episodeId;
        const episodeData = await fetchDataAsAdmin(`episodes/${episodeId}`);
        
        if (!episodeData) {
            return res.status(404).json({
                success: false,
                error: 'Episode not found',
                episodeId
            });
        }
        
        res.json({
            success: true,
            data: episodeData,
            episodeId,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error(`API Error - episode ${req.params.episodeId}:`, error);
        res.status(500).json({
            success: false,
            error: 'Failed to load episode data',
            message: error.message
        });
    }
});

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'Wavelength API'
    });
});

module.exports = router;