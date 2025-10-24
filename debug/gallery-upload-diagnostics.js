/**
 * Gallery Upload Diagnostics
 * 
 * DISABLED: User upload functionality has been completely removed.
 * Images are added to galleries via "Save to Gallery" buttons only.
 */

console.log('❌ This diagnostic script is disabled.');
console.log('User gallery uploads have been removed from the system.');
console.log('Use "Save to Gallery" functionality throughout the site instead.');
process.exit(1);
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const galleryStorage = require('../utils/gallery/storage');
const { testS3Connection } = require('../utils/gallery/s3-connection-test');

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

/**
 * Main diagnostic function
 */
async function runDiagnostics() {
  console.log(`${colors.bold}${colors.blue}========================================${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}   GALLERY UPLOAD DIAGNOSTICS TOOL     ${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}========================================${colors.reset}`);
  
  // 1. Check environment variables
  console.log(`\n${colors.bold}${colors.cyan}1. Checking Environment Variables...${colors.reset}`);
  checkEnvironmentVariables();
  
  // 2. Test AWS credentials and S3 connection
  console.log(`\n${colors.bold}${colors.cyan}2. Testing S3 Connection...${colors.reset}`);
  const s3Status = await testS3Connection();
  
  if (!s3Status.success) {
    console.log(`${colors.red}✖ S3 connection failed. Cannot proceed with further diagnostics.${colors.reset}`);
    console.log(`${colors.red}  Error: ${s3Status.error}${colors.reset}`);
    
    console.log(`\n${colors.bold}${colors.yellow}Troubleshooting Steps:${colors.reset}`);
    console.log(`1. Check that ACCESS_KEY_ID and SECRET_ACCESS_KEY are correctly set in .env`);
    console.log(`2. Ensure the AWS IAM user has sufficient permissions for S3 operations`);
    console.log(`3. Verify that GALLERY_S3_BUCKET exists in your AWS account`);
    console.log(`4. Check for network connectivity issues to AWS S3 endpoints`);
    
    return;
  }
  
  // 3. Initialize S3 client for direct testing
  const s3Client = createS3Client();
  
  // 4. Verify the gallery bucket exists and is accessible
  console.log(`\n${colors.bold}${colors.cyan}3. Verifying Gallery S3 Bucket...${colors.reset}`);
  const bucketName = process.env.GALLERY_S3_BUCKET || 'wavelength-lore-bucket';
  await verifyBucket(s3Client, bucketName);
  
  // 5. Test user directory creation
  console.log(`\n${colors.bold}${colors.cyan}4. Testing User Directory Creation...${colors.reset}`);
  const testUserId = 'diagnostic-test-user-' + Date.now();
  await testUserDirectoryCreation(s3Client, bucketName, testUserId);
  
  // 6. Test image upload
  console.log(`\n${colors.bold}${colors.cyan}5. Testing Direct Image Upload...${colors.reset}`);
  await testDirectImageUpload(s3Client, bucketName, testUserId);
  
  // 7. Test the storage module
  console.log(`\n${colors.bold}${colors.cyan}6. Testing Gallery Storage Module...${colors.reset}`);
  await testGalleryStorageModule(testUserId);
  
  // 8. Check CORS configuration
  console.log(`\n${colors.bold}${colors.cyan}7. Checking CORS Configuration...${colors.reset}`);
  checkCORSConfiguration();
  
  // 9. Check CloudFront configuration if CDN_URL is set
  console.log(`\n${colors.bold}${colors.cyan}8. Checking CDN Configuration...${colors.reset}`);
  checkCDNConfiguration();
  
  console.log(`\n${colors.bold}${colors.blue}========================================${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}   DIAGNOSTICS COMPLETE                 ${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}========================================${colors.reset}`);
}

/**
 * Check required environment variables
 */
