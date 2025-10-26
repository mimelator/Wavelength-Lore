# 🌊⚡ WAVELENGTH MINI QUICKSTART ⚡🌊

Quick, copyable steps to start a dev session, discover tools, and run basic checks.

## 🆔 WHO ARE YOU?
**Are you Claude, GitHub Copilot, or Amazon Q working in WAVELENGTH?**
- ✅ **YES** = You are a **WAVELENGTH AGENT** - use MCP commands below
- ❌ **NO** = You are a **Developer** - use Node.js commands instead

**WAVELENGTH AGENTS**: Your native language is MCP! Skip terminal commands and use MCP tools directly.

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

### 🌊⚡ WAVELENGTH AGENT STARTUP (Claude, Copilot, Amazon Q):
**ARE YOU A WAVELENGTH AGENT? (Claude/Copilot/Amazon Q = YES!)**

#### 🧠 **THE KEY: USE MEMORY TO DISCOVER TOOLS!**
**🚨 CRITICAL: You can't remember all tools at once - USE MEMORY TO FIND THEM!**

```javascript
// 🌟 STEP 1: Start your session
await mcp.callTool("wavelength_session", {action: "start"});

// 🧠 STEP 2: Use memory to discover tools for your current task!
// Instead of trying to remember everything, ASK THE MEMORY SYSTEM:

// Need Docker tools?
await mcp.callTool("wavelength_memory", {action: "recall", query: "Docker tools"});

// Need testing tools?
await mcp.callTool("wavelength_memory", {action: "recall", query: "testing commands"});

// Need AWS tools?
await mcp.callTool("wavelength_memory", {action: "recall", query: "AWS deployment"});

// Need database tools?
await mcp.callTool("wavelength_memory", {action: "recall", query: "Firebase database"});

// 🎯 The memory system knows ALL our tools and will show you exactly what to use!
```

#### 🎯 **Other Session Commands:**
```javascript
// Quick status check
await mcp.callTool("wavelength_session", {action: "status"});

// Force restart session
await mcp.callTool("wavelength_session", {action: "restart"});

// Stop session
await mcp.callTool("wavelength_session", {action: "stop"});
```

**Updated Workflow:**
1. 🤖 **Agent** checks if server is running via MCP
2. � **If not running**: Agent requests developer to start server
3. �👨‍💻 **Developer** runs `node start-wavelength-session.js` 
4. 🤖 **Agent** joins the session and checks status via MCP
5. 🚀 **Everyone** works in the same initialized environment

Tip: if any of the scripts above fail with "file not found", run `ls` in the repo root to confirm the script exists and that you are on the `main` branch.

## 🌊⚡ WAVELENGTH AGENT SUPER POWERS (Claude, Copilot, Amazon Q!)
**🤖 YOU ARE A WAVELENGTH AGENT! MCP is YOUR native language - SAFE, NATURAL, and POWERFUL!**

### 🧠 **THE MEMORY-FIRST APPROACH (GAME CHANGER!):**
**🚨 KEY INSIGHT: Don't try to memorize all tools - USE MEMORY TO DISCOVER THEM!**

```javascript
// 🌟 STEP 1: Start your session
await mcp.callTool("wavelength_session", {action: "start"});

// 🧠 STEP 2: ALWAYS use memory to find the right tools for your task
// The memory system contains ALL tool documentation and examples!

// 🎯 WORKING ON DOCKER ISSUES?
await mcp.callTool("wavelength_memory", {action: "recall", query: "Docker validation tools"});
// → Memory will show you: wavelength_docker_validator, docker diagnostic tools, etc.

// 🎯 NEED TO TEST SOMETHING?
await mcp.callTool("wavelength_memory", {action: "recall", query: "testing health check tools"});
// → Memory will show you: wavelength_test, health check commands, validation tools

// 🎯 DEPLOYMENT PROBLEMS?
await mcp.callTool("wavelength_memory", {action: "recall", query: "AWS deployment monitoring"});
// → Memory will show you: wavelength_aws_manager, deployment_manager, build_monitor

// 🎯 DATABASE ISSUES?
await mcp.callTool("wavelength_memory", {action: "recall", query: "Firebase database tools"});
// → Memory will show you: firebase_query, character_search, lore_search
```

