#!/bin/bash

# Production AdMob Testing Script
# This script will help you test AdMob integration with real ads in production

echo "====================================================="
echo "🚀 AdMob Production Testing Setup Script"
echo "====================================================="
echo ""

# Step 1: Check if AWS CLI is installed
echo "Step 1: Checking AWS CLI installation..."
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first:"
    echo "    brew install awscli    # For MacOS"
    echo "    Follow instructions at: https://aws.amazon.com/cli/"
    exit 1
fi

echo "✅ AWS CLI is installed"
echo ""

# Step 2: Check AWS credentials
echo "Step 2: Checking AWS credentials..."
echo "Please ensure you have valid AWS credentials configured."
echo "You can configure them using 'aws configure' or by setting environment variables."

read -p "Do you want to continue? (y/n): " continue_aws
if [[ ! $continue_aws =~ ^[Yy]$ ]]; then
    echo "Exiting..."
    exit 0
fi

# Step 3: Ask for AdMob IDs
echo ""
echo "Step 3: AdMob Configuration"
echo "Please enter your real AdMob production ad unit IDs"
echo "(These will be used to update environment variables in AWS AppRunner)"
echo ""

read -p "Do you want to use the update-admob-config.js script instead? (y/n): " use_script
if [[ $use_script =~ ^[Yy]$ ]]; then
    echo "Running update-admob-config.js script..."
    node scripts/update-admob-config.js
    exit_code=$?
    if [ $exit_code -ne 0 ]; then
        echo "❌ Failed to update AdMob configuration. Please check the errors above."
        exit 1
    fi
    echo "✅ AdMob configuration updated using the script"
    echo ""
else
    echo "Please run the update-admob-config.js script manually:"
    echo "    node scripts/update-admob-config.js"
    echo ""
    echo "After updating the configuration, the AppRunner service will need to be redeployed."
    echo ""
fi

# Step 4: Testing AdMob in production
echo "Step 4: Testing AdMob in Production"
echo ""
echo "To test AdMob in production, follow these steps:"
echo ""
echo "1. Wait for the AppRunner service to finish redeploying (can take a few minutes)"
echo "2. Navigate to your production site: https://your-wavelength-gems-url.com"
echo "3. Look for the AdMob test interface panel (if enabled)"
echo "4. If the test panel is not visible, access the test page directly:"
echo "   https://your-wavelength-gems-url.com/examples/admob-integration-demo.html"
echo "5. Click the different ad testing buttons to verify:"
echo "   - Interstitial ads"
echo "   - Rewarded video ads for extra lives"
echo "   - Rewarded video ads for power gems"
echo "   - Rewarded video ads for score multipliers"
echo ""
echo "Important Notes:"
echo "- Real ads might not always fill (have 100% fill rate)"
echo "- If ads don't appear, check browser console for errors"
echo "- Verify that ADMOB_USE_TEST_ADS is set to 'false'"
echo "- Verify that ADMOB_ENABLED is set to 'true'"
echo ""
echo "To enable the test panel in production temporarily, add this URL parameter:"
echo "?adtest=true"
echo ""
echo "Example:"
echo "https://your-wavelength-gems-url.com/games/wavelength-gems?adtest=true"
echo ""

# Step 5: Monitoring
echo "Step 5: Monitoring AdMob Performance"
echo ""
echo "After testing, you can monitor ad performance in your AdMob dashboard:"
echo "https://apps.admob.com/"
echo ""
echo "Look for:"
echo "- Impressions"
echo "- Fill rate"
echo "- Revenue"
echo "- User engagement metrics"
echo ""

echo "====================================================="
echo "🎮 Happy Testing! 🎲"
echo "====================================================="