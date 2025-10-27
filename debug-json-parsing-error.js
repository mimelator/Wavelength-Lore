#!/usr/bin/env node

/**
 * 🔍 WAVELENGTH JSON PARSING ERROR DIAGNOSTIC TOOL
 * 
 * This tool will help us identify exactly what's causing the JSON parsing error
 * at position 3235 on line 2081 of the index page.
 */

console.log('🔍 WAVELENGTH JSON PARSING ERROR DIAGNOSTIC TOOL');
console.log('════════════════════════════════════════════════════════════');
console.log('🎯 PURPOSE: Find and diagnose the exact JSON parsing error');
console.log('   Error: Expected \',\' or \'}\' after property value in JSON at position 3235');
console.log('   Location: (index):2081:29\n');

const http = require('http');
const fs = require('fs');

// Fetch the current localhost page
function fetchLocalhostPage() {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: '/',
      method: 'GET'
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    
    req.on('error', reject);
    req.end();
  });
}

// Analyze line 2081 and surrounding context
function analyzeLine2081(html) {
  const lines = html.split('\n');
  const targetLineIndex = 2080; // 0-based index for line 2081
  
  console.log('📍 ANALYZING LINE 2081 AND SURROUNDING CONTEXT:');
  console.log('────────────────────────────────────────────────────────────\n');
  
  if (targetLineIndex >= lines.length) {
    console.log('❌ Line 2081 not found - HTML has only', lines.length, 'lines');
    return null;
  }
  
  // Show context around line 2081
  const startLine = Math.max(0, targetLineIndex - 5);
  const endLine = Math.min(lines.length - 1, targetLineIndex + 5);
  
  console.log('📄 HTML CONTEXT AROUND LINE 2081:');
  for (let i = startLine; i <= endLine; i++) {
    const lineNum = i + 1;
    const line = lines[i];
    const marker = (i === targetLineIndex) ? '👉' : '  ';
    console.log(`${marker} ${lineNum.toString().padStart(4)}: ${line}`);
  }
  
  return lines[targetLineIndex];
}

// Find all JSON.parse calls in the HTML
function findJsonParseCalls(html) {
  console.log('\n🔍 SEARCHING FOR ALL JSON.parse CALLS:');
  console.log('────────────────────────────────────────────────────────────\n');
  
  const lines = html.split('\n');
  const jsonParsePattern = /JSON\.parse\s*\(/g;
  let found = false;
  
  lines.forEach((line, index) => {
    if (jsonParsePattern.test(line)) {
      found = true;
      const lineNum = index + 1;
      console.log(`📍 Line ${lineNum}: JSON.parse found`);
      console.log(`   Content: ${line.trim()}`);
      
      // Look for the data being parsed
      const dataMatch = line.match(/JSON\.parse\s*\(\s*([^)]+)\s*\)/);
      if (dataMatch) {
        console.log(`   Parsing: ${dataMatch[1]}`);
      }
      console.log('');
    }
  });
  
  if (!found) {
    console.log('⚠️  No JSON.parse calls found in HTML');
  }
  
  return found;
}

// Find all data attributes that might contain JSON
function findDataAttributes(html) {
  console.log('\n🔍 SEARCHING FOR DATA ATTRIBUTES WITH JSON:');
  console.log('────────────────────────────────────────────────────────────\n');
  
  // Look for data attributes that might contain JSON
  const dataAttrPatterns = [
    /data-conflicts="([^"]+)"/g,
    /data-disambiguation-content="([^"]+)"/g,
    /data-phrase="([^"]+)"/g,
    /data-[^=]+"(\{[^"]*\})"/g  // Any data attribute with JSON-like content
  ];
  
  let foundData = [];
  
  dataAttrPatterns.forEach((pattern, patternIndex) => {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const fullMatch = match[0];
      const dataContent = match[1];
      
      console.log(`📍 Data Attribute Found (Pattern ${patternIndex + 1}):`);
      console.log(`   Full: ${fullMatch.substring(0, 100)}${fullMatch.length > 100 ? '...' : ''}`);
      console.log(`   Content: ${dataContent.substring(0, 100)}${dataContent.length > 100 ? '...' : ''}`);
      console.log(`   Length: ${dataContent.length} characters`);
      
      // Try to unescape and parse this data
      try {
        const unescaped = dataContent
          .replace(/\\\\/g, '\\')
          .replace(/&#x27;/g, "'")
          .replace(/&quot;/g, '"')
          .replace(/&gt;/g, '>')
          .replace(/&lt;/g, '<')
          .replace(/&amp;/g, '&');
        
        console.log(`   Unescaped: ${unescaped.substring(0, 100)}${unescaped.length > 100 ? '...' : ''}`);
        
        const parsed = JSON.parse(unescaped);
        console.log(`   ✅ JSON.parse() SUCCESS: ${typeof parsed}`);
        
      } catch (error) {
        console.log(`   ❌ JSON.parse() ERROR: ${error.message}`);
        
        // Check if this error matches our target error
        if (error.message.includes('position 3235') || error.message.includes('3235')) {
          console.log('   🎯 THIS IS THE ERROR WE\'RE LOOKING FOR!');
          foundData.push({
            type: 'error-match',
            content: dataContent,
            unescaped: unescaped,
            error: error.message
          });
        }
      }
      console.log('');
    }
  });
  
  return foundData;
}

