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

        // Update in Firebase using Admin SDK
        const success = await updateDataAsAdmin(firebasePath, data);

        if (success) {
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

        // Characters are stored in categories as arrays, need to find and update the right one
        const firebaseUtils = require('../helpers/firebase-utils');
        const charactersData = await firebaseUtils.fetchFromFirebase('characters');
        
        if (!charactersData) {
            return res.status(404).json({
                success: false,
                error: 'Characters data not found'
            });
        }
        
        // Find the character in all categories
        let foundCategory = null;
        let characterIndex = -1;
        
        for (const category in charactersData) {
            if (Array.isArray(charactersData[category])) {
                characterIndex = charactersData[category].findIndex(c => c.id === contentId);
                if (characterIndex !== -1) {
                    foundCategory = category;
                    break;
                }
            }
        }
        
        if (foundCategory === null || characterIndex === -1) {
            return res.status(404).json({
                success: false,
                error: `Character ${contentId} not found`
            });
        }
        
        // Get current character data and merge with updates
        const currentData = charactersData[foundCategory][characterIndex];
        const updatedData = {
            ...currentData,
            ...data,
            id: contentId // Ensure ID doesn't change
        };
        
        const updatePath = `characters/${foundCategory}/${characterIndex}`;
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

        // Update in Firebase using Admin SDK
        const success = await updateDataAsAdmin(firebasePath, data);

        if (success) {
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

module.exports = router;
