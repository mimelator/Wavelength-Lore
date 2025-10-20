/**
 * Wavelength Lore Server
 * Main entry point for the application
 */

// Import version management
const versionManager = require('./utils/version');

// Import server configuration
const { getPort, logServerConfiguration } = require('./config/server');

// Import main application
const { createApp, initializeBackupSystem } = require('./app');

// Get server configuration
const port = getPort();

// Display startup configuration
logServerConfiguration(port);

// Start the server
(async () => {
  // Create Express app with all configurations
  const app = await createApp();

  app.listen(port, async () => {
    // Display version information at startup
    versionManager.logStartupVersion();
    
    console.log(`\n🚀 Server started successfully at http://localhost:${port}`);
    
    // Initialize backup system after server starts
    await initializeBackupSystem(app);
    
    console.log(`\n✅ Wavelength Lore server is ready and running!\n`);
  });
})();