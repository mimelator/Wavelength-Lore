#!/usr/bin/env node

require('dotenv').config();
const admin = require('firebase-admin');

async function testFirebaseConnection() {
    console.log('🔥 Testing Firebase Connection...\n');
    
    try {
        console.log('📋 Environment check:');
        console.log('- FIREBASE_SERVICE_ACCOUNT exists:', !!process.env.FIREBASE_SERVICE_ACCOUNT);
        console.log('- DATABASE_URL:', process.env.DATABASE_URL);
        
        if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
            throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable not found');
        }
        
        // Parse service account
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        console.log('- Service account project_id:', serviceAccount.project_id);
        
        // Initialize Firebase Admin
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                databaseURL: process.env.DATABASE_URL
            });
        }
        
        console.log('\n🔍 Testing database access...');
        const db = admin.database();
        
        // Test forum data
        const forumRef = db.ref('forum');
        const snapshot = await forumRef.once('value');
        const data = snapshot.val();
        
        console.log('📊 Forum data exists:', !!data);
        if (data) {
            console.log('- Categories:', data.categories ? Object.keys(data.categories).length : 0);
            console.log('- Posts:', data.posts ? Object.keys(data.posts).length : 0);
            console.log('- Users:', data.users ? Object.keys(data.users).length : 0);
        }
        
        console.log('\n✅ Firebase connection successful!');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Firebase connection failed:', error.message);
        if (error.code) {
            console.error('Error code:', error.code);
        }
        process.exit(1);
    }
}

testFirebaseConnection();