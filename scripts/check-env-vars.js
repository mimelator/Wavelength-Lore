#!/usr/bin/env node

/**
 * Quick App Runner Environment Variable Checker
 */

const { AppRunnerClient, DescribeServiceCommand } = require('@aws-sdk/client-apprunner');

// Load environment
require('dotenv').config();

async function checkEnvVars() {
  try {
    const client = new AppRunnerClient({
      region: 'us-east-1',
      credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID,
        secretAccessKey: process.env.SECRET_ACCESS_KEY
      }
    });

    // Get service ARN from env or config
    const serviceArn = process.env.APPRUNNER_SERVICE_ARN;
    
    console.log('🔍 Checking App Runner Environment Variables...');
    console.log('📋 Service ARN:', serviceArn);
    console.log('');

    const response = await client.send(new DescribeServiceCommand({
      ServiceArn: serviceArn
    }));
    
    const envVars = response.Service.SourceConfiguration?.ImageRepository?.ImageConfiguration?.RuntimeEnvironmentVariables || {};
    
    console.log('📊 Service Status:', response.Service.Status);
    console.log('📊 Total Environment Variables:', Object.keys(envVars).length);
    console.log('');
    
    // Check critical variables
    const criticalVars = [
      'GALLERY_S3_BUCKET',
      'GALLERY_CDN_URL', 
      'FIREBASE_SERVICE_ACCOUNT',
      'CHATBOT_JWT_SECRET',
      'CHATBOT_API_URL',
      'CDN_URL',
      'PROJECT_ID',
      'DATABASE_URL'
    ];
    
    console.log('🔍 Critical Variables Status:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    criticalVars.forEach(varName => {
      const value = envVars[varName];
      if (value) {
        let displayValue = value;
        if (varName.includes('SECRET') || varName.includes('SERVICE_ACCOUNT') || varName.includes('KEY')) {
          displayValue = value.substring(0, 10) + '...[REDACTED]';
        }
        console.log(`✅ ${varName}: ${displayValue}`);
      } else {
        console.log(`❌ ${varName}: NOT SET`);
      }
    });
    
    console.log('');
    
    // Check if GALLERY_S3_BUCKET specifically is missing
    if (!envVars['GALLERY_S3_BUCKET']) {
      console.log('🚨 GALLERY_S3_BUCKET is missing - this is causing the production crash!');
      console.log('💡 Solution: Re-run the environment updater after service stabilizes');
    } else {
      console.log('✅ GALLERY_S3_BUCKET is set - issue might be elsewhere');
    }
    
  } catch (error) {
    console.error('❌ Error checking environment variables:', error.message);
  }
}

checkEnvVars();