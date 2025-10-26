#!/usr/bin/env node

/**
 * Simple Server Starter - WAVELENGTH AGENT Tool
 * Minimal CommonJS script to start the server
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const pidFile = path.join(__dirname, '../.server.pid');

function checkStatus() {
  if (!fs.existsSync(pidFile)) {
    return { running: false, message: '❌ Server not running' };
  }
  
  const pid = fs.readFileSync(pidFile, 'utf8').trim();
  try {
    process.kill(pid, 0);
    return { running: true, pid, message: `✅ Server running (PID: ${pid})` };
  } catch (e) {
    fs.unlinkSync(pidFile);
    return { running: false, message: '❌ Server not running (cleaned stale PID)' };
  }
}

function startServer() {
  const status = checkStatus();
  if (status.running) {
    console.log('⚠️  Server already running');
    return;
  }

  console.log('🚀 Starting WAVELENGTH server...');
  
  const serverProcess = spawn('node', ['index.js'], {
    cwd: path.join(__dirname, '..'),
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  fs.writeFileSync(pidFile, serverProcess.pid.toString());
  serverProcess.unref();
  
  setTimeout(() => {
    const newStatus = checkStatus();
    console.log(newStatus.message);
    if (newStatus.running) {
      console.log('🌊 Server ready at http://localhost:3001');
    }
  }, 2000);
}

const command = process.argv[2] || 'start';

switch (command) {
  case 'start':
    startServer();
    break;
  case 'status':
    console.log(checkStatus().message);
    break;
  default:
    console.log('Usage: node server-start.cjs [start|status]');
}