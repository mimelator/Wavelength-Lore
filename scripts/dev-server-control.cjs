#!/usr/bin/env node

/**
 * Dev Server Control - WAVELENGTH AGENT Interface
 * Simple interface to MCP dev server manager
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const pidFile = path.join(__dirname, '../.server.pid');

function startServer() {
  console.log('🚀 Starting dev server via MCP manager...');
  
  const serverProcess = spawn('node', ['index.js'], {
    cwd: path.join(__dirname, '..'),
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  fs.writeFileSync(pidFile, serverProcess.pid.toString());
  
  const logStream = fs.createWriteStream(path.join(__dirname, '../.server.log'), { flags: 'a' });
  serverProcess.stdout.pipe(logStream);
  serverProcess.stderr.pipe(logStream);
  
  serverProcess.unref();
  
  setTimeout(() => {
    console.log(`✅ Server started (PID: ${serverProcess.pid})`);
    console.log('🌊 Available at http://localhost:3001');
  }, 2000);
}

function stopServer() {
  if (!fs.existsSync(pidFile)) {
    console.log('❌ No server running');
    return;
  }

  const pid = fs.readFileSync(pidFile, 'utf8').trim();
  
  try {
    process.kill(pid, 'SIGTERM');
    fs.unlinkSync(pidFile);
    console.log(`✅ Server stopped (PID: ${pid})`);
  } catch (error) {
    fs.unlinkSync(pidFile);
    console.log('⚠️ Server already stopped');
  }
}

function checkStatus() {
  if (!fs.existsSync(pidFile)) {
    console.log('❌ Server not running');
    return;
  }
  
  const pid = fs.readFileSync(pidFile, 'utf8').trim();
  try {
    process.kill(pid, 0);
    console.log(`✅ Server running (PID: ${pid})`);
  } catch (e) {
    fs.unlinkSync(pidFile);
    console.log('❌ Server not running (cleaned stale PID)');
  }
}

const command = process.argv[2] || 'status';

switch (command) {
  case 'start': startServer(); break;
  case 'stop': stopServer(); break;
  case 'status': checkStatus(); break;
  case 'restart': 
    stopServer(); 
    setTimeout(startServer, 1000); 
    break;
  default:
    console.log('Usage: node dev-server-control.cjs [start|stop|status|restart]');
}