/**
 * Gallery Route Handler
 * 
 * Handles routes for the photo gallery, image capture, and user gallery functionality
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const { ensureAuthenticated } = require('../middleware/auth');

console.log('🚀 Gallery routes module loaded!');
console.log('📝 Available routes:');
console.log('   - /gallery-demo');
console.log('   - /my-gallery');
console.log('   - /api/gallery/:category');
console.log('   - /gallery/api/user/images');
console.log('   - /gallery/api/user/save');
console.log('   - /gallery/api/user/delete');

// Gallery demo page
router.get('/gallery-demo', (req, res) => {
  res.render('gallery-demo', {
    title: 'Gallery Demo | Wavelength Lore',
    cdnUrl: process.env.CDN_URL || '',
    versionInfo: req.app.locals.versionInfo || null,
    req: req // Pass request object for canonical URLs
  });
});

// User gallery page (requires authentication)
router.get('/my-gallery', (req, res) => {
  // Check for authentication before serving the page
  // This is a more user-friendly approach than using the middleware
  if (req.cookies && (req.cookies.__session || req.cookies.session)) {
    res.render('user-gallery', {
      title: 'My Gallery | Wavelength Lore',
      cdnUrl: process.env.CDN_URL || '',
      versionInfo: req.app.locals.versionInfo || null,
      req: req // Pass request object for canonical URLs
    });
  } else {
    // No authentication token found, redirect to login
    res.redirect(`/login?redirect=${encodeURIComponent(req.originalUrl)}`);
  }
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
        url: '/static/images/seasons/season1/episodes/episode1/images/MyLuckyCharm-01.webp',
        thumbnailUrl: '/static/images/seasons/season1/episodes/episode1/images/MyLuckyCharm-01.webp',
        title: 'Lucky Charm - Episode 1',
        episodeId: 1
      },
      {
        id: 'ep1-img2',
        url: '/static/images/seasons/season1/episodes/episode1/images/MyLuckyCharm-04.webp',
        thumbnailUrl: '/static/images/seasons/season1/episodes/episode1/images/MyLuckyCharm-04.webp',
        title: 'Wavelength Band Performing',
        episodeId: 1
      },
      {
        id: 'ep1-img3',
        url: '/static/images/seasons/season1/episodes/episode1/images/MyLuckyCharm-03.webp',
        thumbnailUrl: '/static/images/seasons/season1/episodes/episode1/images/MyLuckyCharm-03.webp',
        title: 'Lucky the Leprechaun in Episode 1',
        episodeId: 1
      },
      {
        id: 'ep11-img1',
        url: '/static/images/seasons/season1/episodes/episode11/images/Concert_Encore_BTTS-01.webp',
        thumbnailUrl: '/static/images/seasons/season1/episodes/episode11/images/Concert_Encore_BTTS-01.webp',
        title: 'Back to the Shire - Episode 11',
        episodeId: 11
      },
      {
        id: 'ep11-img2',
        url: '/static/images/seasons/season1/episodes/episode11/images/Concert_Encore_BTTS-01.webp',
        thumbnailUrl: '/static/images/seasons/season1/episodes/episode11/images/Concert_Encore_BTTS-01.webp',
        title: 'Concert Encore - Back to the Shire',
        episodeId: 11
      }
    ],
    characters: [
      {
        id: 'char-lucky',
        url: '/static/images/characters/wavelength/lucky-1.webp',
        thumbnailUrl: '/static/images/characters/wavelength/lucky-1.webp',
        title: 'Lucky the Leprechaun',
        characterId: 'lucky'
      },
      {
        id: 'char-yeti',
        url: '/static/images/characters/wavelength/yeti-1.webp',
        thumbnailUrl: '/static/images/characters/wavelength/yeti-1.webp',
        title: 'The Yeti',
        characterId: 'yeti'
      },
      {
        id: 'char-lucky-2',
        url: '/static/images/seasons/season1/episodes/episode1/images/MyLuckyCharm-03.webp',
        thumbnailUrl: '/static/images/seasons/season1/episodes/episode1/images/MyLuckyCharm-03.webp',
        title: 'Lucky Close-up',
        characterId: 'lucky'
      },
      {
        id: 'char-wavelength',
        url: '/static/images/seasons/season1/episodes/episode1/images/MyLuckyCharm-04.webp',
        thumbnailUrl: '/static/images/seasons/season1/episodes/episode1/images/MyLuckyCharm-04.webp',
        title: 'Wavelength Band',
        characterId: 'band'
      }
    ],
    locations: [
      {
        id: 'loc-shire',
        url: '/static/images/seasons/season1/episodes/episode11/images/Concert_Encore_BTTS-01.webp',
        thumbnailUrl: '/static/images/seasons/season1/episodes/episode11/images/Concert_Encore_BTTS-01.webp',
        title: 'The Shire Concert Venue',
        locationId: 'shire'
      },
      {
        id: 'loc-stage',
        url: '/static/images/seasons/season1/episodes/episode1/images/MyLuckyCharm-04.webp',
        thumbnailUrl: '/static/images/seasons/season1/episodes/episode1/images/MyLuckyCharm-04.webp',
        title: 'Concert Stage',
        locationId: 'stage'
      }
    ]
  };
  
  if (galleryData[category]) {
    res.json({ images: galleryData[category] });
  } else {
    res.status(404).json({ error: 'Category not found' });
  }
});

// API endpoint to get user's gallery images
// Using /gallery/api to avoid conflicts with other /api/user routes
router.get('/gallery/api/user/images', (req, res) => {
  console.log('⭐ API endpoint /gallery/api/user/images hit!');
  
  // Check for authentication manually
  const authHeader = req.headers.authorization;
  const sessionCookie = req.cookies && (req.cookies.__session || req.cookies.session);
  
  console.log('⭐ Auth header:', authHeader ? 'Present' : 'Not present');
  console.log('⭐ Session cookie:', sessionCookie ? 'Present' : 'Not present');
  
  if (!authHeader && !sessionCookie) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please log in to view your gallery'
    });
  }
  
  // For demo purposes, we'll return some sample images
  // In a real implementation, you would verify the token and fetch from a database
  const userId = 'demo-user-id'; // Placeholder
  
  const userGallery = {
    images: [
      {
        id: 'user-img1',
        url: '/static/images/seasons/season1/episodes/episode1/images/MyLuckyCharm-01.webp',
        title: 'Lucky Charm - Episode 1',
        timestamp: new Date().toISOString(),
        sourceUrl: '/episodes/1'
      },
      {
        id: 'user-img2',
        url: '/static/images/seasons/season1/episodes/episode1/images/MyLuckyCharm-03.webp',
        title: 'Lucky the Leprechaun',
        timestamp: new Date().toISOString(),
        sourceUrl: '/characters/lucky'
      },
      {
        id: 'user-img3',
        url: '/static/images/seasons/season1/episodes/episode1/images/MyLuckyCharm-04.webp',
        title: 'Wavelength Band Performing',
        timestamp: new Date().toISOString(),
        sourceUrl: '/episodes/1'
      },
      {
        id: 'user-img4',
        url: '/static/images/seasons/season1/episodes/episode11/images/Concert_Encore_BTTS-01.webp',
        title: 'Back to the Shire - Episode 11',
        timestamp: new Date().toISOString(),
        sourceUrl: '/episodes/11'
      },
      {
        id: 'user-img5',
        url: '/static/images/characters/wavelength/yeti-1.webp',
        title: 'The Yeti',
        timestamp: new Date().toISOString(),
        sourceUrl: '/characters/yeti'
      }
    ]
  };
  
  res.json(userGallery);
});

// API endpoint to save an image to the user's gallery
router.post('/gallery/api/user/save', ensureAuthenticated, (req, res) => {
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
router.post('/gallery/api/user/delete', ensureAuthenticated, (req, res) => {
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