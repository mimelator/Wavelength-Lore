#!/bin/bash

# REGRESSION TEST EXECUTION PLAN
# ===============================
# Systematic testing of all modified components

echo "🧪 COMPREHENSIVE REGRESSION TEST SUITE"
echo "======================================"
echo "Testing all components modified during refactoring"
echo ""

# Track test results
TESTS_PASSED=0
TESTS_FAILED=0
CRITICAL_FAILURES=()

# Helper function to run test and track results
run_test() {
    local test_name="$1"
    local test_command="$2"
    local is_critical="$3"
    
    echo "🔍 Testing: $test_name"
    echo "Command: $test_command"
    echo "----------------------------------------"
    
    if eval "$test_command"; then
        echo "✅ PASSED: $test_name"
        ((TESTS_PASSED++))
    else
        echo "❌ FAILED: $test_name"
        ((TESTS_FAILED++))
        if [ "$is_critical" = "true" ]; then
            CRITICAL_FAILURES+=("$test_name")
        fi
    fi
    echo ""
}

echo "📋 PHASE 1: CRITICAL COMPONENT TESTS"
echo "===================================="
echo "Testing core components we modified..."
echo ""

# Test 1: Runtime Validation Test (CRITICAL - we modified cache logic)
run_test "Runtime Validation Test" "node tests/runtime-validation-test.js" "true"

# Test 2: Global Cache Validation (CRITICAL - we enhanced cache validation)
run_test "Global Cache Validation" "node tests/global-cache-validation.js" "true"

echo "📋 PHASE 2: SIGNATURE COMPATIBILITY TESTS"
echo "=========================================="
echo "Testing all components that use upscaleImage..."
echo ""

# Test 3: API Product Preview Builder (CRITICAL - main script requested)
run_test "API Product Preview Builder" "node scripts/api-product-preview-builder.js" "true"

# Test 4: Printify Integration Validator (HIGH - we fixed signature here)
run_test "Printify Integration Validator" "node scripts/printify-integration-validator.js --vendor-preview" "true"

echo "📋 PHASE 3: INTEGRATION TESTS"
echo "=============================="
echo "Testing end-to-end workflows..."
echo ""

# Test 5: Repeat-run safety (MEDIUM - testing for robustness)
run_test "API Builder Repeat Run Test" "node scripts/api-product-preview-builder.js" "false"

echo "📋 PHASE 4: GENERAL REGRESSION TESTS"
echo "===================================="
echo "Testing general functionality that could be affected..."
echo ""

# Test 6: Simple API Test (MEDIUM - general API functionality)
run_test "Simple API Test" "node tests/simple-api-test.js" "false"

# Test 7: Admin Security Test (MEDIUM - we added ValidationHelpers)
run_test "Admin Security Test" "node tests/admin-security-test.js" "false"

echo "📊 REGRESSION TEST SUMMARY"
echo "=========================="
echo "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"
echo "Passed: $TESTS_PASSED"
echo "Failed: $TESTS_FAILED"

if [ ${#CRITICAL_FAILURES[@]} -gt 0 ]; then
    echo ""
    echo "🚨 CRITICAL FAILURES DETECTED:"
    for failure in "${CRITICAL_FAILURES[@]}"; do
        echo "   - $failure"
    done
    echo ""
    echo "❌ REGRESSION TEST RESULT: FAILED"
    echo "Critical components are broken - refactoring caused regressions"
    exit 1
elif [ $TESTS_FAILED -gt 0 ]; then
    echo ""
    echo "⚠️  NON-CRITICAL FAILURES DETECTED"
    echo "🟡 REGRESSION TEST RESULT: PARTIAL SUCCESS"
    echo "Core functionality works but some features may be affected"
    exit 2
else
    echo ""
    echo "✅ REGRESSION TEST RESULT: SUCCESS"
    echo "All tests passed - refactoring did not break functionality"
    exit 0
fi