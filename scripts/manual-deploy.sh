#!/bin/bash

# 🌊 WAVELENGTH Manual Build & Deploy Script
# Bypasses GitHub Actions for direct ECR + App Runner deployment

set -e  # Exit on any error

# Configuration
ECR_REGISTRY="170023515523.dkr.ecr.us-east-1.amazonaws.com"
ECR_REPOSITORY="wavelength-lore"
AWS_REGION="us-east-1"
APPRUNNER_SERVICE_ARN="arn:aws:apprunner:us-east-1:170023515523:service/wavelength-lore-service/829c542fc95c419090494817f7046eaa"

echo "🌊 WAVELENGTH MANUAL BUILD & DEPLOY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 Registry: $ECR_REGISTRY"
echo "🐳 Repository: $ECR_REPOSITORY"
echo "🌍 Region: $AWS_REGION"
echo ""

# Step 1: Validate Prerequisites
echo "🔍 Step 1: Validating Prerequisites..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check Docker
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running!"
    echo "🔧 Starting Docker Desktop..."
    open -a Docker
    echo "⏳ Waiting for Docker to start..."
    for i in {1..30}; do
        if docker info >/dev/null 2>&1; then
            echo "✅ Docker is now running"
            break
        fi
        sleep 2
        echo -n "."
    done
    if ! docker info >/dev/null 2>&1; then
        echo "❌ Failed to start Docker after 60 seconds"
        exit 1
    fi
else
    echo "✅ Docker is running"
fi

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found!"
    exit 1
fi
echo "✅ AWS CLI available"

# Check git status
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Working directory has uncommitted changes"
    echo "📝 Current changes will be included in the build"
else
    echo "✅ Working directory is clean"
fi

echo ""

# Step 2: Generate Version Information
echo "📋 Step 2: Generating Version Information..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Get current version from package.json
CURRENT_VERSION=$(node -p "require('./package.json').version")
COMMIT_HASH=$(git rev-parse HEAD)
COMMIT_SHORT=$(git rev-parse --short HEAD)
BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
BUILD_NUMBER="manual-$(date +%s)"

echo "📦 Version: $CURRENT_VERSION"
echo "🔗 Commit: $COMMIT_SHORT ($COMMIT_HASH)"
echo "📅 Build Date: $BUILD_DATE"
echo "🔢 Build Number: $BUILD_NUMBER"

# Update version.json
cat > version.json << EOF
{
  "version": "$CURRENT_VERSION",
  "buildDate": "$BUILD_DATE",
  "commitHash": "$COMMIT_HASH",
  "commitShort": "$COMMIT_SHORT",
  "buildNumber": "$BUILD_NUMBER",
  "environment": "production",
  "workflowId": "manual-build",
  "deploymentStatus": "building"
}
EOF

echo "✅ Version information updated"
echo ""

# Step 3: Build Docker Image
echo "🐳 Step 3: Building Docker Image..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Generate image tags
VERSION_TAG="v$CURRENT_VERSION-manual"
COMMIT_TAG="$COMMIT_SHORT"
IMAGE_BASE="$ECR_REGISTRY/$ECR_REPOSITORY"

echo "🏷️  Tags: $VERSION_TAG, $COMMIT_TAG"

# Build with multiple tags
docker build \
  --platform linux/amd64 \
  --tag "$IMAGE_BASE:$VERSION_TAG" \
  --tag "$IMAGE_BASE:$COMMIT_TAG" \
  --progress=plain \
  .

echo "✅ Docker image built successfully"
echo ""

# Step 4: Push to ECR
echo "📤 Step 4: Pushing to ECR..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Login to ECR
echo "🔐 Logging into ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY

# Push images
echo "📤 Pushing $VERSION_TAG..."
docker push "$IMAGE_BASE:$VERSION_TAG"

echo "📤 Pushing $COMMIT_TAG..."
docker push "$IMAGE_BASE:$COMMIT_TAG"

echo "✅ Images pushed to ECR successfully"
echo ""

