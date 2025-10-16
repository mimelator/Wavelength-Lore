// Test script for character reference system
const characterHelpers = require('./helpers/character-helpers');

console.log('=== Character Reference System Test ===\n');

console.log('1. All Characters:');
characterHelpers.getAllCharacters().forEach(char => {
  console.log(`   - ${char.name} (${char.id}): ${char.url}`);
});

console.log('\n2. Character Link Generation:');
console.log('   Prince Andrew:', characterHelpers.generateCharacterLink('andrew'));
console.log('   Alexandria (custom):', characterHelpers.generateCharacterLink('alex', 'the talented daughter'));
console.log('   Invalid ID:', characterHelpers.generateCharacterLink('invalid', 'Unknown Character'));

console.log('\n3. Text Processing:');
const testText = 'Prince Andrew and Jewel formed Wavelength with their children Alexandria and Eloquence. Maurice was their drummer before Daphne joined.';
console.log('   Original:', testText);
console.log('   Processed:', characterHelpers.linkifyCharacterMentions(testText));

console.log('\n4. Character Lookup:');
console.log('   Find "alex":', characterHelpers.getCharacterById('alex'));
console.log('   Find "invalid":', characterHelpers.getCharacterById('invalid'));

console.log('\n=== Test Complete ===');