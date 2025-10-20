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

// Import route modules
const contentRoutes = require('./routes/content');
const adminRoutes = require('./routes/admin');
const contentEditRoutes = require('./routes/contentEdit');
const contentApiRoutes = require('./routes/contentApi');
const promptApiRoutes = require('./routes/promptApi');
const aiGenerationApiRoutes = require('./routes/aiGenerationApi');
const uploadAudioRoutes = require('./routes/uploadAudio');

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

  // Mount prompt API routes (protected by authentication)
  app.use('/api/prompts', promptApiRoutes);

  // Mount AI generation API routes (protected by authentication)
  app.use('/api/generate', aiGenerationApiRoutes);

  // Mount content API routes (protected by authentication)
  app.use('/', contentApiRoutes);

  // Mount audio upload routes (protected by authentication)
  app.use('/', uploadAudioRoutes);

  // Mount content edit routes (protected by authentication)
  app.use('/', contentEditRoutes);

  // Mount content routes
  app.use('/', contentRoutes);

  // Mount admin and utility routes
  app.use('/', adminRoutes);

  // Initialize all systems
  await initializeAllCaches(database);

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