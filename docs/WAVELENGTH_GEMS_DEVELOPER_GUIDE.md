# Wavelength Gems - Developer Guide

## 🎮 Overview

**Wavelength Gems** is a sophisticated match-3 puzzle game integrated into the Wavelength ecosystem. Each level is tied to episodes from the Wavelength Lore series, creating an immersive narrative experience that combines gameplay with storytelling.

## 🗂️ Project Structure

```
static/js/games/wavelength-gems/
├── 🎯 Core Game Engine
│   ├── engine.js              # Main game logic, board management, canvas rendering
│   ├── levels.js              # Level configuration loader (YAML-based)
│   ├── ui.js                  # UI updates and interactions
│   └── validator.js           # Game state validation and debugging
│
├── 🎨 Visual & Audio Systems
│   ├── game-background.js     # Dynamic backgrounds and visual effects
│   ├── background-gallery.js  # Background image carousel system
│   ├── background-diagnostics.js  # Background system debugging
│   └── level-briefing.js      # Level introduction modals
│
├── 🛠️ Development Tools
│   ├── admin-panel.js         # Developer debug panel (Ctrl+Shift+D)
│   ├── permission-check.js    # User permission validation
│   ├── mobile-diagnostics.js  # Mobile viewport debugging
│   └── auto-diagnostics.js    # Automatic diagnostics on load
│
├── 🎮 Retry & Progression
│   ├── retry-threshold-manager.js  # Retry logic management
│   ├── retry-threshold-ui.js  # Retry UI components
│   └── retry-threshold-test.js     # Retry system testing
│
└── 📊 Analytics & Performance
    └── Various diagnostic tools
```

## 🎯 Core Architecture

### Game Engine (`engine.js`)
- **Canvas-based rendering** with high-DPI support
- **Match-3 mechanics** with cascade system
- **Animation framework** for smooth visual feedback
- **Touch/click handling** for cross-platform support
- **Performance optimization** for mobile devices

```javascript
// Game configuration constants
const GAME_CONFIG = {
    ROWS: 8,
    COLS: 8,
    GEM_TYPES: ['daphne', 'jasper', 'miles', 'ivy', 'echo', 'atlas'],
    MATCH_MIN: 3,
    BASE_POINTS: 100,
    ANIMATION_DURATION: 300
};
```

### Level System (`levels.js`)
- **YAML-driven configuration** loaded from server
- **Episode integration** with Wavelength Lore series
- **Progressive difficulty** across seasons
- **Dynamic objectives** and constraints

```javascript
// Level structure example
{
    season: 1,
    episode: 1,
    level: 1,
    title: "My Lucky Charm",
    difficulty: "tutorial",
    objectives: {
        primary: { type: "score", target: 1500 }
    },
    constraints: {
        moveLimit: 30,
        gemTypeCount: 4
    }
}
```

## 🎨 Visual Features

### Responsive Design
- **Desktop**: Fixed gem sizes (60px) with centered layout
- **Mobile**: Flexible grid with viewport-optimized sizing
- **Dynamic canvas scaling** for crisp rendering on all devices

### Theme System
- **Episode-specific themes** with custom colors
- **Dynamic backgrounds** that change per level
- **Particle effects** and visual feedback
- **Hero badge display** showing episode artwork

### Animation System
- **Canvas-based particle effects**
- **Smooth gem movement** and matching feedback
- **Cascade animations** for combo effects
- **UI transitions** and state changes

## 🛠️ Development Tools

### Admin Panel (Ctrl+Shift+D)
Comprehensive debugging interface for developers:

```javascript
// Access admin panel features
toggleAdminPanel()          // Show/hide panel
adminJumpToLevel(5)         // Jump to specific level
adminToggleGodMode()        // Enable infinite moves
adminWinLevel()             // Instant level completion
```

**Key Features:**
- **Level jumping** - Skip to any level for testing
- **Game state modification** - Adjust score, moves, combos
- **God mode** - Infinite moves for testing
- **Board manipulation** - Shuffle, clear, refill board
- **Real-time debugging** - View game state and variables

### Diagnostic Systems
- **Mobile diagnostics** - Viewport and touch testing
- **Auto-diagnostics** - Automatic issue detection on load
- **Background diagnostics** - Visual system debugging
- **Performance monitoring** - Frame rate and memory usage

### Validation System
Built-in game state validation with detailed reporting:

```javascript
// Validation functions
validateGame()                    // Full game state check
diagnoseStuckGame()              // Detect impossible states
visualizePositionMismatches()    // Debug rendering issues
```

