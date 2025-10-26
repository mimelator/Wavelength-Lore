#!/usr/bin/env node

/**
 * 🌊⚡ WAVELENGTH CLI: Quick Issue Generator ⚡🌊
 * 
 * Quick command-line interface for generating GitHub issues
 * Usage: node generate-issue.js --title "Issue Title" --problem "Problem" --solution "Solution"
 */

const WavelengthIssueGenerator = require('./wavelength-tools/wavelength-issue-generator.js');

async function quickGenerate() {
  const args = process.argv.slice(2);
  
  // Parse command line arguments
  const data = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];
    data[key] = value;
  }

  if (!data.title || !data.problem || !data.solution) {
    console.log('🌊⚡ WAVELENGTH Quick Issue Generator');
    console.log('\nUsage:');
    console.log('  node generate-issue.js --title "Issue Title" --problem "Problem Description" --solution "Solution Implemented"');
    console.log('\nOptional:');
    console.log('  --technical_details "Technical details"');
    console.log('  --prevention "Prevention measures"');
    console.log('  --category "Infrastructure"');
    console.log('  --priority "High"');
    return;
  }

  try {
    const generator = new WavelengthIssueGenerator();
    const result = await generator.generateIssue(data);
    
    console.log('\n🎉 SUCCESS!');
    console.log(`📄 File: ${result.filename}`);
    if (result.issueUrl) {
      console.log(`🔗 GitHub: ${result.issueUrl}`);
    }
    console.log('\n✅ Ready for WAVELENGTH AGENTS dynamic vector store!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

quickGenerate();