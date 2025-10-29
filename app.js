/**
 * Main Application Module
 * Configures Express app with all routes, middleware, and settings
 */

const express = require('express');
const path = require('path');

// Track application start time for uptime calculation
const APPLICATION_START_TIME = new Date();

// Import configuration modules
const { configureApp } = require('./config/server');
const { initializeDatabase, initializeAllCaches } = require('./config/database');
const { 
  configureMiddleware, 
  configureStaticFiles, 
  configureTemplateLocals, 
  configureAPIRoutes 
} = require('./config/middleware');

// Import S3 connection test
const { testS3Connection } = require('./utils/gallery/s3-connection-test');

// Import route modules
const contentRoutes = require('./routes/content');
const adminRoutes = require('./routes/admin');
const contentEditRoutes = require('./routes/contentEdit');
const contentApiRoutes = require('./routes/contentApi');
const promptApiRoutes = require('./routes/promptApi');
const aiGenerationApiRoutes = require('./routes/aiGenerationApi');
const videoGenerationRoutes = require('./routes/videoGeneration');
const uploadAudioRoutes = require('./routes/uploadAudio');
const uploadMediaRoutes = require('./routes/uploadMedia');
const downloadImagesRoutes = require('./routes/downloadImages');
const radioPlayerRoutes = require('./routes/radioPlayer');
const gamesRoutes = require('./routes/games');
const gameApiRoutes = require('./routes/gameApi');
const galleryRoutes = require('./routes/gallery');
const galleryApiRoutes = require('./routes/galleryApi');
const merchandiseRoutes = require('./routes/merchandise');
const enhancedMerchandiseRoutes = require('./routes/enhanced-merchandise');
const blueprintPreviewRoutes = require('./routes/blueprint-preview');
const adminVendorResearchRoutes = require('./routes/admin-vendor-research');
const adminVendorCatalogRoutes = require('./routes/admin-vendor-catalog');
const adminCleanupRoutes = require('./routes/admin-cleanup');
const adminCompatibilityRoutes = require('./routes/admin-compatibility');
const borderPreviewApiRoutes = require('./routes/api-border-preview');
const productImageApiRoutes = require('./routes/api-product-image');
const chatbotRoutes = require('./routes/chatbot');
const authRoutes = require('./routes/auth');

const diagnosticRoutes = require('./routes/diagnostic');
const deploymentApiRoutes = require('./routes/deploymentApi');

// Import secure backup system
const SecureDatabaseBackup = require('./utils/secureBackup');

/**
 * Create and configure Express application
 */
