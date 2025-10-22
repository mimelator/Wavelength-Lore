/**
 * Gallery S3 Storage Integration Tests
 * 
 * Tests to verify the S3 storage functionality for gallery images:
 * - Image upload to S3
 * - Image retrieval from S3/CDN
 * - Storage quota enforcement
 * - Image deletion
 */

const fs = require('fs');
const path = require('path');
const { S3Client, HeadObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const galleryStorage = require('../../utils/gallery/storage');
const galleryHelpers = require('../../utils/gallery/helpers');
const fetch = require('node-fetch');
const assert = require('assert');
require('dotenv').config();

// Configure the test parameters
const TEST_USER_ID = 'test-user-123';
const TEST_USER_GROUPS = ['default']; // Test with default quota
const TEST_USER_ADMIN = 'test-admin-123';
const TEST_USER_ADMIN_GROUPS = ['admin']; // Test with unlimited quota
const TEST_IMAGE_PATH = path.join(__dirname, '../fixtures/test-image.jpg');
const TEST_LARGE_IMAGE_PATH = path.join(__dirname, '../fixtures/test-large-image.jpg');

// Create S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY
  }
});

const bucketName = process.env.S3_BUCKET_NAME || 'wavelength-lore-bucket';
const cdnUrl = process.env.CDN_URL || `https://${bucketName}.s3.amazonaws.com`;

// Helper function to clean up test images after tests
async function cleanupTestImages(userId) {
  try {
    console.log(`Cleaning up test images for user ${userId}...`);
    
    // List all objects in the user's gallery folder
    const userImages = await galleryStorage.listUserGalleryImages(userId);
    
    // Delete each image
    for (const image of userImages) {
      await galleryStorage.deleteGalleryImage(userId, image.relativePath);
      console.log(`Deleted test image: ${image.relativePath}`);
    }
    
    console.log('Cleanup complete.');
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

// Helper function to create a test image file of a specific size
async function createTestImageFile(filePath, sizeInMB) {
  return new Promise((resolve, reject) => {
    // Make sure the directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Create a buffer of the specified size (filled with random data)
    const sizeInBytes = sizeInMB * 1024 * 1024;
    const buffer = Buffer.alloc(sizeInBytes);
    
    // Add JPEG header to make it a valid image
    buffer.write('\xFF\xD8\xFF\xE0\x00\x10\x4A\x46\x49\x46\x00', 0);
    
    // Fill the rest with random data
    for (let i = 11; i < sizeInBytes; i++) {
      buffer[i] = Math.floor(Math.random() * 256);
    }
    
    // Write to file
    fs.writeFile(filePath, buffer, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(filePath);
      }
    });
  });
}

