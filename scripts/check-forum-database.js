#!/usr/bin/env node

/**
 * Quick Forum Database Check
 * 
 * Simple script to check what forum posts exist in the database
 */

require('dotenv').config();
const admin = require('firebase-admin');
const path = require('path');

async function checkForumDatabase() {
  console.log('🔍 Checking forum database...');
  
  try {
    // Initialize Firebase Admin
    const serviceAccountPath = path.join(__dirname, '../firebaseServiceAccountKey.json');
    const adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath),
      databaseURL: process.env.DATABASE_URL
    }, 'forum-check');

    const database = adminApp.database();
    
    // Check posts
    const postsSnapshot = await database.ref('forum/posts').once('value');
    const postsData = postsSnapshot.val();
    
    // Check replies
    const repliesSnapshot = await database.ref('forum/replies').once('value');
    const repliesData = repliesSnapshot.val();
    
    console.log('\n📊 Forum Database Status:');
    
    if (postsData) {
      const posts = Object.entries(postsData);
      console.log(`📝 Posts: ${posts.length}`);
      posts.forEach(([id, post]) => {
        console.log(`  • ${id}: "${post.title || 'Untitled'}" by ${post.authorName || 'Unknown'}`);
      });
    } else {
      console.log('📝 Posts: 0 (database is clean)');
    }
    
    if (repliesData) {
      const replies = Object.entries(repliesData);
      console.log(`💬 Replies: ${replies.length}`);
      replies.forEach(([id, reply]) => {
        console.log(`  • ${id}: "${(reply.content || '').substring(0, 50)}..." by ${reply.authorName || 'Unknown'}`);
      });
    } else {
      console.log('💬 Replies: 0 (database is clean)');
    }
    
    console.log('\n✅ Database check complete');
    
    // Cleanup
    await adminApp.delete();
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    process.exit(1);
  }
}

checkForumDatabase().catch(console.error);