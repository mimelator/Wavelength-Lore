/**
 * Authentication Middleware
 * Middleware functions for user authentication
 */

const { verifyToken } = require('./firebaseAuth');

/**
 * Check if request qualifies for development authentication bypass
 */
const isDevelopmentBypass = (req) => {
  // Only enable in development environment
  const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
  
  // Check if request is from localhost
  const isLocalhost = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.ip) || 
                     req.ip === 'localhost' ||
                     req.hostname === 'localhost';
  
  return isDevelopment && isLocalhost;
};

/**
 * Get test user for development bypass
 */
const getTestUser = () => {
  return {
    uid: '4fdbYxJHjEP4xksk9sgFE3lgYUs2',
    email: 'mimel@imelshire.com', 
    name: 'Mark Imel',
    picture: 'https://lh3.googleusercontent.com/a/ACg8ocIKcqPpCHdorYUtvNI-QRcf7CMb7tC8OI-Z9j1IHKfvpJGop-MO=s96-c',
    emailVerified: true,
    groups: ['admin', 'content_manager'],
    isContentCreator: true
  };
};

/**
 * Middleware to ensure user is authenticated
 * Redirects to login page if not authenticated
 */
const ensureAuthenticated = (req, res, next) => {
  // Development authentication bypass for localhost testing
  if (isDevelopmentBypass(req)) {
    console.log('🚀 Development bypass: Auto-authenticating test user for localhost');
    req.user = getTestUser();
    return next();
  }

  // First try to verify token
  verifyToken(req, res, (err) => {
    if (err || !req.user) {
      // Authentication failed
      
      // Check if this is an API request or a page request
      if (req.path.startsWith('/api/')) {
        // API request, return JSON error
        return res.status(401).json({
          error: 'Authentication required',
          message: 'Please log in to access this resource'
        });
      } else {
        // Page request, redirect to login
        return res.redirect(`/login?redirect=${encodeURIComponent(req.originalUrl)}`);
      }
    }
    
    // User is authenticated, proceed
    next();
  });
};

/**
 * Middleware to ensure user is in specific group
 * @param {string|string[]} groups - Group name or array of group names
 */
const ensureInGroup = (groups) => {
  const groupArray = Array.isArray(groups) ? groups : [groups];
  
  return (req, res, next) => {
    // First ensure user is authenticated
    ensureAuthenticated(req, res, () => {
      // Check if user belongs to at least one of the required groups
      const userGroups = req.user.groups || [];
      const hasAccess = groupArray.some(group => userGroups.includes(group));
      
      if (!hasAccess) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You do not have permission to access this resource'
        });
      }
      
      // User has access, proceed
      next();
    });
  };
};

module.exports = {
  ensureAuthenticated,
  ensureInGroup
};