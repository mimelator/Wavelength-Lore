#!/bin/bash

# 🔐 SSO Chatbot Test Runner
# Quick wrapper for running SSO chatbot tests with common configurations

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔐 SSO Chatbot Test Runner${NC}"
echo -e "${YELLOW}═══════════════════════════════════${NC}"

# Default options
VISIBLE=""
URL="https://wavelengthlore.com"
TIMEOUT="30000"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --visible)
      VISIBLE="--visible"
      shift
      ;;
    --url)
      URL="$2"
      shift 2
      ;;
    --timeout)
      TIMEOUT="$2"
      shift 2
      ;;
    --help|-h)
      echo -e "${GREEN}Usage: $0 [options]${NC}"
      echo ""
      echo -e "${BLUE}Options:${NC}"
      echo -e "  ${YELLOW}--visible${NC}     Run browser in visible mode (recommended for first run)"
      echo -e "  ${YELLOW}--url <url>${NC}    Target URL for testing (default: https://wavelengthlore.com)"
      echo -e "  ${YELLOW}--timeout <ms>${NC} Timeout for page operations (default: 30000)"
      echo -e "  ${YELLOW}--help, -h${NC}    Show this help message"
      echo ""
      echo -e "${BLUE}Examples:${NC}"
      echo -e "  ${GREEN}$0 --visible${NC}                    # Visual mode for debugging"
      echo -e "  ${GREEN}$0 --url https://staging.com${NC}   # Test staging environment"
      echo -e "  ${GREEN}$0 --timeout 60000${NC}             # Longer timeout for slow networks"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      echo -e "Use ${YELLOW}--help${NC} for usage information"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}📋 Test Configuration:${NC}"
echo -e "  ${YELLOW}URL:${NC} $URL"
echo -e "  ${YELLOW}Mode:${NC} $([ -n "$VISIBLE" ] && echo "Visible Browser" || echo "Headless")"
echo -e "  ${YELLOW}Timeout:${NC} ${TIMEOUT}ms"
echo ""

# Check if Node.js and required dependencies are available
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js first.${NC}"
    exit 1
fi

# Check if puppeteer is installed
if ! node -e "require('puppeteer')" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Puppeteer not found. Installing...${NC}"
    npm install puppeteer
fi

# Run the test
echo -e "${GREEN}🚀 Starting SSO Chatbot Tests...${NC}"
echo ""

node tests/chatbot/sso-chatbot-test.js $VISIBLE --url "$URL" --timeout "$TIMEOUT"

# Capture exit code
EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests completed successfully!${NC}"
    echo -e "${GREEN}✅ Your chatbot is working correctly in production.${NC}"
else
    echo -e "${YELLOW}⚠️  Some tests failed or encountered issues.${NC}"
    echo -e "${BLUE}💡 Try running with ${YELLOW}--visible${NC} ${BLUE}to debug authentication issues.${NC}"
fi

echo -e "${BLUE}📊 Check the generated report for detailed results.${NC}"

exit $EXIT_CODE