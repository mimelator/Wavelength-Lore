# AdMob Production Testing Quick Reference

This is a quick reference guide for testing AdMob integration with real ads in production.

## Step 1: Update Environment Variables

Use the `update-admob-config.js` script to update your environment variables in AWS AppRunner:

```bash
node scripts/update-admob-config.js
```

You'll need to provide:
- Real AdMob ad unit IDs for rewarded video and interstitial ads
- Set `ADMOB_USE_TEST_ADS` to `false`
- Set `ADMOB_ENABLED` to `true`

## Step 2: Access Test Interface in Production

After the service redeploys, visit your production site with the test parameter:

```
https://your-production-url.com/games/wavelength-gems?adtest=true
```

Or access the standalone test page:

```
https://your-production-url.com/examples/admob-integration-demo.html
```

## Step 3: Test Different Ad Types

Using the test interface:
- Click "Test Interstitial Ad" to test interstitial ads
- Click "Test Extra Life Ad" to test rewarded video for extra lives
- Click "Test Power Gem Ad" to test rewarded video for power gems
- Click "Test Score Multiplier Ad" to test rewarded video for score multipliers

## Step 4: Check Console for Diagnostics

Open browser developer tools (F12) and monitor the console for:
- Ad initialization messages
- Loading status
- Error messages

## Step 5: Monitor AdMob Console

Check your AdMob dashboard at https://apps.admob.com/ for:
- Ad impressions
- Fill rate
- Revenue

## Troubleshooting

If ads don't appear:
1. Check console for errors
2. Verify ad unit IDs are correct
3. Confirm environment variables are properly set
4. Check AdMob console for policy violations
5. Try disabling any ad blockers

## VIP User Testing

For testing with specific VIP users:
1. Add their user IDs to the whitelist in the database
2. Have them log in and visit the game
3. Monitor their sessions for ad impressions

## Rollback Procedure

If issues occur:
1. Run the update script again and set `ADMOB_USE_TEST_ADS` back to `true`
2. Or, set `ADMOB_ENABLED` to `false` to completely disable ads