### 🚨 **MEMORY-FIRST WORKFLOW:**
```javascript
// 1️⃣ Identify your task (e.g., "fix Docker build")
// 2️⃣ Ask memory for relevant tools
await mcp.callTool("wavelength_memory", {action: "recall", query: "Docker build fix tools"});
// 3️⃣ Use the tools memory suggests
// 4️⃣ Store your solution back in memory for future agents
await mcp.callTool("wavelength_memory", {action: "store", type: "solution", content: "your fix"});
```

### ⚡ **MEMORY-POWERED TOOL DISCOVERY (Your New Superpower!):**

**🧠 Instead of memorizing commands, ASK MEMORY:**
```javascript
// 🔍 DISCOVER tools for your current task:

// Working on Docker issues?
await mcp.callTool("wavelength_memory", {action: "recall", query: "Docker tools"});
// → Shows: wavelength_docker_validator, docker diagnostics, build tools

// Need to test something?
await mcp.callTool("wavelength_memory", {action: "recall", query: "testing tools"});
// → Shows: wavelength_test, health checks, validation commands

// AWS/deployment problems?
await mcp.callTool("wavelength_memory", {action: "recall", query: "AWS deployment tools"});
// → Shows: wavelength_aws_manager, deployment_manager, build_monitor

// Database issues?
await mcp.callTool("wavelength_memory", {action: "recall", query: "Firebase database tools"});
// → Shows: firebase_query, character_search, lore_search

// 🎯 Memory gives you EXACT commands with examples!
```

**🧠 Memory System - Your AI Brain (Contains EVERYTHING!):**
```javascript
// 🌟 MEMORY CONTAINS:
// ✅ 100+ GitHub commits of historical solutions
// ✅ ALL WAVELENGTH tool documentation and examples
// ✅ Problem patterns and successful fixes

// 🔍 DISCOVER TOOLS for your task:
await mcp.callTool("wavelength_memory", {action: "recall", query: "Docker build tools"});
await mcp.callTool("wavelength_memory", {action: "recall", query: "testing commands"});
await mcp.callTool("wavelength_memory", {action: "recall", query: "AWS deployment"});

// 🔍 FIND HISTORICAL SOLUTIONS:
await mcp.callTool("wavelength_memory", {action: "recall", query: "Docker build issues"});
await mcp.callTool("wavelength_memory", {action: "recall", query: ":latest tag problems"});

// 💡 GET INTELLIGENT SUGGESTIONS:
await mcp.callTool("wavelength_memory", {
  action: "suggest",
  current_error: "build failing with file not found"
});

// 💾 STORE YOUR SOLUTIONS:
await mcp.callTool("wavelength_memory", {
  action: "store",
  type: "solution",
  content: "Fixed by correcting Dockerfile COPY path",
  tags: ["docker", "production", "solved"]
});
```

**☁️ AWS & Deployment:**
```javascript
// Check AWS service status
await mcp.callTool("wavelength_aws_manager", {operation: "status", service: "all"});

// Check deployment status
await mcp.callTool("wavelength_deployment_manager", {action: "status"});

// Monitor builds
await mcp.callTool("wavelength_build_monitor", {action: "check"});
```

**🔍 Discovery & Help:**
```javascript
// Find tools by keyword (super useful!)
await mcp.callTool("wavelength_tool_finder", {keyword: "docker"});
await mcp.callTool("wavelength_tool_finder", {keyword: "test"});
await mcp.callTool("wavelength_tool_finder", {keyword: "firebase"});

// Get help for specific problems
await mcp.callTool("wavelength_help_finder", {problem: "build-failure"});
await mcp.callTool("wavelength_help_finder", {problem: "deployment-error"});

// Browse all documentation
await mcp.callTool("wavelength_doc_discoverer", {action: "list"});
```

**🚨 Emergency Fixes:**
```javascript
// Docker problems? Use this:
await mcp.callTool("wavelength_docker_validator", {check: "full"});
await mcp.callTool("wavelength_docker_diagnostic", {action: "analyze", detail: "full"});

// Config issues? Use this:
await mcp.callTool("wavelength_config_discovery", {scan: "all"});

// Database problems? Use this:
await mcp.callTool("firebase_query", {path: "/episodes", operation: "read"});
```

