#!/usr/bin/env node

// Interactive MCP Tools Tester
const { spawn } = require('child_process');

async function testMCPTool(toolName, args) {
  return new Promise((resolve, reject) => {
    const request = {
      jsonrpc: "2.0",
      method: "tools/call",
      params: { name: toolName, arguments: args },
      id: 1
    };
    
    const child = spawn('node', ['mcp/enhanced-wavelength-server.js'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let output = '';
    child.stdout.on('data', data => output += data);
    child.on('close', () => resolve(output));
    child.on('error', reject);
    
    child.stdin.write(JSON.stringify(request));
    child.stdin.end();
  });
}

async function demo() {
  console.log('🚀 MCP Tools Demo\n');
  
  // Test 1: HTTP Request
  console.log('1. Testing HTTP Request Tool...');
  const httpResult = await testMCPTool('http_request', {
    url: 'https://httpbin.org/json'
  });
  console.log(httpResult);
  
  // Test 2: Documentation Navigator
  console.log('\n2. Testing Documentation Navigator...');
  const docsResult = await testMCPTool('documentation_navigator', {
    query: 'forum tests',
    type: 'search'
  });
  console.log(docsResult);
}

demo().catch(console.error);