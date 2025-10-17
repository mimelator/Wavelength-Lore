require('dotenv').config();
const express = require('express');
const path = require('path');

// Import shared utilities
const firebaseUtils = require('./helpers/firebase-utils');

// Import rate limiting middleware
const { createSmartRateLimit, admin: adminRateLimit } = require('./middleware/rateLimiting');

// Import input sanitization middleware
const InputSanitizer = require('./middleware/inputSanitization');

// Import helper modules
const characterHelpers = require('./helpers/character-helpers');
const loreHelpers = require('./helpers/lore-helpers');
const episodeHelpers = require('./helpers/episode-helpers');
const disambiguationHelpers = require('./helpers/disambiguation-helpers');
const simpleDisambiguation = require('./helpers/simple-disambiguation');

const app = express();
const port = 3001;

// Initialize Firebase and database connection
const database = firebaseUtils.initializeFirebase('wavelength-lore-main');

// Initialize all helper caches with shared database instance
async function initializeAllCaches() {
  try {
    // Set database instance for all helpers
    characterHelpers.setDatabaseInstance(database);
    loreHelpers.setDatabaseInstance(database);
    episodeHelpers.setDatabaseInstance(database);
    
    // Initialize caches
    await Promise.all([
      characterHelpers.initializeCharacterCache(),
      loreHelpers.initializeLoreCache(),
      episodeHelpers.initializeEpisodeCache()
    ]);
    
    console.log('All caches initialized successfully');
  } catch (error) {
    console.error('Error initializing caches:', error);
  }
}

// Initialize all systems
initializeAllCaches();

// Initialize disambiguation helpers with references to other helpers
disambiguationHelpers.setHelperModules(characterHelpers, loreHelpers, episodeHelpers);

// Initialize simple disambiguation with helper instances
simpleDisambiguation.setHelperInstances(characterHelpers, loreHelpers, episodeHelpers);

// Test Firebase connection
(async () => {
  try {
    console.log('Testing Firebase connection...');
    const testData = await firebaseUtils.fetchFromFirebase('videos');
    if (testData) {
      console.log('✅ Firebase connection successful');
    } else {
      console.log('⚠️ No data available at videos path');
    }
  } catch (error) {
    console.error('❌ Firebase connection error:', error);
  }
})();

// Generate a custom version number
const version = `v${Date.now()}`;

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Set the views directory
app.set('views', path.join(__dirname, 'views'));

// Body parser middleware for JSON requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting middleware
console.log('🛡️ Initializing rate limiting protection...');
app.use(createSmartRateLimit());

// Apply input sanitization middleware
console.log('🧹 Initializing input sanitization...');
app.use(InputSanitizer.createMiddleware({ logging: true }));

// Import and use secure forum routes
const secureForumRoutes = require('./routes/secureForumRoutes');
app.use('/api', secureForumRoutes);

// Import and use sanitization test routes
const sanitizationTestRoutes = require('./routes/sanitizationTestRoutes');
app.use('/api', sanitizationTestRoutes);

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'static')));

