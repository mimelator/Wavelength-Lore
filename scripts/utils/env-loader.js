/**
 * Environment Variable Loader for Scripts
 * 
 * This utility handles loading .env files from multiple common directories
 * to ensure scripts work from any location within the project.
 */

const fs = require('fs');
const path = require('path');

/**
 * Find and load .env file from common project directories
 * @returns {Object} Environment variables object
 */
function loadProjectEnv() {
  const currentDir = process.cwd();
  const scriptDir = __dirname;
  
  // Common locations where .env might be found
  const envPaths = [
    // Current working directory
    path.join(currentDir, '.env'),
    // Script directory's parent (scripts/..)
    path.join(scriptDir, '..', '.env'),
    // Script directory's grandparent (scripts/../..)
    path.join(scriptDir, '..', '..', '.env'),
    // Project root from common script locations
    path.join(__dirname, '../../.env'),
    // Fallback - walk up directory tree
    ...walkUpForEnv(currentDir)
  ];
  
  // Try each path until we find a .env file
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      console.log(`📄 Loading .env from: ${envPath}`);
      require('dotenv').config({ path: envPath });
      return process.env;
    }
  }
  
  console.warn('⚠️  No .env file found in common locations');
  console.log('Searched paths:');
  envPaths.forEach(p => console.log(`  - ${p}`));
  
  return process.env;
}

/**
 * Walk up directory tree looking for .env file
 * @param {string} startDir Starting directory
 * @returns {Array} Array of potential .env paths
 */
function walkUpForEnv(startDir) {
  const paths = [];
  let currentDir = startDir;
  let lastDir = null;
  
  // Walk up until we reach the root or can't go higher
  while (currentDir !== lastDir) {
    paths.push(path.join(currentDir, '.env'));
    lastDir = currentDir;
    currentDir = path.dirname(currentDir);
  }
  
  return paths;
}

/**
 * Validate required environment variables
 * @param {Array} requiredVars Array of required variable names
 * @throws {Error} If any required variables are missing
 */
function validateRequiredEnv(requiredVars) {
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(varName => console.error(`  - ${varName}`));
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  console.log(`✅ All required environment variables found: ${requiredVars.join(', ')}`);
}

/**
 * Get environment variable with fallback
 * @param {string} varName Variable name
 * @param {string} fallback Fallback value
 * @returns {string} Environment variable value or fallback
 */
function getEnvVar(varName, fallback = null) {
  const value = process.env[varName];
  if (!value && fallback === null) {
    console.warn(`⚠️  Environment variable ${varName} not set`);
  }
  return value || fallback;
}

/**
 * Initialize environment for scripts
 * @param {Array} requiredVars Array of required variable names
 * @returns {Object} Process environment
 */
function initScriptEnv(requiredVars = []) {
  console.log('🔧 Initializing script environment...');
  
  // Load environment variables
  const env = loadProjectEnv();
  
  // Validate required variables if specified
  if (requiredVars.length > 0) {
    validateRequiredEnv(requiredVars);
  }
  
  // Display key configuration (redacted)
  console.log('🔧 Environment loaded:');
  console.log(`  📡 CDN_URL: ${getEnvVar('CDN_URL', 'not set')}`);
  console.log(`  🔥 PROJECT_ID: ${getEnvVar('PROJECT_ID', 'not set')}`);
  console.log(`  🗄️  DATABASE_URL: ${getEnvVar('DATABASE_URL') ? 'configured' : 'not set'}`);
  
  return env;
}

module.exports = {
  loadProjectEnv,
  validateRequiredEnv,
  getEnvVar,
  initScriptEnv,
  walkUpForEnv
};