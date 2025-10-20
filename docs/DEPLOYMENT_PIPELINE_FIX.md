# Deployment Pipeline Fix - Summary

## Problem Identified

The deployment pipeline had a critical flaw where **rollbacks could occur but version numbers would still increment**, causing confusion about what was actually running in production.

### Root Cause
1. **Two independent workflows** that didn't coordinate:
   - Build/Deploy workflow pushed to ECR but didn't update App Runner
   - Version increment workflow ran regardless of deployment success
2. **Manual deployment step** using scripts that deployed by image digest
3. **No health check validation** - builds succeeded even if app failed to start
4. **No deployment verification** - couldn't confirm production was running correct code

## Fixes Implemented

### 1. ✅ Added Health Check to Deployment Workflow

**File**: [.github/workflows/docker-ecr-deploy.yml](.github/workflows/docker-ecr-deploy.yml)

Added comprehensive health checking after App Runner deployment:

```yaml
- name: Health Check
  env:
    APPRUNNER_SERVICE_ARN: ${{ secrets.APPRUNNER_SERVICE_ARN }}
  run: |
    # Get service URL and test with retries
    # Validates HTTP 200 or 302 response
    # Retries up to 5 times with 15s intervals
    # Fails the workflow if health checks fail
```

**Benefits**:
- Detects if deployed app fails to start
- Catches port binding issues
- Validates app is responding to HTTP requests
- Prevents bad deployments from completing

### 2. ✅ Automated App Runner Deployment

**File**: [.github/workflows/docker-ecr-deploy.yml](.github/workflows/docker-ecr-deploy.yml)

Added four new deployment steps:

#### Step 1: Deploy to App Runner
```yaml
- name: Deploy to App Runner
  id: deploy-apprunner
  # Gets image digest from ECR
  # Updates App Runner service with new image
  # Uses digest (@sha256:...) for immutability
  # Preserves existing environment variables
```

#### Step 2: Wait for Deployment
```yaml
- name: Wait for App Runner Deployment
  # Polls App Runner status every 15s
  # Maximum wait time: 10 minutes
  # Fails if deployment times out or errors
```

#### Step 3: Health Check
```yaml
- name: Health Check
  # Tests production URL
  # Up to 5 attempts with retries
  # Validates HTTP 200/302 response
```

#### Step 4: Verify Deployment
```yaml
- name: Verify Deployment
  # Confirms running image matches expected digest
  # Detects if rollback occurred
  # Fails workflow if image mismatch detected
```

**Benefits**:
- No more manual deployment scripts needed
- Automatic deployment on every push to main
- End-to-end automation from commit to production
- Detects rollbacks immediately

### 3. ✅ Made Version Increment Conditional on Deployment Success

**File**: [.github/workflows/increment-version.yml](.github/workflows/increment-version.yml)

Changed from push trigger to workflow_run trigger:

**Before**:
```yaml
on:
  push:
    branches: [ main ]
```

**After**:
```yaml
on:
  workflow_run:
    workflows: ["Build and Deploy to ECR"]
    types:
      - completed
    branches: [ main ]
```

Added conditional execution:
```yaml
if: |
  ${{
    github.event.workflow_run.conclusion == 'success' &&
    !contains(github.event.workflow_run.head_commit.message, '[skip version]')
  }}
```

**Benefits**:
- Version only increments if deployment succeeds
- If health checks fail, version stays the same
- If App Runner rolls back, version increment doesn't happen
- Version numbers now accurately reflect production state

### 4. ✅ Added Deployment Verification

**File**: [.github/workflows/docker-ecr-deploy.yml](.github/workflows/docker-ecr-deploy.yml)

Added verification step that confirms production is running the correct image:

```yaml
- name: Verify Deployment
  # Queries App Runner for current image
  # Compares against expected digest
  # Fails if mismatch detected (indicates rollback)
```

Enhanced version.json with deployment metadata:
```json
{
  "version": "1.0.37",
  "buildDate": "2025-10-20T19:55:18Z",
  "commitHash": "abc123...",
  "commitShort": "abc123",
  "buildNumber": "42",
  "environment": "production",
  "deploymentWorkflowId": "12345",
  "deploymentStatus": "verified"
}
```

**Benefits**:
- Detects silent rollbacks
- Provides audit trail of deployments
- Links version to specific deployment workflow
- Confirms production state matches expectations

## New Deployment Flow

### Previous Flow (Broken)
```
1. Push to main
2. ✅ Build workflow: Build image → Push to ECR
3. ✅ Version workflow: Increment version (runs in parallel!)
4. 🔧 Manual: Run deployment script
5. ❌ App Runner: Rollback due to error
6. 😕 Result: Version 1.0.36, but running 1.0.33 code
```

