// Enhanced diagnostic to debug store initialization failure
// Run this in browser console to debug why store isn't initializing

console.log('🔍 ENHANCED STORE INITIALIZATION DIAGNOSTIC');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// 1. Check DOM containers
console.log('📦 CONTAINER CHECK:');
const containers = {
  'merchandise-store': document.getElementById('merchandise-store'),
  'loading-container': document.querySelector('.loading-container'),
  'store-content': document.querySelector('.store-content'),
  'merchandise-store-class': document.querySelector('.merchandise-store')
};

Object.entries(containers).forEach(([name, element]) => {
  console.log(`- ${name}:`, element ? 'Found' : 'Not found');
  if (element) {
    console.log(`  - innerHTML length: ${element.innerHTML.length}`);
    console.log(`  - First 100 chars: "${element.innerHTML.substring(0, 100)}..."`);
  }
});

// 2. Check authentication state
console.log('\n🔐 AUTHENTICATION CHECK:');
console.log('- Firebase auth available:', typeof window.firebaseAuth !== 'undefined');
console.log('- Firebase utils available:', typeof window.firebaseUtils !== 'undefined');

// 3. Check store instance state
console.log('\n🏪 STORE INSTANCE CHECK:');
if (window.merchandiseStore) {
  console.log('- Store instance exists: ✅');
  console.log('- Store type:', window.merchandiseStore.constructor.name);
  console.log('- isInitialized:', window.merchandiseStore.isInitialized);
  console.log('- isInitializing:', window.merchandiseStore.isInitializing);
  console.log('- containerId:', window.merchandiseStore.containerId);
  console.log('- products loaded:', !!(window.merchandiseStore.products && window.merchandiseStore.products.length));
  console.log('- availableProducts loaded:', !!(window.merchandiseStore.availableProducts && window.merchandiseStore.availableProducts.length));
} else {
  console.log('- Store instance exists: ❌');
}

// 4. Check for JavaScript errors
console.log('\n🚨 ERROR CHECK:');
const errorLog = [];
const originalError = console.error;
console.error = function(...args) {
  errorLog.push(args.join(' '));
  originalError.apply(console, args);
};

// 5. Test store initialization manually
console.log('\n🧪 MANUAL INITIALIZATION TEST:');
if (window.MerchandiseStore && !window.merchandiseStore) {
  console.log('- MerchandiseStore class available, trying manual init...');
  try {
    const testStore = new MerchandiseStore();
    console.log('- Manual store creation: ✅');
    console.log('- Test store type:', testStore.constructor.name);
  } catch (error) {
    console.error('- Manual store creation failed:', error);
  }
} else if (window.merchandiseStore) {
  console.log('- Store already exists, trying manual init call...');
  try {
    if (window.merchandiseStore.init && typeof window.merchandiseStore.init === 'function') {
      console.log('- Calling store.init()...');
      window.merchandiseStore.init().then(() => {
        console.log('- Manual init completed: ✅');
        // Re-run diagnostics after manual init
        if (typeof window.wavelengthStoreDiagnostics === 'function') {
          console.log('\n📊 POST-INIT DIAGNOSTICS:');
          window.wavelengthStoreDiagnostics();
        }
      }).catch(error => {
        console.error('- Manual init failed:', error);
      });
    } else {
      console.log('- No init method available');
    }
  } catch (error) {
    console.error('- Manual init call failed:', error);
  }
}

console.log('\n🔍 ENHANCED DIAGNOSTIC COMPLETE');
console.log('Check above for issues with containers, auth, or initialization');