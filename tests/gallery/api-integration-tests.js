/**
 * Gallery API Integration Tests
 * 
 * Tests to verify the gallery API endpoints that interact with S3:
 * - Image upload API
 * - Image listing API
 * - Storage quota API
 * - Image deletion API
 */

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const FormData = require('form-data');
const assert = require('assert');
require('dotenv').config();

// Configure the test parameters
const TEST_IMAGE_PATH = path.join(__dirname, '../fixtures/test-image.jpg');
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const SESSION_COOKIE = process.env.SESSION_COOKIE; // Firebase auth session token

// Helper function to create a test image file of a specific size
async function createTestImageFile(filePath, sizeInMB) {
  return new Promise((resolve, reject) => {
    // Make sure the directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Create a buffer of the specified size
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

// Helper function for API requests with authentication
async function apiRequest(endpoint, method = 'GET', body = null, isMultipart = false) {
  const headers = {
    'Cookie': `__session=${SESSION_COOKIE}`
  };
  
  if (!isMultipart && method !== 'GET') {
    headers['Content-Type'] = 'application/json';
  }
  
  const options = {
    method,
    headers,
    credentials: 'include'
  };
  
  if (body) {
    if (isMultipart) {
      options.body = body; // FormData
    } else {
      options.body = JSON.stringify(body);
    }
  }
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  const contentType = response.headers.get('content-type');
  
  if (contentType && contentType.includes('application/json')) {
    return {
      status: response.status,
      data: await response.json()
    };
  }
  
  return {
    status: response.status,
    text: await response.text()
  };
}

// Test 1: Check storage stats API
async function testStorageStatsAPI() {
  console.log('\n----- Test 1: Storage Stats API -----');
  
  try {
    // Check if authentication cookie is provided
    if (!SESSION_COOKIE) {
      console.log('Skipping test: No session cookie provided');
      return { skipped: true };
    }
    
    const response = await apiRequest('/api/gallery/user/storage-stats');
    
    console.log('API response:', response);
    
    assert(response.status === 200, 'Should return HTTP 200');
    assert(response.data.success, 'Should return success: true');
    assert(response.data.stats, 'Should return stats object');
    assert(typeof response.data.stats.used === 'number', 'Should return used bytes');
    assert(typeof response.data.stats.usedFormatted === 'string', 'Should return formatted used');
    
    console.log('✅ Storage stats API working');
    return response.data;
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Test 2: Upload image API
async function testUploadImageAPI() {
  console.log('\n----- Test 2: Upload Image API -----');
  
  try {
    // Check if authentication cookie is provided
    if (!SESSION_COOKIE) {
      console.log('Skipping test: No session cookie provided');
      return { skipped: true };
    }
    
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
    
    // Create form data for the upload
    const form = new FormData();
    form.append('file', fs.createReadStream(TEST_IMAGE_PATH));
    
    // Upload the image
    const response = await apiRequest('/api/gallery/user/upload', 'POST', form, true);
    
    console.log('API response:', response);
    
    assert(response.status === 200, 'Should return HTTP 200');
    assert(response.data.success, 'Should return success: true');
    assert(response.data.image, 'Should return image data');
    assert(response.data.image.url, 'Should return image URL');
    assert(response.data.image.relativePath, 'Should return relative path');
    
    console.log('✅ Upload image API working');
    return response.data;
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Test 3: List user images API
async function testListImagesAPI() {
  console.log('\n----- Test 3: List Images API -----');
  
  try {
    // Check if authentication cookie is provided
    if (!SESSION_COOKIE) {
      console.log('Skipping test: No session cookie provided');
      return { skipped: true };
    }
    
    const response = await apiRequest('/api/gallery/user/images');
    
    console.log(`API returned ${response.data.images?.length || 0} images`);
    
    assert(response.status === 200, 'Should return HTTP 200');
    assert(response.data.success, 'Should return success: true');
    assert(Array.isArray(response.data.images), 'Should return images array');
    
    if (response.data.images.length > 0) {
      const firstImage = response.data.images[0];
      assert(firstImage.url, 'Image should have URL');
      assert(firstImage.relativePath, 'Image should have relativePath');
      console.log('Sample image:', firstImage);
    }
    
    console.log('✅ List images API working');
    return response.data;
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Test 4: Delete image API
async function testDeleteImageAPI(listResponse) {
  console.log('\n----- Test 4: Delete Image API -----');
  
  try {
    // Check if authentication cookie is provided
    if (!SESSION_COOKIE) {
      console.log('Skipping test: No session cookie provided');
      return { skipped: true };
    }
    
    // Check if we have any images to delete
    if (!listResponse?.images || listResponse.images.length === 0) {
      console.log('Skipping test: No images to delete');
      return { skipped: true, reason: 'No images available' };
    }
    
    // Get the first image to delete
    const imageToDelete = listResponse.images[0];
    console.log('Deleting image:', imageToDelete.relativePath);
    
    // Delete the image
    const response = await apiRequest('/api/gallery/user/delete', 'POST', {
      relativePath: imageToDelete.relativePath
    });
    
    console.log('API response:', response);
    
    assert(response.status === 200, 'Should return HTTP 200');
    assert(response.data.success, 'Should return success: true');
    
    // Verify the image was deleted by checking the list again
    const updatedListResponse = await apiRequest('/api/gallery/user/images');
    const deletedImageExists = updatedListResponse.data.images.some(
      img => img.relativePath === imageToDelete.relativePath
    );
    
    assert(!deletedImageExists, 'Deleted image should not appear in listing');
    
    console.log('✅ Delete image API working');
    return response.data;
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run all API tests
async function runAllAPITests() {
  console.log('Starting gallery API integration tests...');
  console.log('Using API base URL:', API_BASE_URL);
  
  if (!SESSION_COOKIE) {
    console.warn('\n⚠️ WARNING: No session cookie provided. Tests will be skipped.');
    console.warn('Set the SESSION_COOKIE environment variable with a valid Firebase session token.');
  }
  
  try {
    // Run tests in sequence
    const statsResult = await testStorageStatsAPI();
    const uploadResult = await testUploadImageAPI();
    const listResult = await testListImagesAPI();
    await testDeleteImageAPI(listResult);
    
    console.log('\n✅ All API tests completed!');
    
    // Report on skipped tests
    const skippedTests = [statsResult, uploadResult, listResult]
      .filter(result => result.skipped)
      .length;
    
    if (skippedTests > 0) {
      console.log(`⚠️ ${skippedTests} tests were skipped.`);
    }
  } catch (error) {
    console.error('\n❌ API tests failed:', error);
    process.exit(1);
  } finally {
    // Clean up test fixture
    if (fs.existsSync(TEST_IMAGE_PATH)) {
      fs.unlinkSync(TEST_IMAGE_PATH);
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllAPITests();
}

module.exports = {
  testStorageStatsAPI,
  testUploadImageAPI,
  testListImagesAPI,
  testDeleteImageAPI,
  runAllAPITests
};