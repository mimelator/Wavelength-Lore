#!/usr/bin/env node

/**
 * Enhanced Forum Post Content Test
 * Detects missing post content and takes screenshots
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class ForumPostContentTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.screenshotDir = path.join(__dirname, '../test-screenshots');
    this.results = [];
  }

  async initialize() {
    console.log('🔍 Starting Enhanced Forum Post Content Test...\n');
    
    await fs.mkdir(this.screenshotDir, { recursive: true });
    
    this.browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1200, height: 800 }
    });
    
    this.page = await this.browser.newPage();
  }

  async testSpecificPost(postId) {
    const postUrl = `http://localhost:3001/forum/post/${postId}`;
    console.log(`📄 Testing Post: ${postUrl}`);
    
    try {
      await this.page.goto(postUrl, { waitUntil: 'networkidle0', timeout: 10000 });
      
      // Take screenshot
      await this.page.screenshot({
        path: path.join(this.screenshotDir, `post-${postId}.png`),
        fullPage: true
      });
      
      // Check for post content elements
      const contentChecks = await this.page.evaluate(() => {
        return {
          hasTitle: !!document.querySelector('h1, .post-title, [data-post-title]'),
          hasContent: !!document.querySelector('.post-content, .post-body, [data-post-content]'),
          hasAuthor: !!document.querySelector('.post-author, .author-name, [data-post-author]'),
          hasTimestamp: !!document.querySelector('.timestamp, .post-date, [data-post-date]'),
          
          // Check if content is actually populated (not just empty elements)
          titleText: document.querySelector('h1, .post-title, [data-post-title]')?.textContent?.trim() || '',
          contentText: document.querySelector('.post-content, .post-body, [data-post-content]')?.textContent?.trim() || '',
          authorText: document.querySelector('.post-author, .author-name, [data-post-author]')?.textContent?.trim() || '',
          
          // Check for loading states
          hasLoadingSpinner: !!document.querySelector('.loading, .spinner, [data-loading]'),
          hasErrorMessage: !!document.querySelector('.error, .error-message, [data-error]'),
          
          // Get all text content for debugging
          bodyText: document.body.textContent?.trim() || '',
          
          // Check specific selectors that might be used
          postElements: {
            h1: document.querySelector('h1')?.textContent?.trim() || 'NOT FOUND',
            postTitle: document.querySelector('.post-title')?.textContent?.trim() || 'NOT FOUND',
            postContent: document.querySelector('.post-content')?.textContent?.trim() || 'NOT FOUND',
            postBody: document.querySelector('.post-body')?.textContent?.trim() || 'NOT FOUND'
          }
        };
      });
      
      // Analyze results
      const hasActualContent = contentChecks.titleText.length > 0 && contentChecks.contentText.length > 0;
      const isEmpty = contentChecks.titleText.length === 0 && contentChecks.contentText.length === 0;
      
      const result = {
        postId,
        url: postUrl,
        screenshot: `post-${postId}.png`,
        hasElements: contentChecks.hasTitle && contentChecks.hasContent,
        hasActualContent,
        isEmpty,
        contentChecks,
        status: hasActualContent ? 'SUCCESS' : (isEmpty ? 'EMPTY_CONTENT' : 'PARTIAL_CONTENT')
      };
      
      this.results.push(result);
      
      // Log detailed results
      console.log(`   📊 Elements Present: Title=${contentChecks.hasTitle}, Content=${contentChecks.hasContent}, Author=${contentChecks.hasAuthor}`);
      console.log(`   📝 Content Populated: Title="${contentChecks.titleText.substring(0, 50)}${contentChecks.titleText.length > 50 ? '...' : ''}"`);
      console.log(`   📄 Content Length: ${contentChecks.contentText.length} characters`);
      console.log(`   🎯 Status: ${result.status}`);
      
      if (result.status === 'EMPTY_CONTENT') {
        console.log(`   ❌ ISSUE DETECTED: Post page loads but content is empty!`);
        console.log(`   🔍 Debug Info:`);
        console.log(`      - H1 element: "${contentChecks.postElements.h1}"`);
        console.log(`      - Post title element: "${contentChecks.postElements.postTitle}"`);
        console.log(`      - Post content element: "${contentChecks.postElements.postContent}"`);
        console.log(`      - Post body element: "${contentChecks.postElements.postBody}"`);
      }
      
      return result;
      
    } catch (error) {
      console.log(`   ❌ Error testing post: ${error.message}`);
      const result = {
        postId,
        url: postUrl,
        error: error.message,
        status: 'ERROR'
      };
      this.results.push(result);
      return result;
    }
  }

  async runTests() {
    try {
      await this.initialize();
      
      // Test the specific problematic post
      console.log('🎯 Testing Specific Problematic Post:\n');
      await this.testSpecificPost('-OcTbtWHy2QvT9yGl89x');
      
      // Test a few other posts for comparison
      console.log('\n🔄 Testing Additional Posts for Comparison:\n');
      const otherPosts = ['-OcTbtaEggzkTFS5FnSZ', 'welcome-post', 'goblin_post_1761446701776'];
      
      for (const postId of otherPosts) {
        await this.testSpecificPost(postId);
        console.log(''); // Add spacing
      }
      
    } catch (error) {
      console.error('❌ Test failed:', error);
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 ENHANCED FORUM POST CONTENT TEST REPORT');
    console.log('='.repeat(60));
    
    const emptyPosts = this.results.filter(r => r.status === 'EMPTY_CONTENT');
    const successPosts = this.results.filter(r => r.status === 'SUCCESS');
    const errorPosts = this.results.filter(r => r.status === 'ERROR');
    
    console.log(`\n📈 SUMMARY:`);
    console.log(`   ✅ Posts with content: ${successPosts.length}`);
    console.log(`   ❌ Posts with empty content: ${emptyPosts.length}`);
    console.log(`   💥 Posts with errors: ${errorPosts.length}`);
    console.log(`   📊 Total tested: ${this.results.length}`);
    
    if (emptyPosts.length > 0) {
      console.log(`\n🚨 EMPTY CONTENT DETECTED:`);
      emptyPosts.forEach(post => {
        console.log(`   📄 ${post.postId}: ${post.url}`);
        console.log(`      Screenshot: ${post.screenshot}`);
      });
    }
    
    console.log(`\n📸 Screenshots saved to: ${this.screenshotDir}`);
    
    const hasIssues = emptyPosts.length > 0 || errorPosts.length > 0;
    console.log(`\n🎯 OVERALL STATUS: ${hasIssues ? '❌ ISSUES DETECTED' : '✅ ALL POSTS WORKING'}`);
    
    return !hasIssues;
  }
}

// Run if called directly
if (require.main === module) {
  const tester = new ForumPostContentTester();
  
  tester.runTests()
    .then(() => {
      const success = tester.generateReport();
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = ForumPostContentTester;