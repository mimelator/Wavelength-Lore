#!/usr/bin/env node

/**
 * WAVELENGTH AI CLIFFHANGER GENERATOR (Enhanced Schema Version)
 * 
 * This script uses the same bulk processing techniques from chat-lore-bulk-query.js
 * but applies them specifically to generating compelling episode cliffhanger CTAs
 * using the NEW dedicated cliffhanger schema fields (Option B).
 * 
 * NEW SCHEMA FIELDS:
 * - cliffhanger_hook: "But when..." dramatic tension
 * - next_episode_tease: Preview of what's coming next
 * - cta_tagline: Compelling question for CTA header
 * 
 * Based on techniques from:
 * - scripts/chat-lore-bulk-query.js (bulk processing)
 * - wavelength-chat-cli.js (AI integration)
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { WavelengthChatCLI } = require('../wavelength-chat-cli.js');

// Configuration (same pattern as chat-lore-bulk-query.js)
const API_DELAY_MS = 2000; // Rate limiting for API calls
const SEASONS_DIR = path.join(__dirname, '..', 'content', 'seasons');
const BACKUP_DIR = path.join(__dirname, '..', 'backups', 'cliffhanger-generation');

// Statistics tracking
const stats = {
    totalEpisodes: 0,
    processed: 0,
    enhanced: 0,
    errors: 0,
    startTime: Date.now()
};

/**
 * Enhanced cliffhanger prompt generator
 * Creates context-aware prompts for the Wavelength AI
 */
function createCliffhangerPrompt(episodeData, seasonContext, nextEpisode) {
    const { title, description, story, original_story_summary } = episodeData;
    
    const prompt = `Create cliffhanger elements for Wavelength episode "${title}".

Episode Context: ${story?.substring(0, 200) || description?.substring(0, 200) || 'Musical fantasy episode'}

Generate:
1. CLIFFHANGER_HOOK: Dramatic "But when..." tension (1-2 sentences)
2. NEXT_EPISODE_TEASE: Preview sentence 
3. CTA_TAGLINE: Compelling question (5-8 words)

Style: Mystical fantasy, Shire vs Goblin conflict

Format:
CLIFFHANGER_HOOK: [hook]
NEXT_EPISODE_TEASE: [tease] 
CTA_TAGLINE: [tagline]`;

    return prompt;
}

/**
 * Parse AI response into structured data
 * Handles both line-by-line and inline response formats
 */
function parseCliffhangerResponse(response) {
    const result = {};
    
    // Try to extract fields using regex patterns for inline format
    const hookMatch = response.match(/CLIFFHANGER_HOOK:\s*([^.]*\.(?:[^.]*\.)?)/);
    const teaseMatch = response.match(/NEXT_EPISODE_TEASE:\s*([^.]*\.)/);
    const taglineMatch = response.match(/CTA_TAGLINE:\s*([^?]*\?)/);
    
    if (hookMatch) result.cliffhanger_hook = hookMatch[1].trim();
    if (teaseMatch) result.next_episode_tease = teaseMatch[1].trim();
    if (taglineMatch) result.cta_tagline = taglineMatch[1].trim();
    
    // Fallback: try line-by-line parsing
    if (!result.cliffhanger_hook || !result.next_episode_tease || !result.cta_tagline) {
        const lines = response.split('\n');
        for (const line of lines) {
            if (line.startsWith('CLIFFHANGER_HOOK:') && !result.cliffhanger_hook) {
                result.cliffhanger_hook = line.replace('CLIFFHANGER_HOOK:', '').trim();
            } else if (line.startsWith('NEXT_EPISODE_TEASE:') && !result.next_episode_tease) {
                result.next_episode_tease = line.replace('NEXT_EPISODE_TEASE:', '').trim();
            } else if (line.startsWith('CTA_TAGLINE:') && !result.cta_tagline) {
                result.cta_tagline = line.replace('CTA_TAGLINE:', '').trim();
            }
        }
    }
    
    return result;
}

/**
 * Create backup before processing (same pattern as chat-lore-bulk-query.js)
 */
function createBackup() {
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_DIR, `before-cliffhanger-generation-${timestamp}`);
    fs.mkdirSync(backupPath, { recursive: true });
    
    // Copy all season files
    const seasonFiles = fs.readdirSync(SEASONS_DIR).filter(f => f.endsWith('.yaml'));
    seasonFiles.forEach(file => {
        fs.copyFileSync(
            path.join(SEASONS_DIR, file),
            path.join(backupPath, file)
        );
    });
    
    console.log(`📁 Backup created: ${backupPath}`);
    return backupPath;
}

/**
 * Process a single episode with AI-generated cliffhangers
 */
