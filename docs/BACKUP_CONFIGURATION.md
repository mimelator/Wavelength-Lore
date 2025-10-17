# Database Backup Configuration

## Environment Variables

Copy these variables to your `.env` file and configure according to your AWS setup:

```bash
# === Database Backup Configuration ===

# Enable/disable backup system
ENABLE_BACKUPS=true

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
BACKUP_S3_BUCKET=wavelength-lore-backups
BACKUP_S3_REGION=us-east-1

# Backup Settings
BACKUP_RETENTION_DAYS=30
BACKUP_COMPRESSION=true
BACKUP_ENCRYPTION=true
BACKUP_ENCRYPTION_KEY=your-256-bit-encryption-key-here

# Backup Schedule (Cron format)
BACKUP_DAILY_TIME=0 2 * * *     # 2 AM daily
BACKUP_WEEKLY_TIME=0 3 * * 0    # 3 AM Sunday

# Local temp directory for backup processing
BACKUP_TEMP_DIR=./temp/backups
```

## AWS S3 Setup Instructions

### 1. Create AWS Account and IAM User

1. Create an AWS account if you don't have one
2. Go to IAM console and create a new user for backups
3. Attach the following policy to the user:

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
                "s3:GetBucketEncryption",
                "s3:PutBucketEncryption",
                "s3:GetBucketLifecycleConfiguration",
                "s3:PutBucketLifecycleConfiguration"
            ],
            "Resource": "arn:aws:s3:::wavelength-lore-backups"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:ListMultipartUploadParts",
                "s3:AbortMultipartUpload"
            ],
            "Resource": "arn:aws:s3:::wavelength-lore-backups/*"
        }
    ]
}
```

### 2. Generate Access Keys

1. In IAM console, select your backup user
2. Go to "Security credentials" tab
3. Create access key for "Application running outside AWS"
4. Save the Access Key ID and Secret Access Key

### 3. Configure S3 Bucket

The backup system will automatically create and configure the S3 bucket with:
- Server-side encryption (AES-256)
- Versioning enabled
- Lifecycle policy for automatic cleanup
- Secure access policies

### 4. Test Configuration

```bash
# Test AWS credentials
node backup-cli.js status

# Initialize backup system
node backup-cli.js init

# Create test backup
node backup-cli.js backup test

# List backups
node backup-cli.js list
```

## Security Features

### Encryption
- **In-transit**: HTTPS/TLS encryption for all S3 operations
- **At-rest**: AES-256 server-side encryption on S3
- **Application**: Optional additional AES-256-GCM encryption layer

### Access Control
- IAM policies restrict S3 access to backup operations only
- Rate limiting on backup API endpoints
- Admin-level access required for backup operations

### Data Protection
- Automatic bucket versioning
- Lifecycle policies for retention management
- Secure deletion of local temporary files
- Backup integrity verification

## Backup Types

### Daily Backups
- Scheduled at 2 AM by default
- Standard S3 storage class
- 30-day retention (configurable)
- Compressed and encrypted

### Weekly Backups
- Scheduled at 3 AM on Sundays
- Standard-IA storage class (lower cost)
- Extended retention for compliance
- Full database snapshot

### Manual Backups
- On-demand via CLI or API
- Custom naming and metadata
- Immediate execution
- Full configuration control

## Monitoring and Alerts

### CloudWatch Integration
Set up CloudWatch monitoring for:
- S3 bucket size and object count
- Backup success/failure rates
- Cost monitoring and alerts

### Log Analysis
Monitor application logs for:
- Backup completion messages
- Error patterns and failures
- Performance metrics

## Cost Optimization

### Storage Classes
- **Daily backups**: Standard (frequent access)
- **Weekly backups**: Standard-IA (lower cost)
- **Archive backups**: Glacier (long-term storage)

### Lifecycle Policies
- Automatic transition to cheaper storage classes
- Automated deletion after retention period
- Version cleanup for cost control

## Disaster Recovery

### Recovery Procedures
1. **List available backups**: `node backup-cli.js list`
2. **Download backup**: `node backup-cli.js restore <backup-key>`
3. **Verify data integrity**: Check restored JSON structure
4. **Import to Firebase**: Use admin tools to restore data

### Testing Recovery
- Regular recovery tests (monthly recommended)
- Verify backup completeness and integrity
- Document recovery time objectives (RTO)
- Test cross-region recovery capabilities

## Troubleshooting

### Common Issues

1. **AWS credentials not found**
   - Verify AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
   - Check IAM user permissions

2. **S3 bucket access denied**
   - Verify bucket policy and IAM permissions
   - Check bucket region configuration

3. **Backup failures**
   - Check Firebase connectivity
   - Verify disk space for temp files
   - Monitor application logs

4. **Encryption errors**
   - Verify BACKUP_ENCRYPTION_KEY is set
   - Use 64-character hex string for key

### Support Commands

```bash
# Check system status
node backup-cli.js status

# Test backup system
node backup-cli.js test

# View help
node backup-cli.js --help
```