# 🚨 Wavelength Lore - Disaster Recovery Guide

**Complete step-by-step guide to rebuild development environment and restore production from scratch**

---

## 📋 **Prerequisites & Recovery Assets**

### **What You Need:**
- [ ] GitHub repository access (`mimelator/Wavelength-Lore`)
- [ ] AWS account access (Account ID: `170023515523`)
- [ ] Firebase project access (`wavelength-lore`)
- [ ] Domain control (`wavelengthlore.com`)
- [ ] Latest database backup (from S3 bucket: `wavelength-lore-backups`)
- [ ] Service account key backup (`firebaseServiceAccountKey.json`)

### **Critical Information to Gather:**
- [ ] AWS Access Keys (if not backed up)
- [ ] Firebase configuration values
- [ ] YouTube API key
- [ ] CloudFront distribution ID: `E2QFR8E7I4A6ZT`
- [ ] App Runner service ARN: `arn:aws:apprunner:us-east-1:170023515523:service/wavelength-lore-service/829c542fc95c419090494817f7046eaa`

---

## 🏗️ **Phase 1: Environment Setup**

### **Step 1.1: System Prerequisites**
```bash
# Install Node.js (v24.10.0 or compatible)
# macOS with Homebrew:
brew install node@24

# Verify installation
node --version  # Should be v24.x.x
npm --version

# Install Git if not present
brew install git

# Install AWS CLI
brew install awscli
```

### **Step 1.2: Clone Repository**
```bash
# Clone the repository
git clone https://github.com/mimelator/Wavelength-Lore.git
cd Wavelength-Lore

# Verify branch and latest commit
git branch -a
git log --oneline -5
```

### **Step 1.3: Install Dependencies**
```bash
# Install all Node.js dependencies
npm install

# Verify critical packages
npm list @aws-sdk/client-s3
npm list @aws-sdk/client-apprunner
npm list @aws-sdk/client-cloudfront
npm list firebase-admin
```

---

## 🔐 **Phase 2: Credentials & Configuration Recovery**

### **Step 2.1: Firebase Service Account Recovery**

#### **Option A: From Backup**
```bash
# If you have firebaseServiceAccountKey.json backed up
cp /path/to/backup/firebaseServiceAccountKey.json ./
```

#### **Option B: Generate New Service Account**
1. **Go to**: https://console.firebase.google.com/
2. **Select**: `wavelength-lore` project
3. **Navigate**: Project Settings → Service accounts
4. **Click**: "Generate new private key"
5. **Download**: Save as `firebaseServiceAccountKey.json` in project root

### **Step 2.2: AWS Credentials Recovery**

#### **Retrieve/Create AWS Access Keys**
1. **Go to**: https://console.aws.amazon.com/iam/
2. **Navigate**: IAM → Users → `wavelength-lore-app-user`
3. **Security credentials** tab
4. **Access keys**: Create new access key if needed
5. **Note down**: Access Key ID and Secret Access Key

#### **AWS Backup User (for database backups)**
1. **Navigate**: IAM → Users → `wavelength-backup-user`
2. **Create new access key** if needed
3. **Note down**: Backup Access Key ID and Secret Access Key

### **Step 2.3: Create Environment Configuration**
```bash
# Create .env file from template
cp .env.example .env

# Edit .env with your actual values
nano .env
```

**Critical `.env` values to set:**
```bash
# Firebase Configuration
API_KEY="YOUR_FIREBASE_API_KEY"
AUTH_DOMAIN="wavelength-lore.firebaseapp.com"
DATABASE_URL="https://wavelength-lore-default-rtdb.firebaseio.com"
PROJECT_ID="wavelength-lore"
STORAGE_BUCKET="wavelength-lore.firebasestorage.app"
MESSAGING_SENDER_ID="YOUR_MESSAGING_SENDER_ID"
APP_ID="YOUR_FIREBASE_APP_ID"
MEASUREMENT_ID="YOUR_GA_MEASUREMENT_ID"

# AWS Configuration (Main Account)
ACCESS_KEY_ID="YOUR_MAIN_AWS_ACCESS_KEY"
SECRET_ACCESS_KEY="YOUR_MAIN_AWS_SECRET_KEY"

# AWS Configuration (Backup Account)
AWS_ACCESS_KEY_ID="YOUR_BACKUP_AWS_ACCESS_KEY"
AWS_SECRET_ACCESS_KEY="YOUR_BACKUP_AWS_SECRET_KEY"

# YouTube API Key
YOUTUBE_API_KEY="YOUR_YOUTUBE_API_KEY"

# Production CDN
CDN_URL="https://df5sj8f594cdx.cloudfront.net"

# Backup System
BACKUP_S3_BUCKET="wavelength-lore-backups"
BACKUP_S3_REGION="us-east-1"
BACKUP_ENCRYPTION_KEY="YOUR_64_CHAR_ENCRYPTION_KEY"
```