async function processEpisode(seasonData, seasonNumber, episodeKey, episodeData, chat) {
    stats.totalEpisodes++;
    
    try {
        console.log(`\n🎬 Processing Episode: ${episodeData.title || episodeKey}`);
        
        // Skip if already has all cliffhanger fields
        if (episodeData.cliffhanger_hook && episodeData.next_episode_tease && episodeData.cta_tagline) {
            console.log(`   ⏭️  Already has cliffhanger fields, skipping...`);
            stats.processed++;
            return episodeData;
        }
        
        // Get next episode for context
        const episodeKeys = Object.keys(seasonData.episodes);
        const currentIndex = episodeKeys.indexOf(episodeKey);
        const nextEpisode = currentIndex < episodeKeys.length - 1 ? 
            seasonData.episodes[episodeKeys[currentIndex + 1]] : null;
        
        // Generate cliffhanger prompt
        const prompt = createCliffhangerPrompt(
            episodeData, 
            seasonData.description, 
            nextEpisode
        );
        
        console.log(`   🤖 Generating cliffhangers with Wavelength AI...`);
        
        // Get AI response (using askChatbot like chat-lore-bulk-query.js)
        const response = await chat.askChatbot(prompt);
        
        if (!response || !response.success) {
            throw new Error(`AI request failed: ${response?.error || 'No response'}`);
        }
        
        // Parse the structured response (response.response contains the text)
        const cliffhangers = parseCliffhangerResponse(response.response);
        
        if (!cliffhangers.cliffhanger_hook || !cliffhangers.next_episode_tease || !cliffhangers.cta_tagline) {
            throw new Error('Incomplete cliffhanger data from AI');
        }
        
        // Add the new fields to episode data
        const enhancedEpisode = {
            ...episodeData,
            ...cliffhangers
        };
        
        console.log(`   ✅ Generated cliffhangers:`);
        console.log(`      Hook: "${cliffhangers.cliffhanger_hook}"`);
        console.log(`      Tease: "${cliffhangers.next_episode_tease}"`);
        console.log(`      CTA: "${cliffhangers.cta_tagline}"`);
        
        stats.processed++;
        stats.enhanced++;
        
        return enhancedEpisode;
        
    } catch (error) {
        console.error(`   ❌ Error processing episode: ${error.message}`);
        stats.errors++;
        return episodeData; // Return original data on error
    }
}

/**
 * Process all episodes in a season
 */
async function processSeason(seasonFile, chat) {
    const seasonPath = path.join(SEASONS_DIR, seasonFile);
    const seasonNumber = seasonFile.match(/season(\d+)/)?.[1] || 'unknown';
    
    console.log(`\n🎭 Processing ${seasonFile} (Season ${seasonNumber})`);
    
    // Read and parse season file
    const seasonContent = fs.readFileSync(seasonPath, 'utf8');
    const seasonData = yaml.load(seasonContent);
    
    if (!seasonData.episodes) {
        console.log(`   ⚠️  No episodes found in ${seasonFile}`);
        return;
    }
    
    const episodeKeys = Object.keys(seasonData.episodes);
    console.log(`   📺 Found ${episodeKeys.length} episodes`);
    
    // Process each episode
    let hasChanges = false;
    for (const episodeKey of episodeKeys) {
        const originalEpisode = seasonData.episodes[episodeKey];
        const enhancedEpisode = await processEpisode(
            seasonData, 
            seasonNumber, 
            episodeKey, 
            originalEpisode, 
            chat
        );
        
        if (enhancedEpisode !== originalEpisode) {
            seasonData.episodes[episodeKey] = enhancedEpisode;
            hasChanges = true;
        }
        
        // Rate limiting (same as chat-lore-bulk-query.js)
        if (API_DELAY_MS > 0) {
            console.log(`   ⏳ Waiting ${API_DELAY_MS}ms for rate limiting...`);
            await new Promise(resolve => setTimeout(resolve, API_DELAY_MS));
        }
    }
    
    // Save updated season file if changes were made
    if (hasChanges) {
        // Save updated season data (js-yaml style)
        const updatedYaml = yaml.dump(seasonData, {
            lineWidth: 0,
            doubleQuotedAsJSON: false,
            defaultStringType: 'QUOTE_SINGLE'
        });
        
        fs.writeFileSync(seasonPath, updatedYaml, 'utf8');
        console.log(`   💾 Updated ${seasonFile} with cliffhanger enhancements`);
    } else {
        console.log(`   📋 No changes needed for ${seasonFile}`);
    }
}

/**
 * Main execution function
 */
async function main() {
    console.log(`
🎬✨ WAVELENGTH AI CLIFFHANGER GENERATOR (Enhanced Schema) ✨🎬
=================================================================
Using dedicated cliffhanger schema fields for better separation
Based on chat-lore-bulk-query.js bulk processing techniques
`);

    try {
        // Create backup first
        const backupPath = createBackup();
        
        // Initialize Wavelength AI Chat (same pattern as chat-lore-bulk-query.js)
        console.log(`🤖 Initializing Wavelength AI Chat...`);
        const chat = new WavelengthChatCLI({
            model: 'gpt-4',
            temperature: 0.8, // Slightly higher for creative cliffhangers
            systemPrompt: `You are the Wavelength Lore master storyteller, expert at creating compelling cliffhangers and dramatic tension. Your responses should be concise, dramatic, and perfectly capture the mystical musical fantasy tone of the Wavelength universe.`
        });
        
        // Get all season files
        const seasonFiles = fs.readdirSync(SEASONS_DIR)
            .filter(file => file.endsWith('.yaml'))
            .sort();
        
        console.log(`📚 Found ${seasonFiles.length} season files: ${seasonFiles.join(', ')}`);
        
        // Process each season
        for (const seasonFile of seasonFiles) {
            await processSeason(seasonFile, chat);
        }
        
        // Final statistics
        const duration = ((Date.now() - stats.startTime) / 1000).toFixed(1);
        console.log(`
🎉 CLIFFHANGER GENERATION COMPLETE!
====================================
📊 Total Episodes: ${stats.totalEpisodes}
✅ Processed: ${stats.processed}
🎬 Enhanced: ${stats.enhanced}
❌ Errors: ${stats.errors}
⏱️  Duration: ${duration}s
📁 Backup: ${backupPath}

🚀 Ready to test the enhanced episode cliffhangers!
Visit any episode page to see the new schema fields in action.
`);
        
    } catch (error) {
        console.error(`\n❌ Fatal error: ${error.message}`);
        console.error(error.stack);
        process.exit(1);
    }
}

// Execute if run directly
if (require.main === module) {
    main();
}

module.exports = {
    createCliffhangerPrompt,
    parseCliffhangerResponse,
    processEpisode,
    main
};