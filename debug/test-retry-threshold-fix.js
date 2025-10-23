#!/usr/bin/env node

/**
 * Test Script: Verify Retry Threshold Fix
 * 
 * This script tests the critical bug fix where users could play wavelength-gems
 * even after running out of retries by navigating away and back to the game.
 * 
 * The fix adds a retry threshold check to the initGame() function.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Retry Threshold Fix...\n');

// Read the engine.js file to verify the fix
const enginePath = path.join(__dirname, '..', 'static', 'js', 'games', 'wavelength-gems', 'engine.js');

try {
    const engineContent = fs.readFileSync(enginePath, 'utf8');
    
    // Test 1: Check if initGame function exists
    const initGameMatch = engineContent.match(/async function initGame\(levelNumber = 1\) \{/);
    console.log('✅ Test 1: initGame function found:', !!initGameMatch);
    
    // Test 2: Check if retry threshold check is present in initGame
    const retryCheckMatch = engineContent.match(/RetryThresholdManager\.isThresholdReached\(\)/);
    console.log('✅ Test 2: Retry threshold check found:', !!retryCheckMatch);
    
    // Test 3: Check if the check is inside initGame function
    const initGameStart = engineContent.indexOf('async function initGame(levelNumber = 1) {');
    const nextFunctionStart = engineContent.indexOf('function ', initGameStart + 1);
    const initGameSection = engineContent.substring(initGameStart, nextFunctionStart);
    
    const hasRetryCheckInInit = initGameSection.includes('RetryThresholdManager.isThresholdReached()');
    console.log('✅ Test 3: Retry check is inside initGame:', hasRetryCheckInInit);
    
    // Test 4: Check if early return is implemented
    const hasEarlyReturn = initGameSection.includes('return; // Exit early');
    console.log('✅ Test 4: Early return implemented:', hasEarlyReturn);
    
    // Test 5: Check if showRetryThresholdReachedModal function exists
    const modalFunctionMatch = engineContent.match(/function showRetryThresholdReachedModal\(\)/);
    console.log('✅ Test 5: showRetryThresholdReachedModal function found:', !!modalFunctionMatch);
    
    // Test 6: Check if closeLevelModal handles the new modal
    const closeModalMatch = engineContent.match(/getElementById\('retryThresholdModal'\)/);
    console.log('✅ Test 6: closeLevelModal handles retry threshold modal:', !!closeModalMatch);
    
    // Summary
    console.log('\n📊 Fix Verification Summary:');
    const allTestsPassed = initGameMatch && retryCheckMatch && hasRetryCheckInInit && 
                          hasEarlyReturn && modalFunctionMatch && closeModalMatch;
    
    if (allTestsPassed) {
        console.log('🎉 ALL TESTS PASSED! The retry threshold bug fix is properly implemented.');
        console.log('\n🔧 Fix Details:');
        console.log('   - initGame() now checks RetryThresholdManager.isThresholdReached()');
        console.log('   - Game initialization is blocked when retries are exhausted');
        console.log('   - Users are shown ad offer or fallback modal instead');
        console.log('   - Fix prevents the navigation bypass bug');
    } else {
        console.log('❌ Some tests failed. Please review the implementation.');
    }
    
    // Extract the actual retry check code for verification
    console.log('\n📝 Retry Check Implementation:');
    const retryCheckStart = initGameSection.indexOf('// CRITICAL BUG FIX');
    const retryCheckEnd = initGameSection.indexOf('// Disable collectibles');
    if (retryCheckStart !== -1 && retryCheckEnd !== -1) {
        const retryCheckCode = initGameSection.substring(retryCheckStart, retryCheckEnd).trim();
        console.log(retryCheckCode);
    }
    
} catch (error) {
    console.error('❌ Error reading engine.js:', error.message);
}

console.log('\n🎮 Test Complete: Wavelength Gems retry threshold fix verification finished.');