---

## 🗄️ **Phase 3: Database Recovery**

### **Step 3.1: Initialize Backup System**
```bash
# Test environment configuration
node scripts/backup-cli.js env

# Initialize backup system
node scripts/backup-cli.js init
```

### **Step 3.2: List Available Backups**
```bash
# List all available backups
node scripts/backup-cli.js list

# List recent backups only
node scripts/backup-cli.js list daily
```

### **Step 3.3: Restore Database**
```bash
# Restore from latest backup (replace with actual backup key)
node scripts/backup-cli.js restore "backups/daily/YYYYMMDD/backup_daily_YYYYMMDD_HHMMSS.json"

# Example:
# node scripts/backup-cli.js restore "backups/daily/20251017/backup_daily_20251017_020000.json"
```

### **Step 3.4: Verify Database Restoration**
```bash
# Test database connection
node -e "
const admin = require('firebase-admin');
const serviceAccount = require('./firebaseServiceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.DATABASE_URL || 'https://wavelength-lore-default-rtdb.firebaseio.com'
});
admin.database().ref('/characters').once('value').then(snapshot => {
  console.log('Characters count:', Object.keys(snapshot.val() || {}).length);
  process.exit(0);
}).catch(console.error);
"
```

---

## 🌐 **Phase 4: Production Infrastructure Recovery**

### **Step 4.1: AWS App Runner Service**

#### **Check Service Status**
```bash
# Verify App Runner service exists
aws apprunner describe-service \
  --service-arn "arn:aws:apprunner:us-east-1:170023515523:service/wavelength-lore-service/829c542fc95c419090494817f7046eaa"
```

#### **Update Environment Variables**
```bash
# Preview environment changes
node scripts/apprunner-env-updater.js

# Apply environment variables to production
node scripts/apprunner-env-updater.js --force
```

### **Step 4.2: CloudFront Distribution**
```bash
# Test CloudFront cache invalidation
node scripts/cloudfront-cache-bust.js

# If permissions error, check distribution exists:
aws cloudfront get-distribution --id E2QFR8E7I4A6ZT
```

### **Step 4.3: S3 Backup Bucket**
```bash
# Verify backup bucket exists and is accessible
aws s3 ls s3://wavelength-lore-backups/

# Test backup functionality
node scripts/backup-cli.js test
```

---

## 🔧 **Phase 5: Development Environment Setup**

### **Step 5.1: Local Development**
```bash
# Start development server
./scripts/start-dev.sh

# Test in another terminal:
curl http://localhost:3001

# Stop development server
./scripts/stop-dev.sh
```

### **Step 5.2: Cache System**
```bash
# Test local cache busting
./scripts/bust-cache.sh --local

# Test CloudFront cache busting (if permissions set up)
./scripts/bust-cache.sh --cdn

# Test full cache busting
./scripts/bust-cache.sh
```

### **Step 5.3: Content Verification**
```bash
# Check for broken images
node scripts/check_broken_images.js

# Verify YouTube links
node scripts/check_youtube_links.js

# Test character loading
node scripts/debug/debug-character-linking.js
```

---

## 🚀 **Phase 6: Production Deployment Verification**

### **Step 6.1: Firebase Authentication**
1. **Go to**: https://console.firebase.google.com/
2. **Project**: `wavelength-lore`
3. **Authentication** → **Settings** → **Authorized domains**
4. **Verify domains**:
   - ✅ `localhost`
   - ✅ `wavelengthlore.com`
   - ✅ `www.wavelengthlore.com` (if used)

### **Step 6.2: DNS & Domain**
```bash
# Verify domain points to App Runner
nslookup wavelengthlore.com

# Test production site
curl -I https://wavelengthlore.com
```

### **Step 6.3: Production Functionality Test**
1. **Visit**: https://wavelengthlore.com
2. **Test**:
   - [ ] Site loads correctly
   - [ ] Google authentication works
   - [ ] Character data displays
   - [ ] Forum functionality
   - [ ] Image carousel works
   - [ ] CDN assets load

