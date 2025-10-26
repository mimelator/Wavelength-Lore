#!/usr/bin/env node

/**
 * Forum Browser Validation Script
 * Tests forum posts in browser environment to validate content display
 */

const puppeteer = require('puppeteer');
const { getAdminDatabase } = require('../helpers/firebase-admin-utils');

class ForumBrowserValidator {
  constructor() {
    this.browser = null;
    this.page = null;
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://wavelengthlore.com' 
      : 'http://localhost:3001';
    this.results = {
      totalPosts: 0,
      validatedPosts: 0,
      errors: [],
      warnings: [],
      success: []
    };
  }

  async initialize() {
    console.log('🚀 Starting Forum Browser Validation...');
    
    this.browser = await puppeteer.launch({
      headless: false, // Show browser for debugging
      defaultViewport: { width: 1200, height: 800 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    
    // Enable console logging from browser
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        this.results.errors.push(`Browser Console Error: ${msg.text()}`);
      }
    });
  }

  async validateForumIndex() {
    console.log('📋 Validating Forum Index Page...');
    
    try {
      await this.page.goto(`${this.baseUrl}/forum`, { waitUntil: 'networkidle0' });
      
      // Check page title
      const title = await this.page.title();
      if (!title.includes('Forum')) {
        this.results.warnings.push('Forum page title may be incorrect');
      }
      
      // Check for forum posts
      const posts = await this.page.$$('.post-item, .forum-post, [data-post-id]');
      this.results.totalPosts = posts.length;
      
      console.log(`✅ Found ${posts.length} posts on forum index`);
      this.results.success.push(`Forum index loaded with ${posts.length} posts`);
      
      return posts.length > 0;
    } catch (error) {
      this.results.errors.push(`Forum index validation failed: ${error.message}`);
      return false;
    }
  }

  async getPostsFromDatabase() {
    console.log('🔍 Fetching posts from Firebase...');
    
    try {
      const db = getAdminDatabase();
      const snapshot = await db.ref('forum/posts').once('value');
      const posts = snapshot.val() || {};
      
      return Object.entries(posts).map(([id, post]) => ({
        id,
        ...post
      }));
    } catch (error) {
      this.results.errors.push(`Database fetch failed: ${error.message}`);
      return [];
    }
  }

  async validatePostPage(post) {
    console.log(`📄 Validating post: ${post.title}`);
    
    try {
      const postUrl = `${this.baseUrl}/forum/post/${post.id}`;
      await this.page.goto(postUrl, { waitUntil: 'networkidle0', timeout: 10000 });
      
      const validations = {
        title: false,
        content: false,
        author: false,
        timestamp: false,
        avatar: false,
        category: false,
        replies: false
      };
      
      // Validate title
      const titleElement = await this.page.$('h1, .post-title, [data-post-title]');
      if (titleElement) {
        const titleText = await titleElement.textContent();
        validations.title = titleText && titleText.trim().length > 0;
      }
      
      // Validate content
      const contentElement = await this.page.$('.post-content, .post-body, [data-post-content]');
      if (contentElement) {
        const contentText = await contentElement.textContent();
        validations.content = contentText && contentText.trim().length > 0;
      }
      
      // Validate author
      const authorElement = await this.page.$('.post-author, .author-name, [data-author]');
      if (authorElement) {
        const authorText = await authorElement.textContent();
        validations.author = authorText && authorText.trim().length > 0;
      }
      
      // Validate avatar (check for img or icon)
      const avatarElement = await this.page.$('.avatar, .user-avatar, .author-avatar img, .fa-user');
      validations.avatar = !!avatarElement;
      
      // Validate category
      const categoryElement = await this.page.$('.category, .post-category, [data-category]');
      if (categoryElement) {
        const categoryText = await categoryElement.textContent();
        validations.category = categoryText && categoryText.trim().length > 0;
      }
      
      // Validate timestamp
      const timestampElement = await this.page.$('.timestamp, .post-date, .created-at');
      if (timestampElement) {
        const timestampText = await timestampElement.textContent();
        validations.timestamp = timestampText && timestampText.trim().length > 0;
      }
      
      // Check for replies section
      const repliesSection = await this.page.$('.replies, .post-replies, #replies');
      validations.replies = !!repliesSection;
      
      // Count successful validations
      const successCount = Object.values(validations).filter(Boolean).length;
      const totalChecks = Object.keys(validations).length;
      
      if (successCount >= totalChecks * 0.7) { // 70% success rate
        this.results.validatedPosts++;
        this.results.success.push(`✅ Post "${post.title}" validated (${successCount}/${totalChecks} checks passed)`);
      } else {
        this.results.warnings.push(`⚠️ Post "${post.title}" has issues (${successCount}/${totalChecks} checks passed)`);
      }
      
      console.log(`   ${successCount}/${totalChecks} validations passed`);
      
      return validations;
      
    } catch (error) {
      this.results.errors.push(`Post validation failed for "${post.title}": ${error.message}`);
      return null;
    }
  }

