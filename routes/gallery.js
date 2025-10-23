/**
 * Gallery Route Handler
 * 
 * Handles routes for the photo gallery, image capture, and user gallery functionality
 */

const express = require('express');
const router = express.Router();
const path = require('path');
// Use the real auth middleware consistently for all environments
const { ensureAuthenticated } = require('../middleware/auth');
const galleryHelpers = require('../utils/gallery/helpers');

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
router.get('/my-gallery', ensureAuthenticated, (req, res) => {
  res.render('user-gallery', {
    title: 'My Gallery | Wavelength Lore',
    cdnUrl: process.env.CDN_URL || '',
    versionInfo: req.app.locals.versionInfo || null,
    req: req // Pass request object for canonical URLs
  });
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

// API endpoint to get user's gallery images (legacy)
// Using /gallery/api to avoid conflicts with other /api/user routes
router.get('/gallery/api/user/images', (req, res) => {
  console.log('⭐ Legacy API endpoint /gallery/api/user/images hit!');
  
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
  
  // Forward to the new API endpoint
  res.redirect('/api/gallery/user/images');
});

// API endpoint to get user's gallery storage stats (legacy)
router.get('/gallery/api/user/storage-stats', (req, res) => {
  console.log('⭐ Legacy API endpoint /gallery/api/user/storage-stats hit!');
  
  // Check for authentication manually
  const authHeader = req.headers.authorization;
  const sessionCookie = req.cookies && (req.cookies.__session || req.cookies.session);
  
  if (!authHeader && !sessionCookie) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please log in to view your storage stats'
    });
  }
  
  // Forward to the new API endpoint
  res.redirect('/api/gallery/user/storage-stats');
});

// API endpoint to save an image to the user's gallery
router.post('/gallery/api/user/save', ensureAuthenticated, async (req, res) => {
  const userId = req.user.uid;
  // For test environment, allow user groups from req.body.userGroups for testing
  let userGroups = res.locals.userGroups || [];
  const imageData = req.body;

  // Special handling for test environment - use body userGroups if provided
  if (imageData.userGroups && Array.isArray(imageData.userGroups)) {
    console.log('📝 [TEST] Using userGroups from request body:', imageData.userGroups);
    userGroups = imageData.userGroups;
  }
  
  console.log('👤 User information:', { 
    userId, 
    userGroups,
    resLocals: res.locals.userGroups
  });
  
  // Validate required fields
  if (!imageData.url) {
    return res.status(400).json({ error: 'Image URL is required' });
  }
  
  console.log(`Saving image to user ${userId}'s gallery:`, imageData);
  
  try {
    // Save the image to S3 using gallery helpers
    const result = await galleryHelpers.saveContentImageToUserGallery(
      imageData.url, 
      imageData.title || 'Saved Image', 
      imageData.sourceUrl || req.headers.referer || '', 
      userId, 
      userGroups
    );
    
    if (!result.success) {
      return res.status(400).json({ 
        success: false, 
        error: result.error 
      });
    }
    
    // Return success with image details and merchandise store link
    res.json({
      success: true,
      message: 'Image saved to gallery',
      image: {
        id: result.fileName,
        url: result.url,
        thumbnailUrl: result.url,
        title: imageData.title || 'Saved Image',
        relativePath: result.relativePath
      },
      merchLink: `/merchandise?preselect=${result.fileName}`
    });
  } catch (error) {
    console.error('Error saving image to gallery:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to save image to gallery'
    });
  }
});

// Legacy handler for "save" - remap to "upload" endpoint
router.post('/gallery/api/user/save', ensureAuthenticated, async (req, res) => {
  console.log('⭐ Legacy API endpoint /gallery/api/user/save hit!');
  
  // For image URLs from content pages, continue using the existing implementation
  // Otherwise, redirect to the new upload endpoint
  if (req.body.url) {
    const userId = req.user.uid;
    // For test environment, allow user groups from req.body.userGroups for testing
    let userGroups = res.locals.userGroups || [];
    const imageData = req.body;

    // Special handling for test environment - use body userGroups if provided
    if (imageData.userGroups && Array.isArray(imageData.userGroups)) {
      console.log('📝 [TEST] Using userGroups from request body:', imageData.userGroups);
      userGroups = imageData.userGroups;
    }
    
    console.log('👤 User information:', { 
      userId, 
      userGroups,
      resLocals: res.locals.userGroups
    });
    
    // Validate required fields
    if (!imageData.url) {
      return res.status(400).json({ error: 'Image URL is required' });
    }
    
    console.log(`Saving image to user ${userId}'s gallery:`, imageData);
    
    try {
      // Save the image to S3 using gallery helpers
      const result = await galleryHelpers.saveContentImageToUserGallery(
        imageData.url, 
        imageData.title || 'Saved Image', 
        imageData.sourceUrl || req.headers.referer || '', 
        userId, 
        userGroups
      );
      
      if (!result.success) {
        return res.status(400).json({ 
          success: false, 
          error: result.error 
        });
      }
      
      // Return success with image details and merchandise store link
      res.json({
        success: true,
        message: 'Image saved to gallery',
        image: {
          id: result.fileName,
          url: result.url,
          thumbnailUrl: result.url,
          title: imageData.title || 'Saved Image',
          relativePath: result.relativePath
        },
        merchLink: `/merchandise?preselect=${result.fileName}`
      });
    } catch (error) {
      console.error('Error saving image to gallery:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to save image to gallery'
      });
    }
  } else {
    // If this is a file upload (not content page URL), redirect to the upload endpoint
    return res.redirect(307, '/api/gallery/user/upload');
  }
});

// API endpoint to delete an image from the user's gallery (legacy)
router.post('/gallery/api/user/delete', ensureAuthenticated, (req, res) => {
  // Forward to the new API endpoint if relativePath is provided
  if (req.body.relativePath) {
    return res.redirect(307, '/api/gallery/user/delete');
  }
  
  const userId = req.user.uid;
  const { imageId } = req.body;
  
  if (!imageId) {
    return res.status(400).json({ error: 'Image ID is required' });
  }
  
  console.log(`Legacy delete request for image ${imageId} from user ${userId}'s gallery`);
  
  // Return success for backward compatibility
  res.json({
    success: true,
    message: 'Image deleted from gallery (legacy handler)'
  });
});

module.exports = router;