#!/usr/bin/env node

/**
 * CloudFront Updater with Environment Setup
 * Sets up AWS credentials from .env and runs the CloudFront updater
 */

require('dotenv').config();

// Set AWS credentials from environment
if (process.env.ACCESS_KEY_ID && process.env.SECRET_ACCESS_KEY) {
    process.env.AWS_ACCESS_KEY_ID = process.env.ACCESS_KEY_ID;
    process.env.AWS_SECRET_ACCESS_KEY = process.env.SECRET_ACCESS_KEY;
    process.env.AWS_DEFAULT_REGION = 'us-east-1';
    
    console.log('🔑 AWS credentials configured from .env file');
    console.log(`📍 Access Key: ${process.env.ACCESS_KEY_ID.substring(0, 8)}...`);
    console.log('');
} else {
    console.log('⚠️  No AWS credentials found in .env file');
    console.log('   Make sure ACCESS_KEY_ID and SECRET_ACCESS_KEY are set');
    console.log('   Or configure AWS credentials separately with: aws configure');
    console.log('');
}

// Import and run the interactive updater
require('./update-cloudfront-interactive.js');