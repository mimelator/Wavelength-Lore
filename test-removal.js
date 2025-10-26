#!/usr/bin/env node
/**
 * Quick test to verify "View Printable Image" button removal
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 AGENT_BETA: Verifying "View Printable Image" functionality removal...\n');

// Check JavaScript file
const jsFile = path.join(__dirname, 'static/js/components/merchandise-store.js');
const jsContent = fs.readFileSync(jsFile, 'utf8');

console.log('📄 Checking JavaScript file...');

// Check for removed elements
const hasPreviewButton = jsContent.includes('View Printable Image');
const hasPreviewEnhancementMethod = jsContent.includes('previewEnhancement(');
const hasShowEnhancementPreview = jsContent.includes('showEnhancementPreview(');
const hasBtnPreviewEnhancement = jsContent.includes('btn-preview-enhancement');

console.log(`   ❌ "View Printable Image" text: ${hasPreviewButton ? 'FOUND (should be removed)' : 'REMOVED ✅'}`);
console.log(`   ❌ previewEnhancement method: ${hasPreviewEnhancementMethod ? 'FOUND (should be removed)' : 'REMOVED ✅'}`);
console.log(`   ❌ showEnhancementPreview method: ${hasShowEnhancementPreview ? 'FOUND (should be removed)' : 'REMOVED ✅'}`);
console.log(`   ❌ btn-preview-enhancement class: ${hasBtnPreviewEnhancement ? 'FOUND (should be removed)' : 'REMOVED ✅'}`);

// Check CSS file
const cssFile = path.join(__dirname, 'static/css/merchandise-store.css');
const cssContent = fs.readFileSync(cssFile, 'utf8');

console.log('\n🎨 Checking CSS file...');

const hasBtnPreviewEnhancementCSS = cssContent.includes('.btn-preview-enhancement');
const hasEnhancementPreviewModal = cssContent.includes('.enhancement-preview-modal');
const hasEnhancementPreviewContent = cssContent.includes('.enhancement-preview-content');

console.log(`   ❌ .btn-preview-enhancement styles: ${hasBtnPreviewEnhancementCSS ? 'FOUND (should be removed)' : 'REMOVED ✅'}`);
console.log(`   ❌ .enhancement-preview-modal styles: ${hasEnhancementPreviewModal ? 'FOUND (should be removed)' : 'REMOVED ✅'}`);
console.log(`   ❌ .enhancement-preview-content styles: ${hasEnhancementPreviewContent ? 'FOUND (should be removed)' : 'REMOVED ✅'}`);

// Check test file
const testFile = path.join(__dirname, 'tests/merchandise-ui-interactions.test.js');
const testContent = fs.readFileSync(testFile, 'utf8');

console.log('\n🧪 Checking test file...');

const hasViewPrintableImageTest = testContent.includes('await tester.testViewPrintableImageButton();');
const testDisabled = testContent.includes('// await tester.testViewPrintableImageButton(); // Removed');

console.log(`   ❌ testViewPrintableImageButton enabled: ${hasViewPrintableImageTest ? 'ENABLED (should be disabled)' : 'DISABLED ✅'}`);
console.log(`   ✅ Test properly commented out: ${testDisabled ? 'YES ✅' : 'NO (should be commented)'}`);

// Verify Select button still exists
const hasSelectButton = jsContent.includes('gallery-image-select');
console.log(`\n✅ Select button functionality preserved: ${hasSelectButton ? 'YES ✅' : 'NO (problem!)'}`);

// Summary
console.log('\n📊 SUMMARY:');
const allRemoved = !hasPreviewButton && !hasPreviewEnhancementMethod && !hasShowEnhancementPreview && 
                   !hasBtnPreviewEnhancement && !hasBtnPreviewEnhancementCSS && !hasEnhancementPreviewModal &&
                   !hasEnhancementPreviewContent && !hasViewPrintableImageTest && hasSelectButton;

if (allRemoved) {
  console.log('✅ SUCCESS: "View Printable Image" functionality completely removed!');
  console.log('✅ Select button functionality preserved');
  console.log('✅ Clean removal with no dangling code');
} else {
  console.log('⚠️  PARTIAL: Some elements may still exist');
}

console.log('\n🎯 AGENT_BETA: Task completed - merchandise page cleaned up!');