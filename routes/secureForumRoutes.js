/**
 * Forum API Routes with Input Sanitization and File Upload Support
 * Example implementation of secure forum endpoints
 */

const express = require('express');
const router = express.Router();
const InputSanitizer = require('../middleware/inputSanitization');
const FileUploadHandler = require('../utils/fileUpload');
const { verifyToken, optionalAuth } = require('../middleware/firebaseAuth');
const { fetchDataAsAdmin, deleteDataAsAdmin, getAdminDatabase, writeDataAsAdmin } = require('../helpers/firebase-admin-utils');

// Initialize file upload handler lazily
let fileUploader = null;
function getFileUploader() {
  if (!fileUploader) {
    fileUploader = new FileUploadHandler();
  }
  return fileUploader;
}

// Get multer middleware lazily
function getUploadMiddleware() {
  return getFileUploader().getMulterConfig();
}

// Forum post creation endpoint with file upload support
router.post('/forum/posts', optionalAuth, (req, res, next) => {
  const upload = getUploadMiddleware();
  upload.array('attachments', 5)(req, res, next);
}, async (req, res) => {
  try {
    console.log('📝 Processing forum post creation with attachments...');
    
    // Validate uploaded files
    const files = req.files || [];
    const fileValidation = getFileUploader().validateFiles(files);
    
    if (!fileValidation.isValid) {
      console.log('❌ File validation failed:', fileValidation.errors);
      return res.status(400).json({
        error: 'File validation failed',
        messages: fileValidation.errors
      });
    }
    
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

    // Generate post ID
    const postId = `post_${Date.now()}`;
    const authorId = req.user?.uid || 'anonymous';

    // Upload files if any
    let attachments = [];
    if (files.length > 0) {
      try {
        console.log(`📎 Uploading ${files.length} attachments...`);
        attachments = await getFileUploader().uploadFiles(files, authorId, postId);
        console.log('✅ Files uploaded successfully');
      } catch (error) {
        console.error('💥 File upload failed:', error);
        return res.status(500).json({
          error: 'File upload failed',
          message: error.message
        });
      }
    }

    // Create forum post with attachments
    const forumPost = {
      id: postId,
      ...validation.sanitized,
      authorId: authorId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      likeCount: 0,
      replyCount: 0,
      viewCount: 0,
      attachments: attachments
    };

    // Save to Firebase database
    await writeDataAsAdmin(`forum/posts/${postId}`, forumPost);

    console.log('✅ Forum post created successfully:', forumPost.id);
    console.log(`📎 Attachments: ${attachments.length} files`);
    
    res.status(201).json({
      success: true,
      post: forumPost,
      message: 'Post created successfully',
      attachmentCount: attachments.length
    });

  } catch (error) {
    console.error('💥 Error creating forum post:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create post'
    });
  }
});

// Forum reply creation endpoint
router.post('/forum/replies', optionalAuth, async (req, res) => {
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

    // Save reply to Firebase database
    const forumReply = {
      id: `reply_${Date.now()}`,
      ...validation.sanitized,
      authorId: req.user?.uid || 'anonymous',
      createdAt: Date.now(),
      likeCount: 0
    };

    await writeDataAsAdmin(`forum/replies/${forumReply.id}`, forumReply);

    // Update post reply count if postId is provided
    if (forumReply.postId) {
      const post = await fetchDataAsAdmin(`forum/posts/${forumReply.postId}`);
      if (post) {
        const db = getAdminDatabase();
        const postRef = db.ref(`forum/posts/${forumReply.postId}/replyCount`);
        const newCount = (post.replyCount || 0) + 1;
        await postRef.set(newCount);
        console.log(`✅ Updated post ${forumReply.postId} reply count to ${newCount}`);
      }
    }

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

// Delete forum post endpoint (author only)
router.delete('/forum/posts/:postId', verifyToken, async (req, res) => {
  try {
    console.log('🗑️ Processing forum post deletion...');
    
    const postId = req.params.postId;
    const userId = req.user?.uid;
    
    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'You must be signed in to delete posts'
      });
    }

    if (!postId) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Post ID is required'
      });
    }

    // Fetch the post from Firebase to verify ownership and get attachment info
    const post = await fetchDataAsAdmin(`forum/posts/${postId}`);
    
    if (!post) {
      return res.status(404).json({ 
        error: 'Post not found',
        message: 'The post you are trying to delete does not exist'
      });
    }
    
    if (post.authorId !== userId) {
      return res.status(403).json({ 
        error: 'Not authorized to delete this post',
        message: 'You can only delete your own posts'
      });
    }
    
    // Delete S3 attachments if any exist
    if (post.attachments && post.attachments.length > 0) {
      try {
        const fileUploader = getFileUploader();
        for (const attachment of post.attachments) {
          await fileUploader.deleteFile(attachment.s3Key);
          console.log(`✅ Deleted attachment: ${attachment.s3Key}`);
        }
      } catch (error) {
        console.error('⚠️ Failed to delete some attachments:', error);
        // Continue with post deletion even if attachment cleanup fails
      }
    }
    
    // Delete all replies to this post
    const db = getAdminDatabase();
    const repliesRef = db.ref('forum/replies');
    const repliesSnapshot = await repliesRef.orderByChild('postId').equalTo(postId).once('value');
    const replies = repliesSnapshot.val() || {};
    
    for (const replyId of Object.keys(replies)) {
      await deleteDataAsAdmin(`forum/replies/${replyId}`);
      console.log(`✅ Deleted reply: ${replyId}`);
    }
    
    // Delete the post
    await deleteDataAsAdmin(`forum/posts/${postId}`);
    
    console.log(`✅ Post ${postId} and ${Object.keys(replies).length} replies deleted by user ${userId}`);
    
    res.json({
      success: true,
      message: 'Post deleted successfully',
      postId: postId,
      deletedReplies: Object.keys(replies).length,
      deletedAttachments: post.attachments ? post.attachments.length : 0
    });

  } catch (error) {
    console.error('💥 Error deleting forum post:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete post'
    });
  }
});

