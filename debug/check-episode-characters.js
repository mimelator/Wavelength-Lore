/**
 * Script to check which episodes have character associations
 * and generate a report of episodes without related badges
 */

require('dotenv').config();
const firebaseUtils = require('../helpers/firebase-utils');
const characterHelpers = require('../helpers/character-helpers');

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

async function checkEpisodeCharacters() {
  try {
    // Initialize Firebase and set database instance
    const database = firebaseUtils.initializeFirebase('check-episode-characters');
    characterHelpers.setDatabaseInstance(database);
    
    console.log('🔍 Checking character associations for all episodes...\n');
    
    // Initialize character cache
    await characterHelpers.initializeCharacterCache();
    const allCharacters = characterHelpers.getAllCharactersSync(false);
    
    console.log(`📊 Total characters loaded: ${allCharacters.length}\n`);
    
    const episodesWithCharacters = [];
    const episodesWithoutCharacters = [];
    
    for (const track of playlist) {
      const episodeData = await firebaseUtils.fetchFromFirebase(
        `videos/season${track.season}/episodes/episode${track.episode}`
      );
      
      if (episodeData) {
        // Match characters by keywords (same logic as routes)
        const matchedCharacters = allCharacters.filter(char =>
          episodeData.keywords?.some(keyword =>
            char.keywords?.some(ck => ck.toLowerCase() === keyword.toLowerCase())
          )
        );
        
        const episodeInfo = {
          season: track.season,
          episode: track.episode,
          title: track.title,
          url: `https://wavelengthlore.com/season/${track.season}/episode/${track.episode}`,
          keywords: episodeData.keywords || [],
          characters: matchedCharacters.map(char => char.title)
        };
        
        if (matchedCharacters.length > 0) {
          episodesWithCharacters.push(episodeInfo);
        } else {
          episodesWithoutCharacters.push(episodeInfo);
        }
      }
    }
    
    // Print report
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('📊 EPISODE CHARACTER BADGE REPORT\n');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log(`✅ Episodes WITH character badges: ${episodesWithCharacters.length}/${playlist.length}`);
    console.log(`❌ Episodes WITHOUT character badges: ${episodesWithoutCharacters.length}/${playlist.length}\n`);
    
    if (episodesWithCharacters.length > 0) {
      console.log('═══════════════════════════════════════════════════════════');
      console.log('✅ EPISODES WITH CHARACTER BADGES');
      console.log('═══════════════════════════════════════════════════════════\n');
      
      episodesWithCharacters.forEach(ep => {
        console.log(`🎵 Season ${ep.season} Episode ${ep.episode}: ${ep.title}`);
        console.log(`   URL: ${ep.url}`);
        console.log(`   Keywords: [${ep.keywords.join(', ')}]`);
        console.log(`   Characters (${ep.characters.length}): ${ep.characters.join(', ')}`);
        console.log('');
      });
    }
    
    if (episodesWithoutCharacters.length > 0) {
      console.log('═══════════════════════════════════════════════════════════');
      console.log('❌ EPISODES WITHOUT CHARACTER BADGES');
      console.log('═══════════════════════════════════════════════════════════\n');
      
      episodesWithoutCharacters.forEach(ep => {
        console.log(`🎵 Season ${ep.season} Episode ${ep.episode}: ${ep.title}`);
        console.log(`   URL: ${ep.url}`);
        console.log(`   Keywords: [${ep.keywords.join(', ')}]`);
        console.log(`   Status: No matching characters found`);
        console.log('');
      });
      
      console.log('═══════════════════════════════════════════════════════════');
      console.log('💡 POSSIBLE REASONS FOR MISSING BADGES:');
      console.log('═══════════════════════════════════════════════════════════\n');
      console.log('1. Episode has no keywords in Firebase');
      console.log('2. Episode keywords don\'t match any character keywords');
      console.log('3. Characters with matching keywords are hidden');
      console.log('4. Keywords have different casing/spelling\n');
    }
    
    // Special check for Season 2 Episode 2 (Psychopath)
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔎 SPECIAL CHECK: Season 2 Episode 2 (Psychopath)');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const psychopathEpisode = episodesWithCharacters.find(ep => ep.season === 2 && ep.episode === 2) ||
                              episodesWithoutCharacters.find(ep => ep.season === 2 && ep.episode === 2);
    
    if (psychopathEpisode) {
      console.log(`Episode: ${psychopathEpisode.title}`);
      console.log(`Keywords: [${psychopathEpisode.keywords.join(', ')}]`);
      console.log(`Characters: ${psychopathEpisode.characters.length > 0 ? psychopathEpisode.characters.join(', ') : 'NONE'}`);
      
      if (psychopathEpisode.characters.length === 0) {
        console.log('\n⚠️  This episode has NO character matches!');
        console.log('Checking which characters COULD match...\n');
        
        // Show characters that have similar keywords
        allCharacters.forEach(char => {
          console.log(`   Character: ${char.title}`);
          console.log(`   Keywords: [${char.keywords?.join(', ') || 'none'}]`);
          console.log('');
        });
      }
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('Error checking episode characters:', error);
    process.exit(1);
  }
}

// Run the check
checkEpisodeCharacters();
