// DEEP STORE INITIALIZATION DIAGNOSTIC
// Run this in console to debug why store isn't initializing

console.log('🔬 DEEP STORE INITIALIZATION DIAGNOSTIC');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// 1. Check store instance properties in detail
console.log('🏪 STORE INSTANCE DEEP DIVE:');
if (window.merchandiseStore) {
  const store = window.merchandiseStore;
  console.log('- Constructor name:', store.constructor.name);
  console.log('- isInitialized:', store.isInitialized);
  console.log('- isInitializing:', store.isInitializing);
  console.log('- containerId:', store.containerId);
  console.log('- currentView:', store.currentView);
  console.log('- isLoading:', store.isLoading);
  
  // Check if init method exists and callable
  console.log('- Has init method:', typeof store.init === 'function');
  console.log('- Has render method:', typeof store.render === 'function');
  
  // Check critical services
  console.log('- apiService:', !!store.apiService);
  console.log('- cartService:', !!store.cartService);
  console.log('- cartRenderer:', !!store.cartRenderer);
  console.log('- eventBus:', !!store.eventBus);
  
  // Check data loaded
  console.log('- products:', store.products?.length || 0);
  console.log('- availableProducts:', store.availableProducts?.length || 0);
  console.log('- galleryImages:', store.galleryImages?.length || 0);
  console.log('- productCategories:', store.productCategories ? Object.keys(store.productCategories).length : 0);
} else {
  console.log('❌ No window.merchandiseStore instance found');
}

// 2. Check container in detail
console.log('\n📦 CONTAINER DEEP DIVE:');
const containers = [
  'merchandise-store',
  'merchandise-store-container', 
  'store-content',
  'merchandise-main'
];

containers.forEach(id => {
  const element = document.getElementById(id);
  console.log(`- ${id}:`, element ? 'Found' : 'Not found');
  if (element) {
    console.log(`  - tagName: ${element.tagName}`);
    console.log(`  - className: "${element.className}"`);
    console.log(`  - innerHTML length: ${element.innerHTML.length}`);
    console.log(`  - first 200 chars: "${element.innerHTML.substring(0, 200)}..."`);
    console.log(`  - _merchandiseStoreInstance: ${!!element._merchandiseStoreInstance}`);
  }
});

// 3. Check if initialization was attempted
console.log('\n🚀 INITIALIZATION CHECK:');
console.log('- DOM content loaded fired:', document.readyState);
console.log('- Scripts loaded (check for errors in Network tab)');

// 4. Manual initialization attempt
console.log('\n🧪 MANUAL INITIALIZATION ATTEMPT:');
if (window.merchandiseStore && typeof window.merchandiseStore.init === 'function') {
  console.log('Attempting manual store initialization...');
  
  try {
    // Try to call init manually
    const initPromise = window.merchandiseStore.init();
    if (initPromise && typeof initPromise.then === 'function') {
      initPromise.then(() => {
        console.log('✅ Manual initialization succeeded!');
        console.log('- Store initialized:', window.merchandiseStore.isInitialized);
        console.log('- Container ID:', window.merchandiseStore.containerId);
        
        // Run diagnostics again
        setTimeout(() => {
          if (typeof window.wavelengthStoreDiagnostics === 'function') {
            console.log('\n📊 POST-INIT DIAGNOSTICS:');
            window.wavelengthStoreDiagnostics();
          }
        }, 1000);
      }).catch(error => {
        console.error('❌ Manual initialization failed:', error);
        console.error('Error stack:', error.stack);
      });
    } else {
      console.log('Init method returned:', initPromise);
    }
  } catch (error) {
    console.error('❌ Error calling init method:', error);
  }
} else {
  console.log('❌ Cannot attempt manual init - method not available');
}

// 5. Check for JavaScript errors
console.log('\n🚨 ERROR DETECTION:');
const originalConsoleError = console.error;
const errors = [];
console.error = function(...args) {
  errors.push(args.join(' '));
  originalConsoleError.apply(console, args);
};

setTimeout(() => {
  console.log('Recent errors captured:', errors.length);
  errors.forEach((error, i) => {
    console.log(`${i + 1}. ${error}`);
  });
}, 1000);

console.log('\n🔬 DEEP DIAGNOSTIC COMPLETE');
console.log('Check above for initialization blockers or try manual init');