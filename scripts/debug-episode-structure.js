#!/usr/bin/env node
/**
 * Debug Episode Structure
 * Investigates where episodes are stored in Firebase
 */

require('dotenv').config();
const chalk = require('chalk');
const { fetchDataAsAdmin } = require('../helpers/firebase-admin-utils');

async function debugEpisodeStructure() {
    console.log(chalk.blue.bold('\n🔍 DEBUGGING EPISODE STRUCTURE'));
    console.log(chalk.blue('='.repeat(60)));
    console.log();

    try {
        // Try different paths
        const paths = [
            'videos',
            'episodes',
            'videos/season1',
            'videos/season2',
            'videos/season3',
            'videos/season4',
            'videos/season5'
        ];

        for (const path of paths) {
            console.log(chalk.yellow(`\n📁 Fetching: ${path}`));
            try {
                const data = await fetchDataAsAdmin(path);
                if (data) {
                    if (typeof data === 'object') {
                        const keys = Object.keys(data);
                        console.log(chalk.green(`  ✅ Found ${keys.length} top-level keys`));
                        
                        if (keys.length > 0 && keys.length < 20) {
                            console.log(chalk.gray(`  Keys: ${keys.join(', ')}`));
                        }
                        
                        // If this looks like a season, check for episodes
                        if (data.episodes) {
                            const episodeKeys = Object.keys(data.episodes);
                            console.log(chalk.cyan(`  📺 Contains ${episodeKeys.length} episodes`));
                            if (episodeKeys.length > 0 && episodeKeys.length < 10) {
                                console.log(chalk.gray(`  Episode IDs: ${episodeKeys.join(', ')}`));
                            }
                        }
                        
                        // Sample structure
                        if (keys.length > 0) {
                            const firstKey = keys[0];
                            const sample = data[firstKey];
                            if (typeof sample === 'object' && sample !== null) {
                                const sampleKeys = Object.keys(sample).slice(0, 10);
                                console.log(chalk.gray(`  Sample structure (${firstKey}): ${sampleKeys.join(', ')}`));
                            }
                        }
                    } else {
                        console.log(chalk.gray(`  ⚠️  Data is not an object: ${typeof data}`));
                    }
                } else {
                    console.log(chalk.gray(`  ⚠️  No data found`));
                }
            } catch (error) {
                console.log(chalk.red(`  ❌ Error: ${error.message}`));
            }
        }

        // Also check videos structure more deeply
        console.log(chalk.yellow('\n\n📁 Deep dive into videos structure:'));
        const videos = await fetchDataAsAdmin('videos');
        if (videos) {
            const seasons = Object.keys(videos);
            console.log(chalk.green(`Found ${seasons.length} seasons: ${seasons.join(', ')}`));
            
            let totalEpisodes = 0;
            for (const seasonId of seasons) {
                const season = videos[seasonId];
                if (season && season.episodes) {
                    const episodeCount = Object.keys(season.episodes).length;
                    totalEpisodes += episodeCount;
                    console.log(chalk.cyan(`  ${seasonId}: ${episodeCount} episodes`));
                    
                    // Show first few episode IDs
                    const episodeIds = Object.keys(season.episodes).slice(0, 5);
                    if (episodeIds.length > 0) {
                        console.log(chalk.gray(`    Episode IDs: ${episodeIds.join(', ')}${episodeCount > 5 ? '...' : ''}`));
                    }
                } else {
                    console.log(chalk.gray(`  ${seasonId}: No episodes property`));
                    // Show what properties it has
                    if (season && typeof season === 'object') {
                        const props = Object.keys(season).slice(0, 10);
                        console.log(chalk.gray(`    Properties: ${props.join(', ')}`));
                    }
                }
            }
            console.log(chalk.green(`\n✅ Total episodes found in videos/: ${totalEpisodes}`));
        }

    } catch (error) {
        console.error(chalk.red('❌ Error:'), error.message);
        console.error(error.stack);
    }
}

debugEpisodeStructure().catch(error => {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
});

