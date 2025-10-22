# Wavelength Gems - Quick Reference Index

## Essential Files at a Glance

### Client-Side Game Code
| File | Lines | Purpose | Key Functions |
|------|-------|---------|---|
| **engine.js** | 2000+ | Main game loop, rendering, animation | `initGame()`, `loadLevel()`, `generateBoard()`, `findMatches()`, `applyGravity()` |
| **levels.js** | 490 | Level definitions and management | `getLevel()`, `getAllLevels()`, `isLevelUnlocked()` |
| **level-briefing.js** | 400+ | Level briefing modal and UI | `showBriefing()`, `generateBriefingHTML()` |
| **level-schema.js** | 492 | Schema documentation | (reference only, defines LEVEL_SCHEMA structure) |
| **validator.js** | 500+ | Game state validation tools | `validateGame()`, `diagnoseStuckGame()` |
| **ui.js** | Minimal | UI components | (mostly canvas-based UI) |

### Server-Side Routes
| File | Purpose | Endpoints |
|------|---------|-----------|
| **gameApi.js** | Game score & stats endpoints | POST /scores/submit, GET /user-stats, GET /leaderboard, GET /top-scores |
| **games.js** | Game page routing | GET /, GET /wavelength-gems, GET /:gameId |

### Templates & Styles
| File | Purpose |
|------|---------|
| **wavelength-gems.ejs** | Main game page (HTML structure + inline styles) |
| **wavelength-gems.css** | Game-specific styles (responsive, gems, board) |
| **games.css** | Games hub and navigation styles |

---

## Most Important Code Locations

### To Modify Game Mechanics
- **File**: `/static/js/games/wavelength-gems/engine.js`
- **Functions**: `findMatches()`, `applyGravity()`, `calculateScore()`, `processCascades()`
- **Why**: All game logic happens here

### To Add/Modify Levels
- **File**: `/static/js/games/wavelength-gems/levels.js`
- **Functions**: `createLevel()` to create new levels, then add to `LEVELS` array
- **Why**: Level definitions control game difficulty, mechanics, and theme

### To Change Visual Theme
- **File**: `/static/js/games/wavelength-gems/engine.js` in `canvasManager` object
- **Also**: Theme data in `levels.js` for each level
- **Why**: Canvas rendering applies theme colors to gems and board

### To Modify Objectives & Rewards
- **File**: `/static/js/games/wavelength-gems/levels.js`
- **Fields**: `objectives`, `progression.rewards`
- **Why**: Each level defines its own objectives and rewards

### To Store Scores to Firebase
- **File**: `/routes/gameApi.js` (POST /scores/submit)
- **Also**: Client-side call from game page
- **Why**: Handles score persistence and leaderboard data

---

## Game State Flow

```
Player loads /games/wavelength-gems
    ↓
wavelength-gems.ejs renders
    ↓
engine.js initGame(1) called on DOMContentLoaded
    ↓
Level 1 loaded: loadLevel(1)
    ↓
Level config applied to gameState
    ↓
levelBriefingUI.showBriefing() displays modal
    ↓
Player clicks "Begin Level"
    ↓
Canvas animations start, game loop runs
    ↓
Player makes moves, score updates
    ↓
Level complete: POST /api/games/scores/submit
    ↓
Score saved to Firebase: /games/scores/{scoreId}
    ↓
User progress updated: /forum/users/{uid}/games/wavelength-gems
```

---

## Common Tasks

### Playing a Level with Different Configuration
```javascript
// In browser console or script:
const newConfig = getLevel(3);
console.log(newConfig.constraints.moveLimit);    // 25
console.log(newConfig.objectives.primary.target); // 2500
initGame(3);  // Load and start level 3
```

### Checking What Level Requires to Unlock
```javascript
const level = getLevel(5);
console.log(level.progression.unlockRequirements.previousLevel); // 4
console.log(level.progression.unlockRequirements.minimumScore);  // null (no score requirement)
```

### Checking Available Gem Types in a Level
```javascript
const level = getLevel(1);
console.log(level.constraints.gemTypes);      // ["daphne", "jasper", "miles", "ivy"]
console.log(level.constraints.gemTypeCount);  // 4
```

### Validating Game State (Debug)
```javascript
// In browser console:
validateGame();           // Returns validation results
diagnoseStuckGame();      // Checks for stuck board state
visualizePositionMismatches();  // Shows any position bugs
```

### Submitting a Score
```javascript
// Happens automatically when level completes
// Manual submission:
await fetch('/api/games/scores/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    gameId: 'wavelength-gems',
    score: 2500,
    level: 1,
    combo: 5
  })
});
```

---

## Level Configuration Quick Guide

