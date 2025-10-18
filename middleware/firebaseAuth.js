/**
 * Firebase Authentication Middleware
 * Verifies Firebase ID tokens for authenticated API endpoints
 */

const admin = require('firebase-admin');
const { getAdminDatabase } = require('../helpers/firebase-admin-utils');

class FirebaseAuth {
  constructor() {
    // Don't initialize immediately - wait until first use
    this.auth = null;
    console.log('🔥 Firebase Auth middleware created (lazy initialization)');
  }

  getAuth() {
    if (!this.auth) {
      try {
        // Ensure Firebase Admin is initialized by calling getAdminDatabase
        getAdminDatabase();
        
        // Get the admin app instance by name (it's initialized with name 'admin' in firebase-admin-utils.js)
        const adminApp = admin.app('admin');
        this.auth = adminApp.auth();
        console.log('🔥 Firebase Auth service initialized');
      } catch (error) {
        console.error('❌ Failed to initialize Firebase Auth service:', error.message);
        throw new Error('Firebase Admin not properly initialized');
      }
    }
    return this.auth;
  }

  /**
   * Middleware to verify Firebase ID tokens
   */
  verifyToken = async (req, res, next) => {
    try {
      // Extract token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('❌ No Bearer token in Authorization header');
        return res.status(401).json({
          error: 'Authentication required',
          message: 'Bearer token required in Authorization header'
        });
      }

      const idToken = authHeader.substring(7); // Remove 'Bearer ' prefix
      console.log('🎫 Verifying ID token, length:', idToken.length);

      // Verify the ID token
      const decodedToken = await this.getAuth().verifyIdToken(idToken);
      
      // Add user info to request object
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name,
        picture: decodedToken.picture,
        emailVerified: decodedToken.email_verified
      };

      console.log(`✅ User authenticated: ${req.user.uid} (${req.user.email})`);
      next();

    } catch (error) {
      console.error('❌ Firebase token verification failed:', error.message);
      console.error('Error code:', error.code);
      
      if (error.code === 'auth/id-token-expired') {
        return res.status(401).json({
          error: 'Token expired',
          message: 'Please sign in again'
        });
      }
      
      if (error.code === 'auth/argument-error' || error.code === 'auth/invalid-id-token') {
        return res.status(401).json({
          error: 'Invalid token',
          message: 'Invalid authentication token'
        });
      }

      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Token verification failed'
      });
    }
  }

  /**
   * Optional middleware - doesn't fail if no token provided
   */
  optionalAuth = async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // No token provided, but that's okay
        req.user = null;
        return next();
      }

      const idToken = authHeader.substring(7);
      const decodedToken = await this.getAuth().verifyIdToken(idToken);
      
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name,
        picture: decodedToken.picture,
        emailVerified: decodedToken.email_verified
      };

      console.log(`✅ Optional auth - User: ${req.user.uid}`);
      next();

    } catch (error) {
      // Token provided but invalid - treat as no token
      console.log(`⚠️ Optional auth failed, continuing without user: ${error.message}`);
      req.user = null;
      next();
    }
  }
}

// Create singleton instance
const firebaseAuth = new FirebaseAuth();

module.exports = {
  verifyToken: firebaseAuth.verifyToken,
  optionalAuth: firebaseAuth.optionalAuth
};