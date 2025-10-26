#!/usr/bin/env node

/**
 * Test Post Display
 * Creates a test post and verifies it can be displayed
 */

const { getAdminDatabase } = require('../helpers/firebase-admin-utils');

async function testPostDisplay() {
    console.log('🧪 Testing Individual Post Display...\n');
    
    try {
        const db = getAdminDatabase();
        if (!db) {
            console.log('❌ Firebase not initialized');
            return;
        }
        
        // Create a simple test post
        const testPostId = 'test-post-' + Date.now();
        const testPost = {
            title: 'Test Post for Individual Display',
            content: 'This is a test post to verify that individual forum post pages are working correctly. If you can see this content, the individual post display is functioning properly!',
            authorName: 'Test User',
            authorId: 'test-user-123',
            authorAvatar: '/icons/hero-icon.svg',
            category: 'general',
            forumId: 'general',
            createdAt: Date.now(),
            views: 0,
            likes: 0,
            replyCount: 0,
            tags: ['test', 'debug']
        };
        
        console.log('📝 Creating test post...');
        await db.ref(`forum/posts/${testPostId}`).set(testPost);
        console.log('✅ Test post created successfully');
        
        // Verify the post was created
        const postSnapshot = await db.ref(`forum/posts/${testPostId}`).once('value');
        const retrievedPost = postSnapshot.val();
        
        if (retrievedPost) {
            console.log('✅ Test post verified in database');
            console.log(`📝 Title: ${retrievedPost.title}`);
            console.log(`📄 Content: ${retrievedPost.content.substring(0, 50)}...`);
            console.log(`👤 Author: ${retrievedPost.authorName}`);
            
            console.log(`\n🌐 Test URL: http://localhost:3001/forum/post/${testPostId}`);
            console.log('\n🎯 Visit this URL to test individual post display');
            console.log('   If it works: Individual posts are functioning correctly');
            console.log('   If it fails: Check server logs for specific errors');
            
            // Also create a test reply
            const testReplyId = 'reply-' + Date.now();
            const testReply = {
                postId: testPostId,
                content: 'This is a test reply to verify that replies are also displaying correctly.',
                authorName: 'Reply User',
                authorId: 'reply-user-123',
                authorAvatar: '/icons/hero-icon.svg',
                createdAt: Date.now() + 1000
            };
            
            await db.ref(`forum/replies/${testReplyId}`).set(testReply);
            console.log('✅ Test reply created');
            
        } else {
            console.log('❌ Failed to verify test post in database');
        }
        
    } catch (error) {
        console.error('💥 Error:', error.message);
    }
    
    process.exit(0);
}

testPostDisplay();