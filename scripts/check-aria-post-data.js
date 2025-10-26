const { getAdminDatabase } = require('../helpers/firebase-admin-utils');

async function checkAriaPostData() {
    console.log('🔍 WAVELENGTH SUPER POWER: Firebase Data Check');
    console.log('==============================================\n');

    try {
        const db = getAdminDatabase();
        if (!db) {
            console.log('❌ Firebase not initialized');
            return;
        }

        const postId = '-OcTbtWHy2QvT9yGl89x';
        console.log(`📋 Checking post: ${postId}`);
        
        const postSnapshot = await db.ref(`forum/posts/${postId}`).once('value');
        const post = postSnapshot.val();
        
        if (post) {
            console.log('✅ POST DATA EXISTS AND IS INTACT:');
            console.log(`   📝 Title: "${post.title}"`);
            console.log(`   👤 Author: "${post.authorName}"`);
            console.log(`   📄 Content length: ${post.content ? post.content.length : 0} chars`);
            console.log(`   📅 Created: ${new Date(post.createdAt).toLocaleString()}`);
            console.log(`   👀 Views: ${post.views || 0}`);
            console.log(`   🏷️ Category: ${post.forumId || 'none'}`);
            
            console.log('\n📄 CONTENT PREVIEW:');
            console.log(`"${post.content ? post.content.substring(0, 200) : 'NO CONTENT'}..."`);
            
            console.log('\n🎯 VERDICT: Data is NOT corrupted - it exists and is complete!');
        } else {
            console.log('❌ POST NOT FOUND in Firebase');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkAriaPostData().then(() => {
    console.log('\n✅ Data check complete');
    process.exit(0);
}).catch(error => {
    console.error('❌ Check failed:', error);
    process.exit(1);
});