// Middleware to add character, lore, and episode helpers to all templates
app.use(async (req, res, next) => {
  // Character helpers
  res.locals.characterHelpers = characterHelpers;
  res.locals.characterLink = characterHelpers.generateCharacterLinkSync;
  res.locals.linkifyCharacters = characterHelpers.linkifyCharacterMentionsSync;
  res.locals.allCharacters = characterHelpers.getAllCharactersSync();
  
  // Lore helpers
  res.locals.loreHelpers = loreHelpers;
  res.locals.loreLink = loreHelpers.generateLoreLinkSync;
  res.locals.linkifyLore = loreHelpers.linkifyLoreMentionsSync;
  res.locals.allLore = loreHelpers.getAllLoreSync();
  
  // Episode helpers
  res.locals.episodeHelpers = episodeHelpers;
  res.locals.episodeLink = episodeHelpers.generateEpisodeLinkSync;
  res.locals.linkifyEpisodes = episodeHelpers.linkifyEpisodeMentionsSync;
  res.locals.allEpisodes = episodeHelpers.getAllEpisodesSync();
  
  // Also provide async versions for routes that can use them
  res.locals.characterLinkAsync = characterHelpers.generateCharacterLink;
  res.locals.linkifyCharactersAsync = characterHelpers.linkifyCharacterMentions;
  res.locals.getAllCharactersAsync = characterHelpers.getAllCharacters;
  res.locals.loreLinkAsync = loreHelpers.generateLoreLink;
  res.locals.linkifyLoreAsync = loreHelpers.linkifyLoreMentions;
  res.locals.getAllLoreAsync = loreHelpers.getAllLore;
  res.locals.episodeLinkAsync = episodeHelpers.generateEpisodeLink;
  res.locals.linkifyEpisodesAsync = episodeHelpers.linkifyEpisodeMentions;
  res.locals.getAllEpisodesAsync = episodeHelpers.getAllEpisodes;
  
  // Disambiguation helpers
  res.locals.disambiguationHelpers = disambiguationHelpers;
  res.locals.smartLinking = disambiguationHelpers.applySmartLinking;
  res.locals.smartDisambiguation = disambiguationHelpers.applySmartDisambiguation;
  res.locals.findConflicts = disambiguationHelpers.findConflicts;
  res.locals.disambiguationScript = disambiguationHelpers.getDisambiguationScript();
  res.locals.disambiguationStyles = disambiguationHelpers.getDisambiguationStyles();
  
  // Simple disambiguation (cleaner approach)
  res.locals.simpleSmartLinking = (text) => {
    const currentUrl = req.originalUrl || req.url;
    return simpleDisambiguation.applySmartLinkingSimple(text, currentUrl);
  };
  res.locals.simpleDisambiguationScript = simpleDisambiguation.getSimpleDisambiguationScript();
  res.locals.simpleDisambiguationStyles = simpleDisambiguation.getSimpleDisambiguationStyles();
  
  next();
});

// Import and setup forum routes
const forumRoutes = require('./routes/forum');
app.use('/forum', forumRoutes);

// Render the index.ejs file with gallery data
app.get('/', async (req, res) => {
  try {
    const videos = await firebaseUtils.fetchFromFirebase('videos');
    
    res.render('index', {
      title: 'Welcome to Wavelength Lore',
      cdnUrl: process.env.CDN_URL,
      version: `v${Date.now()}`,
      videos: videos || {}
    });
  } catch (error) {
    console.error('Error fetching videos from Firebase:', error);
    res.status(500).send('Error fetching videos');
  }
});

