#!/usr/bin/env node

/**
 * Quick Forum Visual Check
 * Fast validation of forum posts with minimal setup
 */

const puppeteer = require('puppeteer');

async function quickForumCheck() {
  console.log('⚡ Quick Forum Visual Check Starting...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1200, height: 800 }
  });
  
  const page = await browser.newPage();
  const baseUrl = 'http://localhost:3001';
  
  try {
    // Check forum index
    console.log('📋 Checking forum index...');
    await page.goto(`${baseUrl}/forum`, { waitUntil: 'networkidle0' });
    
    const posts = await page.$$('.post-item, .forum-post, [data-post-id]');
    console.log(`✅ Found ${posts.length} posts on forum`);
    
    if (posts.length === 0) {
      console.log('❌ No posts found on forum index');
      return false;
    }
    
    // Check first post
    console.log('📄 Checking first post page...');
    const firstPostLink = await page.$('a[href*="/forum/post/"]');
    
    if (firstPostLink) {
      await firstPostLink.click();
      await page.waitForNavigation({ waitUntil: 'networkidle0' });
      
      // Quick element checks
      const elements = {
        title: await page.$('h1, .post-title') !== null,
        content: await page.$('.post-content, .post-body') !== null,
        author: await page.$('.post-author, .author') !== null,
        avatar: await page.$('.avatar, .fa-user') !== null
      };
      
      const foundElements = Object.entries(elements)
        .filter(([key, found]) => found)
        .map(([key]) => key);
      
      console.log(`✅ Post elements found: ${foundElements.join(', ')}`);
      
      if (foundElements.length >= 3) {
        console.log('🎉 Forum posts are displaying correctly!');
        return true;
      } else {
        console.log('⚠️ Some post elements may be missing');
        return false;
      }
    } else {
      console.log('❌ No post links found');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Quick check failed:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

// Run check
if (require.main === module) {
  quickForumCheck()
    .then(success => {
      console.log(`\n🎯 Quick Check Result: ${success ? '✅ PASSED' : '❌ FAILED'}`);
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

module.exports = quickForumCheck;