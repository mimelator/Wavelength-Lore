#!/bin/bash

# 🏠 Localhost SSO Chatbot Test Runner
# Specialized runner for testing chatbot on localhost development environment

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🏠 Localhost Chatbot Test Runner${NC}"
echo -e "${YELLOW}═══════════════════════════════════${NC}"

# Check if server is running
PORT=3001
if ! lsof -i :$PORT >/dev/null 2>&1; then
    echo -e "${RED}❌ Server not running on port $PORT${NC}"
    echo -e "${YELLOW}💡 Starting server...${NC}"
    
    # Try to start server
    npm start > server-test.log 2>&1 &
    SERVER_PID=$!
    
    # Wait for server to start
    echo -e "${BLUE}⏳ Waiting for server startup...${NC}"
    sleep 8
    
    if lsof -i :$PORT >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Server started successfully${NC}"
    else
        echo -e "${RED}❌ Failed to start server. Check server-test.log${NC}"
        exit 1
    fi
fi

# Server status
SERVER_PID=$(lsof -t -i :$PORT)
echo -e "${GREEN}✅ Server running on port $PORT (PID: $SERVER_PID)${NC}"

# Default options for localhost testing
LOCALHOST_URL="http://localhost:$PORT"
VISIBLE="--visible"
TIMEOUT="45000"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --headless)
      VISIBLE=""
      shift
      ;;
    --timeout)
      TIMEOUT="$2"
      shift 2
      ;;
    --help|-h)
      echo -e "${GREEN}Usage: $0 [options]${NC}"
      echo ""
      echo -e "${BLUE}Options:${NC}"
      echo -e "  ${YELLOW}--headless${NC}    Run in headless mode (default: visible for localhost)"
      echo -e "  ${YELLOW}--timeout <ms>${NC} Timeout for operations (default: 45000)"
      echo -e "  ${YELLOW}--help, -h${NC}    Show this help message"
      echo ""
      echo -e "${BLUE}This script automatically:${NC}"
      echo -e "  • Checks if server is running on port $PORT"
      echo -e "  • Starts server if needed"
      echo -e "  • Runs chatbot tests in visible mode for debugging"
      echo -e "  • Uses localhost-optimized settings"
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
echo -e "  ${YELLOW}URL:${NC} $LOCALHOST_URL"
echo -e "  ${YELLOW}Mode:${NC} $([ -n "$VISIBLE" ] && echo "Visible Browser (Debug Mode)" || echo "Headless")"
echo -e "  ${YELLOW}Timeout:${NC} ${TIMEOUT}ms"
echo -e "  ${YELLOW}Environment:${NC} Localhost Development"
echo ""

echo -e "${GREEN}🚀 Starting Localhost Chatbot Tests...${NC}"
echo ""

# Run the test with localhost-optimized settings
node tests/chatbot/sso-chatbot-test.js $VISIBLE --url "$LOCALHOST_URL" --timeout "$TIMEOUT"

# Capture exit code
EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}🎉 Localhost chatbot tests completed successfully!${NC}"
    echo -e "${GREEN}✅ Your development chatbot is working correctly.${NC}"
else
    echo -e "${YELLOW}⚠️  Some tests failed or encountered issues.${NC}"
    echo -e "${BLUE}💡 This is normal for localhost development environment.${NC}"
    echo -e "${BLUE}🔍 Check the detailed report for specific areas to investigate.${NC}"
fi

echo -e "${BLUE}📊 Server Status: Running on $LOCALHOST_URL${NC}"
echo -e "${BLUE}📋 Test logs and reports generated for analysis.${NC}"

exit $EXIT_CODE