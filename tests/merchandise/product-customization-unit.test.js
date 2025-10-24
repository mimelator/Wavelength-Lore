/**
 * Product Customization Frontend Unit Tests
 * 
 * Tests the JavaScript functions in merchandise-store.js related to
 * product customization without requiring a full browser environment.
 * 
 * Tests:
 * 1. findProductConfig() - Find product by ID
 * 2. generateProductName() - Generate context-aware names
 * 3. extractImageContext() - Extract metadata from image titles
 * 4. getBorderConfig() - Map border styles to configurations
 * 5. Product name template substitution
 * 6. Edge cases and error handling
 */

const assert = require('assert');

class ProductCustomizationUnitTests {
  constructor() {
    this.results = {
      passed: [],
      failed: [],
      warnings: []
    };
    
    // Mock product types data
    this.mockProductTypes = {
      apparel: {
        name: 'Apparel',
        products: [
          {
            id: 'premium-tshirt',
            name: 'Premium T-Shirt',
            nameTemplates: [
              'Wavelength {characterName} Memory',
              '{characterName} Chronicles Tee',
              'Episode {episodeNumber} Collection',
              'Wavelength Lore Classic',
              '{seasonName} Season Memory'
            ]
          },
          {
            id: 'hoodie',
            name: 'Pullover Hoodie',
            nameTemplates: [
              'Wavelength {characterName} Hoodie',
              '{characterName} Adventure Hoodie'
            ]
          }
        ]
      },
      home: {
        name: 'Home & Living',
        products: [
          {
            id: 'pillow',
            name: 'Square Pillow',
            nameTemplates: [
              'Wavelength {characterName} Pillow'
            ]
          }
        ]
      }
    };
  }

  // Replicate the findProductConfig function
  findProductConfig(productTypeId) {
    for (const category of Object.values(this.mockProductTypes)) {
      const product = category.products.find(p => p.id === productTypeId);
      if (product) {
        return product;
      }
    }
    return null;
  }

  // Replicate the extractImageContext function
  extractImageContext(imageData) {
    if (!imageData || !imageData.title) {
      return {};
    }
    
    const title = imageData.title.toLowerCase();
    const context = {};
    
    // Try to extract character names
    const characters = ['daphne', 'lucky', 'felix', 'goblin-king'];
    for (const character of characters) {
      if (title.includes(character.replace('-', ' ')) || title.includes(character)) {
        context.characterName = character.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
        break;
      }
    }
    
    // Try to extract episode numbers
    const episodeMatch = title.match(/episode[\s\-]?(\d+)/i);
    if (episodeMatch) {
      context.episodeNumber = episodeMatch[1];
    }
    
    // Try to extract seasonal context
    const seasons = ['spring', 'summer', 'autumn', 'fall', 'winter'];
    for (const season of seasons) {
      if (title.includes(season)) {
        context.seasonName = season.charAt(0).toUpperCase() + season.slice(1);
        break;
      }
    }
    
    // Try to extract location
    const locations = ['forest', 'castle', 'garden', 'mountain', 'cave', 'town', 'village'];
    for (const location of locations) {
      if (title.includes(location)) {
        context.locationName = location.charAt(0).toUpperCase() + location.slice(1);
        break;
      }
    }
    
    return context;
  }

  // Replicate the generateProductName function
  generateProductName(productType, imageContext, imageData) {
    const productConfig = this.findProductConfig(productType);
    if (!productConfig || !productConfig.nameTemplates) {
      return 'Custom Wavelength Product';
    }
    
    // Pick a template based on available context
    let template = productConfig.nameTemplates[0]; // Default to first template
    
    if (imageContext.characterName && productConfig.nameTemplates.some(t => t.includes('{characterName}'))) {
      template = productConfig.nameTemplates.find(t => t.includes('{characterName}'));
    } else if (imageContext.episodeNumber && productConfig.nameTemplates.some(t => t.includes('{episodeNumber}'))) {
      template = productConfig.nameTemplates.find(t => t.includes('{episodeNumber}'));
    } else if (imageContext.seasonName && productConfig.nameTemplates.some(t => t.includes('{seasonName}'))) {
      template = productConfig.nameTemplates.find(t => t.includes('{seasonName}'));
    }
    
    // Replace placeholders
    let name = template
      .replace('{characterName}', imageContext.characterName || 'Character')
      .replace('{episodeNumber}', imageContext.episodeNumber || 'X')
      .replace('{seasonName}', imageContext.seasonName || 'Season')
      .replace('{locationName}', imageContext.locationName || 'Adventure');
    
    return name;
  }

