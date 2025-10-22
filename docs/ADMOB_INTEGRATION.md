````markdown
# Google AdMob Integration Guide

This document provides step-by-step instructions for integrating Google AdMob rewarded video ads into Wavelength Gems.

## Prerequisites

1. Google AdMob account
2. Web app setup in AdMob console
3. Ad unit IDs for rewarded video ads

## Recent Updates (NEW)

**We've implemented a new modular approach to AdMob integration:**

- **ad-system.js** - Core ad system implementation with flexible provider support
- **admob-config.js** - Centralized configuration file for ad unit IDs and settings
- **examples/admob-integration-demo.html** - Demo page showcasing the integration

## Implementation Steps

### Step 1: Create AdMob Account & App

1. Go to [AdMob](https://admob.google.com/) and sign in with your Google account
2. Create a new app:
   - Select "Apps" → "Add App"
   - Choose "Web" platform
   - Enter "Wavelength Gems" as the name
   - Enter your website URL
   - Click "Add App"

### Step 2: Create Ad Units

1. In your AdMob dashboard, navigate to "Apps" → "Your App" → "Ad units"
2. Click "Create Ad Unit"
3. Select "Rewarded" ad format
4. Name your ad unit (e.g., "Wavelength Gems Rewarded Video")
5. Configure settings (default settings are fine for initial setup)
6. Click "Create Ad Unit"
7. Note down your Ad Unit ID (e.g., "ca-app-pub-XXXXXXXXXX/YYYYYYYYYY")
8. Optionally, also create an "Interstitial" ad unit for level breaks

### Step 3: Add Required Scripts

Add the following scripts to your game's HTML. Place them just before the closing `</body>` tag in the `wavelength-gems.ejs` file:

```html
<!-- Google AdMob SDK (only in production) -->
<script async src="https://imasdk.googleapis.com/js/sdkloader/ima3.js"></script>

<!-- AdMob Configuration -->
<script src="/static/js/games/wavelength-gems/admob-config.js"></script>

<!-- Ad System -->
<script src="/static/js/games/wavelength-gems/ad-system.js"></script>
```

### Step 4: Configure Your Ad Units

Update the `admob-config.js` file to use your real AdMob ad unit IDs:

```javascript
// AdMob Configuration for Wavelength Gems
const AdMobConfig = {
  // App ID (replace with your actual ID)
  appId: {
    android: 'ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY', // Your Android app ID
    ios: 'ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY',     // Your iOS app ID
    web: ''                                            // Web app ID (if applicable)
  },

  // Ad Unit IDs (replace with your actual IDs)
  adUnits: {
    // Rewarded video ads - general purpose
    rewardedVideo: {
      production: 'ca-app-pub-XXXXXXXXXXXXXXXX/RRRRRRRRRR', // Your production ad unit ID
      test: 'ca-app-pub-3940256099942544/5224354917'        // Google test ad unit ID
    },
    
    // Specialized rewarded video ads for different rewards
    rewardedVideoExtraLife: {
      production: 'ca-app-pub-XXXXXXXXXXXXXXXX/RRRRRRRRRR',
      test: 'ca-app-pub-3940256099942544/5224354917'
    },
    
    // Other ad units...
  },
  
  // Settings
  settings: {
    // Use test ads during development
    useTestAds: true,  // Set to false for production
    
    // Other settings...
  }
};
```
```

### Step 5: Implement Real AdMob Integration

Replace the placeholder implementation in `ad-system.js` with actual AdMob methods:

```javascript
initAdMob: function() {
  console.log('Initializing Google AdMob...');
  
  // Initialize Google Mobile Ads SDK
  window.googletag = window.googletag || {cmd: []};
  
  this.provider = {
    name: 'AdMob',
    
    adUnitIds: {
      rewarded: 'ca-app-pub-XXXXXXXXXX/YYYYYYYYYY', // Your rewarded video ad unit ID
      interstitial: 'ca-app-pub-XXXXXXXXXX/ZZZZZZZZZZ', // Your interstitial ad unit ID
      banner: 'ca-app-pub-XXXXXXXXXX/WWWWWWWWWW' // Your banner ad unit ID (optional)
    },
    
    loadRewardedVideo: () => {
      console.log('Loading AdMob rewarded video...');
      
      window.googletag.cmd.push(() => {
        // Define rewarded ad slot
        const rewardedSlot = window.googletag.defineOutOfPageSlot(
          this.provider.adUnitIds.rewarded,
          window.googletag.enums.OutOfPageFormat.REWARDED
        );
        
        if (rewardedSlot) {
          rewardedSlot.addService(window.googletag.pubads());
          
          // Set callback for ad loaded event
          window.googletag.pubads().addEventListener('slotOnload', (event) => {
            if (event.slot === rewardedSlot) {
              console.log('AdMob rewarded video loaded and ready');
              this.rewardedVideoReady = true;
              this.rewardedSlot = rewardedSlot; // Store reference
            }
          });
          
          // Set callback for ad failed to load
          window.googletag.pubads().addEventListener('slotResponseReceived', (event) => {
            if (event.slot === rewardedSlot && !this.rewardedVideoReady) {
              console.log('AdMob rewarded video failed to load');
              // Retry after delay
              setTimeout(() => this.provider.loadRewardedVideo(), 60000);
            }
          });
          
          // Enable services and display ad
          window.googletag.enableServices();
          window.googletag.display(rewardedSlot);
        } else {
          console.error('Failed to define rewarded ad slot');
        }
      });
    },
    
    showRewardedVideo: (rewardCallback) => {
      if (!this.rewardedVideoReady || !this.rewardedSlot) {
        console.log('Rewarded video not ready');
        return false;
      }
      
      console.log('Displaying AdMob rewarded video');
      
      // Show loading UI
      this.showAdLoadingUI();
      
      window.googletag.cmd.push(() => {
        // Set reward callback
        window.googletag.pubads().addEventListener('rewardedSlotClosed', (event) => {
          this.hideAdLoadingUI();
          this.rewardedVideoReady = false; // Mark as consumed
          this.provider.loadRewardedVideo(); // Load next ad
          
          // For consistency with our prototype, we'll consider a closed ad as completed
          if (rewardCallback && typeof rewardCallback === 'function') {
            rewardCallback();
          }
        });
        
        window.googletag.pubads().addEventListener('rewardedSlotGranted', (event) => {
          const reward = event.payload;
          console.log(`AdMob reward granted: ${reward.amount} ${reward.type}`);
          
          // We'll handle the reward in the closed event for simplicity
        });
        
        // Display the rewarded ad
        window.googletag.display(this.rewardedSlot);
      });
      
      return true;
    },
    
    loadInterstitial: () => {
      // Similar implementation for interstitial ads
      console.log('Loading AdMob interstitial...');
      
      window.googletag.cmd.push(() => {
        // Define interstitial ad slot
        const interstitialSlot = window.googletag.defineOutOfPageSlot(
          this.provider.adUnitIds.interstitial,
          window.googletag.enums.OutOfPageFormat.INTERSTITIAL
        );
        
        if (interstitialSlot) {
          interstitialSlot.addService(window.googletag.pubads());
          
          // Set callback for ad loaded event
          window.googletag.pubads().addEventListener('slotOnload', (event) => {
            if (event.slot === interstitialSlot) {
              console.log('AdMob interstitial loaded and ready');
              this.interstitialReady = true;
              this.interstitialSlot = interstitialSlot; // Store reference
            }
          });
          
          // Enable services and display ad
          window.googletag.enableServices();
          window.googletag.display(interstitialSlot);
        } else {
          console.error('Failed to define interstitial ad slot');
        }
      });
    },
    
    showInterstitial: (completionCallback) => {
      if (!this.interstitialReady || !this.interstitialSlot) {
        console.log('Interstitial not ready');
        if (completionCallback) completionCallback();
        return false;
      }
      
      console.log('Displaying AdMob interstitial');
      
      // Show loading UI
      this.showAdLoadingUI();
      
      window.googletag.cmd.push(() => {
        // Set closed callback
        window.googletag.pubads().addEventListener('slotClosed', (event) => {
          if (event.slot === this.interstitialSlot) {
            this.hideAdLoadingUI();
            this.interstitialReady = false; // Mark as consumed
            this.provider.loadInterstitial(); // Load next ad
            
            if (completionCallback && typeof completionCallback === 'function') {
              completionCallback();
            }
          }
        });
        
        // Display the interstitial ad
        window.googletag.display(this.interstitialSlot);
      });
      
      return true;
    }
  };
  
  // Initial ad loading
  this.provider.loadRewardedVideo();
  this.provider.loadInterstitial();
}
```

### Step 6: Update Rewarded Video Display Method

Update the `showRewardedAd` method in the AdSystem to use the real AdMob methods:

```javascript
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
  
  // Track last ad shown time
  this.lastAdShownTime = Date.now();
  
  // Use the provider's showRewardedVideo method
  if (this.provider && typeof this.provider.showRewardedVideo === 'function') {
    return this.provider.showRewardedVideo(rewardCallback);
  }
  
  return false;
}
```

### Step 7: Add Game Integration Points

Add these integration points to your game:

1. **Extra Life After Game Over**:

```javascript
// In your game over handling code:
function handleGameOver() {
  // Show game over UI
  showGameOverScreen();
  
  // Offer rewarded ad for extra life
  if (window.wavelengthAds) {
    // Add button to game over screen
    const continueButton = document.createElement('button');
    continueButton.textContent = 'Watch Ad for Extra Life';
    continueButton.classList.add('continue-button');
    continueButton.addEventListener('click', () => {
      window.wavelengthAds.offerExtraLife();
    });
    
    document.getElementById('gameOverScreen').appendChild(continueButton);
  }
}
```

2. **Special Gem Power-Up**:

```javascript
// Add a special power button to the game controls
function addPowerUpButton() {
  const powerUpButton = document.createElement('button');
  powerUpButton.textContent = '✨ Power Up';
  powerUpButton.classList.add('power-button');
  powerUpButton.addEventListener('click', () => {
    if (window.wavelengthAds) {
      window.wavelengthAds.offerSpecialGem();
    }
  });
  
  document.querySelector('.game-controls').appendChild(powerUpButton);
}

