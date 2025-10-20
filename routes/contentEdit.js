/**
 * Content Edit Routes Module
 * Handles edit pages for Episodes, Characters, and Lore
 * Requires content_manager role or higher
 */

const express = require('express');
const router = express.Router();

// Import Firebase utilities
const firebaseUtils = require('../helpers/firebase-utils');

// Import helper modules
const characterHelpers = require('../helpers/character-helpers');
const loreHelpers = require('../helpers/lore-helpers');
const episodeHelpers = require('../helpers/episode-helpers');

/**
 * Episode Edit Page
 * Protected client-side - requires content_manager role or higher
 */
router.get('/edit/episode/:seasonNumber/:episodeNumber', async (req, res) => {
  const { seasonNumber, episodeNumber } = req.params;

  try {
    const episode = await firebaseUtils.fetchFromFirebase(`videos/season${seasonNumber}/episodes/episode${episodeNumber}`);

    if (!episode) {
      return res.status(404).send('Episode not found');
    }

    res.render('edit-content', {
      title: `Edit: ${episode.title}`,
      pageTitle: `Edit Episode - ${episode.title} | Wavelength Lore`,
      pageDescription: 'Content editor for managing prompts and episode content',
      contentType: 'episode',
      contentTitle: episode.title,
      contentId: `season${seasonNumber}-episode${episodeNumber}`,
      contentData: episode,
      firebasePath: `videos/season${seasonNumber}/episodes/episode${episodeNumber}`,
      seasonNumber,
      episodeNumber,
      backUrl: `/season/${seasonNumber}/episode/${episodeNumber}`,
      cdnUrl: process.env.CDN_URL,
      version: `v${Date.now()}`,
      req: req
    });
  } catch (error) {
    console.error('Error fetching episode for edit:', error);
    res.status(500).send('Error loading edit page');
  }
});

/**
 * Character Edit Page
 * Protected client-side - requires content_manager role or higher
 */
router.get('/edit/character/:characterId', async (req, res) => {
  const { characterId } = req.params;

  try {
    const charactersData = await firebaseUtils.fetchFromFirebase('characters');

    if (charactersData) {
      // Search for the character by ID across all categories
      let character = null;
      for (const category in charactersData) {
        if (Array.isArray(charactersData[category])) {
          character = charactersData[category].find(c => c.id === characterId);
          if (character) break;
        }
      }

      if (!character) {
        return res.status(404).send('Character not found');
      }

      res.render('edit-content', {
        title: `Edit: ${character.title}`,
        pageTitle: `Edit Character - ${character.title} | Wavelength Lore`,
        pageDescription: 'Content editor for managing prompts and character content',
        contentType: 'character',
        contentTitle: character.title,
        contentId: characterId,
        contentData: character,
        firebasePath: `characters/${characterId}`,
        backUrl: `/character/${characterId}`,
        cdnUrl: process.env.CDN_URL,
        version: `v${Date.now()}`,
        req: req
      });
    } else {
      res.status(404).send('Character not found');
    }
  } catch (error) {
    console.error('Error fetching character for edit:', error);
    res.status(500).send('Error loading edit page');
  }
});

/**
 * Lore Edit Page
 * Protected client-side - requires content_manager role or higher
 */
router.get('/edit/lore/:loreId', async (req, res) => {
  const { loreId } = req.params;

  try {
    // Use lore helpers to get lore data
    const loreItem = await loreHelpers.getLoreById(loreId);

    if (!loreItem) {
      return res.status(404).send('Lore not found');
    }

    res.render('edit-content', {
      title: `Edit: ${loreItem.title}`,
      pageTitle: `Edit Lore - ${loreItem.title} | Wavelength Lore`,
      pageDescription: 'Content editor for managing prompts and lore content',
      contentType: 'lore',
      contentTitle: loreItem.title,
      contentId: loreId,
      contentData: loreItem,
      firebasePath: `lore/${loreId}`,
      backUrl: `/lore/${loreId}`,
      cdnUrl: process.env.CDN_URL,
      version: `v${Date.now()}`,
      req: req
    });
  } catch (error) {
    console.error('Error fetching lore for edit:', error);
    res.status(500).send('Error loading edit page');
  }
});

module.exports = router;
