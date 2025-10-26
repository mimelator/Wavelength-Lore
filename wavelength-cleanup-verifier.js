#!/usr/bin/env node

/**
 * 🌊 WAVELENGTH DIRECTORY CLEANUP VERIFIER
 * Post-cleanup verification using pure WAVELENGTH methodology
 */

const fs = require('fs');
const path = require('path');

console.log('⚡⚡⚡ WAVELENGTH CLEANUP VERIFICATION ACTIVATED! ⚡⚡⚡\n');

function verifyCleanup() {
  console.log('🔍 WAVELENGTH: Verifying directory cleanup results...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Check root directory
  const rootItems = fs.readdirSync('.');
  const rootFiles = rootItems.filter(item => {
    const stat = fs.statSync(item);
    return stat.isFile() && !item.startsWith('.');
  });

  console.log('📊 ROOT DIRECTORY STATUS:');
  console.log(`   📁 Total items: ${rootItems.length}`);
  console.log(`   📄 Files (non-hidden): ${rootFiles.length}`);
  console.log('');

  // Show remaining root files
  console.log('📄 REMAINING ROOT FILES:');
  const coreFiles = ['app.js', 'index.js', 'package.json', 'Dockerfile', 'README.md', 'LICENSE'];
  const configFiles = rootFiles.filter(f => f.startsWith('.env') || f.endsWith('.json') || f.endsWith('.js'));
  const otherFiles = rootFiles.filter(f => !coreFiles.includes(f) && !configFiles.includes(f));

  console.log('   ✅ Core Application Files:');
  coreFiles.filter(f => rootFiles.includes(f)).forEach(f => console.log(`      • ${f}`));
  
  if (otherFiles.length > 0) {
    console.log('   ⚠️  Other Files Still Present:');
    otherFiles.forEach(f => console.log(`      • ${f}`));
  }
  
  console.log('');

  // Check organized directories
  const organizedDirs = [
    'wavelength-tools',
    'documentation',
    'logs', 
    'proof',
    'backup',
    'temp-files',
    'docker'
  ];

  console.log('📁 ORGANIZED DIRECTORIES:');
  organizedDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      const items = fs.readdirSync(dir);
      console.log(`   ✅ ${dir}/ (${items.length} items)`);
      if (items.length > 0) {
        items.slice(0, 3).forEach(item => console.log(`      • ${item}`));
        if (items.length > 3) console.log(`      ... and ${items.length - 3} more`);
      }
    } else {
      console.log(`   ❌ ${dir}/ (not created)`);
    }
    console.log('');
  });

  // Calculate cleanup success
  const wavelengthFiles = rootFiles.filter(f => f.startsWith('wavelength-') || f.startsWith('test-') || f.startsWith('debug-'));
  const documentationFiles = rootFiles.filter(f => f.endsWith('.md') && f.includes('_'));
  
  console.log('🎯 CLEANUP EFFECTIVENESS:');
  console.log(`   📊 WAVELENGTH tools in root: ${wavelengthFiles.length} (should be 0)`);
  console.log(`   📝 Documentation files in root: ${documentationFiles.length} (should be minimal)`);
  
  const cleanupScore = Math.max(0, 100 - (wavelengthFiles.length * 10) - (documentationFiles.length * 5));
  console.log(`   🏆 Organization Score: ${cleanupScore}%`);
  
  if (cleanupScore >= 90) {
    console.log('   🎉 EXCELLENT: Root directory is well organized!');
  } else if (cleanupScore >= 70) {
    console.log('   ✅ GOOD: Significant improvement achieved!');
  } else {
    console.log('   ⚠️  NEEDS WORK: More organization needed');
  }

  console.log('\n🌊 WAVELENGTH DIRECTORY CLEANUP VERIFICATION COMPLETE!');
  console.log('⚡ Pure methodology verification successful!');
}

verifyCleanup();