// Call this during game initialization
addPowerUpButton();
```

3. **Level Complete Integration**:

```javascript
// In your level completion code:
function onLevelComplete(level) {
  // Show level complete UI
  showLevelCompleteScreen(level);
  
  // Notify ad system (will show interstitial ad based on frequency)
  if (window.wavelengthAds) {
    window.wavelengthAds.onLevelComplete(level);
  }
  
  // Continue to next level after delay or button press
  setTimeout(() => {
    loadNextLevel(level + 1);
  }, 2000);
}
```

### Step 8: Test With Test Ads

During development, use AdMob's test ad unit IDs to avoid policy violations. Our new configuration system makes this easy - just set `useTestAds: true` in the settings:

```javascript
// In admob-config.js
settings: {
  // Use test ads during development
  useTestAds: true,
  
  // Other settings...
}
```

Test ad unit IDs are already included in the configuration file:

```javascript
rewardedVideo: {
  production: 'ca-app-pub-XXXXXXXXXXXXXXXX/RRRRRRRRRR',
  test: 'ca-app-pub-3940256099942544/5224354917' // Google test ID
},

interstitial: {
  production: 'ca-app-pub-XXXXXXXXXXXXXXXX/IIIIIIIIII',
  test: 'ca-app-pub-3940256099942544/1033173712' // Google test ID
}
```

### Step 8a: Use the Demo Page

We've created a demo page that allows you to test the AdMob integration without modifying the game:

1. Open `/examples/admob-integration-demo.html` in your browser
2. Click "Initialize Ad System" to start the ad system
3. Test different ad types using the buttons
4. Check the console for debugging information

### Step 9: Implement Privacy Compliance

For GDPR/CCPA compliance, add a consent mechanism before initializing ads:

```javascript
// Add to the beginning of AdSystem.init
init: function(options = {}) {
  console.log('🎬 Initializing Wavelength Gems Ad System...');
  
  // Check if we need to show consent dialog
  if (!this.hasUserConsent()) {
    this.showConsentDialog(() => {
      // Initialize after consent
      this.initializeAfterConsent(options);
    });
    return;
  }
  
  // Consent already given, proceed with initialization
  this.initializeAfterConsent(options);
},

