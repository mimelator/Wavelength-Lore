#!/bin/bash

# Test Merchandise Issues Script
# Runs comprehensive tests for upscaling progress dialog and product persistence issues

echo "🧪 MERCHANDISE ISSUE TESTING SCRIPT"
echo "=================================="
echo "Testing:"
echo "  1. Upscaling progress dialog hangs"
echo "  2. Product auto-removal scenarios"
echo "  3. End-to-end merchandise workflows"
echo ""

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed or not in PATH"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Check if required test files exist
REQUIRED_FILES=(
    "tests/merchandise/upscaling-progress-dialog-test.js"
    "tests/merchandise/product-persistence-test.js"
    "tests/merchandise/comprehensive-merchandise-test.js"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Required test file not found: $file"
        exit 1
    fi
done

echo "✅ All required test files found"
echo ""

# Check if Puppeteer is installed
if ! npm list puppeteer &> /dev/null; then
    echo "⚠️ Puppeteer not found, installing..."
    npm install puppeteer
fi

# Set environment variables
export BASE_URL=${BASE_URL:-"http://localhost:3001"}
export NODE_ENV=${NODE_ENV:-"test"}

echo "🌐 Testing against: $BASE_URL"
echo "🔧 Environment: $NODE_ENV"
echo ""

# Function to run individual tests
run_test() {
    local test_name="$1"
    local test_file="$2"
    
    echo "🚀 Running $test_name..."
    echo "----------------------------------------"
    
    if node "$test_file"; then
        echo "✅ $test_name completed successfully"
        return 0
    else
        echo "❌ $test_name failed"
        return 1
    fi
}

# Main test execution
main() {
    local failed_tests=0
    
    echo "🎯 Starting comprehensive merchandise testing..."
    echo ""
    
    # Option 1: Run comprehensive test suite (recommended)
    if [ "${1:-}" = "--comprehensive" ] || [ "${1:-}" = "-c" ]; then
        echo "📋 Running comprehensive test suite..."
        if run_test "Comprehensive Merchandise Tests" "tests/merchandise/comprehensive-merchandise-test.js"; then
            echo ""
            echo "🎉 All comprehensive tests completed successfully!"
        else
            echo ""
            echo "💥 Comprehensive tests failed!"
            failed_tests=$((failed_tests + 1))
        fi
    
    # Option 2: Run individual tests
    elif [ "${1:-}" = "--individual" ] || [ "${1:-}" = "-i" ]; then
        echo "📋 Running individual test suites..."
        
        # Test 1: Upscaling Progress Dialog
        if ! run_test "Upscaling Progress Dialog Test" "tests/merchandise/upscaling-progress-dialog-test.js"; then
            failed_tests=$((failed_tests + 1))
        fi
        
        echo ""
        
        # Test 2: Product Persistence
        if ! run_test "Product Persistence Test" "tests/merchandise/product-persistence-test.js"; then
            failed_tests=$((failed_tests + 1))
        fi
    
    # Default: Run comprehensive tests
    else
        echo "📋 Running comprehensive test suite (default)..."
        echo "   Use --individual or -i to run tests separately"
        echo "   Use --comprehensive or -c to explicitly run comprehensive suite"
        echo ""
        
        if run_test "Comprehensive Merchandise Tests" "tests/merchandise/comprehensive-merchandise-test.js"; then
            echo ""
            echo "🎉 All comprehensive tests completed successfully!"
        else
            echo ""
            echo "💥 Comprehensive tests failed!"
            failed_tests=$((failed_tests + 1))
        fi
    fi
    
    # Final results
    echo ""
    echo "📊 FINAL RESULTS"
    echo "================"
    
    if [ $failed_tests -eq 0 ]; then
        echo "✅ All tests passed successfully!"
        echo ""
        echo "🎯 Key areas tested:"
        echo "   - Progress dialog functionality during upscaling"
        echo "   - Product creation and persistence"
        echo "   - Auto-removal criteria and behavior"
        echo "   - Network request handling and timeouts"
        echo ""
        echo "💡 If you're still experiencing issues:"
        echo "   - Check the detailed test output above"
        echo "   - Review browser console logs during manual testing"
        echo "   - Verify server-side API responses"
        exit 0
    else
        echo "❌ $failed_tests test suite(s) failed"
        echo ""
        echo "🔍 Next steps:"
        echo "   1. Review the detailed error messages above"
        echo "   2. Check if the server is running on $BASE_URL"
        echo "   3. Verify all dependencies are installed"
        echo "   4. Run tests individually for more specific debugging"
        echo ""
        echo "🛠️ Debug commands:"
        echo "   ./scripts/test-merchandise-issues.sh --individual"
        echo "   node tests/merchandise/upscaling-progress-dialog-test.js"
        echo "   node tests/merchandise/product-persistence-test.js"
        exit 1
    fi
}

# Help function
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -c, --comprehensive    Run comprehensive test suite (default)"
    echo "  -i, --individual       Run individual test suites separately"
    echo "  -h, --help            Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  BASE_URL              Server URL to test against (default: http://localhost:3001)"
    echo "  NODE_ENV              Environment mode (default: test)"
    echo ""
    echo "Examples:"
    echo "  $0                    # Run comprehensive tests"
    echo "  $0 --individual       # Run tests separately"
    echo "  BASE_URL=http://localhost:3000 $0  # Test against different server"
}

# Parse command line arguments
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac