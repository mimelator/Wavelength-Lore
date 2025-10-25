#!/bin/bash

# Enhanced Deployment Diagnostics Script
# Comprehensive analysis of deployment pipeline and App Runner state

echo "🔍 DEPLOYMENT PIPELINE DIAGNOSTICS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🕒 Timestamp: $(date)"
echo ""

# 1. Local Git State
echo "📋 1. LOCAL GIT STATE"
echo "Current branch: $(git branch --show-current)"
echo "Local HEAD: $(git log --oneline -1)"
echo "Remote HEAD: $(git log --oneline -1 origin/main)"
echo "Working directory status:"
git status --porcelain | head -10
echo ""

# 2. GitHub Repository State  
echo "📋 2. GITHUB REPOSITORY STATE"
echo "Fetching latest from GitHub..."
git fetch origin --quiet
echo "Latest commits on origin/main:"
git log --oneline origin/main -5
echo "Local vs Remote comparison:"
if git diff --quiet HEAD origin/main; then
    echo "✅ Local and remote are in sync"
else
    echo "⚠️  Local differs from remote:"
    git log --oneline HEAD..origin/main --reverse | head -3
    git log --oneline origin/main..HEAD --reverse | head -3
fi
echo ""

# 3. Version Information Analysis
echo "📋 3. VERSION ANALYSIS"
echo "Local version.json:"
if [ -f "version.json" ]; then
    cat version.json | jq '.' 2>/dev/null || cat version.json
else
    echo "❌ version.json not found"
fi
echo ""
echo "Local package.json version: $(node -p "require('./package.json').version" 2>/dev/null || echo 'N/A')"
echo ""

# 4. Production State Analysis
echo "📋 4. PRODUCTION STATE"
PROD_URL="https://vh9x3gevev.us-east-1.awsapprunner.com"
echo "Testing production accessibility..."
HEALTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$PROD_URL/diagnostic/health" || echo "000")
echo "Health endpoint: HTTP $HEALTH_CODE"

if [ "$HEALTH_CODE" = "200" ]; then
    echo "Production health data:"
    curl -s --max-time 10 "$PROD_URL/diagnostic/health" | jq '.' 2>/dev/null || curl -s --max-time 10 "$PROD_URL/diagnostic/health"
    
    echo ""
    echo "Production version from footer:"
    curl -s --max-time 10 "$PROD_URL/" | grep -o 'v[0-9]\+\.[0-9]\+\.[0-9]\+' | head -1 || echo "Version not found"
    
    echo "Production commit from footer:"  
    curl -s --max-time 10 "$PROD_URL/" | grep -o 'commit/[a-f0-9]\{7,\}' | cut -d/ -f2 | head -1 || echo "Commit not found"
else
    echo "❌ Production not accessible (HTTP $HEALTH_CODE)"
fi
echo ""

# 5. AWS App Runner State
echo "📋 5. AWS APP RUNNER STATE"
if command -v aws >/dev/null 2>&1; then
    echo "Checking App Runner service status..."
    
    # Load service ARN from environment or config
    SERVICE_ARN=""
    if [ -f ".env" ] && grep -q "APPRUNNER_SERVICE_ARN" .env; then
        SERVICE_ARN=$(grep "APPRUNNER_SERVICE_ARN" .env | cut -d= -f2 | tr -d '"' | tr -d "'")
    fi
    
    if [ -n "$SERVICE_ARN" ]; then
        echo "Service ARN: $SERVICE_ARN"
        
        SERVICE_INFO=$(aws apprunner describe-service --service-arn "$SERVICE_ARN" --query 'Service.{Status:Status,Image:SourceConfiguration.ImageRepository.ImageIdentifier,UpdatedAt:UpdatedAt}' --output json 2>/dev/null)
        
        if [ $? -eq 0 ]; then
            echo "App Runner service info:"
            echo "$SERVICE_INFO" | jq '.' 2>/dev/null || echo "$SERVICE_INFO"
            
            # Check recent operations
            echo ""
            echo "Recent App Runner operations:"
            aws apprunner list-operations --service-arn "$SERVICE_ARN" --max-items 3 --query 'OperationSummaryList[*].{Id:Id,Type:Type,Status:Status,StartedAt:StartedAt}' --output table 2>/dev/null || echo "Could not fetch operations"
        else
            echo "❌ Failed to get App Runner service info"
        fi
    else
        echo "❌ APPRUNNER_SERVICE_ARN not found in .env"
    fi
