/**
 * Firebase Admin Service
 * Centralized Firebase admin SDK initialization
 */

require('dotenv').config();
const admin = require('firebase-admin');

let db = null;

function initializeFirebase() {
    if (db) return db;
    
    try {
        let app;
        if (admin.apps.length === 0) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            app = admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                databaseURL: process.env.DATABASE_URL
            });
        } else {
            app = admin.app();
        }
        
        db = app.database();
        return db;
    } catch (error) {
        console.error('Firebase initialization failed:', error.message);
        console.error('Full error:', error);
        console.error('Environment check:', {
            hasServiceAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT,
            hasDatabaseUrl: !!process.env.DATABASE_URL
        });
        throw error;
    }
}

module.exports = {
    getDatabase: () => {
        if (!db) {
            return initializeFirebase();
        }
        return db;
    }
};