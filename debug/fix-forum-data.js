#!/usr/bin/env node

const admin = require('firebase-admin');

async function fixForumData() {
    console.log('🔧 Fixing Forum Data...\n');
    
    try {
        // Initialize Firebase Admin SDK
        if (!admin.apps.length) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                databaseURL: process.env.DATABASE_URL
            });
        }
        
        const db = admin.database();
        
        // Check existing data
        const forumRef = db.ref('forum');
        const snapshot = await forumRef.once('value');
        const forumData = snapshot.val();
        
        console.log('📊 Current forum data:', forumData ? 'EXISTS' : 'EMPTY');
        
        if (forumData) {
            console.log('📁 Categories:', forumData.categories ? Object.keys(forumData.categories).length : 0);
            console.log('📝 Posts:', forumData.posts ? Object.keys(forumData.posts).length : 0);
            console.log('👥 Users:', forumData.users ? Object.keys(forumData.users).length : 0);
        }
        
        // Initialize categories if missing
        if (!forumData || !forumData.categories) {
            console.log('\n🔧 Initializing forum categories...');
            
            const categories = {
                general: {
                    id: 'general',
                    title: 'General Discussion',
                    description: 'Talk about Wavelength episodes, characters, and music',
                    color: '#4a47a3',
                    icon: '🎵',
                    postCount: 0,
                    order: 1
                },
                lore: {
                    id: 'lore',
                    title: 'Lore & Theories',
                    description: 'Dive deep into Wavelength lore, analyze episodes, and share theories',
                    color: '#6a4c93',
                    icon: '📜',
                    postCount: 0,
                    order: 2
                },
                episodes: {
                    id: 'episodes',
                    title: 'Episode Discussions',
                    description: 'Discuss specific episodes, favorite moments, and episode reviews',
                    color: '#e74c3c',
                    icon: '🎬',
                    postCount: 0,
                    order: 3
                },
                fanart: {
                    id: 'fanart',
                    title: 'Fan Creations',
                    description: 'Share fan art, music covers, and creative works inspired by Wavelength',
                    color: '#9b59b6',
                    icon: '🎨',
                    postCount: 0,
                    order: 4
                }
            };
            
            await db.ref('forum/categories').set(categories);
            console.log('✅ Categories initialized');
        }
        
        console.log('\n✅ Forum data check complete!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
    
    process.exit(0);
}

fixForumData();