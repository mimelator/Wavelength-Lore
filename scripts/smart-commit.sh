#!/bin/bash

# 🚀 Smart Commit System - Reliable Git Operations
# Handles large commit messages and provides clear feedback
# Enhanced with security key detection and validation

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Security patterns to detect
SECURITY_PATTERNS=(
    "sk_live_[a-zA-Z0-9]+"              # Stripe live keys
    "sk_test_[a-zA-Z0-9]+"              # Stripe test keys
    "AKIA[0-9A-Z]{16}"                  # AWS access keys
    "AIza[0-9A-Za-z\\-_]{35}"           # Google API keys
    "ghp_[a-zA-Z0-9]{36}"               # GitHub tokens
    "[0-9a-f]{32}"                      # Generic 32-char hex
    "Bearer [a-zA-Z0-9\\-\\._~\\+\\/]+=*" # Bearer tokens
)

echo -e "${BLUE}🚀 SMART COMMIT SYSTEM WITH SECURITY${NC}"
echo "======================================="

# Function to scan for security keys
security_scan() {
    local skip_security="${1:-false}"
    
    if [ "$skip_security" = "true" ]; then
        echo -e "${YELLOW}⚠️ Security scan skipped by user${NC}"
        return 0
    fi
    
    echo -e "${BLUE}🔐 Scanning for security keys...${NC}"
    
    local security_issues=()
    local staged_files=$(git diff --cached --name-only)
    
    for file in $staged_files; do
        if [ -f "$file" ]; then
            for pattern in "${SECURITY_PATTERNS[@]}"; do
                if grep -qE "$pattern" "$file" 2>/dev/null; then
                    security_issues+=("POTENTIAL KEY/TOKEN in $file")
                fi
            done
            
            # Check for .env files
            if [[ "$file" == *.env* ]]; then
                security_issues+=("ENVIRONMENT FILE: $file")
            fi
        fi
    done
    
    if [ ${#security_issues[@]} -gt 0 ]; then
        echo -e "${RED}🚨 SECURITY ISSUES DETECTED!${NC}"
        for issue in "${security_issues[@]}"; do
            echo -e "${RED}   ❌ $issue${NC}"
        done
        echo -e "${YELLOW}⚠️ Continue anyway? (y/N):${NC}"
        read -r security_override
        
        if [[ ! $security_override =~ ^[Yy]$ ]]; then
            echo -e "${RED}❌ Commit cancelled for security${NC}"
            return 1
        fi
    else
        echo -e "${GREEN}✅ Security scan passed${NC}"
    fi
    
    return 0
}

# Function to create commit message file
create_commit_message() {
    local commit_type="$1"
    local commit_summary="$2"
    local skip_security="${3:-false}"
    
    local security_status="🔐 SCANNED"
    if [ "$skip_security" = "true" ]; then
        security_status="⚠️ SKIPPED"
    fi
    
    cat > /tmp/commit_message.txt << EOF
${commit_type}: ${commit_summary}

## 📋 Changes Summary:
$(git diff --cached --name-status | sed 's/^/- /')

## 🔍 Detailed Changes:
$(git diff --cached --stat)

## 🛡️ Security & Validation:
- Security Scan: ${security_status}
- Critical Files: $(git diff --cached --name-status | grep '^D' | cut -f2 | grep -E '(package\.json|app\.js|index\.js|\.env)' > /dev/null && echo "⚠️ CRITICAL DELETIONS" || echo "✅ SAFE")
- Tests: $(if [ -f package.json ] && timeout 30 npm test > /dev/null 2>&1; then echo "✅ PASSED"; else echo "❌ FAILED"; fi)
- Lint: $(if [ -f package.json ] && timeout 15 npm run lint > /dev/null 2>&1; then echo "✅ CLEAN"; else echo "⚠️ ISSUES"; fi)

Generated: $(date)
EOF
}

# Critical files that should never be deleted
CRITICAL_FILES=(
    "package.json"
    "package-lock.json"
    "app.js"
    "index.js"
    ".env"
    "README.md"
    "Dockerfile"
    ".gitignore"
)

# Function to check for critical file deletions
check_critical_deletions() {
    local deleted_files=$(git diff --cached --name-status | grep '^D' | cut -f2)
    local critical_deletions=()
    
    for file in $deleted_files; do
        for critical in "${CRITICAL_FILES[@]}"; do
            if [[ "$file" == "$critical" ]]; then
                critical_deletions+=("$file")
            fi
        done
    done
    
    if [ ${#critical_deletions[@]} -gt 0 ]; then
        echo -e "${RED}🚨 CRITICAL FILE DELETION DETECTED!${NC}"
        echo -e "${RED}The following critical files are being deleted:${NC}"
        for file in "${critical_deletions[@]}"; do
            echo -e "${RED}  ❌ $file${NC}"
        done
        echo
        echo -e "${YELLOW}⚠️  This could break the application!${NC}"
        echo -e "${YELLOW}🤔 Are you sure you want to delete these files? (y/N):${NC}"
        read -r critical_confirm
        
        if [[ ! $critical_confirm =~ ^[Yy]$ ]]; then
            echo -e "${GREEN}✅ Commit cancelled for safety${NC}"
            echo -e "${BLUE}💡 To unstage deletions: git restore --staged ${critical_deletions[*]}${NC}"
            return 1
        else
            echo -e "${RED}⚠️  Proceeding with critical file deletions (user confirmed)${NC}"
        fi
    fi
    return 0
}

# Parse arguments
skip_security="false"
if [[ "$1" == "--skip-security" ]]; then
    skip_security="true"
    shift
fi

# Check if we have staged changes
if ! git diff --cached --quiet; then
    echo -e "${GREEN}✅ Found staged changes${NC}"
    
    # Security scan first (unless skipped)
    if ! security_scan "$skip_security"; then
        exit 1
    fi
    
    # Check for critical file deletions
    if ! check_critical_deletions; then
        exit 1
    fi
    
    # Get commit type and message
    if [ $# -eq 0 ]; then
        echo -e "${YELLOW}📝 Enter commit type (feat/fix/docs/refactor/test/security):${NC}"
        read -r commit_type
        echo -e "${YELLOW}📝 Enter brief summary:${NC}"
        read -r commit_summary
    else
        commit_type="$1"
        commit_summary="$2"
    fi
    
    # Create detailed commit message
    create_commit_message "$commit_type" "$commit_summary" "$skip_security"
    
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