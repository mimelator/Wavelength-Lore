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
    
    // Check for AdMob config
    if (window.AdMobConfig) {
      console.log('Found AdMobConfig, using configuration from there');
      
      // Use config settings
      const settings = window.AdMobConfig.settings;
      if (settings) {
        if (settings.minTimeBetweenInterstitials) {
          this.minTimeBetweenAds = settings.minTimeBetweenInterstitials;
        }
        if (settings.interstitialFrequency) {
          this.adFrequency = settings.interstitialFrequency;
        }
        
        // Check if ads are globally disabled
        if (settings.adsEnabled === false) {
          console.log('Ads are disabled in AdMobConfig');
          this.userOptedOut = true;
        }
      }
      
      // Default to AdMob provider when config is present
      this.providerType = 'admob';
    }
    
    // Override with options if provided
    if (options.provider) this.providerType = options.provider;
    if (options.minTimeBetweenAds) this.minTimeBetweenAds = options.minTimeBetweenAds;
    if (options.adFrequency) this.adFrequency = options.adFrequency;
    
    // Track the current reward type for analytics
    this.currentRewardType = null;
    
    // Initialize selected provider
    this.initProvider();
    
    // Add event listeners for app state
    this.setupEventListeners();
    
    // Mark as initialized
    this.initialized = true;
    console.log('✅ Ad System initialized with provider:', this.providerType);
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
   * Uses AdMobConfig to properly integrate with AdMob SDK
   */
  initAdMob: function() {
    console.log('Initializing AdMob...');
    
    // Make sure AdMobConfig exists
    if (!window.AdMobConfig) {
      console.error('AdMobConfig not found! Make sure admob-config.js is loaded before ad-system.js');
      return;
    }
    
    // Create the provider object using real AdMob SDK
    this.provider = {
      name: 'AdMob',
      
      // Store reference to config for convenience
      config: window.AdMobConfig,
      
      // Initialize AdMob SDK
      initialize: () => {
        // Get the device platform (should be implemented or detected)
        const platform = this.getPlatform(); // 'android', 'ios', or 'web'
        
        if (typeof admob !== 'undefined') {
          // Initialize with the app ID for the current platform
          admob.start()
            .then(() => {
              console.log('AdMob SDK initialized successfully');
              
              // Configure ad targeting based on settings
              if (this.provider.config.settings.targeting) {
                const targeting = this.provider.config.settings.targeting;
                admob.setOptions({
                  maxAdContentRating: targeting.maxAdContentRating || 'T',
                  tagForChildDirectedTreatment: targeting.tagForChildDirectedTreatment || false,
                  tagForUnderAgeOfConsent: targeting.tagForUnderAgeOfConsent || false
                });
              }
              
              // Load initial ads
              this.provider.loadRewardedVideo();
              this.provider.loadInterstitial();
            })
            .catch(error => {
              console.error('AdMob initialization failed:', error);
            });
        } else {
          console.warn('AdMob SDK not detected, using simulation mode');
          // Simulate initialization for development without SDK
          this.simulateAdMob();
        }
      },
      
      // Load a rewarded video ad
      loadRewardedVideo: () => {
        if (typeof admob === 'undefined') {
          // Simulate for development
          setTimeout(() => {
            this.rewardedVideoReady = true;
            console.log('AdMob rewarded video loaded and ready (simulated)');
          }, 1000);
          return;
        }
        
        // Get the correct ad unit ID from config
        const adUnitId = this.provider.config.getAdUnitId('rewardedVideo');
        
        // Prepare the ad
        admob.rewardVideo.prepare({
          adUnitId: adUnitId
        })
          .then(() => {
            console.log('Rewarded video ad is ready to show');
            this.rewardedVideoReady = true;
          })
          .catch(error => {
            console.error('Failed to prepare rewarded video ad:', error);
            // Try again later
            setTimeout(() => this.provider.loadRewardedVideo(), 60000);
          });
      },
      
      // Show a rewarded video ad
      showRewardedVideo: (rewardCallback) => {
        if (typeof admob === 'undefined') {
          // Simulate for development
          setTimeout(() => {
            if (rewardCallback) rewardCallback();
            this.rewardedVideoReady = false;
            // Reload
            this.provider.loadRewardedVideo();
          }, 2000);
          return;
        }
        
        // Show the ad
        admob.rewardVideo.show()
          .then(() => {
            console.log('Rewarded video ad shown successfully');
          })
          .catch(error => {
            console.error('Failed to show rewarded video ad:', error);
          });
          
        // Set up reward event listener (if not already set)
        if (!this.rewardListenerSet) {
          document.addEventListener('admob.reward_video.reward', (event) => {
            console.log('User earned reward:', event);
            if (rewardCallback) rewardCallback();
          });
          
          document.addEventListener('admob.reward_video.close', () => {
            console.log('Rewarded video closed, loading next ad');
            this.rewardedVideoReady = false;
            this.provider.loadRewardedVideo();
          });
          
          this.rewardListenerSet = true;
        }
      },
      
      // Load an interstitial ad
      loadInterstitial: () => {
        if (typeof admob === 'undefined') {
          // Simulate for development
          setTimeout(() => {
            this.interstitialReady = true;
            console.log('AdMob interstitial loaded and ready (simulated)');
          }, 1000);
          return;
        }
        
        // Get the correct ad unit ID from config
        const adUnitId = this.provider.config.getAdUnitId('interstitial');
        
        // Prepare the ad
        admob.interstitial.prepare({
          adUnitId: adUnitId
        })
          .then(() => {
            console.log('Interstitial ad is ready to show');
            this.interstitialReady = true;
          })
          .catch(error => {
            console.error('Failed to prepare interstitial ad:', error);
            // Try again later
            setTimeout(() => this.provider.loadInterstitial(), 60000);
          });
      },
      
      // Show an interstitial ad
      showInterstitial: (completionCallback) => {
        if (typeof admob === 'undefined') {
          // Simulate for development
          setTimeout(() => {
            if (completionCallback) completionCallback();
            this.interstitialReady = false;
            // Reload
            this.provider.loadInterstitial();
          }, 2000);
          return;
        }
        
        // Show the ad
        admob.interstitial.show()
          .then(() => {
            console.log('Interstitial ad shown successfully');
          })
          .catch(error => {
            console.error('Failed to show interstitial ad:', error);
            if (completionCallback) completionCallback();
          });
          
        // Set up close event listener (if not already set)
        if (!this.interstitialListenerSet) {
          document.addEventListener('admob.interstitial.close', () => {
            console.log('Interstitial closed, loading next ad');
            this.interstitialReady = false;
            this.provider.loadInterstitial();
            if (completionCallback) completionCallback();
          });
          
          this.interstitialListenerSet = true;
        }
      }
    };
    
    // Initialize AdMob
    this.provider.initialize();
    
    // Apply config settings to our ad system
    if (window.AdMobConfig.settings) {
      this.minTimeBetweenAds = window.AdMobConfig.settings.minTimeBetweenInterstitials || this.minTimeBetweenAds;
      this.adFrequency = window.AdMobConfig.settings.interstitialFrequency || this.adFrequency;
    }
  },
  
  /**
   * Simulate AdMob for development without SDK
   */
  simulateAdMob: function() {
    console.log('Using simulated AdMob for development');
    setTimeout(() => {
      this.rewardedVideoReady = true;
      this.interstitialReady = true;
      console.log('Simulated ads are ready to show');
    }, 1000);
  },
  
  /**
   * Detect the current platform
   * @returns {string} 'android', 'ios', or 'web'
   */
  getPlatform: function() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    
    // Detect iOS
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
      return 'ios';
    }
    
    // Detect Android
    if (/android/i.test(userAgent)) {
      return 'android';
    }
    
    // Default to web
    return 'web';
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
    
    // Call the provider's implementation
    if (this.provider && typeof this.provider.showRewardedVideo === 'function') {
      // Hide loading UI since the ad SDK will show its own UI
      setTimeout(() => this.hideAdLoadingUI(), 500);
      
      // Show the ad
      this.provider.showRewardedVideo(rewardCallback);
    } else {
      // Fallback for when provider isn't available
      console.error('Provider missing showRewardedVideo method');
      this.hideAdLoadingUI();
      return false;
    }
    
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
    
    // Call the provider's implementation
    if (this.provider && typeof this.provider.showInterstitial === 'function') {
      // Hide loading UI since the ad SDK will show its own UI
      setTimeout(() => this.hideAdLoadingUI(), 500);
      
      // Show the ad
      this.provider.showInterstitial(completionCallback);
    } else {
      // Fallback for when provider isn't available
      console.error('Provider missing showInterstitial method');
      this.hideAdLoadingUI();
      if (completionCallback) completionCallback();
      return false;
    }
    
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
    
    // Check if ad provider is available
    if (!this.provider) {
      console.warn('Ad provider not initialized, cannot refresh ads');
      return;
    }
    
    // Load a new rewarded video ad if needed
    if (!this.rewardedVideoReady && typeof this.provider.loadRewardedVideo === 'function') {
      console.log('Refreshing rewarded video ad');
      this.provider.loadRewardedVideo();
    }
    
    // Load a new interstitial ad if needed
    if (!this.interstitialReady && typeof this.provider.loadInterstitial === 'function') {
      console.log('Refreshing interstitial ad');
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
              <img id="ad-reward-image" src="/static/images/special-gem.svg" alt="Reward">
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
    // Check if retry threshold has been reached
    if (window.RetryThresholdManager && RetryThresholdManager.isThresholdReached()) {
      // Save the reward type for use in analytics
      this.currentRewardType = 'extraLife';
      
      // Update image to life gem
      const rewardImage = document.getElementById('ad-reward-image');
      if (rewardImage) {
        rewardImage.src = '/static/images/life-gem.svg';
      }
      
      this.showAdOfferDialog(
        "Need an Extra Life?",
        "You've reached your free retry limit. Watch a short video to continue playing!",
        () => {
          // Grant extra life
          if (window.wavelengthGems && typeof window.wavelengthGems.grantExtraLife === 'function') {
            window.wavelengthGems.grantExtraLife();
          }
        }
      );
    } else {
      // User still has free retries available
      console.log('User has free retries available, using one now');
      // Use one free retry
      RetryThresholdManager.useRetry();
      
      // Grant extra life directly without watching ad
      if (window.wavelengthGems && typeof window.wavelengthGems.grantExtraLife === 'function') {
        window.wavelengthGems.grantExtraLife();
      }
    }
  },
  
  /**
   * Offer special power gem in exchange for watching ad
   */
  offerSpecialGem: function() {
    // Save the reward type for use in analytics
    this.currentRewardType = 'powerGem';
    
    // Update image to power gem
    const rewardImage = document.getElementById('ad-reward-image');
    if (rewardImage) {
      rewardImage.src = '/static/images/power-gem.svg';
    }
    
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
    // Save the reward type for use in analytics
    this.currentRewardType = 'scoreMultiplier';
    
    // Update image to multiplier gem
    const rewardImage = document.getElementById('ad-reward-image');
    if (rewardImage) {
      rewardImage.src = '/static/images/multiplier-gem.svg';
    }
    
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