// Helper function to fetch episode navigation data
async function getEpisodeNavigation(seasonNumber, episodeNumber) {
  try {
    const season = parseInt(seasonNumber);
    const episode = parseInt(episodeNumber);
    
    // Define known season/episode bounds to avoid unnecessary Firebase calls
    const seasonBounds = {
      1: { min: 1, max: 11 },
      2: { min: 1, max: 7 },
      3: { min: 1, max: 7 },
      4: { min: 1, max: 8 }
    };
    
    const validSeasons = [1, 2, 3, 4];
    
    // Build fetch promises only for potentially valid episodes
    const fetchPromises = [];
    const fetchKeys = [];
    
    // Previous episode in same season
    if (episode > 1 && seasonBounds[season] && episode - 1 >= seasonBounds[season].min) {
      fetchPromises.push(firebaseUtils.fetchFromFirebase(`videos/season${season}/episodes/episode${episode - 1}`));
      fetchKeys.push('prevEpisode');
    } else {
      fetchKeys.push('prevEpisode');
      fetchPromises.push(Promise.resolve(null));
    }
    
    // Next episode in same season  
    if (seasonBounds[season] && episode + 1 <= seasonBounds[season].max) {
      fetchPromises.push(firebaseUtils.fetchFromFirebase(`videos/season${season}/episodes/episode${episode + 1}`));
      fetchKeys.push('nextEpisode');
    } else {
      fetchKeys.push('nextEpisode');
      fetchPromises.push(Promise.resolve(null));
    }
    
    // Previous season first episode
    if (validSeasons.includes(season - 1)) {
      fetchPromises.push(firebaseUtils.fetchFromFirebase(`videos/season${season - 1}/episodes/episode1`));
      fetchKeys.push('prevSeasonFirst');
    } else {
      fetchKeys.push('prevSeasonFirst');
      fetchPromises.push(Promise.resolve(null));
    }
    
    // Next season first episode
    if (validSeasons.includes(season + 1)) {
      fetchPromises.push(firebaseUtils.fetchFromFirebase(`videos/season${season + 1}/episodes/episode1`));
      fetchKeys.push('nextSeasonFirst');
    } else {
      fetchKeys.push('nextSeasonFirst');
      fetchPromises.push(Promise.resolve(null));
    }
    
    const results = await Promise.all(fetchPromises);
    const [prevEpisode, nextEpisode, prevSeasonFirst, nextSeasonFirst] = results;
    
    const isFirstEpisode = episode === 1;
    const isLastEpisode = !nextEpisode;
    
    return {
      previousEpisode: prevEpisode ? {
        id: episode - 1,
        title: prevEpisode.title,
        image: prevEpisode.image
      } : null,
      
      nextEpisode: nextEpisode ? {
        id: episode + 1,
        title: nextEpisode.title,
        image: nextEpisode.image
      } : null,
      
      previousSeasonFirstEpisode: isFirstEpisode && prevSeasonFirst ? {
        id: 1,
        season: season - 1,
        title: prevSeasonFirst.title,
        image: prevSeasonFirst.image
      } : null,
      
      nextSeasonFirstEpisode: isLastEpisode && nextSeasonFirst ? {
        id: 1,
        season: season + 1,
        title: nextSeasonFirst.title,
        image: nextSeasonFirst.image
      } : null
    };
  } catch (error) {
    console.error('Error fetching episode navigation:', error);
    return { previousEpisode: null, nextEpisode: null, previousSeasonFirstEpisode: null, nextSeasonFirstEpisode: null };
  }
}

// Route to render an episode page
app.get('/season/:seasonNumber/episode/:episodeNumber', async (req, res) => {
  const { seasonNumber, episodeNumber } = req.params;

  try {
    const episode = await firebaseUtils.fetchFromFirebase(`videos/season${seasonNumber}/episodes/episode${episodeNumber}`);

    if (episode) {
      const navigation = await getEpisodeNavigation(seasonNumber, episodeNumber);

      let previousLink = null;
      let nextLink = null;

      if (navigation.previousEpisode) {
        previousLink = {
          url: `/season/${seasonNumber}/episode/${navigation.previousEpisode.id}`,
          title: navigation.previousEpisode.title,
          image: navigation.previousEpisode.image
        };
      } else if (navigation.previousSeasonFirstEpisode) {
        previousLink = {
          url: `/season/${navigation.previousSeasonFirstEpisode.season}/episode/${navigation.previousSeasonFirstEpisode.id}`,
          title: navigation.previousSeasonFirstEpisode.title,
          image: navigation.previousSeasonFirstEpisode.image
        };
      }

      if (navigation.nextEpisode) {
        nextLink = {
          url: `/season/${seasonNumber}/episode/${navigation.nextEpisode.id}`,
          title: navigation.nextEpisode.title,
          image: navigation.nextEpisode.image
        };
      } else if (navigation.nextSeasonFirstEpisode) {
        nextLink = {
          url: `/season/${navigation.nextSeasonFirstEpisode.season}/episode/${navigation.nextSeasonFirstEpisode.id}`,
          title: navigation.nextSeasonFirstEpisode.title,
          image: navigation.nextSeasonFirstEpisode.image
        };
      }

      if (episode.carouselImages) {
        // Shuffle the carouselImages array
        episode.carouselImages = episode.carouselImages.sort(() => Math.random() - 0.5);
      }

      res.render('episode', {
        title: episode.title,
        image: episode.image,
        carouselImages: episode.carouselImages || [], // Default to an empty array if null
        summary: episode.story || 'coming soon', // Default to 'coming soon' if null
        lyrics: episode.lyrics || 'coming soon', // Default to 'coming soon' if null
        audioUrl: episode.audio,
        cdnUrl: process.env.CDN_URL,
        version: `v${Date.now()}`,
        youtubeLink: episode.youtubeLink || '#',
        previousLink,
        nextLink
      });
    } else {
      res.status(404).send('Episode not found');
    }
  } catch (error) {
    console.error('Error fetching episode data:', error);
    res.status(500).send('Error fetching episode data');
  }
});

