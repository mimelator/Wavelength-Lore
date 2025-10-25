#!/bin/bash

# Package.json Guard Script
# Quick protection commands for daily development

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROTECTOR="./scripts/unified/package-protector.js"

# Ensure protector exists
if [[ ! -f "$PROTECTOR" ]]; then
    echo -e "${RED}❌ Package protector not found: $PROTECTOR${NC}"
    exit 1
fi

case "$1" in
    "backup")
        echo -e "${BLUE}🛡️ Creating package.json backup...${NC}"
        node "$PROTECTOR" backup
        ;;
    
    "check")
        echo -e "${BLUE}🔍 Validating package.json...${NC}"
        node "$PROTECTOR" validate
        ;;
    
    "restore")
        echo -e "${YELLOW}🔄 Restoring package.json...${NC}"
        node "$PROTECTOR" restore
        ;;
    
    "emergency")
        echo -e "${RED}🚨 EMERGENCY RECOVERY MODE${NC}"
        node "$PROTECTOR" emergency
        ;;
    
    "safe-run")
        if [[ -z "$2" ]]; then
            echo -e "${RED}❌ Usage: $0 safe-run <script-path> [args...]${NC}"
            exit 1
        fi
        
        echo -e "${BLUE}🛡️ Running script with protection: $2${NC}"
        node "./scripts/unified/safe-script-runner.js" "${@:2}"
        ;;
    
    "status")
        echo -e "${BLUE}📊 Package Protection Status${NC}"
        echo ""
        
        # Check if package.json exists and is valid
        if node "$PROTECTOR" validate >/dev/null 2>&1; then
            echo -e "${GREEN}✅ package.json: HEALTHY${NC}"
        else
            echo -e "${RED}❌ package.json: CORRUPTED${NC}"
        fi
        
        # Check for lock file
        if [[ -f ".package.lock" ]]; then
            echo -e "${YELLOW}🔒 Protection: ACTIVE${NC}"
            echo "   Lock details: $(cat .package.lock | jq -r '.process + " (" + (.timestamp | todate) + ")"' 2>/dev/null || echo "Invalid lock file")"
        else
            echo -e "${GREEN}🔓 Protection: INACTIVE${NC}"
        fi
        
        # Check backup count
        if [[ -d ".package-backups" ]]; then
            BACKUP_COUNT=$(ls -1 .package-backups/package.json.* 2>/dev/null | wc -l || echo 0)
            echo -e "${BLUE}💾 Backups: $BACKUP_COUNT available${NC}"
        else
            echo -e "${YELLOW}💾 Backups: None found${NC}"
        fi
        ;;
    
    "cleanup")
        echo -e "${BLUE}🧹 Cleaning old backups...${NC}"
        node "$PROTECTOR" cleanup
        ;;
    
    "auto-protect")
        echo -e "${BLUE}🤖 Setting up automatic protection...${NC}"
        
        # Create backup
        node "$PROTECTOR" backup
        
        # Add to .gitignore if not present
        if ! grep -q ".package-backups" .gitignore 2>/dev/null; then
            echo ".package-backups/" >> .gitignore
            echo "✅ Added .package-backups to .gitignore"
        fi
        
        if ! grep -q ".package.lock" .gitignore 2>/dev/null; then
            echo ".package.lock" >> .gitignore
            echo "✅ Added .package.lock to .gitignore"
        fi
        
        echo -e "${GREEN}✅ Automatic protection configured${NC}"
        ;;
    
    *)
        echo -e "${BLUE}Package.json Guard - Protection Commands${NC}"
        echo ""
        echo "Usage: $0 <command>"
        echo ""
        echo "Commands:"
        echo "  backup       Create timestamped backup"
        echo "  check        Validate package.json integrity"
        echo "  restore      Restore from latest backup"
        echo "  emergency    Full recovery sequence"
        echo "  safe-run     Run script with protection"
        echo "  status       Show protection status"
        echo "  cleanup      Remove old backups"
        echo "  auto-protect Setup automatic protection"
        echo ""
        echo "Examples:"
        echo "  $0 backup                    # Create backup before risky operation"
        echo "  $0 check                     # Quick health check"
        echo "  $0 safe-run test-runner.js   # Run script with protection"
        echo "  $0 emergency                 # Recover from corruption"
        ;;
esac