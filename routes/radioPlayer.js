const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const firebaseUtils = require('../helpers/firebase-utils');
const characterHelpers = require('../helpers/character-helpers');

// Radio player playlist - all 33 episode songs
const playlist = [
  // Season 1
  { season: 1, episode: 1, title: "Lucky Charm", file: "LuckyCharm_v35.mp3", duration: "3:45" },
  { season: 1, episode: 2, title: "Jump Right In", file: "JumpRightIn_v25.mp3", duration: "3:42" },
  { season: 1, episode: 3, title: "Dream With Me", file: "DreamWithMe_v5.mp3", duration: "3:20" },
  { season: 1, episode: 4, title: "Daphne", file: "Daphne_v21.mp3", duration: "3:48" },
  { season: 1, episode: 5, title: "Falling", file: "Falling_v32.mp3", duration: "2:57" },
  { season: 1, episode: 6, title: "Once More", file: "OnceMore_v20.mp3", duration: "4:52" },
  { season: 1, episode: 7, title: "History Lessons", file: "HistoryLessons_v8.mp3", duration: "3:57" },
  { season: 1, episode: 8, title: "Life In The Shire", file: "LIfeInTheShire_v19.mp3", duration: "4:02" },
  { season: 1, episode: 9, title: "Feed The Crows", file: "FeedTheCrows_v24.mp3", duration: "2:48" },
  { season: 1, episode: 10, title: "Keep On", file: "Keep On_v26.mp3", duration: "2:26" },
  { season: 1, episode: 11, title: "Back To The Shire", file: "BackToTheShire_v18.mp3", duration: "4:22" },

  // Season 2
  { season: 2, episode: 1, title: "Goblin King", file: "GoblinKing_v8.mp3", duration: "3:36" },
  { season: 2, episode: 2, title: "Psychopath", file: "Psychopath_v9.mp3", duration: "2:45" },
  { season: 2, episode: 3, title: "Countdown", file: "Countdown_v6.mp3", duration: "3:13" },
  { season: 2, episode: 4, title: "A Misery of Goblins", file: "A Misery of Goblins_v4.mp3", duration: "3:05" },
  { season: 2, episode: 5, title: "Slow Time", file: "SlowTime_v4.mp3", duration: "3:10" },
  { season: 2, episode: 6, title: "You Won't See It Coming", file: "YouWontSeeItComing_v7.mp3", duration: "2:53" },
  { season: 2, episode: 7, title: "Say Goodbye To The Shire", file: "SayGoodbyeToTheShire_v4.mp3", duration: "2:58" },

  // Season 3
  { season: 3, episode: 1, title: "Ice Fortress", file: "Ice Fortress_v5.mp3", duration: "4:08" },
  { season: 3, episode: 2, title: "The Ice Whales", file: "The Ice Whales_v5.mp3", duration: "3:05" },
  { season: 3, episode: 3, title: "Sneak Attack", file: "Sneak Attack_v6.mp3", duration: "4:20" },
  { season: 3, episode: 4, title: "Frozen Peace", file: "FrozenPeace_v5.mp3", duration: "3:35" },
  { season: 3, episode: 5, title: "Rebuild The Shire", file: "RebuildTheShire_v5.mp3", duration: "2:58" },
  { season: 3, episode: 6, title: "We're Coming For You", file: "We're Coming For You_v5.mp3", duration: "2:32" },
  { season: 3, episode: 7, title: "Prepare For Battle", file: "PrepareForBattle_v6.mp3", duration: "4:20" },

  // Season 4
  { season: 4, episode: 1, title: "Locked And Loaded", file: "LockedAndLoaded_v3.mp3", duration: "3:17" },
  { season: 4, episode: 2, title: "The King Has Fled", file: "TheKingHasFled_v1.mp3", duration: "3:31" },
  { season: 4, episode: 3, title: "Goblins Rule", file: "GoblinsRule_v2.mp3", duration: "3:57" },
  { season: 4, episode: 4, title: "Ice Blue Greed", file: "IceBlueGreed_v2.mp3", duration: "3:23" },
  { season: 4, episode: 5, title: "The Shire Fortress", file: "TheShireFortress_v2.mp3", duration: "3:40" },
  { season: 4, episode: 6, title: "Battle Of The Shire", file: "BattleOfTheShire_v4.mp3", duration: "6:19" },
  { season: 4, episode: 7, title: "Song Of Mourning", file: "SongOfMourning_v1.mp3", duration: "4:14" },
  { season: 4, episode: 8, title: "The Shire Dream", file: "TheShireDream_v1.mp3", duration: "4:50" }
];

