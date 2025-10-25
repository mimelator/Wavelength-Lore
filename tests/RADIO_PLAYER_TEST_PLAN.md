# Radio Player Test Plan

## Overview

Comprehensive testing plan for the Wavelength Radio Player, covering both the main radio page and the widget that appears on other pages.

## Test Scope

### 1. Main Radio Page (`/radio`)
- Full-featured player with playlist, controls, and cozy game
- Screen saver mode with customization
- Weather effects and visual elements
- Stats tracking and Firebase sync

### 2. Radio Widget (Global Mini Player)
- Appears on most pages as floating widget
- Basic playback controls
- State persistence across page navigation
- Minimal UI footprint

## Test Categories

### A. Anonymous User Tests (localStorage only)

**Core Playback**
- ✅ Load radio page
- ✅ Play/pause functionality
- ✅ Next/previous track navigation
- ✅ Volume control
- ✅ Progress bar seeking
- ✅ Track auto-advance on completion

**Playlist Management**
- ✅ Display all 33 tracks (4 seasons)
- ✅ Click track to play
- ✅ Season filtering (All, S1, S2, S3, S4)
- ✅ Play modes (Sequential, Random, Loop Favorites)
- ✅ Shuffle toggle
- ✅ Repeat modes (Off, All, One)
- ✅ Favorite tracks (localStorage)

**Visual Features**
- ✅ Album art display
- ✅ Now playing info (title, season, episode)
- ✅ Episode images in background
- ✅ Character badges display
- ✅ Episode links work

**Cozy Game (localStorage)**
- ✅ Collectibles spawn during playback
- ✅ Click to collect (mushrooms, stars, horseshoes, etc.)
- ✅ Points accumulate
- ✅ Stats persist in localStorage
- ✅ Level up notifications
- ✅ Sound effects toggle

**Screen Saver Mode**
- ✅ Toggle screen saver
- ✅ Image rotation from episode gallery
- ✅ Weather effects (rain, snow, lightning, etc.)
- ✅ Multi-weather mode
- ✅ Image effects (hue, brightness, zoom, rotate)
- ✅ Lyrics display (scroll/static/off)
- ✅ Song title overlay
- ✅ Episode summary display
- ✅ Character badges spawning
- ✅ Game mode in screen saver (easy/medium/hard)
- ✅ Customization preferences saved
- ✅ Exit on click/keypress

**Widget Tests (Anonymous)**
- ✅ Widget appears on other pages
- ✅ Play/pause from widget
- ✅ Track info displays
- ✅ Volume control in widget
- ✅ State persists when navigating pages
- ✅ Resume playback on return to radio page

### B. Authenticated User Tests (Firebase sync)

**Firebase Integration**
- ✅ Stats sync to Firebase on login
- ✅ Favorites sync to Firebase
- ✅ Merge local + Firebase data (take higher values)
- ✅ Auto-save on collect/favorite
- ✅ Load stats on page load
- ✅ Points contribute to global leaderboard

**Cross-Device Sync**
- ✅ Stats persist across devices
- ✅ Favorites persist across devices
- ✅ Game progress syncs

### C. Edge Cases & Error Handling

**Audio Errors**
- ✅ Handle missing audio files
- ✅ Auto-skip to next track on error
- ✅ Display error message

**Network Issues**
- ✅ Graceful degradation without Firebase
- ✅ Retry Firebase connection
- ✅ Queue saves for when connection returns

**Browser Compatibility**
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ⚠️ Mobile browsers (limited testing)

**Performance**
- ✅ No memory leaks during long sessions
- ✅ Smooth animations
- ✅ Weather effects don't lag
- ✅ Game collectibles don't accumulate

## Test Implementation

### Test Structure

```javascript
class RadioPlayerTester {
  // Main radio page tests
  async testRadioPageLoad()
  async testPlaybackControls()
  async testPlaylistInteraction()
  async testSeasonFiltering()
  async testPlayModes()
  async testFavorites()
  
  // Cozy game tests
  async testGameCollectibles()
  async testGameStats()
  async testGameLevelUp()
  async testGamePersistence()
  
  // Screen saver tests
  async testScreenSaverToggle()
  async testScreenSaverImages()
  async testWeatherEffects()
  async testLyricsDisplay()
  async testGameModeInScreenSaver()
  
  // Widget tests
  async testWidgetAppearance()
  async testWidgetControls()
  async testWidgetStatePersistence()
  async testWidgetToRadioPageTransition()
  
  // Firebase tests (authenticated)
  async testFirebaseStatsSync()
  async testFirebaseFavoritesSync()
  async testCrossDeviceSync()
}
```

### Test Execution

