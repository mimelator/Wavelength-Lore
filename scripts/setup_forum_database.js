const admin = require('firebase-admin');
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set } = require('firebase/database');
const serviceAccount = require('../firebaseServiceAccountKey.json');
require('dotenv').config({ path: '../.env' });

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.DATABASE_URL
  });
}

// Generate a custom token for script authentication
async function getCustomToken() {
  const customToken = await admin.auth().createCustomToken('setup_forum_script', {
    isScript: true
  });
  return customToken;
}

// Initialize Firebase App with the custom token
async function initializeFirebaseWithToken() {
  const customToken = await getCustomToken();
  const firebaseApp = initializeApp({
    apiKey: process.env.API_KEY,
    authDomain: process.env.AUTH_DOMAIN,
    databaseURL: process.env.DATABASE_URL,
    projectId: process.env.PROJECT_ID,
    storageBucket: process.env.STORAGE_BUCKET,
    messagingSenderId: process.env.MESSAGING_SENDER_ID,
    appId: process.env.APP_ID
  });
  
  // Sign in with the custom token
  const { getAuth, signInWithCustomToken } = require('firebase/auth');
  const auth = getAuth(firebaseApp);
  await signInWithCustomToken(auth, customToken);
  
  return getDatabase(firebaseApp);
}

/**
 * Initialize forum database structure in Firebase Realtime Database
 * This sets up the basic schema for forums, posts, and replies
 */
async function setupForumDatabase() {
  console.log('🏗️ Setting up Wavelength Forum Database...');
  
  try {
    // Initialize Firebase with custom token
    const db = await initializeFirebaseWithToken();
    
    // Forum Categories Setup
    const forumCategories = {
      general: {
        id: 'general',
        title: 'General Discussion',
        description: 'Talk about Wavelength episodes, characters, and music',
        color: '#4a47a3', // Match your hero color
        icon: '🎵',
        iconSvg: '/icons/hero-icon.svg',
        order: 1,
        moderators: [],
        postCount: 0,
        lastActivity: null,
        createdAt: Date.now()
      },
      lore: {
        id: 'lore',
        title: 'Lore & Theories',
        description: 'Dive deep into Wavelength lore, analyze episodes, and share theories',
        color: '#6a4c93', // Match your lore color
        icon: '📜',
        iconSvg: '/icons/lore-icon.svg',
        order: 2,
        moderators: [],
        postCount: 0,
        lastActivity: null,
        createdAt: Date.now()
      },
      episodes: {
        id: 'episodes',
        title: 'Episode Discussions',
        description: 'Discuss specific episodes, favorite moments, and episode reviews',
        color: '#e74c3c', // Match your episode color
        icon: '🎬',
        iconSvg: '/icons/episode-icon.svg',
        order: 3,
        moderators: [],
        postCount: 0,
        lastActivity: null,
        createdAt: Date.now()
      },
      fanart: {
        id: 'fanart',
        title: 'Fan Creations',
        description: 'Share fan art, music covers, and creative works inspired by Wavelength',
        color: '#9b59b6',
        icon: '🎨',
        iconSvg: '/icons/hero-icon.svg', // Can use hero icon or create new one
        order: 4,
        moderators: [],
        postCount: 0,
        lastActivity: null,
        createdAt: Date.now()
      }
    };

    // Forum Settings
    const forumSettings = {
      siteName: 'Wavelength Community Forum',
      description: 'Official community forum for Wavelength Lore',
      enableGuestViewing: true,
      enableGuestPosting: false,
      requireApproval: false,
      maxPostLength: 10000,
      maxReplyLength: 5000,
      allowImageUploads: true,
      allowFileUploads: true,
      maxFileSize: 1048576, // 1MB in bytes
      maxFilesPerPost: 5,
      allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'txt', 'md', 'pdf'],
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'text/plain', 'text/markdown', 'application/pdf'],
      fileStorageType: 's3', // Changed from 'firebase' to 's3'
      s3Bucket: 'wavelength-lore-backups',
      s3Region: 'us-east-1',
      mainSiteUrl: 'https://wavelengthlore.com',
      version: '1.0.0',
      createdAt: Date.now()
    };

    // User roles and permissions
    const userRoles = {
      admin: {
        name: 'Administrator',
        permissions: ['create_post', 'edit_any_post', 'delete_any_post', 'moderate', 'ban_users', 'manage_categories'],
        color: '#e74c3c'
      },
      moderator: {
        name: 'Moderator', 
        permissions: ['create_post', 'edit_any_post', 'delete_any_post', 'moderate'],
        color: '#f39c12'
      },
      member: {
        name: 'Member',
        permissions: ['create_post', 'edit_own_post', 'delete_own_post'],
        color: '#4a47a3'
      },
      guest: {
        name: 'Guest',
        permissions: ['view_posts'],
        color: '#95a5a6'
      }
    };

    // Write to database
    console.log('📝 Creating forum categories...');
    await set(ref(db, 'forum/categories'), forumCategories);
    
    console.log('⚙️ Setting up forum configuration...');
    await set(ref(db, 'forum/settings'), forumSettings);
    
    console.log('👥 Setting up user roles...');
    await set(ref(db, 'forum/roles'), userRoles);

    // Create initial welcome post in general category
    const welcomePost = {
      id: 'welcome-post',
      forumId: 'general',
      title: 'Welcome to the Wavelength Community Forum! 🎵',
      content: `Welcome to the official Wavelength Community Forum!

This is your space to discuss everything related to Wavelength:
- Share your favorite episodes and moments
- Dive deep into lore and theories  
- Connect with other fans
- Share fan art and creative works

**Forum Guidelines:**
- Be respectful and kind to fellow community members
- Stay on topic in each category
- No spam or inappropriate content
- Have fun discussing the world of Wavelength!

Ready to join the conversation? Create your first post and introduce yourself!`,
      authorId: 'system',
      authorName: 'Wavelength Team',
      authorAvatar: '/icons/hero-icon.svg',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      replyCount: 0,
      likes: 0,
      likedBy: {},
      isPinned: true,
      isLocked: false,
      tags: ['welcome', 'guidelines'],
      lastReplyAt: Date.now(),
      lastReplyBy: 'system'
    };

    console.log('📌 Creating welcome post...');
    await set(ref(db, 'forum/posts/welcome-post'), welcomePost);

    // Update category post count
    await set(ref(db, 'forum/categories/general/postCount'), 1);
    await set(ref(db, 'forum/categories/general/lastActivity'), Date.now());

    console.log('✅ Forum database setup completed successfully!');
    console.log(`
🎉 Forum Structure Created:
   📂 Categories: ${Object.keys(forumCategories).length}
   📝 Initial Posts: 1 (Welcome post)
   ⚙️ Settings: Configured
   👥 User Roles: Configured
   
🚀 Next Steps:
   1. Create forum frontend components
   2. Set up authentication integration
   3. Deploy forum routes
   4. Test forum functionality
`);

  } catch (error) {
    console.error('❌ Error setting up forum database:', error);
    throw error;
  }
}

// Run setup if called directly
if (require.main === module) {
  setupForumDatabase()
    .then(() => {
      console.log('Forum database setup complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to setup forum database:', error);
      process.exit(1);
    });
}

module.exports = { setupForumDatabase };