// Quick test to verify diagnostic functions are working
// Run this in the browser console after the page loads

setTimeout(() => {
  console.log('🧪 TESTING DIAGNOSTIC FUNCTIONS AFTER PAGE LOAD');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Test 1: Check global store
  console.log('🔍 Test 1: Global store check');
  console.log('- window.merchandiseStore exists:', !!window.merchandiseStore);
  console.log('- Store has diagnostics method:', !!(window.merchandiseStore && window.merchandiseStore.getStoreDiagnostics));
  
  // Test 2: Check container
  console.log('\n🔍 Test 2: Container check');
  const container = document.getElementById('merchandise-store');
  console.log('- Container found:', !!container);
  console.log('- Container has instance reference:', !!(container && container._merchandiseStoreInstance));
  
  // Test 3: Try diagnostic function
  console.log('\n🔍 Test 3: Diagnostic function test');
  if (typeof window.wavelengthStoreDiagnostics === 'function') {
    console.log('- Diagnostic function exists: ✅');
    try {
      const result = window.wavelengthStoreDiagnostics();
      console.log('- Diagnostic function worked: ✅');
      console.log('- Result type:', typeof result);
    } catch (error) {
      console.error('- Diagnostic function error: ❌', error);
    }
  } else {
    console.log('- Diagnostic function exists: ❌');
  }
  
  console.log('\n🧪 DIAGNOSTIC TEST COMPLETE');
}, 2000); // Wait 2 seconds for store to initialize