// Helper methods for consent
hasUserConsent: function() {
  try {
    return localStorage.getItem('wavelength_ads_consent') === 'true';
  } catch (e) {
    return false;
  }
},

setUserConsent: function(hasConsent) {
  try {
    localStorage.setItem('wavelength_ads_consent', hasConsent);
  } catch (e) {
    console.error('Error saving consent:', e);
  }
},

showConsentDialog: function(callback) {
  // Create consent dialog
  const consentDialog = document.createElement('div');
  consentDialog.className = 'ad-consent-dialog';
  consentDialog.innerHTML = `
    <div class="consent-container">
      <h2>Ad Personalization</h2>
      <p>We use personalized ads to support this game. This helps us keep the game free while covering hosting costs.</p>
      <p>Your consent is required to show personalized ads based on your interests.</p>
      <div class="consent-buttons">
        <button id="consent-accept">I Consent</button>
        <button id="consent-reject">No Thanks</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(consentDialog);
  
  // Style the dialog
  const style = document.createElement('style');
  style.textContent = `
    .ad-consent-dialog {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    }
    .consent-container {
      background: #2a2a4a;
      border: 2px solid #8b5cf6;
      border-radius: 12px;
      padding: 20px;
      max-width: 500px;
      text-align: center;
    }
    .consent-container h2 {
      color: #ffd700;
      margin-top: 0;
    }
    .consent-container p {
      color: #e0e0e0;
      margin-bottom: 15px;
    }
    .consent-buttons {
      display: flex;
      justify-content: center;
      gap: 15px;
    }
    .consent-buttons button {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }
    #consent-accept {
      background: #8b5cf6;
      color: white;
    }
    #consent-reject {
      background: #4a4a6a;
      color: #d0d0d0;
    }
  `;
  
  document.head.appendChild(style);
  
  // Add event listeners
  document.getElementById('consent-accept').addEventListener('click', () => {
    this.setUserConsent(true);
    consentDialog.remove();
    callback();
  });
  
  document.getElementById('consent-reject').addEventListener('click', () => {
    this.setUserConsent(false);
    this.userOptedOut = true;
    consentDialog.remove();
    callback();
  });
}
```

