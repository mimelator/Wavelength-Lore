/**
 * Firebase Admin Service
 * Centralized Firebase admin SDK initialization
 */

const admin = require('firebase-admin');

let initialized = false;

function initializeFirebase() {
    if (initialized) {
        return admin.database();
    }
    
    try {
        if (admin.apps.length === 0) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                databaseURL: process.env.DATABASE_URL
            });
        }
        
        initialized = true;
        return admin.database();
    } catch (error) {
        console.error('Firebase initialization failed:', error.message);
        throw error;
    }
}

module.exports = {
    getDatabase: initializeFirebase
};