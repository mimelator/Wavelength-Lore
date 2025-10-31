#!/usr/bin/env node

/**
 * Validate Song URLs Script
 * 
 * Fetches all songs from Firebase and validates their URLs by checking HTTP status codes.
 * Reports which songs have valid (200) URLs and which ones are broken.
 */

require('dotenv').config();
const axios = require('axios');
const chalk = require('chalk');
const FirebaseSongsService = require('../services/firebase-songs-service');

// Get CDN URL - prefer production, allow override with --local flag
const USE_LOCAL = process.argv.includes('--local');
const CDN_URL = USE_LOCAL 
    ? (process.env.CDN_URL || 'http://localhost:3001')
    : (process.env.CDN_URL || 'https://df5sj8f594cdx.cloudfront.net');

// Production CDN for comparison
const PROD_CDN_URL = 'https://df5sj8f594cdx.cloudfront.net';

async function validateAllSongUrls() {
        console.log(chalk.blue.bold('\n🎵 VALIDATING SONG URLs FROM FIREBASE\n'));
        console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
        if (USE_LOCAL) {
            console.log(chalk.yellow(`⚠️  Testing against LOCALHOST: ${CDN_URL}\n`));
            console.log(chalk.yellow(`   Use without --local flag to test production CDN\n`));
        } else {
            console.log(chalk.gray(`Testing against PRODUCTION CDN: ${CDN_URL}\n`));
        }

    try {
        // Initialize Firebase Songs Service
        const songsService = new FirebaseSongsService();
        console.log(chalk.gray('📡 Fetching songs from Firebase...\n'));

        // Get all songs (published and unpublished for validation)
        const songs = await songsService.getPublishedSongs(null, true);
        
        if (!songs || songs.length === 0) {
            console.log(chalk.yellow('⚠️  No songs found in Firebase'));
            return;
        }

        console.log(chalk.green(`✅ Found ${songs.length} songs to validate\n`));
        console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

        const results = {
            valid: [],
            invalid: [],
            missing: [],
            errors: [],
            normalizedFormat: [] // Track URLs in old normalized format (S4E8.mp3)
        };

        // Validate each song URL
        for (let i = 0; i < songs.length; i++) {
            const song = songs[i];
            const songId = song.id || `s${song.season}e${song.episodeNumber || song.episode}`;
            
            console.log(chalk.gray(`[${i + 1}/${songs.length}] Validating: "${song.title}" (${songId})`));

            // Check if URL exists
            if (!song.url) {
                console.log(chalk.red(`   ❌ Missing URL field`));
                results.missing.push({
                    id: songId,
                    title: song.title,
                    season: song.season,
                    episode: song.episodeNumber || song.episode,
                    published: song.published
                });
                continue;
            }

            // Check for normalized format (incorrect pattern)
            const isNormalizedFormat = song.url.match(/\/images\/seasons\/S\d+E\d+\.mp3$/);
            if (isNormalizedFormat) {
                console.log(chalk.yellow(`   ⚠️  Normalized format detected (should be full path)`));
                results.normalizedFormat.push({
                    id: songId,
                    title: song.title,
                    season: song.season,
                    episode: song.episodeNumber || song.episode,
                    url: song.url,
                    published: song.published,
                    expectedFormat: `/images/seasons/season${song.season}/episodes/episode${song.episodeNumber || song.episode}/${song.file || 'filename.mp3'}`
                });
            }

            // Construct full URL
            let fullUrl;
            if (song.url.startsWith('http://') || song.url.startsWith('https://')) {
                fullUrl = song.url;
            } else {
                fullUrl = CDN_URL + song.url;
            }

            console.log(chalk.gray(`   URL: ${fullUrl}`));

            try {
                // Test URL with HEAD request (faster than GET)
                const response = await axios.head(fullUrl, {
                    timeout: 10000, // 10 second timeout
                    validateStatus: (status) => status < 500 // Don't throw on 404, 403, etc.
                });

                if (response.status === 200) {
                    console.log(chalk.green(`   ✅ ${response.status} OK`));
                    results.valid.push({
                        id: songId,
                        title: song.title,
                        season: song.season,
                        episode: song.episodeNumber || song.episode,
                        url: song.url,
                        fullUrl: fullUrl,
                        published: song.published
                    });
                } else {
                    console.log(chalk.red(`   ❌ ${response.status} ${response.statusText}`));
                    results.invalid.push({
                        id: songId,
                        title: song.title,
                        season: song.season,
                        episode: song.episodeNumber || song.episode,
                        url: song.url,
                        fullUrl: fullUrl,
                        status: response.status,
                        statusText: response.statusText,
                        published: song.published
                    });
                }
            } catch (error) {
                const status = error.response?.status || 'NETWORK_ERROR';
                const message = error.response?.statusText || error.message;
                console.log(chalk.red(`   ❌ ${status}: ${message}`));
                results.errors.push({
                    id: songId,
                    title: song.title,
                    season: song.season,
                    episode: song.episodeNumber || song.episode,
                    url: song.url,
                    fullUrl: fullUrl,
                    error: message,
                    published: song.published
                });
            }

            // Small delay to avoid overwhelming the server
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Print summary
        console.log(chalk.gray('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
        console.log(chalk.blue.bold('📊 VALIDATION SUMMARY\n'));
        
        console.log(chalk.green(`   ✅ Valid (200 OK): ${results.valid.length}`));
        console.log(chalk.red(`   ❌ Invalid (non-200): ${results.invalid.length}`));
        console.log(chalk.yellow(`   ⚠️  Missing URL field: ${results.missing.length}`));
        console.log(chalk.yellow(`   🔧 Normalized format (needs fix): ${results.normalizedFormat.length}`));
        console.log(chalk.red(`   💥 Errors: ${results.errors.length}`));
        console.log(chalk.gray(`   ──────────────────────────────────────────────────────`));
        console.log(chalk.white(`   📋 Total: ${songs.length}\n`));

        // Show invalid URLs
        if (results.invalid.length > 0) {
            console.log(chalk.red.bold('\n❌ INVALID URLs (non-200 status):\n'));
            results.invalid.forEach(song => {
                console.log(chalk.red(`   ${song.id}: "${song.title}"`));
                console.log(chalk.gray(`      URL: ${song.url}`));
                console.log(chalk.gray(`      Full URL: ${song.fullUrl}`));
                console.log(chalk.red(`      Status: ${song.status} ${song.statusText}`));
                console.log(chalk.gray(`      Published: ${song.published}`));
                console.log('');
            });
        }

        // Show missing URLs
        if (results.missing.length > 0) {
            console.log(chalk.yellow.bold('\n⚠️  SONGS MISSING URL FIELD:\n'));
            results.missing.forEach(song => {
                console.log(chalk.yellow(`   ${song.id}: "${song.title}"`));
                console.log(chalk.gray(`      S${song.season}E${song.episode}`));
                console.log(chalk.gray(`      Published: ${song.published}`));
                console.log('');
            });
        }

        // Show errors
        if (results.errors.length > 0) {
            console.log(chalk.red.bold('\n💥 ERRORS:\n'));
            results.errors.forEach(song => {
                console.log(chalk.red(`   ${song.id}: "${song.title}"`));
                console.log(chalk.gray(`      URL: ${song.url}`));
                console.log(chalk.gray(`      Full URL: ${song.fullUrl}`));
                console.log(chalk.red(`      Error: ${song.error}`));
                console.log(chalk.gray(`      Published: ${song.published}`));
                console.log('');
            });
        }

        // Show normalized format URLs (these need to be fixed)
        if (results.normalizedFormat.length > 0) {
            console.log(chalk.yellow.bold('\n🔧 SONGS WITH NORMALIZED FORMAT (NEEDS FIX IN FIREBASE):\n'));
            console.log(chalk.yellow('   These URLs use the old format /images/seasons/S{Season}E{Episode}.mp3\n'));
            console.log(chalk.yellow('   Radio player expects: /images/seasons/season{N}/episodes/episode{N}/{filename}.mp3\n'));
            results.normalizedFormat.forEach(song => {
                console.log(chalk.yellow(`   ${song.id}: "${song.title}"`));
                console.log(chalk.red(`      Current: ${song.url}`));
                console.log(chalk.green(`      Expected: ${song.expectedFormat}`));
                console.log(chalk.gray(`      Published: ${song.published}`));
                console.log('');
            });
        }

        // Show valid URLs (if user wants to see them)
        if (results.valid.length > 0 && process.argv.includes('--show-valid')) {
            console.log(chalk.green.bold('\n✅ VALID URLs:\n'));
            results.valid.forEach(song => {
                console.log(chalk.green(`   ${song.id}: "${song.title}"`));
                console.log(chalk.gray(`      URL: ${song.url}`));
                console.log('');
            });
        }

        // Exit with error code if there are issues
        if (results.invalid.length > 0 || results.missing.length > 0 || results.errors.length > 0 || results.normalizedFormat.length > 0) {
            console.log(chalk.red.bold('\n⚠️  Validation completed with issues. Please fix the problems above.\n'));
            process.exit(1);
        } else {
            console.log(chalk.green.bold('\n✅ All song URLs are valid!\n'));
            process.exit(0);
        }

    } catch (error) {
        console.error(chalk.red('\n❌ Fatal error validating song URLs:'));
        console.error(chalk.red(error.message));
        if (error.stack) {
            console.error(chalk.gray(error.stack));
        }
        process.exit(1);
    }
}

// Run the validation
validateAllSongUrls();

