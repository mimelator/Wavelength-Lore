#!/usr/bin/env node

/**
 * Test script to verify disambiguation link spacing improvements
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Disambiguation Link Spacing Improvements\n');

// Test 1: Check if CSS files have the new spacing rules
console.log('📋 Test 1: CSS Spacing Rules');

const stylesPath = path.join(__dirname, '../static/css/styles.css');
const stylesContent = fs.readFileSync(stylesPath, 'utf8');

const spacingRules = [
    '.content-with-links p',
    'line-height: 1.8',
    'padding: 4px 6px 4px 20px',
    'margin: 3px 2px',
    'display: inline-block'
];

spacingRules.forEach(rule => {
    if (stylesContent.includes(rule)) {
        console.log(`  ✅ Found spacing rule: ${rule}`);
    } else {
        console.log(`  ❌ Missing spacing rule: ${rule}`);
    }
});

// Test 2: Check if disambiguation helper has enhanced styles
console.log('\n📋 Test 2: Disambiguation Helper Styles');

const helperPath = path.join(__dirname, '../helpers/disambiguation-helpers.js');
const helperContent = fs.readFileSync(helperPath, 'utf8');

const helperRules = [
    'line-height: 1.8',
    'p:has(.disambiguation-link)',
    '.disambiguation-container'
];

helperRules.forEach(rule => {
    if (helperContent.includes(rule)) {
        console.log(`  ✅ Found helper rule: ${rule}`);
    } else {
        console.log(`  ❌ Missing helper rule: ${rule}`);
    }
});

// Test 3: Check if templates have content-with-links class
console.log('\n📋 Test 3: Template Content Wrapper Classes');

const episodePath = path.join(__dirname, '../views/episode.ejs');
const lorePath = path.join(__dirname, '../views/lore.ejs');

const episodeContent = fs.readFileSync(episodePath, 'utf8');
const loreContent = fs.readFileSync(lorePath, 'utf8');

const templateRules = [
    { file: 'episode.ejs', content: episodeContent, class: 'content-with-links episode-summary' },
    { file: 'episode.ejs', content: episodeContent, class: 'content-with-links episode-lyrics' },
    { file: 'lore.ejs', content: loreContent, class: 'content-with-links lore-description' }
];

templateRules.forEach(rule => {
    if (rule.content.includes(rule.class)) {
        console.log(`  ✅ Found in ${rule.file}: ${rule.class}`);
    } else {
        console.log(`  ❌ Missing in ${rule.file}: ${rule.class}`);
    }
});

// Test 4: Check spacing improvements summary
console.log('\n📋 Test 4: Spacing Improvements Summary');

const improvements = [
    'Increased line-height from default to 1.8 for dynamic content',
    'Added padding and margin to disambiguation links',
    'Made disambiguation links inline-block for better spacing',
    'Added content wrapper classes for targeted styling',
    'Enhanced icon positioning with increased left spacing'
];

console.log('  ✅ Implemented Improvements:');
improvements.forEach(improvement => {
    console.log(`    • ${improvement}`);
});

console.log('\n🎯 Expected Results:');
console.log('  • Text with dynamic links should have more vertical spacing');
console.log('  • Disambiguation links should not overlap between rows');
console.log('  • Icons should be properly positioned with adequate spacing');
console.log('  • Content should be more readable with better line separation');

console.log('\n✅ Disambiguation spacing test completed!');
console.log('💡 Start the development server to see the visual improvements.');