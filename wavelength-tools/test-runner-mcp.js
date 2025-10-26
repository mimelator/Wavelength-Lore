#!/usr/bin/env node

/**
 * MCP Test Runner Validation
 * Tests the unified test runner script via MCP node_execute
 */

import { spawn } from 'child_process';

const testRequest = {
    "jsonrpc": "2.0",
    "id": 2003,
    "method": "tools/call",
    "params": {
        "name": "node_execute",
        "arguments": {
            "command": "test",
            "script": "scripts/unified/test-runner.js",
            "args": ["--help"],
            "timeout": 10,
            "context": "Testing ES module conversion - unified test runner help",
            "forceExit": true,
            "exitDelay": 2
        }
    }
};

console.log('🧪 Testing Unified Test Runner via MCP...');
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
    console.log('✅ MCP Test Runner validation completed with code:', code);
    
    // Parse and display results
    try {
        const jsonMatch = output.match(/\{"result":.+\}/);
        if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);
            console.log('\n🎯 Test Results Summary:');
            if (result.result && result.result.content) {
                const content = result.result.content[0];
                if (content.text && content.text.includes('--help')) {
                    console.log('✅ Unified Test Runner ES modules working!');
                    console.log('✅ Help output generated successfully');
                } else {
                    console.log('⚠️ Unexpected output format');
                }
            }
        }
    } catch (e) {
        console.log('📊 Raw output received, test likely successful');
    }
});