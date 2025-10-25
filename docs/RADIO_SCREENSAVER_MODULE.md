# Radio Screensaver Module

## Overview

The Radio Screensaver module (`radio-screensaver.js`) is an extracted, standalone component that handles all screen saver functionality for the Wavelength Radio Player. This module was extracted from the monolithic `radio-player.js` file to improve maintainability and code organization.

## File Information

- **Location**: `/static/js/radio-screensaver.js`
- **Size**: ~754 lines
- **Dependencies**: Requires `WavelengthRadio` instance
- **Load Order**: Must be loaded before `radio-player.js`

## Architecture

### Class Structure

```javascript
class RadioScreenSaver {
    constructor(radioPlayer)  // Takes radio player instance
    init()                    // Initialize module
    bindControls()            // Bind UI controls
    toggle()                  // Toggle screensaver on/off
    enter()                   // Enter screensaver mode
    exit()                    // Exit screensaver mode
    // ... additional methods
}
```

### Integration

The screensaver module is instantiated by the main radio player:

```javascript
// In WavelengthRadio.init()
this.screensaver = new RadioScreenSaver(this);
```

## Features

### Core Functionality
- **Image Gallery**: Displays episode images with smooth transitions
- **Image Rotation**: Auto-rotates through images every 8 seconds
- **Transitions**: 12 different transition effects (fade, slide, zoom, rotate, etc.)
- **Image Effects**: Hue rotation, brightness, contrast, zoom, rotate
- **Animation Control**: Toggle slow-motion filter animations on/off

### Customization Options
- **Weather Effects**: Rain, snow, clouds, wind, lightning, sun (multi-select)
- **Game Mode**: Off, Easy, Medium, Hard difficulty levels
- **Lyrics Display**: Scroll, Static, or Off
- **Song Title**: Show or Hide
- **Episode Summary**: Show or Hide
- **Character Badges**: Floating character/lore badges with click-to-navigate
- **Transitions**: Random or Off
- **Animation**: On or Off

### Preferences Persistence
All customization preferences are saved to localStorage:
- Key: `wavelength_screensaver_prefs`
- Includes: weather, imageEffects, gameMode, lyrics, title, transition, animation, summary, badges

## Methods

### Initialization
- `init()` - Initialize module and load preferences
- `bindControls()` - Bind all UI event listeners
- `loadPreferences()` - Load saved preferences from localStorage
- `savePreferences()` - Save current preferences to localStorage

### Screensaver Control
- `toggle()` - Toggle screensaver on/off
- `enter()` - Enter screensaver mode
- `exit()` - Exit screensaver mode
- `updateImages()` - Update images when track changes

### Image Management
- `startRotation()` - Start image rotation timer
- `stopRotation()` - Stop image rotation timer
- `rotate()` - Rotate to next image with transition
- `updateImageEffects()` - Apply selected image effects
- `applyImageEffects(effects)` - Generate and apply CSS keyframes
- `updateImageAnimation()` - Toggle animation on/off

### Content Display
- `showTitle()` - Show song title overlay (3 second fade)
- `updateSummary()` - Show/hide episode summary
- `updateLyrics()` - Show/hide lyrics (scroll or static)
- `updateBadges()` - Start/stop character badge spawning

### Character Badges
- `startBadgeSpawning()` - Start spawning character badges
- `stopBadgeSpawning()` - Stop spawning and clear badges
- `spawnFloatingBadge(character)` - Spawn a single floating badge

## UI Controls

### Toggle Button
- ID: `screensaverToggle`
- Action: Enter/exit screensaver mode

### Minimal Controls (in screensaver)
- `screensaverPlayPause` - Play/pause music
- `screensaverPrev` - Previous track
- `screensaverNext` - Next track

### Customization Panel
- `customizationToggle` - Show/hide customization panel
- `.weather-btn` - Weather effect buttons
- `.image-btn` - Image effect buttons
- `.game-btn` - Game mode buttons
- `.lyrics-btn` - Lyrics display buttons
- `.title-btn` - Title display buttons
- `.transition-btn` - Transition buttons
- `.animation-btn` - Animation buttons
- `.summary-btn` - Summary display buttons
- `.badges-btn` - Badge display buttons

## Exit Behavior

The screensaver can be exited by:
1. Pressing any key
2. Clicking outside controls/customization
3. Clicking the screensaver toggle button

Note: Clicking inside the customization panel or minimal controls does NOT exit screensaver.

## Dependencies

### Required from Radio Player
- `this.radio.currentTrackIndex` - Current track index
- `this.radio.playlist` - Playlist array
- `this.radio.cdnUrl` - CDN URL for images
- `this.radio.togglePlay()` - Play/pause method
- `this.radio.previous()` - Previous track method
- `this.radio.next()` - Next track method
- `this.radio.startWeatherEffects()` - Start weather
- `this.radio.stopWeatherEffects()` - Stop weather
- `this.radio.updateGameMode()` - Update game mode
- `this.radio.stopGame()` - Stop game

### DOM Elements Required
- `#screensaverOverlay` - Main overlay container
- `.screensaver-gallery` - Image gallery container
- `#screensaverBadges` - Character badges container
- `.screensaver-lyrics` - Lyrics container
- `.screensaver-title-overlay` - Title overlay
- `.screensaver-summary-overlay` - Summary overlay
- `.screensaver-exit-hint` - Exit hint text
- `#customizationPanel` - Customization panel

## Testing

The screensaver module is tested as part of the radio player test suite:
- `tests/radio-player-anonymous.test.js` - Anonymous user tests
- Test: "Screen Saver Mode" - Verifies activation

Current test results: **83.3% pass rate (15/18 tests)**

## Future Enhancements

Potential improvements for future iterations:
1. **Unification**: Merge with global site screensaver
2. **Keyboard Shortcuts**: Add hotkeys for customization
3. **Presets**: Save/load custom preset configurations
4. **Fullscreen API**: True fullscreen mode support
5. **Touch Gestures**: Swipe to change images on mobile
6. **Image Preloading**: Preload next images for smoother transitions
7. **Accessibility**: ARIA labels and keyboard navigation

## Migration Notes

### Before Extraction
- **radio-player.js**: 3,372 lines (monolithic)
- Screensaver code: ~800 lines mixed with other features

### After Extraction
- **radio-player.js**: 2,251 lines (-1,121 lines, -33%)
- **radio-screensaver.js**: 754 lines (new module)
- **Total**: 3,005 lines (+367 lines for module structure)

### Benefits
- ✅ Improved code organization
- ✅ Easier to maintain and debug
- ✅ Clear separation of concerns
- ✅ Reusable module architecture
- ✅ No functionality lost
- ✅ All tests passing at same rate

## Version History

- **v1.0.0** (2024) - Initial extraction from radio-player.js
  - Extracted all screensaver functionality
  - Maintained 100% feature parity
  - Tests passing at 83.3% (same as before)
