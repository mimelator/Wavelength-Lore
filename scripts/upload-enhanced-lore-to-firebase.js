#!/usr/bin/env node

/**
 * Upload Enhanced Lore Data to Firebase
 * 
 * This script uploads the enhanced lore content from YAML to Firebase
 * so the dramatic CTAs and power statements appear on the website
 */

const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
const firebaseAdminUtils = require('../helpers/firebase-admin-utils');

console.log('🌊 WAVELENGTH ENHANCED LORE UPLOADER');
console.log('====================================');
console.log('🚀 Uploading enhanced lore content to Firebase');
console.log('📝 This will enable dramatic CTAs on lore pages');
console.log('');

// Initialize Firebase Admin
const firebaseUtils = require('../helpers/firebase-utils');
if (!firebaseUtils.isFirebaseReady()) {
    firebaseUtils.initializeFirebase('enhanced-lore-uploader');
}

// Load enhanced lore data from YAML
const lorePath = path.join(__dirname, '../content/lore/wavelength-lore.yaml');
let loreData;

try {
    const loreContent = fs.readFileSync(lorePath, 'utf8');
    loreData = yaml.load(loreContent);
    console.log('✅ Loaded enhanced lore data from YAML successfully');
} catch (error) {
    console.error('❌ Error loading lore YAML:', error.message);
    process.exit(1);
}

/**
 * Transform YAML lore entry to Firebase format
 */
function transformLoreEntry(entry) {
    const transformed = {
        id: entry.id,
        title: entry.title,
        type: entry.type,
        keywords: entry.keywords || [],
        description: entry.description,
        image: entry.image,
        image_gallery: entry.image_gallery || [],
        hidden: entry.hidden || false,
        visible: !entry.hidden // Legacy field for backwards compatibility
    };

    // Add enhanced fields if they exist
    if (entry.enhanced_title) {
        transformed.enhanced_title = entry.enhanced_title;
    }
    if (entry.tagline) {
        transformed.tagline = entry.tagline;
    }
    if (entry.enhanced_description) {
        transformed.enhanced_description = entry.enhanced_description;
    }
    if (entry.cta_hook) {
        transformed.cta_hook = entry.cta_hook;
    }
    if (entry.power_statement) {
        transformed.power_statement = entry.power_statement;
    }

    return transformed;
}

/**
 * Upload all lore entries to Firebase
 */
async function uploadLoreToFirebase() {
    console.log('🔥 Starting Firebase upload process...\n');
    
    let uploadedCount = 0;
    let enhancedCount = 0;
    
    // Process all lore categories
    for (const [category, entries] of Object.entries(loreData)) {
        if (Array.isArray(entries)) {
            console.log(`📂 Processing ${category} category (${entries.length} entries)`);
            
            for (const entry of entries) {
                try {
                    const transformed = transformLoreEntry(entry);
                    
                    // Upload to Firebase at /lore/{entryId}
                    await firebaseAdminUtils.writeDataAsAdmin(`lore/${entry.id}`, transformed);
                    
                    uploadedCount++;
                    
                    // Check if entry has enhancements
                    if (entry.enhanced_title || entry.tagline || entry.enhanced_description || 
                        entry.cta_hook || entry.power_statement) {
                        enhancedCount++;
                        console.log(`✅ Enhanced: ${entry.title} (with dramatic CTAs)`);
                    } else {
                        console.log(`📝 Uploaded: ${entry.title}`);
                    }
                } catch (error) {
                    console.error(`❌ Failed to upload ${entry.title}:`, error.message);
                }
            }
        }
    }
    
    console.log(`\n🎯 UPLOAD SUMMARY:`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📊 Total entries uploaded: ${uploadedCount}`);
    console.log(`⚡ Enhanced entries with CTAs: ${enhancedCount}`);
    console.log(`🌊 Firebase lore database updated successfully!`);
    console.log(`\n✅ Enhanced lore content is now live on the website!`);
    console.log(`🔗 Visit: http://localhost:3001/lore/ice-blue-diamond to see "The Relic of Infinite Greed"`);
}

// Run the upload process
uploadLoreToFirebase().catch(error => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
});