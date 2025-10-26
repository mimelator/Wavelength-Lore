#!/usr/bin/env node

/**
 * WAVELENGTH Comprehensive Knowledge Ingestion
 * Ingests scripts, documentation, and all knowledge sources
 */

import WavelengthVectorStorage from '../lib/vector-storage.js';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function ingestComprehensiveKnowledge() {
  console.log('📚 Ingesting WAVELENGTH Comprehensive Knowledge...\n');

  try {
    const vectorStorage = new WavelengthVectorStorage();
    await vectorStorage.initialize();

    let totalProcessed = 0;

    // 1. Ingest Documentation
    console.log('1️⃣ Ingesting Documentation...');
    const docFiles = findFiles('./docs', ['.md', '.txt']);
    totalProcessed += await ingestFiles(vectorStorage, docFiles, 'documentation');

    // 2. Ingest Scripts
    console.log('\n2️⃣ Ingesting Scripts...');
    const scriptFiles = findFiles('./scripts', ['.js', '.sh']);
    totalProcessed += await ingestFiles(vectorStorage, scriptFiles, 'script');

    // 3. Ingest Wavelength Tools
    console.log('\n3️⃣ Ingesting Wavelength Tools...');
    const toolFiles = findFiles('./wavelength-tools', ['.js']);
    totalProcessed += await ingestFiles(vectorStorage, toolFiles, 'wavelength_tool');

    // 4. Ingest MCP Servers
    console.log('\n4️⃣ Ingesting MCP Servers...');
    const mcpFiles = findFiles('./mcp', ['.js']);
    totalProcessed += await ingestFiles(vectorStorage, mcpFiles, 'mcp_server');

    // 5. Ingest Key Configuration Files
    console.log('\n5️⃣ Ingesting Configuration...');
    const configFiles = [
      './package.json',
      './Dockerfile',
      './WAVELENGTH_MINI_QUICKSTART.md',
      './README.md'
    ].filter(file => {
      try { return statSync(file).isFile(); } catch { return false; }
    });
    totalProcessed += await ingestFiles(vectorStorage, configFiles, 'configuration');

    console.log(`\n✅ Successfully ingested ${totalProcessed} knowledge sources`);
    
    // Test comprehensive knowledge
    console.log('\n🧪 Testing comprehensive knowledge...');
    const testQueries = [
      'Docker build scripts',
      'testing documentation',
      'AWS deployment guides',
      'MCP server setup',
      'package.json configuration'
    ];
    
    for (const query of testQueries) {
      const results = await vectorStorage.searchKnowledge(query, { limit: 2 });
      if (results.success && results.results.length > 0) {
        console.log(`✅ "${query}" → Found ${results.results.length} sources`);
      }
    }

    console.log('\n🎉 Comprehensive knowledge ingestion completed!');

  } catch (error) {
    console.error('❌ Comprehensive knowledge ingestion failed:', error);
    process.exit(1);
  }
}

function findFiles(dir, extensions) {
  const files = [];
  
  try {
    const items = readdirSync(dir);
    
    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        files.push(...findFiles(fullPath, extensions));
      } else if (stat.isFile() && extensions.includes(extname(item))) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // Directory doesn't exist, skip
  }
  
  return files;
}

async function ingestFiles(vectorStorage, files, type) {
  let processed = 0;
  
  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf8');
      
      // Skip very large files
      if (content.length > 50000) continue;
      
      const knowledge = {
        id: `wavelength_${type}_${file.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`,
        type: `wavelength_${type}`,
        content: `File: ${file}\n\n${content}`,
        tags: [
          'wavelength',
          type,
          ...extractTags(file, content)
        ],
        context: {
          file_path: file,
          file_type: extname(file),
          content_type: type,
          size: content.length
        },
        timestamp: new Date().toISOString()
      };

      await vectorStorage.storeKnowledge(knowledge);
      processed++;
      
      if (processed % 10 === 0) {
        console.log(`📊 Processed ${processed}/${files.length} ${type} files`);
      }
      
    } catch (error) {
      console.log(`⚠️ Skipped ${file}: ${error.message}`);
    }
  }
  
  console.log(`✅ Ingested ${processed} ${type} files`);
  return processed;
}

function extractTags(filePath, content) {
  const tags = [];
  const lowerContent = content.toLowerCase();
  const lowerPath = filePath.toLowerCase();
  
  // File type tags
  if (lowerPath.includes('docker')) tags.push('docker');
  if (lowerPath.includes('test')) tags.push('testing');
  if (lowerPath.includes('aws')) tags.push('aws');
  if (lowerPath.includes('deploy')) tags.push('deployment');
  if (lowerPath.includes('build')) tags.push('build');
  if (lowerPath.includes('mcp')) tags.push('mcp');
  
  // Content tags
  if (lowerContent.includes('firebase')) tags.push('firebase');
  if (lowerContent.includes('database')) tags.push('database');
  if (lowerContent.includes('production')) tags.push('production');
  if (lowerContent.includes('health')) tags.push('health');
  if (lowerContent.includes('validation')) tags.push('validation');
  if (lowerContent.includes('monitoring')) tags.push('monitoring');
  
  return tags;
}

ingestComprehensiveKnowledge();