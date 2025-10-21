#!/usr/bin/env node

/**
 * Backup Management CLI
 * Command-line interface for managing database backups
 */

// Load environment variables with centralized helper
const envHelper = require('./env-helper');

const SecureDatabaseBackup = require('../utils/secureBackup');
const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin (using environment variables)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.PROJECT_ID,
      clientEmail: process.env.CLIENT_EMAIL,
      privateKey: process.env.PRIVATE_KEY?.replace(/\\n/g, '\n')
    }),
    databaseURL: process.env.DATABASE_URL
  });
  console.log('🔥 Firebase Admin initialized for backup CLI');
}

const backup = new SecureDatabaseBackup();

async function main() {
  const command = process.argv[2];
  const args = process.argv.slice(3);

  try {
    switch (command) {
      case 'init':
        await initializeBackup();
        break;
      case 'backup':
        await performBackup(args[0] || 'manual');
        break;
      case 'list':
        await listBackups(args[0]);
        break;
      case 'restore':
        await restoreBackup(args[0], args[1]);
        break;
      case 'status':
        showStatus();
        break;
      case 'test':
        await testBackupSystem();
        break;
      case 'env':
        envHelper.showEnvironmentSummary();
        break;
      default:
        showHelp();
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

async function initializeBackup() {
  console.log('🔧 Initializing backup system...');
  
  // Validate environment first
  try {
    envHelper.validateEnvironment('backup');
  } catch (error) {
    console.error('❌ Environment validation failed:', error.message);
    console.log('\n💡 Run "node backup-cli.js env" to see current configuration');
    throw error;
  }
  
  await backup.initialize();
  console.log('✅ Backup system ready!');
}

async function performBackup(type) {
  console.log(`🚀 Starting ${type} backup...`);
  await backup.initialize();
  const result = await backup.performBackup(type);
  
  console.log('📊 Backup Summary:');
  console.log(`   Type: ${result.backupInfo.type}`);
  console.log(`   Duration: ${result.duration}ms`);
  console.log(`   Size: ${result.size} bytes`);
  console.log(`   Location: ${result.backupInfo.s3Key}`);
}

async function listBackups(type) {
  console.log('📋 Listing available backups...');
  await backup.initialize();
  const backups = await backup.listBackups(type);
  
  if (backups.length === 0) {
    console.log('No backups found.');
    return;
  }
  
  console.log(`\n📦 Found ${backups.length} backups:\n`);
  backups.forEach((b, i) => {
    const date = new Date(b.lastModified).toLocaleString();
    const sizeMB = (b.size / 1024 / 1024).toFixed(2);
    console.log(`${i + 1}. ${b.key}`);
    console.log(`   Date: ${date}`);
    console.log(`   Size: ${sizeMB} MB`);
    console.log(`   Storage: ${b.storageClass || 'STANDARD'}`);
    console.log('');
  });
}

async function restoreBackup(backupKey, targetPath) {
  if (!backupKey) {
    console.error('❌ Please specify a backup key to restore');
    return;
  }
  
  console.log(`🔄 Restoring backup: ${backupKey}`);
  await backup.initialize();
  
  const restorePath = targetPath || `./restored_backup_${Date.now()}.json`;
  const data = await backup.restoreFromBackup(backupKey, restorePath);
  
  console.log(`✅ Backup restored to: ${restorePath}`);
  console.log(`📊 Restored data contains ${Object.keys(data.data || {}).length} top-level keys`);
}

function showStatus() {
  const status = backup.getStatus();
  
  console.log('📊 Backup System Status:');
  console.log(`   Initialized: ${status.initialized ? '✅' : '❌'}`);
  console.log(`   Backup Running: ${status.backupRunning ? '🔄' : '⏸️'}`);
  console.log('');
  console.log('⚙️  Configuration:');
  console.log(`   S3 Bucket: ${status.config.bucketName}`);
  console.log(`   Region: ${status.config.region}`);
  console.log(`   Retention: ${status.config.retentionDays} days`);
  console.log(`   Encryption: ${status.config.encryptionEnabled ? '🔐' : '❌'}`);
  console.log(`   Compression: ${status.config.compressionEnabled ? '📦' : '❌'}`);
  console.log('');
  console.log('⏰ Schedules:');
  console.log(`   Daily: ${status.schedules.daily}`);
  console.log(`   Weekly: ${status.schedules.weekly}`);
}

async function testBackupSystem() {
  console.log('🧪 Testing backup system...');
  
  try {
    // Initialize
    await backup.initialize();
    console.log('✅ Initialization test passed');
    
    // Test backup
    const result = await backup.performBackup('test');
    console.log('✅ Backup test passed');
    
    // Test list
    const backups = await backup.listBackups('test', 5);
    console.log(`✅ List test passed (${backups.length} backups found)`);
    
    console.log('🎉 All tests passed! Backup system is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
}

function showHelp() {
  console.log('🛠️  Wavelength Lore Backup Management CLI');
  console.log('');
  console.log('Usage: node backup-cli.js <command> [arguments]');
  console.log('');
  console.log('Commands:');
  console.log('  init                    Initialize backup system');
  console.log('  backup [type]          Create backup (manual/daily/weekly)');
  console.log('  list [type]            List available backups');
  console.log('  restore <key> [path]   Restore from backup');
  console.log('  status                 Show backup system status');
  console.log('  test                   Test backup system');
  console.log('  env                    Show environment configuration');
  console.log('');
  console.log('Examples:');
  console.log('  node backup-cli.js init');
  console.log('  node backup-cli.js backup manual');
  console.log('  node backup-cli.js list daily');
  console.log('  node backup-cli.js restore backups/daily/20251017/backup_daily_20251017_020000.json');
  console.log('  node backup-cli.js status');
  console.log('  node backup-cli.js env');
  console.log('');
  console.log('Environment Variables:');
  console.log('  BACKUP_S3_BUCKET          S3 bucket name for backups');
  console.log('  BACKUP_S3_REGION          AWS region for S3 bucket');
  console.log('  BACKUP_RETENTION_DAYS     Backup retention in days (default: 30)');
  console.log('  BACKUP_ENCRYPTION_KEY     Key for backup encryption');
  console.log('  AWS_ACCESS_KEY_ID         AWS access key');
  console.log('  AWS_SECRET_ACCESS_KEY     AWS secret key');
  console.log('  DATABASE_URL              Firebase database URL');
}

// Run CLI
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { backup };