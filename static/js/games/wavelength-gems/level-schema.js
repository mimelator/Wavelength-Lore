/**
 * Wavelength Gems - Level Schema & Configuration
 *
 * This schema defines the structure for game levels, including:
 * - Episode integration (episode data, lore, descriptions)
 * - Difficulty progression and difficulty modifiers
 * - Visual theming (backgrounds, colors, effects)
 * - Game mechanics (gem types, move limits, objectives)
 * - Progression tracking and unlocking systems
 *
 * Benefits:
 * - Automatically creates new levels when episodes are released
 * - Episode metadata drives level customization
 * - Consistent structure for easy level creation
 * - Flexible difficulty scaling
 * - Rich visual presentation tied to episode themes
 */

// ═════════════════════════════════════════════════════════════════════════════
// LEVEL SCHEMA STRUCTURE
// ═════════════════════════════════════════════════════════════════════════════

/**
 * LEVEL DEFINITION
 *
 * Each level is tied to an episode and includes:
 * - Episode metadata (title, description, story, lore)
 * - Visual theme (background image, colors, particle effects)
 * - Game mechanics (difficulty, gem types, move limits, objectives)
 * - Progression (unlocking requirements, rewards, stats)
 */
const LEVEL_SCHEMA = {
    // ─────────────────────────────────────────────────────────────────────────
    // EPISODE INTEGRATION
    // ─────────────────────────────────────────────────────────────────────────

    episodeKey: "season1/episode1",
    // Firebase path to episode: /videos/season{N}/episodes/episode{N}
    // When levels are created, this is fetched from the episode data API
    // Provides: title, description, story, keywords, youtubeLink, image, carouselImages

    // ─────────────────────────────────────────────────────────────────────────
    // LEVEL METADATA
    // ─────────────────────────────────────────────────────────────────────────

    level: 1,
    // Unique level identifier (1-indexed for player visibility)

    title: "My Lucky Charm",
    // Derived from episode.title, but can be customized
    // Example: "My Lucky Charm - Chapter 1"

    description: "Help Lucky the Leprechaun bring good luck to the Shire Folk! Match gems to spread joy and positivity.",
    // Derived from episode.description or episode.story
    // Can be customized for game context (how the episode story applies to the game objective)

    season: 1,
    episode: 1,
    // Parsed from episodeKey for easy reference

    // ─────────────────────────────────────────────────────────────────────────
    // DIFFICULTY & PROGRESSION
    // ─────────────────────────────────────────────────────────────────────────

    difficulty: "easy",
    // Difficulty level: "tutorial", "easy", "medium", "hard", "expert", "legend"
    // Determines default values for mechanics (moves, target scores, etc.)
    // Can be overridden per-level

    difficultyModifiers: {
        // Multipliers applied to base difficulty values
        // Base values defined in DIFFICULTY_CONFIG below

        moveLimit: 1.0,        // 1.0 = normal, 0.8 = 20% fewer moves, 1.2 = 20% more
        targetScoreMultiplier: 1.0,
        gemTypeCount: 1.0,     // How many unique gem types (affects match difficulty)
        cascadeScoreBonus: 1.0 // Bonus for cascade combos
    },

    // ─────────────────────────────────────────────────────────────────────────
    // GAME MECHANICS
    // ─────────────────────────────────────────────────────────────────────────

    objectives: {
        // Primary objective (required to beat level)
        primary: {
            type: "score",              // "score", "matches", "cascades", "special_gems"
            target: 2000,               // Target value to achieve
            description: "Reach 2000 points"
        },

        // Optional secondary objectives (for bonus rewards/achievements)
        secondary: [
            {
                type: "cascades",
                target: 3,
                description: "Trigger 3 cascade combos",
                reward: { points: 500, stars: 1 }
            },
            {
                type: "score_without_moves",
                target: 1500,
                description: "Score 1500 points without using more than 10 moves",
                moveLimit: 10,
                reward: { points: 250, stars: 1 }
            }
        ]
    },

    constraints: {
        // Hard limits on gameplay
        moveLimit: 25,              // Maximum moves allowed (null = unlimited)
        timeLimit: null,            // Time limit in seconds (null = unlimited)
        cascadeLimit: 10,           // Maximum cascade depth to prevent infinite loops

        // Gem type restrictions
        gemTypes: ["daphne", "jasper", "miles", "ivy"],
        // Only these gem types appear on the board
        // Fewer types = easier to match, more types = harder

        gemTypeCount: 4,            // Total unique gem types on board

        // Board configuration
        boardSize: { rows: 8, cols: 8 },
        // Can vary per level: { rows: 6, cols: 8 }, { rows: 8, cols: 8 }, { rows: 8, cols: 10 }
    },

    // ─────────────────────────────────────────────────────────────────────────
    // VISUAL THEMING
    // ─────────────────────────────────────────────────────────────────────────

    theme: {
        // Color scheme derived from episode imagery
        primaryColor: "#FFD700",        // Gold (from Lucky the Leprechaun theme)
        secondaryColor: "#10B981",      // Green (Irish theme)
        accentColor: "#FF6B6B",         // Red (for critical elements)

        // Background and visual assets
        backgroundImage: "/static/images/characters/wavelength/MyLuckyCharm-02.webp",
        // Primary episode image (from episode.image)
        // Used as background or visual reference

        backgroundOpacity: 0.15,        // How transparent the background is (0-1)
        // Subtle background so it doesn't interfere with gameplay

        carouselImages: [
            "/static/images/characters/wavelength/MyLuckyCharm-01.webp",
            "/static/images/characters/wavelength/MyLuckyCharm-02.webp",
            "/static/images/characters/wavelength/MyLuckyCharm-03.webp"
        ],
        // From episode.carouselImages - used for level preview/gallery

        // Particle effects and visual enhancements
        particleEffect: "lucky_sparkles",
        // "lucky_sparkles" - golden sparkles for lucky charm theme
        // "forest_mist" - misty particles for forest scenes
        // "ice_crystals" - crystalline particles for ice themes
        // null - no special particles

        gemColorOverrides: {
            // Optional color adjustments for gem types specific to this level/episode
            daphne: "#8B5CF6",          // Purple (default)
            jasper: "#EF4444",          // Red (default)
            miles: "#3B82F6",           // Blue (default)
            ivy: "#10B981"              // Green (themed)
        },

        borderGlowColor: "#FFD700",     // Glow around board (themed color)
        borderGlowIntensity: 0.5        // 0-1, how bright the glow is
    },

    // ─────────────────────────────────────────────────────────────────────────
    // PROGRESSION & UNLOCKING
    // ─────────────────────────────────────────────────────────────────────────

    progression: {
        // How this level unlocks
        unlockRequirements: {
            previousLevel: null,        // Must complete level 0 first (null = always available)
            minimumScore: null,         // Minimum score from previous level
            playtime: null              // Minimum playtime requirement (seconds)
        },

        // Rewards for completing this level
        rewards: {
            points: 500,                // Base reward points
            coins: 25,                  // In-game currency (if implemented)
            experience: 100,            // XP towards level progression
            stars: 1                    // Star rating (1-3 based on score)
        },

        // Tracking metrics
        recordStats: true,              // Record to user progress & leaderboard
        trackingFields: [
            "score",
            "moves_used",
            "combo_streak",
            "time_taken",
            "cascades_triggered"
        ]
    },

    // ─────────────────────────────────────────────────────────────────────────
    // LORE & NARRATIVE
    // ─────────────────────────────────────────────────────────────────────────

    narrative: {
        // Story context for this level
        briefing: "Lucky the Leprechaun has blessed the Shire with a magical stone. Match gems to harness its power and spread luck throughout the land!",
        // Displayed before level starts

        storySegments: [
            {
                trigger: "level_start",
                type: "text",
                content: "Lucky appears with a mischievous grin..."
            },
            {
                trigger: "first_cascade",
                type: "message",
                content: "The magic is working! Keep the momentum going!"
            },
            {
                trigger: "level_complete",
                type: "text",
                content: "The Shire Folk rejoice as luck returns to their lands. Lucky winks and disappears..."
            }
        ],

        // Extract from episode.story or episode.description
        loreReference: "season1/episode1",
        // Link to the full episode story for context

        characters: ["Lucky", "Wavelength", "Shire Folk"],
        // Characters involved in this level's story

        locations: ["The Shire", "Shire Sanctuary"]
        // Locations referenced in level
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SPECIAL RULES & MECHANICS (FUTURE)
    // ─────────────────────────────────────────────────────────────────────────

    specialRules: [
        // Special game mechanics unique to this level
        // {
        //     name: "cascade_bonus",
        //     description: "Each cascade grants +10% score multiplier (stacks)",
        //     implementation: "multiply_match_score_by_1_1_per_cascade"
        // },
        // {
        //     name: "frozen_gems",
        //     description: "Some gems start frozen and require 2 matches to activate",
        //     implementation: "special_gem_state"
        // }
    ],

    // ─────────────────────────────────────────────────────────────────────────
    // METADATA & ADMIN
    // ─────────────────────────────────────────────────────────────────────────

    metadata: {
        createdDate: "2024-10-01",
        lastModified: "2024-10-22",
        author: "Game Design Team",
        version: "1.0",
        status: "active"  // "active", "beta", "archived"
    }
};

// ═════════════════════════════════════════════════════════════════════════════
// DIFFICULTY CONFIGURATION
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Base values for each difficulty level
 * Levels can override these with difficultyModifiers
 */
const DIFFICULTY_CONFIG = {
    tutorial: {
        moveLimit: 50,
        targetScore: 500,
        gemTypeCount: 3,
        cascadeScoreBonus: 1.0,
        description: "Learn the basics - unlimited gems and generous move allowance"
    },
    easy: {
        moveLimit: 30,
        targetScore: 1500,
        gemTypeCount: 4,
        cascadeScoreBonus: 1.2,
        description: "Perfect for new players - plenty of moves to achieve the goal"
    },
    medium: {
        moveLimit: 25,
        targetScore: 2500,
        gemTypeCount: 5,
        cascadeScoreBonus: 1.5,
        description: "Balanced challenge - strategic play required"
    },
    hard: {
        moveLimit: 20,
        targetScore: 4000,
        gemTypeCount: 6,
        cascadeScoreBonus: 2.0,
        description: "Challenging - requires careful planning and luck"
    },
    expert: {
        moveLimit: 15,
        targetScore: 5500,
        gemTypeCount: 6,
        cascadeScoreBonus: 2.5,
        description: "For skilled players - limited moves, high score requirement"
    },
    legend: {
        moveLimit: 10,
        targetScore: 7500,
        gemTypeCount: 6,
        cascadeScoreBonus: 3.0,
        description: "Ultimate challenge - master the game to succeed"
    }
};

// ═════════════════════════════════════════════════════════════════════════════
// LEVEL GENERATION SYSTEM
// ═════════════════════════════════════════════════════════════════════════════

/**
 * AUTOMATIC LEVEL GENERATION FROM EPISODES
 *
 * When a new episode is released on the site:
 * 1. Episode data is created in Firebase at /videos/season{N}/episodes/episode{N}
 * 2. Game system fetches episode metadata
 * 3. Level is automatically generated using:
 *    - Episode title & description
 *    - Episode images (background, carousel)
 *    - Episode keywords (to determine theme/difficulty)
 *    - Season number (to determine game progression)
 *
 * Example generation logic:
 * ```javascript
 * async function generateLevelFromEpisode(episode) {
 *     const seasonNum = parseInt(episode.season.replace('season', ''));
 *     const episodeNum = parseInt(episode.episode.replace('episode', ''));
 *     const levelNum = (seasonNum - 1) * 11 + episodeNum; // 11 episodes per season
 *
 *     // Determine difficulty based on progression
 *     const difficulty = getDifficultyForLevel(levelNum);
 *
 *     return {
 *         level: levelNum,
 *         episodeKey: `${episode.season}/${episode.episode}`,
 *         title: episode.title,
 *         description: episode.description,
 *         difficulty,
 *         theme: {
 *             backgroundImage: episode.image,
 *             carouselImages: episode.carouselImages,
 *             primaryColor: extractDominantColor(episode.image),
 *             // ... other theme properties
 *         },
 *         objectives: generateObjectivesForDifficulty(difficulty),
 *         narrative: {
 *             briefing: episode.description,
 *             loreReference: `${episode.season}/${episode.episode}`,
 *             // ... other narrative properties
 *         },
 *         // ... other properties
 *     };
 * }
 * ```
 */

// ═════════════════════════════════════════════════════════════════════════════
// PROGRESSION SYSTEM
// ═════════════════════════════════════════════════════════════════════════════

/**
 * LEVEL PROGRESSION STRUCTURE
 *
 * The game maintains progression data for each user:
 *
 * Firebase Path: /forum/users/{userId}/games/wavelength-gems/levels/{levelId}
 *
 * ```javascript
 * {
 *     levelId: 1,
 *     status: "completed",     // "locked", "unlocked", "in_progress", "completed"
 *     attempts: 5,
 *     bestScore: 3250,
 *     bestStars: 2,
 *     secondaryObjectives: {
 *         "cascades": { completed: true, reward_claimed: true },
 *         "score_without_moves": { completed: false }
 *     },
 *     firstCompletedDate: "2024-10-20T10:30:00Z",
 *     lastAttemptDate: "2024-10-22T15:45:00Z"
 * }
 * ```
 */

// ═════════════════════════════════════════════════════════════════════════════
// VISUAL THEMING GUIDELINES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * EPISODE-THEMED VISUAL ELEMENTS
 *
 * Each level can have a unique visual appearance based on its episode:
 *
 * 1. BACKGROUND IMAGE
 *    - From episode.image (hero image)
 *    - Blurred and made semi-transparent as game background
 *    - Example: MyLuckyCharm-themed background with green tones
 *
 * 2. COLOR SCHEME
 *    - Primary color: Extracted from episode image or manually defined
 *    - Secondary color: Complementary theme color
 *    - Used for board border glow, UI elements, highlights
 *
 * 3. PARTICLE EFFECTS
 *    - "lucky_sparkles": Golden sparkles for lucky charm episodes
 *    - "forest_mist": Misty particles for nature/forest episodes
 *    - "ice_crystals": Crystalline effects for ice/frozen episodes
 *    - Custom effects per episode theme
 *
 * 4. CAROUSEL GALLERY
 *    - Display episode.carouselImages in level select screen
 *    - Show player a visual preview of the episode's artistic style
 *
 * 5. LORE DISPLAY
 *    - Show episode.description or episode.story in level briefing
 *    - Create narrative context for the player
 *    - Link to full episode for deep dive into lore
 *
 * Example: "My Lucky Charm" Level
 * ├── Background: MyLuckyCharm hero image (faded)
 * ├── Border Glow: Gold (#FFD700) - leprechaun/luck theme
 * ├── Primary Color: Gold (lucky theme)
 * ├── Secondary Color: Green (Irish theme)
 * ├── Particles: Lucky sparkles animation
 * ├── Briefing: "Lucky the Leprechaun has blessed..."
 * └── Carousel: 3-4 episode images showing the story
 */

// ═════════════════════════════════════════════════════════════════════════════
// IMPLEMENTATION ROADMAP
// ═════════════════════════════════════════════════════════════════════════════

/**
 * PHASE 1: LEVEL SCHEMA & BASIC LOADING
 * ├── Define level configuration structure (THIS FILE)
 * ├── Create level data for Season 1 episodes (hardcoded initially)
 * ├── Implement level loader in game engine
 * ├── Update gameState to track current level
 * └── Basic level selection UI
 *
 * PHASE 2: VISUAL THEMING
 * ├── Load and apply background images
 * ├── Implement color scheme from theme config
 * ├── Add particle effects system
 * ├── Update UI to show level briefing/lore
 * └── Create level preview with carousel images
 *
 * PHASE 3: PROGRESSION SYSTEM
 * ├── Track level completion status
 * ├── Implement unlocking requirements
 * ├── Add objective tracking and validation
 * ├── Store user progress in Firebase
 * └── Display progress on level select screen
 *
 * PHASE 4: EPISODE INTEGRATION
 * ├── Fetch episode data from Firebase API
 * ├── Auto-generate levels from new episodes
 * ├── Create level list from all released episodes
 * ├── Implement difficulty scaling based on episode order
 * └── Update level select with full progression path
 *
 * PHASE 5: ADVANCED FEATURES
 * ├── Secondary objectives and achievements
 * ├── Special rules system (if implementing advanced mechanics)
 * ├── Daily/weekly challenges
 * ├── Leaderboards per level
 * └── Replay system with best run tracking
 */

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LEVEL_SCHEMA, DIFFICULTY_CONFIG };
}
