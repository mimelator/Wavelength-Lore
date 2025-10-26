#!/usr/bin/env node

/**
 * Forum Cleanup Script
 * Remove test forum data when ready
 */

const { getAdminDatabase } = require('../helpers/firebase-admin-utils');

async function cleanupForumDemo() {
  console.log('🧹 Forum Demo Cleanup Script\n');

  try {
    const db = getAdminDatabase();
    if (!db) {
      throw new Error('Firebase admin not initialized');
    }

    console.log('📋 Items to clean up:');
    console.log('   📂 Category: "Goblins Beware" (goblins-beware)');
    console.log('   📝 Post: "Goblin King Sighting Near Crystal Caves!"');
    console.log('   💬 Reply: Response from Healer Mira');

    // Remove the test post
    const postId = 'goblin_post_1761446701776';
    await db.ref(`forum/posts/${postId}`).remove();
    console.log('   ✅ Removed test post');

    // Remove the test reply
    const replyId = 'goblin_reply_1761446701830';
    await db.ref(`forum/replies/${replyId}`).remove();
    console.log('   ✅ Removed test reply');

    // Remove the test category
    await db.ref('forum/categories/goblins-beware').remove();
    console.log('   ✅ Removed test category');

    console.log('\n🎉 Forum demo cleanup complete!');
    console.log('   Forum is now clean and ready for production use');

  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

// Check if script should run
const args = process.argv.slice(2);
if (args.includes('--confirm')) {
  cleanupForumDemo();
} else {
  console.log('🧹 Forum Demo Cleanup Script');
  console.log('\nThis will remove:');
  console.log('   📂 "Goblins Beware" category');
  console.log('   📝 Goblin King post and reply');
  console.log('\nTo proceed, run:');
  console.log('   node mcp/create-forum-cleanup-script.js --confirm');
}