#!/usr/bin/env node

require('dotenv').config();
const admin = require('firebase-admin');

async function checkFirebaseData() {
    console.log('🔍 Checking Firebase Forum Data...\n');
    
    try {
        // Initialize Firebase Admin SDK
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                databaseURL: process.env.DATABASE_URL
            });
        }
        
        const db = admin.database();
        
        // Check forum structure
        console.log('📊 Checking forum structure...');
        const forumRef = db.ref('forum');
        const forumSnapshot = await forumRef.once('value');
        const forumData = forumSnapshot.val();
        
        if (!forumData) {
            console.log('❌ No forum data found');
            return;
        }
        
        console.log('✅ Forum data exists');
        console.log('📁 Top-level keys:', Object.keys(forumData));
        
        // Check categories
        if (forumData.categories) {
            console.log('\n📁 Categories:');
            Object.entries(forumData.categories).forEach(([id, cat]) => {
                console.log(`  - ${id}: ${cat.title} (${cat.postCount || 0} posts)`);
            });
        }
        
        // Check posts
        if (forumData.posts) {
            console.log('\n📝 Posts:');
            console.log(`  Total: ${Object.keys(forumData.posts).length}`);
            Object.entries(forumData.posts).slice(0, 5).forEach(([id, post]) => {
                console.log(`  - "${post.title}" by ${post.authorName} (${new Date(post.createdAt).toLocaleDateString()})`);
            });
        }
        
        // Check users
        if (forumData.users) {
            console.log('\n👥 Users:');
            console.log(`  Total: ${Object.keys(forumData.users).length}`);
            Object.entries(forumData.users).slice(0, 3).forEach(([id, user]) => {
                console.log(`  - ${user.name} (${user.postCount || 0} posts, ${user.replyCount || 0} replies)`);
            });
        }
        
        // Check replies
        if (forumData.replies) {
            console.log('\n💬 Replies:');
            console.log(`  Total: ${Object.keys(forumData.replies).length}`);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkFirebaseData();