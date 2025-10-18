/**
 * Comprehensive Delete Functionality Test
 * 
 * Tests the complete deletion workflow:
 * 1. Creates a post with file attachment
 * 2. Adds a reply to the post
 * 3. Verifies files are uploaded to S3
 * 4. Deletes the reply and verifies cleanup
 * 5. Deletes the post and verifies S3 attachment cleanup
 * 6. Validates all data is properly removed from Firebase
 */

const axios = require('axios');
const admin = require('firebase-admin');
const { S3Client, HeadObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:3001';
const TEST_USER_EMAIL = 'test@example.com';
const TEST_USER_PASSWORD = 'testpassword123';

// Initialize Firebase Admin for testing
let adminApp;
let adminDatabase;
let s3Client;

// Test state
let testUser = null;
let testPost = null;
let testReply = null;
let uploadedFiles = [];
let idToken = null;

/**
 * Initialize test environment
 */
async function initializeTest() {
  console.log('🔧 Initializing test environment...');
  
  try {
    // Initialize Firebase Admin if not already done
    if (!adminApp) {
      const serviceAccountPath = path.join(__dirname, '../firebaseServiceAccountKey.json');
      adminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccountPath),
        databaseURL: process.env.DATABASE_URL,
        storageBucket: process.env.STORAGE_BUCKET
      }, 'test-admin');
      adminDatabase = adminApp.database();
    }

    // Initialize S3 client
    s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });

    console.log('✅ Test environment initialized');
  } catch (error) {
    console.error('❌ Failed to initialize test environment:', error.message);
    throw error;
  }
}

/**
 * Create a test file for upload
 */
function createTestFile() {
  const testContent = `Test file created at ${new Date().toISOString()}\nThis is test content for attachment validation.`;
  const testFilePath = path.join(__dirname, 'test-attachment.txt');
  fs.writeFileSync(testFilePath, testContent);
  return testFilePath;
}

/**
 * Get Firebase ID token for authentication
 * In a real test, you'd use Firebase Auth to get a real token
 * For this test, we'll simulate getting a token
 */
async function getAuthToken() {
  console.log('🎫 Getting authentication token...');
  
  try {
    // Create a custom token for testing (you'd normally use Firebase Auth)
    const customToken = await admin.auth(adminApp).createCustomToken('test-user-uid', {
      email: TEST_USER_EMAIL,
      name: 'Test User'
    });
    
    // In a real scenario, you'd exchange this for an ID token
    // For testing purposes, we'll create a mock token
    // Note: This is a simplified approach for testing
    console.log('✅ Authentication token created');
    return customToken; // In practice, you'd get the actual ID token from Firebase Auth
  } catch (error) {
    console.error('❌ Failed to get auth token:', error.message);
    throw error;
  }
}

/**
 * Create a post with attachment
 */
