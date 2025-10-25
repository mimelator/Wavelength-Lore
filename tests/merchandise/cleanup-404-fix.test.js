/**
 * Product Cleanup 404 Fix Test
 * 
 * Tests that 404 errors during product cleanup are handled gracefully
 */

const puppeteer = require('puppeteer');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class Cleanup404FixTest {
  constructor() {
    this.browser = null;
    this.page = null;
    this.consoleMessages = [];
    this.networkErrors = [];
  }

  async setup() {
    console.log('🚀 Setting up Cleanup 404 Fix Test');
    
    this.browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      slowMo: 50
    });
    
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1920, height: 1080 });
    
    // Monitor all console messages
    this.page.on('console', msg => {
      const text = msg.text();
      this.consoleMessages.push({ type: msg.type(), text });
      
      if (text.includes('🧹') || text.includes('🗑️') || text.includes('⚠️') || text.includes('Product') || text.includes('already deleted')) {
        console.log(`📱 Console [${msg.type()}]: ${text}`);
      }
    });
    
    // Monitor network responses
    this.page.on('response', response => {
      if (response.url().includes('/api/merchandise/products/') && response.status() >= 400) {
        const error = `${response.status()} ${response.url()}`;
        this.networkErrors.push(error);
        console.log(`🌐 Network: ${error}`);
      }
    });
  }

  async testCleanup404Handling() {
    console.log('\n🎯 Test: Product Cleanup 404 Error Handling');
    console.log('=' .repeat(60));
    
    try {
      // Navigate to merchandise store to trigger cleanup
      console.log('🛍️ Navigating to merchandise store...');
      await this.page.goto(`${BASE_URL}/merchandise?v=${Date.now()}`, { waitUntil: 'networkidle2' });
      
      // Wait for cleanup to complete
      console.log('⏳ Waiting for cleanup to complete...');
      await wait(5000);
      
      // Analyze console messages for error handling
      const cleanupMessages = this.consoleMessages.filter(msg => 
        msg.text.includes('🧹') || 
        msg.text.includes('🗑️') || 
        msg.text.includes('⚠️') ||
        msg.text.includes('already deleted') ||
        msg.text.includes('doesn\'t exist')
      );
      
      console.log(`\n📊 Cleanup Analysis:`);
      console.log(`   Total cleanup messages: ${cleanupMessages.length}`);
      console.log(`   Network 404 errors: ${this.networkErrors.length}`);
      
      // Check for improved error handling
      const improvedErrorHandling = this.consoleMessages.some(msg => 
        msg.text.includes('already deleted') || 
        msg.text.includes('doesn\'t exist') ||
        (msg.text.includes('⚠️') && msg.text.includes('Product'))
      );
      
      // Check for console errors (should be reduced)
      const consoleErrors = this.consoleMessages.filter(msg => msg.type === 'error');
      const networkRelatedErrors = consoleErrors.filter(msg => 
        msg.text.includes('Failed to load resource') && 
        msg.text.includes('404')
      );
      
      console.log(`\n📋 Error Analysis:`);
      console.log(`   Console errors: ${consoleErrors.length}`);
      console.log(`   Network-related errors: ${networkRelatedErrors.length}`);
      console.log(`   Improved error handling: ${improvedErrorHandling ? '✅ YES' : '❌ NO'}`);
      
      if (cleanupMessages.length > 0) {
        console.log(`\n📝 Cleanup Messages:`);
        cleanupMessages.forEach(msg => {
          console.log(`   [${msg.type}] ${msg.text}`);
        });
      }
      
      return {
        success: improvedErrorHandling || networkRelatedErrors.length === 0,
        cleanupMessages: cleanupMessages.length,
        networkErrors: this.networkErrors.length,
        consoleErrors: consoleErrors.length,
        improvedErrorHandling
      };
      
    } catch (error) {
      console.error('❌ Test failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async runTest() {
    try {
      await this.setup();
      
      console.log('🧪 Starting Cleanup 404 Fix Test');
      console.log('=' .repeat(50));
      
      const result = await this.testCleanup404Handling();
      
      // Generate report
      console.log('\n📊 CLEANUP 404 FIX TEST REPORT');
      console.log('=' .repeat(50));
      
      console.log(`🎯 Test Result: ${result.success ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`📊 Cleanup Messages: ${result.cleanupMessages}`);
      console.log(`🌐 Network 404s: ${result.networkErrors}`);
      console.log(`❌ Console Errors: ${result.consoleErrors}`);
      console.log(`🔧 Improved Handling: ${result.improvedErrorHandling ? '✅ YES' : '❌ NO'}`);
      
      if (result.success) {
        console.log('\n✅ Fix is working! 404 errors are being handled gracefully.');
      } else {
        console.log('\n❌ Fix needs more work. 404 errors still causing issues.');
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ Test execution failed:', error);
      throw error;
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}

// Run the test if called directly
if (require.main === module) {
  const test = new Cleanup404FixTest();
  test.runTest().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = Cleanup404FixTest;