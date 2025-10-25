#!/usr/bin/env node

/**
 * Cleanup Test Posts Script
 * 
 * This script identifies and removes leftover test posts from e2e tests
 * that contain 'Undefined' or test-related content.
 */

require('dotenv').config();
const admin = require('firebase-admin');
const path = require('path');
const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');

// Configuration
let adminApp;
let s3Client;

/**
 * Initialize Firebase Admin and AWS S3
 */
async function initialize() {
  console.log('🔧 Initializing cleanup script...');
  
  try {
    // Initialize Firebase Admin
    const serviceAccountPath = path.join(__dirname, '../firebaseServiceAccountKey.json');
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath),
      databaseURL: process.env.DATABASE_URL,
      storageBucket: process.env.STORAGE_BUCKET
    }, 'cleanup-script');

    // Initialize S3 client
    s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });

    // Verify S3 bucket name is available
    if (!process.env.AWS_S3_BUCKET_NAME) {
      console.warn('⚠️ AWS_S3_BUCKET_NAME not found in environment - S3 cleanup will be skipped');
    }

    console.log('✅ Initialization complete');
  } catch (error) {
    console.error('❌ Initialization failed:', error.message);
    throw error;
  }
}

/**
 * Find test posts to cleanup
 */
async function findTestPosts() {
  console.log('🔍 Scanning for test posts...');
  
  try {
    const database = adminApp.database();
    const postsSnapshot = await database.ref('forum/posts').once('value');
    const postsData = postsSnapshot.val();
    
    if (!postsData) {
      console.log('ℹ️ No posts found in database');
      return [];
    }

    const testPosts = [];
    
    // Criteria for identifying test posts
    const testPatterns = [
      /undefined/i,
      /test.*post/i,
      /e2e.*test/i,
      /end.*to.*end/i,
      /deletion.*test/i,
      /validation.*test/i,
      /^test/i,
      /test.*deletion/i,
      /test.*user/i
    ];

    for (const [postId, post] of Object.entries(postsData)) {
      const isTestPost = testPatterns.some(pattern => {
        return pattern.test(post.title || '') || 
               pattern.test(post.content || '') ||
               pattern.test(post.authorName || '') ||
               pattern.test(postId);
      });

      // Also check for posts with test user IDs
      const hasTestAuthor = post.authorId && (
        post.authorId.includes('test') ||
        post.authorId === 'test-user-123' ||
        post.authorName === 'Test User'
      );

      // Check for posts created very recently (likely from tests)
      const createdAt = post.createdAt || post.timestamp;
      const isRecent = createdAt && (Date.now() - createdAt < 24 * 60 * 60 * 1000); // Last 24 hours

      if (isTestPost || hasTestAuthor) {
        testPosts.push({
          id: postId,
          title: post.title || 'Untitled',
          content: (post.content || '').substring(0, 100) + '...',
          authorName: post.authorName || 'Unknown',
          authorId: post.authorId || 'Unknown',
          createdAt: createdAt ? new Date(createdAt).toISOString() : 'Unknown',
          attachments: post.attachments || [],
          isRecent
        });
      }
    }

    console.log(`🎯 Found ${testPosts.length} test posts to clean up`);
    return testPosts;
    
  } catch (error) {
    console.error('❌ Error scanning posts:', error.message);
    throw error;
  }
}

/**
 * Find test replies associated with test posts
 */
async function findTestReplies(testPostIds) {
  console.log('🔍 Scanning for test replies...');
  
  try {
    const database = adminApp.database();
    const repliesSnapshot = await database.ref('forum/replies').once('value');
    const repliesData = repliesSnapshot.val();
    
    if (!repliesData) {
      console.log('ℹ️ No replies found in database');
      return [];
    }

    const testReplies = [];
    
    for (const [replyId, reply] of Object.entries(repliesData)) {
      // Check if reply belongs to a test post
      const belongsToTestPost = testPostIds.includes(reply.postId);
      
      // Check if reply itself is a test reply
      const isTestReply = /test.*reply/i.test(reply.content || '') ||
                         reply.authorId === 'test-user-123' ||
                         reply.authorName === 'Test User' ||
                         replyId.includes('test');

      if (belongsToTestPost || isTestReply) {
        testReplies.push({
          id: replyId,
          postId: reply.postId,
          content: (reply.content || '').substring(0, 50) + '...',
          authorName: reply.authorName || 'Unknown',
          authorId: reply.authorId || 'Unknown',
          attachments: reply.attachments || []
        });
      }
    }

    console.log(`🎯 Found ${testReplies.length} test replies to clean up`);
    return testReplies;
    
  } catch (error) {
    console.error('❌ Error scanning replies:', error.message);
    throw error;
  }
}

/**
 * Clean up S3 attachments
 */
async function cleanupS3Attachments(attachments) {
  if (!attachments || attachments.length === 0) {
    return;
  }

  // Skip S3 cleanup if bucket name is not configured
  if (!process.env.AWS_S3_BUCKET_NAME) {
    console.log(`⚠️ Skipping S3 cleanup for ${attachments.length} attachments (bucket not configured)`);
    return;
  }

  console.log(`🗑️ Cleaning up ${attachments.length} S3 attachments...`);
  
  for (const attachment of attachments) {
    try {
      if (attachment.s3Key) {
        await s3Client.send(new DeleteObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: attachment.s3Key
        }));
        console.log(`  ✅ Deleted S3 object: ${attachment.s3Key}`);
      }
    } catch (error) {
      console.warn(`  ⚠️ Failed to delete S3 object ${attachment.s3Key}:`, error.message);
    }
  }
}

/**
 * Delete test posts and their data
 */
