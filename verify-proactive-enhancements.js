#!/usr/bin/env node

/**
 * 🔍 WAVELENGTH: Code Changes Verification
 * Verifies all the PROACTIVE format tracking enhancements are in place
 */

const fs = require('fs');

console.log('🔍 WAVELENGTH: Verifying PROACTIVE format tracking enhancements...\n');

const checks = [
  {
    file: 'services/image-upscaling-service.js',
    description: 'Enhanced upscaler format tracking for no-extension filenames',
    checkFor: 'finalFileName = fileName + \'.png\';',
    lineContext: 'added .png extension'
  },
  {
    file: 'services/EffectsProcessor.js', 
    description: 'Effects processor changed from WebP to PNG output',
    checkFor: '.png({',
    lineContext: 'maintaining PNG format for Printify compatibility'
  },
  {
    file: 'services/auto-enhanced-printify-service.js',
    description: 'Auto-enhanced service tracks PNG format maintenance',
    checkFor: 'Effects processor maintained PNG format',
    lineContext: 'PROACTIVE FORMAT TRACKING'
  }
];

let allChecksPass = true;

checks.forEach((check, index) => {
  console.log(`${index + 1}. Checking: ${check.description}`);
  
  try {
    const filePath = `/Volumes/5bits/current/wavelength-dev/Wavelength-Lore/Wavelength-Lore.fresh/${check.file}`;
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    if (fileContent.includes(check.checkFor)) {
      console.log(`   ✅ FOUND: "${check.checkFor}"`);
      
      // Find the line number for context
      const lines = fileContent.split('\n');
      const lineIndex = lines.findIndex(line => line.includes(check.checkFor));
      if (lineIndex !== -1) {
        console.log(`   📍 Line ${lineIndex + 1}: ${lines[lineIndex].trim()}`);
      }
    } else {
      console.log(`   ❌ NOT FOUND: "${check.checkFor}"`);
      allChecksPass = false;
    }
    
  } catch (error) {
    console.log(`   ❌ ERROR reading ${check.file}: ${error.message}`);
    allChecksPass = false;
  }
  
  console.log('');
});

console.log('📋 VERIFICATION SUMMARY:');
if (allChecksPass) {
  console.log('✅ All PROACTIVE format tracking enhancements are in place!');
  console.log('🚀 Ready to test the WebP format issue resolution.');
} else {
  console.log('❌ Some enhancements are missing. Please review the changes.');
}

console.log('\n🌊 Verification complete!');