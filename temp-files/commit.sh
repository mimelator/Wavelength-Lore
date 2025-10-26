#!/bin/bash

# Simple, Clean Git Commit System
# Usage: ./commit.sh "commit message"

set -e

echo "🚀 Clean Commit System"
echo "======================="

# Check for staged changes
if git diff --cached --quiet; then
    echo "❌ No staged changes found."
    echo "💡 Use 'git add <files>' to stage changes first."
    exit 1
fi

# Get commit message
if [ $# -eq 0 ]; then
    echo "📝 Enter commit message:"
    read -r commit_message
else
    commit_message="$*"
fi

# Show what will be committed
echo "📋 Files to commit:"
git diff --cached --name-status | sed 's/^/  /'

echo
echo "💬 Commit message: $commit_message"
echo

# Confirm
read -p "🤔 Proceed? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelled"
    exit 1
fi

# Create simple commit message file to avoid command line issues
echo "$commit_message" > /tmp/simple_commit.txt

# Commit
git commit -F /tmp/simple_commit.txt
rm /tmp/simple_commit.txt

echo "✅ Committed successfully!"

# Ask about push
read -p "🚀 Push to production? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git push origin main
    echo "🎉 Pushed to production!"
else
    echo "⏸️ Ready to push when you want"
fi