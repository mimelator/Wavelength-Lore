#!/bin/bash

# ========================================================================================
# EFFECTS PIPELINE TEST RUNNER
# ========================================================================================
#
# This script runs the effects pipeline test and captures both client and server diagnostics
#
# Usage:
#   ./scripts/run-effects-test.sh          # Run test (server must be running)
#   ./scripts/run-effects-test.sh --help   # Show help
#
# The script will:
# 1. Check that the server is running
# 2. Run the automated effects pipeline test
# 3. Capture and save diagnostic data
# 4. Generate a comprehensive report
# ========================================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ========================================================================================
# FUNCTIONS
# ========================================================================================

print_header() {
  echo -e "${BLUE}==================================================================================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}==================================================================================================${NC}"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

# ========================================================================================
# MAIN EXECUTION
# ========================================================================================

print_header "🔥 EFFECTS PIPELINE TEST RUNNER"

# Check if --help was provided
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
  echo "Usage: ./scripts/run-effects-test.sh [OPTIONS]"
  echo ""
  echo "Options:"
  echo "  --help, -h          Show this help message"
  echo "  --no-headless       Run browser in non-headless mode (visible window)"
  echo "  --verbose           Print verbose output from test"
  echo "  --keep-report       Keep test report file for review"
  echo ""
  echo "Prerequisites:"
  echo "  • Node.js and npm must be installed"
  echo "  • Server must be running (npm start or similar)"
  echo "  • Merchandise store must be accessible at http://localhost:3001"
  echo ""
  exit 0
fi

# ========================================================================================
# CHECK PREREQUISITES
# ========================================================================================

print_header "Prerequisites Check"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  print_error "Node.js is not installed"
  exit 1
fi
print_success "Node.js installed: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
  print_error "npm is not installed"
  exit 1
fi
print_success "npm installed: $(npm --version)"

# Check if server is running
print_info "Checking if server is running at http://localhost:3001..."
if curl -s http://localhost:3001 > /dev/null 2>&1; then
  print_success "Server is running"
else
  print_warning "Server may not be running at http://localhost:3001"
  print_info "Make sure to run: npm start (in another terminal)"
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_error "Test cancelled"
    exit 1
  fi
fi

# ========================================================================================
# RUN TEST
# ========================================================================================

print_header "Running Effects Pipeline Test"

TEST_FILE="./tests/merchandise/effects-pipeline.test.js"

if [ ! -f "$TEST_FILE" ]; then
  print_error "Test file not found: $TEST_FILE"
  exit 1
fi

print_info "Test file: $TEST_FILE"
print_info "Starting test at: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# Run the test
if node "$TEST_FILE"; then
  print_success "Test completed successfully"
  TEST_EXIT_CODE=0
else
  print_error "Test completed with errors"
  TEST_EXIT_CODE=1
fi

echo ""

# ========================================================================================
# LOCATE REPORT
# ========================================================================================

print_header "Test Report"

LATEST_REPORT=$(ls -t tests/merchandise/effects-test-report-*.json 2>/dev/null | head -1)

if [ -f "$LATEST_REPORT" ]; then
  print_success "Report generated: $LATEST_REPORT"

  # Print summary from report
  print_info "Report Summary:"
  node -e "
    const report = require('./$LATEST_REPORT');
    console.log('  Test: ' + report.testName);
    console.log('  Duration: ' + report.duration + 'ms');
    console.log('  Results: ' + report.summary.passed + ' passed, ' + report.summary.failed + ' failed');
    console.log('  Success Rate: ' + report.summary.successRate);
    console.log('');
    console.log('  Sections:');
    Object.entries(report.sections).forEach(([section, checks]) => {
      const passCount = checks.filter(c => c.status === 'PASS').length;
      const failCount = checks.filter(c => c.status === 'FAIL').length;
      const warnCount = checks.filter(c => c.status === 'WARN').length;
      console.log('    • ' + section + ': ' + passCount + ' pass, ' + failCount + ' fail, ' + warnCount + ' warn');
    });
  "

  echo ""
  print_info "Full report: $LATEST_REPORT"

  # Offer to open report
  if command -v jq &> /dev/null; then
    print_info "To view API payloads:"
    echo "  cat $LATEST_REPORT | jq '.apiPayloads'"
    echo ""
    print_info "To view server logs:"
    echo "  cat $LATEST_REPORT | jq '.serverLogs.logs[] | select(.text | contains(\"effect\"))'"
    echo ""
    print_info "To view failed checks:"
    echo "  cat $LATEST_REPORT | jq '.sections | map_values(map(select(.status == \"FAIL\")))'"
  fi
else
  print_warning "Report file not found"
fi

echo ""
print_header "Test Complete"

if [ $TEST_EXIT_CODE -eq 0 ]; then
  print_success "Effects pipeline test passed!"
else
  print_error "Effects pipeline test failed - see report for details"
fi

exit $TEST_EXIT_CODE
