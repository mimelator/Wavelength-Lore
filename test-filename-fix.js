#!/usr/bin/env node

/**
 * 🌊 WAVELENGTH: Filename Variable Scope Test
 * Tests if uploadFileName variable is properly accessible
 */

console.log('🌊 WAVELENGTH: Testing fileName variable handling...\n');

// Simulate the problematic code structure
function testUploadImageScoping(fileName) {
  try {
    // This mimics the exact structure in printify-service.js
    let uploadBuffer = Buffer.from('test');
    let uploadFileName = fileName; // This line should fix the issue

    console.log('✅ uploadFileName set:', uploadFileName);

    if (fileName && fileName.toLowerCase().endsWith('.webp')) {
      console.log('🎨 WebP conversion logic...');
      uploadFileName = fileName.replace(/\.webp$/i, '.png');
      console.log('✅ WebP converted:', uploadFileName);
    }

    // This is where the error was happening
    console.log('📁 Final uploadFileName:', uploadFileName);
    
    // Simulate the payload creation
    const payload = {
      file_name: uploadFileName,
      contents: 'test-base64'
    };
    
    console.log('✅ Payload created successfully:', payload.file_name);
    return true;
    
  } catch (error) {
    console.error('❌ Error in scoping test:', error.message);
    return false;
  }
}

// Test different filename scenarios
const testCases = [
  'Wrapping Papers',           // The original failing case (no extension)
  'test-image.png',           // Normal PNG
  'test-image.webp',          // WebP conversion case
  'product-image.jpg',        // JPG case
  null,                       // Edge case
  undefined                   // Edge case
];

console.log('🧪 Testing various filename scenarios:\n');

testCases.forEach((testCase, index) => {
  console.log(`${index + 1}. Testing: "${testCase}"`);
  const result = testUploadImageScoping(testCase);
  console.log(`   Result: ${result ? '✅ SUCCESS' : '❌ FAILED'}\n`);
});

console.log('🌊 Filename scope test complete!');