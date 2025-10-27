/**
 * WAVELENGTH Phase 2 Completion Validation
 * 
 * Final validation to ensure all UI renderer components are properly
 * integrated and the refactoring is complete and functional.
 */

console.log('🌊 WAVELENGTH PHASE 2 COMPLETION VALIDATION');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const fs = require('fs');
const path = require('path');

// Validation results
const validationResults = {
  filesCreated: { passed: 0, failed: 0, tests: [] },
  codeQuality: { passed: 0, failed: 0, tests: [] },
  integration: { passed: 0, failed: 0, tests: [] },
  architecture: { passed: 0, failed: 0, tests: [] }
};

function runValidation(testName, testFn, category) {
  try {
    const result = testFn();
    if (result === true) {
      validationResults[category].passed++;
      validationResults[category].tests.push({ name: testName, status: 'PASS' });
      console.log(`✅ ${testName}`);
    } else {
      validationResults[category].failed++;
      validationResults[category].tests.push({ name: testName, status: 'FAIL', error: result });
      console.log(`❌ ${testName}: ${result}`);
    }
  } catch (error) {
    validationResults[category].failed++;
    validationResults[category].tests.push({ name: testName, status: 'ERROR', error: error.message });
    console.log(`💥 ${testName}: ${error.message}`);
  }
}

// Validate file creation
function validateFilesCreated() {
  console.log('\n📁 Validating UI Renderer Files...');
  
  const requiredFiles = [
    'static/js/components/merchandise-product-card-renderer.js',
    'static/js/components/merchandise-cart-renderer.js', 
    'static/js/components/merchandise-category-grid-renderer.js',
    'static/js/components/merchandise-modal-renderer.js'
  ];
  
  requiredFiles.forEach(filePath => {
    runValidation(`File exists: ${filePath}`, () => {
      return fs.existsSync(filePath);
    }, 'filesCreated');
  });
  
  // Check file sizes (should be substantial)
  const expectedSizes = {
    'static/js/components/merchandise-product-card-renderer.js': 400,
    'static/js/components/merchandise-cart-renderer.js': 500,
    'static/js/components/merchandise-category-grid-renderer.js': 600,
    'static/js/components/merchandise-modal-renderer.js': 900
  };
  
  Object.entries(expectedSizes).forEach(([filePath, minLines]) => {
    runValidation(`File size validation: ${path.basename(filePath)}`, () => {
      if (!fs.existsSync(filePath)) return 'File not found';
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n').length;
      return lines >= minLines ? true : `Only ${lines} lines, expected at least ${minLines}`;
    }, 'filesCreated');
  });
}

// Validate code quality
function validateCodeQuality() {
  console.log('\n🔍 Validating Code Quality...');
  
  const rendererFiles = [
    'static/js/components/merchandise-product-card-renderer.js',
    'static/js/components/merchandise-cart-renderer.js',
    'static/js/components/merchandise-category-grid-renderer.js', 
    'static/js/components/merchandise-modal-renderer.js'
  ];
  
  rendererFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      runValidation(`Class definition: ${path.basename(filePath)}`, () => {
        return content.includes('class Merchandise') && content.includes('constructor(');
      }, 'codeQuality');
      
      runValidation(`Constructor dependency injection: ${path.basename(filePath)}`, () => {
        return content.includes('constructor(options = {})') && 
               content.includes('this.eventBus = options.eventBus');
      }, 'codeQuality');
      
      runValidation(`Event bus integration: ${path.basename(filePath)}`, () => {
        return content.includes('this.eventBus.emit(') || content.includes('eventBus.emit(');
      }, 'codeQuality');
      
      runValidation(`Error handling: ${path.basename(filePath)}`, () => {
        return content.includes('try {') && content.includes('catch (error)');
      }, 'codeQuality');
      
      runValidation(`Module export: ${path.basename(filePath)}`, () => {
        return content.includes('module.exports =');
      }, 'codeQuality');
    }
  });
}

