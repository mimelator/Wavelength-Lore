#!/usr/bin/env node

/**
 * CloudFront Credential Setup and Updater
 * Tests all available AWS credentials and finds one with CloudFront permissions
 */

require('dotenv').config();

console.log('🌐 CLOUDFRONT UPDATER - CREDENTIAL SETUP');
console.log('=========================================');
console.log('');

console.log('🔍 Checking available AWS credentials...');
console.log('');

// Define all available credential sets
const credentialSets = [
    {
        name: 'wavelength-lore-app-user',
        accessKey: process.env.ACCESS_KEY_ID,
        secretKey: process.env.SECRET_ACCESS_KEY,
        description: 'Main app user (limited permissions)'
    },
    {
        name: 'wavelength-backup-user', 
        accessKey: process.env.AWS_ACCESS_KEY_ID,
        secretKey: process.env.AWS_SECRET_ACCESS_KEY,
        description: 'Backup operations user'
    },
    {
        name: 'admin-user',
        accessKey: process.env.AWS_ACCESS_KEY_ADMIN,
        secretKey: process.env.AWS_SECRET_ACCESS_KEY_ADMIN,
        description: 'Admin user (full permissions)'
    }
];

// Show available credentials
console.log('📋 Available AWS credential sets:');
credentialSets.forEach((creds, index) => {
    if (creds.accessKey && creds.secretKey) {
        console.log(`   ${index + 1}. ${creds.name}`);
        console.log(`      Access Key: ${creds.accessKey.substring(0, 8)}...`);
        console.log(`      Description: ${creds.description}`);
        console.log('');
    }
});

// Test credentials for CloudFront access
async function testCloudFrontAccess(accessKey, secretKey) {
    const { CloudFrontClient, GetDistributionConfigCommand } = require('@aws-sdk/client-cloudfront');
    
    const client = new CloudFrontClient({
        region: 'us-east-1',
        credentials: {
            accessKeyId: accessKey,
            secretAccessKey: secretKey
        }
    });
    
    try {
        const command = new GetDistributionConfigCommand({ Id: 'E2QFR8E7I4A6ZT' });
        await client.send(command);
        return true;
    } catch (error) {
        return false;
    }
}

// Find working credentials
async function findWorkingCredentials() {
    console.log('🧪 Testing CloudFront access for each credential set...');
    console.log('');
    
    for (const creds of credentialSets) {
        if (creds.accessKey && creds.secretKey) {
            console.log(`🔍 Testing ${creds.name}...`);
            const hasAccess = await testCloudFrontAccess(creds.accessKey, creds.secretKey);
            
            if (hasAccess) {
                console.log(`✅ ${creds.name} has CloudFront access!`);
                console.log('');
                
                // Configure environment
                process.env.AWS_ACCESS_KEY_ID = creds.accessKey;
                process.env.AWS_SECRET_ACCESS_KEY = creds.secretKey;
                process.env.AWS_DEFAULT_REGION = 'us-east-1';
                
                console.log(`🔧 Configured to use ${creds.name} for CloudFront operations`);
                console.log('');
                
                // Run the updater
                require('./update-cloudfront-interactive.js');
                return;
            } else {
                console.log(`❌ ${creds.name} lacks CloudFront permissions`);
            }
        }
    }
    
    console.log('');
    console.log('❌ No credential sets have CloudFront permissions');
    showAlternatives();
}

function showAlternatives() {
    console.log('');
    console.log('🔧 SOLUTIONS:');
    console.log('');
    console.log('Option 1 - Grant CloudFront permissions to existing users');
    console.log('   Go to AWS IAM Console and attach CloudFront policies');
    console.log('');
    console.log('Option 2 - Use AWS CLI with different profile:');
    console.log('   aws configure --profile cloudfront-admin');
    console.log('   export AWS_PROFILE=cloudfront-admin');
    console.log('   node scripts/update-cloudfront-interactive.js');
    console.log('');
    console.log('Option 3 - Create new IAM user with CloudFront permissions');
    console.log('   Add to .env as new credential set');
    console.log('');
    console.log('🔑 Required CloudFront permissions:');
    console.log('   • cloudfront:GetDistribution');
    console.log('   • cloudfront:GetDistributionConfig');
    console.log('   • cloudfront:UpdateDistribution');
    console.log('');
    console.log('💡 Alternative: Manual AWS Console Method');
    console.log('   Run: node scripts/cloudfront-guide.js');
    console.log('   For step-by-step manual instructions');
}

// Run the credential finder
findWorkingCredentials().catch(error => {
    console.error('❌ Error testing credentials:', error.message);
    showAlternatives();
});