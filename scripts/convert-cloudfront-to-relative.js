#!/usr/bin/env node

/**
 * Convert CloudFront URLs to Relative Paths in Database
 * 
 * This script finds all CloudFront URLs in the Firebase database and converts them
 * to relative paths, allowing the CDN_URL environment variable to handle the domain.
 * 
 * Usage:
 *   node convert-cloudfront-to-relative.js --dry-run    # Preview changes
 *   node convert-cloudfront-to-relative.js --apply      # Apply changes
 */

require('dotenv').config();
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('../firebaseServiceAccountKey.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.DATABASE_URL || 'https://wavelength-lore-default-rtdb.firebaseio.com'
});

const db = admin.database();

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
 * Recursively process an object and convert URLs
 */
function processObject(obj, path = '') {
    const changes = [];
    
    if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
            const itemPath = `${path}[${index}]`;
            if (typeof item === 'string') {
                const converted = convertToRelativePath(item);
                if (converted !== item) {
                    changes.push({
                        path: itemPath,
                        original: item,
                        converted: converted
                    });
                }
            } else if (typeof item === 'object' && item !== null) {
                changes.push(...processObject(item, itemPath));
            }
        });
    } else if (typeof obj === 'object' && obj !== null) {
        Object.keys(obj).forEach(key => {
            const itemPath = path ? `${path}.${key}` : key;
            const value = obj[key];
            
            if (typeof value === 'string') {
                const converted = convertToRelativePath(value);
                if (converted !== value) {
                    changes.push({
                        path: itemPath,
                        original: value,
                        converted: converted
                    });
                }
            } else if (typeof value === 'object' && value !== null) {
                changes.push(...processObject(value, itemPath));
            }
        });
    }
    
    return changes;
}

/**
 * Apply changes to the database
 */
async function applyChanges(changes, data) {
    console.log('🔄 Applying changes to database...\n');
    
    for (const change of changes) {
        const pathParts = change.path.split(/[.\[\]]+/).filter(part => part !== '');
        let current = data;
        
        // Navigate to the parent object
        for (let i = 0; i < pathParts.length - 1; i++) {
            const part = pathParts[i];
            if (Array.isArray(current)) {
                current = current[parseInt(part)];
            } else {
                current = current[part];
            }
        }
        
        // Update the value
        const lastPart = pathParts[pathParts.length - 1];
        if (Array.isArray(current)) {
            current[parseInt(lastPart)] = change.converted;
        } else {
            current[lastPart] = change.converted;
        }
    }
    
    // Write back to Firebase
    try {
        await db.ref().set(data);
        console.log('✅ Database updated successfully!');
        return true;
    } catch (error) {
        console.error('❌ Error updating database:', error);
        return false;
    }
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
        console.log('  node convert-cloudfront-to-relative.js --dry-run    # Preview changes');
        console.log('  node convert-cloudfront-to-relative.js --apply      # Apply changes');
        process.exit(1);
    }
    
    console.log('🚀 Converting CloudFront URLs to relative paths...\n');
    
    try {
        // Fetch all data
        console.log('📖 Reading database...');
        const snapshot = await db.ref().once('value');
        const data = snapshot.val();
        
        if (!data) {
            console.log('❌ No data found in database');
            return;
        }
        
        // Process the data to find changes needed
        console.log('🔍 Analyzing URLs...\n');
        const changes = processObject(data);
        
        if (changes.length === 0) {
            console.log('✅ No CloudFront URLs found to convert!');
            return;
        }
        
        // Display changes
        console.log(`📊 Found ${changes.length} URLs to convert:\n`);
        
        const changesBySection = {};
        changes.forEach(change => {
            const section = change.path.split('.')[0] || 'root';
            if (!changesBySection[section]) {
                changesBySection[section] = [];
            }
            changesBySection[section].push(change);
        });
        
        Object.keys(changesBySection).forEach(section => {
            console.log(`📂 ${section.toUpperCase()}:`);
            changesBySection[section].slice(0, 5).forEach(change => {
                console.log(`   ${change.path}`);
                console.log(`   FROM: ${change.original}`);
                console.log(`   TO:   ${change.converted}`);
                console.log('');
            });
            
            if (changesBySection[section].length > 5) {
                console.log(`   ... and ${changesBySection[section].length - 5} more\n`);
            }
        });
        
        if (isDryRun) {
            console.log('🔍 DRY RUN - No changes applied');
            console.log('📝 To apply these changes, run: node convert-cloudfront-to-relative.js --apply');
        } else if (shouldApply) {
            console.log('⚠️  APPLYING CHANGES TO DATABASE...\n');
            const success = await applyChanges(changes, data);
            
            if (success) {
                console.log(`\n🎉 Successfully converted ${changes.length} URLs to relative paths!`);
                console.log('🔧 Your application will now use the CDN_URL environment variable consistently.');
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

// Run the script
main();