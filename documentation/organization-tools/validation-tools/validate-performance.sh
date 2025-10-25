#!/bin/bash

# Performance Validation Wrapper
# Usage: ./scripts/validate-performance.sh [environment]

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENVIRONMENT="${1:-local}"

echo -e "${GREEN}🚀 Performance Validation Suite${NC}"
echo "================================="
echo "Environment: $ENVIRONMENT"
echo "Project: $(basename "$PROJECT_ROOT")"
echo

# Set environment
if [ "$ENVIRONMENT" = "production" ] || [ "$ENVIRONMENT" = "prod" ]; then
    export NODE_ENV=production
    echo -e "${YELLOW}⚠️  Testing PRODUCTION environment${NC}"
else
    export NODE_ENV=development
    echo -e "${GREEN}🏠 Testing LOCAL environment${NC}"
fi

# Change to project directory
cd "$PROJECT_ROOT"

# Check if server is running (for local)
if [ "$NODE_ENV" = "development" ]; then
    if ! curl -s http://localhost:3001 > /dev/null 2>&1; then
        echo -e "${RED}❌ Local server not running on port 3001${NC}"
        echo "Start the server first: npm start"
        exit 1
    fi
    echo -e "${GREEN}✅ Local server detected${NC}"
fi

# Run the validation
echo
echo "Starting performance validation..."
node "$SCRIPT_DIR/validate-performance-improvements.js"

echo
echo -e "${GREEN}✅ Performance validation complete!${NC}"