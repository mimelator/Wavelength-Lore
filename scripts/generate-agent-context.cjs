#!/usr/bin/env node

/**
 * Generate WAVELENGTH Agent Context
 * Scans available tools and creates injection context
 */

const fs = require('fs');
const path = require('path');

function scanTools() {
  const tools = [];
  
  // Scan unified tools
  const unifiedDir = 'scripts/unified';
  if (fs.existsSync(unifiedDir)) {
    fs.readdirSync(unifiedDir).forEach(file => {
      if (file.endsWith('.js')) {
        tools.push(`node scripts/unified/${file}`);
      }
    });
  }
  
  // Scan wavelength tools
  const wavelengthDir = 'wavelength-tools';
  if (fs.existsSync(wavelengthDir)) {
    fs.readdirSync(wavelengthDir).forEach(file => {
      if (file.endsWith('.js')) {
        tools.push(`node wavelength-tools/${file}`);
      }
    });
  }
  
  // Scan organized tools
  const organizedDir = 'scripts/organized/development-tools';
  if (fs.existsSync(organizedDir)) {
    fs.readdirSync(organizedDir).forEach(file => {
      if (file.endsWith('.cjs')) {
        tools.push(`node scripts/organized/development-tools/${file}`);
      }
    });
  }
  
  return tools;
}

const tools = scanTools();
const context = `# 🌊⚡ WAVELENGTH AGENT CONTEXT ⚡🌊

**AVAILABLE TOOLS (${tools.length} found):**
${tools.map(tool => `- ${tool}`).join('\n')}

**MANDATORY WORKFLOW:**
1. Query memory: \`node scripts/query-memory.js "tools for [task]"\`
2. Use existing tools from list above
3. Only create new tools if nothing exists

**CONDITIONING BREAK:**
- ❌ executeBash without memory check
- ✅ Memory-first tool discovery
`;

fs.writeFileSync('.wavelength-agent-context.md', context);
console.log(`✅ Generated context with ${tools.length} tools`);