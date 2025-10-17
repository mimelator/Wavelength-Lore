#!/usr/bin/env node

/**
 * AWS IAM Policy Generator for App Runner Access
 * Generates the required IAM policy for App Runner environment updates
 */

console.log('🔐 AWS IAM Policy for App Runner Environment Updates');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');

const serviceArn = 'arn:aws:apprunner:us-east-1:170023515523:service/wavelength-lore-service/829c542fc95c419090494817f7046eaa';

const iamPolicy = {
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AppRunnerServiceAccess",
      "Effect": "Allow",
      "Action": [
        "apprunner:DescribeService",
        "apprunner:UpdateService"
      ],
      "Resource": serviceArn
    },
    {
      "Sid": "AppRunnerListAccess", 
      "Effect": "Allow",
      "Action": [
        "apprunner:ListServices"
      ],
      "Resource": "*"
    }
  ]
};

console.log('📋 Required IAM Policy JSON:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(JSON.stringify(iamPolicy, null, 2));
console.log('');

console.log('🔧 Steps to Add Permissions:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('1. Go to AWS Console → IAM → Users');
console.log('2. Select your user (wavelength-lore-app-user)');
console.log('3. Click "Add permissions" → "Create inline policy"');
console.log('4. Choose "JSON" tab and paste the policy above');
console.log('5. Name it "AppRunnerEnvironmentUpdate"');
console.log('6. Click "Create policy"');
console.log('');

console.log('🚀 Alternative: Use AWS CLI');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('If you have AWS CLI configured with admin access:');
console.log('');
console.log('# Save policy to file');
console.log('cat > apprunner-policy.json << \'EOF\'');
console.log(JSON.stringify(iamPolicy, null, 2));
console.log('EOF');
console.log('');
console.log('# Attach policy to user');
console.log('aws iam put-user-policy \\');
console.log('  --user-name wavelength-lore-app-user \\');
console.log('  --policy-name AppRunnerEnvironmentUpdate \\');
console.log('  --policy-document file://apprunner-policy.json');
console.log('');

console.log('✅ After adding permissions, run:');
console.log('   node scripts/apprunner-env-updater.js');
console.log('');

console.log('🔒 Security Note:');
console.log('   This policy grants minimal permissions needed only for');
console.log('   your specific App Runner service environment updates.');