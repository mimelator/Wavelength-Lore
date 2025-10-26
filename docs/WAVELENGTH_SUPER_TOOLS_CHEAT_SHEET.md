# 🚀 WAVELENGTH SUPER TOOLS - INSTANT CHEAT SHEET

## ⛔ HABIT BREAKERS - STOP & THINK!

**Before typing ANY shell command, ask:**
> "Do I have a WAVELENGTH SUPER TOOL for this?"

## 🎯 MOST COMMON REPLACEMENTS

### 🌐 HTTP Requests (replaces curl)
```bash
# OLD: curl -X GET https://api.com/data
# NEW: Use http_request WAVELENGTH SUPER TOOL
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "http_request", "arguments": {"url": "https://api.com/data", "method": "GET"}}}' | node mcp/enhanced-wavelength-server.js
```

### ⚡ Node Execution (replaces node commands)
```bash
# OLD: node -e "console.log('test')"
# NEW: Use node_execute WAVELENGTH SUPER TOOL
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "node_execute", "arguments": {"command": "custom", "script": "console.log(\"test\")", "forceExit": true}}}' | node mcp/enhanced-wavelength-server.js
```

### 📄 File Operations (replaces cat, grep, etc.)
```bash
# OLD: cat package.json
# NEW: Use cat WAVELENGTH SUPER TOOL
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "cat", "arguments": {"file": "package.json"}}}' | node mcp/system-tools-server.js

# OLD: grep "error" server.log  
# NEW: Use grep WAVELENGTH SUPER TOOL
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "grep", "arguments": {"pattern": "error", "file": "server.log"}}}' | node mcp/system-tools-server.js
```

### 🔧 System Operations (replaces ps, git, etc.)
```bash
# OLD: ps aux
# NEW: Use ps WAVELENGTH SUPER TOOL
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "ps", "arguments": {"options": "aux"}}}' | node mcp/system-tools-server.js

# OLD: git status
# NEW: Use git_status WAVELENGTH SUPER TOOL  
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "git_status", "arguments": {}}}' | node mcp/system-tools-server.js
```

## 🧠 MENTAL TRIGGER PHRASES

**When you think:** "I need to check..." → **Ask:** "Which WAVELENGTH SUPER TOOL?"
**When you think:** "Let me curl..." → **Stop:** "Use http_request SUPER TOOL!"
**When you think:** "I'll just node..." → **Stop:** "Use node_execute SUPER TOOL!"

## 🎆 WAVELENGTH MINDSET

> **"I don't use primitive shell tools - I have ENTERPRISE-GRADE WAVELENGTH SUPER POWERS!"**

## 📚 Full Documentation
- Enhanced Tools: `/docs/WAVELENGTH_TOOLS_DOCUMENTATION.md`
- System Tools: 25+ available in `/mcp/system-tools-server.js`
- Build Tools: `build_verification_tool` and more

---
**🚀 Remember: You have 37+ WAVELENGTH SUPER TOOLS - use them!**