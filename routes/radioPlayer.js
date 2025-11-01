const express = require('express');
const router = express.Router();
const { fetchDataAsAdmin } = require('../helpers/firebase-admin-utils');
// const characterHelpers = require('../helpers/character-helpers');
const { isDevelopmentBypass, getTestUser } = require('../middleware/auth');
const { verifyToken, optionalAuth } = require('../middleware/firebaseAuth');

// No caching - always fetch fresh data for dynamic content

// Lazy-load Firebase Songs Service after Firebase Admin is ready
let FirebaseSongsService;
let songsService;

function initializeSongsService() {
    if (songsService) return songsService; // Already initialized
    
    try {
        if (!FirebaseSongsService) {
            FirebaseSongsService = require('../services/firebase-songs-service');
        }
        songsService = new FirebaseSongsService();
        console.log('✅ Firebase Songs Service initialized successfully');
        return songsService;
    } catch (error) {
        console.error('❌ Failed to initialize Firebase Songs Service:', error.message);
        console.log('⚠️  Falling back to legacy hardcoded playlist');
        return null;
    }
}

// Complete hardcoded playlist for fallback when Firebase is unavailable
const LEGACY_PLAYLIST = [
  // Season 1
  { season: 1, episode: 1, title: "Lucky Charm", file: "LuckyCharm_v35.mp3", duration: "3:45" },
  { season: 1, episode: 2, title: "Jump Right In", file: "JumpRightIn_v25.mp3", duration: "3:42" },
  { season: 1, episode: 3, title: "Dream With Me", file: "DreamWithMe_v5.mp3", duration: "3:20" },
  { season: 1, episode: 4, title: "Daphne", file: "Daphne_v21.mp3", duration: "3:48" },
  { season: 1, episode: 5, title: "Falling", file: "Falling_v32.mp3", duration: "2:57" },
  { season: 1, episode: 6, title: "Once More", file: "OnceMore_v20.mp3", duration: "4:52" },
  { season: 1, episode: 7, title: "History Lessons", file: "HistoryLessons_v8.mp3", duration: "3:57" },
  { season: 1, episode: 8, title: "Life In The Shire", file: "LIfeInTheShire_v19.mp3", duration: "4:02" },
  { season: 1, episode: 9, title: "Feed The Crows", file: "FeedTheCrows_v24.mp3", duration: "2:48" },
  { season: 1, episode: 10, title: "Keep On", file: "Keep On_v26.mp3", duration: "2:26" },
  { season: 1, episode: 11, title: "Back To The Shire", file: "BackToTheShire_v18.mp3", duration: "4:22" },

  // Season 2
  { season: 2, episode: 1, title: "Goblin King", file: "GoblinKing_v8.mp3", duration: "3:36" },
  { season: 2, episode: 2, title: "Psychopath", file: "Psychopath_v9.mp3", duration: "2:45" },
  { season: 2, episode: 3, title: "Countdown", file: "Countdown_v6.mp3", duration: "3:13" },
  { season: 2, episode: 4, title: "A Misery of Goblins", file: "A Misery of Goblins_v4.mp3", duration: "3:05" },
  { season: 2, episode: 5, title: "Slow Time", file: "SlowTime_v4.mp3", duration: "3:10" },
  { season: 2, episode: 6, title: "You Won't See It Coming", file: "YouWontSeeItComing_v7.mp3", duration: "2:53" },
  { season: 2, episode: 7, title: "Say Goodbye To The Shire", file: "SayGoodbyeToTheShire_v4.mp3", duration: "2:58" },

  // Season 3
  { season: 3, episode: 1, title: "Ice Fortress", file: "Ice Fortress_v5.mp3", duration: "4:08" },
  { season: 3, episode: 2, title: "The Ice Whales", file: "The Ice Whales_v5.mp3", duration: "3:05" },
  { season: 3, episode: 3, title: "Sneak Attack", file: "Sneak Attack_v6.mp3", duration: "4:20" },
  { season: 3, episode: 4, title: "Frozen Peace", file: "FrozenPeace_v5.mp3", duration: "3:35" },
  { season: 3, episode: 5, title: "Rebuild The Shire", file: "RebuildTheShire_v5.mp3", duration: "2:58" },
  { season: 3, episode: 6, title: "We're Coming For You", file: "We're Coming For You_v5.mp3", duration: "2:32" },
  { season: 3, episode: 7, title: "Prepare For Battle", file: "PrepareForBattle_v6.mp3", duration: "4:20" },

  // Season 4
  { season: 4, episode: 1, title: "Locked And Loaded", file: "LockedAndLoaded_v3.mp3", duration: "3:17" },
  { season: 4, episode: 2, title: "The King Has Fled", file: "TheKingHasFled_v1.mp3", duration: "3:31" },
  { season: 4, episode: 3, title: "Goblins Rule", file: "GoblinsRule_v2.mp3", duration: "3:57" },
  { season: 4, episode: 4, title: "Ice Blue Greed", file: "IceBlueGreed_v2.mp3", duration: "3:23" },
  { season: 4, episode: 5, title: "The Shire Fortress", file: "TheShireFortress_v2.mp3", duration: "3:40" },
  { season: 4, episode: 6, title: "Battle Of The Shire", file: "BattleOfTheShire_v4.mp3", duration: "6:19" },
  { season: 4, episode: 7, title: "Song Of Mourning", file: "SongOfMourning_v1.mp3", duration: "4:14" },
    { season: 4, episode: 8, title: "The Shire Dream", file: "TheShireDream_v1.mp3", duration: "4:50" }
];

