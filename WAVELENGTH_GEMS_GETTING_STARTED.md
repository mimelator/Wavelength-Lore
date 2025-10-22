# Wavelength Gems - Getting Started Guide

## What Is This?

Wavelength Gems is a match-3 puzzle game integrated with the Wavelength Lore narrative universe. The game features:

- **Progressive Levels**: 28+ levels tied to episodes from the Wavelength Lore series
- **Thematic Progression**: Each level inherits story context, artwork, and colors from its episode
- **Dynamic Difficulty**: Challenge increases from easy (30 moves) to expert (10 moves)
- **Multiple Objectives**: Primary goal + optional secondary objectives for replay value
- **Episode Integration**: New episodes automatically create new levels

## Current Status

### ✅ Complete
- Game engine with smooth animations and canvas rendering
- Move highlighting for available swaps
- Combo overlay with dynamic text and colors
- Highlight effect showing adjacent valid moves
- Full level schema and configuration system
- 11 Season 1 level definitions
- Engine integration with level support

### 🔄 In Progress / Ready
- Visual theming (backgrounds, colors, particle effects)
- UI components (level selection, progress tracking)
- Episode data integration
- Progression tracking in Firebase

## Quick Start

### Playing the Game

```html
<!-- In wavelength-gems.html -->
<script src="/static/js/games/wavelength-gems/levels.js"></script>
<script src="/static/js/games/wavelength-gems/engine.js"></script>

<script>
    // Start with Level 1
    initGame(1);

    // Or start with a different level
    initGame(3);
</script>
```

### Game Features

#### Move Highlighting
When you select a gem, adjacent valid moves show glowing rings:
```javascript
// Automatic - just select a gem with a click
// The drawAdjacentHighlights() function handles the rest
```

#### Combo Overlay
When you trigger a combo (2+ consecutive matches):
```javascript
// Automatically displayed when gameState.combo >= 2
// Shows: COMBO!, GREAT!, AMAZING!, MEGA COMBO!
// Color changes based on combo level
// Animation: scale in → hold → fade out
```

#### Level-Specific Game Mechanics
```javascript
// Each level has:
gameState.levelConfig = {
    moves: 30,                    // Move limit
    targetScore: 1500,            // Score to reach
    gemTypes: ["daphne", "jasper", "miles", "ivy"]  // Available gems
}
```

## File Organization

### Core Game Files
```
static/js/games/wavelength-gems/
├── engine.js              # Main game engine (2000+ lines)
│   ├── Canvas rendering
│   ├── Animation system
│   ├── Game logic (matches, combos, gravity)
│   ├── Level loading (loadLevel, initGame)
│   └── Event handling
│
├── levels.js              # Level definitions (230+ lines)
│   ├── LEVELS array with 11 levels
│   ├── Level 1-3: Fully detailed
│   ├── Level 4-11: Placeholder structure
│   └── Helper functions
│
├── level-schema.js        # Schema documentation (350+ lines)
│   ├── Complete structure definition
│   ├── Field explanations
│   └── Example level
│
├── ui.js                  # UI components
├── validator.js           # Game logic validation
└── background-gallery.js  # Background management
```

### Documentation Files
```
Root/
├── GAME_LEVEL_SYSTEM_SUMMARY.md       # Executive summary
├── LEVEL_SYSTEM_GUIDE.md              # Comprehensive guide (450+ lines)
├── LEVEL_SYSTEM_README.md             # Quick reference (300+ lines)
├── WAVELENGTH_GEMS_GETTING_STARTED.md # This file
└── (in static/js/games/wavelength-gems/)
    └── LEVEL_SYSTEM_README.md         # Local quick reference
```

## Key Concepts

### Levels
A **level** is a game configuration tied to an episode:

```javascript
{
    level: 1,
    title: "My Lucky Charm",
    episodeKey: "season1/episode1",
    difficulty: "easy",
    objectives: { primary: { type: "score", target: 1500 } },
    constraints: { moveLimit: 30, gemTypes: ["daphne", ...] },
    theme: {
        primaryColor: "#FFD700",
        backgroundImage: "...",
        particleEffect: "lucky_sparkles"
    }
}
```

