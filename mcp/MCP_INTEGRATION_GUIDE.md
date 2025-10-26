# 🚀 Wavelength MCP Integration Guide

## 🎯 What We've Built

**Two powerful MCP servers** with Wavelength-specific AI tools:

### Basic Server (`wavelength-mcp-server.js`)
- ✅ `wavelength_validate` - Content validation
- ✅ `firebase_query` - Database operations

### Enhanced Server (`enhanced-wavelength-server.js`) 
- 🔍 `wavelength_lore_search` - Semantic lore search
- 🕸️ `character_relationship_map` - Character connections
- 📺 `episode_continuity_check` - Story consistency
- 📊 `forum_health_monitor` - Community metrics
- 🚀 `smart_deployment_check` - Pre-deployment validation

## 🔌 IDE Integration Options

### Option 1: Claude Desktop
Copy `claude-desktop-config.json` to:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

### Option 2: VS Code with MCP Extension
```json
{
  "mcp.servers": {
    "wavelength-tools": {
      "command": "node",
      "args": ["./mcp/enhanced-wavelength-server.js"]
    }
  }
}
```

### Option 3: Direct Integration
```bash
# Start server manually
./mcp/start-mcp-server.sh

# Or enhanced version
node mcp/enhanced-wavelength-server.js
```

## 🎯 Revolutionary Capabilities

Once connected, AI assistants can:
- **Validate lore** in real-time during writing
- **Search characters** with semantic understanding  
- **Check episode continuity** automatically
- **Monitor forum health** with live metrics
- **Perform smart deployments** with Wavelength-specific checks

## 🚀 Next Level Features

The enhanced server integrates with:
- ✅ **Firebase Admin SDK** - Direct database access
- ✅ **Character Helpers** - Existing Wavelength logic
- ✅ **Lore System** - Content validation
- ✅ **Episode Management** - Story consistency
- ✅ **Forum Analytics** - Community insights

## 🔥 The Game Changer

**AI assistants with these tools can:**
- Understand Wavelength universe context
- Validate content against established lore
- Perform complex database operations
- Monitor system health in real-time
- Make intelligent deployment decisions

**This transforms development from reactive to proactive!** 🎉