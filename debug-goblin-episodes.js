// Debug episode collection for Goblin King
const episodeHelpers = require('./helpers/episode-helpers');

async function debugGoblinKingEpisodes() {
  console.log('🔍 Debugging Goblin King Episodes...\n');
  
  try {
    const episodes = episodeHelpers.getAllEpisodesSync();
    console.log(`📚 Total episodes found: ${episodes.length}\n`);
    
    // Look for Goblin King episodes
    const goblinKingEpisodes = episodes.filter(ep => 
      ep.name.toLowerCase().includes('goblin') && ep.name.toLowerCase().includes('king')
    );
    
    console.log('🔍 Episodes containing "Goblin King":');
    if (goblinKingEpisodes.length > 0) {
      goblinKingEpisodes.forEach(ep => {
        console.log(`  - Title: "${ep.name}"`);
        console.log(`    URL: ${ep.url}`);
        console.log(`    Season: ${ep.season}`);
        console.log(`    Episode: ${ep.episode}`);
        console.log('');
      });
    } else {
      console.log('  ❌ No episodes found with "Goblin King" in the title');
    }
    
    // Show all episode titles for reference
    console.log('\n📋 All available episode titles:');
    episodes.forEach(ep => {
      console.log(`  - ${ep.name}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugGoblinKingEpisodes();