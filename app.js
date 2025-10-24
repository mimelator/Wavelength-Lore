/**
 * Main Application Module
 * Configures Express app with all routes, middleware, and settings
 */

const express = require('express');

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
const adminVendorResearchRoutes = require('./routes/admin-vendor-research');
const borderPreviewApiRoutes = require('./routes/api-border-preview');
const productImageApiRoutes = require('./routes/api-product-image');

// Import secure backup system
const SecureDatabaseBackup = require('./utils/secureBackup');

/**
 * Create and configure Express application
 */
async function createApp() {
  const app = express();

  // Configure basic app settings
  configureApp(app);

  // Initialize database
  const database = initializeDatabase();

  // Configure middleware
  const { adminRateLimit, adminAuthStrict } = configureMiddleware(app);

  // Configure static file serving
  configureStaticFiles(app);

  // Configure template locals
  configureTemplateLocals(app);

  // Configure API routes
  configureAPIRoutes(app, adminRateLimit, adminAuthStrict);

  // Add simple health check endpoint for App Runner (no authentication required)
  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

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
  
  // Mount gallery routes for Photo Gallery feature
  app.use('/', galleryRoutes);
  
  // Mount gallery API routes for S3 storage (protected by authentication)
  app.use('/', galleryApiRoutes);
  
  // Mount merchandise routes for custom print-on-demand store (protected by authentication)
  app.use('/api/merchandise', merchandiseRoutes);
  app.use('/merchandise', merchandiseRoutes); // Also mount at /merchandise for the main store page
  app.use('/api/enhanced-merchandise', enhancedMerchandiseRoutes);
  app.use('/enhanced-merchandise', enhancedMerchandiseRoutes); // Also mount at /enhanced-merchandise for the AI store page

  // Mount border preview API routes for image border overlays
  app.use('/api/merchandise', borderPreviewApiRoutes);

  // Mount product image resolution API routes
  app.use('/api/product-image', productImageApiRoutes);

  // Mount admin vendor research routes (admin only)
  app.use('/admin', adminVendorResearchRoutes);

  // Mount content routes
  app.use('/', contentRoutes);

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