# 📚 MCP Tools Documentation Index

## 🎯 **Quick Navigation**

### **📖 Main Documentation**
- **[Complete MCP Tools Documentation](MCP_TOOLS_DOCUMENTATION.md)** - Comprehensive guide with high-level functionality and technical specifications
- **[Quick Reference Guide](MCP_QUICK_REFERENCE.md)** - Essential commands and usage examples

### **⚡ Getting Started**
- **[AI Copilot Quickstart](../AI_COPILOT_QUICKSTART.txt)** - AI assistant onboarding with MCP integration section
- **[Lore Management Achievement](../LORE_MANAGEMENT_ACHIEVEMENT.md)** - System overview and capabilities showcase

### **🛠️ Implementation Files**
- **Enhanced MCP Server**: `/mcp/enhanced-wavelength-server.js`
- **Command-Line Interface**: `./lore-tools`
- **Interactive Management**: `scripts/lore-tools.js`

## 🚀 **8 Operational MCP Tools**

| Category | Tools | Purpose |
|----------|-------|---------|
| **Content Management** | `wavelength_lore_search`<br>`register_shared_document`<br>`lore_ingestion_status`<br>`content_sync_manager` | Search lore, register docs, manage ingestion pipeline, sync projects |
| **Character & Story** | `character_relationship_map`<br>`episode_continuity_check` | Analyze relationships, validate story consistency |
| **Development** | `forum_health_monitor`<br>`smart_deployment_check` | Monitor community, validate deployments |

## 🔗 **Integration Points**

### **Documentation Links**
- Main README: Links to MCP documentation
- Docs README: Dedicated MCP section with navigation
- AI Copilot Quickstart: Updated MCP superpowers section

### **Usage Examples**
```bash
# Command-line access
./lore-tools search "Yeti origin"
./lore-tools register <google-docs-url>
./lore-tools sync

# Direct MCP calls
echo '{"jsonrpc": "2.0", "method": "tools/list", "id": 1}' | node mcp/enhanced-wavelength-server.js
```

---

**Status:** ✅ All documentation linked and cross-referenced  
**Last Updated:** October 25, 2025  
**Integration:** Complete ecosystem integration with proper navigation