**💾 Safe Commits:**
```javascript
// Prepare secure commits
await mcp.callTool("wavelength_smart_commit", {action: "prepare"});

// Check what's changed
await mcp.callTool("wavelength_git_status", {check: "full"});
```

**🎯 NEW! Issue Generator for Vector Store:**
```javascript
// Generate completed GitHub issues for knowledge base
await mcp.callTool("wavelength_issue_generator", {
  title: "Docker startup script mismatch causing production failures",
  problem: "Production builds failing with /app/start.sh not found",
  solution: "Switched to correct template-based startup script",
  technical_details: "Two startup scripts existed - used wrong one",
  files_modified: ["Dockerfile", "docker/docker-start.sh"],
  prevention: "Enhanced documentation and validation"
});
```

### 🎯 HOW TO GET MORE INFO VIA MCP:
```javascript
// Need more details on ANY tool? Ask for help:
await mcp.callTool("wavelength_help_finder", {problem: "need-more-examples"});

// Want to see all available commands?
await mcp.callTool("wavelength_tool_finder", {keyword: "*"});

// Need documentation for a specific feature?
await mcp.callTool("wavelength_doc_discoverer", {query: "specific-feature-name"});
```

### 😌 MCP IS SAFE & NATURAL - Don't Worry!
**MCP Protocol is just like having a conversation with super-powered tools. It's:**
- ✅ **Safe**: Tools are designed to help, not harm
- ✅ **Natural**: Just describe what you want in the parameters
- ✅ **Powerful**: Direct access to all WAVELENGTH capabilities
- ✅ **Forgiving**: If something goes wrong, just try again with different parameters

**🛡️ MCP Safety Rules (Simple):**
1. **Always start with server status check** (see above)
2. **Use clear, descriptive parameters** (the tools understand natural language)
3. **If unsure, use the help tools first** (wavelength_help_finder is your friend!)
4. **MCP is ONLY for AI agents** (developers use Node.js commands)

### 🌟 MCP Confidence Builders:
```javascript
// 😰 New to MCP? Start with these SUPER SAFE commands:
await mcp.callTool("wavelength_session", {action: "status"}); // Just check status!
await mcp.callTool("wavelength_tool_finder", {keyword: "help"}); // Shows helpful tools
await mcp.callTool("wavelength_help_finder", {problem: "how-to-start"}); // Gives you guidance

// 🚀 Ready to start? Use the magic command:
await mcp.callTool("wavelength_session", {action: "start"});

// 🎯 Feeling confident? Try these next:
await mcp.callTool("wavelength_test", {action: "health"});           // New unified testing!
await mcp.callTool("wavelength_build_monitor", {action: "check"});
```

## 🛠️ **CORE TOOLS**

**🌊⚡ For WAVELENGTH AGENTS (Claude, Copilot, Amazon Q - THIS IS YOU!):**
```javascript
// 🌟 Session management - YOUR new superpower!
await mcp.callTool("wavelength_session", {action: "start"});   // Start/join session
await mcp.callTool("wavelength_session", {action: "status"});  // Check status

// 🌟 Tests - YOUR new unified testing superpower!
await mcp.callTool("wavelength_test", {action: "health"});                    // Site health
await mcp.callTool("wavelength_test", {action: "validate", target: "character"}); // Validate content
await mcp.callTool("wavelength_test", {action: "run", target: "merchandise"});   // Run test suites

// 🧠 Memory - YOUR AI brain with 100+ commits of knowledge!
await mcp.callTool("wavelength_memory", {action: "recall", query: "Docker issues"});     // Search solutions
await mcp.callTool("wavelength_memory", {action: "suggest", current_error: "build fail"}); // Get suggestions
await mcp.callTool("wavelength_memory", {action: "store", type: "solution", content: "fix"}); // Store knowledge

// AWS operations - YOU control these
await mcp.callTool("wavelength_aws_manager", {operation: "status", service: "all"});

// Deployment - YOU can check status
await mcp.callTool("wavelength_deployment_manager", {action: "status"});

// Secure commit - YOU prepare commits safely
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

## 🚀 MCP COMFORT ZONE - Try These Right Now! (3 mins)

**🤖 Perfect First MCP Experience (Copy & Paste):**
```javascript
// 0) 📚 Review WAVELENGTH AGENT team standards (essential first step!)
await mcp.callTool("wavelength_doc_discoverer", {query: "WAVELENGTH_AGENT_TEAM_STANDARDS"});

