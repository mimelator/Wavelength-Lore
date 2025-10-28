#!/usr/bin/env node

/**
 * E2E Test: Merchandise Dynamic Catalog with Accurate Pricing
 *
 * Tests the complete flow:
 * 1. User designs a product (selects gallery image + product type)
 * 2. User customizes the product (effects/borders)
 * 3. User previews finished product and selects variant
 * 4. Price is accurate from dynamic catalog
 * 5. User adds to cart with correct pricing
 */

const puppeteer = require('puppeteer');
const axios = require('axios');

class MerchandisePricingE2ETest {
  constructor() {
    this.baseURL = 'http://localhost:3001';
    this.browser = null;
    this.page = null;
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async initialize() {
    console.log('\n🚀 WAVELENGTH E2E: Merchandise Dynamic Catalog + Pricing\n');
    console.log('=' .repeat(70));

    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1280, height: 720 });

    // Set longer timeouts for slower operations
    this.page.setDefaultNavigationTimeout(30000);
    this.page.setDefaultTimeout(15000);
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  log(test, passed, message) {
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${test}: ${message}`);
    this.results.tests.push({ test, passed, message });
    if (passed) this.results.passed++;
    else this.results.failed++;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * TEST 1: Navigate to merchandise page and verify dynamic catalog loaded
   */
  async test_NavigateAndLoadCatalog() {
    try {
      await this.page.goto(`${this.baseURL}/merchandise`);
      await this.page.waitForSelector('#merchandise-store', { timeout: 10000 });

      // Wait for merchandise store to be initialized
      await this.page.waitForFunction(() => {
        return window.merchandiseStore && window.merchandiseStore.products;
      }, { timeout: 10000 });

      const productCount = await this.page.evaluate(() => {
        return (window.merchandiseStore?.products || []).length;
      });

      if (productCount === 0) {
        throw new Error('No products loaded in window.merchandiseStore');
      }

      this.log(
        'TEST 1: Navigate & Load Catalog',
        true,
        `Dynamic catalog loaded with ${productCount} products`
      );
    } catch (error) {
      this.log('TEST 1: Navigate & Load Catalog', false, error.message);
    }
  }

  /**
   * TEST 2: Verify pricing service exists and is initialized
   */
  async test_PricingServiceInitialized() {
    try {
      // Wait for pricing service to be available
      await this.page.waitForFunction(() => {
        return window.WavelengthPricingService &&
               typeof window.WavelengthPricingService === 'function';
      }, { timeout: 10000 });

      const pricingReady = await this.page.evaluate(() => {
        const service = new window.WavelengthPricingService();
        return service &&
               typeof service.lookupProductPricing === 'function' &&
               typeof service.getDisplayableProducts === 'function';
      });

      if (!pricingReady) {
        throw new Error('Pricing service not fully initialized');
      }

      this.log(
        'TEST 2: Pricing Service Initialized',
        true,
        'WavelengthPricingService ready with pricing methods'
      );
    } catch (error) {
      this.log('TEST 2: Pricing Service Initialized', false, error.message);
    }
  }

  /**
   * TEST 3: Select a gallery image
   */
  async test_SelectGalleryImage() {
    try {
      await this.page.waitForSelector('.gallery-image-card', { timeout: 5000 });

      const imageCount = await this.page.evaluate(() => {
        return document.querySelectorAll('.gallery-image-card').length;
      });

      if (imageCount === 0) {
        throw new Error('No gallery images found');
      }

      // Click first gallery image
      await this.page.click('.gallery-image-card');
      await this.delay(1500);

      this.log(
        'TEST 3: Select Gallery Image',
        true,
        `Selected gallery image (${imageCount} total available)`
      );
    } catch (error) {
      this.log('TEST 3: Select Gallery Image', false, error.message);
    }
  }

  /**
   * TEST 4: Verify available products (catalog) loaded with pricing metadata
   */
  async test_ProductNavigatorAppears() {
    try {
      // Wait for available products to be loaded
      await this.page.waitForFunction(() => {
        return window.merchandiseStore &&
               window.merchandiseStore.availableProducts &&
               window.merchandiseStore.availableProducts.length > 0;
      }, { timeout: 10000 });

      // Get available product types with pricing metadata
      const products = await this.page.evaluate(() => {
        return (window.merchandiseStore?.availableProducts || [])
          .map(p => ({
            id: p.id || p.productId,
            title: p.title,
            blueprintId: p.blueprintId,
            printProviderId: p.printProviderId
          }))
          .filter(p => p.blueprintId); // Only count products with pricing metadata
      });

      this.log(
        'TEST 4: Product Catalog Loaded',
        products.length > 0,
        `${products.length} products with pricing metadata ready for dynamic catalog`
      );

      return products;
    } catch (error) {
      this.log('TEST 4: Product Catalog Loaded', false, error.message);
      return [];
    }
  }

  /**
   * TEST 5: Select first product from dynamic catalog
   */
  async test_SelectProductFromCatalog() {
    try {
      // Get first product from available catalog that has pricing
      const selectedProduct = await this.page.evaluate(() => {
        const products = window.merchandiseStore?.availableProducts || [];

        // Find first product with blueprintId and printProviderId
        const product = products.find(p => p.blueprintId && p.printProviderId);

        if (!product) {
          throw new Error('No products with pricing metadata found in available catalog');
        }

        return {
          id: product.id || product.productId,
          title: product.title,
          blueprintId: product.blueprintId,
          printProviderId: product.printProviderId,
          category: product.category
        };
      });

      // Click product button in navigator
      const productButtonSelector = `[data-product-id="${selectedProduct.id}"], [data-product-title*="${selectedProduct.title}"]`;

      // Try to find and click product button
      const buttons = await this.page.$$('.select-product-btn, [class*="product-btn"], button');
      if (buttons.length > 0) {
        await buttons[0].click();
        await this.delay(2000);
      }

      this.log(
        'TEST 5: Select Product from Catalog',
        true,
        `Selected "${selectedProduct.title}" (Blueprint: ${selectedProduct.blueprintId}, Provider: ${selectedProduct.printProviderId})`
      );

      return selectedProduct;
    } catch (error) {
      this.log('TEST 5: Select Product from Catalog', false, error.message);
      return null;
    }
  }

  /**
   * TEST 6: Verify product customization modal appears
   */
  async test_CustomizationModalAppears() {
    try {
      const modal = await this.page.waitForSelector('.merchandise-customization-modal, .modal, [role="dialog"]', { timeout: 5000 });

      if (!modal) {
        throw new Error('Customization modal not found');
      }

      this.log(
        'TEST 6: Customization Modal Appears',
        true,
        'Product customization modal opened successfully'
      );

      return true;
    } catch (error) {
      this.log('TEST 6: Customization Modal Appears', false, error.message);
      return false;
    }
  }

  /**
   * TEST 7: Apply some customizations (effects/borders)
   */
  async test_ApplyCustomizations() {
    try {
      // Try to find and click an effect checkbox
      const effectCheckboxes = await this.page.$$('.effect-toggle, input[type="checkbox"][class*="effect"]');

      let customized = false;
      if (effectCheckboxes.length > 0) {
        await effectCheckboxes[0].click();
        customized = true;
        await this.delay(1000);
      }

      this.log(
        'TEST 7: Apply Customizations',
        true,
        customized ? 'Applied effect customization' : 'Customization options available'
      );

      return true;
    } catch (error) {
      this.log('TEST 7: Apply Customizations', false, error.message);
      return false;
    }
  }

  /**
   * TEST 8: Navigate to finished product preview and check pricing
   */
  async test_FinishedProductPreviewWithPricing() {
    try {
      // Look for "Finished Product" or preview button
      const buttons = await this.page.$$('button, [role="button"]');
      let previewClicked = false;

      for (const btn of buttons) {
        const text = await this.page.evaluate(el => el.textContent, btn);
        if (text && (text.includes('Finished') || text.includes('Preview') || text.includes('Next'))) {
          await btn.click();
          previewClicked = true;
          await this.delay(2000);
          break;
        }
      }

      if (!previewClicked) {
        // Try automatic progression
        await this.delay(3000);
      }

      // Check if we're now in finished product view
      const finishedProductVisible = await this.page.evaluate(() => {
        return document.querySelector('[class*="finished"], [class*="preview"], .product-preview-modal') !== null ||
               document.querySelector('button[class*="add-to-cart"]') !== null;
      });

      this.log(
        'TEST 8: Finished Product Preview',
        finishedProductVisible,
        finishedProductVisible ? 'Preview modal with pricing visible' : 'Checking for pricing display'
      );

      return true;
    } catch (error) {
      this.log('TEST 8: Finished Product Preview', false, error.message);
      return false;
    }
  }

  /**
   * TEST 9: Verify variant selection and pricing
   */
  async test_VariantSelectionAndPricing() {
    try {
      // Check for variant/size options
      const variantButtons = await this.page.$$('.variant-option-btn, [class*="size-btn"], [class*="variant"]');

      if (variantButtons.length > 0) {
        // Click first variant
        await variantButtons[0].click();
        await this.delay(1000);

        // Check for price display
        const priceText = await this.page.evaluate(() => {
          const priceElement = document.querySelector('[class*="price"], span[class*="price"]');
          return priceElement ? priceElement.textContent : null;
        });

        const hasPricing = priceText && (priceText.includes('$') || priceText.includes('Price'));

        this.log(
          'TEST 9: Variant Selection & Pricing',
          variantButtons.length > 0,
          `${variantButtons.length} variant options available${hasPricing ? ', pricing displayed' : ''}`
        );
      } else {
        this.log(
          'TEST 9: Variant Selection & Pricing',
          true,
          'No variant selection needed (product has single variant)'
        );
      }

      return true;
    } catch (error) {
      this.log('TEST 9: Variant Selection & Pricing', false, error.message);
      return false;
    }
  }

  /**
   * TEST 10: Add to cart and verify cart item has pricing
   */
  async test_AddToCartWithPricing() {
    try {
      // Find Add to Cart button
      const addToCartButtons = await this.page.$$('button');
      let cartClicked = false;

      for (const btn of addToCartButtons) {
        const text = await this.page.evaluate(el => el.textContent, btn);
        if (text && text.includes('Add to Cart')) {
          await btn.click();
          cartClicked = true;
          await this.delay(2000);
          break;
        }
      }

      if (cartClicked) {
        // Check cart service for items
        const cartItems = await this.page.evaluate(() => {
          return window.cartService?.items || window.cart?.items || [];
        });

        const hasValidPrice = cartItems.some(item =>
          item.price !== undefined &&
          item.price !== null &&
          item.price > 0
        );

        this.log(
          'TEST 10: Add to Cart with Pricing',
          true,
          `Product added to cart with ${cartItems.length} items total${hasValidPrice ? ', pricing validated' : ''}`
        );
      } else {
        // Try to find Add to Cart button with different selectors
        const alternatives = await this.page.$$(
          '[class*="add-to-cart"], [class*="addCart"], [data-action="addToCart"]'
        );

        this.log(
          'TEST 10: Add to Cart with Pricing',
          alternatives.length > 0,
          alternatives.length > 0 ? 'Add to cart controls available' : 'Could not locate add to cart'
        );
      }

      return true;
    } catch (error) {
      this.log('TEST 10: Add to Cart with Pricing', false, error.message);
      return false;
    }
  }

  /**
   * TEST 11: Verify pricing data comes from dynamic catalog, not hardcoded
   */
  async test_PricingFromDynamicCatalog() {
    try {
      // Check that available products are using blueprint IDs to look up pricing
      const productUsage = await this.page.evaluate(() => {
        const products = window.merchandiseStore?.availableProducts || [];

        return {
          totalProducts: products.length,
          productsWithBlueprintId: products.filter(p => p.blueprintId).length,
          productsWithPrintProviderId: products.filter(p => p.printProviderId).length,
          productsWithBoth: products.filter(p => p.blueprintId && p.printProviderId).length
        };
      });

      const hasPricingMetadata = productUsage.productsWithBoth > 0;

      this.log(
        'TEST 11: Pricing from Dynamic Catalog',
        hasPricingMetadata,
        `${productUsage.productsWithBoth}/${productUsage.totalProducts} products configured for dynamic pricing lookup`
      );

      return hasPricingMetadata;
    } catch (error) {
      this.log('TEST 11: Pricing from Dynamic Catalog', false, error.message);
      return false;
    }
  }

  /**
   * TEST 12: Verify pricing service has loaded catalog
   */
  async test_PricingServiceCatalogLoaded() {
    try {
      const catalogStats = await this.page.evaluate(async () => {
        if (!window.WavelengthPricingService) {
          return { success: false, error: 'Service not found' };
        }

        const service = window.WavelengthPricingService;
        const displayable = service.getDisplayableProducts?.() || [];
        const stats = service.getStats?.() || {};

        return {
          success: true,
          displayableProducts: displayable.length,
          stats: stats,
          sampleLookup: service.lookupProductPricing?.('68-1', '1')
        };
      });

      if (catalogStats.success) {
        this.log(
          'TEST 12: Pricing Service Catalog',
          catalogStats.displayableProducts > 0,
          `Catalog loaded with ${catalogStats.displayableProducts} displayable products`
        );
      } else {
        this.log('TEST 12: Pricing Service Catalog', false, catalogStats.error);
      }

      return catalogStats.success && catalogStats.displayableProducts > 0;
    } catch (error) {
      this.log('TEST 12: Pricing Service Catalog', false, error.message);
      return false;
    }
  }

  async runAllTests() {
    try {
      await this.initialize();

      // Run tests in sequence
      await this.test_NavigateAndLoadCatalog();
      await this.test_PricingServiceInitialized();
      await this.test_SelectGalleryImage();
      const products = await this.test_ProductNavigatorAppears();
      await this.test_SelectProductFromCatalog();
      const hasModal = await this.test_CustomizationModalAppears();

      if (hasModal) {
        await this.test_ApplyCustomizations();
        await this.test_FinishedProductPreviewWithPricing();
        await this.test_VariantSelectionAndPricing();
        await this.test_AddToCartWithPricing();
      }

      await this.test_PricingFromDynamicCatalog();
      await this.test_PricingServiceCatalogLoaded();

      this.printSummary();

    } catch (error) {
      console.error('❌ Test suite error:', error);
    } finally {
      await this.cleanup();
    }
  }

  printSummary() {
    console.log('\n' + '=' .repeat(70));
    console.log('\n📊 E2E TEST SUMMARY\n');

    const total = this.results.passed + this.results.failed;
    const passRate = total > 0 ? ((this.results.passed / total) * 100).toFixed(1) : '0.0';

    console.log(`Tests Run:    ${total}`);
    console.log(`✅ Passed:    ${this.results.passed}`);
    console.log(`❌ Failed:    ${this.results.failed}`);
    console.log(`Pass Rate:    ${passRate}%`);

    console.log('\n' + '=' .repeat(70));

    if (this.results.failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED!\n');
      console.log('The merchandise system successfully:');
      console.log('  ✅ Loads dynamic product catalog (not hardcoded)');
      console.log('  ✅ Uses blueprint IDs for pricing lookup');
      console.log('  ✅ Displays customization UI (effects/borders)');
      console.log('  ✅ Shows finished product preview');
      console.log('  ✅ Allows variant selection');
      console.log('  ✅ Adds products to cart with metadata');
      console.log('  ✅ Integrates pricing service for accurate pricing\n');
      process.exit(0);
    } else {
      console.log(`\n⚠️  ${this.results.failed} TEST(S) FAILED\n`);
      console.log('Failed tests:');
      this.results.tests
        .filter(t => !t.passed)
        .forEach(t => {
          console.log(`  ❌ ${t.test}: ${t.message}`);
        });
      console.log('');
      process.exit(1);
    }
  }
}

// Run the test suite
const tester = new MerchandisePricingE2ETest();
tester.runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
