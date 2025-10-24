/**
 * Refactored Service Test
 * 
 * Tests the refactored AutoEnhancedPrintifyService to ensure it works correctly
 */

require('dotenv').config();

async function testRefactoredService() {
  console.log('🧪 TESTING: Refactored AutoEnhancedPrintifyService');
  console.log('=================================================');
  
  try {
    // Test 1: Service initialization
    console.log('\n🔍 Test 1: Service initialization');
    const AutoEnhancedPrintifyService = require('../services/auto-enhanced-printify-service');
    const service = new AutoEnhancedPrintifyService();
    
    console.log('✅ Service initialized successfully');
    console.log('   Has upscaler:', !!service.upscaler);
    console.log('   Has merchandiseDB:', !!service.merchandiseDB);
    console.log('   Cache enabled:', service.cacheEnabled);
    console.log('   Auto-enhancement enabled:', service.autoEnhancementEnabled);
    
    // Test 2: Method existence
    console.log('\n🔍 Test 2: Method existence validation');
    const requiredMethods = [
      'previewImageEnhancement',
      'uploadImage',
      'getCachedEnhancement',
      'generateEnhancement',
      'formatCachedResult',
      'formatOriginalResult',
      'sanitizeFirebaseKey',
      'detectContentType',
      'getImageDimensions',
      'downloadImageBuffer'
    ];
    
    for (const method of requiredMethods) {
      if (typeof service[method] === 'function') {
        console.log(`   ✅ ${method}: exists`);
      } else {
        console.log(`   ❌ ${method}: missing`);
        throw new Error(`Required method ${method} is missing`);
      }
    }
    
    // Test 3: Preview enhancement method signature
    console.log('\n🔍 Test 3: Preview enhancement method signature');
    const testBuffer = Buffer.from('test image data');
    const testFileName = 'test-image.png';
    const testOptions = { originalImageId: 'test-id', userId: 'test-user' };
    
    // Mock the upscaler to avoid actual API calls
    service.upscaler = {
      analyzeImageQuality: () => Promise.resolve({
        originalWidth: 100,
        originalHeight: 100,
        suitableForPrint: true,
        recommendedAction: 'none'
      })
    };
    
    const result = await service.previewImageEnhancement(testBuffer, testFileName, testOptions);
    
    console.log('   ✅ Method called successfully');
    console.log('   Result structure:', {
      success: result.success,
      originalImageSuitable: result.originalImageSuitable,
      hasEnhancementMethod: !!result.enhancementMethod
    });
    
    if (!result.success) {
      throw new Error('Preview enhancement should succeed with suitable image');
    }
    
    // Test 4: Utility methods
    console.log('\n🔍 Test 4: Utility methods');
    
    const sanitized = service.sanitizeFirebaseKey('test.image#with$invalid/chars');
    console.log('   ✅ sanitizeFirebaseKey:', sanitized);
    if (sanitized.includes('.') || sanitized.includes('#') || sanitized.includes('$') || sanitized.includes('/')) {
      throw new Error('Sanitization failed');
    }
    
    const contentType = service.detectContentType('character-portrait.png');
    console.log('   ✅ detectContentType:', contentType);
    
    // Test 5: Configuration methods
    console.log('\n🔍 Test 5: Configuration methods');
    service.setCacheEnabled(false);
    console.log('   ✅ Cache disabled:', !service.cacheEnabled);
    
    service.setAutoEnhancementEnabled(false);
    console.log('   ✅ Auto-enhancement disabled:', !service.autoEnhancementEnabled);
    
    service.setCacheEnabled(true);
    service.setAutoEnhancementEnabled(true);
    console.log('   ✅ Both re-enabled');
    
    console.log('\n🎯 REFACTORED SERVICE TEST RESULT: ✅ ALL TESTS PASSED');
    console.log('The refactored service is working correctly!');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ REFACTORED SERVICE TEST FAILED:', error.message);
    console.error('Error stack:', error.stack);
    return false;
  }
}

// Run the test
if (require.main === module) {
  testRefactoredService().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = testRefactoredService;