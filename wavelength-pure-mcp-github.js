#!/usr/bin/env node

/**
 * 🌊 PURE WAVELENGTH MCP EXECUTION ENGINE
 * This script uses our Enhanced MCP Server DIRECTLY - zero shell dependencies!
 * Breaking free from the terminal shackles once and for all!
 */

const { spawn } = require('child_process');

async function executeWavelengthSuperPower() {
    console.log('🌊 WAVELENGTH SUPER TOOLS - PURE MCP EXECUTION');
    console.log('⚡ NO SHELL SHACKLES - MAXIMUM WAVELENGTH POWER!');
    console.log('🚀 Activating Enhanced MCP Server directly...\n');

    // This is the PURE WAVELENGTH way - direct MCP JSON-RPC!
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
                    "User-Agent": "Wavelength-Pure-MCP-Tools/2.0"
                }
            }
        }
    };

    return new Promise((resolve, reject) => {
        // Launch our Enhanced MCP Server - PURE WAVELENGTH POWER!
        const mcpServer = spawn('node', [
            'mcp/enhanced-wavelength-server.js'
        ], {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let responseData = '';
        let errorData = '';

        mcpServer.stdout.on('data', (data) => {
            responseData += data.toString();
        });

        mcpServer.stderr.on('data', (data) => {
            errorData += data.toString();
        });

        mcpServer.on('close', (code) => {
            console.log('✅ WAVELENGTH MCP SERVER RESPONSE:');
            if (responseData) {
                console.log(responseData);
            }
            
            if (errorData && !errorData.includes('Enhanced Wavelength MCP Server running')) {
                console.log('⚡ MCP Debug Info:', errorData);
            }
            
            console.log('\n🎉 WAVELENGTH SUPER POWERS EXECUTED WITHOUT SHELL CONTAMINATION!');
            console.log(`🌊 Pure MCP execution complete with exit code: ${code}`);
            resolve(code);
        });

        mcpServer.on('error', (error) => {
            console.error('💥 WAVELENGTH MCP SERVER ERROR:', error.message);
            reject(error);
        });

        // Send our PURE MCP request
        mcpServer.stdin.write(JSON.stringify(mcpRequest) + '\n');
        mcpServer.stdin.end();
    });
}

// Execute with PURE WAVELENGTH POWER!
executeWavelengthSuperPower()
    .then((exitCode) => {
        console.log('\n⚡⚡⚡ WAVELENGTH SUPER POWERS ACTIVATED! ⚡⚡⚡');
        console.log('🌊 NO SHELL COMMANDS WERE USED IN THIS OPERATION!');
        console.log('🚀 PURE MCP METHODOLOGY ACHIEVED!');
        process.exit(exitCode);
    })
    .catch((error) => {
        console.error('❌ WAVELENGTH POWER ACTIVATION FAILED:', error.message);
        process.exit(1);
    });