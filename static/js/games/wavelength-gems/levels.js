/**
 * Wavelength Gems - Level Configuration Loader
 *
 * This file loads level definitions from the server's YAML configuration.
 * Levels are tied to episodes from the Wavelength Lore series.
 *
 * Structure:
 * - Season 1: Episodes 1-11 (Levels 1-11)
 * - Season 2: Episodes 1-7 (Levels 12-18)
 * - Season 3: Episodes 1-2 (Levels 19-20)
 * - Season 4: Episodes 1-8 (Levels 21-28) - FUTURE
 */

// ═════════════════════════════════════════════════════════════════════════════
// LEVEL DATA STORAGE
// ═════════════════════════════════════════════════════════════════════════════

let LEVELS = [];
let levelsLoaded = false;

/**
 * Load levels from server
 * @returns {Promise<Array>} Array of level configurations
 */
async function loadLevelsFromServer() {
    if (levelsLoaded && LEVELS.length > 0) {
        return LEVELS;
    }
    
    try {
        const response = await fetch('/api/games/wavelength-gems/levels');
        const data = await response.json();
        
        if (data.success && data.levels) {
            LEVELS = data.levels.map(level => applyDefaults(level));
            levelsLoaded = true;
            console.log(`✅ Loaded ${LEVELS.length} levels from server`);
            return LEVELS;
        } else {
            console.error('Failed to load levels:', data.error);
            return [];
        }
    } catch (error) {
        console.error('Error loading levels from server:', error);
        return [];
    }
}

/**
 * Apply default values to a level configuration
 * @param {Object} level - Level data from YAML
 * @returns {Object} Level with defaults applied
 */
function applyDefaults(level) {
    const DEFAULT_DIFFICULTY_VALUES = {
        tutorial: { moveLimit: 50, targetScore: 500, gemTypeCount: 3, cascadeBonus: 1.0 },
        easy: { moveLimit: 30, targetScore: 1500, gemTypeCount: 4, cascadeBonus: 1.2 },
        medium: { moveLimit: 25, targetScore: 2500, gemTypeCount: 5, cascadeBonus: 1.5 },
        hard: { moveLimit: 20, targetScore: 4000, gemTypeCount: 6, cascadeBonus: 2.0 },
        very_hard: { moveLimit: 15, targetScore: 6000, gemTypeCount: 7, cascadeBonus: 2.5 },
        expert: { moveLimit: 15, targetScore: 5500, gemTypeCount: 6, cascadeBonus: 2.5 },
        legend: { moveLimit: 10, targetScore: 7500, gemTypeCount: 6, cascadeBonus: 3.0 },
        boss: { moveLimit: 35, targetScore: 8000, gemTypeCount: 8, cascadeBonus: 3.0 }
    };

    const difficulty = level.difficulty || 'easy';
    const baseValues = DEFAULT_DIFFICULTY_VALUES[difficulty] || DEFAULT_DIFFICULTY_VALUES['easy'];

    return {
        // Apply defaults with YAML data override
        season: level.season || 1,
        episode: level.episode || 1,
        level: level.level || 1,
        title: level.title || "Level",
        description: level.description || "",
        difficulty: difficulty,
        episodeKey: level.episodeKey || null,
        theme: {
            primaryColor: "#8B5CF6",
            secondaryColor: "#EC4899",
            accentColor: "#FF6B6B",
            backgroundImage: null,
            backgroundOpacity: 0.15,
            carouselImages: [],
            particleEffect: null,
            borderGlowColor: "#8B5CF6",
            borderGlowIntensity: 0.5,
            ...(level.theme || {})
        },
        gemThemes: level.gemThemes || {},
        objectives: {
            primary: {
                type: "score",
                target: baseValues.targetScore,
                description: `Reach ${baseValues.targetScore} points`,
                ...(level.objectives?.primary || {})
            },
            secondary: level.objectives?.secondary || []
        },
        constraints: {
            moveLimit: baseValues.moveLimit,
            timeLimit: null,
            cascadeLimit: 10,
            gemTypes: ["daphne", "jasper", "miles", "ivy", "echo", "atlas"],
            gemTypeCount: baseValues.gemTypeCount,
            boardSize: { rows: 8, cols: 8 },
            ...(level.constraints || {})
        },
        narrative: {
            briefing: "",
            storySegments: [],
            loreReference: null,
            characters: [],
            locations: [],
            ...(level.narrative || {})
        },
        progression: {
            unlockRequirements: {
                previousLevel: null,
                minimumScore: null,
                playtime: null,
                ...(level.progression?.unlockRequirements || {})
            },
            rewards: {
                points: 500,
                coins: 25,
                experience: 100,
                stars: 1
            },
            recordStats: true,
            trackingFields: [
                "score",
                "moves_used",
                "combo_streak",
                "time_taken",
                "cascades_triggered"
            ]
        },
        metadata: {
            createdDate: new Date().toISOString().split('T')[0],
            lastModified: new Date().toISOString().split('T')[0],
            author: "Game Design Team",
            version: "1.0",
            status: "active"
        }
    };
}