  async validateForumNavigation() {
    console.log('🧭 Validating Forum Navigation...');
    
    try {
      await this.page.goto(`${this.baseUrl}/forum`, { waitUntil: 'networkidle0' });
      
      // Check navigation elements
      const navElements = await this.page.$$('nav a, .nav-link, .forum-nav a');
      const searchBox = await this.page.$('input[type="search"], .search-input, #search');
      const createButton = await this.page.$('.create-post, .new-post, [data-action="create"]');
      
      this.results.success.push(`Navigation: ${navElements.length} nav links found`);
      
      if (searchBox) {
        this.results.success.push('✅ Search functionality present');
      } else {
        this.results.warnings.push('⚠️ Search box not found');
      }
      
      if (createButton) {
        this.results.success.push('✅ Create post button present');
      } else {
        this.results.warnings.push('⚠️ Create post button not found');
      }
      
    } catch (error) {
      this.results.errors.push(`Navigation validation failed: ${error.message}`);
    }
  }

  async validateResponsiveDesign() {
    console.log('📱 Testing Responsive Design...');
    
    const viewports = [
      { width: 1200, height: 800, name: 'Desktop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];
    
    for (const viewport of viewports) {
      try {
        await this.page.setViewport(viewport);
        await this.page.goto(`${this.baseUrl}/forum`, { waitUntil: 'networkidle0' });
        
        // Check if content is visible
        const content = await this.page.$('.forum-content, .posts-container, main');
        if (content) {
          const isVisible = await content.isIntersectingViewport();
          if (isVisible) {
            this.results.success.push(`✅ ${viewport.name} layout working`);
          } else {
            this.results.warnings.push(`⚠️ ${viewport.name} layout may have issues`);
          }
        }
        
      } catch (error) {
        this.results.warnings.push(`${viewport.name} test failed: ${error.message}`);
      }
    }
    
    // Reset to desktop
    await this.page.setViewport({ width: 1200, height: 800 });
  }

  async runFullValidation() {
    try {
      await this.initialize();
      
      // Step 1: Validate forum index
      const indexValid = await this.validateForumIndex();
      if (!indexValid) {
        throw new Error('Forum index validation failed');
      }
      
      // Step 2: Get posts from database
      const posts = await this.getPostsFromDatabase();
      console.log(`📊 Found ${posts.length} posts in database`);
      
      // Step 3: Validate each post page
      for (const post of posts.slice(0, 10)) { // Limit to first 10 posts
        await this.validatePostPage(post);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait between requests
      }
      
      // Step 4: Validate navigation
      await this.validateForumNavigation();
      
      // Step 5: Test responsive design
      await this.validateResponsiveDesign();
      
    } catch (error) {
      this.results.errors.push(`Validation failed: ${error.message}`);
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 FORUM BROWSER VALIDATION REPORT');
    console.log('='.repeat(60));
    
    console.log(`\n✅ SUCCESS (${this.results.success.length}):`);
    this.results.success.forEach(msg => console.log(`   ${msg}`));
    
    if (this.results.warnings.length > 0) {
      console.log(`\n⚠️ WARNINGS (${this.results.warnings.length}):`);
      this.results.warnings.forEach(msg => console.log(`   ${msg}`));
    }
    
    if (this.results.errors.length > 0) {
      console.log(`\n❌ ERRORS (${this.results.errors.length}):`);
      this.results.errors.forEach(msg => console.log(`   ${msg}`));
    }
    
    console.log(`\n📈 SUMMARY:`);
    console.log(`   Total Posts Found: ${this.results.totalPosts}`);
    console.log(`   Posts Validated: ${this.results.validatedPosts}`);
    console.log(`   Success Rate: ${this.results.totalPosts > 0 ? Math.round((this.results.validatedPosts / this.results.totalPosts) * 100) : 0}%`);
    
    const overallSuccess = this.results.errors.length === 0 && this.results.validatedPosts > 0;
    console.log(`\n🎯 OVERALL STATUS: ${overallSuccess ? '✅ PASSED' : '❌ NEEDS ATTENTION'}`);
    
    return overallSuccess;
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new ForumBrowserValidator();
  
  validator.runFullValidation()
    .then(() => {
      const success = validator.generateReport();
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Validation failed:', error);
      process.exit(1);
    });
}

module.exports = ForumBrowserValidator;