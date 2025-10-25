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

async function listAllImages() {
  try {
    console.log('🔍 Fetching ALL ECR images...\n');

    const command = new DescribeImagesCommand({
      repositoryName: 'wavelength-lore',
      maxResults: 100
    });

    const response = await client.send(command);

    console.log('📦 All ECR Images:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    response.imageDetails
      .sort((a, b) => b.imagePushedAt - a.imagePushedAt)
      .forEach((img, idx) => {
        console.log(`${idx + 1}. Pushed: ${img.imagePushedAt.toISOString()}`);
        console.log(`   Tags: ${img.imageTags ? img.imageTags.join(', ') : 'none'}`);
        console.log(`   Digest: ${img.imageDigest}`);
        console.log(`   Size: ${(img.imageSizeInBytes / 1024 / 1024).toFixed(2)} MB`);
        console.log('');
      });

    console.log(`\nTotal images: ${response.imageDetails.length}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

listAllImages();
