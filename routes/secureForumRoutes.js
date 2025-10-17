/**
 * Forum API Routes with Input Sanitization
 * Example implementation of secure forum endpoints
 */

const express = require('express');
const router = express.Router();
const InputSanitizer = require('../middleware/inputSanitization');

// Example forum post creation endpoint
router.post('/forum/posts', async (req, res) => {
  try {
    console.log('📝 Processing forum post creation...');
    
    // Validate and sanitize input
    const validation = InputSanitizer.validateForumPost(req.body);
    
    if (!validation.isValid) {
      console.log('❌ Forum post validation failed:', validation.errors);
      return res.status(400).json({
        error: 'Validation failed',
        messages: validation.errors
      });
    }

    // Check for spam
    const spamCheck = InputSanitizer.detectSpam(validation.sanitized.content);
    if (spamCheck.isSpam) {
      console.log('🚫 Spam detected in forum post:', spamCheck.reasons);
      return res.status(429).json({
        error: 'Content flagged as potential spam',
        reasons: spamCheck.reasons,
        confidence: spamCheck.confidence
      });
    }

    // Simulate saving to database (replace with actual database logic)
    const forumPost = {
      id: `post_${Date.now()}`,
      ...validation.sanitized,
      authorId: req.user?.uid || 'anonymous', // From authentication middleware
      createdAt: Date.now(),
      updatedAt: Date.now(),
      likeCount: 0,
      replyCount: 0,
      viewCount: 0
    };

    console.log('✅ Forum post created successfully:', forumPost.id);
    
    res.status(201).json({
      success: true,
      post: forumPost,
      message: 'Post created successfully'
    });

  } catch (error) {
    console.error('💥 Error creating forum post:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create post'
    });
  }
});

// Example forum reply creation endpoint
router.post('/forum/replies', async (req, res) => {
  try {
    console.log('💬 Processing forum reply creation...');
    
    // Validate and sanitize input
    const validation = InputSanitizer.validateForumReply(req.body);
    
    if (!validation.isValid) {
      console.log('❌ Forum reply validation failed:', validation.errors);
      return res.status(400).json({
        error: 'Validation failed',
        messages: validation.errors
      });
    }

    // Check for spam
    const spamCheck = InputSanitizer.detectSpam(validation.sanitized.content);
    if (spamCheck.isSpam) {
      console.log('🚫 Spam detected in forum reply:', spamCheck.reasons);
      return res.status(429).json({
        error: 'Content flagged as potential spam',
        reasons: spamCheck.reasons,
        confidence: spamCheck.confidence
      });
    }

    // Simulate saving to database
    const forumReply = {
      id: `reply_${Date.now()}`,
      ...validation.sanitized,
      authorId: req.user?.uid || 'anonymous',
      createdAt: Date.now(),
      likeCount: 0
    };

    console.log('✅ Forum reply created successfully:', forumReply.id);
    
    res.status(201).json({
      success: true,
      reply: forumReply,
      message: 'Reply created successfully'
    });

  } catch (error) {
    console.error('💥 Error creating forum reply:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create reply'
    });
  }
});

// Example user profile update endpoint
router.put('/users/profile', async (req, res) => {
  try {
    console.log('👤 Processing user profile update...');
    
    // Validate and sanitize input
    const validation = InputSanitizer.validateUserProfile(req.body);
    
    if (!validation.isValid) {
      console.log('❌ User profile validation failed:', validation.errors);
      return res.status(400).json({
        error: 'Validation failed',
        messages: validation.errors
      });
    }

    // Simulate updating user profile
    const updatedProfile = {
      ...validation.sanitized,
      userId: req.user?.uid,
      updatedAt: Date.now()
    };

    console.log('✅ User profile updated successfully');
    
    res.json({
      success: true,
      profile: updatedProfile,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('💥 Error updating user profile:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update profile'
    });
  }
});

// Content sanitization endpoint for testing
router.post('/sanitize/test', (req, res) => {
  try {
    const { content, type = 'html' } = req.body;
    
    let result;
    
    switch (type) {
      case 'html':
        result = {
          sanitized: InputSanitizer.sanitizeHTML(content),
          profanity: InputSanitizer.checkProfanity(content),
          spam: InputSanitizer.detectSpam(content)
        };
        break;
        
      case 'text':
        result = {
          sanitized: InputSanitizer.sanitizeText(content),
          profanity: InputSanitizer.checkProfanity(content),
          spam: InputSanitizer.detectSpam(content)
        };
        break;
        
      case 'email':
        result = {
          sanitized: InputSanitizer.sanitizeEmail(content),
          isValid: InputSanitizer.sanitizeEmail(content) !== null
        };
        break;
        
      case 'url':
        result = {
          sanitized: InputSanitizer.sanitizeURL(content),
          isValid: InputSanitizer.sanitizeURL(content) !== null
        };
        break;
        
      default:
        return res.status(400).json({
          error: 'Invalid type',
          message: 'Type must be: html, text, email, or url'
        });
    }
    
    res.json({
      success: true,
      original: content,
      type,
      result
    });
    
  } catch (error) {
    console.error('💥 Error in sanitization test:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to test sanitization'
    });
  }
});

module.exports = router;