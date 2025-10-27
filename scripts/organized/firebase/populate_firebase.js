#!/usr/bin/env node

/**
 * Firebase Population Script for Wavelength Lore
 * 
 * Populates Firebase Realtime Database with content from YAML files
 * Uses the existing Firebase Admin utilities for reliable database operations
 */

const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

// Use environment utilities for proper .env loading
require('dotenv').config({ path: '../../../.env' });
console.log("INIT. FOUND FIREBASE")
console.log(process.env.FIREBASE_SERVICE_ACCOUNT)

// Use existing Firebase admin utilities
const { 
  initializeFirebaseAdmin, 
  writeDataAsAdmin, 
  isFirebaseAdminReady 
} = require('../../../helpers/firebase-admin-utils');

// Initialize environment with required Firebase variables
const requiredEnvVars = [
  'DATABASE_URL',
  'PROJECT_ID'
];


// Determine if we're running from scripts directory or project root
const isRunningFromScripts = __dirname.endsWith('scripts');
const rootPath = isRunningFromScripts ? path.join(__dirname, '..') : __dirname;
const contentPath = path.join(rootPath, '../../../content');

// CLI Usage Documentation
/*
Usage: node populate_firebase.js [options]

Options:
  --characters    Import character data only
  --seasons       Import season/video data only
  --lore          Import lore data only
  --lore-only     Import ONLY lore data (excludes characters and seasons)
  
  No flags        Import all content types (characters, seasons, and lore)

Note: This script can be run from either the project root or the scripts directory.

Examples:
  node populate_firebase.js                    # Import everything
  node populate_firebase.js --lore             # Import lore + default content
  node populate_firebase.js --lore-only        # Import ONLY lore content
  node populate_firebase.js --characters --lore # Import characters and lore only
*/

// Helper function to convert multi-line values to single-line strings
function processYamlData(data) {
  if (typeof data === 'object' && data !== null) {
    for (const key in data) {
      if (typeof data[key] === 'string') {
        data[key] = data[key].replace(/\n/g, ' ');
      } else if (typeof data[key] === 'object') {
        processYamlData(data[key]);
      }
    }
  }
  return data;
}

// Get database reference using Admin SDK
function getDatabase() {
  return admin.database();
}

// Helper function to convert multi-line values to single-line strings
function processYamlData(data) {
  if (typeof data === 'object' && data !== null) {
    for (const key in data) {
      if (typeof data[key] === 'string') {
        data[key] = data[key].replace(/\n/g, ' ');
      } else if (typeof data[key] === 'object') {
        processYamlData(data[key]);
      }
    }
  }
  return data;
}

// Updated to read all character files from subfolders
async function populateCharacters() {
  try {
    console.log('📺 Initializing Firebase Admin for characters...');
    const db = initializeFirebaseAdmin();
    if (!db) {
      throw new Error('Failed to initialize Firebase Admin');
    }

    // Iterate through all subfolders in content/characters
    const characterFolders = fs.readdirSync(`${contentPath}/characters`, { withFileTypes: true });
    let totalProcessed = 0;
    let totalSuccessful = 0;

    for (const folder of characterFolders) {
      const folderPath = `${contentPath}/characters/${folder.name}`;

      if (folder.isDirectory()) {
        const characterFiles = fs.readdirSync(folderPath);

        for (const file of characterFiles) {
          if (file.endsWith('.yaml')) {
            console.log(`📖 Processing character file: ${file}`);

            try {
              // Load and process YAML file
              const yamlContent = fs.readFileSync(`${folderPath}/${file}`, 'utf8');
              let data = yaml.load(yamlContent);
              data = processYamlData(data);

              // Check if data is an array (multiple characters in one file)
              if (Array.isArray(data)) {
                console.log(`  📂 Found ${data.length} characters in file`);
                
                // Process each character individually
                for (const character of data) {
                  if (character.id) {
                    totalProcessed++;
                    const success = await writeDataAsAdmin(`characters/${character.id}`, character);
                    if (success) {
                      totalSuccessful++;
                      console.log(`    ✅ ${character.id}: "${character.title}"`);
                    } else {
                      console.error(`    ❌ Failed to import: ${character.id}`);
                    }
                  } else {
                    console.warn(`    ⚠️  Skipping character without ID`);
                  }
                }
              } else {
                // Single character object (legacy format)
                totalProcessed++;
                const characterId = file.replace('.yaml', '');
                const success = await writeDataAsAdmin(`characters/${characterId}`, data);
                if (success) {
                  totalSuccessful++;
                  console.log(`✅ Character imported: ${characterId}`);
                } else {
                  console.error(`❌ Failed to import character: ${characterId}`);
                }
              }
            } catch (error) {
              console.error(`❌ Error processing character file ${file}:`, error.message);
            }
          }
        }
      }
    }

    console.log(`📊 Characters: ${totalSuccessful}/${totalProcessed} imported successfully`);
  } catch (error) {
    console.error('❌ Error populating characters in Firebase:', error.message);
    throw error;
  }
}