// Validate integration
function validateIntegration() {
  console.log('\n🔗 Validating Integration...');
  
  // Check MerchandiseStore integration
  const merchandiseStorePath = 'static/js/components/merchandise-store.js';
  if (fs.existsSync(merchandiseStorePath)) {
    const content = fs.readFileSync(merchandiseStorePath, 'utf8');
    
    runValidation('UI renderers initialized in MerchandiseStore', () => {
      return content.includes('this.productCardRenderer = new') &&
             content.includes('this.cartRenderer = new') &&
             content.includes('this.categoryGridRenderer = new') &&
             content.includes('this.modalRenderer = new');
    }, 'integration');
    
    runValidation('Event handlers for UI renderers', () => {
      return content.includes('setupUIRendererEventListeners') &&
             content.includes('handleCategorySelection') &&
             content.includes('handleAddToCart');
    }, 'integration');
    
    runValidation('Refactored render methods', () => {
      return content.includes('this.productCardRenderer.renderProductsGrid') &&
             content.includes('this.cartRenderer.renderCart');
    }, 'integration');
  }
  
  // Check template integration
  const templatePath = 'views/merchandise-store.ejs';
  if (fs.existsSync(templatePath)) {
    const content = fs.readFileSync(templatePath, 'utf8');
    
    runValidation('Template includes UI renderer scripts', () => {
      return content.includes('merchandise-product-card-renderer.js') &&
             content.includes('merchandise-cart-renderer.js') &&
             content.includes('merchandise-category-grid-renderer.js') &&
             content.includes('merchandise-modal-renderer.js');
    }, 'integration');
    
    runValidation('Required services check updated', () => {
      return content.includes('MerchandiseProductCardRenderer') &&
             content.includes('MerchandiseCartRenderer') &&
             content.includes('MerchandiseCategoryGridRenderer') &&
             content.includes('MerchandiseModalRenderer');
    }, 'integration');
  }
}

// Validate architecture
function validateArchitecture() {
  console.log('\n🏗️ Validating Architecture...');
  
  runValidation('Service-based architecture maintained', () => {
    const merchandiseStorePath = 'static/js/components/merchandise-store.js';
    if (!fs.existsSync(merchandiseStorePath)) return 'MerchandiseStore not found';
    
    const content = fs.readFileSync(merchandiseStorePath, 'utf8');
    return content.includes('this.apiService = new MerchandiseApiService()') &&
           content.includes('this.cartService = new MerchandiseCartService()') &&
           content.includes('this.validationService = new MerchandiseProductValidationService()') &&
           content.includes('this.eventBus = new WavelengthEventBus()');
  }, 'architecture');
  
  runValidation('Event-driven communication', () => {
    const eventBusPath = 'static/js/services/wavelength-event-bus.js';
    return fs.existsSync(eventBusPath);
  }, 'architecture');
  
  runValidation('Modular UI components', () => {
    const componentFiles = [
      'static/js/components/merchandise-product-card-renderer.js',
      'static/js/components/merchandise-cart-renderer.js',
      'static/js/components/merchandise-category-grid-renderer.js',
      'static/js/components/merchandise-modal-renderer.js'
    ];
    
    return componentFiles.every(file => fs.existsSync(file));
  }, 'architecture');
  
  runValidation('Separation of concerns', () => {
    // Each renderer should handle only its specific UI concern
    const productCardContent = fs.readFileSync('static/js/components/merchandise-product-card-renderer.js', 'utf8');
    const cartContent = fs.readFileSync('static/js/components/merchandise-cart-renderer.js', 'utf8');
    
    // ProductCardRenderer should not handle cart operations
    const productCardFocused = !productCardContent.includes('checkout') && !productCardContent.includes('removeFromCart');
    
    // CartRenderer should not handle product validation
    const cartFocused = !cartContent.includes('isProductComplete') && !cartContent.includes('getProductStatus');
    
    return productCardFocused && cartFocused;
  }, 'architecture');
}