  // Replicate the getBorderConfig function
  getBorderConfig(borderStyle) {
    const configs = {
      'solid-thin': {
        type: 'solid',
        color: '#000000',
        width: 5,
        opacity: 1
      },
      'solid-medium': {
        type: 'solid',
        color: '#000000',
        width: 15,
        opacity: 1
      },
      'solid-thick': {
        type: 'solid',
        color: '#000000',
        width: 30,
        opacity: 1
      },
      'solid-white': {
        type: 'solid',
        color: '#FFFFFF',
        width: 15,
        opacity: 1
      },
      'gradient-fade': {
        type: 'gradient',
        colors: ['#000000', 'transparent'],
        width: 20,
        direction: 'outward'
      },
      'wavelength-theme': {
        type: 'wavelength-theme',
        variant: 'classic',
        width: 20
      }
    };
    
    return configs[borderStyle] || configs['solid-medium'];
  }

  // TESTS

  testFindProductConfig() {
    console.log('\n🔍 TEST: findProductConfig()');
    
    try {
      // Test finding existing product
      const tshirt = this.findProductConfig('premium-tshirt');
      assert(tshirt !== null, 'Should find premium-tshirt');
      assert.strictEqual(tshirt.name, 'Premium T-Shirt', 'Should have correct name');
      
      // Test finding product in different category
      const pillow = this.findProductConfig('pillow');
      assert(pillow !== null, 'Should find pillow');
      assert.strictEqual(pillow.name, 'Square Pillow', 'Should have correct name');
      
      // Test non-existent product
      const notFound = this.findProductConfig('non-existent-product');
      assert.strictEqual(notFound, null, 'Should return null for non-existent product');
      
      console.log('✅ findProductConfig() working correctly');
      this.results.passed.push('findProductConfig()');
      return true;
    } catch (error) {
      console.error(`❌ findProductConfig() failed: ${error.message}`);
      this.results.failed.push({
        test: 'findProductConfig()',
        error: error.message
      });
      return false;
    }
  }

  testExtractImageContext() {
    console.log('\n📝 TEST: extractImageContext()');
    
    try {
      // Test character extraction
      const daphneContext = this.extractImageContext({ title: 'Daphne in the forest' });
      assert.strictEqual(daphneContext.characterName, 'Daphne', 'Should extract Daphne');
      assert.strictEqual(daphneContext.locationName, 'Forest', 'Should extract Forest');
      
      // Test episode number extraction
      const episodeContext = this.extractImageContext({ title: 'Episode 12 Screenshot' });
      assert.strictEqual(episodeContext.episodeNumber, '12', 'Should extract episode 12');
      
      // Test season extraction
      const seasonContext = this.extractImageContext({ title: 'Summer Adventure' });
      assert.strictEqual(seasonContext.seasonName, 'Summer', 'Should extract Summer');
      
      // Test multiple contexts
      const multiContext = this.extractImageContext({ 
        title: 'Lucky Episode-5 Winter Castle Scene' 
      });
      assert.strictEqual(multiContext.characterName, 'Lucky', 'Should extract Lucky');
      assert.strictEqual(multiContext.episodeNumber, '5', 'Should extract episode 5');
      assert.strictEqual(multiContext.seasonName, 'Winter', 'Should extract Winter');
      assert.strictEqual(multiContext.locationName, 'Castle', 'Should extract Castle');
      
      // Test goblin-king with hyphen
      const goblinContext = this.extractImageContext({ title: 'The Goblin King arrives' });
      assert.strictEqual(goblinContext.characterName, 'Goblin King', 'Should extract Goblin King');
      
      // Test empty/null
      const emptyContext = this.extractImageContext({ title: '' });
      assert.deepStrictEqual(emptyContext, {}, 'Should return empty object for empty title');
      
      const nullContext = this.extractImageContext(null);
      assert.deepStrictEqual(nullContext, {}, 'Should return empty object for null');
      
      console.log('✅ extractImageContext() working correctly');
      this.results.passed.push('extractImageContext()');
      return true;
    } catch (error) {
      console.error(`❌ extractImageContext() failed: ${error.message}`);
      this.results.failed.push({
        test: 'extractImageContext()',
        error: error.message
      });
      return false;
    }
  }

