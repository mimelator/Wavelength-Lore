#!/usr/bin/env node
/**
 * Product Title Generation Integration Test
 * 
 * Verifies that product titles are automatically generated from image filenames
 * and combined with product types without requiring user input
 */

const { generateProductTitle, prettifyImageName } = require('../../utils/product-name-formatter');

class ProductTitleGenerationTest {
  constructor() {
    this.results = { passed: 0, failed: 0 };
  }

  test(name, fn) {
    try {
      fn();
      this.results.passed++;
      console.log(`✅ ${name}`);
    } catch (error) {
      this.results.failed++;
      console.log(`❌ ${name}`);
      console.log(`   ${error.message}`);
    }
  }

  runTests() {
    console.log('═══════════════════════════════════════');
    console.log('🎨 PRODUCT TITLE GENERATION TEST');
    console.log('═══════════════════════════════════════\n');

    // Test real-world scenarios
    this.test('Generates title for Daphne T-Shirt', () => {
      const title = generateProductTitle('daphne.webp', 'T-Shirt');
      if (title !== 'Daphne T-Shirt') {
        throw new Error(`Expected "Daphne T-Shirt", got "${title}"`);
      }
    });

    this.test('Generates title for Goblin King Mug', () => {
      const title = generateProductTitle('goblin-king.png', 'Mug');
      if (title !== 'Goblin King Mug') {
        throw new Error(`Expected "Goblin King Mug", got "${title}"`);
      }
    });

    this.test('Generates title for Ice Fortress Poster', () => {
      const title = generateProductTitle('ice_fortress.jpg', 'Poster');
      if (title !== 'Ice Fortress Poster') {
        throw new Error(`Expected "Ice Fortress Poster", got "${title}"`);
      }
    });

    this.test('Generates title for Battle Scene Canvas Print', () => {
      const title = generateProductTitle('battle-scene-for-product-previ.webp', 'Canvas Print');
      if (title !== 'Battle Scene For Product Previ Canvas Print') {
        throw new Error(`Expected "Battle Scene For Product Previ Canvas Print", got "${title}"`);
      }
    });

    this.test('Prettifies name for description', () => {
      const name = prettifyImageName('ice-blue_diamond.webp');
      if (name !== 'Ice Blue Diamond') {
        throw new Error(`Expected "Ice Blue Diamond", got "${name}"`);
      }
    });

    this.test('Handles complex filenames', () => {
      const title = generateProductTitle('lucky.the.leprechaun.webp', 'Hoodie');
      if (title !== 'Lucky The Leprechaun Hoodie') {
        throw new Error(`Expected "Lucky The Leprechaun Hoodie", got "${title}"`);
      }
    });

    this.test('Works with different product types', () => {
      const types = ['T-Shirt', 'Mug', 'Poster', 'Canvas Print', 'Hoodie', 'Phone Case'];
      const filename = 'jewel.webp';
      
      types.forEach(type => {
        const title = generateProductTitle(filename, type);
        const expected = `Jewel ${type}`;
        if (title !== expected) {
          throw new Error(`Expected "${expected}", got "${title}"`);
        }
      });
    });

    this.test('Removes user input requirement', () => {
      // This test verifies that we can generate titles without user input
      const filename = 'alexandria.png';
      const productType = 'T-Shirt';
      
      // No user-provided title or description needed
      const autoTitle = generateProductTitle(filename, productType);
      const autoDescription = `Premium custom t-shirt featuring "${prettifyImageName(filename)}" from your Wavelength Lore collection`;
      
      if (autoTitle !== 'Alexandria T-Shirt') {
        throw new Error(`Auto-generated title incorrect: ${autoTitle}`);
      }
      
      if (!autoDescription.includes('Alexandria')) {
        throw new Error(`Auto-generated description missing prettified name`);
      }
    });

    this.printResults();
  }

  printResults() {
    console.log('\n═══════════════════════════════════════');
    console.log('📊 TEST RESULTS');
    console.log('═══════════════════════════════════════\n');

    const total = this.results.passed + this.results.failed;
    const passRate = total > 0 ? ((this.results.passed / total) * 100).toFixed(1) : 0;

    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📈 Pass Rate: ${passRate}% (${this.results.passed}/${total})\n`);

    console.log('═══════════════════════════════════════\n');

    if (this.results.failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
}

if (require.main === module) {
  const test = new ProductTitleGenerationTest();
  test.runTests();
}

module.exports = ProductTitleGenerationTest;