---

## 🔐 **Phase 7: Security & Permissions**

### **Step 7.1: AWS IAM Policies**

#### **App Runner Permissions**
```bash
# Generate App Runner policy
node scripts/setup-apprunner-permissions.js

# Apply via AWS Console or CLI if you have admin access
```

#### **CloudFront Permissions**
```bash
# Generate CloudFront policy
node scripts/setup-cloudfront-permissions.js

# Apply via AWS Console or CLI if you have admin access
```

#### **S3 Backup Permissions**
- Verify backup user has S3 access to `wavelength-lore-backups`
- Test with: `node scripts/backup-cli.js test`

### **Step 7.2: Firebase Security Rules**
```bash
# Update Firebase security rules if needed
node scripts/update_firebase_rules.js
```

### **Step 7.3: Credential Rotation**
If this is a security incident recovery:
1. **Rotate all AWS access keys**
2. **Generate new Firebase service account key**
3. **Regenerate YouTube API key**
4. **Update production environment**: `node scripts/apprunner-env-updater.js --force`

---

## 📊 **Phase 8: Monitoring & Validation**

### **Step 8.1: Backup System Health**
```bash
# Run comprehensive backup test
node scripts/backup-cli.js test

# Check backup schedule is working
node scripts/backup-cli.js status

# Create manual backup to verify
node scripts/backup-cli.js backup manual
```

### **Step 8.2: Performance Validation**
```bash
# Clear all caches for fresh start
./scripts/bust-cache.sh

# Monitor App Runner logs in AWS Console
# Monitor CloudFront metrics in AWS Console
```

### **Step 8.3: Content Integrity**
```bash
# Verify all critical scripts work
cd scripts
for script in *.js; do
  echo "Testing $script..."
  node "$script" --help 2>/dev/null || echo "  No help available"
done
```

---

## 📚 **Phase 9: Documentation & Team Setup**

### **Step 9.1: Team Environment Setup**
Each team member should:
1. **Clone repository**: `git clone https://github.com/mimelator/Wavelength-Lore.git`
2. **Copy `.env.example` to `.env`** and configure
3. **Get service account key** from secure storage
4. **Run**: `npm install`
5. **Test**: `./scripts/start-dev.sh`

### **Step 9.2: Deployment Documentation**
All deployment procedures are documented in:
- `deployment/README.md` - Production deployment
- `scripts/README.md` - Script usage
- This disaster recovery guide

### **Step 9.3: Backup Strategy**
- **Automated**: Daily backups at 2 AM, weekly at 3 AM Sunday
- **Manual**: `node scripts/backup-cli.js backup manual`
- **Retention**: 30 days in S3 with lifecycle policies
- **Encryption**: AES-256-GCM with environment key

---

## ⚠️ **Critical Recovery Notes**

### **If AWS Account is Compromised:**
1. **Immediately rotate all AWS credentials**
2. **Check S3 bucket `wavelength-lore-backups` integrity**
3. **Verify App Runner service configuration**
4. **Monitor CloudFront distribution for unauthorized changes**

### **If Firebase Project is Compromised:**
1. **Generate new service account key**
2. **Check Firebase security rules**
3. **Verify authorized domains list**
4. **Review authentication provider settings**

### **If GitHub Repository is Compromised:**
1. **Scan all commits for injected malicious code**
2. **Verify `.env.example` hasn't been modified maliciously**
3. **Check all script files for unauthorized changes**
4. **Review recent merge requests and collaborators**

### **If Domain is Compromised:**
1. **Verify DNS settings point to correct App Runner service**
2. **Check SSL certificate validity**
3. **Update Firebase authorized domains if domain changes**

---

## 📞 **Emergency Contacts & Resources**

### **Key Services:**
- **AWS Console**: https://console.aws.amazon.com/
- **Firebase Console**: https://console.firebase.google.com/
- **GitHub Repository**: https://github.com/mimelator/Wavelength-Lore
- **Domain Management**: [Your domain registrar]

### **Critical Commands for Quick Reference:**
```bash
# Environment check
node scripts/backup-cli.js env

# Database restore
node scripts/backup-cli.js restore "backup-key"

# Production environment update
node scripts/apprunner-env-updater.js --force

# Cache clearing
./scripts/bust-cache.sh

# Development server
./scripts/start-dev.sh
```

---

**📅 Last Updated**: October 17, 2025  
**🔄 Review Schedule**: Update this guide after any major infrastructure changes