async function createPostWithAttachment() {
  console.log('📝 Creating post with attachment...');
  
  try {
    const testFilePath = createTestFile();
    const formData = new FormData();
    
    // Add post data
    formData.append('title', 'Test Post for Deletion');
    formData.append('content', 'This is a test post that will be deleted to validate cleanup functionality.');
    formData.append('category', 'general');
    formData.append('type', 'discussion');
    
    // Add file attachment
    formData.append('attachments', fs.createReadStream(testFilePath), {
      filename: 'test-attachment.txt',
      contentType: 'text/plain'
    });

    const response = await axios.post(`${BASE_URL}/api/forum/posts`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${idToken}`
      }
    });

    testPost = response.data.post;
    uploadedFiles = testPost.attachments || [];
    
    console.log(`✅ Post created with ID: ${testPost.id}`);
    console.log(`📎 Attachments uploaded: ${uploadedFiles.length}`);
    
    // Clean up local test file
    fs.unlinkSync(testFilePath);
    
    return testPost;
  } catch (error) {
    console.error('❌ Failed to create post:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Create a reply to the test post
 */
async function createReply() {
  console.log('💬 Creating reply...');
  
  try {
    const replyData = {
      content: 'This is a test reply that will be deleted.',
      postId: testPost.id
    };

    const response = await axios.post(`${BASE_URL}/api/forum/replies`, replyData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      }
    });

    testReply = response.data.reply;
    console.log(`✅ Reply created with ID: ${testReply.id}`);
    
    return testReply;
  } catch (error) {
    console.error('❌ Failed to create reply:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Verify files exist on S3
 */
async function verifyS3FilesExist() {
  console.log('🔍 Verifying files exist on S3...');
  
  for (const file of uploadedFiles) {
    try {
      const command = new HeadObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME || 'wavelength-lore-backups',
        Key: file.s3Key
      });
      
      await s3Client.send(command);
      console.log(`✅ File exists on S3: ${file.s3Key}`);
    } catch (error) {
      if (error.name === 'NotFound') {
        console.error(`❌ File not found on S3: ${file.s3Key}`);
        throw new Error(`S3 file not found: ${file.s3Key}`);
      } else {
        console.error(`❌ Error checking S3 file: ${error.message}`);
        throw error;
      }
    }
  }
  
  console.log(`✅ All ${uploadedFiles.length} files verified on S3`);
}

/**
 * Delete the reply
 */
async function deleteReply() {
  console.log('🗑️ Deleting reply...');
  
  try {
    const response = await axios.delete(`${BASE_URL}/api/forum/replies/${testReply.id}`, {
      headers: {
        'Authorization': `Bearer ${idToken}`
      }
    });

    console.log('✅ Reply deleted successfully:', response.data);
    
    // Verify reply is removed from Firebase
    const replyRef = adminDatabase.ref(`forum/replies/${testReply.id}`);
    const snapshot = await replyRef.once('value');
    
    if (snapshot.exists()) {
      throw new Error('Reply still exists in Firebase after deletion');
    }
    
    console.log('✅ Reply confirmed removed from Firebase');
  } catch (error) {
    console.error('❌ Failed to delete reply:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Delete the post and verify S3 cleanup
 */
async function deletePostAndVerifyCleanup() {
  console.log('🗑️ Deleting post and verifying S3 cleanup...');
  
  try {
    const response = await axios.delete(`${BASE_URL}/api/forum/posts/${testPost.id}`, {
      headers: {
        'Authorization': `Bearer ${idToken}`
      }
    });

    console.log('✅ Post deleted successfully:', response.data);
    
    // Verify post is removed from Firebase
    const postRef = adminDatabase.ref(`forum/posts/${testPost.id}`);
    const snapshot = await postRef.once('value');
    
    if (snapshot.exists()) {
      throw new Error('Post still exists in Firebase after deletion');
    }
    
    console.log('✅ Post confirmed removed from Firebase');
    
    // Verify S3 files are removed
    await verifyS3FilesRemoved();
    
  } catch (error) {
    console.error('❌ Failed to delete post:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Verify S3 files are removed
 */
async function verifyS3FilesRemoved() {
  console.log('🔍 Verifying S3 files are removed...');
  
  for (const file of uploadedFiles) {
    try {
      const command = new HeadObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME || 'wavelength-lore-backups',
        Key: file.s3Key
      });
      
      await s3Client.send(command);
      // If we get here, the file still exists
      console.error(`❌ File still exists on S3: ${file.s3Key}`);
      throw new Error(`S3 file not cleaned up: ${file.s3Key}`);
    } catch (error) {
      if (error.name === 'NotFound') {
        console.log(`✅ File properly removed from S3: ${file.s3Key}`);
      } else {
        console.error(`❌ Error checking S3 file removal: ${error.message}`);
        throw error;
      }
    }
  }
  
  console.log(`✅ All ${uploadedFiles.length} files confirmed removed from S3`);
}

/**
 * Clean up any remaining test data
 */
async function cleanup() {
  console.log('🧹 Cleaning up test data...');
  
  try {
    // Clean up Firebase data if it still exists
    if (testPost) {
      const postRef = adminDatabase.ref(`forum/posts/${testPost.id}`);
      await postRef.remove();
    }
    
    if (testReply) {
      const replyRef = adminDatabase.ref(`forum/replies/${testReply.id}`);
      await replyRef.remove();
    }
    
    // Clean up S3 files if they still exist
    for (const file of uploadedFiles) {
      try {
        const command = new DeleteObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME || 'wavelength-lore-backups',
          Key: file.s3Key
        });
        await s3Client.send(command);
      } catch (error) {
        // File might already be deleted, that's okay
      }
    }
    
    console.log('✅ Cleanup completed');
  } catch (error) {
    console.error('⚠️ Cleanup warning:', error.message);
  }
}

/**
 * Run the complete test suite
 */
async function runTest() {
  const startTime = Date.now();
  console.log('🚀 Starting Delete Functionality Test Suite');
  console.log('=' .repeat(50));
  
  try {
    // Initialize
    await initializeTest();
    
    // Get authentication token
    idToken = await getAuthToken();
    
    // Test sequence
    await createPostWithAttachment();
    await verifyS3FilesExist();
    await createReply();
    await deleteReply();
    await deletePostAndVerifyCleanup();
    
    const duration = Date.now() - startTime;
    console.log('=' .repeat(50));
    console.log(`🎉 All tests passed! Duration: ${duration}ms`);
    console.log('✅ Delete functionality is working correctly');
    console.log('✅ S3 cleanup is working correctly');
    console.log('✅ Firebase cleanup is working correctly');
    
  } catch (error) {
    console.error('=' .repeat(50));
    console.error('💥 Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Attempt cleanup even on failure
    await cleanup();
    process.exit(1);
  } finally {
    // Always clean up
    await cleanup();
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  runTest().catch(console.error);
}

module.exports = {
  runTest,
  initializeTest,
  createPostWithAttachment,
  createReply,
  verifyS3FilesExist,
  deleteReply,
  deletePostAndVerifyCleanup,
  cleanup
};