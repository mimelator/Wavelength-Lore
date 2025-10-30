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
      
      // Enhanced pre-flight checks
      console.log(`🔍 DIAGNOSTIC: Preparing ${operation} operation...`);
      
      // Map operations to direct script calls
      switch (operation) {
        case 'sync-docs':
          console.log('🔄 Running Google Docs sync...');
          
          // Pre-flight checks
          const syncScript = path.join(this.chatbotDir, 'scripts', 'sync-google-docs.js');
          if (!fs.existsSync(syncScript)) {
            return `❌ Sync script not found: ${syncScript}`;
          }
          
          const credentialsPath = path.join(this.chatbotDir, 'config', 'google-docs-credentials.json');
          if (!fs.existsSync(credentialsPath)) {
            return `❌ Google credentials not found: ${credentialsPath}\n💡 Please set up Google Docs credentials first.`;
          }
          
          console.log('✅ Pre-flight checks passed');
          console.log('⏱️  Starting sync operation (this may take a few minutes)...');
          
          const syncResult = execSync(`cd "${this.chatbotDir}" && node scripts/sync-google-docs.js`, { 
            encoding: 'utf8', stdio: 'pipe', timeout: 300000  // 5 minute timeout
          });
          return `✅ Google Docs sync completed:\n${syncResult}`;
          
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
          
          // Pre-flight checks
          const ingestScript = path.join(this.chatbotDir, 'scripts', 'ingest-lore.js');
          if (!fs.existsSync(ingestScript)) {
            return `❌ Ingest script not found: ${ingestScript}`;
          }
          
          const contentDir = path.join(this.chatbotDir, 'content');
          if (!fs.existsSync(contentDir)) {
            return `❌ Content directory not found: ${contentDir}\n💡 Run sync operations first to populate content.`;
          }
          
          // Check for content files
          const contentFiles = fs.readdirSync(contentDir, { recursive: true })
            .filter(file => file.endsWith('.md') || file.endsWith('.txt'));
          
          console.log(`📊 Found ${contentFiles.length} content files to ingest`);
          
          if (contentFiles.length === 0) {
            return `⚠️  No content files found in ${contentDir}\n💡 Run document sync first to generate content files.`;
          }
          
          console.log('✅ Pre-flight checks passed');
          console.log('⏱️  Starting ingestion (this may take several minutes)...');
          
          execSync(`cd "${this.chatbotDir}" && node scripts/ingest-lore.js`, { 
            encoding: 'utf8', 
            stdio: 'inherit',
            timeout: 300000  // 5 minute timeout
          });
          return `✅ Lore ingestion completed successfully\n📊 Processed ${contentFiles.length} files`;
          
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
      console.log(`❌ OPERATION FAILED: ${operation}`);
      console.log(`📄 Error details: ${error.message}`);
      
      // Enhanced error diagnostics
      if (error.code === 'ETIMEDOUT') {
        console.log('⏱️  TIMEOUT: Operation took longer than expected');
        console.log('💡 Try running the operation again or check network connectivity');
      } else if (error.code === 'ENOENT') {
        console.log('📁 FILE NOT FOUND: Required script or file is missing');
        console.log('💡 Check that all required scripts are properly installed');
      } else if (error.message.includes('permission')) {
        console.log('🔒 PERMISSION ERROR: Insufficient file or API permissions');
        console.log('💡 Check file permissions and Google API credentials');
      } else if (error.message.includes('EACCES')) {
        console.log('🔒 ACCESS DENIED: File system permission issue');
        console.log('💡 Check that the script has write access to required directories');
      }
      
      console.log('\n🛠️  TROUBLESHOOTING STEPS:');
      console.log('1. Check system status (option 6) for missing dependencies');
      console.log('2. Verify Google credentials are properly configured');
      console.log('3. Ensure all required scripts exist in Wavelength-Chatbot');
      console.log('4. Try running individual operations to isolate the issue');
      
      return `❌ Operation failed: ${error.message}`;
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
    console.log('9. 🔗 Google Docs Sharing Guide');
    console.log('10. Exit');
  }

  async registerDocument() {
    console.log('\n📄 REGISTER NEW GOOGLE DOCUMENT');
    console.log('===============================');
    
    // Enhanced diagnostics
    console.log('🔍 DIAGNOSTIC: Checking prerequisites...');
    const configFilePath = path.join(this.chatbotDir, 'config', 'google-docs-config.js');
    const fs = require('fs');
    
    if (!fs.existsSync(configFilePath)) {
      console.log('❌ CRITICAL: Google Docs config file not found!');
      console.log(`📁 Expected location: ${configFilePath}`);
      console.log('💡 Please ensure Wavelength-Chatbot is properly set up.');
      return;
    }
    
    console.log('✅ Config file found');
    console.log('📋 Document registration supports both manual and guided configuration');
    
    const registrationMode = await this.askQuestion('🔧 Choose mode:\n  1. Manual configuration (show config to copy)\n  2. Automatic configuration (add directly to config file)\n📋 Choose (1-2): ');
    
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
    
    const documentId = url.includes('docs.google.com') ? url.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1] || url : url;
    const newDocument = {
      name: name,
      documentId: documentId,
      category: category,
      tags: [category, 'user-added'],
      description: description || `User-added document: ${name}`
    };
    
    if (registrationMode === '2') {
      // Automatic configuration
      console.log('\n� AUTOMATIC CONFIGURATION');
      console.log('==========================');
      console.log('🔍 DIAGNOSTIC: Reading current configuration...');
      
      try {
        // Read the config file
        const configContent = fs.readFileSync(configFilePath, 'utf8');
        
        // Find the DOCUMENTS_CONFIG array
        const arrayMatch = configContent.match(/const DOCUMENTS_CONFIG = \[([\s\S]*?)\];/);
        if (!arrayMatch) {
          console.log('❌ Could not find DOCUMENTS_CONFIG array in config file');
          console.log('💡 Falling back to manual configuration...');
          registrationMode = '1';
        } else {
          console.log('✅ Found DOCUMENTS_CONFIG array');
          
          // Parse existing documents
          let existingDocs;
          try {
            // Use require to load the config
            delete require.cache[require.resolve(configFilePath)];
            const config = require(configFilePath);
            existingDocs = config.DOCUMENTS_CONFIG || [];
            
            // Check for duplicates
            const duplicate = existingDocs.find(doc => 
              doc.documentId === documentId || doc.name === name
            );
            
            if (duplicate) {
              console.log('⚠️  DUPLICATE DETECTED:');
              console.log(`   Existing: ${duplicate.name} (${duplicate.documentId})`);
              console.log(`   New: ${name} (${documentId})`);
              
              const overwrite = await this.askQuestion('🔄 Overwrite existing document? (y/n): ');
              if (overwrite.toLowerCase() !== 'y') {
                console.log('❌ Registration cancelled');
                return;
              }
              
              // Remove duplicate
              const index = existingDocs.findIndex(doc => doc.documentId === documentId);
              if (index !== -1) {
                existingDocs.splice(index, 1);
                console.log('🗑️  Removed existing duplicate');
              }
            }
            
            // Add new document
            existingDocs.push(newDocument);
            console.log('✅ Document added to configuration');
            
            // Write back to file
            const newArrayContent = JSON.stringify(existingDocs, null, 2);
            const newConfigContent = configContent.replace(
              /const DOCUMENTS_CONFIG = \[([\s\S]*?)\];/,
              `const DOCUMENTS_CONFIG = ${newArrayContent};`
            );
            
            // Backup original
            const backupPath = configFilePath + '.backup.' + Date.now();
            fs.writeFileSync(backupPath, configContent);
            console.log(`💾 Backup created: ${path.basename(backupPath)}`);
            
            // Write new config
            fs.writeFileSync(configFilePath, newConfigContent);
            console.log('✅ Configuration file updated successfully!');
            
            console.log('\n🎉 REGISTRATION COMPLETE');
            console.log('========================');
            console.log(`📄 Document: ${name}`);
            console.log(`🆔 ID: ${documentId}`);
            console.log(`📂 Category: ${category}`);
            console.log(`📝 Description: ${description || 'None'}`);
            console.log('\n💡 Next steps:');
            console.log('   1. 🔗 SHARE the document with the service account (CRITICAL!)');
            console.log(`      Email: ${serviceAccountEmail}`);
            console.log(`      Document: https://docs.google.com/document/d/${documentId}/edit`);
            console.log('   2. Run option 9 (Google Docs Sharing Guide) for detailed instructions');
            console.log('   3. Run option 2 (Document Ingestion) to sync the document');
            console.log('   4. Verify the document appears in the list');
            
          } catch (parseError) {
            console.log('❌ Error parsing configuration:', parseError.message);
            registrationMode = '1';
          }
        }
      } catch (readError) {
        console.log('❌ Error reading configuration file:', readError.message);
        registrationMode = '1';
      }
    }
    
    if (registrationMode === '1') {
      // Manual configuration
      console.log('\n📋 MANUAL CONFIGURATION');
      console.log('========================');
      console.log('Add this to your Wavelength-Chatbot/config/google-docs-config.js:');
      console.log('');
      console.log('{');
      console.log(`  "name": "${name}",`);
      console.log(`  "documentId": "${documentId}",`);
      console.log(`  "category": "${category}",`);
      console.log(`  "tags": [${newDocument.tags.map(tag => `"${tag}"`).join(', ')}],`);
      console.log(`  "description": "${newDocument.description}"`);
      console.log('}');
      console.log('');
      console.log('💡 Next steps:');
      console.log('   1. Add the configuration above to the config file');
      console.log('   2. 🔗 SHARE the document with the service account:');
      console.log(`      📧 Email: ${serviceAccountEmail}`);
      console.log(`      📄 Document: https://docs.google.com/document/d/${documentId}/edit`);
      console.log('   3. Run option 9 (Google Docs Sharing Guide) for detailed sharing instructions');
      console.log('   4. Run option 2 (Document Ingestion) to sync the document');
      console.log(`📁 Config file location: ${configFilePath}`);
    }
  }

  async manageIngestion() {
    console.log('\n📚 DOCUMENT INGESTION MANAGEMENT');
    console.log('===============================');
    
    // Enhanced diagnostics
    console.log('🔍 DIAGNOSTIC: Checking ingestion prerequisites...');
    const fs = require('fs');
    
    // Check if credentials exist
    const credentialsPath = path.join(this.chatbotDir, 'config', 'google-docs-credentials.json');
    const hasCredentials = fs.existsSync(credentialsPath);
    console.log(`📋 Google credentials: ${hasCredentials ? '✅ Found' : '❌ Missing'}`);
    
    // Check script availability
    const syncScript = path.join(this.chatbotDir, 'scripts', 'sync-google-docs.js');
    const ingestScript = path.join(this.chatbotDir, 'scripts', 'ingest-lore.js');
    const packageJsonPath = path.join(this.chatbotDir, 'package.json');
    
    console.log(`� Sync script: ${fs.existsSync(syncScript) ? '✅ Available' : '❌ Missing'}`);
    console.log(`� Ingest script: ${fs.existsSync(ingestScript) ? '✅ Available' : '❌ Missing'}`);
    console.log(`📦 Chatbot project: ${fs.existsSync(packageJsonPath) ? '✅ Found' : '❌ Missing'}`);
    
    // Check Node.js dependencies
    if (fs.existsSync(packageJsonPath)) {
      const nodeModulesPath = path.join(this.chatbotDir, 'node_modules');
      const hasNodeModules = fs.existsSync(nodeModulesPath);
      const hasGoogleApis = fs.existsSync(path.join(this.chatbotDir, 'node_modules', 'googleapis'));
      
      console.log(`� Dependencies: ${hasNodeModules ? '✅ Installed' : '❌ Missing (run npm install)'}`);
      console.log(`🔗 Google APIs: ${hasGoogleApis ? '✅ Available' : '❌ Missing (run npm install googleapis)'}`);
      
      if (!hasNodeModules) {
        console.log(`� TIP: cd "${this.chatbotDir}" && npm install`);
      } else if (!hasGoogleApis) {
        console.log(`💡 TIP: cd "${this.chatbotDir}" && npm install googleapis`);
      }
    }
    
    if (!hasCredentials) {
      console.log('⚠️  WARNING: Google Docs credentials not found!');
      console.log(`📁 Expected location: ${credentialsPath}`);
      console.log('💡 Some operations may fail without proper credentials.');
    }
    
    console.log('\n📋 Available operations:');
    console.log('1. List configured documents (always available)');
    console.log('2. Sync Google Docs (requires credentials)');
    console.log('3. Ingest lore content (requires content files)');
    console.log('4. Sync and ingest (full pipeline)');
    console.log('5. Test connection (diagnostic)');
    
    const choice = await this.askQuestion('\n📋 Choose action (1-5): ');
    const actionMap = {
      '1': 'list', '2': 'sync-docs', '3': 'ingest', '4': 'full-sync', '5': 'test-connection'
    };
    
    const action = actionMap[choice];
    if (!action) {
      console.log('❌ Invalid choice');
      return;
    }
    
    console.log('\n🔄 Processing...');
    
    if (action === 'test-connection') {
      await this.testConnection();
      return;
    }
    
    // Show progress indicator for longer operations
    if (['sync-docs', 'full-sync'].includes(action)) {
      console.log('⏱️  This operation may take several minutes...');
      console.log('📊 Progress will be shown as the operation proceeds');
    }
    
    const result = await this.callDirectScript(action);
    console.log(result);
  }

  async testConnection() {
    console.log('\n🔌 CONNECTION TEST');
    console.log('==================');
    
    const fs = require('fs');
    const credentialsPath = path.join(this.chatbotDir, 'config', 'google-docs-credentials.json');
    
    if (!fs.existsSync(credentialsPath)) {
      console.log('❌ FAIL: Credentials file not found');
      console.log(`📁 Expected: ${credentialsPath}`);
      return;
    }
    
    try {
      const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
      console.log('✅ Credentials file readable');
      console.log(`📧 Service account: ${credentials.client_email || 'Unknown'}`);
      
      // Test basic Google API access by running the test from the chatbot directory
      console.log('🔄 Testing Google API connection...');
      console.log('📍 Running test from Wavelength-Chatbot directory...');
      
      try {
        // Test by running the sync script with a dry-run or test flag
        const testScript = `
          const { google } = require('googleapis');
          const fs = require('fs');
          
          const credentials = JSON.parse(fs.readFileSync('config/google-docs-credentials.json', 'utf8'));
          const auth = new google.auth.JWT(
            credentials.client_email,
            null,
            credentials.private_key,
            ['https://www.googleapis.com/auth/documents.readonly']
          );
          
          auth.authorize()
            .then(() => console.log('✅ Google API authentication successful'))
            .catch(err => {
              console.log('❌ Google API authentication failed:', err.message);
              process.exit(1);
            });
        `;
        
        const { execSync } = require('child_process');
        const result = execSync(`cd "${this.chatbotDir}" && node -e "${testScript.replace(/"/g, '\\"')}"`, { 
          encoding: 'utf8',
          timeout: 30000
        });
        
        console.log(result.trim());
        
      } catch (testError) {
        console.log('❌ FAIL: Google API connection test failed');
        console.log(`📄 Error: ${testError.message}`);
        
        if (testError.message.includes('googleapis')) {
          console.log('\n🔧 MISSING DEPENDENCY: googleapis module not installed');
          console.log('💡 SOLUTION: Install dependencies in Wavelength-Chatbot:');
          console.log(`   cd "${this.chatbotDir}"`);
          console.log('   npm install googleapis');
        } else if (testError.message.includes('ENOENT')) {
          console.log('\n📁 MISSING FILES: Chatbot project not properly set up');
          console.log('💡 SOLUTION: Ensure Wavelength-Chatbot is properly installed:');
          console.log(`   cd "${this.chatbotDir}"`);
          console.log('   npm install');
        } else {
          console.log('\n💡 Troubleshooting:');
          console.log('   1. Check credentials file format');
          console.log('   2. Verify service account permissions');
          console.log('   3. Ensure Google Docs API is enabled');
          console.log('   4. Install googleapis in Wavelength-Chatbot: npm install googleapis');
        }
      }
      
    } catch (error) {
      console.log('❌ FAIL: Connection test failed');
      console.log(`📄 Error: ${error.message}`);
      console.log('\n💡 Troubleshooting:');
      console.log('   1. Check credentials file format');
      console.log('   2. Verify service account permissions');
      console.log('   3. Ensure Google Docs API is enabled');
    }
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

  async googleDocsSharingGuide() {
    console.log('\n🔗 GOOGLE DOCS SHARING GUIDE');
    console.log('============================');
    
    // Get service account email from config
    const configPath = path.join(this.chatbotDir, 'config', 'google-docs-config.js');
    const fs = require('fs');
    
    let serviceAccountEmail = 'wavelength-docs-sync@wavelength-lore.iam.gserviceaccount.com';
    
    try {
      delete require.cache[require.resolve(configPath)];
      const config = require(configPath);
      serviceAccountEmail = config.GOOGLE_SERVICE_ACCOUNT_EMAIL || serviceAccountEmail;
    } catch (error) {
      console.log('⚠️  Could not read config file, using default service account email');
    }
    
    console.log('📧 SERVICE ACCOUNT EMAIL:');
    console.log(`   ${serviceAccountEmail}`);
    console.log('');
    
    console.log('🔍 SHARING OPTIONS:');
    console.log('1. Share a specific document (guided walkthrough)');
    console.log('2. Share all configured documents (batch guide)');
    console.log('3. Verify document permissions');
    console.log('4. Troubleshoot sharing issues');
    
    const choice = await this.askQuestion('\n📋 Choose option (1-4): ');
    
    switch (choice) {
      case '1':
        await this.shareSpecificDocument(serviceAccountEmail);
        break;
      case '2':
        await this.shareAllDocuments(serviceAccountEmail);
        break;
      case '3':
        await this.verifyDocumentPermissions(serviceAccountEmail);
        break;
      case '4':
        await this.troubleshootSharing(serviceAccountEmail);
        break;
      default:
        console.log('❌ Invalid choice');
    }
  }

  async shareSpecificDocument(serviceAccountEmail) {
    console.log('\n📄 SHARE SPECIFIC DOCUMENT');
    console.log('==========================');
    
    const docUrl = await this.askQuestion('🔗 Google Docs URL or Document ID: ');
    const documentId = docUrl.includes('docs.google.com') ? 
      docUrl.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1] || docUrl : docUrl;
    
    if (!documentId) {
      console.log('❌ Invalid document URL or ID');
      return;
    }
    
    console.log('\n📋 STEP-BY-STEP SHARING INSTRUCTIONS:');
    console.log('=====================================');
    console.log('');
    console.log('🌐 Step 1: Open the Google Document');
    console.log(`   📎 URL: https://docs.google.com/document/d/${documentId}/edit`);
    console.log('   💡 Click the link above or paste it into your browser');
    console.log('');
    console.log('🔗 Step 2: Access the Share Menu');
    console.log('   🖱️  Click the "Share" button (blue button in top-right corner)');
    console.log('   📧 Or click "Share with others" if prompted');
    console.log('');
    console.log('👥 Step 3: Add the Service Account');
    console.log('   📧 In the "Add people" field, enter:');
    console.log(`      ${serviceAccountEmail}`);
    console.log('   ⌨️  Press Enter or click "Send"');
    console.log('');
    console.log('🔒 Step 4: Set Permissions');
    console.log('   📖 Permission level: "Viewer" (default - this is correct!)');
    console.log('   🔔 Notification: You can uncheck "Notify people" (optional)');
    console.log('   ✅ Click "Send" or "Done"');
    console.log('');
    console.log('✅ Step 5: Verification');
    console.log('   📋 You should see the service account email in the shared users list');
    console.log('   🎯 Status should show "Can view"');
    console.log('');
    
    console.log('💡 QUICK COPY-PASTE:');
    console.log('===================');
    console.log('🔗 Document URL:');
    console.log(`https://docs.google.com/document/d/${documentId}/edit`);
    console.log('');
    console.log('📧 Service Account Email:');
    console.log(serviceAccountEmail);
    console.log('');
    
    const testAccess = await this.askQuestion('🧪 Test document access after sharing? (y/n): ');
    if (testAccess.toLowerCase() === 'y') {
      await this.testDocumentAccess(documentId);
    }
  }

  async shareAllDocuments(serviceAccountEmail) {
    console.log('\n📚 SHARE ALL CONFIGURED DOCUMENTS');
    console.log('==================================');
    
    // Get all configured documents
    const configPath = path.join(this.chatbotDir, 'config', 'google-docs-config.js');
    const fs = require('fs');
    
    let documents = [];
    try {
      delete require.cache[require.resolve(configPath)];
      const config = require(configPath);
      documents = config.DOCUMENTS_CONFIG || [];
    } catch (error) {
      console.log('❌ Could not read document configuration');
      return;
    }
    
    if (documents.length === 0) {
      console.log('📝 No documents configured yet');
      console.log('💡 Use option 1 (Register New Google Document) to add documents first');
      return;
    }
    
    console.log(`📊 Found ${documents.length} configured documents:`);
    console.log('');
    
    documents.forEach((doc, index) => {
      console.log(`${index + 1}. ${doc.name}`);
      console.log(`   📄 ID: ${doc.documentId}`);
      console.log(`   🔗 URL: https://docs.google.com/document/d/${doc.documentId}/edit`);
      console.log(`   📂 Category: ${doc.category}`);
      console.log('');
    });
    
    console.log('🔗 BATCH SHARING INSTRUCTIONS:');
    console.log('==============================');
    console.log('📧 Service Account Email to Share With:');
    console.log(`   ${serviceAccountEmail}`);
    console.log('');
    console.log('📋 For EACH document above:');
    console.log('1. 🌐 Open the document URL');
    console.log('2. 🔗 Click "Share" button');
    console.log(`3. 📧 Add: ${serviceAccountEmail}`);
    console.log('4. 🔒 Set permission: "Viewer"');
    console.log('5. ✅ Click "Send"');
    console.log('');
    
    console.log('⚡ QUICK REFERENCE:');
    console.log('==================');
    console.log('📧 Copy this email for sharing:');
    console.log(serviceAccountEmail);
    console.log('');
    console.log('🔗 Document URLs:');
    documents.forEach((doc, index) => {
      console.log(`${index + 1}. https://docs.google.com/document/d/${doc.documentId}/edit`);
    });
    
    const testAll = await this.askQuestion('\n🧪 Test access for all documents after sharing? (y/n): ');
    if (testAll.toLowerCase() === 'y') {
      for (const doc of documents) {
        console.log(`\n🧪 Testing: ${doc.name}`);
        await this.testDocumentAccess(doc.documentId);
      }
    }
  }

  async verifyDocumentPermissions(serviceAccountEmail) {
    console.log('\n🔍 VERIFY DOCUMENT PERMISSIONS');
    console.log('==============================');
    
    const docUrl = await this.askQuestion('🔗 Google Docs URL or Document ID: ');
    const documentId = docUrl.includes('docs.google.com') ? 
      docUrl.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1] || docUrl : docUrl;
    
    if (!documentId) {
      console.log('❌ Invalid document URL or ID');
      return;
    }
    
    console.log('\n📋 MANUAL VERIFICATION STEPS:');
    console.log('=============================');
    console.log(`🌐 1. Open: https://docs.google.com/document/d/${documentId}/edit`);
    console.log('🔗 2. Click the "Share" button');
    console.log('👥 3. Look for this email in the shared users list:');
    console.log(`      ${serviceAccountEmail}`);
    console.log('🔒 4. Verify permission shows "Can view"');
    console.log('');
    
    await this.testDocumentAccess(documentId);
  }

  async testDocumentAccess(documentId) {
    console.log('🧪 Testing API access...');
    
    try {
      const { google } = require('googleapis');
      const credentialsPath = path.join(this.chatbotDir, 'config', 'google-docs-credentials.json');
      const fs = require('fs');
      
      if (!fs.existsSync(credentialsPath)) {
        console.log('❌ Credentials file not found - cannot test API access');
        return;
      }
      
      const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
      const auth = new google.auth.JWT(
        credentials.client_email,
        null,
        credentials.private_key,
        ['https://www.googleapis.com/auth/documents.readonly']
      );
      
      const docs = google.docs({ version: 'v1', auth });
      const response = await docs.documents.get({ documentId });
      
      console.log('✅ API ACCESS SUCCESS!');
      console.log(`📄 Document title: ${response.data.title}`);
      console.log(`📊 Content length: ${response.data.body?.content?.length || 0} elements`);
      
    } catch (error) {
      console.log('❌ API ACCESS FAILED');
      console.log(`📄 Error: ${error.message}`);
      
      if (error.code === 403) {
        console.log('');
        console.log('🔒 PERMISSION DENIED - Document not shared correctly');
        console.log('💡 SOLUTION: Share the document with the service account:');
        console.log(`   📧 ${error.config?.serviceAccountEmail || 'Service account email'}`);
      } else if (error.code === 404) {
        console.log('');
        console.log('📄 DOCUMENT NOT FOUND');
        console.log('💡 SOLUTION: Check the document ID is correct');
      } else {
        console.log('');
        console.log('🛠️  POSSIBLE CAUSES:');
        console.log('   1. Document not shared with service account');
        console.log('   2. Incorrect document ID');
        console.log('   3. Service account credentials invalid');
        console.log('   4. Google Docs API not enabled');
      }
    }
  }

  async troubleshootSharing(serviceAccountEmail) {
    console.log('\n🛠️  TROUBLESHOOT SHARING ISSUES');
    console.log('===============================');
    
    console.log('🔍 COMMON ISSUES & SOLUTIONS:');
    console.log('');
    console.log('1. ❌ "Permission denied" or 403 errors');
    console.log('   🔒 CAUSE: Document not shared with service account');
    console.log('   ✅ SOLUTION: Share document with:');
    console.log(`      ${serviceAccountEmail}`);
    console.log('');
    console.log('2. ❌ "Document not found" or 404 errors');
    console.log('   📄 CAUSE: Wrong document ID or private document');
    console.log('   ✅ SOLUTION: Check document URL and sharing settings');
    console.log('');
    console.log('3. ❌ Service account email bounces/not found');
    console.log('   📧 CAUSE: Service account not created or wrong email');
    console.log('   ✅ SOLUTION: Verify service account in Google Cloud Console');
    console.log('');
    console.log('4. ❌ API timeout or connection errors');
    console.log('   🌐 CAUSE: Network issues or API limits');
    console.log('   ✅ SOLUTION: Check internet connection, try again later');
    console.log('');
    
    console.log('🧪 DIAGNOSTIC CHECKLIST:');
    console.log('========================');
    console.log('□ Service account email is correct');
    console.log('□ Document is shared with service account');
    console.log('□ Permission is set to "Viewer"');
    console.log('□ Document ID extracted correctly from URL');
    console.log('□ Google Docs API is enabled in Cloud Console');
    console.log('□ Service account credentials file exists');
    console.log('');
    
    console.log('📧 Current Service Account Email:');
    console.log(serviceAccountEmail);
    console.log('');
    
    const runDiagnostic = await this.askQuestion('🔧 Run full diagnostic test? (y/n): ');
    if (runDiagnostic.toLowerCase() === 'y') {
      await this.runSharingDiagnostic(serviceAccountEmail);
    }
  }

  async runSharingDiagnostic(serviceAccountEmail) {
    console.log('\n🔧 RUNNING DIAGNOSTIC TEST');
    console.log('==========================');
    
    const fs = require('fs');
    
    // Test 1: Check credentials file
    console.log('🧪 Test 1: Service Account Credentials');
    const credentialsPath = path.join(this.chatbotDir, 'config', 'google-docs-credentials.json');
    
    if (!fs.existsSync(credentialsPath)) {
      console.log('❌ FAIL: Credentials file not found');
      console.log(`📁 Expected: ${credentialsPath}`);
      return;
    }
    
    try {
      const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
      console.log('✅ PASS: Credentials file readable');
      console.log(`📧 Email: ${credentials.client_email}`);
      
      if (credentials.client_email !== serviceAccountEmail) {
        console.log('⚠️  WARNING: Email mismatch!');
        console.log(`   Config: ${serviceAccountEmail}`);
        console.log(`   Credentials: ${credentials.client_email}`);
      }
    } catch (error) {
      console.log('❌ FAIL: Credentials file invalid JSON');
      return;
    }
    
    // Test 2: Google API connection
    console.log('\n🧪 Test 2: Google API Connection');
    try {
      const { google } = require('googleapis');
      const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
      const auth = new google.auth.JWT(
        credentials.client_email,
        null,
        credentials.private_key,
        ['https://www.googleapis.com/auth/documents.readonly']
      );
      
      await auth.authorize();
      console.log('✅ PASS: Google API authentication successful');
    } catch (error) {
      console.log('❌ FAIL: Google API authentication failed');
      console.log(`📄 Error: ${error.message}`);
      return;
    }
    
    // Test 3: Test document access
    console.log('\n🧪 Test 3: Document Access Test');
    const testDocId = await this.askQuestion('📄 Enter test document ID (or press Enter to skip): ');
    
    if (testDocId.trim()) {
      await this.testDocumentAccess(testDocId.trim());
    } else {
      console.log('⏭️  Skipped document access test');
    }
    
    console.log('\n🎯 DIAGNOSTIC COMPLETE');
    console.log('======================');
    console.log('💡 If all tests pass but sync still fails, the issue is likely:');
    console.log('   1. Document not shared with service account');
    console.log('   2. Wrong document ID in configuration');
    console.log('   3. Document is in a different Google account');
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
        
        const choice = await this.askQuestion('\n📋 Choose an option (1-10): ');
        
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
            await this.googleDocsSharingGuide();
            break;
          case '10':
            console.log('👋 Goodbye!');
            continueMenu = false;
            break;
          default:
            console.log('❌ Invalid choice. Please choose 1-10.');
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