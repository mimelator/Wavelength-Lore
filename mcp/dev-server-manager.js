#!/usr/bin/env node

/**
 * Wavelength Dev Server Manager MCP Tools
 * AI-controlled development server management
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class DevServerManagerMCP {
  constructor() {
    this.server = new Server(
      {
        name: "wavelength-dev-manager",
        version: "1.0.0",
      },
      {
        capabilities: { tools: {} },
      }
    );

    this.setupTools();
  }

  setupTools() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "dev_server_start",
          description: "Start the Wavelength development server",
          inputSchema: {
            type: "object",
            properties: {
              mode: { type: "string", enum: ["normal", "debug", "clean"], description: "Start mode" }
            }
          }
        },
        {
          name: "dev_server_stop",
          description: "Stop the development server gracefully",
          inputSchema: { type: "object", properties: {} }
        },
        {
          name: "dev_server_restart",
          description: "Restart the development server",
          inputSchema: {
            type: "object",
            properties: {
              clearCache: { type: "boolean", description: "Clear cache on restart" }
            }
          }
        },
        {
          name: "dev_server_status",
          description: "Check development server status and health",
          inputSchema: { type: "object", properties: {} }
        },
        {
          name: "dev_server_logs",
          description: "Get recent development server logs",
          inputSchema: {
            type: "object",
            properties: {
              lines: { type: "number", description: "Number of log lines to retrieve" }
            }
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "dev_server_start":
            return await this.startServer(args.mode || "normal");
          case "dev_server_stop":
            return await this.stopServer();
          case "dev_server_restart":
            return await this.restartServer(args.clearCache || false);
          case "dev_server_status":
            return await this.checkServerStatus();
          case "dev_server_logs":
            return await this.getServerLogs(args.lines || 20);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: ${error.message}` }]
        };
      }
    });
  }

  async startServer(mode) {
    const projectRoot = path.resolve(__dirname, '..');
    const pidFile = path.join(projectRoot, '.server.pid');
    
    // Check if server is already running
    if (fs.existsSync(pidFile)) {
      const pid = fs.readFileSync(pidFile, 'utf8').trim();
      try {
        process.kill(pid, 0); // Check if process exists
        return {
          content: [{
            type: "text",
            text: `⚠️ Server already running (PID: ${pid})\nUse dev_server_restart to restart or dev_server_stop to stop first.`
          }]
        };
      } catch (e) {
        // Process doesn't exist, remove stale PID file
        fs.unlinkSync(pidFile);
      }
    }

    let command = 'npm start';
    if (mode === 'debug') command = 'npm run debug';
    if (mode === 'clean') command = 'npm run clean && npm start';

    return new Promise((resolve) => {
      const serverProcess = spawn('bash', ['-c', command], {
        cwd: projectRoot,
        detached: true,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      // Save PID
      fs.writeFileSync(pidFile, serverProcess.pid.toString());

      // Give server time to start
      setTimeout(() => {
        resolve({
          content: [{
            type: "text",
            text: `🚀 Wavelength dev server starting in ${mode} mode...\n` +
                  `PID: ${serverProcess.pid}\n` +
                  `URL: http://localhost:3001\n` +
                  `Use dev_server_status to check if ready.`
          }]
        });
      }, 2000);

      serverProcess.unref();
    });
  }

  async stopServer() {
    const projectRoot = path.resolve(__dirname, '..');
    const pidFile = path.join(projectRoot, '.server.pid');

    if (!fs.existsSync(pidFile)) {
      return {
        content: [{
          type: "text",
          text: "⚠️ No server PID file found. Server may not be running."
        }]
      };
    }

    const pid = fs.readFileSync(pidFile, 'utf8').trim();

    try {
      process.kill(pid, 'SIGTERM');
      fs.unlinkSync(pidFile);
      
      return {
        content: [{
          type: "text",
          text: `✅ Server stopped gracefully (PID: ${pid})`
        }]
      };
    } catch (error) {
      fs.unlinkSync(pidFile); // Remove stale PID file
      return {
        content: [{
          type: "text",
          text: `⚠️ Server process not found (PID: ${pid}). Cleaned up PID file.`
        }]
      };
    }
  }

  async restartServer(clearCache) {
    await this.stopServer();
    
    if (clearCache) {
      // Clear npm cache and node_modules cache
      exec('npm cache clean --force', { cwd: path.resolve(__dirname, '..') });
    }
    
    // Wait a moment for cleanup
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return await this.startServer(clearCache ? 'clean' : 'normal');
  }

  async checkServerStatus() {
    const projectRoot = path.resolve(__dirname, '..');
    const pidFile = path.join(projectRoot, '.server.pid');

    if (!fs.existsSync(pidFile)) {
      return {
        content: [{
          type: "text",
          text: "❌ Server not running (no PID file found)"
        }]
      };
    }

    const pid = fs.readFileSync(pidFile, 'utf8').trim();

    try {
      process.kill(pid, 0); // Check if process exists
      
      // Test HTTP endpoint
      return new Promise((resolve) => {
        const http = require('http');
        const req = http.get('http://localhost:3001/health', (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            resolve({
              content: [{
                type: "text",
                text: `✅ Server running and healthy\n` +
                      `PID: ${pid}\n` +
                      `Status: ${res.statusCode}\n` +
                      `Response: ${data}`
              }]
            });
          });
        });

        req.on('error', () => {
          resolve({
            content: [{
              type: "text",
              text: `⚠️ Server process running (PID: ${pid}) but not responding to HTTP requests`
            }]
          });
        });

        req.setTimeout(5000, () => {
          req.destroy();
          resolve({
            content: [{
              type: "text",
              text: `⚠️ Server process running (PID: ${pid}) but HTTP timeout`
            }]
          });
        });
      });
    } catch (error) {
      fs.unlinkSync(pidFile); // Remove stale PID file
      return {
        content: [{
          type: "text",
          text: `❌ Server not running (stale PID: ${pid}). Cleaned up PID file.`
        }]
      };
    }
  }

  async getServerLogs(lines) {
    const projectRoot = path.resolve(__dirname, '..');
    const logFile = path.join(projectRoot, 'server.log');

    if (!fs.existsSync(logFile)) {
      return {
        content: [{
          type: "text",
          text: "⚠️ No server log file found"
        }]
      };
    }

    return new Promise((resolve) => {
      exec(`tail -n ${lines} "${logFile}"`, (error, stdout, stderr) => {
        if (error) {
          resolve({
            content: [{
              type: "text",
              text: `Error reading logs: ${error.message}`
            }]
          });
        } else {
          resolve({
            content: [{
              type: "text",
              text: `📋 Last ${lines} server log lines:\n\n${stdout}`
            }]
          });
        }
      });
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("🚀 Wavelength Dev Server Manager MCP running!");
  }
}

if (require.main === module) {
  const server = new DevServerManagerMCP();
  server.run().catch(console.error);
}

module.exports = DevServerManagerMCP;