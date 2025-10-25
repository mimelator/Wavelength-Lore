#!/bin/bash

# Production Validation Suite Wrapper Script
# Makes it easy to run different types of production validation

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_color() {
    printf "${1}${2}${NC}\n"
}

# Show help if requested or no arguments
if [[ "$1" == "--help" || "$1" == "-h" || $# -eq 0 ]]; then
    print_color $BLUE "🔍 Production Validation Suite"
    echo ""
    echo "Usage: $0 [MODE] [OPTIONS]"
    echo ""
    print_color $YELLOW "Modes:"
    echo "  quick     - Fast validation for CI/CD (1-2 minutes)"
    echo "  standard  - Standard validation (2-5 minutes)" 
    echo "  full      - Comprehensive validation (5-10 minutes)"
    echo "  custom    - Custom validation with specific checks"
    echo ""
    print_color $YELLOW "Custom Options:"
    echo "  --skip-images    - Skip image checking"
    echo "  --skip-static    - Skip static resource checking" 
    echo "  --skip-routes    - Skip route link checking"
    echo "  --skip-audio     - Skip audio file checking"
    echo "  --skip-vendor    - Skip vendor compatibility checking"
    echo ""
    print_color $YELLOW "Examples:"
    echo "  $0 quick                    # Quick validation"
    echo "  $0 standard                 # Standard validation"
    echo "  $0 full                     # Full validation"
    echo "  $0 custom --skip-images     # Custom without images"
    echo ""
    print_color $BLUE "Individual Checkers:"
    echo "  ./check_broken_images.js --prod      # Images only"
    echo "  ./check_static_resources.js --prod   # Static resources only"
    echo "  ./check_route_links.js --prod        # Routes only"
    echo "  ./check_audio_files.js --prod        # Audio files only"
    echo "  ./vendor-compatibility-check.js      # Vendor compatibility only"
    exit 0
fi

MODE="$1"
shift # Remove mode from arguments

print_color $BLUE "🚀 Starting Production Validation Suite..."
print_color $BLUE "🌐 Target: https://wavelengthlore.com"
print_color $BLUE "⚡ Mode: $MODE"
echo ""

case "$MODE" in
    "quick")
        print_color $YELLOW "⚡ Quick Mode: Running route and audio validation only"
        node production_validation.js --quick --skip-images --skip-static "$@"
        ;;
    "standard")
        print_color $YELLOW "📊 Standard Mode: Running all validations with standard timeouts"
        node production_validation.js "$@"
        ;;
    "full")
        print_color $YELLOW "🔍 Full Mode: Running comprehensive validation"
        node production_validation.js --full "$@"
        ;;
    "custom")
        print_color $YELLOW "🛠️  Custom Mode: Running with specified options"
        node production_validation.js "$@"
        ;;
    *)
        print_color $RED "❌ Unknown mode: $MODE"
        print_color $YELLOW "Valid modes: quick, standard, full, custom"
        echo "Use '$0 --help' for more information"
        exit 1
        ;;
esac

exit_code=$?

echo ""
case $exit_code in
    0)
        print_color $GREEN "🎉 Production validation PASSED!"
        ;;
    1)
        print_color $YELLOW "⚠️  Production validation completed with MINOR ISSUES"
        ;;
    2)
        print_color $RED "🚨 Production validation FAILED with CRITICAL ISSUES"
        ;;
    130)
        print_color $YELLOW "⚠️  Production validation INTERRUPTED by user"
        ;;
    *)
        print_color $RED "💥 Production validation encountered an ERROR (code: $exit_code)"
        ;;
esac

exit $exit_code