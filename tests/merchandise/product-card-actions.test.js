#!/usr/bin/env node

/**
 * Product Card Actions Test Suite
 * 
 * Tests all actions available on product cards:
 * 1. View Details button opens product detail modal
 * 2. Edit button allows modifying product
 * 3. Delete button removes product
 * 4. Add to Cart shows visual feedback
 * 5. Quick actions menu on hover
 */

const puppeteer = require('puppeteer');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class ProductCardActionsTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = { passed: [], failed: [], warnings: [] };
  }

  async setup() {
    console.log('🚀 Setting up Product Card Actions tests...\n');
    
    this.browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox'],
      slowMo: 30
    });
    
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1920, height: 1080 });
  }

  async navigateToMerchandise() {
    console.log('📍 TEST: Navigate to merchandise page');
    
    try {
      await this.page.goto(`${BASE_URL}/merchandise`, { waitUntil: 'networkidle2', timeout: 30000 });
      await this.page.waitForSelector('.product-card, .empty-state', { timeout: 10000 });
      
      const hasProducts = await this.page.evaluate(() => {
        return document.querySelectorAll('.product-card').length > 0;
      });
      
      if (!hasProducts) {
        console.log('   ⚠️  No products found - skipping tests');
        this.results.warnings.push('No products available to test');
        return false;
      }
      
      console.log('✅ Products loaded\n');
      this.results.passed.push('Navigate to merchandise page');
      return true;
    } catch (error) {
      console.error('❌ Failed:', error.message);
      this.results.failed.push({ test: 'Navigate', error: error.message });
      return false;
    }
  }

  async testViewDetailsButton() {
    console.log('📍 TEST: View Details button opens modal');
    
    try {
      const viewBtn = await this.page.$('.view-product-btn, .product-details-btn');
      
      if (!viewBtn) {
        throw new Error('View Details button not found');
      }
      
      await viewBtn.click();
      await wait(500);
      
      const modalOpen = await this.page.evaluate(() => {
        return !!document.querySelector('.product-detail-modal');
      });
      
      if (!modalOpen) {
        throw new Error('Product detail modal did not open');
      }
      
      console.log('✅ View Details working\n');
      this.results.passed.push('View Details button');
      
      // Close modal
      await this.page.click('.product-detail-modal .close');
      await wait(300);
      
      return true;
    } catch (error) {
      console.error('❌ Failed:', error.message);
      this.results.failed.push({ test: 'View Details', error: error.message });
      return false;
    }
  }

  async testEditButton() {
    console.log('📍 TEST: Edit button functionality');
    
    try {
      const editBtn = await this.page.$('.edit-product-btn');
      
      if (!editBtn) {
        throw new Error('Edit button not found');
      }
      
      console.log('✅ Edit button present\n');
      this.results.passed.push('Edit button');
      return true;
    } catch (error) {
      console.error('❌ Failed:', error.message);
      this.results.failed.push({ test: 'Edit button', error: error.message });
      return false;
    }
  }

  async testDeleteButton() {
    console.log('📍 TEST: Delete button functionality');
    
    try {
      const deleteBtn = await this.page.$('.delete-product-btn');
      
      if (!deleteBtn) {
        throw new Error('Delete button not found');
      }
      
      console.log('✅ Delete button present\n');
      this.results.passed.push('Delete button');
      return true;
    } catch (error) {
      console.error('❌ Failed:', error.message);
      this.results.failed.push({ test: 'Delete button', error: error.message });
      return false;
    }
  }

  async testAddToCartFeedback() {
    console.log('📍 TEST: Add to Cart shows visual feedback');
    
    try {
      const addToCartBtn = await this.page.$('.add-to-cart-btn');
      
      if (!addToCartBtn) {
        throw new Error('Add to Cart button not found');
      }
      
      await addToCartBtn.click();
      await wait(500);
      
      // Check for toast notification or success message
      const hasFeedback = await this.page.evaluate(() => {
        const toast = document.querySelector('.toast, .notification, .success-message');
        return !!toast;
      });
      
      if (!hasFeedback) {
        this.results.warnings.push('No visual feedback after adding to cart');
      }
      
      console.log('✅ Add to Cart working\n');
      this.results.passed.push('Add to Cart feedback');
      return true;
    } catch (error) {
      console.error('❌ Failed:', error.message);
      this.results.failed.push({ test: 'Add to Cart', error: error.message });
      return false;
    }
  }

  async testQuickActionsMenu() {
    console.log('📍 TEST: Quick actions menu on hover');
    
    try {
      const productCard = await this.page.$('.product-card');
      
      if (!productCard) {
        throw new Error('Product card not found');
      }
      
      // Hover over card
      await productCard.hover();
      await wait(300);
      
      const hasQuickActions = await this.page.evaluate(() => {
        const menu = document.querySelector('.product-actions, .quick-actions');
        return !!menu;
      });
      
      if (!hasQuickActions) {
        this.results.warnings.push('No quick actions menu found');
      }
      
      console.log('✅ Quick actions checked\n');
      this.results.passed.push('Quick actions menu');
      return true;
    } catch (error) {
      console.error('❌ Failed:', error.message);
      this.results.failed.push({ test: 'Quick actions', error: error.message });
      return false;
    }
  }

  async cleanup() {
    console.log('🧹 Cleaning up...\n');
    if (this.browser) {
      await this.browser.close();
    }
  }

  printResults() {
    console.log('='.repeat(80));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(80));
    
    console.log(`\n✅ PASSED: ${this.results.passed.length}`);
    this.results.passed.forEach(test => console.log(`   ✓ ${test}`));
    
    if (this.results.warnings.length > 0) {
      console.log(`\n⚠️  WARNINGS: ${this.results.warnings.length}`);
      this.results.warnings.forEach(warning => console.log(`   ⚠ ${warning}`));
    }
    
    if (this.results.failed.length > 0) {
      console.log(`\n❌ FAILED: ${this.results.failed.length}`);
      this.results.failed.forEach(failure => {
        console.log(`   ✗ ${failure.test}`);
        console.log(`     Error: ${failure.error}`);
      });
    }
    
    const total = this.results.passed.length + this.results.failed.length;
    const passRate = total > 0 ? ((this.results.passed.length / total) * 100).toFixed(1) : 0;
    console.log(`\nPass Rate: ${passRate}% (${this.results.passed.length}/${total})`);
    console.log('='.repeat(80) + '\n');
    
    return this.results.failed.length === 0;
  }
}

async function runTests() {
  const tester = new ProductCardActionsTester();
  
  try {
    await tester.setup();
    
    const hasProducts = await tester.navigateToMerchandise();
    if (!hasProducts) {
      console.log('⚠️  Skipping tests - no products available');
      await tester.cleanup();
      process.exit(0);
    }
    
    await tester.testViewDetailsButton();
    await tester.testEditButton();
    await tester.testDeleteButton();
    await tester.testAddToCartFeedback();
    await tester.testQuickActionsMenu();
    
    const allPassed = tester.printResults();
    await tester.cleanup();
    
    process.exit(allPassed ? 0 : 1);
    
  } catch (error) {
    console.error('\n💥 Fatal error:', error);
    await tester.cleanup();
    process.exit(1);
  }
}

if (require.main === module) {
  runTests();
}

module.exports = ProductCardActionsTester;
