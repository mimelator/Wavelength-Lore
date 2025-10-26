#!/usr/bin/env node

/**
 * MCP AppRunner Force Deploy Test
 * Tests the AppRunner force deployment script via MCP node_execute
 */

const { spawn } = require('child_process');

const testRequest = {
    "jsonrpc": "2.0",
    "id": 2007,
    "method": "tools/call",
    "params": {
        "name": "node_execute",
        "arguments": {
            "command": "test",
            "script": "scripts/organized/aws-infrastructure/apprunner-force-deploy.js",
            "args": ["--help"],
            "timeout": 10,
            "context": "Testing ES module conversion - AppRunner force deploy help",
            "forceExit": true,
            "exitDelay": 2
        }
    }
};

console.log('🧪 Testing AppRunner Force Deploy via MCP...');
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
    console.log('✅ MCP AppRunner Force Deploy Test completed with code:', code);
});