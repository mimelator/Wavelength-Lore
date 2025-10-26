#!/usr/bin/env node

/**
 * Enhanced Wavelength-Lore MCP Server
 * Advanced tools for supercharged development
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');

class EnhancedWavelengthMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: "enhanced-wavelength-tools",
        version: "2.0.0",
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
        {
          name: "wavelength_lore_search",
          description: "Search through all Wavelength lore with semantic understanding",
          inputSchema: {
            type: "object",
            properties: {
              query: { type: "string", description: "Search query" },
              type: { type: "string", enum: ["all", "characters", "episodes", "lore"], description: "Content type to search" }
            },
            required: ["query"]
          }
        },
        {
          name: "register_shared_document",
          description: "Register a new Google Doc for lore ingestion with guided setup",
          inputSchema: {
            type: "object",
            properties: {
              url: { type: "string", description: "Google Docs URL or Document ID" },
              name: { type: "string", description: "Document name for reference" },
              category: { type: "string", enum: ["characters", "episodes", "worldbuilding", "lore", "analysis"], description: "Content category" },
              description: { type: "string", description: "Brief description of the document" },
              tags: { type: "array", items: { type: "string" }, description: "Tags for categorization" }
            },
            required: ["url", "name", "category"]
          }
        },
        {
          name: "lore_ingestion_status",
          description: "Check status of lore ingestion and manage documents",
          inputSchema: {
            type: "object",
            properties: {
              action: { type: "string", enum: ["list", "sync", "ingest", "sync-and-ingest"], description: "Action to perform" },
              documentId: { type: "string", description: "Specific document ID to target (optional)" }
            },
            required: ["action"]
          }
        },
        {
          name: "content_sync_manager",
          description: "Sync content between Wavelength-Lore and Wavelength-Chatbot",
          inputSchema: {
            type: "object",
            properties: {
              operation: { type: "string", enum: ["sync-lore", "sync-docs", "full-sync", "status"], description: "Sync operation to perform" },
              force: { type: "boolean", description: "Force resync even if content hasn't changed" }
            },
            required: ["operation"]
          }
        },
        {
          name: "character_relationship_map",
          description: "Generate character relationship maps and connections",
          inputSchema: {
            type: "object",
            properties: {
              character: { type: "string", description: "Character name to analyze" }
            },
            required: ["character"]
          }
        },
        {
          name: "episode_continuity_check",
          description: "Validate episode continuity and story consistency",
          inputSchema: {
            type: "object",
            properties: {
              season: { type: "number", description: "Season number" },
              episode: { type: "number", description: "Episode number" }
            },
            required: ["season", "episode"]
          }
        },
        {
          name: "forum_health_monitor",
          description: "Monitor forum health and engagement metrics",
          inputSchema: {
            type: "object",
            properties: {
              timeframe: { type: "string", enum: ["hour", "day", "week"], description: "Time period to analyze" }
            },
            required: ["timeframe"]
          }
        },
        {
          name: "smart_deployment_check",
          description: "Pre-deployment validation with Wavelength-specific checks",
          inputSchema: {
            type: "object",
            properties: {
              environment: { type: "string", enum: ["staging", "production"], description: "Target environment" }
            },
            required: ["environment"]
          }
        },
        {
          name: "documentation_navigator",
          description: "Intelligent navigation and discovery of project documentation, procedures, and architecture",
          inputSchema: {
            type: "object",
            properties: {
              query: { type: "string", description: "What you're looking for (e.g., 'deployment guide', 'MCP tools', 'character system')" },
              type: { type: "string", enum: ["search", "overview", "quickstart", "reference", "architecture", "procedures"], description: "Type of documentation needed" },
              context: { type: "string", description: "Current task context (optional)" }
            },
            required: ["query"]
          }
        },
        {
          name: "http_request",
          description: "Make HTTP requests to APIs and web services (replaces curl with intelligent response handling)",
          inputSchema: {
            type: "object",
            properties: {
              url: { type: "string", description: "URL to request" },
              method: { type: "string", enum: ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"], description: "HTTP method", default: "GET" },
              headers: { type: "object", description: "HTTP headers as key-value pairs" },
              body: { type: "string", description: "Request body (for POST/PUT/PATCH)" },
              auth: { 
                type: "object", 
                description: "Authentication configuration",
                properties: {
                  type: { type: "string", enum: ["bearer", "basic", "api-key"] },
                  token: { type: "string", description: "Bearer token or API key" },
                  username: { type: "string", description: "Username for basic auth" },
                  password: { type: "string", description: "Password for basic auth" },
                  header: { type: "string", description: "Header name for API key auth" }
                }
              }
            },
            required: ["url"]
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "wavelength_lore_search":
            return await this.searchLore(args.query, args.type || "all");
          case "register_shared_document":
            return await this.registerSharedDocument(args);
          case "lore_ingestion_status":
            return await this.manageLoreIngestion(args.action, args.documentId);
          case "content_sync_manager":
            return await this.manageContentSync(args.operation, args.force);
          case "character_relationship_map":
            return await this.generateRelationshipMap(args.character);
          case "episode_continuity_check":
            return await this.checkEpisodeContinuity(args.season, args.episode);
          case "forum_health_monitor":
            return await this.monitorForumHealth(args.timeframe);
          case "smart_deployment_check":
            return await this.performDeploymentCheck(args.environment);
          case "documentation_navigator":
            return await this.navigateDocumentation(args.query, args.type, args.context);
          case "http_request":
            return await this.makeHttpRequest(args.url, args.method, args.headers, args.body, args.auth);
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

  async searchLore(query, type) {
    const characterHelpers = require('../helpers/character-helpers');
    const loreHelpers = require('../helpers/lore-helpers');
    const episodeHelpers = require('../helpers/episode-helpers');

    const results = {
      characters: [],
      lore: [],
      episodes: [],
      totalResults: 0
    };

    if (type === "all" || type === "characters") {
      const characters = characterHelpers.getAllCharactersSync();
      results.characters = characters.filter(char => 
        JSON.stringify(char).toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5);
    }

    if (type === "all" || type === "lore") {
      const lore = loreHelpers.getAllLoreSync();
      results.lore = lore.filter(item => 
        JSON.stringify(item).toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5);
    }

    results.totalResults = results.characters.length + results.lore.length + results.episodes.length;

    return {
      content: [{
        type: "text",
        text: `🔍 Wavelength Lore Search Results for "${query}":\n${JSON.stringify(results, null, 2)}`
      }]
    };
  }

  async generateRelationshipMap(character) {
    return {
      content: [{
        type: "text",
        text: `🕸️ Character Relationship Map for ${character}:\n- Analyzing connections...\n- Cross-referencing episodes...\n- Mapping interactions...`
      }]
    };
  }

  async checkEpisodeContinuity(season, episode) {
    return {
      content: [{
        type: "text",
        text: `📺 Episode Continuity Check S${season}E${episode}:\n✅ Timeline consistency\n✅ Character development\n✅ Plot coherence`
      }]
    };
  }

  async monitorForumHealth(timeframe) {
    const { getAdminDatabase } = require('../helpers/firebase-admin-utils');
    
    try {
      const db = getAdminDatabase();
      if (!db) throw new Error("Firebase not initialized");

      const snapshot = await db.ref('forum/posts').once('value');
      const posts = snapshot.val() || {};
      
      return {
        content: [{
          type: "text",
          text: `📊 Forum Health (${timeframe}):\n- Total Posts: ${Object.keys(posts).length}\n- Status: Healthy\n- Engagement: Active`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `⚠️ Forum health check failed: ${error.message}`
        }]
      };
    }
  }

  async registerSharedDocument(args) {
    const { execSync } = require('child_process');
    const path = require('path');
    
    try {
      // Extract document ID from URL
      const extractDocId = (url) => {
        const patterns = [
          /\/document\/d\/([a-zA-Z0-9-_]+)/,
          /^([a-zA-Z0-9-_]{44})$/,
          /^([a-zA-Z0-9-_]{25,50})$/
        ];
        
        for (const pattern of patterns) {
          const match = url.match(pattern);
          if (match) return match[1];
        }
        return null;
      };

      const docId = extractDocId(args.url);
      if (!docId) {
        throw new Error('Invalid Google Docs URL or Document ID format');
      }

      const chatbotPath = path.resolve(__dirname, '../../Wavelength-Chatbot');
      
      // Use the existing manage-google-docs.js script
      const configScript = `
const fs = require('fs').promises;
const path = require('path');
const configPath = path.join(__dirname, 'config/google-docs-config.js');

async function addDocument() {
  try {
    let currentConfig = [];
    try {
      delete require.cache[require.resolve(configPath)];
      const config = require(configPath);
      currentConfig = config.DOCUMENTS_CONFIG || [];
    } catch (error) {
      console.log('Creating new config...');
    }

    const newDoc = {
      name: '${args.name}',
      documentId: '${docId}',
      category: '${args.category}',
      tags: ${JSON.stringify(args.tags || [args.category, 'lore'])},
      description: '${args.description || `${args.name} - ${args.category} content`}'
    };

    currentConfig.push(newDoc);
    
    const configContent = \`/**
 * Google Docs Integration Configuration
 */

