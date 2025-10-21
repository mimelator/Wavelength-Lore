/**
 * Content Update API Routes
 * Handles updating Episodes, Characters, and Lore content
 * Requires content_manager role or higher
 */

const express = require('express');
const router = express.Router();

// Import authentication middleware
const { requireGroup } = require('../middleware/groupAuth');

// Import Firebase Admin utilities
const { updateDataAsAdmin } = require('../helpers/firebase-admin-utils');

/**
 * Helper function to strip CDN URL from paths
 * Ensures we only store relative paths in the database
 */
function stripCdnUrl(url) {
    if (!url || typeof url !== 'string') return url;
    
    const cdnUrl = process.env.CDN_URL;
    if (!cdnUrl) return url;
    
    // Remove the CDN URL prefix if it exists
    if (url.startsWith(cdnUrl)) {
        return url.substring(cdnUrl.length).replace(/^\/+/, '');
    }
    
    // Also handle https:// URLs that might be CDN URLs
    const cdnDomain = cdnUrl.replace(/^https?:\/\//, '');
    if (url.includes(cdnDomain)) {
        const parts = url.split(cdnDomain);
        return parts[1] ? parts[1].replace(/^\/+/, '') : url;
    }
    
    return url;
}

/**
 * Helper function to strip CDN URLs from an array of paths
 */
function stripCdnUrlsFromArray(arr) {
    if (!Array.isArray(arr)) return arr;
    return arr.map(item => stripCdnUrl(item)).filter(item => item);
}

/**
 * Update Episode Content
 * PUT /api/content/episode/:contentId
 */
router.put('/api/content/episode/:contentId', requireGroup('content_manager'), async (req, res) => {
    try {
        const { firebasePath, data } = req.body;

        if (!firebasePath || !data) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: firebasePath and data'
            });
        }

        // Validate required episode fields
        if (!data.title || !data.description) {
            return res.status(400).json({
                success: false,
                error: 'Title and description are required'
            });
        }

        console.log('📝 Updating episode at:', firebasePath);
        console.log('🎵 Audio URL in request:', data.audio);

        // Update in Firebase using Admin SDK
        const success = await updateDataAsAdmin(firebasePath, data);

        if (success) {
            // Clear episode cache to force refresh
            const episodeHelpers = require('../helpers/episode-helpers');
            if (episodeHelpers.clearCache) {
                episodeHelpers.clearCache();
                console.log('✅ Episode cache cleared after update');
            }
            
            res.json({
                success: true,
                message: 'Episode updated successfully',
                timestamp: new Date().toISOString()
            });
        } else {
            throw new Error('Failed to update episode in Firebase');
        }

    } catch (error) {
        console.error('Error updating episode:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
});

/**
 * Update Character Content
 * PUT /api/content/character/:contentId
 */