// Analyze character at position 3235 in any JSON string
function analyzePosition3235(html) {
  console.log('\n🔍 ANALYZING CHARACTER AT POSITION 3235:');
  console.log('────────────────────────────────────────────────────────────\n');
  
  // Look for any string that might be 3235+ characters
  const lines = html.split('\n');
  
  lines.forEach((line, index) => {
    // Look for data attributes or JSON strings
    const dataMatches = line.match(/data-[^=]+="([^"]+)"/g);
    if (dataMatches) {
      dataMatches.forEach(match => {
        const content = match.match(/="([^"]+)"/)[1];
        if (content.length >= 3235) {
          console.log(`📍 Found long data attribute on line ${index + 1}:`);
          console.log(`   Length: ${content.length} characters`);
          console.log(`   Character at position 3235: '${content[3234]}' (code: ${content.charCodeAt(3234)})`);
          console.log(`   Context around position 3235:`);
          console.log(`   "${content.substring(3230, 3240)}"`);
          
          // Try to parse this content
          try {
            const unescaped = content
              .replace(/\\\\/g, '\\')
              .replace(/&#x27;/g, "'")
              .replace(/&quot;/g, '"')
              .replace(/&gt;/g, '>')
              .replace(/&lt;/g, '<')
              .replace(/&amp;/g, '&');
            
            JSON.parse(unescaped);
            console.log(`   ✅ This data parses successfully`);
          } catch (error) {
            console.log(`   ❌ Parse error: ${error.message}`);
            if (error.message.includes('3235')) {
              console.log('   🎯 THIS IS THE PROBLEMATIC DATA!');
              
              // Show more context around the error
              const errorPos = 3234; // 0-based
              console.log(`   \n📊 DETAILED ERROR ANALYSIS:`);
              console.log(`   Characters around position 3235:`);
              for (let i = errorPos - 10; i <= errorPos + 10; i++) {
                if (i >= 0 && i < unescaped.length) {
                  const char = unescaped[i];
                  const code = char.charCodeAt(0);
                  const marker = (i === errorPos) ? '👉' : '  ';
                  console.log(`   ${marker} ${i}: '${char}' (${code}) ${char === '"' ? '← QUOTE' : char === ',' ? '← COMMA' : char === '}' ? '← BRACE' : ''}`);
                }
              }
            }
          }
          console.log('');
        }
      });
    }
  });
}

// Main diagnostic function
async function runDiagnostics() {
  try {
    console.log('🌐 Fetching localhost page...');
    const html = await fetchLocalhostPage();
    console.log(`✅ Page fetched: ${html.length} characters, ${html.split('\n').length} lines\n`);
    
    // Save HTML for analysis
    fs.writeFileSync('debug-html-output.html', html);
    console.log('💾 HTML saved to debug-html-output.html for manual inspection\n');
    
    // Run all diagnostic functions
    const line2081Content = analyzeLine2081(html);
    const hasJsonParse = findJsonParseCalls(html);
    const dataAttributes = findDataAttributes(html);
    analyzePosition3235(html);
    
    console.log('\n══════════════════════════════════════════════════════════════');
    console.log('🌊 DIAGNOSTIC SUMMARY');
    console.log('════════════════════════════════════════════════════════════');
    
    if (line2081Content) {
      console.log('✅ Line 2081 found and analyzed');
    } else {
      console.log('❌ Line 2081 not accessible');
    }
    
    if (hasJsonParse) {
      console.log('✅ JSON.parse calls found in HTML');
    } else {
      console.log('⚠️  No JSON.parse calls found - error might be in external JS');
    }
    
    console.log(`📊 Found ${dataAttributes.length} potentially problematic data attributes`);
    
    console.log('\n🔧 Next steps:');
    console.log('1. Check debug-html-output.html for full context');
    console.log('2. Look for the specific error pattern identified above');
    console.log('3. Focus on any data attributes longer than 3235 characters');
    
  } catch (error) {
    console.log('❌ Diagnostic failed:', error.message);
  }
}

// Run the diagnostics
runDiagnostics();