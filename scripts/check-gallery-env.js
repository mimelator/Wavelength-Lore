#!/usr/bin/env node

/**
 * Gallery Environment Checker
 * 
 * This script checks if the required environment variables for the gallery feature
 * are properly set up and helps to create or update .env files as needed.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Required variables for gallery functionality
const requiredVars = [
  'ACCESS_KEY_ID',
  'SECRET_ACCESS_KEY',
  'GALLERY_S3_BUCKET',
  'AWS_REGION',
  'CDN_URL'
];

// Load current environment variables
require('dotenv').config();

/**
 * Main function to check and set up environment variables
 */
async function main() {
  console.log(`${colors.bold}${colors.blue}========================================${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}   GALLERY ENVIRONMENT CHECKER         ${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}========================================${colors.reset}\n`);
  
  console.log(`${colors.cyan}Checking if required environment variables are set up...${colors.reset}\n`);
  
  const missingVars = [];
  const setVars = [];
  
  // Check current environment variables
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      console.log(`${colors.yellow}⚠ ${varName} is not set${colors.reset}`);
      missingVars.push(varName);
    } else {
      if (varName.includes('SECRET') || varName.includes('KEY')) {
        console.log(`${colors.green}✓ ${varName} is set to: ${process.env[varName].substring(0, 3)}...${process.env[varName].substring(process.env[varName].length - 3)}${colors.reset}`);
      } else {
        console.log(`${colors.green}✓ ${varName} is set to: ${process.env[varName]}${colors.reset}`);
      }
      setVars.push(varName);
    }
  }
  
  // Check for AWS credential format inconsistency
  if (process.env.AWS_ACCESS_KEY_ID && !process.env.ACCESS_KEY_ID) {
    console.log(`\n${colors.yellow}⚠ AWS_ACCESS_KEY_ID is set but ACCESS_KEY_ID is not. The gallery uses ACCESS_KEY_ID format.${colors.reset}`);
    const copyResponse = await askQuestion('Would you like to copy AWS_ACCESS_KEY_ID to ACCESS_KEY_ID? (y/n) ');
    
    if (copyResponse.toLowerCase() === 'y') {
      process.env.ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
      console.log(`${colors.green}✓ Set ACCESS_KEY_ID = ${process.env.AWS_ACCESS_KEY_ID.substring(0, 3)}...${process.env.AWS_ACCESS_KEY_ID.substring(process.env.AWS_ACCESS_KEY_ID.length - 3)}${colors.reset}`);
      setVars.push('ACCESS_KEY_ID');
      missingVars.splice(missingVars.indexOf('ACCESS_KEY_ID'), 1);
    }
  }
  
  // Check for AWS secret key format inconsistency
  if (process.env.AWS_SECRET_ACCESS_KEY && !process.env.SECRET_ACCESS_KEY) {
    console.log(`\n${colors.yellow}⚠ AWS_SECRET_ACCESS_KEY is set but SECRET_ACCESS_KEY is not. The gallery uses SECRET_ACCESS_KEY format.${colors.reset}`);
    const copyResponse = await askQuestion('Would you like to copy AWS_SECRET_ACCESS_KEY to SECRET_ACCESS_KEY? (y/n) ');
    
    if (copyResponse.toLowerCase() === 'y') {
      process.env.SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
      console.log(`${colors.green}✓ Set SECRET_ACCESS_KEY = ${process.env.AWS_SECRET_ACCESS_KEY.substring(0, 3)}...${process.env.AWS_SECRET_ACCESS_KEY.substring(process.env.AWS_SECRET_ACCESS_KEY.length - 3)}${colors.reset}`);
      setVars.push('SECRET_ACCESS_KEY');
      missingVars.splice(missingVars.indexOf('SECRET_ACCESS_KEY'), 1);
    }
  }
  
  // If any variables are still missing, offer to set them up
  if (missingVars.length > 0) {
    console.log(`\n${colors.yellow}Some required environment variables are missing. Let's set them up.${colors.reset}\n`);
    
    const newEnvVars = {};
    
    for (const varName of missingVars) {
      let defaultValue = '';
      
      // Suggest default values
      if (varName === 'AWS_REGION') {
        defaultValue = 'us-east-1';
      } else if (varName === 'GALLERY_S3_BUCKET') {
        defaultValue = 'wavelength-lore-gallery';
      }
      
      // Mask input for sensitive variables
      if (varName.includes('SECRET') || varName.includes('KEY')) {
        const value = await askQuestion(`Enter ${varName}${defaultValue ? ` (default: ${defaultValue})` : ''}: `, true);
        newEnvVars[varName] = value || defaultValue;
      } else {
        const value = await askQuestion(`Enter ${varName}${defaultValue ? ` (default: ${defaultValue})` : ''}: `);
        newEnvVars[varName] = value || defaultValue;
      }
      
      if (newEnvVars[varName]) {
        process.env[varName] = newEnvVars[varName];
      }
    }
    
    // Ask if the user wants to save these to .env file
    const saveResponse = await askQuestion('\nWould you like to save these values to your .env file? (y/n) ');
    
    if (saveResponse.toLowerCase() === 'y') {
      await updateEnvFile(newEnvVars);
    }
  }
  
  // If all variables are set, check if they actually work
  if (missingVars.length === 0 || missingVars.every(varName => process.env[varName])) {
    console.log(`\n${colors.green}All required environment variables are set!${colors.reset}`);
    console.log(`\nWould you like to test the S3 connection to verify your settings?`);
    const testResponse = await askQuestion('Run S3 connection test? (y/n) ');
    
    if (testResponse.toLowerCase() === 'y') {
      await testS3Connection();
    }
  } else {
    console.log(`\n${colors.yellow}⚠ Some environment variables are still not set. The gallery feature might not work correctly.${colors.reset}`);
    console.log(`Please make sure all required variables are set before using the gallery feature.`);
  }
  
  rl.close();
}

