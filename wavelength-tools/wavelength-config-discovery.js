#!/usr/bin/env node

/**
 * 🌊 WAVELENGTH CONFIG DISCOVERY SUPER POWER
 * Scans, catalogs, and documents all configuration files for enhanced discoverability
 * PURE WAVELENGTH METHODOLOGY - NO SHELL DEPENDENCIES!
 */

const fs = require('fs');
const path = require('path');

class WavelengthConfigDiscovery {
  constructor() {
    this.configPatterns = {
      // Configuration files
      config: [
        '**/*.json',
        '**/*.yml', 
        '**/*.yaml',
        '**/*.toml',
        '**/*.ini',
        '**/*.conf',
        '**/*.config.js',
        '**/config.js',
        '**/config/**',
        '**/.env*',
        '**/.*rc*'
      ],
      
      // Build and deployment
      build: [
        'package.json',
        'Dockerfile*', 
        'docker-compose*',
        '.github/workflows/**',
        'tsconfig.json',
        'webpack.config.js',
        'vite.config.js',
        'rollup.config.js'
      ],
      
      // Database and storage
      database: [
        '**/database*',
        '**/firebase*',
        '**/mongo*',
        '**/redis*',
        '**/*-rules.json',
        '**/*-schema*'
      ],
      
      // Security and authentication
      security: [
        '**/auth*',
        '**/security*',
        '**/jwt*',
        '**/ssl*',
        '**/cert*',
        '**/key*',
        '**/credentials*'
      ],
      
      // AWS and cloud
      cloud: [
        '**/aws*',
        '**/cloudfront*',
        '**/s3*',
        '**/ec2*',
        '**/lambda*',
        '**/apprunner*'
      ]
    };
    
    this.discoveredConfigs = {
      critical: [],
      buildDeploy: [],
      database: [],
      security: [],
      cloud: [],
      other: []
    };
  }

