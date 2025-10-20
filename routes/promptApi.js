/**
 * Prompt API Routes for Wavelength Lore
 *
 * RESTful API endpoints for CRUD operations on AI generation prompts
 * Supports filtering, searching, and relationship management
 */

const express = require('express');
const { fetchDataAsAdmin, writeDataAsAdmin, updateDataAsAdmin, deleteDataAsAdmin } = require('../helpers/firebase-admin-utils');
const { requireGroup } = require('../middleware/groupAuth');
const promptHelpers = require('../helpers/prompt-helpers');

const router = express.Router();

/**
 * GET /api/prompts
 * Fetch all prompts with optional filtering
 * Query params:
 *   - category: Filter by category (character, location, scene, villain, general)
 *   - character: Filter by linked character ID
 *   - episode: Filter by linked episode ID
 *   - lore: Filter by linked lore ID
 *   - tag: Filter by tag
 *   - search: Search query for keywords, tags, title, or content
 *   - includeInactive: Include soft-deleted prompts (admin only)
 */
router.get('/', async (req, res) => {
  try {
    const { category, character, episode, lore, tag, search, includeInactive } = req.query;

    console.log('Prompt API: Fetching prompts', {
      category, character, episode, lore, tag, search, includeInactive
    });

    // Get all prompts (will use cache)
    let prompts = await promptHelpers.getAllPrompts();

    // Apply filters
    if (category) {
      prompts = prompts.filter(p => p.category === category);
    }

    if (character) {
      prompts = prompts.filter(p =>
        p.linkedCharacters && p.linkedCharacters.includes(character)
      );
    }

    if (episode) {
      prompts = prompts.filter(p =>
        p.linkedEpisodes && p.linkedEpisodes.includes(episode)
      );
    }

    if (lore) {
      prompts = prompts.filter(p =>
        p.linkedLore && p.linkedLore.includes(lore)
      );
    }

    if (tag) {
      prompts = prompts.filter(p =>
        p.tags && p.tags.includes(tag)
      );
    }

    if (search) {
      prompts = await promptHelpers.searchPrompts(search);
    }

    // Include inactive only if requested and user is admin
    if (!includeInactive) {
      prompts = prompts.filter(p => p.isActive !== false);
    }

    res.json({
      success: true,
      data: prompts,
      count: prompts.length,
      filters: { category, character, episode, lore, tag, search },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Prompt API Error fetching prompts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch prompts',
      message: error.message
    });
  }
});

/**
 * GET /api/prompts/categories
 * Get all available prompt categories
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = await promptHelpers.getPromptCategories();

    res.json({
      success: true,
      data: categories,
      count: categories.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Prompt API Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories',
      message: error.message
    });
  }
});

/**
 * GET /api/prompts/tags
 * Get all available prompt tags
 */
router.get('/tags', async (req, res) => {
  try {
    const tags = await promptHelpers.getPromptTags();

    res.json({
      success: true,
      data: tags,
      count: tags.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Prompt API Error fetching tags:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tags',
      message: error.message
    });
  }
});

/**
 * GET /api/prompts/:id
 * Fetch a single prompt by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    console.log('Prompt API: Fetching prompt', { id });

    const prompt = await promptHelpers.getPromptById(id);

    if (!prompt) {
      return res.status(404).json({
        success: false,
        error: 'Prompt not found',
        id
      });
    }

    res.json({
      success: true,
      data: prompt,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Prompt API Error fetching prompt:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch prompt',
      message: error.message
    });
  }
});

/**
 * POST /api/prompts
 * Create a new prompt
 * Requires: admin or moderator role
 *
 * Request body:
 * {
 *   id: string (required),
 *   title: string (required),
 *   content: string (required),
 *   keywords: string[] (optional),
 *   linkedCharacters: string[] (optional),
 *   linkedEpisodes: string[] (optional),
 *   linkedLore: string[] (optional),
 *   category: string (optional, default: 'general'),
 *   tags: string[] (optional)
 * }
 */
