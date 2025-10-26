#!/usr/bin/env node

/**
 * 🔒 WAVELENGTH ADVANCED CREDENTIAL VALIDATOR
 * 
 * PURPOSE: Safely test AWS credentials with actual API calls
 * SECURITY: All sensitive data redacted in output
 */

require('dotenv').config();
const AWS = require('aws-sdk');

console.log('🔒 AGENT_BETA: Advanced AWS Credential Validator');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('⚠️  ALL SENSITIVE DATA WILL BE REDACTED FOR SECURITY');
console.log('🧪 Testing actual AWS API calls...\n');

// Helper function to redact sensitive information
function redactSensitive(str) {
    if (!str) return '[MISSING]';
    if (str.length <= 8) return '***[REDACTED]***';
    return str.substring(0, 4) + '***[REDACTED]***' + str.substring(str.length - 4);
}

// Test a specific set of credentials
async function testCredentials(name, accessKeyId, secretAccessKey, description) {
    console.log(`🔍 Testing: ${name}`);
    console.log(`   Purpose: ${description}`);
    console.log(`   Access Key: ${redactSensitive(accessKeyId)}`);
    
    if (!accessKeyId || !secretAccessKey) {
        console.log('   Status: ❌ MISSING CREDENTIALS');
        console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        return null;
    }

    try {
        // Create STS client with these specific credentials
        const sts = new AWS.STS({
            accessKeyId: accessKeyId,
            secretAccessKey: secretAccessKey,
            region: 'us-east-1'
        });

        console.log('   🧪 Testing AWS API connectivity...');
        
        // Test basic authentication
        const identity = await sts.getCallerIdentity().promise();
        
        console.log('   Status: ✅ CREDENTIALS WORK!');
        console.log(`   AWS User ARN: ${redactSensitive(identity.Arn)}`);
        console.log(`   AWS Account: ${redactSensitive(identity.Account)}`);
        console.log(`   AWS User ID: ${redactSensitive(identity.UserId)}`);
        
        // Test ECR access (critical for GitHub Actions)
        try {
            const ecr = new AWS.ECR({
                accessKeyId: accessKeyId,
                secretAccessKey: secretAccessKey,
                region: 'us-east-1'
            });
            
            console.log('   🧪 Testing ECR permissions...');
            await ecr.describeRepositories({ maxResults: 1 }).promise();
            console.log('   ECR Access: ✅ CAN ACCESS ECR');
        } catch (ecrError) {
            if (ecrError.code === 'UnauthorizedOperation' || ecrError.code === 'AccessDenied') {
                console.log('   ECR Access: ❌ NO ECR PERMISSIONS');
            } else {
                console.log(`   ECR Access: ⚠️  ECR ERROR: ${ecrError.code}`);
            }
        }

        // Test App Runner access (critical for deployment verification)
        try {
            const apprunner = new AWS.AppRunner({
                accessKeyId: accessKeyId,
                secretAccessKey: secretAccessKey,
                region: 'us-east-1'
            });
            
            console.log('   🧪 Testing App Runner permissions...');
            await apprunner.listServices({ MaxResults: 1 }).promise();
            console.log('   App Runner Access: ✅ CAN ACCESS APP RUNNER');
        } catch (appRunnerError) {
            if (appRunnerError.code === 'UnauthorizedOperation' || appRunnerError.code === 'AccessDenied') {
                console.log('   App Runner Access: ❌ NO APP RUNNER PERMISSIONS');
            } else {
                console.log(`   App Runner Access: ⚠️  APP RUNNER ERROR: ${appRunnerError.code}`);
            }
        }

        console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        return {
            name,
            working: true,
            userId: identity.UserId,
            arn: identity.Arn,
            account: identity.Account
        };
        
    } catch (error) {
        console.log(`   Status: ❌ CREDENTIALS FAILED`);
        console.log(`   Error: ${error.code} - ${error.message}`);
        console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        return {
            name,
            working: false,
            error: error.code
        };
    }
}

async function main() {
    console.log('🌊 WAVELENGTH CREDENTIAL TESTING PROTOCOL');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const results = [];

    // Test all three credential sets
    const githubResult = await testCredentials(
        'GitHub Actions Credentials',
        process.env.AWS_ACCESS_KEY_ID,
        process.env.AWS_SECRET_ACCESS_KEY,
        'Used by GitHub Actions for ECR + App Runner deployment'
    );
    if (githubResult) results.push(githubResult);

    const localResult = await testCredentials(
        'Local App User Credentials', 
        process.env.ACCESS_KEY_ID,
        process.env.SECRET_ACCESS_KEY,
        'Used by local scripts and S3 operations'
    );
    if (localResult) results.push(localResult);

    const devResult = await testCredentials(
        'Dev Environment Credentials',
        process.env.aws_wavelength_dev_access_key_id,
        process.env.aws_wavelength_dev_secret_access_key,
        'Used for development deployments'
    );
    if (devResult) results.push(devResult);

    // Analysis
    console.log('📊 FINAL CREDENTIAL ANALYSIS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const workingCredentials = results.filter(r => r.working);
    console.log(`✅ Working credential sets: ${workingCredentials.length}/3`);
    
    if (workingCredentials.length > 0) {
        const uniqueUsers = [...new Set(workingCredentials.map(r => r.userId))];
        console.log(`🔑 Unique AWS users: ${uniqueUsers.length}`);
        
        if (uniqueUsers.length === 1) {
            console.log('⚠️  WARNING: All working credentials use the SAME AWS user!');
            console.log('💡 RECOMMENDATION: Create separate AWS users for different purposes');
        } else {
            console.log('✅ GOOD: Multiple AWS users detected - proper separation!');
        }
    }

    // GitHub Actions specific analysis
    const githubCreds = results.find(r => r.name === 'GitHub Actions Credentials');
    if (githubCreds) {
        if (githubCreds.working) {
            console.log('\n🎯 GITHUB ACTIONS STATUS: ✅ CREDENTIALS WORK');
            console.log('💡 The deployment issue may be elsewhere (image tags, permissions, etc.)');
        } else {
            console.log('\n🎯 GITHUB ACTIONS STATUS: ❌ CREDENTIALS BROKEN');
            console.log('💡 THIS IS LIKELY THE CAUSE OF DEPLOYMENT FAILURES!');
            console.log('🔧 ACTION REQUIRED: Update GitHub repository secrets');
        }
    }

    console.log('\n🔒 SECURITY: All sensitive data redacted in this output');
    console.log('🌊 AGENT_BETA: Advanced credential validation complete!');
}

main().catch(error => {
    console.error('❌ FATAL ERROR:', error.message);
    process.exit(1);
});