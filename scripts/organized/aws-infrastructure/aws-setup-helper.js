#!/usr/bin/env node

/**
 * AWS CLI Configuration Helper
 * Helps set up AWS CLI for IAM operations
 */

console.log('🔧 AWS CLI Configuration Helper');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');

console.log('📋 To add App Runner permissions, you need AWS CLI configured with admin access.');
console.log('');

console.log('🚀 Option 1: Configure AWS CLI with Admin User');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('1. Create a temporary admin user in AWS Console:');
console.log('   - IAM → Users → Create user');
console.log('   - Name: temp-admin-user');
console.log('   - Attach policy: AdministratorAccess');
console.log('   - Create access key for CLI');
console.log('');
console.log('2. Configure AWS CLI:');
console.log('   aws configure');
console.log('   - AWS Access Key ID: [admin user access key]');
console.log('   - AWS Secret Access Key: [admin user secret key]'); 
console.log('   - Default region: us-east-1');
console.log('   - Default output format: json');
console.log('');
console.log('3. Run the permission script:');
console.log('   aws iam put-user-policy \\');
console.log('     --user-name wavelength-lore-app-user \\');
console.log('     --policy-name AppRunnerEnvironmentUpdate \\');
console.log('     --policy-document file://aws-policies/apprunner-policy.json');
console.log('');
console.log('4. Delete temp admin user after completing setup');
console.log('');

console.log('🌐 Option 2: Use AWS Console (Recommended)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('1. Go to: https://console.aws.amazon.com/iam/');
console.log('2. Navigate: IAM → Users → wavelength-lore-app-user');
console.log('3. Click: "Add permissions" → "Create inline policy"');
console.log('4. Choose: "JSON" tab');
console.log('5. Paste the policy from aws-policies/apprunner-policy.json');
console.log('6. Name: "AppRunnerEnvironmentUpdate"');
console.log('7. Click: "Create policy"');
console.log('');

console.log('✅ After adding permissions, test with:');
console.log('   node scripts/apprunner-env-updater.js');
console.log('');

console.log('📁 Policy file created: aws-policies/apprunner-policy.json');
console.log('   (Use this content in AWS Console)');