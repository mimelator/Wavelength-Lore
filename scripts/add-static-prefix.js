#!/usr/bin/env node

/**
 * Add static/ prefix to all relative image paths in Firebase database
 * This script converts paths like /images/... to /static/images/...
 * to match the S3 bucket structure for CloudFront compatibility
 */

const { initScriptEnv } = require('./utils/env-loader');

// Initialize environment with required variables
initScriptEnv(['DATABASE_URL']);

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('../firebaseServiceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.DATABASE_URL
});

const db = admin.database();

async function addStaticPrefixToDatabase() {
  console.log('🔧 Starting static prefix update for database URLs...');
  
  let totalUpdated = 0;
  
  try {
    // Get all data
    const snapshot = await db.ref().once('value');
    const data = snapshot.val();
    
    if (!data) {
      console.log('❌ No data found in database');
      return;
    }
    
    // Function to recursively update image paths
    function updateImagePaths(obj, currentPath = '') {
      if (!obj || typeof obj !== 'object') return obj;
      
      const updated = Array.isArray(obj) ? [] : {};
      
      for (const [key, value] of Object.entries(obj)) {
        const fullPath = currentPath ? `${currentPath}.${key}` : key;
        
        if (typeof value === 'string') {
          // Check if it's an image path that needs static/ prefix
          if (value.startsWith('/images/') && !value.startsWith('/static/')) {
            const newValue = '/static' + value;
            console.log(`  📝 ${fullPath}: "${value}" → "${newValue}"`);
            updated[key] = newValue;
            totalUpdated++;
          } else {
            updated[key] = value;
          }
        } else if (value && typeof value === 'object') {
          updated[key] = updateImagePaths(value, fullPath);
        } else {
          updated[key] = value;
        }
      }
      
      return updated;
    }
    
    console.log('🔍 Scanning database for image paths...');
    const updatedData = updateImagePaths(data);
    
    if (totalUpdated > 0) {
      console.log(`\n📊 Summary: Found ${totalUpdated} paths to update`);
      console.log('💾 Updating database...');
      
      // Update the database with the new data
      await db.ref().set(updatedData);
      
      console.log(`✅ Successfully updated ${totalUpdated} image paths with static/ prefix`);
    } else {
      console.log('ℹ️  No image paths found that need static/ prefix');
    }
    
  } catch (error) {
    console.error('❌ Error updating database:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    await addStaticPrefixToDatabase();
    console.log('\n🎉 Database static prefix update completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n💥 Database static prefix update failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { addStaticPrefixToDatabase };