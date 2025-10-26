#!/usr/bin/env node

/**
 * MCP Deployment Manager Test
 * Tests the unified deployment manager script via MCP node_execute
 */

import { spawn } from 'child_process';

const testRequest = {
    "jsonrpc": "2.0",
    "id": 2005,
    "method": "tools/call",
    "params": {
        "name": "node_execute",
        "arguments": {
            "command": "test",
            "script": "scripts/unified/deployment-manager.js",
            "args": ["--help"],
            "timeout": 10,
            "context": "Testing ES module conversion - unified deployment manager help",
            "forceExit": true,
            "exitDelay": 2
        }
    }
};

console.log('🧪 Testing Unified Deployment Manager via MCP...');
console.log('📝 Request:', JSON.stringify(testRequest, null, 2));

const child = spawn('node', ['mcp/enhanced-wavelength-server.cjs'], {
    stdio: ['pipe', 'pipe', 'pipe']
});

child.stdin.write(JSON.stringify(testRequest) + '\n');
child.stdin.end();

let output = '';
child.stdout.on('data', (data) => {
    const text = data.toString();
    output += text;
    if (!text.includes('Enhanced Wavelength MCP Server running')) {
        console.log('📤 Output:', text);
    }
});

child.stderr.on('data', (data) => {
    console.log('⚠️ Error:', data.toString());
});

child.on('close', (code) => {
    console.log('✅ MCP Deployment Manager Test completed with code:', code);
});