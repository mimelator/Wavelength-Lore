#!/usr/bin/env node

/**
 * 🌊 WAVELENGTH ROOT DIRECTORY ORGANIZER SUPER POWER
 * Comprehensive root cleanup using PURE WAVELENGTH METHODOLOGY!
 * NO SHELL DEPENDENCIES - MAXIMUM ORGANIZATION POWER!
 */

const fs = require('fs');
const path = require('path');

class WavelengthDirectoryOrganizer {
  constructor() {
    this.rootPath = process.cwd();
    this.organizationPlan = {
      'wavelength-tools/': {
        description: 'All WAVELENGTH super tools and utilities',
        patterns: [
          /^wavelength-.*\.js$/,
          /^execute-.*\.js$/,
          /^test-.*\.js$/,
          /^debug-.*\.js$/,
          'direct-super-power-test.js',
          'mcp-test-execution.js',
          'temp-health-check.js'
        ]
      },
      'documentation/maintenance/': {
        description: 'Maintenance and analysis documentation',
        patterns: [
          /.*_ANALYSIS\.md$/,
          /.*_AUDIT\.md$/,
          /.*_SUMMARY\.md$/,
          /.*_REPORT\.md$/,
          'CODING WITH AI.MD',
          'CRITICAL_REMINDERS.md',
          'DEPLOYMENT-GUIDE.md',
          'maintenance-report.md',
          'commit-message.txt'
        ]
      },
      'documentation/achievements/': {
        description: 'Project achievements and milestones',
        patterns: [
          /.*_ACHIEVEMENT\.md$/,
          /.*_COMPLETE\.md$/,
          /.*_SUCCESS.*\.md$/,
          'LORE_MANAGEMENT_ACHIEVEMENT.md',
          'MAP_SUCCESS_SUMMARY.md',
          'WAVELENGTH_GEMS_TESTING_COMPLETE.md'
        ]
      },
      'documentation/testing/': {
        description: 'Testing documentation and results',
        patterns: [
          'BROWSER_TEST_RESULTS.md',
          'TEST_RESULTS.md',
          'TIERED_PRODUCT_FLOW_TEST_RESULTS.md',
          'TEST_SUITE_RATIONALIZATION_PLAN.md',
          'MERCHANDISE_ISSUE_TESTING.md'
        ]
      },
      'documentation/integration/': {
        description: 'Integration and system documentation',
        patterns: [
          'ADVANCED_LINK_SYSTEM.md',
          'FULL_CATALOG_INTEGRATION.md',
          'TIERED_PRODUCT_INTEGRATION.md',
          'WORLD_MAP_INTEGRATION_CONTEXT.md'
        ]
      },
      'logs/': {
        description: 'All log files and test outputs',
        patterns: [
          /.*\.log$/,
          'server.log',
          '.server.log'
        ]
      },
      'proof/': {
        description: 'Screenshots and proof images',
        patterns: [
          /.*-proof\.png$/,
          /.*-test-proof\.png$/,
          'debug-product-mapping-proof.png'
        ]
      },
      'backup/': {
        description: 'Backup files and restore points',
        patterns: [
          /.*\.backup$/,
          /.*\.bak$/,
          'GOOD-PACKAGE-JSON-RESTORE-THIS.backup',
          /HEALTHY-.*\.backup\..*$/
        ]
      },
      'temp-files/': {
        description: 'Temporary files and quick scripts',
        patterns: [
          'quick-html-check.js',
          'generate-test-products.js',
          'cleanup.sh',
          'commit.sh',
          'dev-terminal.sh',
          'isolated-run.sh',
          'run-merch-tests.sh'
        ]
      },
      'docker/': {
        description: 'Docker related files',
        patterns: [
          'Dockerfile.fixed',
          'docker-start.sh'
        ]
      }
    };
    
    this.filesToAnalyze = [];
    this.organizationActions = [];
  }

