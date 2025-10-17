/**
 * Input Sanitization Middleware for Wavelength Lore
 * Provides comprehensive input cleaning, validation, and content filtering
 */

const DOMPurify = require('isomorphic-dompurify');
const filter = require('leo-profanity');
const validator = require('validator');
const escapeHtml = require('escape-html');
const { filterXSS } = require('xss');

// Initialize profanity filter
const profanityFilter = filter;

// Add custom words to profanity filter if needed
// profanityFilter.addWords('customword1', 'customword2');

// Configure XSS filter options
const xssOptions = {
  whiteList: {
    p: [],
    br: [],
    strong: [],
    em: [],
    u: [],
    i: [],
    b: [],
    span: ['class'],
    div: ['class'],
    h1: [], h2: [], h3: [], h4: [], h5: [], h6: [],
    ul: [], ol: [], li: [],
    blockquote: [],
    code: [],
    pre: []
  },
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style']
};

class InputSanitizer {
  
  /**
   * Sanitize HTML content to prevent XSS attacks
   * @param {string} html - HTML content to sanitize
   * @returns {string} - Sanitized HTML content
   */
  static sanitizeHTML(html) {
    if (!html || typeof html !== 'string') {
      return '';
    }

    // First pass: DOMPurify sanitization
    let sanitized = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre'],
      ALLOWED_ATTR: ['href', 'title'],
      ALLOW_DATA_ATTR: false,
      FORBID_TAGS: ['script', 'object', 'embed', 'iframe', 'form', 'input', 'button'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit']
    });

    // Second pass: Additional XSS filtering
    sanitized = filterXSS(sanitized);

    // Third pass: Remove javascript: protocols and other dangerous patterns
    sanitized = sanitized.replace(/javascript:/gi, '');
    sanitized = sanitized.replace(/vbscript:/gi, '');
    sanitized = sanitized.replace(/data:/gi, '');
    sanitized = sanitized.replace(/on\w+\s*=/gi, '');

