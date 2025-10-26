# 🚀 Wavelength-Lore Custom MCP Server

## 🎯 What This Is
A custom Model Context Protocol (MCP) server that provides specialized tools for Wavelength-Lore development, designed to work with AI assistants like Amazon Q.

## 🛠️ Available Tools

### `wavelength_validate`
Validates Wavelength lore consistency and content structure
- **Input**: `content` (string), `type` (character|lore|episode|forum)
- **Output**: Validation results with issues and suggestions

### `firebase_query` 
Execute advanced Firebase queries with Wavelength context
- **Input**: `path` (string), `operation` (read|count|search)
- **Output**: Firebase query results

## 🚀 Usage

### Start the MCP Server
```bash
./mcp/start-mcp-server.sh
```

### Connect from IDE
Add to your MCP client configuration:
```json
{
  "mcpServers": {
    "wavelength-lore-tools": {
      "command": "node",
      "args": ["./mcp/wavelength-mcp-server.js"],
      "env": {}
    }
  }
}
```

### ⚠️ CRITICAL: Agent Usage Only (NOT for Developers)

**MCP Protocol is exclusively for AI agents** - developers should use the Node.js tools directly.

#### � SESSION WORKFLOW:

**👨‍💻 Developer Session Initialization (One Time):**
```bash
# Developer sets up the session environment once
node start-wavelength-session.js
```

**🤖 AI Agents Join Session:**
```javascript
// Agents join the established session (not initialize)
await mcp.callTool("wavelength_server_status", {check: "full", initialize: false});
```

#### ✅ APPROPRIATE - AI Agents (After Joining Session):
```javascript
// AI agents call these internally via Model Context Protocol
await mcp.callTool("wavelength_validate", {content: "character bio", type: "character"});
await mcp.callTool("firebase_query", {path: "/episodes", operation: "read"});
```

#### ❌ INAPPROPRIATE - Never Do This:
- Developers calling `mcp.callTool()` in application code
- Using MCP syntax in Node.js scripts
- Terminal/shell execution of MCP calls
- Production code containing MCP protocol calls

#### 🎯 For Developers - Use These Instead:
```bash
#### 🎯 Tool Usage by Role:

**🤖 AI Agents - Use MCP Protocol:**
```javascript
// Agents use MCP protocol exclusively
await mcp.callTool("wavelength_validate", {content: "character bio", type: "character"});
await mcp.callTool("firebase_query", {path: "/episodes", operation: "read"});
await mcp.callTool("wavelength_test_runner", {command: "validate", type: "character"});
```

**👨‍💻 Developers - Use Node.js Tools:**
```bash
# Developers use Node.js tools directly
node scripts/unified/wavelength-validator.js --type character
node scripts/unified/firebase-manager.js --path /episodes --operation read
```
```

#### 🧠 MCP Best Practices (Agents):
1. **Agent-Only**: Never use MCP outside of agent-to-tool communication
2. **Parameter Validation**: Always provide complete, structured parameters
3. **Error Handling**: Handle tool failures gracefully
4. **Tool Selection**: Use appropriate tools for specific tasks
5. **No Production Side Effects**: Avoid tools that directly modify live systems

## 🔧 Development

The server uses stdio transport and integrates directly with:
- Firebase Admin SDK (via existing helpers)
- Wavelength content validation logic
- Project-specific testing frameworks

## 🎯 Future Enhancements

- Smart test selection based on git changes
- AI-powered content generation tools
- Real-time performance monitoring
- Advanced lore cross-referencing
- Automated deployment validation

## 📡 Protocol
Uses Model Context Protocol (MCP) for seamless AI assistant integration.