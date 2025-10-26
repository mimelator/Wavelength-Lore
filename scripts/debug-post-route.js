#!/usr/bin/env node

/**
 * Debug Individual Post Route
 * Simulates the exact logic used in the forum post route
 */

const { getAdminDatabase } = require('../helpers/firebase-admin-utils');

async function debugPostRoute() {
    console.log('🔍 Debugging Individual Post Route Logic...\n');
    
    try {
        // Step 1: Initialize Firebase (same as route)
        const db = getAdminDatabase();
        if (!db) {
            console.log('❌ Firebase not initialized - this would cause route failure');
            return;
        }
        console.log('✅ Firebase initialized successfully');
        
        // Step 2: Get a test post ID
        const postsSnapshot = await db.ref('forum/posts').once('value');
        const allPosts = postsSnapshot.val() || {};
        const postIds = Object.keys(allPosts);
        
        if (postIds.length === 0) {
            console.log('❌ No posts found - route would show "Post Not Found"');
            return;
        }
        
        const testPostId = postIds[0];
        console.log(`🎯 Testing with post ID: ${testPostId}`);
        
        // Step 3: Fetch post data (same as route)
        const postSnapshot = await db.ref(`forum/posts/${testPostId}`).once('value');
        const postData = postSnapshot.val();
        
        if (!postData) {
            console.log('❌ Post data not found - route would show "Post Not Found"');
            return;
        }
        
        // Step 4: Create post object with ID (same as route)
        const post = { id: testPostId, ...postData };
        console.log('✅ Post object created with ID field');
        
        // Step 5: Fetch replies (same as route)
        const repliesSnapshot = await db.ref('forum/replies').once('value');
        const allReplies = repliesSnapshot.val() || {};
        const postReplies = Object.values(allReplies)
            .filter(reply => reply.postId === testPostId)
            .sort((a, b) => a.createdAt - b.createdAt);
        
        console.log(`✅ Found ${postReplies.length} replies`);
        
        // Step 6: Create template data (same as route)
        const templateData = {\n            post: post,\n            replies: postReplies,\n            title: post.title || 'Forum Post',\n            cdnUrl: process.env.CDN_URL || '',\n            version: `v${Date.now()}`\n        };\n        \n        // Step 7: Validate template data\n        console.log('\\n📋 Template Data Validation:');\n        console.log(`   post exists: ${!!templateData.post}`);\n        console.log(`   post.id: ${templateData.post.id}`);\n        console.log(`   post.title: ${templateData.post.title || 'MISSING'}`);\n        console.log(`   post.content exists: ${!!templateData.post.content}`);\n        console.log(`   post.content length: ${templateData.post.content ? templateData.post.content.length : 0}`);\n        console.log(`   post.authorName: ${templateData.post.authorName || 'MISSING'}`);\n        console.log(`   replies count: ${templateData.replies.length}`);\n        console.log(`   title: ${templateData.title}`);\n        console.log(`   cdnUrl: ${templateData.cdnUrl}`);\n        console.log(`   version: ${templateData.version}`);\n        \n        // Step 8: Check template requirements\n        console.log('\\n🎨 Template Requirements Check:');\n        const requiredFields = ['post', 'replies', 'title', 'cdnUrl', 'version'];\n        let allFieldsPresent = true;\n        \n        requiredFields.forEach(field => {\n            const exists = templateData.hasOwnProperty(field);\n            console.log(`   ${field}: ${exists ? '✅' : '❌'}`);\n            if (!exists) allFieldsPresent = false;\n        });\n        \n        if (allFieldsPresent) {\n            console.log('\\n✅ All template fields present - route should work!');\n            console.log(`🌐 Test URL: http://localhost:3001/forum/post/${testPostId}`);\n        } else {\n            console.log('\\n❌ Missing template fields - this would cause rendering issues');\n        }\n        \n    } catch (error) {\n        console.error('💥 Debug error:', error.message);\n        console.error('Stack:', error.stack);\n    }\n    \n    process.exit(0);\n}\n\ndebugPostRoute();