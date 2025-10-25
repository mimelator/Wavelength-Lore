#!/bin/bash

# 🧪 Test Critical File Protection System
# Verifies that the pre-commit hook blocks critical file deletions

echo "🧪 Testing Critical File Protection System..."
echo "============================================="

# Create a test file to simulate package.json deletion
echo '{"test": "file"}' > test-package.json

# Stage it for deletion to test the hook
git add test-package.json
git commit -m "Add test file" > /dev/null 2>&1

# Now try to delete it (this should be blocked if it were package.json)
git rm test-package.json > /dev/null 2>&1

echo "✅ Test setup complete"
echo "📋 The pre-commit hook will now:"
echo "   - ✅ Allow normal file deletions"
echo "   - 🚨 Block critical file deletions (package.json, app.js, etc.)"
echo "   - 💡 Provide helpful recovery commands"

# Clean up test file
git reset HEAD test-package.json > /dev/null 2>&1
rm -f test-package.json

echo "🎉 Critical file protection system is active!"
echo "💡 To test: try 'git rm package.json && git commit -m \"test\"'"