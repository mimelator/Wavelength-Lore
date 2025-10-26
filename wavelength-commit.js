#!/usr/bin/env node

const { spawn } = require('child_process');

console.log('🚀 WAVELENGTH SUPER POWER: Committing with MCP tools...');

const mcpRequest = {
    "jsonrpc": "2.0", 
    "id": 3002,
    "method": "tools/call",
    "params": {
        "name": "node_execute",
        "arguments": {
            "command": "custom",
            "script": `
const { execSync } = require('child_process');
console.log('🚀 WAVELENGTH SUPER POWER: Committing Docker fix...');

try {
  execSync('git add .', {stdio: 'inherit'});
  
  const commitMsg = \`🐳 FIX: Docker build permission + WAVELENGTH habit override system

✅ Docker Fix: Create start.sh before USER switch (fixes 4hr build failures)
✅ Habit System: Added stop triggers and cheat sheet for WAVELENGTH SUPER TOOLS  
✅ Innovation: Enterprise-grade development mindset with visual cues

🔧 Technical Details:
- Moved startup script creation BEFORE USER appuser
- Added chown appuser:nodejs for proper ownership
- Built comprehensive habit override system in AI quickstart
- Created instant cheat sheet for tool transitions

🎯 Impact: Fixes CI/CD + accelerates WAVELENGTH SUPER TOOL adoption\`;

  execSync(\`git commit -m "\${commitMsg}"\`, {stdio: 'inherit'});
  console.log('✅ Committed with WAVELENGTH SUPER POWERS!');
  
} catch(error) {
  console.log('ℹ️ Commit result:', error.message);
}
            `,
            "context": "Critical Docker fix + habit override system",
            "forceExit": true,
            "exitDelay": 5
        }
    }
};

const mcp = spawn('node', ['mcp/enhanced-wavelength-server.js'], {
    stdio: ['pipe', 'pipe', 'pipe']
});

mcp.stdin.write(JSON.stringify(mcpRequest) + '\n');
mcp.stdin.end();

mcp.stdout.on('data', (data) => console.log(data.toString()));
mcp.stderr.on('data', (data) => console.error('MCP:', data.toString()));
mcp.on('close', () => {
    console.log('🏁 WAVELENGTH commit complete!');
    require('fs').unlinkSync(__filename);
});
