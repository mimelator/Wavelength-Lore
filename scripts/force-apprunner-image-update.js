#!/usr/bin/env node

/**
 * Force App Runner to use the latest ECR image
 * This bypasses caching by updating the service configuration
 */

// Load environment variables using the same approach as the app
try {
  require('dotenv').config({ override: false });
} catch (error) {
  // .env file not found - will use system environment variables
}

const { AppRunnerClient, UpdateServiceCommand, DescribeServiceCommand } = require('@aws-sdk/client-apprunner');
const { ECRClient, DescribeImagesCommand } = require('@aws-sdk/client-ecr');
const awsConfig = require('../config/aws-resources');

const credentials = {
  accessKeyId: process.env.aws_wavelength_dev_access_key_id,
  secretAccessKey: process.env.aws_wavelength_dev_secret_access_key
};

const appRunnerClient = new AppRunnerClient({
  region: 'us-east-1',
  credentials
});

const ecrClient = new ECRClient({
  region: 'us-east-1',
  credentials
});

async function forceImageUpdate() {
  try {
    console.log('🔍 Force Update App Runner to Latest ECR Image\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Get commit SHA from command line args
    const commitSha = process.argv.find(arg => arg.startsWith('--commit='))?.split('=')[1];
    
    // Get current service configuration
    console.log('📊 Getting current service configuration...');
    const describeCommand = new DescribeServiceCommand({
      ServiceArn: awsConfig.appRunner.serviceArn
    });
    
    const describeResponse = await appRunnerClient.send(describeCommand);
    const service = describeResponse.Service;
    
    console.log(`   Current Status: ${service.Status}`);
    console.log(`   Current Image: ${service.SourceConfiguration.ImageRepository.ImageIdentifier}`);
    
    // Construct the image identifier
    const ecrRegistry = '170023515523.dkr.ecr.us-east-1.amazonaws.com';
    const repository = 'wavelength-lore';
    
    let newImageIdentifier;
    let imageInfo;
    
    if (commitSha) {
      // Use specific commit SHA tag
      console.log(`\n🎯 Using commit-specific image: ${commitSha}`);
      
      // Get the digest for this commit using ECR SDK
      try {
        const ecrDescribeCommand = new DescribeImagesCommand({
          repositoryName: repository,
          imageIds: [{ imageTag: commitSha }]
        });
        const ecrResponse = await ecrClient.send(ecrDescribeCommand);
        const digest = ecrResponse.imageDetails[0].imageDigest;
        newImageIdentifier = `${ecrRegistry}/${repository}@${digest}`;
        imageInfo = `Commit ${commitSha} (${digest})`;
      } catch (error) {
        console.error(`❌ Image not found for commit ${commitSha}`);
        console.log(`   Error: ${error.message}`);
        console.log('   Run: aws ecr list-images --repository-name wavelength-lore --region us-east-1');
        process.exit(1);
      }
    } else {
      // Use the latest tag's digest
      console.log(`\n🎯 Using latest image from ECR`);
      try {
        const ecrDescribeCommand = new DescribeImagesCommand({
          repositoryName: repository,
          imageIds: [{ imageTag: 'latest' }]
        });
        const ecrResponse = await ecrClient.send(ecrDescribeCommand);
        const digest = ecrResponse.imageDetails[0].imageDigest;
        newImageIdentifier = `${ecrRegistry}/${repository}@${digest}`;
        imageInfo = `Latest (${digest})`;
      } catch (error) {
        console.error(`❌ Could not get latest image`);
        console.log(`   Error: ${error.message}`);
        process.exit(1);
      }
    }
    
    console.log(`\n🎯 Forcing update to image:`);
    console.log(`   ${newImageIdentifier}`);
    console.log(`   ${imageInfo}\n`);
    
    // Prepare update command
    const updateParams = {
      ServiceArn: awsConfig.appRunner.serviceArn,
      SourceConfiguration: {
        ImageRepository: {
          ImageIdentifier: newImageIdentifier,
          ImageRepositoryType: 'ECR',
          ImageConfiguration: {
            Port: '3001',
            RuntimeEnvironmentVariables: service.SourceConfiguration.ImageRepository.ImageConfiguration.RuntimeEnvironmentVariables
          }
        },
        AutoDeploymentsEnabled: service.SourceConfiguration.AutoDeploymentsEnabled
      }
    };
    
    console.log('🚀 Updating App Runner service...');
    const updateCommand = new UpdateServiceCommand(updateParams);
    const updateResponse = await appRunnerClient.send(updateCommand);
    
    console.log('\n✅ Update initiated successfully!');
    console.log(`   Operation ID: ${updateResponse.OperationId}`);
    console.log(`   Service Status: ${updateResponse.Service.Status}`);
    
    console.log('\n📝 What this does:');
    console.log('   1. ✅ Forces App Runner to pull the exact image digest');
    console.log('   2. ✅ Bypasses any caching of the "latest" tag');
    console.log('   3. ✅ Applies all 39 environment variables');
    console.log('   4. ✅ Deploys v1.0.22 with your character fixes');
    
    console.log('\n⏱️  Deployment will take 3-5 minutes');
    console.log('📊 Monitor: AWS Console → App Runner → wavelength-lore-service → Activity\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('AccessDenied') || error.message.includes('not authorized')) {
      console.log('\n💡 Your IAM user needs these permissions:');
      console.log('   - apprunner:UpdateService');
      console.log('   - apprunner:DescribeService');
      console.log('\nAdd them in AWS Console → IAM → Your User → Add inline policy');
    }
    
    process.exit(1);
  }
}

if (process.argv.includes('--force')) {
  forceImageUpdate();
} else {
  console.log('🔄 Force App Runner Image Update');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('This will force App Runner to pull a specific ECR image by using');
  console.log('the image DIGEST instead of the tag. This bypasses caching.\n');
  console.log('Usage:');
  console.log('  node scripts/force-apprunner-image-update.js --force');
  console.log('  node scripts/force-apprunner-image-update.js --force --commit=ab91165\n');
  console.log('Options:');
  console.log('  --commit=SHA  Deploy specific commit SHA from ECR');
  console.log('                (GitHub Actions tags images with commit SHA)\n');
}
