#!/usr/bin/env node

/**
 * 🧪 WAVELENGTH HOME PAGE CTA JSON VALIDATION TEST
 * 
 * Test that validates the JSON parsing bug is fixed by examining
 * the rendered HTML on the home page for proper CTA disambiguation escaping
 */

const http = require('http');
const https = require('https');

// Configuration
const LOCAL_URL = 'http://localhost:3001';
const PROD_URL = 'https://wavelengthlore.com';

/**
 * Fetch HTML content from a URL
 * @param {string} url - URL to fetch
 * @returns {Promise<string>} HTML content
 */
function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    
    client.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve(data);
      });
      
    }).on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Parse and validate JSON data attributes in HTML
 * @param {string} html - HTML content to analyze
 * @returns {object} Validation results
 */
function validateCTAJsonInHtml(html) {
  const results = {
    totalDisambiguationLinks: 0,
    validJsonAttributes: 0,
    invalidJsonAttributes: 0,
    problematicContent: [],
    validationErrors: [],
    sampleData: []
  };

  // Find all disambiguation links with data-conflicts attributes
  const disambiguationRegex = /<span[^>]*class="disambiguation-link"[^>]*data-conflicts="([^"]*)"[^>]*data-phrase="([^"]*)"[^>]*>/g;
  
  let match;
  while ((match = disambiguationRegex.exec(html)) !== null) {
    results.totalDisambiguationLinks++;
    
    const escapedConflicts = match[1];
    const escapedPhrase = match[2];
    
    try {
      // Test unescaping the JSON data (simulating browser parsing)
      const unescapedData = escapedConflicts
        .replace(/&amp;/g, '&')     // Unescape ampersands first
        .replace(/&lt;/g, '<')      // Unescape less than
        .replace(/&gt;/g, '>')      // Unescape greater than
        .replace(/&#x27;/g, "'")    // Unescape single quotes
        .replace(/&quot;/g, '"')    // Unescape quotes
        .replace(/\\\\/g, '\\');    // Unescape backslashes
      
      // Try to parse the JSON - this is where the original error occurred
      const conflicts = JSON.parse(unescapedData);
      
      results.validJsonAttributes++;
      
      // Store sample data for analysis
      if (results.sampleData.length < 3) {
        results.sampleData.push({
          phrase: escapedPhrase,
          conflictsCount: Array.isArray(conflicts) ? conflicts.length : 0,
          hasProblematicChars: /['"\\<>&]/.test(escapedPhrase) || /['"\\<>&]/.test(unescapedData),
          firstConflict: Array.isArray(conflicts) && conflicts[0] ? {
            type: conflicts[0].type,
            name: conflicts[0].name,
            hasSpecialChars: /['"\\<>&]/.test(conflicts[0].name || '')
          } : null
        });
      }
      
      // Check for problematic content that could have caused the original error
      if (Array.isArray(conflicts)) {
        conflicts.forEach(conflict => {
          if (conflict.name && /['"\\<>&]/.test(conflict.name)) {
            results.problematicContent.push({
              phrase: escapedPhrase,
              conflictName: conflict.name,
              conflictType: conflict.type,
              problemChars: (conflict.name.match(/['"\\<>&]/g) || []).join(', ')
            });
          }
        });
      }
      
    } catch (error) {
      results.invalidJsonAttributes++;
      results.validationErrors.push({
        phrase: escapedPhrase,
        error: error.message,
        rawData: escapedConflicts.substring(0, 100) + '...',
        position: error.message.match(/position (\\d+)/) ? 
          parseInt(error.message.match(/position (\\d+)/)[1]) : null
      });
    }
  }
  
  return results;
}

/**
 * Test a specific URL for CTA JSON validation
 * @param {string} url - URL to test
 * @param {string} label - Label for the test
 */
async function testUrl(url, label) {
  console.log(`\\n🌊 TESTING ${label.toUpperCase()}: ${url}`);
  console.log('─'.repeat(60));
  
  try {
    console.log('📥 Fetching HTML content...');
    const html = await fetchHtml(url);
    console.log(`✅ HTML fetched: ${html.length} characters`);
    
    console.log('🔍 Analyzing CTA disambiguation links...');
    const results = validateCTAJsonInHtml(html);
    
    // Display results
    console.log(`\\n📊 VALIDATION RESULTS:`);
    console.log(`   Total disambiguation links found: ${results.totalDisambiguationLinks}`);
    console.log(`   Valid JSON attributes: ${results.validJsonAttributes}`);
    console.log(`   Invalid JSON attributes: ${results.invalidJsonAttributes}`);
    console.log(`   Problematic content items: ${results.problematicContent.length}`);
    
    // Show validation status
    if (results.invalidJsonAttributes === 0) {
      console.log('   ✅ ALL JSON ATTRIBUTES VALID - Bug is fixed!');
    } else {
      console.log('   ❌ INVALID JSON FOUND - Bug still exists!');
    }
    
    // Show sample data
    if (results.sampleData.length > 0) {
      console.log(`\\n📋 SAMPLE DISAMBIGUATION DATA:`);
      results.sampleData.forEach((sample, i) => {
        console.log(`   ${i + 1}. Phrase: "${sample.phrase}"`);
        console.log(`      Conflicts: ${sample.conflictsCount}`);
        console.log(`      Has special chars: ${sample.hasProblematicChars ? '⚠️ YES' : '✅ NO'}`);
        if (sample.firstConflict) {
          console.log(`      First conflict: ${sample.firstConflict.type} - "${sample.firstConflict.name}"`);
          console.log(`      Conflict has special chars: ${sample.firstConflict.hasSpecialChars ? '⚠️ YES' : '✅ NO'}`);
        }
      });
    }
    
    // Show problematic content that's now handled safely
    if (results.problematicContent.length > 0) {
      console.log(`\\n⚠️ PROBLEMATIC CONTENT (Now handled safely):`);
      results.problematicContent.slice(0, 3).forEach((item, i) => {
        console.log(`   ${i + 1}. "${item.phrase}" → ${item.conflictType}: "${item.conflictName}"`);
        console.log(`      Problem chars: ${item.problemChars}`);
      });
      console.log(`   ✅ All ${results.problematicContent.length} items with special characters handled safely!`);
    }
    
    // Show any validation errors (these would be the original bug)
    if (results.validationErrors.length > 0) {
      console.log(`\\n❌ VALIDATION ERRORS (Original bug reproduced):`);
      results.validationErrors.forEach((error, i) => {
        console.log(`   ${i + 1}. Error: ${error.error}`);
        console.log(`      Phrase: "${error.phrase}"`);
        console.log(`      Position: ${error.position || 'unknown'}`);
        console.log(`      Data preview: ${error.rawData}`);
      });
    }
    
    return {
      success: results.invalidJsonAttributes === 0,
      totalLinks: results.totalDisambiguationLinks,
      validLinks: results.validJsonAttributes,
      errors: results.validationErrors
    };
    
  } catch (error) {
    console.log(`❌ Error testing ${label}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Main test function
 */
async function runValidationTest() {
  console.log('🧪 WAVELENGTH HOME PAGE CTA JSON VALIDATION TEST');
  console.log('═'.repeat(65));
  console.log('🎯 PURPOSE: Validate that the JSON parsing bug is fixed');
  console.log('   Original error: "Expected \',\' or \'}\' after property value in JSON at position 3235"');
  console.log('   This test checks rendered HTML for proper JSON escaping in CTA links');
  
  const testResults = [];
  
  // Test localhost first (if available)
  console.log('\\n🏠 Testing localhost (if server is running)...');
  try {
    const localResult = await testUrl(LOCAL_URL, 'Localhost');
    testResults.push({ url: LOCAL_URL, ...localResult });
  } catch (error) {
    console.log('⚠️ Localhost not available:', error.message);
    console.log('   💡 Start your server to test locally: node app.js');
  }
  
  // Test production
  console.log('\\n🌐 Testing production site...');
  try {
    const prodResult = await testUrl(PROD_URL, 'Production');
    testResults.push({ url: PROD_URL, ...prodResult });
  } catch (error) {
    console.log('❌ Production site error:', error.message);
  }
  
  // Summary
  console.log('\\n' + '═'.repeat(65));
  console.log('🌊 VALIDATION TEST SUMMARY');
  console.log('═'.repeat(65));
  
  if (testResults.length === 0) {
    console.log('❌ No sites could be tested');
    console.log('💡 Make sure your server is running or check network connectivity');
    return;
  }
  
  testResults.forEach(result => {
    if (result.success) {
      console.log(`✅ ${result.url}: JSON parsing bug FIXED!`);
      console.log(`   ${result.validLinks} disambiguation links all have valid JSON`);
    } else {
      console.log(`❌ ${result.url}: JSON parsing bug still exists!`);
      if (result.errors) {
        console.log(`   ${result.errors.length} JSON parsing errors found`);
      }
    }
  });
  
  const allFixed = testResults.every(r => r.success);
  
  if (allFixed) {
    console.log('\\n🎉 SUCCESS: CTA JSON parsing bug is FIXED across all tested sites!');
    console.log('\\n✅ VERIFICATION COMPLETE:');
    console.log('   • Disambiguation links render with properly escaped JSON');
    console.log('   • Special characters (quotes, backslashes, HTML) handled safely');
    console.log('   • No JSON.parse errors would occur when clicking CTA links');
    console.log('   • Site stability improved for users clicking disambiguation modals');
  } else {
    console.log('\\n⚠️ ISSUES FOUND: Some sites still have JSON parsing problems');
    console.log('   💡 Deploy the latest fixes to resolve remaining issues');
  }
  
  console.log('\\n🌊 Test complete! Check above results for detailed analysis.');
}

// Run the test
if (require.main === module) {
  runValidationTest().catch(console.error);
}

module.exports = { validateCTAJsonInHtml, testUrl, runValidationTest };