# Wavelength Gems - Level System Quick Reference

## What Was Built

A comprehensive level system that integrates game progression with the Wavelength Lore episode series. Each game level is tied to an episode, inheriting its metadata, artwork, and narrative context.

## Files

### 1. **level-schema.js** - Schema Definition
Complete documentation of the level structure, including:
- Level metadata and episode integration
- Difficulty configuration (6 difficulty levels)
- Game mechanics (objectives, constraints, gem types)
- Visual theming (colors, backgrounds, particles)
- Narrative system (briefings, lore references, story segments)
- Progression tracking structure

**Lines**: 350+ lines with detailed comments and examples

### 2. **levels.js** - Level Data & Functions
Actual level configurations and helper functions:
- **Levels 1-3**: Fully detailed with theme colors and objectives
  - Level 1: "My Lucky Charm" (Easy, Gold+Green theme)
  - Level 2: "Prepare for Battle" (Easy, Red theme)
  - Level 3: "The Battle Begins" (Medium, Dark Red theme)
- **Levels 4-11**: Placeholder structure for customization
- **Helper Functions**:
  - `getLevel(levelNumber)` - Get a single level
  - `getAllLevels()` - Get all levels
  - `getLevelsBySeason(season)` - Get levels by season
  - `getTotalLevelCount()` - Total level count
  - `getNextLevel(currentLevel)` - Get next level
  - `isLevelUnlocked(levelNumber, userProgress)` - Check unlock status

**Lines**: 230+ lines with 11 example levels

### 3. **engine.js** - Integration
Updated game engine to support levels:
- **New Fields in gameState**:
  - `levelConfig` - Current level configuration
  - `targetScore` - Primary objective target
  - `gemTypes` - Gem types available in this level

- **New Functions**:
  - `loadLevel(levelNumber)` - Load a level configuration
  - Updated `initGame(levelNumber = 1)` - Accept level parameter

- **Modified Functions**:
  - `getRandomGemType()` - Uses level-specific gem types

### 4. **LEVEL_SYSTEM_GUIDE.md** - Complete Documentation
Comprehensive guide covering:
- Overview of all features
- File structure and organization
- Level schema structure with examples
- Difficulty configuration reference
- Usage examples and API calls
- Visual theming guidelines
- Narrative system usage
- Progression tracking details
- Auto-generation from episodes
- Best practices for level design
- Implementation checklist (Phases 1-5)
- Troubleshooting guide

**Lines**: 450+ lines of comprehensive documentation

## Quick Start

### Loading a Level in the Game

```javascript
// In your HTML, include the level files BEFORE engine.js:
<script src="/static/js/games/wavelength-gems/levels.js"></script>
<script src="/static/js/games/wavelength-gems/engine.js"></script>

// Initialize game with a specific level
initGame(1);  // Start with Level 1
initGame(3);  // Start with Level 3

// Change levels during gameplay
loadLevel(2);  // Switch to Level 2 configuration
```

### Accessing Level Information

```javascript
// Get a specific level
const level1 = getLevel(1);
console.log(level1.title);           // "My Lucky Charm"
console.log(level1.difficulty);      // "easy"
console.log(level1.constraints.moveLimit);  // 30

// Get level theme
const theme = level1.theme;
console.log(theme.primaryColor);     // "#FFD700" (gold)
console.log(theme.backgroundImage);  // "/static/images/..."

// Get objectives
const objective = level1.objectives.primary;
console.log(objective.target);       // 1500 (score to reach)
```

### Checking Level Progress

```javascript
// Simulated user progress
const userProgress = {
    completedLevels: [1, 2],
    bestScores: {
        1: 2500,
        2: 3000
    }
};

// Check if Level 3 is unlocked
if (isLevelUnlocked(3, userProgress)) {
    console.log("Level 3 is available!");
} else {
    console.log("Complete Level 2 first");
}
```

## Level Structure Overview

Each level includes:

| Property | Purpose | Example |
|----------|---------|---------|
| `level` | Level number | 1 |
| `episodeKey` | Episode reference | "season1/episode1" |
| `title` | Display name | "My Lucky Charm" |
| `difficulty` | Challenge level | "easy" |
| `objectives.primary.target` | Goal score | 1500 |
| `constraints.moveLimit` | Max moves allowed | 30 |
| `constraints.gemTypes` | Available gems | ["daphne", "jasper", "miles", "ivy"] |
| `theme.primaryColor` | Primary theme color | "#FFD700" |
| `theme.backgroundImage` | Visual background | "/static/images/..." |
| `narrative.briefing` | Story intro | "Lucky the Leprechaun..." |

## Difficulty Levels

