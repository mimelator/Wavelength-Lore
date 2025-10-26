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