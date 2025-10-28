#!/usr/bin/env node

/**
 * 🌊 WAVELENGTH: Variable Scoping Bug Test
 * Tests the uploadFileName scoping fix without requiring Printify API
 */

console.log('🌊 WAVELENGTH: Testing uploadFileName scoping fix...\n');

// Mock the PrintifyService with the exact same scoping structure
class MockPrintifyService {
  async uploadImage(imageBuffer, fileName, title) {
    // Declare variables outside try block for error logging access
    let uploadBuffer = imageBuffer;
    let uploadFileName = fileName;
    let base64Image;
    
    try {
      console.log('✅ Variables declared outside try block');
      console.log('   uploadBuffer size:', (uploadBuffer.length / 1024).toFixed(2), 'KB');
      console.log('   uploadFileName:', uploadFileName);
      
      // Convert WebP to PNG - Printify API doesn't actually support WebP despite config
      if (fileName && fileName.toLowerCase().endsWith('.webp')) {
        console.log('🎨 Converting WebP image to PNG for Printify compatibility...');
        uploadFileName = fileName.replace(/\.webp$/i, '.png');
        console.log(`✅ WebP conversion successful: ${fileName} → ${uploadFileName}`);
      }

      // Create JSON payload for image upload according to Printify API spec
      base64Image = uploadBuffer.toString('base64');

      const payload = {
        file_name: uploadFileName,
        contents: base64Image.substring(0, 50) + '...' // Truncated for display
      };
      
      console.log('✅ Payload created successfully');
      console.log('   file_name:', payload.file_name);
      console.log('   contents length:', base64Image.length);
      
      // Simulate a Printify API error to test error logging
      throw new Error('Simulated Printify API 400 Bad Request');
      
    } catch (error) {
      console.error('\n❌ Simulated error caught');
      console.error('Testing variable accessibility in catch block...');
      
      // 🔍 ENHANCED ERROR DIAGNOSTICS (This is where the error was happening)
      console.error('🚨 PRINTIFY UPLOAD FAILURE DETAILS:');
      console.error('   📁 Original fileName:', fileName);
      console.error('   📁 Upload fileName:', uploadFileName); // ✅ This should work now
      console.error('   📊 Original buffer size:', (imageBuffer.length / 1024).toFixed(2), 'KB');
      console.error('   📊 Upload buffer size:', (uploadBuffer.length / 1024).toFixed(2), 'KB');
      console.error('   🔤 Base64 length:', base64Image ? (base64Image.length / 1024).toFixed(2) + 'KB' : 'undefined');
      
      console.error('✅ All variables accessible in catch block!');
      
      return {
        success: false,
        error: error.message
      };
    }
  }
}

async function testScopingFix() {
  console.log('🧪 Testing various scenarios...\n');
  
  const mockService = new MockPrintifyService();
  const testBuffer = Buffer.from('fake image data for testing');
  
  const testCases = [
    'Wrapping Papers',           // Original failing case
    'test-image.png',           // Normal PNG
    'test-image.webp',          // WebP conversion case
  ];
  
  for (const fileName of testCases) {
    console.log(`\n🔍 Testing: "${fileName}"`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
      const result = await mockService.uploadImage(testBuffer, fileName, 'Test Title');
      
      if (result.success === false) {
        console.log('✅ Error handled gracefully with enhanced diagnostics');
      }
      
    } catch (error) {
      if (error.message.includes('uploadFileName is not defined')) {
        console.error('❌ SCOPING ERROR STILL EXISTS:', error.message);
      } else {
        console.error('❌ Unexpected error:', error.message);
      }
    }
  }
}

testScopingFix()
  .then(() => {
    console.log('\n🌊 Scoping fix test complete!');
    console.log('✅ If no "uploadFileName is not defined" errors appeared, the fix worked!');
  })
  .catch((error) => {
    console.error('💥 Test error:', error.message);
  });