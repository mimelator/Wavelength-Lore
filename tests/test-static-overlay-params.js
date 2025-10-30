#!/usr/bin/env node

/**
 * Quick test to verify static overlay parameter passing
 */

const effectsConfig = require('../config/effectsConfig');

console.log('🧪 Testing Static Overlay Parameter Passing...\n');

// Test case: Sepia effect + Static overlays + Border
const testToggles = {
  sepia: true,
  staticSnow: true,
  staticSparkles: true,
  staticLightning: false,
  staticFireflies: false,
  staticVignette: false,
  borderEnabled: false,
  borderWidth: 0,
  borderWidthPixels: 0,
  borderColor: '#000000'
};

console.log('📥 Input toggles:', JSON.stringify(testToggles, null, 2));

const result = effectsConfig.buildEffectsFromToggles(testToggles);

console.log('\n📤 Output effects:', JSON.stringify(result, null, 2));

// Verify static overlay parameters are preserved
const staticOverlayTests = [
  { key: 'staticSnow', expected: true },
  { key: 'staticSparkles', expected: true },
  { key: 'staticLightning', expected: false },
  { key: 'staticFireflies', expected: false },
  { key: 'staticVignette', expected: false }
];

console.log('\n✅ Static Overlay Parameter Verification:');
let allPassed = true;

staticOverlayTests.forEach(test => {
  const actual = result[test.key];
  const passed = actual === test.expected;
  console.log(`  ${passed ? '✅' : '❌'} ${test.key}: ${actual} (expected: ${test.expected})`);
  if (!passed) allPassed = false;
});

console.log(`\n🎯 Overall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}\n`);

if (allPassed) {
  console.log('🎉 Static overlay parameters are now being passed through correctly!');
  console.log('   The UI should now apply overlays when effects are selected.');
} else {
  console.log('⚠️ Static overlay parameters are not being passed through correctly.');
  console.log('   Check the effectsConfig.js buildEffectsFromToggles function.');
}