/**
 * Get playlist from Firebase with optional episode data enhancement
  { season: 1, episode: 3, title: "Dream With Me", file: "DreamWithMe_v5.mp3", duration: "3:20" },
  { season: 1, episode: 4, title: "Daphne", file: "Daphne_v21.mp3", duration: "3:48" },
  { season: 1, episode: 5, title: "Falling", file: "Falling_v32.mp3", duration: "3:32" },
  { season: 1, episode: 6, title: "Once More", file: "OnceMore_v20.mp3", duration: "4:52" },
  { season: 1, episode: 7, title: "History Lessons", file: "HistoryLessons_v8.mp3", duration: "3:57" },
  { season: 1, episode: 8, title: "Life In The Shire", file: "LIfeInTheShire_v19.mp3", duration: "4:02" },
  { season: 1, episode: 9, title: "Feed The Crows", file: "FeedTheCrows_v24.mp3", duration: "2:48" },
  { season: 1, episode: 10, title: "Keep On", file: "Keep On_v26.mp3", duration: "2:26" },
  { season: 1, episode: 11, title: "Back To The Shire", file: "BackToTheShire_v18.mp3", duration: "4:22" }
];

/**
 * Get the current playlist - either from Firebase (dynamic) or legacy fallback
 * @param {number|null} season - Optional season filter
 * @param {boolean} includeUnpublished - Include unpublished songs for admin users
 * @returns {Promise<Array>} Playlist array
 */
/**
 * Get playlist from Firebase with optional episode data enhancement
 * @param {number} season - Filter by season number (optional)
 * @param {boolean} includeUnpublished - Include unpublished songs for admin users
 * @param {boolean} includeEpisodeData - Include character/lore data from episode files
 * @returns {Promise<Array>} Enhanced playlist
 */
