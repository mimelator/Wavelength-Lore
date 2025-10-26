#!/usr/bin/env node

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

console.log('🔍 WAVELENGTH Quick Config Scan\n');
const configs = quickScan().sort();
console.log(`Found ${configs.length} configuration files:\n`);
configs.forEach(config => console.log(`  📄 ${config}`));
