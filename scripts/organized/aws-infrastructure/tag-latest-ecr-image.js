#!/usr/bin/env node

/**
 * Tag the most recent ECR image with "latest" tag
 * This fixes the issue where GitHub Actions pushes untagged images
 */

require('dotenv').config();
const { ECRClient, DescribeImagesCommand, PutImageCommand, BatchGetImageCommand } = require('@aws-sdk/client-ecr');

const client = new ECRClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.aws_wavelength_dev_access_key_id,
    secretAccessKey: process.env.aws_wavelength_dev_secret_access_key
  }
});

async function tagLatestImage() {
  try {
    console.log('🔍 Finding most recent ECR image...\n');

    // Get all images
    const describeCommand = new DescribeImagesCommand({
      repositoryName: 'wavelength-lore'
    });

    const describeResponse = await client.send(describeCommand);

    // Sort by push time and get the most recent
    const sortedImages = describeResponse.imageDetails.sort((a, b) =>
      b.imagePushedAt - a.imagePushedAt
    );

    const latestImage = sortedImages[0];

    console.log('📦 Most recent image:');
    console.log(`   Pushed: ${latestImage.imagePushedAt}`);
    console.log(`   Digest: ${latestImage.imageDigest}`);
    console.log(`   Current tags: ${latestImage.imageTags ? latestImage.imageTags.join(', ') : 'none'}`);
    console.log('');

    // Get the image manifest
    const getImageCommand = new BatchGetImageCommand({
      repositoryName: 'wavelength-lore',
      imageIds: [{ imageDigest: latestImage.imageDigest }]
    });

    const getImageResponse = await client.send(getImageCommand);
    const imageManifest = getImageResponse.images[0].imageManifest;

    console.log('🏷️  Tagging image with "latest"...');

    // Tag the image with "latest"
    const putImageCommand = new PutImageCommand({
      repositoryName: 'wavelength-lore',
      imageTag: 'latest',
      imageManifest: imageManifest
    });

    await client.send(putImageCommand);

    console.log('✅ Successfully tagged image with "latest"!');
    console.log('');
    console.log('🚀 App Runner should now detect the new image and deploy automatically.');
    console.log('   Check AWS Console → App Runner → Activity to monitor deployment.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.name === 'ImageNotFoundException') {
      console.error('   Make sure the repository name is correct: wavelength-lore');
    }
    process.exit(1);
  }
}

tagLatestImage();
