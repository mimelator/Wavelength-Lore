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
  }

  getAuth() {
    if (!this.auth) {
      try {
        // Ensure Firebase Admin is initialized by calling getAdminDatabase
        getAdminDatabase();
        
        // Get the admin app instance by name (it's initialized with name 'admin' in firebase-admin-utils.js)
        const adminApp = admin.app('admin');
        this.auth = adminApp.auth();
      } catch (error) {
        console.error('❌ Failed to initialize Firebase Auth service:', error.message);
        throw new Error('Firebase Admin not properly initialized');
      }
    }
    return this.auth;
  }

  /**
   * Check if request qualifies for development authentication bypass
   */
  isDevelopmentBypass(req) {
    // Only enable in development environment
    const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
    
    // Check if request is from localhost
    const isLocalhost = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.ip) || 
                       req.ip === 'localhost' ||
                       req.hostname === 'localhost';
    
    // Only bypass if both conditions are met
    return isDevelopment && isLocalhost;
  }

  /**
   * Get test user for development bypass
   */
  getTestUser() {
    return {
      uid: '4fdbYxJHjEP4xksk9sgFE3lgYUs2',
      email: 'mimel@imelshire.com', 
      name: 'Mark Imel',
      picture: 'https://lh3.googleusercontent.com/a/ACg8ocIKcqPpCHdorYUtvNI-QRcf7CMb7tC8OI-Z9j1IHKfvpJGop-MO=s96-c',
      emailVerified: true,
      groups: ['admin', 'content_manager'],
      isContentCreator: true
    };
  }

  /**
   * Middleware to verify Firebase ID tokens
   */
  verifyToken = async (req, res, next) => {
    try {
      // Development authentication bypass for localhost testing
      if (this.isDevelopmentBypass(req)) {
        console.log('🚀 Development bypass: Auto-authenticating test user for localhost');
        req.user = this.getTestUser();
        return next();
      }

      // Extract token from Authorization header or session cookie
      const authHeader = req.headers.authorization;
      let idToken;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        idToken = authHeader.substring(7); // Remove 'Bearer ' prefix
        console.log('🎫 Verifying ID token from Authorization header, length:', idToken.length);
      } else if (req.cookies && req.cookies.__session) {
        // Try to use __session cookie (Firebase Auth uses this name)
        idToken = req.cookies.__session;
        console.log('🎫 Verifying ID token from __session cookie, length:', idToken.length);
      } else if (req.cookies && req.cookies.session) {
        // Try to use session cookie (fallback)
        idToken = req.cookies.session;
        console.log('🎫 Verifying ID token from session cookie, length:', idToken.length);
      } else {
        // Check if this is the user gallery HTML page request
        if (req.path === '/my-gallery' && !req.path.startsWith('/api/')) {
          console.log('❌ No authentication for /my-gallery page - redirecting to login');
          return res.redirect(`/login?redirect=${encodeURIComponent(req.originalUrl)}`);
        }
        
        console.log('❌ No authentication token found (checked header and cookies)');
        return res.status(401).json({
          error: 'Authentication required',
          message: 'Authentication token required'
        });
      }
      
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
      // Check Authorization header first
      const authHeader = req.headers.authorization;
      let idToken = null;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        idToken = authHeader.substring(7);
        console.log('🎫 Optional auth: Found token in Authorization header');
      } else if (req.cookies && req.cookies.__session) {
        // Try __session cookie (Firebase Auth standard)
        idToken = req.cookies.__session;
        console.log('🎫 Optional auth: Found token in __session cookie');
      } else if (req.cookies && req.cookies.session) {
        // Try session cookie (fallback)
        idToken = req.cookies.session;
        console.log('🎫 Optional auth: Found token in session cookie');
      }
      
      if (!idToken) {
        // No token provided, continue without authentication
        console.log('👤 Optional auth: No token found, continuing as unauthenticated user');
        req.user = null;
        return next();
      }

      const decodedToken = await this.getAuth().verifyIdToken(idToken);
      
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name,
        picture: decodedToken.picture,
        emailVerified: decodedToken.email_verified
      };

      console.log(`✅ Optional auth - User authenticated: ${req.user.uid} (${req.user.email})`);
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