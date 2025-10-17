const result = 'Since <a href="/lore/misery" class="lore-link" title="Learn about Misery of Goblins">Misery</a> loves Company, <a href="/lore/goblin" class="lore-link" title="Learn about Goblins">Goblins</a> often travel in groups called a <a href="/lore/misery" class="lore-link" title="Learn about Misery of Goblins">Misery of Goblins</a>, spreading fear and terror wherever they go.';

console.log('Full result:');
console.log(result);
console.log('');

// Let's look for actual malformed links
const malformedPatterns = [
  /<a href="\/lore\/<a href/g,  // Link inside href attribute
  />[^<]*<a href/g,              // Link inside text content
  /"[^>]*class="lore-link"/g     // Class attribute appearing in wrong place
];

let foundMalformed = false;
malformedPatterns.forEach((pattern, index) => {
  const matches = result.match(pattern);
  if (matches) {
    console.log(`Found malformed pattern ${index + 1}:`, matches);
    foundMalformed = true;
  }
});

if (!foundMalformed) {
  console.log('✅ No actual malformed HTML found!');
  console.log('The linking is working correctly.');
} else {
  console.log('❌ Found malformed HTML patterns');
}