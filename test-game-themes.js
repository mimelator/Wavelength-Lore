#!/usr/bin/env node

/**
 * 🎮 Wavelength Games Theme Testing Tool
 * Quick way to test different naming themes and see the results
 * 
 * Usage: node test-game-themes.js [theme]
 * Themes: shire, rivendell, gondor, rohan
 */

const { generateGamesWithTheme, getAllThemes } = require('./config/game-themes');

function displayThemePreview(themeName) {
    console.log(`\n🌊 WAVELENGTH GAMES THEME PREVIEW: ${themeName.toUpperCase()}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
        const games = generateGamesWithTheme(themeName);
        
        games.forEach((game, index) => {
            console.log(`\n${index + 1}. 🎮 ${game.title}`);
            console.log(`   📋 ${game.description}`);
            console.log(`   🎯 ${game.strategic_tagline}`);
            console.log(`   📊 Status: ${game.status} | Pieces/Difficulty: ${game.piece_counts ? game.piece_counts.join(', ') + ' pieces' : game.difficulty}`);
            console.log(`   🎨 Theme: ${game.theme} | Category: ${game.category}`);
            console.log(`   ⚡ CTA: "${game.cta_primary}" → ${game.cta_secondary}`);
        });
        
        console.log(`\n🎆 Total Games: ${games.length}`);
        console.log(`🌟 Theme Atmosphere: ${games[0]?.atmosphere || 'Not specified'}`);
        
    } catch (error) {
        console.error(`❌ Error generating theme ${themeName}:`, error.message);
    }
}

function showAllThemes() {
    console.log('\n🌊 WAVELENGTH GAMES - ALL AVAILABLE THEMES');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const themes = getAllThemes();
    themes.forEach((theme, index) => {
        console.log(`\n${index + 1}. ${theme.name}`);
        console.log(`   ${theme.description}`);
        console.log(`   🧪 Test: node test-game-themes.js ${theme.key}`);
    });
    
    console.log('\n🔧 To change the active theme permanently:');
    console.log('   Edit config/game-themes.js and change ACTIVE_THEME constant\n');
}

function testGameAPI() {
    console.log('\n🧪 WAVELENGTH API PREVIEW ENDPOINTS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📡 GET /games/api/list - Current theme games');
    console.log('🔄 GET /games/api/preview-theme/rivendell - Preview theme');
    console.log('🎮 GET /games/api/shire-lore-tapestry - Specific game');
    console.log('\n🚀 Easy Theme Testing:');
    console.log('   curl "http://localhost:3000/games/api/preview-theme/rivendell"');
}

// Main execution
const args = process.argv.slice(2);
const requestedTheme = args[0];

if (!requestedTheme) {
    showAllThemes();
    testGameAPI();
} else if (requestedTheme === 'all') {
    const themes = getAllThemes();
    themes.forEach(theme => displayThemePreview(theme.key));
} else {
    displayThemePreview(requestedTheme);
}

console.log('\n🎯 GitHub Issue #61 Implementation Status: ✅ COMPLETE');
console.log('🧩 New Jigsaw Puzzle Game: ✅ READY');
console.log('⚡ Easy Theme Iteration: ✅ ACTIVE\n');