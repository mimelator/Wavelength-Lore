/**
 * Wavelength Games Theme Configuration System
 * Easy iteration on game names, descriptions, and lore integration
 * 
 * 🔄 QUICK THEME SWITCHING:
 * Just change the ACTIVE_THEME constant below to switch entire game portfolio!
 */

// 🎯 ACTIVE THEME - Change this to switch all game names instantly!
const ACTIVE_THEME = 'shire'; // Options: 'shire', 'rivendell', 'gondor', 'rohan'

/**
 * Theme Definitions - Each theme provides different naming and atmosphere
 */
const GAME_THEMES = {
    shire: {
        prefix: "THE SHIRE BATTLEGAMES",
        subtitle: "Peaceful Strategic Challenges",
        atmosphere: "cozy, tactical, community-focused",
        callToAction: "Test your strategic might in the comfort of the Shire!",
        description_style: "friendly, approachable strategic challenges",
        difficulty_names: ['Hobbit', 'Ranger', 'Wizard', 'Maia'],
        lore_focus: "Hobbit wisdom and peaceful tactical thinking"
    },
    
    rivendell: {
        prefix: "RIVENDELL ARCHIVES",
        subtitle: "Ethereal Wisdom Challenges", 
        atmosphere: "mystical, intellectual, timeless",
        callToAction: "Challenge your lore knowledge with elven wisdom!",
        description_style: "elegant, thoughtful mental challenges",
        difficulty_names: ['Novice', 'Scholar', 'Loremaster', 'Elrond'],
        lore_focus: "Ancient knowledge and ethereal understanding"
    },
    
    gondor: {
        prefix: "MINAS TIRITH CHALLENGES",
        subtitle: "Royal Strategic Competitions",
        atmosphere: "noble, epic, commanding",
        callToAction: "Test your strategic might in the halls of kings!",  
        description_style: "majestic, commanding strategic battles",
        difficulty_names: ['Guard', 'Captain', 'General', 'Steward'],
        lore_focus: "Royal strategy and leadership wisdom"
    },
    
    rohan: {
        prefix: "EDORAS WARCRAFT",
        subtitle: "Swift Strategic Mastery",
        atmosphere: "bold, swift, battle-ready", 
        callToAction: "Test your strategic might with the speed of Rohan!",
        description_style: "fast-paced, action-oriented challenges",
        difficulty_names: ['Rider', 'Éored', 'Marshal', 'King'],
        lore_focus: "Swift tactical thinking and battlefield strategy"
    }
};

/**
 * Base Game Definitions - Theme-independent game mechanics
 */
const BASE_GAMES = {
    gems: {
        id: 'wavelength-gems',
        core_mechanic: 'Match-3 tactical gem collection',
        strategic_elements: ['pattern-recognition', 'resource-management', 'timing'],
        lore_connection: 'Ancient dwarven mining techniques and crystal mastery',
        base_description: 'strategic gem-matching with mystical crystals',
        difficulty_base: 'apprentice',
        gameplay_time: '5-15 minutes per session'
    },
    
    lore_puzzle: {
        id: 'lore-puzzle-master', 
        core_mechanic: 'Knowledge-based strategic puzzles',
        strategic_elements: ['lore-knowledge', 'logical-deduction', 'pattern-analysis'],
        lore_connection: 'Test knowledge of Middle-earth history and wisdom',
        base_description: 'challenging lore-based puzzle solving',
        difficulty_base: 'journeyman',
        gameplay_time: '10-25 minutes per challenge'
    },
    
    jigsaw: {
        id: 'wavelength-lore-jigsaw',
        core_mechanic: 'Strategic puzzle reconstruction',
        strategic_elements: ['spatial-reasoning', 'patience', 'systematic-thinking'],
        lore_connection: 'Reconstruct legendary scenes from Middle-earth',
        base_description: 'epic scene reconstruction with strategic bonuses',
        difficulty_base: 'variable',
        gameplay_time: '15-60 minutes depending on complexity',
        piece_counts: [25, 100, 300, 500],
        unlock_system: 'Progressive difficulty unlocking'
    }
};

/**
 * Generate themed game configuration
 * @param {string} theme - Theme key from GAME_THEMES
 * @returns {Array} Array of fully configured games with theme applied
 */
