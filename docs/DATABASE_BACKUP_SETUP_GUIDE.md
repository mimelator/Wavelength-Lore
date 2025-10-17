# Database Backup System Setup & Usage Guide

## 🎯 **Overview**

The Wavelength Lore Database Backup system provides enterprise-grade automated backups with AWS S3 storage, AES-256-GCM encryption, and comprehensive management tools. This guide will walk you through complete setup and usage.

## 🗄️ **Step 1: Configure AWS Credentials** 🔑

### **1.1 Create AWS Account & IAM User**

If you don't have an AWS account:
1. Go to [https://aws.amazon.com/](https://aws.amazon.com/)
2. Create account
3. Navigate to **IAM Console** → **Users** → **Create User**
4. User name: `wavelength-backup-user`
5. Select **"Programmatic access"**

### **1.2 Set IAM Permissions**

Create a custom policy with the following permissions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:CreateBucket",
                "s3:ListBucket",
                "s3:GetBucketLocation",
                "s3:GetBucketVersioning",
                "s3:PutBucketVersioning",
                "s3:GetEncryptionConfiguration",
                "s3:PutEncryptionConfiguration",
                "s3:GetLifecycleConfiguration",
                "s3:PutLifecycleConfiguration",
                "s3:GetBucketPolicy",
                "s3:PutBucketPolicy"
            ],
            "Resource": "arn:aws:s3:::wavelength-lore-backups"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:GetObjectVersion",
                "s3:DeleteObjectVersion",
                "s3:ListMultipartUploadParts",
                "s3:AbortMultipartUpload",
                "s3:GetObjectAttributes"
            ],
            "Resource": "arn:aws:s3:::wavelength-lore-backups/*"
        }
    ]
}
```

### **1.3 Generate Access Keys**

1. In IAM console, select your backup user
2. Go to **"Security credentials"** tab
3. Click **"Create access key"** for **"Application running outside AWS"**
4. **Save the Access Key ID and Secret Access Key** (you'll need these next)

## ⚙️ **Step 2: Environment Configuration**

Add these variables to your `.env` file:

```bash
# === Database Backup Configuration ===

# Enable/disable backup system
ENABLE_BACKUPS=true

# AWS S3 Configuration for backups
AWS_ACCESS_KEY_ID=your-aws-access-key-id-here
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key-here
BACKUP_S3_BUCKET=wavelength-lore-backups
BACKUP_S3_REGION=us-east-1

# Backup Settings
BACKUP_RETENTION_DAYS=30
BACKUP_COMPRESSION=true
BACKUP_ENCRYPTION=true
BACKUP_ENCRYPTION_KEY=generate-a-64-character-hex-key-here

# Backup Schedule (Cron format)
BACKUP_DAILY_TIME=0 2 * * *     # 2 AM daily
BACKUP_WEEKLY_TIME=0 3 * * 0    # 3 AM Sunday

# Local temp directory for backup processing
BACKUP_TEMP_DIR=./temp/backups
```

### **Generating Encryption Key**

Generate a secure 64-character hex key:

```bash
# On macOS/Linux:
openssl rand -hex 32

# Or use online generator:
# https://www.allkeysgenerator.com/Random/Security-Encryption-Key-Generator.aspx
```

## 🚀 **Step 3: Initialize Backup System**

Run these commands to set up and test your backup system:

```bash
# 1. Test your AWS credentials and configuration
node scripts/backup-cli.js status

# 2. Initialize the backup system (creates S3 bucket, sets encryption, etc.)
node scripts/backup-cli.js init

# 3. Test backup functionality
node scripts/backup-cli.js test
```

### **Expected Output**

**Successful Status Check:**
```
✅ AWS S3 Access: Connected
✅ Backup Bucket: wavelength-lore-backups (exists)
✅ Encryption: Enabled (AES-256-GCM)
✅ Scheduled Backups: Active
📊 Total Backups: 0 daily, 0 weekly, 0 manual
```

**Successful Initialization:**
```
🔧 Initializing Secure Database Backup System...
✅ S3 bucket created: wavelength-lore-backups
✅ Bucket encryption enabled (AES-256)
✅ Bucket versioning enabled
✅ Lifecycle policy configured
🎉 Backup system initialized successfully!
```

## 💾 **Step 4: Create Your First Backup**

```bash
# Create a manual backup
node scripts/backup-cli.js backup manual

