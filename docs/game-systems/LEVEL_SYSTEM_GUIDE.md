# Wavelength Gems - Level System Guide

## Overview

The Level System provides a comprehensive framework for creating game levels that are automatically integrated with the Wavelength Lore episode system. Each level is tied to an episode, inheriting its metadata, images, and story context.

## Key Features

### 1. **Episode Integration**
- Levels automatically pull data from episodes in the Wavelength Lore system
- Episode titles, descriptions, images, and lore are used directly in levels
- When new episodes are released, new levels can be automatically created
- Maintains consistency between the lore narrative and game progression

### 2. **Difficulty Progression**
- 6 difficulty levels: Tutorial, Easy, Medium, Hard, Expert, Legend
- Each difficulty has predefined base values:
  - Move limits (50 down to 10)
  - Target scores (500 up to 7500)
  - Gem type counts (3 up to 6)
  - Cascade score bonuses (1.0x to 3.0x)

### 3. **Visual Theming**
- Each level has a unique visual appearance based on its episode
- Background images from episode artwork
- Color schemes extracted from episode imagery
- Custom particle effects for thematic elements
- Carousel gallery of episode images for preview

### 4. **Progression & Unlocking**
- Levels must be played sequentially
- Unlock requirements based on completing previous levels
- Optional minimum score requirements
- Rewards system (points, coins, experience, stars)

### 5. **Objectives System**
- Primary objectives (required to beat level)
- Secondary objectives (for bonus rewards/achievements)
- Objective types: score, matches, cascades, special mechanics

## File Structure

```
static/js/games/wavelength-gems/
├── level-schema.js          # Schema definition and documentation
├── levels.js                # Actual level configurations
├── engine.js                # Game engine (updated with level support)
├── ui.js                    # UI components (updated with level display)
└── validator.js             # Game logic validation
```

## Level Schema Structure

### Basic Level Definition

```javascript
{
    // Identity
    level: 1,
    season: 1,
    episode: 1,
    episodeKey: "season1/episode1",

    // Presentation
    title: "My Lucky Charm",
    description: "Help Lucky the Leprechaun spread good fortune...",

    // Difficulty
    difficulty: "easy",
    difficultyModifiers: {
        moveLimit: 1.0,
        targetScoreMultiplier: 1.0,
        gemTypeCount: 1.0,
        cascadeScoreBonus: 1.0
    },

    // Game Mechanics
    objectives: {
        primary: {
            type: "score",
            target: 1500,
            description: "Reach 1500 points"
        },
        secondary: [
            {
                type: "cascades",
                target: 2,
                description: "Trigger 2 cascade combos",
                reward: { points: 250, stars: 1 }
            }
        ]
    },

    constraints: {
        moveLimit: 30,
        timeLimit: null,
        cascadeLimit: 10,
        gemTypes: ["daphne", "jasper", "miles", "ivy"],
        gemTypeCount: 4,
        boardSize: { rows: 8, cols: 8 }
    },

    // Visual Theme
    theme: {
        primaryColor: "#FFD700",
        secondaryColor: "#10B981",
        accentColor: "#FF6B6B",
        backgroundImage: "/static/images/characters/wavelength/MyLuckyCharm-02.webp",
        backgroundOpacity: 0.15,
        carouselImages: [...],
        particleEffect: "lucky_sparkles",
        borderGlowColor: "#FFD700",
        borderGlowIntensity: 0.6
    },

    // Story & Lore
    narrative: {
        briefing: "Lucky the Leprechaun appears with a mischievous grin...",
        loreReference: "season1/episode1",
        characters: ["Lucky", "Shire Folk"],
        locations: ["The Shire"]
    },

    // Progression
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
        }
    }
}
```

## Difficulty Configuration

### Predefined Difficulty Levels

```javascript
const DIFFICULTY_CONFIG = {
    tutorial: {
        moveLimit: 50,
        targetScore: 500,
        gemTypeCount: 3,
        cascadeScoreBonus: 1.0
    },
    easy: {
        moveLimit: 30,
        targetScore: 1500,
        gemTypeCount: 4,
        cascadeScoreBonus: 1.2
    },
    medium: {
        moveLimit: 25,
        targetScore: 2500,
        gemTypeCount: 5,
        cascadeScoreBonus: 1.5
    },
    hard: {
        moveLimit: 20,
        targetScore: 4000,
        gemTypeCount: 6,
        cascadeScoreBonus: 2.0
    },
    expert: {
        moveLimit: 15,
        targetScore: 5500,
        gemTypeCount: 6,
        cascadeScoreBonus: 2.5
    },
    legend: {
        moveLimit: 10,
        targetScore: 7500,
        gemTypeCount: 6,
        cascadeScoreBonus: 3.0
    }
};
```

### Difficulty Modifiers

Levels can modify base difficulty values using multipliers:

