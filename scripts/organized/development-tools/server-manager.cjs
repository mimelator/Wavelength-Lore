#!/usr/bin/env node

/**
 * Server Manager - Development Tool
 * Manages local development server with proper process isolation
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class ServerManager {
  constructor() {
    this.pidFile = path.join(__dirname, '../../../.server.pid');
    this.logFile = path.join(__dirname, '../../../.server.log');
  }

  async status() {
    try {
      if (!fs.existsSync(this.pidFile)) {
        console.log('❌ Server not running (no PID file)');
        return false;
      }

      const pid = fs.readFileSync(this.pidFile, 'utf8').trim();
      
      // Check if process is actually running
      try {
        process.kill(pid, 0); // Signal 0 just checks if process exists
        console.log(`✅ Server running (PID: ${pid})`);
        return true;
      } catch (e) {
        console.log('❌ Server not running (stale PID file)');
        fs.unlinkSync(this.pidFile);
        return false;
      }
    } catch (error) {
      console.log('❌ Server status unknown:', error.message);
      return false;
    }
  }

  async start() {
    const isRunning = await this.status();
    if (isRunning) {
      console.log('⚠️  Server already running');
      return;
    }

    console.log('🚀 Starting server...');
    
    const serverProcess = spawn('node', ['index.js'], {
      cwd: path.join(__dirname, '../../..'),
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    // Write PID file
    fs.writeFileSync(this.pidFile, serverProcess.pid.toString());

    // Setup logging
    const logStream = fs.createWriteStream(this.logFile, { flags: 'a' });
    serverProcess.stdout.pipe(logStream);
    serverProcess.stderr.pipe(logStream);

    serverProcess.unref();
    
    // Wait a moment to check if it started successfully
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const started = await this.status();
    if (started) {
      console.log('✅ Server started successfully');
    } else {
      console.log('❌ Server failed to start');
    }
  }

  async stop() {
    try {
      if (!fs.existsSync(this.pidFile)) {
        console.log('❌ No server to stop (no PID file)');
        return;
      }

      const pid = fs.readFileSync(this.pidFile, 'utf8').trim();
      
      console.log(`🛑 Stopping server (PID: ${pid})...`);
      
      try {
        process.kill(pid, 'SIGTERM');
        
        // Wait for graceful shutdown
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Force kill if still running
        try {
          process.kill(pid, 0);
          console.log('⚡ Force killing server...');
          process.kill(pid, 'SIGKILL');
        } catch (e) {
          // Process already stopped
        }
        
        fs.unlinkSync(this.pidFile);
        console.log('✅ Server stopped');
        
      } catch (error) {
        console.log('❌ Error stopping server:', error.message);
        // Clean up PID file anyway
        if (fs.existsSync(this.pidFile)) {
          fs.unlinkSync(this.pidFile);
        }
      }
    } catch (error) {
      console.log('❌ Error in stop process:', error.message);
    }
  }

  async restart() {
    console.log('🔄 Restarting server...');
    await this.stop();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await this.start();
  }

  async logs() {
    if (fs.existsSync(this.logFile)) {
      console.log('📋 Server logs:');
      console.log(fs.readFileSync(this.logFile, 'utf8'));
    } else {
      console.log('❌ No log file found');
    }
  }

  async test() {
    console.log('🧪 Testing server endpoints...');
    
    const tests = [
      { name: 'Health Check', url: 'http://localhost:3001/health' },
      { name: 'Forum Admin', url: 'http://localhost:3001/forum/admin' },
      { name: 'Test Catalog', url: 'http://localhost:3001/forum/test-catalog' }
    ];

    for (const test of tests) {
      try {
        const response = await fetch(test.url);
        const status = response.ok ? '✅' : '❌';
        console.log(`${status} ${test.name}: ${response.status}`);
      } catch (error) {
        console.log(`❌ ${test.name}: ERROR`);
      }
    }
  }
}

// CLI Interface
async function main() {
  const manager = new ServerManager();
  const command = process.argv[2] || 'status';

  switch (command) {
    case 'start':
      await manager.start();
      break;
    case 'stop':
      await manager.stop();
      break;
    case 'restart':
      await manager.restart();
      break;
    case 'status':
      await manager.status();
      break;
    case 'logs':
      await manager.logs();
      break;
    case 'test':
      await manager.test();
      break;
    default:
      console.log('Usage: node server-manager.js [start|stop|restart|status|logs|test]');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = ServerManager;