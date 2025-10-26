#!/usr/bin/env node

/**
 * Forum Visual Test Script
 * Takes screenshots and validates visual elements of forum posts
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class ForumVisualTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://wavelengthlore.com' 
      : 'http://localhost:3001';
    this.screenshotDir = path.join(__dirname, '../test-screenshots');
    this.results = [];
  }

  async initialize() {
    console.log('📸 Starting Forum Visual Testing...');
    
    // Create screenshots directory
    try {
      await fs.mkdir(this.screenshotDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
    
    this.browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1200, height: 800 },
      args: ['--no-sandbox']
    });
    
    this.page = await this.browser.newPage();
  }

  async testForumIndex() {
    console.log('📋 Testing Forum Index Visual Elements...');
    
    await this.page.goto(`${this.baseUrl}/forum`, { waitUntil: 'networkidle0' });
    
    // Take full page screenshot
    await this.page.screenshot({
      path: path.join(this.screenshotDir, 'forum-index.png'),
      fullPage: true
    });
    
    // Test individual post cards
    const posts = await this.page.$$('.post-item, .forum-post, [data-post-id]');
    
    for (let i = 0; i < Math.min(posts.length, 5); i++) {
      const post = posts[i];
      
      // Scroll to post
      await post.scrollIntoView();
      
      // Take screenshot of individual post
      await post.screenshot({
        path: path.join(this.screenshotDir, `post-card-${i + 1}.png`)
      });
      
      // Check visual elements
      const hasAvatar = await post.$('.avatar, .user-avatar, .fa-user') !== null;
      const hasTitle = await post.$('.post-title, h3, h4') !== null;
      const hasAuthor = await post.$('.author, .post-author') !== null;
      const hasCategory = await post.$('.category, .post-category') !== null;
      
      this.results.push({
        type: 'post-card',
        index: i + 1,
        hasAvatar,
        hasTitle,
        hasAuthor,
        hasCategory,
        screenshot: `post-card-${i + 1}.png`
      });
    }
    
    console.log(`✅ Captured ${posts.length} post cards`);
  }

  async testPostPages() {
    console.log('📄 Testing Individual Post Pages...');
    
    // Get post links
    await this.page.goto(`${this.baseUrl}/forum`, { waitUntil: 'networkidle0' });
    
    const postLinks = await this.page.$$eval('a[href*="/forum/post/"]', links => 
      links.slice(0, 3).map(link => link.href)
    );
    
    for (let i = 0; i < postLinks.length; i++) {
      const postUrl = postLinks[i];
      console.log(`   Testing post ${i + 1}: ${postUrl}`);
      
      try {
        await this.page.goto(postUrl, { waitUntil: 'networkidle0', timeout: 10000 });
        
        // Take full page screenshot
        await this.page.screenshot({
          path: path.join(this.screenshotDir, `post-page-${i + 1}.png`),
          fullPage: true
        });
        
        // Test specific elements
        const elements = {
          title: await this.page.$('h1, .post-title') !== null,
          content: await this.page.$('.post-content, .post-body') !== null,
          author: await this.page.$('.post-author, .author-name') !== null,
          avatar: await this.page.$('.avatar, .user-avatar, .fa-user') !== null,
          timestamp: await this.page.$('.timestamp, .post-date') !== null,
          category: await this.page.$('.category, .post-category') !== null,
          repliesSection: await this.page.$('.replies, #replies') !== null
        };
        
        // Test reply form
        const replyForm = await this.page.$('form, .reply-form, #reply-form') !== null;
        
        this.results.push({
          type: 'post-page',
          url: postUrl,
          elements,
          hasReplyForm: replyForm,
          screenshot: `post-page-${i + 1}.png`
        });
        
      } catch (error) {
        console.log(`   ❌ Failed to test ${postUrl}: ${error.message}`);
        this.results.push({
          type: 'post-page',
          url: postUrl,
          error: error.message
        });
      }
    }
  }

  async testResponsiveViews() {
    console.log('📱 Testing Responsive Views...');
    
    const viewports = [
      { width: 375, height: 667, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1200, height: 800, name: 'desktop' }
    ];
    
    for (const viewport of viewports) {
      await this.page.setViewport(viewport);
      await this.page.goto(`${this.baseUrl}/forum`, { waitUntil: 'networkidle0' });
      
      await this.page.screenshot({
        path: path.join(this.screenshotDir, `forum-${viewport.name}.png`),
        fullPage: true
      });
      
      console.log(`   📸 Captured ${viewport.name} view`);
    }
  }

  async testIconsAndAssets() {
    console.log('🎨 Testing Icons and Assets...');
    
    await this.page.goto(`${this.baseUrl}/forum`, { waitUntil: 'networkidle0' });
    
    // Check for broken images
    const images = await this.page.$$eval('img', imgs => 
      imgs.map(img => ({
        src: img.src,
        alt: img.alt,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight
      }))
    );
    
    const brokenImages = images.filter(img => img.naturalWidth === 0);
    
    // Check for FontAwesome icons
    const faIcons = await this.page.$$('.fa, [class*="fa-"]');
    
    // Check CSS loading
    const stylesheets = await this.page.$$eval('link[rel="stylesheet"]', links =>
      links.map(link => link.href)
    );
    
    this.results.push({
      type: 'assets',
      totalImages: images.length,
      brokenImages: brokenImages.length,
      faIcons: faIcons.length,
      stylesheets: stylesheets.length,
      brokenImagesList: brokenImages
    });
    
    console.log(`   📊 Found ${images.length} images, ${brokenImages.length} broken`);
    console.log(`   🎯 Found ${faIcons.length} FontAwesome icons`);
  }

  async runVisualTests() {
    try {
      await this.initialize();
      
      await this.testForumIndex();
      await this.testPostPages();
      await this.testResponsiveViews();
      await this.testIconsAndAssets();
      
    } catch (error) {
      console.error('❌ Visual testing failed:', error);
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  generateVisualReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📸 FORUM VISUAL TEST REPORT');
    console.log('='.repeat(60));
    
    const postCards = this.results.filter(r => r.type === 'post-card');
    const postPages = this.results.filter(r => r.type === 'post-page');
    const assets = this.results.find(r => r.type === 'assets');
    
    console.log(`\n📋 POST CARDS (${postCards.length}):`);
    postCards.forEach(card => {
      const elements = [
        card.hasAvatar ? '✅ Avatar' : '❌ Avatar',
        card.hasTitle ? '✅ Title' : '❌ Title',
        card.hasAuthor ? '✅ Author' : '❌ Author',
        card.hasCategory ? '✅ Category' : '❌ Category'
      ];
      console.log(`   Card ${card.index}: ${elements.join(', ')}`);
    });
    
    console.log(`\n📄 POST PAGES (${postPages.length}):`);
    postPages.forEach((page, i) => {
      if (page.error) {
        console.log(`   Page ${i + 1}: ❌ ${page.error}`);
      } else {
        const elementCount = Object.values(page.elements).filter(Boolean).length;
        console.log(`   Page ${i + 1}: ${elementCount}/7 elements present, Reply form: ${page.hasReplyForm ? '✅' : '❌'}`);
      }
    });
    
    if (assets) {
      console.log(`\n🎨 ASSETS & ICONS:`);
      console.log(`   Images: ${assets.totalImages} total, ${assets.brokenImages} broken`);
      console.log(`   FontAwesome Icons: ${assets.faIcons}`);
      console.log(`   Stylesheets: ${assets.stylesheets}`);
      
      if (assets.brokenImages > 0) {
        console.log(`   ❌ Broken Images:`);
        assets.brokenImagesList.forEach(img => {
          console.log(`      ${img.src} (alt: "${img.alt}")`);
        });
      }
    }
    
    console.log(`\n📸 Screenshots saved to: ${this.screenshotDir}`);
    
    const success = postCards.length > 0 && postPages.length > 0 && (!assets || assets.brokenImages === 0);
    console.log(`\n🎯 VISUAL TEST STATUS: ${success ? '✅ PASSED' : '⚠️ NEEDS REVIEW'}`);
    
    return success;
  }
}

// Run if called directly
if (require.main === module) {
  const tester = new ForumVisualTester();
  
  tester.runVisualTests()
    .then(() => {
      const success = tester.generateVisualReport();
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Visual testing failed:', error);
      process.exit(1);
    });
}

module.exports = ForumVisualTester;