```javascript
difficultyModifiers: {
    moveLimit: 1.0,                // 1.0 = normal, 0.8 = 20% fewer, 1.2 = 20% more
    targetScoreMultiplier: 1.0,    // Multiplies target score
    gemTypeCount: 1.0,             // Multiplies gem type count
    cascadeScoreBonus: 1.0         // Multiplies cascade bonus
}
```

## Using the Level System

### Loading a Level

```javascript
// In game initialization
function initGameWithLevel(levelNumber) {
    const level = getLevel(levelNumber);

    if (!level) {
        console.error(`Level ${levelNumber} not found`);
        return;
    }

    // Initialize game state with level config
    gameState.level = levelNumber;
    gameState.moves = level.constraints.moveLimit;
    gameState.targetScore = level.objectives.primary.target;
    gameState.gemTypes = level.constraints.gemTypes;

    // Apply theme
    applyLevelTheme(level.theme);

    // Show briefing
    showLevelBriefing(level.narrative.briefing);

    // Generate board with correct gem types
    generateBoard(level.constraints.gemTypes);

    // Start game
    renderBoard();
}
```

### Checking Level Unlock Status

```javascript
// Check if player can play a level
const userProgress = {
    completedLevels: [1, 2, 3],
    bestScores: {
        1: 2500,
        2: 3000,
        3: 2200
    }
};

if (isLevelUnlocked(4, userProgress)) {
    console.log("Level 4 is available!");
} else {
    console.log("Complete Level 3 to unlock Level 4");
}
```

### Getting Level Information

```javascript
// Get specific level
const level1 = getLevel(1);
console.log(level1.title); // "My Lucky Charm"

// Get all levels
const allLevels = getAllLevels();
console.log(allLevels.length); // Total levels

// Get levels by season
const season1Levels = getLevelsBySeason(1);
console.log(season1Levels.length); // 11 levels

// Get next level
const nextLevel = getNextLevel(3);
console.log(nextLevel.level); // 4
```

## Visual Theming System

### Background Images

Each level displays a background image from its episode:

```javascript
theme: {
    backgroundImage: "/static/images/characters/wavelength/MyLuckyCharm-02.webp",
    backgroundOpacity: 0.15  // Subtle, doesn't interfere with gameplay
}
```

### Color Schemes

Colors are used throughout the UI based on level theme:

```javascript
theme: {
    primaryColor: "#FFD700",    // Used for borders, glow, highlights
    secondaryColor: "#10B981",  // Used for accents, secondary elements
    accentColor: "#FF6B6B",     // Used for critical/warning elements
    borderGlowColor: "#FFD700", // Board border glow
    borderGlowIntensity: 0.6    // How bright the glow is
}
```

### Particle Effects

Thematic particle effects create atmosphere:

```javascript
theme: {
    particleEffect: "lucky_sparkles"  // Golden sparkles for luck theme
    // Options: "lucky_sparkles", "forest_mist", "ice_crystals", null
}
```

### Carousel Gallery

Episode images are displayed in level preview:

```javascript
theme: {
    carouselImages: [
        "/static/images/characters/wavelength/MyLuckyCharm-01.webp",
        "/static/images/characters/wavelength/MyLuckyCharm-02.webp",
        "/static/images/characters/wavelength/MyLuckyCharm-03.webp"
    ]
}
```

## Narrative System

### Level Briefing

Players see a briefing before the level starts:

```javascript
narrative: {
    briefing: "Lucky the Leprechaun has blessed the Shire with a magical stone. Match gems to harness its power and spread luck throughout the land!"
}
```

### Story Segments

Optional story moments trigger during gameplay:

```javascript
narrative: {
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
            content: "The Shire Folk rejoice as luck returns..."
        }
    ]
}
```

### Lore References

Levels link to their corresponding episodes for context:

```javascript
narrative: {
    loreReference: "season1/episode1",
    characters: ["Lucky", "Wavelength", "Shire Folk"],
    locations: ["The Shire", "Shire Sanctuary"]
}
```

## Progression Tracking

### User Level Progress

User progress is stored in Firebase:

```
/forum/users/{userId}/games/wavelength-gems/levels/{levelId}
{
    levelId: 1,
    status: "completed",              // locked, unlocked, in_progress, completed
    attempts: 5,
    bestScore: 3250,
    bestStars: 2,                      // 1-3 stars based on score
    secondaryObjectives: {
        "cascades": { completed: true, reward_claimed: true },
        "score_without_moves": { completed: false }
    },
    firstCompletedDate: "2024-10-20T10:30:00Z",
    lastAttemptDate: "2024-10-22T15:45:00Z"
}
```

### Level Completion

When a player completes a level:

1. Primary objective is checked (score target met)
2. Secondary objectives are evaluated
3. Stars are awarded (1-3 based on performance)
4. Rewards are granted (points, coins, XP)
5. Progress is recorded in Firebase
6. Next level is unlocked (if applicable)

## Automatic Level Generation from Episodes

When a new episode is released on the site, a level can be automatically generated:

