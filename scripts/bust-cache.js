#!/usr/bin/env node

/**
 * Cache Busting Utility for Wavelength Lore
 * 
 * This script provides various ways to clear caches:
 * - Characters only
 * - Lore only  
 * - Episodes only
 * - Any combination or all caches
 * - Force refresh from database
 */

const characterHelpers = require('../helpers/character-helpers');
const loreHelpers = require('../helpers/lore-helpers');
const episodeHelpers = require('../helpers/episode-helpers');

// Parse command line arguments
const args = process.argv.slice(2);

async function bustCache() {
    console.log('🧹 Wavelength Cache Busting Utility\n');
    
    const bustCharacters = args.includes('--characters') || args.includes('--all') || args.length === 0;
    const bustLore = args.includes('--lore') || args.includes('--all') || args.length === 0;
    const bustEpisodes = args.includes('--episodes') || args.includes('--all') || args.length === 0;
    const forceRefresh = args.includes('--refresh');
    
    if (args.includes('--help') || args.includes('-h')) {
        showHelp();
        return;
    }
    
    try {
        if (bustCharacters) {
            console.log('🎭 Clearing character cache...');
            characterHelpers.clearCharacterCache();
            console.log('✅ Character cache cleared');
            
            if (forceRefresh) {
                console.log('🔄 Force refreshing character cache from database...');
                await characterHelpers.initializeCharacterCache();
                const characters = await characterHelpers.getAllCharacters();
                console.log(`✅ Character cache refreshed with ${characters.length} items`);
            }
        }
        
        if (bustLore) {
            console.log('📚 Clearing lore cache...');
            loreHelpers.clearLoreCache();
            console.log('✅ Lore cache cleared');
            
            if (forceRefresh) {
                console.log('🔄 Force refreshing lore cache from database...');
                await loreHelpers.initializeLoreCache();
                const lore = await loreHelpers.getAllLore();
                console.log(`✅ Lore cache refreshed with ${lore.length} items`);
            }
        }
        
        if (bustEpisodes) {
            console.log('📺 Clearing episode cache...');
            episodeHelpers.clearEpisodeCache();
            console.log('✅ Episode cache cleared');
            
            if (forceRefresh) {
                console.log('🔄 Force refreshing episode cache from database...');
                await episodeHelpers.initializeEpisodeCache();
                const episodes = await episodeHelpers.getAllEpisodes();
                console.log(`✅ Episode cache refreshed with ${episodes.length} items`);
            }
        }
        
        console.log('\n🎉 Cache busting completed successfully!');
        
        if (!forceRefresh) {
            console.log('💡 Tip: Use --refresh to immediately reload data from database');
        }
        
    } catch (error) {
        console.error('❌ Error during cache busting:', error.message);
        process.exit(1);
    }
}

function showHelp() {
    console.log(`
Usage: node bust-cache.js [options]

Options:
  --characters     Clear character cache only
  --lore           Clear lore cache only
  --episodes       Clear episode cache only
  --all            Clear all caches (default if no options)
  --refresh        Force refresh from database after clearing
  --help, -h       Show this help message

Examples:
  node bust-cache.js                      # Clear all caches
  node bust-cache.js --characters         # Clear character cache only
  node bust-cache.js --lore               # Clear lore cache only
  node bust-cache.js --episodes           # Clear episode cache only
  node bust-cache.js --characters --lore  # Clear character and lore caches
  node bust-cache.js --all --refresh      # Clear and refresh all caches
  node bust-cache.js --episodes --refresh # Clear and refresh episode cache only

Note: Clearing cache forces the next request to reload data from Firebase.
The --refresh option immediately reloads the data instead of waiting.
    `);
}

// Run the cache busting
bustCache().catch(console.error);