// Route to render a character page
app.get('/character/:characterId', async (req, res) => {
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

      // Fetch all characters for navigation
      let allCharacters = [];
      for (const category in charactersData) {
        if (Array.isArray(charactersData[category])) {
          allCharacters = allCharacters.concat(charactersData[category]);
        }
      }

      const currentIndex = allCharacters.findIndex(c => c.id === characterId);
      // Adjust navigation to wrap around
      const previousCharacter = currentIndex > 0 ? allCharacters[currentIndex - 1] : allCharacters[allCharacters.length - 1];
      const nextCharacter = currentIndex < allCharacters.length - 1 ? allCharacters[currentIndex + 1] : allCharacters[0];

      res.render('character', {
        title: character.title,
        character: {
          id: character.id,
          title: character.title,
          description: character.description,
          primary_image: character.primary_image,
          image: character.image, // New field
          image_gallery: character.image_gallery
        },
        allCharacters: allCharacters.map(char => ({
          id: char.id,
          name: char.title,
          url: `/character/${char.id}`
        })),
        previousCharacter,
        nextCharacter,
        cdnUrl: process.env.CDN_URL,
        version: `v${Date.now()}`
      });
    } else {
      res.status(404).send('Character not found');
    }
  } catch (error) {
    console.error('Error fetching character data:', error);
    res.status(500).send('Error fetching character data');
  }
});

// Route to render the Character Gallery page
app.get('/characters', async (req, res) => {
  try {
    const charactersData = await firebaseUtils.fetchFromFirebase('characters');

    if (charactersData) {
      // Extract all characters from the new schema
      const allCharacters = [];
      for (const category in charactersData) {
        if (Array.isArray(charactersData[category])) {
          allCharacters.push(...charactersData[category]);
        }
      }

      res.render('character-gallery', {
        title: 'Character Gallery',
        characters: allCharacters.map(c => ({
          id: c.id,
          title: c.title,
          image: c.image
        })),
        cdnUrl: process.env.CDN_URL,
        version: `v${Date.now()}`
      });
    } else {
      res.status(404).send('No characters found');
    }
  } catch (error) {
    console.error('Error fetching characters:', error);
    res.status(500).send('Error fetching characters');
  }
});

// Route to render a lore page
app.get('/lore/:loreId', async (req, res) => {
  const { loreId } = req.params;

  try {
    // Use lore helpers to get lore data
    const loreItem = await loreHelpers.getLoreById(loreId);

    if (!loreItem) {
      return res.status(404).send('Lore not found');
    }

    // Get all lore for navigation
    const allLore = await loreHelpers.getAllLore();
    const currentIndex = allLore.findIndex(l => l.id === loreId);
    
    // Adjust navigation to wrap around
    const previousLore = currentIndex > 0 ? allLore[currentIndex - 1] : allLore[allLore.length - 1];
    const nextLore = currentIndex < allLore.length - 1 ? allLore[currentIndex + 1] : allLore[0];

    res.render('lore', {
      title: loreItem.title,
      lore: {
        id: loreItem.id,
        title: loreItem.title,
        description: loreItem.description,
        primary_image: loreItem.primary_image,
        image: loreItem.image,
        image_gallery: loreItem.image_gallery,
        type: loreItem.type
      },
      previousLore,
      nextLore,
      cdnUrl: process.env.CDN_URL,
      version: `v${Date.now()}`
    });
  } catch (error) {
    console.error('Error fetching lore data:', error);
    res.status(500).send('Error fetching lore data');
  }
});

