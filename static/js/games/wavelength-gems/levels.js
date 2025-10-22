/**
 * Wavelength Gems - Level Configuration Data
 *
 * This file contains the actual level definitions for the game.
 * Each level is tied to an episode from the Wavelength Lore series.
 *
 * Levels are automatically generated from episode data, but can be
 * manually customized here for game-specific balance and theming.
 *
 * Structure:
 * - Season 1: Episodes 1-11 (Levels 1-11)
 * - Season 2: Episodes 1-7 (Levels 12-18)
 * - Season 3: Episodes 1-2 (Levels 19-20)
 * - Season 4: Episodes 1-8 (Levels 21-28) - FUTURE
 */

// ═════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTION: CREATE LEVEL FROM TEMPLATE
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Helper to create a level with defaults from difficulty config
 * Reduces repetition and makes levels easy to maintain
 */
function createLevel(override) {
    const DEFAULT_DIFFICULTY_VALUES = {
        tutorial: { moveLimit: 50, targetScore: 500, gemTypeCount: 3, cascadeBonus: 1.0 },
        easy: { moveLimit: 30, targetScore: 1500, gemTypeCount: 4, cascadeBonus: 1.2 },
        medium: { moveLimit: 25, targetScore: 2500, gemTypeCount: 5, cascadeBonus: 1.5 },
        hard: { moveLimit: 20, targetScore: 4000, gemTypeCount: 6, cascadeBonus: 2.0 },
        expert: { moveLimit: 15, targetScore: 5500, gemTypeCount: 6, cascadeBonus: 2.5 },
        legend: { moveLimit: 10, targetScore: 7500, gemTypeCount: 6, cascadeBonus: 3.0 }
    };

    const difficulty = override.difficulty || 'easy';
    const baseValues = DEFAULT_DIFFICULTY_VALUES[difficulty];

    return {
        // Defaults
        season: 1,
        episode: 1,
        level: 1,
        title: "Level",
        description: "",
        difficulty: difficulty,
        theme: {
            primaryColor: "#8B5CF6",
            secondaryColor: "#EC4899",
            accentColor: "#FF6B6B",
            backgroundImage: null,
            backgroundOpacity: 0.15,
            carouselImages: [],
            particleEffect: null,
            borderGlowColor: "#8B5CF6",
            borderGlowIntensity: 0.5
        },
        objectives: {
            primary: {
                type: "score",
                target: baseValues.targetScore,
                description: `Reach ${baseValues.targetScore} points`
            },
            secondary: []
        },
        constraints: {
            moveLimit: baseValues.moveLimit,
            timeLimit: null,
            cascadeLimit: 10,
            gemTypes: ["daphne", "jasper", "miles", "ivy", "echo", "atlas"],
            gemTypeCount: baseValues.gemTypeCount,
            boardSize: { rows: 8, cols: 8 }
        },
        narrative: {
            briefing: "",
            storySegments: [],
            loreReference: null,
            characters: [],
            locations: []
        },
        progression: {
            unlockRequirements: {
                previousLevel: null,
                minimumScore: null,
                playtime: null
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
        },

        // Apply overrides
        ...override
    };
}

// ═════════════════════════════════════════════════════════════════════════════
// SEASON 1 LEVELS (Episodes 1-11)
// ═════════════════════════════════════════════════════════════════════════════

const LEVELS = [
    // Level 1: My Lucky Charm
    createLevel({
        level: 1,
        season: 1,
        episode: 1,
        episodeKey: "season1/episode1",
        title: "My Lucky Charm",
        description: "Lucky the Leprechaun has blessed the Shire! Match gems to spread joy and positivity across the land.",
        difficulty: "easy",
        theme: {
            primaryColor: "#FFD700",        // Gold
            secondaryColor: "#10B981",      // Green (Irish)
            accentColor: "#FFA500",         // Orange
            backgroundImage: "/static/images/characters/wavelength/MyLuckyCharm-02.webp",
            backgroundOpacity: 0.12,
            carouselImages: [
                "/static/images/seasons/season1/episodes/episode1/images/MyLuckyCharm-01.webp",
                "/static/images/characters/wavelength/MyLuckyCharm-02.webp",
                "/static/images/seasons/season1/episodes/episode1/images/MyLuckyCharm-03.webp"
            ],
            particleEffect: "lucky_sparkles",
            borderGlowColor: "#FFD700",
            borderGlowIntensity: 0.6
        },
        objectives: {
            primary: {
                type: "score",
                target: 2500, // Increased from 1500 for more challenge
                description: "Reach 2500 points"
            },
            secondary: [
                {
                    type: "cascades",
                    target: 3, // Increased from 2 to require more combos
                    description: "Trigger 3 cascade combos",
                    reward: { points: 300, stars: 1 }
                }
            ]
        },
        constraints: {
            moveLimit: 30,
            gemTypes: ["daphne", "jasper", "miles", "ivy"],
            gemTypeCount: 4
        },
        narrative: {
            briefing: "Lucky the Leprechaun appears with a mischievous grin, offering to bless the Shire with good fortune. Match gems to harness the magic!",
            loreReference: "season1/episode1",
            characters: ["Lucky", "Shire Folk"],
            locations: ["The Shire"]
        },
        progression: {
            unlockRequirements: {
                previousLevel: null
            }
        }
    }),

    // Level 2: Prepare for Battle
    createLevel({
        level: 2,
        season: 1,
        episode: 2,
        episodeKey: "season1/episode2",
        title: "Prepare for Battle",
        description: "The Goblin King's forces approach! Prepare Wavelength for the coming conflict by mastering gem combinations.",
        difficulty: "easy",
        theme: {
            primaryColor: "#EF4444",        // Red (battle)
            secondaryColor: "#1F2937",      // Dark gray
            accentColor: "#FBBF24",         // Amber
            backgroundImage: "/static/images/characters/wavelength/PrepareForBattle-14.webp",
            backgroundOpacity: 0.12,
            particleEffect: null,
            borderGlowColor: "#EF4444",
            borderGlowIntensity: 0.5
        },
        objectives: {
            primary: {
                type: "score",
                target: 2000,
                description: "Reach 2000 points"
            },
            secondary: [
                {
                    type: "cascades",
                    target: 3,
                    description: "Trigger 3 cascade combos",
                    reward: { points: 300, stars: 1 }
                }
            ]
        },
        constraints: {
            moveLimit: 28,
            gemTypes: ["daphne", "jasper", "miles", "ivy", "echo"],
            gemTypeCount: 5
        },
        narrative: {
            briefing: "Danger looms! Prepare yourself by demonstrating your gem-matching prowess. Focus and stay alert!",
            loreReference: "season1/episode2",
            characters: ["Wavelength", "Goblin King"],
            locations: ["The Shire", "Goblin Kingdom"]
        },
        progression: {
            unlockRequirements: {
                previousLevel: 1
            }
        }
    }),

    // Level 3: The Battle Begins
    createLevel({
        level: 3,
        season: 1,
        episode: 3,
        episodeKey: "season1/episode3",
        title: "The Battle Begins",
        description: "The conflict has started! Battle the Goblin King's forces with skill and determination.",
        difficulty: "medium",
        theme: {
            primaryColor: "#DC2626",        // Dark Red
            secondaryColor: "#FCD34D",      // Yellow (magic)
            accentColor: "#BFDBFE",         // Light Blue
            backgroundImage: "/static/images/characters/wavelength/TheBattleOfTheShire-050.webp",
            backgroundOpacity: 0.12,
            particleEffect: "battle_sparks",
            borderGlowColor: "#DC2626",
            borderGlowIntensity: 0.7
        },
        objectives: {
            primary: {
                type: "score",
                target: 2500,
                description: "Reach 2500 points"
            },
            secondary: [
                {
                    type: "cascades",
                    target: 3,
                    description: "Trigger 3 cascade combos",
                    reward: { points: 350, stars: 1 }
                },
                {
                    type: "score_without_moves",
                    target: 1500,
                    moveLimit: 15,
                    description: "Score 1500 points in 15 moves",
                    reward: { points: 500, stars: 2 }
                }
            ]
        },
        constraints: {
            moveLimit: 25,
            gemTypes: ["daphne", "jasper", "miles", "ivy", "echo", "atlas"],
            gemTypeCount: 6
        },
        narrative: {
            briefing: "The battle is fierce! Combine your gems wisely to overcome the Goblin King's forces. Every move counts!",
            loreReference: "season1/episode3",
            characters: ["Wavelength", "Goblin King", "Goblins"],
            locations: ["The Shire", "Battle Grounds"]
        },
        progression: {
            unlockRequirements: {
                previousLevel: 2
            }
        }
    }),

    // Level 4-11 would continue similar pattern...
    // Placeholder for remaining Season 1 episodes
    createLevel({
        level: 4,
        season: 1,
        episode: 4,
        episodeKey: "season1/episode4",
        title: "Episode 4",
        description: "Continue your journey through Season 1.",
        difficulty: "medium",
        progression: {
            unlockRequirements: { previousLevel: 3 }
        }
    }),

    createLevel({
        level: 5,
        season: 1,
        episode: 5,
        episodeKey: "season1/episode5",
        title: "Episode 5",
        description: "Continue your journey through Season 1.",
        difficulty: "medium",
        progression: {
            unlockRequirements: { previousLevel: 4 }
        }
    }),

    createLevel({
        level: 6,
        season: 1,
        episode: 6,
        episodeKey: "season1/episode6",
        title: "Episode 6",
        description: "Continue your journey through Season 1.",
        difficulty: "medium",
        progression: {
            unlockRequirements: { previousLevel: 5 }
        }
    }),

    createLevel({
        level: 7,
        season: 1,
        episode: 7,
        episodeKey: "season1/episode7",
        title: "Episode 7",
        description: "Continue your journey through Season 1.",
        difficulty: "medium",
        progression: {
            unlockRequirements: { previousLevel: 6 }
        }
    }),

    createLevel({
        level: 8,
        season: 1,
        episode: 8,
        episodeKey: "season1/episode8",
        title: "Episode 8",
        description: "Continue your journey through Season 1.",
        difficulty: "hard",
        progression: {
            unlockRequirements: { previousLevel: 7 }
        }
    }),

    createLevel({
        level: 9,
        season: 1,
        episode: 9,
        episodeKey: "season1/episode9",
        title: "Episode 9",
        description: "Continue your journey through Season 1.",
        difficulty: "hard",
        progression: {
            unlockRequirements: { previousLevel: 8 }
        }
    }),

    createLevel({
        level: 10,
        season: 1,
        episode: 10,
        episodeKey: "season1/episode10",
        title: "Episode 10",
        description: "Continue your journey through Season 1.",
        difficulty: "hard",
        progression: {
            unlockRequirements: { previousLevel: 9 }
        }
    }),

    createLevel({
        level: 11,
        season: 1,
        episode: 11,
        episodeKey: "season1/episode11",
        title: "Episode 11",
        description: "Continue your journey through Season 1.",
        difficulty: "hard",
        progression: {
            unlockRequirements: { previousLevel: 10 }
        }
    })
];

// ═════════════════════════════════════════════════════════════════════════════
// LEVEL MANAGER FUNCTIONS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Get a level by level number
 * @param {number} levelNumber - Level 1-based index
 * @returns {Object} Level configuration or null
 */
function getLevel(levelNumber) {
    return LEVELS.find(level => level.level === levelNumber) || null;
}

/**
 * Get all levels
 * @returns {Array} All level configurations
 */
function getAllLevels() {
    return LEVELS;
}

/**
 * Get levels for a specific season
 * @param {number} season - Season number (1, 2, 3, etc.)
 * @returns {Array} Levels in the season
 */
function getLevelsBySeason(season) {
    return LEVELS.filter(level => level.season === season);
}

/**
 * Get total number of levels
 * @returns {number} Total level count
 */
function getTotalLevelCount() {
    return LEVELS.length;
}

/**
 * Get next level after specified level
 * @param {number} currentLevel - Current level number
 * @returns {Object|null} Next level or null if at end
 */
function getNextLevel(currentLevel) {
    const nextLevelNum = currentLevel + 1;
    return getLevel(nextLevelNum);
}

/**
 * Check if a level is available based on unlock requirements
 * @param {number} levelNumber - Level to check
 * @param {Object} userProgress - User's progress object { completedLevels: [], bestScores: {} }
 * @returns {boolean} Whether level is unlocked
 */
function isLevelUnlocked(levelNumber, userProgress = {}) {
    const level = getLevel(levelNumber);
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
        LEVELS,
        getLevel,
        getAllLevels,
        getLevelsBySeason,
        getTotalLevelCount,
        getNextLevel,
        isLevelUnlocked,
        createLevel
    };
}
