/**
 * Google IMA (Interactive Media Ads) Configuration
 * 
 * This configuration is for real video advertising using Google's IMA SDK.
 * Unlike Unity Ads, Google IMA is specifically designed for web browsers
 * and provides actual revenue-generating video advertisements.
 * 
 * Setup Instructions:
 * 1. Get Google Ad Manager account: https://admanager.google.com/
 * 2. Or use Google AdSense: https://www.google.com/adsense/
 * 3. Create video ad units
 * 4. Generate VAST ad tag URL
 * 5. Update adTagUrl below with your real ad tag
 * 
 * Documentation:
 * - Google IMA SDK: https://developers.google.com/interactive-media-ads/docs/sdks/html5/
 * - Ad Manager: https://support.google.com/admanager/
 * - VAST specification: https://www.iab.com/guidelines/vast/
 */

const GoogleIMAConfig = {
  // IMPORTANT: Replace this with your actual VAST ad tag URL from Google Ad Manager or AdSense
  // This is a test ad tag that serves sample video ads for development
  // You MUST replace this with your real ad tag for production revenue
  adTagUrl: 'https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/single_ad_samples&sz=640x480&cust_params=sample_ct%3Dlinear&ciu_szs=300x250%2C728x90&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s&correlator=',
  
  // Alternative test ad tags for development:
  // Google IMA test ad tag (video ads): 'https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/single_ad_samples&sz=640x480&cust_params=sample_ct%3Dlinear&ciu_szs=300x250%2C728x90&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s&correlator='
  // Skippable test ad: 'https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/single_ad_samples&sz=640x480&cust_params=sample_ct%3Dskippablelinear&ciu_szs=300x250%2C728x90&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s&correlator='
  // Rewarded test ad: 'https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/single_ad_samples&sz=640x480&cust_params=sample_ct%3Drewardedlinear&ciu_szs=300x250%2C728x90&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s&correlator='
  
  // Ad display settings
  settings: {
    // Enable console logging for debugging
    enableLogging: true,
    
    // Minimum time between ad requests (2 minutes)
    minTimeBetweenAds: 120000,
    
    // Maximum ads per day per user
    maxAdsPerDay: 20,
    
    // Minimum watch time before allowing skip (15 seconds)
    minWatchTime: 15000,
    
    // Video player settings
    videoWidth: 640,
    videoHeight: 480,
    
    // Auto-play video content after ad completion
    autoPlayVideoContent: true,
    
    // Enable fullscreen ads
    enableFullscreen: true
  },
  
  // Reward configuration for game integration
  rewards: {
    // Retries granted for watching a complete video ad
    watchVideoRetries: 3,
    
    // Bonus retries for first ad of the day
    dailyBonus: 2,
    
    // Minimum completion percentage for reward (80%)
    minimumCompletion: 0.8
  },
  
  // Ad placement configuration
  placement: {
    // When to show rewarded video offers
    triggers: {
      // Show offer when user runs out of retries
      onRetriesExhausted: true,
      
      // Show offer every N failed attempts
      onFailureStreak: 5,
      
      // Show offer at certain score milestones
      onScoreMilestones: [1000, 5000, 10000],
      
      // Maximum ad offers per session
      maxOffersPerSession: 5
    },
    
    // Ad frequency controls
    frequency: {
      // Minimum session time before first ad (5 minutes)
      minSessionTime: 300000,
      
      // Minimum time between ad offers (2 minutes)
      minTimeBetweenOffers: 120000,
      
      // Respect user's previous decline for this time (10 minutes)
      respectDeclineFor: 600000
    }
  },
  
  // Analytics and tracking
  analytics: {
    // Track ad performance
    trackEvents: true,
    
    // Events to track
    events: {
      adRequested: true,
      adLoaded: true,
      adStarted: true,
      adCompleted: true,
      adSkipped: true,
      adError: true,
      rewardGranted: true
    },
    
    // Custom analytics endpoint (optional)
    // analyticsEndpoint: '/api/analytics/ads'
  },
  
  // Error handling and fallbacks
  errorHandling: {
    // Retry failed ad requests
    enableRetry: true,
    
    // Maximum retry attempts
    maxRetryAttempts: 3,
    
    // Delay between retry attempts (5 seconds)
    retryDelay: 5000,
    
    // Show error messages to user
    showErrorMessages: false,
    
    // Fallback behavior when ads fail
    fallbackBehavior: 'graceful' // 'graceful' or 'strict'
  },
  
  // Development settings
  development: {
    // Use test ads in development
    useTestAds: true,
    
    // Bypass ad cooldowns for testing
    bypassCooldowns: false,
    
    // Mock ad completions for testing
    mockAdCompletion: false,
    
    // Log all events for debugging
    verboseLogging: true
  }
};

// Production vs Development configuration
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  // Development settings
  GoogleIMAConfig.settings.enableLogging = true;
  GoogleIMAConfig.development.verboseLogging = true;
  GoogleIMAConfig.settings.minTimeBetweenAds = 30000; // 30 seconds for testing
  GoogleIMAConfig.settings.maxAdsPerDay = 50; // Higher limit for testing
} else {
  // Production settings
  GoogleIMAConfig.settings.enableLogging = false;
  GoogleIMAConfig.development.verboseLogging = false;
  
  // TODO: Replace with your actual production ad tag URL
  // GoogleIMAConfig.adTagUrl = 'YOUR_PRODUCTION_AD_TAG_URL_HERE';
  
  console.warn('Google IMA: Remember to update adTagUrl with your production ad tag!');
}

// Global export
window.GoogleIMAConfig = GoogleIMAConfig;

// Configuration validation
function validateGoogleIMAConfig() {
  const errors = [];
  
  if (!GoogleIMAConfig.adTagUrl) {
    errors.push('Ad tag URL is required');
  }
  
  if (!GoogleIMAConfig.adTagUrl.includes('vast') && !GoogleIMAConfig.adTagUrl.includes('output=vast')) {
    console.warn('Ad tag URL should include VAST output format for video ads');
  }
  
  if (GoogleIMAConfig.rewards.watchVideoRetries < 1) {
    errors.push('Reward amount must be at least 1');
  }
  
  if (errors.length > 0) {
    console.error('Google IMA Configuration Errors:', errors);
    return false;
  }
  
  return true;
}

// Validate configuration on load
if (!validateGoogleIMAConfig()) {
  console.error('Google IMA configuration is invalid. Please check the settings.');
}

/**
 * How to get your own ad tag URL:
 * 
 * Option 1: Google Ad Manager (Best for revenue)
 * 1. Sign up at: https://admanager.google.com/
 * 2. Create new inventory > Ad units
 * 3. Set up video ad unit
 * 4. Generate tags > Choose "Google Publisher Tag (GPT)"
 * 5. Select VAST tag option
 * 6. Copy the generated VAST URL
 * 
 * Option 2: Google AdSense (Easier setup)
 * 1. Sign up at: https://www.google.com/adsense/
 * 2. Create video ad unit
 * 3. Get VAST tag URL from ad unit settings
 * 
 * Option 3: Third-party ad networks
 * - SpotX: https://www.spotx.tv/
 * - JW Player: https://www.jwplayer.com/
 * - Brightcove: https://www.brightcove.com/
 * - Any VAST-compliant ad server
 * 
 * Test your ad tag:
 * - Use Google's Video Suite Inspector: https://googleads.github.io/googleads-ima-html5/vsi/
 * - Validate VAST XML: https://developers.google.com/interactive-media-ads/docs/sdks/html5/vastinspector
 */