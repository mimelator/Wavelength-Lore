#!/bin/bash

# Enhanced Production Validation Script
# Integrates with comprehensive validation suite including forum tests

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROD_URL="https://wavelengthlore.com"

# Parse command line arguments
MODE="standard"
SKIP_FORUM=false

while [[ $# -gt 0 ]]; do
    case $1 in
        quick)
            MODE="quick"
            shift
            ;;
        full)
            MODE="full"
            shift
            ;;
        standard)
            MODE="standard"
            shift
            ;;
        --skip-forum)
            SKIP_FORUM=true
            shift
            ;;
        --help|-h)
            echo -e "${BLUE}🔍 Enhanced Production Validation Suite${NC}"
            echo ""
            echo "Usage: $0 [mode] [options]"
            echo ""
            echo "Modes:"
            echo "  quick      Fast validation (1-2 minutes)"
            echo "  standard   Standard validation (3-5 minutes) [default]"
            echo "  full       Comprehensive validation (5-10 minutes)"
            echo ""
            echo "Options:"
            echo "  --skip-forum    Skip forum browser validation"
            echo "  --help, -h      Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 quick                    # Quick validation"
            echo "  $0 full                     # Full validation"
            echo "  $0 standard --skip-forum    # Standard without forum tests"
            echo ""
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Unknown argument: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

echo -e "${CYAN}🚀 Enhanced Production Validation Suite${NC}"
echo -e "${CYAN}=====================================${NC}"
echo -e "${BLUE}🌐 Target: ${PROD_URL}${NC}"
echo -e "${BLUE}⚡ Mode: ${MODE}${NC}"
echo -e "${BLUE}📅 Time: $(date)${NC}"
echo ""

# Step 1: Basic connectivity check
echo -e "${YELLOW}📡 Step 1: Basic Connectivity Check${NC}"
echo "----------------------------------------"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL" || echo "000")
if [ "$STATUS" = "200" ]; then
    echo -e "   ✅ Site is UP (HTTP $STATUS)"
else
    echo -e "   ❌ Site returned HTTP $STATUS"
    exit 1
fi

# Check version
VERSION=$(curl -s "$PROD_URL" | grep -o 'v[0-9]\+\.[0-9]\+\.[0-9]\+' | head -1 || echo "unknown")
echo -e "   📦 Version: ${VERSION}"

# Step 2: Run comprehensive validation suite
echo -e "\n${YELLOW}📊 Step 2: Comprehensive Validation Suite${NC}"
echo "----------------------------------------"

# Build arguments for production_validation.js
VALIDATION_ARGS=""
case $MODE in
    "quick")
        VALIDATION_ARGS="--quick"
        ;;
    "full")
        VALIDATION_ARGS="--full"
        ;;
    "standard")
        VALIDATION_ARGS=""
        ;;
esac

if [ "$SKIP_FORUM" = true ]; then
    VALIDATION_ARGS="$VALIDATION_ARGS --skip-forum"
fi

# Run the comprehensive validation
if node "$SCRIPT_DIR/production_validation.js" $VALIDATION_ARGS; then
    echo -e "\n${GREEN}✅ Comprehensive validation completed successfully${NC}"
    VALIDATION_SUCCESS=true
else
    echo -e "\n${RED}❌ Comprehensive validation failed${NC}"
    VALIDATION_SUCCESS=false
fi

# Step 3: Quick manual checks
echo -e "\n${YELLOW}🔍 Step 3: Quick Manual Checks${NC}"
echo "----------------------------------------"

# Check characters page
CHAR_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL/characters" || echo "000")
if [ "$CHAR_STATUS" = "200" ]; then
    CHAR_COUNT=$(curl -s "$PROD_URL/characters" | grep -o "character-card" | wc -l || echo "0")
    echo -e "   ✅ Characters page: $CHAR_COUNT characters found"
else
    echo -e "   ❌ Characters page returned HTTP $CHAR_STATUS"
    VALIDATION_SUCCESS=false
fi

# Check forum page (if not skipped)
if [ "$SKIP_FORUM" = false ]; then
    FORUM_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL/forum" || echo "000")
    if [ "$FORUM_STATUS" = "200" ]; then
        echo -e "   ✅ Forum page accessible (HTTP $FORUM_STATUS)"
    else
        echo -e "   ❌ Forum page returned HTTP $FORUM_STATUS"
        VALIDATION_SUCCESS=false
    fi
fi

# Check episodes page
EPISODES_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL/episodes" || echo "000")
if [ "$EPISODES_STATUS" = "200" ]; then
    echo -e "   ✅ Episodes page accessible (HTTP $EPISODES_STATUS)"
else
    echo -e "   ❌ Episodes page returned HTTP $EPISODES_STATUS"
    VALIDATION_SUCCESS=false
fi

# Final results
echo -e "\n${CYAN}📊 VALIDATION SUMMARY${NC}"
echo -e "${CYAN}===================${NC}"

if [ "$VALIDATION_SUCCESS" = true ]; then
    echo -e "${GREEN}🎉 ALL VALIDATIONS PASSED!${NC}"
    echo -e "${GREEN}✅ Production site is healthy and ready${NC}"
    echo -e "${BLUE}📈 Mode: $MODE validation completed successfully${NC}"
    
    if [ "$SKIP_FORUM" = true ]; then
        echo -e "${YELLOW}ℹ️  Note: Forum validation was skipped${NC}"
    fi
    
    exit 0
else
    echo -e "${RED}🚨 VALIDATION FAILURES DETECTED${NC}"
    echo -e "${RED}❌ Production site has issues that need attention${NC}"
    echo -e "${YELLOW}🔧 Please review the failed checks above${NC}"
    exit 1
fi