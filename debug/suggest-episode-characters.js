/**
 * Script to suggest which character keywords should be added to episodes
 * Based on episode titles, summaries, and existing keywords
 */

require('dotenv').config();
const firebaseUtils = require('../helpers/firebase-utils');
const characterHelpers = require('../helpers/character-helpers');

// Character name mappings (lowercase for matching)
const characterNames = {
  'lucky': 'lucky',
  'leprechaun': 'lucky',
  'daphne': 'daphne',
  'maurice': 'maurice',
  'magical maurice': 'maurice',
  'jewel': 'jewel',
  'princess jewel': 'jewel',
  'alexandria': 'alexandria',
  'alex': 'alexandria',
  'prince andrew': 'prince andrew',
  'andrew': 'prince andrew',
  'eloquence': 'eloquence',
  'yeti': 'yeti',
  'goblin king': 'goblin king'  // If there's a Goblin King character
};

// Playlist of all episodes
const playlist = [
  // Season 1
  { season: 1, episode: 1, title: "Lucky Charm" },
  { season: 1, episode: 2, title: "Jump Right In" },
  { season: 1, episode: 3, title: "Dream With Me" },
  { season: 1, episode: 4, title: "Daphne" },
  { season: 1, episode: 5, title: "Falling" },
  { season: 1, episode: 6, title: "Once More" },
  { season: 1, episode: 7, title: "History Lessons" },
  { season: 1, episode: 8, title: "Life In The Shire" },
  { season: 1, episode: 9, title: "Feed The Crows" },
  { season: 1, episode: 10, title: "Keep On" },
  { season: 1, episode: 11, title: "Back To The Shire" },
  // Season 2
  { season: 2, episode: 1, title: "Goblin King" },
  { season: 2, episode: 2, title: "Psychopath" },
  { season: 2, episode: 3, title: "Countdown" },
  { season: 2, episode: 4, title: "A Misery of Goblins" },
  { season: 2, episode: 5, title: "Slow Time" },
  { season: 2, episode: 6, title: "You Won't See It Coming" },
  { season: 2, episode: 7, title: "Say Goodbye To The Shire" },
  // Season 3
  { season: 3, episode: 1, title: "Ice Fortress" },
  { season: 3, episode: 2, title: "The Ice Whales" },
  { season: 3, episode: 3, title: "Sneak Attack" },
  { season: 3, episode: 4, title: "Frozen Peace" },
  { season: 3, episode: 5, title: "Rebuild The Shire" },
  { season: 3, episode: 6, title: "We're Coming For You" },
  { season: 3, episode: 7, title: "Prepare For Battle" },
  // Season 4
  { season: 4, episode: 1, title: "Locked And Loaded" },
  { season: 4, episode: 2, title: "The King Has Fled" },
  { season: 4, episode: 3, title: "Goblins Rule" },
  { season: 4, episode: 4, title: "Ice Blue Greed" },
  { season: 4, episode: 5, title: "The Shire Fortress" },
  { season: 4, episode: 6, title: "Battle Of The Shire" },
  { season: 4, episode: 7, title: "Song Of Mourning" },
  { season: 4, episode: 8, title: "The Shire Dream" }
];

async function suggestCharacters() {
  try {
    // Initialize Firebase and set database instance
    const database = firebaseUtils.initializeFirebase('suggest-characters');
    characterHelpers.setDatabaseInstance(database);
    
    console.log('🔍 Analyzing episodes for character mentions...\n');
    
    // Initialize character cache
    await characterHelpers.initializeCharacterCache();
    const allCharacters = characterHelpers.getAllCharactersSync(false);
    
    const suggestions = [];
    
    for (const track of playlist) {
      const episodeData = await firebaseUtils.fetchFromFirebase(
        `videos/season${track.season}/episodes/episode${track.episode}`
      );
      
      if (episodeData) {
        const suggestedCharacters = new Set();
        
        // Check title, story/summary, and lyrics for character mentions
        const searchText = [
          track.title,
          episodeData.story || '',
          episodeData.summary || '',
          episodeData.lyrics || ''
        ].join(' ').toLowerCase();
        
        // Look for character name mentions
        Object.entries(characterNames).forEach(([mention, characterKeyword]) => {
          if (searchText.includes(mention)) {
            suggestedCharacters.add(characterKeyword);
          }
        });
        
        // Check if episode already has matching characters
        const currentCharacters = allCharacters.filter(char =>
          episodeData.keywords?.some(keyword =>
            char.keywords?.some(ck => ck.toLowerCase() === keyword.toLowerCase())
          )
        ).map(char => char.title.toLowerCase());
        
        // Only suggest if there are new characters to add
        if (suggestedCharacters.size > 0 || currentCharacters.length > 0) {
          suggestions.push({
            season: track.season,
            episode: track.episode,
            title: track.title,
            currentKeywords: episodeData.keywords || [],
            currentCharacters: currentCharacters,
            suggestedCharacters: Array.from(suggestedCharacters),
            needsUpdate: suggestedCharacters.size > currentCharacters.length
          });
        }
      }
    }
    
    // Print suggestions
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 CHARACTER KEYWORD SUGGESTIONS');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const needsUpdate = suggestions.filter(s => s.needsUpdate);
    const alreadyGood = suggestions.filter(s => !s.needsUpdate && s.currentCharacters.length > 0);
    
    if (needsUpdate.length > 0) {
      console.log(`⚠️  Episodes needing character keyword updates: ${needsUpdate.length}\n`);
      
      needsUpdate.forEach(suggestion => {
        console.log(`🎵 Season ${suggestion.season} Episode ${suggestion.episode}: ${suggestion.title}`);
        console.log(`   Current characters: [${suggestion.currentCharacters.join(', ') || 'none'}]`);
        console.log(`   Suggested to add: [${suggestion.suggestedCharacters.join(', ')}]`);
        console.log(`   Current keywords: [${suggestion.currentKeywords.join(', ')}]`);
        
        // Build new keywords array
        const newKeywords = [...new Set([...suggestion.currentKeywords, ...suggestion.suggestedCharacters])];
        console.log(`   ✅ Recommended keywords: [${newKeywords.join(', ')}]`);
        console.log('');
      });
    }
    
    if (alreadyGood.length > 0) {
      console.log(`\n✅ Episodes already properly tagged: ${alreadyGood.length}\n`);
      alreadyGood.forEach(suggestion => {
        console.log(`   S${suggestion.season}E${suggestion.episode} - ${suggestion.title} → [${suggestion.currentCharacters.join(', ')}]`);
      });
    }
    
    const noCharacters = playlist.length - suggestions.length;
    if (noCharacters > 0) {
      console.log(`\n⚪ Episodes with no character mentions detected: ${noCharacters}`);
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('Error suggesting characters:', error);
    process.exit(1);
  }
}

// Run the suggestion
suggestCharacters();