## 🎮 VIP Gaming Experience

Wavelength Gems provides an ad-free premium gaming experience for all users. The game focuses on pure gameplay without monetization interruptions, creating an immersive narrative experience tied to Wavelength Lore episodes.

## 🎮 Game Mechanics

### Match-3 Core
- **Gem swapping** - Click/touch to select and swap adjacent gems
- **Match detection** - Automatic detection of 3+ gem matches
- **Cascade system** - Chain reactions for bonus points
- **Combo scoring** - Multipliers for sequential matches

### Level Objectives
- **Score targets** - Reach specific point thresholds
- **Move limits** - Complete objectives within move constraints
- **Cascade requirements** - Trigger specific numbers of cascades
- **Time challenges** - Beat levels within time limits

### Progression System
- **Episode unlocking** - Levels unlock based on Wavelength Lore episodes
- **Star ratings** - Performance-based scoring system
- **Achievement tracking** - Progress statistics and milestones
- **Leaderboards** - Global and level-specific high scores

## 🌐 Integration Points

### Wavelength Ecosystem
- **Episode linking** - Direct navigation to related Wavelength Lore episodes
- **User permissions** - VIP/game_access required for play
- **Character integration** - Game gems themed after Wavelength characters
- **Narrative integration** - Level briefings tied to episode storylines

### Server Integration
```javascript
// API endpoints
GET /api/games/wavelength-gems/levels     // Load level configurations
GET /api/games/wavelength-gems/top-scores // Leaderboard data
POST /api/games/wavelength-gems/score     // Submit high scores
```

## 📱 Mobile Optimization

### Performance Features
- **Canvas optimization** - Efficient rendering for mobile GPUs
- **Touch handling** - Responsive touch/tap detection
- **Viewport management** - Dynamic sizing for all screen sizes
- **Battery optimization** - Reduced animation frequency on low battery

### Mobile-Specific Code
```javascript
// Mobile detection and optimization
const isMobile = viewport <= 768;
if (isMobile) {
    gemSize = 52; // Fixed mobile gem size
    this.boardY = 60; // Optimized vertical positioning
}
```

## 🔧 Development Workflow

### Setup Process
1. **Environment Variables** - Configure database connections and game settings
2. **Permission System** - Ensure `game_access` permission for testing
3. **Level Configuration** - Load levels from YAML configuration
4. **Debug Panel** - Use Ctrl+Shift+D for development features

### Testing Strategies
- **Level Testing** - Use admin panel to jump between levels
- **Mobile Testing** - Enable mobile diagnostics for viewport issues
- **Retry System Testing** - Validate retry logic and UI behavior
- **Performance Testing** - Monitor frame rates and memory usage

### Code Organization
```javascript
// Recommended development patterns
if (window.RetryThresholdManager) {
    RetryThresholdManager.init(); // Initialize systems safely
}

// Error handling for critical systems
try {
    await initGame();
} catch (error) {
    console.error('Game initialization failed:', error);
}
```

## 🚀 Deployment Considerations

### Production Optimizations
- **Debug removal** - Disable admin panel and diagnostic tools
- **Performance monitoring** - Enable analytics and error tracking
- **CDN optimization** - Ensure assets are properly cached
- **Game optimization** - Minimize bundle size and optimize loading

### Environment Configuration
```javascript
// Production environment variables
NODE_ENV=production
GAME_ANALYTICS_ENABLED=true
```

## 📚 Key Files Reference

### Essential Game Files
- **`views/games/wavelength-gems.ejs`** - Main game page template
- **`routes/games.js`** - Game routing and configuration
- **`static/js/games/wavelength-gems/engine.js`** - Core game engine
- **`static/js/games/wavelength-gems/levels.js`** - Level management system

### Configuration Files
- **Level configurations** - Stored in YAML format on server
- **Game settings** - Environment variables for game configuration
- **Permission system** - Group-based access control

### Development Tools
- **Admin panel** - Comprehensive debugging interface
- **Diagnostic systems** - Automated issue detection
- **Validation tools** - Game state verification

---

This developer guide provides a comprehensive overview of the Wavelength Gems codebase. The game represents a sophisticated integration of match-3 mechanics, narrative storytelling, monetization systems, and mobile optimization within the broader Wavelength ecosystem.

For specific implementation details, refer to the individual JavaScript files and their inline documentation. The admin panel (Ctrl+Shift+D) provides immediate access to most development and debugging features during active development.