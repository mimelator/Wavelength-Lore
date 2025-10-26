#!/usr/bin/env node

const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'http://localhost:3001';
const POST_ID = '-OcTbtWHy2QvT9yGl89x';

async function testPostPageNavigation() {
    console.log('🔍 Testing Post Page Navigation Path');
    console.log('=====================================\n');

    try {
        // Step 1: Test main forum page
        console.log('1️⃣ Testing Main Forum Page...');
        const forumResponse = await axios.get(`${BASE_URL}/forum`, {
            timeout: 10000
        });
        
        const forumHtml = cheerio.load(forumResponse.data);
        
        // Check if Aria's post appears on main page
        const ariaPostLink = forumHtml(`a[href="/forum/post/${POST_ID}"]`);
        console.log(`   📋 Aria's post link found: ${ariaPostLink.length > 0 ? '✅ YES' : '❌ NO'}`);
        
        if (ariaPostLink.length > 0) {
            const linkText = ariaPostLink.text().trim();
            console.log(`   📝 Link text: "${linkText}"`);
        }

        // Step 2: Test individual post page
        console.log('\n2️⃣ Testing Individual Post Page...');
        const postResponse = await axios.get(`${BASE_URL}/forum/post/${POST_ID}`, {
            timeout: 10000
        });
        
        const postHtml = cheerio.load(postResponse.data);
        
        // Check for post content elements
        const postTitle = postHtml('h1, .post-title, [class*="title"]').text().trim();
        const postContent = postHtml('.post-content, [class*="content"], .post-body, [class*="body"]').text().trim();
        const authorName = postHtml('.author, [class*="author"]').text().trim();
        
        console.log(`   📋 Post title found: ${postTitle ? '✅ YES' : '❌ NO'}`);
        if (postTitle) console.log(`   📝 Title: "${postTitle}"`);
        
        console.log(`   📋 Post content found: ${postContent ? '✅ YES' : '❌ NO'}`);
        if (postContent) console.log(`   📝 Content preview: "${postContent.substring(0, 100)}..."`);
        
        console.log(`   📋 Author found: ${authorName ? '✅ YES' : '❌ NO'}`);
        if (authorName) console.log(`   📝 Author: "${authorName}"`);

        // Step 3: Check for JavaScript errors or missing data indicators
        console.log('\n3️⃣ Analyzing Page Structure...');
        
        // Look for error messages
        const errorMessages = postHtml('.error, [class*="error"], .alert-danger').text().trim();
        if (errorMessages) {
            console.log(`   ⚠️  Error messages found: "${errorMessages}"`);
        }
        
        // Check for loading indicators
        const loadingIndicators = postHtml('.loading, [class*="loading"], .spinner').length;
        console.log(`   🔄 Loading indicators: ${loadingIndicators}`);
        
        // Check for empty content indicators
        const emptyIndicators = postHtml(':contains("No content"), :contains("Loading"), :contains("Error")').length;
        console.log(`   📭 Empty/error indicators: ${emptyIndicators}`);

        // Step 4: Raw HTML analysis
        console.log('\n4️⃣ Raw HTML Analysis...');
        const htmlLength = postResponse.data.length;
        console.log(`   📏 HTML length: ${htmlLength} characters`);
        
        // Look for specific patterns that might indicate the issue
        const hasPostData = postResponse.data.includes('post-') || postResponse.data.includes('Aria');
        console.log(`   🔍 Contains post-related data: ${hasPostData ? '✅ YES' : '❌ NO'}`);
        
        // Check for Firebase-related content
        const hasFirebaseRefs = postResponse.data.includes('firebase') || postResponse.data.includes('Firebase');
        console.log(`   🔥 Contains Firebase references: ${hasFirebaseRefs ? '✅ YES' : '❌ NO'}`);

        // Step 5: Compare responses
        console.log('\n5️⃣ Response Comparison...');
        console.log(`   📊 Forum page size: ${forumResponse.data.length} chars`);
        console.log(`   📊 Post page size: ${postResponse.data.length} chars`);
        console.log(`   📊 Size ratio: ${(postResponse.data.length / forumResponse.data.length * 100).toFixed(1)}%`);

        // Final verdict
        console.log('\n🎯 DIAGNOSIS:');
        if (!postTitle && !postContent) {
            console.log('   ❌ ISSUE CONFIRMED: Post page shows no content despite post existing on forum page');
            console.log('   🔧 Likely causes:');
            console.log('      - Template rendering issue');
            console.log('      - Missing template variables');
            console.log('      - Firebase data retrieval failure in post route');
            console.log('      - JavaScript loading/rendering issue');
        } else {
            console.log('   ✅ Post page appears to be working correctly');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Headers:`, error.response.headers);
        }
    }
}

// Auto-exit detection
const startTime = Date.now();
const timeout = setTimeout(() => {
    console.log('\n⏰ Test completed - auto-exiting');
    process.exit(0);
}, 15000);

testPostPageNavigation().then(() => {
    clearTimeout(timeout);
    console.log(`\n✅ Test completed in ${Date.now() - startTime}ms`);
    process.exit(0);
}).catch(error => {
    clearTimeout(timeout);
    console.error('❌ Test failed:', error);
    process.exit(1);
});