router.post('/', requireGroup(['admin', 'moderator']), async (req, res) => {
  try {
    const {
      id,
      title,
      content,
      keywords = [],
      linkedCharacters = [],
      linkedEpisodes = [],
      linkedLore = [],
      category = 'general',
      tags = []
    } = req.body;

    // Validation
    if (!id || !title || !content) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['id', 'title', 'content']
      });
    }

    // Check if prompt already exists
    const existing = await promptHelpers.getPromptById(id);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Prompt already exists',
        id
      });
    }

    console.log('Prompt API: Creating prompt', { id, title, category });

    // Create prompt object
    const prompt = {
      id,
      title,
      keywords: Array.isArray(keywords) ? keywords : [],
      content,
      linkedCharacters: Array.isArray(linkedCharacters) ? linkedCharacters : [],
      linkedEpisodes: Array.isArray(linkedEpisodes) ? linkedEpisodes : [],
      linkedLore: Array.isArray(linkedLore) ? linkedLore : [],
      category,
      tags: Array.isArray(tags) ? tags : [],
      version: 1,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: req.user?.uid || 'system'
    };

    // Write to Firebase using Admin SDK
    await writeDataAsAdmin(`prompts/${id}`, prompt);

    // Clear cache to reflect new data
    promptHelpers.clearPromptCache();

    res.status(201).json({
      success: true,
      data: prompt,
      message: 'Prompt created successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Prompt API Error creating prompt:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create prompt',
      message: error.message
    });
  }
});

/**
 * PUT /api/prompts/:id
 * Update an existing prompt
 * Requires: admin or moderator role
 *
 * Request body: Same as POST, all fields optional except those being updated
 */
router.put('/:id', requireGroup(['admin', 'moderator']), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    console.log('Prompt API: Updating prompt', { id, updates: Object.keys(updates) });

    // Check if prompt exists
    const existing = await promptHelpers.getPromptById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Prompt not found',
        id
      });
    }

    // Prevent changing the ID
    if (updates.id && updates.id !== id) {
      return res.status(400).json({
        success: false,
        error: 'Cannot change prompt ID'
      });
    }

    // Prepare update object
    const updatedPrompt = {
      ...existing,
      ...updates,
      id, // Ensure ID doesn't change
      version: (existing.version || 1) + 1,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user?.uid || 'system'
    };

    // Write to Firebase using Admin SDK
    await writeDataAsAdmin(`prompts/${id}`, updatedPrompt);

    // Clear cache to reflect updated data
    promptHelpers.clearPromptCache();

    res.json({
      success: true,
      data: updatedPrompt,
      message: 'Prompt updated successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Prompt API Error updating prompt:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update prompt',
      message: error.message
    });
  }
});

/**
 * PATCH /api/prompts/:id
 * Partially update a prompt (same as PUT but more RESTful for partial updates)
 * Requires: admin or moderator role
 */
router.patch('/:id', requireGroup(['admin', 'moderator']), async (req, res) => {
  // Reuse PUT logic for PATCH
  req.method = 'PUT';
  return router.handle(req, res);
});

/**
 * DELETE /api/prompts/:id
 * Soft delete a prompt (sets isActive to false)
 * Requires: admin role
 *
 * Query params:
 *   - hard: If 'true', permanently delete (admin only, use with caution)
 */
router.delete('/:id', requireGroup('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { hard } = req.query;

    console.log('Prompt API: Deleting prompt', { id, hard: hard === 'true' });

    // Check if prompt exists
    const existing = await promptHelpers.getPromptById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Prompt not found',
        id
      });
    }

    if (hard === 'true') {
      // Hard delete - permanently remove from database
      await deleteDataAsAdmin(`prompts/${id}`);

      // Clear cache
      promptHelpers.clearPromptCache();

      res.json({
        success: true,
        message: 'Prompt permanently deleted',
        id,
        timestamp: new Date().toISOString()
      });

    } else {
      // Soft delete - set isActive to false
      const updatedPrompt = {
        ...existing,
        isActive: false,
        updatedAt: new Date().toISOString(),
        deletedBy: req.user?.uid || 'system',
        deletedAt: new Date().toISOString()
      };

      await writeDataAsAdmin(`prompts/${id}`, updatedPrompt);

      // Clear cache
      promptHelpers.clearPromptCache();

      res.json({
        success: true,
        message: 'Prompt soft deleted (can be restored)',
        data: updatedPrompt,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Prompt API Error deleting prompt:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete prompt',
      message: error.message
    });
  }
});

