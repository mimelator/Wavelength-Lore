#!/usr/bin/env node

/**
 * Fix Song URLs Script
 * 
 * Updates Firebase songs with correct URLs based on LEGACY_PLAYLIST filenames.
 * Converts normalized format (/images/seasons/S4E8.mp3) to full path format
 * (/images/seasons/season4/episodes/episode8/filename.mp3).
 */

require('dotenv').config();
const chalk = require('chalk');
const FirebaseSongsService = require('../services/firebase-songs-service');
const { formatDuration } = require('../utils/duration-helpers');

// LEGACY_PLAYLIST from routes/radioPlayer.js - source of truth for filenames
const LEGACY_PLAYLIST = [
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

// Create lookup map: season+episode -> file
const LEGACY_FILE_MAP = new Map();
LEGACY_PLAYLIST.forEach(track => {
  const key = `s${track.season}e${track.episode}`;
  LEGACY_FILE_MAP.set(key, track.file);
});

async function fixSongUrls(dryRun = true) {
    console.log(chalk.blue.bold('\n🔧 FIXING SONG URLs IN FIREBASE\n'));
    console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
    
    if (dryRun) {
        console.log(chalk.yellow('⚠️  DRY RUN MODE - No changes will be made to Firebase\n'));
    } else {
        console.log(chalk.red('🔥 LIVE MODE - Changes WILL be written to Firebase\n'));
        console.log(chalk.yellow('   Run with --dry-run to preview changes first\n'));
    }

    try {
        // Initialize Firebase Songs Service
        const songsService = new FirebaseSongsService();
        console.log(chalk.gray('📡 Fetching songs from Firebase...\n'));

        // Get all songs (published and unpublished)
        const songs = await songsService.getPublishedSongs(null, true);
        
        if (!songs || songs.length === 0) {
            console.log(chalk.yellow('⚠️  No songs found in Firebase'));
            return;
        }

        console.log(chalk.green(`✅ Found ${songs.length} songs\n`));

        const results = {
            fixed: [],
            skipped: [],
            notFound: [],
            errors: []
        };

        // Process each song
        for (let i = 0; i < songs.length; i++) {
            const song = songs[i];
            const songId = song.id || `s${song.season}e${song.episodeNumber || song.episode}`;
            const episodeNum = song.episodeNumber || song.episode;
            const legacyKey = `s${song.season}e${episodeNum}`;
            
            console.log(chalk.gray(`[${i + 1}/${songs.length}] Processing: "${song.title}" (${songId})`));

            // Check if URL needs fixing (normalized format)
            const isNormalizedFormat = song.url && song.url.match(/\/images\/seasons\/S\d+E\d+\.mp3$/);
            
            if (!isNormalizedFormat) {
                console.log(chalk.gray(`   ⏩ Skipped - URL already in correct format or missing`));
                results.skipped.push({
                    id: songId,
                    title: song.title,
                    url: song.url
                });
                continue;
            }

            // Find filename from LEGACY_PLAYLIST
            const filename = LEGACY_FILE_MAP.get(legacyKey);
            
            if (!filename) {
                console.log(chalk.yellow(`   ⚠️  No filename found in LEGACY_PLAYLIST for ${legacyKey}`));
                results.notFound.push({
                    id: songId,
                    title: song.title,
                    season: song.season,
                    episode: episodeNum,
                    currentUrl: song.url
                });
                continue;
            }

            // Construct correct URL
            const correctUrl = `/images/seasons/season${song.season}/episodes/episode${episodeNum}/${filename}`;

            console.log(chalk.yellow(`   Current URL: ${song.url}`));
            console.log(chalk.green(`   Correct URL: ${correctUrl}`));
            console.log(chalk.gray(`   Filename: ${filename}`));

            if (!dryRun) {
                try {
                    // Prepare update data - need to handle duration format conversion
                    // Firebase stores duration as number (seconds) but validator expects MM:SS string
                    let durationString = song.duration;
                    
                    // If duration is a number (seconds), convert to MM:SS format
                    if (typeof song.duration === 'number') {
                        durationString = formatDuration(song.duration);
                    } else if (song.durationFormatted) {
                        // Use the formatted duration if available
                        durationString = song.durationFormatted;
                    } else if (!song.duration || typeof song.duration !== 'string') {
                        // Try to get from LEGACY_PLAYLIST as fallback
                        const legacyTrack = LEGACY_PLAYLIST.find(
                            t => t.season === song.season && t.episode === episodeNum
                        );
                        if (legacyTrack) {
                            durationString = legacyTrack.duration;
                        } else {
                            throw new Error(`Cannot determine duration for ${songId}`);
                        }
                    }

                    // Update the song in Firebase
                    // Use createOrUpdateSong which will preserve other fields
                    const updateData = {
                        ...song,
                        url: correctUrl,
                        file: filename, // Also add/update the file field
                        duration: durationString // Ensure duration is in correct format
                    };

                    // Remove fields that shouldn't be in update
                    delete updateData.id; // ID is not part of the data
                    delete updateData.durationFormatted; // This is computed, not stored
                    
                    await songsService.createOrUpdateSong(updateData);
                    
                    console.log(chalk.green(`   ✅ Updated in Firebase`));
                    results.fixed.push({
                        id: songId,
                        title: song.title,
                        oldUrl: song.url,
                        newUrl: correctUrl,
                        filename: filename
                    });
                } catch (error) {
                    console.log(chalk.red(`   ❌ Error updating: ${error.message}`));
                    results.errors.push({
                        id: songId,
                        title: song.title,
                        error: error.message
                    });
                }
            } else {
                console.log(chalk.gray(`   [DRY RUN] Would update to: ${correctUrl}`));
                results.fixed.push({
                    id: songId,
                    title: song.title,
                    oldUrl: song.url,
                    newUrl: correctUrl,
                    filename: filename
                });
            }

            console.log('');
        }

        // Print summary
        console.log(chalk.gray('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
        console.log(chalk.blue.bold('📊 FIX SUMMARY\n'));
        
        console.log(chalk.green(`   ✅ Fixed/Will fix: ${results.fixed.length}`));
        console.log(chalk.gray(`   ⏩ Skipped (already correct): ${results.skipped.length}`));
        console.log(chalk.yellow(`   ⚠️  Not found in LEGACY_PLAYLIST: ${results.notFound.length}`));
        console.log(chalk.red(`   ❌ Errors: ${results.errors.length}`));
        console.log(chalk.gray(`   ──────────────────────────────────────────────────────`));
        console.log(chalk.white(`   📋 Total processed: ${songs.length}\n`));

        // Show fixed URLs
        if (results.fixed.length > 0) {
            console.log(chalk.green.bold(`\n✅ SONGS THAT ${dryRun ? 'WOULD BE' : 'WERE'} FIXED:\n`));
            results.fixed.forEach(song => {
                console.log(chalk.green(`   ${song.id}: "${song.title}"`));
                console.log(chalk.red(`      Old: ${song.oldUrl}`));
                console.log(chalk.green(`      New: ${song.newUrl}`));
                console.log(chalk.gray(`      File: ${song.filename}`));
                console.log('');
            });
        }

        // Show not found
        if (results.notFound.length > 0) {
            console.log(chalk.yellow.bold('\n⚠️  SONGS NOT FOUND IN LEGACY_PLAYLIST:\n'));
            console.log(chalk.yellow('   These songs need manual review - add to LEGACY_PLAYLIST first\n'));
            results.notFound.forEach(song => {
                console.log(chalk.yellow(`   ${song.id}: "${song.title}"`));
                console.log(chalk.gray(`      S${song.season}E${song.episode}`));
                console.log(chalk.gray(`      Current URL: ${song.currentUrl}`));
                console.log('');
            });
        }

        // Show errors
        if (results.errors.length > 0) {
            console.log(chalk.red.bold('\n❌ ERRORS:\n'));
            results.errors.forEach(song => {
                console.log(chalk.red(`   ${song.id}: "${song.title}"`));
                console.log(chalk.red(`      Error: ${song.error}`));
                console.log('');
            });
        }

        if (dryRun && results.fixed.length > 0) {
            console.log(chalk.yellow.bold('\n💡 To apply these changes, run:\n'));
            console.log(chalk.white('   node scripts/fix-song-urls.js\n'));
        } else if (!dryRun && results.fixed.length > 0) {
            console.log(chalk.green.bold('\n✅ All fixes applied successfully!\n'));
            console.log(chalk.gray('   Run "npm run validate:song-urls" to verify the fixes\n'));
        }

        if (results.errors.length > 0 || results.notFound.length > 0) {
            process.exit(1);
        } else {
            process.exit(0);
        }

    } catch (error) {
        console.error(chalk.red('\n❌ Fatal error fixing song URLs:'));
        console.error(chalk.red(error.message));
        if (error.stack) {
            console.error(chalk.gray(error.stack));
        }
        process.exit(1);
    }
}

// Check for dry-run flag
const dryRun = !process.argv.includes('--apply');
fixSongUrls(dryRun);

