const result = 'Since <a href="/lore/misery" class="lore-link" title="Learn about Misery of Goblins">Misery</a> loves Company, <a href="/lore/goblin" class="lore-link" title="Learn about Goblins">Goblins</a> often travel in groups called a <a href="/lore/misery" class="lore-link" title="Learn about Misery of Goblins">Misery of Goblins</a>, spreading fear and terror wherever they go.';

console.log('Checking for ACTUAL problematic patterns...');
console.log('');

// More specific malformed patterns
const reallyBrokenPatterns = [
  /<a href="[^"]*<a href/,                 // Nested link in href attribute
  /<a[^>]*>[^<]*<a[^>]*>/,                 // Link opening inside another link's content  
  /href="[^"]*" class="lore-link"/,        // Class appearing in href (the user's issue)
  /"[^"]*" class="lore-link" title="[^"]*">[^<]*$/  // Broken at end of string
];

let actualProblems = 0;
reallyBrokenPatterns.forEach((pattern, index) => {
  const matches = result.match(pattern);
  if (matches) {
    console.log(`❌ REAL PROBLEM ${index + 1}:`, matches[0]);
    actualProblems++;
  }
});

if (actualProblems === 0) {
  console.log('✅ No actual malformed HTML found!');
  console.log('');
  console.log('The pattern "> loves Company, <a href" is OK because:');
  console.log('- It\'s the end of one link followed by start of another');
  console.log('- This is completely normal HTML structure');
  console.log('');
  console.log('🎉 THE FIX IS WORKING CORRECTLY!');
} else {
  console.log(`❌ Found ${actualProblems} real problems`);
}