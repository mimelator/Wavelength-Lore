#!/usr/bin/env node

// Production Health Check using MCP node_execute tool
const { spawn } = require('child_process');
const fs = require('fs');

console.log('🚀 Starting MCP Production Health Check...');

const mcpRequest = {
    "jsonrpc": "2.0",
    "id": 901,
    "method": "tools/call",
    "params": {
        "name": "node_execute",
        "arguments": {
            "command": "custom",
            "script": `
const https = require('https');
console.log('🏥 Production Health Check Starting...');

const checkUrl = (url, name) => {
    return new Promise((resolve) => {
        console.log(\`🔍 Checking \${name}: \${url}\`);
        const req = https.get(url, (res) => {
            console.log(\`✅ \${name}: Status \${res.statusCode}\`);
            console.log(\`   Content-Type: \${res.headers['content-type'] || 'N/A'}\`);
            console.log(\`   Server: \${res.headers['server'] || 'N/A'}\`);
            resolve({ name, status: res.statusCode, success: res.statusCode === 200 });
        });
        req.on('error', (err) => {
            console.log(\`❌ \${name}: Error - \${err.message}\`);
            resolve({ name, status: null, success: false, error: err.message });
        });
        req.setTimeout(10000, () => {
            console.log(\`⏰ \${name}: Timeout after 10 seconds\`);
            req.destroy();
            resolve({ name, status: null, success: false, error: 'Timeout' });
        });
    });
};

// Execute health checks
(async () => {
    console.log('📊 Running comprehensive health checks...');
    
    const results = await Promise.all([
        checkUrl('https://wavelengthlore.com', 'Main Site'),
        checkUrl('https://wavelengthlore.com/health', 'Health Endpoint'),
        checkUrl('https://wavelengthlore.com/static/favicon.ico', 'CDN Assets'),
        checkUrl('https://wavelengthlore.com/api/status', 'API Endpoint')
    ]);
    
    console.log('\\n📋 HEALTH CHECK SUMMARY:');
    console.log('========================');
    results.forEach(result => {
        const status = result.success ? '✅ HEALTHY' : '❌ ISSUE';
        console.log(\`\${status} \${result.name}: \${result.status || result.error}\`);
    });
    
    const healthyCount = results.filter(r => r.success).length;
    console.log(\`\\n🎯 Overall Health: \${healthyCount}/\${results.length} services healthy\`);
    
    if (healthyCount === results.length) {
        console.log('🚀 Production server is fully operational!');
    } else {
        console.log('⚠️  Some services need attention');
    }
    
    process.exit(0);
})();
            `,
            "context": "Comprehensive production health monitoring",
            "forceExit": true,
            "exitDelay": 8
        }
    }
};

// Send request to MCP server
const mcp = spawn('node', ['mcp/enhanced-wavelength-server.js'], {
    stdio: ['pipe', 'pipe', 'pipe']
});

mcp.stdin.write(JSON.stringify(mcpRequest) + '\n');
mcp.stdin.end();

mcp.stdout.on('data', (data) => {
    console.log(data.toString());
});

mcp.stderr.on('data', (data) => {
    console.error('MCP Error:', data.toString());
});

mcp.on('close', (code) => {
    console.log('🏁 MCP health check completed');
    // Clean up temp file
    fs.unlinkSync(__filename);
});