  async scanDirectory(dir = '.', depth = 0, maxDepth = 4) {
    if (depth > maxDepth) return [];
    
    const items = [];
    
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative('.', fullPath);
        
        // Skip common non-config directories
        if (entry.isDirectory()) {
          const skipDirs = ['node_modules', '.git', 'dist', 'build', 'coverage', 'logs'];
          if (skipDirs.includes(entry.name)) continue;
          
          items.push(...await this.scanDirectory(fullPath, depth + 1, maxDepth));
        } else if (entry.isFile()) {
          items.push({
            name: entry.name,
            path: relativePath,
            dir: path.dirname(relativePath),
            ext: path.extname(entry.name),
            size: fs.statSync(fullPath).size,
            modified: fs.statSync(fullPath).mtime
          });
        }
      }
    } catch (error) {
      console.log(`⚠️  Could not scan ${dir}: ${error.message}`);
    }
    
    return items;
  }

  isConfigFile(file) {
    const name = file.name.toLowerCase();
    const path = file.path.toLowerCase();
    
    // Common config file patterns
    const configPatterns = [
      /\.json$/,
      /\.ya?ml$/,
      /\.toml$/,
      /\.ini$/,
      /\.conf$/,
      /config/,
      /\.env/,
      /rc$/,
      /rules/,
      /settings/,
      /firebase/,
      /docker/,
      /aws/,
      /cloudfront/,
      /package\.json/,
      /tsconfig/,
      /webpack/,
      /vite/,
      /rollup/
    ];
    
    return configPatterns.some(pattern => 
      pattern.test(name) || pattern.test(path)
    );
  }

  categorizeConfig(file) {
    const name = file.name.toLowerCase();
    const path = file.path.toLowerCase();
    
    // Critical system configs
    if (name.includes('package.json') || 
        name.includes('dockerfile') ||
        path.includes('.github/workflows') ||
        name.includes('firebase') ||
        name.includes('env')) {
      return 'critical';
    }
    
    // Build and deployment
    if (path.includes('docker') ||
        path.includes('.github') ||
        path.includes('aws') ||
        path.includes('deploy') ||
        name.includes('build') ||
        name.includes('webpack') ||
        name.includes('vite')) {
      return 'buildDeploy';
    }
    
    // Database configs
    if (name.includes('database') ||
        name.includes('firebase') ||
        name.includes('mongo') ||
        name.includes('rules') ||
        name.includes('schema')) {
      return 'database';
    }
    
    // Security configs
    if (name.includes('auth') ||
        name.includes('security') ||
        name.includes('jwt') ||
        name.includes('cert') ||
        name.includes('key') ||
        name.includes('credential')) {
      return 'security';
    }
    
    // Cloud configs
    if (path.includes('aws') ||
        name.includes('cloudfront') ||
        name.includes('s3') ||
        name.includes('ec2') ||
        name.includes('lambda') ||
        name.includes('apprunner')) {
      return 'cloud';
    }
    
    return 'other';
  }

  async analyzeConfigContent(file) {
    try {
      const content = fs.readFileSync(file.path, 'utf8');
      const analysis = {
        type: 'unknown',
        description: '',
        keySettings: [],
        dependencies: [],
        security: false
      };
      
      // Determine file type and extract key information
      if (file.ext === '.json') {
        try {
          const json = JSON.parse(content);
          analysis.type = 'JSON Configuration';
          
          // Analyze JSON structure
          if (json.rules) {
            analysis.description = 'Firebase Database Rules';
            analysis.security = true;
            analysis.keySettings = Object.keys(json.rules);
          } else if (json.scripts) {
            analysis.description = 'NPM Package Configuration';
            analysis.keySettings = Object.keys(json.scripts);
            analysis.dependencies = Object.keys(json.dependencies || {});
          } else if (json.Version || json.Statement) {
            analysis.description = 'AWS Policy Document';
            analysis.security = true;
          } else if (json.version && json.buildDate) {
            analysis.description = 'Version Information';
          }
        } catch (e) {
          analysis.description = 'JSON file (parsing error)';
        }
      } else if (file.ext === '.yml' || file.ext === '.yaml') {
        analysis.type = 'YAML Configuration';
        if (content.includes('on:') && content.includes('jobs:')) {
          analysis.description = 'GitHub Actions Workflow';
        } else if (content.includes('version:') && content.includes('services:')) {
          analysis.description = 'Docker Compose Configuration';
        }
      } else if (file.name === 'Dockerfile') {
        analysis.type = 'Docker Configuration';
        analysis.description = 'Container Build Instructions';
        const lines = content.split('\n');
        analysis.keySettings = lines
          .filter(line => line.trim().startsWith('FROM') || 
                         line.trim().startsWith('EXPOSE') ||
                         line.trim().startsWith('ENV'))
          .map(line => line.trim().split(' ')[0]);
      }
      
      return analysis;
    } catch (error) {
      return {
        type: 'File',
        description: `Error reading file: ${error.message}`,
        keySettings: [],
        dependencies: [],
        security: false
      };
    }
  }

  async discoverConfigs() {
    console.log('⚡⚡⚡ WAVELENGTH CONFIG DISCOVERY ACTIVATED! ⚡⚡⚡\n');
    console.log('🔍 Scanning entire project for configuration files...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Scan all files
    const allFiles = await this.scanDirectory();
    console.log(`📊 Scanned ${allFiles.length} files total`);
    
    // Filter to config files
    const configFiles = allFiles.filter(file => this.isConfigFile(file));
    console.log(`🎯 Found ${configFiles.length} configuration files\n`);
    
    // Categorize and analyze each config
    for (const file of configFiles) {
      const category = this.categorizeConfig(file);
      const analysis = await this.analyzeConfigContent(file);
      
      this.discoveredConfigs[category].push({
        ...file,
        ...analysis,
        category
      });
    }
    
    return this.discoveredConfigs;
  }

  generateConfigDocumentation() {
    const timestamp = new Date().toISOString().split('T')[0];
    
    let doc = `# 🌊 WAVELENGTH Configuration Discovery Report
Generated: ${timestamp}

## 📋 Configuration File Inventory

This document catalogs all configuration files in the Wavelength project for enhanced discoverability by developers and AI agents.

`;

    // Summary section
    const totalConfigs = Object.values(this.discoveredConfigs)
      .reduce((sum, category) => sum + category.length, 0);
    
    doc += `### 📊 Summary
- **Total Configuration Files**: ${totalConfigs}
- **Critical System Configs**: ${this.discoveredConfigs.critical.length}
- **Build/Deploy Configs**: ${this.discoveredConfigs.buildDeploy.length}
- **Database Configs**: ${this.discoveredConfigs.database.length}
- **Security Configs**: ${this.discoveredConfigs.security.length}
- **Cloud Configs**: ${this.discoveredConfigs.cloud.length}
- **Other Configs**: ${this.discoveredConfigs.other.length}

`;

    // Detailed sections for each category
    const categoryDescriptions = {
      critical: '🔴 Critical System Configuration',
      buildDeploy: '🚀 Build & Deployment Configuration', 
      database: '💾 Database & Storage Configuration',
      security: '🔒 Security & Authentication Configuration',
      cloud: '☁️ Cloud & AWS Configuration',
      other: '📁 Other Configuration Files'
    };

    Object.entries(this.discoveredConfigs).forEach(([category, configs]) => {
      if (configs.length === 0) return;
      
      doc += `## ${categoryDescriptions[category]}\n\n`;
      
      configs.forEach(config => {
        doc += `### \`${config.path}\`\n`;
        doc += `- **Type**: ${config.type}\n`;
        doc += `- **Description**: ${config.description}\n`;
        doc += `- **Size**: ${(config.size / 1024).toFixed(1)}KB\n`;
        doc += `- **Modified**: ${config.modified.toLocaleDateString()}\n`;
        
        if (config.security) {
          doc += `- **⚠️ Security Sensitive**: Yes\n`;
        }
        
        if (config.keySettings && config.keySettings.length > 0) {
          doc += `- **Key Settings**: ${config.keySettings.slice(0, 5).join(', ')}${config.keySettings.length > 5 ? '...' : ''}\n`;
        }
        
        if (config.dependencies && config.dependencies.length > 0) {
          doc += `- **Dependencies**: ${config.dependencies.slice(0, 3).join(', ')}${config.dependencies.length > 3 ? '...' : ''}\n`;
        }
        
        doc += '\n';
      });
    });

    // AI Agent Quick Reference
    doc += `## 🤖 AI Agent Quick Reference

### Most Important Configs for AI Agents:

#### 🔴 Always Check First:
`;
    
    this.discoveredConfigs.critical.forEach(config => {
      doc += `- \`${config.path}\` - ${config.description}\n`;
    });

    doc += `
#### 🚀 For Build/Deploy Issues:
`;
    
    this.discoveredConfigs.buildDeploy.slice(0, 5).forEach(config => {
      doc += `- \`${config.path}\` - ${config.description}\n`;
    });

    doc += `
#### 💾 For Database Issues:
`;
    
    this.discoveredConfigs.database.forEach(config => {
      doc += `- \`${config.path}\` - ${config.description}\n`;
    });

    doc += `
### 🔍 Discovery Commands:
\`\`\`bash
# Find all config files
find . -name "*.json" -o -name "*.yml" -o -name "*.yaml" | head -20

# Search for specific config patterns
grep -r "firebase\\|aws\\|docker" --include="*.json" .

# Check recent config changes
git log --oneline --since="1 week ago" -- "*.json" "*.yml" "*.yaml"
\`\`\`

### 🌊 WAVELENGTH Discovery Tools:
\`\`\`bash
# Run config discovery scan
node wavelength-tools/wavelength-config-discovery.js

# Quick config file listing
node wavelength-tools/wavelength-config-quick-scan.js
\`\`\`

---
*Generated by WAVELENGTH Config Discovery Super Power*
*For updates, run the discovery tool again*
`;

    return doc;
  }

  async generateQuickScanTool() {
    const quickScanCode = `#!/usr/bin/env node

/**
 * 🌊 WAVELENGTH CONFIG QUICK SCAN
 * Fast listing of all configuration files
 */

const fs = require('fs');
const path = require('path');

function quickScan(dir = '.', depth = 0) {
  if (depth > 3) return [];
  
  const configs = [];
  
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative('.', fullPath);
      
      if (entry.isDirectory() && !['node_modules', '.git', 'dist'].includes(entry.name)) {
        configs.push(...quickScan(fullPath, depth + 1));
      } else if (entry.isFile()) {
        const name = entry.name.toLowerCase();
        if (name.includes('config') || 
            name.endsWith('.json') || 
            name.endsWith('.yml') || 
            name.endsWith('.yaml') ||
            name.includes('docker') ||
            name.includes('firebase') ||
            name.includes('aws') ||
            relativePath.includes('.github')) {
          configs.push(relativePath);
        }
      }
    }
  } catch (error) {
    // Skip inaccessible directories
  }
  
  return configs;
}

console.log('🔍 WAVELENGTH Quick Config Scan\\n');
const configs = quickScan().sort();
console.log(\`Found \${configs.length} configuration files:\\n\`);
configs.forEach(config => console.log(\`  📄 \${config}\`));
`;

    fs.writeFileSync('wavelength-tools/wavelength-config-quick-scan.js', quickScanCode);
    console.log('✅ Created quick scan tool: wavelength-tools/wavelength-config-quick-scan.js');
  }

  async runDiscovery() {
    const configs = await this.discoverConfigs();
    
    // Generate comprehensive documentation
    const documentation = this.generateConfigDocumentation();
    
    // Write documentation files
    fs.writeFileSync('docs/WAVELENGTH_CONFIG_DISCOVERY.md', documentation);
    console.log('✅ Created comprehensive config documentation: docs/WAVELENGTH_CONFIG_DISCOVERY.md');
    
    // Create quick scan tool
    await this.generateQuickScanTool();
    
    // Display summary
    console.log('\n🏁 WAVELENGTH CONFIG DISCOVERY COMPLETE!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('📊 DISCOVERY SUMMARY:');
    Object.entries(configs).forEach(([category, items]) => {
      if (items.length > 0) {
        console.log(`   ${category}: ${items.length} files`);
      }
    });
    
    console.log('\n🎯 KEY FINDINGS:');
    
    // Highlight important configs
    const critical = configs.critical;
    if (critical.length > 0) {
      console.log('🔴 CRITICAL CONFIGS FOUND:');
      critical.forEach(config => {
        console.log(`   • ${config.path} - ${config.description}`);
      });
    }
    
    const security = [...configs.security, ...configs.critical.filter(c => c.security)];
    if (security.length > 0) {
      console.log('\\n🔒 SECURITY-SENSITIVE CONFIGS:');
      security.forEach(config => {
        console.log(`   • ${config.path} - ${config.description}`);
      });
    }
    
    console.log('\\n🌊 ENHANCED DISCOVERABILITY ACHIEVED!');
    console.log('   ✅ Comprehensive documentation generated');
    console.log('   ✅ Quick scan tool created');
    console.log('   ✅ AI agent reference guide included');
    console.log('   ✅ Configuration categorization complete');
  }
}

// EXECUTE WAVELENGTH CONFIG DISCOVERY!
const discovery = new WavelengthConfigDiscovery();
discovery.runDiscovery().catch(error => {
  console.error('💥 WAVELENGTH CONFIG DISCOVERY ERROR:', error.message);
  process.exit(1);
});