#!/bin/bash

echo "🧪 Running Product Customization Test Suite"
echo "==========================================="

# Check if server is running
if ! curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo "❌ Server not running on localhost:3001"
    echo "   Please start the server: npm run dev"
    exit 1
fi

# Run unit tests
echo ""
echo "1️⃣  Running Unit Tests..."
echo "-------------------------------------------"
node tests/merchandise/product-customization-unit.test.js
UNIT_EXIT=$?

# Run API tests
echo ""
echo "2️⃣  Running API Tests..."
echo "-------------------------------------------"
node tests/merchandise/border-preview-api.test.js
API_EXIT=$?

# Run E2E tests
echo ""
echo "3️⃣  Running E2E Tests..."
echo "-------------------------------------------"
node tests/merchandise/product-customization-modal.test.js
E2E_EXIT=$?

# Summary
echo ""
echo "==========================================="
echo "📊 TEST SUITE SUMMARY"
echo "==========================================="
echo "Unit Tests: $([ $UNIT_EXIT -eq 0 ] && echo '✅ PASSED' || echo '❌ FAILED')"
echo "API Tests:  $([ $API_EXIT -eq 0 ] && echo '✅ PASSED' || echo '❌ FAILED')"
echo "E2E Tests:  $([ $E2E_EXIT -eq 0 ] && echo '✅ PASSED' || echo '❌ FAILED')"
echo "==========================================="

# Exit with failure if any test failed
if [ $UNIT_EXIT -ne 0 ] || [ $API_EXIT -ne 0 ] || [ $E2E_EXIT -ne 0 ]; then
    echo ""
    echo "❌ Some tests failed. Please review the output above."
    exit 1
else
    echo ""
    echo "✅ All tests passed successfully!"
    exit 0
fi