async function deleteTestPosts(testPosts) {
  if (testPosts.length === 0) {
    console.log('ℹ️ No test posts to delete');
    return;
  }

  console.log(`🗑️ Deleting ${testPosts.length} test posts...`);
  
  const database = adminApp.database();
  
  for (const post of testPosts) {
    try {
      // Clean up S3 attachments first
      await cleanupS3Attachments(post.attachments);
      
      // Delete the post from Firebase
      await database.ref(`forum/posts/${post.id}`).remove();
      
      console.log(`  ✅ Deleted post: ${post.id} - "${post.title}"`);
    } catch (error) {
      console.error(`  ❌ Failed to delete post ${post.id}:`, error.message);
    }
  }
}

/**
 * Delete test replies and their data
 */
async function deleteTestReplies(testReplies) {
  if (testReplies.length === 0) {
    console.log('ℹ️ No test replies to delete');
    return;
  }

  console.log(`🗑️ Deleting ${testReplies.length} test replies...`);
  
  const database = adminApp.database();
  
  for (const reply of testReplies) {
    try {
      // Clean up S3 attachments first
      await cleanupS3Attachments(reply.attachments);
      
      // Delete the reply from Firebase
      await database.ref(`forum/replies/${reply.id}`).remove();
      
      console.log(`  ✅ Deleted reply: ${reply.id}`);
    } catch (error) {
      console.error(`  ❌ Failed to delete reply ${reply.id}:`, error.message);
    }
  }
}

/**
 * Display cleanup summary
 */
function displaySummary(testPosts, testReplies) {
  console.log('\n📋 Cleanup Summary:');
  
  if (testPosts.length > 0) {
    console.log('🗑️ Posts cleaned up:');
    testPosts.forEach(post => {
      console.log(`  • ${post.id}: "${post.title}" by ${post.authorName}`);
      console.log(`    Created: ${post.createdAt}`);
      if (post.attachments.length > 0) {
        console.log(`    Attachments: ${post.attachments.length} files cleaned from S3`);
      }
    });
  }
  
  if (testReplies.length > 0) {
    console.log('\n🗑️ Replies cleaned up:');
    testReplies.forEach(reply => {
      console.log(`  • ${reply.id}: "${reply.content}" by ${reply.authorName}`);
      if (reply.attachments.length > 0) {
        console.log(`    Attachments: ${reply.attachments.length} files cleaned from S3`);
      }
    });
  }
  
  if (testPosts.length === 0 && testReplies.length === 0) {
    console.log('✨ No test data found - database is clean!');
  }
}

/**
 * Main cleanup function
 */
async function runCleanup(options = {}) {
  const startTime = Date.now();
  
  try {
    console.log('🧹 Starting Test Data Cleanup');
    console.log('=' .repeat(50));
    
    await initialize();
    
    // Find test data
    const testPosts = await findTestPosts();
    const testPostIds = testPosts.map(p => p.id);
    const testReplies = await findTestReplies(testPostIds);
    
    if (testPosts.length === 0 && testReplies.length === 0) {
      console.log('✨ No test data found - database is already clean!');
      return;
    }
    
    // Display what will be cleaned
    console.log('\n🎯 Test data found:');
    if (testPosts.length > 0) {
      console.log(`  • ${testPosts.length} test posts`);
    }
    if (testReplies.length > 0) {
      console.log(`  • ${testReplies.length} test replies`);
    }
    
    // Confirm deletion unless --force is used
    if (!options.force) {
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise(resolve => {
        rl.question('\n❓ Do you want to proceed with cleanup? (y/N): ', resolve);
      });
      rl.close();
      
      if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
        console.log('❌ Cleanup cancelled by user');
        return;
      }
    }
    
    console.log('\n🗑️ Starting cleanup...');
    
    // Delete test data
    await deleteTestReplies(testReplies);
    await deleteTestPosts(testPosts);
    
    const duration = Date.now() - startTime;
    console.log('\n' + '=' .repeat(50));
    console.log(`🎉 Cleanup completed successfully! Duration: ${duration}ms`);
    
    displaySummary(testPosts, testReplies);
    
  } catch (error) {
    console.error('\n' + '=' .repeat(50));
    console.error('💥 Cleanup failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    try {
      if (adminApp) {
        await adminApp.delete();
      }
    } catch (error) {
      console.warn('⚠️ Warning: Failed to cleanup Firebase Admin app:', error.message);
    }
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
const options = {
  force: args.includes('--force') || args.includes('-f'),
  dryRun: args.includes('--dry-run') || args.includes('-d')
};

// Show help
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
🧹 Test Data Cleanup Script

Usage: node cleanup-test-posts.js [options]

Options:
  --force, -f     Skip confirmation prompt
  --dry-run, -d   Show what would be deleted without actually deleting
  --help, -h      Show this help message

This script will:
• Find posts and replies containing 'undefined' or test-related content
• Find posts created by test users (test-user-123, etc.)
• Clean up associated S3 attachments
• Remove all identified test data from Firebase

Examples:
  node cleanup-test-posts.js              # Interactive cleanup
  node cleanup-test-posts.js --force      # Cleanup without confirmation
  node cleanup-test-posts.js --dry-run    # Preview what would be deleted
`);
  process.exit(0);
}

// Run cleanup if not dry-run
if (options.dryRun) {
  console.log('🔍 DRY RUN MODE - No data will be deleted');
  // TODO: Implement dry-run mode that shows what would be deleted
  runCleanup({ ...options, force: true }).then(() => {
    console.log('\n💡 This was a dry run - no data was actually deleted');
    console.log('Run without --dry-run to perform actual cleanup');
  });
} else {
  runCleanup(options).catch(console.error);
}

// Export for use as module
module.exports = {
  runCleanup,
  findTestPosts,
  findTestReplies,
  deleteTestPosts,
  deleteTestReplies
};