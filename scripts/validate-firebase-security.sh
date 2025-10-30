#!/bin/bash

# Firebase Security Rules Validation Runner
# Quick script to run comprehensive Firebase functionality tests

echo "🔒 Firebase Security Rules Validation"
echo "====================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Check if the server is running locally
LOCAL_RUNNING=false
if curl -s "http://localhost:3001" > /dev/null 2>&1; then
    LOCAL_RUNNING=true
    echo "✅ Local server detected at http://localhost:3001"
else
    echo "⚠️  Local server not running - will test production only"
fi

echo ""
echo "🚀 Running Server-Side Tests..."
echo "--------------------------------"

# Run server-side validation script
if [ -f "scripts/firebase-security-validation.js" ]; then
    if [ "$LOCAL_RUNNING" = true ]; then
        echo "Testing local development server..."
        node scripts/firebase-security-validation.js
        local_exit_code=$?
        
        echo ""
        echo "Testing production server..."
        NODE_ENV=production node scripts/firebase-security-validation.js
        prod_exit_code=$?
        
        if [ $local_exit_code -eq 0 ] && [ $prod_exit_code -eq 0 ]; then
            echo "✅ All server-side tests passed!"
        else
            echo "❌ Some server-side tests failed"
        fi
    else
        echo "Testing production server only..."
        NODE_ENV=production node scripts/firebase-security-validation.js
    fi
else
    echo "❌ Server-side validation script not found"
fi

echo ""
echo "📋 Client-Side Testing Instructions"
echo "-----------------------------------"
echo "To test client-side Firebase functionality:"
echo ""
echo "1. Open your browser and visit:"
if [ "$LOCAL_RUNNING" = true ]; then
    echo "   • Local: http://localhost:3001"
fi
echo "   • Production: https://wavelengthlore.com"
echo ""
echo "2. Open browser Developer Tools (F12)"
echo ""
echo "3. Go to any page with Firebase functionality:"
echo "   • Forum pages: /forum, /forum/popular, /forum/recent"
echo "   • Leaderboard: /leaderboard"
echo "   • Firebase debug: /firebase-debug"
echo ""
echo "4. In the Console, run:"
echo "   firebaseSecurityValidator.runAllTests()"
echo ""
echo "   Or test specific functionality:"
echo "   • firebaseSecurityValidator.testPublicDataAccess()"
echo "   • firebaseSecurityValidator.testLeaderboardFunctionality()"
echo "   • firebaseSecurityValidator.testForumFunctionality()"
echo ""

echo "📁 Test Files Created:"
echo "   • scripts/firebase-security-validation.js (Server-side)"
echo "   • static/js/firebase-security-validator.js (Client-side)"
echo ""

echo "🔧 Manual Testing Checklist:"
echo "   □ Home page loads without errors"
echo "   □ Character pages load correctly"
echo "   □ Lore pages load correctly" 
echo "   □ Episode pages load correctly"
echo "   □ Leaderboard page displays data"
echo "   □ Forum pages load and display posts"
echo "   □ Forum posting works (if authenticated)"
echo "   □ User profiles work (if authenticated)"
echo "   □ Admin functions require authentication"
echo "   □ No console errors related to Firebase permissions"
echo ""

echo "✅ Validation setup complete!"
echo "Run this script anytime to validate Firebase functionality after rule changes."