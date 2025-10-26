#!/usr/bin/env node

const { getAdminDatabase } = require('../helpers/firebase-admin-utils');

async function superPostTest() {
    console.log('🌊⚡ WAVELENGTH SUPER POWERS: Individual Post Test');
    
    try {
        const db = getAdminDatabase();
        if (!db) {
            console.log('❌ Firebase not initialized');
            return;
        }
        
        const postsSnapshot = await db.ref('forum/posts').once('value');
        const allPosts = postsSnapshot.val() || {};
        const postIds = Object.keys(allPosts);
        
        if (postIds.length === 0) {
            console.log('❌ No posts found');
            return;
        }
        
        const testPostId = postIds[0];
        const postData = allPosts[testPostId];
        const post = { id: testPostId, ...postData };
        
        console.log(`🎯 Testing: ${testPostId}`);
        console.log(`📝 Title: ${post.title || 'NO TITLE'}`);
        console.log(`📄 Content: ${post.content ? post.content.length + ' chars' : 'NO CONTENT'}`);
        console.log(`👤 Author: ${post.authorName || 'NO AUTHOR'}`);
        
        console.log(`\n🌐 Test URL: http://localhost:3001/forum/post/${testPostId}`);
        console.log('✅ Super test complete!');
        
    } catch (error) {
        console.error('💥 Super test error:', error.message);
    }
    
    process.exit(0);
}

superPostTest();