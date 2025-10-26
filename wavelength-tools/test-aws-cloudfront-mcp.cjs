const { spawn } = require('child_process');

const testRequest = {
    "jsonrpc": "2.0",
    "id": 2008,
    "method": "tools/call",
    "params": {
        "name": "node_execute",
        "arguments": {
            "command": "test",
            "script": "scripts/unified/aws-manager.js",
            "args": ["cloudfront", "--help"],
            "timeout": 15,
            "context": "Testing ES module conversion - AWS manager CloudFront commands",
            "forceExit": true,
            "exitDelay": 3
        }
    }
};

console.log('🧪 Testing AWS Manager CloudFront Commands via MCP...');

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
    console.log('✅ MCP AWS Manager CloudFront Test completed with code:', code);
});