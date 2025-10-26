#!/usr/bin/env node
/**
 * AGENT_BETA: AWS Deployment Security Diagnostic
 * 
 * Tests GitHub Actions secrets to identify credential/permission issues
 * causing deployment verification failures
 */

console.log('🚨 AGENT_BETA: AWS Deployment Security Diagnostic');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const requiredSecrets = [
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY', 
  'AWS_REGION',
  'APPRUNNER_SERVICE_ARN',
  'CLOUDFRONT_DISTRIBUTION_ID'
];

console.log('\n📋 GitHub Secrets Expected by Workflow:');
requiredSecrets.forEach(secret => {
  const value = process.env[secret];
  if (value) {
    console.log(`✅ ${secret}: ${secret.includes('KEY') ? '***[REDACTED]***' : value}`);
  } else {
    console.log(`❌ ${secret}: NOT SET`);
  }
});

// Test AWS SDK credential patterns
console.log('\n🔍 Testing AWS SDK Credential Recognition:');

const credentialTests = [
  {
    name: 'Standard AWS SDK Pattern',
    vars: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'],
    priority: 1
  },
  {
    name: 'Legacy App Pattern', 
    vars: ['ACCESS_KEY_ID', 'SECRET_ACCESS_KEY'],
    priority: 2
  }
];

credentialTests.forEach(test => {
  const hasAll = test.vars.every(v => process.env[v]);
  console.log(`${hasAll ? '✅' : '❌'} ${test.name}: ${hasAll ? 'Available' : 'Missing'}`);
  if (hasAll) {
    console.log(`   Priority: ${test.priority} ${test.priority === 1 ? '(GitHub Actions uses this)' : '(Local scripts use this)'}`);
  }
});

console.log('\n🚨 SECURITY INVESTIGATION FINDINGS:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Analyze the specific GitHub Actions failure pattern
console.log('\n📊 GitHub Actions Failure Analysis:');
console.log('🔍 Issue: "Image mismatch" in deployment verification step');
console.log('🔍 Symptoms: ECR build succeeds, but App Runner deployment verification fails');
console.log('🔍 Root Cause Theory: Revoked credentials preventing proper AWS operations');

console.log('\n💡 CREDENTIAL SECURITY RECOMMENDATIONS:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

console.log('\n1. 🔐 VERIFY GITHUB SECRETS:');
console.log('   • Go to: https://github.com/mimelator/Wavelength-Lore/settings/secrets/actions');
console.log('   • Confirm all 5 required secrets exist');
console.log('   • Check if AWS credentials were recently rotated/revoked');

console.log('\n2. 🔍 TEST CREDENTIAL PERMISSIONS:');
console.log('   Required IAM permissions for GitHub Actions:');
console.log('   • ecr:GetAuthorizationToken, ecr:BatchCheckLayerAvailability');
console.log('   • ecr:DescribeRepositories, ecr:DescribeImages');
console.log('   • apprunner:DescribeService, apprunner:UpdateService');
console.log('   • cloudfront:CreateInvalidation (optional)');

console.log('\n3. 🛠️ CREDENTIAL REMEDIATION STEPS:');
console.log('   A. Create new AWS access key in IAM Console');
console.log('   B. Attach minimal required permissions policy');
console.log('   C. Update GitHub repository secrets');
console.log('   D. Test deployment with new credentials');

console.log('\n4. 🔍 DEPLOYMENT VERIFICATION FIX:');
console.log('   • The "image mismatch" suggests App Runner is not updating properly');
console.log('   • This commonly occurs when credentials lack apprunner:UpdateService permission');
console.log('   • May also indicate ECR image push succeeded but metadata is mismatched');

console.log('\n🎯 IMMEDIATE ACTION REQUIRED:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('1. Check AWS IAM Console for recently disabled/deleted access keys');
console.log('2. Verify GitHub secrets match current AWS credentials');
console.log('3. Test credentials have sufficient App Runner permissions');
console.log('4. Re-run failed GitHub Actions workflow after credential fix');

console.log('\n🌊 AGENT_BETA Diagnostic Complete');
console.log('Next: Update GitHub secrets with working AWS credentials');