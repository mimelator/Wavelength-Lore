#!/usr/bin/env node
/**
 * Content Status Report
 * Shows current status of all episodes, characters, and lore objects
 */

require('dotenv').config();
const chalk = require('chalk');
const { fetchDataAsAdmin } = require('../helpers/firebase-admin-utils');
const visibilityHelpers = require('../helpers/visibility-helpers');

async function generateStatusReport() {
    console.log(chalk.blue.bold('\n📊 CONTENT STATUS REPORT'));
    console.log(chalk.blue('='.repeat(60)));
    console.log();

    try {
        // Fetch all content with timeout protection
        console.log(chalk.gray('Fetching content from Firebase...'));
        
        const fetchWithTimeout = (path, timeoutMs = 5000) => {
            return Promise.race([
                fetchDataAsAdmin(path),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error(`Timeout fetching ${path}`)), timeoutMs)
                )
            ]).catch(() => null);
        };

        const [videosData, charactersData, loreData, episodesData] = await Promise.all([
            fetchWithTimeout('videos', 8000),
            fetchWithTimeout('characters', 5000),
            fetchWithTimeout('lore', 5000),
            fetchWithTimeout('episodes', 5000)
        ]);

        console.log();

        // Analyze Episodes
        await analyzeEpisodes(videosData, episodesData);

        // Analyze Characters
        await analyzeCharacters(charactersData);

        // Analyze Lore Objects
        await analyzeLore(loreData);

        // Summary
        console.log();
        console.log(chalk.blue.bold('📋 SUMMARY'));
        console.log(chalk.blue('─'.repeat(60)));
        console.log(chalk.white('Report generation complete.'));
        console.log();

    } catch (error) {
        console.error(chalk.red('❌ Error generating report:'), error.message);
        if (error.stack) {
            console.error(chalk.gray(error.stack));
        }
        throw error;
    }
}

async function analyzeEpisodes(videosData, episodesData) {
    console.log(chalk.yellow.bold('📺 EPISODES'));
    console.log(chalk.gray('─'.repeat(60)));

    const episodes = [];
    const seenIds = new Set();
    
    // Collect episodes from videos structure (videos/season{N}/episodes/episode{N})
    if (videosData) {
        for (const seasonId in videosData) {
            const season = videosData[seasonId];
            if (season && season.episodes && typeof season.episodes === 'object') {
                for (const episodeId in season.episodes) {
                    const episode = season.episodes[episodeId];
                    
                    // Create unique ID for this episode
                    const uniqueId = `${seasonId}-${episodeId}`;
                    if (seenIds.has(uniqueId)) continue;
                    seenIds.add(uniqueId);
                    
                    // Extract season and episode numbers
                    const seasonNum = seasonId.replace(/season/i, '');
                    const episodeNum = episodeId.replace(/episode/i, '');
                    
                    episodes.push({
                        id: uniqueId,
                        season: seasonId,
                        seasonNumber: parseInt(seasonNum) || 0,
                        episode: episodeId,
                        episodeNumber: parseInt(episodeNum) || 0,
                        title: episode.title || `Season ${seasonNum} Episode ${episodeNum}`,
                        visible: episode.visible,
                        hidden: episode.hidden,
                        published: episode.published,
                        status: episode.status,
                        ...episode
                    });
                }
            }
        }
    }

    // Collect from episodes structure (episodes/{id}) - new structure
    if (episodesData) {
        Object.keys(episodesData).forEach(id => {
            if (seenIds.has(id)) return;
            seenIds.add(id);
            
            const episode = episodesData[id];
            episodes.push({
                id,
                title: episode.title || 'Untitled',
                season: episode.season ? `season${episode.season}` : 'unknown',
                seasonNumber: episode.season || 0,
                episodeNumber: episode.episodeNumber || episode.episode || 0,
                visible: episode.visible,
                hidden: episode.hidden,
                published: episode.published,
                status: episode.status,
                ...episode
            });
        });
    }

    if (episodes.length === 0) {
        console.log(chalk.gray('  No episodes found'));
        return;
    }

    // Analyze visibility
    const visibilityStats = {
        published: 0,
        preview: 0,
        draft: 0,
        legacyPublished: 0,
        legacyHidden: 0
    };

    const bySeason = {};

    episodes.forEach(ep => {
        const visibility = visibilityHelpers.getVisibility(ep);
        
        if (visibility === 'published') visibilityStats.published++;
        else if (visibility === 'preview') visibilityStats.preview++;
        else visibilityStats.draft++;

        // Track legacy fields
        if (!ep.visibility) {
            if (ep.published === true) visibilityStats.legacyPublished++;
            if (ep.hidden === true || ep.visible === false) visibilityStats.legacyHidden++;
        }

        // Group by season (normalize season identifiers)
        let seasonKey = ep.season || `season${ep.seasonNumber || 0}`;
        if (typeof seasonKey === 'number') {
            seasonKey = `season${seasonKey}`;
        }
        if (!bySeason[seasonKey]) {
            bySeason[seasonKey] = { total: 0, published: 0, draft: 0, preview: 0 };
        }
        bySeason[seasonKey].total++;
        if (visibility === 'published') bySeason[seasonKey].published++;
        else if (visibility === 'preview') bySeason[seasonKey].preview++;
        else bySeason[seasonKey].draft++;
    });

    console.log(chalk.white(`Total Episodes: ${episodes.length}`));
    console.log();
    console.log(chalk.green(`  ✅ Published: ${visibilityStats.published}`));
    console.log(chalk.cyan(`  ⊙ Preview: ${visibilityStats.preview}`));
    console.log(chalk.gray(`  ○ Draft: ${visibilityStats.draft}`));
    
    if (visibilityStats.legacyPublished > 0 || visibilityStats.legacyHidden > 0) {
        console.log(chalk.yellow(`  ⚠️  Using legacy fields: ${visibilityStats.legacyPublished + visibilityStats.legacyHidden}`));
        console.log(chalk.gray(`     (${visibilityStats.legacyPublished} published, ${visibilityStats.legacyHidden} hidden)`));
    }

    console.log();
    console.log(chalk.white('By Season:'));
    Object.keys(bySeason).sort((a, b) => {
        // Sort by season number if possible
        const numA = parseInt(a.replace(/season/i, '')) || 999;
        const numB = parseInt(b.replace(/season/i, '')) || 999;
        return numA - numB;
    }).forEach(season => {
        const stats = bySeason[season];
        const draftCount = stats.total - stats.published - stats.preview;
        console.log(chalk.gray(`  ${season}: ${stats.total} total (${chalk.green(stats.published + ' published')}, ${chalk.cyan(stats.preview + ' preview')}, ${chalk.gray(draftCount + ' draft')})`));
    });
}

