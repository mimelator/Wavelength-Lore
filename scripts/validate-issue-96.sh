#!/bin/bash

# ==============================================================================
# GitHub Issue #96 Validation Script
# ==============================================================================
#
# This script validates that GitHub Issue #96 is fixed:
# "Defect in Merch Store: Image FX not passed to Printify"
#
# Usage: bash scripts/validate-issue-96.sh
#
# ==============================================================================

set -e

echo ""
echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                           ║"
echo "║  GitHub Issue #96 Validation: Effects Passed to Printify                  ║"
echo "║                                                                           ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""

# Check if server is running
echo "✓ Checking if server is running..."
if ! curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo ""
    echo "❌ Server is not running on port 3001"
    echo ""
    echo "Please start the server in another terminal:"
    echo "  npm start"
    echo ""
    exit 1
fi

echo "✓ Server is healthy"
echo ""

# Run the validation test
echo "═══════════════════════════════════════════════════════════════════════════"
echo "Running validation test..."
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

node tests/merchandise/test-effects-real-image.js

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo "VALIDATION COMPLETE"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""
echo "✅ If the test showed 'PRODUCT CREATED WITH EFFECTS' then GitHub Issue #96"
echo "   is FIXED and working correctly."
echo ""
echo "📋 Next Step: Check server console for effect processing logs"
echo ""
echo "   Look in the 'npm start' terminal for these lines:"
echo "   • 🔍 Converting effect selections to numeric parameters:"
echo "   • ✅ vibrancy selected - merging preset:"
echo "   • ✅ dramatic selected - merging preset:"
echo "   • ✅ Final effect parameters to apply:"
echo "   • ✅ Effects processing returned buffer"
echo ""
echo "For more details, see: GITHUB_ISSUE_96_VALIDATION.md"
echo ""
