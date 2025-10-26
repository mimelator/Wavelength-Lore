#!/usr/bin/env node

/**
 * Forum Frontend Debug Script
 * Tests if the forum API is accessible and working correctly
 */

const puppeteer = require('puppeteer');

async function debugForumFrontend() {
    console.log('🔍 Starting Forum Frontend Debug...\n');
    
    let browser;
    try {
        browser = await puppeteer.launch({ 
            headless: false,
            devtools: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        // Listen for console messages
        page.on('console', msg => {
            const type = msg.type();
            const text = msg.text();
            console.log(`🖥️  [${type.toUpperCase()}] ${text}`);
        });
        
        // Listen for network requests
        page.on('response', response => {
            const url = response.url();
            const status = response.status();
            if (url.includes('/forum/api/')) {
                console.log(`🌐 API Request: ${url} - Status: ${status}`);
            }
        });
        
        console.log('📱 Navigating to forum home page...');
        await page.goto('http://localhost:3001/forum', { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        
        // Wait for the page to load
        await page.waitForTimeout(3000);
        
        // Check if recent posts container exists
        const recentPostsContainer = await page.$('#recent-posts-container');
        console.log('📦 Recent posts container found:', !!recentPostsContainer);
        
        if (recentPostsContainer) {
            const containerHTML = await page.evaluate(() => {
                const container = document.getElementById('recent-posts-container');
                return container ? container.innerHTML : 'Container not found';
            });
            console.log('📄 Container content preview:', containerHTML.substring(0, 200) + '...');
        }
        
        // Test API call directly from browser
        console.log('\n🧪 Testing API call from browser...');
        const apiResult = await page.evaluate(async () => {
            try {
                const response = await fetch('/forum/api/posts/recent?limit=3');
                const data = await response.json();
                return {
                    success: true,
                    status: response.status,
                    postsCount: data.posts ? data.posts.length : 0,
                    data: data
                };
            } catch (error) {
                return {
                    success: false,
                    error: error.message
                };
            }
        });
        
        console.log('🔬 API Test Result:', apiResult);
        
        // Check for JavaScript errors
        const jsErrors = await page.evaluate(() => {
            return window.jsErrors || [];
        });
        
        if (jsErrors.length > 0) {
            console.log('❌ JavaScript Errors Found:', jsErrors);
        } else {
            console.log('✅ No JavaScript errors detected');
        }
        
        // Wait a bit more to see if posts load
        console.log('\n⏳ Waiting 5 seconds for posts to load...');
        await page.waitForTimeout(5000);
        
        // Check final state
        const finalState = await page.evaluate(() => {
            const container = document.getElementById('recent-posts-container');
            const posts = container ? container.querySelectorAll('.recent-post-item') : [];
            return {
                containerExists: !!container,
                postsFound: posts.length,
                containerHTML: container ? container.innerHTML.substring(0, 300) : 'No container'
            };
        });
        
        console.log('\n📊 Final State:', finalState);
        
        console.log('\n🎯 Debug Complete! Browser will stay open for manual inspection.');
        console.log('Press Ctrl+C to close when done.');
        
        // Keep browser open for manual inspection
        await new Promise(() => {});
        
    } catch (error) {
        console.error('💥 Debug Error:', error);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

if (require.main === module) {
    debugForumFrontend().catch(console.error);
}

module.exports = { debugForumFrontend };