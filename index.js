require('dotenv').config();
const express = require('express');
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get } = require('firebase/database');
const path = require('path');
const characterHelpers = require('./helpers/character-helpers');
const loreHelpers = require('./helpers/lore-helpers');
const episodeHelpers = require('./helpers/episode-helpers');
const disambiguationHelpers = require('./helpers/disambiguation-helpers');
const simpleDisambiguation = require('./helpers/simple-disambiguation');

const app = express();
const port = 3001;

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.API_KEY,
  authDomain: process.env.AUTH_DOMAIN,
  databaseURL: process.env.DATABASE_URL,
  projectId: process.env.PROJECT_ID,
  storageBucket: process.env.STORAGE_BUCKET,
  messagingSenderId: process.env.MESSAGING_SENDER_ID,
  appId: process.env.APP_ID
};

/*
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('API_KEY:', process.env.API_KEY);
console.log('Firebase Config:', firebaseConfig);

console.log('Environment Variables:');
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('API_KEY:', process.env.API_KEY);
*/

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const database = getDatabase(firebaseApp);

// Initialize character cache and pass database instance
characterHelpers.setDatabaseInstance(database);
characterHelpers.initializeCharacterCache();

// Initialize lore cache and pass database instance
loreHelpers.setDatabaseInstance(database);
loreHelpers.initializeLoreCache();

// Initialize episode cache and pass database instance
episodeHelpers.setDatabaseInstance(database);
episodeHelpers.initializeEpisodeCache();

// Initialize disambiguation helpers with references to other helpers
disambiguationHelpers.setHelperModules(characterHelpers, loreHelpers, episodeHelpers);

// Initialize simple disambiguation with helper instances
simpleDisambiguation.setHelperInstances(characterHelpers, loreHelpers, episodeHelpers);

(async () => {
  try {
    console.log('Attempting Firebase operation...');
    const videosRef = ref(database, 'videos'); // Use ref(database, path)
    const snapshot = await get(videosRef); // Use get() to fetch data
    if (snapshot.exists()) {
      // console.log('Firebase data:', snapshot.val());
        console.log('Firebase operation successful.');
    } else {
      console.log('No data available');
    }
  } catch (error) {
    console.error('Firebase error:', error);
  }
})();

// Generate a custom version number
const version = `v${Date.now()}`;

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Set the views directory
app.set('views', path.join(__dirname, 'views'));

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

// Render the index.ejs file with gallery data
app.get('/', async (req, res) => {
  try {
    const videosRef = ref(database, 'videos');
    const snapshot = await get(videosRef);

    if (snapshot.exists()) {
      const videos = snapshot.val();
      // console.debug('Firebase query results:', videos); // Debug message
      res.render('index', {
        title: 'Welcome to Wavelength Lore',
        cdnUrl: process.env.CDN_URL,
        version: `v${Date.now()}`,
        videos: videos
      });
    } else {
      console.debug('Firebase query returned no results.'); // Debug message
      res.render('index', {
        title: 'Welcome to Wavelength Lore',
        cdnUrl: process.env.CDN_URL,
        version: `v${Date.now()}`,
        videos: {}
      });
    }
  } catch (error) {
    console.error('Error fetching videos from Firebase:', error);
    res.status(500).send('Error fetching videos');
  }
});

// Route to render an episode page
app.get('/season/:seasonNumber/episode/:episodeNumber', async (req, res) => {
  const { seasonNumber, episodeNumber } = req.params;

  try {
    const episodeRef = ref(database, `videos/season${seasonNumber}/episodes/episode${episodeNumber}`);
    const snapshot = await get(episodeRef);

    if (snapshot.exists()) {
      const episode = snapshot.val();

      // Fetch previous and next episodes
      const prevEpisodeRef = ref(database, `videos/season${seasonNumber}/episodes/episode${parseInt(episodeNumber) - 1}`);
      const nextEpisodeRef = ref(database, `videos/season${seasonNumber}/episodes/episode${parseInt(episodeNumber) + 1}`);

      // Fetch previous and next seasons' first episodes
      const prevSeasonRef = ref(database, `videos/season${parseInt(seasonNumber) - 1}/episodes/episode1`);
      const nextSeasonRef = ref(database, `videos/season${parseInt(seasonNumber) + 1}/episodes/episode1`);

      const [prevSnapshot, nextSnapshot, prevSeasonSnapshot, nextSeasonSnapshot] = await Promise.all([get(prevEpisodeRef), get(nextEpisodeRef), get(prevSeasonRef), get(nextSeasonRef)]);

      const previousEpisode = prevSnapshot.exists() ? { 
        id: parseInt(episodeNumber) - 1, 
        title: prevSnapshot.val().title, 
        image: prevSnapshot.val().image 
      } : null;

      const nextEpisode = nextSnapshot.exists() ? { 
        id: parseInt(episodeNumber) + 1, 
        title: nextSnapshot.val().title, 
        image: nextSnapshot.val().image 
      } : null;

      const isFirstEpisode = parseInt(episodeNumber) === 1;
      const isLastEpisode = !nextSnapshot.exists();

      const previousSeasonFirstEpisode = isFirstEpisode && prevSeasonSnapshot.exists() ? {
        id: 1,
        season: parseInt(seasonNumber) - 1,
        title: prevSeasonSnapshot.val().title,
        image: prevSeasonSnapshot.val().image
      } : null;

      const nextSeasonFirstEpisode = isLastEpisode && nextSeasonSnapshot.exists() ? {
        id: 1,
        season: parseInt(seasonNumber) + 1,
        title: nextSeasonSnapshot.val().title,
        image: nextSeasonSnapshot.val().image
      } : null;

      let previousLink = null;
      let nextLink = null;

      if (previousEpisode) {
        previousLink = {
          url: `/season/${seasonNumber}/episode/${previousEpisode.id}`,
          title: previousEpisode.title,
          image: previousEpisode.image
        };
      } else if (isFirstEpisode && previousSeasonFirstEpisode) {
        previousLink = {
          url: `/season/${previousSeasonFirstEpisode.season}/episode/${previousSeasonFirstEpisode.id}`,
          title: previousSeasonFirstEpisode.title,
          image: previousSeasonFirstEpisode.image
        };
      }

      if (nextEpisode) {
        nextLink = {
          url: `/season/${seasonNumber}/episode/${nextEpisode.id}`,
          title: nextEpisode.title,
          image: nextEpisode.image
        };
      } else if (isLastEpisode && nextSeasonFirstEpisode) {
        nextLink = {
          url: `/season/${nextSeasonFirstEpisode.season}/episode/${nextSeasonFirstEpisode.id}`,
          title: nextSeasonFirstEpisode.title,
          image: nextSeasonFirstEpisode.image
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
    const charactersRef = ref(database, 'characters');
    const snapshot = await get(charactersRef);

    if (snapshot.exists()) {
      const charactersData = snapshot.val();

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
    const charactersRef = ref(database, 'characters');
    const snapshot = await get(charactersRef);

    if (snapshot.exists()) {
      const charactersData = snapshot.val();

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
    const charactersRef = ref(database, 'characters');
    const snapshot = await get(charactersRef);

    let characterImages = [];
    if (snapshot.exists()) {
      const charactersData = snapshot.val();

      // Collect images for all characters in the 'wavelength' category
      if (Array.isArray(charactersData.wavelength)) {
        characterImages = charactersData.wavelength.map(c => c.image);
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
app.post('/api/cache/bust', async (req, res) => {
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

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});