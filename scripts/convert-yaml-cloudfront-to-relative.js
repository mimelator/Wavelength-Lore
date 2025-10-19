#!/usr/bin/env node

/**
 * Convert CloudFront URLs to Relative Paths in YAML Files
 * 
 * This script finds all CloudFront URLs in YAML files and converts them
 * to relative paths, allowing the CDN_URL environment variable to handle the domain.
 * 
 * Usage:
 *   node convert-yaml-cloudfront-to-relative.js --dry-run    # Preview changes
 *   node convert-yaml-cloudfront-to-relative.js --apply      # Apply changes
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// CloudFront patterns to match
const CLOUDFRONT_PATTERNS = [
    'https://df5sj8f594cdx.cloudfront.net',
    'https://d2rcdctdo7spl9.cloudfront.net',
    'https://wavelength-lore-bucket.s3.amazonaws.com'
];

/**
 * Convert a CloudFront URL to relative path
 */
function convertToRelativePath(url) {
    if (typeof url !== 'string') return url;
    
    for (const pattern of CLOUDFRONT_PATTERNS) {
        if (url.startsWith(pattern)) {
            // Remove the CloudFront domain to get relative path
            let relativePath = url.replace(pattern, '');
            // Ensure it starts with /
            if (!relativePath.startsWith('/')) {
                relativePath = '/' + relativePath;
            }
            return relativePath;
        }
    }
    
    return url; // Return unchanged if not a CloudFront URL
}

/**
 * Find all YAML files
 */
function findYamlFiles(dir) {
    const yamlFiles = [];
    
    function searchDir(currentDir) {
        const items = fs.readdirSync(currentDir);
        
        for (const item of items) {
            const itemPath = path.join(currentDir, item);
            const stat = fs.statSync(itemPath);
            
            if (stat.isDirectory()) {
                searchDir(itemPath);
            } else if (item.endsWith('.yaml') || item.endsWith('.yml')) {
                yamlFiles.push(itemPath);
            }
        }
    }
    
    searchDir(dir);
    return yamlFiles;
}

/**
 * Process a single YAML file
 */
function processYamlFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const changes = [];
    let newContent = content;
    
    for (const pattern of CLOUDFRONT_PATTERNS) {
        const regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        const matches = content.match(regex);
        
        if (matches) {
            // Replace all occurrences of this pattern
            newContent = newContent.replace(regex, '');
            
            // Count the changes
            changes.push({
                file: filePath,
                pattern: pattern,
                count: matches.length
            });
        }
    }
    
    return {
        filePath,
        originalContent: content,
        newContent,
        hasChanges: newContent !== content,
        changes
    };
}

/**
 * Main execution function
 */
async function main() {
    const args = process.argv.slice(2);
    const isDryRun = args.includes('--dry-run');
    const shouldApply = args.includes('--apply');
    
    if (!isDryRun && !shouldApply) {
        console.log('❌ Please specify either --dry-run or --apply');
        console.log('Usage:');
        console.log('  node convert-yaml-cloudfront-to-relative.js --dry-run    # Preview changes');
        console.log('  node convert-yaml-cloudfront-to-relative.js --apply      # Apply changes');
        process.exit(1);
    }
    
    console.log('🚀 Converting CloudFront URLs to relative paths in YAML files...\n');
    
    try {
        // Find all YAML files
        const contentDir = path.join(__dirname, '../content');
        const yamlFiles = findYamlFiles(contentDir);
        
        console.log(`📂 Found ${yamlFiles.length} YAML files to process\n`);
        
        let totalChanges = 0;
        const processedFiles = [];
        
        // Process each file
        for (const yamlFile of yamlFiles) {
            const result = processYamlFile(yamlFile);
            
            if (result.hasChanges) {
                processedFiles.push(result);
                
                const changeCount = result.changes.reduce((sum, change) => sum + change.count, 0);
                totalChanges += changeCount;
                
                console.log(`📄 ${path.relative(process.cwd(), result.filePath)}`);
                console.log(`   🔄 ${changeCount} URLs to convert`);
                
                // Show a few examples
                const lines = result.originalContent.split('\n');
                const changedLines = [];
                
                for (let i = 0; i < lines.length && changedLines.length < 3; i++) {
                    for (const pattern of CLOUDFRONT_PATTERNS) {
                        if (lines[i].includes(pattern)) {
                            const before = lines[i].trim();
                            const after = lines[i].replace(pattern, '').trim();
                            changedLines.push({ before, after });
                            break;
                        }
                    }
                }
                
                changedLines.forEach(change => {
                    console.log(`   FROM: ${change.before}`);
                    console.log(`   TO:   ${change.after}`);
                });
                
                console.log('');
            }
        }
        
        if (totalChanges === 0) {
            console.log('✅ No CloudFront URLs found in YAML files!');
            return;
        }
        
        console.log(`📊 Total: ${totalChanges} URLs to convert across ${processedFiles.length} files\n`);
        
        if (isDryRun) {
            console.log('🔍 DRY RUN - No changes applied');
            console.log('📝 To apply these changes, run: node convert-yaml-cloudfront-to-relative.js --apply');
        } else if (shouldApply) {
            console.log('⚠️  APPLYING CHANGES TO YAML FILES...\n');
            
            let successCount = 0;
            
            for (const result of processedFiles) {
                try {
                    fs.writeFileSync(result.filePath, result.newContent, 'utf8');
                    console.log(`✅ Updated ${path.relative(process.cwd(), result.filePath)}`);
                    successCount++;
                } catch (error) {
                    console.error(`❌ Error updating ${result.filePath}:`, error.message);
                }
            }
            
            console.log(`\n🎉 Successfully updated ${successCount}/${processedFiles.length} YAML files!`);
            console.log(`🔧 Converted ${totalChanges} URLs to relative paths.`);
            console.log('📝 Your YAML files now use relative paths that work with CDN_URL environment variable.');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

// Run the script
main();