// Calculate metrics
function calculateMetrics() {
  console.log('\n📊 Calculating Refactoring Metrics...');
  
  // Count lines of code in UI renderers
  let totalUIRendererLines = 0;
  const rendererFiles = [
    'static/js/components/merchandise-product-card-renderer.js',
    'static/js/components/merchandise-cart-renderer.js',
    'static/js/components/merchandise-category-grid-renderer.js',
    'static/js/components/merchandise-modal-renderer.js'
  ];
  
  rendererFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n').length;
      totalUIRendererLines += lines;
      console.log(`  ${path.basename(filePath)}: ${lines} lines`);
    }
  });
  
  // Count MerchandiseStore lines
  let merchandiseStoreLines = 0;
  if (fs.existsSync('static/js/components/merchandise-store.js')) {
    const content = fs.readFileSync('static/js/components/merchandise-store.js', 'utf8');
    merchandiseStoreLines = content.split('\n').length;
  }
  
  console.log(`\n📈 Refactoring Metrics:`);
  console.log(`  🎨 Total UI Renderer Lines: ${totalUIRendererLines}`);
  console.log(`  🏪 MerchandiseStore Lines: ${merchandiseStoreLines}`);
  console.log(`  📊 UI/Logic Separation: ${Math.round((totalUIRendererLines / (totalUIRendererLines + merchandiseStoreLines)) * 100)}% UI code extracted`);
  
  return {
    totalUIRendererLines,
    merchandiseStoreLines,
    separationPercentage: Math.round((totalUIRendererLines / (totalUIRendererLines + merchandiseStoreLines)) * 100)
  };
}

// Generate final report
function generateFinalReport() {
  const metrics = calculateMetrics();
  
  console.log('\n🎯 WAVELENGTH PHASE 2 VALIDATION RESULTS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  let totalPassed = 0;
  let totalFailed = 0;
  
  Object.keys(validationResults).forEach(category => {
    const results = validationResults[category];
    totalPassed += results.passed;
    totalFailed += results.failed;
    
    console.log(`\n${category.toUpperCase().replace(/([A-Z])/g, ' $1').trim()}:`);
    console.log(`  ✅ Passed: ${results.passed}`);
    console.log(`  ❌ Failed: ${results.failed}`);
    
    if (results.failed > 0) {
      console.log('  Issues:');
      results.tests.filter(t => t.status !== 'PASS').forEach(test => {
        console.log(`    - ${test.name}: ${test.error || test.status}`);
      });
    }
  });
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🏆 PHASE 2 COMPLETION STATUS:`);
  console.log(`  ✅ Tests Passed: ${totalPassed}`);
  console.log(`  ❌ Tests Failed: ${totalFailed}`);
  console.log(`  📊 Success Rate: ${Math.round((totalPassed / (totalPassed + totalFailed)) * 100)}%`);
  console.log(`  🎨 UI Code Extracted: ${metrics.separationPercentage}%`);
  console.log(`  📝 Total UI Renderer Code: ${metrics.totalUIRendererLines} lines`);
  
  if (totalFailed === 0) {
    console.log('\n🎉 PHASE 2 UI COMPONENT EXTRACTION COMPLETE!');
    console.log('🚀 All UI renderers successfully created and integrated.');
    console.log('✨ Architecture is now modular, maintainable, and event-driven.');
  } else {
    console.log('\n⚠️ Phase 2 validation found issues that need attention.');
  }
  
  return {
    passed: totalPassed,
    failed: totalFailed,
    successRate: Math.round((totalPassed / (totalPassed + totalFailed)) * 100),
    metrics
  };
}

// Run all validations
function runCompleteValidation() {
  validateFilesCreated();
  validateCodeQuality();
  validateIntegration();
  validateArchitecture();
  
  const report = generateFinalReport();
  
  console.log('\n🌊 WAVELENGTH PHASE 2 VALIDATION COMPLETE!');
  
  return report;
}

// Execute validation
const report = runCompleteValidation();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runCompleteValidation, report };
}