```javascript
createLevel({
  level: 1,                          // Level number (1-based)
  title: "My Lucky Charm",           // Display name
  difficulty: "easy",                // "tutorial", "easy", "medium", "hard", "expert", "legend"
  
  // Game mechanics
  constraints: {
    moveLimit: 30,                   // Moves allowed
    gemTypes: ["daphne", "jasper"],  // Available gem types
    gemTypeCount: 4                  // How many different types appear
  },
  
  // Objectives
  objectives: {
    primary: {
      type: "score",
      target: 1500,
      description: "Reach 1500 points"
    },
    secondary: [
      { type: "cascades", target: 3, description: "Trigger 3 cascades" }
    ]
  },
  
  // Visual theme
  theme: {
    primaryColor: "#FFD700",         // Main color
    backgroundImage: "/path/to/image.webp",
    particleEffect: "lucky_sparkles" // "lucky_sparkles", "forest_mist", "ice_crystals", null
  },
  
  // Progression
  progression: {
    unlockRequirements: {
      previousLevel: 0  // Must complete level 0 first
    }
  },
  
  // Story
  narrative: {
    briefing: "Story text displayed before level starts"
  }
})
```

---

## Game Loop Sequence

### Every Frame (60fps)
1. `requestAnimationFrame` triggers `canvasManager.draw()`
2. Clear canvas
3. Draw background image
4. Draw board background + border glow
5. Draw all 64 gems with colors from `level.theme`
6. Update and draw animations (swaps, falls, removals)
7. Draw particle effects
8. Draw score popups
9. Draw combo overlay
10. Update game stats in HTML

### On Player Move
1. Validate adjacent gems
2. Animate swap (300ms)
3. `findMatches()` at swap locations
4. If match found: `animateMatches()` → `applyGravity()` → recurse
5. Increment move counter
6. Check if level complete (score >= target)

### On Cascade
1. Increment combo counter
2. Show combo overlay with color change
3. Generate particles
4. Add score × combo level to score
5. Check if cascade depth < maxCascades (10)
6. Continue if more matches found

---

## Firebase Paths

```
/videos/season{N}/episodes/episode{N}     ← Episode data
/forum/users/{uid}/games/wavelength-gems  ← User game stats
/forum/users/{uid}/games/wavelength-gems/levels/1  ← Level progress (Phase 3)
/games/scores/{scoreId}                   ← Global score submission
```

---

## API Endpoints

```
POST   /api/games/scores/submit
GET    /api/games/wavelength-gems/user-stats
GET    /api/games/wavelength-gems/leaderboard?limit=10&offset=0
GET    /api/games/wavelength-gems/top-scores?limit=20
GET    /api/games/leaderboard/global
```

---

## Key Variables in gameState

| Variable | Purpose | Example |
|----------|---------|---------|
| `board` | 8x8 grid of gems | `board[row][col]` = { type: "daphne", ... } |
| `score` | Current score | 2500 |
| `moves` | Remaining moves | 15 |
| `level` | Current level | 1 |
| `levelConfig` | Level data | `{ title, difficulty, constraints, ... }` |
| `combo` | Current combo multiplier | 3 (means 3x score) |
| `selectedGem` | Currently selected gem | `{ row: 2, col: 3 }` or null |
| `gemTypes` | Available gems this level | `["daphne", "jasper", "miles", "ivy"]` |

---

## Difficulty Progression

| Level | Difficulty | Moves | Target Score | Gems | Notes |
|-------|-----------|-------|--------------|------|-------|
| 1-2 | Easy | 30 | 1500 | 4 | Tutorial levels |
| 3 | Medium | 25 | 2500 | 5 | Skill building |
| 4-7 | Medium | 25 | 2500 | 5 | Continued learning |
| 8-10 | Hard | 20 | 4000 | 6 | Challenge |
| 11 | Hard | 20 | 4000 | 6 | Season finale |

---

## Performance Tips

- **Board size**: Always 8x8 (don't change)
- **Gem count**: 3-6 types per level (more = harder)
- **Animation**: Runs at 60fps using requestAnimationFrame
- **Memory**: ~2KB per level config
- **Load time**: ~100ms for game init

---

## Debugging Commands

```javascript
// In browser console:
gameState                          // View current game state
gameState.board                    // View 8x8 board
validateGame()                     // Check game integrity
diagnoseStuckGame()                // Find stuck state issues
getLevel(1)                        // View level 1 config
getAllLevels()                     // View all levels
canvasManager.themeColors          // View current theme colors
animationSystem.isAnimating()      // Check if animating
```

---

## Documentation Structure

1. **CODEBASE_EXPLORATION_SUMMARY.md** (38KB) - Complete technical reference
2. **WAVELENGTH_GEMS_GETTING_STARTED.md** (442 lines) - Beginner guide
3. **LEVEL_SYSTEM_GUIDE.md** (450+ lines) - Comprehensive guide
4. **LEVEL_SYSTEM_README.md** (300+ lines) - Quick reference
5. **PHASE_2_VISUAL_THEMING.md** - Visual theming details
6. **GAME_LEVEL_SYSTEM_SUMMARY.md** - Executive summary
7. **QUICK_REFERENCE_INDEX.md** (this file) - At-a-glance reference

---

**Last Updated**: October 22, 2024
**Game Status**: Phase 2 Complete (Visual Theming) | Ready for Phase 3 (Progression)
