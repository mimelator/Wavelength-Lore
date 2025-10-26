#!/usr/bin/env node

/**
 * Debug Post Data - Wavelength Super Tool
 * Investigates specific post data retrieval issue
 */

async function debugPostData() {
    console.log('🔍 Debugging Post Data Retrieval...\n');
    
    try {
        const { getAdminDatabase } = require('../helpers/firebase-admin-utils');
        const db = getAdminDatabase();
        
        if (!db) {
            console.log('❌ Firebase not initialized');
            return;
        }
        
        console.log('✅ Firebase connected successfully');
        
        // Test the specific problematic post
        const postId = '-OcTbtWHy2QvT9yGl89x';
        console.log(`\n🎯 Testing Post ID: ${postId}`);
        
        const postSnapshot = await db.ref(`forum/posts/${postId}`).once('value');
        const post = postSnapshot.val();
        
        console.log('📊 Post exists:', !!post);
        
        if (post) {
            console.log('📝 Post data:');
            console.log('   Title:', post.title || 'NO TITLE');
            console.log('   Content length:', post.content ? post.content.length : 0);
            console.log('   Author:', post.authorName || 'NO AUTHOR');
            console.log('   Created:', post.createdAt ? new Date(post.createdAt).toISOString() : 'NO DATE');
            console.log('   Keys:', Object.keys(post));
            
            if (post.content) {
                console.log('   Content preview:', post.content.substring(0, 100) + '...');
            }
        } else {
            console.log('❌ Post not found in database');
        }
        
        // Test all posts to see structure
        console.log('\n📋 Testing all posts structure...');
        const allPostsSnapshot = await db.ref('forum/posts').once('value');
        const allPosts = allPostsSnapshot.val() || {};
        
        console.log(`📊 Total posts in database: ${Object.keys(allPosts).length}`);
        
        Object.entries(allPosts).forEach(([id, postData]) => {
            console.log(`   ${id}: "${postData.title || 'NO TITLE'}" by ${postData.authorName || 'NO AUTHOR'}`);
        });
        
        process.exit(0);
        
    } catch (error) {
        console.error('💥 Debug failed:', error);
        process.exit(1);
    }
}

debugPostData();