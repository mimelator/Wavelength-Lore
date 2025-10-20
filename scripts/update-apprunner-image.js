#!/usr/bin/env node

/**
 * Update App Runner to use the latest ECR image
 * Forces App Runner to pull the newest image by updating the service
 */

require('dotenv').config();
const { AppRunnerClient, DescribeServiceCommand, UpdateServiceCommand } = require('@aws-sdk/client-apprunner');
const { ECRClient, DescribeImagesCommand } = require('@aws-sdk/client-ecr');
const awsConfig = require('../config/aws-resources');

const appRunnerClient = new AppRunnerClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.aws_wavelength_dev_access_key_id,
    secretAccessKey: process.env.aws_wavelength_dev_secret_access_key
  }
});

const ecrClient = new ECRClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.aws_wavelength_dev_access_key_id,
    secretAccessKey: process.env.aws_wavelength_dev_secret_access_key
  }
});

async function updateAppRunnerImage() {
  try {
    console.log('🔄 Updating App Runner to Use Latest ECR Image\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 1. Get the latest image digest from ECR
    console.log('1. Fetching latest image from ECR...');
    const ecrCommand = new DescribeImagesCommand({
      repositoryName: 'wavelength-lore',
      imageIds: [{ imageTag: 'latest' }]
    });

    const ecrResponse = await ecrClient.send(ecrCommand);
    const latestImage = ecrResponse.imageDetails[0];

    console.log(`   ✅ Found image: ${latestImage.imageDigest}`);
    console.log(`   Pushed: ${latestImage.imagePushedAt.toLocaleString()}`);
    console.log(`   Size: ${(latestImage.imageSizeInBytes / 1024 / 1024).toFixed(2)} MB\n`);

    // 2. Get current App Runner service config
    console.log('2. Fetching current App Runner configuration...');
    const describeCommand = new DescribeServiceCommand({
      ServiceArn: awsConfig.appRunner.serviceArn
    });

    const describeResponse = await appRunnerClient.send(describeCommand);
    const service = describeResponse.Service;

    console.log(`   Service: ${service.ServiceName}`);
    console.log(`   Status: ${service.Status}\n`);

    // 3. Update the service to force pull of latest image
    console.log('3. Updating service to pull latest image...');

    // Extract registry ID from existing image identifier
    const currentImageId = service.SourceConfiguration.ImageRepository.ImageIdentifier;
    const registryUrl = currentImageId.split('/')[0]; // e.g., "123456789.dkr.ecr.us-east-1.amazonaws.com"
    const newImageId = `${registryUrl}/wavelength-lore:latest`;

    const updateCommand = new UpdateServiceCommand({
      ServiceArn: awsConfig.appRunner.serviceArn,
      SourceConfiguration: {
        ImageRepository: {
          ImageIdentifier: newImageId,
          ImageRepositoryType: 'ECR',
          ImageConfiguration: {
            Port: '8080',
            RuntimeEnvironmentVariables: service.SourceConfiguration.ImageRepository.ImageConfiguration.RuntimeEnvironmentVariables
          }
        },
        AutoDeploymentsEnabled: true
      }
    });

    const updateResponse = await appRunnerClient.send(updateCommand);

    console.log('   ✅ Service update initiated!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📊 Update Details:');
    console.log(`   Operation ID: ${updateResponse.OperationId}`);
    console.log(`   Service ARN: ${updateResponse.Service.ServiceArn}\n`);

    console.log('🚀 App Runner will now:');
    console.log('   1. Pull the latest image from ECR');
    console.log(`   2. Deploy image: ${latestImage.imageDigest.substring(0, 20)}...`);
    console.log('   3. Start the new container');
    console.log('   4. Run health checks\n');

    console.log('⏱️  This will take approximately 3-5 minutes.\n');
    console.log('Monitor progress:');
    console.log('   - AWS Console → App Runner → Activity');
    console.log('   - Or run: node scripts/watch-apprunner-deployment.js\n');

  } catch (error) {
    console.error('❌ Error:', error.message);

    if (error.message.includes('not authorized')) {
      console.error('\n⚠️  Permission issue - the AWS credentials may not have UpdateService permission.');
    }

    process.exit(1);
  }
}

updateAppRunnerImage();
