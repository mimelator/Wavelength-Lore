# AdMob Testing Guide for Wavelength Gems

This guide provides step-by-step instructions for testing AdMob integration in the Wavelength Gems game.

## Setup for Testing

1. First, configure your local environment variables:

   ```bash
   node scripts/setup-admob-local.js
   ```

2. When prompted, configure these values for effective testing:

   ```
   ADMOB_USE_TEST_ADS: true               # Required for test ads
   ADMOB_ENABLED: true                    # Enable ads
   ADMOB_INTERSTITIAL_FREQUENCY: 1        # Show after every level (for testing)
   ADMOB_MIN_TIME_BETWEEN_ADS: 5000       # Only 5 seconds between ads (for testing)
   ```

3. Start your local development server:

   ```bash
   npm start
   ```

4. Open the game in your browser (typically at http://localhost:3000/games/wavelength-gems)

## Using the Test Panel

A special test panel has been added to help you trigger and test ads. Look for the black semi-transparent panel in the bottom right corner of the game screen. It includes:

- **Test Interstitial Ad**: Triggers an interstitial ad immediately
- **Test Extra Life Ad**: Shows the extra life rewarded video offer
- **Test Power Gem Ad**: Shows the power gem rewarded video offer
- **Test Score Multiplier Ad**: Shows the score multiplier rewarded video offer
- **Hide/Show Panel**: Collapses or expands the panel

The panel also displays your current configuration:
- Current interstitial frequency
- Minimum time between ads
- Whether test ads are enabled
- Whether ads are enabled globally

## Testing Ad Triggers

### Interstitial Ads

Interstitial ads should appear automatically:
1. Complete a level (with `ADMOB_INTERSTITIAL_FREQUENCY: 1`, it will show after every level)
2. You'll see a loading indicator followed by the test ad
3. Close the ad to continue

If interstitials aren't showing automatically:
1. Check the browser console for errors
2. Verify your environment variables were set correctly
3. Use the test panel to manually trigger an interstitial

### Rewarded Video Ads

Test each rewarded video type:
1. Use the test panel buttons to trigger each type of rewarded ad
2. Click "Watch Video" in the offer dialog
3. The test ad should appear
4. After closing the ad, the reward should be granted

## What to Look For

### Test Ad Indicators

When using test ads, look for:
1. Clear "Test Ad" labeling on all ads
2. Test ad borders or backgrounds
3. Demo/sample creative content
4. No real ad metrics being counted

### Proper Ad Flow

Verify the ad flow works correctly:
1. Loading indicator appears before the ad
2. Ad loads and displays properly
3. Ad can be closed
4. Rewards are granted after rewarded videos
5. Game state is preserved properly after ad closes

### Ad Frequency and Timing

Check that timing controls work:
1. `ADMOB_INTERSTITIAL_FREQUENCY` controls how often interstitials appear
2. `ADMOB_MIN_TIME_BETWEEN_ADS` prevents ads from appearing too frequently
3. Test by changing these values and observing behavior

## Troubleshooting

If ads aren't working as expected:

1. **Check Console Errors**: Open your browser's developer console (F12) to look for any errors

2. **Verify Environment Variables**: Make sure your `.env` file contains the correct settings

3. **Test AdMob Config**: In the browser console, type:
   ```javascript
   console.log(window.AdMobConfig.settings);
   ```
   This will show your current configuration

4. **Force Test Mode**: In the browser console, type:
   ```javascript
   window.AdMobConfig.settings.useTestAds = true;
   ```

5. **Reset Ad Timer**: If you're testing interstitials but hitting the time limit:
   ```javascript
   window.wavelengthAds.lastAdShownTime = 0;
   ```

## Cleaning Up

When you're done testing, remember to:

1. Remove the test panel before deploying to production:
   - Remove the line that includes `admob-test-interface.js` from `wavelength-gems.ejs`

2. Reset your environment variables for production:
   ```bash
   node scripts/setup-admob-local.js
   ```
   Set:
   ```
   ADMOB_USE_TEST_ADS: false
   ADMOB_INTERSTITIAL_FREQUENCY: 3  # Or your preferred value
   ADMOB_MIN_TIME_BETWEEN_ADS: 60000  # 1 minute between ads
   ```