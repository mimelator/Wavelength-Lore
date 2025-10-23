/**
 * Authentication Middleware
 * Middleware functions for user authentication
 */

const { verifyToken } = require('./firebaseAuth');

/**
 * Middleware to ensure user is authenticated
 * Redirects to login page if not authenticated
 */
const ensureAuthenticated = (req, res, next) => {
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