#!/bin/bash

# Development File Cleanup System
echo "🧹 Development File Cleanup"
echo "============================"

echo "📊 Current untracked files:"
git status --porcelain | grep "^??" | wc -l | xargs echo "  Count:"

echo
echo "📂 File categories:"
echo "  Documentation: $(git status --porcelain | grep -c '\.md$' || echo 0)"
echo "  Test files: $(git status --porcelain | grep -c 'test' || echo 0)"  
echo "  Debug scripts: $(git status --porcelain | grep -c 'debug\|bulk\|check\|create' || echo 0)"
echo "  Analysis files: $(git status --porcelain | grep -c '\(\.png\|\.json\)$' || echo 0)"

echo
echo "🤔 What would you like to do?"
echo "1) Add important files to git"
echo "2) Clean up temporary files"  
echo "3) Show file list"
echo "4) Nothing (exit)"

read -p "Choose (1-4): " choice

case $choice in
    1)
        echo "📋 Adding useful files..."
        git add *.md scripts/*.sh 2>/dev/null || true
        echo "✅ Added documentation and scripts"
        ;;
    2)
        echo "🗑️ This would remove temporary files. Are you sure? (y/N)"
        read -r confirm
        if [[ $confirm =~ ^[Yy]$ ]]; then
            rm -f debug-* bulk-* check-* create-* test-* *.png *.json 2>/dev/null || true
            echo "✅ Cleaned temporary files"
        else
            echo "❌ Cleanup cancelled"
        fi
        ;;
    3)
        echo "📄 Untracked files:"
        git status --porcelain | grep "^??" | sed 's/^?? /  /'
        ;;
    4)
        echo "👋 No changes made"
        ;;
    *)
        echo "❌ Invalid choice"
        ;;
esac