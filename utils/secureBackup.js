/**
 * Secure Database Backup System
 * Automated backups to AWS S3 with encryption and retention management
 */

const AWS = require('aws-sdk');
const admin = require('firebase-admin');
const fs = require('fs').promises;
const path = require('path');
const cron = require('node-cron');
const crypto = require('crypto');

class SecureDatabaseBackup {
  constructor(config = {}) {
    this.config = {
      // S3 Configuration
      bucketName: process.env.BACKUP_S3_BUCKET || 'wavelength-lore-backups',
      region: process.env.BACKUP_S3_REGION || 'us-east-1',
      
      // Backup Configuration
      retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS) || 30,
      compressionEnabled: process.env.BACKUP_COMPRESSION !== 'false',
      encryptionEnabled: process.env.BACKUP_ENCRYPTION !== 'false',
      
      // Schedule Configuration
      dailyBackupTime: process.env.BACKUP_DAILY_TIME || '2 0 * * *', // 2 AM daily
      weeklyBackupTime: process.env.BACKUP_WEEKLY_TIME || '0 3 * * 0', // 3 AM Sunday
      
      // Local temp directory
      tempDir: process.env.BACKUP_TEMP_DIR || './temp/backups',
      
      ...config
    };

    this.s3 = new AWS.S3({
      region: this.config.region,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      serverSideEncryption: 'AES256'
    });

