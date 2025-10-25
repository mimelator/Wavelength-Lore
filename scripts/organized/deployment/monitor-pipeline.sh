#!/bin/bash

# Complete Deployment Pipeline Monitor Wrapper
# Convenient script for monitoring the complete CI/CD pipeline

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Starting Complete Deployment Pipeline Monitor..."
echo "📍 Script location: $SCRIPT_DIR"
echo ""

# Execute the Node.js pipeline monitor with all arguments passed through
node "$SCRIPT_DIR/deployment-pipeline-monitor.js" "$@"