# List all backups to verify
node scripts/backup-cli.js list

# Check backup system status
node scripts/backup-cli.js status
```

## 🎯 **Backup Operations Reference**

### **Manual Backups**

```bash
# Create immediate backup
node scripts/backup-cli.js backup manual

# Create backup with custom description
node scripts/backup-cli.js backup manual "pre-deployment-backup"

# Create weekly-type backup manually
node scripts/backup-cli.js backup weekly
```

### **Scheduled Backups**

The system automatically creates:
- **Daily backups** at 2 AM (configurable via `BACKUP_DAILY_TIME`)
- **Weekly backups** on Sunday at 3 AM (configurable via `BACKUP_WEEKLY_TIME`)

**Custom Schedule Examples:**
```bash
# Daily at 3:30 AM
BACKUP_DAILY_TIME=30 3 * * *

# Weekly on Friday at 11 PM
BACKUP_WEEKLY_TIME=0 23 * * 5

# Multiple daily backups (8 AM and 8 PM)
BACKUP_DAILY_TIME=0 8,20 * * *
```

### **Backup Management**

```bash
# List all backups
node scripts/backup-cli.js list

# List only daily backups
node scripts/backup-cli.js list daily

# List only weekly backups
node scripts/backup-cli.js list weekly

# List only manual backups
node scripts/backup-cli.js list manual

# Show detailed backup system status
node scripts/backup-cli.js status
```

### **Restore Operations**

```bash
# Step 1: List backups to find the one you want
node scripts/backup-cli.js list

# Step 2: Restore from specific backup (use full S3 key)
node scripts/backup-cli.js restore "backups/daily/20251017/backup_daily_20251017_020000.json"

# Step 3: Restore to specific local file
node scripts/backup-cli.js restore "backup-key" "./restore/my-backup.json"
```

**Example Restore Session:**
```bash
$ node scripts/backup-cli.js list daily
📋 Daily Backups:
   backups/daily/20251017/backup_daily_20251017_020000.json (5.2 MB)
   backups/daily/20251016/backup_daily_20251016_020000.json (5.1 MB)

$ node scripts/backup-cli.js restore "backups/daily/20251017/backup_daily_20251017_020000.json"
🔄 Downloading backup from S3...
🔓 Decrypting backup data...
✅ Backup restored to ./temp/backups/restored_backup.json
```

## 🔒 **Security Features**

### **Encryption**
- **AES-256-GCM encryption** for all backup data
- **Unique encryption key** per backup operation
- **Secure key storage** in environment variables
- **No plain-text data** stored in S3

### **Access Control**
- **IAM-based access** - only your AWS user can access backups
- **S3 server-side encryption** - additional security layer
- **Bucket versioning** - protects against accidental deletions
- **Least-privilege permissions** - minimal required AWS permissions

### **Data Integrity**
- **GZIP compression** reduces storage costs by ~70%
- **Checksums and validation** verify backup integrity
- **Automatic cleanup** removes old backups based on retention policy
- **Atomic operations** ensure backup consistency

## ⚡ **Advanced Usage**

### **API Integration**

The backup system provides RESTful API endpoints for programmatic access:

```bash
# Get backup status (requires admin access)
curl http://localhost:3001/api/admin/backup/status

# Trigger manual backup via API
curl -X POST http://localhost:3001/api/admin/backup/create \
  -H "Content-Type: application/json" \
  -d '{"type": "manual", "description": "API backup"}'

# List backups via API
curl http://localhost:3001/api/admin/backup/list

# Download backup via API
curl http://localhost:3001/api/admin/backup/download/backup-key
```

### **Monitoring & Health Checks**

```bash
# Comprehensive system status
node scripts/backup-cli.js status

