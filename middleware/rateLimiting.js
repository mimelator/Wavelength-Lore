/**
 * Rate Limiting Configuration for Wavelength Lore
 * Implements different rate limits for various endpoints to prevent abuse
 */

const rateLimit = require('express-rate-limit');

// Rate limiting configurations
const rateLimitConfigs = {
  // General API rate limiting - broader protection
  general: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
      console.log(`🚫 Rate limit exceeded for IP: ${req.ip} on ${req.originalUrl}`);
      res.status(429).json({
        error: 'Too many requests',
        message: 'You have exceeded the rate limit. Please try again later.',
        retryAfter: '15 minutes'
      });
    }
  }),

  // Strict rate limiting for forum posts - prevents spam
  forumPosts: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 forum posts per 15 minutes
    message: {
      error: 'Too many posts created from this IP, please try again later.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      console.log(`🚫 Forum post rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({
        error: 'Too many posts',
        message: 'You can only create 5 posts every 15 minutes. Please wait before posting again.',
        retryAfter: '15 minutes'
      });
    }
  }),

  // Rate limiting for forum replies - slightly more lenient than posts
  forumReplies: rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 10, // Limit each IP to 10 replies per 10 minutes
    message: {
      error: 'Too many replies from this IP, please try again later.',
      retryAfter: '10 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      console.log(`🚫 Forum reply rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({
        error: 'Too many replies',
        message: 'You can only create 10 replies every 10 minutes. Please wait before replying again.',
        retryAfter: '10 minutes'
      });
    }
  }),

  // Rate limiting for likes/reactions - prevent spam clicking
  forumLikes: rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 20, // Limit each IP to 20 likes per 5 minutes
    message: {
      error: 'Too many likes from this IP, please try again later.',
      retryAfter: '5 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      console.log(`🚫 Forum like rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({
        error: 'Too many likes',
        message: 'You can only like 20 posts/replies every 5 minutes. Please wait before liking again.',
        retryAfter: '5 minutes'
      });
    }
  }),

  // Authentication rate limiting - prevent brute force attacks
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 login attempts per 15 minutes
    message: {
      error: 'Too many authentication attempts from this IP, please try again later.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      console.log(`🚫 Auth rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({
        error: 'Too many login attempts',
        message: 'You have exceeded the login attempt limit. Please wait 15 minutes before trying again.',
        retryAfter: '15 minutes'
      });
    }
  }),

  // API endpoints rate limiting - protect data access
  api: rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 50, // Limit each IP to 50 API calls per 10 minutes
    message: {
      error: 'Too many API requests from this IP, please try again later.',
      retryAfter: '10 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      console.log(`🚫 API rate limit exceeded for IP: ${req.ip} on ${req.originalUrl}`);
      res.status(429).json({
        error: 'Too many API requests',
        message: 'You have exceeded the API rate limit. Please wait before making more requests.',
        retryAfter: '10 minutes'
      });
    }
  }),

  // Very strict rate limiting for sensitive admin operations
  admin: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 50 admin operations per 15 minutes
    message: {
      error: 'Too many admin operations from this IP, please try again later.',
      retryAfter: '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      console.log(`🚫 Admin rate limit exceeded for IP: ${req.ip} on ${req.originalUrl}`);
      res.status(429).json({
        error: 'Too many admin operations',
        message: 'You have exceeded the admin operation limit. Please wait 1 hour before trying again.',
        retryAfter: '1 hour'
      });
    }
  }),

  // Lenient rate limiting for static content and pages
  static: rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 200, // Limit each IP to 200 static requests per 5 minutes
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '5 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      console.log(`🚫 Static rate limit exceeded for IP: ${req.ip} on ${req.originalUrl}`);
      res.status(429).json({
        error: 'Too many requests',
        message: 'You have exceeded the request limit. Please wait before loading more pages.',
        retryAfter: '5 minutes'
      });
    }
  })
};

// Middleware function to apply rate limiting based on request type
function createSmartRateLimit() {
  return (req, res, next) => {
    const path = req.path.toLowerCase();
    const method = req.method.toLowerCase();

    // Determine which rate limit to apply based on the request
    let rateLimit;

    if (path.includes('/admin') || path.includes('/manage')) {
      rateLimit = rateLimitConfigs.admin;
    } else if (path.includes('/auth') || path.includes('/login') || path.includes('/register')) {
      rateLimit = rateLimitConfigs.auth;
    } else if (path.includes('/api/forum/posts') && method === 'post') {
      rateLimit = rateLimitConfigs.forumPosts;
    } else if (path.includes('/api/forum/replies') && method === 'post') {
      rateLimit = rateLimitConfigs.forumReplies;
    } else if ((path.includes('/like') || path.includes('/unlike')) && method === 'post') {
      rateLimit = rateLimitConfigs.forumLikes;
    } else if (path.startsWith('/api/')) {
      rateLimit = rateLimitConfigs.api;
    } else if (path.includes('.css') || path.includes('.js') || path.includes('.png') || 
               path.includes('.jpg') || path.includes('.svg') || path.includes('.ico')) {
      rateLimit = rateLimitConfigs.static;
    } else {
      rateLimit = rateLimitConfigs.general;
    }

    // Apply the selected rate limit
    rateLimit(req, res, next);
  };
}

// Export rate limiting configurations
module.exports = {
  rateLimitConfigs,
  createSmartRateLimit,
  
  // Individual rate limiters for specific use cases
  general: rateLimitConfigs.general,
  forumPosts: rateLimitConfigs.forumPosts,
  forumReplies: rateLimitConfigs.forumReplies,
  forumLikes: rateLimitConfigs.forumLikes,
  auth: rateLimitConfigs.auth,
  api: rateLimitConfigs.api,
  admin: rateLimitConfigs.admin,
  static: rateLimitConfigs.static
};