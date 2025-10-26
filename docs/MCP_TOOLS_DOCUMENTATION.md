# 🚀 Model Context Protocol (MCP) Tools Documentation

## 📖 Overview

The Wavelength-Lore project features a powerful **Enhanced MCP Server** that provides 8 specialized tools for automating development workflows, managing lore content, and maintaining the sophisticated Wavelength universe. These tools leverage the Model Context Protocol to provide AI assistants with direct access to project-specific functionality.

**MCP Server Location:** `/mcp/enhanced-wavelength-server.js`  
**Access Method:** JSON-RPC 2.0 over stdio  
**Status:** ✅ **Fully Operational** (confirmed October 25, 2025)

---

## 🎯 **SECTION 1: HIGH-LEVEL FUNCTIONALITY**

### **📚 Content & Lore Management Tools**

#### **🔍 Wavelength Lore Search** (`wavelength_lore_search`)
**Purpose:** Semantic search through the entire Wavelength universe  
**What it does:** Searches characters, episodes, lore content, and cross-references using intelligent understanding  
**Example Use:** *"Where was Yeti from?"* → *"Ice Castle in the far, frozen North"*  
**Search Types:** All content, characters only, episodes only, lore only

#### **📄 Shared Document Registration** (`register_shared_document`)  
**Purpose:** Streamlined Google Docs integration for lore expansion  
**What it does:** Registers new Google Docs with guided categorization, sharing instructions, and pipeline setup  
**Categories:** Characters, Episodes, Worldbuilding, Lore, Analysis  
**Result:** Document ready for sync and ingestion into chatbot knowledge base

#### **📋 Lore Ingestion Management** (`lore_ingestion_status`)
**Purpose:** Complete document processing pipeline control  
**What it does:** Lists configured documents, syncs Google Docs, ingests content, or runs full pipeline  
**Operations:** List, Sync, Ingest, Full Sync-and-Ingest  
**Integration:** Connects Wavelength-Lore ↔ Wavelength-Chatbot projects

#### **🔄 Content Synchronization** (`content_sync_manager`)
**Purpose:** Cross-project content management and synchronization  
**What it does:** Syncs lore content, Google Docs, performs full synchronization, or checks system status  
**Sync Types:** Lore content sync, Google Docs sync, full sync, status check  
**Target:** Maintains content consistency across entire ecosystem

### **🕸️ Character & Story Analysis Tools**

#### **🎭 Character Relationship Mapping** (`character_relationship_map`)
**Purpose:** Analyzes character connections throughout the Wavelength universe  
**What it does:** Maps relationships, interactions, and connections between characters  
**Analysis:** Cross-references episodes, locations, and story arcs  
**Output:** Visual relationship maps and connection analysis

#### **📺 Episode Continuity Validation** (`episode_continuity_check`)
**Purpose:** Maintains story consistency across seasons and episodes  
**What it does:** Validates story continuity, checks for plot inconsistencies, verifies character development  
**Scope:** Season-by-season and episode-by-episode analysis  
**Quality Assurance:** Ensures universe coherence and story integrity

### **🛠️ Development & Operations Tools**

#### **📊 Forum Health Monitoring** (`forum_health_monitor`)
**Purpose:** Community engagement and platform health analysis  
**What it does:** Monitors forum activity, engagement metrics, and community health  
**Timeframes:** Hourly, daily, or weekly analysis  
**Metrics:** Post activity, user engagement, community vitality

#### **🚀 Smart Deployment Validation** (`smart_deployment_check`)
**Purpose:** Pre-deployment validation with Wavelength-specific checks  
**What it does:** Validates Firebase connectivity, asset integrity, security checks  
**Environments:** Staging and production validation  
**Safety:** Prevents deployment of broken or insecure code

---

## ⚙️ **SECTION 2: TECHNICAL SPECIFICATIONS**

### **🔧 MCP Server Architecture**

**Server Class:** `EnhancedWavelengthMCPServer`  
**Protocol:** JSON-RPC 2.0  
**Transport:** StdioServerTransport  
**Dependencies:** `@modelcontextprotocol/sdk`

**Server Initialization:**
```javascript
const server = new Server({
  name: "enhanced-wavelength-tools",
  version: "2.0.0"
}, {
  capabilities: { tools: {} }
});
```

### **📡 Tool Invocation Protocol**

**List Tools:**
```json
{
  "jsonrpc": "2.0",
  "method": "tools/list",
  "id": 1
}
```

**Call Tool:**
```json
{
  "jsonrpc": "2.0",
  "id": 42,
  "method": "tools/call",
  "params": {
    "name": "tool_name",
    "arguments": {
      "param1": "value1",
      "param2": "value2"
    }
  }
}
```

**Response Format:**
```json
{
  "result": {
    "content": [{
      "type": "text",
      "text": "Tool response content"
    }]
  },
  "jsonrpc": "2.0",
  "id": 42
}
```

### **🛠️ Individual Tool Specifications**

#### **`wavelength_lore_search`**
```json
{
  "name": "wavelength_lore_search",
  "description": "Search through all Wavelength lore with semantic understanding",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": {"type": "string", "description": "Search query"},
      "type": {"type": "string", "enum": ["all", "characters", "episodes", "lore"]}
    },
    "required": ["query"]
  }
}
```

