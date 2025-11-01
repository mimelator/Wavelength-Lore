# Quick ECR Cleanup Commands

## 🚨 IMMEDIATE ACTION - Delete Old Images

### 1. Check current image count
```bash
aws ecr describe-images \
  --repository-name wavelength-lore \
  --region us-east-1 \
  --query 'length(imageDetails)' \
  --output text
```

### 2. SAFE: Delete images older than 30 days (keeps recent builds)
```bash
# Get images older than 30 days
aws ecr describe-images \
  --repository-name wavelength-lore \
  --region us-east-1 \
  --query "imageDetails[?imagePushedAt<\`$(date -d '30 days ago' '+%Y-%m-%d')\`].imageDigest" \
  --output text | tr '\t' '\n' | head -20 | while read digest; do
    if [ ! -z "$digest" ]; then
      echo "Deleting $digest"
      aws ecr batch-delete-image \
        --repository-name wavelength-lore \
        --region us-east-1 \
        --image-ids imageDigest=$digest
    fi
  done
```

### 3. AGGRESSIVE: Keep only 10 most recent images
```bash
# Get all but 10 most recent images
aws ecr describe-images \
  --repository-name wavelength-lore \
  --region us-east-1 \
  --query 'sort_by(imageDetails, &imagePushedAt)[:-10].imageDigest' \
  --output text | tr '\t' '\n' | while read digest; do
    if [ ! -z "$digest" ]; then
      echo "Deleting $digest"
      aws ecr batch-delete-image \
        --repository-name wavelength-lore \
        --region us-east-1 \
        --image-ids imageDigest=$digest
    fi
  done
```

### 4. Delete all untagged images
```bash
aws ecr describe-images \
  --repository-name wavelength-lore \
  --region us-east-1 \
  --query 'imageDetails[?imageDigest != null && (imageTags == null || length(imageTags) == `0`)].imageDigest' \
  --output text | tr '\t' '\n' | while read digest; do
    if [ ! -z "$digest" ]; then
      echo "Deleting untagged $digest"
      aws ecr batch-delete-image \
        --repository-name wavelength-lore \
        --region us-east-1 \
        --image-ids imageDigest=$digest
    fi
  done
```

## 💰 Cost Calculation

With 1120 images at ~200MB each = ~224GB
Monthly cost: 224GB × $0.10 = **$22.40/month**

After cleanup to 10 images: ~2GB = **$0.20/month**
**Monthly savings: $22.20**

## 🎯 Recommended Approach

1. **Start with untagged images** (safest)
2. **Delete images older than 30 days** 
3. **If still too many, keep only 10-20 most recent**

## ⚠️ IMPORTANT NOTES

- **Always test in non-production first**
- **Make sure you have recent images tagged properly**
- **Consider which images you actually need**
- **ECR deletions are permanent - no undo**

## 🔄 Automation for Future

Add to your CI/CD pipeline:
```yaml
# .github/workflows/ecr-cleanup.yml
name: ECR Cleanup
on:
  schedule:
    - cron: '0 2 * * 0'  # Weekly on Sunday at 2 AM
jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Cleanup ECR
        run: |
          aws ecr describe-images \
            --repository-name wavelength-lore \
            --region us-east-1 \
            --query 'sort_by(imageDetails, &imagePushedAt)[:-10].imageDigest' \
            --output text | tr '\t' '\n' | while read digest; do
              aws ecr batch-delete-image \
                --repository-name wavelength-lore \
                --region us-east-1 \
                --image-ids imageDigest=$digest
            done
```