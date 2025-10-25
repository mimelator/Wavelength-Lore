/**
 * Server Configuration Module
 * Handles port selection, environment setup, and server configuration
 */

// Load environment variables only in development
// In production (App Runner), environment variables are injected directly by AWS
// We check if we're NOT in production before attempting to load .env
if (process.env.NODE_ENV !== 'production') {
  try {
    // Only attempt to load dotenv in development
    const dotenv = require('dotenv');
    const fs = require('fs');
    const path = require('path');

    // Load environment files in priority order:
    // 1. .env (base configuration)
    // 2. .env.local (development overrides - git ignored)
    const envFiles = [
      { path: '.env', name: 'base configuration' },
      { path: '.env.local', name: 'local development overrides' }
    ];
    
    let loadedFiles = 0;
    for (const { path: envFile, name } of envFiles) {
      const envPath = path.resolve(process.cwd(), envFile);
      if (fs.existsSync(envPath)) {
        const result = dotenv.config({ path: envPath, override: true });
        if (result.error) {
          console.log(`⚠️  Error loading ${envFile}: ${result.error.message}`);
        } else {
          console.log(`✅ Loaded ${name} from ${envFile}`);
          loadedFiles++;
        }
      }
    }
    
    if (loadedFiles === 0) {
      console.log('ℹ️  No .env files found - using system environment variables');
    }
  } catch (error) {
    // dotenv module not found or other error - not critical
    console.log('ℹ️  dotenv not available - using system environment variables');
  }
} else {
  // Production mode - App Runner injects environment variables directly
  console.log('🚀 Production mode - using App Runner environment variables');
}

const versionManager = require('../utils/version');

/**
 * Enhanced port configuration with App Runner compatibility
 * Port selection logic: Always prioritize NODE_PORT over App Runner's PORT
 */
function getPort() {
  let port;
  if (process.env.NODE_PORT && process.env.NODE_PORT !== 'undefined') {
    port = parseInt(process.env.NODE_PORT);
  } else if (process.env.PORT && process.env.PORT !== 'undefined') {
    port = parseInt(process.env.PORT);
  } else {
    port = 3001;
  }
  return port;
}

/**
 * Helper function to redact sensitive information
 */
function redactSensitive(value) {
  if (!value || typeof value !== 'string') return value;
  if (value.length <= 8) return '***';
  return value.substring(0, 4) + '***' + value.substring(value.length - 4);
}

/**
 * Display clean startup configuration
 */
function logServerConfiguration(port) {
  console.log(`\n🚀 Wavelength Lore Server Configuration:`);
  console.log(`   📡 Port: ${port}`);
  console.log(`   🌐 CDN: ${process.env.CDN_URL ? new URL(process.env.CDN_URL).hostname : 'localhost'}`);
  console.log(`   🔥 Firebase Project: ${process.env.PROJECT_ID || 'not configured'}`);
  console.log(`   🗄️  Database: ${process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).hostname : 'not configured'}`);
  console.log(`   🛡️  Backups: ${process.env.ENABLE_BACKUPS === 'true' ? 'enabled' : 'disabled'}`);
  console.log(`   🔐 Security: Rate limiting + Input sanitization enabled`);
  console.log(`   🔗 URL: http://localhost:${port}\n`);
}

/**
 * Configure Express app with basic settings
 */
function configureApp(app) {
  // Store version info for use in views
  app.locals.versionInfo = versionManager.getVersionInfo();

  // Configure trust proxy for proper IP detection
  // For AWS App Runner/ALB and CloudFront, trust only the first proxy
  // This prevents IP spoofing while allowing proper IP detection
  if (process.env.NODE_ENV === 'production') {
    // In production (AWS App Runner), trust only 1 hop (ALB)
    app.set('trust proxy', 1);
  } else {
    // In development, trust loopback and private networks
    app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);
  }
}

module.exports = {
  getPort,
  redactSensitive,
  logServerConfiguration,
  configureApp
};