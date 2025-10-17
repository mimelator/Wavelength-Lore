# 🚨 Quick Recovery Checklist

**Emergency reference for immediate disaster recovery**

## 🔥 **Immediate Actions (First 30 minutes)**

- [ ] **Clone Repository**: `git clone https://github.com/mimelator/Wavelength-Lore.git`
- [ ] **Install Dependencies**: `npm install`
- [ ] **Get Service Account Key**: Download `firebaseServiceAccountKey.json`
- [ ] **Create `.env`**: Copy from `.env.example` and fill critical values
- [ ] **Test Environment**: `node scripts/backup-cli.js env`

## 🔐 **Critical Credentials to Recover**

- [ ] **AWS Main User**: `wavelength-lore-app-user` access keys
- [ ] **AWS Backup User**: `wavelength-backup-user` access keys  
- [ ] **Firebase Service Account**: `firebaseServiceAccountKey.json`
- [ ] **YouTube API Key**: From Google Cloud Console
- [ ] **Backup Encryption Key**: 64-character hex string

## 🗄️ **Database Recovery (Next 30 minutes)**

- [ ] **List Backups**: `node scripts/backup-cli.js list`
- [ ] **Restore Latest**: `node scripts/backup-cli.js restore "backup-key"`
- [ ] **Verify Data**: Test character/lore loading
- [ ] **Create New Backup**: `node scripts/backup-cli.js backup manual`

## 🚀 **Production Recovery (Next 60 minutes)**

- [ ] **Update Environment**: `node scripts/apprunner-env-updater.js --force`
- [ ] **Test Authentication**: Add `wavelengthlore.com` to Firebase authorized domains
- [ ] **Clear Caches**: `./scripts/bust-cache.sh`
- [ ] **Verify Site**: Check https://wavelengthlore.com functionality

## 📞 **Emergency Commands**

```bash
# Quick environment test
node scripts/backup-cli.js env

# Fast database restore (replace backup-key)
node scripts/backup-cli.js restore "backups/daily/YYYYMMDD/backup_daily_YYYYMMDD_HHMMSS.json"

# Production environment sync
node scripts/apprunner-env-updater.js --force

# Full cache clear
./scripts/bust-cache.sh
```

## 🆘 **Critical Service Info**

- **AWS Account**: `170023515523`
- **Firebase Project**: `wavelength-lore`
- **S3 Backup Bucket**: `wavelength-lore-backups`
- **CloudFront Distribution**: `E2QFR8E7I4A6ZT`
- **App Runner Service**: `wavelength-lore-service`
- **Production Domain**: `wavelengthlore.com`

---

**📖 Full Guide**: See `docs/DISASTER_RECOVERY.md` for complete step-by-step recovery procedures.