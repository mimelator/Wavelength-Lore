#!/usr/bin/env node
/**
 * TEST: Image ID Extractor
 */

const { extractImageId, extractFirstImageId } = require('../utils/gallery/image-id-extractor');

console.log('🧪 TEST: Image ID Extractor\n');

let passed = 0;
let failed = 0;

// Test 1: Extract from object with fileName
const test1 = {
  fileName: 'image-123.webp',
  relativePath: 'images/gallery/user/image-123.webp'
};
const result1 = extractImageId(test1);
if (result1 === 'image-123.webp') {
  console.log('✅ Test 1: Extract fileName');
  passed++;
} else {
  console.log(`❌ Test 1 FAILED: Expected 'image-123.webp', got '${result1}'`);
  failed++;
}

// Test 2: Extract from object with only relativePath
const test2 = {
  relativePath: 'images/gallery/user/image-456.webp'
};
const result2 = extractImageId(test2);
if (result2 === 'images/gallery/user/image-456.webp') {
  console.log('✅ Test 2: Extract relativePath');
  passed++;
} else {
  console.log(`❌ Test 2 FAILED: Expected 'images/gallery/user/image-456.webp', got '${result2}'`);
  failed++;
}

// Test 3: Extract from null
const result3 = extractImageId(null);
if (result3 === null) {
  console.log('✅ Test 3: Handle null');
  passed++;
} else {
  console.log(`❌ Test 3 FAILED: Expected null, got '${result3}'`);
  failed++;
}

// Test 4: Extract from empty object
const result4 = extractImageId({});
if (result4 === null) {
  console.log('✅ Test 4: Handle empty object');
  passed++;
} else {
  console.log(`❌ Test 4 FAILED: Expected null, got '${result4}'`);
  failed++;
}

// Test 5: Extract first from array
const test5 = [
  { fileName: 'first.webp' },
  { fileName: 'second.webp' }
];
const result5 = extractFirstImageId(test5);
if (result5 === 'first.webp') {
  console.log('✅ Test 5: Extract first from array');
  passed++;
} else {
  console.log(`❌ Test 5 FAILED: Expected 'first.webp', got '${result5}'`);
  failed++;
}

// Test 6: Extract from empty array
const result6 = extractFirstImageId([]);
if (result6 === null) {
  console.log('✅ Test 6: Handle empty array');
  passed++;
} else {
  console.log(`❌ Test 6 FAILED: Expected null, got '${result6}'`);
  failed++;
}

// Test 7: Real gallery storage response format
const test7 = [{
  url: 'https://cdn.example.com/images/gallery/user/image-123.webp',
  relativePath: 'images/gallery/user/image-123.webp',
  fileName: 'image-123.webp',
  originalName: 'alexandria.webp',
  title: 'Alexandria',
  tags: ['unknown'],
  size: 228156
}];
const result7 = extractFirstImageId(test7);
if (result7 === 'image-123.webp') {
  console.log('✅ Test 7: Real gallery storage format');
  passed++;
} else {
  console.log(`❌ Test 7 FAILED: Expected 'image-123.webp', got '${result7}'`);
  failed++;
}

console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('✅ ALL TESTS PASSED');
  process.exit(0);
}