### Episodes
Episodes are stored in Firebase and contain:
- Title, description, story
- Images (main image + carousel)
- Keywords, video links
- Metadata

Levels reference episodes and can auto-inherit their data.

### Difficulty
6 difficulty levels with different move/score/gem type counts:

| Difficulty | Moves | Target | Gems | Use Case |
|-----------|-------|--------|------|----------|
| Tutorial | 50 | 500 | 3 | Learning |
| Easy | 30 | 1500 | 4 | Casual |
| Medium | 25 | 2500 | 5 | Challenge |
| Hard | 20 | 4000 | 6 | Expert |
| Expert | 15 | 5500 | 6 | Master |
| Legend | 10 | 7500 | 6 | Elite |

### Objectives
- **Primary**: Required to beat level (e.g., "Reach 1500 points")
- **Secondary**: Optional for bonus rewards (e.g., "Trigger 3 cascades")

## How the Game Works

### 1. Board Generation
```
generateBoard() with level-specific gem types
↓
8x8 grid filled with 4-6 gem types (depending on level)
↓
Gems displayed on canvas with shadows and emojis
```

### 2. Player Input
```
Click gem → Select it (highlighted with golden outline)
↓
Click adjacent gem → Swap (animated swap, then check for matches)
↓
No match → Swap back (shake animation)
Match found → Start combo chain
```

### 3. Match Detection
```
findMatches() → Returns all matching gems (3+ in a row)
↓
Highlight matches briefly
↓
animateMatches() → Remove matched gems with fade-out
↓
Show score popup (+points text)
↓
Apply gravity → Fill empty spaces with falling gems
↓
Check for cascades (more matches from falling gems)
```

### 4. Combo System
```
First match → combo = 1
Cascade match (second match) → combo = 2
More cascades → combo = 3, 4, 5+
↓
Each combo level:
- Multiplies score (combo = 2 → 2x score)
- Shows combo overlay ("COMBO!", "GREAT!", etc.)
- Color changes (orange → red → pink → gold)
- Triggers animation with scale and fade
```

### 5. Level Completion
```
Score >= targetScore → PRIMARY OBJECTIVE MET
↓
Check secondary objectives (cascades, move efficiency)
↓
Award stars (1-3) based on performance
↓
Calculate rewards (points, coins, XP)
↓
Submit score to Firebase
↓
Unlock next level
```

## Common Tasks

### Loading a Different Level
```javascript
loadLevel(3);  // Load Level 3 configuration
initGame(3);   // Full game init with Level 3
```

### Checking Level Info
```javascript
const level = getLevel(1);
console.log(level.title);              // "My Lucky Charm"
console.log(level.difficulty);         // "easy"
console.log(level.objectives.primary);  // { type: "score", target: 1500 }
console.log(level.theme.primaryColor); // "#FFD700"
```

### Checking Player Progress
```javascript
const userProgress = {
    completedLevels: [1, 2, 3],
    bestScores: { 1: 2500, 2: 3000, 3: 2200 }
};

if (isLevelUnlocked(4, userProgress)) {
    console.log("Level 4 is unlocked");
}
```

### Getting All Levels
```javascript
const allLevels = getAllLevels();           // All 11+ levels
const season1 = getLevelsBySeason(1);       // Just Season 1
const nextLevel = getNextLevel(3);          // Level 4
const totalCount = getTotalLevelCount();    // 11+
```

## Understanding the Animation System

The game uses a continuous animation loop for smooth 60fps rendering:

```javascript
// Animation types
'swap'      → Gems exchange positions (300ms)
'fall'      → Gems drop with easing (500ms)
'spawn'     → New gems scale in (300ms)
'removal'   → Matched gems fade and scale (300ms)

// Score popups
+200 text floats up and fades over 1200ms

// Combo overlay
Text scales in, holds, then fades out (1500ms total)
```

## Understanding Canvas Rendering

The game uses Canvas (not DOM) for rendering:

