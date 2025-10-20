#!/usr/bin/env node

require('dotenv').config();
const { ECRClient, DescribeImagesCommand } = require('@aws-sdk/client-ecr');

const client = new ECRClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.aws_wavelength_dev_access_key_id,
    secretAccessKey: process.env.aws_wavelength_dev_secret_access_key
  }
});

async function checkImages() {
  try {
    console.log('🔍 Checking ECR Repository...\n');

    // Get images with "latest" tag specifically
    const latestCommand = new DescribeImagesCommand({
      repositoryName: 'wavelength-lore',
      imageIds: [{ imageTag: 'latest' }]
    });

    try {
      const latestResponse = await client.send(latestCommand);
      if (latestResponse.imageDetails.length > 0) {
        const latestImg = latestResponse.imageDetails[0];
        console.log('✅ "latest" tag found:');
        console.log(`   Pushed: ${latestImg.imagePushedAt}`);
        console.log(`   Digest: ${latestImg.imageDigest.substring(0, 20)}...`);
        console.log(`   Size: ${(latestImg.imageSizeInBytes / 1024 / 1024).toFixed(2)} MB`);
        console.log('');
      }
    } catch (error) {
      console.log('❌ No "latest" tag found!\n');
    }

    // Get all recent images
    const command = new DescribeImagesCommand({
      repositoryName: 'wavelength-lore',
      maxResults: 5
    });

    const response = await client.send(command);

    console.log('📦 Latest ECR Images:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    response.imageDetails
      .sort((a, b) => b.imagePushedAt - a.imagePushedAt)
      .forEach((img, idx) => {
        console.log(`${idx + 1}. Tags: ${img.imageTags ? img.imageTags.join(', ') : 'none'}`);
        console.log(`   Pushed: ${img.imagePushedAt}`);
        console.log(`   Digest: ${img.imageDigest.substring(0, 20)}...`);
        console.log(`   Size: ${(img.imageSizeInBytes / 1024 / 1024).toFixed(2)} MB`);
        console.log('');
      });

    console.log('💡 App Runner is watching the "latest" tag');
    console.log('   If "latest" is old, the GitHub Action may have failed');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkImages();
