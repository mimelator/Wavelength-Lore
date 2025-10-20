#!/usr/bin/env node

/**
 * Wait for App Runner to finish current operation, then deploy
 */

// Load environment variables
try {
  require('dotenv').config({ override: false });
} catch (error) {
  // .env file not found
}

const { AppRunnerClient, DescribeServiceCommand } = require('@aws-sdk/client-apprunner');
const { execSync } = require('child_process');
const awsConfig = require('../config/aws-resources');

const client = new AppRunnerClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.aws_wavelength_dev_access_key_id,
    secretAccessKey: process.env.aws_wavelength_dev_secret_access_key
  }
});

async function waitForAppRunner() {
  console.log('⏳ Waiting for App Runner to finish current operation...\n');
  
  const maxWait = 600; // 10 minutes
  const interval = 10; // Check every 10 seconds
  let elapsed = 0;
  
  while (elapsed < maxWait) {
    try {
      const command = new DescribeServiceCommand({
        ServiceArn: awsConfig.appRunner.serviceArn
      });
      
      const response = await client.send(command);
      const status = response.Service.Status;
      const imageId = response.Service.SourceConfiguration.ImageRepository.ImageIdentifier;
      
      console.log(`   [${elapsed}s] Status: ${status}`);
      
      if (status === 'RUNNING') {
        console.log(`\n✅ Service is RUNNING`);
        console.log(`   Current Image: ${imageId}`);
        console.log(`\n🚀 Ready to deploy! Run:`);
        console.log(`   node scripts/force-apprunner-image-update.js --force --commit=ab911658\n`);
        return;
      } else if (status === 'OPERATION_IN_PROGRESS') {
        // Keep waiting
      } else {
        console.log(`\n⚠️  Unexpected status: ${status}`);
      }
      
    } catch (error) {
      console.error(`   Error: ${error.message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, interval * 1000));
    elapsed += interval;
  }
  
  console.log(`\n❌ Timeout after ${maxWait}s`);
}

waitForAppRunner();
