#!/usr/bin/env node

require('dotenv').config();
const admin = require('firebase-admin');

async function testAPIFirebase() {
    console.log('🔥 Testing Firebase in API Context...\n');
    
    try {
        // Same initialization as API routes
        if (!admin.apps.length) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                databaseURL: process.env.DATABASE_URL
            });
        }
        
        const db = admin.database();
        
        // Test posts
        const postsRef = db.ref('forum/posts');
        const postsSnapshot = await postsRef.once('value');
        const posts = postsSnapshot.val();
        
        console.log('📝 Posts found:', posts ? Object.keys(posts).length : 0);
        
        if (posts) {
            Object.entries(posts).slice(0, 3).forEach(([id, post]) => {
                console.log(`  - "${post.title}" by ${post.authorName}`);
            });
        }
        
        // Test categories  
        const categoriesRef = db.ref('forum/categories');
        const categoriesSnapshot = await categoriesRef.once('value');
        const categories = categoriesSnapshot.val();
        
        console.log('📁 Categories found:', categories ? Object.keys(categories).length : 0);
        
        console.log('\n✅ Firebase API test complete!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testAPIFirebase();