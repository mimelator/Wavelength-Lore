/**
 * AdMob Configuration for Wavelength Gems
 * Contains ad unit IDs and settings - loads from environment variables and API
 */

// Helper function to get environment variables
const getEnvVar = function(key, defaultValue) {
  // For browser environment, try to get from window.ENV if it exists
  if (typeof window !== 'undefined' && window.ENV && window.ENV[key]) {
    return window.ENV[key];
  }
  // For Node.js environment, try to get from process.env
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  // Fall back to default value
  return defaultValue;
};

// Initialize with default values
const AdMobConfig = {
  // App ID (fallback values)
  appId: {
    android: 'ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY',
    ios: 'ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY',
    web: ''
  },

  // Ad Unit IDs (fallback values)
  adUnits: {
    // Rewarded video ads - general purpose
    rewardedVideo: {
      production: 'ca-app-pub-XXXXXXXXXXXXXXXX/RRRRRRRRRR',
      test: 'ca-app-pub-3940256099942544/5224354917' // Google test ID
    },
    
    // Specialized rewarded video ads for different rewards
    rewardedVideoExtraLife: {
      production: 'ca-app-pub-XXXXXXXXXXXXXXXX/RRRRRRRRRR',
      test: 'ca-app-pub-3940256099942544/5224354917' // Google test ID
    },
    
    rewardedVideoPowerGem: {
      production: 'ca-app-pub-XXXXXXXXXXXXXXXX/RRRRRRRRRR',
      test: 'ca-app-pub-3940256099942544/5224354917' // Google test ID
    },
    
    rewardedVideoScoreMultiplier: {
      production: 'ca-app-pub-XXXXXXXXXXXXXXXX/RRRRRRRRRR',
      test: 'ca-app-pub-3940256099942544/5224354917' // Google test ID
    },
    
    // Interstitial ads - general purpose
    interstitial: {
      production: 'ca-app-pub-XXXXXXXXXXXXXXXX/IIIIIIIIII',
      test: 'ca-app-pub-3940256099942544/1033173712' // Google test ID
    },
    
    // Specialized interstitial ads
    interstitialLevelComplete: {
      production: 'ca-app-pub-XXXXXXXXXXXXXXXX/IIIIIIIIII',
      test: 'ca-app-pub-3940256099942544/1033173712' // Google test ID
    },
    
    interstitialGameOver: {
      production: 'ca-app-pub-XXXXXXXXXXXXXXXX/IIIIIIIIII',
      test: 'ca-app-pub-3940256099942544/1033173712' // Google test ID
    }
  },
  
  // Settings (also use environment variables with fallbacks)
  settings: {
    // Use test ads during development
    // Set ADMOB_USE_TEST_ADS=false in production environment
    useTestAds: getEnvVar('ADMOB_USE_TEST_ADS', 'true') !== 'false',
    
    // Enable/disable ads globally (useful for toggling during development)
    // Set ADMOB_ENABLED=false to disable ads completely
    adsEnabled: getEnvVar('ADMOB_ENABLED', 'true') !== 'false',
    
    // Frequency settings
    minTimeBetweenInterstitials: parseInt(getEnvVar('ADMOB_MIN_TIME_BETWEEN_ADS', '60000')), // 60 seconds
    interstitialFrequency: parseInt(getEnvVar('ADMOB_INTERSTITIAL_FREQUENCY', '3')), // Every 3 levels
    
    // Targeting options (optional)
    targeting: {
      maxAdContentRating: getEnvVar('ADMOB_MAX_CONTENT_RATING', 'PG'), // 'G', 'PG', 'T', or 'MA'
      tagForChildDirectedTreatment: getEnvVar('ADMOB_CHILD_DIRECTED', 'false') === 'true',
      tagForUnderAgeOfConsent: getEnvVar('ADMOB_UNDER_AGE_CONSENT', 'false') === 'true'
    }
  }
};

// Don't modify below this line
// ---------------------------

// Helper function to get the appropriate ad unit ID based on environment
AdMobConfig.getAdUnitId = function(adType) {
  // Support specific reward types when getting ad unit ID
  if (adType === 'rewardedVideo' && this.currentRewardType) {
    const specificAdType = 'rewardedVideo' + this.currentRewardType.charAt(0).toUpperCase() + this.currentRewardType.slice(1);
    if (this.adUnits[specificAdType]) {
      adType = specificAdType;
    }
  }
  
  if (!this.adUnits[adType]) {
    console.error(`Invalid ad type: ${adType}`);
    return null;
  }
  
  return this.settings.useTestAds ? 
    this.adUnits[adType].test : 
    this.adUnits[adType].production;
};

// Track the current reward type
AdMobConfig.currentRewardType = null;

// Load config from API
AdMobConfig.loadFromAPI = async function() {
  try {
    console.log('Loading AdMob configuration from API...');
    const response = await fetch('/api/games/wavelength-gems/admob-config');
    
    if (!response.ok) {
      throw new Error(`Failed to load AdMob config: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.success && data.config) {
      console.log('AdMob configuration loaded successfully from API');
      
      // Update the config with values from API
      this.appId = data.config.appId;
      this.adUnits = data.config.adUnits;
      this.settings = data.config.settings;
      
      return true;
    } else {
      console.error('Invalid API response format');
      return false;
    }
  } catch (error) {
    console.error('Error loading AdMob config from API:', error);
    console.log('Using default/fallback configuration');
    return false;
  }
};

// Initialize from window.ENV or use defaults
if (typeof window !== 'undefined') {
  // Initialize from window.ENV if available
  if (window.ENV) {
    // App IDs
    if (window.ENV.ADMOB_APP_ID_ANDROID) AdMobConfig.appId.android = window.ENV.ADMOB_APP_ID_ANDROID;
    if (window.ENV.ADMOB_APP_ID_IOS) AdMobConfig.appId.ios = window.ENV.ADMOB_APP_ID_IOS;
    if (window.ENV.ADMOB_APP_ID_WEB) AdMobConfig.appId.web = window.ENV.ADMOB_APP_ID_WEB;
    
    // Ad unit IDs (only update if env vars are present)
    if (window.ENV.ADMOB_REWARDED_VIDEO_PROD) {
      AdMobConfig.adUnits.rewardedVideo.production = window.ENV.ADMOB_REWARDED_VIDEO_PROD;
    }
    if (window.ENV.ADMOB_REWARDED_EXTRA_LIFE_PROD) {
      AdMobConfig.adUnits.rewardedVideoExtraLife.production = window.ENV.ADMOB_REWARDED_EXTRA_LIFE_PROD;
    }
    if (window.ENV.ADMOB_REWARDED_POWER_GEM_PROD) {
      AdMobConfig.adUnits.rewardedVideoPowerGem.production = window.ENV.ADMOB_REWARDED_POWER_GEM_PROD;
    }
    if (window.ENV.ADMOB_REWARDED_SCORE_MULTI_PROD) {
      AdMobConfig.adUnits.rewardedVideoScoreMultiplier.production = window.ENV.ADMOB_REWARDED_SCORE_MULTI_PROD;
    }
    if (window.ENV.ADMOB_INTERSTITIAL_PROD) {
      AdMobConfig.adUnits.interstitial.production = window.ENV.ADMOB_INTERSTITIAL_PROD;
    }
  }
  
  // Add to window object (without overriding if it already exists)
  window.AdMobConfig = window.AdMobConfig || AdMobConfig;
  
  // Load from API in the background (this will update the config when complete)
  AdMobConfig.loadFromAPI().then(success => {
    if (success) {
      console.log('AdMob configuration updated from API');
    }
  });
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdMobConfig;
}