// Enhance playlist with episode data
async function getEnhancedPlaylist() {
  const allCharacters = characterHelpers.getAllCharactersSync(false);

  const enhancedTracks = await Promise.all(playlist.map(async (track) => {
    try {
      const episodeData = await firebaseUtils.fetchFromFirebase(`videos/season${track.season}/episodes/episode${track.episode}`);

      if (episodeData) {
        // Debug logging for summary field
        /*if (track.season === 1 && track.episode === 1) {
          console.log('📖 Episode data fields:', Object.keys(episodeData));
          console.log('📖 Story field:', episodeData.story);
          console.log('📖 Summary field:', episodeData.summary);
        }*/

        return {
          ...track,
          episodeImage: episodeData.image || '',
          episodeUrl: `/season/${track.season}/episode/${track.episode}`,
          images: episodeData.carouselImages || episodeData.image_gallery || episodeData.images || [],
          lyrics: episodeData.lyrics || '',
          summary: episodeData.story || episodeData.summary || '',
          episodeTitle: episodeData.title || track.title,
          characters: (() => {
            // Get matching characters
            const matchedCharacters = allCharacters.filter(char =>
              episodeData.keywords?.some(keyword =>
                char.keywords?.some(ck => ck.toLowerCase() === keyword.toLowerCase())
              )
            ).map(char => ({
              id: char.id,
              title: char.title,
              image: char.image,
              type: 'character',
              url: `/character/${char.id}`
            }));

            // Get matching lore items
            const loreHelpers = require('../helpers/lore-helpers');
            const allLore = loreHelpers.getAllLoreSync(false);
            
            // Debug: Show all lore for S2E1
            /*
            if (track.season === 2 && track.episode === 1) {
              console.log('🔍 All lore items:', allLore.map(l => ({ id: l.id, name: l.name, keywords: l.keywords })));
            }*/
            
            const matchedLore = allLore.filter(lore =>
              episodeData.keywords?.some(keyword =>
                lore.keywords?.some(lk => lk.toLowerCase() === keyword.toLowerCase())
              )
            ).map(lore => ({
              id: lore.id,
              title: lore.name,
              image: lore.image,
              type: 'lore',
              url: `/lore/${lore.id}`
            }));

            // Combine characters and lore
            const combined = [...matchedCharacters, ...matchedLore];
            
            // Debug logging for Goblin King episode
            if (track.season === 2 && track.episode === 1) {
              console.log('🔍 S2E1 Goblin King - Episode keywords:', episodeData.keywords);
              console.log('🔍 S2E1 Goblin King - Matched characters:', matchedCharacters);
              console.log('🔍 S2E1 Goblin King - Matched lore:', matchedLore);
              console.log('🔍 S2E1 Goblin King - Combined:', combined);
            }
            
            return combined;
          })()
        };
      }
    } catch (error) {
      console.error(`Error fetching episode data for S${track.season}E${track.episode}:`, error.message);
    }

    // Return track with empty characters array if no data was fetched
    return { ...track, characters: [] };
  }));

  return enhancedTracks;
}

// Radio player page route
router.get('/radio', async (req, res) => {
  try {
    console.log('🎵 Loading radio player page...');
    const enhancedPlaylist = await getEnhancedPlaylist();
    console.log('🎵 Enhanced playlist loaded with', enhancedPlaylist.length, 'tracks');

    res.render('radio-player', {
      title: 'Wavelength Radio',
      pageTitle: 'Wavelength Radio - Interactive Music Player',
      pageDescription: 'Listen to the soundtrack of Wavelength Lore with our interactive radio player',
      playlist: enhancedPlaylist,
      currentPage: '/radio',
      cdnUrl: process.env.CDN_URL || '',
      version: `v${Date.now()}`,
      req: req
    });
  } catch (error) {
    console.error('Error loading radio player:', error);
    res.status(500).send('Error loading radio player');
  }
});

// API endpoint to get playlist data
router.get('/api/radio/playlist', async (_req, res) => {
  try {
    const enhancedPlaylist = await getEnhancedPlaylist();
    res.json(enhancedPlaylist);
  } catch (error) {
    console.error('Error loading playlist:', error);
    res.status(500).json({ error: 'Failed to load playlist' });
  }
});

module.exports = router;
