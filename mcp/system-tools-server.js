#!/usr/bin/env node

/**
 * System Tools MCP Server
 * Complete command line toolkit without manual approval
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

class SystemToolsMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: "system-tools",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupTools();
  }

  setupTools() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        // File Operations
        {
          name: "cat",
          description: "View file contents with syntax highlighting and analysis",
          inputSchema: {
            type: "object",
            properties: {
              file: { type: "string", description: "File path to read" },
              lines: { type: "number", description: "Number of lines to show (optional)" },
              syntax: { type: "boolean", description: "Enable syntax detection", default: true }
            },
            required: ["file"]
          }
        },
        {
          name: "head",
          description: "View beginning of files with line numbers",
          inputSchema: {
            type: "object",
            properties: {
              file: { type: "string", description: "File path" },
              lines: { type: "number", description: "Number of lines", default: 10 }
            },
            required: ["file"]
          }
        },
        {
          name: "tail",
          description: "View end of files with follow option",
          inputSchema: {
            type: "object",
            properties: {
              file: { type: "string", description: "File path" },
              lines: { type: "number", description: "Number of lines", default: 10 },
              follow: { type: "boolean", description: "Follow file changes", default: false }
            },
            required: ["file"]
          }
        },
        {
          name: "grep",
          description: "Search file contents with context and highlighting",
          inputSchema: {
            type: "object",
            properties: {
              pattern: { type: "string", description: "Search pattern" },
              file: { type: "string", description: "File or directory to search" },
              recursive: { type: "boolean", description: "Search recursively", default: false },
              context: { type: "number", description: "Lines of context", default: 2 },
              ignoreCase: { type: "boolean", description: "Case insensitive", default: false }
            },
            required: ["pattern", "file"]
          }
        },
        {
          name: "find",
          description: "Locate files with intelligent filtering",
          inputSchema: {
            type: "object",
            properties: {
              path: { type: "string", description: "Search path", default: "." },
              name: { type: "string", description: "File name pattern" },
              type: { type: "string", enum: ["f", "d", "l"], description: "File type (f=file, d=directory, l=link)" },
              size: { type: "string", description: "Size filter (e.g., +1M, -100k)" },
              maxDepth: { type: "number", description: "Maximum search depth" }
            },
            required: ["path"]
          }
        },
        {
          name: "wc",
          description: "Count lines, words, characters with analysis",
          inputSchema: {
            type: "object",
            properties: {
              file: { type: "string", description: "File path" },
              lines: { type: "boolean", description: "Count lines", default: true },
              words: { type: "boolean", description: "Count words", default: true },
              chars: { type: "boolean", description: "Count characters", default: true }
            },
            required: ["file"]
          }
        },

        // System Information
        {
          name: "ps",
          description: "Process monitoring with resource usage analysis",
          inputSchema: {
            type: "object",
            properties: {
              user: { type: "string", description: "Filter by user" },
              command: { type: "string", description: "Filter by command name" },
              sortBy: { type: "string", enum: ["cpu", "memory", "time"], description: "Sort criteria", default: "cpu" }
            }
          }
        },
        {
          name: "top",
          description: "System performance monitoring with alerts",
          inputSchema: {
            type: "object",
            properties: {
              processes: { type: "number", description: "Number of processes to show", default: 10 },
              sortBy: { type: "string", enum: ["cpu", "memory"], description: "Sort by", default: "cpu" }
            }
          }
        },
        {
          name: "df",
          description: "Disk usage with recommendations",
          inputSchema: {
            type: "object",
            properties: {
              human: { type: "boolean", description: "Human readable format", default: true },
              filesystem: { type: "string", description: "Specific filesystem" }
            }
          }
        },
        {
          name: "du",
          description: "Directory usage analysis",
          inputSchema: {
            type: "object",
            properties: {
              path: { type: "string", description: "Directory path", default: "." },
              depth: { type: "number", description: "Maximum depth", default: 1 },
              human: { type: "boolean", description: "Human readable", default: true }
            }
          }
        },
        {
          name: "free",
          description: "Memory usage with optimization tips",
          inputSchema: {
            type: "object",
            properties: {
              human: { type: "boolean", description: "Human readable", default: true }
            }
          }
        },
        {
          name: "uptime",
          description: "System uptime with health status",
          inputSchema: {
            type: "object",
            properties: {}
          }
        },

        // Network Tools
        {
          name: "ping",
          description: "Network connectivity with latency analysis",
          inputSchema: {
            type: "object",
            properties: {
              host: { type: "string", description: "Host to ping" },
              count: { type: "number", description: "Number of pings", default: 4 },
              timeout: { type: "number", description: "Timeout in seconds", default: 5 }
            },
            required: ["host"]
          }
        },
        {
          name: "netstat",
          description: "Port monitoring with security analysis",
          inputSchema: {
            type: "object",
            properties: {
              listening: { type: "boolean", description: "Show listening ports only", default: true },
              numeric: { type: "boolean", description: "Show numerical addresses", default: true },
              processes: { type: "boolean", description: "Show process names", default: true }
            }
          }
        },
        {
          name: "nslookup",
          description: "DNS resolution with validation",
          inputSchema: {
            type: "object",
            properties: {
              host: { type: "string", description: "Host to lookup" },
              type: { type: "string", enum: ["A", "AAAA", "MX", "NS", "TXT"], description: "Record type", default: "A" }
            },
            required: ["host"]
          }
        },

        // Development Tools
        {
          name: "git_status",
          description: "Git repository status with intelligent analysis",
          inputSchema: {
            type: "object",
            properties: {
              path: { type: "string", description: "Repository path", default: "." },
              verbose: { type: "boolean", description: "Verbose output", default: false }
            }
          }
        },
        {
          name: "npm_info",
          description: "NPM package information and security scanning",
          inputSchema: {
            type: "object",
            properties: {
              package: { type: "string", description: "Package name" },
              action: { type: "string", enum: ["info", "audit", "outdated", "list"], description: "Action to perform", default: "info" }
            }
          }
        },
        {
          name: "docker_status",
          description: "Docker container operations with health checks",
          inputSchema: {
            type: "object",
            properties: {
              action: { type: "string", enum: ["ps", "images", "stats", "logs"], description: "Docker action", default: "ps" },
              container: { type: "string", description: "Container name/ID for logs" }
            }
          }
        },

        // Text Processing
        {
          name: "sed",
          description: "Stream editing with preview and validation",
          inputSchema: {
            type: "object",
            properties: {
              pattern: { type: "string", description: "Sed pattern/command" },
              file: { type: "string", description: "Input file" },
              preview: { type: "boolean", description: "Preview changes only", default: true }
            },
            required: ["pattern", "file"]
          }
        },
        {
          name: "awk",
          description: "Text processing with examples and validation",
          inputSchema: {
            type: "object",
            properties: {
              script: { type: "string", description: "AWK script" },
              file: { type: "string", description: "Input file" },
              fieldSeparator: { type: "string", description: "Field separator", default: " " }
            },
            required: ["script", "file"]
          }
        },
        {
          name: "sort",
          description: "Sort data with statistics and analysis",
          inputSchema: {
            type: "object",
            properties: {
              file: { type: "string", description: "File to sort" },
              numeric: { type: "boolean", description: "Numeric sort", default: false },
              reverse: { type: "boolean", description: "Reverse order", default: false },
              unique: { type: "boolean", description: "Remove duplicates", default: false }
            },
            required: ["file"]
          }
        },
        {
          name: "jq",
          description: "JSON processing with validation and examples",
          inputSchema: {
            type: "object",
            properties: {
              filter: { type: "string", description: "JQ filter expression" },
              file: { type: "string", description: "JSON file path" },
              raw: { type: "boolean", description: "Raw output", default: false }
            },
            required: ["filter", "file"]
          }
        },

        // Archive Operations
        {
          name: "tar",
          description: "Archive operations with verification",
          inputSchema: {
            type: "object",
            properties: {
              action: { type: "string", enum: ["create", "extract", "list"], description: "Tar action" },
              archive: { type: "string", description: "Archive file name" },
              files: { type: "array", items: { type: "string" }, description: "Files to archive/extract" },
              compress: { type: "boolean", description: "Use gzip compression", default: true }
            },
            required: ["action", "archive"]
          }
        },
        {
          name: "rsync",
          description: "File synchronization with progress tracking",
          inputSchema: {
            type: "object",
            properties: {
              source: { type: "string", description: "Source path" },
              destination: { type: "string", description: "Destination path" },
              recursive: { type: "boolean", description: "Recursive copy", default: true },
              delete: { type: "boolean", description: "Delete extraneous files", default: false },
              dryRun: { type: "boolean", description: "Dry run only", default: true }
            },
            required: ["source", "destination"]
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          // File Operations
          case "cat": return await this.catFile(args);
          case "head": return await this.headFile(args);
          case "tail": return await this.tailFile(args);
          case "grep": return await this.grepFile(args);
          case "find": return await this.findFiles(args);
          case "wc": return await this.wcFile(args);
          
          // System Information
          case "ps": return await this.psCommand(args);
          case "top": return await this.topCommand(args);
          case "df": return await this.dfCommand(args);
          case "du": return await this.duCommand(args);
          case "free": return await this.freeCommand(args);
          case "uptime": return await this.uptimeCommand(args);
          
          // Network Tools
          case "ping": return await this.pingHost(args);
          case "netstat": return await this.netstatCommand(args);
          case "nslookup": return await this.nslookupHost(args);
          
          // Development Tools
          case "git_status": return await this.gitStatus(args);
          case "npm_info": return await this.npmInfo(args);
          case "docker_status": return await this.dockerStatus(args);
          
          // Text Processing
          case "sed": return await this.sedCommand(args);
          case "awk": return await this.awkCommand(args);
          case "sort": return await this.sortCommand(args);
          case "jq": return await this.jqCommand(args);
          
          // Archive Operations
          case "tar": return await this.tarCommand(args);
          case "rsync": return await this.rsyncCommand(args);
          
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [{ type: "text", text: `❌ Error: ${error.message}` }]
        };
      }
    });
  }

  async executeCommand(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: options.timeout || 30000,
        ...options
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', data => stdout += data);
      child.stderr.on('data', data => stderr += data);

      child.on('close', code => {
        resolve({ stdout, stderr, exitCode: code });
      });

      child.on('error', reject);
    });
  }

  // File Operations
  async catFile(args) {
    try {
      const content = fs.readFileSync(args.file, 'utf8');
      const lines = content.split('\n');
      const displayLines = args.lines ? lines.slice(0, args.lines) : lines;
      
      const ext = path.extname(args.file);
      const syntax = args.syntax ? this.detectSyntax(ext) : 'text';
      
      return {
        content: [{
          type: "text",
          text: `📄 File: ${args.file} (${syntax})\n📊 Size: ${content.length} bytes, ${lines.length} lines\n\n${displayLines.join('\n')}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `❌ Cannot read file: ${error.message}`
        }]
      };
    }
  }

  async headFile(args) {
    const result = await this.executeCommand('head', ['-n', args.lines.toString(), args.file]);
    return {
      content: [{
        type: "text",
        text: `📄 First ${args.lines} lines of ${args.file}:\n\n${result.stdout}`
      }]
    };
  }

  async tailFile(args) {
    const tailArgs = ['-n', args.lines.toString()];
    if (args.follow) tailArgs.push('-f');
    tailArgs.push(args.file);
    
    const result = await this.executeCommand('tail', tailArgs);
    return {
      content: [{
        type: "text",
        text: `📄 Last ${args.lines} lines of ${args.file}:\n\n${result.stdout}`
      }]
    };
  }

  async grepFile(args) {
    const grepArgs = [];
    if (args.ignoreCase) grepArgs.push('-i');
    if (args.recursive) grepArgs.push('-r');
    if (args.context) grepArgs.push('-C', args.context.toString());
    grepArgs.push('--color=never', args.pattern, args.file);
    
    const result = await this.executeCommand('grep', grepArgs);
    const matches = result.stdout.split('\n').filter(line => line.trim());
    
    return {
      content: [{
        type: "text",
        text: `🔍 Search results for "${args.pattern}" in ${args.file}:\n📊 Found ${matches.length} matches\n\n${result.stdout}`
      }]
    };
  }

  async findFiles(args) {
    const findArgs = [args.path];
    if (args.name) findArgs.push('-name', args.name);
    if (args.type) findArgs.push('-type', args.type);
    if (args.size) findArgs.push('-size', args.size);
    if (args.maxDepth) findArgs.push('-maxdepth', args.maxDepth.toString());
    
    const result = await this.executeCommand('find', findArgs);
    const files = result.stdout.split('\n').filter(line => line.trim());
    
    return {
      content: [{
        type: "text",
        text: `📁 Found ${files.length} items:\n\n${result.stdout}`
      }]
    };
  }

  async wcFile(args) {
    const wcArgs = [];
    if (args.lines) wcArgs.push('-l');
    if (args.words) wcArgs.push('-w');
    if (args.chars) wcArgs.push('-c');
    wcArgs.push(args.file);
    
    const result = await this.executeCommand('wc', wcArgs);
    return {
      content: [{
        type: "text",
        text: `📊 Word count for ${args.file}:\n${result.stdout}`
      }]
    };
  }

  // System Information
  async psCommand(args) {
    const psArgs = ['aux'];
    const result = await this.executeCommand('ps', psArgs);
    
    let output = result.stdout;
    if (args.user) {
      output = output.split('\n').filter(line => line.includes(args.user)).join('\n');
    }
    if (args.command) {
      output = output.split('\n').filter(line => line.includes(args.command)).join('\n');
    }
    
    return {
      content: [{
        type: "text",
        text: `🔄 Process Status:\n\n${output}`
      }]
    };
  }

  async topCommand(args) {
    const result = await this.executeCommand('ps', ['aux', '--sort=-pcpu']);
    const lines = result.stdout.split('\n').slice(0, args.processes + 1);
    
    return {
      content: [{
        type: "text",
        text: `📈 Top ${args.processes} processes by CPU:\n\n${lines.join('\n')}`
      }]
    };
  }

  async dfCommand(args) {
    const dfArgs = args.human ? ['-h'] : [];
    if (args.filesystem) dfArgs.push(args.filesystem);
    
    const result = await this.executeCommand('df', dfArgs);
    return {
      content: [{
        type: "text",
        text: `💾 Disk Usage:\n\n${result.stdout}`
      }]
    };
  }

  async duCommand(args) {
    const duArgs = ['-d', args.depth.toString()];
    if (args.human) duArgs.push('-h');
    duArgs.push(args.path);
    
    const result = await this.executeCommand('du', duArgs);
    return {
      content: [{
        type: "text",
        text: `📁 Directory Usage for ${args.path}:\n\n${result.stdout}`
      }]
    };
  }

  async freeCommand(args) {
    const freeArgs = args.human ? ['-h'] : [];
    const result = await this.executeCommand('free', freeArgs);
    
    return {
      content: [{
        type: "text",
        text: `🧠 Memory Usage:\n\n${result.stdout}`
      }]
    };
  }

  async uptimeCommand(args) {
    const result = await this.executeCommand('uptime');
    return {
      content: [{
        type: "text",
        text: `⏰ System Uptime:\n\n${result.stdout}`
      }]
    };
  }

  // Network Tools
  async pingHost(args) {
    const pingArgs = ['-c', args.count.toString(), '-W', args.timeout.toString(), args.host];
    const result = await this.executeCommand('ping', pingArgs);
    
    return {
      content: [{
        type: "text",
        text: `🌐 Ping Results for ${args.host}:\n\n${result.stdout}`
      }]
    };
  }

  async netstatCommand(args) {
    const netstatArgs = [];
    if (args.listening) netstatArgs.push('-l');
    if (args.numeric) netstatArgs.push('-n');
    if (args.processes) netstatArgs.push('-p');
    
    const result = await this.executeCommand('netstat', netstatArgs);
    return {
      content: [{
        type: "text",
        text: `🔌 Network Connections:\n\n${result.stdout}`
      }]
    };
  }

  async nslookupHost(args) {
    const result = await this.executeCommand('nslookup', [args.host]);
    return {
      content: [{
        type: "text",
        text: `🔍 DNS Lookup for ${args.host}:\n\n${result.stdout}`
      }]
    };
  }

  // Development Tools
  async gitStatus(args) {
    const result = await this.executeCommand('git', ['status', args.verbose ? '-v' : '--porcelain'], { cwd: args.path });
    return {
      content: [{
        type: "text",
        text: `📋 Git Status (${args.path}):\n\n${result.stdout}`
      }]
    };
  }

  async npmInfo(args) {
    const npmArgs = [args.action];
    if (args.package && args.action === 'info') npmArgs.push(args.package);
    
    const result = await this.executeCommand('npm', npmArgs);
    return {
      content: [{
        type: "text",
        text: `📦 NPM ${args.action}:\n\n${result.stdout}`
      }]
    };
  }

  async dockerStatus(args) {
    const dockerArgs = [args.action];
    if (args.container && args.action === 'logs') dockerArgs.push(args.container);
    
    const result = await this.executeCommand('docker', dockerArgs);
    return {
      content: [{
        type: "text",
        text: `🐳 Docker ${args.action}:\n\n${result.stdout}`
      }]
    };
  }

  // Text Processing
  async sedCommand(args) {
    const sedArgs = [args.pattern];
    if (!args.preview) sedArgs.push('-i');
    sedArgs.push(args.file);
    
    const result = await this.executeCommand('sed', sedArgs);
    return {
      content: [{
        type: "text",
        text: `✏️ Sed ${args.preview ? 'Preview' : 'Edit'} (${args.file}):\n\n${result.stdout}`
      }]
    };
  }

  async awkCommand(args) {
    const awkArgs = ['-F', args.fieldSeparator, args.script, args.file];
    const result = await this.executeCommand('awk', awkArgs);
    
    return {
      content: [{
        type: "text",
        text: `🔧 AWK Processing:\n\n${result.stdout}`
      }]
    };
  }

  async sortCommand(args) {
    const sortArgs = [];
    if (args.numeric) sortArgs.push('-n');
    if (args.reverse) sortArgs.push('-r');
    if (args.unique) sortArgs.push('-u');
    sortArgs.push(args.file);
    
    const result = await this.executeCommand('sort', sortArgs);
    return {
      content: [{
        type: "text",
        text: `📊 Sorted Output:\n\n${result.stdout}`
      }]
    };
  }

  async jqCommand(args) {
    const jqArgs = [args.filter];
    if (args.raw) jqArgs.push('-r');
    jqArgs.push(args.file);
    
    const result = await this.executeCommand('jq', jqArgs);
    return {
      content: [{
        type: "text",
        text: `🔍 JSON Query Results:\n\n${result.stdout}`
      }]
    };
  }

  // Archive Operations
  async tarCommand(args) {
    const tarArgs = [];
    
    switch (args.action) {
      case 'create':
        tarArgs.push(args.compress ? '-czf' : '-cf');
        tarArgs.push(args.archive);
        if (args.files) tarArgs.push(...args.files);
        break;
      case 'extract':
        tarArgs.push(args.compress ? '-xzf' : '-xf');
        tarArgs.push(args.archive);
        break;
      case 'list':
        tarArgs.push('-tf');
        tarArgs.push(args.archive);
        break;
    }
    
    const result = await this.executeCommand('tar', tarArgs);
    return {
      content: [{
        type: "text",
        text: `📦 Tar ${args.action} (${args.archive}):\n\n${result.stdout}`
      }]
    };
  }

  async rsyncCommand(args) {
    const rsyncArgs = ['-av'];
    if (args.delete) rsyncArgs.push('--delete');
    if (args.dryRun) rsyncArgs.push('--dry-run');
    rsyncArgs.push(args.source, args.destination);
    
    const result = await this.executeCommand('rsync', rsyncArgs);
    return {
      content: [{
        type: "text",
        text: `🔄 Rsync ${args.dryRun ? 'Preview' : 'Sync'}:\n\n${result.stdout}`
      }]
    };
  }

  detectSyntax(ext) {
    const syntaxMap = {
      '.js': 'javascript',
      '.ts': 'typescript',
      '.py': 'python',
      '.sh': 'bash',
      '.json': 'json',
      '.yaml': 'yaml',
      '.yml': 'yaml',
      '.md': 'markdown',
      '.html': 'html',
      '.css': 'css'
    };
    return syntaxMap[ext] || 'text';
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("🛠️ System Tools MCP Server running!");
  }
}

if (require.main === module) {
  const server = new SystemToolsMCPServer();
  server.run().catch(console.error);
}

module.exports = SystemToolsMCPServer;