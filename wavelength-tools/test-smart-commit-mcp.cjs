#!/usr/bin/env node

/**
 * Test smart-commit.js ES module conversion via MCP
 */

const { spawn } = require('child_process');

const mcpRequest = {
    "jsonrpc": "2.0",
    "id": 888,
    "method": "tools/call",
    "params": {
        "name": "node_execute",
        "arguments": {
            "command": "run-script",
            "script": "scripts/unified/smart-commit.js",
            "args": ["--help"],
            "timeout": 10,
            "context": "Testing ES module conversion of smart-commit.js",
            "forceExit": true
        }
    }
};

console.log('🧪 Testing smart-commit.js ES module conversion via MCP...\n');

const mcp = spawn('node', ['mcp/enhanced-wavelength-server.cjs'], {
    stdio: ['pipe', 'pipe', 'pipe']
});

mcp.stdin.write(JSON.stringify(mcpRequest) + '\n');
mcp.stdin.end();

mcp.stdout.on('data', (data) => console.log(data.toString()));
mcp.stderr.on('data', (data) => console.error('MCP Error:', data.toString()));

mcp.on('close', (code) => {
    console.log('🏁 Test completed');
    // Clean up
    const fs = require('fs');
    fs.unlinkSync(__filename);
});