async function createApp() {
  const app = express();

  // Configure basic app settings
  configureApp(app);

  // Initialize database (now async)
  const { adminDb, database } = await initializeDatabase();

  // Configure middleware
  const { adminRateLimit, adminAuthStrict } = configureMiddleware(app);

  // Configure static file serving
  configureStaticFiles(app);

  // Configure template locals
  configureTemplateLocals(app);

  // Configure API routes
  configureAPIRoutes(app, adminRateLimit, adminAuthStrict);

  // Helper function to calculate application uptime
  // IMPORTANT: This function should never throw errors
  const getApplicationUptime = () => {
    try {
      const now = new Date();
      const uptimeMs = now - APPLICATION_START_TIME;
      
      // Validate that we have a positive uptime
      if (uptimeMs < 0 || !isFinite(uptimeMs)) {
        return {
          display: 'invalid',
          error: 'negative or invalid uptime',
          startTime: APPLICATION_START_TIME.toISOString()
        };
      }

      const seconds = Math.floor(uptimeMs / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      
      let uptimeDisplay;
      if (days > 0) {
        uptimeDisplay = `${days}d ${hours % 24}h ${minutes % 60}m`;
      } else if (hours > 0) {
        uptimeDisplay = `${hours}h ${minutes % 60}m`;
      } else if (minutes > 0) {
        uptimeDisplay = `${minutes}m ${seconds % 60}s`;
      } else {
        uptimeDisplay = `${seconds}s`;
      }
      
      return {
        milliseconds: uptimeMs,
        seconds: seconds,
        minutes: minutes,
        hours: hours,
        days: days,
        display: uptimeDisplay,
        startTime: APPLICATION_START_TIME.toISOString()
      };
    } catch (error) {
      // Return safe fallback if any calculation fails
      return {
        display: 'calculation-error',
        error: error.message,
        startTime: APPLICATION_START_TIME ? APPLICATION_START_TIME.toISOString() : 'unknown'
      };
    }
  };

  // Add Wavelength data API routes (TEMPORARY - should be in middleware)
  app.get('/api/health', (req, res) => {
    try {
      const basicResponse = {
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'Wavelength API'
      };

      // Try to add detailed uptime info, but don't fail if it doesn't work
      try {
        const uptime = getApplicationUptime();
        basicResponse.applicationUptime = uptime;
      } catch (uptimeError) {
        basicResponse.applicationUptime = { display: 'unavailable', error: 'calculation failed' };
      }

      res.status(200).json(basicResponse);
    } catch (error) {
      // Fallback response if everything fails
      res.status(200).json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'Wavelength API',
        note: 'minimal health check'
      });
    }
  });

  app.get('/api/seasons', (req, res) => {
    try {
      const videosData = req.app.get('videosData') || {};
      res.json({
        success: true,
        data: videosData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('API Error - seasons:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to load seasons data'
      });
    }
  });

  // Add simple health check endpoint for App Runner (no authentication required)
  // CRITICAL: This endpoint must NEVER fail or App Runner will take the service down
  app.get('/health', (_req, res) => {
    try {
      const basicHealth = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime() // Node.js process uptime in seconds
      };

      // Try to add application uptime, but don't fail if it doesn't work
      try {
        const uptime = getApplicationUptime();
        basicHealth.applicationUptime = uptime.display;
        basicHealth.startTime = uptime.startTime;
      } catch (uptimeError) {
        // Silently ignore uptime calculation errors
        basicHealth.applicationUptime = 'unavailable';
      }

      res.status(200).json(basicHealth);
    } catch (error) {
      // Even if everything fails, return a basic healthy response
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: 0
      });
    }
  });

  // Mount authentication routes (public access)
  console.log('🔐 Mounting authentication routes...');
  app.use('/', authRoutes);

  // Mount prompt API routes (protected by authentication)
  app.use('/api/prompts', promptApiRoutes);

  // Mount AI generation API routes (protected by authentication)
  app.use('/api/generate', aiGenerationApiRoutes);

  // Mount video generation routes (protected by authentication)
  app.use('/', videoGenerationRoutes);

  // Mount content API routes (protected by authentication)
  app.use('/', contentApiRoutes);

  // Mount banner API routes (protected by authentication)
  const bannerApiRoutes = require('./routes/bannerApi');
  app.use('/', bannerApiRoutes);

  // Mount audio upload routes (protected by authentication)
  app.use('/', uploadAudioRoutes);

  // Mount media upload routes (protected by authentication)
  app.use('/', uploadMediaRoutes);

  // Mount image download routes
  app.use('/', downloadImagesRoutes);

  // Mount content edit routes (protected by authentication)
  app.use('/', contentEditRoutes);

  // Mount radio player routes (public)
  app.use('/', radioPlayerRoutes);

  // Mount games routes (VIP access required)
  app.use('/games', gamesRoutes);
  
  // Mount game API routes (VIP access required)
  app.use('/api/games', gameApiRoutes);
  
  // Redirect user-gallery to my-gallery for consistency
  app.get('/user-gallery', (req, res) => {
    res.redirect(301, '/my-gallery');
  });

  // Mount gallery routes for Photo Gallery feature
  app.use('/', galleryRoutes);
  
  // Mount gallery API routes for S3 storage (protected by authentication)
  app.use('/', galleryApiRoutes);
  
  // Mount VIP chatbot routes (VIP+ access required)
  app.use('/chatbot', chatbotRoutes);
  
  // Mount forum routes (public access with authentication for posting)
  // Import forum routes after Firebase is initialized to avoid initialization conflicts
  const forumRoutes = require('./routes/forum');
  app.use('/forum', forumRoutes);
  
  // Mount diagnostic routes (for production debugging)
  app.use('/diagnostic', diagnosticRoutes);
  
  // Mount deployment status API
  app.use('/', deploymentApiRoutes);
  
  // Mount content routes FIRST (handles homepage and main content)
  app.use('/', contentRoutes);

  // Mount blueprint preview API routes FIRST to avoid conflicts with merchandise routes
  app.use('/api/merchandise', blueprintPreviewRoutes);

  // Mount border preview API routes for image border overlays
  app.use('/api/merchandise', borderPreviewApiRoutes);

  // Mount merchandise routes for custom print-on-demand store (protected by authentication)
  app.use('/api/merchandise', merchandiseRoutes);
  app.use('/merchandise', merchandiseRoutes); // Also mount at /merchandise for the main store page
  app.use('/', merchandiseRoutes); // Also mount at root for easier access to /my-orders, /support, etc.
  app.use('/api/enhanced-merchandise', enhancedMerchandiseRoutes);
  app.use('/enhanced-merchandise', enhancedMerchandiseRoutes); // Also mount at /enhanced-merchandise for the AI store page

  // Mount product image resolution API routes
  app.use('/api/product-image', productImageApiRoutes);



  // Mount admin vendor research routes (admin only)
  app.use('/admin', adminVendorResearchRoutes);
  
  // Mount admin vendor catalog routes (admin only)
  app.use('/admin', adminVendorCatalogRoutes);
  
  // Mount admin catalog API routes (admin only)
  const adminCatalogApiRoutes = require('./routes/admin-catalog-api');
  app.use('/admin', adminCatalogApiRoutes);
  
  // Mount admin cleanup routes (admin only)
  app.use('/admin', adminCleanupRoutes);
  
  // Mount admin compatibility test routes (admin only)
  app.use('/admin', adminCompatibilityRoutes);

