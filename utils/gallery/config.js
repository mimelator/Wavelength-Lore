/**
 * Gallery storage configuration
 * Load proper environment variables from any context
 */

try {
  // Try to use env-loader if available
  const { initScriptEnv } = require('../../scripts/utils/env-loader');
  console.log('📂 Using env-loader for gallery storage configuration');
  initScriptEnv();
} catch (error) {
  // Fall back to standard dotenv
  try {
    console.log('📂 Using standard dotenv for gallery storage configuration');
    require('dotenv').config();
  } catch (e) {
    console.log('⚠️ Could not load dotenv, relying on process.env being set');
  }
}

module.exports = {
  // ACCESS_KEY_ID is wavelength-lore-app-user (has S3FullAccess)
  // AWS_ACCESS_KEY_ID is wavelength-backup-user (only has backup bucket access)
  ACCESS_KEY_ID: process.env.ACCESS_KEY_ID,
  SECRET_ACCESS_KEY: process.env.SECRET_ACCESS_KEY,
  GALLERY_S3_BUCKET: process.env.GALLERY_S3_BUCKET,
  AWS_REGION: process.env.AWS_REGION || 'us-east-1',
  CDN_URL: process.env.GALLERY_CDN_URL || process.env.CDN_URL
};