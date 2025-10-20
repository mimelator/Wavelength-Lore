#!/usr/bin/env node
/**
 * Generate FIREBASE_SERVICE_ACCOUNT Environment Variable
 *
 * This script reads your firebaseServiceAccountKey.json file and outputs
 * a properly formatted environment variable for production deployment.
 *
 * Usage:
 *   node scripts/generate-firebase-env.js
 *
 * Output:
 *   FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'
 */

const fs = require('fs');
const path = require('path');

const serviceAccountPath = path.join(__dirname, '../firebaseServiceAccountKey.json');

try {
  // Check if file exists
  if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌ Error: firebaseServiceAccountKey.json not found!');
    console.error('');
    console.error('Please ensure the service account key file exists at:');
    console.error('  ' + serviceAccountPath);
    console.error('');
    console.error('You can download it from:');
    console.error('  Firebase Console → Project Settings → Service Accounts → Generate New Private Key');
    process.exit(1);
  }

  // Read and parse the service account JSON
  const serviceAccountJson = fs.readFileSync(serviceAccountPath, 'utf8');
  const serviceAccount = JSON.parse(serviceAccountJson);

  // Validate it has the required fields
  const requiredFields = ['type', 'project_id', 'private_key_id', 'private_key', 'client_email'];
  const missingFields = requiredFields.filter(field => !serviceAccount[field]);

  if (missingFields.length > 0) {
    console.error('❌ Error: Service account JSON is missing required fields:');
    missingFields.forEach(field => console.error('  - ' + field));
    process.exit(1);
  }

  // Create the environment variable value (minified JSON)
  const envValue = JSON.stringify(serviceAccount);

  console.log('✅ Service account JSON validated successfully!');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📋 COPY THE FOLLOWING LINE TO YOUR PRODUCTION .env FILE:');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log(`FIREBASE_SERVICE_ACCOUNT='${envValue}'`);
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('📝 Instructions:');
  console.log('');
  console.log('1. Copy the FIREBASE_SERVICE_ACCOUNT line above');
  console.log('2. Add it to your production environment variables:');
  console.log('   - For Docker: Add to your .env file or docker-compose.yml');
  console.log('   - For AWS/Azure/GCP: Add via their environment variable UI');
  console.log('   - For Heroku: heroku config:set FIREBASE_SERVICE_ACCOUNT=\'...\'');
  console.log('');
  console.log('3. Restart your production application');
  console.log('');
  console.log('🔒 Security Note:');
  console.log('   Keep this value secret! It grants admin access to Firebase.');
  console.log('   Never commit it to version control.');
  console.log('');

  // Also write to a temporary file for easy copying
  const outputPath = path.join(__dirname, '../temp-firebase-env.txt');
  fs.writeFileSync(outputPath, `FIREBASE_SERVICE_ACCOUNT='${envValue}'\n`);
  console.log(`💾 Also saved to: ${outputPath}`);
  console.log('   (Delete this file after copying the value)');
  console.log('');

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
