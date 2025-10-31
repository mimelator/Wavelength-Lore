#!/usr/bin/env node
/**
 * Publish All Content
 * Marks all episodes, characters, and lore objects as published
 * 
 * Usage: node scripts/publish-all-content.js [--dry-run] [--confirm]
 */

require('dotenv').config();
const chalk = require('chalk');
const readline = require('readline');
const { fetchDataAsAdmin, updateDataAsAdmin } = require('../helpers/firebase-admin-utils');
const visibilityHelpers = require('../helpers/visibility-helpers');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const skipConfirm = args.includes('--confirm');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

async function publishAllContent() {
    console.log(chalk.blue.bold('\n🚀 PUBLISH ALL CONTENT'));
    console.log(chalk.blue('='.repeat(60)));
    console.log();

    if (dryRun) {
        console.log(chalk.yellow('⚠️  DRY RUN MODE - No changes will be made'));
        console.log();
    }

    try {
        // Fetch all content
        console.log(chalk.gray('Fetching content from Firebase...'));
        
        const fetchWithTimeout = (path, timeoutMs = 8000) => {
            return Promise.race([
                fetchDataAsAdmin(path),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error(`Timeout`)), timeoutMs)
                )
            ]).catch(() => null);
        };

        const [videosData, charactersData, loreData, episodesData] = await Promise.all([
            fetchWithTimeout('videos'),
            fetchWithTimeout('characters'),
            fetchWithTimeout('lore'),
            fetchWithTimeout('episodes')
        ]);

        console.log();

        // Count items to publish
        const stats = {
            episodes: 0,
            characters: 0,
            lore: 0
        };

        // Count episodes
        if (videosData) {
            for (const seasonId in videosData) {
                const season = videosData[seasonId];
                if (season && season.episodes) {
                    for (const episodeId in season.episodes) {
                        const episode = season.episodes[episodeId];
                        const visibility = visibilityHelpers.getVisibility(episode);
                        if (visibility !== 'published') {
                            stats.episodes++;
                        }
                    }
                }
            }
        }

        // Count from episodes structure
        if (episodesData) {
            for (const id in episodesData) {
                const episode = episodesData[id];
                const visibility = visibilityHelpers.getVisibility(episode);
                if (visibility !== 'published') {
                    stats.episodes++;
                }
            }
        }

        // Count characters
        if (charactersData) {
            for (const id in charactersData) {
                const character = charactersData[id];
                const visibility = visibilityHelpers.getVisibility(character);
                if (visibility !== 'published') {
                    stats.characters++;
                }
            }
        }

        // Count lore
        if (loreData) {
            for (const id in loreData) {
                const lore = loreData[id];
                const visibility = visibilityHelpers.getVisibility(lore);
                if (visibility !== 'published') {
                    stats.lore++;
                }
            }
        }

        // Show summary
        console.log(chalk.yellow.bold('📊 PUBLISHING SUMMARY'));
        console.log(chalk.gray('─'.repeat(60)));
        console.log(chalk.white(`Episodes to publish: ${stats.episodes}`));
        console.log(chalk.white(`Characters to publish: ${stats.characters}`));
        console.log(chalk.white(`Lore objects to publish: ${stats.lore}`));
        console.log(chalk.white(`Total items: ${stats.episodes + stats.characters + stats.lore}`));
        console.log();

        if (stats.episodes + stats.characters + stats.lore === 0) {
            console.log(chalk.green('✅ All content is already published!'));
            rl.close();
            return;
        }

        // Confirm
        if (!skipConfirm && !dryRun) {
            const answer = await question(chalk.yellow('⚠️  This will mark all content as published. Continue? (yes/no): '));
            if (answer.toLowerCase() !== 'yes') {
                console.log(chalk.gray('Cancelled.'));
                rl.close();
                return;
            }
        }

        console.log();
        let published = 0;
        let errors = 0;

        // Publish episodes from videos structure
        if (videosData) {
            console.log(chalk.cyan('📺 Publishing episodes from videos/...'));
            for (const seasonId in videosData) {
                const season = videosData[seasonId];
                if (season && season.episodes) {
                    for (const episodeId in season.episodes) {
                        const episode = season.episodes[episodeId];
                        const visibility = visibilityHelpers.getVisibility(episode);
                        
                        if (visibility !== 'published') {
                            const path = `videos/${seasonId}/episodes/${episodeId}`;
                            const title = episode.title || `${seasonId}-${episodeId}`;
                            
                            try {
                                if (!dryRun) {
                                    await updateDataAsAdmin(path, {
                                        visibility: 'published',
                                        published: true,
                                        visible: true,
                                        hidden: false,
                                        publishedAt: Date.now()
                                    });
                                }
                                console.log(chalk.green(`  ✓ ${title}`));
                                published++;
                            } catch (error) {
                                console.log(chalk.red(`  ✗ ${title}: ${error.message}`));
                                errors++;
                            }
                        }
                    }
                }
            }
        }

        // Publish episodes from episodes structure
        if (episodesData) {
            console.log(chalk.cyan('\n📺 Publishing episodes from episodes/...'));
            for (const id in episodesData) {
                const episode = episodesData[id];
                const visibility = visibilityHelpers.getVisibility(episode);
                
                if (visibility !== 'published') {
                    const path = `episodes/${id}`;
                    const title = episode.title || id;
                    
                    try {
                        if (!dryRun) {
                            await updateDataAsAdmin(path, {
                                visibility: 'published',
                                published: true,
                                visible: true,
                                hidden: false,
                                status: 'published',
                                publishedAt: Date.now()
                            });
                        }
                        console.log(chalk.green(`  ✓ ${title}`));
                        published++;
                    } catch (error) {
                        console.log(chalk.red(`  ✗ ${title}: ${error.message}`));
                        errors++;
                    }
                }
            }
        }

        // Publish characters
        if (charactersData && stats.characters > 0) {
            console.log(chalk.cyan(`\n👥 Publishing ${stats.characters} characters...`));
            for (const id in charactersData) {
                const character = charactersData[id];
                const visibility = visibilityHelpers.getVisibility(character);
                
                if (visibility !== 'published') {
                    const path = `characters/${id}`;
                    const title = character.title || character.name || id;
                    
                    try {
                        if (!dryRun) {
                            await updateDataAsAdmin(path, {
                                visibility: 'published',
                                published: true,
                                visible: true,
                                hidden: false,
                                publishedAt: Date.now()
                            });
                        }
                        console.log(chalk.green(`  ✓ ${title}`));
                        published++;
                    } catch (error) {
                        console.log(chalk.red(`  ✗ ${title}: ${error.message}`));
                        errors++;
                    }
                }
            }
        }

        // Publish lore
        if (loreData && stats.lore > 0) {
            console.log(chalk.cyan(`\n📚 Publishing ${stats.lore} lore objects...`));
            for (const id in loreData) {
                const lore = loreData[id];
                const visibility = visibilityHelpers.getVisibility(lore);
                
                if (visibility !== 'published') {
                    const path = `lore/${id}`;
                    const title = lore.title || id;
                    
                    try {
                        if (!dryRun) {
                            await updateDataAsAdmin(path, {
                                visibility: 'published',
                                published: true,
                                visible: true,
                                hidden: false,
                                status: 'published',
                                publishedAt: Date.now()
                            });
                        }
                        console.log(chalk.green(`  ✓ ${title}`));
                        published++;
                    } catch (error) {
                        console.log(chalk.red(`  ✗ ${title}: ${error.message}`));
                        errors++;
                    }
                }
            }
        }

        console.log();
        console.log(chalk.blue.bold('📊 PUBLISHING COMPLETE'));
        console.log(chalk.blue('─'.repeat(60)));
        
        if (dryRun) {
            console.log(chalk.yellow(`⚠️  DRY RUN: Would publish ${published} items`));
        } else {
            console.log(chalk.green(`✅ Published: ${published} items`));
            if (errors > 0) {
                console.log(chalk.red(`❌ Errors: ${errors} items`));
            }
        }
        console.log();

        rl.close();
        
        // Force exit after a moment to close Firebase connections
        setTimeout(() => process.exit(0), 500);

    } catch (error) {
        console.error(chalk.red('❌ Error:'), error.message);
        if (error.stack) {
            console.error(chalk.gray(error.stack));
        }
        rl.close();
        setTimeout(() => process.exit(1), 500);
    }
}

publishAllContent();

