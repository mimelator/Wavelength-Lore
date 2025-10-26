#!/usr/bin/env node

/**
 * 🌊 WAVELENGTH: GitHub Actions Workflow Fix Validation
 * 
 * Tests the shell escaping fix for commit message parsing
 * Validates the workflow can handle complex commit messages
 */

import { execSync } from 'child_process';
import fs from 'fs';

console.log('🧪 WAVELENGTH: GitHub Actions Workflow Fix Validation');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Test data - complex commit messages that previously caused failures
const testCommitMessages = [
    {
        name: 'Complex ES Module Message',
        message: `🚀 MAJOR: Complete ES Module Migration + MCP-First Development Breakthrough

✨ Features:
- Package.json "type": "module" configuration fix (CRITICAL)
- Enhanced WAVELENGTH MCP server compatibility (.cjs extension)

🔧 Technical Implementation:
- Fixed package.json "type": "module" configuration (was "commonjs")
- ES module import/export syntax throughout codebase

Version: 1.0.177 → 1.0.178`,
        expected: 'increment'
    },
    {
        name: 'Skip Version Message',
        message: '🔖 Auto-increment version to v1.0.179 after successful deployment [skip version]',
        expected: 'skip'
    },
    {
        name: 'Simple Message',
        message: 'Fix: Update documentation',
        expected: 'increment'
    },
    {
        name: 'Complex with Quotes and Special Chars',
        message: `Update: "Configuration" fixes & shell $VAR handling
- Fixed "type": "module" issue
- Added $PATH handling
- Updated 'single quotes' and "double quotes"
Special chars: !@#$%^&*()`,
        expected: 'increment'
    }
];

let testsPassed = 0;
let testsTotal = 0;

console.log('📋 Testing Commit Message Parsing Logic:\n');

for (const test of testCommitMessages) {
    testsTotal++;
    console.log(`🧪 Test ${testsTotal}: ${test.name}`);
    
    try {
        // Simulate the GitHub Actions environment variable approach
        process.env.COMMIT_MESSAGE = test.message;
        
        // Test the shell logic that was failing
        const result = execSync(`
            if echo "$COMMIT_MESSAGE" | grep -q "\\[skip version\\]"; then
                echo "skip"
            else
                echo "increment"
            fi
        `, { 
            encoding: 'utf8',
            env: process.env
        }).trim();
        
        const passed = result === test.expected;
        
        if (passed) {
            console.log(`   ✅ PASS: Expected '${test.expected}', got '${result}'`);
            testsPassed++;
        } else {
            console.log(`   ❌ FAIL: Expected '${test.expected}', got '${result}'`);
        }
        
    } catch (error) {
        console.log(`   ❌ ERROR: Shell parsing failed - ${error.message}`);
    }
    
    console.log('');
}

// Validate workflow file syntax
console.log('📄 Validating Workflow File Syntax:');
testsTotal++;

try {
    const workflowContent = fs.readFileSync('.github/workflows/docker-ecr-deploy.yml', 'utf8');
    
    // Check for the fixed environment variable approach
    if (workflowContent.includes('env:\n          COMMIT_MESSAGE: ${{ github.event.head_commit.message }}')) {
        console.log('   ✅ PASS: Workflow uses environment variable approach');
        testsPassed++;
    } else {
        console.log('   ❌ FAIL: Workflow still uses inline string interpolation');
    }
    
    // Check for duplicate code removal
    const duplicateCodePattern = /fi\s*fi/;
    if (!duplicateCodePattern.test(workflowContent)) {
        console.log('   ✅ PASS: Duplicate code removed from workflow');
    } else {
        console.log('   ⚠️  WARNING: Found potential duplicate code in workflow');
    }
    
} catch (error) {
    console.log(`   ❌ ERROR: Could not read workflow file - ${error.message}`);
}

console.log('\n🎯 VALIDATION RESULTS:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`📊 Tests Passed: ${testsPassed}/${testsTotal}`);

if (testsPassed === testsTotal) {
    console.log('🎉 ALL TESTS PASSED - GitHub Actions workflow fix validated!');
    console.log('✅ Complex commit messages can now be processed safely');
    console.log('✅ Shell escaping issues resolved');
    process.exit(0);
} else {
    console.log('❌ SOME TESTS FAILED - Workflow needs additional fixes');
    process.exit(1);
}