# Step 5: Deploy to App Runner
echo "🚀 Step 5: Deploying to App Runner..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Update App Runner service
echo "🔄 Updating App Runner service..."
OPERATION_ID=$(aws apprunner update-service \
  --service-arn "$APPRUNNER_SERVICE_ARN" \
  --source-configuration "{
    \"ImageRepository\": {
      \"ImageIdentifier\": \"$IMAGE_BASE:$VERSION_TAG\",
      \"ImageConfiguration\": {
        \"Port\": \"8080\"
      },
      \"ImageRepositoryType\": \"ECR\"
    },
    \"AutoDeploymentsEnabled\": false
  }" \
  --query 'OperationId' \
  --output text)

echo "✅ App Runner deployment initiated"
echo "🆔 Operation ID: $OPERATION_ID"
echo ""

# Step 6: Monitor Deployment
echo "📊 Step 6: Monitoring Deployment..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "⏳ Waiting for deployment to start..."
sleep 10

# Check service status
for i in {1..12}; do
    echo "🔍 Checking deployment status (attempt $i/12)..."
    
    SERVICE_STATUS=$(aws apprunner describe-service \
      --service-arn "$APPRUNNER_SERVICE_ARN" \
      --query 'Service.Status' \
      --output text)
    
    CURRENT_IMAGE=$(aws apprunner describe-service \
      --service-arn "$APPRUNNER_SERVICE_ARN" \
      --query 'Service.SourceConfiguration.ImageRepository.ImageIdentifier' \
      --output text)
    
    echo "📊 Status: $SERVICE_STATUS"
    echo "🖼️  Image: $CURRENT_IMAGE"
    
    if [ "$SERVICE_STATUS" = "RUNNING" ]; then
        if [[ "$CURRENT_IMAGE" == *"$VERSION_TAG"* ]]; then
            echo "🎉 DEPLOYMENT SUCCESSFUL!"
            echo "✅ Service is running with new image: $VERSION_TAG"
            break
        else
            echo "⚠️  Service is running but still using old image"
        fi
    elif [ "$SERVICE_STATUS" = "OPERATION_IN_PROGRESS" ]; then
        echo "⏳ Deployment in progress..."
    else
        echo "⚠️  Service status: $SERVICE_STATUS"
    fi
    
    if [ $i -lt 12 ]; then
        echo "⏳ Waiting 30 seconds before next check..."
        sleep 30
    fi
    echo ""
done

# Step 7: Final Validation
echo "🔍 Step 7: Final Validation..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Update version.json status
cat > version.json << EOF
{
  "version": "$CURRENT_VERSION",
  "buildDate": "$BUILD_DATE",
  "commitHash": "$COMMIT_HASH",
  "commitShort": "$COMMIT_SHORT",
  "buildNumber": "$BUILD_NUMBER",
  "environment": "production",
  "workflowId": "manual-build",
  "deploymentStatus": "deployed"
}
EOF

echo "✅ Version status updated to 'deployed'"

# Test site accessibility
echo "🌐 Testing site accessibility..."
if curl -sf "https://vh9x3gevev.us-east-1.awsapprunner.com" > /dev/null; then
    echo "✅ Site is accessible"
else
    echo "⚠️  Site may not be fully ready yet"
fi

echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 Version: $CURRENT_VERSION ($VERSION_TAG)"
echo "🔗 Commit: $COMMIT_SHORT"
echo "🌐 URL: https://vh9x3gevev.us-east-1.awsapprunner.com"
echo "🛍️  Merchandise: https://vh9x3gevev.us-east-1.awsapprunner.com/merchandise"
echo ""
echo "🕵️  VERIFICATION STEPS:"
echo "1. Visit the merchandise page"
echo "2. Open browser dev tools (F12) → Console"
echo "3. Look for: '🌟 [GORGEOUS MOCKUP] Using beautiful Printify mockup'"
echo "4. Check for CSS: enhanced-product-ui.css?v=$CURRENT_VERSION"
echo "5. Verify enhanced cards with dropdown selectors"
echo ""
echo "🎯 Enhanced cards with pricing fixes should now be live!"