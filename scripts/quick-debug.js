#!/usr/bin/env node

/**
 * Quick Local Debug Script
 * Fast checks for local development and debugging
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('🔍 Quick Local Debug Check\n');

// 1. Check if WebP images exist locally
console.log('📸 Checking local WebP images...');
const staticPath = path.join(__dirname, '..', 'static', 'images');

function countImages(dir, extensions = ['.webp', '.png', '.jpg', '.jpeg']) {
  const counts = { webp: 0, png: 0, jpg: 0, total: 0 };
  
  function scanDir(dirPath) {
    try {
      const items = fs.readdirSync(dirPath);
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDir(fullPath);
        } else {
          const ext = path.extname(item).toLowerCase();
          counts.total++;
          if (ext === '.webp') counts.webp++;
          else if (ext === '.png') counts.png++;
          else if (ext === '.jpg' || ext === '.jpeg') counts.jpg++;
        }
      }
    } catch (error) {
      // Skip inaccessible directories
    }
  }
  
  scanDir(dir);
  return counts;
}

const imageCounts = countImages(staticPath);
console.log(`  ✅ WebP images: ${imageCounts.webp}`);
console.log(`  📊 PNG images: ${imageCounts.png}`);
console.log(`  📊 JPG images: ${imageCounts.jpg}`);
console.log(`  📊 Total images: ${imageCounts.total}`);

// 2. Check environment configuration
console.log('\n⚙️  Environment Configuration:');
console.log(`  CDN_URL: ${process.env.CDN_URL ? '✅ Set' : '❌ Missing'}`);
console.log(`  DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Missing'}`);
console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'development'}`);

// 3. Check server configuration
console.log('\n🖥️  Server Configuration:');
const packageJson = require('../package.json');
console.log(`  Port: ${process.env.NODE_PORT || process.env.PORT || '3001'}`);
console.log(`  Version: ${packageJson.version}`);

// 4. Quick sample of image paths
console.log('\n🔗 Sample WebP Image Paths:');
function findSampleImages(dir, count = 5) {
  const samples = [];
  
  function scanForSamples(dirPath, relativePath = '') {
    if (samples.length >= count) return;
    
    try {
      const items = fs.readdirSync(dirPath);
      for (const item of items) {
        if (samples.length >= count) break;
        
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanForSamples(fullPath, path.join(relativePath, item));
        } else if (item.endsWith('.webp')) {
          samples.push(path.join(relativePath, item));
        }
      }
    } catch (error) {
      // Skip inaccessible directories
    }
  }
  
  scanForSamples(dir);
  return samples;
}

const sampleImages = findSampleImages(staticPath);
sampleImages.forEach(img => {
  console.log(`  📸 /static/images/${img}`);
});

// 5. Database image reference check (quick sample)
console.log('\n🗄️  Database Configuration:');
try {
  // Check if we can connect to database
  const admin = require('firebase-admin');
  if (!admin.apps.length) {
    const serviceAccount = require('../firebaseServiceAccountKey.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.DATABASE_URL
    });
  }
  console.log('  ✅ Firebase connection configured');
} catch (error) {
  console.log(`  ❌ Firebase connection error: ${error.message}`);
}

// 6. Recommendations
console.log('\n💡 Recommendations:');

if (imageCounts.webp === 0) {
  console.log('  🚨 No WebP images found locally!');
  console.log('    - Run image optimization script first');
  console.log('    - Or update database to use PNG/JPG until WebP images are ready');
}

if (imageCounts.webp > 0 && imageCounts.png > 0) {
  console.log('  ⚠️  Both WebP and PNG/JPG images present');
  console.log('    - Database likely pointing to WebP');
  console.log('    - Local files include both formats');
  console.log('    - This is normal during migration');
}

console.log('\n🚀 Ready to start development server:');
console.log('  npm run dev     # Start with nodemon');
console.log('  npm start       # Start normally');

// 7. Quick server health check if running
console.log('\n🏥 Server Health Check:');
const serverPort = process.env.NODE_PORT || process.env.PORT || 3001;

// Try to check if server is already running
const http = require('http');
const options = {
  hostname: 'localhost',
  port: serverPort,
  path: '/health',
  method: 'GET',
  timeout: 2000
};

const req = http.request(options, (res) => {
  console.log(`  ✅ Server responding on port ${serverPort}`);
  console.log(`  📊 Status: ${res.statusCode}`);
});

req.on('error', (err) => {
  console.log(`  ❌ Server not running on port ${serverPort}`);
  console.log(`  💡 Start with: npm run dev`);
});

req.on('timeout', () => {
  console.log(`  ⏰ Server timeout on port ${serverPort}`);
  req.destroy();
});

req.end();

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');