router.put('/api/content/character/:contentId', requireGroup('content_manager'), async (req, res) => {
    try {
        const { contentId } = req.params;
        const { data } = req.body;

        if (!data) {
            return res.status(400).json({
                success: false,
                error: 'Missing required field: data'
            });
        }

        // Validate required character fields
        if (!data.title || !data.description) {
            return res.status(400).json({
                success: false,
                error: 'Title and description are required'
            });
        }

        // Characters are now stored directly by ID (new structure)
        const updatePath = `characters/${contentId}`;
        
        // Get current character data from Firebase
        const { fetchDataAsAdmin } = require('../helpers/firebase-admin-utils');
        const currentData = await fetchDataAsAdmin(updatePath);
        
        if (!currentData) {
            return res.status(404).json({
                success: false,
                error: `Character ${contentId} not found`
            });
        }
        
        // Merge current data with updates
        const updatedData = {
            ...currentData,
            ...data,
            id: contentId // Ensure ID doesn't change
        };
        
        // Strip CDN URLs from image_gallery if present
        if (updatedData.image_gallery) {
            updatedData.image_gallery = stripCdnUrlsFromArray(updatedData.image_gallery);
        }
        
        // Strip CDN URL from primary_image if present
        if (updatedData.primary_image) {
            updatedData.primary_image = stripCdnUrl(updatedData.primary_image);
        }
        
        console.log(`📝 Updating character at: ${updatePath}`);

        // Update in Firebase using Admin SDK
        const success = await updateDataAsAdmin(updatePath, updatedData);

        if (success) {
            // Clear character cache so changes are reflected
            const characterHelpers = require('../helpers/character-helpers');
            if (characterHelpers.clearCache) {
                characterHelpers.clearCache();
            }
            
            res.json({
                success: true,
                message: 'Character updated successfully',
                timestamp: new Date().toISOString()
            });
        } else {
            throw new Error('Failed to update character in Firebase');
        }

    } catch (error) {
        console.error('Error updating character:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
});

/**
 * Update Lore Content
 * PUT /api/content/lore/:contentId
 */
router.put('/api/content/lore/:contentId', requireGroup('content_manager'), async (req, res) => {
    try {
        const { firebasePath, data } = req.body;

        if (!firebasePath || !data) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: firebasePath and data'
            });
        }

        // Validate required lore fields
        if (!data.title || !data.description) {
            return res.status(400).json({
                success: false,
                error: 'Title and description are required'
            });
        }

        // Strip CDN URLs from image_gallery if present
        if (data.image_gallery) {
            data.image_gallery = stripCdnUrlsFromArray(data.image_gallery);
        }
        
        // Strip CDN URL from image if present
        if (data.image) {
            data.image = stripCdnUrl(data.image);
        }

        // Update in Firebase using Admin SDK
        const success = await updateDataAsAdmin(firebasePath, data);

        if (success) {
            // Clear lore cache to force refresh
            const loreHelpers = require('../helpers/lore-helpers');
            loreHelpers.clearLoreCache();
            console.log('✅ Lore cache cleared after update');
            
            res.json({
                success: true,
                message: 'Lore updated successfully',
                timestamp: new Date().toISOString()
            });
        } else {
            throw new Error('Failed to update lore in Firebase');
        }

    } catch (error) {
        console.error('Error updating lore:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
});

/**
 * Create New Episode
 * POST /api/content/episode
 */
router.post('/api/content/episode', requireGroup('content_manager'), async (req, res) => {
    try {
        const { seasonNumber, episodeNumber, data } = req.body;

        if (!seasonNumber || !episodeNumber || !data) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: seasonNumber, episodeNumber, and data'
            });
        }

        // Validate required episode fields
        if (!data.title || !data.description) {
            return res.status(400).json({
                success: false,
                error: 'Title and description are required'
            });
        }

        const firebasePath = `videos/season${seasonNumber}/episodes/episode${episodeNumber}`;

        // Check if episode already exists
        const { fetchDataAsAdmin } = require('../helpers/firebase-admin-utils');
        const existingEpisode = await fetchDataAsAdmin(firebasePath);

        if (existingEpisode) {
            return res.status(409).json({
                success: false,
                error: `Episode ${episodeNumber} in Season ${seasonNumber} already exists`
            });
        }

        // Create default episode structure
        const episodeData = {
            title: data.title,
            description: data.description,
            keywords: data.keywords || [],
            youtubeLink: data.youtubeLink || '',
            audio: data.audio || '',
            image: data.image || '',
            carouselImages: data.carouselImages || [],
            visible: data.visible !== undefined ? data.visible : false // Default to hidden
        };

        console.log('📝 Creating new episode at:', firebasePath);

        // Create in Firebase using Admin SDK
        const success = await updateDataAsAdmin(firebasePath, episodeData);

        if (success) {
            // Clear episode cache to force refresh
            const episodeHelpers = require('../helpers/episode-helpers');
            if (episodeHelpers.clearCache) {
                episodeHelpers.clearCache();
                console.log('✅ Episode cache cleared after creation');
            }

            res.json({
                success: true,
                message: 'Episode created successfully',
                firebasePath: firebasePath,
                episodeId: `season${seasonNumber}-episode${episodeNumber}`,
                timestamp: new Date().toISOString()
            });
        } else {
            throw new Error('Failed to create episode in Firebase');
        }

    } catch (error) {
        console.error('Error creating episode:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
});

/**
 * Create New Character
 * POST /api/content/character
 */
