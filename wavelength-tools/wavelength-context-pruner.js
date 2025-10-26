#!/usr/bin/env node

/**
 * 🌊⚡ WAVELENGTH CONTEXT PRUNER & DISCOVERER ⚡🌊
 * 
 * MISSION: Drastically prune context and make information discoverable on demand
 * SOLVES: Information overload in development environment
 */

const fs = require('fs');
const path = require('path');

console.log('🌊⚡ WAVELENGTH CONTEXT PRUNER ACTIVATED! ⚡🌊\n');

class WavelengthContextPruner {
  constructor() {
    this.contextFiles = [];
    this.pruneActions = [];
    this.discoveryIndex = {};
  }

  async analyzeCurrentContext() {
    console.log('🔍 ANALYZING CURRENT CONTEXT OVERLOAD...\n');
    
    // Find all documentation and context files
    const docTypes = [
      { pattern: '**/*QUICKSTART*.md', category: 'quickstart' },
      { pattern: '**/*GUIDE*.md', category: 'guides' },
      { pattern: '**/*README*.md', category: 'readme' },
      { pattern: '**/*REFERENCE*.md', category: 'reference' },
      { pattern: '**/*CONTEXT*.md', category: 'context' },
      { pattern: 'docs/**/*.md', category: 'documentation' },
      { pattern: 'wavelength-tools/**/*.js', category: 'tools' }
    ];

    const heavyFiles = [
      'WAVELENGTH_DEVELOPER_QUICKSTART.md',
      'docs/WAVELENGTH_SUPER_TOOLS_AGENT_CALLING_METHODS.md',
      'docs/WAVELENGTH_SUPER_POWER_ROADMAP.md',
      'docs/FRICTION_FREE_SESSION_STARTUP.md',
      'docs/MAXIMIZING_AI_CONTEXT_MANAGER.md',
      'AI_COPILOT_WAVELENGTH_QUICK_REFERENCE.md',
      'SESSION_STARTUP_README.md'
    ];

    console.log('📊 CONTEXT OVERLOAD ANALYSIS:');
    
    let totalSize = 0;
    heavyFiles.forEach(file => {
      if (fs.existsSync(file)) {
        const stats = fs.statSync(file);
        const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
        console.log(`   📄 ${file}: ${sizeMB}MB`);
        totalSize += stats.size;
        
        this.contextFiles.push({
          file,
          size: stats.size,
          category: this.categorizeFile(file)
        });
      }
    });

    const totalMB = (totalSize / 1024 / 1024).toFixed(2);
    console.log(`\n💾 TOTAL CONTEXT SIZE: ${totalMB}MB`);
    console.log(`🚨 ISSUE: ${heavyFiles.length} heavy documentation files creating context overload`);
    
    return this.contextFiles;
  }

  categorizeFile(filename) {
    if (filename.includes('QUICKSTART')) return 'quickstart';
    if (filename.includes('GUIDE') || filename.includes('CALLING_METHODS')) return 'guides';
    if (filename.includes('REFERENCE')) return 'reference';
    if (filename.includes('ROADMAP')) return 'roadmap';
    if (filename.includes('README')) return 'readme';
    return 'documentation';
  }

  async createDiscoveryIndex() {
    console.log('\n🗂️ CREATING DISCOVERY INDEX...\n');
    
    const discoveryIndex = {
      quickAccess: {
        sessionStart: 'node start-wavelength-session.js',
        sessionStatus: 'node session-status.js',
        aiContext: 'node wavelength-tools/wavelength-ai-context-manager-enhanced.js',
        testRunner: 'node scripts/unified/test-runner.js --help'
      },
      documentation: {
        quickstart: 'WAVELENGTH_MINI_QUICKSTART.md',
        fullGuides: 'node wavelength-tools/wavelength-doc-discoverer.js',
        toolReference: 'node wavelength-tools/wavelength-tool-finder.js [query]',
        troubleshooting: 'node wavelength-tools/wavelength-help-finder.js [issue]'
      },
      tools: {
        discover: 'ls wavelength-tools/ | grep ".js"',
        unified: 'ls scripts/unified/',
        findTool: 'node wavelength-tools/wavelength-tool-finder.js [keyword]'
      },
      emergency: {
        dockerIssues: 'node wavelength-tools/wavelength-docker-build-validator.js',
        buildFailures: 'node wavelength-tools/wavelength-enhanced-build-monitor.js',
        configProblems: 'node wavelength-tools/wavelength-config-discovery.js'
      }
    };

    // Save discovery index
    fs.writeFileSync('.wavelength-discovery-index.json', JSON.stringify(discoveryIndex, null, 2));
    console.log('✅ Discovery index created: .wavelength-discovery-index.json');
    
    return discoveryIndex;
  }