function generateGamesWithTheme(theme = ACTIVE_THEME) {
    const themeConfig = GAME_THEMES[theme];
    if (!themeConfig) {
        throw new Error(`Unknown theme: ${theme}. Available: ${Object.keys(GAME_THEMES).join(', ')}`);
    }
    
    const games = [];
    
    // 1. Enhanced Wavelength Gems
    const gems = BASE_GAMES.gems;
    games.push({
        id: `${theme}-gem-quest`,
        title: `${themeConfig.prefix}: Crystal Harvest`,
        description: `${themeConfig.callToAction} Gather mystical ice crystals using ${gems.lore_connection.toLowerCase()}.`,
        category: 'strategic-puzzle',
        status: 'live',
        releaseDate: '2024-10-21',
        thumbnail: '/images/games/wavelength-gems-ice-diamond.svg',
        
        // Theme-specific enhancements
        theme: theme,
        atmosphere: themeConfig.atmosphere,
        lore_connection: gems.lore_connection,
        strategic_elements: gems.strategic_elements,
        difficulty: themeConfig.difficulty_names[0], // Start at lowest difficulty
        gameplay_time: gems.gameplay_time,
        
        // Enhanced CTA elements
        cta_primary: 'Play Crystal Harvest',
        cta_secondary: `Master ${themeConfig.lore_focus}`,
        strategic_tagline: `${themeConfig.callToAction}`
    });
    
    // 2. Enhanced Lore Puzzle Master  
    const lore = BASE_GAMES.lore_puzzle;
    games.push({
        id: `${theme}-lore-master`,
        title: `${themeConfig.prefix}: Wisdom Trials`,
        description: `Challenge your lore knowledge! Navigate complex puzzles using ${themeConfig.lore_focus.toLowerCase()}.`,
        category: 'knowledge-strategy',
        status: 'coming-soon',
        releaseDate: '2026-Q1',
        thumbnail: '/images/games/lore-puzzle.jpg',
        
        // Theme-specific enhancements
        theme: theme,
        atmosphere: themeConfig.atmosphere,
        lore_connection: lore.lore_connection,
        strategic_elements: lore.strategic_elements,
        difficulty: themeConfig.difficulty_names[1], // Second difficulty tier
        gameplay_time: lore.gameplay_time,
        
        // Enhanced CTA elements
        cta_primary: 'Coming Soon',
        cta_secondary: `Master ${themeConfig.lore_focus}`,
        strategic_tagline: `${themeConfig.callToAction}`
    });
    
    // 3. NEW: Jigsaw Puzzle Game
    const jigsaw = BASE_GAMES.jigsaw;
    games.push({
        id: `${theme}-lore-tapestry`,
        title: `${themeConfig.prefix}: Lore Tapestry`,
        description: `${themeConfig.callToAction} Reconstruct legendary Middle-earth scenes with strategic time bonuses. (VIP Only - Coming Soon)`,
        category: 'strategic-reconstruction',
        status: 'coming-soon',
        access_level: 'vip-only',
        releaseDate: '2025-Q1',
        thumbnail: '/images/games/jigsaw-lore-tapestry.jpg',
        
        // Theme-specific enhancements
        theme: theme,
        atmosphere: themeConfig.atmosphere,
        lore_connection: jigsaw.lore_connection,
        strategic_elements: jigsaw.strategic_elements,
        difficulty: 'Variable', // Multiple difficulty levels
        gameplay_time: jigsaw.gameplay_time,
        
        // Jigsaw-specific features
        piece_counts: jigsaw.piece_counts,
        unlock_system: jigsaw.unlock_system,
        difficulty_progression: themeConfig.difficulty_names,
        
        // Enhanced CTA elements  
        cta_primary: 'VIP Only - Coming Soon',
        cta_secondary: `Exclusive ${themeConfig.lore_focus}`,
        strategic_tagline: `${themeConfig.callToAction}`,
        vip_exclusive: true,
        coming_soon_note: 'Advanced strategic puzzle experience for VIP members'
    });
    
    return games;
}

/**
 * Get current active theme configuration
 */
function getActiveTheme() {
    return GAME_THEMES[ACTIVE_THEME];
}

/**
 * Get all available themes for admin interface
 */
function getAllThemes() {
    return Object.keys(GAME_THEMES).map(key => ({
        key,
        name: GAME_THEMES[key].prefix,
        description: GAME_THEMES[key].subtitle
    }));
}

/**
 * Quick theme switching for testing
 * @param {string} newTheme - New theme to activate
 * @returns {Array} Games with new theme applied
 */
function switchTheme(newTheme) {
    if (!GAME_THEMES[newTheme]) {
        throw new Error(`Invalid theme: ${newTheme}`);
    }
    
    // In production, this would update a database or config file
    // For now, just generate the games with the new theme
    return generateGamesWithTheme(newTheme);
}

module.exports = {
    generateGamesWithTheme,
    getActiveTheme,
    getAllThemes,
    switchTheme,
    ACTIVE_THEME,
    GAME_THEMES,
    BASE_GAMES
};