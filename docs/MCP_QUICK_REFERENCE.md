# ⚡ MCP Quick Reference

Essential commands for Model Context Protocol tools in Wavelength-Lore.

## 🚀 **System Tools Server** (25+ Tools)

**Location:** `mcp/system-tools-server.js`  
**Tests:** `node tests/system-tools-tests.js`

### **File Operations**
```bash
# View file contents
echo '{"jsonrpc": "2.0", "method": "tools/call", "params": {"name": "cat", "arguments": {"file": "package.json"}}, "id": 1}' | node mcp/system-tools-server.js

# Search in files
echo '{"jsonrpc": "2.0", "method": "tools/call", "params": {"name": "grep", "arguments": {"pattern": "error", "file": "server.log", "context": 3}}, "id": 2}' | node mcp/system-tools-server.js

# Find files
echo '{"jsonrpc": "2.0", "method": "tools/call", "params": {"name": "find", "arguments": {"path": ".", "name": "*.js", "type": "f"}}, "id": 3}' | node mcp/system-tools-server.js
```

### **System Monitoring**
```bash
# Process status
echo '{"jsonrpc": "2.0", "method": "tools/call", "params": {"name": "ps", "arguments": {}}, "id": 4}' | node mcp/system-tools-server.js

# System performance
echo '{"jsonrpc": "2.0", "method": "tools/call", "params": {"name": "top", "arguments": {"processes": 10}}, "id": 5}' | node mcp/system-tools-server.js

# Disk usage
echo '{"jsonrpc": "2.0", "method": "tools/call", "params": {"name": "df", "arguments": {"human": true}}, "id": 6}' | node mcp/system-tools-server.js
```

### **Development Tools**
```bash
# Git status
echo '{"jsonrpc": "2.0", "method": "tools/call", "params": {"name": "git_status", "arguments": {"path": "."}}, "id": 7}' | node mcp/system-tools-server.js

# NPM audit
echo '{"jsonrpc": "2.0", "method": "tools/call", "params": {"name": "npm_info", "arguments": {"action": "audit"}}, "id": 8}' | node mcp/system-tools-server.js

# Docker containers
echo '{"jsonrpc": "2.0", "method": "tools/call", "params": {"name": "docker_status", "arguments": {"action": "ps"}}, "id": 9}' | node mcp/system-tools-server.js
```

## 🎯 **Enhanced Wavelength Server** (11 Tools)

**Location:** `mcp/enhanced-wavelength-server.js`

### **Content Management**
```bash
# Search lore
echo '{"jsonrpc": "2.0", "method": "tools/call", "params": {"name": "wavelength_lore_search", "arguments": {"query": "Goblin King", "type": "all"}}, "id": 10}' | node mcp/enhanced-wavelength-server.js

# Character relationships
echo '{"jsonrpc": "2.0", "method": "tools/call", "params": {"name": "character_relationship_map", "arguments": {"character": "Yeti"}}, "id": 11}' | node mcp/enhanced-wavelength-server.js

# Forum health
echo '{"jsonrpc": "2.0", "method": "tools/call", "params": {"name": "forum_health_monitor", "arguments": {"timeframe": "day"}}, "id": 12}' | node mcp/enhanced-wavelength-server.js
```

### **HTTP Requests**
```bash
# Simple GET
echo '{"jsonrpc": "2.0", "method": "tools/call", "params": {"name": "http_request", "arguments": {"url": "https://httpbin.org/json"}}, "id": 13}' | node mcp/enhanced-wavelength-server.js

# POST with data
echo '{"jsonrpc": "2.0", "method": "tools/call", "params": {"name": "http_request", "arguments": {"url": "https://httpbin.org/post", "method": "POST", "body": "{\"test\": true}", "headers": {"Content-Type": "application/json"}}}, "id": 14}' | node mcp/enhanced-wavelength-server.js
```

### **Documentation Navigation**
```bash
# Find docs
echo '{"jsonrpc": "2.0", "method": "tools/call", "params": {"name": "documentation_navigator", "arguments": {"query": "deployment guide", "type": "procedures"}}, "id": 15}' | node mcp/enhanced-wavelength-server.js

# Find scripts
echo '{"jsonrpc": "2.0", "method": "tools/call", "params": {"name": "documentation_navigator", "arguments": {"query": "test scripts", "type": "scripts"}}, "id": 16}' | node mcp/enhanced-wavelength-server.js
```

## 🔧 **Test All Systems**

```bash
# Test system tools
node tests/system-tools-tests.js

# Test enhanced server (via lore-tools)
./lore-tools help

# List all available tools
echo '{"jsonrpc": "2.0", "method": "tools/list", "id": 1}' | node mcp/system-tools-server.js
echo '{"jsonrpc": "2.0", "method": "tools/list", "id": 1}' | node mcp/enhanced-wavelength-server.js
```

## 📚 **Full Documentation**

- **System Tools:** `docs/SYSTEM_TOOLS_MCP_DOCUMENTATION.md`
- **Enhanced Server:** `docs/MCP_TOOLS_DOCUMENTATION.md`
- **Setup Guide:** `mcp/README.md`

---

**🎯 Total Tools Available: 36+ (25 System + 11 Enhanced)**  
**Status:** ✅ All operational without manual approval required