/**
 * GALLERY NO-DUPLICATION TEST
 * 
 * CRITICAL: This test validates that "Save to Gallery" does NOT duplicate images to S3
 * 
 * Expected behavior:
 * 1. User saves content image to their gallery
 * 2. System stores REFERENCE ONLY in Firebase (original URL)
 * 3. NO files are uploaded to s3://wavelength-gallery-346923/images/gallery/{userId}/
 * 4. User can view/download the image from its ORIGINAL location
 * 
 * FAILURE CRITERIA:
 * - ANY new files appear in user's S3 gallery directory after save
 * - Image URL in Firebase points to user's S3 directory instead of original location
 */

const fetch = require('node-fetch');
const { ListObjectsV2Command, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const galleryStorage = require('../../utils/gallery/storage');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3001';
const TEST_USER_ID = '4fdbYxJHjEP4xksk9sgFE3lgYUs2';
const USER_S3_PREFIX = `images/gallery/${TEST_USER_ID}/`;

// Use the app's S3 client and bucket from gallery storage
const s3Client = galleryStorage.s3Client;
const bucketName = galleryStorage.bucketName;

/**
 * Get list of files in user's S3 gallery directory
 */
async function listUserS3Files() {
  try {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: USER_S3_PREFIX
    });
    const response = await s3Client.send(command);
    return response.Contents || [];
  } catch (error) {
    console.error('❌ Error listing S3 files:', error);
    throw error;
  }
}

/**
 * Clean up user's S3 directory (test setup)
 */
async function cleanupUserS3() {
  const files = await listUserS3Files();
  console.log(`🧹 Cleaning up ${files.length} files from user S3 directory...`);
  
  for (const file of files) {
    try {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: file.Key
      });
      await s3Client.send(deleteCommand);
      console.log(`   ✅ Deleted: ${file.Key}`);
    } catch (error) {
      console.error(`   ❌ Failed to delete ${file.Key}:`, error);
    }
  }
}

/**
 * Get user's gallery images from API
 */
