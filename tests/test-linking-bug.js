const text = 'Since Misery loves Company, Goblins often travel in groups called a Misery of Goblins, spreading fear and terror wherever they go.';
console.log('Testing broken text:');
console.log(text);
console.log('');

// Simulate the broken linking step by step
let testText = text;

// First replacement - "Misery" at the beginning
const miseryRegex = /\bmisery\b(?![^<]*>)(?![^<]*<\/a>)/gi;
testText = testText.replace(miseryRegex, '<a href="/lore/misery" class="lore-link" title="Learn about Misery of Goblins">Misery</a>');
console.log('After first replacement (Misery):');
console.log(testText);
console.log('');

// Second replacement - "Goblins" 
const goblinsRegex = /\bgoblins\b(?![^<]*>)(?![^<]*<\/a>)/gi;
testText = testText.replace(goblinsRegex, '<a href="/lore/goblin" class="lore-link" title="Learn about Goblins">Goblins</a>');
console.log('After second replacement (Goblins):');
console.log(testText);
console.log('');

// Third replacement - "Misery of Goblins" (this is the problem!)
const miseryOfGoblinsRegex = /\bmisery of goblins\b(?![^<]*>)(?![^<]*<\/a>)/gi;
testText = testText.replace(miseryOfGoblinsRegex, '<a href="/lore/misery" class="lore-link" title="Learn about Misery of Goblins">Misery of Goblins</a>');
console.log('After third replacement (Misery of Goblins):');
console.log(testText);
console.log('');

console.log('🔍 Analysis:');
console.log('The issue is that we\'re trying to replace "Misery of Goblins" AFTER we\'ve already');
console.log('replaced individual "Misery" and "Goblins" words with HTML links!');
console.log('This creates nested/broken HTML.');