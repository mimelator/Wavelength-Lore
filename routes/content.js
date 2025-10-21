/**
 * Content Routes Module
 * Handles all content-related routes: home, episodes, characters, lore, about, map
 */

const express = require('express');
const path = require('path');
const router = express.Router();

// Import Firebase utilities
const firebaseUtils = require('../helpers/firebase-utils');

// Import helper modules
const characterHelpers = require('../helpers/character-helpers');
const loreHelpers = require('../helpers/lore-helpers');
const episodeHelpers = require('../helpers/episode-helpers');

/**
 * Home page route
 */
router.get('/', async (req, res) => {
  try {
    const videos = await firebaseUtils.fetchFromFirebase('videos');
    
    res.render('index', {
      title: 'Welcome to Wavelength Lore',
      pageTitle: 'Wavelength Lore - Animated Storytelling Universe',
      pageDescription: 'Explore the Wavelength universe through animated episodes, character stories, and immersive lore. A multimedia project blending music, storytelling, and visual art.',
      pageKeywords: 'wavelength, animation, storytelling, music, episodes, characters, lore, multimedia, visual art, animated series',
      ogType: 'website',
      ogImage: process.env.CDN_URL + '/images/wavelength-og-default.webp',
      structuredData: {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "Wavelength Lore",
        "description": "Explore the Wavelength universe through animated episodes, character stories, and immersive lore.",
        "url": req.protocol + '://' + req.get('host'),
        "creator": {
          "@type": "Organization",
          "name": "Wavelength Lore"
        },
        "genre": ["Animation", "Storytelling", "Music", "Visual Art"]
      },
      isContentCreator: res.locals.isContentCreator || false, // Pass the flag to template
      cdnUrl: process.env.CDN_URL,
      version: `v${Date.now()}`,
      videos: videos || {},
      req: req
    });
  } catch (error) {
    console.error('Error fetching videos from Firebase:', error);
    res.status(500).send('Error fetching videos');
  }
});

/**
 * Helper function to fetch episode navigation data
 */
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

/**
 * Episode page route
 */
router.get('/season/:seasonNumber/episode/:episodeNumber', async (req, res) => {
  const { seasonNumber, episodeNumber } = req.params;

  try {
    const episode = await firebaseUtils.fetchFromFirebase(`videos/season${seasonNumber}/episodes/episode${episodeNumber}`);

    if (episode) {
      // Check visibility - if hidden and user is not a content creator, show 404
      if (episode.hidden && !res.locals.isContentCreator) {
        return res.status(404).send('Episode not found');
      }

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
        pageTitle: `${episode.title} - Season ${seasonNumber} Episode ${episodeNumber} | Wavelength Lore`,
        pageDescription: episode.story ? (episode.story.substring(0, 155) + '...') : `Watch ${episode.title} from Season ${seasonNumber} of the Wavelength animated series.`,
        pageKeywords: `wavelength, season ${seasonNumber}, episode ${episodeNumber}, ${episode.title}, animation, music, storytelling`,
        ogType: 'video.episode',
        ogImage: process.env.CDN_URL + episode.image,
        ogUrl: req.protocol + '://' + req.get('host') + req.originalUrl,
        structuredData: {
          "@context": "https://schema.org",
          "@type": "TVEpisode",
          "name": episode.title,
          "description": episode.story || `${episode.title} from Season ${seasonNumber} of Wavelength`,
          "episodeNumber": episodeNumber,
          "seasonNumber": seasonNumber,
          "partOfSeries": {
            "@type": "TVSeries",
            "name": "Wavelength"
          },
          "image": process.env.CDN_URL + episode.image,
          "url": req.protocol + '://' + req.get('host') + req.originalUrl,
          "thumbnailUrl": process.env.CDN_URL + episode.image,
          "uploadDate": new Date().toISOString(),
          "genre": ["Animation", "Music", "Fantasy"]
        },
        image: episode.image,
        carouselImages: episode.carouselImages || [],
        summary: episode.story || 'coming soon',
        lyrics: episode.lyrics || 'coming soon',
        audioUrl: episode.audio,
        cdnUrl: process.env.CDN_URL,
        version: `v${Date.now()}`,
        youtubeLink: episode.youtubeLink || '#',
        seasonNumber,
        episodeNumber,
        previousLink,
        nextLink,
        req: req
      });
    } else {
      res.status(404).send('Episode not found');
    }
  } catch (error) {
    console.error('Error fetching episode data:', error);
    res.status(500).send('Error fetching episode data');
  }
});

/**
 * Individual character page route
 */
