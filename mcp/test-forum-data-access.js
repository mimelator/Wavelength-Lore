#!/usr/bin/env node

/**
 * Test Forum Data Access
 * Verify that our created forum data can be accessed properly
 */

const { getAdminDatabase } = require('../helpers/firebase-admin-utils');

async function testForumDataAccess() {
  console.log('🧪 Testing Forum Data Access...\n');

  try {
    const db = getAdminDatabase();
    if (!db) {
      throw new Error('Firebase admin not initialized');
    }

    // Test 1: Check if categories exist
    console.log('📂 Test 1: Checking forum categories...');
    const categoriesSnapshot = await db.ref('forum/categories').once('value');
    const categories = categoriesSnapshot.val();
    
    if (categories) {
      console.log(`   ✅ Found ${Object.keys(categories).length} categories:`);
      Object.keys(categories).forEach(key => {
        console.log(`      - ${categories[key].title} (${key})`);
      });
    } else {
      console.log('   ❌ No categories found');
    }

    // Test 2: Check if posts exist
    console.log('\n📝 Test 2: Checking forum posts...');
    const postsSnapshot = await db.ref('forum/posts').once('value');
    const posts = postsSnapshot.val();
    
    if (posts) {
      console.log(`   ✅ Found ${Object.keys(posts).length} posts:`);
      Object.keys(posts).forEach(key => {
        const post = posts[key];
        console.log(`      - "${post.title}" by ${post.authorName} in ${post.forumId}`);
        console.log(`        ID: ${key}`);
        console.log(`        Replies: ${post.replyCount || 0}, Views: ${post.views || 0}`);
      });
    } else {
      console.log('   ❌ No posts found');
    }

    // Test 3: Check if replies exist
    console.log('\n💬 Test 3: Checking forum replies...');
    const repliesSnapshot = await db.ref('forum/replies').once('value');
    const replies = repliesSnapshot.val();
    
    if (replies) {
      console.log(`   ✅ Found ${Object.keys(replies).length} replies:`);
      Object.keys(replies).forEach(key => {
        const reply = replies[key];
        console.log(`      - Reply by ${reply.authorName} to post ${reply.postId}`);
        console.log(`        ID: ${key}`);
      });
    } else {
      console.log('   ❌ No replies found');
    }

    // Test 4: Test API endpoint access
    console.log('\n🌐 Test 4: Testing API endpoint access...');
    const http = require('http');
    
    const testEndpoint = (path) => {
      return new Promise((resolve) => {
        const req = http.get(`http://localhost:3001${path}`, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              resolve({ success: res.statusCode === 200, data: parsed, status: res.statusCode });
            } catch (e) {
              resolve({ success: false, error: 'Invalid JSON', status: res.statusCode, raw: data });
            }
          });
        });
        
        req.on('error', (error) => {
          resolve({ success: false, error: error.message });
        });
        
        req.setTimeout(5000, () => {
          req.destroy();
          resolve({ success: false, error: 'Timeout' });
        });
      });
    };

    const recentPostsResult = await testEndpoint('/forum/api/posts/recent');
    if (recentPostsResult.success) {
      console.log(`   ✅ Recent posts API: ${recentPostsResult.data.posts?.length || 0} posts returned`);
    } else {
      console.log(`   ❌ Recent posts API failed: ${recentPostsResult.error || recentPostsResult.status}`);
    }

    const statsResult = await testEndpoint('/forum/api/stats');
    if (statsResult.success) {
      console.log(`   ✅ Stats API: ${statsResult.data.stats?.totalPosts || 0} total posts`);
    } else {
      console.log(`   ❌ Stats API failed: ${statsResult.error || statsResult.status}`);
    }

    console.log('\n🎯 Forum Data Access Test Complete!');
    console.log('\n📋 Summary:');
    console.log(`   📂 Categories: ${categories ? Object.keys(categories).length : 0}`);
    console.log(`   📝 Posts: ${posts ? Object.keys(posts).length : 0}`);
    console.log(`   💬 Replies: ${replies ? Object.keys(replies).length : 0}`);
    console.log(`   🌐 API Status: ${recentPostsResult.success && statsResult.success ? 'Working' : 'Issues detected'}`);

    if (posts && Object.keys(posts).length > 0) {
      const firstPostId = Object.keys(posts)[0];
      console.log(`\n🔗 Test the post page at: http://localhost:3001/forum/post/${firstPostId}`);
    }

  } catch (error) {
    console.error('❌ Error testing forum data access:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

// Run the test
testForumDataAccess();