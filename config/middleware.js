/**
 * Middleware Configuration Module
 * Handles all Express middleware setup and configuration
 */

const express = require('express');
const path = require('path');

// Import rate limiting middleware
const { createSmartRateLimit, admin: adminRateLimit } = require('../middleware/rateLimiting');

// Import input sanitization middleware
const InputSanitizer = require('../middleware/inputSanitization');

// Import group authentication middleware
const { GroupAuthentication } = require('../middleware/groupAuth');

// Import admin authentication middleware
const { adminAuthStrict } = require('../middleware/adminAuth');

// Import helper modules for template locals
const characterHelpers = require('../helpers/character-helpers');
const loreHelpers = require('../helpers/lore-helpers');
const episodeHelpers = require('../helpers/episode-helpers');
const disambiguationHelpers = require('../helpers/disambiguation-helpers');
const simpleDisambiguation = require('../helpers/simple-disambiguation');

/**
 * Configure all middleware for the Express app
 */
function configureMiddleware(app) {
  // Initialize group authentication
  const groupAuth = new GroupAuthentication();

  // Generate a custom version number
  const version = `v${Date.now()}`;

  // Set EJS as the view engine
  app.set('view engine', 'ejs');

  // Set the views directory
  app.set('views', path.join(__dirname, '../views'));

  // Disable view caching in development for immediate template updates
  if (process.env.NODE_ENV !== 'production') {
    app.set('view cache', false);
    console.log('📝 View caching disabled for development');
  }

  // Body parser middleware for JSON requests
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // CORS middleware for Firebase authentication
  app.use((req, res, next) => {
    // Allow requests from Firebase OAuth redirects and localhost
    const allowedOrigins = [
      'http://localhost:3001',
      `https://${process.env.AUTH_DOMAIN}`,
      'https://accounts.google.com',
      'https://www.googleapis.com',
      'https://firebase.googleapis.com',
      'https://www.gstatic.com',
      'https://identitytoolkit.googleapis.com',
      'https://securetoken.googleapis.com'
    ].filter(origin => origin !== 'https://undefined'); // Filter out undefined env vars
    
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    
    // Enhanced headers for Firebase compatibility
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Client-Data, X-Client-Version, X-Firebase-AppCheck');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400'); // Cache preflight for 24 hours
    
    // Additional headers to prevent CORB issues
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
    res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    
    next();
  });

  // Apply rate limiting middleware
  app.use(createSmartRateLimit());

  // Apply input sanitization middleware
  const sanitizer = new InputSanitizer();

  return { groupAuth, sanitizer, adminRateLimit, adminAuthStrict };
}

/**
 * Configure static file serving
 */
function configureStaticFiles(app) {
  // Serve static files from the public directory
  app.use(express.static(path.join(__dirname, '../static')));

  // Also serve static files under /static/ path for CDN compatibility in local development
  app.use('/static', express.static(path.join(__dirname, '../static')));

  // Map clean URLs to static files (for YAML path compatibility)
  app.use('/images', express.static(path.join(__dirname, '../static/images')));
  app.use('/css', express.static(path.join(__dirname, '../static/css')));

  // Special handling for JavaScript files to prevent CORB issues
  app.use('/js', (req, res, next) => {
    // Set proper headers for JavaScript files to prevent CORB blocking
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  }, express.static(path.join(__dirname, '../static/js')));

  app.use('/fonts', express.static(path.join(__dirname, '../static/fonts')));
  app.use('/icons', express.static(path.join(__dirname, '../static/icons')));
}

/**
 * Configure template locals middleware
 */
function configureTemplateLocals(app) {
  // Middleware to add user group information to templates
  app.use(async (req, res, next) => {
    // Initialize user group data
    res.locals.userGroups = [];
    res.locals.userPermissions = [];
    res.locals.userActions = [];
    res.locals.isContentCreator = false;

    // Check if user is authenticated and get their groups
    if (req.user && req.user.uid) {
      try {
        const { fetchDataAsAdmin } = require('../helpers/firebase-admin-utils');
        const userData = await fetchDataAsAdmin(`forum/users/${req.user.uid}`);

        if (userData && userData.groups) {
          res.locals.userGroups = userData.groups;
          // Check if user has content_manager role or higher
          res.locals.isContentCreator = userData.groups.includes('content_manager') ||
                                       userData.groups.includes('admin') ||
                                       userData.groups.includes('super_admin');
        }
      } catch (error) {
        console.error('Error loading user groups:', error);
      }
    }

    next();
  });

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
    res.locals.simpleDisambiguationScript = simpleDisambiguation.getSimpleDisambiguationScript(process.env.CDN_URL);
    res.locals.simpleDisambiguationStyles = simpleDisambiguation.getSimpleDisambiguationStyles();

    next();
  });
}

/**
 * Configure API routes
 */
function configureAPIRoutes(app, adminRateLimit, adminAuthStrict) {
  // Import and use secure forum routes
  const secureForumRoutes = require('../routes/secureForumRoutes');
  app.use('/api', secureForumRoutes);

  // Import and use sanitization test routes
  const sanitizationTestRoutes = require('../routes/sanitizationTestRoutes');
  app.use('/api', sanitizationTestRoutes);

  // Import and use admin backup routes with authentication and rate limiting
  const adminBackupRoutes = require('../routes/adminBackupRoutes');
  app.use('/api/admin/backup', adminAuthStrict, adminRateLimit, adminBackupRoutes);

  // Import and use admin API routes with authentication and rate limiting
  const adminApiRoutes = require('../routes/adminApi');
  app.use('/api/admin', adminRateLimit, adminApiRoutes);

  // Import and use user API routes
  const userApiRoutes = require('../routes/userApi');
  app.use('/api/user', userApiRoutes);

  // Import and use group management API routes with authentication and rate limiting
  const groupApiRoutes = require('../routes/groupApi');
  app.use('/api/groups', adminRateLimit, groupApiRoutes);

  // Import and use prompt API routes with rate limiting
  const promptApiRoutes = require('../routes/promptApi');
  app.use('/api/prompts', promptApiRoutes);

  // Import and setup forum routes
  const forumRoutes = require('../routes/forum');
  app.use('/forum', forumRoutes);
}

module.exports = {
  configureMiddleware,
  configureStaticFiles,
  configureTemplateLocals,
  configureAPIRoutes
};