### Step 10: Launch in Production

Once testing is complete:

1. Replace test ad unit IDs with your real production ad unit IDs
2. Verify the ads are displaying correctly on your production site
3. Monitor the AdMob dashboard for performance metrics

## Testing

To test your implementation:

1. Use the demo page at `/examples/admob-integration-demo.html` to verify the basic functionality
2. Use Chrome DevTools console to check for any errors
3. Verify ad loading messages appear in the console
4. Test ad displays at different integration points
5. Check that rewards are properly granted after ad completion

## Troubleshooting

Common issues:

1. **Ads not loading**: Check console for errors, verify ad unit IDs are correct
2. **Ads loading but not showing**: Ensure CSS styles aren't blocking ad display
3. **Reward not granted**: Verify event listeners are properly connected
4. **Low fill rate**: This is common during initial launch, will improve with more impressions
5. **AdMob SDK not detected**: Make sure the SDK script is properly included and loaded before the ad system

## New Ad System Features

Our updated ad system includes several new features:

1. **Modular Provider System**: Support for multiple ad providers (AdMob, Unity Ads, IronSource)
2. **Centralized Configuration**: All ad unit IDs and settings in one config file
3. **Specialized Reward Types**: Support for different ad units based on reward type
4. **User Opt-Out**: Users can opt out of ads via preferences
5. **Automatic Simulation Mode**: Falls back to simulation when SDK is not detected (helpful for development)
6. **Platform Detection**: Automatically detects Android/iOS/Web platform

## Next Steps

1. **Optimize Ad Placement**: Use analytics to find optimal placement points
2. **A/B Test Different Rewards**: Try different incentives to see what drives the highest engagement
3. **Add More Ad Formats**: Consider banner ads for non-intrusive additional revenue
4. **Implement Ad Mediation**: Use AdMob mediation to fill with other ad networks when fill rate is low
