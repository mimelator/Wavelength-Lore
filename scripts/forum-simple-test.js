#!/usr/bin/env node

/**
 * Simple Forum Test - Check if posts are loading
 */

const puppeteer = require('puppeteer');

async function testForumPosts() {
    console.log('🔍 Testing Forum Posts Loading...\n');
    
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    // Capture console messages
    const consoleMessages = [];
    page.on('console', msg => {
        consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });
    
    try {
        console.log('📱 Loading forum page...');
        await page.goto('http://localhost:3001/forum', { 
            waitUntil: 'networkidle0',
            timeout: 15000 
        });
        
        // Wait for JavaScript to execute
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check if loadRecentPosts function exists
        const hasFunction = await page.evaluate(() => {
            return typeof loadRecentPosts === 'function';
        });
        console.log('🔧 loadRecentPosts function exists:', hasFunction);
        
        // Check container content
        const containerContent = await page.evaluate(() => {
            const container = document.getElementById('recent-posts-container');
            return container ? container.innerHTML : 'Container not found';
        });
        
        console.log('📦 Container content length:', containerContent.length);
        console.log('📄 Container preview:', containerContent.substring(0, 150));
        
        // Try to manually call the API
        const apiTest = await page.evaluate(async () => {
            try {
                const response = await fetch('/forum/api/posts/recent?limit=3');
                const data = await response.json();
                return { success: true, posts: data.posts?.length || 0 };
            } catch (error) {
                return { success: false, error: error.message };
            }
        });
        
        console.log('🧪 Manual API test:', apiTest);
        
        // Check for posts in DOM
        const postsInDOM = await page.evaluate(() => {
            return document.querySelectorAll('.recent-post-item').length;
        });
        console.log('📊 Posts found in DOM:', postsInDOM);
        
        console.log('\n📝 Console Messages:');
        consoleMessages.forEach(msg => console.log('  ', msg));
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await browser.close();
    }
}

testForumPosts().catch(console.error);