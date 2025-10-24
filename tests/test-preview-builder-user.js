#!/usr/bin/env node
/**
 * TEST: Validate user has gallery images before preview generation
 */

require('dotenv').config();
const { initializeFirebaseAdmin } = require('../helpers/firebase-admin-utils');
const galleryStorage = require('../utils/gallery/storage');

async function testUserGalleryImages() {
  console.log('🧪 TEST: User Gallery Images Validation\n');
  
  try {
    // Initialize Firebase
    initializeFirebaseAdmin();
    const admin = require('firebase-admin');
    
    // Get forum admin user (the one with email)
    console.log('1️⃣ Finding forum admin user...');
    const listUsersResult = await admin.app('admin').auth().listUsers(100);
    
    let forumAdminUser = null;
    for (const user of listUsersResult.users) {
      if (user.email) {
        console.log(`   Found user with email: ${user.email} (${user.uid})`);
        forumAdminUser = user;
        break;
      }
    }
    
    if (!forumAdminUser) {
      console.log('❌ TEST FAILED: No user with email found');
      process.exit(1);
    }
    
    console.log(`✅ Forum admin user: ${forumAdminUser.uid}\n`);
    
    // Check gallery images
    console.log('2️⃣ Checking gallery images...');
    const userImages = await galleryStorage.listUserGalleryImages(forumAdminUser.uid);
    
    console.log(`   Found ${userImages.length} gallery images`);
    
    if (userImages.length === 0) {
      console.log('❌ TEST FAILED: User has no gallery images');
      process.exit(1);
    }
    
    console.log('✅ User has gallery images\n');
    
    // Display first few images with FULL structure
    console.log('📸 Sample images with structure:');
    userImages.slice(0, 3).forEach((img, i) => {
      console.log(`   ${i + 1}. Full object:`, JSON.stringify(img, null, 2));
      console.log(`      img.key: ${img.key}`);
      console.log(`      img.Key: ${img.Key}`);
      console.log(`      img.id: ${img.id}`);
    });
    
    console.log('\n✅ ALL VALIDATIONS PASSED');
    console.log(`\n💡 Use this user ID: ${forumAdminUser.uid}`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    process.exit(1);
  }
}

testUserGalleryImages();