/**
 * Ask a question on the command line
 * @param {string} question - The question to ask
 * @param {boolean} mask - Whether to mask the input (for passwords)
 * @returns {Promise<string>} - The user's response
 */
function askQuestion(question, mask = false) {
  return new Promise((resolve) => {
    if (!mask) {
      rl.question(question, (answer) => {
        resolve(answer);
      });
    } else {
      // For masked input (passwords)
      process.stdout.write(question);
      
      let input = '';
      process.stdin.resume();
      process.stdin.setRawMode(true);
      
      process.stdin.on('data', function listener(char) {
        char = char.toString();
        
        // Ctrl+C
        if (char === '\u0003') {
          process.exit();
        }
        
        // Enter key
        if (char === '\r' || char === '\n') {
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdin.removeListener('data', listener);
          process.stdout.write('\n');
          resolve(input);
          return;
        }
        
        // Backspace
        if (char === '\u0008' || char === '\u007f') {
          if (input.length > 0) {
            input = input.slice(0, -1);
            process.stdout.write('\b \b');
          }
          return;
        }
        
        // Any other character
        input += char;
        process.stdout.write('*');
      });
    }
  });
}

/**
 * Update the .env file with new variables
 * @param {Object} newVars - Object with new variables to add
 */
async function updateEnvFile(newVars) {
  const envPath = path.resolve(process.cwd(), '.env');
  
  try {
    let envContent = '';
    
    // Read existing .env file if it exists
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
      console.log(`${colors.green}✓ Found existing .env file${colors.reset}`);
    } else {
      console.log(`${colors.yellow}⚠ No .env file found. Creating a new one.${colors.reset}`);
    }
    
    // Parse existing variables
    const envLines = envContent.split('\n');
    const existingVars = {};
    
    envLines.forEach(line => {
      if (line.trim() && !line.startsWith('#')) {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          existingVars[match[1].trim()] = match[2].trim();
        }
      }
    });
    
    // Merge with new variables
    const finalVars = { ...existingVars, ...newVars };
    
    // Create new .env content
    let newEnvContent = '';
    
    if (envContent.includes('# Gallery Configuration')) {
      // If gallery section already exists, replace it
      const sections = envContent.split('\n\n');
      let gallerySection = null;
      
      for (let i = 0; i < sections.length; i++) {
        if (sections[i].includes('# Gallery Configuration')) {
          gallerySection = i;
          break;
        }
      }
      
      if (gallerySection !== null) {
        // Replace gallery section
        sections[gallerySection] = createGallerySection(newVars);
        newEnvContent = sections.join('\n\n');
      } else {
        // Append gallery section
        newEnvContent = envContent + '\n\n' + createGallerySection(newVars);
      }
    } else {
      // Create a new gallery section
      if (envContent && !envContent.endsWith('\n\n')) {
        newEnvContent = envContent + '\n\n';
      } else {
        newEnvContent = envContent;
      }
      
      newEnvContent += createGallerySection(newVars);
    }
    
    // Write to .env file
    fs.writeFileSync(envPath, newEnvContent);
    console.log(`${colors.green}✓ Successfully updated .env file with gallery settings${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.red}Error updating .env file: ${error.message}${colors.reset}`);
  }
}