router.get('/character/:characterId', async (req, res) => {
  const { characterId } = req.params;

  try {
    const charactersData = await firebaseUtils.fetchFromFirebase('characters');

    if (charactersData) {
      // Get character directly by ID (new structure)
      const character = charactersData[characterId];

      if (!character) {
        return res.status(404).send('Character not found');
      }

      // Check visibility - if hidden and user is not a content creator, show 404
      if (character.hidden && !res.locals.isContentCreator) {
        return res.status(404).send('Character not found');
      }

      // Get all characters for navigation
      const allCharacters = Object.values(charactersData);

      const currentIndex = allCharacters.findIndex(c => c.id === characterId);
      // Adjust navigation to wrap around
      const previousCharacter = currentIndex > 0 ? allCharacters[currentIndex - 1] : allCharacters[allCharacters.length - 1];
      const nextCharacter = currentIndex < allCharacters.length - 1 ? allCharacters[currentIndex + 1] : allCharacters[0];

      res.render('character', {
        title: character.title,
        pageTitle: `${character.title} - Character Profile | Wavelength Lore`,
        pageDescription: character.description ? (character.description.substring(0, 155) + '...') : `Learn about ${character.title}, a character from the Wavelength universe.`,
        pageKeywords: `wavelength, character, ${character.title}, hero, animation, storytelling`,
        ogType: 'profile',
        ogImage: character.image || character.primary_image,
        ogUrl: req.protocol + '://' + req.get('host') + req.originalUrl,
        structuredData: {
          "@context": "https://schema.org",
          "@type": "Person",
          "name": character.title,
          "description": character.description,
          "image": character.image || character.primary_image,
          "url": req.protocol + '://' + req.get('host') + req.originalUrl,
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": req.protocol + '://' + req.get('host') + req.originalUrl
          },
          "isPartOf": {
            "@type": "CreativeWorkSeries",
            "name": "Wavelength"
          }
        },
        character: {
          id: character.id,
          title: character.title,
          description: character.description,
          primary_image: character.primary_image,
          image: character.image,
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
        version: `v${Date.now()}`,
        req: req
      });
    } else {
      res.status(404).send('Character not found');
    }
  } catch (error) {
    console.error('Error fetching character data:', error);
    res.status(500).send('Error fetching character data');
  }
});

/**
 * Character gallery page route
 */
router.get('/characters', async (req, res) => {
  try {
    // Use character helpers with visibility filtering
    const showHidden = res.locals.isContentCreator || false;
    const allCharacters = await characterHelpers.getAllCharacters(showHidden);

    res.render('character-gallery', {
        title: 'Character Gallery',
        pageTitle: 'Character Gallery - All Wavelength Heroes',
        pageDescription: 'Browse all characters from the Wavelength universe. Discover heroes, their stories, and connections in this comprehensive character gallery.',
        pageKeywords: 'wavelength, characters, heroes, gallery, animation, character profiles',
        ogType: 'website',
        ogImage: process.env.CDN_URL + '/images/character-gallery-og.jpg',
        ogUrl: req.protocol + '://' + req.get('host') + req.originalUrl,
        structuredData: {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": "Wavelength Character Gallery",
          "description": "Browse all characters from the Wavelength universe",
          "url": req.protocol + '://' + req.get('host') + req.originalUrl,
          "mainEntity": {
            "@type": "ItemList",
            "name": "Wavelength Characters",
            "numberOfItems": allCharacters.length
          }
        },
        characters: allCharacters.map(c => ({
          id: c.id,
          title: c.title,
          image: c.image,
          visible: c.visible
        })),
        isContentCreator: showHidden, // Pass the flag to template
        cdnUrl: process.env.CDN_URL,
        version: `v${Date.now()}`,
        req: req
      });
  } catch (error) {
    console.error('Error fetching characters:', error);
    res.status(500).send('Error fetching characters');
  }
});

/**
 * Individual lore page route
 */
router.get('/lore/:loreId', async (req, res) => {
  const { loreId } = req.params;

  try {
    // Use lore helpers to get lore data
    const loreItem = await loreHelpers.getLoreById(loreId);

    if (!loreItem) {
      return res.status(404).send('Lore not found');
    }

    // Check visibility - if hidden and user is not a content creator, show 404
    if (loreItem.hidden && !res.locals.isContentCreator) {
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
      pageTitle: `${loreItem.title} - Lore | Wavelength Lore`,
      pageDescription: loreItem.description ? (loreItem.description.substring(0, 155) + '...') : `Discover the lore of ${loreItem.title} in the Wavelength universe.`,
      pageKeywords: `wavelength, lore, ${loreItem.title}, world building, storytelling, universe`,
      ogType: 'article',
      ogImage: loreItem.image || loreItem.primary_image,
      ogUrl: req.protocol + '://' + req.get('host') + req.originalUrl,
      structuredData: {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": loreItem.title,
        "description": loreItem.description,
        "image": loreItem.image || loreItem.primary_image,
        "url": req.protocol + '://' + req.get('host') + req.originalUrl,
        "author": {
          "@type": "Organization",
          "name": "Wavelength Lore"
        },
        "publisher": {
          "@type": "Organization",
          "name": "Wavelength Lore"
        },
        "datePublished": new Date().toISOString(),
        "isPartOf": {
          "@type": "CreativeWorkSeries",
          "name": "Wavelength"
        }
      },
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
      version: `v${Date.now()}`,
      req: req
    });
  } catch (error) {
    console.error('Error fetching lore data:', error);
    res.status(500).send('Error fetching lore data');
  }
});

