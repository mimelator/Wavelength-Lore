// Test the fixed store initialization
// Run this in console after page loads

console.log('🧪 TESTING FIXED STORE INITIALIZATION');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Wait a moment for store to initialize, then test
setTimeout(() => {
  console.log('🔍 Running post-fix diagnostics...');
  
  if (typeof window.wavelengthStoreDiagnostics === 'function') {
    const result = window.wavelengthStoreDiagnostics();
    
    console.log('\n📊 INITIALIZATION SUCCESS CHECK:');
    if (result && !result.error) {
      const isSuccess = result.store && result.store.isInitialized;
      const hasContainer = result.store && result.store.hasContainer;
      const hasProducts = result.products && result.products.hasProducts;
      
      console.log('✅ Store initialized:', isSuccess);
      console.log('✅ Container found:', hasContainer);
      console.log('✅ Products loaded:', hasProducts);
      
      if (isSuccess && hasContainer && hasProducts) {
        console.log('🎉 ALL FIXES SUCCESSFUL! Store is ready for cart testing.');
        
        // Test cart diagnostics too
        console.log('\n🛒 Testing cart diagnostics...');
        if (typeof window.wavelengthCartDiagnostics === 'function') {
          window.wavelengthCartDiagnostics();
        }
      } else {
        console.log('⚠️ Some issues remain - check diagnostics above');
      }
    } else {
      console.log('❌ Diagnostics still showing errors:', result);
    }
  } else {
    console.log('❌ Diagnostic functions still not available');
  }
}, 2000); // Wait 2 seconds for initialization