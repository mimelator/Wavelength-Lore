/**
 * Comprehensive analysis of episode content to find all character mentions
 * Analyzes title, description, story, and lyrics for character references
 */

require('dotenv').config();
const firebaseUtils = require('../helpers/firebase-utils');
const characterHelpers = require('../helpers/character-helpers');

// All character names and their variations
const characterMentions = {
  'lucky': ['lucky', 'leprechaun'],
  'daphne': ['daphne'],
  'maurice': ['maurice', 'magical maurice'],
  'jewel': ['jewel', 'princess jewel', 'princess'],
  'alexandria': ['alexandria', 'alex'],
  'prince andrew': ['prince andrew', 'andrew', 'prince', 'the prince'],
  'eloquence': ['eloquence'],
  'yeti': ['yeti']
};

const playlist = [
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
  { season: 2, episode: 1, title: "Goblin King" },
  { season: 2, episode: 2, title: "Psychopath" },
  { season: 2, episode: 3, title: "Countdown" },
  { season: 2, episode: 4, title: "A Misery of Goblins" },
  { season: 2, episode: 5, title: "Slow Time" },
  { season: 2, episode: 6, title: "You Won't See It Coming" },
  { season: 2, episode: 7, title: "Say Goodbye To The Shire" },
  { season: 3, episode: 1, title: "Ice Fortress" },
  { season: 3, episode: 2, title: "The Ice Whales" },
  { season: 3, episode: 3, title: "Sneak Attack" },
  { season: 3, episode: 4, title: "Frozen Peace" },
  { season: 3, episode: 5, title: "Rebuild The Shire" },
  { season: 3, episode: 6, title: "We're Coming For You" },
  { season: 3, episode: 7, title: "Prepare For Battle" },
  { season: 4, episode: 1, title: "Locked And Loaded" },
  { season: 4, episode: 2, title: "The King Has Fled" },
  { season: 4, episode: 3, title: "Goblins Rule" },
  { season: 4, episode: 4, title: "Ice Blue Greed" },
  { season: 4, episode: 5, title: "The Shire Fortress" },
  { season: 4, episode: 6, title: "Battle Of The Shire" },
  { season: 4, episode: 7, title: "Song Of Mourning" },
  { season: 4, episode: 8, title: "The Shire Dream" }
];

async function analyzeEpisodes() {
  try {
    const database = firebaseUtils.initializeFirebase('analyze-episodes');
    characterHelpers.setDatabaseInstance(database);
    
    console.log('🔍 Analyzing all episodes for character mentions...\n');
    
    await characterHelpers.initializeCharacterCache();
    const allCharacters = characterHelpers.getAllCharactersSync(false);
    
    const suggestions = [];
    
    for (const track of playlist) {
      const episodeData = await firebaseUtils.fetchFromFirebase(
        `videos/season${track.season}/episodes/episode${track.episode}`
      );
      
      if (episodeData) {
        const foundCharacters = new Set();
        
        // Combine all text to search
        const searchText = [
          track.title || '',
          episodeData.description || '',
          episodeData.story || '',
          episodeData.summary || '',
          episodeData.lyrics || ''
        ].join(' ').toLowerCase();
        
        // Search for each character mention
        Object.entries(characterMentions).forEach(([characterKey, mentions]) => {
          for (const mention of mentions) {
            // Use word boundary regex for more accurate matching
            const regex = new RegExp(`\\b${mention.toLowerCase()}\\b`, 'i');
            if (regex.test(searchText)) {
              foundCharacters.add(characterKey);
              break;
            }
          }
        });
        
        // Check current characters
        const currentCharacters = allCharacters.filter(char =>
          episodeData.keywords?.some(keyword =>
            char.keywords?.some(ck => ck.toLowerCase() === keyword.toLowerCase())
          )
        ).map(char => char.title.toLowerCase());
        
        const currentCharacterKeys = new Set(
          currentCharacters.map(name => {
            // Map character names back to keywords
            if (name === 'lucky') return 'lucky';
            if (name === 'daphne') return 'daphne';
            if (name === 'maurice') return 'maurice';
            if (name === 'jewel') return 'jewel';
            if (name === 'alexandria') return 'alexandria';
            if (name === 'prince andrew') return 'prince andrew';
            if (name === 'eloquence') return 'eloquence';
            if (name === 'yeti') return 'yeti';
            return name;
          })
        );
        
        // Find new characters to add
        const newCharacters = Array.from(foundCharacters).filter(
          char => !currentCharacterKeys.has(char)
        );
        
        if (newCharacters.length > 0 || foundCharacters.size > 0) {
          suggestions.push({
            season: track.season,
            episode: track.episode,
            title: track.title,
            currentKeywords: episodeData.keywords || [],
            currentCharacters: Array.from(currentCharacterKeys),
            allFoundCharacters: Array.from(foundCharacters),
            charactersToAdd: newCharacters,
            needsUpdate: newCharacters.length > 0
          });
        }
      }
    }
    
    // Print report
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 DETAILED CHARACTER ANALYSIS');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const needsUpdate = suggestions.filter(s => s.needsUpdate);
    const alreadyComplete = suggestions.filter(s => !s.needsUpdate && s.allFoundCharacters.length > 0);
    
    if (needsUpdate.length > 0) {
      console.log(`⚠️  Episodes that need character keywords added: ${needsUpdate.length}\n`);
      
      needsUpdate.forEach(suggestion => {
        console.log(`🎵 S${suggestion.season}E${suggestion.episode} - ${suggestion.title}`);
        console.log(`   Current characters: [${suggestion.currentCharacters.join(', ') || 'none'}]`);
        console.log(`   Found in content: [${suggestion.allFoundCharacters.join(', ')}]`);
        console.log(`   ➕ Need to add: [${suggestion.charactersToAdd.join(', ')}]`);
        
        const newKeywords = [...new Set([...suggestion.currentKeywords, ...suggestion.charactersToAdd])];
        console.log(`   ✅ Updated keywords should include: [${newKeywords.join(', ')}]`);
        console.log('');
      });
    }
    
    if (alreadyComplete.length > 0) {
      console.log(`\n✅ Episodes already correctly tagged: ${alreadyComplete.length}\n`);
      alreadyComplete.forEach(suggestion => {
        console.log(`   S${suggestion.season}E${suggestion.episode} - ${suggestion.title} → [${suggestion.currentCharacters.join(', ')}]`);
      });
    }
    
    const noCharacters = playlist.length - suggestions.length;
    if (noCharacters > 0) {
      console.log(`\n⚪ Episodes with no character mentions found: ${noCharacters}`);
    }
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📈 SUMMARY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Total episodes: ${playlist.length}`);
    console.log(`With characters: ${suggestions.length}`);
    console.log(`Need updates: ${needsUpdate.length}`);
    console.log(`Already complete: ${alreadyComplete.length}`);
    console.log(`No characters: ${noCharacters}\n`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('Error analyzing episodes:', error);
    process.exit(1);
  }
}

analyzeEpisodes();
