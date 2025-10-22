/**
 * Authentication Middleware for Testing
 * Extended version of auth.js with support for test headers
 */

const { verifyToken } = require('./firebaseAuth');

/**
 * Middleware to ensure user is authenticated
 * In test mode, also checks for X-Test-User-Groups header
 */
const ensureAuthenticated = (req, res, next) => {
  // Check for test header in test/development environment
  const testUserGroups = req.headers['x-test-user-groups'];
  if (testUserGroups) {
    // Add user groups from test header
    const groups = testUserGroups.split(',').map(g => g.trim());
    console.log(`🔧 [TEST AUTH] Using test user groups: ${groups.join(', ')}`);
    
    // For testing, bypass normal auth and set user groups directly
    if (!req.user) {
      req.user = {
        uid: 'test-user-id',
        email: 'test@example.com',
        groups: groups
      };
    }
    
    // Set the user groups for the request
    res.locals.userGroups = groups;
    console.log('🔑 [TEST AUTH] Set res.locals.userGroups =', res.locals.userGroups);
    next();
    return;
  }

  // For local development, always auto-authenticate with test user
  if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
    console.log('🔧 [TEST AUTH] Auto-authenticating for local development');
    req.user = {
      uid: 'local-dev-user',
      email: 'local-dev@example.com',
      name: 'Local Development User',
      picture: 'https://via.placeholder.com/100',
      groups: ['users', 'vip']
    };
    next();
    return;
  }

  // Standard authentication flow for non-development environments
  verifyToken(req, res, (err) => {
    if (err || !req.user) {
      // Authentication failed
      if (req.path.startsWith('/api/') || req.path.startsWith('/gallery/api/')) {
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
      // Check for test header in test/development environment
      const testUserGroups = req.headers['x-test-user-groups'];
      if ((process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') && testUserGroups) {
        const groups = testUserGroups.split(',').map(g => g.trim());
        const hasAccess = groupArray.some(group => groups.includes(group));
        
        if (!hasAccess) {
          return res.status(403).json({
            error: 'Access denied',
            message: 'You do not have permission to access this resource'
          });
        }
        
        // User has access, proceed
        next();
        return;
      }

      // Standard group check
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