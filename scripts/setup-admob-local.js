/**
 * AdMob Environment Variables Setup for Local Development
 * 
 * This script helps you set up AdMob environment variables for local development.
 * It creates or updates a .env file with AdMob configuration values.
 * 
 * Usage: node setup-admob-local.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to ask questions
const ask = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
};

// AdMob environment variables
const adMobEnvVars = [
  { name: 'ADMOB_APP_ID_ANDROID', description: 'Android App ID (e.g., ca-app-pub-XXXXXXXX~YYYYYYYY)' },
  { name: 'ADMOB_APP_ID_IOS', description: 'iOS App ID (e.g., ca-app-pub-XXXXXXXX~YYYYYYYY)' },
  { name: 'ADMOB_APP_ID_WEB', description: 'Web App ID (optional)' },
  { name: 'ADMOB_REWARDED_VIDEO_PROD', description: 'Rewarded video ad unit ID (production)' },
  { name: 'ADMOB_REWARDED_EXTRA_LIFE_PROD', description: 'Extra life rewarded video ad unit ID (optional)' },
  { name: 'ADMOB_REWARDED_POWER_GEM_PROD', description: 'Power gem rewarded video ad unit ID (optional)' },
  { name: 'ADMOB_REWARDED_SCORE_MULTI_PROD', description: 'Score multiplier rewarded video ad unit ID (optional)' },
  { name: 'ADMOB_INTERSTITIAL_PROD', description: 'Interstitial ad unit ID (production)' },
  { name: 'ADMOB_INTERSTITIAL_LEVEL_PROD', description: 'Level-specific interstitial ad unit ID (optional)' },
  { name: 'ADMOB_INTERSTITIAL_GAMEOVER_PROD', description: 'Game over interstitial ad unit ID (optional)' },
  { name: 'ADMOB_USE_TEST_ADS', description: 'Use test ads? (true/false)', defaultValue: 'true' },
  { name: 'ADMOB_ENABLED', description: 'Enable ads? (true/false)', defaultValue: 'true' },
  { name: 'ADMOB_MIN_TIME_BETWEEN_ADS', description: 'Minimum time between ads (ms)', defaultValue: '60000' },
  { name: 'ADMOB_INTERSTITIAL_FREQUENCY', description: 'Show interstitial every X levels', defaultValue: '3' },
  { name: 'ADMOB_MAX_CONTENT_RATING', description: 'Max content rating (G, PG, T, MA)', defaultValue: 'PG' },
  { name: 'ADMOB_CHILD_DIRECTED', description: 'Child-directed treatment? (true/false)', defaultValue: 'false' },
  { name: 'ADMOB_UNDER_AGE_CONSENT', description: 'Under age of consent? (true/false)', defaultValue: 'false' }
];

// AdMob test ad units
const testAdUnits = {
  ADMOB_APP_ID_ANDROID: 'ca-app-pub-3940256099942544~3347511713',
  ADMOB_APP_ID_IOS: 'ca-app-pub-3940256099942544~1458002511',
  ADMOB_REWARDED_VIDEO_PROD: 'ca-app-pub-3940256099942544/5224354917',
  ADMOB_INTERSTITIAL_PROD: 'ca-app-pub-3940256099942544/1033173712'
};

// Main function to update .env file
async function setupAdMobLocalEnv() {
  try {
    console.log('===================================================');
    console.log('📱 AdMob Environment Variables Setup for Local Development');
    console.log('===================================================\n');
    
    const envFilePath = path.join(__dirname, '..', '.env');
    
    // Check if .env file exists
    let existingEnvVars = {};
    if (fs.existsSync(envFilePath)) {
      console.log('Existing .env file found. Will update AdMob variables.');
      
      // Read existing .env file
      const envFileContent = fs.readFileSync(envFilePath, 'utf8');
      envFileContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          existingEnvVars[match[1].trim()] = match[2].trim();
        }
      });
    } else {
      console.log('No .env file found. Will create a new one.');
    }
    
    // Ask if user wants to use test ad units
    const useTestIds = await ask('Would you like to use Google\'s test ad unit IDs for development? (y/n): ');
    
    if (useTestIds.toLowerCase() === 'y') {
      console.log('\nUsing Google\'s test ad unit IDs. These are safe to use for development.');
      Object.keys(testAdUnits).forEach(key => {
        existingEnvVars[key] = testAdUnits[key];
      });
      existingEnvVars['ADMOB_USE_TEST_ADS'] = 'true';
    }
    
    console.log('\nEnter values for each AdMob environment variable (leave blank to skip or use existing value):');
    
    // Collect environment variables from user input
    for (const envVar of adMobEnvVars) {
      const currentValue = existingEnvVars[envVar.name] || '';
      const defaultMsg = envVar.defaultValue ? ` (default: ${envVar.defaultValue})` : '';
      const currentMsg = currentValue ? ` (current: ${currentValue})` : '';
      
      const value = await ask(`${envVar.name}: ${envVar.description}${defaultMsg}${currentMsg}: `);
      
      if (value !== '') {
        existingEnvVars[envVar.name] = value;
      } else if (!currentValue && envVar.defaultValue) {
        existingEnvVars[envVar.name] = envVar.defaultValue;
      }
    }
    
    // Generate .env file content
    const newEnvContent = Object.entries(existingEnvVars)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    // Write to .env file
    fs.writeFileSync(envFilePath, newEnvContent);
    
    console.log('\n✅ .env file updated successfully with AdMob environment variables.');
    console.log(`File location: ${envFilePath}`);
    console.log('\nDon\'t forget to install dotenv package if you haven\'t already:');
    console.log('npm install dotenv --save');
    console.log('\nAnd add this to your app.js:');
    console.log('require(\'dotenv\').config();');
    
    rl.close();
  } catch (error) {
    console.error('Error updating .env file:', error);
    rl.close();
  }
}

// Run the script
setupAdMobLocalEnv();