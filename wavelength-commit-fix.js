#!/usr/bin/env node

/**
 * WAVELENGTH SUPER POWER: CI/CD Docker Fix Committer
 * Using node_execute super tool via direct MCP call
 */

const { spawn } = require('child_process');

console.log('🚀 WAVELENGTH SUPER POWER: Committing Docker CI/CD fix...');

// MCP request to use node_execute super tool
const mcpRequest = {
    "jsonrpc": "2.0",
    "id": 2010,
    "method": "tools/call",
    "params": {
        "name": "node_execute",
        "arguments": {
            "command": "custom",
            "script": `
const { execSync } = require('child_process');
console.log('🚀 WAVELENGTH SUPER POWER: Committing Docker CI/CD fix...');

try {
  // Add the fixed Dockerfile
  execSync('git add Dockerfile', {stdio: 'inherit'});
  
  // Commit with detailed message
  const commitMessage = \`🐳 FIX: Docker build permission issue - create start.sh before USER switch

✅ Problem: Permission denied creating /app/start.sh after USER appuser
✅ Solution: Create startup script as root, then chown to appuser  
✅ Security: Still runs container as non-root user
✅ CI/CD: Should now build successfully after 4 hours of failures

🔧 Technical Details:
- Moved RUN echo script creation BEFORE USER appuser
- Added chown appuser:nodejs /app/start.sh
- Preserved security by still running as non-root
- Fixed Docker layer ordering issue

🎯 Impact: Resolves CI/CD pipeline failures in GitHub Actions\`;

  execSync(\`git commit -m "\${commitMessage}"\`, {stdio: 'inherit'});
  
  console.log('✅ Docker fix committed with WAVELENGTH SUPER POWERS!');
  console.log('🚀 CI/CD should now build successfully!');
  
} catch(error) {
  console.error('❌ Commit failed:', error.message);
  if (error.message.includes('nothing to commit')) {
    console.log('ℹ️  No changes to commit - Docker fix may already be staged');
  }
  process.exit(1);
}
            `,
            "context": "Critical CI/CD Docker build fix - 4 hours of build failures",
            "forceExit": true,
            "exitDelay": 5
        }
    }
};

// Send to MCP enhanced server
const mcp = spawn('node', ['mcp/enhanced-wavelength-server.js'], {
    stdio: ['pipe', 'pipe', 'pipe']
});

mcp.stdin.write(JSON.stringify(mcpRequest) + '\n');
mcp.stdin.end();

mcp.stdout.on('data', (data) => {
    console.log(data.toString());
});

mcp.stderr.on('data', (data) => {
    console.error('MCP Error:', data.toString());
});

mcp.on('close', (code) => {
    console.log('🏁 WAVELENGTH SUPER POWER mission completed!');
    
    // Clean up temp file
    const fs = require('fs');
    fs.unlinkSync(__filename);
});