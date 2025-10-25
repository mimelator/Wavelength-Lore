#!/usr/bin/env node

require('dotenv').config();
const { AppRunnerClient, DescribeServiceCommand } = require('@aws-sdk/client-apprunner');
const awsConfig = require('../config/aws-resources');

const client = new AppRunnerClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY
  }
});

async function checkEnvVars() {
  try {
    console.log('🔍 Checking App Runner Environment Variables...\n');
    
    const command = new DescribeServiceCommand({
      ServiceArn: awsConfig.appRunner.serviceArn
    });
    
    const response = await client.send(command);
    const envVars = response.Service.SourceConfiguration?.ImageRepository?.ImageConfiguration?.RuntimeEnvironmentVariables || {};
    
    console.log('📊 App Runner Environment Variables:');
    console.log(`Total variables: ${Object.keys(envVars).length}\n`);
    
    if (Object.keys(envVars).length === 0) {
      console.log('❌ NO ENVIRONMENT VARIABLES FOUND!');
      console.log('\nThis is the problem - App Runner has no environment variables configured.');
      console.log('You need to run: node scripts/apprunner-env-updater.js --force');
    } else {
      console.log('Variables present:');
      Object.keys(envVars).sort().forEach(key => {
        const value = envVars[key];
        const masked = (key.includes('KEY') || key.includes('SECRET') || key.includes('PASSWORD')) 
          ? '****' 
          : (value && value.length > 20 ? value.substring(0, 20) + '...' : value);
        console.log(`  ✓ ${key}: ${masked}`);
      });
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkEnvVars();