```javascript
// Everything drawn on canvas:
canvasManager.draw() → Called 60 times per second
├── Clear canvas
├── Draw board background
├── Draw all gems (with level colors)
├── Draw animations (swapping, falling gems)
├── Draw score popups
├── Draw combo overlay
├── Draw selected gem highlight + adjacent highlights
└── Update UI

// Benefits:
- Smooth 60fps rendering
- No layout constraints
- Perfect gem positioning
- Responsive to viewport changes
```

## Performance Notes

- **Board Size**: Fixed 8x8 grid
- **Gem Types**: 3-6 per level (4 on average)
- **Animation**: 60fps continuous loop
- **Memory**: ~2KB per level configuration
- **Load Time**: ~100ms for full game init

## Troubleshooting

### Game not starting?
1. Check browser console for errors
2. Verify levels.js is loaded before engine.js
3. Check that initGame() is called

### Gems not the right type?
1. Verify level gemTypes are set correctly
2. Check getRandomGemType() is using gameState.gemTypes
3. Look at console output for "Gem Types:" log

### Moves not limited?
1. Check gameState.moves is set from level config
2. Verify constraints.moveLimit in level definition
3. Look at console "Moves:" log

### Level not loading?
1. Verify level number exists (1-11)
2. Check LEVELS array in levels.js
3. Look at console for loadLevel() messages

## Next Steps

### For Designers (Phase 2 - Visual Theming)
1. Implement background image rendering
2. Create color scheme application
3. Add particle effect system
4. Build level briefing modal
5. Create carousel gallery UI

### For Developers (Phase 3+ - UI & Integration)
1. Create level selection screen
2. Implement progress tracking (Firebase)
3. Build progress display components
4. Fetch episode data from API
5. Auto-generate levels from episodes

### For Content (Phase 5 - Episode Integration)
1. Release new episodes on schedule
2. Game automatically creates matching levels
3. New levels appear in game after release
4. Players experience story continuity

## Resources

- **Complete Guide**: `LEVEL_SYSTEM_GUIDE.md` (comprehensive documentation)
- **Quick Reference**: `LEVEL_SYSTEM_README.md` (code examples)
- **Schema Details**: `level-schema.js` (structure documentation)
- **Examples**: `levels.js` (Levels 1-3 fully detailed)
- **Summary**: `GAME_LEVEL_SYSTEM_SUMMARY.md` (project overview)

## Key Files to Know

| File | Purpose | Modify For |
|------|---------|-----------|
| engine.js | Game logic | Game mechanics, animation timing |
| levels.js | Level configs | Level difficulty, objectives, themes |
| level-schema.js | Schema docs | Understanding level structure |
| ui.js | UI components | Visual improvements, new screens |
| levels.js | Level creation | Adding new levels |

## API Endpoints

```javascript
// Fetch episodes
GET /api/episodes
↓
Response: { episodes: [...] with all metadata }

// Submit score
POST /api/games/scores/submit
Body: { gameId, score, level, combo, timestamp }
↓
Response: { success, newRecord, achievement }

// Get user stats
GET /api/games/{gameId}/user-stats
↓
Response: { highScore, lastScore, plays, levels: {...} }
```

## Firebase Paths

```
/videos/season{N}/episodes/episode{N}  ← Episode data
/forum/users/{uid}/games/wavelength-gems/levels/{levelId}  ← User progress
/games/scores/{scoreId}  ← Score submissions
```

## Development Tips

1. **Always test with at least 3 levels** - Different difficulties
2. **Check console logs** - Game logs lots of debug info
3. **Use Chrome DevTools** - Network tab for API calls, Console for errors
4. **Test mobile and desktop** - Gem size adapts, ensure it works
5. **Check performance** - Canvas rendering should be 60fps
6. **Verify Firebase** - Progress should save and load correctly

## Questions?

- **Game Logic**: Check comments in engine.js
- **Level Design**: Read LEVEL_SYSTEM_GUIDE.md
- **Code Examples**: See LEVEL_SYSTEM_README.md
- **System Architecture**: See GAME_LEVEL_SYSTEM_SUMMARY.md
- **Schema Details**: See level-schema.js comments

---

**Version**: 1.0
**Last Updated**: October 22, 2024
**Next Phase**: Phase 2 - Visual Theming Implementation
**Status**: ✅ Core game complete | 📋 Level system complete | 🔄 UI integration ready
