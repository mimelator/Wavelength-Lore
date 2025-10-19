#!/bin/bash

# App Runner Deployment Script
# NOTE: Auto-deployment is now enabled! Normal deployments happen automatically via GitHub Actions.
# This script is for monitoring deployments or manual emergency deployments only.

cd "$(dirname "$0")"

echo "🚀 App Runner Deployment Monitor"
echo "================================"
echo "ℹ️  Auto-deployment is enabled - normal deployments happen via GitHub Actions"
echo "   This script is for monitoring or emergency manual deployments only"
echo ""

# Check if node is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed or not in PATH"
    exit 1
fi

# Show current version info
echo "📋 Current version info:"
node -e "const vm = require('../utils/version'); console.log('   Version:', vm.getDisplayVersion()); console.log('   Environment:', vm.getVersionInfo().environment);"

# Check if this is a manual deployment request
if [[ "$1" == "--force" || "$1" == "--manual" ]]; then
    echo "🚀 Starting manual deployment..."
    # Run the deployment monitor (Node.js will handle .env loading)
    node apprunner-deploy-monitor.js "$@"
else
    echo ""
    echo "🔄 Monitoring current deployment status..."
    echo "   Use --force or --manual for emergency manual deployments"
    # Just monitor, don't deploy
    node apprunner-deploy-monitor.js --monitor-only "$@"
fi