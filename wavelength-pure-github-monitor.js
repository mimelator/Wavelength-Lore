#!/usr/bin/env node

/**
 * 🌊 PURE WAVELENGTH SUPER TOOL EXECUTION
 * Using our Enhanced MCP Server directly - NO SHELL CONTAMINATION!
 */

const { spawn } = require('child_process');

// Pure MCP JSON-RPC request - our WAVELENGTH way!
const mcpRequest = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
        "name": "http_request",
        "arguments": {
            "url": "https://api.github.com/repos/mimelator/Wavelength-Lore/actions/runs",
            "method": "GET",
            "headers": {
                "Accept": "application/vnd.github.v3+json",
                "User-Agent": "Wavelength-Super-Tools/2.0"
            }
        }
    }
};

console.log('🌊 WAVELENGTH SUPER TOOLS - GitHub Actions Monitor');
console.log('⚡ Using PURE MCP HTTP REQUEST TOOL - No Shell Commands!');
console.log('🚀 Breaking free from primitive terminal shackles!\n');

// Use our Enhanced MCP server directly!
const mcp = spawn('node', ['mcp/enhanced-wavelength-server.js'], {
    stdio: ['pipe', 'pipe', 'pipe']
});

// Send pure MCP request
mcp.stdin.write(JSON.stringify(mcpRequest) + '\n');
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
    console.log('✅ WAVELENGTH SUPER TOOL RESPONSE:');
    console.log(output);
    
    if (errorOutput) {
        console.log('⚡ MCP Server Status:', errorOutput);
    }
    
    console.log(`\n🎉 WAVELENGTH SUPER POWERS activated without shell contamination!`);
    console.log(`🌊 Exit code: ${code}`);
    process.exit(code);
});

mcp.on('error', (error) => {
    console.error('💥 WAVELENGTH MCP ERROR:', error.message);
    process.exit(1);
});