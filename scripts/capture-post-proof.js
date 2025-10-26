#!/usr/bin/env node

/**
 * Capture Post Proof - Wavelength Super Tool
 * Takes screenshot and extracts content to prove post is rendering
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

async function capturePostProof() {
    console.log('📸 Capturing Post Rendering Proof...\n');
    
    const screenshotDir = path.join(__dirname, '../test-screenshots');
    await fs.mkdir(screenshotDir, { recursive: true });
    
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1200, height: 800 }
    });
    
    const page = await browser.newPage();
    
    try {
        const postUrl = 'http://localhost:3001/forum/post/-OcTbtWHy2QvT9yGl89x';
        console.log(`🎯 Loading: ${postUrl}`);
        
        await page.goto(postUrl, { waitUntil: 'networkidle0', timeout: 15000 });
        
        // Take full page screenshot
        const screenshotPath = path.join(screenshotDir, 'aria-post-proof.png');
        await page.screenshot({
            path: screenshotPath,
            fullPage: true
        });
        
        // Extract all visible content
        const pageContent = await page.evaluate(() => {
            return {
                title: document.querySelector('h1, .post-title')?.textContent?.trim() || 'NO TITLE',
                author: document.querySelector('.post-author')?.textContent?.trim() || 'NO AUTHOR',
                content: document.querySelector('.post-content')?.textContent?.trim() || 'NO CONTENT',
                contentLength: document.querySelector('.post-content')?.textContent?.trim()?.length || 0,
                hasBackLink: !!document.querySelector('.back-link'),
                hasAvatar: !!document.querySelector('.post-avatar'),
                pageTitle: document.title,
                bodyText: document.body.textContent?.trim() || ''
            };
        });
        
        console.log('✅ Screenshot captured:', screenshotPath);
        console.log('\n📊 PROOF OF RENDERING:');
        console.log('='.repeat(50));
        console.log(`📝 Title: "${pageContent.title}"`);
        console.log(`👤 Author: "${pageContent.author}"`);
        console.log(`📄 Content Length: ${pageContent.contentLength} characters`);
        console.log(`🖼️ Has Avatar: ${pageContent.hasAvatar}`);
        console.log(`🔗 Has Back Link: ${pageContent.hasBackLink}`);
        console.log(`📋 Page Title: "${pageContent.pageTitle}"`);
        
        if (pageContent.content && pageContent.content.length > 0) {
            console.log('\n📖 CONTENT PREVIEW:');
            console.log('-'.repeat(50));
            console.log(pageContent.content.substring(0, 300) + '...');
            console.log('-'.repeat(50));
        }
        
        // Verify specific content elements
        const hasExpectedContent = pageContent.title.includes('Songs of the Ancient Wavelength') &&
                                  pageContent.author.includes('Aria Moonwhisper') &&
                                  pageContent.content.includes('ancient melody') &&
                                  pageContent.contentLength > 500;
        
        console.log(`\n🎯 VERIFICATION: ${hasExpectedContent ? '✅ PASS' : '❌ FAIL'}`);
        
        if (hasExpectedContent) {
            console.log('🎉 POST IS RENDERING CORRECTLY!');
            console.log('   ✅ Title displays properly');
            console.log('   ✅ Author information visible');
            console.log('   ✅ Full content rendered');
            console.log('   ✅ All visual elements present');
        } else {
            console.log('❌ POST RENDERING ISSUES DETECTED');
        }
        
        console.log(`\n📸 Screenshot saved: ${screenshotPath}`);
        
        await browser.close();
        process.exit(hasExpectedContent ? 0 : 1);
        
    } catch (error) {
        console.error('💥 Proof capture failed:', error);
        await browser.close();
        process.exit(1);
    }
}

capturePostProof();