// Updated to read one season at a time from separate files
async function populateSeasons() {
  try {
    console.log('📺 Initializing Firebase Admin for seasons...');
    const db = initializeFirebaseAdmin();
    if (!db) {
      throw new Error('Failed to initialize Firebase Admin');
    }

    // Iterate through season files
    const seasonFiles = fs.readdirSync(`${contentPath}/seasons`);
    let totalProcessed = 0;
    let totalSuccessful = 0;

    for (const file of seasonFiles) {
      if (file.endsWith('.yaml')) {
        totalProcessed++;
        const seasonName = file.replace('.yaml', '');

        try {
          // Load and process YAML file
          const yamlContent = fs.readFileSync(`${contentPath}/seasons/${file}`, 'utf8');
          let data = yaml.load(yamlContent);
          data = processYamlData(data);

          // Write to Firebase using admin utilities
          const success = await writeDataAsAdmin(`videos/${seasonName}`, data);
          if (success) {
            totalSuccessful++;
            console.log(`✅ Season imported: ${seasonName} (${Object.keys(data.episodes || {}).length} episodes)`);
          } else {
            console.error(`❌ Failed to import season: ${seasonName}`);
          }
        } catch (error) {
          console.error(`❌ Error processing season ${seasonName}:`, error.message);
        }
      }
    }

    console.log(`📊 Seasons: ${totalSuccessful}/${totalProcessed} imported successfully`);
  } catch (error) {
    console.error('❌ Error populating seasons in Firebase:', error.message);
    throw error;
  }
}

// Read all lore YAML files and populate Firebase
async function populateLore() {
  try {
    console.log('📚 Initializing Firebase Admin for lore...');
    const db = initializeFirebaseAdmin();
    if (!db) {
      throw new Error('Failed to initialize Firebase Admin');
    }

    // Iterate through all lore files in content/lore
    const loreFiles = fs.readdirSync(`${contentPath}/lore`);
    let totalProcessed = 0;
    let totalSuccessful = 0;

    for (const file of loreFiles) {
      if (file.endsWith('.yaml')) {
        console.log(`📖 Processing lore file: ${file}`);
        
        try {
          // Load and process YAML file
          const yamlContent = fs.readFileSync(`${contentPath}/lore/${file}`, 'utf8');
          let data = yaml.load(yamlContent);
          data = processYamlData(data);

          // Process each category in the lore file
          for (const category in data) {
            if (Array.isArray(data[category])) {
              console.log(`  📂 Processing ${category}: ${data[category].length} items`);
              
              // Store each lore item individually by ID
              for (const item of data[category]) {
                if (item.id) {
                  totalProcessed++;
                  // Add category field if not already present
                  if (!item.category) {
                    item.category = category;
                  }
                  const success = await writeDataAsAdmin(`lore/${item.id}`, item);
                  if (success) {
                    totalSuccessful++;
                    console.log(`    ✅ ${item.id}: "${item.title}" (${category})`);
                  } else {
                    console.error(`    ❌ Failed to import: ${item.id}`);
                  }
                } else {
                  console.warn(`    ⚠️  Skipping item without ID in category ${category}`);
                }
              }
            }
          }
          
          console.log(`✅ Lore file processed: ${file}`);
        } catch (error) {
          console.error(`❌ Error processing lore file ${file}:`, error.message);
        }
      }
    }

    console.log(`📊 Lore: ${totalSuccessful}/${totalProcessed} items imported successfully`);
  } catch (error) {
    console.error('❌ Error populating lore in Firebase:', error.message);
    throw error;
  }
}

const args = process.argv.slice(2);

// Parse command line arguments
const deployCharacters = args.includes('--characters');
const deploySeasons = args.includes('--seasons');
const deployLore = args.includes('--lore');

// If no specific flags are provided, deploy all (except when --lore-only is used)
const deployAll = !deployCharacters && !deploySeasons && !deployLore;
const loreOnly = args.includes('--lore-only');

// Determine what to deploy
const shouldDeployCharacters = loreOnly ? false : (deployAll || deployCharacters);
const shouldDeploySeasons = loreOnly ? false : (deployAll || deploySeasons);
const shouldDeployLore = loreOnly || deployAll || deployLore;

// Call population functions based on flags
async function populateFirebase() {
  const startTime = Date.now();
  
  try {
    console.log('🚀 Starting Firebase population...');
    console.log(`📍 Running from: ${__dirname}`);
    console.log(`📂 Content path: ${path.resolve(contentPath)}`);
    console.log(`🔑 Database URL: ${process.env.DATABASE_URL}\n`);
    
    if (loreOnly) {
      console.log('📚 Lore-only mode: importing lore content only');
    } else if (deployAll) {
      console.log('🌟 Importing all content types');
    } else {
      const importing = [];
      if (shouldDeployCharacters) importing.push('characters');
      if (shouldDeploySeasons) importing.push('seasons');
      if (shouldDeployLore) importing.push('lore');
      console.log(`📦 Importing: ${importing.join(', ')}`);
    }
    
    let hasErrors = false;
    
    if (shouldDeploySeasons) {
      console.log('\n📺 Populating seasons...');
      try {
        await populateSeasons();
      } catch (error) {
        console.error('❌ Failed to populate seasons');
        hasErrors = true;
      }
    }
    
    if (shouldDeployCharacters) {
      console.log('\n👥 Populating characters...');
      try {
        await populateCharacters();
      } catch (error) {
        console.error('❌ Failed to populate characters');
        hasErrors = true;
      }
    }
    
    if (shouldDeployLore) {
      console.log('\n📚 Populating lore...');
      try {
        await populateLore();
      } catch (error) {
        console.error('❌ Failed to populate lore');
        hasErrors = true;
      }
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    if (hasErrors) {
      console.log(`\n⚠️  Firebase population completed with errors (${duration}s)`);
      process.exit(1);
    } else {
      console.log(`\n✅ Firebase population completed successfully! (${duration}s)`);
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Critical error during Firebase population:', error.message);
    process.exit(1);
  }
}

populateFirebase();