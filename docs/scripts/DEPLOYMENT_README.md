# Deployment Pipeline Documentation

## 🚀 Current Deployment Workflow

### Automatic Deployments (Primary Method)
**App Runner now has auto-deployment enabled!** Normal deployments happen automatically:

1. **Commit & Push** to `main` branch
2. **GitHub Actions** automatically:
   - Increments version number
   - Builds Docker image  
   - Pushes to ECR with `latest` tag
3. **App Runner** automatically:
   - Detects new `latest` image
   - Deploys to production
   - Updates wavelengthlore.com

### Manual Deployments (Emergency Only)
Use these scripts only for monitoring or emergency manual deployments:

```bash
# Monitor current deployment status (default behavior)
./deploy.sh

# Force manual emergency deployment
./deploy.sh --force --reason "Emergency bug fix"
./deploy.sh --manual --reason "Critical security patch"
```

## 📋 Script Reference

### `./deploy.sh`
- **Default**: Monitor-only mode
- **`--force`**: Emergency manual deployment
- **`--manual`**: Same as --force
- **`--reason "text"`**: Custom deployment reason

### GitHub Actions Workflows
- **`increment-version.yml`**: Auto-increments version on every push
- **`docker-ecr-deploy.yml`**: Builds and pushes Docker images to ECR

## 🔧 Configuration Changes Made

1. **App Runner Configuration**:
   - ✅ Uses `latest` tag instead of commit-specific tags
   - ✅ Auto-deployment enabled
   - ✅ Monitors ECR for new images

2. **Local Scripts**:
   - ✅ Updated for monitoring-first approach
   - ✅ Manual deployment requires explicit `--force` flag
   - ✅ Clear warnings about auto-deployment being primary method

## 🎯 Best Practices

### Normal Development:
1. Make changes locally
2. Test with `./start-dev.sh`
3. Commit and push to `main`
4. GitHub Actions handles the rest automatically

### Emergency Situations:
1. Use `./deploy.sh --force` for immediate manual deployment
2. Monitor progress with `./deploy.sh` (no flags)
3. Check production with version system in footer

### Monitoring:
- **Production URL**: https://wavelengthlore.com
- **Version Info**: Check footer for version badge
- **GitHub Actions**: Monitor workflows in GitHub
- **AWS Console**: App Runner service status