# 🧠 WAVELENGTH MEMORY SYSTEM - SETUP GUIDE

## 🚀 **SYSTEM OVERVIEW**

The WAVELENGTH Agent Memory System provides persistent knowledge storage using vector embeddings, enabling agents to:
- **Remember** all development sessions and solutions
- **Recall** historical issues and fixes instantly  
- **Learn** from GitHub issues, commits, and PRs
- **Suggest** solutions based on past patterns

## 📁 **FILES CREATED**

### **Core Components**
- `mcp/wavelength-memory-server.js` - MCP server for memory operations
- `lib/vector-storage.js` - Pinecone vector database integration
- `lib/github-integration.js` - GitHub data ingestion
- `package-memory.json` - Dependencies for memory system
- `scripts/test-memory-system.js` - Test and validation script

## 🔧 **SETUP INSTRUCTIONS**

### **1. Install Dependencies**
```bash
# Install memory system dependencies
npm install --save @modelcontextprotocol/sdk @pinecone-database/pinecone @octokit/rest openai dotenv

# Or use the memory-specific package file
cp package-memory.json package-memory-backup.json
```

### **2. Environment Variables**
Add to your `.env` file:
```bash
# Vector Storage (Pinecone)
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=wavelength-memory

# OpenAI for Embeddings  
OPENAI_API_KEY=your_openai_api_key

# GitHub Integration
GITHUB_TOKEN=your_github_token
```

### **3. Test the System**
```bash
# Run comprehensive tests
node scripts/test-memory-system.js

# Expected output:
# ✅ Vector storage initialized successfully
# ✅ Knowledge stored successfully
# ✅ Found X relevant knowledge entries
# ✅ GitHub integration working
# 🎉 All tests completed successfully!
```

## 🎯 **USAGE EXAMPLES**

### **Store Development Knowledge**
```javascript
await mcp.callTool("wavelength_memory", {
  action: "store",
  type: "build_issue",
  content: "Docker build failing - /app/start.sh not found. Fixed by correcting Dockerfile COPY path.",
  tags: ["docker", "build-failure", "production", "solved"],
  context: {
    "file": "Dockerfile",
    "error": "/app/start.sh not found", 
    "solution": "Change docker/docker-start.sh → docker-start.sh"
  }
});
```

### **Recall Past Solutions**
```javascript
await mcp.callTool("wavelength_memory", {
  action: "recall",
  query: "Docker build failures production",
  limit: 5,
  type: "build_issue"
});
```

### **Get Smart Suggestions**
```javascript
await mcp.callTool("wavelength_memory", {
  action: "suggest",
  current_error: "Docker build failing - /app/start.sh not found",
  context: "production deployment"
});
```

### **Ingest GitHub History**
```javascript
await mcp.callTool("wavelength_memory", {
  action: "ingest_github",
  source: "issues",
  repository: "wavelength-lore/wavelength-lore",
  filters: {
    "state": "closed",
    "labels": ["bug", "production"],
    "since": "2023-01-01"
  }
});
```

### **Correlate with GitHub Issues**
```javascript
await mcp.callTool("wavelength_memory", {
  action: "correlate",
  current_issue: "Docker build failing - /app/start.sh not found",
  sources: ["github_issues", "github_commits", "current_session"]
});
```

## 🔄 **INTEGRATION WITH EXISTING MCP TOOLS**

### **Auto-Store Successful Operations**
The memory system can automatically capture knowledge from existing tools:

```javascript
// After successful operations, auto-store the knowledge
await mcp.callTool("wavelength_test", {action: "health"});
// → Automatically stores: "Health check successful - all systems operational"

await mcp.callTool("wavelength_smart_commit", {action: "prepare"});  
// → Automatically stores: "Successful commit process for [changes]"
```

## 📊 **EXPECTED BENEFITS**

### **For WAVELENGTH AGENTS:**
- **Zero Context Loss**: Never lose development knowledge between sessions
- **Instant Problem Resolution**: "We solved this Docker issue in GitHub Issue #127"
- **Pattern Recognition**: "This type of build failure has happened 3 times - here's the root cause"
- **Smart Suggestions**: "Based on past fixes, try updating the Dockerfile COPY path"

### **For Development Process:**
- **Knowledge Persistence**: Solutions accumulate over time
- **Faster Onboarding**: New agents get full project context immediately
- **Reduced Repeat Issues**: Automatic detection of similar problems
- **Historical Insights**: Learn from past successes and failures

## 🚀 **NEXT STEPS**

### **Phase 1: Basic Implementation (Current)**
- ✅ Core MCP server created
- ✅ Vector storage integration ready
- ✅ GitHub integration framework built
- ✅ Test suite available

### **Phase 2: Data Population**
1. Run GitHub ingestion for historical issues
2. Start auto-capturing current development sessions
3. Build knowledge base with common problems/solutions

### **Phase 3: Advanced Features**
1. Smart suggestion engine
2. Pattern recognition for recurring issues
3. Proactive problem prevention
4. Cross-project knowledge sharing

## 🔧 **TROUBLESHOOTING**

### **Common Issues:**
- **"Pinecone API Key not found"**: Set PINECONE_API_KEY in .env
- **"OpenAI API Key not found"**: Set OPENAI_API_KEY in .env  
- **"GitHub token invalid"**: Set GITHUB_TOKEN with repo read permissions
- **"Index not found"**: Create Pinecone index named 'wavelength-memory'

### **Test Commands:**
```bash
# Test vector storage only
node -e "import('./lib/vector-storage.js').then(m => new m.WavelengthVectorStorage().initialize())"

# Test GitHub integration
node -e "import('./lib/github-integration.js').then(m => new m.GitHubIntegration().getIngestionStats())"
```

---

**🌊 The WAVELENGTH Memory System will transform how agents work - from session-based to persistent, intelligent development assistance! ⚡**