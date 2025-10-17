/**
 * Test script to check if a specific post exists in Firebase
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./firebaseServiceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://wavelength-lore-default-rtdb.firebaseio.com"
});

const db = admin.database();

async function checkPost() {
    try {
        const postId = '-Obmj_eOlZ4OEQdZ9OEq'; // The post ID from the URL
        
        console.log(`🔍 Checking for post: ${postId}`);
        
        // Check if the post exists
        const postRef = db.ref(`forum/posts/${postId}`);
        const snapshot = await postRef.once('value');
        
        if (snapshot.exists()) {
            const postData = snapshot.val();
            console.log('✅ Post found!');
            console.log('📄 Post data:', JSON.stringify(postData, null, 2));
        } else {
            console.log('❌ Post not found in Firebase');
            
            // Let's check what posts do exist
            console.log('\n🔍 Checking all posts...');
            const allPostsRef = db.ref('forum/posts');
            const allPostsSnapshot = await allPostsRef.once('value');
            
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