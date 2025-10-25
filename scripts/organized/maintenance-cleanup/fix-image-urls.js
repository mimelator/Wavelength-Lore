#!/usr/bin/env node

/**
 * Fix Image URLs Script
 * 
 * This script fixes image URLs in YAML files by removing the incorrect /static/ prefix.
 * The Express server serves static files without the /static/ prefix in the URL.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// ANSI color codes for better output
const colors = {
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    reset: '\x1b[0m',
    bright: '\x1b[1m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Fix image URLs by removing /static/ prefix
 * @param {string} url - The URL to fix
 * @returns {string} The corrected URL
 */
function fixImageUrl(url) {
    if (typeof url === 'string' && url.startsWith('/static/images/')) {
        return url.replace('/static/images/', '/images/');
    }
    return url;
}

/**
 * Recursively process an object to fix image URLs
 * @param {any} obj - The object to process
 * @returns {any} The processed object with fixed URLs
 */
function processObject(obj) {
    if (typeof obj === 'string') {
        return fixImageUrl(obj);
    }
    
    if (Array.isArray(obj)) {
        return obj.map(item => {
            // Process each array item recursively (could be string, object, etc.)
            return processObject(item);
        });
    }
    
    if (obj && typeof obj === 'object') {
        const processed = {};
        for (const [key, value] of Object.entries(obj)) {
            // Always process recursively to catch nested structures
            processed[key] = processObject(value);
        }
        return processed;
    }
    
    return obj;
}

/**
 * Process a single YAML file
 * @param {string} filePath - Path to the YAML file
 * @returns {object} Statistics about changes made
 */
function processYamlFile(filePath) {
    const stats = { processed: 0, changed: 0, errors: 0 };
    
    try {
        log(`📄 Processing: ${path.relative(process.cwd(), filePath)}`, 'cyan');
        
        // Read and parse YAML
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const data = yaml.load(fileContent);
        
        if (!data) {
            log(`   ⚠️  Empty or invalid YAML file`, 'yellow');
            return stats;
        }
        
        // Process the data
        const originalJson = JSON.stringify(data);
        const processedData = processObject(data);
        const processedJson = JSON.stringify(processedData);
        
        stats.processed = 1;
        
        // Check if anything changed
        if (originalJson !== processedJson) {
            // Count specific image URL changes
            const originalUrls = originalJson.match(/\/static\/images\/[^"]+/g) || [];
            const fixedUrls = originalUrls.length;
            
            if (fixedUrls > 0) {
                log(`   ✅ Fixed ${fixedUrls} image URL(s)`, 'green');
                
                // Write back the fixed YAML
                const yamlOutput = yaml.dump(processedData, {
                    indent: 2,
                    lineWidth: -1,
                    noRefs: true
                });
                
                fs.writeFileSync(filePath, yamlOutput, 'utf8');
                stats.changed = 1;
                
                // Show examples of changes
                originalUrls.slice(0, 3).forEach(url => {
                    const fixed = fixImageUrl(url);
                    log(`     ${url} → ${fixed}`, 'green');
                });
                
                if (originalUrls.length > 3) {
                    log(`     ... and ${originalUrls.length - 3} more`, 'green');
                }
            }
        } else {
            log(`   ✅ No image URLs need fixing`, 'green');
        }
        
    } catch (error) {
        log(`   ❌ Error processing file: ${error.message}`, 'red');
        stats.errors = 1;
    }
    
    return stats;
}

/**
 * Find all YAML files in content directories
 * @returns {string[]} Array of YAML file paths
 */
function findYamlFiles() {
    const yamlFiles = [];
    const contentDirs = [
        'content/characters',
        'content/lore', 
        'content/seasons',
        'content/maps',
        'content/prompts'
    ];
    
    function scanDirectory(dir) {
        if (!fs.existsSync(dir)) return;
        
        const items = fs.readdirSync(dir);
        items.forEach(item => {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                scanDirectory(fullPath);
            } else if (item.endsWith('.yaml') || item.endsWith('.yml')) {
                yamlFiles.push(fullPath);
            }
        });
    }
    
    contentDirs.forEach(scanDirectory);
    return yamlFiles;
}

/**
 * Main execution function
 */
function main() {
    log('🔧 Starting Image URL Fix Process...', 'bright');
    log('', 'reset');
    
    const yamlFiles = findYamlFiles();
    
    if (yamlFiles.length === 0) {
        log('❌ No YAML files found in content directories', 'red');
        process.exit(1);
    }
    
    log(`📁 Found ${yamlFiles.length} YAML files to process`, 'cyan');
    log('', 'reset');
    
    // Process all files
    let totalStats = { processed: 0, changed: 0, errors: 0 };
    
    yamlFiles.forEach(filePath => {
        const stats = processYamlFile(filePath);
        totalStats.processed += stats.processed;
        totalStats.changed += stats.changed;
        totalStats.errors += stats.errors;
    });
    
    log('', 'reset');
    log('============================================================', 'cyan');
    log('📊 IMAGE URL FIX SUMMARY', 'bright');
    log('============================================================', 'cyan');
    log(`📄 Files processed: ${totalStats.processed}`, 'cyan');
    log(`✅ Files changed: ${totalStats.changed}`, 'green');
    log(`❌ Errors: ${totalStats.errors}`, totalStats.errors > 0 ? 'red' : 'green');
    
    if (totalStats.changed > 0) {
        log('', 'reset');
        log('🎯 Next steps:', 'yellow');
        log('   1. Review the changes with: git diff', 'yellow');
        log('   2. Repopulate Firebase: node scripts/populate_firebase.js', 'yellow');
        log('   3. Test modal images: node scripts/check_broken_images.js --modal-only', 'yellow');
    }
    
    log('============================================================', 'cyan');
    
    if (totalStats.errors > 0) {
        process.exit(1);
    }
}

// Run the script
main();