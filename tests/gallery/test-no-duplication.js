#!/usr/bin/env node
/**
 * Test: Save to Gallery Should NOT Duplicate Images
 * 
 * Validates that "Save to Gallery" only stores references, not copies.
 */

const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const galleryConfig = require('../../utils/gallery/config');
const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3001';
const TEST_USER_ID = '4fdbYxJHjEP4xksk9sgFE3lgYUs2';

const s3Client = new S3Client({
  region: galleryConfig.AWS_REGION,
  credentials: {
    accessKeyId: galleryConfig.ACCESS_KEY_ID,
    secretAccessKey: galleryConfig.SECRET_ACCESS_KEY
  }
});

const GALLERY_BUCKET = galleryConfig.GALLERY_S3_BUCKET;
const USER_GALLERY_PREFIX = `images/gallery/${TEST_USER_ID}/`;

async function countS3Objects() {
  const command = new ListObjectsV2Command({
    Bucket: GALLERY_BUCKET,
    Prefix: USER_GALLERY_PREFIX
  });
  
  const response = await s3Client.send(command);
  return response.Contents ? response.Contents.length : 0;
}

async function saveImageToGallery() {
  const response = await fetch(`${API_BASE_URL}/gallery/api/user/save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-ID': TEST_USER_ID
    },
    body: JSON.stringify({
      url: 'http://localhost:3001/images/characters/wavelength/alexandria-6.webp',
      title: 'Test Reference',
      sourceUrl: 'http://localhost:3001/test'
    })
  });
  
  return await response.json();
}

async function runTest() {
  console.log('\n=== TEST: Save to Gallery Should NOT Duplicate Images ===\n');
  
  try {
    // Step 1: Count S3 objects BEFORE
    console.log('📊 Step 1: Count S3 objects BEFORE save');
    const beforeCount = await countS3Objects();
    console.log(`   Found: ${beforeCount} objects in ${USER_GALLERY_PREFIX}\n`);
    
    // Step 2: Save image to gallery
    console.log('📊 Step 2: Save image to gallery');
    const result = await saveImageToGallery();
    console.log(`   Result:`, result);
    console.log('');
    
    // Step 3: Count S3 objects AFTER
    console.log('📊 Step 3: Count S3 objects AFTER save');
    const afterCount = await countS3Objects();
    console.log(`   Found: ${afterCount} objects in ${USER_GALLERY_PREFIX}\n`);
    
    // Step 4: VERIFY no new objects created
    if (afterCount > beforeCount) {
      console.log(`❌ FAILED: S3 objects increased from ${beforeCount} to ${afterCount}`);
      console.log(`   Save to Gallery SHOULD NOT duplicate images to S3!`);
      process.exit(1);
    }
    
    console.log(`✅ PASSED: No new S3 objects created`);
    console.log(`   Before: ${beforeCount}, After: ${afterCount}`);
    console.log(`   Save to Gallery correctly stores references only!\n`);
    
  } catch (error) {
    console.error('❌ TEST ERROR:', error.message);
    process.exit(1);
  }
}

runTest();