```javascript
async function generateLevelFromEpisode(episode) {
    const seasonNum = parseInt(episode.season.replace('season', ''));
    const episodeNum = parseInt(episode.episode.replace('episode', ''));

    // Calculate level number (11 episodes per season)
    const levelNum = (seasonNum - 1) * 11 + episodeNum;

    // Determine difficulty based on progression
    const difficulty = getDifficultyForLevel(levelNum);

    // Create level configuration
    return createLevel({
        level: levelNum,
        season: seasonNum,
        episode: episodeNum,
        episodeKey: `${episode.season}/${episode.episode}`,
        title: episode.title,
        description: episode.description,
        difficulty: difficulty,
        theme: {
            backgroundImage: episode.image,
            carouselImages: episode.carouselImages,
            primaryColor: extractDominantColor(episode.image),
            // ... other properties from episode
        },
        narrative: {
            briefing: episode.description,
            loreReference: `${episode.season}/${episode.episode}`,
            characters: extractCharactersFromKeywords(episode.keywords),
            locations: extractLocationsFromKeywords(episode.keywords)
        }
    });
}
```

## Best Practices

### 1. **Level Design**
- Start with tutorial difficulty for early levels
- Gradually increase difficulty across levels
- Introduce gem type variations to increase complexity
- Balance move limits with target scores

### 2. **Visual Consistency**
- Use colors that complement the episode theme
- Keep background opacity low (0.12-0.15) so gameplay is visible
- Choose particle effects that match the narrative
- Use carousel images to preview episode content

### 3. **Narrative Integration**
- Write briefings that connect to the episode story
- Use character names from the episode
- Reference locations from the episode lore
- Create story-based objective descriptions

### 4. **Progression Design**
- Make first level easy (tutorial difficulty)
- Increase difficulty gradually (easy → medium → hard)
- Vary difficulty across a season
- Use secondary objectives for replay value

### 5. **Reward Balance**
- Give appropriate rewards for difficulty level
- Consider completion time when awarding rewards
- Make secondary objectives worth pursuing
- Track best performance for leaderboards

## Implementation Checklist

### Phase 1: Core System ✓
- [x] Level schema definition
- [x] Level configuration files
- [x] Level manager functions
- [ ] Level loading in game engine

### Phase 2: Visual Theming
- [ ] Background image rendering
- [ ] Color scheme application
- [ ] Particle effect system
- [ ] Carousel gallery UI

### Phase 3: Progression System
- [ ] Level completion tracking
- [ ] Unlock requirement checking
- [ ] Reward distribution
- [ ] Firebase progress storage

### Phase 4: UI Integration
- [ ] Level selection screen
- [ ] Level briefing modal
- [ ] Progress display
- [ ] Objective tracking UI

### Phase 5: Episode Integration
- [ ] Fetch episode data from API
- [ ] Auto-generate levels from episodes
- [ ] Dynamic level list creation
- [ ] Character/location extraction

## API Integration

### Fetching Episode Data

```javascript
async function fetchEpisodeData(episodeKey) {
    // episodeKey format: "season1/episode1"
    const response = await fetch(`/api/episodes?key=${episodeKey}`);
    return response.json();
}
```

### Submitting Level Completion

```javascript
async function submitLevelCompletion(levelData) {
    const response = await fetch('/api/games/scores/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            gameId: 'wavelength-gems',
            levelId: levelData.level,
            score: gameState.score,
            objectives: levelData.objectives,
            timestamp: new Date().toISOString()
        })
    });
    return response.json();
}
```

## Troubleshooting

### Level Not Appearing
- Check that level is in LEVELS array
- Verify episodeKey format: "seasonX/episodeY"
- Ensure level number is unique

### Unlock Requirements Not Working
- Verify previousLevel value matches actual previous level
- Check user progress is being tracked correctly
- Check Firebase data structure

### Theme Not Applying
- Verify backgroundImage path is correct
- Check color codes are valid hex values
- Ensure opacity is between 0 and 1

### Episode Data Not Loading
- Verify API endpoint is accessible
- Check episode exists in Firebase
- Confirm user has permission to access episode

## Future Enhancements

1. **Advanced Mechanics**
   - Frozen gems that require multiple matches
   - Bomb gems with area-of-effect effects
   - Chain reactions with special rules
   - Power-up system

2. **Challenge Modes**
   - Daily challenges with rotating objectives
   - Weekly leaderboard competitions
   - Endless mode (no move limit)
   - Time attack mode

3. **Social Features**
   - Leaderboards per level
   - Friend comparisons
   - Replay sharing
   - Cooperative levels

4. **Analytics**
   - Track most difficult levels
   - Monitor success rates
   - Identify balance issues
   - Player engagement metrics

## Support & Resources

- **Schema Reference**: See `level-schema.js`
- **Example Levels**: See `levels.js` levels 1-3
- **Game Engine**: See `engine.js` for implementation
- **API Reference**: See `/routes/gameApi.js`

---

**Version**: 1.0
**Last Updated**: October 22, 2024
**Maintained By**: Game Design Team
