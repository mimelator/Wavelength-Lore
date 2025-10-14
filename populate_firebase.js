const admin = require('firebase-admin');
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set } = require('firebase/database');
const yaml = require('js-yaml');
const fs = require('fs');
const serviceAccount = require('./firebaseServiceAccountKey.json');
require('dotenv').config();

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

const args = process.argv.slice(2);
const deployCharacters = args.includes('--characters') || !args.includes('--seasons');
const deploySeasons = args.includes('--seasons') || !args.includes('--characters');

// Call population functions based on flags
async function populateFirebase() {
  try {
    if (deploySeasons) {
      await populateSeasons();
    }
    if (deployCharacters) {
      await populateCharacters();
    }
  } catch (error) {
    console.error('Error populating Firebase:', error);
  }
}

populateFirebase();