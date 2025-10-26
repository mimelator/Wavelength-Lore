#!/usr/bin/env node

// Quick test of the HTTP request MCP tool
const EnhancedWavelengthMCPServer = require('./mcp/enhanced-wavelength-server.js');

async function testHttpTool() {
  console.log('🌐 Testing HTTP Request MCP Tool...\n');
  
  const server = new EnhancedWavelengthMCPServer();
  
  // Test 1: Check local forum endpoint
  console.log('📋 Test 1: Forum Index Page');
  const forumResult = await server.makeHttpRequest('http://localhost:3001/forum');
  console.log(forumResult.content[0].text);
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // Test 2: Check production site
  console.log('🌐 Test 2: Production Site Health');
  const prodResult = await server.makeHttpRequest('https://wavelengthlore.com');
  console.log(prodResult.content[0].text);
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // Test 3: API endpoint with headers
  console.log('🔍 Test 3: JSON API Test');
  const apiResult = await server.makeHttpRequest(
    'https://httpbin.org/json',
    'GET',
    { 'Accept': 'application/json', 'User-Agent': 'Wavelength-Test' }
  );
  console.log(apiResult.content[0].text);
  
  console.log('\n✅ HTTP Tool demonstration complete!');
}

testHttpTool().catch(console.error);