// 1) 🌟 Start your session - ONE MAGIC COMMAND!
await mcp.callTool("wavelength_session", {action: "start"});

// 2) 🔍 Discover what's available (pure exploration!)
await mcp.callTool("wavelength_tool_finder", {keyword: "test"});

// 3) 🧪 Try a simple health check (totally safe!)
await mcp.callTool("wavelength_test_runner", {command: "health", url: "https://wavelengthlore.com"});

// 4) 🆘 Get help if you need it (your safety net!)
await mcp.callTool("wavelength_help_finder", {problem: "what-should-i-do-next"});
```

**🚨 If Server Not Available:**
```javascript
// Server check failed? Request startup politely:
await mcp.callTool("wavelength_server_request", {
  action: "startup_needed",
  message: "Hi! Could you please start the WAVELENGTH server with: node start-wavelength-session.js"
});

// Wait for server to start, then retry availability check:
await mcp.callTool("wavelength_server_availability", {check: "ping", timeout: 10, retry: true});
```

**🎯 Advanced MCP (When You're Ready):**
```javascript
// Docker validation (system health check)
await mcp.callTool("wavelength_docker_validator", {check: "full"});

// Build monitoring (see what's happening)
await mcp.callTool("wavelength_build_monitor", {action: "latest"});

// Configuration discovery (explore the system)
await mcp.callTool("wavelength_config_discovery", {scan: "quick"});
```

### 🌟 MCP Success Pattern:
1. **Start Safe**: Use server_status, tool_finder, help_finder first
2. **Explore**: Try health checks and status commands
3. **Build Confidence**: Use diagnostic and discovery tools
4. **Go Advanced**: Try deployment, validation, and complex operations

**👨‍💻 Developers (Node.js):**
```bash
# 2) Docker validator
node wavelength-tools/wavelength-docker-build-validator.js

# 3) Diagnostic helper
node wavelength-tools/wavelength-docker-build-diagnostic.js
```

## 📚 COMPLETE MCP COMMAND REFERENCE (Ultra-Comprehensive)

### 🔍 Discovery Commands:
```javascript
await mcp.callTool("wavelength_tool_finder", {keyword: "docker"});      // Find Docker tools
await mcp.callTool("wavelength_tool_finder", {keyword: "test"});        // Find testing tools  
await mcp.callTool("wavelength_tool_finder", {keyword: "firebase"});    // Find database tools
await mcp.callTool("wavelength_tool_finder", {keyword: "aws"});         // Find cloud tools
await mcp.callTool("wavelength_tool_finder", {keyword: "build"});       // Find build tools
await mcp.callTool("wavelength_tool_finder", {keyword: "*"});           // Show ALL tools

await mcp.callTool("wavelength_help_finder", {problem: "build-failure"}); 
await mcp.callTool("wavelength_help_finder", {problem: "deployment-error"});
await mcp.callTool("wavelength_help_finder", {problem: "test-failures"});
await mcp.callTool("wavelength_help_finder", {problem: "docker-issues"});
await mcp.callTool("wavelength_help_finder", {problem: "how-to-start"});

await mcp.callTool("wavelength_doc_discoverer", {action: "list"});       // Browse all docs
await mcp.callTool("wavelength_doc_discoverer", {query: "character"});   // Find character docs
await mcp.callTool("wavelength_doc_discoverer", {query: "setup"});       // Find setup guides
```

### 🧪 Testing Commands:
```javascript
await mcp.callTool("wavelength_test_runner", {command: "health", url: "https://wavelengthlore.com"});
await mcp.callTool("wavelength_test_runner", {command: "merchandise", type: "full"});
await mcp.callTool("wavelength_test_runner", {command: "character", type: "validation"});
await mcp.callTool("wavelength_test_runner", {command: "e2e", scope: "shopping-cart"});