function checkEnvironmentVariables() {
  const requiredVars = [
    'ACCESS_KEY_ID', 
    'SECRET_ACCESS_KEY', 
    'GALLERY_S3_BUCKET',
    'AWS_REGION'
  ];
  
  const optionalVars = [
    'CDN_URL'
  ];
  
  let allRequiredPresent = true;
  
  // Check required variables
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      console.log(`${colors.red}✖ Missing required environment variable: ${varName}${colors.reset}`);
      allRequiredPresent = false;
    } else {
      // Mask secret values
      if (varName.includes('SECRET') || varName.includes('KEY')) {
        console.log(`${colors.green}✓ ${varName} is set to: ${process.env[varName].substring(0, 3)}...${process.env[varName].substring(process.env[varName].length - 3)}${colors.reset}`);
      } else {
        console.log(`${colors.green}✓ ${varName} is set to: ${process.env[varName]}${colors.reset}`);
      }
    }
  }
  
  // Check optional variables
  for (const varName of optionalVars) {
    if (!process.env[varName]) {
      console.log(`${colors.yellow}⚠ Optional variable ${varName} is not set${colors.reset}`);
    } else {
      console.log(`${colors.green}✓ ${varName} is set to: ${process.env[varName]}${colors.reset}`);
    }
  }
  
  // Special case for AWS credential format
  if (process.env.AWS_ACCESS_KEY_ID && !process.env.ACCESS_KEY_ID) {
    console.log(`${colors.yellow}⚠ AWS_ACCESS_KEY_ID is set but ACCESS_KEY_ID is not. Gallery uses ACCESS_KEY_ID format.${colors.reset}`);
    console.log(`  Consider setting ACCESS_KEY_ID=${process.env.AWS_ACCESS_KEY_ID}`);
  }
  
  if (process.env.AWS_SECRET_ACCESS_KEY && !process.env.SECRET_ACCESS_KEY) {
    console.log(`${colors.yellow}⚠ AWS_SECRET_ACCESS_KEY is set but SECRET_ACCESS_KEY is not. Gallery uses SECRET_ACCESS_KEY format.${colors.reset}`);
    console.log(`  Consider setting SECRET_ACCESS_KEY=[REDACTED-FOR-SECURITY]`);
  }
  
  if (!allRequiredPresent) {
    console.log(`\n${colors.yellow}⚠ Some required environment variables are missing. Gallery uploads may not work properly.${colors.reset}`);
  } else {
    console.log(`\n${colors.green}✓ All required environment variables are present.${colors.reset}`);
  }
}

/**
 * Create S3 client for testing
 */
function createS3Client() {
  return new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.ACCESS_KEY_ID,
      secretAccessKey: process.env.SECRET_ACCESS_KEY
    }
  });
}

/**
 * Verify S3 bucket exists and is accessible
 */
async function verifyBucket(s3Client, bucketName) {
  try {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      MaxKeys: 1
    });
    
    const response = await s3Client.send(command);
    console.log(`${colors.green}✓ Successfully connected to bucket: ${bucketName}${colors.reset}`);
    console.log(`  Bucket contains ${response.KeyCount} objects (showing max 1)`);
    
    return true;
  } catch (error) {
    console.log(`${colors.red}✖ Error verifying bucket ${bucketName}:${colors.reset}`);
    console.log(`  ${error.message}`);
    
    // Provide helpful troubleshooting info based on error code
    if (error.name === 'NoSuchBucket') {
      console.log(`${colors.yellow}⚠ The bucket "${bucketName}" does not exist in your AWS account.${colors.reset}`);
      console.log(`  Create it first using: aws s3 mb s3://${bucketName}`);
    } else if (error.name === 'AccessDenied') {
      console.log(`${colors.yellow}⚠ Access denied to bucket "${bucketName}".${colors.reset}`);
      console.log(`  Check IAM permissions for user with access key: ${process.env.ACCESS_KEY_ID}`);
    }
    
    return false;
  }
}

/**
 * Test user directory creation in S3
 */
