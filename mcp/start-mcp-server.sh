#!/bin/bash

echo "🚀 Starting Wavelength MCP Server..."
echo "📡 Server will run on stdio transport"
echo "🔧 Available tools:"
echo "   - wavelength_validate: Validate lore content"
echo "   - firebase_query: Advanced Firebase queries"
echo ""

cd "$(dirname "$0")/.."
node mcp/wavelength-mcp-server.js