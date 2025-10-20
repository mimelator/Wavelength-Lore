# AWS App Runner Environment Sync Setup

## 🎯 Overview
This guide helps you sync your local `.env` file environment variables to your AWS App Runner production service.

## 📋 Prerequisites

You need the following AWS information:

### 1. **AWS Account ID** (12 digits)
- **Where to find it**: AWS Console → Click your name in top-right corner → "Account"
- **Example**: `123456789012`

### 2. **AWS Region**
- **Where your App Runner service is deployed**
- **Most common**: `us-east-1`

### 3. **App Runner Service ARN**
- **Where to find it**: AWS Console → App Runner → Your Service → "Configuration" tab
- **Format**: `arn:aws:apprunner:REGION:ACCOUNT_ID:service/SERVICE_NAME/SERVICE_ID`
- **Example**: `arn:aws:apprunner:us-east-1:123456789012:service/wavelength-lore/abc123def456`

## 🚀 Step-by-Step Setup

### Step 1: Add AWS Configuration to .env

Add these lines to your `.env` file (replace with your actual values):

```bash
# AWS Configuration
AWS_ACCOUNT_ID=123456789012
AWS_REGION=us-east-1
APPRUNNER_SERVICE_ARN=arn:aws:apprunner:us-east-1:123456789012:service/wavelength-lore/abc123def456
```

### Step 2: Generate AWS Resources Config

Run the helper script to create the `config/aws-resources.js` file:

```bash
node scripts/generate-aws-config.js
```

This will:
- ✅ Read your `.env` file
- ✅ Validate required variables are present
- ✅ Generate `config/aws-resources.js`

### Step 3: Preview Changes

See what environment variables would be synced:

```bash
node scripts/apprunner-env-updater.js
```

This will show you:
- ✅ Which variables will be added
- ✅ Which variables will be modified
- ✅ Which variables will be removed
- ✅ Total number of changes

### Step 4: Sync Environment Variables

Apply the changes to App Runner:

```bash
node scripts/apprunner-env-updater.js --force
```

This will:
- ✅ Update your App Runner service with new environment variables
- ✅ Trigger a new deployment
- ✅ Show you the operation ID for tracking

### Step 5: Monitor Deployment

Check the AWS App Runner console to monitor the deployment:
- Go to: AWS Console → App Runner → Your Service
- Watch the "Activity" tab for deployment progress
- Typically takes 3-5 minutes

## 📊 What Gets Synced?

The script automatically syncs these categories of environment variables:

### Firebase Configuration
- `API_KEY`, `AUTH_DOMAIN`, `DATABASE_URL`, `PROJECT_ID`
- `STORAGE_BUCKET`, `MESSAGING_SENDER_ID`, `APP_ID`, `MEASUREMENT_ID`
- `FIREBASE_SERVICE_ACCOUNT`

### AWS Configuration
- `ACCESS_KEY_ID`, `SECRET_ACCESS_KEY`

### Application Settings
- `YOUTUBE_API_KEY`, `CDN_URL`
- `ADMIN_SECRET_KEY`, `ADMIN_ALLOWED_IPS`
- `RATE_LIMIT_WINDOW`, `RATE_LIMIT_MAX_REQUESTS`

### Forum & File Upload
- `FORUM_ATTACHMENTS_BUCKET`
- `MAX_FILE_SIZE`, `MAX_FILES_PER_POST`, `ALLOWED_FILE_TYPES`

### Backup Configuration (Optional)
- `ENABLE_BACKUPS`, `BACKUP_S3_BUCKET`, `BACKUP_S3_REGION`
- And other backup-related variables

## 🔧 Troubleshooting

### Error: "Cannot find module '../config/aws-resources'"
**Solution**: Run `node scripts/generate-aws-config.js` first

### Error: "Missing required environment variables"
**Solution**: Add `AWS_ACCOUNT_ID`, `AWS_REGION`, and `APPRUNNER_SERVICE_ARN` to your `.env` file

### Error: "Access Denied" or "Unauthorized"
**Solution**: Your AWS credentials may not have App Runner permissions. Check that:
1. Your `ACCESS_KEY_ID` and `SECRET_ACCESS_KEY` are correct
2. Your IAM user has the App Runner permissions (see IAM setup below)

## 🔐 IAM Permissions Setup

Your AWS IAM user needs these permissions to update App Runner:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "apprunner:DescribeService",
        "apprunner:UpdateService"
      ],
      "Resource": "arn:aws:apprunner:*:*:service/*/*"
    }
  ]
}
```

To add these permissions:
1. Go to AWS Console → IAM → Users → Your User
2. Click "Add permissions" → "Create inline policy"
3. Choose "JSON" tab
4. Paste the policy above
5. Name it "AppRunnerEnvironmentUpdate"
6. Click "Create policy"

## 📝 Quick Reference

| Command | Purpose |
|---------|---------|
| `node scripts/generate-aws-config.js` | Generate AWS config file from .env |
| `node scripts/apprunner-env-updater.js` | Preview changes |
| `node scripts/apprunner-env-updater.js --force` | Apply changes |
| `node scripts/apprunner-env-updater.js --dry-run` | Show changes only |
| `node scripts/apprunner-env-updater.js --help` | Show help |

## ✅ Next Steps After Syncing

1. **Monitor Deployment**: Check AWS Console → App Runner → Activity
2. **Verify Application**: Visit your production URL to ensure it's working
3. **Check Logs**: AWS Console → App Runner → Logs if there are issues
4. **Test Critical Features**: Verify Firebase, authentication, etc.

---

**Note**: The `config/aws-resources.js` file is git-ignored for security. You'll need to regenerate it on new machines or if you update AWS configuration.