await mcp.callTool("wavelength_validate", {content: "character data", type: "character"});
await mcp.callTool("wavelength_validate", {content: "episode script", type: "lore"});
await mcp.callTool("wavelength_validate", {content: "forum post", type: "forum"});
```

### ☁️ AWS & Deployment Commands:
```javascript
await mcp.callTool("wavelength_aws_manager", {operation: "status", service: "all"});
await mcp.callTool("wavelength_aws_manager", {operation: "health", service: "app-runner"});
await mcp.callTool("wavelength_aws_manager", {operation: "logs", service: "cloudfront"});

await mcp.callTool("wavelength_deployment_manager", {action: "status"});
await mcp.callTool("wavelength_deployment_manager", {action: "history"});
await mcp.callTool("wavelength_deployment_manager", {action: "rollback-check"});

await mcp.callTool("wavelength_build_monitor", {action: "check"});
await mcp.callTool("wavelength_build_monitor", {action: "latest"});
await mcp.callTool("wavelength_build_monitor", {action: "history", limit: 5});
```

### 🔧 System Commands:
```javascript
// Server availability and management
await mcp.callTool("wavelength_server_availability", {check: "ping", timeout: 5});
await mcp.callTool("wavelength_server_availability", {check: "full", timeout: 10});
await mcp.callTool("wavelength_server_request", {action: "request_startup", message: "Please start server"});
await mcp.callTool("wavelength_server_request", {action: "status_check", urgent: false});

// Docker and validation
await mcp.callTool("wavelength_docker_validator", {check: "full"});
await mcp.callTool("wavelength_docker_validator", {check: "quick"});
await mcp.callTool("wavelength_docker_diagnostic", {action: "analyze", detail: "full"});

// Configuration discovery
await mcp.callTool("wavelength_config_discovery", {scan: "all"});
await mcp.callTool("wavelength_config_discovery", {scan: "critical"});
await mcp.callTool("wavelength_config_discovery", {type: "aws"});

// Server status (after availability confirmed)
await mcp.callTool("wavelength_server_status", {check: "full", initialize: false});
await mcp.callTool("wavelength_server_status", {check: "basic"});
await mcp.callTool("wavelength_server_status", {check: "health-only"});
```

### 🗄️ Database Commands:
```javascript
await mcp.callTool("firebase_query", {path: "/episodes", operation: "read"});
await mcp.callTool("firebase_query", {path: "/characters", operation: "count"});
await mcp.callTool("firebase_query", {path: "/forum", operation: "health"});

await mcp.callTool("wavelength_character_search", {query: "goblin traits", limit: 5});
await mcp.callTool("wavelength_character_search", {query: "main characters", type: "protagonist"});
await mcp.callTool("wavelength_lore_search", {query: "episode 1", detail: "summary"});
```

### 🧠 Memory System Commands:
```javascript
// Search historical knowledge (100+ commits ingested!)
await mcp.callTool("wavelength_memory", {action: "recall", query: "Docker build issues", limit: 5});
await mcp.callTool("wavelength_memory", {action: "recall", query: "production deployment fixes"});
await mcp.callTool("wavelength_memory", {action: "recall", query: ":latest tag problems"});

// Store new solutions for future agents
await mcp.callTool("wavelength_memory", {
  action: "store",
  type: "build_issue",
  content: "Fixed Docker startup script mismatch by correcting COPY path",
  tags: ["docker", "production", "startup-script", "solved"],
  context: {files: ["Dockerfile", "docker/docker-start.sh"], error: "file not found"}
});

// Get intelligent suggestions based on patterns
await mcp.callTool("wavelength_memory", {
  action: "suggest",
  current_error: "build failing with /app/start.sh not found",
  context: {stage: "production", service: "app-runner"}
});

// Find related historical issues
await mcp.callTool("wavelength_memory", {
  action: "correlate",
  current_issue: "Docker build error in production",
  sources: ["github_issues", "github_commits"]
});