    return sanitized;
  }

  /**
   * Sanitize plain text content
   * @param {string} text - Raw text content
   * @param {object} options - Sanitization options
   * @returns {string} - Sanitized text
   */
  static sanitizeText(text, options = {}) {
    if (!text || typeof text !== 'string') {
      return '';
    }

    let sanitized = text;

    // Remove or escape HTML entities
    if (options.escapeHtml !== false) {
      sanitized = escapeHtml(sanitized);
    }

    // Trim whitespace
    sanitized = sanitized.trim();

    // Limit length if specified
    if (options.maxLength) {
      sanitized = sanitized.substring(0, options.maxLength);
    }

    // Remove control characters
    sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

    return sanitized;
  }

  /**
   * Validate and sanitize email addresses
   * @param {string} email - Email address
   * @returns {string|null} - Sanitized email or null if invalid
   */
  static sanitizeEmail(email) {
    if (!email || typeof email !== 'string') {
      return null;
    }

    const sanitized = validator.normalizeEmail(email);
    return validator.isEmail(sanitized) ? sanitized : null;
  }

  /**
   * Validate and sanitize URLs
   * @param {string} url - URL to sanitize
   * @param {object} options - URL validation options
   * @returns {string|null} - Sanitized URL or null if invalid
   */
  static sanitizeURL(url, options = {}) {
    if (!url || typeof url !== 'string') {
      return null;
    }

    // Basic URL cleaning
    let sanitized = url.trim();

    // Check if URL is valid
    const urlOptions = {
      protocols: options.allowedProtocols || ['http', 'https'],
      require_protocol: options.requireProtocol || false,
      require_host: true,
      require_valid_protocol: true,
      allow_underscores: false,
      host_whitelist: options.hostWhitelist || false,
      host_blacklist: options.hostBlacklist || false,
      allow_trailing_dot: false,
      allow_protocol_relative_urls: false,
      disallow_auth: true
    };

    return validator.isURL(sanitized, urlOptions) ? sanitized : null;
  }

  /**
   * Check content for profanity
   * @param {string} content - Content to check
   * @returns {object} - Result with isProfane flag and cleaned content
   */
  static checkProfanity(content) {
    if (!content || typeof content !== 'string') {
      return { isProfane: false, cleaned: '' };
    }

    const isProfane = profanityFilter.check(content);
    const cleaned = profanityFilter.clean(content);

    return {
      isProfane,
      cleaned,
      original: content
    };
  }

  /**
   * Comprehensive content validation for forum posts
   * @param {object} data - Post data to validate
   * @returns {object} - Validation result
   */
  static validateForumPost(data) {
    const errors = [];
    const sanitized = {};

    // Validate and sanitize title
    if (!data.title || typeof data.title !== 'string') {
      errors.push('Title is required');
    } else {
      sanitized.title = this.sanitizeText(data.title, { maxLength: 200 });
      if (sanitized.title.length < 3) {
        errors.push('Title must be at least 3 characters long');
      }
      if (sanitized.title.length > 200) {
        errors.push('Title must be less than 200 characters');
      }
    }

    // Validate and sanitize content
    if (!data.content || typeof data.content !== 'string') {
      errors.push('Content is required');
    } else {
      sanitized.content = this.sanitizeHTML(data.content);
      if (sanitized.content.length < 10) {
        errors.push('Content must be at least 10 characters long');
      }
      if (sanitized.content.length > 10000) {
        errors.push('Content must be less than 10,000 characters');
      }
    }

    // Check for profanity
    if (sanitized.title) {
      const titleProfanity = this.checkProfanity(sanitized.title);
      if (titleProfanity.isProfane) {
        errors.push('Title contains inappropriate language');
      }
    }

    if (sanitized.content) {
      const contentProfanity = this.checkProfanity(sanitized.content);
      if (contentProfanity.isProfane) {
        errors.push('Content contains inappropriate language');
      }
    }

    // Validate forum ID
    if (data.forumId) {
      const validForums = ['general', 'lore', 'episodes', 'fanart'];
      if (!validForums.includes(data.forumId)) {
        errors.push('Invalid forum category');
      }
      sanitized.forumId = data.forumId;
    }

    // Validate post type
    if (data.type) {
      const validTypes = ['discussion', 'question', 'theory', 'fanart', 'news'];
      if (!validTypes.includes(data.type)) {
        errors.push('Invalid post type');
      }
      sanitized.type = data.type;
    }

    // Validate and sanitize author name
    if (data.authorName) {
      sanitized.authorName = this.sanitizeText(data.authorName, { maxLength: 50 });
      if (sanitized.authorName.length < 1) {
        errors.push('Author name is required');
      }
    }

    // Validate tags
    if (data.tags && Array.isArray(data.tags)) {
      sanitized.tags = data.tags
        .map(tag => this.sanitizeText(tag, { maxLength: 20 }))
        .filter(tag => tag.length > 0)
        .slice(0, 10); // Limit to 10 tags
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized
    };
  }

  /**
   * Validate forum reply data
   * @param {object} data - Reply data to validate
   * @returns {object} - Validation result
   */
  static validateForumReply(data) {
    const errors = [];
    const sanitized = {};

    // Validate and sanitize content
    if (!data.content || typeof data.content !== 'string') {
      errors.push('Reply content is required');
    } else {
      sanitized.content = this.sanitizeHTML(data.content);
      if (sanitized.content.length < 3) {
        errors.push('Reply must be at least 3 characters long');
      }
      if (sanitized.content.length > 5000) {
        errors.push('Reply must be less than 5,000 characters');
      }

      // Check for profanity
      const contentProfanity = this.checkProfanity(sanitized.content);
      if (contentProfanity.isProfane) {
        errors.push('Reply contains inappropriate language');
      }
    }

    // Validate post ID
    if (!data.postId || typeof data.postId !== 'string') {
      errors.push('Post ID is required');
    } else {
      sanitized.postId = this.sanitizeText(data.postId, { maxLength: 100 });
    }

    // Validate and sanitize author name
    if (data.authorName) {
      sanitized.authorName = this.sanitizeText(data.authorName, { maxLength: 50 });
      if (sanitized.authorName.length < 1) {
        errors.push('Author name is required');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized
    };
  }

  /**
   * Validate user profile data
   * @param {object} data - User profile data
   * @returns {object} - Validation result
   */
  static validateUserProfile(data) {
    const errors = [];
    const sanitized = {};

    // Validate and sanitize display name
    if (data.displayName) {
      sanitized.displayName = this.sanitizeText(data.displayName, { maxLength: 50 });
      if (sanitized.displayName.length < 2) {
        errors.push('Display name must be at least 2 characters long');
      }
      if (sanitized.displayName.length > 50) {
        errors.push('Display name must be less than 50 characters');
      }
    }

    // Validate and sanitize email
    if (data.email) {
      sanitized.email = this.sanitizeEmail(data.email);
      if (!sanitized.email) {
        errors.push('Invalid email address');
      }
    }

    // Validate and sanitize bio
    if (data.bio) {
      sanitized.bio = this.sanitizeHTML(data.bio, {
        allowedTags: ['p', 'br', 'strong', 'em', 'u'],
        maxLength: 500
      });
      if (sanitized.bio.length > 500) {
        errors.push('Bio must be less than 500 characters');
      }

      // Check for profanity in bio
      const bioProfanity = this.checkProfanity(sanitized.bio);
      if (bioProfanity.isProfane) {
        errors.push('Bio contains inappropriate language');
      }
    }

    // Validate and sanitize avatar URL
    if (data.avatar) {
      sanitized.avatar = this.sanitizeURL(data.avatar, {
        allowedProtocols: ['https'],
        requireProtocol: true
      });
      if (!sanitized.avatar) {
        errors.push('Invalid avatar URL');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized
    };
  }

  /**
   * Express middleware for automatic input sanitization
   * @param {object} options - Middleware options
   * @returns {function} - Express middleware function
   */
  static createMiddleware(options = {}) {
    return (req, res, next) => {
      // Sanitize query parameters
      if (req.query && typeof req.query === 'object') {
        for (const [key, value] of Object.entries(req.query)) {
          if (typeof value === 'string') {
            req.query[key] = this.sanitizeText(value, { maxLength: 1000 });
          }
        }
      }

      // Sanitize URL parameters
      if (req.params && typeof req.params === 'object') {
        for (const [key, value] of Object.entries(req.params)) {
          if (typeof value === 'string') {
            req.params[key] = this.sanitizeText(value, { maxLength: 100 });
          }
        }
      }

      // Log sanitization activity if enabled
      if (options.logging) {
        console.log(`🧹 Input sanitization applied to ${req.method} ${req.path}`);
      }

      next();
    };
  }

  /**
   * Detect potential spam content
   * @param {string} content - Content to analyze
   * @returns {object} - Spam detection result
   */
  static detectSpam(content) {
    if (!content || typeof content !== 'string') {
      return { isSpam: false, confidence: 0, reasons: [] };
    }

    const reasons = [];
    let spamScore = 0;

    // Check for excessive capitalization
    const upperCaseRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (upperCaseRatio > 0.5 && content.length > 20) {
      reasons.push('Excessive capitalization');
      spamScore += 30;
    }

    // Check for excessive exclamation marks
    const exclamationCount = (content.match(/!/g) || []).length;
    if (exclamationCount > 5) {
      reasons.push('Excessive exclamation marks');
      spamScore += 20;
    }

    // Check for repetitive characters
    if (/(.)\1{4,}/.test(content)) {
      reasons.push('Repetitive characters');
      spamScore += 25;
    }

    // Check for excessive URLs
    const urlCount = (content.match(/https?:\/\/[^\s]+/g) || []).length;
    if (urlCount > 3) {
      reasons.push('Multiple URLs');
      spamScore += 40;
    }

    // Check for common spam phrases
    const spamPhrases = [
      'click here', 'free money', 'limited time', 'act now',
      'congratulations', 'you have won', 'claim your prize'
    ];
    
    const foundSpamPhrases = spamPhrases.filter(phrase => 
      content.toLowerCase().includes(phrase)
    );
    
    if (foundSpamPhrases.length > 0) {
      reasons.push(`Spam phrases: ${foundSpamPhrases.join(', ')}`);
      spamScore += foundSpamPhrases.length * 20;
    }

    return {
      isSpam: spamScore >= 50,
      confidence: Math.min(spamScore, 100),
      reasons
    };
  }
}

module.exports = InputSanitizer;