async function getEnhancedPlaylist(season = null, includeUnpublished = false, includeEpisodeData = false) {
  try {
    console.log(`🎵 Getting playlist: season=${season}, includeUnpublished=${includeUnpublished}, includeEpisodeData=${includeEpisodeData}`);
    
    // Try to initialize Firebase Songs Service if not already done
    const activeSongsService = initializeSongsService();
    
    let playlist = [];
    
    if (activeSongsService) {
      console.log(`🎵 Fetching dynamic playlist from Firebase... (includeUnpublished: ${includeUnpublished})`);
      
      // Get songs from Firebase (published + unpublished for admins)
      const songs = await activeSongsService.getPublishedSongs(season, includeUnpublished);
      
      if (songs && songs.length > 0) {
        console.log(`🎵 Loaded ${songs.length} songs from Firebase`);
        
        // Filter by season if requested (only if not already filtered by service)
        if (season && !songs.every(song => song.season === season)) {
          playlist = songs.filter(song => song.season === season);
          console.log(`🎵 Filtered to ${playlist.length} songs for Season ${season}`);
        } else {
          playlist = songs;
        }
      } else {
        console.log('⚠️ No songs found in Firebase, falling back to legacy playlist');
        // Fallback to legacy playlist
        playlist = season 
          ? LEGACY_PLAYLIST.filter(song => song.season === season)
          : LEGACY_PLAYLIST;
      }
    } else {
      console.log('⚠️ Firebase Songs Service not available, using legacy playlist');
      // Fallback to legacy playlist
      playlist = season 
        ? LEGACY_PLAYLIST.filter(song => song.season === season)
        : LEGACY_PLAYLIST;
    }
    
    console.log(`🎵 Using playlist with ${playlist.length} songs`);
    
    // If episode data enhancement is not requested, return the basic playlist
    if (!includeEpisodeData) {
      return playlist;
    }
    
    // Enhance with episode data for full radio player page
    console.log('🔧 Enhancing playlist with episode data...');
    console.log('🔧 Input playlist length:', playlist.length);
    console.log('🔧 includeEpisodeData:', includeEpisodeData);
    
    const enhancedTracks = [];
    
    // Process each track individually to avoid Promise.all issues
    for (let i = 0; i < playlist.length; i++) {
      const track = playlist[i];
      try {
        console.log(`🔍 Processing track ${i+1}/${playlist.length}: S${track.season}E${track.episodeNumber || track.episode}: ${track.title}`);
        
        // Always add the track, with or without episode data
        const enhancedTrack = { ...track, characters: [] };
        
        try {
          const episodeNumber = track.episodeNumber || track.episode;
          console.log(`🔍 Fetching episode data for: videos/season${track.season}/episodes/episode${episodeNumber}`);
          const episodeData = await fetchDataAsAdmin(`videos/season${track.season}/episodes/episode${episodeNumber}`);
          
          console.log(`🔍 Episode data result:`, episodeData ? 'found' : 'null');
          if (episodeData && episodeData.image) {
            console.log(`🔍 Episode has image: ${episodeData.image}`);
          }
          if (episodeData && episodeData.carouselImages) {
            console.log(`🔍 Episode has ${episodeData.carouselImages.length} carousel images`);
          }
          
          if (episodeData) {
            console.log(`✅ Found episode data for S${track.season}E${episodeNumber}`);
            
            // TODO: Character matching disabled temporarily due to missing function
            // const loreHelpers = require('../helpers/lore-helpers');
            // const characterHelpers = require('../helpers/character-helpers');
            
            // For now, just set empty characters array
            enhancedTrack.characters = [];
            
            // Add episode images for screensaver
            if (episodeData.image) {
              enhancedTrack.episodeImage = episodeData.image;
              console.log(`✅ Added episodeImage: ${episodeData.image}`);
            }
            
            if (episodeData.carouselImages && episodeData.carouselImages.length > 0) {
              enhancedTrack.images = episodeData.carouselImages;
              console.log(`✅ Added ${episodeData.carouselImages.length} carousel images`);
            }
          } else {
            console.log(`⚠️ No episode data found for S${track.season}E${episodeNumber}, using empty characters`);
          }
        } catch (episodeError) {
          console.error(`❌ Episode data fetch failed for S${track.season}E${track.episodeNumber || track.episode}:`, episodeError.message);
          console.error(`❌ Full error stack:`, episodeError.stack);
          // Continue with empty character array on error
        }
        
        console.log(`✅ Final enhanced track keys: ${Object.keys(enhancedTrack).join(', ')}`);
        console.log(`✅ Enhanced track episodeImage: ${enhancedTrack.episodeImage}`);
        console.log(`✅ Enhanced track images count: ${enhancedTrack.images?.length || 0}`);
        
        enhancedTracks.push(enhancedTrack);
        console.log(`✅ Added S${track.season}E${track.episodeNumber || track.episode} to enhanced tracks`);
        
      } catch (trackError) {
        console.error(`❌ Failed to process track S${track.season}E${track.episodeNumber || track.episode}:`, trackError.message);
        console.error(`❌ Track error stack:`, trackError.stack);
        // Still add the basic track even if everything fails
        enhancedTracks.push({ ...track, characters: [] });
      }
    }
    
    console.log('🔧 Enhanced tracks length:', enhancedTracks.length);

    return enhancedTracks;
    
  } catch (error) {
    console.error('❌ Error fetching playlist:', error.message);
    
    // Fallback to legacy playlist on error
    const playlist = season 
      ? LEGACY_PLAYLIST.filter(song => song.season === season)
      : LEGACY_PLAYLIST;
      
    console.log(`🎵 Error fallback: Using legacy playlist with ${playlist.length} songs`);
    return playlist;
  }
}

