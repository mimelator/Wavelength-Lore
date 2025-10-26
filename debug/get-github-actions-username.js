#!/usr/bin/env node

/**
 * Extract GitHub Actions AWS user name for IAM operations
 */

require('dotenv').config();
const AWS = require('aws-sdk');

async function getGitHubActionsUserName() {
    try {
        const sts = new AWS.STS({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            region: 'us-east-1'
        });

        const identity = await sts.getCallerIdentity().promise();
        
        // Extract user name from ARN: arn:aws:iam::account:user/username
        const arnParts = identity.Arn.split('/');
        const userName = arnParts[arnParts.length - 1];
        
        console.log('GitHub Actions AWS User Name:', userName);
        return userName;
        
    } catch (error) {
        console.error('Error getting user name:', error.message);
        process.exit(1);
    }
}

getGitHubActionsUserName();