#!/usr/bin/env node

const fs = require('fs');

// Read the forum routes file
const routesPath = './routes/forum.js';
let content = fs.readFileSync(routesPath, 'utf8');

// Replace all Firebase initialization blocks with working version
const oldPattern = /const admin = require\('firebase-admin'\);\s*if \(!process\.env\.FIREBASE_SERVICE_ACCOUNT\) \{\s*require\('dotenv'\)\.config\(\);\s*\}\s*if \(admin\.apps\.length === 0\)/g;

const newPattern = `const admin = require('firebase-admin');
        
        if (admin.apps.length === 0)`;

content = content.replace(oldPattern, newPattern);

// Write back the file
fs.writeFileSync(routesPath, content);

console.log('✅ Fixed Firebase initialization in forum routes');
process.exit(0);