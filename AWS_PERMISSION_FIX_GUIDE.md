# 🔧 WAVELENGTH AWS PERMISSION FIX GUIDE
**Date:** October 26, 2025  
**Issue:** GitHub Actions deployment failures due to missing ECR/App Runner permissions  
**Status:** ✅ IDENTIFIED - READY TO FIX

## 🎯 **PROBLEM SUMMARY**
- ✅ All AWS credentials are working and properly separated (3 different users)
- ❌ GitHub Actions AWS user lacks ECR and App Runner permissions
- 🎯 This is causing the "image mismatch" deployment verification failures

## 🔍 **DIAGNOSTIC RESULTS**
```
🔍 GitHub Actions Credentials Test Results:
   Status: ✅ CREDENTIALS WORK!
   AWS User ARN: arn:aws:iam::[ACCOUNT]:user/[GITHUB_USER]
   ECR Access: ❌ AccessDeniedException  
   App Runner Access: ❌ AccessDeniedException
```

## 🛠️ **REQUIRED AWS PERMISSION POLICIES**

### **1. ECR Permissions (Container Registry)**
The GitHub Actions user needs these ECR permissions:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ecr:GetAuthorizationToken",
                "ecr:BatchCheckLayerAvailability",
                "ecr:GetDownloadUrlForLayer",
                "ecr:BatchGetImage",
                "ecr:PutImage",
                "ecr:InitiateLayerUpload",
                "ecr:UploadLayerPart",
                "ecr:CompleteLayerUpload",
                "ecr:DescribeRepositories",
                "ecr:DescribeImages",
                "ecr:ListImages"
            ],
            "Resource": "*"
        }
    ]
}
```

### **2. App Runner Permissions (Deployment Verification)**
The GitHub Actions user needs these App Runner permissions:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "apprunner:DescribeService",
                "apprunner:ListServices",
                "apprunner:UpdateService",
                "apprunner:StartDeployment"
            ],
            "Resource": "*"
        }
    ]
}
```

## 🚀 **STEP-BY-STEP FIX INSTRUCTIONS**

### **Option A: AWS Console (Recommended)**
1. **Log into AWS Console** → IAM Service
2. **Find the GitHub Actions user** (look for the user with access key ending in `VSHS`)
3. **Attach policies:**
   - Create custom policy: "GitHubActions-ECR-Access" (use ECR JSON above)
   - Create custom policy: "GitHubActions-AppRunner-Access" (use App Runner JSON above)
   - Attach both policies to the GitHub Actions user

### **Option B: AWS CLI Method**
```bash
# 1. Create ECR policy file
cat > github-actions-ecr-policy.json << 'EOF'
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ecr:GetAuthorizationToken",
                "ecr:BatchCheckLayerAvailability", 
                "ecr:GetDownloadUrlForLayer",
                "ecr:BatchGetImage",
                "ecr:PutImage",
                "ecr:InitiateLayerUpload",
                "ecr:UploadLayerPart",
                "ecr:CompleteLayerUpload",
                "ecr:DescribeRepositories",
                "ecr:DescribeImages",
                "ecr:ListImages"
            ],
            "Resource": "*"
        }
    ]
}
EOF

# 2. Create App Runner policy file
cat > github-actions-apprunner-policy.json << 'EOF'
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "apprunner:DescribeService",
                "apprunner:ListServices", 
                "apprunner:UpdateService",
                "apprunner:StartDeployment"
            ],
            "Resource": "*"
        }
    ]
}
EOF

# 3. Create the policies
aws iam create-policy --policy-name GitHubActions-ECR-Access --policy-document file://github-actions-ecr-policy.json

aws iam create-policy --policy-name GitHubActions-AppRunner-Access --policy-document file://github-actions-apprunner-policy.json

# 4. Get your AWS account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# 5. Attach policies to GitHub Actions user (replace USERNAME with actual username)
aws iam attach-user-policy --user-name [GITHUB_ACTIONS_USERNAME] --policy-arn arn:aws:iam::$ACCOUNT_ID:policy/GitHubActions-ECR-Access

aws iam attach-user-policy --user-name [GITHUB_ACTIONS_USERNAME] --policy-arn arn:aws:iam::$ACCOUNT_ID:policy/GitHubActions-AppRunner-Access
```

## ✅ **VERIFICATION STEPS**

After adding permissions, run this test:
```bash
node debug/advanced-credential-validator.js
```

Expected result:
```
🔍 Testing: GitHub Actions Credentials
   ECR Access: ✅ CAN ACCESS ECR
   App Runner Access: ✅ CAN ACCESS APP RUNNER
```

## 🎯 **EXPECTED OUTCOME**
Once permissions are added:
1. ✅ GitHub Actions will be able to push images to ECR
2. ✅ Deployment verification will work properly  
3. ✅ The "image mismatch" errors should be resolved
4. ✅ Full CI/CD pipeline should work end-to-end

## 📋 **NEXT STEPS**
1. **Add the missing permissions** (use Option A or B above)
2. **Run verification test** to confirm fix
3. **Trigger a new GitHub Actions deployment** to test the fix
4. **Monitor the workflow** at: https://github.com/mimelator/Wavelength-Lore/actions

---
**🌊 WAVELENGTH DEPLOYMENT RECOVERY GUIDE**  
**Issue Status:** ✅ Root cause identified - Ready for permission fix