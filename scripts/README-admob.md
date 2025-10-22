# AdMob Configuration Scripts

This directory contains scripts for managing AdMob configuration in both local development and production environments.

## Available Scripts

### 1. `setup-admob-local.js`

Sets up AdMob environment variables for local development.

**Features:**
- Creates or updates a `.env` file with AdMob configuration
- Offers Google's test ad unit IDs for development
- Provides guidance for required and optional variables
- Maintains existing variables in your `.env` file

**Usage:**
```bash
node scripts/setup-admob-local.js
```

**Requirements:**
- Node.js
- Install dotenv: `npm install dotenv --save`

### 2. `update-admob-config.js`

Updates AdMob environment variables in AWS AppRunner for production deployment.

**Features:**
- Updates AWS AppRunner environment variables
- Preserves existing non-AdMob environment variables
- Validates inputs with descriptive prompts
- Supports both new and existing environment variables

**Usage:**
```bash
node scripts/update-admob-config.js
```

**Requirements:**
- Node.js
- AWS SDK v3 for AppRunner: `npm install @aws-sdk/client-apprunner --save`
- Valid AWS credentials with AppRunner update permissions
- AWS resources configured in `config/aws-resources.js`

## Environment Variables

Both scripts manage the following AdMob environment variables:

- `ADMOB_APP_ID_ANDROID`: Android App ID (required)
- `ADMOB_APP_ID_IOS`: iOS App ID (required)
- `ADMOB_APP_ID_WEB`: Web App ID (optional)
- `ADMOB_REWARDED_VIDEO_PROD`: Rewarded video ad unit ID (required)
- `ADMOB_REWARDED_EXTRA_LIFE_PROD`: Extra life rewarded video ad unit ID (optional)
- `ADMOB_REWARDED_POWER_GEM_PROD`: Power gem rewarded video ad unit ID (optional)
- `ADMOB_REWARDED_SCORE_MULTI_PROD`: Score multiplier rewarded video ad unit ID (optional)
- `ADMOB_INTERSTITIAL_PROD`: Interstitial ad unit ID (required)
- `ADMOB_INTERSTITIAL_LEVEL_PROD`: Level-specific interstitial ad unit ID (optional)
- `ADMOB_INTERSTITIAL_GAMEOVER_PROD`: Game over interstitial ad unit ID (optional)
- `ADMOB_USE_TEST_ADS`: Use test ads? (default: local=`true`, prod=`false`)
- `ADMOB_ENABLED`: Enable ads? (default: `true`)
- `ADMOB_MIN_TIME_BETWEEN_ADS`: Minimum time between ads in ms (default: `60000`)
- `ADMOB_INTERSTITIAL_FREQUENCY`: Show interstitial every X levels (default: `3`)
- `ADMOB_MAX_CONTENT_RATING`: Max content rating (default: `PG`)
- `ADMOB_CHILD_DIRECTED`: Child-directed treatment? (default: `false`)
- `ADMOB_UNDER_AGE_CONSENT`: Under age of consent? (default: `false`)

## Further Documentation

For detailed information on the AdMob integration in Wavelength Gems, see the [AdMob Integration Guide](../docs/admob-integration-guide.md).