#!/bin/bash

# Forum Testing Suite Runner
# Runs comprehensive browser-based validation of forum functionality

set -e

echo "🚀 Starting Comprehensive Forum Testing Suite"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if puppeteer is installed
if ! npm list puppeteer > /dev/null 2>&1; then
    echo -e "${YELLOW}📦 Installing Puppeteer for browser testing...${NC}"
    npm install puppeteer --save-dev
fi

# Function to run test with error handling
run_test() {
    local test_name="$1"
    local test_script="$2"
    
    echo -e "\n${BLUE}🧪 Running $test_name...${NC}"
    echo "----------------------------------------"
    
    if node "$test_script"; then
        echo -e "${GREEN}✅ $test_name PASSED${NC}"
        return 0
    else
        echo -e "${RED}❌ $test_name FAILED${NC}"
        return 1
    fi
}

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0

# Test 1: Browser Validation
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test "Browser Validation" "scripts/forum-browser-validation.js"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
fi

# Test 2: Visual Testing
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test "Visual Testing" "scripts/forum-visual-test.js"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
fi

# Test 3: Comprehensive Forum Test (existing)
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test "Comprehensive Forum Test" "scripts/forum-comprehensive-test.js"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
fi

# Final Results
echo -e "\n" + "=" * 50
echo -e "${BLUE}📊 FORUM TESTING SUITE RESULTS${NC}"
echo "=================================================="

if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED! ($PASSED_TESTS/$TOTAL_TESTS)${NC}"
    echo -e "${GREEN}✅ Forum is ready for production!${NC}"
    
    # Show screenshot location if visual tests ran
    if [ -d "test-screenshots" ]; then
        echo -e "\n${BLUE}📸 Visual test screenshots available in: test-screenshots/${NC}"
    fi
    
    exit 0
else
    echo -e "${RED}⚠️  SOME TESTS FAILED ($PASSED_TESTS/$TOTAL_TESTS passed)${NC}"
    echo -e "${YELLOW}🔧 Please review the failed tests above${NC}"
    exit 1
fi