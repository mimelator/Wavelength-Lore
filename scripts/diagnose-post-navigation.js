const axios = require('axios');
const cheerio = require('cheerio');

async function diagnosePostNavigation() {
    console.log('🔍 WAVELENGTH SUPER POWER: Post Navigation Diagnosis');
    console.log('====================================================\n');

    const BASE_URL = 'http://localhost:3001';
    const POST_ID = '-OcTbtWHy2QvT9yGl89x';

    try {
        // Step 1: Check main forum page
        console.log('1️⃣ Checking Main Forum Page...');
        const forumResponse = await axios.get(`${BASE_URL}/forum`);
        const forumHtml = cheerio.load(forumResponse.data);
        
        const ariaLink = forumHtml(`a[href="/forum/post/${POST_ID}"]`);
        console.log(`   ✅ Aria's post link exists: ${ariaLink.length > 0}`);
        if (ariaLink.length > 0) {
            console.log(`   📝 Link text: "${ariaLink.text().trim()}"`);
        }

        // Step 2: Test individual post page
        console.log('\n2️⃣ Testing Individual Post Page...');
        const postResponse = await axios.get(`${BASE_URL}/forum/post/${POST_ID}`);
        const postHtml = cheerio.load(postResponse.data);
        
        // Check for specific template elements
        const postTitle = postHtml('.post-title').text().trim();
        const postContent = postHtml('.post-content').text().trim();
        const authorName = postHtml('.post-author').text().trim();
        const errorMessage = postHtml('.error-message').length > 0;
        
        console.log(`   📋 Post title: "${postTitle}"`);
        console.log(`   📄 Post content: "${postContent.substring(0, 100)}${postContent.length > 100 ? '...' : ''}"`);
        console.log(`   👤 Author info: "${authorName}"`);
        console.log(`   ❌ Error message shown: ${errorMessage}`);
        
        // Step 3: Check template variables
        console.log('\n3️⃣ Template Variable Analysis...');
        const hasPostCheck = postHtml('body').html().includes('typeof post');
        const hasPostData = postHtml('.forum-post').length > 0;
        
        console.log(`   🔍 Template post check exists: ${hasPostCheck}`);
        console.log(`   📊 Post article rendered: ${hasPostData}`);
        
        // Step 4: Raw content analysis
        console.log('\n4️⃣ Raw Content Analysis...');
        const htmlContent = postResponse.data;
        const hasAriaName = htmlContent.includes('Aria');
        const hasPostObject = htmlContent.includes('post.title');
        const hasContentDiv = htmlContent.includes('post-content');
        
        console.log(`   🔍 Contains "Aria": ${hasAriaName}`);
        console.log(`   📝 Contains post.title: ${hasPostObject}`);
        console.log(`   🎯 Contains post-content div: ${hasContentDiv}`);
        
        // Step 5: Diagnosis
        console.log('\n🎯 ROOT CAUSE DIAGNOSIS:');
        if (!postTitle && !postContent && !errorMessage) {
            console.log('   ❌ ISSUE: Template rendering but no data displayed');
            console.log('   🔧 LIKELY CAUSE: Post object is null/undefined in template');
            console.log('   💡 SOLUTION: Check Firebase data retrieval in /forum/post/:postId route');
        } else if (errorMessage) {
            console.log('   ❌ ISSUE: Error message displayed');
            console.log('   🔧 LIKELY CAUSE: Post not found in Firebase or route error');
        } else {
            console.log('   ✅ Post appears to be rendering correctly');
        }

    } catch (error) {
        console.error('❌ Diagnosis failed:', error.message);
    }
}

diagnosePostNavigation().then(() => {
    console.log('\n✅ Diagnosis complete - WAVELENGTH SUPER POWERS ACTIVATED!');
    process.exit(0);
}).catch(error => {
    console.error('❌ Diagnosis error:', error);
    process.exit(1);
});