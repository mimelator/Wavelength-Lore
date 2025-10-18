#!/usr/bin/env node

/**
 * Production Diagnostic Script
 * Helps diagnose 502 Bad Gateway errors in production
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('🔍 Production Server Diagnostic Tool');
console.log('=====================================\n');

/**
 * Test if a service is running on a specific port
 */
function testPort(port, host = 'localhost') {
    return new Promise((resolve) => {
        const socket = new require('net').Socket();
        
        socket.setTimeout(5000);
        
        socket.on('connect', () => {
            socket.destroy();
            resolve(true);
        });
        
        socket.on('error', () => {
            resolve(false);
        });
        
        socket.on('timeout', () => {
            socket.destroy();
            resolve(false);
        });
        
        socket.connect(port, host);
    });
}

/**
 * Test HTTP endpoint
 */
function testHttpEndpoint(port, path = '/', host = 'localhost') {
    return new Promise((resolve) => {
        const options = {
            hostname: host,
            port: port,
            path: path,
            method: 'GET',
            timeout: 5000
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: data.length > 500 ? data.substring(0, 500) + '...' : data
                });
            });
        });

        req.on('error', (error) => {
            resolve({ error: error.message });
        });

        req.on('timeout', () => {
            req.destroy();
            resolve({ error: 'Request timeout' });
        });

        req.end();
    });
}

/**
 * Check if required files exist
 */
function checkRequiredFiles() {
    const requiredFiles = [
        'package.json',
        'index.js',
        '.env',
        'config/nginx.conf'
    ];

    console.log('📁 Checking Required Files:');
    
    const results = {};
    requiredFiles.forEach(file => {
        const exists = fs.existsSync(file);
        console.log(`  ${exists ? '✅' : '❌'} ${file}`);
        results[file] = exists;
    });
    
    return results;
}

/**
 * Check environment variables
 */
function checkEnvironmentVariables() {
    console.log('\n🔐 Checking Environment Variables:');
    
    const requiredEnvVars = [
        'NODE_PORT',
        'NGINX_PORT',
        'DATABASE_URL',
        'PROJECT_ID',
        'API_KEY'
    ];

    const results = {};
    requiredEnvVars.forEach(envVar => {
        const exists = !!process.env[envVar];
        console.log(`  ${exists ? '✅' : '❌'} ${envVar}: ${exists ? 'Set' : 'Missing'}`);
        results[envVar] = exists;
    });
    
    // Show port configuration
    const nodePort = process.env.NODE_PORT || process.env.PORT || 3001;
    const nginxPort = process.env.NGINX_PORT || 8080;
    console.log(`\n📊 Port Configuration:`);
    console.log(`  Node.js will run on: ${nodePort}`);
    console.log(`  Nginx will listen on: ${nginxPort}`);

    return results;
}

/**
 * Main diagnostic function
 */
async function runDiagnostics() {
    try {
        // 1. Check files
        const fileResults = checkRequiredFiles();
        
        // 2. Check environment variables
        require('dotenv').config();
        const envResults = checkEnvironmentVariables();
        
        // 3. Test ports
        console.log('\n🔌 Testing Port Connectivity:');
        
        const port3001 = await testPort(3001);
        console.log(`  ${port3001 ? '✅' : '❌'} Port 3001 (Node.js app): ${port3001 ? 'Open' : 'Closed'}`);
        
        const port8080 = await testPort(8080);
        console.log(`  ${port8080 ? '✅' : '❌'} Port 8080 (Nginx): ${port8080 ? 'Open' : 'Closed'}`);
        
        // 4. Test HTTP endpoints
        console.log('\n🌐 Testing HTTP Endpoints:');
        
        if (port3001) {
            const nodeResponse = await testHttpEndpoint(3001, '/');
            if (nodeResponse.error) {
                console.log(`  ❌ Node.js app (3001): ${nodeResponse.error}`);
            } else {
                console.log(`  ✅ Node.js app (3001): HTTP ${nodeResponse.status}`);
            }
        }
        
        if (port8080) {
            const nginxResponse = await testHttpEndpoint(8080, '/');
            if (nginxResponse.error) {
                console.log(`  ❌ Nginx (8080): ${nginxResponse.error}`);
            } else {
                console.log(`  ✅ Nginx (8080): HTTP ${nginxResponse.status}`);
            }
        }
        
        // 5. Diagnosis and recommendations
        console.log('\n🔧 Diagnosis & Recommendations:');
        console.log('================================');
        
        if (!port3001) {
            console.log('❌ CRITICAL: Node.js application is not running on port 3001');
            console.log('   Solutions:');
            console.log('   - Check if the Node.js process is running: ps aux | grep node');
            console.log('   - Check application logs for startup errors');
            console.log('   - Verify environment variables are set correctly');
            console.log('   - Try starting manually: node index.js');
        }
        
        if (!port8080) {
            console.log('❌ CRITICAL: Nginx is not running on port 8080');
            console.log('   Solutions:');
            console.log('   - Check if Nginx is running: sudo systemctl status nginx');
            console.log('   - Start Nginx: sudo systemctl start nginx');
            console.log('   - Check Nginx configuration: nginx -t');
        }
        
        if (port8080 && !port3001) {
            console.log('❌ LIKELY CAUSE: Nginx is running but can\'t connect to Node.js backend');
            console.log('   This is the most common cause of 502 Bad Gateway errors');
            console.log('   The proxy_pass in nginx.conf points to localhost:3001 but nothing is listening');
        }
        
        if (!fileResults['.env']) {
            console.log('❌ WARNING: .env file is missing');
            console.log('   - Copy .env.example to .env if available');
            console.log('   - Set required environment variables');
        }
        
        if (!envResults.DATABASE_URL || !envResults.API_KEY) {
            console.log('❌ WARNING: Firebase configuration may be incomplete');
            console.log('   - Check DATABASE_URL and API_KEY environment variables');
            console.log('   - Verify Firebase credentials are correct');
        }
        
        // 6. Docker-specific checks
        console.log('\n🐳 Docker Environment Checks:');
        
        try {
            const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            console.log(`  📦 App Name: ${packageJson.name}`);
            console.log(`  🔢 Version: ${packageJson.version}`);
            console.log(`  🎯 Main: ${packageJson.main}`);
            console.log(`  📝 Start Script: ${packageJson.scripts.start || 'Not defined'}`);
        } catch (error) {
            console.log('  ❌ Could not read package.json');
        }
        
        // 7. Next steps
        console.log('\n📋 Next Steps:');
        console.log('==============');
        console.log('1. Check container logs: docker logs <container-id>');
        console.log('2. SSH into production server and run this diagnostic script');
        console.log('3. Check system logs: sudo journalctl -u nginx -f');
        console.log('4. Verify all environment variables are set in production');
        console.log('5. Ensure Firebase credentials are valid and accessible');
        
        console.log('\n💡 Common Fixes:');
        console.log('================');
        console.log('• Restart the Node.js application');
        console.log('• Check and fix environment variables');
        console.log('• Verify Firebase database connectivity');
        console.log('• Ensure sufficient memory and disk space');
        console.log('• Check for port conflicts');
        
    } catch (error) {
        console.error('❌ Diagnostic script failed:', error.message);
    }
}

// Run diagnostics
runDiagnostics();