// ═════════════════════════════════════════════════════════════════════════════
// LEVEL MANAGER FUNCTIONS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Get a level by level number
 * @param {number} levelNumber - Level 1-based index
 * @returns {Promise<Object>} Level configuration or null
 */
async function getLevel(levelNumber) {
    const levels = await loadLevelsFromServer();
    return levels.find(level => level.level === levelNumber) || null;
}

/**
 * Get all levels
 * @returns {Promise<Array>} All level configurations
 */
async function getAllLevels() {
    return await loadLevelsFromServer();
}

/**
 * Get levels for a specific season
 * @param {number} season - Season number (1, 2, 3, etc.)
 * @returns {Promise<Array>} Levels in the season
 */
async function getLevelsBySeason(season) {
    const levels = await loadLevelsFromServer();
    return levels.filter(level => level.season === season);
}

/**
 * Get total number of levels
 * @returns {Promise<number>} Total level count
 */
async function getTotalLevelCount() {
    const levels = await loadLevelsFromServer();
    return levels.length;
}

/**
 * Get next level after specified level
 * @param {number} currentLevel - Current level number
 * @returns {Promise<Object|null>} Next level or null if at end
 */
async function getNextLevel(currentLevel) {
    const nextLevelNum = currentLevel + 1;
    return await getLevel(nextLevelNum);
}

/**
 * Check if a level is available based on unlock requirements
 * @param {number} levelNumber - Level to check
 * @param {Object} userProgress - User's progress object { completedLevels: [], bestScores: {} }
 * @returns {Promise<boolean>} Whether level is unlocked
 */
async function isLevelUnlocked(levelNumber, userProgress = {}) {
    const level = await getLevel(levelNumber);
    if (!level) return false;

    const { unlockRequirements } = level.progression;

    // First level is always unlocked
    if (unlockRequirements.previousLevel === null) return true;

    // Check if previous level is completed
    const completedLevels = userProgress.completedLevels || [];
    if (!completedLevels.includes(unlockRequirements.previousLevel)) {
        return false;
    }

    // Check minimum score requirement if specified
    if (unlockRequirements.minimumScore !== null) {
        const bestScore = userProgress.bestScores?.[unlockRequirements.previousLevel] || 0;
        if (bestScore < unlockRequirements.minimumScore) {
            return false;
        }
    }

    return true;
}

// ═════════════════════════════════════════════════════════════════════════════
// EXPORT FOR USE IN GAME ENGINE
// ═════════════════════════════════════════════════════════════════════════════

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadLevelsFromServer,
        getLevel,
        getAllLevels,
        getLevelsBySeason,
        getTotalLevelCount,
        getNextLevel,
        isLevelUnlocked
    };
}