/**
 * POST /api/prompts/:id/restore
 * Restore a soft-deleted prompt
 * Requires: admin role
 */
router.post('/:id/restore', requireGroup('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    console.log('Prompt API: Restoring prompt', { id });

    // Fetch prompt directly from Firebase (may be inactive)
    const promptData = await fetchDataAsAdmin(`prompts/${id}`);

    if (!promptData) {
      return res.status(404).json({
        success: false,
        error: 'Prompt not found',
        id
      });
    }

    if (promptData.isActive !== false) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is not deleted',
        id
      });
    }

    // Restore prompt
    const restoredPrompt = {
      ...promptData,
      isActive: true,
      updatedAt: new Date().toISOString(),
      restoredBy: req.user?.uid || 'system',
      restoredAt: new Date().toISOString()
    };

    await writeDataAsAdmin(`prompts/${id}`, restoredPrompt);

    // Clear cache
    promptHelpers.clearPromptCache();

    res.json({
      success: true,
      message: 'Prompt restored successfully',
      data: restoredPrompt,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Prompt API Error restoring prompt:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to restore prompt',
      message: error.message
    });
  }
});

/**
 * POST /api/prompts/:id/link
 * Add links to characters, episodes, or lore
 * Requires: admin or moderator role
 *
 * Request body:
 * {
 *   characters: string[] (optional),
 *   episodes: string[] (optional),
 *   lore: string[] (optional)
 * }
 */
router.post('/:id/link', requireGroup(['admin', 'moderator']), async (req, res) => {
  try {
    const { id } = req.params;
    const { characters = [], episodes = [], lore = [] } = req.body;

    console.log('Prompt API: Adding links to prompt', { id, characters, episodes, lore });

    // Check if prompt exists
    const existing = await promptHelpers.getPromptById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Prompt not found',
        id
      });
    }

    // Add new links (avoid duplicates)
    const updatedPrompt = {
      ...existing,
      linkedCharacters: [...new Set([...existing.linkedCharacters, ...characters])],
      linkedEpisodes: [...new Set([...existing.linkedEpisodes, ...episodes])],
      linkedLore: [...new Set([...existing.linkedLore, ...lore])],
      updatedAt: new Date().toISOString(),
      updatedBy: req.user?.uid || 'system'
    };

    await writeDataAsAdmin(`prompts/${id}`, updatedPrompt);

    // Clear cache
    promptHelpers.clearPromptCache();

    res.json({
      success: true,
      data: updatedPrompt,
      message: 'Links added successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Prompt API Error adding links:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add links',
      message: error.message
    });
  }
});

/**
 * DELETE /api/prompts/:id/link
 * Remove links from characters, episodes, or lore
 * Requires: admin or moderator role
 *
 * Request body: Same as POST /link
 */
router.delete('/:id/link', requireGroup(['admin', 'moderator']), async (req, res) => {
  try {
    const { id } = req.params;
    const { characters = [], episodes = [], lore = [] } = req.body;

    console.log('Prompt API: Removing links from prompt', { id, characters, episodes, lore });

    // Check if prompt exists
    const existing = await promptHelpers.getPromptById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Prompt not found',
        id
      });
    }

    // Remove links
    const updatedPrompt = {
      ...existing,
      linkedCharacters: existing.linkedCharacters.filter(c => !characters.includes(c)),
      linkedEpisodes: existing.linkedEpisodes.filter(e => !episodes.includes(e)),
      linkedLore: existing.linkedLore.filter(l => !lore.includes(l)),
      updatedAt: new Date().toISOString(),
      updatedBy: req.user?.uid || 'system'
    };

    await writeDataAsAdmin(`prompts/${id}`, updatedPrompt);

    // Clear cache
    promptHelpers.clearPromptCache();

    res.json({
      success: true,
      data: updatedPrompt,
      message: 'Links removed successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Prompt API Error removing links:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove links',
      message: error.message
    });
  }
});

module.exports = router;
