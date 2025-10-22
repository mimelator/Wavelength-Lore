/**
 * Gallery Route Handler
 * 
 * Handles routes for the photo gallery, image capture, and user gallery functionality
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const { ensureAuthenticated } = require('../middleware/auth');

// Gallery demo page
router.get('/gallery-demo', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/gallery-demo.html'));
});

// User gallery page (requires authentication)
router.get('/my-gallery', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '../views/user-gallery.html'));
});

// API endpoint to get gallery images by category
router.get('/api/gallery/:category', (req, res) => {
  const category = req.params.category;
  
  // This is a placeholder - in a real implementation, you would fetch from a database
  // or content management system based on the category
  const galleryData = {
    episodes: [
      {
        id: 'ep1-img1',
        url: '/static/images/episode1/MyLuckyCharm-01.webp',
        thumbnailUrl: '/static/images/episode1/MyLuckyCharm-01.webp',
        title: 'Lucky Charm - Episode 1',
        episodeId: 1
      },
      {
        id: 'ep1-img2',
        url: '/static/images/episode1/MyLuckyCharm-02.webp',
        thumbnailUrl: '/static/images/episode1/MyLuckyCharm-02.webp',
        title: 'Wavelength Band Performing',
        episodeId: 1
      },
      {
        id: 'ep11-img1',
        url: '/static/images/episode11/back_to_the_shire.webp',
        thumbnailUrl: '/static/images/episode11/back_to_the_shire.webp',
        title: 'Back to the Shire - Episode 11',
        episodeId: 11
      }
    ],
    characters: [
      {
        id: 'char-lucky',
        url: '/static/images/episode1/MyLuckyCharm-03.webp',
        thumbnailUrl: '/static/images/episode1/MyLuckyCharm-03.webp',
        title: 'Lucky the Leprechaun',
        characterId: 'lucky'
      },
      {
        id: 'char-goblin',
        url: '/static/images/episode11/Goblin-King-01.webp',
        thumbnailUrl: '/static/images/episode11/Goblin-King-01.webp',
        title: 'The Goblin King',
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

// API endpoint to get user's gallery images
router.get('/api/gallery/user', ensureAuthenticated, (req, res) => {
  const userId = req.user.id;
  
  // This is a placeholder - in a real implementation, you would fetch from a database
  // based on the user's ID
  // For demo purposes, we'll return some sample images
  const userGallery = {
    images: [
      {
        id: 'user-img1',
        url: '/static/images/episode1/MyLuckyCharm-01.webp',
        title: 'Lucky Charm - Episode 1',
        timestamp: new Date().toISOString(),
        sourceUrl: '/episodes/1'
      },
      {
        id: 'user-img2',
        url: '/static/images/episode1/MyLuckyCharm-03.webp',
        title: 'Lucky the Leprechaun',
        timestamp: new Date().toISOString(),
        sourceUrl: '/characters/lucky'
      }
    ]
  };
  
  res.json(userGallery);
});

// API endpoint to save an image to the user's gallery
router.post('/api/gallery/user/save', ensureAuthenticated, (req, res) => {
  const userId = req.user.id;
  const imageData = req.body;
  
  // Validate required fields
  if (!imageData.url) {
    return res.status(400).json({ error: 'Image URL is required' });
  }
  
  // This is a placeholder - in a real implementation, you would save to a database
  console.log(`Saving image to user ${userId}'s gallery:`, imageData);
  
  // Generate a unique ID for the saved image
  const imageId = `user-img-${Date.now()}`;
  
  // Return success with the generated ID
  res.json({
    success: true,
    message: 'Image saved to gallery',
    imageId
  });
});

// API endpoint to delete an image from the user's gallery
router.post('/api/gallery/user/delete', ensureAuthenticated, (req, res) => {
  const userId = req.user.id;
  const { imageId } = req.body;
  
  if (!imageId) {
    return res.status(400).json({ error: 'Image ID is required' });
  }
  
  // This is a placeholder - in a real implementation, you would delete from a database
  console.log(`Deleting image ${imageId} from user ${userId}'s gallery`);
  
  // Return success
  res.json({
    success: true,
    message: 'Image deleted from gallery'
  });
});

module.exports = router;