router.post('/api/content/character', requireGroup('content_manager'), async (req, res) => {
    try {
        const { characterId, data } = req.body;

        if (!characterId || !data) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: characterId and data'
            });
        }

        // Validate characterId format (lowercase, hyphens only)
        if (!/^[a-z0-9-]+$/.test(characterId)) {
            return res.status(400).json({
                success: false,
                error: 'Character ID must be lowercase with hyphens only (e.g., goblin-king)'
            });
        }

        // Validate required character fields
        if (!data.title || !data.description) {
            return res.status(400).json({
                success: false,
                error: 'Title and description are required'
            });
        }

        const firebasePath = `characters/${characterId}`;

        // Check if character already exists
        const { fetchDataAsAdmin } = require('../helpers/firebase-admin-utils');
        const existingCharacter = await fetchDataAsAdmin(firebasePath);

        if (existingCharacter) {
            return res.status(409).json({
                success: false,
                error: `Character ${characterId} already exists`
            });
        }

        // Create character data structure
        const characterData = {
            id: characterId,
            title: data.title,
            description: data.description,
            primary_image: stripCdnUrl(data.primary_image || ''),
            image_gallery: stripCdnUrlsFromArray(data.image_gallery || []),
            episodes: data.episodes || [],
            visible: data.visible !== undefined ? data.visible : false // Default to hidden
        };

        console.log(`📝 Creating new character at: ${firebasePath}`);

        // Create in Firebase using Admin SDK
        const success = await updateDataAsAdmin(firebasePath, characterData);

        if (success) {
            // Clear character cache
            const characterHelpers = require('../helpers/character-helpers');
            if (characterHelpers.clearCache) {
                characterHelpers.clearCache();
                console.log('✅ Character cache cleared after creation');
            }

            res.json({
                success: true,
                message: 'Character created successfully',
                firebasePath: firebasePath,
                characterId: characterId,
                timestamp: new Date().toISOString()
            });
        } else {
            throw new Error('Failed to create character in Firebase');
        }

    } catch (error) {
        console.error('Error creating character:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
});

/**
 * Create New Lore
 * POST /api/content/lore
 */
router.post('/api/content/lore', requireGroup('content_manager'), async (req, res) => {
    try {
        const { loreId, data } = req.body;

        if (!loreId || !data) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: loreId and data'
            });
        }

        // Validate loreId format (lowercase, hyphens only)
        if (!/^[a-z0-9-]+$/.test(loreId)) {
            return res.status(400).json({
                success: false,
                error: 'Lore ID must be lowercase with hyphens only (e.g., ice-fortress)'
            });
        }

        // Validate required lore fields
        if (!data.title || !data.description) {
            return res.status(400).json({
                success: false,
                error: 'Title and description are required'
            });
        }

        const firebasePath = `lore/${loreId}`;

        // Check if lore already exists
        const { fetchDataAsAdmin } = require('../helpers/firebase-admin-utils');
        const existingLore = await fetchDataAsAdmin(firebasePath);

        if (existingLore) {
            return res.status(409).json({
                success: false,
                error: `Lore ${loreId} already exists`
            });
        }

        // Create lore data structure
        const loreData = {
            id: loreId,
            title: data.title,
            description: data.description,
            category: data.category || 'other',
            primary_image: stripCdnUrl(data.primary_image || ''),
            image_gallery: stripCdnUrlsFromArray(data.image_gallery || []),
            related_episodes: data.related_episodes || [],
            related_characters: data.related_characters || [],
            visible: data.visible !== undefined ? data.visible : false // Default to hidden
        };

        console.log(`📝 Creating new lore at: ${firebasePath}`);

        // Create in Firebase using Admin SDK
        const success = await updateDataAsAdmin(firebasePath, loreData);

        if (success) {
            // Clear lore cache
            const loreHelpers = require('../helpers/lore-helpers');
            if (loreHelpers.clearLoreCache) {
                loreHelpers.clearLoreCache();
                console.log('✅ Lore cache cleared after creation');
            }

            res.json({
                success: true,
                message: 'Lore created successfully',
                firebasePath: firebasePath,
                loreId: loreId,
                timestamp: new Date().toISOString()
            });
        } else {
            throw new Error('Failed to create lore in Firebase');
        }

    } catch (error) {
        console.error('Error creating lore:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
});

/**
 * Toggle Episode Visibility
 * PUT /api/content/episode/:seasonNumber/:episodeNumber/visibility
 */
