#!/bin/bash

# 🚨 Package.json Integrity Checker
# Quick validation script to detect corruption

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PKG_FILE="package.json"

echo "🔍 Checking package.json integrity..."

# Check if file exists
if [[ ! -f "$PKG_FILE" ]]; then
    echo -e "${RED}❌ CRITICAL: package.json not found!${NC}"
    exit 1
fi

# Check if file is valid JSON
if ! jq . "$PKG_FILE" >/dev/null 2>&1; then
    echo -e "${RED}❌ CRITICAL: package.json is not valid JSON!${NC}"
    exit 1
fi

# Check for required fields
REQUIRED_FIELDS=("name" "version" "description" "main" "scripts")
MISSING_FIELDS=()

for field in "${REQUIRED_FIELDS[@]}"; do
    if ! jq -e ".$field" "$PKG_FILE" >/dev/null 2>&1; then
        MISSING_FIELDS+=("$field")
    fi
done

# Check results
if [[ ${#MISSING_FIELDS[@]} -eq 0 ]]; then
    echo -e "${GREEN}✅ package.json integrity check PASSED${NC}"
    
    # Show basic info
    echo -e "${GREEN}📋 Package Info:${NC}"
    echo "  Name: $(jq -r .name "$PKG_FILE")"
    echo "  Version: $(jq -r .version "$PKG_FILE")"
    echo "  Scripts: $(jq -r '.scripts | keys | length' "$PKG_FILE") defined"
    echo "  Dependencies: $(jq -r '.dependencies | keys | length' "$PKG_FILE")"
    echo "  DevDependencies: $(jq -r '.devDependencies | keys | length' "$PKG_FILE")"
    exit 0
else
    echo -e "${RED}❌ CRITICAL: package.json CORRUPTION DETECTED!${NC}"
    echo -e "${RED}Missing required fields:${NC}"
    for field in "${MISSING_FIELDS[@]}"; do
        echo -e "${RED}  ❌ $field${NC}"
    done
    
    echo -e "\n${YELLOW}🆘 EMERGENCY RECOVERY:${NC}"
    echo "1. Stop all processes: pkill -f 'node\\|npm'"
    echo "2. Restore from git: git checkout HEAD -- package.json"
    echo "3. Reinstall dependencies: npm install"
    echo "4. Re-run this check: ./check-package-integrity.sh"
    
    exit 1
fi