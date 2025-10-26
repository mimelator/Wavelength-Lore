#!/usr/bin/env node

const { spawn } = require('child_process');

console.log('🔍 WAVELENGTH SUPER POWER: Monitoring GitHub Actions...');

const mcpRequest = {
    "jsonrpc": "2.0", 
    "id": 3005,
    "method": "tools/call",
    "params": {
        "name": "http_request",
        "arguments": {
            "url": "https://api.github.com/repos/mimelator/Wavelength-Lore/actions/runs?per_page=5",
            "method": "GET",
            "headers": {
                "Accept": "application/vnd.github.v3+json",
                "User-Agent": "Wavelength-MCP-Monitor"
            }
        }
    }
};

const mcp = spawn('node', ['mcp/enhanced-wavelength-server.js'], {
    stdio: ['pipe', 'pipe', 'pipe']
});

mcp.stdin.write(JSON.stringify(mcpRequest) + '\n');
mcp.stdin.end();

mcp.stdout.on('data', (data) => console.log(data.toString()));
mcp.stderr.on('data', (data) => console.error('MCP:', data.toString()));
mcp.on('close', () => {
    console.log('🏁 WAVELENGTH GitHub monitoring complete!');
    require('fs').unlinkSync(__filename);
});