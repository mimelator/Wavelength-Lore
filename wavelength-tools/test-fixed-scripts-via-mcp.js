#!/usr/bin/env node

/**
 * 🌊 WAVELENGTH AGENT: Test Fixed Scripts via MCP
 * Using PURE MCP node_execute tool - NO SHELL SHACKLES!
 */

const { spawn } = require('child_process');

console.log('🌊 WAVELENGTH AGENT: Testing Fixed Scripts via MCP');
console.log('⚡ Using PURE MCP node_execute - Breaking Shell Dependencies!\n');

// Test 1: Monitor Production Simple (ES Module Fixed)
const testMonitorScript = {
    "jsonrpc": "2.0",
    "id": 1001,
    "method": "tools/call",
    "params": {
        "name": "node_execute",
        "arguments": {
            "command": "test",
            "script": "scripts/monitor-production-simple.js",
            "timeout": 15,
            "context": "Testing ES module conversion - monitoring script",
            "forceExit": true,
            "exitDelay": 3
        }
    }
};

// Test 2: Production Health Check (ES Module Fixed)
const testHealthCheckScript = {
    "jsonrpc": "2.0",
    "id": 1002,
    "method": "tools/call",
    "params": {
        "name": "node_execute",
        "arguments": {
            "command": "test",
            "script": "scripts/organized/testing-validation/production-health-check.js",
            "timeout": 30,
            "context": "Testing ES module conversion - health check script",
            "forceExit": true,
            "exitDelay": 5
        }
    }
};

// Test 3: Unified Test Runner Help (ES Module Fixed)
const testRunnerHelp = {
    "jsonrpc": "2.0",
    "id": 1003,
    "method": "tools/call",
    "params": {
        "name": "node_execute",
        "arguments": {
            "command": "custom",
            "script": `
// Test the unified test runner help command
const { spawn } = require('child_process');

console.log('🧪 Testing Unified Test Runner Help...');

const child = spawn('node', ['scripts/unified/test-runner.js', 'help'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    timeout: 10000
});

let output = '';
let errorOutput = '';

child.stdout.on('data', (data) => {
    output += data.toString();
});

child.stderr.on('data', (data) => {
    errorOutput += data.toString();
});

child.on('close', (code) => {
    console.log('📄 Test Runner Help Output:');
    if (output) {
        console.log(output);
    }
    if (errorOutput) {
        console.log('⚠️ Errors:', errorOutput);
    }
    console.log('🎯 Exit Code:', code);
});

child.on('error', (error) => {
    console.error('❌ Test Runner Help Failed:', error.message);
});
            `,
            "timeout": 15,
            "context": "Testing ES module conversion - test runner help",
            "forceExit": true,
            "exitDelay": 3
        }
    }
};

async function runMCPTest(testRequest, testName) {
    return new Promise((resolve) => {
        console.log(`🔄 Running ${testName}...`);
        
        const mcp = spawn('node', ['mcp/enhanced-wavelength-server.js'], {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        mcp.stdin.write(JSON.stringify(testRequest) + '\n');
        mcp.stdin.end();

        let output = '';
        let errorOutput = '';

        mcp.stdout.on('data', (data) => {
            output += data.toString();
        });

        mcp.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        mcp.on('close', (code) => {
            console.log(`✅ ${testName} MCP Test Complete:`);
            if (output) {
                console.log(output);
            }
            if (errorOutput && !errorOutput.includes('Enhanced Wavelength MCP Server running')) {
                console.log('⚡ MCP Debug:', errorOutput);
            }
            console.log('━'.repeat(60));
            resolve();
        });

        mcp.on('error', (error) => {
            console.error(`❌ ${testName} MCP Test Failed:`, error.message);
            resolve();
        });
    });
}

async function runAllTests() {
    console.log('🚀 Starting WAVELENGTH MCP Script Testing...\n');
    
    await runMCPTest(testMonitorScript, 'Monitor Production Simple');
    await runMCPTest(testHealthCheckScript, 'Production Health Check');
    await runMCPTest(testRunnerHelp, 'Test Runner Help');
    
    console.log('🎉 All WAVELENGTH MCP tests completed!');
    
    // Clean up this temp test file
    const fs = require('fs');
    fs.unlinkSync(__filename);
}

runAllTests().catch(console.error);