router.put('/api/content/episode/:seasonNumber/:episodeNumber/visibility', requireGroup('content_manager'), async (req, res) => {
    try {
        const { seasonNumber, episodeNumber } = req.params;
        const { visible } = req.body;

        if (visible === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Missing required field: visible'
            });
        }

        const firebasePath = `videos/season${seasonNumber}/episodes/episode${episodeNumber}`;

        // Get current episode data
        const { fetchDataAsAdmin } = require('../helpers/firebase-admin-utils');
        const episodeData = await fetchDataAsAdmin(firebasePath);

        if (!episodeData) {
            return res.status(404).json({
                success: false,
                error: `Episode ${episodeNumber} in Season ${seasonNumber} not found`
            });
        }

        // Update visibility
        const updatedData = {
            ...episodeData,
            visible: visible
        };

        const success = await updateDataAsAdmin(firebasePath, updatedData);

        if (success) {
            // Clear episode cache
            const episodeHelpers = require('../helpers/episode-helpers');
            if (episodeHelpers.clearCache) {
                episodeHelpers.clearCache();
            }

            res.json({
                success: true,
                message: `Episode ${visible ? 'revealed' : 'hidden'} successfully`,
                visible: visible,
                timestamp: new Date().toISOString()
            });
        } else {
            throw new Error('Failed to update episode visibility');
        }

    } catch (error) {
        console.error('Error toggling episode visibility:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
});

/**
 * Toggle Character Visibility
 * PUT /api/content/character/:characterId/visibility
 */
router.put('/api/content/character/:characterId/visibility', requireGroup('content_manager'), async (req, res) => {
    try {
        const { characterId } = req.params;
        const { visible } = req.body;

        if (visible === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Missing required field: visible'
            });
        }

        const firebasePath = `characters/${characterId}`;

        // Get current character data
        const { fetchDataAsAdmin } = require('../helpers/firebase-admin-utils');
        const characterData = await fetchDataAsAdmin(firebasePath);

        if (!characterData) {
            return res.status(404).json({
                success: false,
                error: `Character ${characterId} not found`
            });
        }

        // Update visibility
        const updatedData = {
            ...characterData,
            visible: visible
        };

        const success = await updateDataAsAdmin(firebasePath, updatedData);

        if (success) {
            // Clear character cache
            const characterHelpers = require('../helpers/character-helpers');
            if (characterHelpers.clearCache) {
                characterHelpers.clearCache();
            }

            res.json({
                success: true,
                message: `Character ${visible ? 'revealed' : 'hidden'} successfully`,
                visible: visible,
                timestamp: new Date().toISOString()
            });
        } else {
            throw new Error('Failed to update character visibility');
        }

    } catch (error) {
        console.error('Error toggling character visibility:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
});

/**
 * Toggle Lore Visibility
 * PUT /api/content/lore/:loreId/visibility
 */
router.put('/api/content/lore/:loreId/visibility', requireGroup('content_manager'), async (req, res) => {
    try {
        const { loreId } = req.params;
        const { visible } = req.body;

        if (visible === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Missing required field: visible'
            });
        }

        const firebasePath = `lore/${loreId}`;

        // Get current lore data
        const { fetchDataAsAdmin } = require('../helpers/firebase-admin-utils');
        const loreData = await fetchDataAsAdmin(firebasePath);

        if (!loreData) {
            return res.status(404).json({
                success: false,
                error: `Lore ${loreId} not found`
            });
        }

        // Update visibility
        const updatedData = {
            ...loreData,
            visible: visible
        };

        const success = await updateDataAsAdmin(firebasePath, updatedData);

        if (success) {
            // Clear lore cache
            const loreHelpers = require('../helpers/lore-helpers');
            if (loreHelpers.clearLoreCache) {
                loreHelpers.clearLoreCache();
            }

            res.json({
                success: true,
                message: `Lore ${visible ? 'revealed' : 'hidden'} successfully`,
                visible: visible,
                timestamp: new Date().toISOString()
            });
        } else {
            throw new Error('Failed to update lore visibility');
        }

    } catch (error) {
        console.error('Error toggling lore visibility:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
});

module.exports = router;