else
    echo "❌ AWS CLI not available"
fi
echo ""

# 6. GitHub Actions Workflow State
echo "📋 6. GITHUB ACTIONS STATE"
if command -v gh >/dev/null 2>&1; then
    echo "Recent workflow runs:"
    gh run list --limit 5 --json status,conclusion,createdAt,headSha,workflowName 2>/dev/null || echo "GitHub CLI not authenticated or repo not accessible"
else
    echo "❌ GitHub CLI (gh) not available"
fi
echo ""

# 7. Docker/ECR State (if applicable)
echo "📋 7. CONTAINER REGISTRY STATE"
if command -v aws >/dev/null 2>&1; then
    echo "Checking ECR repository state..."
    ECR_REPO="wavelength-lore"
    
    RECENT_IMAGES=$(aws ecr describe-images --repository-name "$ECR_REPO" --max-items 5 --query 'imageDetails[*].{Tags:imageTags,Digest:imageDigest,Pushed:imagePushedAt}' --output json 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        echo "Recent ECR images:"
        echo "$RECENT_IMAGES" | jq '.' 2>/dev/null || echo "$RECENT_IMAGES"
    else
        echo "❌ Could not access ECR repository $ECR_REPO"
    fi
else
    echo "❌ AWS CLI not available for ECR check"
fi
echo ""

# 8. Deployment History Analysis
echo "📋 8. DEPLOYMENT TRACKING"
if [ -f "deployment-history.json" ]; then
    echo "Recent deployment records:"
    tail -5 deployment-history.json | jq '.' 2>/dev/null || tail -5 deployment-history.json
else
    echo "❌ deployment-history.json not found"
fi
echo ""

# 9. Environment & Configuration
echo "📋 9. ENVIRONMENT CONFIGURATION"
echo "Node.js version: $(node --version 2>/dev/null || echo 'Not available')"
echo "npm version: $(npm --version 2>/dev/null || echo 'Not available')"
echo "Git version: $(git --version 2>/dev/null || echo 'Not available')"
echo "AWS CLI version: $(aws --version 2>/dev/null || echo 'Not available')"
echo ""

# 10. Diagnostic Summary & Recommendations
echo "📋 10. DIAGNOSTIC SUMMARY"
echo ""

# Check for common issues
ISSUES_FOUND=0

# Issue 1: Local/Remote sync
if ! git diff --quiet HEAD origin/main 2>/dev/null; then
    echo "⚠️  Issue: Local branch differs from remote main"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

# Issue 2: Production version mismatch
LOCAL_VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "")
if [ -n "$LOCAL_VERSION" ] && [ "$HEALTH_CODE" = "200" ]; then
    PROD_VERSION=$(curl -s --max-time 10 "$PROD_URL/" | grep -o 'v[0-9]\+\.[0-9]\+\.[0-9]\+' | head -1 | sed 's/v//' || echo "")
    if [ -n "$PROD_VERSION" ] && [ "$LOCAL_VERSION" != "$PROD_VERSION" ]; then
        echo "⚠️  Issue: Version mismatch - Local: v$LOCAL_VERSION, Production: v$PROD_VERSION"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
fi

# Issue 3: Backup system errors (check if we can access logs)
if [ "$HEALTH_CODE" = "200" ]; then
    # This is a placeholder - in real scenario we'd need log access
    echo "ℹ️  Note: Check production logs for 'Invalid time value' backup system errors"
fi

if [ $ISSUES_FOUND -eq 0 ]; then
    echo "✅ No obvious issues detected"
else
    echo "🔍 Found $ISSUES_FOUND potential issues to investigate"
fi

echo ""
echo "💡 RECOMMENDATIONS:"
echo "1. If local differs from remote: run 'git push origin main'"
echo "2. If version mismatch persists: trigger new deployment"  
echo "3. If deployment fails: check GitHub Actions workflow logs"
echo "4. If App Runner issues: verify service configuration"
echo "5. Monitor: npm run deploy:compare"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🏁 Diagnostics complete - $(date)"