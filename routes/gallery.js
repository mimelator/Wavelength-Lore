/**
 * Gallery Demo Route Handler
 * 
 * Handles routes for the photo gallery demo and integration
 */

const express = require('express');
const router = express.Router();
const path = require('path');

// Gallery demo page
router.get('/gallery-demo', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/gallery-demo.html'));
});

// API endpoint to get gallery images by category
router.get('/api/gallery/:category', (req, res) => {
  const category = req.params.category;
  
  // This is a placeholder - in a real implementation, you would fetch from a database
  // or content management system based on the category
  const galleryData = {
    episodes: [
      {
        url: '/static/images/episode1/MyLuckyCharm-01.webp',
        thumbnailUrl: '/static/images/episode1/MyLuckyCharm-01.webp',
        caption: 'Lucky Charm - Episode 1',
        episodeId: 1
      },
      {
        url: '/static/images/episode1/MyLuckyCharm-02.webp',
        thumbnailUrl: '/static/images/episode1/MyLuckyCharm-02.webp',
        caption: 'Wavelength Band Performing',
        episodeId: 1
      },
      {
        url: '/static/images/episode11/back_to_the_shire.webp',
        thumbnailUrl: '/static/images/episode11/back_to_the_shire.webp',
        caption: 'Back to the Shire - Episode 11',
        episodeId: 11
      }
    ],
    characters: [
      {
        url: '/static/images/episode1/MyLuckyCharm-03.webp',
        thumbnailUrl: '/static/images/episode1/MyLuckyCharm-03.webp',
        caption: 'Lucky the Leprechaun',
        characterId: 'lucky'
      },
      {
        url: '/static/images/episode11/Goblin-King-01.webp',
        thumbnailUrl: '/static/images/episode11/Goblin-King-01.webp',
        caption: 'The Goblin King',
        characterId: 'goblin-king'
      }
    ],
    locations: [
      // Location images would go here
    ]
  };
  
  if (galleryData[category]) {
    res.json({ images: galleryData[category] });
  } else {
    res.status(404).json({ error: 'Category not found' });
  }
});

module.exports = router;