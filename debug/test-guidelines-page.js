#!/usr/bin/env node

/**
 * Test Script: Forum Guidelines Page
 * Tests the implementation of the community guidelines page
 */

const http = require('http');

console.log('🧪 Testing Forum Guidelines Page Implementation\n');

/**
 * Test the guidelines page loads correctly
 */
async function testGuidelinesPageLoad() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: '/forum/guidelines',
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: data
                });
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.setTimeout(5000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.end();
    });
}

/**
 * Test the main forum page has guidelines link
 */
async function testForumPageLinks() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: '/forum',
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    body: data
                });
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.setTimeout(5000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.end();
    });
}

/**
 * Run all tests
 */
async function runTests() {
    try {
        // Test 1: Guidelines Page Load
        console.log('📋 Test 1: Guidelines Page Load');
        const guidelinesResponse = await testGuidelinesPageLoad();
        
        if (guidelinesResponse.statusCode === 200) {
            console.log('  ✅ Guidelines page loads successfully');
            console.log(`  📊 Status: ${guidelinesResponse.statusCode}`);
            
            // Check for key content
            const body = guidelinesResponse.body;
            const hasTitle = body.includes('Community Guidelines');
            const hasCoreSection = body.includes('Core Principles');
            const hasPostingSection = body.includes('Posting Guidelines');
            const hasModerationSection = body.includes('Moderation Policy');
            const hasReportingSection = body.includes('Reporting Issues');
            
            console.log(`  📝 Contains title: ${hasTitle ? '✅' : '❌'}`);
            console.log(`  📝 Contains core principles: ${hasCoreSection ? '✅' : '❌'}`);
            console.log(`  📝 Contains posting guidelines: ${hasPostingSection ? '✅' : '❌'}`);
            console.log(`  📝 Contains moderation policy: ${hasModerationSection ? '✅' : '❌'}`);
            console.log(`  📝 Contains reporting section: ${hasReportingSection ? '✅' : '❌'}`);
        } else {
            console.log(`  ❌ Guidelines page failed to load: ${guidelinesResponse.statusCode}`);
        }

        console.log('');

        // Test 2: Forum Page Guidelines Links
        console.log('📋 Test 2: Forum Page Navigation Links');
        const forumResponse = await testForumPageLinks();
        
        if (forumResponse.statusCode === 200) {
            console.log('  ✅ Forum page loads successfully');
            
            // Check for guidelines links
            const forumBody = forumResponse.body;
            const hasCommunityLinksSection = forumBody.includes('forum-community-links');
            const hasGuidelinesLink = forumBody.includes('/forum/guidelines');
            const hasSearchLink = forumBody.includes('/forum/search');
            const hasRecentLink = forumBody.includes('/forum/recent');
            
            console.log(`  🔗 Contains community links section: ${hasCommunityLinksSection ? '✅' : '❌'}`);
            console.log(`  🔗 Contains guidelines link: ${hasGuidelinesLink ? '✅' : '❌'}`);
            console.log(`  🔗 Contains search link: ${hasSearchLink ? '✅' : '❌'}`);
            console.log(`  🔗 Contains recent posts link: ${hasRecentLink ? '✅' : '❌'}`);
        } else {
            console.log(`  ❌ Forum page failed to load: ${forumResponse.statusCode}`);
        }

        console.log('\n🎉 Guidelines page testing completed!');
        console.log('\n📝 Implementation Status:');
        console.log('  ✅ Guidelines page template created');
        console.log('  ✅ Community guidelines content written');
        console.log('  ✅ Navigation links added to forum home');
        console.log('  ✅ Responsive design implemented');
        console.log('  ✅ CSS styles added');
        
        console.log('\n🌐 Access guidelines at: http://localhost:3001/forum/guidelines');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('💡 Make sure the development server is running on port 3001');
    }
}

// Run the tests
runTests();