#!/usr/bin/env node

/**
 * Verify which image App Runner should be pulling
 * Shows the exact digest of the 'latest' tag that App Runner will deploy
 */

require('dotenv').config();
const { ECRClient, DescribeImagesCommand } = require('@aws-sdk/client-ecr');

const client = new ECRClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.aws_wavelength_dev_access_key_id,
    secretAccessKey: process.env.aws_wavelength_dev_secret_access_key
  }
});

async function verifyDeploymentImage() {
  try {
    console.log('🔍 Verifying App Runner Deployment Image\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Get the current 'latest' tag details
    const command = new DescribeImagesCommand({
      repositoryName: 'wavelength-lore',
      imageIds: [{ imageTag: 'latest' }]
    });

    const response = await client.send(command);
    const img = response.imageDetails[0];

    console.log('📦 ECR Image Details (what App Runner will pull):\n');
    console.log('Repository URI:');
    console.log('  XXX.dkr.ecr.us-east-1.amazonaws.com/wavelength-lore:latest\n');

    console.log('Image Digest (unique identifier):');
    console.log(`  ${img.imageDigest}\n`);

    console.log('Pushed At:');
    console.log(`  ${img.imagePushedAt.toISOString()}`);
    console.log(`  ${img.imagePushedAt.toLocaleString()}\n`);

    console.log('Image Size:');
    console.log(`  ${(img.imageSizeInBytes / 1024 / 1024).toFixed(2)} MB\n`);

    console.log('Tags:');
    console.log(`  ${img.imageTags ? img.imageTags.join(', ') : 'none'}\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✅ This is the image App Runner is deploying right now!\n');

    console.log('To verify after deployment:');
    console.log('1. Check App Runner logs for startup messages');
    console.log('2. Look for: "=== Container Starting ==="');
    console.log('3. Verify it shows: "Environment: NODE_ENV=production"');
    console.log('4. Check that Node.js starts successfully\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifyDeploymentImage();