  async createMiniQuickstart() {
    console.log('\n📝 CREATING STREAMLINED MINI QUICKSTART...\n');
    
    const miniQuickstart = `# 🌊⚡ WAVELENGTH MINI QUICKSTART ⚡🌊

## 🚀 **INSTANT START (3 Commands)**
\`\`\`bash
# 1. Launch friction-free session
node start-wavelength-session.js

# 2. Check what's available
node session-status.js

# 3. Run comprehensive tests
node scripts/unified/test-runner.js health --url https://wavelengthlore.com
\`\`\`

## 🧠 **MCP TOOLS (Direct Agent Access)**
\`\`\`javascript
// Agents call directly via MCP protocol:
await mcp.callTool("wavelength_validate", {content: "...", type: "character"});
await mcp.callTool("firebase_query", {path: "/episodes", operation: "read"});
\`\`\`

## 🛠️ **CORE TOOLS**
- **Tests:** \`node scripts/unified/test-runner.js [command]\`
- **AWS:** \`node scripts/unified/aws-manager.js [operation]\`
- **Deploy:** \`node scripts/unified/deployment-manager.js [action]\`
- **Commit:** \`node scripts/unified/smart-commit.js\`

## 🔍 **DISCOVER MORE ON DEMAND**
\`\`\`bash
# Find specific tools
node wavelength-tools/wavelength-tool-finder.js [keyword]

# Get help for any issue
node wavelength-tools/wavelength-help-finder.js [problem]

# View full documentation
node wavelength-tools/wavelength-doc-discoverer.js
\`\`\`

## 🚨 **EMERGENCY FIXES**
- Docker: \`node wavelength-tools/wavelength-docker-build-validator.js\`
- Config: \`node wavelength-tools/wavelength-config-discovery.js\`
- Build: \`node wavelength-tools/wavelength-enhanced-build-monitor.js\`

---
**🌊 Need more? Use discovery tools above to find detailed guides on demand! ⚡**`;

    fs.writeFileSync('WAVELENGTH_MINI_QUICKSTART.md', miniQuickstart);
    console.log('✅ Mini quickstart created: WAVELENGTH_MINI_QUICKSTART.md');
  }

  async createDiscoveryTools() {
    console.log('\n🔧 CREATING ON-DEMAND DISCOVERY TOOLS...\n');
    
    // Tool Finder
    const toolFinder = `#!/usr/bin/env node
/**
 * 🌊⚡ WAVELENGTH TOOL FINDER ⚡🌊
 * USAGE: node wavelength-tools/wavelength-tool-finder.js [keyword]
 */

const fs = require('fs');
const keyword = process.argv[2] || '';

console.log('🔍 WAVELENGTH TOOL FINDER\\n');

if (!keyword) {
  console.log('📋 AVAILABLE TOOL CATEGORIES:');
  console.log('   🧪 testing - Test runners and validation');
  console.log('   🐳 docker - Container and build tools');
  console.log('   ⚙️ config - Configuration management');
  console.log('   🚀 deploy - Deployment and monitoring');
  console.log('   🧠 ai - AI context and intelligence');
  console.log('\\n💡 Usage: node wavelength-tools/wavelength-tool-finder.js [category]');
  process.exit(0);
}

const tools = {
  testing: [
    'scripts/unified/test-runner.js - Comprehensive testing suite',
    'wavelength-tools/wavelength-docker-build-validator.js - Docker build validation'
  ],
  docker: [
    'wavelength-tools/wavelength-docker-path-fixer.js - Fix Docker build paths',
    'wavelength-tools/wavelength-docker-build-validator.js - Validate Docker builds'
  ],
  config: [
    'wavelength-tools/wavelength-config-discovery.js - Discover all config files',
    'wavelength-tools/wavelength-missing-config-fixer.js - Fix missing configs'
  ],
  deploy: [
    'scripts/unified/deployment-manager.js - Deployment management',
    'wavelength-tools/wavelength-enhanced-build-monitor.js - Build monitoring'
  ],
  ai: [
    'wavelength-tools/wavelength-ai-context-manager.js - AI context analysis',
    'wavelength-tools/wavelength-session-startup.js - Smart session startup'
  ]
};

console.log(\`🎯 TOOLS FOR: \${keyword.toUpperCase()}\\n\`);
const matches = tools[keyword.toLowerCase()] || [];
if (matches.length > 0) {
  matches.forEach(tool => console.log(\`   🛠️ \${tool}\`));
} else {
  console.log('❌ No tools found. Try: testing, docker, config, deploy, or ai');
}`;

    fs.writeFileSync('wavelength-tools/wavelength-tool-finder.js', toolFinder);
    fs.chmodSync('wavelength-tools/wavelength-tool-finder.js', '755');
    
    // Help Finder
    const helpFinder = `#!/usr/bin/env node
/**
 * 🌊⚡ WAVELENGTH HELP FINDER ⚡🌊
 * USAGE: node wavelength-tools/wavelength-help-finder.js [issue]
 */

const issue = process.argv[2] || '';

console.log('🆘 WAVELENGTH HELP FINDER\\n');

const solutions = {
  'build-failure': 'node wavelength-tools/wavelength-enhanced-build-monitor.js',
  'docker-error': 'node wavelength-tools/wavelength-docker-build-validator.js',
  'config-missing': 'node wavelength-tools/wavelength-config-discovery.js',
  'test-failing': 'node scripts/unified/test-runner.js health --url https://wavelengthlore.com',
  'session-broken': 'node start-wavelength-session.js'
};

if (!issue) {
  console.log('🚨 COMMON ISSUES & SOLUTIONS:');
  Object.keys(solutions).forEach(problem => {
    console.log(\`   🔧 \${problem}: \${solutions[problem]}\`);
  });
} else {
  const solution = solutions[issue] || solutions[\`\${issue}-error\`] || solutions[\`\${issue}-failure\`];
  if (solution) {
    console.log(\`🎯 SOLUTION FOR: \${issue}\`);
    console.log(\`💻 RUN: \${solution}\`);
  } else {
    console.log(\`❌ No solution found for: \${issue}\`);
    console.log('💡 Try: build-failure, docker-error, config-missing, test-failing, session-broken');
  }
}`;

    fs.writeFileSync('wavelength-tools/wavelength-help-finder.js', helpFinder);
    fs.chmodSync('wavelength-tools/wavelength-help-finder.js', '755');
    
    console.log('✅ Discovery tools created:');
    console.log('   🔍 wavelength-tools/wavelength-tool-finder.js');
    console.log('   🆘 wavelength-tools/wavelength-help-finder.js');
  }

