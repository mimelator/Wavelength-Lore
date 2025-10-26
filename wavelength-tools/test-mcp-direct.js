#!/usr/bin/env node

/**
 * Direct MCP Test Runner
 * Tests scripts via MCP node_execute without shell pipes
 */

import { spawn } from 'child_process';
import fs from 'fs';

const testRequest = {
    "jsonrpc": "2.0",
    "id": 2001,
    "method": "tools/call",
    "params": {
        "name": "node_execute",
        "arguments": {
            "command": "test",
            "script": "scripts/monitor-production-simple.js",
            "timeout": 15,
            "context": "Testing ES module conversion - monitoring script fixed",
            "forceExit": true,
            "exitDelay": 3
        }
    }
};

console.log('🧪 Testing ES Module Script via MCP...');
console.log('📝 Request:', JSON.stringify(testRequest, null, 2));

const child = spawn('node', ['mcp/enhanced-wavelength-server.cjs'], {
    stdio: ['pipe', 'pipe', 'pipe']
});

child.stdin.write(JSON.stringify(testRequest) + '\n');
child.stdin.end();

let output = '';
child.stdout.on('data', (data) => {
    output += data.toString();
    console.log('📤 Output:', data.toString());
});

child.stderr.on('data', (data) => {
    console.log('⚠️ Error:', data.toString());
});

child.on('close', (code) => {
    console.log('✅ MCP Test completed with code:', code);
    console.log('📊 Full output:', output);
});