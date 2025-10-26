#!/usr/bin/env node

require('dotenv').config();

async function testFirebaseDirect() {
    try {
        const firebaseService = require('../services/firebase-admin');
        const db = firebaseService.getDatabase();
        
        console.log('🔥 Testing Firebase direct access...');
        
        const snapshot = await db.ref('forum/posts').once('value');
        const posts = snapshot.val();
        
        console.log('Posts found:', posts ? Object.keys(posts).length : 0);
        
        if (posts) {
            Object.entries(posts).slice(0, 2).forEach(([id, post]) => {
                console.log(`- "${post.title}" by ${post.authorName}`);
            });
        }
        
    } catch (error) {
        console.error('Direct test failed:', error.message);
        process.exit(1);
    }
    
    process.exit(0);
}

testFirebaseDirect();