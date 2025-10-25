/**
 * Firebase Readiness Helper
 * Ensures Firebase initialization happens before other scripts try to use it
 */

window.WavelengthFirebase = {
  isReady: false,
  readyCallbacks: [],
  
  // Add callback to run when Firebase is ready
  onReady: function(callback) {
    if (this.isReady) {
      callback();
    } else {
      this.readyCallbacks.push(callback);
    }
  },
  
  // Mark Firebase as ready and run callbacks
  markReady: function() {
    this.isReady = true;
    this.readyCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('❌ Firebase ready callback failed:', error);
      }
    });
    this.readyCallbacks = [];
    
    // Dispatch global event
    window.dispatchEvent(new CustomEvent('wavelengthFirebaseReady'));
    console.log('✅ Firebase is ready - all callbacks executed');
  },
  
  // Wait for Firebase with timeout
  waitForFirebase: function(maxWaitMs = 10000) {
    return new Promise((resolve, reject) => {
      if (this.isReady) {
        resolve();
        return;
      }
      
      const timeout = setTimeout(() => {
        reject(new Error('Firebase initialization timeout'));
      }, maxWaitMs);
      
      this.onReady(() => {
        clearTimeout(timeout);
        resolve();
      });
    });
  }
};