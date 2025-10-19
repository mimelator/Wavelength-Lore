#!/bin/bash

# App Runner Deployment Script
# Monitors the deployment status - version is auto-incremented by GitHub Actions

cd "$(dirname "$0")"

echo "🚀 App Runner Deployment Monitor"
echo "================================"

# Check if node is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed or not in PATH"
    exit 1
fi

# Show current version info
echo "� Current version info:"
node -e "const vm = require('../utils/version'); console.log('   Version:', vm.getDisplayVersion()); console.log('   Environment:', vm.getVersionInfo().environment);"
echo "🚀 Starting deployment..."

# Run the deployment monitor (Node.js will handle .env loading)
node apprunner-deploy-monitor.js "$@"