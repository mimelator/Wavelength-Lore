#!/usr/bin/env node

require('dotenv').config();
const { AppRunnerClient, DescribeServiceCommand } = require('@aws-sdk/client-apprunner');
const awsConfig = require('../config/aws-resources');

const client = new AppRunnerClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.aws_wavelength_dev_access_key_id,
    secretAccessKey: process.env.aws_wavelength_dev_secret_access_key
  }
});

async function checkSourceConfig() {
  try {
    console.log('🔍 Checking App Runner Source Configuration...\n');
    
    const command = new DescribeServiceCommand({
      ServiceArn: awsConfig.appRunner.serviceArn
    });
    
    const response = await client.send(command);
    const service = response.Service;
    const sourceConfig = service.SourceConfiguration;
    
    console.log('📊 App Runner Configuration:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    if (sourceConfig.CodeRepository) {
      console.log('✅ Source Type: Code Repository (GitHub)');
      console.log(`   Repository: ${sourceConfig.CodeRepository.RepositoryUrl}`);
      console.log(`   Branch: ${sourceConfig.CodeRepository.SourceCodeVersion.Value}`);
      console.log(`   Auto Deploy: ${sourceConfig.AutoDeploymentsEnabled}`);
      console.log('');
      console.log('🔨 Build Configuration:');
      const buildConfig = sourceConfig.CodeRepository.CodeConfiguration?.CodeConfigurationValues;
      if (buildConfig) {
        console.log(`   Runtime: ${buildConfig.Runtime}`);
        console.log(`   Build Command: ${buildConfig.BuildCommand || 'N/A'}`);
        console.log(`   Start Command: ${buildConfig.StartCommand || 'N/A'}`);
        console.log(`   Port: ${buildConfig.Port || 'N/A'}`);
      }
      console.log('');
      console.log('✅ ANSWER: NO manual Docker build needed!');
      console.log('');
      console.log('When you click "Deploy" in AWS Console:');
      console.log('   1. ✅ App Runner pulls latest from GitHub main branch');
      console.log('   2. ✅ Builds a FRESH Docker image automatically');
      console.log('   3. ✅ Applies all environment variables');
      console.log('   4. ✅ Deploys the new container');
      console.log('');
      console.log('🎯 Just click the "Deploy" button - that\'s it!');
      
    } else if (sourceConfig.ImageRepository) {
      console.log('📦 Source Type: Image Repository (ECR)');
      console.log(`   Image: ${sourceConfig.ImageRepository.ImageIdentifier}`);
      console.log(`   Image Type: ${sourceConfig.ImageRepository.ImageRepositoryType}`);
      console.log(`   Auto Deploy: ${sourceConfig.AutoDeploymentsEnabled}`);
      console.log('');
      console.log('⚠️  ANSWER: YES - You need to build & push to ECR first!');
      console.log('');
      console.log('Steps required:');
      console.log('   1. Build Docker image locally or via GitHub Actions');
      console.log('   2. Push image to ECR');
      console.log('   3. App Runner will detect new image and deploy');
      console.log('');
      console.log('Or wait for GitHub Actions to build and push automatically.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkSourceConfig();