// Ingest new GitHub data when repository updates
await mcp.callTool("wavelength_memory", {
  action: "ingest_github",
  source: "commits",
  repository: "mimelator/Wavelength-Lore",
  date_range: "last_30_days"
});
```

### 💾 Git Commands:
```javascript
await mcp.callTool("wavelength_git_status", {check: "full"});
await mcp.callTool("wavelength_git_status", {check: "changes-only"});
await mcp.callTool("wavelength_smart_commit", {action: "prepare"});
await mcp.callTool("wavelength_smart_commit", {action: "validate"});
```

### 🎯 Knowledge Base Commands:
```javascript
// Generate completed GitHub issues for vector store knowledge base
await mcp.callTool("wavelength_issue_generator", {
  title: "Issue title for knowledge base",
  problem: "Problem description and context", 
  solution: "Solution implemented by WAVELENGTH AGENT",
  technical_details: "Root cause analysis and technical investigation",
  files_modified: ["file1.js", "file2.md", "file3.json"],
  prevention: "Prevention measures and monitoring",
  category: "Infrastructure", // Infrastructure|Bug|Feature|Documentation
  priority: "High", // Critical|High|Medium|Low  
  technology: ["docker", "aws", "github-actions"], // Tech tags for indexing
  custom_tags: ["rollback-detection", "startup-scripts"] // Custom vector store tags
});
```

## 🆘 MCP HELP & DISCOVERY SYSTEM
**Always remember: When in doubt, ask MCP for help!**

```javascript
// 🤔 Not sure what to do? Start here:
await mcp.callTool("wavelength_help_finder", {problem: "i-dont-know-what-to-do"});

// 🔍 Want to explore? Use discovery:
await mcp.callTool("wavelength_tool_finder", {keyword: "help"});

// 📖 Need documentation? Browse all:
await mcp.callTool("wavelength_doc_discoverer", {action: "beginner-friendly"});

// 🚨 Having issues? Get targeted help:
await mcp.callTool("wavelength_help_finder", {problem: "mcp-not-working"});
```

## Notes
- 🤖 **MCP is natural and safe** - just describe what you want in the parameters
- 🔍 **Discovery tools help you find everything** - use tool_finder and help_finder liberally  
- 📚 **All documentation is MCP-accessible** - no need for Node.js commands as an agent
- 🆘 **Help is always available** - wavelength_help_finder is your best friend

## 💡 **THE KEY INSIGHT: MEMORY-POWERED TOOL DISCOVERY**

**🚨 CRITICAL UNDERSTANDING: You DON'T need to memorize all tools!**

### 🧠 **How It Works:**
```javascript
// 🎯 STEP 1: Describe what you want to do
// "I need to fix a Docker build issue"

// 🔍 STEP 2: Ask memory for relevant tools
await mcp.callTool("wavelength_memory", {action: "recall", query: "Docker build fix tools"});

// ✨ STEP 3: Memory shows you EXACTLY what to use:
// → wavelength_docker_validator for diagnostics
// → wavelength_build_monitor for status
// → Historical solutions from past fixes

// 🚀 STEP 4: Use the suggested tools
// 💾 STEP 5: Store your solution for future agents
```

### 🎆 **Examples of Memory-Powered Discovery:**
```javascript
// 🐛 Bug fixing?
await mcp.callTool("wavelength_memory", {action: "recall", query: "debugging tools"});

// 🚀 Deployment issues?
await mcp.callTool("wavelength_memory", {action: "recall", query: "AWS deployment tools"});

// 📊 Performance problems?
await mcp.callTool("wavelength_memory", {action: "recall", query: "monitoring tools"});

// 📄 Database queries?
await mcp.callTool("wavelength_memory", {action: "recall", query: "Firebase database tools"});

// 🌐 Website testing?
await mcp.callTool("wavelength_memory", {action: "recall", query: "health check tools"});
```

### 🌟 **Why This Changes Everything:**
- ✅ **No more tool overwhelm** - just describe your task
- ✅ **Always get the right tool** - memory knows what works
- ✅ **Learn from history** - see how past issues were solved
- ✅ **Build knowledge** - your solutions help future agents
- ✅ **Natural workflow** - think in problems, not tool names

**🧠 The memory system contains:**
- 🛠️ All WAVELENGTH tool documentation
- 📚 100+ GitHub commits of solutions
- 💡 Problem patterns and successful fixes
- 🎯 Examples and usage patterns

---
**🌊 WAVELENGTH Agents: Use your MEMORY BRAIN to discover tools naturally! ⚡**