// Route to render the Lore Gallery page
app.get('/lore', async (req, res) => {
  try {
    // Use lore helpers to get all lore data
    const allLore = await loreHelpers.getAllLore();

    res.render('lore-gallery', {
      title: 'Lore Gallery',
      lore: allLore.map(l => ({
        id: l.id,
        title: l.title,
        image: l.image,
        type: l.type
      })),
      cdnUrl: process.env.CDN_URL,
      version: `v${Date.now()}`
    });
  } catch (error) {
    console.error('Error fetching lore:', error);
    res.status(500).send('Error fetching lore');
  }
});

// Route for About page
app.get('/about', async (req, res) => {
  try {
    const charactersData = await firebaseUtils.fetchFromFirebase('characters');

    let characterImages = [];
    if (charactersData) {
      // Collect images from all character categories
      for (const category in charactersData) {
        if (Array.isArray(charactersData[category])) {
          const categoryImages = charactersData[category]
            .filter(c => c.image_gallery && c.image_gallery.length > 0)
            .map(c => c.image_gallery[0]); // Get first image from each character's gallery
          characterImages = characterImages.concat(categoryImages);
        }
      }
    }

    res.render('about', {
      title: 'About Wavelength',
      cdnUrl: process.env.CDN_URL,
      version: `v${Date.now()}`,
      characterImages
    });
  } catch (error) {
    console.error('Error fetching character images:', error);
    res.status(500).send('Error fetching character images');
  }
});

// Route for Contact page
app.get('/contact', (req, res) => {
  res.render('contact', { title: 'Contact - Coming Soon', cdnUrl: process.env.CDN_URL, version: `v${Date.now()}` });
});

// Route for Cache Management page
app.get('/cache-management', (req, res) => {
  res.render('cache-management', { 
    title: 'Cache Management', 
    cdnUrl: process.env.CDN_URL, 
    version: `v${Date.now()}` 
  });
});

