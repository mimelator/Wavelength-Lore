# 🚀 MCP Tools Quick Reference

## 🎯 **Essential Commands**

### **Content & Lore Management**
```bash
# Search the Wavelength universe
./lore-tools search "Where was Yeti from?"

# Register new Google Doc
./lore-tools register https://docs.google.com/document/d/1ABC.../edit

# Full content synchronization
./lore-tools sync

# Interactive management mode
./lore-tools
```

### **Direct MCP Access**
```bash
# List all available tools
echo '{"jsonrpc": "2.0", "method": "tools/list", "id": 1}' | node mcp/enhanced-wavelength-server.js

# Character relationship analysis
echo '{"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "character_relationship_map", "arguments": {"character": "Yeti"}}}' | node mcp/enhanced-wavelength-server.js

# System status check
echo '{"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {"name": "content_sync_manager", "arguments": {"operation": "status"}}}' | node mcp/enhanced-wavelength-server.js
```

## 🛠️ **Available Tools (8 Total)**

| Tool | Purpose | Quick Usage |
|------|---------|-------------|
| `wavelength_lore_search` | Semantic lore search | Search characters, episodes, lore |
| `register_shared_document` | Google Docs integration | Add new documents to pipeline |
| `lore_ingestion_status` | Document pipeline management | List, sync, ingest operations |
| `content_sync_manager` | Cross-project synchronization | Sync Lore ↔ Chatbot projects |
| `character_relationship_map` | Character analysis | Map relationships and connections |
| `episode_continuity_check` | Story validation | Check continuity across episodes |
| `forum_health_monitor` | Community monitoring | Analyze forum engagement |
| `smart_deployment_check` | Pre-deployment validation | Staging/production readiness |

## 📚 **Documentation Links**

- **📖 Complete Documentation:** `/docs/MCP_TOOLS_DOCUMENTATION.md`
- **⚡ AI Copilot Quickstart:** `AI_COPILOT_QUICKSTART.txt`
- **🎭 Achievement Log:** `LORE_MANAGEMENT_ACHIEVEMENT.md`

---

**Status:** ✅ All 8 tools operational (verified October 25, 2025)  
**Integration:** Fully integrated with Wavelength-Lore ecosystem