// Route for browser test
app.get('/merchandise-store-browser-test', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'merchandise-store-browser-test.html'));
});

// Route for simple merchandise test
app.get('/simple-merch-test', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'simple-merch-test.html'));
});
  
  // Product selection page route
  app.get('/product-selection', (req, res) => {
    res.render('product-selection', {
      title: 'Select Your Product - Wavelength Lore',
      pageTitle: 'Choose Your Product',
      pageDescription: 'Select from 1,300+ available products organized by category',
      req: req
    });
  });

  // Redirect old merchandise-store route to merchandise (preserve query parameters)
  app.get('/merchandise-store', (req, res) => {
    const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    res.redirect(301, '/merchandise' + queryString);
  });

  // Mount admin and utility routes
  app.use('/', adminRoutes);

  // Initialize all systems
  await initializeAllCaches(database);

  // Test S3 connection for gallery feature
  try {
    const s3Result = await testS3Connection();
    
    if (s3Result.success) {
      console.log('📷 Gallery S3 storage connection verified successfully');
      
      // Store S3 connection status in app locals for reference
      app.locals.galleryS3Status = {
        connected: true,
        bucketExists: s3Result.bucketExists,
        availableBuckets: s3Result.availableBuckets
      };
    } else {
      console.warn('⚠️ Gallery S3 storage connection failed. Gallery features may not work correctly.');
      console.warn(`   Error: ${s3Result.error}`);
      
      app.locals.galleryS3Status = {
        connected: false,
        error: s3Result.error
      };
    }
  } catch (error) {
    console.error('❌ Error testing S3 connection:', error);
    app.locals.galleryS3Status = {
      connected: false,
      error: error.message
    };
  }

  return app;
}

/**
 * Initialize secure backup system
 */
async function initializeBackupSystem(app) {
  try {
    if (process.env.ENABLE_BACKUPS !== 'false') {
      const backupSystem = new SecureDatabaseBackup();
      await backupSystem.initialize();
      
      // Store reference for access from other parts of the app
      app.locals.backupSystem = backupSystem;
      
      console.log('💾 Backup system initialized and ready');
    } else {
      console.log('💾 Backup system disabled');
    }
  } catch (error) {
    console.error('⚠️  Backup system initialization failed:', error.message);
    console.log('📝 Note: Set AWS credentials and S3 bucket to enable backups');
  }
}

module.exports = {
  createApp,
  initializeBackupSystem
};