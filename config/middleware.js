/**
 * Middleware Configuration Module
 * Handles all Express middleware setup and configuration
 */

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');

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
  
  // Cookie parser middleware to read cookies from requests
  app.use(cookieParser());

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
  // Serve static files from the static directory
  app.use(express.static(path.join(__dirname, '../static')));

  // Also serve static files under /static/ path for CDN compatibility in local development
  app.use('/static', express.static(path.join(__dirname, '../static')));

  // Map clean URLs to static files (for YAML path compatibility)
  // Fallback to CDN for images not found locally (e.g., AI-generated images)
  app.use('/images', express.static(path.join(__dirname, '../static/images')), (req, res, next) => {
    // If file not found locally, redirect to real CDN (CloudFront)
    // Use the actual CloudFront URL as fallback, not localhost
    const cloudFrontUrl = 'https://df5sj8f594cdx.cloudfront.net';
    const fullCdnUrl = `${cloudFrontUrl}${req.originalUrl}`;
    
    console.log(`🔗 Image not found locally, redirecting to CloudFront: ${fullCdnUrl}`);
    return res.redirect(fullCdnUrl);
  });
  
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
  // Middleware to verify Firebase ID token and set req.user
  app.use(async (req, res, next) => {
    // Try to get Firebase ID token from Authorization header or cookie
    const authHeader = req.headers.authorization;
    let idToken = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      idToken = authHeader.substring(7);
    } else if (req.cookies && req.cookies.__session) {
      idToken = req.cookies.__session;
    }
    
    if (idToken) {
      try {
        const admin = require('firebase-admin');
        const decodedToken = await admin.app('admin').auth().verifyIdToken(idToken);
        req.user = { uid: decodedToken.uid };
        console.log(`✅ User authenticated: ${decodedToken.uid}`);
      } catch (error) {
        console.log('⚠️  Invalid or expired Firebase token');
        req.user = null;
      }
    }
    
    next();
  });
  
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
          console.log(`👤 User ${req.user.uid} isContentCreator: ${res.locals.isContentCreator}, groups: ${JSON.stringify(userData.groups)}`);
        }
      } catch (error) {
        console.error('Error loading user groups:', error);
      }
    }

    next();
  });

  // Middleware to load active banners for all pages
  app.use(async (req, res, next) => {
    try {
      const bannerHelpers = require('../helpers/banner-helpers');
      res.locals.activeBanners = await bannerHelpers.getActiveBanners();
    } catch (error) {
      console.error('❌ Error loading banners:', error);
      res.locals.activeBanners = [];
    }
    next();
  });

  // Middleware to add version information to all templates
  app.use((req, res, next) => {
    // Import version manager
    const versionManager = require('../utils/version');
    
    // Add version information to templates
    const versionInfo = versionManager.getTemplateData();
    res.locals.version = versionInfo.version;
    res.locals.displayVersion = versionInfo.displayVersion;
    res.locals.buildNumber = versionInfo.buildNumber;
    res.locals.environment = versionInfo.environment;
    res.locals.versionInfo = versionInfo; // Add full version info for templates
    
    next();
  });

  // Middleware to add character, lore, and episode helpers to all templates
  app.use(async (req, res, next) => {
    // Get visibility filter based on user role
    const showHidden = res.locals.isContentCreator;
    
    // Gallery UI helpers
    const galleryUi = require('../utils/gallery/ui');
    res.locals.galleryUi = galleryUi;
    res.locals.saveToGalleryButton = galleryUi.createSaveToGalleryButton;

    // Character helpers
    res.locals.characterHelpers = characterHelpers;
    res.locals.characterLink = characterHelpers.generateCharacterLinkSync;
    res.locals.linkifyCharacters = characterHelpers.linkifyCharacterMentionsSync;
    res.locals.allCharacters = characterHelpers.getAllCharactersSync(showHidden);

    // Lore helpers
    res.locals.loreHelpers = loreHelpers;
    res.locals.loreLink = loreHelpers.generateLoreLinkSync;
    res.locals.linkifyLore = loreHelpers.linkifyLoreMentionsSync;
    res.locals.allLore = loreHelpers.getAllLoreSync(showHidden);

    // Episode helpers
    res.locals.episodeHelpers = episodeHelpers;
    res.locals.episodeLink = episodeHelpers.generateEpisodeLinkSync;
    res.locals.linkifyEpisodes = episodeHelpers.linkifyEpisodeMentionsSync;
    res.locals.allEpisodes = episodeHelpers.getAllEpisodesSync(showHidden);

    // Also provide async versions for routes that can use them
    res.locals.characterLinkAsync = characterHelpers.generateCharacterLink;
    res.locals.linkifyCharactersAsync = characterHelpers.linkifyCharacterMentions;
    res.locals.getAllCharactersAsync = (showAll) => characterHelpers.getAllCharacters(showAll !== undefined ? showAll : showHidden);
    res.locals.loreLinkAsync = loreHelpers.generateLoreLink;
    res.locals.linkifyLoreAsync = loreHelpers.linkifyLoreMentions;
    res.locals.getAllLoreAsync = (showAll) => loreHelpers.getAllLore(showAll !== undefined ? showAll : showHidden);
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

    // Add current page path for conditional rendering (e.g., global radio game widget)
    res.locals.currentPage = req.path;

    // Add user object for authentication checks in templates
    res.locals.user = req.user || null;

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

  // Import and use game API routes
  const gameApiRoutes = require('../routes/gameApi');
  app.use('/api/games', gameApiRoutes);

  // Import and use group management API routes with authentication and rate limiting
  const groupApiRoutes = require('../routes/groupApi');
  app.use('/api/groups', adminRateLimit, groupApiRoutes);

  // Import and use prompt API routes with rate limiting
  const promptApiRoutes = require('../routes/promptApi');
  app.use('/api/prompts', promptApiRoutes);

  // Import and setup forum routes
  const forumRoutes = require('../routes/forum');
  app.use('/forum', forumRoutes);

  // Import and setup games routes (VIP-only access)
  const gamesRoutes = require('../routes/games');
  app.use('/games', gamesRoutes);
}

module.exports = {
  configureMiddleware,
  configureStaticFiles,
  configureTemplateLocals,
  configureAPIRoutes
};