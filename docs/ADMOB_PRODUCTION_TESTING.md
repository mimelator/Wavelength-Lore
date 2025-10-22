# AdMob Production Testing Guide

This guide provides detailed instructions for testing AdMob ads in a production environment.

## Prerequisites

1. **Google AdMob Account with Real Ad Units**
   - Active AdMob account with approved app
   - Production ad unit IDs (not test IDs)
   - App approved and live in AdMob console

2. **AWS Access**
   - AWS credentials with permissions to update AppRunner services
   - AWS CLI installed and configured

3. **Production Environment Access**
   - Access to the production environment where the game is hosted

## Step 1: Update Production Configuration

### Option 1: Using the Update Script

The easiest way to update your AdMob configuration in production is by using the `update-admob-config.js` script:

```bash
# Navigate to your project directory
cd /path/to/Wavelength-Lore

# Run the update script
node scripts/update-admob-config.js
```

Follow the prompts to enter your real AdMob ad unit IDs. The script will update the environment variables in AWS AppRunner.

### Option 2: Using AWS Console

1. Log in to the AWS Console
2. Navigate to AWS AppRunner
3. Select your service
4. Go to the "Configuration" tab
5. Click "Edit" for the environment variables section
6. Update the following environment variables:
   - `ADMOB_USE_TEST_ADS` = `false`
   - `ADMOB_ENABLED` = `true`
   - `ADMOB_REWARDED_VIDEO_PROD` = `your-real-rewarded-ad-unit-id`
   - `ADMOB_INTERSTITIAL_PROD` = `your-real-interstitial-ad-unit-id`
   - And any other specialized ad unit IDs
7. Save changes and wait for the service to redeploy

## Step 2: Verify Configuration

After updating the configuration and waiting for the service to redeploy:

1. Open your production website
2. Open the browser's developer tools (F12 or Right-click > Inspect)
3. Go to the Console tab
4. Look for AdMob initialization messages:
   ```
   🎬 Initializing Wavelength Gems Ad System...
   Loading AdMob configuration from API...
   AdMob configuration loaded successfully from API
   ```
5. Verify that test ads are disabled:
   ```
   AdMob settings: useTestAds=false, adsEnabled=true
   ```

## Step 3: Test Different Ad Types

### Using the Test Interface

If you've included the test interface in production (with special access), use the URL parameter `?adtest=true` to enable it:

```
https://your-production-url.com/games/wavelength-gems?adtest=true
```

This will show the test panel with buttons to trigger different ad types.

### Using the Demo Page

Alternatively, access the demo page directly:

```
https://your-production-url.com/examples/admob-integration-demo.html
```

### Manual Testing Within the Game

1. **Interstitial Ads**:
   - Play the game and complete levels
   - Interstitial ads should appear after every X levels (based on your frequency setting)

2. **Rewarded Video for Extra Life**:
   - Play until game over
   - Look for the "Watch Ad for Extra Life" option
   - Click it and verify the ad plays and rewards an extra life

3. **Rewarded Video for Power Gems**:
   - Look for the Power Gem button in the game interface
   - Click it and verify the ad plays and rewards power gems

4. **Rewarded Video for Score Multipliers**:
   - Look for the Score Multiplier button (if implemented)
   - Click it and verify the ad plays and rewards a score multiplier

## Step 4: Monitor and Debug

### Common Issues and Solutions

1. **Ads Not Loading**
   - Check console for error messages
   - Verify ad unit IDs are correct
   - Confirm the AdMob SDK is loading properly
   - Check for network issues or ad blockers

2. **Low Fill Rate**
   - This is normal for new ad units
   - Fill rate will improve over time as more impressions are served
   - Consider enabling mediation if fill rate remains low

3. **Ads Loading But Not Showing**
   - Check for z-index conflicts in your CSS
   - Verify the ad container is visible and properly sized
   - Look for JavaScript errors in the console

### AdMob Console Monitoring

Monitor your AdMob dashboard at https://apps.admob.com/ for:

1. **Impressions**: How many ads are being shown
2. **Click-through Rate (CTR)**: Percentage of ad clicks
3. **Revenue**: How much you're earning from ads
4. **Fill Rate**: Percentage of ad requests that are filled

## Step 5: Production Hardening

After successful testing, consider these production hardening steps:

1. **Remove or Restrict Test Interface**
   - Remove or add authentication to the test interface
   - Consider keeping it behind a feature flag for VIP users or developers

2. **Fine-tune Frequency and Timing**
   - Adjust `ADMOB_INTERSTITIAL_FREQUENCY` for better user experience
   - Adjust `ADMOB_MIN_TIME_BETWEEN_ADS` to avoid overwhelming users

3. **Implement A/B Testing**
   - Test different reward amounts
   - Test different ad placements
   - Monitor user engagement and revenue

4. **Add Fallbacks**
   - Implement fallback logic when ads fail to load
   - Consider alternative monetization for users where ads don't work

## Production Checklist

- [ ] Environment variables updated with real ad unit IDs
- [ ] `ADMOB_USE_TEST_ADS` set to `false`
- [ ] `ADMOB_ENABLED` set to `true`
- [ ] Service redeployed after configuration update
- [ ] Rewarded video ads tested and working
- [ ] Interstitial ads tested and working
- [ ] Proper rewards given after ad completion
- [ ] AdMob console showing impressions and revenue
- [ ] Error handling tested (e.g., no internet, ad blockers)
- [ ] User experience smooth and not disruptive

## References

- [AdMob Console](https://apps.admob.com/)
- [Google AdMob Documentation](https://developers.google.com/admob)
- [AdMob Implementation Guide](./ADMOB_INTEGRATION.md)
- [AdMob Testing Guide](./admob-testing-guide.md)