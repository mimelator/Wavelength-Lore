# 🚀 MCP Quick Setup Guide

## ✅ What Just Worked
Your MCP servers are **FULLY FUNCTIONAL**! We just tested:
- ✅ Dev server manager with 5 tools
- ✅ Server status monitoring 
- ✅ Automatic PID file cleanup

## 🔌 Connect to IDE (Choose One)

### Option A: Claude Desktop (Recommended)
1. **Find config file location:**
   ```bash
   # macOS
   ~/Library/Application Support/Claude/claude_desktop_config.json
   ```

2. **Add this config:**
   ```json
   {
     "mcpServers": {
       "wavelength-dev-tools": {
         "command": "node",
         "args": ["/Volumes/5bits/current/wavelength-dev/Wavelength-Lore/Wavelength-Lore.fresh/mcp/dev-server-manager.js"],
         "env": {}
       }
     }
   }
   ```

3. **Restart Claude Desktop**

### Option B: VS Code MCP Extension
1. Install MCP extension from marketplace
2. Add to VS Code settings.json:
   ```json
   {
     "mcp.servers": {
       "wavelength-tools": {
         "command": "node",
         "args": ["./mcp/dev-server-manager.js"]
       }
     }
   }
   ```

## 🎯 Test AI Commands

Once connected, try these with your AI assistant:
- **"Check server status"** → Uses `dev_server_status`
- **"Start the development server"** → Uses `dev_server_start`
- **"Show me recent logs"** → Uses `dev_server_logs`
- **"Restart with clean cache"** → Uses `dev_server_restart`

## 🚀 What This Enables

**Before**: Manual server management
**After**: AI-controlled development environment

Your AI can now:
- ✅ Start/stop/restart your server
- ✅ Monitor health and performance
- ✅ Access logs for debugging
- ✅ Manage development workflow

**This is the future of development!** 🎉