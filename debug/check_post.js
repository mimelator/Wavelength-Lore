/**
 * Test script to check if a specific post exists in Firebase
 */

const admin = require('firebase-admin');
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get } = require('firebase/database');
require('dotenv').config({ path: '../.env' });

// Initialize Firebase Admin SDK
const serviceAccount = require('../firebaseServiceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.DATABASE_URL
});

// Generate a custom token for script authentication
async function getCustomToken() {
  const customToken = await admin.auth().createCustomToken('check_post_script', {
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

async function checkPost() {
    try {
        // Initialize Firebase with custom token
        const db = await initializeFirebaseWithToken();
        
        const postId = '-Obmj_eOlZ4OEQdZ9OEq'; // The post ID from the URL
        
        console.log(`🔍 Checking for post: ${postId}`);
        
        // Check if the post exists
        const postRef = ref(db, `forum/posts/${postId}`);
        const snapshot = await get(postRef);
        
        if (snapshot.exists()) {
            const postData = snapshot.val();
            console.log('✅ Post found!');
            console.log('📄 Post data:', JSON.stringify(postData, null, 2));
        } else {
            console.log('❌ Post not found in Firebase');
            
            // Let's check what posts do exist
            console.log('\n🔍 Checking all posts...');
            const allPostsRef = ref(db, 'forum/posts');
            const allPostsSnapshot = await get(allPostsRef);
            
            if (allPostsSnapshot.exists()) {
                const allPosts = allPostsSnapshot.val();
                const postIds = Object.keys(allPosts);
                console.log(`📋 Found ${postIds.length} posts in database:`);
                postIds.forEach(id => {
                    const post = allPosts[id];
                    console.log(`  - ${id}: "${post.title}" by ${post.authorName}`);
                });
            } else {
                console.log('❌ No posts found in database');
            }
        }
        
    } catch (error) {
        console.error('❌ Error checking post:', error);
    }
    
    process.exit(0);
}

checkPost();