/**
 * Lore gallery page route
 */
router.get('/lore', async (req, res) => {
  try {
    // Use lore helpers with visibility filtering
    // Pass showHidden based on user role (public users see only visible content)
    const showHidden = res.locals.isContentCreator || false;
    console.log(`🔍 Lore Gallery - isContentCreator: ${res.locals.isContentCreator}, showHidden: ${showHidden}, req.user: ${req.user ? req.user.uid : 'none'}`);
    const allLore = await loreHelpers.getAllLore(showHidden);
    console.log(`📚 Lore Gallery - Retrieved ${allLore.length} lore items`);

    res.render('lore-gallery', {
      title: 'Lore Gallery',
      pageTitle: 'Lore Gallery - Wavelength Universe World Building',
      pageDescription: 'Explore the rich lore and world-building of the Wavelength universe. Discover locations, artifacts, and the deep mythology behind the stories.',
      pageKeywords: 'wavelength, lore, world building, mythology, universe, locations, artifacts, storytelling',
      ogType: 'website',
      ogImage: process.env.CDN_URL + '/images/lore-gallery-og.jpg',
      ogUrl: req.protocol + '://' + req.get('host') + req.originalUrl,
      structuredData: {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "Wavelength Lore Gallery",
        "description": "Explore the rich lore and world-building of the Wavelength universe",
        "url": req.protocol + '://' + req.get('host') + req.originalUrl,
        "mainEntity": {
          "@type": "ItemList",
          "name": "Wavelength Lore",
          "numberOfItems": allLore.length
        }
      },
      lore: allLore.map(l => ({
        id: l.id,
        title: l.title,
        image: l.image,
        type: l.type,
        visible: l.visible
      })),
      isContentCreator: showHidden, // Pass the flag to template
      cdnUrl: process.env.CDN_URL,
      version: `v${Date.now()}`,
      req: req
    });
  } catch (error) {
    console.error('Error fetching lore:', error);
    res.status(500).send('Error fetching lore');
  }
});

/**
 * About page route
 */
router.get('/about', async (req, res) => {
  try {
    const charactersData = await firebaseUtils.fetchFromFirebase('characters');

    let characterImages = [];
    if (charactersData) {
      // Collect images from all characters (new structure: characters stored by ID)
      characterImages = Object.values(charactersData)
        .filter(c => c.image_gallery && c.image_gallery.length > 0)
        .map(c => c.image_gallery[0]); // Get first image from each character's gallery
    }

    res.render('about', {
      title: 'About Wavelength',
      pageTitle: 'About Wavelength - Multimedia Storytelling Project',
      pageDescription: 'Learn about the Wavelength project - a multimedia universe exploring music, storytelling, and visual art through animated episodes and rich character development.',
      pageKeywords: 'wavelength, about, multimedia project, animation, music, storytelling, visual art, creator',
      ogType: 'website',
      ogImage: process.env.CDN_URL + '/images/wavelength-about-og.jpg',
      ogUrl: req.protocol + '://' + req.get('host') + req.originalUrl,
      structuredData: {
        "@context": "https://schema.org",
        "@type": "AboutPage",
        "name": "About Wavelength",
        "description": "Learn about the Wavelength project - a multimedia universe exploring music, storytelling, and visual art.",
        "url": req.protocol + '://' + req.get('host') + req.originalUrl,
        "mainEntity": {
          "@type": "CreativeWorkSeries",
          "name": "Wavelength",
          "description": "A multimedia project exploring the intersection of music, storytelling, and visual art",
          "genre": ["Animation", "Music", "Fantasy", "Storytelling"]
        }
      },
      cdnUrl: process.env.CDN_URL,
      version: `v${Date.now()}`,
      characterImages,
      req: req
    });
  } catch (error) {
    console.error('Error fetching character images:', error);
    res.status(500).send('Error fetching character images');
  }
});

/**
 * Map page route
 */