  async generatePruningPlan() {
    console.log('\n✂️ GENERATING CONTEXT PRUNING PLAN...\n');
    
    const pruningPlan = {
      keepMinimal: [
        'WAVELENGTH_MINI_QUICKSTART.md',
        'AI_COPILOT_QUICKSTART.txt',
        '.wavelength-discovery-index.json'
      ],
      moveToArchive: [
        'docs/WAVELENGTH_SUPER_TOOLS_AGENT_CALLING_METHODS.md',
        'docs/WAVELENGTH_SUPER_POWER_ROADMAP.md',
        'docs/FRICTION_FREE_SESSION_STARTUP.md',
        'docs/MAXIMIZING_AI_CONTEXT_MANAGER.md',
        'WAVELENGTH_DEVELOPER_QUICKSTART.md',
        'SESSION_STARTUP_README.md',
        'AI_COPILOT_WAVELENGTH_QUICK_REFERENCE.md'
      ],
      replaceWithDiscovery: [
        'Heavy documentation → discovery tools',
        'Long guides → on-demand access',
        'Reference materials → tool finder'
      ]
    };

    console.log('📋 PRUNING PLAN:');
    console.log('\\n✅ KEEP (Essential):');
    pruningPlan.keepMinimal.forEach(file => console.log(`   📄 ${file}`));
    
    console.log('\\n📦 MOVE TO ARCHIVE:');
    pruningPlan.moveToArchive.forEach(file => console.log(`   📁 ${file}`));
    
    console.log('\\n🔄 REPLACE WITH DISCOVERY:');
    pruningPlan.replaceWithDiscovery.forEach(change => console.log(`   ⚡ ${change}`));
    
    return pruningPlan;
  }

  async executePruning() {
    console.log('\\n🏁 WAVELENGTH CONTEXT PRUNING COMPLETE!\\n');
    console.log('📊 RESULTS:');
    console.log('   ✅ Mini quickstart created (streamlined)');
    console.log('   ✅ Discovery index generated (on-demand access)');
    console.log('   ✅ Tool finder created (smart discovery)');
    console.log('   ✅ Help finder created (problem solving)');
    
    console.log('\\n🎯 NEXT STEPS:');
    console.log('   1. Archive heavy documentation files');
    console.log('   2. Update session startup to use mini quickstart');
    console.log('   3. Test discovery tools');
    console.log('   4. Commit pruning changes');
    
    console.log('\\n🌊⚡ CONTEXT SUCCESSFULLY PRUNED AND DISCOVERABLE! ⚡🌊');
  }
}

// EXECUTE CONTEXT PRUNING
async function pruneContext() {
  const pruner = new WavelengthContextPruner();
  
  await pruner.analyzeCurrentContext();
  await pruner.createDiscoveryIndex();
  await pruner.createMiniQuickstart();
  await pruner.createDiscoveryTools();
  await pruner.generatePruningPlan();
  await pruner.executePruning();
}

pruneContext().catch(error => {
  console.error('💥 Context pruning error:', error.message);
  process.exit(1);
});