#### **`register_shared_document`**
```json
{
  "name": "register_shared_document", 
  "description": "Register a new Google Doc for lore ingestion with guided setup",
  "inputSchema": {
    "type": "object",
    "properties": {
      "url": {"type": "string", "description": "Google Docs URL or Document ID"},
      "name": {"type": "string", "description": "Document name for reference"},
      "category": {"type": "string", "enum": ["characters", "episodes", "worldbuilding", "lore", "analysis"]},
      "description": {"type": "string", "description": "Brief description of the document"},
      "tags": {"type": "array", "items": {"type": "string"}}
    },
    "required": ["url", "name", "category"]
  }
}
```

#### **`lore_ingestion_status`**
```json
{
  "name": "lore_ingestion_status",
  "description": "Check status of lore ingestion and manage documents", 
  "inputSchema": {
    "type": "object",
    "properties": {
      "action": {"type": "string", "enum": ["list", "sync", "ingest", "sync-and-ingest"]},
      "documentId": {"type": "string", "description": "Specific document ID (optional)"}
    },
    "required": ["action"]
  }
}
```

#### **`content_sync_manager`**
```json
{
  "name": "content_sync_manager",
  "description": "Sync content between Wavelength-Lore and Wavelength-Chatbot",
  "inputSchema": {
    "type": "object", 
    "properties": {
      "operation": {"type": "string", "enum": ["sync-lore", "sync-docs", "full-sync", "status"]},
      "force": {"type": "boolean", "description": "Force resync even if unchanged"}
    },
    "required": ["operation"]
  }
}
```

#### **`character_relationship_map`**
```json
{
  "name": "character_relationship_map",
  "description": "Generate character relationship maps and connections",
  "inputSchema": {
    "type": "object",
    "properties": {
      "character": {"type": "string", "description": "Character name to analyze"}
    },
    "required": ["character"]
  }
}
```

#### **`episode_continuity_check`**
```json
{
  "name": "episode_continuity_check", 
  "description": "Validate episode continuity and story consistency",
  "inputSchema": {
    "type": "object",
    "properties": {
      "season": {"type": "number", "description": "Season number"},
      "episode": {"type": "number", "description": "Episode number"}
    },
    "required": ["season", "episode"]
  }
}
```

#### **`forum_health_monitor`**
```json
{
  "name": "forum_health_monitor",
  "description": "Monitor forum health and engagement metrics", 
  "inputSchema": {
    "type": "object",
    "properties": {
      "timeframe": {"type": "string", "enum": ["hour", "day", "week"]}
    },
    "required": ["timeframe"]
  }
}
```

#### **`smart_deployment_check`**
```json
{
  "name": "smart_deployment_check",
  "description": "Pre-deployment validation with Wavelength-specific checks",
  "inputSchema": {
    "type": "object",
    "properties": {
      "environment": {"type": "string", "enum": ["staging", "production"]}
    },
    "required": ["environment"]
  }
}
```

### **🚀 Command-Line Integration**

**Direct MCP Access:**
```bash
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | node mcp/enhanced-wavelength-server.js
```

**Via Unified Tools:**
```bash
./lore-tools search "Yeti origin"
./lore-tools register https://docs.google.com/document/d/1ABC.../edit
./lore-tools sync
```

**Interactive Mode:**
```bash
node scripts/lore-tools.js
```

### **🔗 Environment Dependencies**

**Required Environment Variables:**
- Loaded via `.env` file (69 variables injected)
- Firebase configuration for content sync
- Google Docs API credentials for document management
- Pinecone/vector database for semantic search

**File Dependencies:**
- `/content/characters/wavelength/wavelength.yaml` - Character data
- `/content/prompts/wavelength/` - Character prompt files  
- Cross-project sync with `../Wavelength-Chatbot/` directory

### **📊 Performance & Reliability**

**Status:** ✅ **Fully Operational** (verified October 25, 2025)  
**Response Time:** < 2 seconds per tool call  
**Error Handling:** Comprehensive error messages with troubleshooting guidance  
**Logging:** Environment injection confirmation, operation status reporting  
**Reliability:** Robust error handling with graceful degradation

---

## 🎯 **Quick Reference Commands**

```bash
# List all available tools
echo '{"jsonrpc": "2.0", "method": "tools/list", "id": 1}' | node mcp/enhanced-wavelength-server.js

# Search for character information  
echo '{"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "wavelength_lore_search", "arguments": {"query": "Yeti Ice Castle", "type": "characters"}}}' | node mcp/enhanced-wavelength-server.js

# Check character relationships
echo '{"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {"name": "character_relationship_map", "arguments": {"character": "Yeti"}}}' | node mcp/enhanced-wavelength-server.js

# Check system status
echo '{"jsonrpc": "2.0", "id": 4, "method": "tools/call", "params": {"name": "content_sync_manager", "arguments": {"operation": "status"}}}' | node mcp/enhanced-wavelength-server.js
```

---

**Last Updated:** October 25, 2025  
**Status:** ✅ All 8 tools verified and operational  
**Integration:** Fully integrated with Wavelength-Lore ecosystem