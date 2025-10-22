/**
 * Wavelength Gems Ad Integration Module
 * Initial prototype for reward-based ad system
 */

// Ad system configuration
const AdSystem = {
  // Ad provider configuration
  provider: null,           // Will hold provider instance
  providerType: 'admob',    // Default provider
  initialized: false,
  
  // Ad state tracking
  rewardedVideoReady: false,
  interstitialReady: false,
  bannerReady: false,
  lastAdShownTime: 0,
  
  // Configuration
  minTimeBetweenAds: 60000, // Minimum ms between ads (1 minute)
  adFrequency: 3,           // Show ad every X levels
  
  // User preferences
  userOptedOut: false,      // User preference for ads
  
  /**
   * Initialize the ad system
   */
  init: function(options = {}) {
    console.log('🎬 Initializing Wavelength Gems Ad System...');
    
    // Load user preferences
    this.loadUserPreferences();
    
    // Set provider from options or default
    this.providerType = options.provider || this.providerType;
    
    // Override config from options
    if (options.minTimeBetweenAds) this.minTimeBetweenAds = options.minTimeBetweenAds;
    if (options.adFrequency) this.adFrequency = options.adFrequency;
    
    // Initialize selected provider
    this.initProvider();
    
    // Add event listeners for app state
    this.setupEventListeners();
    
    // Mark as initialized
    this.initialized = true;
    console.log('✅ Ad System initialized');
  },
  
  /**
   * Initialize the selected ad provider
   */
  initProvider: function() {
    if (this.userOptedOut) {
      console.log('User opted out of ads, not initializing provider');
      return;
    }
    
    switch(this.providerType) {
      case 'admob':
        this.initAdMob();
        break;
      case 'unity':
        this.initUnityAds();
        break;
      case 'ironsource':
        this.initIronSource();
        break;
      default:
        console.error('Unknown ad provider:', this.providerType);
    }
  },
  
  /**
   * Initialize Google AdMob
   * (Placeholder - replace with actual AdMob integration)
   */
  initAdMob: function() {
    console.log('Initializing AdMob...');
    
    // Simulating AdMob initialization
    this.provider = {
      name: 'AdMob',
      
      // AdMob typically needs ad unit IDs for different ad formats
      adUnitIds: {
        rewarded: 'ca-app-pub-XXXXXXXXXXXXXXXX/REWARDED_VIDEO_ID',
        interstitial: 'ca-app-pub-XXXXXXXXXXXXXXXX/INTERSTITIAL_ID',
        banner: 'ca-app-pub-XXXXXXXXXXXXXXXX/BANNER_ID'
      },
      
      // Methods would be replaced with actual AdMob SDK calls
      loadRewardedVideo: () => {
        console.log('Loading AdMob rewarded video...');
        // Simulate ad loading
        setTimeout(() => {
          this.rewardedVideoReady = true;
          console.log('AdMob rewarded video loaded and ready');
        }, 1000);
      },
      
      loadInterstitial: () => {
        console.log('Loading AdMob interstitial...');
        // Simulate ad loading
        setTimeout(() => {
          this.interstitialReady = true;
          console.log('AdMob interstitial loaded and ready');
        }, 1000);
      }
    };
    
    // Initial ad loading
    this.provider.loadRewardedVideo();
    this.provider.loadInterstitial();
  },
  
  /**
   * Initialize Unity Ads
   * (Placeholder - replace with actual Unity Ads integration)
   */
  initUnityAds: function() {
    console.log('Initializing Unity Ads...');
    // Similar structure to AdMob but with Unity-specific implementation
  },
  
  /**
   * Initialize IronSource
   * (Placeholder - replace with actual IronSource integration)
   */
  initIronSource: function() {
    console.log('Initializing IronSource...');
    // Similar structure to AdMob but with IronSource-specific implementation
  },
  
  /**
   * Set up event listeners for app/game state
   */
  setupEventListeners: function() {
    // App visibility change (tab focus/blur)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        console.log('App came into foreground, refreshing ads');
        this.refreshAds();
      }
    });
    
    // Listen for level completion events
    window.addEventListener('levelComplete', (event) => {
      const level = event.detail.level;
      this.onLevelComplete(level);
    });
  },
  
  /**
   * Handle level completion - potential point to show interstitial
   */
  onLevelComplete: function(level) {
    console.log(`Level ${level} completed, checking if ad should be shown`);
    
    // Check if we should show an ad based on frequency
    if (level % this.adFrequency === 0) {
      this.showInterstitialAd();
    }
  },
  
  /**
   * Show a rewarded video ad
   * @param {Function} rewardCallback Callback to execute when user earns reward
   * @returns {Boolean} Whether ad was shown
   */
  showRewardedAd: function(rewardCallback) {
    if (this.userOptedOut) {
      console.log('User opted out of ads, not showing rewarded video');
      return false;
    }
    
    if (!this.rewardedVideoReady) {
      console.log('Rewarded video not ready yet');
      // Attempt to load a new one
      if (this.provider && typeof this.provider.loadRewardedVideo === 'function') {
        this.provider.loadRewardedVideo();
      }
      return false;
    }
    
    console.log('Showing rewarded video ad');
    
    // Show ad loading UI
    this.showAdLoadingUI();
    
    // Track last ad shown time
    this.lastAdShownTime = Date.now();
    
    // In real implementation, this would trigger the actual ad display
    // For prototype, we'll simulate the ad display and completion
    setTimeout(() => {
      // Hide loading UI
      this.hideAdLoadingUI();
      
      // Mark as used
      this.rewardedVideoReady = false;
      
      // Reload ad
      if (this.provider && typeof this.provider.loadRewardedVideo === 'function') {
        this.provider.loadRewardedVideo();
      }
      
      // Execute reward callback
      if (rewardCallback && typeof rewardCallback === 'function') {
        console.log('User earned reward');
        rewardCallback();
      }
      
      // Log event
      console.log('Rewarded video ad completed');
    }, 1000); // Simulated ad duration
    
    return true;
  },
  
  /**
   * Show an interstitial ad
   * @param {Function} completionCallback Callback after ad is closed
   * @returns {Boolean} Whether ad was shown
   */
  showInterstitialAd: function(completionCallback) {
    if (this.userOptedOut) {
      console.log('User opted out of ads, not showing interstitial');
      if (completionCallback) completionCallback();
      return false;
    }
    
    // Check time since last ad
    const timeSinceLastAd = Date.now() - this.lastAdShownTime;
    if (timeSinceLastAd < this.minTimeBetweenAds) {
      console.log(`Too soon to show another ad (${Math.round(timeSinceLastAd/1000)}s < ${this.minTimeBetweenAds/1000}s)`);
      if (completionCallback) completionCallback();
      return false;
    }
    
    if (!this.interstitialReady) {
      console.log('Interstitial not ready yet');
      if (completionCallback) completionCallback();
      
      // Attempt to load a new one
      if (this.provider && typeof this.provider.loadInterstitial === 'function') {
        this.provider.loadInterstitial();
      }
      return false;
    }
    
    console.log('Showing interstitial ad');
    
    // Show ad loading UI
    this.showAdLoadingUI();
    
    // Track last ad shown time
    this.lastAdShownTime = Date.now();
    
    // In real implementation, this would trigger the actual ad display
    // For prototype, we'll simulate the ad display and completion
    setTimeout(() => {
      // Hide loading UI
      this.hideAdLoadingUI();
      
      // Mark as used
      this.interstitialReady = false;
      
      // Reload ad
      if (this.provider && typeof this.provider.loadInterstitial === 'function') {
        this.provider.loadInterstitial();
      }
      
      // Execute completion callback
      if (completionCallback && typeof completionCallback === 'function') {
        completionCallback();
      }
      
      // Log event
      console.log('Interstitial ad closed');
    }, 1000); // Simulated ad duration
    
    return true;
  },
  
  /**
   * Show UI for ad loading state
   */
  showAdLoadingUI: function() {
    // Create or show loading overlay
    let loadingOverlay = document.getElementById('ad-loading-overlay');
    
    if (!loadingOverlay) {
      loadingOverlay = document.createElement('div');
      loadingOverlay.id = 'ad-loading-overlay';
      loadingOverlay.innerHTML = `
        <div class="ad-loading-container">
          <div class="ad-loading-spinner"></div>
          <div class="ad-loading-text">Loading Ad...</div>
        </div>
      `;
      
      // Style the overlay
      loadingOverlay.style.position = 'fixed';
      loadingOverlay.style.top = '0';
      loadingOverlay.style.left = '0';
      loadingOverlay.style.width = '100%';
      loadingOverlay.style.height = '100%';
      loadingOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      loadingOverlay.style.display = 'flex';
      loadingOverlay.style.justifyContent = 'center';
      loadingOverlay.style.alignItems = 'center';
      loadingOverlay.style.zIndex = '9999';
      
      document.body.appendChild(loadingOverlay);
    } else {
      loadingOverlay.style.display = 'flex';
    }
  },
  
  /**
   * Hide UI for ad loading state
   */
  hideAdLoadingUI: function() {
    const loadingOverlay = document.getElementById('ad-loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.style.display = 'none';
    }
  },
  
  /**
   * Refresh ads (e.g., after app comes back to foreground)
   */
  refreshAds: function() {
    if (this.userOptedOut) return;
    
    if (!this.rewardedVideoReady && this.provider && typeof this.provider.loadRewardedVideo === 'function') {
      this.provider.loadRewardedVideo();
    }
    
    if (!this.interstitialReady && this.provider && typeof this.provider.loadInterstitial === 'function') {
      this.provider.loadInterstitial();
    }
  },
  
  /**
   * Load user ad preferences
   */
  loadUserPreferences: function() {
    try {
      const storedValue = localStorage.getItem('wavelength_ads_opted_out');
      this.userOptedOut = storedValue === 'true';
      console.log(`User ad preference loaded: opted out = ${this.userOptedOut}`);
    } catch (e) {
      console.error('Error loading ad preferences:', e);
      this.userOptedOut = false;
    }
  },
  
  /**
   * Set user ad preference
   */
  setUserAdPreference: function(optOut) {
    try {
      this.userOptedOut = optOut;
      localStorage.setItem('wavelength_ads_opted_out', optOut);
      console.log(`User ad preference set: opted out = ${optOut}`);
      
      // If opting back in, re-initialize
      if (!optOut && this.initialized && !this.provider) {
        this.initProvider();
      }
    } catch (e) {
      console.error('Error saving ad preferences:', e);
    }
  },
  
  /**
   * Create and show ad offer dialog
   */
  showAdOfferDialog: function(title, rewardDescription, rewardCallback) {
    // Create dialog if it doesn't exist
    let offerDialog = document.getElementById('ad-offer-dialog');
    
    if (!offerDialog) {
      offerDialog = document.createElement('div');
      offerDialog.id = 'ad-offer-dialog';
      
      offerDialog.innerHTML = `
        <div class="ad-offer-container">
          <div class="ad-offer-card">
            <h2 id="ad-offer-title"></h2>
            <div class="reward-image">
              <img id="ad-reward-image" src="/static/images/special-gem.png" alt="Reward">
            </div>
            <p id="ad-reward-description" class="reward-description"></p>
            <div class="ad-duration">30 seconds</div>
            <div class="button-container">
              <button id="ad-accept-button" class="accept-button">Watch Video</button>
              <button id="ad-decline-button" class="decline-button">No Thanks</button>
            </div>
          </div>
        </div>
      `;
      
      // Style the dialog
      offerDialog.style.position = 'fixed';
      offerDialog.style.top = '0';
      offerDialog.style.left = '0';
      offerDialog.style.width = '100%';
      offerDialog.style.height = '100%';
      offerDialog.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      offerDialog.style.display = 'flex';
      offerDialog.style.justifyContent = 'center';
      offerDialog.style.alignItems = 'center';
      offerDialog.style.zIndex = '9999';
      
      document.body.appendChild(offerDialog);
      
      // Set up button listeners
      document.getElementById('ad-accept-button').addEventListener('click', () => {
        offerDialog.style.display = 'none';
        this.showRewardedAd(rewardCallback);
      });
      
      document.getElementById('ad-decline-button').addEventListener('click', () => {
        offerDialog.style.display = 'none';
      });
    } else {
      offerDialog.style.display = 'flex';
    }
    
    // Update content
    document.getElementById('ad-offer-title').textContent = title;
    document.getElementById('ad-reward-description').textContent = rewardDescription;
  },
  
  /**
   * Offer extra life in exchange for watching ad
   */
  offerExtraLife: function() {
    this.showAdOfferDialog(
      "Need an Extra Life?",
      "Watch a short video to continue playing!",
      () => {
        // Grant extra life
        if (window.wavelengthGems && typeof window.wavelengthGems.grantExtraLife === 'function') {
          window.wavelengthGems.grantExtraLife();
        }
      }
    );
  },
  
  /**
   * Offer special power gem in exchange for watching ad
   */
  offerSpecialGem: function() {
    this.showAdOfferDialog(
      "Power Up!",
      "Watch a short video to receive a special power gem!",
      () => {
        // Grant special gem
        if (window.wavelengthGems && typeof window.wavelengthGems.grantSpecialGem === 'function') {
          window.wavelengthGems.grantSpecialGem();
        }
      }
    );
  },
  
  /**
   * Offer score multiplier in exchange for watching ad
   */
  offerScoreMultiplier: function() {
    this.showAdOfferDialog(
      "Double Your Score!",
      "Watch a short video to activate 2x score multiplier!",
      () => {
        // Activate multiplier
        if (window.wavelengthGems && typeof window.wavelengthGems.activateScoreMultiplier === 'function') {
          window.wavelengthGems.activateScoreMultiplier(2, 60); // 2x for 60 seconds
        }
      }
    );
  }
};

// Add to window object for global access
window.wavelengthAds = AdSystem;

// Auto-initialize when script loads
document.addEventListener('DOMContentLoaded', () => {
  // Wait a moment for game to initialize
  setTimeout(() => {
    window.wavelengthAds.init();
  }, 1000);
});