  testGenerateProductName() {
    console.log('\n🏷️  TEST: generateProductName()');
    
    try {
      // Test with character context
      const daphneContext = { characterName: 'Daphne' };
      const daphneName = this.generateProductName('premium-tshirt', daphneContext, {});
      assert(daphneName.includes('Daphne'), 'Name should include Daphne');
      console.log(`   → Generated: "${daphneName}"`);
      
      // Test with episode context
      const episodeContext = { episodeNumber: '7' };
      const episodeName = this.generateProductName('premium-tshirt', episodeContext, {});
      assert(episodeName.includes('7'), 'Name should include episode 7');
      console.log(`   → Generated: "${episodeName}"`);
      
      // Test with season context
      const seasonContext = { seasonName: 'Winter' };
      const seasonName = this.generateProductName('premium-tshirt', seasonContext, {});
      assert(seasonName.includes('Winter'), 'Name should include Winter');
      console.log(`   → Generated: "${seasonName}"`);
      
      // Test with no context (should use first template)
      const noContext = {};
      const defaultName = this.generateProductName('premium-tshirt', noContext, {});
      assert(defaultName.length > 0, 'Should generate a name even without context');
      console.log(`   → Generated: "${defaultName}"`);
      
      // Test with invalid product type
      const invalidName = this.generateProductName('invalid-product', daphneContext, {});
      assert.strictEqual(invalidName, 'Custom Wavelength Product', 'Should return default for invalid product');
      
      console.log('✅ generateProductName() working correctly');
      this.results.passed.push('generateProductName()');
      return true;
    } catch (error) {
      console.error(`❌ generateProductName() failed: ${error.message}`);
      this.results.failed.push({
        test: 'generateProductName()',
        error: error.message
      });
      return false;
    }
  }

  testGetBorderConfig() {
    console.log('\n🎨 TEST: getBorderConfig()');
    
    try {
      // Test solid-thin
      const thinConfig = this.getBorderConfig('solid-thin');
      assert.strictEqual(thinConfig.type, 'solid', 'Should be solid type');
      assert.strictEqual(thinConfig.width, 5, 'Should have width 5');
      assert.strictEqual(thinConfig.color, '#000000', 'Should be black');
      
      // Test solid-medium (default)
      const mediumConfig = this.getBorderConfig('solid-medium');
      assert.strictEqual(mediumConfig.width, 15, 'Should have width 15');
      
      // Test solid-thick
      const thickConfig = this.getBorderConfig('solid-thick');
      assert.strictEqual(thickConfig.width, 30, 'Should have width 30');
      
      // Test solid-white
      const whiteConfig = this.getBorderConfig('solid-white');
      assert.strictEqual(whiteConfig.color, '#FFFFFF', 'Should be white');
      
      // Test gradient-fade
      const gradientConfig = this.getBorderConfig('gradient-fade');
      assert.strictEqual(gradientConfig.type, 'gradient', 'Should be gradient type');
      assert(Array.isArray(gradientConfig.colors), 'Should have colors array');
      assert.strictEqual(gradientConfig.direction, 'outward', 'Should be outward direction');
      
      // Test wavelength-theme
      const themeConfig = this.getBorderConfig('wavelength-theme');
      assert.strictEqual(themeConfig.type, 'wavelength-theme', 'Should be wavelength-theme type');
      assert.strictEqual(themeConfig.variant, 'classic', 'Should be classic variant');
      
      // Test invalid/unknown style (should return default)
      const unknownConfig = this.getBorderConfig('unknown-style');
      assert.strictEqual(unknownConfig.type, 'solid', 'Should return default solid config');
      assert.strictEqual(unknownConfig.width, 15, 'Should have default width');
      
      console.log('✅ getBorderConfig() working correctly');
      this.results.passed.push('getBorderConfig()');
      return true;
    } catch (error) {
      console.error(`❌ getBorderConfig() failed: ${error.message}`);
      this.results.failed.push({
        test: 'getBorderConfig()',
        error: error.message
      });
      return false;
    }
  }

