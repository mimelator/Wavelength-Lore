# 🌊⚡ WAVELENGTH MINI QUICKSTART ⚡🌊

Quick, copyable steps to start a dev session, discover tools, and run basic checks.

## Prerequisites
- Node.js (recommended v16 or newer)
- Git configured for the repository
- If you work with containers: Docker installed

## 🚀 INSTANT START

### 👨‍💻 DEVELOPER INITIALIZATION (Run Once):
```bash
# 1. Developer initializes the session environment (ONE TIME)
node start-wavelength-session.js

# 2. Check session status and available tools
node session-status.js

# 3. Run basic health check
node scripts/unified/test-runner.js health --url https://wavelengthlore.com
```

### 🤖 AI AGENT STARTUP (Each Agent):
**AI AGENTS JOIN THE ESTABLISHED SESSION:**
```javascript
// REQUIRED FIRST ACTION - Agents check session status via MCP
await mcp.callTool("wavelength_server_status", {check: "full", initialize: false});
```

**Workflow:**
1. 👨‍💻 **Developer** runs session initialization once
2. 🤖 **Agents** join the session and check status via MCP
3. 🚀 **Everyone** works in the same initialized environment

Tip: if any of the scripts above fail with "file not found", run `ls` in the repo root to confirm the script exists and that you are on the `main` branch.

## 🧠 MCP TOOLS (Direct Agent Access)
**⚠️ IMPORTANT: MCP tools are for AI AGENTS ONLY - not for developers!**

### 🚨 MANDATORY FIRST ACTION FOR AGENTS:
```javascript
// AGENTS MUST INVOKE THIS IMMEDIATELY BEFORE ANY OTHER ACTIONS
await mcp.callTool("wavelength_server_status", {check: "full", initialize: true});
```

### ✅ APPROPRIATE MCP Usage (After Status Check):
```javascript
// AI agents call these directly via Model Context Protocol
await mcp.callTool("wavelength_validate", {content: "character bio", type: "character"});
await mcp.callTool("firebase_query", {path: "/episodes", operation: "read"});
await mcp.callTool("wavelength_character_search", {query: "goblin traits", limit: 5});
```

### ❌ INAPPROPRIATE - Don't Do This:
- Developers trying to call `mcp.callTool()` in regular code
- Using MCP syntax in Node.js scripts or applications
- Calling MCP tools from terminal or shell scripts
- Mixing MCP calls with regular JavaScript functions

### 🎯 MCP Best Practices:
1. **Agents Only**: MCP is exclusively for AI agents communicating with tools
2. **Clear Parameters**: Always provide complete, well-structured parameters
3. **Error Handling**: Agents should handle tool failures gracefully
4. **Appropriate Tools**: Use the right tool for the task (validate for validation, query for data)
5. **No Side Effects**: Don't use MCP for actions that modify production systems directly

## 🛠️ **CORE TOOLS**

**🤖 For AI Agents (MCP Protocol):**
```javascript
// Tests
await mcp.callTool("wavelength_test_runner", {command: "health", url: "https://wavelengthlore.com"});

// AWS operations
await mcp.callTool("wavelength_aws_manager", {operation: "status", service: "all"});

// Deployment
await mcp.callTool("wavelength_deployment_manager", {action: "status"});

// Secure commit
await mcp.callTool("wavelength_smart_commit", {action: "prepare"});
```

**👨‍💻 For Developers (Node.js):**
- Tests: `node scripts/unified/test-runner.js [command]`
- AWS helpers: `node scripts/unified/aws-manager.js [operation]`
- Deploy: `node scripts/unified/deployment-manager.js [action]`
- Commit (secure): `node scripts/unified/smart-commit.js`

## 🔍 **DISCOVER MORE ON DEMAND**
Use the discovery utilities to find specific tooling or guidance without loading the full docs.

**🤖 For AI Agents (MCP Protocol):**
```javascript
// Find specific tools by keyword
await mcp.callTool("wavelength_tool_finder", {keyword: "docker"});

// Get targeted help for an issue
await mcp.callTool("wavelength_help_finder", {problem: "build-failure"});

// List / open the full documentation index
await mcp.callTool("wavelength_doc_discoverer", {action: "list"});
```

**👨‍💻 For Developers (Node.js):**
```bash
node wavelength-tools/wavelength-tool-finder.js [keyword]
node wavelength-tools/wavelength-help-finder.js [problem]
node wavelength-tools/wavelength-doc-discoverer.js
```

## 🚨 **EMERGENCY / QUICK FIXES**
Use these quick helpers when something is broken in builds or config.

**🤖 For AI Agents (MCP Protocol):**
```javascript
// Docker validator
await mcp.callTool("wavelength_docker_validator", {check: "full"});

// Config discovery  
await mcp.callTool("wavelength_config_discovery", {scan: "all"});

// Build monitor
await mcp.callTool("wavelength_build_monitor", {action: "check"});
```

**👨‍💻 For Developers (Node.js):**
- Docker validator: `node wavelength-tools/wavelength-docker-build-validator.js`
- Config discovery: `node wavelength-tools/wavelength-config-discovery.js`
- Build monitor: `node wavelength-tools/wavelength-enhanced-build-monitor.js`

## Try this — fast verification (3 mins)

**🤖 AI Agents (MCP Protocol):**
```javascript
// 1) Join the session and confirm status
await mcp.callTool("wavelength_server_status", {check: "full", initialize: false});

// 2) Run the Docker validator to ensure startup scripts sync
await mcp.callTool("wavelength_docker_validator", {check: "full", validate: "startup_scripts"});

// 3) If validator shows failures, run diagnostic for details
await mcp.callTool("wavelength_docker_diagnostic", {action: "analyze", detail: "full"});
```

**👨‍💻 Developers (Node.js):**
```bash
# 2) Docker validator
node wavelength-tools/wavelength-docker-build-validator.js

# 3) Diagnostic helper
node wavelength-tools/wavelength-docker-build-diagnostic.js
```

## Notes
- The discovery tools were added to keep large docs archived but discoverable on demand.
- If you need the longer Quickstart, use `node wavelength-tools/wavelength-doc-discoverer.js` to open the full guide.

---
Need anything added to this mini quickstart (platform-specific steps, CI commands, or SSO notes)? Reply with what you want and I’ll update it.