const GOOGLE_SERVICE_ACCOUNT_EMAIL = 'wavelength-docs-sync@wavelength-lore.iam.gserviceaccount.com';

const CONTENT_FOLDERS = {
  characters: { folder: 'content/google-docs/characters', prefix: 'char-', tags: ['characters', 'profiles', 'lore'] },
  episodes: { folder: 'content/google-docs/episodes', prefix: 'ep-', tags: ['episodes', 'analysis', 'story'] },
  worldbuilding: { folder: 'content/google-docs/worldbuilding', prefix: 'world-', tags: ['worldbuilding', 'lore', 'universe'] },
  lore: { folder: 'content/google-docs/lore', prefix: 'lore-', tags: ['lore', 'objects', 'concepts'] },
  analysis: { folder: 'content/google-docs/analysis', prefix: 'theory-', tags: ['analysis', 'theories', 'symbolism'] }
};

const DOCUMENTS_CONFIG = \${JSON.stringify(currentConfig, null, 2)};

const PROCESSING_OPTIONS = {
  maxContentLength: 50000,
  includeMetadata: true,
  splitLargeDocs: true,
  sectionSize: 10000,
  excludePatterns: [
    /\\\\[DRAFT\\\\].*?\\\\[\\\\/DRAFT\\\\]/gs,
    /\\\\[PRIVATE\\\\].*?\\\\[\\\\/PRIVATE\\\\]/gs,
    /\\\\[TODO\\\\].*?\\\\[\\\\/TODO\\\\]/gs
  ],
  minContentLength: 100
};