// Test 1: Upload an image to S3
async function testImageUploadToS3() {
  console.log('\n----- Test 1: Upload Image to S3 -----');
  
  try {
    // Ensure test image exists
    if (!fs.existsSync(TEST_IMAGE_PATH)) {
      const fixturesDir = path.dirname(TEST_IMAGE_PATH);
      if (!fs.existsSync(fixturesDir)) {
        fs.mkdirSync(fixturesDir, { recursive: true });
      }
      
      // Create a small test image (100KB)
      await createTestImageFile(TEST_IMAGE_PATH, 0.1);
      console.log(`Created test image at ${TEST_IMAGE_PATH}`);
    }
    
    const imageBuffer = fs.readFileSync(TEST_IMAGE_PATH);
    const fileName = path.basename(TEST_IMAGE_PATH);
    
    // Upload the image
    const result = await galleryStorage.uploadGalleryImage(
      imageBuffer,
      fileName,
      'image/jpeg',
      TEST_USER_ID,
      TEST_USER_GROUPS
    );
    
    console.log('Upload result:', result);
    
    // Verify the upload was successful
    assert(result.success, 'Upload should succeed');
    assert(result.url, 'Should return a URL');
    assert(result.url.startsWith(cdnUrl), 'URL should start with CDN URL');
    assert(result.relativePath, 'Should return a relative path');
    assert(result.relativePath.includes(TEST_USER_ID), 'Relative path should include user ID');
    
    console.log('✅ Image successfully uploaded to S3');
    return result;
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Test 2: Verify image is accessible via CDN
async function testImageAccessViaCDN(uploadResult) {
  console.log('\n----- Test 2: Verify Image Access via CDN -----');
  
  try {
    // Check that the image URL is accessible
    const response = await fetch(uploadResult.url);
    
    assert(response.ok, 'CDN URL should be accessible');
    assert(response.status === 200, 'Should return HTTP 200');
    assert(response.headers.get('content-type').startsWith('image/'), 'Should return an image content type');
    
    // Check the content size matches
    const contentLength = parseInt(response.headers.get('content-length'), 10);
    assert(contentLength > 0, 'Image should have content');
    assert(contentLength === uploadResult.size, 'Content length should match uploaded size');
    
    console.log('✅ Image successfully accessible via CDN');
    console.log('CDN URL:', uploadResult.url);
    console.log('Content Type:', response.headers.get('content-type'));
    console.log('Content Length:', contentLength);
    
    // Try HEAD request directly to S3 to verify metadata
    const headCommand = new HeadObjectCommand({
      Bucket: bucketName,
      Key: uploadResult.relativePath
    });
    
    const headResult = await s3Client.send(headCommand);
    
    assert(headResult.Metadata['uploaded-by'] === TEST_USER_ID, 'Metadata should contain user ID');
    
    console.log('✅ S3 metadata verified');
    console.log('Metadata:', headResult.Metadata);
    
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Test 3: Storage quota enforcement
async function testStorageQuotaEnforcement() {
  console.log('\n----- Test 3: Storage Quota Enforcement -----');
  
  try {
    // Get the quota for the test user
    const userQuota = galleryStorage.GROUP_QUOTAS['default'];
    console.log(`Test user quota: ${userQuota / (1024 * 1024)} MB`);
    
    // Create a large test image that exceeds the quota
    const largeFileSizeMB = (userQuota / (1024 * 1024)) + 1; // 1MB more than quota
    await createTestImageFile(TEST_LARGE_IMAGE_PATH, largeFileSizeMB);
    console.log(`Created large test image (${largeFileSizeMB} MB) at ${TEST_LARGE_IMAGE_PATH}`);
    
    // Try to upload the large image
    const imageBuffer = fs.readFileSync(TEST_LARGE_IMAGE_PATH);
    const fileName = path.basename(TEST_LARGE_IMAGE_PATH);
    
    // First check the quota
    const quotaCheck = await galleryStorage.checkUserQuota(
      TEST_USER_ID,
      TEST_USER_GROUPS,
      imageBuffer.length
    );
    
    console.log('Quota check result:', quotaCheck);
    assert(!quotaCheck.allowed, 'Should not allow upload exceeding quota');
    
    // Try the full upload which should fail
    const result = await galleryStorage.uploadGalleryImage(
      imageBuffer,
      fileName,
      'image/jpeg',
      TEST_USER_ID,
      TEST_USER_GROUPS
    );
    
    console.log('Upload result:', result);
    assert(!result.success, 'Upload should fail due to quota');
    assert(result.error === 'Storage quota exceeded', 'Error should mention quota');
    
    // Now try with an admin user who has unlimited quota
    const adminQuotaCheck = await galleryStorage.checkUserQuota(
      TEST_USER_ADMIN,
      TEST_USER_ADMIN_GROUPS,
      imageBuffer.length
    );
    
    console.log('Admin quota check result:', adminQuotaCheck);
    assert(adminQuotaCheck.allowed, 'Admin should be allowed unlimited quota');
    assert(adminQuotaCheck.quota === -1, 'Admin quota should be unlimited (-1)');
    
    console.log('✅ Storage quota enforcement verified');
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    // Clean up the large test file
    if (fs.existsSync(TEST_LARGE_IMAGE_PATH)) {
      fs.unlinkSync(TEST_LARGE_IMAGE_PATH);
    }
  }
}

// Test 4: Gallery image listing
async function testGalleryImageListing() {
  console.log('\n----- Test 4: Gallery Image Listing -----');
  
  try {
    // List images for the test user
    const userImages = await galleryStorage.listUserGalleryImages(TEST_USER_ID);
    
    console.log(`Found ${userImages.length} images for user ${TEST_USER_ID}`);
    assert(userImages.length > 0, 'Should have at least one test image');
    
    // Verify image properties
    const image = userImages[0];
    assert(image.url, 'Image should have URL');
    assert(image.relativePath, 'Image should have relativePath');
    assert(image.fileName, 'Image should have fileName');
    assert(image.size > 0, 'Image should have size');
    
    console.log('✅ Gallery image listing verified');
    return userImages;
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Test 5: Image deletion
async function testImageDeletion(userImages) {
  console.log('\n----- Test 5: Image Deletion -----');
  
  try {
    if (!userImages || userImages.length === 0) {
      throw new Error('No images to delete');
    }
    
    const imageToDelete = userImages[0];
    console.log('Deleting image:', imageToDelete.fileName);
    
    // Delete the image
    const result = await galleryStorage.deleteGalleryImage(TEST_USER_ID, imageToDelete.relativePath);
    
    console.log('Deletion result:', result);
    assert(result.success, 'Deletion should succeed');
    
    // Verify the image is no longer accessible
    try {
      const headCommand = new HeadObjectCommand({
        Bucket: bucketName,
        Key: imageToDelete.relativePath
      });
      
      await s3Client.send(headCommand);
      assert(false, 'Image should not exist after deletion');
    } catch (error) {
      // This is expected - the image should not exist
      assert(error.name === 'NotFound', 'Should get NotFound error');
    }
    
    // List images again and verify the deleted image is gone
    const updatedUserImages = await galleryStorage.listUserGalleryImages(TEST_USER_ID);
    const deletedImageExists = updatedUserImages.some(img => img.relativePath === imageToDelete.relativePath);
    assert(!deletedImageExists, 'Deleted image should not appear in listing');
    
    console.log('✅ Image deletion verified');
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Test 6: Save content image to gallery
async function testSaveContentImageToGallery() {
  console.log('\n----- Test 6: Save Content Image to Gallery -----');
  
  try {
    // Use a sample image URL from the site
    const sampleImageUrl = `${cdnUrl}/images/characters/wavelength/lucky-1.webp`;
    const imageTitle = 'Test Content Image';
    const sourceUrl = '/characters/lucky';
    
    // Save the image to the gallery
    const result = await galleryHelpers.saveContentImageToUserGallery(
      sampleImageUrl,
      imageTitle,
      sourceUrl,
      TEST_USER_ID,
      TEST_USER_GROUPS
    );
    
    console.log('Save result:', result);
    assert(result.success, 'Save should succeed');
    assert(result.url, 'Should return a URL');
    assert(result.url.startsWith(cdnUrl), 'URL should start with CDN URL');
    
    // Verify the image exists in S3
    const headCommand = new HeadObjectCommand({
      Bucket: bucketName,
      Key: result.relativePath
    });
    
    const headResult = await s3Client.send(headCommand);
    assert(headResult.ContentLength > 0, 'Image should have content');
    
    console.log('✅ Content image successfully saved to gallery');
    return result;
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run all tests
async function runAllTests() {
  console.log('Starting gallery S3 storage integration tests...');
  console.log('Using S3 bucket:', bucketName);
  console.log('Using CDN URL:', cdnUrl);
  
  try {
    // Clean up any existing test images first
    await cleanupTestImages(TEST_USER_ID);
    await cleanupTestImages(TEST_USER_ADMIN);
    
    // Run tests in sequence
    const uploadResult = await testImageUploadToS3();
    await testImageAccessViaCDN(uploadResult);
    await testStorageQuotaEnforcement();
    const userImages = await testGalleryImageListing();
    await testImageDeletion(userImages);
    await testSaveContentImageToGallery();
    
    console.log('\n✅ All tests passed successfully!');
  } catch (error) {
    console.error('\n❌ Tests failed:', error);
    process.exit(1);
  } finally {
    // Clean up all test images
    await cleanupTestImages(TEST_USER_ID);
    await cleanupTestImages(TEST_USER_ADMIN);
    
    // Clean up test fixture
    if (fs.existsSync(TEST_IMAGE_PATH)) {
      fs.unlinkSync(TEST_IMAGE_PATH);
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testImageUploadToS3,
  testImageAccessViaCDN,
  testStorageQuotaEnforcement,
  testGalleryImageListing,
  testImageDeletion,
  testSaveContentImageToGallery,
  runAllTests
};