```javascript
tutorial    // 50 moves, 500 pts, 3 gems   (learning)
easy        // 30 moves, 1500 pts, 4 gems (starting)
medium      // 25 moves, 2500 pts, 5 gems (mid-game)
hard        // 20 moves, 4000 pts, 6 gems (challenging)
expert      // 15 moves, 5500 pts, 6 gems (skilled)
legend      // 10 moves, 7500 pts, 6 gems (master)
```

## How Episode Integration Works

1. **Episode Data**
   - Stored in Firebase at `/videos/season{N}/episodes/episode{N}`
   - Contains: title, description, image, carouselImages, story, keywords

2. **Level Creation**
   - Level references episode via `episodeKey: "season1/episode1"`
   - Inherits episode title, description, and story
   - Uses episode images for background and carousel

3. **Automatic Generation** (Future)
   - When new episode released → new level auto-created
   - Formula: Level = (Season - 1) × 11 + Episode number
   - Example: Season 2, Episode 3 = (2-1) × 11 + 3 = Level 14

## Key Design Principles

### 1. **Episode-Driven**
Levels are tightly integrated with the Wavelength Lore narrative. Each level is tied to an episode, ensuring gameplay context matches the story.

### 2. **Progressive Difficulty**
Difficulty increases gradually across seasons:
- Season 1: Easy → Medium (Levels 1-11)
- Season 2: Medium → Hard (Levels 12-18)
- Season 3: Hard → Expert (Levels 19-20)
- Season 4: Expert → Legend (Levels 21-28)

### 3. **Visual Theming**
Each level has a unique appearance based on its episode:
- Background image from episode artwork
- Color scheme matching episode theme
- Particle effects for narrative atmosphere
- Carousel gallery for visual preview

### 4. **Flexible Objectives**
- Primary objective: Required to complete level
- Secondary objectives: Optional for bonus rewards
- Encourages multiple playthroughs and mastery

### 5. **Player Progression**
- Linear progression (must complete previous levels)
- Track best scores and completion metrics
- Unlock rewards as players progress
- Store progress in Firebase for persistence

## Next Steps

### Phase 2: Visual Theming (Ready to Implement)
- Load and apply background images to game board
- Apply color schemes from level theme
- Implement particle effect system
- Create level briefing modal/display

### Phase 3: Progression System (Ready to Implement)
- Track level completion in Firebase
- Implement unlock requirement checking
- Calculate and distribute rewards
- Display progress to player

### Phase 4: UI Components (Ready to Implement)
- Level selection screen with all levels
- Level preview with carousel images
- Progress tracking (stars, completion %)
- Objective display during gameplay

### Phase 5: Episode Integration (Ready to Implement)
- Fetch episode data from /api/episodes
- Auto-generate levels from episodes
- Create dynamic level list
- Extract characters/locations from keywords

## Testing the System

```javascript
// Test 1: Load level and check configuration
loadLevel(1);
console.assert(gameState.level === 1);
console.assert(gameState.moves === 30);
console.assert(gameState.targetScore === 1500);
console.assert(gameState.gemTypes.length === 4);

// Test 2: Check gem type filtering
const gems = new Set();
for (let i = 0; i < 100; i++) {
    gems.add(getRandomGemType());
}
console.assert(gems.size <= 4, "Should only have 4 gem types");

// Test 3: Check level unlocking
const progress = { completedLevels: [1, 2] };
console.assert(isLevelUnlocked(3, progress) === true);
console.assert(isLevelUnlocked(4, progress) === false);

// Test 4: Navigation
console.assert(getNextLevel(1).level === 2);
console.assert(getNextLevel(11).season === 1);
console.assert(getLevelsBySeason(1).length === 11);
```

## Files Structure

```
static/js/games/wavelength-gems/
├── level-schema.js          # Schema definition & docs (NEW)
├── levels.js                # Level configurations (NEW)
├── engine.js                # Game engine (UPDATED)
├── ui.js                    # UI components (TO UPDATE)
└── validator.js             # Game logic

Root/
├── LEVEL_SYSTEM_GUIDE.md    # Complete guide (NEW)
└── LEVEL_SYSTEM_README.md   # This file (NEW)
```

## References

- **Complete Guide**: See `LEVEL_SYSTEM_GUIDE.md` for detailed documentation
- **Schema Details**: See `level-schema.js` for full schema structure
- **Examples**: See `levels.js` for sample level definitions (Levels 1-3)
- **Integration**: See `engine.js` for how levels are loaded into the game

## Support

For questions about the level system:
1. Check `LEVEL_SYSTEM_GUIDE.md` for comprehensive documentation
2. Review example levels in `levels.js` (Levels 1-3)
3. Check the schema in `level-schema.js` for structure references
4. Test using the examples in this README

---

**Version**: 1.0
**Date Created**: October 22, 2024
**Status**: Ready for Phase 2 (Visual Theming Implementation)
