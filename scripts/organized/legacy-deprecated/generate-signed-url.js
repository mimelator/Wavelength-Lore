/**
 * CloudFront Signed URL Generator
 * 
 * This script generates signed URLs for accessing protected CloudFront content
 * Usage: node scripts/generate-signed-url.js <object-path>
 * 
 * Example: node scripts/generate-signed-url.js images/gallery/user123/image.jpg
 */

const { CloudFrontClient, GetDistributionCommand } = require('@aws-sdk/client-cloudfront');
const { getSignedUrl } = require('@aws-sdk/cloudfront-signer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Load AWS configuration
const awsConfig = require('../config/aws-resources');

// CloudFront distribution domain
const distributionDomain = process.env.CDN_URL || `https://${awsConfig.cloudFront.distributionDomain}`;

// Private key path for signing (you'll need to create this)
const privateKeyPath = path.join(__dirname, '../keys/cloudfront-private-key.pem');
const keyPairId = process.env.CLOUDFRONT_KEY_PAIR_ID || 'K2XXXXXXXXXXXX'; // Your CloudFront key pair ID

/**
 * Generate a signed URL for CloudFront
 * 
 * @param {string} objectPath - Path to the object in S3/CloudFront
 * @param {number} expiresIn - Seconds until URL expiration (default: 1 hour)
 * @returns {string} Signed URL
 */
async function generateSignedUrl(objectPath, expiresIn = 3600) {
  try {
    // Check if we have the required files
    if (!fs.existsSync(privateKeyPath)) {
      console.error(`❌ Private key file not found at ${privateKeyPath}`);
      console.error(`   You need to create a CloudFront key pair and save the private key.`);
      console.error(`   See: https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-trusted-signers.html`);
      return null;
    }

    // Read private key
    const privateKey = fs.readFileSync(privateKeyPath, 'utf8');

    // Calculate expiration time
    const expires = Math.floor(Date.now() / 1000) + expiresIn;

    // Normalize object path (remove leading slash if present)
    const normalizedPath = objectPath.startsWith('/') ? objectPath.substring(1) : objectPath;

    // Create CloudFront signed URL
    const url = getSignedUrl({
      url: `${distributionDomain}/${normalizedPath}`,
      keyPairId: keyPairId,
      privateKey: privateKey,
      dateLessThan: new Date(expires * 1000).toISOString()
    });

    return url;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return null;
  }
}

/**
 * Create a signed URL cookie string
 * 
 * @param {string} objectPath - Path pattern to sign (can use wildcards)
 * @param {number} expiresIn - Seconds until cookie expiration (default: 12 hours)
 * @returns {Object} Cookie header values
 */
async function generateSignedCookies(objectPath = '*', expiresIn = 12 * 3600) {
  try {
    // Check if we have the required files
    if (!fs.existsSync(privateKeyPath)) {
      console.error(`❌ Private key file not found at ${privateKeyPath}`);
      return null;
    }

    // Read private key
    const privateKey = fs.readFileSync(privateKeyPath, 'utf8');

    // Calculate expiration time
    const expires = Math.floor(Date.now() / 1000) + expiresIn;
    
    // Create policy
    const policy = {
      Statement: [{
        Resource: `${distributionDomain}/${objectPath}`,
        Condition: {
          DateLessThan: {
            'AWS:EpochTime': expires
          }
        }
      }]
    };

    const policyString = JSON.stringify(policy);
    
    // Base64 encode the policy
    const encodedPolicy = Buffer.from(policyString).toString('base64');
    
    // Create signature
    const signer = crypto.createSign('RSA-SHA1');
    signer.update(policyString);
    const signature = signer.sign(privateKey, 'base64');
    
    return {
      'CloudFront-Policy': encodedPolicy,
      'CloudFront-Signature': signature,
      'CloudFront-Key-Pair-Id': keyPairId
    };
  } catch (error) {
    console.error('Error generating signed cookies:', error);
    return null;
  }
}

/**
 * Main function
 */
async function main() {
  const objectPath = process.argv[2];
  
  if (!objectPath) {
    console.error('❌ Error: Please provide an object path');
    console.error('Usage: node scripts/generate-signed-url.js <object-path>');
    process.exit(1);
  }

  console.log('Generating signed URL for:', objectPath);
  const signedUrl = await generateSignedUrl(objectPath);
  
  if (signedUrl) {
    console.log('\n✅ Signed URL (valid for 1 hour):');
    console.log(signedUrl);
    
    console.log('\n📋 For curl testing:');
    console.log(`curl -I "${signedUrl}"`);

    // Also generate cookies for browser testing
    const cookies = await generateSignedCookies('*');
    if (cookies) {
      console.log('\n🍪 Signed cookies (valid for 12 hours):');
      for (const [key, value] of Object.entries(cookies)) {
        console.log(`${key}=${value}`);
      }
    }
  }
}

// If called directly
if (require.main === module) {
  main();
}

module.exports = {
  generateSignedUrl,
  generateSignedCookies
};