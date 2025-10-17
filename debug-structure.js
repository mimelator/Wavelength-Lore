const result = 'Since <a href="/lore/misery" class="lore-link" title="Learn about Misery of Goblins">Misery</a> loves Company, <a href="/lore/goblin" class="lore-link" title="Learn about Goblins">Goblins</a> often travel in groups called a <a href="/lore/misery" class="lore-link" title="Learn about Misery of Goblins">Misery of Goblins</a>, spreading fear and terror wherever they go.';

console.log('Looking for nested links in detail...');
console.log('');

// Split by < and > to see the structure
const parts = result.split(/(<[^>]*>)/);
console.log('HTML structure breakdown:');
parts.forEach((part, index) => {
  if (part.includes('<a href')) {
    console.log(`${index}: OPEN LINK: ${part}`);
  } else if (part === '</a>') {
    console.log(`${index}: CLOSE LINK: ${part}`);
  } else if (part.trim()) {
    console.log(`${index}: TEXT: "${part}"`);
  }
});

console.log('');
console.log('Checking for pattern "called a <a"...');
if (result.includes('called a <a')) {
  console.log('❌ Found: Link starts immediately after "called a"');
  console.log('This suggests "Misery of Goblins" is being linked as separate links');
} else {
  console.log('✅ No nested linking detected');
}