async function analyzeCharacters(charactersData) {
    console.log();
    console.log(chalk.yellow.bold('👥 CHARACTERS'));
    console.log(chalk.gray('─'.repeat(60)));

    if (!charactersData || Object.keys(charactersData).length === 0) {
        console.log(chalk.gray('  No characters found'));
        return;
    }

    const characters = Object.keys(charactersData).map(id => ({
        id,
        ...charactersData[id]
    }));

    const visibilityStats = {
        published: 0,
        preview: 0,
        draft: 0,
        legacyPublished: 0,
        legacyHidden: 0,
        hasVisibility: 0,
        missingVisibility: 0
    };

    characters.forEach(char => {
        const visibility = visibilityHelpers.getVisibility(char);
        
        if (visibility === 'published') visibilityStats.published++;
        else if (visibility === 'preview') visibilityStats.preview++;
        else visibilityStats.draft++;

        // Track migration status
        if (char.visibility) {
            visibilityStats.hasVisibility++;
        } else {
            visibilityStats.missingVisibility++;
            if (char.published === true) visibilityStats.legacyPublished++;
            if (char.hidden === true || char.visible === false) visibilityStats.legacyHidden++;
        }
    });

    console.log(chalk.white(`Total Characters: ${characters.length}`));
    console.log();
    console.log(chalk.green(`  ✅ Published: ${visibilityStats.published}`));
    console.log(chalk.cyan(`  ⊙ Preview: ${visibilityStats.preview}`));
    console.log(chalk.gray(`  ○ Draft: ${visibilityStats.draft}`));
    console.log();
    
    if (visibilityStats.missingVisibility > 0) {
        console.log(chalk.yellow(`  ⚠️  Migration Status:`));
        console.log(chalk.green(`     ✓ Using new visibility field: ${visibilityStats.hasVisibility}`));
        console.log(chalk.yellow(`     ○ Using legacy fields: ${visibilityStats.missingVisibility}`));
        console.log(chalk.gray(`       (${visibilityStats.legacyPublished} published, ${visibilityStats.legacyHidden} hidden)`));
    } else {
        console.log(chalk.green(`  ✅ All characters using unified visibility field!`));
    }

    // Show sample of draft characters
    const draftChars = characters.filter(c => visibilityHelpers.getVisibility(c) === 'draft').slice(0, 5);
    if (draftChars.length > 0) {
        console.log();
        console.log(chalk.gray('Sample Draft Characters:'));
        draftChars.forEach(char => {
            const vis = char.visibility || (char.published ? 'legacy-published' : 'legacy-hidden');
            console.log(chalk.gray(`  • ${char.title || char.name || char.id} (${vis})`));
        });
        if (visibilityStats.draft > 5) {
            console.log(chalk.gray(`  ... and ${visibilityStats.draft - 5} more`));
        }
    }
}