// Optional authentication middleware - sets req.user if authenticated, but doesn't redirect


// Radio player page route
router.get('/radio', optionalAuth, async (req, res) => {
  try {
    console.log('🎵 Loading radio player page...');
    
    // Check if this is authenticated content creator for unpublished content
    let isAdmin = false;
    
    // Development override: allow ?creator=true for local testing
    if (process.env.NODE_ENV !== 'production' && req.query.creator === 'true') {
      isAdmin = true;
      console.log('🔧 DEV MODE: Content creator mode enabled via ?creator=true (PAGE)');
    }
    // Also check res.locals.isContentCreator (set by template locals middleware)
    else if (res.locals.isContentCreator) {
      isAdmin = true;
      console.log('🔐 Content creator detected via res.locals.isContentCreator');
    }
    // Production: Check if user is authenticated and is a content creator
    else if (req.user && (req.user.isContentCreator || (req.user.groups && req.user.groups.includes('content_manager')))) {
      isAdmin = true;
      console.log('🔐 Content creator detected:', req.user.email);
    } else {
      console.log('👤 Regular user (no access to unpublished content)');
      console.log('   req.user:', req.user ? 'exists' : 'null');
      console.log('   res.locals.isContentCreator:', res.locals.isContentCreator);
    }
    
    const enhancedPlaylist = await getEnhancedPlaylist(null, isAdmin, true); // includeEpisodeData = true for page
    console.log('🎵 Enhanced playlist loaded with', enhancedPlaylist.length, 'tracks (admin:', isAdmin + ')');
    console.log('🎵 Enhanced playlist seasons:', enhancedPlaylist.map(t => `S${t.season}E${t.episodeNumber || t.episode}`).join(', '));

    res.render('radio-player', {
      title: 'Wavelength Radio',
      pageTitle: 'Wavelength Radio - Interactive Music Player',
      pageDescription: 'Listen to the soundtrack of Wavelength Lore with our interactive radio player',
      playlist: enhancedPlaylist,
      currentPage: '/radio',
      cdnUrl: process.env.CDN_URL || '',
      version: `v${Date.now()}`,
      req: req
    });
  } catch (error) {
    console.error('Error loading radio player:', error);
    res.status(500).send('Error loading radio player');
  }
});