async function getUserGalleryImages() {
  const response = await fetch(`${BASE_URL}/api/gallery/user/images`, {
    headers: {
      'Cookie': `userId=${TEST_USER_ID}`
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to get gallery images: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.images || [];
}

/**
 * Save a content image to gallery
 */
async function saveContentImage(imageUrl, title) {
  const response = await fetch(`${BASE_URL}/gallery/api/user/save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `userId=${TEST_USER_ID}`
    },
    body: JSON.stringify({
      url: imageUrl,  // Note: endpoint expects 'url' not 'imageUrl'
      title,
      sourceUrl: ''
    })
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to save image: ${response.status} ${response.statusText}\n${text}`);
  }
  
  const data = await response.json();
  return data.image || data;  // Handle nested response
}

/**
 * Delete image from gallery
 */
async function deleteGalleryImage(imageId) {
  const response = await fetch(`${BASE_URL}/api/gallery/user/delete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `userId=${TEST_USER_ID}`
    },
    body: JSON.stringify({
      bookmarkId: imageId  // Delete by bookmark ID
    })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to delete image: ${response.status}`);
  }
  
  return await response.json();
}

/**
 * Main test execution
 */
async function runTest() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🧪 GALLERY NO-DUPLICATION TEST');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  let testPassed = true;
  let savedImageId = null;
  
  try {
    // STEP 1: Clean up user's S3 directory
    console.log('📋 STEP 1: Clean up user S3 directory');
    await cleanupUserS3();
    const beforeFiles = await listUserS3Files();
    console.log(`✅ User S3 directory clean (${beforeFiles.length} files)\n`);
    
    // STEP 2: Get baseline S3 file count
    console.log('📋 STEP 2: Get baseline S3 file count');
    const baselineCount = beforeFiles.length;
    console.log(`📊 Baseline S3 files: ${baselineCount}\n`);
    
    // STEP 3: Find a content image to save
    console.log('📋 STEP 3: Find content image to save');
    const testImageUrl = `${BASE_URL}/images/characters/wavelength/alexandria-1.webp`;
    const testTitle = 'Test Alexandria Image';
    console.log(`🖼️  Using: ${testImageUrl}`);
    console.log(`📝 Title: ${testTitle}\n`);
    
    // STEP 4: Save image to gallery
    console.log('📋 STEP 4: Save image to gallery');
    const saveResult = await saveContentImage(testImageUrl, testTitle);
    console.log(`✅ Saved with ID: ${saveResult.id}`);
    console.log(`📊 Returned URL: ${saveResult.url}`);
    savedImageId = saveResult.id;
    
    // VALIDATION 1: URL should be original, not S3 user directory
    if (saveResult.url.includes(`/gallery/${TEST_USER_ID}/`)) {
      console.error(`❌ FAILED: URL points to user S3 directory!`);
      console.error(`   Expected: Original URL (${testImageUrl})`);
      console.error(`   Got: ${saveResult.url}`);
      testPassed = false;
    } else if (saveResult.url === testImageUrl) {
      console.log(`✅ URL is original (not duplicated to S3)`);
    } else {
      console.log(`⚠️  URL changed but not to user directory: ${saveResult.url}`);
    }
    console.log('');
    
    // STEP 5: Check S3 for new files
    console.log('📋 STEP 5: Validate NO new S3 files created');
    const afterFiles = await listUserS3Files();
    const newFileCount = afterFiles.length - baselineCount;
    
    console.log(`📊 Files before: ${baselineCount}`);
    console.log(`📊 Files after: ${afterFiles.length}`);
    console.log(`📊 New files: ${newFileCount}`);
    
    if (newFileCount > 0) {
      console.error(`\n❌ FAILED: ${newFileCount} new file(s) created in S3!`);
      console.error(`\n🚨 DUPLICATION DETECTED - Files in user S3 directory:`);
      afterFiles.forEach(file => {
        console.error(`   - ${file.Key} (${file.Size} bytes)`);
      });
      testPassed = false;
    } else {
      console.log(`✅ PASSED: No new files in S3 user directory`);
    }
    console.log('');
    
    // STEP 6: Verify bookmark in Firebase (not S3)
    console.log('📋 STEP 6: Verify bookmark saved to Firebase');
    const galleryImages = await getUserGalleryImages();
    const savedImage = galleryImages.find(img => img.id === savedImageId || img.url === testImageUrl);
    
    if (!savedImage) {
      console.error(`❌ FAILED: Bookmark not found in gallery!`);
      testPassed = false;
    } else {
      console.log(`✅ Bookmark found in gallery`);
      console.log(`📊 URL: ${savedImage.url}`);
      console.log(`📊 Title: ${savedImage.title}`);
      console.log(`📊 Type: ${savedImage.type || 'unknown'}`);
      
      // VALIDATION 2: Should be a bookmark, not uploaded
      if (savedImage.type === 'bookmark') {
        console.log(`✅ Correctly marked as bookmark (not uploaded)`);
      } else {
        console.error(`❌ FAILED: Image type is '${savedImage.type}', expected 'bookmark'`);
        testPassed = false;
      }
      
      // VALIDATION 3: URL should be original
      if (savedImage.url === testImageUrl) {
        console.log(`✅ URL matches original (no S3 duplication)`);
      } else {
        console.error(`❌ FAILED: URL doesn't match original!`);
        console.error(`   Expected: ${testImageUrl}`);
        console.error(`   Got: ${savedImage.url}`);
        testPassed = false;
      }
      
      // Update savedImageId for cleanup
      savedImageId = savedImage.id;
    }
    console.log('');
    
    // STEP 7: Final S3 validation
    console.log('📋 STEP 7: Verify image is accessible from original URL');
    const imageResponse = await fetch(savedImage ? savedImage.url : testImageUrl);
    if (imageResponse.ok) {
      const size = parseInt(imageResponse.headers.get('content-length') || '0');
      console.log(`✅ Image accessible (${size} bytes)`);
    } else {
      console.error(`❌ FAILED: Image not accessible: ${imageResponse.status}`);
      testPassed = false;
    }
    console.log('');
    
  } catch (error) {
    console.error('\n❌ TEST ERROR:', error.message);
    console.error(error.stack);
    testPassed = false;
  } finally {
    // CLEANUP: Delete test image from gallery
    if (savedImageId) {
      console.log('🧹 CLEANUP: Deleting test image from gallery');
      try {
        await deleteGalleryImage(savedImageId);
        console.log(`✅ Deleted image ${savedImageId}\n`);
      } catch (cleanupError) {
        console.error(`⚠️  Failed to cleanup: ${cleanupError.message}\n`);
      }
    }
  }
  
  // Final result
  console.log('═══════════════════════════════════════════════════════════');
  if (testPassed) {
    console.log('✅ TEST PASSED: No S3 duplication detected');
  } else {
    console.log('❌ TEST FAILED: S3 duplication detected or validation errors');
  }
  console.log('═══════════════════════════════════════════════════════════');
  
  process.exit(testPassed ? 0 : 1);
}

// Run the test
runTest();
