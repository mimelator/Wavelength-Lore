#!/usr/bin/env node

/**
 * Test Individual Forum Post Loading
 * Tests if individual forum posts can be loaded and rendered properly
 */

const { getAdminDatabase } = require('../helpers/firebase-admin-utils');

async function testIndividualPost() {
    console.log('🧪 Testing Individual Forum Post Loading...\n');
    
    try {
        // Initialize Firebase
        const db = getAdminDatabase();
        if (!db) {
            console.log('❌ Firebase not initialized');
            return;
        }
        
        // Get all posts
        console.log('📋 Fetching all posts...');
        const postsSnapshot = await db.ref('forum/posts').once('value');
        const allPosts = postsSnapshot.val() || {};
        
        const postIds = Object.keys(allPosts);
        console.log(`📊 Found ${postIds.length} posts total`);
        
        if (postIds.length === 0) {
            console.log('❌ No posts found in database');
            return;
        }
        
        // Test first post
        const testPostId = postIds[0];
        console.log(`\n🎯 Testing post: ${testPostId}`);
        
        const postData = allPosts[testPostId];
        const post = { id: testPostId, ...postData };
        
        console.log('📝 Post Details:');
        console.log(`   Title: ${post.title || 'NO TITLE'}`);
        console.log(`   Author: ${post.authorName || 'NO AUTHOR'}`);
        console.log(`   Content Length: ${post.content ? post.content.length : 0} chars`);
        console.log(`   Content Preview: ${post.content ? post.content.substring(0, 100) : 'NO CONTENT'}...`);
        console.log(`   Created: ${post.createdAt ? new Date(post.createdAt).toISOString() : 'NO DATE'}`);
        console.log(`   Views: ${post.views || 0}`);
        
        // Test replies
        console.log('\n💬 Testing replies...');
        const repliesSnapshot = await db.ref('forum/replies').once('value');
        const allReplies = repliesSnapshot.val() || {};
        const postReplies = Object.values(allReplies)
            .filter(reply => reply.postId === testPostId);
        
        console.log(`   Found ${postReplies.length} replies for this post`);
        
        // Test template data structure
        console.log('\n🎨 Template Data Structure:');
        const templateData = {
            post: post,
            replies: postReplies,
            title: post.title || 'Forum Post',
            cdnUrl: process.env.CDN_URL || '',
            version: `v${Date.now()}`
        };
        
        console.log('   Template Keys:', Object.keys(templateData));
        console.log('   Post Object Keys:', Object.keys(templateData.post));
        console.log('   Post Title Type:', typeof templateData.post.title);
        console.log('   Post Content Type:', typeof templateData.post.content);
        
        // Simulate template rendering checks
        console.log('\n✅ Template Rendering Checks:');
        console.log(`   post exists: ${!!templateData.post}`);
        console.log(`   post.title: ${templateData.post.title || 'MISSING'}`);
        console.log(`   post.content: ${templateData.post.content ? 'EXISTS' : 'MISSING'}`);
        console.log(`   post.authorName: ${templateData.post.authorName || 'MISSING'}`);
        console.log(`   replies array: ${Array.isArray(templateData.replies) ? templateData.replies.length + ' items' : 'NOT ARRAY'}`);
        
        console.log('\n🎯 Test URL: http://localhost:3001/forum/post/' + testPostId);
        console.log('✅ Individual post test completed successfully!');
        
    } catch (error) {
        console.error('💥 Error testing individual post:', error);
        console.error('Stack:', error.stack);
    }
    
    process.exit(0);
}

testIndividualPost();