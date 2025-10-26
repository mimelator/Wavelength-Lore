#!/usr/bin/env node

/**
 * Test Firebase connection and check existing forum data
 */

const admin = require('firebase-admin');

async function testFirebaseConnection() {
    console.log('🔥 Testing Firebase Connection...\n');
    
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
        console.log('✅ Firebase Admin SDK initialized');
        
        // Test connection by reading forum data
        console.log('📊 Checking forum data...');
        
        // Check categories
        const categoriesRef = db.ref('forum/categories');
        const categoriesSnapshot = await categoriesRef.once('value');
        const categories = categoriesSnapshot.val();
        
        console.log('📁 Categories:', categories ? Object.keys(categories).length : 0);
        if (categories) {
            Object.entries(categories).forEach(([id, cat]) => {
                console.log(`  - ${id}: ${cat.title}`);
            });
        }
        
        // Check posts
        const postsRef = db.ref('forum/posts');
        const postsSnapshot = await postsRef.once('value');
        const posts = postsSnapshot.val();
        
        console.log('📝 Posts:', posts ? Object.keys(posts).length : 0);
        if (posts) {
            Object.entries(posts).slice(0, 5).forEach(([id, post]) => {
                console.log(`  - ${post.title} by ${post.authorName}`);
            });
        }
        
        // Check users
        const usersRef = db.ref('forum/users');
        const usersSnapshot = await usersRef.once('value');
        const users = usersSnapshot.val();
        
        console.log('👥 Users:', users ? Object.keys(users).length : 0);
        
        if (!categories && !posts && !users) {
            console.log('\n⚠️ No forum data found. Initializing basic categories...');
            await initializeForumData(db);
        }
        
    } catch (error) {
        console.error('❌ Firebase connection failed:', error.message);
    }
}

async function initializeForumData(db) {
    try {
        const categories = {
            general: {
                id: 'general',
                title: 'General Discussion',
                description: 'Talk about Wavelength episodes, characters, and music',
                color: '#4a47a3',
                icon: '🎵',
                iconSvg: '/icons/hero-icon.svg',
                postCount: 0,
                order: 1
            },
            lore: {
                id: 'lore',
                title: 'Lore & Theories',
                description: 'Dive deep into Wavelength lore, analyze episodes, and share theories',
                color: '#6a4c93',
                icon: '📜',
                iconSvg: '/icons/lore-icon.svg',
                postCount: 0,
                order: 2
            },
            episodes: {
                id: 'episodes',
                title: 'Episode Discussions',
                description: 'Discuss specific episodes, favorite moments, and episode reviews',
                color: '#e74c3c',
                icon: '🎬',
                iconSvg: '/icons/episode-icon.svg',
                postCount: 0,
                order: 3
            },
            fanart: {
                id: 'fanart',
                title: 'Fan Creations',
                description: 'Share fan art, music covers, and creative works inspired by Wavelength',
                color: '#9b59b6',
                icon: '🎨',
                iconSvg: '/icons/hero-icon.svg',
                postCount: 0,
                order: 4
            }
        };
        
        await db.ref('forum/categories').set(categories);
        console.log('✅ Basic forum categories initialized');
        
    } catch (error) {
        console.error('❌ Failed to initialize forum data:', error.message);
    }
}

testFirebaseConnection();