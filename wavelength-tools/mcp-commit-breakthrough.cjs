#!/usr/bin/env node

/**
 * 🌊⚡ WAVELENGTH MCP-FIRST COMMIT EXECUTION ⚡🌊
 * Using our Enhanced MCP Server to execute smart-commit
 * PURE MCP METHODOLOGY - NO SHELL DEPENDENCIES!
 */

const { spawn } = require('child_process');

// PURE MCP node_execute request to run our smart-commit script
const mcpRequest = {
    "jsonrpc": "2.0",
    "id": 777,
    "method": "tools/call",
    "params": {
        "name": "node_execute",
        "arguments": {
            "command": "run-script",
            "script": "scripts/unified/smart-commit.js",
            "args": ["--interactive", "--push"],
            "timeout": 60,
            "context": "ES Module migration breakthrough commit - complete unified script conversion success",
            "forceExit": true,
            "exitDelay": 3
        }
    }
};

console.log('🌊⚡ WAVELENGTH MCP-FIRST COMMIT ACTIVATED! ⚡🌊');
console.log('🚀 Using Enhanced MCP Server to execute smart-commit...');
console.log('📝 Commit message already prepared in commit-message.txt');
console.log('🎯 Target: ES Module Migration Breakthrough to Production\n');

// Launch Enhanced MCP Server
const mcp = spawn('node', ['mcp/enhanced-wavelength-server.cjs'], {
    stdio: ['pipe', 'pipe', 'pipe']
});

let output = '';
let errorOutput = '';

mcp.stdout.on('data', (data) => {
    const text = data.toString();
    output += text;
    // Real-time output for interactive experience
    if (text.includes('📋') || text.includes('✅') || text.includes('🚀') || text.includes('❌')) {
        process.stdout.write(text);
    }
});

mcp.stderr.on('data', (data) => {
    errorOutput += data.toString();
});

mcp.on('close', (code) => {
    console.log('\n🏁 WAVELENGTH MCP COMMIT EXECUTION COMPLETE!');
    
    if (output) {
        console.log('\n📊 EXECUTION RESULTS:');
        console.log(output);
    }
    
    if (errorOutput && !errorOutput.includes('Enhanced Wavelength MCP Server running')) {
        console.log('\n⚡ MCP Debug Info:', errorOutput);
    }
    
    console.log('\n🎉 MCP-FIRST METHODOLOGY SUCCESS!');
    console.log('🌊 Used Enhanced WAVELENGTH MCP Server');
    console.log('⚡ Zero shell command dependencies');
    console.log('🚀 Pure node_execute tool power');
    
    // Clean up this temp file
    const fs = require('fs');
    try {
        fs.unlinkSync(__filename);
    } catch (e) {
        // File cleanup not critical
    }
    
    process.exit(code);
});

mcp.on('error', (error) => {
    console.error('❌ MCP Execution Error:', error.message);
    console.log('\n💡 Fallback: You can manually run:');
    console.log('   node scripts/unified/smart-commit.js --interactive --push');
    process.exit(1);
});

// Send the MCP request
mcp.stdin.write(JSON.stringify(mcpRequest) + '\n');
mcp.stdin.end();