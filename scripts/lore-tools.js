#!/usr/bin/env node

/**
 * Wavelength Lore Management Tools
 * Unified access to all lore ingestion and document management features
 */

const { execSync } = require('child_process');
const readline = require('readline');
const path = require('path');

class LoreToolsManager {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    this.mcpServerPath = path.join(__dirname, '../mcp/enhanced-wavelength-server.js');
    this.chatbotPath = path.resolve(__dirname, '../../Wavelength-Chatbot');
  }

  async askQuestion(question) {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  async callMCPTool(toolName, args) {
    try {
      const mcpCall = {
        jsonrpc: "2.0",
        id: Date.now(),
        method: "tools/call",
        params: {
          name: toolName,
          arguments: args
        }
      };

      const command = `echo '${JSON.stringify(mcpCall)}' | node "${this.mcpServerPath}"`;
      const result = execSync(command, { encoding: 'utf8', cwd: path.dirname(this.mcpServerPath) });
      
      // Parse the JSON response
      const lines = result.split('\n').filter(line => line.trim());
      const jsonLine = lines.find(line => line.startsWith('{"result"'));
      
      if (jsonLine) {
        const parsed = JSON.parse(jsonLine);
        return parsed.result.content[0].text;
      }
      
      return result;
    } catch (error) {
      return `❌ Error calling MCP tool: ${error.message}`;
    }
  }

  displayMainMenu() {
    console.log('\n🎭 WAVELENGTH LORE MANAGEMENT TOOLS');
    console.log('==================================');
    console.log('1. 📄 Register New Google Document');
    console.log('2. 📚 Manage Document Ingestion');
    console.log('3. 🔄 Content Sync Manager');
    console.log('4. 🔍 Search Wavelength Lore');
    console.log('5. 🕸️  Character Relationship Map');
    console.log('6. 📊 System Status');
    console.log('7. 🛠️  Direct Chatbot Tools');
    console.log('8. 📚 Documentation Navigator');
    console.log('9. Exit');
  }

  async registerDocument() {
    console.log('\n📄 REGISTER NEW GOOGLE DOCUMENT');
    console.log('===============================');
    
    const url = await this.askQuestion('🔗 Google Docs URL or Document ID: ');
    const name = await this.askQuestion('📝 Document name: ');
    
    console.log('\n📁 Available categories:');
    console.log('1. characters    - Character profiles, relationships');
    console.log('2. episodes      - Episode analysis, commentary');
    console.log('3. worldbuilding - Universe rules, locations');
    console.log('4. lore         - Objects, concepts, magic system');
    console.log('5. analysis     - Fan theories, symbolism');
    
    const categoryChoice = await this.askQuestion('\n📂 Choose category (1-5 or type name): ');
    const categoryMap = {
      '1': 'characters', '2': 'episodes', '3': 'worldbuilding',
      '4': 'lore', '5': 'analysis'
    };
    const category = categoryMap[categoryChoice] || categoryChoice.toLowerCase();
    
    const description = await this.askQuestion('📄 Brief description (optional): ');
    const customTags = await this.askQuestion('🏷️  Custom tags (comma-separated, optional): ');
    
    const tags = customTags ? customTags.split(',').map(t => t.trim()) : [category, 'lore'];
    
    console.log('\n🔄 Registering document via MCP...');
    const result = await this.callMCPTool('register_shared_document', {
      url, name, category, description, tags
    });
    
    console.log(result);
  }

  async manageIngestion() {
    console.log('\n📚 DOCUMENT INGESTION MANAGEMENT');
    console.log('===============================');
    console.log('1. List configured documents');
    console.log('2. Sync Google Docs');
    console.log('3. Ingest lore content');
    console.log('4. Sync and ingest (full pipeline)');
    
    const choice = await this.askQuestion('\n📋 Choose action (1-4): ');
    const actionMap = {
      '1': 'list', '2': 'sync', '3': 'ingest', '4': 'sync-and-ingest'
    };
    
    const action = actionMap[choice];
    if (!action) {
      console.log('❌ Invalid choice');
      return;
    }
    
    console.log('\n🔄 Processing...');
    const result = await this.callMCPTool('lore_ingestion_status', { action });
    console.log(result);
  }

  async manageContentSync() {
    console.log('\n🔄 CONTENT SYNC MANAGER');
    console.log('======================');
    console.log('1. Sync lore content (Wavelength-Lore → Chatbot)');
    console.log('2. Sync Google Docs');
    console.log('3. Full synchronization (everything)');
    console.log('4. Check sync status');
    
    const choice = await this.askQuestion('\n📋 Choose operation (1-4): ');
    const operationMap = {
      '1': 'sync-lore', '2': 'sync-docs', '3': 'full-sync', '4': 'status'
    };
    
    const operation = operationMap[choice];
    if (!operation) {
      console.log('❌ Invalid choice');
      return;
    }
    
    let force = false;
    if (operation === 'sync-lore') {
      const forceChoice = await this.askQuestion('🔄 Force resync all files? (y/n): ');
      force = forceChoice.toLowerCase() === 'y';
    }
    
    console.log('\n🔄 Processing...');
    const result = await this.callMCPTool('content_sync_manager', { operation, force });
    console.log(result);
  }

  async searchLore() {
    console.log('\n🔍 WAVELENGTH LORE SEARCH');
    console.log('========================');
    
    const query = await this.askQuestion('🔍 Search query: ');
    
    console.log('\n📂 Search scope:');
    console.log('1. all - Search everything');
    console.log('2. characters - Characters only');
    console.log('3. episodes - Episodes only');
    console.log('4. lore - Lore content only');
    
    const typeChoice = await this.askQuestion('\n📋 Choose scope (1-4 or type name): ');
    const typeMap = {
      '1': 'all', '2': 'characters', '3': 'episodes', '4': 'lore'
    };
    const type = typeMap[typeChoice] || typeChoice.toLowerCase();
    
    console.log('\n🔍 Searching...');
    const result = await this.callMCPTool('wavelength_lore_search', { query, type });
    console.log(result);
  }

  async characterRelationships() {
    console.log('\n🕸️  CHARACTER RELATIONSHIP MAP');
    console.log('=============================');
    
    const character = await this.askQuestion('👤 Character name: ');
    
    console.log('\n🔄 Generating relationship map...');
    const result = await this.callMCPTool('character_relationship_map', { character });
    console.log(result);
  }

  async systemStatus() {
    console.log('\n📊 SYSTEM STATUS');
    console.log('================');
    
    console.log('🔄 Checking content sync status...');
    const syncStatus = await this.callMCPTool('content_sync_manager', { operation: 'status' });
    console.log(syncStatus);
    
    console.log('\n📚 Checking document configuration...');
    const docStatus = await this.callMCPTool('lore_ingestion_status', { action: 'list' });
    console.log(docStatus);
  }

  async documentationNavigator() {
    console.log('\n📚 DOCUMENTATION NAVIGATOR');
    console.log('=========================');
    
    const query = await this.askQuestion('🔍 What are you looking for? (e.g., "deployment guide", "MCP tools", "getting started"): ');
    
    console.log('\n📋 Documentation types:');
    console.log('1. search      - General search (default)');
    console.log('2. quickstart  - Getting started guides');
    console.log('3. architecture - System design and integration');
    console.log('4. procedures  - Development and operations');
    console.log('5. reference   - Documentation indexes');
    
    const typeChoice = await this.askQuestion('\n📂 Choose type (1-5 or press Enter for search): ');
    const typeMap = {
      '1': 'search', '2': 'quickstart', '3': 'architecture', 
      '4': 'procedures', '5': 'reference'
    };
    const type = typeMap[typeChoice] || 'search';
    
    const context = await this.askQuestion('🎯 Current task context (optional): ');
    
    console.log('\n🔍 Searching documentation...');
    const result = await this.callMCPTool('documentation_navigator', { query, type, context });
    console.log(result);
  }

  async directChatbotTools() {
    console.log('\n🛠️  DIRECT CHATBOT TOOLS');
    console.log('=======================');
    console.log('1. Run Google Docs manager (interactive)');
    console.log('2. Run lore ingestion script');
    console.log('3. Test chatbot locally');
    console.log('4. Check chatbot configuration');
    
    const choice = await this.askQuestion('\n📋 Choose tool (1-4): ');
    
    try {
      switch (choice) {
        case '1':
          console.log('\n🚀 Launching Google Docs manager...');
          execSync(`cd "${this.chatbotPath}" && node scripts/manage-google-docs.js`, { stdio: 'inherit' });
          break;
          
        case '2':
          console.log('\n🚀 Running lore ingestion...');
          execSync(`cd "${this.chatbotPath}" && node scripts/ingest-lore.js`, { stdio: 'inherit' });
          break;
          
        case '3':
          console.log('\n🚀 Testing chatbot...');
          execSync(`cd "${this.chatbotPath}" && npm test`, { stdio: 'inherit' });
          break;
          
        case '4':
          console.log('\n📋 Chatbot configuration:');
          const configPath = path.join(this.chatbotPath, 'config/google-docs-config.js');
          try {
            const config = require(configPath);
            console.log(`📄 Documents configured: ${config.DOCUMENTS_CONFIG?.length || 0}`);
            console.log(`📧 Service account: ${config.GOOGLE_SERVICE_ACCOUNT_EMAIL || 'Not configured'}`);
          } catch (error) {
            console.log('❌ Configuration not found or invalid');
          }
          break;
          
        default:
          console.log('❌ Invalid choice');
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  async run() {
    console.log('🎭 Welcome to Wavelength Lore Management Tools!');
    console.log('This unified interface provides access to all lore ingestion and document management features.\n');
    
    try {
      let continueMenu = true;
      while (continueMenu) {
        this.displayMainMenu();
        
        const choice = await this.askQuestion('\n📋 Choose an option (1-8): ');
        
        switch (choice) {
          case '1':
            await this.registerDocument();
            break;
          case '2':
            await this.manageIngestion();
            break;
          case '3':
            await this.manageContentSync();
            break;
          case '4':
            await this.searchLore();
            break;
          case '5':
            await this.characterRelationships();
            break;
          case '6':
            await this.systemStatus();
            break;
          case '7':
            await this.directChatbotTools();
            break;
          case '8':
            await this.documentationNavigator();
            break;
          case '9':
            console.log('👋 Goodbye!');
            continueMenu = false;
            break;
          default:
            console.log('❌ Invalid choice. Please choose 1-9.');
        }
        
        if (continueMenu) {
          await this.askQuestion('\n⏸️  Press Enter to continue...');
        }
      }
    } catch (error) {
      console.error('💥 Error:', error.message);
    } finally {
      this.rl.close();
    }
  }
}

// Run if called directly
if (require.main === module) {
  const manager = new LoreToolsManager();
  manager.run();
}

module.exports = LoreToolsManager;