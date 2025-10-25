# DevOps Quick Reference: Monitoring & Deployment Commands

## 🚀 GitHub Actions Monitoring
```bash
npm run gh:status          # Quick deployment status
npm run gh:dashboard       # Full deployment overview  
npm run gh:watch          # Live deployment monitoring
npm run gh:logs           # View workflow logs
npm run gh:jobs           # Check job details
npm run gh:compare        # Compare deployments
npm run gh:list           # List recent workflows
npm run gh:monitor        # Interactive monitoring
```

## ☁️ CloudWatch App Runner Monitoring
```bash
npm run logs:app          # Application logs (stdout/stderr)
npm run logs:service      # Deployment events & health checks
npm run logs:errors       # Automated error pattern search
npm run logs:tail         # Real-time log streaming
npm run logs:watch        # Continuous monitoring dashboard
```

## 🔄 Deployment Management
```bash
npm run deploy:status     # Current production version info
npm run deploy:compare    # Compare local vs production build
npm run deploy:history    # View deployment history
npm run deploy:record     # Record deployment manually
npm run deploy:auto-record # Auto-record deployment info
```

## 🌍 Environment Management
```bash
npm run env:dev           # Show current environment setup
npm run env:prod-preview  # Preview production environment (DRY RUN)
npm run env:prod-deploy   # Deploy environment to App Runner

# Legacy App Runner commands (still work)
npm run apprunner:env        # Interactive environment update
npm run apprunner:env:force  # Force environment update
npm run apprunner:env:dry    # Dry run environment update
```

## 🏥 Production Health Check Suite
```bash
# Automated Health Checks (NEW)
npm run health:quick         # Fast HTTP-based validation (7 tests, ~1-2s)
npm run health:check         # Comprehensive browser-based testing (~30s)

# Health Check Features:
# ✓ Home page load and rendering
# ✓ Radio player functionality  
# ✓ Hero gallery navigation
# ✓ Content page accessibility
# ✓ Cross-site navigation
# ✓ API endpoint health
# ✓ Static asset loading
```

## 📊 Manual Production Checks
```bash
# Quick status checks
aws apprunner describe-service --service-arn [ARN] --region us-east-1 --query 'Service.Status'
curl -I https://vh9x3gevev.us-east-1.awsapprunner.com/
curl -s https://vh9x3gevev.us-east-1.awsapprunner.com/api/version

# Version alignment check
npm run deploy:compare && echo "✅ Versions synchronized" || echo "❌ Version mismatch detected"
```

## 🚨 Common Troubleshooting Workflows

### Deployment Failed
```bash
1. npm run gh:status              # Check workflow status
2. npm run gh:logs               # View detailed error logs  
3. npm run logs:service          # Check App Runner events
4. npm run logs:errors           # Search for error patterns
5. Fix issue & push again        # Auto-retry same version
```

### Health Check Issues
```bash
1. npm run health:quick                              # Run fast health validation
2. npm run logs:service | grep -i "health check"    # Check health check logs
3. npm run env:prod-preview | grep PORT             # Verify port config
4. npm run logs:app                                 # Check application startup
5. npm run health:check                             # Full browser-based testing
```

### Version Mismatch
```bash
1. npm run deploy:compare                            # Compare versions
2. git commit --allow-empty -m "Sync versions"      # Trigger fresh deployment  
3. git push origin main                              # Deploy
4. npm run gh:watch                                  # Monitor deployment
```

### Environment Variable Issues
```bash
1. npm run env:prod-preview                          # Preview what gets deployed
2. # Edit .env.production for production overrides
3. npm run env:prod-deploy                           # Update App Runner
4. git commit --allow-empty -m "Redeploy with env"  # Trigger fresh deployment
```

## 📈 Monitoring Best Practices

### During Active Development
- Use `npm run gh:watch` for real-time deployment monitoring
- Use `npm run logs:tail` to watch application logs live  
- Check `npm run deploy:compare` before major changes

### Production Health Monitoring
- Run `npm run health:quick` for daily production validation
- Run `npm run gh:dashboard` for weekly deployment overview
- Use `npm run logs:errors` to proactively find issues
- Monitor `npm run deploy:status` for version drift
- Use `npm run health:check` for comprehensive monthly testing

### Before Major Releases
- Run `npm run env:prod-preview` to verify environment changes
- Use `npm run deploy:history` to review recent deployments
- Check `npm run logs:service` for any deployment warnings

## 🎯 File Structure Reference

```
.env                          # Base configuration (committed)
.env.production              # Production overrides (committed)  
.env.local                   # Development overrides (git-ignored)

scripts/
├── gh-monitor.js            # GitHub Actions monitoring
├── cloudwatch-monitor.js    # App Runner CloudWatch logs
├── production-health-check.js # Comprehensive browser-based health tests
├── quick-health-check.js    # Fast HTTP-based health validation
├── deployment-tracker.js    # Version & deployment tracking
├── apprunner-env-updater.js # Environment management
└── env-helper.js           # Environment utilities

docs/
├── deployment-guide.md               # Complete deployment system guide
├── ENVIRONMENT_CONFIGURATION.md      # Environment setup guide  
└── devops-quick-reference.md         # This reference card
```

## ⚡ Emergency Commands

```bash
# Quick production health check (FIRST STEP)
npm run health:quick

# Force immediate deployment (skip checks)
npm run deploy:force

# Emergency environment update
npm run apprunner:env:force

# Quick production status check  
npm run gh:status && npm run deploy:status

# Full emergency dashboard
npm run gh:dashboard && npm run logs:errors

# Comprehensive health validation
npm run health:check
```

---
💡 **Daily Workflow**: Start with `npm run health:quick` for production validation, then `npm run gh:dashboard` for deployment monitoring!