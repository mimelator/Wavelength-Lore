/**
 * AWS AppRunner Environment Variable Updater for AdMob Configuration
 * 
 * This script updates the environment variables in AWS AppRunner for the AdMob integration.
 * Run this script when you need to update AdMob configuration in the production environment.
 * 
 * Usage: node update-admob-config.js
 */

const { AppRunnerClient, UpdateServiceCommand } = require('@aws-sdk/client-apprunner');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Load environment variables from .env file if it exists
try {
  require('dotenv').config();
} catch (error) {
  console.log('dotenv not installed, skipping .env loading');
}

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

// Get AWS resources information
let awsResources;
try {
  awsResources = require('../config/aws-resources');
} catch (error) {
  console.error('Failed to load AWS resources config:', error);
  process.exit(1);
}

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
  { name: 'ADMOB_USE_TEST_ADS', description: 'Use test ads? (true/false)', defaultValue: 'false' },
  { name: 'ADMOB_ENABLED', description: 'Enable ads? (true/false)', defaultValue: 'true' },
  { name: 'ADMOB_MIN_TIME_BETWEEN_ADS', description: 'Minimum time between ads (ms)', defaultValue: '60000' },
  { name: 'ADMOB_INTERSTITIAL_FREQUENCY', description: 'Show interstitial every X levels', defaultValue: '3' },
  { name: 'ADMOB_MAX_CONTENT_RATING', description: 'Max content rating (G, PG, T, MA)', defaultValue: 'PG' },
  { name: 'ADMOB_CHILD_DIRECTED', description: 'Child-directed treatment? (true/false)', defaultValue: 'false' },
  { name: 'ADMOB_UNDER_AGE_CONSENT', description: 'Under age of consent? (true/false)', defaultValue: 'false' }
];

// Main function to update AppRunner environment variables
async function updateAppRunnerEnvVars() {
  try {
    console.log('===================================================');
    console.log('📱 AWS AppRunner Environment Variable Updater for AdMob');
    console.log('===================================================\n');
    
    // Get confirmation
    const proceed = await ask('This script will update AdMob environment variables in AWS AppRunner. Proceed? (y/n): ');
    
    if (proceed.toLowerCase() !== 'y') {
      console.log('Operation cancelled.');
      rl.close();
      return;
    }
    
    // Get AWS credentials
    const region = process.env.AWS_REGION || await ask('Enter AWS region (default: us-east-1): ') || 'us-east-1';
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID || await ask('Enter AWS access key ID: ');
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || await ask('Enter AWS secret access key: ');
    
    if (!accessKeyId || !secretAccessKey) {
      console.error('Error: AWS credentials are required.');
      rl.close();
      return;
    }
    
    // Create AWS AppRunner client
    const appRunnerClient = new AppRunnerClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    });
    
    // Get service ARN
    const serviceArn = awsResources.appRunner.serviceArn || await ask('Enter AppRunner service ARN: ');
    
    if (!serviceArn) {
      console.error('Error: AppRunner service ARN is required.');
      rl.close();
      return;
    }
    
    console.log('\nEnter values for each AdMob environment variable (leave blank to skip):');
    
    // Collect environment variables from user input
    const envVars = [];
    
    for (const envVar of adMobEnvVars) {
      const currentValue = process.env[envVar.name] || '';
      const defaultMsg = envVar.defaultValue ? ` (default: ${envVar.defaultValue})` : '';
      const currentMsg = currentValue ? ` (current: ${currentValue})` : '';
      
      const value = await ask(`${envVar.name}: ${envVar.description}${defaultMsg}${currentMsg}: `);
      
      if (value !== '') {
        envVars.push({
          name: envVar.name,
          value: value
        });
      } else if (envVar.defaultValue) {
        envVars.push({
          name: envVar.name,
          value: envVar.defaultValue
        });
      }
    }
    
    // Confirm update
    console.log('\nThe following environment variables will be updated:');
    envVars.forEach(v => console.log(`${v.name} = ${v.value}`));
    
    const confirmUpdate = await ask('\nConfirm update? (y/n): ');
    
    if (confirmUpdate.toLowerCase() !== 'y') {
      console.log('Update cancelled.');
      rl.close();
      return;
    }
    
    // Get current service configuration to avoid overwriting existing environment variables
    const describeServiceCommand = new AppRunnerClient.DescribeServiceCommand({
      ServiceArn: serviceArn
    });
    
    let existingEnvVars = [];
    try {
      const serviceDetails = await appRunnerClient.send(describeServiceCommand);
      existingEnvVars = serviceDetails.Service.SourceConfiguration.AutoDeploymentsEnabled.EnvironmentVariables || [];
    } catch (error) {
      console.error('Error retrieving current service configuration:', error);
      // Continue without existing variables
    }
    
    // Merge existing and new environment variables
    const finalEnvVars = [...existingEnvVars];
    
    for (const newVar of envVars) {
      const existingIndex = finalEnvVars.findIndex(v => v.name === newVar.name);
      if (existingIndex >= 0) {
        finalEnvVars[existingIndex] = newVar;
      } else {
        finalEnvVars.push(newVar);
      }
    }
    
    // Update the service with new environment variables
    const updateServiceCommand = new UpdateServiceCommand({
      ServiceArn: serviceArn,
      SourceConfiguration: {
        AutoDeploymentsEnabled: true,
        EnvironmentVariables: finalEnvVars
      }
    });
    
    console.log('\nUpdating AppRunner service environment variables...');
    
    try {
      const response = await appRunnerClient.send(updateServiceCommand);
      console.log('✅ Environment variables updated successfully!');
      console.log(`Operation ID: ${response.OperationId}`);
      console.log('Changes will take effect after the service is redeployed.');
    } catch (error) {
      console.error('❌ Error updating environment variables:', error);
    }
    
    rl.close();
  } catch (error) {
    console.error('Unhandled error:', error);
    rl.close();
  }
}

// Run the script
updateAppRunnerEnvVars();