router.get('/map', async (req, res) => {
  try {
    const fs = require('fs');
    
    // Read the SVG map file
    const mapPath = path.join(__dirname, '../content/maps/wavelength-world-map.svg');
    let mapContent = '';
    
    try {
      mapContent = fs.readFileSync(mapPath, 'utf8');
    } catch (error) {
      console.error('Error reading map file:', error);
      mapContent = '<p>Map temporarily unavailable</p>';
    }
    
    res.render('map', {
      title: 'World Map - Wavelength Lore',
      pageTitle: 'World Map - Wavelength Lore',
      pageDescription: 'Explore the interactive world map of Wavelength, featuring locations, characters, and lore from the series.',
      pageKeywords: 'wavelength map, interactive map, fantasy world, lore locations, character locations',
      description: 'Explore the interactive world map of Wavelength, featuring locations, characters, and lore from the series.',
      keywords: 'wavelength map, interactive map, fantasy world, lore locations, character locations',
      ogType: 'website',
      ogImage: process.env.CDN_URL + '/images/wavelength-map-og.jpg',
      cdnUrl: process.env.CDN_URL,
      version: `v${Date.now()}`,
      mapContent: mapContent,
      req: req
    });
  } catch (error) {
    console.error('Error rendering map page:', error);
    res.status(500).send('Error loading map page');
  }
});

/**
 * Search page route
 */
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q || '';

    res.render('search', {
      title: 'Search Wavelength Lore',
      pageTitle: query ? `Search results for "${query}"` : 'Search Wavelength Lore',
      pageDescription: 'Search for characters, lore, and episodes in the Wavelength universe.',
      searchQuery: query,
      cdnUrl: process.env.CDN_URL,
      version: `v${Date.now()}`,
      req: req
    });
  } catch (error) {
    console.error('Error rendering search page:', error);
    res.status(500).send('Error loading search page');
  }
});

/**
 * Search API endpoint
 */
router.get('/api/search', async (req, res) => {
  try {
    const query = (req.query.q || '').toLowerCase().trim();
    const type = req.query.type || 'all'; // all, characters, lore, episodes
    const limit = parseInt(req.query.limit) || 50;

    if (!query) {
      return res.json({
        success: true,
        results: {
          characters: [],
          lore: [],
          episodes: []
        },
        total: 0
      });
    }

    const results = {
      characters: [],
      lore: [],
      episodes: []
    };

    // Search characters
    if (type === 'all' || type === 'characters') {
      const allCharacters = characterHelpers.getAllCharactersSync();
      const charactersArray = Array.isArray(allCharacters) ? allCharacters : Object.values(allCharacters || {});
      results.characters = charactersArray
        .filter(char => {
          const searchableText = [
            char.name || '',
            char.title || '',
            char.description || '',
            char.role || '',
            ...(char.keywords || [])
          ].join(' ').toLowerCase();

          return searchableText.includes(query);
        })
        .map(char => ({
          type: 'character',
          id: char.id,
          title: char.title || char.name,
          name: char.name,
          description: char.description ? char.description.substring(0, 200) + '...' : '',
          image: char.image,
          url: char.url || `/character/${char.id}`,
          role: char.role
        }))
        .slice(0, limit);
    }

    // Search lore
    if (type === 'all' || type === 'lore') {
      const allLore = loreHelpers.getAllLoreSync();
      const loreArray = Array.isArray(allLore) ? allLore : Object.values(allLore || {});
      results.lore = loreArray
        .filter(loreItem => {
          const searchableText = [
            loreItem.name || '',
            loreItem.title || '',
            loreItem.description || '',
            loreItem.type || '',
            ...(loreItem.keywords || [])
          ].join(' ').toLowerCase();

          return searchableText.includes(query);
        })
        .map(loreItem => ({
          type: 'lore',
          id: loreItem.id,
          title: loreItem.title || loreItem.name,
          name: loreItem.name,
          description: loreItem.description ? loreItem.description.substring(0, 200) + '...' : '',
          image: loreItem.image,
          url: loreItem.url || `/lore/${loreItem.id}`,
          loreType: loreItem.type
        }))
        .slice(0, limit);
    }

    // Search episodes
    if (type === 'all' || type === 'episodes') {
      const allEpisodes = episodeHelpers.getAllEpisodesSync();
      const episodesArray = Array.isArray(allEpisodes) ? allEpisodes : Object.values(allEpisodes || {});
      results.episodes = episodesArray
        .filter(episode => {
          const searchableText = [
            episode.title || '',
            episode.summary || '',
            episode.lyrics || '',
            ...(episode.keywords || [])
          ].join(' ').toLowerCase();

          return searchableText.includes(query);
        })
        .map(episode => ({
          type: 'episode',
          id: episode.id,
          title: episode.title,
          description: episode.summary ? episode.summary.substring(0, 200) + '...' : '',
          image: episode.image,
          url: episode.url || `/season/${episode.season}/episode/${episode.episode}`,
          season: episode.season,
          episode: episode.episode
        }))
        .slice(0, limit);
    }

    const total = results.characters.length + results.lore.length + results.episodes.length;

    res.json({
      success: true,
      query: query,
      results: results,
      total: total
    });
  } catch (error) {
    console.error('Error performing search:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while searching'
    });
  }
});

module.exports = router;