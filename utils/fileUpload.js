/**
 * File Upload Utility for Forum Attachments
 * Handles secure file uploads to AWS S3 with validation
 */

const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

class FileUploadHandler {
  constructor() {
    // Use admin credentials for forum attachments (has S3 permissions for forum bucket)
    const useAdminCredentials = process.env.FORUM_ATTACHMENTS_BUCKET && 
                               process.env.AWS_ACCESS_KEY_ADMIN && 
                               process.env.AWS_SECRET_ACCESS_KEY_ADMIN;
    
    // Initialize S3 client
    this.s3Client = new S3Client({
      region: process.env.BACKUP_S3_REGION || 'us-east-1',
      credentials: useAdminCredentials ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ADMIN,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_ADMIN
      } : {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.SECRET_ACCESS_KEY
      }
    });
    
    // Use the forum attachments bucket or fall back to backup bucket
    this.bucketName = process.env.FORUM_ATTACHMENTS_BUCKET || process.env.BACKUP_S3_BUCKET || 'wavelength-lore-backups';
    this.region = process.env.BACKUP_S3_REGION || 'us-east-1';
    this.cdnUrl = process.env.CDN_URL || `https://${this.bucketName}.s3.${this.region}.amazonaws.com`;
    
    console.log(`📎 File Upload Handler initialized:`);
    console.log(`   Bucket: ${this.bucketName}`);
    console.log(`   Credentials: ${useAdminCredentials ? 'Admin User' : 'Backup User'}`);
    
    this.maxFileSize = 1048576; // 1MB
    this.allowedTypes = {
      'image/jpeg': 'jpg',
      'image/png': 'png', 
      'image/gif': 'gif',
      'image/webp': 'webp',
      'text/plain': 'txt',
      'text/markdown': 'md',
      'application/pdf': 'pdf'
    };
  }

  /**
   * Configure multer for file uploads
   */
  getMulterConfig() {
    return multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: this.maxFileSize,
        files: 5 // Max 5 files per post
      },
      fileFilter: (req, file, cb) => {
        // Check file type
        if (!this.allowedTypes[file.mimetype]) {
          return cb(new Error(`File type ${file.mimetype} not allowed`), false);
        }
        
        // Check file size
        if (file.size > this.maxFileSize) {
          return cb(new Error('File too large'), false);
        }
        
        cb(null, true);
      }
    });
  }

  /**
   * Upload files to Firebase Storage
   */
  async uploadFiles(files, userId, postId) {
    const uploadPromises = files.map(file => this.uploadSingleFile(file, userId, postId));
    return Promise.all(uploadPromises);
  }

  /**
   * Upload a single file to AWS S3
   */
  async uploadSingleFile(file, userId, postId) {
    try {
      // Generate unique filename
      const timestamp = Date.now();
      const random = crypto.randomBytes(6).toString('hex');
      const extension = this.allowedTypes[file.mimetype];
      const filename = `${timestamp}-${random}.${extension}`;
      
      // Construct S3 key (path)
      const s3Key = `forum/attachments/${userId}/${postId}/${filename}`;
      
      // Upload to S3
      const uploadCommand = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          'original-name': file.originalname,
          'uploaded-by': userId,
          'post-id': postId,
          'uploaded-at': new Date().toISOString()
        }
        // Public access is handled by bucket policy
      });

      await this.s3Client.send(uploadCommand);

      // Construct public URL
      let publicUrl;
      if (this.cdnUrl.includes('cloudfront.net')) {
        // Use CloudFront URL
        publicUrl = `${this.cdnUrl}/${s3Key}`;
      } else {
        // Use direct S3 URL
        publicUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${s3Key}`;
      }

      return {
        id: random,
        originalName: file.originalname,
        filename: filename,
        size: file.size,
        mimetype: file.mimetype,
        url: publicUrl,
        s3Key: s3Key,
        bucket: this.bucketName,
        uploadedAt: timestamp
      };

    } catch (error) {
      console.error('Error uploading file to S3:', error);
      throw new Error(`Failed to upload ${file.originalname}: ${error.message}`);
    }
  }

  /**
   * Delete files from AWS S3
   */
  async deleteFiles(s3Keys) {
    const deletePromises = s3Keys.map(s3Key => {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key
      });
      return this.s3Client.send(deleteCommand).catch(err => {
        console.error(`Failed to delete ${s3Key}:`, err);
      });
    });
    
    return Promise.all(deletePromises);
  }

  /**
   * Validate uploaded files
   */
  validateFiles(files) {
    const errors = [];
    
    if (!files || files.length === 0) {
      return { isValid: true, errors: [] };
    }

    if (files.length > 5) {
      errors.push('Maximum 5 files allowed per post');
    }

    let totalSize = 0;
    files.forEach((file, index) => {
      // Check individual file size
      if (file.size > this.maxFileSize) {
        errors.push(`File ${index + 1} (${file.originalname}) exceeds 1MB limit`);
      }

      // Check file type
      if (!this.allowedTypes[file.mimetype]) {
        errors.push(`File ${index + 1} (${file.originalname}) has unsupported type: ${file.mimetype}`);
      }

      totalSize += file.size;
    });

    // Check total size (max 5MB total)
    if (totalSize > 5242880) {
      errors.push('Total file size cannot exceed 5MB');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get file info without uploading
   */
  getFileInfo(file) {
    return {
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      isImage: file.mimetype.startsWith('image/'),
      isText: file.mimetype.startsWith('text/') || file.mimetype === 'application/pdf'
    };
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

module.exports = FileUploadHandler;