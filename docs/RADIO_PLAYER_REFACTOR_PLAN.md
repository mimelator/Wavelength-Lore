# Radio Player Refactor Plan

## Current State
- **File**: `static/js/radio-player.js`
- **Size**: 3,372 lines
- **Methods**: 74 methods in single class
- **Status**: ⚠️ Monolithic, difficult to maintain

## Problems
1. **Too Large**: 3,372 lines in one file
2. **Mixed Concerns**: Game logic, UI, Firebase, weather effects all in one class
3. **Hard to Test**: Difficult to unit test individual features
4. **Hard to Maintain**: Changes in one area risk breaking others
5. **Slow Loading**: Large file impacts initial page load

## Proposed Modular Architecture

### Module 1: `radio-player-core.js` (~400 lines)
**Purpose**: Core playback functionality

**Responsibilities**:
- Audio element management
- Play/pause/stop controls
- Track navigation (next/previous)
- Volume control
- Progress bar and seeking
- Playlist management
- Repeat/shuffle modes

**Methods**:
- `constructor()`, `init()`
- `playTrack()`, `togglePlay()`, `next()`, `previous()`
- `setVolume()`, `seek()`, `updateProgress()`
- `toggleShuffle()`, `cycleRepeat()`
- `bindControls()`, `bindAudioEvents()`

**Dependencies**: None (pure playback logic)

---

### Module 2: `radio-player-firebase.js` (~300 lines)
**Purpose**: Firebase integration and data sync

**Responsibilities**:
- Firebase authentication
- Stats synchronization
- Favorites synchronization
- Cross-device state management

**Methods**:
- `initFirebaseSync()`, `setupFirebaseAuth()`
- `loadStatsFromFirebase()`, `saveStatsToFirebase()`
- `loadFavoritesFromFirebase()`, `saveFavoritesFromFirebase()`

**Dependencies**: Firebase SDK, Core module

---

### Module 3: `radio-player-game.js` (~600 lines)
**Purpose**: Game mechanics and collectibles

**Responsibilities**:
- Mystical element spawning
- Collectible system (mushrooms, stars, etc.)
- Stats tracking and calculations
- Level up system
- Sound effects for collections

**Methods**:
- `startMysticalSpawner()`, `spawnMysticalElement()`
- `collectElement()`, `updateStats()`, `recalculateTotalPoints()`
- `showLevelUpNotification()`
- `playCollectSound()`

**Dependencies**: Core module, Sound system

---

### Module 4: `radio-player-screensaver.js`** (~800 lines)
**Purpose**: Screen saver mode and visual effects

**Responsibilities**:
- Screen saver activation/deactivation
- Image gallery and rotation
- Customization controls
- Lyrics display
- Episode summary display
- Character badge spawning
- Transition effects

**Methods**:
- `initScreenSaver()`, `enterScreenSaver()`, `exitScreenSaver()`
- `startScreenSaverRotation()`, `rotateScreenSaverImage()`
- `updateScreenSaverImages()`, `updateLyricsDisplay()`
- `spawnFloatingBadge()`, `updateEpisodeSummary()`
- `saveScreenSaverPreferences()`, `loadScreenSaverPreferences()`

**Dependencies**: Core module, UI module

---

### Module 5: `radio-player-weather.js` (~600 lines)
**Purpose**: Weather effects system

**Responsibilities**:
- Weather particle systems (rain, snow, wind, clouds)
- Lightning effects
- Weather cycling and modes
- Canvas rendering
- Multi-weather support

**Methods**:
- `initWeatherEffects()`, `startWeatherEffects()`, `stopWeatherEffects()`
- `cycleWeather()`, `setWeatherMode()`
- `drawRain()`, `drawSnow()`, `drawWind()`, `drawClouds()`, `drawLightning()`
- `animateWeather()`, `initParticles()`

**Dependencies**: Screen saver module

---

### Module 6: `radio-player-ui.js` (~400 lines)
**Purpose**: UI updates and metadata management

**Responsibilities**:
- Now playing display
- Playlist UI updates
- Character badges display
- Episode info display
- Background gallery updates
- Media Session API integration
- Page visibility handling

**Methods**:
- `updateNowPlaying()`, `updatePlayButton()`, `updatePlaylistUI()`
- `updateBackgroundGallery()`, `updateCharacterBadges()`
- `updateEpisodeLinks()`, `loadFavorites()`
- `initMediaSession()`, `updateMediaSessionMetadata()`
- `initVisibilityHandling()`

**Dependencies**: Core module

---

### Module 7: `radio-player.js` (~200 lines)
**Purpose**: Main orchestration and initialization

**Responsibilities**:
- Import all modules
- Initialize all subsystems
- Coordinate between modules
- Expose public API