// Delete forum reply endpoint (author only)
router.delete('/forum/replies/:replyId', verifyToken, async (req, res) => {
  try {
    console.log('🗑️ Processing forum reply deletion...');
    
    const replyId = req.params.replyId;
    const userId = req.user?.uid;
    
    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'You must be signed in to delete replies'
      });
    }

    if (!replyId) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Reply ID is required'
      });
    }

    // Fetch the reply from Firebase to verify ownership
    const reply = await fetchDataAsAdmin(`forum/replies/${replyId}`);
    
    if (!reply) {
      return res.status(404).json({ 
        error: 'Reply not found',
        message: 'The reply you are trying to delete does not exist'
      });
    }
    
    if (reply.authorId !== userId) {
      return res.status(403).json({ 
        error: 'Not authorized to delete this reply',
        message: 'You can only delete your own replies'
      });
    }
    
    // Delete the reply from Firebase
    await deleteDataAsAdmin(`forum/replies/${replyId}`);
    
    // Update the post reply count
    if (reply.postId) {
      const post = await fetchDataAsAdmin(`forum/posts/${reply.postId}`);
      if (post) {
        const db = getAdminDatabase();
        const postRef = db.ref(`forum/posts/${reply.postId}/replyCount`);
        const newCount = Math.max(0, (post.replyCount || 0) - 1);
        await postRef.set(newCount);
        console.log(`✅ Updated post ${reply.postId} reply count to ${newCount}`);
      }
    }
    
    console.log(`✅ Reply ${replyId} deleted by user ${userId}`);
    
    res.json({
      success: true,
      message: 'Reply deleted successfully',
      replyId: replyId
    });

  } catch (error) {
    console.error('💥 Error deleting forum reply:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete reply'
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

// File upload endpoint for forum attachments
router.post('/forum/upload', (req, res, next) => {
  const upload = getUploadMiddleware();
  upload.array('files', 5)(req, res, next);
}, async (req, res) => {
  try {
    console.log('📎 Processing file upload...');
    
    const files = req.files || [];
    if (files.length === 0) {
      return res.status(400).json({
        error: 'No files provided'
      });
    }

    // Validate files
    const validation = getFileUploader().validateFiles(files);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'File validation failed',
        messages: validation.errors
      });
    }

    // Get file info without uploading (for preview)
    const fileInfos = files.map(file => ({
      ...getFileUploader().getFileInfo(file),
      sizeFormatted: getFileUploader().formatFileSize(file.size)
    }));

    console.log('✅ File validation successful');
    
    res.json({
      success: true,
      files: fileInfos,
      message: `${files.length} file(s) ready for upload`
    });

  } catch (error) {
    console.error('💥 Error processing files:', error);
    res.status(500).json({
      error: 'File processing failed',
      message: error.message
    });
  }
});

// Test S3 connectivity endpoint
router.get('/forum/test-s3', async (req, res) => {
  try {
    console.log('🧪 Testing S3 connectivity...');
    
    const fileUploader = getFileUploader();
    
    // Test S3 connection by listing bucket (just checking if credentials work)
    const { S3Client, HeadBucketCommand } = require('@aws-sdk/client-s3');
    
    const testCommand = new HeadBucketCommand({
      Bucket: fileUploader.bucketName
    });
    
    await fileUploader.s3Client.send(testCommand);
    
    res.json({
      success: true,
      message: 'S3 connectivity test successful',
      bucket: fileUploader.bucketName,
      region: fileUploader.region,
      cdnUrl: fileUploader.cdnUrl
    });
    
  } catch (error) {
    console.error('💥 S3 connectivity test failed:', error);
    res.status(500).json({
      success: false,
      error: 'S3 connectivity test failed',
      message: error.message
    });
  }
});

module.exports = router;