// Cache busting routes
app.post('/api/cache/bust', adminRateLimit, async (req, res) => {
  try {
    const { type, refresh } = req.body;
    const results = {};
    
    if (!type || type === 'all' || type === 'characters') {
      characterHelpers.clearCharacterCache();
      results.characters = 'cleared';
      
      if (refresh) {
        await characterHelpers.initializeCharacterCache();
        const characters = await characterHelpers.getAllCharacters();
        results.characters = `refreshed with ${characters.length} items`;
      }
    }
    
    if (!type || type === 'all' || type === 'lore') {
      loreHelpers.clearLoreCache();
      results.lore = 'cleared';
      
      if (refresh) {
        await loreHelpers.initializeLoreCache();
        const lore = await loreHelpers.getAllLore();
        results.lore = `refreshed with ${lore.length} items`;
      }
    }
    
    if (!type || type === 'all' || type === 'episodes') {
      episodeHelpers.clearEpisodeCache();
      results.episodes = 'cleared';
      
      if (refresh) {
        await episodeHelpers.initializeEpisodeCache();
        const episodes = await episodeHelpers.getAllEpisodes();
        results.episodes = `refreshed with ${episodes.length} items`;
      }
    }
    
    res.json({ 
      success: true, 
      message: 'Cache busting completed',
      results: results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cache busting error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET routes for simple cache busting (for easy browser testing)
app.get('/api/cache/bust', async (req, res) => {
  try {
    const refresh = req.query.refresh === 'true';
    const results = {};
    
    // Clear all caches
    characterHelpers.clearCharacterCache();
    results.characters = 'cleared';
    loreHelpers.clearLoreCache();
    results.lore = 'cleared';
    
    if (refresh) {
      await characterHelpers.initializeCharacterCache();
      const characters = await characterHelpers.getAllCharacters();
      results.characters = `refreshed with ${characters.length} items`;
      
      await loreHelpers.initializeLoreCache();
      const lore = await loreHelpers.getAllLore();
      results.lore = `refreshed with ${lore.length} items`;
    }
    
    res.json({ 
      success: true, 
      message: 'Cache busting completed for: all',
      results: results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cache busting error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.get('/api/cache/bust/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const refresh = req.query.refresh === 'true';
    const results = {};
    
    if (type === 'all' || type === 'characters') {
      characterHelpers.clearCharacterCache();
      results.characters = 'cleared';
      
      if (refresh) {
        await characterHelpers.initializeCharacterCache();
        const characters = await characterHelpers.getAllCharacters();
        results.characters = `refreshed with ${characters.length} items`;
      }
    }
    
    if (type === 'all' || type === 'lore') {
      loreHelpers.clearLoreCache();
      results.lore = 'cleared';
      
      if (refresh) {
        await loreHelpers.initializeLoreCache();
        const lore = await loreHelpers.getAllLore();
        results.lore = `refreshed with ${lore.length} items`;
      }
    }
    
    res.json({ 
      success: true, 
      message: `Cache busting completed for: ${type}`,
      results: results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cache busting error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Cache status route
app.get('/api/cache/status', async (req, res) => {
  try {
    const characters = characterHelpers.getAllCharactersSync();
    const lore = loreHelpers.getAllLoreSync();
    const episodes = episodeHelpers.getAllEpisodesSync();
    
    res.json({
      success: true,
      cache_status: {
        characters: {
          count: characters.length,
          sample_ids: characters.slice(0, 3).map(c => c.id)
        },
        lore: {
          count: lore.length,
          sample_ids: lore.slice(0, 3).map(l => l.id)
        },
        episodes: {
          count: episodes.length,
          sample_ids: episodes.slice(0, 3).map(e => e.id)
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Debug endpoint to check episode cache
app.get('/debug/episodes', async (req, res) => {
  try {
    const allEpisodes = episodeHelpers.getAllEpisodesSync();
    const episodesWithKeywords = allEpisodes.filter(ep => ep.keywords && ep.keywords.length > 0);
    
    res.json({
      totalEpisodes: allEpisodes.length,
      episodesWithKeywords: episodesWithKeywords.length,
      sampleEpisode: allEpisodes[0],
      episodesWithKeywordsSample: episodesWithKeywords.slice(0, 3)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint to force refresh episode cache
app.get('/debug/episodes/refresh', async (req, res) => {
  try {
    console.log('🔄 Forcing episode cache refresh...');
    
    // Clear the cache first
    episodeHelpers.clearEpisodeCache && episodeHelpers.clearEpisodeCache();
    
    await episodeHelpers.initializeEpisodeCache();
    const allEpisodes = episodeHelpers.getAllEpisodesSync();
    const episodesWithKeywords = allEpisodes.filter(ep => ep.keywords && ep.keywords.length > 0);
    
    // Log detailed episode info
    console.log('📊 Episode cache contents:');
    allEpisodes.slice(0, 3).forEach(ep => {
      console.log(`  - ${ep.title}:`, {
        id: ep.id,
        hasKeywords: !!(ep.keywords),
        keywords: ep.keywords || [],
        season: ep.season,
        episode: ep.episode
      });
    });
    
    res.json({
      message: 'Cache refreshed',
      totalEpisodes: allEpisodes.length,
      episodesWithKeywords: episodesWithKeywords.length,
      sampleEpisodeWithKeywords: episodesWithKeywords[0] || null,
      allEpisodesSample: allEpisodes.slice(0, 3).map(ep => ({
        title: ep.title,
        id: ep.id,
        keywords: ep.keywords || [],
        url: ep.url
      }))
    });
  } catch (error) {
    console.error('Error refreshing cache:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});