#!/usr/bin/env node

/**
 * MCP Health Check Test Runner
 * Tests the Puppeteer-based health check script via MCP node_execute
 */

import { spawn } from 'child_process';

const testRequest = {
    "jsonrpc": "2.0",
    "id": 2002,
    "method": "tools/call",
    "params": {
        "name": "node_execute",
        "arguments": {
            "command": "test",
            "script": "scripts/organized/testing-validation/production-health-check.js",
            "timeout": 25,
            "context": "Testing ES module conversion - Puppeteer health check script",
            "forceExit": true,
            "exitDelay": 5
        }
    }
};

console.log('🧪 Testing Puppeteer Health Check Script via MCP...');
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
    // Filter out the server startup message for cleaner output
    if (!text.includes('Enhanced Wavelength MCP Server running')) {
        console.log('📤 Output:', text);
    }
});

child.stderr.on('data', (data) => {
    console.log('⚠️ Error:', data.toString());
});

child.on('close', (code) => {
    console.log('✅ MCP Health Check Test completed with code:', code);
});