#!/usr/bin/env node

/**
 * Tag a specific ECR image by selecting it from a list
 * Usage: node scripts/tag-ecr-image-by-time.js [--index=N]
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

async function tagSpecificImage() {
  try {
    // Parse command line args
    const args = process.argv.slice(2);
    const indexArg = args.find(arg => arg.startsWith('--index='));
    const targetIndex = indexArg ? parseInt(indexArg.split('=')[1]) - 1 : 0;

    console.log('🔍 Fetching recent ECR images...\n');

    // Get all images
    const describeCommand = new DescribeImagesCommand({
      repositoryName: 'wavelength-lore',
      maxResults: 20
    });

    const describeResponse = await client.send(describeCommand);

    // Sort by push time (newest first)
    const sortedImages = describeResponse.imageDetails.sort((a, b) =>
      b.imagePushedAt - a.imagePushedAt
    );

    console.log('📦 Recent ECR Images:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    sortedImages.slice(0, 10).forEach((img, idx) => {
      const marker = idx === targetIndex ? '👉 ' : '   ';
      console.log(`${marker}${idx + 1}. Pushed: ${img.imagePushedAt.toISOString()}`);
      console.log(`${marker}   Tags: ${img.imageTags ? img.imageTags.join(', ') : 'none'}`);
      console.log(`${marker}   Digest: ${img.imageDigest.substring(0, 30)}...`);
      console.log(`${marker}   Size: ${(img.imageSizeInBytes / 1024 / 1024).toFixed(2)} MB`);
      console.log('');
    });

    const targetImage = sortedImages[targetIndex];

    if (!targetImage) {
      console.error(`❌ No image found at index ${targetIndex + 1}`);
      process.exit(1);
    }

    console.log(`\n🏷️  Tagging image #${targetIndex + 1} with "latest"...\n`);

    // Get the image manifest
    const getImageCommand = new BatchGetImageCommand({
      repositoryName: 'wavelength-lore',
      imageIds: [{ imageDigest: targetImage.imageDigest }]
    });

    const getImageResponse = await client.send(getImageCommand);
    const imageManifest = getImageResponse.images[0].imageManifest;

    // Tag with "latest"
    const putImageCommand = new PutImageCommand({
      repositoryName: 'wavelength-lore',
      imageTag: 'latest',
      imageManifest: imageManifest
    });

    await client.send(putImageCommand);

    console.log('✅ Successfully tagged image with "latest"!');
    console.log('');
    console.log('📊 Tagged Image Details:');
    console.log(`   Pushed: ${targetImage.imagePushedAt.toISOString()}`);
    console.log(`   Digest: ${targetImage.imageDigest}`);
    console.log(`   Size: ${(targetImage.imageSizeInBytes / 1024 / 1024).toFixed(2)} MB`);
    console.log('');
    console.log('🚀 App Runner should now detect this image and deploy automatically.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

console.log('📌 Tag Specific ECR Image');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

tagSpecificImage();
