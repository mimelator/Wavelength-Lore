#!/usr/bin/env node

/**
 * Fix Individual Forum Posts
 * Diagnose and fix issues with individual forum post pages
 */

const { getAdminDatabase } = require('../helpers/firebase-admin-utils');

async function fixIndividualPosts() {
    console.log('🔧 Fixing Individual Forum Posts...\n');
    
    try {
        // Test Firebase connection
        const db = getAdminDatabase();
        if (!db) {
            console.log('❌ Firebase not initialized - this is the main issue!');
            console.log('💡 Check firebaseServiceAccountKey.json exists in project root');
            console.log('💡 Check environment variables are set correctly');
            return;
        }
        console.log('✅ Firebase connection working');
        
        // Get posts to test with
        const postsSnapshot = await db.ref('forum/posts').once('value');
        const allPosts = postsSnapshot.val() || {};
        const postIds = Object.keys(allPosts);
        
        console.log(`📊 Found ${postIds.length} posts in database`);
        
        if (postIds.length === 0) {
            console.log('❌ No posts found - need to create test posts first');
            return;
        }
        
        // Test first post
        const testPostId = postIds[0];
        const postData = allPosts[testPostId];
        
        console.log(`\n🎯 Testing post: ${testPostId}`);
        console.log(`   Title: "${postData.title || 'NO TITLE'}"`);
        console.log(`   Content: ${postData.content ? postData.content.length + ' chars' : 'NO CONTENT'}`);
        console.log(`   Author: ${postData.authorName || 'NO AUTHOR'}`);
        
        // Simulate route logic
        const post = { id: testPostId, ...postData };
        
        // Get replies
        const repliesSnapshot = await db.ref('forum/replies').once('value');
        const allReplies = repliesSnapshot.val() || {};
        const postReplies = Object.values(allReplies)
            .filter(reply => reply.postId === testPostId);
        
        // Create template data exactly like the route
        const templateData = {
            post: post,
            replies: postReplies,
            title: post.title || 'Forum Post',
            cdnUrl: process.env.CDN_URL || '',
            version: `v${Date.now()}`
        };
        
        console.log('\n✅ Route simulation successful!');
        console.log('📋 Template data structure:');
        console.log(`   - post: ${!!templateData.post ? 'EXISTS' : 'MISSING'}`);
        console.log(`   - replies: ${Array.isArray(templateData.replies) ? templateData.replies.length + ' items' : 'INVALID'}`);
        console.log(`   - title: "${templateData.title}"`);
        console.log(`   - cdnUrl: "${templateData.cdnUrl}"`);
        console.log(`   - version: "${templateData.version}"`);
        
        console.log(`\n🌐 Test this URL: http://localhost:3001/forum/post/${testPostId}`);
        console.log('\n🎯 If the URL still doesn\'t work, the issue is likely:');
        console.log('   1. Server not running (npm start)');
        console.log('   2. Route not mounted properly in app.js');
        console.log('   3. Template rendering error');
        console.log('   4. Missing CSS/JS dependencies');
        
    } catch (error) {
        console.error('💥 Error:', error.message);
        console.error('Stack:', error.stack);
    }
    
    process.exit(0);
}

fixIndividualPosts();