async function testUserDirectoryCreation(s3Client, bucketName, testUserId) {
  try {
    // In S3, directories are just prefixes, so we create an empty file with the directory name as prefix
    const key = `images/gallery/${testUserId}/.directory`;
    
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: 'This is a marker file for the user directory.',
      ContentType: 'text/plain'
    });
    
    await s3Client.send(command);
    
    console.log(`${colors.green}✓ Successfully created user directory: images/gallery/${testUserId}/${colors.reset}`);
    
    // Verify it exists
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: `images/gallery/${testUserId}/`,
      MaxKeys: 10
    });
    
    const response = await s3Client.send(listCommand);
    
    if (response.Contents && response.Contents.length > 0) {
      console.log(`${colors.green}✓ Verified user directory exists with ${response.Contents.length} objects${colors.reset}`);
      
      // List what's in there
      console.log(`  Directory contents:`);
      response.Contents.forEach(item => {
        console.log(`    - ${item.Key} (${item.Size} bytes)`);
      });
      
      return true;
    } else {
      console.log(`${colors.red}✖ User directory was created but could not be listed${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✖ Error creating user directory:${colors.reset}`);
    console.log(`  ${error.message}`);
    return false;
  }
}

/**
 * Test direct image upload to S3
 */
async function testDirectImageUpload(s3Client, bucketName, testUserId) {
  try {
    // Create a simple test image (1x1 transparent pixel) as base64
    const base64Image = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; // 1x1 GIF
    const imageBuffer = Buffer.from(base64Image, 'base64');
    
    // Set file details
    const fileName = `test-image-${Date.now()}.gif`;
    const key = `images/gallery/${testUserId}/${fileName}`;
    
    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: imageBuffer,
      ContentType: 'image/gif',
      Metadata: {
        'uploaded-by': testUserId,
        'original-name': fileName,
        'uploaded-at': new Date().toISOString(),
        'title': 'Diagnostic Test Image',
        'tags': 'test,diagnostic'
      }
    });
    
    const result = await s3Client.send(command);
    
    console.log(`${colors.green}✓ Successfully uploaded test image directly to S3${colors.reset}`);
    console.log(`  File path: ${key}`);
    console.log(`  ETag: ${result.ETag}`);
    
    // Verify it exists and can be retrieved
    const getCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: key
    });
    
    try {
      const getResult = await s3Client.send(getCommand);
      console.log(`${colors.green}✓ Successfully verified test image exists in S3${colors.reset}`);
      console.log(`  Content Type: ${getResult.ContentType}`);
      console.log(`  Last Modified: ${getResult.LastModified}`);
      console.log(`  Metadata:`, getResult.Metadata);
      
      // Construct CDN URL if available
      if (process.env.CDN_URL) {
        console.log(`  CDN URL: ${process.env.CDN_URL}/${key}`);
      } else {
        console.log(`  Direct S3 URL: https://${bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`);
      }
      
      return {
        success: true,
        key: key,
        fileName: fileName
      };
    } catch (getError) {
      console.log(`${colors.red}✖ Error verifying uploaded image:${colors.reset}`);
      console.log(`  ${getError.message}`);
      return { success: false, error: getError.message };
    }
  } catch (error) {
    console.log(`${colors.red}✖ Error uploading test image:${colors.reset}`);
    console.log(`  ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Test the gallery storage module
 */
async function testGalleryStorageModule(testUserId) {
  try {
    console.log(`Testing uploadGalleryImage function...`);
    
    // Create test data
    const testBuffer = Buffer.from('This is a test file for gallery diagnostics');
    const fileName = `test-file-${Date.now()}.txt`;
    const mimeType = 'text/plain';
    const userGroups = ['default', 'diagnostic_test'];
    
    // Call the uploadGalleryImage function
    const result = await galleryStorage.uploadGalleryImage(
      testBuffer,
      fileName,
      mimeType,
      testUserId,
      userGroups,
      'Diagnostic Test File',
      ['test', 'diagnostic']
    );
    
    if (result.success) {
      console.log(`${colors.green}✓ galleryStorage.uploadGalleryImage succeeded${colors.reset}`);
      console.log(`  File URL: ${result.url}`);
      console.log(`  Relative path: ${result.relativePath}`);
      
      // Now try to list user's gallery images
      console.log(`\nTesting listUserGalleryImages function...`);
      
      const images = await galleryStorage.listUserGalleryImages(testUserId);
      console.log(`${colors.green}✓ galleryStorage.listUserGalleryImages returned ${images.length} images${colors.reset}`);
      
      if (images.length > 0) {
        console.log(`  Most recent image:`);
        console.log(`    URL: ${images[0].url}`);
        console.log(`    Path: ${images[0].relativePath}`);
        console.log(`    Size: ${images[0].size} bytes`);
        console.log(`    Last Modified: ${images[0].lastModified}`);
      }
      
      return {
        success: true,
        uploadResult: result,
        listResult: images
      };
    } else {
      console.log(`${colors.red}✖ galleryStorage.uploadGalleryImage failed:${colors.reset}`);
      console.log(`  Error: ${result.error}`);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.log(`${colors.red}✖ Error testing gallery storage module:${colors.reset}`);
    console.log(`  ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Check CORS configuration
 */
function checkCORSConfiguration() {
  // Check if CORS config files exist
  const corsFiles = [
    '../aws-policies/cloudfront-cors-config.json',
    '../aws-policies/cloudfront-response-headers-policy.json',
    '../aws-policies/gallery-bucket-cors.json'
  ];
  
  corsFiles.forEach(file => {
    const filePath = path.resolve(__dirname, file);
    if (fs.existsSync(filePath)) {
      console.log(`${colors.green}✓ Found CORS configuration file: ${path.basename(filePath)}${colors.reset}`);
      
      // Read file and parse JSON
      try {
        const corsConfig = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        console.log(`  Config looks valid (${Object.keys(corsConfig).length} top-level keys)`);
      } catch (error) {
        console.log(`${colors.red}✖ Error parsing CORS config file:${colors.reset}`);
        console.log(`  ${error.message}`);
      }
    } else {
      console.log(`${colors.yellow}⚠ CORS configuration file not found: ${path.basename(file)}${colors.reset}`);
    }
  });
  
  console.log(`\n${colors.yellow}Note: CORS configuration must be applied to your AWS S3 bucket and CloudFront distribution.${colors.reset}`);
  console.log(`Run the CORS setup scripts if you haven't already:`);
  console.log(`  node scripts/configure-gallery-bucket.sh`);
}

/**
 * Check CDN configuration
 */
function checkCDNConfiguration() {
  // Check CDN URLs
  console.log(`\n${colors.bold}Checking CDN URLs:${colors.reset}`);
  if (process.env.CDN_URL) {
    console.log(`${colors.green}✓ CDN_URL is configured: ${process.env.CDN_URL}${colors.reset}`);
    
    // Parse the CDN URL to get the domain
    try {
      const cdnDomain = new URL(process.env.CDN_URL).hostname;
      console.log(`  CDN domain: ${cdnDomain}`);
      
      // Check if it's a CloudFront domain
      if (cdnDomain.includes('cloudfront.net')) {
        console.log(`  Detected AWS CloudFront distribution`);
      } else if (cdnDomain.includes('s3.amazonaws.com')) {
        console.log(`${colors.yellow}⚠ Using S3 website URL directly. Consider using CloudFront for better performance and CORS support.${colors.reset}`);
      }
    } catch (error) {
      console.log(`${colors.yellow}⚠ Invalid CDN_URL format: ${error.message}${colors.reset}`);
    }
  } else {
    console.log(`${colors.yellow}⚠ CDN_URL is not configured. Gallery will use direct S3 URLs.${colors.reset}`);
    console.log(`  This may cause CORS issues when accessing images from the browser.`);
  }
  
  // Check Gallery CDN URL separately
  if (process.env.GALLERY_CDN_URL) {
    console.log(`${colors.green}✓ GALLERY_CDN_URL is configured: ${process.env.GALLERY_CDN_URL}${colors.reset}`);
    if (process.env.GALLERY_CDN_URL !== process.env.CDN_URL) {
      console.log(`  Gallery is using a separate CDN from the main application`);
    }
  } else {
    console.log(`${colors.yellow}⚠ GALLERY_CDN_URL is not configured. Gallery will use CDN_URL instead.${colors.reset}`);
  }
  
  // Check CloudFront distributions
  console.log(`\n${colors.bold}Checking CloudFront Distribution IDs:${colors.reset}`);
  
  // Check primary distribution ID
  if (process.env.CLOUDFRONT_DISTRIBUTION_ID) {
    console.log(`${colors.green}✓ CLOUDFRONT_DISTRIBUTION_ID is configured: ${process.env.CLOUDFRONT_DISTRIBUTION_ID}${colors.reset}`);
  } else {
    console.log(`${colors.yellow}⚠ CLOUDFRONT_DISTRIBUTION_ID is not configured.${colors.reset}`);
  }
  
  // Check gallery distribution ID
  if (process.env.GALLERY_CLOUDFRONT_DISTRIBUTION_ID) {
    console.log(`${colors.green}✓ GALLERY_CLOUDFRONT_DISTRIBUTION_ID is configured: ${process.env.GALLERY_CLOUDFRONT_DISTRIBUTION_ID}${colors.reset}`);
    
    // Check for conflicts
    if (process.env.GALLERY_CLOUDFRONT_DISTRIBUTION_ID === process.env.CLOUDFRONT_DISTRIBUTION_ID) {
      console.log(`${colors.yellow}⚠ GALLERY_CLOUDFRONT_DISTRIBUTION_ID and CLOUDFRONT_DISTRIBUTION_ID are the same.${colors.reset}`);
      console.log(`  This might be intentional if you're using the same distribution for both, but usually they should be different.`);
    }
  } else {
    console.log(`${colors.yellow}⚠ GALLERY_CLOUDFRONT_DISTRIBUTION_ID is not configured.${colors.reset}`);
    console.log(`  The gallery will use the primary CloudFront distribution or the main CDN URL.`);
  }
  
  // Check for local development mode
  console.log(`\n${colors.bold}Local Development Recommendations:${colors.reset}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`${colors.cyan}ℹ Development mode detected${colors.reset}`);
    
    if (process.env.CDN_URL && !process.env.CDN_URL.includes('localhost')) {
      console.log(`${colors.yellow}⚠ For local development, consider using a local CDN URL:${colors.reset}`);
      console.log(`  In .env file, comment out the CloudFront CDN_URL and uncomment the local version:`);
      console.log(`  CDN_URL=http://localhost:3001`);
      console.log(`  #CDN_URL="${process.env.CDN_URL}"`);
    } else if (process.env.CDN_URL && process.env.CDN_URL.includes('localhost')) {
      console.log(`${colors.green}✓ Using local development CDN_URL: ${process.env.CDN_URL}${colors.reset}`);
    }
  }
  
  // Check for CloudFront helper scripts
  console.log(`\n${colors.bold}CloudFront Helper Tools:${colors.reset}`);
  const helperPath = path.resolve(__dirname, '../scripts/cloudfront-helper.js');
  if (fs.existsSync(helperPath)) {
    console.log(`${colors.green}✓ CloudFront helper script is available${colors.reset}`);
    console.log(`  You can use it to manage multiple CloudFront distributions:`);
    console.log(`  • node scripts/cloudfront-helper.js list`);
    console.log(`  • node scripts/cloudfront-helper.js details gallery`);
    console.log(`  • node scripts/fix-orb-errors.js gallery`);
  } else {
    console.log(`${colors.yellow}⚠ CloudFront helper script not found${colors.reset}`);
  }
}

/**
 * Run the diagnostics
 */
if (require.main === module) {
  runDiagnostics().catch(error => {
    console.error(`${colors.red}Unhandled error in diagnostics:${colors.reset}`, error);
  });
}

module.exports = {
  runDiagnostics
};