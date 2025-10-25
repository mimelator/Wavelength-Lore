#!/bin/bash

# 🚀 Smart Commit System - Reliable Git Operations
# Handles large commit messages and provides clear feedback

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 SMART COMMIT SYSTEM${NC}"
echo "================================"

# Function to create commit message file
create_commit_message() {
    local commit_type="$1"
    local commit_summary="$2"
    
    cat > /tmp/commit_message.txt << EOF
${commit_type}: ${commit_summary}

## 📋 Changes Summary:
$(git diff --cached --name-status | sed 's/^/- /')

## 🔍 Detailed Changes:
$(git diff --cached --stat)

## ✅ Validation:
- Tests: $(if npm test > /dev/null 2>&1; then echo "✅ PASSED"; else echo "❌ FAILED"; fi)
- Security: $(if [ -f security-audit.js ] && node security-audit.js > /dev/null 2>&1; then echo "✅ CLEAN"; else echo "⚠️ REVIEW NEEDED"; fi)
- Lint: $(if npm run lint > /dev/null 2>&1; then echo "✅ CLEAN"; else echo "⚠️ REVIEW NEEDED"; fi)

Generated: $(date)
EOF
}

# Check if we have staged changes
if ! git diff --cached --quiet; then
    echo -e "${GREEN}✅ Found staged changes${NC}"
    
    # Get commit type and message
    if [ $# -eq 0 ]; then
        echo -e "${YELLOW}📝 Enter commit type (feat/fix/docs/refactor/test):${NC}"
        read -r commit_type
        echo -e "${YELLOW}📝 Enter brief summary:${NC}"
        read -r commit_summary
    else
        commit_type="$1"
        commit_summary="$2"
    fi
    
    # Create detailed commit message
    create_commit_message "$commit_type" "$commit_summary"
    
    echo -e "${BLUE}📄 Generated commit message:${NC}"
    cat /tmp/commit_message.txt
    echo
    
    echo -e "${YELLOW}🤔 Proceed with commit? (y/N):${NC}"
    read -r confirm
    
    if [[ $confirm =~ ^[Yy]$ ]]; then
        # Commit using message file (handles large messages properly)
        git commit -F /tmp/commit_message.txt
        
        echo -e "${GREEN}✅ Commit successful!${NC}"
        echo -e "${BLUE}📊 Current status:${NC}"
        git log --oneline -1
        
        echo -e "${YELLOW}🚀 Push to production? (y/N):${NC}"
        read -r push_confirm
        
        if [[ $push_confirm =~ ^[Yy]$ ]]; then
            git push origin main
            echo -e "${GREEN}🎉 Successfully pushed to production!${NC}"
        else
            echo -e "${YELLOW}⏸️  Commit ready to push when you're ready${NC}"
        fi
    else
        echo -e "${RED}❌ Commit cancelled${NC}"
    fi
    
    # Clean up
    rm -f /tmp/commit_message.txt
    
else
    echo -e "${RED}❌ No staged changes found${NC}"
    echo -e "${BLUE}💡 Current repository status:${NC}"
    git status --short
fi

echo -e "${BLUE}================================${NC}"
echo -e "${GREEN}✨ Smart commit system complete${NC}"