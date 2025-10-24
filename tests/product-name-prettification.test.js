#!/usr/bin/env node
/**
 * Product Name Prettification Test
 * 
 * Tests the algorithm that converts image filenames into pretty product titles
 * Example: "daphne.webp" + "T-Shirt" → "Daphne T-Shirt"
 */

const assert = require('assert');

class ProductNamePrettificationTest {
  constructor() {
    this.results = { passed: 0, failed: 0, tests: [] };
  }

  test(name, fn) {
    try {
      fn();
      this.results.passed++;
      this.results.tests.push({ name, status: 'PASSED' });
      console.log(`✅ ${name}`);
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({ name, status: 'FAILED', error: error.message });
      console.log(`❌ ${name}`);
      console.log(`   ${error.message}`);
    }
  }

  prettifyImageName(filename) {
    // Remove file extension
    let name = filename.replace(/\.(webp|png|jpg|jpeg|gif)$/i, '');
    
    // Replace hyphens, underscores, and dots with spaces
    name = name.replace(/[-_.]/g, ' ');
    
    // Replace multiple spaces with single space
    name = name.replace(/\s+/g, ' ');
    
    // Capitalize first letter of each word
    name = name.split(' ')
      .filter(word => word.length > 0)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    // Trim extra spaces
    name = name.trim();
    
    return name;
  }

  generateProductTitle(filename, productType) {
    const prettyName = this.prettifyImageName(filename);
    return `${prettyName} ${productType}`;
  }

  runTests() {
    console.log('═══════════════════════════════════════');
    console.log('🎨 PRODUCT NAME PRETTIFICATION TEST');
    console.log('═══════════════════════════════════════\n');

    // Test 1: Basic filename with extension
    this.test('Converts simple filename with extension', () => {
      const result = this.prettifyImageName('daphne.webp');
      assert.strictEqual(result, 'Daphne');
    });

    // Test 2: Filename with hyphens
    this.test('Converts hyphenated filename', () => {
      const result = this.prettifyImageName('goblin-king.png');
      assert.strictEqual(result, 'Goblin King');
    });

    // Test 3: Filename with underscores
    this.test('Converts underscored filename', () => {
      const result = this.prettifyImageName('ice_fortress.jpg');
      assert.strictEqual(result, 'Ice Fortress');
    });

    // Test 4: Filename with dots
    this.test('Converts dotted filename', () => {
      const result = this.prettifyImageName('lucky.the.leprechaun.webp');
      assert.strictEqual(result, 'Lucky The Leprechaun');
    });

    // Test 5: Mixed separators
    this.test('Converts filename with mixed separators', () => {
      const result = this.prettifyImageName('ice-blue_diamond.webp');
      assert.strictEqual(result, 'Ice Blue Diamond');
    });

    // Test 6: All caps filename
    this.test('Converts all caps filename', () => {
      const result = this.prettifyImageName('ALEXANDRIA.PNG');
      assert.strictEqual(result, 'Alexandria');
    });

    // Test 7: Multiple extensions
    this.test('Handles multiple extensions correctly', () => {
      const result = this.prettifyImageName('image.backup.webp');
      assert.strictEqual(result, 'Image Backup');
    });

    // Test 8: No extension
    this.test('Handles filename without extension', () => {
      const result = this.prettifyImageName('jewel');
      assert.strictEqual(result, 'Jewel');
    });

    // Test 9: Single character words
    this.test('Handles single character words', () => {
      const result = this.prettifyImageName('a-b-c.webp');
      assert.strictEqual(result, 'A B C');
    });

    // Test 10: Numbers in filename
    this.test('Handles numbers in filename', () => {
      const result = this.prettifyImageName('season-1-episode-3.webp');
      assert.strictEqual(result, 'Season 1 Episode 3');
    });

    // Test 11: Generate full product title
    this.test('Generates complete product title with T-Shirt', () => {
      const result = this.generateProductTitle('daphne.webp', 'T-Shirt');
      assert.strictEqual(result, 'Daphne T-Shirt');
    });

    // Test 12: Generate product title with Mug
    this.test('Generates complete product title with Mug', () => {
      const result = this.generateProductTitle('goblin-king.png', 'Mug');
      assert.strictEqual(result, 'Goblin King Mug');
    });

    // Test 13: Generate product title with Poster
    this.test('Generates complete product title with Poster', () => {
      const result = this.generateProductTitle('ice_fortress.jpg', 'Poster');
      assert.strictEqual(result, 'Ice Fortress Poster');
    });

    // Test 14: Complex filename with product type
    this.test('Generates title for complex filename', () => {
      const result = this.generateProductTitle('battle-scene-for-product-previ.webp', 'Canvas Print');
      assert.strictEqual(result, 'Battle Scene For Product Previ Canvas Print');
    });

    // Test 15: Empty filename handling
    this.test('Handles empty filename gracefully', () => {
      const result = this.prettifyImageName('');
      assert.strictEqual(result, '');
    });

    // Test 16: Whitespace handling
    this.test('Handles extra whitespace', () => {
      const result = this.prettifyImageName('  spaced  -  out  .webp');
      assert.strictEqual(result, 'Spaced Out');
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

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    prettifyImageName: (filename) => {
      const test = new ProductNamePrettificationTest();
      return test.prettifyImageName(filename);
    },
    generateProductTitle: (filename, productType) => {
      const test = new ProductNamePrettificationTest();
      return test.generateProductTitle(filename, productType);
    }
  };
}

// Run tests if executed directly
if (require.main === module) {
  const test = new ProductNamePrettificationTest();
  test.runTests();
}