# Test all backup functionality
node scripts/backup-cli.js test

# Verify specific backup integrity
node scripts/backup-cli.js verify "backup-key"
```

### **Backup Verification**

```bash
# Test restore without actually restoring
node scripts/backup-cli.js verify "backups/daily/20251017/backup_daily_20251017_020000.json"

# Expected output:
# ✅ Backup file exists in S3
# ✅ Backup file is accessible
# ✅ Encryption/decryption successful
# ✅ Data integrity verified
# 📊 Backup contains: 1,234 records, 5.2 MB compressed
```

## 📊 **Cost & Performance**

### **AWS S3 Storage Costs**
- **S3 Standard Storage**: ~$0.023 per GB per month
- **Typical backup size**: 1-5 MB compressed (10-20 MB uncompressed)
- **Monthly cost estimate**: $0.01-0.10 per month (minimal cost)
- **Data transfer**: Free for uploads, minimal download costs

### **Performance Metrics**
- **Backup creation**: ~30-60 seconds for full database
- **Backup compression**: ~70% size reduction
- **Backup encryption**: Negligible overhead
- **Restore time**: ~15-30 seconds for typical backup

### **Storage Optimization**
```bash
# Configure retention to balance cost vs. safety
BACKUP_RETENTION_DAYS=30        # Keep 30 days of daily backups
BACKUP_WEEKLY_RETENTION=84      # Keep 12 weeks of weekly backups
BACKUP_MANUAL_RETENTION=365     # Keep manual backups for 1 year
```

## 🚨 **Important Security & Best Practices**

### **Security Best Practices**
- **Rotate AWS keys** every 90 days
- **Use strong encryption key** (64 hex characters minimum)
- **Monitor access logs** in AWS CloudTrail
- **Test restore process** monthly
- **Keep backup keys secure** - store in password manager

### **Operational Best Practices**
- **Test backups regularly** - verify restore functionality
- **Monitor disk space** - ensure temp directory has sufficient space
- **Check backup logs** - review for any errors or warnings
- **Document recovery procedures** - maintain disaster recovery playbook

### **Backup Strategy Recommendations**
- **Daily backups**: Retained for 30 days (default)
- **Weekly backups**: Retained for 12 weeks  
- **Manual backups**: Created before major changes
- **Critical operations**: Always backup before deployments

## 🛠️ **Troubleshooting**

### **Common Issues**

#### **AWS Credentials Error**
```bash
Error: AWS credentials not configured
```
**Solution**: Verify `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` in `.env`

#### **S3 Bucket Access Denied**
```bash
Error: Access Denied
```
**Solution**: Check IAM policy permissions, ensure bucket name is unique

#### **Encryption Key Error**
```bash
Error: Invalid encryption key
```
**Solution**: Generate new 64-character hex key with `openssl rand -hex 32`

#### **Firebase Connection Error**
```bash
Error: Firebase connection failed
```
**Solution**: Verify Firebase credentials and `firebaseServiceAccountKey.json`

### **Getting Help**

```bash
# Show CLI help
node scripts/backup-cli.js --help

# Run system diagnostics
node scripts/backup-cli.js test

# Check logs for detailed error information
tail -f logs/server.log
```

## 📋 **Quick Reference Commands**

```bash
# Setup
node scripts/backup-cli.js init

# Daily Operations
node scripts/backup-cli.js backup manual
node scripts/backup-cli.js status
node scripts/backup-cli.js list

# Recovery
node scripts/backup-cli.js list daily
node scripts/backup-cli.js restore "backup-key"

# Maintenance
node scripts/backup-cli.js test
node scripts/backup-cli.js status
```

---

**🎉 Congratulations!** You now have a professional-grade database backup system protecting your Wavelength Lore data with enterprise-level security, automation, and reliability.

For additional support, refer to:
- [Backup Configuration Documentation](./BACKUP_CONFIGURATION.md)
- [Backup Implementation Summary](./BACKUP_IMPLEMENTATION_SUMMARY.md)
- [Security Enhancement Guide](./SECURITY_ENHANCEMENT_GUIDE.md)