  async analyzeRootDirectory() {
    console.log('🔍 WAVELENGTH: Analyzing root directory clutter...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const items = fs.readdirSync(this.rootPath);
    let clutterCount = 0;
    let organizableCount = 0;

    console.log('📊 ROOT DIRECTORY ANALYSIS:');
    
    // Categorize items
    const categories = {
      'Core Application': [],
      'Configuration': [],
      'Documentation': [],
      'WAVELENGTH Tools': [],
      'Logs & Temp': [],
      'Proof & Screenshots': [],
      'Backups': [],
      'Hidden/System': [],
      'Directories': []
    };

    items.forEach(item => {
      const itemPath = path.join(this.rootPath, item);
      const isDirectory = fs.statSync(itemPath).isDirectory();
      
      if (isDirectory) {
        categories['Directories'].push(item);
        return;
      }

      if (item.startsWith('.')) {
        categories['Hidden/System'].push(item);
      } else if (item.startsWith('wavelength-') || item.startsWith('execute-') || item.startsWith('test-') || item.startsWith('debug-')) {
        categories['WAVELENGTH Tools'].push(item);
        organizableCount++;
      } else if (item.endsWith('.md') && item.includes('_')) {
        categories['Documentation'].push(item);
        organizableCount++;
      } else if (item.endsWith('.log') || item.includes('quick-') || item.endsWith('.sh')) {
        categories['Logs & Temp'].push(item);
        organizableCount++;
      } else if (item.includes('proof') || item.endsWith('-proof.png')) {
        categories['Proof & Screenshots'].push(item);
        organizableCount++;
      } else if (item.includes('backup') || item.endsWith('.bak')) {
        categories['Backups'].push(item);
        organizableCount++;
      } else if (['app.js', 'index.js', 'package.json', 'Dockerfile', 'README.md', 'LICENSE'].includes(item)) {
        categories['Core Application'].push(item);
      } else if (item.startsWith('.env') || item.endsWith('.json') || item.endsWith('.config.js')) {
        categories['Configuration'].push(item);
      } else {
        clutterCount++;
        this.filesToAnalyze.push(item);
      }
    });

    // Report analysis
    Object.entries(categories).forEach(([category, items]) => {
      if (items.length > 0) {
        console.log(`\n📁 ${category} (${items.length} items):`);
        items.slice(0, 5).forEach(item => {
          console.log(`   • ${item}`);
        });
        if (items.length > 5) {
          console.log(`   ... and ${items.length - 5} more`);
        }
      }
    });

    console.log(`\n🔢 CLUTTER STATISTICS:`);
    console.log(`   📊 Total items in root: ${items.length}`);
    console.log(`   🗂️ Directories: ${categories['Directories'].length}`);
    console.log(`   ⚡ WAVELENGTH tools: ${categories['WAVELENGTH Tools'].length}`);
    console.log(`   📝 Documentation files: ${categories['Documentation'].length}`);
    console.log(`   🗑️ Organizeable items: ${organizableCount}`);
    console.log(`   ❓ Unclassified items: ${clutterCount}`);

    return {
      totalItems: items.length,
      organizableItems: organizableCount,
      clutterLevel: clutterCount > 10 ? 'SEVERE' : clutterCount > 5 ? 'MODERATE' : 'LIGHT'
    };
  }

  async generateOrganizationPlan() {
    console.log('\n🛠️ WAVELENGTH: Generating organization plan...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📋 PROPOSED ORGANIZATION STRUCTURE:');
    
    Object.entries(this.organizationPlan).forEach(([directory, config]) => {
      console.log(`\n📁 ${directory}`);
      console.log(`   📋 ${config.description}`);
      
      const matchingFiles = this.findMatchingFiles(config.patterns);
      if (matchingFiles.length > 0) {
        console.log(`   📄 Files to move (${matchingFiles.length}):`);
        matchingFiles.slice(0, 3).forEach(file => {
          console.log(`      • ${file}`);
        });
        if (matchingFiles.length > 3) {
          console.log(`      ... and ${matchingFiles.length - 3} more`);
        }
      } else {
        console.log(`   📄 No matching files found`);
      }
    });

    console.log('\n🎯 ORGANIZATION BENEFITS:');
    console.log('✅ Cleaner root directory');
    console.log('✅ Logical file grouping');
    console.log('✅ Easier navigation and maintenance');
    console.log('✅ Better project structure');
    console.log('✅ Preserved WAVELENGTH super tools');
  }

  findMatchingFiles(patterns) {
    const items = fs.readdirSync(this.rootPath);
    const matches = [];

    items.forEach(item => {
      const itemPath = path.join(this.rootPath, item);
      if (fs.statSync(itemPath).isDirectory()) return;

      patterns.forEach(pattern => {
        if (typeof pattern === 'string') {
          if (item === pattern) {
            matches.push(item);
          }
        } else if (pattern instanceof RegExp) {
          if (pattern.test(item)) {
            matches.push(item);
          }
        }
      });
    });

    return [...new Set(matches)]; // Remove duplicates
  }

  async generateCleanupScript() {
    console.log('\n🚀 WAVELENGTH: Generating cleanup script...');
    
    let script = `#!/usr/bin/env node

/**
 * 🌊 WAVELENGTH ROOT DIRECTORY CLEANUP EXECUTOR
 * AUTO-GENERATED cleanup script using pure WAVELENGTH methodology
 */

const fs = require('fs');
const path = require('path');

console.log('🌊 WAVELENGTH: Executing root directory organization...');

const moves = [
`;

    Object.entries(this.organizationPlan).forEach(([directory, config]) => {
      const matchingFiles = this.findMatchingFiles(config.patterns);
      if (matchingFiles.length > 0) {
        script += `  // ${config.description}\n`;
        matchingFiles.forEach(file => {
          script += `  ['${file}', '${directory}'],\n`;
        });
        script += `\n`;
      }
    });

    script += `];

// Create directories and move files
moves.forEach(([file, targetDir]) => {
  try {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
      console.log(\`📁 Created directory: \${targetDir}\`);
    }
    
    if (fs.existsSync(file)) {
      const targetPath = path.join(targetDir, file);
      fs.renameSync(file, targetPath);
      console.log(\`✅ Moved \${file} -> \${targetPath}\`);
    }
  } catch (error) {
    console.error(\`❌ Error moving \${file}:\`, error.message);
  }
});

console.log('🎉 WAVELENGTH root directory organization complete!');
`;

    fs.writeFileSync('wavelength-directory-organizer.js', script);
    console.log('✅ Generated: wavelength-directory-organizer.js');
  }

  async runAnalysis() {
    console.log('⚡⚡⚡ WAVELENGTH DIRECTORY ORGANIZER ACTIVATED! ⚡⚡⚡\n');
    
    const analysis = await this.analyzeRootDirectory();
    await this.generateOrganizationPlan();
    await this.generateCleanupScript();
    
    console.log('\n🏁 WAVELENGTH DIRECTORY ANALYSIS COMPLETE!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🔍 Clutter Level: ${analysis.clutterLevel}`);
    console.log(`📊 Organizeable Items: ${analysis.organizableItems}`);
    console.log('🚀 Cleanup script generated: wavelength-directory-organizer.js');
    console.log('\n⚡ Run the cleanup script to organize the root directory!');
    
    return analysis;
  }
}

// EXECUTE WAVELENGTH DIRECTORY ORGANIZATION ANALYSIS!
const organizer = new WavelengthDirectoryOrganizer();
organizer.runAnalysis().catch(error => {
  console.error('💥 WAVELENGTH ORGANIZATION ERROR:', error.message);
  process.exit(1);
});