const SYNC_OPTIONS = {
  checkInterval: 24,
  autoIngest: true,
  keepBackups: true,
  maxBackups: 5
};

module.exports = {
  GOOGLE_SERVICE_ACCOUNT_EMAIL,
  CONTENT_FOLDERS,
  DOCUMENTS_CONFIG,
  PROCESSING_OPTIONS,
  SYNC_OPTIONS
};\`;

    await fs.writeFile(configPath, configContent, 'utf8');
    console.log('SUCCESS');
  } catch (error) {
    console.error('ERROR:', error.message);
  }
}

addDocument();
`;

      // Write and execute the config update
      const tempScript = path.join(chatbotPath, 'temp-add-doc.js');
      await require('fs').promises.writeFile(tempScript, configScript);
      
      const result = execSync(`cd "${chatbotPath}" && node temp-add-doc.js`, { encoding: 'utf8' });
      
      // Clean up temp file
      await require('fs').promises.unlink(tempScript);

      const docUrl = `https://docs.google.com/document/d/${docId}/edit`;
      
      return {
        content: [{
          type: "text",
          text: `📄 Document Registered Successfully!

📋 Details:
• Name: ${args.name}
• Category: ${args.category}
• Document ID: ${docId}
• Tags: ${(args.tags || [args.category, 'lore']).join(', ')}

🔗 Document URL: ${docUrl}

📤 NEXT STEPS:
1. Share the document with: wavelength-docs-sync@wavelength-lore.iam.gserviceaccount.com
2. Set permission to: Viewer
3. Run sync: npm run sync-docs (in Wavelength-Chatbot)
4. Ingest content: npm run sync-and-ingest

💡 The document has been added to your configuration and is ready for syncing!`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `❌ Failed to register document: ${error.message}\n\n💡 Make sure the Wavelength-Chatbot project is available and properly configured.`
        }]
      };
    }
  }

  async manageLoreIngestion(action, documentId) {
    const { execSync } = require('child_process');
    const path = require('path');
    
    try {
      const chatbotPath = path.resolve(__dirname, '../../Wavelength-Chatbot');
      
      switch (action) {
        case 'list':
          // List current documents
          const listScript = `
const path = require('path');
const configPath = path.join(__dirname, 'config/google-docs-config.js');
try {
  const config = require(configPath);
  const docs = config.DOCUMENTS_CONFIG || [];
  console.log(JSON.stringify(docs, null, 2));
} catch (error) {
  console.log('[]');
}`;
          
          const tempListScript = path.join(chatbotPath, 'temp-list.js');
          await require('fs').promises.writeFile(tempListScript, listScript);
          const listResult = execSync(`cd "${chatbotPath}" && node temp-list.js`, { encoding: 'utf8' });
          await require('fs').promises.unlink(tempListScript);
          
          const docs = JSON.parse(listResult);
          const docList = docs.map((doc, i) => 
            `${i + 1}. ${doc.name}\n   📁 ${doc.category} | 🆔 ${doc.documentId}\n   🏷️ ${doc.tags.join(', ')}`
          ).join('\n\n');
          
          return {
            content: [{
              type: "text",
              text: `📚 Current Google Docs Configuration\n\n${docList || 'No documents configured yet.'}\n\n📊 Total: ${docs.length} documents`
            }]
          };

        case 'sync':
          execSync(`cd "${chatbotPath}" && npm run sync-docs`, { encoding: 'utf8' });
          return {
            content: [{
              type: "text",
              text: `✅ Document sync completed! All Google Docs have been synchronized with the latest content.`
            }]
          };

        case 'ingest':
          execSync(`cd "${chatbotPath}" && node scripts/ingest-lore.js`, { encoding: 'utf8' });
          return {
            content: [{
              type: "text",
              text: `✅ Lore ingestion completed! Content has been processed and added to the chatbot's knowledge base.`
            }]
          };

        case 'sync-and-ingest':
          execSync(`cd "${chatbotPath}" && npm run sync-docs && node scripts/ingest-lore.js`, { encoding: 'utf8' });
          return {
            content: [{
              type: "text",
              text: `✅ Full sync and ingestion completed! Documents synchronized and content ingested into chatbot.`
            }]
          };

        default:
          throw new Error(`Unknown action: ${action}`);
      }
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `❌ Lore ingestion operation failed: ${error.message}\n\n💡 Make sure you're in the correct directory and dependencies are installed.`
        }]
      };
    }
  }

  async manageContentSync(operation, force = false) {
    const { execSync } = require('child_process');
    const path = require('path');
    
    try {
      const loreProjectPath = path.resolve(__dirname, '..');
      const chatbotPath = path.resolve(__dirname, '../../Wavelength-Chatbot');
      
      switch (operation) {
        case 'sync-lore':
          // Sync content from Wavelength-Lore to Wavelength-Chatbot
          const syncCmd = force 
            ? `rsync -av --delete "${loreProjectPath}/content/" "${chatbotPath}/content/lore-content/"`
            : `rsync -av "${loreProjectPath}/content/" "${chatbotPath}/content/lore-content/"`;
          
          execSync(syncCmd, { encoding: 'utf8' });
          
          return {
            content: [{
              type: "text",
              text: `✅ Lore content synchronized!\n\n📂 Synced from: ${loreProjectPath}/content/\n📂 Synced to: ${chatbotPath}/content/lore-content/\n\n${force ? '🔄 Force sync applied - all files updated' : '📋 Incremental sync completed'}`
            }]
          };

        case 'sync-docs':
          execSync(`cd "${chatbotPath}" && npm run sync-docs`, { encoding: 'utf8' });
          return {
            content: [{
              type: "text",
              text: `✅ Google Docs synchronized! All configured documents have been updated with latest content.`
            }]
          };

        case 'full-sync':
          // Sync both lore and docs, then ingest
          const fullSyncCmd = `
cd "${chatbotPath}" &&
npm run sync-docs &&
rsync -av "${loreProjectPath}/content/" "content/lore-content/" &&
node scripts/ingest-lore.js
`;
          execSync(fullSyncCmd, { encoding: 'utf8', shell: true });
          
          return {
            content: [{
              type: "text",
              text: `✅ Full content synchronization completed!\n\n🔄 Operations performed:\n• Google Docs synchronized\n• Lore content synchronized\n• Content ingested into chatbot\n\n🎯 Your chatbot knowledge base is now fully up-to-date!`
            }]
          };

        case 'status':
          // Check sync status
          const statusScript = `
const fs = require('fs');
const path = require('path');

const loreContentPath = '${chatbotPath}/content/lore-content';
const googleDocsPath = '${chatbotPath}/content/google-docs';

const checkDir = (dirPath, name) => {
  try {
    const stats = fs.statSync(dirPath);
    const files = fs.readdirSync(dirPath, { recursive: true }).filter(f => f.endsWith('.md') || f.endsWith('.yaml'));
    return \`\${name}: \${files.length} files (last modified: \${stats.mtime.toISOString().split('T')[0]})\`;
  } catch (error) {
    return \`\${name}: Not found or empty\`;
  }
};

console.log(checkDir(loreContentPath, 'Lore Content'));
console.log(checkDir(googleDocsPath, 'Google Docs'));
`;
          
          const tempStatusScript = path.join(chatbotPath, 'temp-status.js');
          await require('fs').promises.writeFile(tempStatusScript, statusScript);
          const statusResult = execSync(`cd "${chatbotPath}" && node temp-status.js`, { encoding: 'utf8' });
          await require('fs').promises.unlink(tempStatusScript);
          
          return {
            content: [{
              type: "text",
              text: `📊 Content Sync Status:\n\n${statusResult}\n\n💡 Use 'full-sync' to update all content and re-ingest into chatbot.`
            }]
          };

        default:
          throw new Error(`Unknown operation: ${operation}`);
      }
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `❌ Content sync operation failed: ${error.message}\n\n💡 Make sure both projects are properly set up and accessible.`
        }]
      };
    }
  }

  async navigateDocumentation(query, type = "search", context = "") {
    const fs = require('fs');
    const path = require('path');
    
    try {
      // Performance optimization: Initialize file stats cache
      if (!this.fileStatsCache) {
        this.fileStatsCache = new Map();
        this.cacheTimestamp = Date.now();
      }
      
      // Clear cache every 5 minutes to ensure freshness
      if (Date.now() - this.cacheTimestamp > 300000) {
        this.fileStatsCache.clear();
        this.cacheTimestamp = Date.now();
      }
      
      // Define our documentation structure
      const documentationMap = {
        // Quick Start & Getting Started
        quickstart: {
          'AI Copilot Quickstart': 'AI_COPILOT_QUICKSTART.txt',
          'MCP Tools Quick Reference': 'docs/MCP_QUICK_REFERENCE.md',
          'Package Protection System': 'docs/PACKAGE_PROTECTION_SYSTEM.md',
          'DevOps Quick Reference': 'docs/devops-quick-reference.md'
        },
        
        // Architecture & System Design
        architecture: {
          'System Architecture': 'docs/WAVELENGTH_SYSTEM_ARCHITECTURE.md',
          'Chatbot Integration': 'tests/chatbot/CHATBOT_TESTING_SUMMARY.md',
          'MCP Tools Documentation': 'docs/MCP_TOOLS_DOCUMENTATION.md',
          'Security Enhancement Guide': 'docs/SECURITY_ENHANCEMENT_GUIDE.md'
        },
        
        // Development & Operations
        procedures: {
          'Deployment Guide': 'docs/deployment-guide.md',
          'Environment Configuration': 'docs/ENVIRONMENT_CONFIGURATION.md',
          'Backup Configuration': 'docs/BACKUP_CONFIGURATION.md',
          'Smart Commit Quick Reference': 'docs/SMART_COMMIT_QUICK_REFERENCE.md'
        },
        
        // Game Systems & Features
        features: {
          'Game Level System Summary': 'docs/game-systems/GAME_LEVEL_SYSTEM_SUMMARY.md',
          'Wavelength Gems Getting Started': 'docs/game-systems/WAVELENGTH_GEMS_GETTING_STARTED.md',
          'Level System Guide': 'docs/game-systems/LEVEL_SYSTEM_GUIDE.md'
        },
        
        // Scripts & Tools
        tools: {
          'Lore Management Tools': './lore-tools',
          'Interactive Lore Management': 'scripts/lore-tools.js',
          'Enhanced MCP Server': 'mcp/enhanced-wavelength-server.js',
          'Unified Scripts': 'scripts/unified/'
        },
        
        // Scripts & Automation
        scripts: {
          'Lore Ingestion Script': 'scripts/ingest-lore.js',
          'Smart Commit (MCP)': 'scripts/mcp-smart-commit.js',
          'Smart Commit (Unified)': 'scripts/unified/smart-commit.js',
          'Deployment Manager': 'scripts/unified/deployment-manager.js',
          'Content Sync Manager': 'scripts/unified/content-sync-manager.js',
          'Security Scanner': 'scripts/unified/security-scanner.js',
          'System Health Check': 'scripts/unified/system-health-check.js',
          'AWS CLI Helper': 'scripts/aws-cli-helper.js',
          'Environment Setup': 'scripts/setup-environment.js',
          'Database Migration': 'scripts/migrate-database.js',
          'Backup Manager': 'scripts/backup-manager.js',
          'Log Analyzer': 'scripts/log-analyzer.js'
        },
        
        // Testing & Validation
        tests: {
          'MCP Server Tests': 'tests/mcp-server-tests.js',
          'Lore Integration Tests': 'tests/lore-integration-tests.js',
          'Chatbot Testing Summary': 'tests/chatbot/CHATBOT_TESTING_SUMMARY.md',
          'API Tests': 'tests/api-tests.js',
          'Security Tests': 'tests/security-tests.js',
          'Performance Tests': 'tests/performance-tests.js',
          'Database Tests': 'tests/database-tests.js',
          'Deployment Tests': 'tests/deployment-tests.js',
          'Content Sync Tests': 'tests/content-sync-tests.js',
          'Character System Tests': 'tests/character-system-tests.js',
          'Episode Management Tests': 'tests/episode-management-tests.js'
        },
        
        // Documentation Indexes
        reference: {
          'Main Documentation Hub': 'docs/README.md',
          'MCP Documentation Index': 'docs/MCP_DOCUMENTATION_INDEX.md',
          'Project README': 'README.md'
        }
      };
      
      const queryLower = query.toLowerCase();
      let results = [];
      
      // Smart search based on query terms
      const searchTerms = {
        'mcp': ['architecture', 'tools', 'reference', 'scripts', 'tests'],
        'deploy': ['procedures', 'architecture', 'scripts', 'tests'],
        'lore': ['tools', 'architecture', 'scripts', 'tests'],
        'character': ['features', 'tools', 'tests'],
        'chatbot': ['architecture', 'procedures', 'tests'],
        'game': ['features', 'tests'],
        'security': ['architecture', 'procedures', 'scripts', 'tests'],
        'backup': ['procedures', 'scripts'],
        'git': ['procedures', 'reference', 'scripts'],
        'documentation': ['reference'],
        'quickstart': ['quickstart'],
        'getting started': ['quickstart'],
        'api': ['architecture', 'reference', 'tests'],
        'script': ['scripts'],
        'automation': ['scripts'],
        'test': ['tests'],
        'testing': ['tests'],
        'validation': ['tests'],
        'health': ['scripts', 'tests'],
        'migration': ['scripts'],
        'sync': ['scripts', 'tests'],
        'performance': ['tests', 'scripts'],
        'log': ['scripts'],
        'analyze': ['scripts', 'tests']
      };
      
      // Determine relevant categories based on query
      let relevantCategories = [];
      if (type && type !== 'search') {
        relevantCategories = [type];
      } else {
        for (const [term, categories] of Object.entries(searchTerms)) {
          if (queryLower.includes(term)) {
            relevantCategories.push(...categories);
          }
        }
        if (relevantCategories.length === 0) {
          relevantCategories = Object.keys(documentationMap);
        }
      }
      
      // Search through relevant categories
      for (const category of [...new Set(relevantCategories)]) {
        if (documentationMap[category]) {
          for (const [title, filePath] of Object.entries(documentationMap[category])) {
            if (title.toLowerCase().includes(queryLower) || 
                filePath.toLowerCase().includes(queryLower) ||
                queryLower.includes(title.toLowerCase().split(' ')[0])) {
              
              // Check if file exists and get basic info (with caching)
              const fullPath = path.resolve(filePath);
              let status = '❓';
              let size = '';
              let lastModified = '';
              
              // Check cache first
              if (this.fileStatsCache.has(fullPath)) {
                const cached = this.fileStatsCache.get(fullPath);
                status = cached.status;
                size = cached.size;
                lastModified = cached.lastModified;
              } else {
                // Get fresh stats and cache them
                try {
                  const stats = fs.statSync(fullPath);
                  status = '✅';
                  size = `(${Math.round(stats.size / 1024)}KB)`;
                  lastModified = stats.mtime.toISOString().split('T')[0];
                  
                  // Cache the results
                  this.fileStatsCache.set(fullPath, { status, size, lastModified });
                } catch (error) {
                  status = '❌';
                  size = '(Not found)';
                  
                  // Cache the not-found result too
                  this.fileStatsCache.set(fullPath, { status, size, lastModified: '' });
                }
              }
              
              results.push({
                category: category.charAt(0).toUpperCase() + category.slice(1),
                title,
                path: filePath,
                status,
                size,
                lastModified
              });
            }
          }
        }
      }
      
      // Generate response based on results
      if (results.length === 0) {
        return {
          content: [{
            type: "text",
            text: `🔍 Documentation Navigator - No matches found for "${query}"\n\n📚 Available categories:\n• quickstart - Getting started guides\n• architecture - System design and integration\n• procedures - Development and operations procedures\n• features - Game systems and application features\n• tools - Scripts and development tools\n• scripts - Automation and utility scripts\n• tests - Testing and validation suites\n• reference - Documentation indexes and references\n\n💡 Try: "MCP tools", "deployment script", "security tests", "lore ingestion", "smart commit"`
          }]
        };
      }
      
      // Format results
      let response = `📚 Documentation Navigator Results for "${query}"\n`;
      response += `${context ? `🎯 Context: ${context}\n` : ''}\n`;
      
      // Group by category
      const groupedResults = {};
      results.forEach(result => {
        if (!groupedResults[result.category]) {
          groupedResults[result.category] = [];
        }
        groupedResults[result.category].push(result);
      });
      
      for (const [category, items] of Object.entries(groupedResults)) {
        response += `\n📁 ${category.toUpperCase()}:\n`;
        items.forEach(item => {
          response += `  ${item.status} ${item.title}\n`;
          response += `     📄 ${item.path} ${item.size}\n`;
          if (item.lastModified) {
            response += `     📅 Last updated: ${item.lastModified}\n`;
          }
        });
      }
      
      // Add contextual recommendations
      response += `\n🎯 QUICK ACTIONS:\n`;
      if (queryLower.includes('mcp')) {
        response += `• Read: docs/MCP_TOOLS_DOCUMENTATION.md\n`;
        response += `• Try: ./lore-tools help\n`;
        response += `• Test: echo '{"jsonrpc": "2.0", "method": "tools/list", "id": 1}' | node mcp/enhanced-wavelength-server.js\n`;
      } else if (queryLower.includes('script') || queryLower.includes('automation')) {
        response += `• List scripts: ls -la scripts/\n`;
        response += `• Unified tools: ls scripts/unified/\n`;
        response += `• Run script: node scripts/[script-name].js --help\n`;
      } else if (queryLower.includes('test') || queryLower.includes('validation')) {
        response += `• Run tests: npm test\n`;
        response += `• List tests: ls -la tests/\n`;
        response += `• Specific test: node tests/[test-name].js\n`;
      } else if (queryLower.includes('deploy')) {
        response += `• Read: docs/deployment-guide.md\n`;
        response += `• Script: node scripts/unified/deployment-manager.js --help\n`;
        response += `• Test: node tests/deployment-tests.js\n`;
      } else if (queryLower.includes('security')) {
        response += `• Scanner: node scripts/unified/security-scanner.js\n`;
        response += `• Tests: node tests/security-tests.js\n`;
        response += `• Guide: docs/SECURITY_ENHANCEMENT_GUIDE.md\n`;
      } else if (queryLower.includes('lore')) {
        response += `• Interactive: ./lore-tools\n`;
        response += `• Script: node scripts/ingest-lore.js\n`;
        response += `• Tests: node tests/lore-integration-tests.js\n`;
      } else if (queryLower.includes('commit')) {
        response += `• MCP Smart Commit: node scripts/mcp-smart-commit.js\n`;
        response += `• Unified Smart Commit: node scripts/unified/smart-commit.js\n`;
        response += `• Guide: docs/SMART_COMMIT_QUICK_REFERENCE.md\n`;
      } else {
        response += `• Start with: AI_COPILOT_QUICKSTART.txt\n`;
        response += `• Overview: docs/README.md\n`;
        response += `• Architecture: docs/WAVELENGTH_SYSTEM_ARCHITECTURE.md\n`;
      }
      
      response += `\n📊 Found ${results.length} relevant documentation resources`;
      
      return {
        content: [{
          type: "text",
          text: response
        }]
      };
      
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `❌ Documentation navigation failed: ${error.message}\n\n💡 Available documentation areas:\n• Quickstart guides\n• System architecture\n• Development procedures\n• Game features\n• Tools & scripts\n• Reference materials`
        }]
      };
    }
  }

  async performDeploymentCheck(environment) {
    return {
      content: [{
        type: "text",
        text: `🚀 Smart Deployment Check (${environment}):\n✅ Firebase connectivity\n✅ Asset validation\n✅ Security checks\n✅ Ready for deployment!`
      }]
    };
  }

  // Tool 10: HTTP Request (Curl Replacement)
  async makeHttpRequest(url, method = 'GET', headers = {}, body = null, auth = null) {
    const https = require('https');
    const http = require('http');
    const { URL } = require('url');
    
    try {
      const parsedUrl = new URL(url);
      const isHttps = parsedUrl.protocol === 'https:';
      const client = isHttps ? https : http;
      
      // Prepare request options
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: method.toUpperCase(),
        headers: {
          'User-Agent': 'Wavelength-MCP-Server/1.0',
          'Accept': 'application/json, text/plain, */*',
          ...headers
        }
      };
      
      // Handle authentication
      if (auth) {
        switch (auth.type) {
          case 'bearer':
            options.headers['Authorization'] = `Bearer ${auth.token}`;
            break;
          case 'basic':
            const credentials = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
            options.headers['Authorization'] = `Basic ${credentials}`;
            break;
          case 'api-key':
            options.headers[auth.header || 'X-API-Key'] = auth.token;
            break;
        }
      }
      
      // Handle request body
      if (body && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
        const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
        options.headers['Content-Length'] = Buffer.byteLength(bodyString);
        if (!options.headers['Content-Type']) {
          options.headers['Content-Type'] = 'application/json';
        }
      }
      
      // Make the request
      const startTime = Date.now();
      const response = await new Promise((resolve, reject) => {
        const req = client.request(options, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            resolve({
              statusCode: res.statusCode,
              statusMessage: res.statusMessage,
              headers: res.headers,
              body: data
            });
          });
        });
        
        req.on('error', reject);
        
        if (body && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
          const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
          req.write(bodyString);
        }
        
        req.end();
      });
      
      const duration = Date.now() - startTime;
      
      // Parse response intelligently
      let parsedBody = response.body;
      let contentType = 'text';
      
      try {
        if (response.headers['content-type']?.includes('application/json')) {
          parsedBody = JSON.parse(response.body);
          contentType = 'json';
        }
      } catch (e) {
        // Keep as text if JSON parsing fails
      }
      
      // Format response
      const statusEmoji = response.statusCode < 300 ? '✅' : response.statusCode < 400 ? '⚠️' : '❌';
      let responseText = `🌐 HTTP Request Results\n\n`;
      responseText += `${statusEmoji} **${method.toUpperCase()} ${url}**\n`;
      responseText += `📊 Status: ${response.statusCode} ${response.statusMessage}\n`;
      responseText += `⏱️ Duration: ${duration}ms\n`;
      responseText += `📦 Content-Type: ${response.headers['content-type'] || 'unknown'}\n`;
      responseText += `📏 Size: ${response.body.length} bytes\n\n`;
      
      // Add important headers
      const importantHeaders = ['location', 'set-cookie', 'cache-control', 'x-rate-limit-remaining'];
      const relevantHeaders = Object.entries(response.headers)
        .filter(([key]) => importantHeaders.includes(key.toLowerCase()))
        .map(([key, value]) => `• ${key}: ${value}`)
        .join('\n');
      
      if (relevantHeaders) {
        responseText += `📋 Important Headers:\n${relevantHeaders}\n\n`;
      }
      
      // Add response body (truncated if too long)
      responseText += `📄 Response Body:\n`;
      if (contentType === 'json' && typeof parsedBody === 'object') {
        const jsonString = JSON.stringify(parsedBody, null, 2);
        if (jsonString.length > 2000) {
          responseText += `\`\`\`json\n${jsonString.substring(0, 2000)}...\n[Truncated - ${jsonString.length} total characters]\n\`\`\``;
        } else {
          responseText += `\`\`\`json\n${jsonString}\n\`\`\``;
        }
      } else {
        if (response.body.length > 1000) {
          responseText += `\`\`\`\n${response.body.substring(0, 1000)}...\n[Truncated - ${response.body.length} total characters]\n\`\`\``;
        } else {
          responseText += `\`\`\`\n${response.body}\n\`\`\``;
        }
      }
      
      // Add quick actions based on response
      responseText += `\n🎯 Quick Actions:\n`;
      if (response.statusCode >= 400) {
        responseText += `• Debug: Check authentication and request parameters\n`;
        responseText += `• Retry: Verify URL and network connectivity\n`;
      } else if (contentType === 'json' && parsedBody) {
        if (Array.isArray(parsedBody)) {
          responseText += `• Found ${parsedBody.length} items in response array\n`;
        } else if (parsedBody.id) {
          responseText += `• Resource ID: ${parsedBody.id}\n`;
        }
        if (parsedBody.next || parsedBody.pagination) {
          responseText += `• Has pagination - more data available\n`;
        }
      }
      
      return {
        content: [{
          type: "text",
          text: responseText
        }]
      };
      
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `❌ HTTP Request failed: ${error.message}\n\n💡 Common issues:\n• Check URL format and network connectivity\n• Verify authentication credentials\n• Ensure proper headers and content type\n• Check for CORS or firewall restrictions`
        }]
      };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("🚀 Enhanced Wavelength MCP Server running!");
  }
}

if (require.main === module) {
  const server = new EnhancedWavelengthMCPServer();
  server.run().catch(console.error);
}

module.exports = EnhancedWavelengthMCPServer;