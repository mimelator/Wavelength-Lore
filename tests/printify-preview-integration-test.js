/**
 * Printify Preview Integration Test
 * 
 * Validates that the blueprint preview system is using official Printify images
 * instead of generic fallback placeholders
 */

async function testPrintifyPreviewIntegration() {
  console.log('🎯 Testing Printify Preview Integration...');
  
  try {
    // Test individual blueprint previews
    const testBlueprints = [413, 68, 77, 238, 5, 6];
    const results = [];
    
    for (const blueprintId of testBlueprints) {
      const response = await fetch(`http://localhost:3001/api/merchandise/blueprint-preview/${blueprintId}`);
      const data = await response.json();
      
      results.push({
        blueprintId,
        success: data.success,
        name: data.name,
        previewImage: data.previewImage,
        isOfficialPrintify: data.previewImage?.includes('images.printify.com') || false,
        isFallback: data.previewImage?.includes('generic-product-preview.svg') || false
      });
      
      console.log(`📌 Blueprint ${blueprintId}: ${data.success ? '✅' : '❌'} ${data.name}`);
      console.log(`   Image: ${data.previewImage?.includes('images.printify.com') ? '🏢 Official Printify' : '🔄 Fallback'}`);
    }
    
    // Test batch API
    console.log('\n🔀 Testing batch API...');
    const batchResponse = await fetch('http://localhost:3001/api/merchandise/blueprint-previews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blueprintIds: testBlueprints })
    });
    
    const batchData = await batchResponse.json();
    console.log(`📦 Batch API: ${batchData.success ? '✅' : '❌'} (${batchData.count} items)`);
    
    // Analysis
    const officialCount = results.filter(r => r.isOfficialPrintify).length;
    const fallbackCount = results.filter(r => r.isFallback).length;
    const successRate = (officialCount / results.length) * 100;
    
    console.log('\n📊 RESULTS:');
    console.log(`🏢 Official Printify Images: ${officialCount}/${results.length} (${successRate.toFixed(1)}%)`);
    console.log(`🔄 Fallback Images: ${fallbackCount}/${results.length} (${((fallbackCount/results.length)*100).toFixed(1)}%)`);
    
    // Success criteria
    const isSuccess = officialCount >= results.length * 0.8; // 80% should be official images
    
    console.log(`\n🎯 TEST RESULT: ${isSuccess ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Target: ≥80% official Printify images`);
    console.log(`   Actual: ${successRate.toFixed(1)}% official images`);
    
    if (isSuccess) {
      console.log('\n🎉 SUCCESS: Blueprint preview system is using official Printify images!');
    } else {
      console.log('\n⚠️ ISSUE: Too many previews are falling back to generic images');
    }
    
    return isSuccess;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Run the test
testPrintifyPreviewIntegration().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Test crashed:', error);
  process.exit(1);
});