async function analyzeLore(loreData) {
    console.log();
    console.log(chalk.yellow.bold('📚 LORE OBJECTS'));
    console.log(chalk.gray('─'.repeat(60)));

    if (!loreData || Object.keys(loreData).length === 0) {
        console.log(chalk.gray('  No lore objects found'));
        return;
    }

    const loreItems = Object.keys(loreData).map(id => ({
        id,
        ...loreData[id]
    }));

    const visibilityStats = {
        published: 0,
        preview: 0,
        draft: 0,
        legacyPublished: 0,
        legacyHidden: 0,
        hasVisibility: 0,
        missingVisibility: 0
    };

    const byCategory = {};

    loreItems.forEach(item => {
        const visibility = visibilityHelpers.getVisibility(item);
        
        if (visibility === 'published') visibilityStats.published++;
        else if (visibility === 'preview') visibilityStats.preview++;
        else visibilityStats.draft++;

        // Track migration status
        if (item.visibility) {
            visibilityStats.hasVisibility++;
        } else {
            visibilityStats.missingVisibility++;
            if (item.published === true) visibilityStats.legacyPublished++;
            if (item.hidden === true || item.visible === false) visibilityStats.legacyHidden++;
        }

        // Group by category
        const category = item.category || item.contentType || 'uncategorized';
        if (!byCategory[category]) {
            byCategory[category] = { total: 0, published: 0, draft: 0 };
        }
        byCategory[category].total++;
        if (visibility === 'published') byCategory[category].published++;
        else byCategory[category].draft++;
    });

    console.log(chalk.white(`Total Lore Objects: ${loreItems.length}`));
    console.log();
    console.log(chalk.green(`  ✅ Published: ${visibilityStats.published}`));
    console.log(chalk.cyan(`  ⊙ Preview: ${visibilityStats.preview}`));
    console.log(chalk.gray(`  ○ Draft: ${visibilityStats.draft}`));
    console.log();
    
    if (visibilityStats.missingVisibility > 0) {
        console.log(chalk.yellow(`  ⚠️  Migration Status:`));
        console.log(chalk.green(`     ✓ Using new visibility field: ${visibilityStats.hasVisibility}`));
        console.log(chalk.yellow(`     ○ Using legacy fields: ${visibilityStats.missingVisibility}`));
        console.log(chalk.gray(`       (${visibilityStats.legacyPublished} published, ${visibilityStats.legacyHidden} hidden)`));
    } else {
        console.log(chalk.green(`  ✅ All lore objects using unified visibility field!`));
    }

    console.log();
    console.log(chalk.white('By Category:'));
    Object.keys(byCategory).sort().forEach(category => {
        const stats = byCategory[category];
        const draftCount = stats.total - stats.published;
        console.log(chalk.gray(`  ${category}: ${stats.total} total (${stats.published} published, ${draftCount} draft)`));
    });
}

// Run the report with timeout and cleanup
const timeout = setTimeout(() => {
    console.error(chalk.red('\n⏱️  Script timed out after 30 seconds'));
    process.exit(1);
}, 30000);

generateStatusReport()
    .then(() => {
        clearTimeout(timeout);
        // Force exit to ensure Firebase connections close
        setTimeout(() => process.exit(0), 100);
    })
    .catch(error => {
        clearTimeout(timeout);
        console.error(chalk.red('Fatal error:'), error);
        setTimeout(() => process.exit(1), 100);
    });