```bash
# Run anonymous user radio tests
node tests/radio-player-anonymous.test.js

# Run authenticated user radio tests
node tests/radio-player-authenticated.test.js

# Run widget tests
node tests/radio-widget.test.js

# Run all radio tests
node tests/radio-player-suite.test.js
```

## Key Test Scenarios

### Scenario 1: First-Time Anonymous User
1. Visit `/radio` page
2. No tracks playing initially
3. Click first track → plays immediately
4. Collectibles start spawning
5. Click collectibles → stats update
6. Navigate to `/characters` → widget appears
7. Widget shows current track
8. Return to `/radio` → playback continues

### Scenario 2: Returning Anonymous User
1. Visit `/radio` page
2. localStorage has saved stats
3. Favorites are restored
4. Play mode preference restored
5. Season filter preference restored
6. Continue collecting → stats accumulate

### Scenario 3: Authenticated User First Login
1. Visit `/radio` page (logged in)
2. localStorage has local stats
3. Firebase has cloud stats
4. Merge: take higher values
5. Continue playing → auto-save to Firebase
6. Stats contribute to leaderboard

### Scenario 4: Screen Saver Experience
1. Click screen saver toggle
2. Full-screen mode activates
3. Episode images rotate every 8s
4. Weather effects active (auto-cycling)
5. Lyrics scroll across screen
6. Character badges spawn and float
7. Game mode active (collectibles clickable)
8. Click anywhere → exit screen saver

### Scenario 5: Widget Cross-Page Navigation
1. Start playing on `/radio`
2. Navigate to `/characters` → widget appears
3. Widget shows current track + controls
4. Click pause in widget → music stops
5. Navigate to `/lore` → widget persists
6. Click play in widget → music resumes
7. Return to `/radio` → full player synced

## localStorage Keys

```javascript
// Playback preferences
'wavelength_play_mode'           // sequential, random, loop
'wavelength_season_filter'       // all, 1, 2, 3, 4
'wavelength_favorites'           // JSON array of track indices
'radio_sound_enabled'            // true/false

// Game stats
'mushroom_count'
'star_count'
'horseshoe_count'
'sparkle_count'
'crystal_count'
'moon_count'
'goblin_count'
'magic_level'
'total_points'
'game_mode_points'

// Screen saver preferences
'wavelength_screensaver_prefs'   // JSON object with all settings
'wavelength_screensaver_transitions' // on/off
'wavelength_screensaver_animation'   // on/off

// Widget state
'global_radio_playback_state'    // JSON with track, time, volume
```

## Firebase Paths

```javascript
// User stats
`users/${userId}/radioPlayerStats`
  - mushrooms, stars, horseshoes, etc.
  - magicLevel
  - totalPoints
  - gameModePoints
  - lastUpdated

// User favorites
`users/${userId}/radioPlayerFavorites`
  - favorites: []
  - lastUpdated
```

## Success Criteria

### Anonymous User Tests
- ✅ All playback controls work
- ✅ Playlist interaction smooth
- ✅ Game collectibles spawn and collect
- ✅ Stats persist in localStorage
- ✅ Screen saver fully functional
- ✅ Widget appears and works on other pages
- ✅ State persists across navigation

### Authenticated User Tests
- ✅ Firebase sync works on login
- ✅ Stats merge correctly (local + cloud)
- ✅ Auto-save on every collect/favorite
- ✅ Points contribute to leaderboard
- ✅ Cross-device sync works

### Performance
- ✅ No console errors
- ✅ Smooth animations (60fps)
- ✅ No memory leaks
- ✅ Audio loads quickly
- ✅ Weather effects performant

## Known Limitations

1. **Mobile Support**: Limited testing on mobile browsers
2. **Audio Format**: MP3 only, no fallback formats
3. **Browser Audio**: Requires user interaction to start (autoplay policy)
4. **Firebase**: Requires network connection for sync
5. **localStorage**: 5-10MB limit (should be sufficient)

## Recommendations

### High Priority
1. Test widget on all major pages
2. Test localStorage persistence
3. Test playback controls thoroughly
4. Test screen saver customization

### Medium Priority
1. Test Firebase sync with multiple devices
2. Test game stats accumulation
3. Test weather effects performance
4. Test lyrics display

### Low Priority
1. Test mobile responsiveness
2. Test cross-browser compatibility
3. Test long-session stability
4. Test edge cases (missing audio, etc.)

## Next Steps

1. Create `radio-player-anonymous.test.js` - Core functionality
2. Create `radio-widget.test.js` - Widget on other pages
3. Create `radio-player-authenticated.test.js` - Firebase sync
4. Run tests and document results
5. Fix any issues found
6. Add to regression suite
