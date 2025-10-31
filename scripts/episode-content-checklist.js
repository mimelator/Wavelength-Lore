#!/usr/bin/env node

/**
 * Episode Content Pre-Deployment Checklist
 * Mandatory checks before ANY episode content deployment
 */

console.log('🚀 EPISODE CONTENT PRE-DEPLOYMENT CHECKLIST');
console.log('=============================================\n');

const checklist = [
    {
        name: 'Firebase Data Validation',
        command: 'npm run validate:episode-content',
        critical: true,
        description: 'Validates Firebase song structure and URLs'
    },
    {
        name: 'Audio URL Accessibility',
        command: 'npm run validate:audio-urls',
        critical: true,
        description: 'Tests all audio URLs return HTTP 200'
    },
    {
        name: 'S3 File Verification',
        command: 'aws s3 ls s3://wavelength-lore-bucket/images/seasons/ --recursive | wc -l',
        critical: false,
        description: 'Counts available S3 files'
    },
    {
        name: 'Radio Player Test',
        command: 'curl -s http://localhost:3001/api/radio/playlist | jq length',
        critical: true,
        description: 'Verifies radio API returns playlist'
    }
];

console.log('📋 Required validations before episode content deployment:\n');

checklist.forEach((check, i) => {
    const status = check.critical ? '🔴 CRITICAL' : '🟡 OPTIONAL';
    console.log(`${i + 1}. ${status} ${check.name}`);
    console.log(`   Command: ${check.command}`);
    console.log(`   Purpose: ${check.description}\n`);
});

console.log('💡 IMPROVED PROCEDURES:');
console.log('========================');
console.log('1. 🧪 ALWAYS run validation BEFORE committing episode content');
console.log('2. 🔍 Test with actual CDN URLs, not localhost');
console.log('3. 📁 Verify S3 files exist BEFORE updating Firebase');
console.log('4. 🎯 Use staging environment for validation');
console.log('5. 📊 Require 100% URL success rate before deployment');
console.log('6. 🚨 Add validation to CI/CD pipeline');
console.log('7. 🔄 Always test end-to-end radio player functionality');

console.log('\n⚠️  NEVER AGAIN:');
console.log('=================');
console.log('❌ Deploy Firebase changes without S3 file verification');
console.log('❌ Assume URL normalization worked without testing');
console.log('❌ Push to production without comprehensive validation');
console.log('❌ Debug in production - build proper dev tools first');

console.log('\n✅ Use this checklist for EVERY episode content change!');