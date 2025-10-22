# AdMob Integration Guide for Wavelength Gems

This guide explains how to set up and configure Google AdMob for the Wavelength Gems game, both for local development and production environments.

## Table of Contents

1. [Overview](#overview)
2. [Environment Variables](#environment-variables)
3. [Local Development Setup](#local-development-setup)
4. [Production Deployment](#production-deployment)
5. [AdMob Configuration System](#admob-configuration-system)
6. [Testing Ads](#testing-ads)
7. [Troubleshooting](#troubleshooting)

## Overview

The Wavelength Gems game uses Google AdMob for monetization through various ad formats:

- **Rewarded Video Ads**: Allow players to earn rewards by watching video ads
- **Interstitial Ads**: Full-screen ads that appear at natural transition points

All ad unit IDs and configuration settings are stored as environment variables for security and flexibility.

## Environment Variables

The following environment variables are used for AdMob configuration:

| Variable Name | Description | Default |
|---------------|-------------|---------|
| `ADMOB_APP_ID_ANDROID` | Android App ID | Required |
| `ADMOB_APP_ID_IOS` | iOS App ID | Required |
| `ADMOB_APP_ID_WEB` | Web App ID | Optional |
| `ADMOB_REWARDED_VIDEO_PROD` | Rewarded video ad unit ID | Required |
| `ADMOB_REWARDED_EXTRA_LIFE_PROD` | Extra life rewarded video ad unit ID | Optional |
| `ADMOB_REWARDED_POWER_GEM_PROD` | Power gem rewarded video ad unit ID | Optional |
| `ADMOB_REWARDED_SCORE_MULTI_PROD` | Score multiplier rewarded video ad unit ID | Optional |
| `ADMOB_INTERSTITIAL_PROD` | Interstitial ad unit ID | Required |
| `ADMOB_INTERSTITIAL_LEVEL_PROD` | Level-specific interstitial ad unit ID | Optional |
| `ADMOB_INTERSTITIAL_GAMEOVER_PROD` | Game over interstitial ad unit ID | Optional |
| `ADMOB_USE_TEST_ADS` | Use test ads? | `false` (prod), `true` (dev) |
| `ADMOB_ENABLED` | Enable ads? | `true` |
| `ADMOB_MIN_TIME_BETWEEN_ADS` | Minimum time between ads (ms) | `60000` |
| `ADMOB_INTERSTITIAL_FREQUENCY` | Show interstitial every X levels | `3` |
| `ADMOB_MAX_CONTENT_RATING` | Max content rating | `PG` |
| `ADMOB_CHILD_DIRECTED` | Child-directed treatment? | `false` |
| `ADMOB_UNDER_AGE_CONSENT` | Under age of consent? | `false` |

## Local Development Setup

For local development, we've created a script to help you set up your AdMob environment variables:

1. Run the setup script:
   ```bash
   node scripts/setup-admob-local.js
   ```

2. The script will:
   - Create or update your `.env` file with AdMob variables
   - Offer to use Google's test ad unit IDs
   - Prompt for custom values or use defaults

3. Install the dotenv package if you haven't already:
   ```bash
   npm install dotenv --save
   ```

4. Make sure your app loads the environment variables:
   ```javascript
   require('dotenv').config();
   ```

## Production Deployment

For AWS AppRunner production deployment, we've created a script to update environment variables:

1. Run the update script:
   ```bash
   node scripts/update-admob-config.js
   ```

2. The script will:
   - Prompt for AWS credentials
   - Fetch your current AppRunner configuration
   - Ask for AdMob environment variables
   - Update your AWS AppRunner service with the new values

3. Your service will be updated with the new environment variables and will apply them on the next deployment.

## AdMob Configuration System

The AdMob configuration system is designed with a multi-layered approach to ensure flexibility and security:

1. **Server-side Environment Variables**: All ad unit IDs are stored as environment variables on the server.

2. **API Endpoint**: An API endpoint (`/game-api/wavelength-gems/admob-config`) provides the configuration to the client.

3. **Window.ENV Object**: Environment variables are passed to the client via the `window.ENV` object in the template.

4. **Fallback Hierarchy**:
   - The client first tries to load from the API
   - If unavailable, it falls back to `window.ENV`
   - If neither is available, it uses default test ad unit IDs

This approach ensures:
- No hardcoded ad unit IDs in the source code
- Easy environment switching between development and production
- Ability to update ad unit IDs without code changes

### Configuration Code

The AdMob configuration is handled by the `AdMobConfig` class in `static/js/games/wavelength-gems/admob-config.js`:

```javascript
class AdMobConfig {
  constructor() {
    this.config = {};
    this.initialized = false;
    this.loadFromEnv();
    this.loadFromAPI();
  }
  
  // Load configuration from window.ENV
  loadFromEnv() {
    if (window.ENV && window.ENV.ADMOB) {
      this.config = { ...this.config, ...window.ENV.ADMOB };
      this.initialized = true;
    }
  }
  
  // Load configuration from API
  async loadFromAPI() {
    try {
      const response = await fetch('/game-api/wavelength-gems/admob-config');
      if (response.ok) {
        const data = await response.json();
        this.config = { ...this.config, ...data };
        this.initialized = true;
      }
    } catch (error) {
      console.error('Failed to load AdMob config from API:', error);
    }
  }
  
  // Get ad unit ID with fallbacks
  getAdUnitId(adType) {
    if (!this.initialized) {
      console.warn('AdMob config not initialized, using test ad units');
    }
    
    return this.getEnvVar(`ADMOB_${adType}_PROD`) || TEST_AD_UNITS[adType];
  }
  
  // Helper to get environment variable
  getEnvVar(name) {
    return this.config[name] || null;
  }
}
```

## Testing Ads

For testing AdMob ads during development:

1. Use the test ad unit IDs provided by Google:
   - Set `ADMOB_USE_TEST_ADS=true` in your `.env` file
   - Or run the `setup-admob-local.js` script and choose to use test ad units

2. Google's test ad unit IDs:
   - Android App ID: `ca-app-pub-3940256099942544~3347511713`
   - iOS App ID: `ca-app-pub-3940256099942544~1458002511`
   - Rewarded Video: `ca-app-pub-3940256099942544/5224354917`
   - Interstitial: `ca-app-pub-3940256099942544/1033173712`

3. When testing ads:
   - You'll see test ads with clear "Test Ad" labeling
   - No real impressions or clicks are counted
   - You can click on these ads without violating AdMob policies

## Troubleshooting

Common issues and solutions:

1. **Ad not loading:**
   - Check browser console for errors
   - Verify environment variables are set correctly
   - Ensure `ADMOB_ENABLED` is set to `true`

2. **Wrong ad unit IDs:**
   - Check the loading order: API → window.ENV → default test IDs
   - Inspect network requests to verify the API is returning correct values

3. **Test ads not showing:**
   - Ensure `ADMOB_USE_TEST_ADS` is set to `true`
   - Check that the app is correctly initialized with test ad units

4. **Production ads not showing:**
   - Ensure `ADMOB_USE_TEST_ADS` is set to `false`
   - Verify the correct production ad unit IDs are set in environment variables
   - Check for ad blockers in the browser

5. **AWS AppRunner issues:**
   - Verify AWS credentials have appropriate permissions
   - Check that environment variables are correctly set in AWS console
   - Ensure the service has been redeployed after updating environment variables

For more information on AdMob integration, refer to the [Google AdMob Documentation](https://developers.google.com/admob).