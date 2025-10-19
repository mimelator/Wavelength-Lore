#!/usr/bin/env node

/**
 * Fix All Template Image URLs
 * 
 * This script finds and fixes all image URLs in EJS templates to use the CDN_URL prefix
 */

const fs = require('fs').promises;
const path = require('path');

const templatesDir = path.join(__dirname, '..', 'views');

// Pattern to find image src attributes without cdnUrl prefix
const patterns = [
  {
    // Standard img src patterns
    regex: /(<img\s+[^>]*src=")<%= (?!cdnUrl)([^"]+\.(?:image|image_gallery\[\d+\]|episodes\[[^\]]+\]\.image)) %>/g,
    replacement: '$1<%= cdnUrl %><%= $2 %>'
  },
  {
    // Background image styles
    regex: /(background-image:\s*url\(['"])<%= (?!cdnUrl)([^'"]+\.image) %>/g,
    replacement: '$1<%= cdnUrl %><%= $2 %>'
  },
  {
    // Data attributes
    regex: /(data-fullsize=")<%= (?!cdnUrl)([^"]+) %>/g,
    replacement: '$1<%= cdnUrl %><%= $2 %>'
  }
];

async function fixTemplateFile(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    let changed = false;
    
    for (const pattern of patterns) {
      const oldContent = content;
      content = content.replace(pattern.regex, pattern.replacement);
      if (content !== oldContent) {
        changed = true;
      }
    }
    
    if (changed) {
      await fs.writeFile(filePath, content);
      console.log(`✅ Fixed: ${path.relative(templatesDir, filePath)}`);
      return true;
    } else {
      console.log(`⏭️  No changes needed: ${path.relative(templatesDir, filePath)}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error);
    return false;
  }
}

async function findTemplateFiles(dir) {
  const files = [];
  
  async function scan(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        await scan(fullPath);
      } else if (entry.name.endsWith('.ejs')) {
        files.push(fullPath);
      }
    }
  }
  
  await scan(dir);
  return files;
}

async function main() {
  console.log('🔍 Finding all EJS template files...\n');
  
  try {
    const templateFiles = await findTemplateFiles(templatesDir);
    console.log(`Found ${templateFiles.length} template files\n`);
    
    let fixedCount = 0;
    
    for (const filePath of templateFiles) {
      const wasFixed = await fixTemplateFile(filePath);
      if (wasFixed) {
        fixedCount++;
      }
    }
    
    console.log(`\n🎉 Summary:`);
    console.log(`   Total templates: ${templateFiles.length}`);
    console.log(`   Fixed templates: ${fixedCount}`);
    console.log(`   No changes needed: ${templateFiles.length - fixedCount}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();