### New Flow (Fixed)
```
1. Push to main
2. ✅ Build workflow starts:
   a. Build Docker image
   b. Push to ECR with commit tag
   c. Deploy to App Runner with digest
   d. Wait for deployment (max 10min)
   e. Run health checks (5 retries)
   f. Verify correct image is running
3. IF workflow succeeds:
   ✅ Version workflow:
      - Increment version
      - Update version.json with deployment metadata
      - Create git tag
   😊 Result: Version matches production!
4. IF workflow fails:
   ❌ Version workflow: DOES NOT RUN
   ⚠️ Production: Still running last known good version
   😊 Result: Version still matches production!
```

## Required GitHub Secrets

You'll need to add this secret to your GitHub repository:

```
APPRUNNER_SERVICE_ARN=arn:aws:apprunner:us-east-1:170023515523:service/wavelength-lore-service/829c542fc95c419090494817f7046eaa
```

### How to Add Secret

1. Go to GitHub repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `APPRUNNER_SERVICE_ARN`
4. Value: (the ARN above)
5. Click "Add secret"

**Note**: The existing `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` secrets need to have these IAM permissions:
- `apprunner:DescribeService`
- `apprunner:UpdateService`
- `ecr:DescribeImages`

## Testing the Fix

### First Deployment
```bash
# Make a small change and push
git add .
git commit -m "test: Verify new deployment pipeline"
git push origin main
```

### Monitor in GitHub Actions
1. Go to repository → Actions tab
2. Watch "Build and Deploy to ECR" workflow
3. You should see these new steps:
   - Deploy to App Runner
   - Wait for App Runner Deployment
   - Health Check
   - Verify Deployment
   - Deployment Summary
4. After it succeeds, "Auto-increment Version" workflow will run
5. Check that version.json has `deploymentStatus: "verified"`

### Verify Production
```bash
# Check what's actually running in production
aws apprunner describe-service \
  --service-arn arn:aws:apprunner:us-east-1:170023515523:service/wavelength-lore-service/829c542fc95c419090494817f7046eaa \
  --query 'Service.{Status:Status,ImageIdentifier:SourceConfiguration.ImageRepository.ImageIdentifier}' \
  --output json
```

## What Happens on Failure

### If Health Checks Fail
```
1. Build succeeds
2. App Runner deployment starts
3. Health checks fail (app not responding)
4. ❌ Workflow FAILS at health check step
5. ⚠️ App Runner may rollback automatically
6. ✅ Version increment workflow DOES NOT RUN
7. Result: Production stays at last known good version
```

### If App Runner Rolls Back
```
1. Build succeeds
2. App Runner deploys new image
3. Health checks pass initially
4. App Runner detects failures, rolls back
5. ❌ Verify Deployment step FAILS (digest mismatch)
6. ✅ Version increment workflow DOES NOT RUN
7. Result: Production at last known good version
```

## Rollback Procedure

If you need to manually rollback:

```bash
# Find the last good commit
git log --oneline

# Use the force update script with specific commit
node scripts/force-apprunner-image-update.js --force --commit=33bcc45e

# This bypasses GitHub Actions and deploys directly
```

## Migration Notes

### Deprecations
- ❌ `scripts/update-apprunner-image.js` - No longer needed
- ❌ `scripts/force-apprunner-image-update.js` - Only for emergency rollbacks
- ❌ `scripts/deployment-pipeline-monitor.js` - GitHub Actions now shows all info

### Still Useful
- ✅ `scripts/verify-deployment-image.js` - Good for debugging
- ✅ `scripts/watch-apprunner-deployment.js` - Good for monitoring
- ✅ `scripts/tail-apprunner-logs.js` - Good for troubleshooting

## Success Metrics

You'll know the fix is working when:

1. ✅ Version numbers only increment when deployments succeed
2. ✅ Failed deployments don't create new version numbers
3. ✅ GitHub Actions shows clear success/failure for entire pipeline
4. ✅ Production URL matches the version in package.json
5. ✅ version.json has `deploymentStatus: "verified"`

## Troubleshooting

### "APPRUNNER_SERVICE_ARN not set"
- Add the secret to GitHub repository settings

### "AccessDenied" errors
- Update IAM user permissions to include App Runner actions

### Health checks failing
- Check App Runner logs for startup errors
- Verify port 8080 is configured correctly
- Check environment variables are set

### Version still incrementing on failures
- Verify workflow_run trigger is configured correctly
- Check that workflow names match exactly

---

**Date**: October 20, 2025
**Fixed By**: Deployment Pipeline Automation
**Status**: ✅ Ready for Testing
