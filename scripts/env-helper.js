/**
 * Environment Helper for Scripts
 * Centralizes environment variable loading and mapping for all script files
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

/**
 * Environment variable mappings and defaults
 */
const ENV_MAPPINGS = {
  // Firebase mappings - map from app variables to script variables
  FIREBASE_DATABASE_URL: process.env.DATABASE_URL || process.env.FIREBASE_DATABASE_URL,
  FIREBASE_PROJECT_ID: process.env.PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
  FIREBASE_API_KEY: process.env.API_KEY || process.env.FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN: process.env.AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
  FIREBASE_STORAGE_BUCKET: process.env.STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID: process.env.MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID: process.env.APP_ID || process.env.FIREBASE_APP_ID,
  
  // AWS mappings - backup system uses AWS_ prefix, app might use different names
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || process.env.ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || process.env.SECRET_ACCESS_KEY,
  AWS_DEFAULT_REGION: process.env.AWS_DEFAULT_REGION || process.env.BACKUP_S3_REGION || 'us-east-1',
  
  // Backup system specific
  BACKUP_S3_BUCKET: process.env.BACKUP_S3_BUCKET || 'wavelength-lore-backups',
  BACKUP_S3_REGION: process.env.BACKUP_S3_REGION || 'us-east-1',
  BACKUP_RETENTION_DAYS: process.env.BACKUP_RETENTION_DAYS || '30',
  BACKUP_COMPRESSION: process.env.BACKUP_COMPRESSION || 'true',
  BACKUP_ENCRYPTION: process.env.BACKUP_ENCRYPTION || 'true',
  BACKUP_ENCRYPTION_KEY: process.env.BACKUP_ENCRYPTION_KEY,
  BACKUP_DAILY_TIME: process.env.BACKUP_DAILY_TIME || '0 2 * * *',
  BACKUP_WEEKLY_TIME: process.env.BACKUP_WEEKLY_TIME || '0 3 * * 0',
  BACKUP_TEMP_DIR: process.env.BACKUP_TEMP_DIR || './temp/backups',
  
  // Other common script variables
  YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
  CDN_URL: process.env.CDN_URL,
};

/**
 * Apply environment mappings to process.env
 * This ensures scripts can use consistent variable names
 */
function applyEnvironmentMappings() {
  Object.entries(ENV_MAPPINGS).forEach(([key, value]) => {
    if (value && !process.env[key]) {
      process.env[key] = value;
    }
  });
}

/**
 * Get environment variable with fallback
 */
function getEnv(key, defaultValue = null, required = false) {
  const value = ENV_MAPPINGS[key] || process.env[key] || defaultValue;
  
  if (required && !value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  
  return value;
}

/**
 * Get Firebase configuration object
 */
function getFirebaseConfig() {
  return {
    apiKey: getEnv('FIREBASE_API_KEY'),
    authDomain: getEnv('FIREBASE_AUTH_DOMAIN'),
    databaseURL: getEnv('FIREBASE_DATABASE_URL', null, true),
    projectId: getEnv('FIREBASE_PROJECT_ID'),
    storageBucket: getEnv('FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: getEnv('FIREBASE_MESSAGING_SENDER_ID'),
    appId: getEnv('FIREBASE_APP_ID'),
  };
}

/**
 * Get AWS configuration object
 */
function getAWSConfig() {
  return {
    accessKeyId: getEnv('AWS_ACCESS_KEY_ID', null, true),
    secretAccessKey: getEnv('AWS_SECRET_ACCESS_KEY', null, true),
    region: getEnv('AWS_DEFAULT_REGION', 'us-east-1'),
  };
}

/**
 * Get backup system configuration
 */
function getBackupConfig() {
  return {
    s3Bucket: getEnv('BACKUP_S3_BUCKET'),
    s3Region: getEnv('BACKUP_S3_REGION'),
    retentionDays: parseInt(getEnv('BACKUP_RETENTION_DAYS', '30')),
    compression: getEnv('BACKUP_COMPRESSION', 'true') === 'true',
    encryption: getEnv('BACKUP_ENCRYPTION', 'true') === 'true',
    encryptionKey: getEnv('BACKUP_ENCRYPTION_KEY'),
    dailyTime: getEnv('BACKUP_DAILY_TIME'),
    weeklyTime: getEnv('BACKUP_WEEKLY_TIME'),
    tempDir: getEnv('BACKUP_TEMP_DIR'),
  };
}

/**
 * Validate required environment variables for a specific feature
 */
function validateEnvironment(feature) {
  const validations = {
    firebase: () => {
      const config = getFirebaseConfig();
      if (!config.databaseURL) {
        throw new Error('Firebase Database URL is required. Set DATABASE_URL or FIREBASE_DATABASE_URL in .env');
      }
      if (!config.projectId) {
        throw new Error('Firebase Project ID is required. Set PROJECT_ID or FIREBASE_PROJECT_ID in .env');
      }
    },
    
    aws: () => {
      const config = getAWSConfig();
      if (!config.accessKeyId || !config.secretAccessKey) {
        throw new Error('AWS credentials are required. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env');
      }
    },
    
    backup: () => {
      validateEnvironment('firebase');
      validateEnvironment('aws');
      const config = getBackupConfig();
      if (!config.s3Bucket) {
        throw new Error('Backup S3 bucket is required. Set BACKUP_S3_BUCKET in .env');
      }
    }
  };
  
  if (validations[feature]) {
    validations[feature]();
  } else {
    throw new Error(`Unknown feature for validation: ${feature}`);
  }
}

/**
 * Display environment configuration summary
 */
function showEnvironmentSummary() {
  console.log('🔧 Environment Configuration Summary:');
  console.log('');
  
  // Firebase
  console.log('📊 Firebase:');
  console.log(`   Database URL: ${getEnv('FIREBASE_DATABASE_URL') ? '✅ Set' : '❌ Missing'}`);
  console.log(`   Project ID: ${getEnv('FIREBASE_PROJECT_ID') ? '✅ Set' : '❌ Missing'}`);
  console.log('');
  
  // AWS
  console.log('☁️  AWS:');
  console.log(`   Access Key: ${getEnv('AWS_ACCESS_KEY_ID') ? '✅ Set' : '❌ Missing'}`);
  console.log(`   Secret Key: ${getEnv('AWS_SECRET_ACCESS_KEY') ? '✅ Set' : '❌ Missing'}`);
  console.log(`   Region: ${getEnv('AWS_DEFAULT_REGION')}`);
  console.log('');
  
  // Backup System
  console.log('💾 Backup System:');
  console.log(`   S3 Bucket: ${getEnv('BACKUP_S3_BUCKET')}`);
  console.log(`   Retention: ${getEnv('BACKUP_RETENTION_DAYS')} days`);
  console.log(`   Encryption: ${getEnv('BACKUP_ENCRYPTION') === 'true' ? '🔐 Enabled' : '❌ Disabled'}`);
  console.log(`   Compression: ${getEnv('BACKUP_COMPRESSION') === 'true' ? '📦 Enabled' : '❌ Disabled'}`);
  console.log('');
}

// Apply mappings when module is loaded
applyEnvironmentMappings();

module.exports = {
  getEnv,
  getFirebaseConfig,
  getAWSConfig,
  getBackupConfig,
  validateEnvironment,
  showEnvironmentSummary,
  applyEnvironmentMappings
};