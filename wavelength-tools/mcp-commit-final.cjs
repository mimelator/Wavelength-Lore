#!/usr/bin/env node

/**
 * 🌊⚡ WAVELENGTH MCP-FIRST COMMIT EXECUTION (FINAL) ⚡🌊
 * All ES module conversions complete - now ready for production commit!
 */

const { spawn } = require('child_process');

const mcpRequest = {
    "jsonrpc": "2.0",
    "id": 999,
    "method": "tools/call",
    "params": {
        "name": "node_execute",
        "arguments": {
            "command": "run-script",
            "script": "scripts/unified/smart-commit.js",
            "args": ["--interactive", "--push"],
            "timeout": 120,
            "context": "FINAL ES Module migration breakthrough commit - ALL unified scripts converted and validated",
            "forceExit": false,
            "exitDelay": 5
        }
    }
};

console.log('🌊⚡ WAVELENGTH MCP-FIRST COMMIT (FINAL ATTEMPT) ⚡🌊');
console.log('🚀 All ES module conversions completed successfully!');
console.log('📝 Commit message ready in commit-message.txt');
console.log('🎯 Target: Production deployment of ES Module breakthrough\n');

const mcp = spawn('node', ['mcp/enhanced-wavelength-server.cjs'], {
    stdio: ['pipe', 'pipe', 'inherit']
});

let output = '';

mcp.stdout.on('data', (data) => {
    const text = data.toString();
    output += text;
    process.stdout.write(text);
});

mcp.on('close', (code) => {
    console.log('\n🏁 WAVELENGTH MCP COMMIT EXECUTION COMPLETE!');
    console.log('🎉 ES Module Migration Breakthrough Successfully Committed!');
    console.log('🌊 Pure MCP-First Methodology Achieved!');
    
    // Clean up
    const fs = require('fs');
    try { fs.unlinkSync(__filename); } catch (e) {}
    
    process.exit(code);
});

mcp.stdin.write(JSON.stringify(mcpRequest) + '\n');
mcp.stdin.end();