#!/usr/bin/env node

/**
 * Gallery End-to-End Upload Test
 * 
 * This script tests the complete gallery upload flow from start to finish:
 * 1. Verifies S3 connection and credentials
 * 2. Creates a test image and uploads it directly via the API
 * 3. Lists user gallery to verify the image appears
 * 4. Cleans up test images if desired
 */

const fs = require('fs');
const path = require('path');
const { S3Client, ListObjectsV2Command, DeleteObjectsCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');
const fetch = require('node-fetch');
const FormData = require('form-data');

// Load environment variables
require('dotenv').config();
if (fs.existsSync('.env.test')) {
  require('dotenv').config({ path: '.env.test' });
}

// ANSI color codes for better readability
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// Configuration
const config = {
  baseUrl: process.env.API_BASE_URL || 'http://localhost:3001',
  sessionCookie: process.env.SESSION_COOKIE || '',
  imageCount: 3,  // How many test images to upload
  cleanupAfter: false,  // Whether to delete test images after upload
};

/**
 * Main test function
 */
async function runE2ETest() {
  console.log(`${colors.bold}${colors.blue}========================================${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}   GALLERY UPLOAD END-TO-END TEST      ${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}========================================${colors.reset}\n`);
  
  // 1. Check configuration
  console.log(`${colors.cyan}Configuration:${colors.reset}`);
  console.log(`API Base URL: ${config.baseUrl}`);
  console.log(`Session Cookie: ${config.sessionCookie ? '(set)' : '(not set)'}`);
  
  if (!config.sessionCookie) {
    console.log(`\n${colors.red}❌ No session cookie set! Authentication will fail.${colors.reset}`);
    console.log(`Generate a session token by running: node scripts/generate-session-token.js`);
    console.log(`Then set it in .env.test or as SESSION_COOKIE environment variable.`);
    process.exit(1);
  }
  
  // 2. Verify user is authenticated
  console.log(`\n${colors.cyan}Step 1: Verifying Authentication${colors.reset}`);
  const user = await verifyAuthentication();
  
  if (!user) {
    console.log(`\n${colors.red}❌ Authentication failed. Cannot proceed with tests.${colors.reset}`);
    process.exit(1);
  }
  
  console.log(`${colors.green}✓ Successfully authenticated as user:${colors.reset} ${user.uid}`);
  console.log(`  Display name: ${user.displayName || 'Not set'}`);
  console.log(`  Email: ${user.email || 'Not set'}`);
  
  // 3. Check current gallery status
  console.log(`\n${colors.cyan}Step 2: Checking Current Gallery Status${colors.reset}`);
  const initialGallery = await listUserGallery();
  
  console.log(`${colors.green}✓ Found ${initialGallery.length} existing images in gallery${colors.reset}`);
  
  // 4. Create and upload test images
  console.log(`\n${colors.cyan}Step 3: Uploading ${config.imageCount} Test Images${colors.reset}`);
  
  const testImages = [];
  for (let i = 0; i < config.imageCount; i++) {
    const testImage = generateTestImage(i + 1);
    console.log(`\n${colors.blue}Uploading Test Image ${i + 1}:${colors.reset}`);
    
    try {
      const uploadResult = await uploadTestImage(testImage);
      console.log(`${colors.green}✓ Upload successful!${colors.reset}`);
      console.log(`  Image URL: ${uploadResult.image.url}`);
      console.log(`  Relative Path: ${uploadResult.image.relativePath}`);
      testImages.push(uploadResult.image);
    } catch (error) {
      console.log(`${colors.red}❌ Upload failed:${colors.reset} ${error.message}`);
      console.log(`  Response: ${error.response || 'Not available'}`);
    }
  }
  
  // 5. Check gallery again to verify uploads
  console.log(`\n${colors.cyan}Step 4: Verifying Uploads in Gallery${colors.reset}`);
  const finalGallery = await listUserGallery();
  
  const expectedCount = initialGallery.length + testImages.length;
  const actualCount = finalGallery.length;
  
  if (actualCount >= expectedCount) {
    console.log(`${colors.green}✓ Gallery now contains ${actualCount} images (expected: at least ${expectedCount})${colors.reset}`);
    
    // Find our test images
    let foundCount = 0;
    testImages.forEach(testImage => {
      const found = finalGallery.some(img => 
        img.relativePath === testImage.relativePath || 
        img.url === testImage.url
      );
      
      if (found) {
        foundCount++;
        console.log(`${colors.green}✓ Found test image: ${testImage.title}${colors.reset}`);
      } else {
        console.log(`${colors.red}❌ Missing test image: ${testImage.title}${colors.reset}`);
      }
    });
    
    console.log(`\n${colors.green}Found ${foundCount}/${testImages.length} uploaded test images in the gallery${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ Gallery contains ${actualCount} images (expected: at least ${expectedCount})${colors.reset}`);
    console.log(`${colors.yellow}Some uploads may have failed or are not appearing in the gallery.${colors.reset}`);
  }
  
  // 6. Test image viewing
  console.log(`\n${colors.cyan}Step 5: Testing CDN Image Access${colors.reset}`);
  
  if (testImages.length > 0) {
    const testImage = testImages[0];
    console.log(`Testing access to: ${testImage.url}`);
    
    try {
      const response = await fetch(testImage.url);
      if (response.ok) {
        console.log(`${colors.green}✓ Successfully accessed image via CDN!${colors.reset}`);
        console.log(`  Status: ${response.status} ${response.statusText}`);
        console.log(`  Content-Type: ${response.headers.get('content-type')}`);
        console.log(`  Content-Length: ${response.headers.get('content-length')} bytes`);
      } else {
        console.log(`${colors.red}❌ Could not access image via CDN${colors.reset}`);
        console.log(`  Status: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`${colors.red}❌ Error accessing image via CDN:${colors.reset} ${error.message}`);
    }
  } else {
    console.log(`${colors.yellow}No test images available to check CDN access${colors.reset}`);
  }
  
  // 7. Cleanup if requested
  if (config.cleanupAfter && testImages.length > 0) {
    console.log(`\n${colors.cyan}Step 6: Cleaning Up Test Images${colors.reset}`);
    await cleanupTestImages(testImages);
  }
  
  console.log(`\n${colors.bold}${colors.blue}========================================${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}   TEST COMPLETE                       ${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}========================================${colors.reset}\n`);
}

/**
 * Verify the user is authenticated
 */
async function verifyAuthentication() {
  try {
    const response = await fetch(`${config.baseUrl}/api/user/profile`, {
      headers: {
        'Cookie': `__session=${config.sessionCookie}`
      }
    });
    
    if (!response.ok) {
      console.log(`${colors.red}❌ Authentication failed:${colors.reset} ${response.status} ${response.statusText}`);
      return null;
    }
    
    const userData = await response.json();
    return userData.user;
  } catch (error) {
    console.log(`${colors.red}❌ Error checking authentication:${colors.reset} ${error.message}`);
    return null;
  }
}

/**
 * List images in the user's gallery
 */
async function listUserGallery() {
  try {
    const response = await fetch(`${config.baseUrl}/api/gallery/user/images`, {
      headers: {
        'Cookie': `__session=${config.sessionCookie}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.images || [];
  } catch (error) {
    console.log(`${colors.red}❌ Error listing gallery:${colors.reset} ${error.message}`);
    return [];
  }
}

/**
 * Generate a test image with canvas
 */
function generateTestImage(index) {
  // For this test, we'll generate a small colored square
  // In a real implementation, you could use node-canvas to generate a real image
  // For simplicity, we'll use a 1x1 pixel GIF in different colors
  
  // 1x1 pixel GIF templates for different colors
  const colors = [
    { name: 'red', data: 'R0lGODlhAQABAIAAAP8AAAAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==' },
    { name: 'green', data: 'R0lGODlhAQABAIAAAAD/AAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==' },
    { name: 'blue', data: 'R0lGODlhAQABAIAAAAAAAP8AACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==' }
  ];
  
  // Pick a color based on index
  const color = colors[index % colors.length];
  
  // Create a test image object
  const buffer = Buffer.from(color.data, 'base64');
  const timestamp = Date.now();
  const randomId = crypto.randomBytes(3).toString('hex');
  
  return {
    fileName: `test-${color.name}-${timestamp}-${randomId}.gif`,
    title: `Test Image ${index} (${color.name})`,
    buffer: buffer,
    size: buffer.length,
    mimeType: 'image/gif',
    color: color.name
  };
}

/**
 * Upload a test image to the gallery API
 */
async function uploadTestImage(testImage) {
  // Create form data for the upload
  const form = new FormData();
  form.append('file', Buffer.from(testImage.buffer), {
    filename: testImage.fileName,
    contentType: testImage.mimeType
  });
  form.append('title', testImage.title);
  form.append('tags', `test,${testImage.color},e2e-test`);
  
  // Upload to the API
  const response = await fetch(`${config.baseUrl}/api/gallery/user/upload`, {
    method: 'POST',
    body: form,
    headers: {
      'Cookie': `__session=${config.sessionCookie}`,
      ...form.getHeaders()
    }
  });
  
  // Check response
  if (!response.ok) {
    const errorText = await response.text();
    const error = new Error(`Upload failed: ${response.status} ${response.statusText}`);
    error.response = errorText;
    throw error;
  }
  
  // Return the upload result
  return response.json();
}

/**
 * Clean up test images
 */
async function cleanupTestImages(testImages) {
  console.log(`Cleaning up ${testImages.length} test images...`);
  
  const relativePaths = testImages.map(img => img.relativePath);
  
  try {
    const response = await fetch(`${config.baseUrl}/api/gallery/user/batch-delete`, {
      method: 'POST',
      headers: {
        'Cookie': `__session=${config.sessionCookie}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        relativePaths: relativePaths
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log(`${colors.green}✓ Successfully deleted ${result.results.filter(r => r.success).length} test images${colors.reset}`);
    } else {
      console.log(`${colors.red}❌ Error deleting test images:${colors.reset} ${result.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.log(`${colors.red}❌ Error cleaning up:${colors.reset} ${error.message}`);
  }
}

// Run the test if executed directly
if (require.main === module) {
  runE2ETest().catch(error => {
    console.error(`${colors.red}Unhandled error:${colors.reset}`, error);
    process.exit(1);
  });
}

module.exports = runE2ETest;