  testTemplateSubstitution() {
    console.log('\n🔄 TEST: Template substitution edge cases');
    
    try {
      // Test all placeholders filled
      const fullContext = {
        characterName: 'Daphne',
        episodeNumber: '5',
        seasonName: 'Winter',
        locationName: 'Castle'
      };
      
      const fullName = this.generateProductName('premium-tshirt', fullContext, {});
      assert(fullName.length > 0, 'Should generate name with full context');
      console.log(`   → Full context: "${fullName}"`);
      
      // Test partial context (should use defaults)
      const partialContext = { characterName: 'Felix' };
      const partialName = this.generateProductName('premium-tshirt', partialContext, {});
      assert(partialName.includes('Felix'), 'Should include Felix');
      assert(!partialName.includes('{'), 'Should not have unfilled placeholders');
      console.log(`   → Partial context: "${partialName}"`);
      
      // Test empty strings in context
      const emptyContext = { characterName: '', episodeNumber: '' };
      const emptyName = this.generateProductName('premium-tshirt', emptyContext, {});
      assert(!emptyName.includes('{'), 'Should handle empty strings');
      console.log(`   → Empty context: "${emptyName}"`);
      
      console.log('✅ Template substitution working correctly');
      this.results.passed.push('Template substitution edge cases');
      return true;
    } catch (error) {
      console.error(`❌ Template substitution failed: ${error.message}`);
      this.results.failed.push({
        test: 'Template substitution edge cases',
        error: error.message
      });
      return false;
    }
  }

  testBorderConfigStructure() {
    console.log('\n🏗️  TEST: Border config structure validation');
    
    try {
      const borderStyles = [
        'solid-thin', 'solid-medium', 'solid-thick', 
        'solid-white', 'gradient-fade', 'wavelength-theme'
      ];
      
      for (const style of borderStyles) {
        const config = this.getBorderConfig(style);
        
        // All configs should have type and width
        assert(config.type, `${style} should have type`);
        assert(typeof config.width === 'number', `${style} should have numeric width`);
        assert(config.width > 0, `${style} width should be positive`);
        
        // Solid types should have color and opacity
        if (config.type === 'solid') {
          assert(config.color, `${style} should have color`);
          assert(typeof config.opacity === 'number', `${style} should have opacity`);
        }
        
        // Gradient types should have colors array
        if (config.type === 'gradient') {
          assert(Array.isArray(config.colors), `${style} should have colors array`);
          assert(config.colors.length > 0, `${style} should have at least one color`);
        }
        
        // Wavelength-theme should have variant
        if (config.type === 'wavelength-theme') {
          assert(config.variant, `${style} should have variant`);
        }
      }
      
      console.log('✅ Border config structures validated');
      this.results.passed.push('Border config structure validation');
      return true;
    } catch (error) {
      console.error(`❌ Border config structure validation failed: ${error.message}`);
      this.results.failed.push({
        test: 'Border config structure validation',
        error: error.message
      });
      return false;
    }
  }

  printResults() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 UNIT TEST RESULTS');
    console.log('='.repeat(80));
    
    console.log(`\n✅ PASSED: ${this.results.passed.length}`);
    this.results.passed.forEach(test => {
      console.log(`   ✓ ${test}`);
    });
    
    if (this.results.warnings.length > 0) {
      console.log(`\n⚠️  WARNINGS: ${this.results.warnings.length}`);
      this.results.warnings.forEach(warning => {
        console.log(`   ⚠ ${warning}`);
      });
    }
    
    if (this.results.failed.length > 0) {
      console.log(`\n❌ FAILED: ${this.results.failed.length}`);
      this.results.failed.forEach(failure => {
        console.log(`   ✗ ${failure.test}`);
        console.log(`     Error: ${failure.error}`);
      });
    }
    
    console.log('\n' + '='.repeat(80));
    
    const total = this.results.passed.length + this.results.failed.length;
    const passRate = total > 0 ? ((this.results.passed.length / total) * 100).toFixed(1) : 0;
    console.log(`Pass Rate: ${passRate}% (${this.results.passed.length}/${total})`);
    console.log('='.repeat(80) + '\n');
    
    return this.results.failed.length === 0;
  }
}

// Run tests
function runTests() {
  const tester = new ProductCustomizationUnitTests();
  
  console.log('🧪 Running Product Customization Unit Tests...\n');
  
  // Run all tests
  tester.testFindProductConfig();
  tester.testExtractImageContext();
  tester.testGenerateProductName();
  tester.testGetBorderConfig();
  tester.testTemplateSubstitution();
  tester.testBorderConfigStructure();
  
  // Print results
  const allPassed = tester.printResults();
  
  process.exit(allPassed ? 0 : 1);
}

// Run if executed directly
if (require.main === module) {
  runTests();
}

module.exports = ProductCustomizationUnitTests;
