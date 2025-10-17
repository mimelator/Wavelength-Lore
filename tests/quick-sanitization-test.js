#!/usr/bin/env node

/**
 * Quick Input Sanitization Test
 * Standalone test for input sanitization functionality
 */

require('dotenv').config({ path: '../.env' });
const InputSanitizer = require('../middleware/inputSanitization');

console.log('🧹 Quick Input Sanitization Test');
console.log('='.repeat(35));
console.log('');

async function runQuickTests() {
  let passed = 0;
  let failed = 0;

  // Test 1: XSS Prevention
  console.log('🧪 Test 1: XSS Prevention');
  try {
    const maliciousInput = '<script>alert("XSS")</script><p>Hello</p>';
    const sanitized = InputSanitizer.sanitizeHTML(maliciousInput);
    
    if (!sanitized.includes('<script>') && sanitized.includes('<p>Hello</p>')) {
      console.log('✅ PASS: XSS script tags removed, safe content preserved');
      passed++;
    } else {
      console.log('❌ FAIL: XSS prevention failed');
      failed++;
    }
  } catch (error) {
    console.log('❌ FAIL: XSS test error:', error.message);
    failed++;
  }

  // Test 2: HTML Sanitization
  console.log('🧪 Test 2: HTML Sanitization');
  try {
    const htmlInput = '<div onclick="alert()">Safe</div><b>Bold</b>';
    const sanitized = InputSanitizer.sanitizeHTML(htmlInput);
    
    if (!sanitized.includes('onclick') && sanitized.includes('<b>Bold</b>')) {
      console.log('✅ PASS: Dangerous attributes removed, safe tags preserved');
      passed++;
    } else {
      console.log('❌ FAIL: HTML sanitization failed');
      failed++;
    }
  } catch (error) {
    console.log('❌ FAIL: HTML sanitization error:', error.message);
    failed++;
  }

  // Test 3: Text Sanitization
  console.log('🧪 Test 3: Text Sanitization');
  try {
    const textInput = '  <p>Hello & World</p>  ';
    const sanitized = InputSanitizer.sanitizeText(textInput);
    
    if (sanitized.includes('&lt;p&gt;') && sanitized.includes('&amp;') && sanitized.trim() === sanitized) {
      console.log('✅ PASS: HTML escaped, whitespace trimmed');
      passed++;
    } else {
      console.log('❌ FAIL: Text sanitization failed');
      failed++;
    }
  } catch (error) {
    console.log('❌ FAIL: Text sanitization error:', error.message);
    failed++;
  }

  // Test 4: Profanity Detection
  console.log('🧪 Test 4: Profanity Detection');
  try {
    const cleanText = 'Hello wonderful world';
    const profanityResult = InputSanitizer.checkProfanity(cleanText);
    
    if (!profanityResult.isProfane && profanityResult.cleaned === cleanText) {
      console.log('✅ PASS: Clean text passed profanity filter');
      passed++;
    } else {
      console.log('❌ FAIL: Profanity detection failed');
      failed++;
    }
  } catch (error) {
    console.log('❌ FAIL: Profanity detection error:', error.message);
    failed++;
  }

  // Test 5: Email Validation
  console.log('🧪 Test 5: Email Validation');
  try {
    const validEmail = 'test@example.com';
    const invalidEmail = 'not-an-email';
    
    const sanitizedValid = InputSanitizer.sanitizeEmail(validEmail);
    const sanitizedInvalid = InputSanitizer.sanitizeEmail(invalidEmail);
    
    if (sanitizedValid === validEmail && sanitizedInvalid === null) {
      console.log('✅ PASS: Email validation working correctly');
      passed++;
    } else {
      console.log('❌ FAIL: Email validation failed');
      failed++;
    }
  } catch (error) {
    console.log('❌ FAIL: Email validation error:', error.message);
    failed++;
  }

  // Test 6: Forum Post Validation
  console.log('🧪 Test 6: Forum Post Validation');
  try {
    const postData = {
      title: 'Test Post',
      content: '<p>This is a test post</p>',
      authorName: 'TestUser'
    };
    
    const validation = InputSanitizer.validateForumPost(postData);
    
    if (validation.isValid && validation.sanitized.title === 'Test Post') {
      console.log('✅ PASS: Forum post validation working');
      passed++;
    } else {
      console.log('❌ FAIL: Forum post validation failed');
      failed++;
    }
  } catch (error) {
    console.log('❌ FAIL: Forum post validation error:', error.message);
    failed++;
  }

  console.log('');
  console.log('📊 Quick Test Results');
  console.log('='.repeat(25));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('');
    console.log('🎉 All sanitization tests passed! Dependencies are working correctly.');
  } else {
    console.log('');
    console.log('⚠️  Some tests failed. Check the dependency configuration.');
    process.exit(1);
  }
}

if (require.main === module) {
  runQuickTests().catch(console.error);
}

module.exports = runQuickTests;