// Get radio station playlist  
router.get('/api/radio/playlist', optionalAuth, async (req, res) => {
  try {
    const season = req.query.season ? parseInt(req.query.season) : null;
    
    // Check if this is authenticated content creator for unpublished content
    let isAdmin = false;
    
    // Development override: allow ?creator=true for local testing
    if (process.env.NODE_ENV !== 'production' && req.query.creator === 'true') {
      isAdmin = true;
      console.log('🔧 DEV MODE: Content creator mode enabled via ?creator=true');
    }
    // Also check res.locals.isContentCreator (set by template locals middleware)
    else if (res.locals && res.locals.isContentCreator) {
      isAdmin = true;
      console.log('🔐 API Content creator detected via res.locals.isContentCreator');
    }
    // Production: Check if user is authenticated and is a content creator
    else if (req.user && (req.user.isContentCreator || (req.user.groups && req.user.groups.includes('content_manager')))) {
      isAdmin = true;
      console.log('🔐 API Content creator detected:', req.user.email);
    } else {
      console.log('👤 API Regular user (no access to unpublished content)');
      console.log('   req.user:', req.user ? 'exists' : 'null');
      console.log('   res.locals.isContentCreator:', res.locals ? res.locals.isContentCreator : 'res.locals not set');
    }
    
    console.log('Radio API request: season=' + season + ', isAdmin=' + isAdmin + ', hostname=' + req.hostname);
    
    console.log('🎵 API: Getting enhanced playlist with episode data...');
    const playlist = await getEnhancedPlaylist(season, isAdmin, true); // includeEpisodeData = true for screensaver images
    console.log('🎵 API: Enhanced playlist returned', playlist.length, 'tracks');
    
    console.log('Got playlist: ' + (playlist ? playlist.length : 0) + ' tracks');
    res.json(playlist || []);
  } catch (error) {
    console.error('Error fetching playlist:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Failed to fetch playlist', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// API endpoint for playlist migration (for admin/CLI use)
router.post('/api/radio/migrate-playlist', async (req, res) => {
  try {
    const activeSongsService = initializeSongsService();
    
    if (!activeSongsService) {
      return res.status(503).json({ 
        error: 'Firebase Songs Service not available',
        fallback: 'Using legacy playlist'
      });
    }

    console.log('🔄 Starting playlist migration to Firebase...');
    const result = await activeSongsService.migrateHardcodedPlaylist(LEGACY_PLAYLIST);
    
    res.json({
      message: 'Playlist migration completed',
      migrated: result.migrated,
      skipped: result.skipped,
      errors: result.errors
    });
    
  } catch (error) {
    console.error('❌ Playlist migration failed:', error);
    res.status(500).json({ 
      error: 'Migration failed', 
      message: error.message 
    });
  }
});

// Debug endpoint to test episode enhancement
router.get('/api/radio/debug', async (req, res) => {
  try {
    console.log('🐛 DEBUG: Testing enhanced playlist...');
    
    const playlist = await getEnhancedPlaylist(null, false, true);
    const firstTrack = playlist[0];
    
    console.log('🐛 DEBUG: First track keys:', Object.keys(firstTrack).join(', '));
    console.log('🐛 DEBUG: episodeImage:', firstTrack.episodeImage);
    console.log('🐛 DEBUG: images count:', firstTrack.images?.length);
    
    res.json({
      status: 'debug',
      timestamp: new Date().toISOString(),
      firstTrack: {
        title: firstTrack.title,
        episodeImage: firstTrack.episodeImage,
        imagesCount: firstTrack.images?.length || 0,
        hasImages: !!firstTrack.images,
        allKeys: Object.keys(firstTrack)
      },
      playlistLength: playlist.length
    });
  } catch (error) {
    console.error('🐛 DEBUG: Error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      stack: error.stack
    });
  }
});

// Health check endpoint
router.get('/api/radio/health', async (req, res) => {
  try {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      playlist: 'available'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Manual cache bust endpoint for radio data
router.post('/api/radio/cache-bust', verifyToken, async (req, res) => {
  try {
    console.log('🔄 Manual cache bust triggered for radio data');
    
    // Clear any in-memory cache
    playlistCache = null;
    cacheTimestamp = null;
    
    // Trigger CloudFront cache invalidation
    const CloudFrontCacheBuster = require('../scripts/cloudfront-cache-bust');
    const cacheBuster = new CloudFrontCacheBuster('primary');
    
    const radioPaths = ['/api/radio/*', '/radio*'];
    await cacheBuster.invalidateCache(radioPaths);
    
    res.json({
      success: true,
      message: 'Radio cache busted successfully',
      timestamp: new Date().toISOString(),
      paths: radioPaths
    });
    
  } catch (error) {
    console.error('❌ Cache bust failed:', error);
    res.status(500).json({
      success: false,
      error: 'Cache bust failed',
      message: error.message
    });
  }
});

module.exports = router;
