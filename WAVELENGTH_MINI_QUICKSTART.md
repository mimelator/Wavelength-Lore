# 🌊⚡ WAVELENGTH MINI QUICKSTART ⚡🌊

Quick, copyable steps to start a dev session, discover tools, and run basic checks.

## Prerequisites
- Node.js (recommended v16 or newer)
- Git configured for the repository
- If you work with containers: Docker installed

## 🚀 INSTANT START (3 Commands)
Use these to launch a friction-free session, inspect available tools, then run a quick health check.

```bash
# 1. Launch friction-free session (starts the Wavelength agent/session)
node start-wavelength-session.js

# 2. See what's available (tools, MCP bindings, session info)
node session-status.js

# 3. Run a focused health test against the public site
node scripts/unified/test-runner.js health --url https://wavelengthlore.com
```

Tip: if any of the scripts above fail with "file not found", run `ls` in the repo root to confirm the script exists and that you are on the `main` branch.

## 🧠 MCP TOOLS (Direct Agent Access)
Agents (or local dev code) call MCP tools directly via the Model Context Protocol. Example calls:

```javascript
// Proper MCP protocol examples - agents call these directly
await mcp.callTool("wavelength_validate", {content: "...", type: "character"});
await mcp.callTool("firebase_query", {path: "/episodes", operation: "read"});
await mcp.callTool("wavelength_character_search", {query: "goblin traits", limit: 5});
await mcp.callTool("wavelength_content_generate", {type: "episode_summary", theme: "mystery"});
await mcp.callTool("wavelength_lore_validate", {content: "character backstory", rules: "canon"});
```

## 🛠️ CORE TOOLS (Common entry points)
- Tests: `node scripts/unified/test-runner.js [command]`
- AWS helpers: `node scripts/unified/aws-manager.js [operation]`
- Deploy: `node scripts/unified/deployment-manager.js [action]`
- Commit (secure): `node scripts/unified/smart-commit.js`

## 🔍 DISCOVER MORE ON DEMAND
Use the discovery utilities to find specific tooling or guidance without loading the full docs.

```bash
# Find specific tools by keyword
node wavelength-tools/wavelength-tool-finder.js [keyword]

# Get targeted help for an issue (e.g. "build-failure")
node wavelength-tools/wavelength-help-finder.js [problem]

# List / open the full documentation index
node wavelength-tools/wavelength-doc-discoverer.js
```

## 🚨 EMERGENCY / QUICK FIXS
Use these quick helpers when something is broken in builds or config.

- Docker validator (local): `node wavelength-tools/wavelength-docker-build-validator.js`
- Config discovery: `node wavelength-tools/wavelength-config-discovery.js`
- Build monitor (enhanced): `node wavelength-tools/wavelength-enhanced-build-monitor.js`

## Try this — fast verification (3 mins)
1) Start a session and confirm status (see Instant Start step 1 & 2).
2) Run the Docker validator to ensure startup scripts and Dockerfile sync:

```bash
node wavelength-tools/wavelength-docker-build-validator.js
```

3) If the validator shows failures, run the diagnostic helper for details:

```bash
node wavelength-tools/wavelength-docker-build-diagnostic.js
```

## Notes
- The discovery tools were added to keep large docs archived but discoverable on demand.
- If you need the longer Quickstart, use `node wavelength-tools/wavelength-doc-discoverer.js` to open the full guide.

---
Need anything added to this mini quickstart (platform-specific steps, CI commands, or SSO notes)? Reply with what you want and I’ll update it.