**Structure**:
```javascript
import { RadioPlayerCore } from './radio-player-core.js';
import { RadioPlayerFirebase } from './radio-player-firebase.js';
import { RadioPlayerGame } from './radio-player-game.js';
import { RadioPlayerScreenSaver } from './radio-player-screensaver.js';
import { RadioPlayerWeather } from './radio-player-weather.js';
import { RadioPlayerUI } from './radio-player-ui.js';

class WavelengthRadio {
    constructor() {
        this.core = new RadioPlayerCore(this);
        this.firebase = new RadioPlayerFirebase(this);
        this.game = new RadioPlayerGame(this);
        this.screensaver = new RadioPlayerScreenSaver(this);
        this.weather = new RadioPlayerWeather(this);
        this.ui = new RadioPlayerUI(this);
    }
    
    init() {
        this.core.init();
        this.firebase.init();
        this.game.init();
        this.screensaver.init();
        this.weather.init();
        this.ui.init();
    }
}
```

---

## Benefits of Refactor

### 1. **Maintainability**
- Each module has single responsibility
- Changes isolated to specific modules
- Easier to understand and modify

### 2. **Testability**
- Unit test individual modules
- Mock dependencies easily
- Faster test execution

### 3. **Performance**
- Lazy load non-critical modules
- Reduce initial bundle size
- Better code splitting

### 4. **Collaboration**
- Multiple developers can work on different modules
- Reduced merge conflicts
- Clear ownership boundaries

### 5. **Reusability**
- Modules can be reused in other projects
- Weather system could be standalone
- Game mechanics portable

---

## Migration Strategy

### Phase 1: Preparation (Current)
- ✅ Create comprehensive test suite
- ✅ Document current functionality
- ✅ Create refactor plan
- ⏳ Ensure all tests pass

### Phase 2: Extract Modules (1-2 days)
1. Extract Weather module first (most isolated)
2. Extract Game module
3. Extract Screen Saver module
4. Extract Firebase module
5. Extract UI module
6. Extract Core module
7. Create main orchestrator

### Phase 3: Testing (1 day)
- Run full test suite after each extraction
- Fix any broken functionality
- Verify performance improvements

### Phase 4: Optimization (1 day)
- Implement lazy loading
- Add module-level caching
- Optimize imports

---

## File Structure After Refactor

```
static/js/
├── radio-player.js                 (200 lines - main orchestrator)
├── radio-player-core.js            (400 lines - playback)
├── radio-player-firebase.js        (300 lines - sync)
├── radio-player-game.js            (600 lines - collectibles)
├── radio-player-screensaver.js     (800 lines - visuals)
├── radio-player-weather.js         (600 lines - effects)
├── radio-player-ui.js              (400 lines - metadata)
└── radio-player-init.js            (50 lines - initialization)
```

**Total**: ~3,350 lines (similar to current, but organized)

---

## Testing Strategy

### Before Refactor
```bash
# Establish baseline
node tests/radio-player-anonymous.test.js
node tests/radio-widget.test.js
node tests/radio-media-session.test.js
```

### During Refactor
```bash
# Run after each module extraction
node tests/radio-player-anonymous.test.js
```

### After Refactor
```bash
# Full regression suite
node tests/radio-player-anonymous.test.js
node tests/radio-widget.test.js
node tests/radio-player-authenticated.test.js
node tests/radio-media-session.test.js
```

**Success Criteria**: All tests must pass with same or better success rate

---

## Risk Mitigation

1. **Backup**: Keep original file as `radio-player.legacy.js`
2. **Incremental**: Extract one module at a time
3. **Testing**: Run tests after each extraction
4. **Rollback**: Easy to revert if issues arise
5. **Feature Flags**: Use flags to toggle between old/new code

---

## Timeline

| Phase | Duration | Tasks |
|-------|----------|-------|
| Preparation | 1 day | Fix tests, establish baseline |
| Extract Modules | 2 days | Create 6 module files |
| Testing | 1 day | Full regression testing |
| Optimization | 1 day | Performance improvements |
| **Total** | **5 days** | Complete refactor |

---

## Next Steps

1. ✅ **Document plan** (this file)
2. ⏳ **Fix corrupted radio-player.js**
3. ⏳ **Ensure all tests pass**
4. ⏳ **Begin module extraction**

---

## Status

**Current**: 📋 **Planning Complete**  
**Next**: 🔧 **Fix File Corruption**  
**Target**: 🎯 **Modular Architecture**

---

## Notes

- This refactor maintains 100% backward compatibility
- No changes to public API
- All existing functionality preserved
- Tests ensure no regressions
- Can be done incrementally over time

**Recommendation**: Execute this refactor during a low-traffic period or behind a feature flag to minimize risk.
