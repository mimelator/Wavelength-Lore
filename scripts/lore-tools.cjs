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
    
    // Update paths to match workspace structure
    this.loreDir = path.resolve(__dirname, '..');
    this.chatbotDir = '/Volumes/5bits/current/wavelength-dev/Wavelength-Chatbot';
  }

  async askQuestion(question) {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  async callDirectScript(operation, args = {}) {
    try {
      const fs = require('fs');
      
      // Map operations to direct script calls
      switch (operation) {
        case 'sync-docs':
          console.log('🔄 Running Google Docs sync...');
          const syncResult = execSync(`cd "${this.chatbotDir}" && node scripts/sync-google-docs.js`, { 
            encoding: 'utf8', stdio: 'pipe' 
          });
          return syncResult;
          
        case 'sync-lore':
          console.log('🔄 Syncing lore content...');
          const targetDir = path.join(this.chatbotDir, 'content/wavelength-lore');
          const sourceDir = path.join(this.loreDir, 'content');
          
          // Copy content files (simplified implementation)
          if (fs.existsSync(sourceDir)) {
            execSync(`cp -r "${sourceDir}"/* "${targetDir}"/ 2>/dev/null || true`, { encoding: 'utf8' });
            return `✅ Lore content synced to ${targetDir}`;
          } else {
            return `❌ Source directory not found: ${sourceDir}`;
          }
          
        case 'ingest':
          console.log('🔄 Running lore ingestion...');
          execSync(`cd "${this.chatbotDir}" && node scripts/ingest-lore.js`, { 
            encoding: 'utf8', 
            stdio: 'inherit',
            timeout: 60000 
          });
          return '✅ Lore ingestion completed';
          
        case 'full-sync':
          console.log('🔄 Running full synchronization...');
          await this.callDirectScript('sync-lore');
          await this.callDirectScript('sync-docs');
          await this.callDirectScript('ingest');
          return '✅ Full synchronization completed';
          
        case 'status':
          console.log('📊 Checking system status...');
          let status = '📊 SYSTEM STATUS:\n';
          status += `📁 Chatbot path: ${this.chatbotDir}\n`;
          status += `📁 Content exists: ${fs.existsSync(path.join(__dirname, '../content')) ? 'Yes' : 'No'}\n`;
          status += `📁 Chatbot content dir: ${fs.existsSync(path.join(this.chatbotDir, 'content')) ? 'Yes' : 'No'}\n`;
          return status;
          
        case 'list':
          console.log('📚 Listing documents...');
          const configPath = path.join(this.chatbotDir, 'config/google-docs-config.js');
          if (fs.existsSync(configPath)) {
            try {
              delete require.cache[require.resolve(configPath)]; // Clear cache
              const config = require(configPath);
              const docs = config.DOCUMENTS_CONFIG || [];
              let result = `📚 CONFIGURED DOCUMENTS (${docs.length}):\n`;
              docs.forEach((doc, i) => {
                result += `${i + 1}. ${doc.name} (${doc.category})\n`;
              });
              return result;
            } catch (error) {
              return '❌ Error reading document configuration';
            }
          } else {
            return '❌ Document configuration not found';
          }
          
        default:
          return `❌ Unknown operation: ${operation}`;
      }
      
    } catch (error) {
      return `❌ Error executing operation: ${error.message}`;
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
    console.log('⚠️  Document registration requires manual configuration');
    console.log('📋 Please add the document to the Google Docs config file manually:');
    
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
    
    console.log('\n📋 CONFIGURATION TO ADD:');
    console.log('========================');
    console.log('Add this to your Wavelength-Chatbot/config/google-docs-config.js:');
    console.log('');
    console.log('{');
    console.log(`  id: "${url.includes('docs.google.com') ? url.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1] || url : url}",`);
    console.log(`  name: "${name}",`);
    console.log(`  category: "${category}",`);
    console.log(`  description: "${description || ''}"`);
    console.log('}');
    console.log('');
    console.log('💡 After adding the configuration, run option 2 (Document Ingestion) to sync the document.');
    
    const configPath = path.join(this.chatbotDir, 'config', 'google-docs-config.js');
    console.log(`📁 Config file location: ${configPath}`);
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
      '1': 'list', '2': 'sync-docs', '3': 'ingest', '4': 'full-sync'
    };
    
    const action = actionMap[choice];
    if (!action) {
      console.log('❌ Invalid choice');
      return;
    }
    
    console.log('\n🔄 Processing...');
    const result = await this.callDirectScript(action);
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
    const result = await this.callDirectScript(operation, { force });
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
    
    // Use grep-based search since direct script search is not available
    const { spawn } = require('child_process');
    const chatbotPath = path.join(this.chatbotDir, 'content');
    
    let searchPaths = [chatbotPath];
    if (type === 'characters') {
      searchPaths = [path.join(chatbotPath, 'characters')];
    } else if (type === 'episodes') {
      searchPaths = [path.join(chatbotPath, 'episodes')];
    } else if (type === 'lore') {
      searchPaths = [path.join(chatbotPath, 'lore')];
    }
    
    console.log(`📊 SEARCH RESULTS for "${query}" in ${type}:`);
    console.log('=' + '='.repeat(40));
    
    for (const searchPath of searchPaths) {
      const grep = spawn('grep', ['-r', '-i', '--include=*.md', '--include=*.txt', '-n', query, searchPath]);
      
      grep.stdout.on('data', (data) => {
        console.log(data.toString().trim());
      });
      
      grep.stderr.on('data', (data) => {
        // Ignore "No such file or directory" errors for missing content directories
        if (!data.toString().includes('No such file or directory')) {
          console.error('Search warning:', data.toString().trim());
        }
      });
      
      grep.on('close', (code) => {
        if (code === 1) {
          console.log(`📝 No matches found in ${path.basename(searchPath)}`);
        } else if (code !== 0) {
          console.log(`❌ Search failed in ${path.basename(searchPath)}`);
        }
      });
    }
  }

  async characterRelationships() {
    console.log('\n🕸️  CHARACTER RELATIONSHIP MAP');
    console.log('=============================');
    
    const character = await this.askQuestion('👤 Character name: ');
    
    console.log('\n🔄 Searching for character relationships...');
    
    // Use grep to find character mentions across content
    const { spawn } = require('child_process');
    const chatbotPath = path.join(this.chatbotDir, 'content');
    
    console.log(`📊 CHARACTER RELATIONSHIP ANALYSIS for "${character}":`);
    console.log('=' + '='.repeat(50));
    
    // Search for character mentions
    const grep = spawn('grep', ['-r', '-i', '--include=*.md', '--include=*.txt', '-n', character, chatbotPath]);
    
    let foundResults = false;
    
    grep.stdout.on('data', (data) => {
      foundResults = true;
      const lines = data.toString().split('\n').filter(line => line.trim());
      lines.forEach(line => {
        if (line.includes(':')) {
          const [file, ...content] = line.split(':');
          console.log(`📄 ${path.relative(chatbotPath, file)}: ${content.join(':').trim()}`);
        }
      });
    });
    
    grep.stderr.on('data', (data) => {
      if (!data.toString().includes('No such file or directory')) {
        console.error('Search warning:', data.toString().trim());
      }
    });
    
    grep.on('close', (code) => {
      if (!foundResults) {
        console.log(`📝 No relationships found for character "${character}"`);
        console.log('💡 Try checking character name spelling or search for partial matches');
      } else {
        console.log('\n✅ Character relationship search completed');
      }
    });
  }

  async systemStatus() {
    console.log('\n📊 SYSTEM STATUS');
    console.log('================');
    
    console.log('🔄 Checking content sync status...');
    const syncResult = await this.callDirectScript('status');
    console.log(syncResult);
    
    console.log('\n📚 Checking document configuration...');
    const listResult = await this.callDirectScript('list');
    console.log(listResult);
    
    console.log('\n📁 Checking file system status...');
    const fs = require('fs');
    
    // Check main directories
    const dirs = [
      { name: 'Wavelength-Lore', path: this.loreDir },
      { name: 'Wavelength-Chatbot', path: this.chatbotDir },
      { name: 'Chatbot Content', path: path.join(this.chatbotDir, 'content') },
      { name: 'Google Docs Config', path: path.join(this.chatbotDir, 'config', 'google-docs-config.js') }
    ];
    
    dirs.forEach(dir => {
      const exists = fs.existsSync(dir.path);
      const icon = exists ? '✅' : '❌';
      console.log(`${icon} ${dir.name}: ${exists ? 'Found' : 'Missing'} (${dir.path})`);
    });
  }

  async documentationNavigator() {
    console.log('\n📚 DOCUMENTATION NAVIGATOR');
    console.log('=========================');
    
    const query = await this.askQuestion('🔍 What are you looking for? (e.g., "deployment guide", "getting started"): ');
    
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
    
    console.log('\n🔍 Searching documentation...');
    
    // Search documentation files using grep
    const fs = require('fs');
    const { spawn } = require('child_process');
    
    const searchPaths = [
      this.loreDir,
      path.join(this.chatbotDir, 'docs'),
      path.join(this.chatbotDir, 'README.md'),
      path.join(this.chatbotDir, 'QUICKSTART.md')
    ];
    
    console.log(`📊 DOCUMENTATION SEARCH RESULTS for "${query}":`);
    console.log('=' + '='.repeat(50));
    
    let foundResults = false;
    
    for (const searchPath of searchPaths) {
      if (fs.existsSync(searchPath)) {
        const grep = spawn('grep', ['-r', '-i', '--include=*.md', '--include=*.txt', '-n', query, searchPath]);
        
        grep.stdout.on('data', (data) => {
          foundResults = true;
          const lines = data.toString().split('\n').filter(line => line.trim());
          lines.forEach(line => {
            if (line.includes(':')) {
              const [file, ...content] = line.split(':');
              const relativePath = path.relative(process.cwd(), file);
              console.log(`📄 ${relativePath}: ${content.join(':').trim()}`);
            }
          });
        });
        
        grep.on('close', () => {
          if (!foundResults) {
            console.log(`📝 No documentation found for "${query}"`);
            console.log('💡 Try searching for broader terms or check available documentation files');
          }
        });
      }
    }
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
          execSync(`cd "${this.chatbotDir}" && node scripts/manage-google-docs.js`, { stdio: 'inherit' });
          break;
          
        case '2':
          console.log('\n🚀 Running lore ingestion...');
          execSync(`cd "${this.chatbotDir}" && node scripts/ingest-lore.js`, { stdio: 'inherit' });
          break;
          
        case '3':
          console.log('\n🚀 Testing chatbot...');
          execSync(`cd "${this.chatbotDir}" && npm test`, { stdio: 'inherit' });
          break;
          
        case '4':
          console.log('\n📋 Chatbot configuration:');
          const configPath = path.join(this.chatbotDir, 'config/google-docs-config.js');
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