/**
 * Create a gallery section for the .env file
 * @param {Object} vars - Gallery-related variables
 * @returns {string} - Gallery section content
 */
function createGallerySection(vars) {
  let section = '# Gallery Configuration\n';
  section += '# Settings for the photo gallery feature\n';
  
  Object.keys(vars).forEach(key => {
    section += `${key}=${vars[key]}\n`;
  });
  
  return section;
}

/**
 * Test the S3 connection with current settings
 */
async function testS3Connection() {
  console.log(`\n${colors.cyan}Testing S3 connection with your credentials...${colors.reset}\n`);
  
  try {
    // Dynamically import AWS SDK
    const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');
    
    // Create S3 client
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID,
        secretAccessKey: process.env.SECRET_ACCESS_KEY
      }
    });
    
    // List buckets as a simple connectivity test
    const command = new ListBucketsCommand({});
    const response = await s3Client.send(command);
    
    console.log(`${colors.green}✓ Successfully connected to AWS S3!${colors.reset}`);
    console.log(`${colors.cyan}Found ${response.Buckets.length} buckets:${colors.reset}`);
    
    const targetBucket = process.env.GALLERY_S3_BUCKET;
    let bucketExists = false;
    
    response.Buckets.forEach(bucket => {
      const isBucket = bucket.Name === targetBucket;
      console.log(`  ${isBucket ? colors.green : ''}${bucket.Name}${isBucket ? ' (Gallery Bucket)' : ''}${isBucket ? colors.reset : ''}`);
      if (isBucket) bucketExists = true;
    });
    
    if (bucketExists) {
      console.log(`\n${colors.green}✓ Your gallery bucket "${targetBucket}" exists and is accessible.${colors.reset}`);
      console.log(`${colors.green}✓ Gallery feature should work correctly with these settings.${colors.reset}`);
    } else {
      console.log(`\n${colors.yellow}⚠ Your gallery bucket "${targetBucket}" was NOT found in your AWS account!${colors.reset}`);
      console.log(`You need to create this bucket before the gallery feature will work.`);
      console.log(`Use the AWS Management Console or run: aws s3 mb s3://${targetBucket}`);
    }
    
    return true;
  } catch (error) {
    console.error(`${colors.red}❌ S3 connection test failed:${colors.reset}`);
    console.error(`${colors.red}${error.message}${colors.reset}`);
    
    if (error.name === 'CredentialsProviderError' || error.message.includes('credential') || error.message.includes('authentication')) {
      console.error(`\n${colors.yellow}This looks like an authentication issue with your AWS credentials.${colors.reset}`);
      console.error(`Please double-check your ACCESS_KEY_ID and SECRET_ACCESS_KEY values.`);
    } else if (error.message.includes('Could not load') || error.message.includes('Cannot find module')) {
      console.error(`\n${colors.yellow}Required dependency is missing. Run: npm install @aws-sdk/client-s3${colors.reset}`);
    } else if (error.message.includes('region')) {
      console.error(`\n${colors.yellow}There's an issue with your AWS_REGION setting.${colors.reset}`);
      console.error(`Make sure it's set to a valid region like 'us-east-1', 'us-west-2', etc.`);
    }
    
    return false;
  }
}

// Run the main function
if (require.main === module) {
  main().catch(error => {
    console.error(`${colors.red}Unhandled error:${colors.reset}`, error);
    rl.close();
  });
}

module.exports = {
  checkGalleryEnv: main
};