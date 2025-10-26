#!/usr/bin/env node

/**
 * WAVELENGTH Isolation MCP Server
 * Provides ONLY WAVELENGTH tools - no terminal access
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const fs = require('fs');
const { spawn } = require('child_process');

class WavelengthIsolationServer {
  constructor() {
    this.server = new Server({
      name: "wavelength-isolation",
      version: "1.0.0"
    }, { capabilities: { tools: {} } });
    
    this.setupTools();
  }

  setupTools() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "memory_query",
          description: "Query WAVELENGTH memory system",
          inputSchema: {
            type: "object",
            properties: {
              query: { type: "string", description: "Search query" }
            },
            required: ["query"]
          }
        },
        {
          name: "server_control",
          description: "Control dev server",
          inputSchema: {
            type: "object",
            properties: {
              action: { type: "string", enum: ["start", "stop", "status", "restart"] }
            },
            required: ["action"]
          }
        },
        {
          name: "file_read",
          description: "Read project files",
          inputSchema: {
            type: "object",
            properties: {
              path: { type: "string", description: "File path" }
            },
            required: ["path"]
          }
        },
        {
          name: "file_write",
          description: "Write project files",
          inputSchema: {
            type: "object",
            properties: {
              path: { type: "string", description: "File path" },
              content: { type: "string", description: "File content" }
            },
            required: ["path", "content"]
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        switch (name) {
          case "memory_query":
            return await this.queryMemory(args.query);
          case "server_control":
            return await this.controlServer(args.action);
          case "file_read":
            return await this.readFile(args.path);
          case "file_write":
            return await this.writeFile(args.path, args.content);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }] };
      }
    });
  }

  async queryMemory(query) {
    return new Promise((resolve) => {
      const process = spawn('node', ['scripts/query-memory.js', query], {
        cwd: '/Volumes/5bits/current/wavelength-dev/Wavelength-Lore/Wavelength-Lore.fresh'
      });
      
      let output = '';
      process.stdout.on('data', (data) => output += data);
      process.on('close', () => {
        resolve({ content: [{ type: "text", text: output }] });
      });
    });
  }

  async controlServer(action) {
    return new Promise((resolve) => {
      const process = spawn('node', ['scripts/organized/development-tools/server-manager.cjs', action], {
        cwd: '/Volumes/5bits/current/wavelength-dev/Wavelength-Lore/Wavelength-Lore.fresh'
      });
      
      let output = '';
      process.stdout.on('data', (data) => output += data);
      process.on('close', () => {
        resolve({ content: [{ type: "text", text: output }] });
      });
    });
  }

  async readFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return { content: [{ type: "text", text: content }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error reading file: ${error.message}` }] };
    }
  }

  async writeFile(filePath, content) {
    try {
      fs.writeFileSync(filePath, content);
      return { content: [{ type: "text", text: `✅ File written: ${filePath}` }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error writing file: ${error.message}` }] };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("🌊⚡ WAVELENGTH Isolation Server running!");
  }
}

if (require.main === module) {
  const server = new WavelengthIsolationServer();
  server.run().catch(console.error);
}

module.exports = WavelengthIsolationServer;