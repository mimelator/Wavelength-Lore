#!/bin/bash

# Export Firebase data to YAML files
# Usage: ./export-to-yaml.sh [type]
#   type: all (default), seasons, characters, lore, or prompts

cd "$(dirname "$0")/.."

TYPE="${1:-all}"

echo "🚀 Exporting Firebase data to YAML files..."
echo "📦 Export type: $TYPE"
echo ""

node scripts/export-firebase-to-yaml.js --type=$TYPE

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ YAML files have been updated!"
    echo "💡 Don't forget to commit these changes to git"
else
    echo ""
    echo "❌ Export failed"
    exit 1
fi
