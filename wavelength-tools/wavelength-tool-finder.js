#!/usr/bin/env node
/**
 * 🌊⚡ WAVELENGTH TOOL FINDER ⚡🌊
 * USAGE: node wavelength-tools/wavelength-tool-finder.js [keyword]
 */

const fs = require('fs');
const keyword = process.argv[2] || '';

console.log('🔍 WAVELENGTH TOOL FINDER\n');

if (!keyword) {
  console.log('📋 AVAILABLE TOOL CATEGORIES:');
  console.log('   🧪 testing - Test runners and validation');
  console.log('   🐳 docker - Container and build tools');
  console.log('   ⚙️ config - Configuration management');
  console.log('   🚀 deploy - Deployment and monitoring');
  console.log('   🧠 ai - AI context and intelligence');
  console.log('\n💡 Usage: node wavelength-tools/wavelength-tool-finder.js [category]');
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

console.log(`🎯 TOOLS FOR: ${keyword.toUpperCase()}\n`);
const matches = tools[keyword.toLowerCase()] || [];
if (matches.length > 0) {
  matches.forEach(tool => console.log(`   🛠️ ${tool}`));
} else {
  console.log('❌ No tools found. Try: testing, docker, config, deploy, or ai');
}