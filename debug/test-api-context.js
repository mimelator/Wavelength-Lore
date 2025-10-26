#!/usr/bin/env node

const express = require('express');
const app = express();

app.get('/test', async (req, res) => {
    try {
        console.log('Environment vars:', {
            hasServiceAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT,
            hasDatabaseUrl: !!process.env.DATABASE_URL
        });
        
        const admin = require('firebase-admin');
        
        if (admin.apps.length === 0) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                databaseURL: process.env.DATABASE_URL
            });
        }
        
        const db = admin.database();
        const snapshot = await db.ref('forum/posts').once('value');
        const posts = snapshot.val();
        
        res.json({
            success: true,
            posts: posts ? Object.keys(posts).length : 0
        });
        
    } catch (error) {
        console.error('API test error:', error.message);
        res.json({
            success: false,
            error: error.message
        });
    }
});

const server = app.listen(3002, () => {
    console.log('Test server on 3002');
    
    setTimeout(() => {
        server.close();
        process.exit(0);
    }, 1000);
});