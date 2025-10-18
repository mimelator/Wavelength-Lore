#!/bin/bash

# App Runner Deployment Script
# Triggers a redeploy and monitors the deployment status

cd "$(dirname "$0")"

echo "🚀 App Runner Deployment Monitor"
echo "================================"

# Check if node is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed or not in PATH"
    exit 1
fi

# Run the deployment monitor (Node.js will handle .env loading)
node apprunner-deploy-monitor.js "$@"