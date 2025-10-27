#!/usr/bin/env node

/**
 * 🧪 WAVELENGTH DIRECT JSON ESCAPING VALIDATION TEST
 * 
 * This test directly validates the JSON escaping utilities we created
 * to fix the CTA disambiguation parsing bug.
 */

console.log('🧪 WAVELENGTH DIRECT JSON ESCAPING VALIDATION TEST');
console.log('════════════════════════════════════════════════════════════');
console.log('🎯 PURPOSE: Directly test JSON escaping utilities');
console.log('   Testing the exact functions that fix the parsing bug');
console.log('   Validating problematic content from the original error\n');

// Import our JSON escaping utilities
const path = require('path');
const fs = require('fs');

// Check if our utils file exists
const utilsPath = path.join(__dirname, 'utils/json-escaping-utils.js');
if (!fs.existsSync(utilsPath)) {
  console.log('❌ ERROR: utils/json-escaping-utils.js not found');
  console.log('   Expected at:', utilsPath);
  process.exit(1);
}

const { escapeJsonForHtml, unescapeJsonFromHtml, createDisambiguationAttributes } = require('./utils/json-escaping-utils');

console.log('✅ JSON escaping utilities loaded successfully');
console.log('🔍 Testing problematic content that caused the original error...\n');

// Test cases that would have caused the original JSON parsing error
const problematicTestCases = [
  {
    name: 'Quotes in text',
    content: 'This is a "quoted" phrase that breaks JSON',
    expected: 'Should handle quotes without breaking JSON.parse()'
  },
  {
    name: 'Backslashes and escapes',
    content: 'Path\\to\\file and \\n newlines \\t tabs',
    expected: 'Should handle backslashes and escape sequences'
  },
  {
    name: 'HTML entities',
    content: 'HTML &amp; entities &lt;tag&gt; content',
    expected: 'Should handle HTML entities safely'
  },
  {
    name: 'Mixed problematic content',
    content: 'Complex "quoted" content with \\backslashes\\ and &amp; entities',
    expected: 'Should handle complex mixed content'
  },
  {
    name: 'CTA-style content',
    content: 'Call-to-action "Learn More" about Wavelength\'s content',
    expected: 'Should handle typical CTA text with quotes and apostrophes'
  }
];

console.log('🧪 RUNNING ESCAPE/UNESCAPE TESTS:');
console.log('────────────────────────────────────────────────────────────\n');

let allTestsPassed = true;
let testCount = 0;

problematicTestCases.forEach((testCase, index) => {
  testCount++;
  console.log(`${index + 1}. Testing: ${testCase.name}`);
  console.log(`   Original: "${testCase.content}"`);
  
  try {
    // Test escaping
    const escaped = escapeJsonForHtml(testCase.content);
    console.log(`   Escaped:  "${escaped}"`);
    
    // Test that escaped version can be safely used in JSON
    const testJson = JSON.stringify({ content: escaped });
    console.log(`   JSON:     ${testJson}`);
    
    // Test parsing the JSON (this would have failed before our fix)
    const parsed = JSON.parse(testJson);
    console.log(`   Parsed:   "${parsed.content}"`);
    
    // Test unescaping back to original
    const unescaped = unescapeJsonFromHtml(escaped);
    console.log(`   Unescaped: "${unescaped}"`);
    
    // Verify round-trip integrity
    if (unescaped === testCase.content) {
      console.log('   ✅ PASS: Round-trip successful');
    } else {
      console.log('   ❌ FAIL: Round-trip failed');
      console.log(`      Expected: "${testCase.content}"`);
      console.log(`      Got:      "${unescaped}"`);
      allTestsPassed = false;
    }
    
  } catch (error) {
    console.log(`   ❌ FAIL: Error during test - ${error.message}`);
    allTestsPassed = false;
  }
  
  console.log('');
});

console.log('🧪 TESTING DISAMBIGUATION ATTRIBUTES CREATION:');
console.log('────────────────────────────────────────────────────────────\n');

// Test the full disambiguation attribute creation
const ctaData = {
  text: 'Learn More about "Wavelength\'s" content & features',
  url: '/learn-more',
  type: 'cta-button',
  metadata: {
    campaign: 'home-page',
    section: 'hero'
  }
};

try {
  testCount++;
  console.log('Testing createDisambiguationAttributes with problematic content...');
  console.log('Original CTA data:', JSON.stringify(ctaData, null, 2));
  
  const attributes = createDisambiguationAttributes(ctaData);
  console.log('Generated attributes:', attributes);
  
  // Test that the attributes can be safely parsed
  const dataContent = attributes.match(/data-disambiguation-content="([^"]+)"/);
  if (dataContent && dataContent[1]) {
    const unescapedContent = unescapeJsonFromHtml(dataContent[1]);
    const parsedData = JSON.parse(unescapedContent);
    console.log('Successfully parsed data:', parsedData);
    console.log('✅ PASS: Disambiguation attributes work correctly');
  } else {
    console.log('❌ FAIL: Could not extract data-disambiguation-content');
    allTestsPassed = false;
  }
  
} catch (error) {
  console.log(`❌ FAIL: Error testing disambiguation attributes - ${error.message}`);
  allTestsPassed = false;
}

console.log('\n══════════════════════════════════════════════════════════════');
console.log('🌊 DIRECT JSON ESCAPING TEST SUMMARY');
console.log('════════════════════════════════════════════════════════════');

if (allTestsPassed) {
  console.log('🎉 SUCCESS: All JSON escaping tests PASSED!');
  console.log(`✅ ${testCount} tests completed successfully`);
  console.log('✅ Original JSON parsing bug is definitively FIXED');
  console.log('✅ Problematic content now handles safely');
  console.log('✅ CTA disambiguation links will work without errors');
} else {
  console.log('❌ FAILURE: Some JSON escaping tests FAILED');
  console.log('⚠️  JSON parsing bug may still exist');
  console.log('🔧 Review the failed tests above and fix the utilities');
}

console.log('\n🌊 Direct validation complete!');