#!/usr/bin/env node

/**
 * Add static/ prefix to all relative image paths in YAML content files
 * This script converts paths like /images/... to /static/images/...
 * to match the S3 bucket structure for CloudFront compatibility
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Define YAML files to update
const YAML_FILES = [
  'content/seasons/season1.yaml',
  'content/seasons/season2.yaml', 
  'content/seasons/season3.yaml',
  'content/seasons/season4.yaml',
  'content/characters/characters.yaml',
  'content/lore/lore.yaml'
];

function addStaticPrefixToYamlFiles() {
  console.log('🔧 Starting static prefix update for YAML files...');
  
  let totalUpdated = 0;
  let filesUpdated = 0;
  
  YAML_FILES.forEach(filePath => {
    const fullPath = path.resolve(filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return;
    }
    
    console.log(`\n📄 Processing: ${filePath}`);
    
    try {
      // Read and parse YAML file
      const yamlContent = fs.readFileSync(fullPath, 'utf8');
      const data = yaml.load(yamlContent);
      
      let fileUpdated = 0;
      
      // Function to recursively update image paths
      function updateImagePaths(obj, currentPath = '') {
        if (!obj || typeof obj !== 'object') return obj;
        
        const updated = Array.isArray(obj) ? [] : {};
        
        for (const [key, value] of Object.entries(obj)) {
          const fullPath = currentPath ? `${currentPath}.${key}` : key;
          
          if (typeof value === 'string') {
            // Check if it's an image path that needs static/ prefix
            if (value.startsWith('/images/') && !value.startsWith('/static/')) {
              const newValue = '/static' + value;
              console.log(`  📝 ${fullPath}: "${value}" → "${newValue}"`);
              updated[key] = newValue;
              fileUpdated++;
            } else {
              updated[key] = value;
            }
          } else if (value && typeof value === 'object') {
            updated[key] = updateImagePaths(value, fullPath);
          } else {
            updated[key] = value;
          }
        }
        
        return updated;
      }
      
      // Update the data
      const updatedData = updateImagePaths(data);
      
      if (fileUpdated > 0) {
        // Convert back to YAML and write to file
        const updatedYaml = yaml.dump(updatedData, {
          indent: 2,
          lineWidth: -1,
          noRefs: true,
          sortKeys: false
        });
        
        fs.writeFileSync(fullPath, updatedYaml, 'utf8');
        
        console.log(`  ✅ Updated ${fileUpdated} paths in ${filePath}`);
        totalUpdated += fileUpdated;
        filesUpdated++;
      } else {
        console.log(`  ℹ️  No paths to update in ${filePath}`);
      }
      
    } catch (error) {
      console.error(`  ❌ Error processing ${filePath}:`, error.message);
    }
  });
  
  console.log(`\n📊 Summary:`);
  console.log(`  📁 Files processed: ${YAML_FILES.length}`);
  console.log(`  📁 Files updated: ${filesUpdated}`);
  console.log(`  📝 Total paths updated: ${totalUpdated}`);
  
  return { filesProcessed: YAML_FILES.length, filesUpdated, totalUpdated };
}

// Main execution
function main() {
  try {
    const result = addStaticPrefixToYamlFiles();
    
    if (result.totalUpdated > 0) {
      console.log('\n🎉 YAML static prefix update completed successfully!');
    } else {
      console.log('\n✅ No YAML files needed static prefix updates');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('\n💥 YAML static prefix update failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { addStaticPrefixToYamlFiles };