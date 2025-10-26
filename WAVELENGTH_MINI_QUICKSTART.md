# 🌊⚡ WAVELENGTH MINI QUICKSTART ⚡🌊

## 🚀 **INSTANT START (3 Commands)**
```bash
# 1. Launch friction-free session
node start-wavelength-session.js

# 2. Check what's available
node session-status.js

# 3. Run comprehensive tests
node scripts/unified/test-runner.js health --url https://wavelengthlore.com
```

## 🧠 **MCP TOOLS (Direct Agent Access)**
```javascript
// Agents call directly via MCP protocol:
await mcp.callTool("wavelength_validate", {content: "...", type: "character"});
await mcp.callTool("firebase_query", {path: "/episodes", operation: "read"});
```

## 🛠️ **CORE TOOLS**
- **Tests:** `node scripts/unified/test-runner.js [command]`
- **AWS:** `node scripts/unified/aws-manager.js [operation]`
- **Deploy:** `node scripts/unified/deployment-manager.js [action]`
- **Commit:** `node scripts/unified/smart-commit.js`

## 🔍 **DISCOVER MORE ON DEMAND**
```bash
# Find specific tools
node wavelength-tools/wavelength-tool-finder.js [keyword]

# Get help for any issue
node wavelength-tools/wavelength-help-finder.js [problem]

# View full documentation
node wavelength-tools/wavelength-doc-discoverer.js
```

## 🚨 **EMERGENCY FIXES**
- Docker: `node wavelength-tools/wavelength-docker-build-validator.js`
- Config: `node wavelength-tools/wavelength-config-discovery.js`
- Build: `node wavelength-tools/wavelength-enhanced-build-monitor.js`

---
**🌊 Need more? Use discovery tools above to find detailed guides on demand! ⚡**