    this.isInitialized = false;
    this.backupRunning = false;
  }

  /**
   * Initialize the backup system
   */
  async initialize() {
    try {
      console.log('🔧 Initializing Secure Database Backup System...');
      
      // Ensure temp directory exists
      await this.ensureTempDirectory();
      
      // Verify S3 bucket access
      await this.verifyS3Access();
      
      // Setup automated backup schedule
      this.setupBackupSchedule();
      
      this.isInitialized = true;
      console.log('✅ Backup system initialized successfully');
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize backup system:', error.message);
      throw error;
    }
  }

  /**
   * Ensure temp directory exists
   */
  async ensureTempDirectory() {
    try {
      await fs.mkdir(this.config.tempDir, { recursive: true });
      console.log(`📁 Temp directory ready: ${this.config.tempDir}`);
    } catch (error) {
      throw new Error(`Failed to create temp directory: ${error.message}`);
    }
  }

  /**
   * Verify S3 bucket access and create bucket if needed
   */
  async verifyS3Access() {
    try {
      // Check if bucket exists
      await this.s3.headBucket({ Bucket: this.config.bucketName }).promise();
      console.log(`✅ S3 bucket verified: ${this.config.bucketName}`);
    } catch (error) {
      if (error.statusCode === 404) {
        // Create bucket
        await this.createSecureS3Bucket();
      } else {
        throw new Error(`S3 access verification failed: ${error.message}`);
      }
    }
  }

  /**
   * Create secure S3 bucket with proper configuration
   */
  async createSecureS3Bucket() {
    try {
      console.log(`🪣 Creating S3 bucket: ${this.config.bucketName}`);
      
      // Create bucket
      const createParams = {
        Bucket: this.config.bucketName,
        CreateBucketConfiguration: {
          LocationConstraint: this.config.region
        }
      };
      
      if (this.config.region !== 'us-east-1') {
        await this.s3.createBucket(createParams).promise();
      } else {
        // us-east-1 doesn't need LocationConstraint
        await this.s3.createBucket({ Bucket: this.config.bucketName }).promise();
      }

      // Configure bucket encryption
      const encryptionParams = {
        Bucket: this.config.bucketName,
        ServerSideEncryptionConfiguration: {
          Rules: [{
            ApplyServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256'
            }
          }]
        }
      };
      
      await this.s3.putBucketEncryption(encryptionParams).promise();

      // Configure bucket versioning
      await this.s3.putBucketVersioning({
        Bucket: this.config.bucketName,
        VersioningConfiguration: {
          Status: 'Enabled'
        }
      }).promise();

      // Configure lifecycle policy for retention
      await this.configureBucketLifecycle();

      console.log(`✅ Secure S3 bucket created: ${this.config.bucketName}`);
    } catch (error) {
      throw new Error(`Failed to create S3 bucket: ${error.message}`);
    }
  }

  /**
   * Configure bucket lifecycle for automatic cleanup
   */
  async configureBucketLifecycle() {
    const lifecycleParams = {
      Bucket: this.config.bucketName,
      LifecycleConfiguration: {
        Rules: [{
          ID: 'BackupRetentionRule',
          Status: 'Enabled',
          Filter: { Prefix: 'backups/' },
          Expiration: {
            Days: this.config.retentionDays
          },
          NoncurrentVersionExpiration: {
            NoncurrentDays: 7
          }
        }]
      }
    };

    await this.s3.putBucketLifecycleConfiguration(lifecycleParams).promise();
    console.log(`🔄 Lifecycle policy configured: ${this.config.retentionDays} days retention`);
  }

  /**
   * Setup automated backup schedule
   */
  setupBackupSchedule() {
    // Daily backups
    cron.schedule(this.config.dailyBackupTime, async () => {
      console.log('🕐 Scheduled daily backup starting...');
      await this.performBackup('daily');
    });

    // Weekly backups (with longer retention)
    cron.schedule(this.config.weeklyBackupTime, async () => {
      console.log('🕐 Scheduled weekly backup starting...');
      await this.performBackup('weekly');
    });

    console.log('⏰ Backup schedule configured:');
    console.log(`   Daily: ${this.config.dailyBackupTime}`);
    console.log(`   Weekly: ${this.config.weeklyBackupTime}`);
  }

  /**
   * Perform database backup
   */
  async performBackup(type = 'manual') {
    if (this.backupRunning) {
      console.log('⚠️  Backup already in progress, skipping...');
      return false;
    }

    this.backupRunning = true;
    
    try {
      console.log(`🚀 Starting ${type} backup...`);
      const startTime = Date.now();
      
      // Generate backup metadata
      const backupInfo = this.generateBackupInfo(type);
      
      // Export Firebase data
      console.log('📊 Exporting Firebase database...');
      const exportData = await this.exportFirebaseData();
      
      // Create local backup file
      const localFilePath = await this.createLocalBackupFile(exportData, backupInfo);
      
      // Upload to S3
      await this.uploadToS3(localFilePath, backupInfo);
      
      // Cleanup local file
      await this.cleanupLocalFile(localFilePath);
      
      const duration = Date.now() - startTime;
      console.log(`✅ ${type} backup completed in ${duration}ms`);
      console.log(`📦 Backup stored: ${backupInfo.s3Key}`);
      
      return {
        success: true,
        duration,
        backupInfo,
        size: exportData.length
      };
      
    } catch (error) {
      console.error(`❌ Backup failed:`, error.message);
      throw error;
    } finally {
      this.backupRunning = false;
    }
  }

  /**
   * Generate backup metadata
   */
  generateBackupInfo(type) {
    const timestamp = new Date().toISOString();
    const dateFormatted = timestamp.split('T')[0].replace(/-/g, '');
    const timeFormatted = timestamp.split('T')[1].split('.')[0].replace(/:/g, '');
    
    return {
      timestamp,
      type,
      version: '1.0',
      project: 'wavelength-lore',
      filename: `backup_${type}_${dateFormatted}_${timeFormatted}.json`,
      s3Key: `backups/${type}/${dateFormatted}/backup_${type}_${dateFormatted}_${timeFormatted}.json`,
      metadata: {
        backupType: type,
        timestamp,
        application: 'wavelength-lore',
        version: require('../package.json').version || '1.0.0'
      }
    };
  }

  /**
   * Export Firebase database data
   */
  async exportFirebaseData() {
    try {
      const database = admin.database();
      const snapshot = await database.ref('/').once('value');
      const data = snapshot.val();
      
      // Add backup metadata
      const exportData = {
        metadata: {
          exportTime: new Date().toISOString(),
          exportedBy: 'secure-backup-system',
          version: '1.0'
        },
        data: data || {}
      };
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      throw new Error(`Firebase export failed: ${error.message}`);
    }
  }

  /**
   * Create local backup file with optional encryption
   */
  async createLocalBackupFile(data, backupInfo) {
    const filePath = path.join(this.config.tempDir, backupInfo.filename);
    
    let finalData = data;
    
    // Encrypt if enabled
    if (this.config.encryptionEnabled) {
      finalData = this.encryptData(data);
      backupInfo.encrypted = true;
      console.log('🔐 Data encrypted for storage');
    }
    
    // Compress if enabled
    if (this.config.compressionEnabled) {
      const zlib = require('zlib');
      finalData = zlib.gzipSync(finalData);
      backupInfo.compressed = true;
      console.log('📦 Data compressed for storage');
    }
    
    await fs.writeFile(filePath, finalData);
    
    // Get file stats
    const stats = await fs.stat(filePath);
    backupInfo.size = stats.size;
    
    console.log(`💾 Local backup file created: ${filePath} (${stats.size} bytes)`);
    
    return filePath;
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  encryptData(data) {
    const encryptionKey = process.env.BACKUP_ENCRYPTION_KEY || this.generateEncryptionKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-gcm', encryptionKey);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return JSON.stringify({
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      algorithm: 'aes-256-gcm'
    });
  }

  /**
   * Generate encryption key (should be stored securely)
   */
  generateEncryptionKey() {
    // In production, this should come from a secure key management system
    const key = crypto.randomBytes(32).toString('hex');
    console.warn('⚠️  Generated new encryption key. Store securely: BACKUP_ENCRYPTION_KEY=' + key);
    return key;
  }

  /**
   * Upload backup to S3
   */
  async uploadToS3(localFilePath, backupInfo) {
    try {
      const fileContent = await fs.readFile(localFilePath);
      
      const uploadParams = {
        Bucket: this.config.bucketName,
        Key: backupInfo.s3Key,
        Body: fileContent,
        ContentType: 'application/json',
        ServerSideEncryption: 'AES256',
        Metadata: backupInfo.metadata,
        StorageClass: backupInfo.type === 'weekly' ? 'STANDARD_IA' : 'STANDARD'
      };
      
      const result = await this.s3.upload(uploadParams).promise();
      
      console.log(`☁️  Uploaded to S3: ${result.Location}`);
      
      return result;
    } catch (error) {
      throw new Error(`S3 upload failed: ${error.message}`);
    }
  }

  /**
   * Cleanup local backup file
   */
  async cleanupLocalFile(filePath) {
    try {
      await fs.unlink(filePath);
      console.log(`🗑️  Cleaned up local file: ${filePath}`);
    } catch (error) {
      console.warn(`⚠️  Failed to cleanup local file: ${error.message}`);
    }
  }

  /**
   * List available backups
   */
  async listBackups(type = null, limit = 50) {
    try {
      const prefix = type ? `backups/${type}/` : 'backups/';
      
      const params = {
        Bucket: this.config.bucketName,
        Prefix: prefix,
        MaxKeys: limit
      };
      
      const result = await this.s3.listObjectsV2(params).promise();
      
      return result.Contents.map(obj => ({
        key: obj.Key,
        size: obj.Size,
        lastModified: obj.LastModified,
        storageClass: obj.StorageClass
      }));
    } catch (error) {
      throw new Error(`Failed to list backups: ${error.message}`);
    }
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(backupKey, targetPath = null) {
    try {
      console.log(`🔄 Restoring from backup: ${backupKey}`);
      
      // Download from S3
      const downloadParams = {
        Bucket: this.config.bucketName,
        Key: backupKey
      };
      
      const result = await this.s3.getObject(downloadParams).promise();
      let data = result.Body.toString();
      
      // Check if data is encrypted (basic detection)
      try {
        const parsed = JSON.parse(data);
        if (parsed.encrypted && parsed.algorithm) {
          console.log('🔓 Decrypting backup data...');
          data = this.decryptData(parsed);
        }
      } catch (e) {
        // Data is not encrypted JSON, continue
      }
      
      // Save to target path if specified
      if (targetPath) {
        await fs.writeFile(targetPath, data);
        console.log(`💾 Backup restored to: ${targetPath}`);
      }
      
      console.log(`✅ Backup restored successfully`);
      
      return JSON.parse(data);
    } catch (error) {
      throw new Error(`Restore failed: ${error.message}`);
    }
  }

  /**
   * Decrypt data
   */
  decryptData(encryptedData) {
    const encryptionKey = process.env.BACKUP_ENCRYPTION_KEY;
    if (!encryptionKey) {
      throw new Error('Encryption key not found in environment variables');
    }
    
    const decipher = crypto.createDecipher(encryptedData.algorithm, encryptionKey);
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Get backup system status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      backupRunning: this.backupRunning,
      config: {
        bucketName: this.config.bucketName,
        region: this.config.region,
        retentionDays: this.config.retentionDays,
        encryptionEnabled: this.config.encryptionEnabled,
        compressionEnabled: this.config.compressionEnabled
      },
      schedules: {
        daily: this.config.dailyBackupTime,
        weekly: this.config.weeklyBackupTime
      }
    };
  }
}

module.exports = SecureDatabaseBackup;