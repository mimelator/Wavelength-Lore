/**
 * Sanitization Test Routes
 * Provides API endpoints for testing input sanitization functionality
 */

const express = require('express');
const router = express.Router();
const InputSanitizer = require('../middleware/inputSanitization');

/**
 * Test endpoint for input sanitization
 * POST /api/sanitize/test
 */
router.post('/sanitize/test', (req, res) => {
  console.log('🧪 Sanitization test endpoint called');
  
  try {
    const { content, type = 'html' } = req.body;

    if (!content) {
      console.log('❌ No content provided');
      return res.status(400).json({
        success: false,
        error: 'Content is required'
      });
    }

    let sanitized;
    const original = content;
    
    console.log('🔍 Testing content:', original.substring(0, 100));

    // Apply appropriate sanitization based on type
    switch (type) {
      case 'html':
        sanitized = InputSanitizer.sanitizeHTML(content);
        break;
      case 'text':
        sanitized = InputSanitizer.sanitizeText(content);
        break;
      default:
        sanitized = InputSanitizer.sanitizeHTML(content);
    }

    // Check for profanity
    const profanityCheck = InputSanitizer.checkProfanity(sanitized);
    
    // Check for spam
    const spamCheck = InputSanitizer.detectSpam(sanitized);

    const result = {
      original,
      sanitized,
      type,
      checks: {
        profanity: profanityCheck,
        spam: spamCheck,
        xssRemoved: original.includes('<script') && !sanitized.includes('<script'),
        htmlSanitized: original !== sanitized
      },
      safe: !profanityCheck.isProfane && !spamCheck.isSpam
    };

    console.log('✅ Sanitization test completed successfully');

    res.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Sanitization test error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during sanitization test'
    });
  }
});

/**
 * Health check endpoint for sanitization service
 * GET /api/sanitize/health
 */
router.get('/sanitize/health', (req, res) => {
  res.json({
    success: true,
    service: 'Input Sanitization',
    status: 'operational',
    timestamp: new Date().toISOString(),
    features: {
      htmlSanitization: true,
      profanityFiltering: true,
      spamDetection: true,
      xssProtection: true
    }
  });
});

module.exports = router;