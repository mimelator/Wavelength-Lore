#!/bin/bash

# Wait for new ECR image and then force deploy
# Usage: ./scripts/wait-for-new-image.sh ab91165

EXPECTED_COMMIT=$1
REGION="us-east-1"
REPO="wavelength-lore"
MAX_WAIT=600  # 10 minutes
INTERVAL=30   # Check every 30 seconds

if [ -z "$EXPECTED_COMMIT" ]; then
  echo "❌ Usage: $0 <commit-sha>"
  echo "   Example: $0 ab91165"
  exit 1
fi

echo "⏳ Waiting for GitHub Actions to build image with commit ${EXPECTED_COMMIT}..."
echo "   Repository: ${REPO}"
echo "   Region: ${REGION}"
echo "   Max wait: ${MAX_WAIT}s"
echo ""

elapsed=0
while [ $elapsed -lt $MAX_WAIT ]; do
  # Check if image with this commit tag exists
  IMAGE_EXISTS=$(aws ecr describe-images \
    --repository-name $REPO \
    --region $REGION \
    --image-ids imageTag=$EXPECTED_COMMIT \
    --query 'imageDetails[0].imageTags' \
    --output text 2>/dev/null)
  
  if [ $? -eq 0 ] && [ ! -z "$IMAGE_EXISTS" ]; then
    echo "✅ Image found with commit ${EXPECTED_COMMIT}!"
    echo ""
    
    # Get the image digest
    DIGEST=$(aws ecr describe-images \
      --repository-name $REPO \
      --region $REGION \
      --image-ids imageTag=$EXPECTED_COMMIT \
      --query 'imageDetails[0].imageDigest' \
      --output text)
    
    echo "📦 Image Details:"
    echo "   Tags: $IMAGE_EXISTS"
    echo "   Digest: $DIGEST"
    echo ""
    echo "🚀 Now run the force deployment script:"
    echo "   node scripts/force-apprunner-image-update.js --force"
    echo ""
    
    exit 0
  fi
  
  echo "⏳ Waiting... (${elapsed}s/${MAX_WAIT}s)"
  sleep $INTERVAL
  elapsed=$((elapsed + INTERVAL))
done

echo "❌ Timeout: Image not found after ${MAX_WAIT}s"
echo "   Check GitHub Actions: https://github.com/mimelator/Wavelength-Lore/actions"
exit 1
