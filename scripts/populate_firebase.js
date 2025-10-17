const admin = require('firebase-admin');
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set } = require('firebase/database');
const yaml = require('js-yaml');
const fs = require('fs');
const serviceAccount = require('../firebaseServiceAccountKey.json');
require('dotenv').config({ path: '../.env' });

// CLI Usage Documentation
/*
Usage: node populate_firebase.js [options]

Options:
  --characters    Import character data only
  --seasons       Import season/video data only
  --lore          Import lore data only
  --lore-only     Import ONLY lore data (excludes characters and seasons)
  
  No flags        Import all content types (characters, seasons, and lore)

Examples:
  node populate_firebase.js                    # Import everything
  node populate_firebase.js --lore             # Import lore + default content
  node populate_firebase.js --lore-only        # Import ONLY lore content
  node populate_firebase.js --characters --lore # Import characters and lore only
*/

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.DATABASE_URL
});

// Generate a custom token
async function getCustomToken() {
  const customToken = await admin.auth().createCustomToken('populate_firebase_script', {
    isScript: true
  });
  return customToken;
}

// Initialize Firebase App with the custom token
async function initializeFirebaseWithToken() {
  const customToken = await getCustomToken();
  const firebaseApp = initializeApp({
    apiKey: process.env.API_KEY,
    authDomain: process.env.AUTH_DOMAIN,
    databaseURL: process.env.DATABASE_URL,
    projectId: process.env.PROJECT_ID,
    storageBucket: process.env.STORAGE_BUCKET,
    messagingSenderId: process.env.MESSAGING_SENDER_ID,
    appId: process.env.APP_ID
  });

  const auth = require('firebase/auth');
  const { getAuth, signInWithCustomToken } = auth;
  const firebaseAuth = getAuth(firebaseApp);

  await signInWithCustomToken(firebaseAuth, customToken);
  return getDatabase(firebaseApp);
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
    const database = await initializeFirebaseWithToken();

    // Iterate through all subfolders in './content/characters'
    const characterFolders = fs.readdirSync('./content/characters', { withFileTypes: true });

    for (const folder of characterFolders) {
      const folderPath = `./content/characters/${folder.name}`;

      if (folder.isDirectory()) {
        const characterFiles = fs.readdirSync(folderPath);

        for (const file of characterFiles) {
          if (file.endsWith('.yaml')) {
            const characterId = file.replace('.yaml', '');
            const characterRef = ref(database, `characters/${characterId}`);

            // Load and process YAML file
            const yamlContent = fs.readFileSync(`${folderPath}/${file}`, 'utf8');
            let data = yaml.load(yamlContent);
            data = processYamlData(data);

            await set(characterRef, data);
            console.log(`Firebase populated successfully for character: ${characterId}`);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error populating characters in Firebase:', error);
  }
}

// Updated to read one season at a time from separate files
async function populateSeasons() {
  try {
    const database = await initializeFirebaseWithToken();

    // Iterate through season files
    const seasonFiles = fs.readdirSync('./content/seasons');
    for (const file of seasonFiles) {
      if (file.endsWith('.yaml')) {
        const seasonName = file.replace('.yaml', '');
        const seasonRef = ref(database, `videos/${seasonName}`);

        // Load and process YAML file
        const yamlContent = fs.readFileSync(`./content/seasons/${file}`, 'utf8');
        let data = yaml.load(yamlContent);
        data = processYamlData(data);

        await set(seasonRef, data);
        console.log(`Firebase populated successfully for ${seasonName}!`);
      }
    }
  } catch (error) {
    console.error('Error populating seasons in Firebase:', error);
  }
}

// Read all lore YAML files and populate Firebase
async function populateLore() {
  try {
    const database = await initializeFirebaseWithToken();

    // Iterate through all lore files in './content/lore'
    const loreFiles = fs.readdirSync('./content/lore');

    for (const file of loreFiles) {
      if (file.endsWith('.yaml')) {
        console.log(`Processing lore file: ${file}`);
        
        // Load and process YAML file
        const yamlContent = fs.readFileSync(`./content/lore/${file}`, 'utf8');
        let data = yaml.load(yamlContent);
        data = processYamlData(data);

        // Process each category in the lore file
        for (const category in data) {
          if (Array.isArray(data[category])) {
            console.log(`  Processing ${category}: ${data[category].length} items`);
            
            // Store each lore item individually by ID
            for (const item of data[category]) {
              if (item.id) {
                const loreRef = ref(database, `lore/${item.id}`);
                await set(loreRef, item);
                console.log(`    Imported lore item: ${item.id} (${item.title})`);
              } else {
                console.warn(`    Skipping item without ID in category ${category}`);
              }
            }
          }
        }
        
        console.log(`Firebase populated successfully for lore file: ${file}`);
      }
    }
  } catch (error) {
    console.error('Error populating lore in Firebase:', error);
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
  try {
    console.log('🚀 Starting Firebase population...');
    
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
    
    if (shouldDeploySeasons) {
      console.log('\n📺 Populating seasons...');
      await populateSeasons();
    }
    if (shouldDeployCharacters) {
      console.log('\n👥 Populating characters...');
      await populateCharacters();
    }
    if (shouldDeployLore) {
      console.log('\n📚 Populating lore...');
      await populateLore();
    }
    
    console.log('\n✅ Firebase population completed successfully!');
  } catch (error) {
    console.error('❌ Error populating Firebase:', error);
  }
}

populateFirebase();