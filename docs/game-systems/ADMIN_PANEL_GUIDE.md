# Wavelength Gems - Admin/Developer Debug Panel

## Overview

The Admin Panel is a powerful debugging tool for developers and testers to quickly manipulate game state, jump between levels, and test various scenarios without playing through the entire game.

## Activation

**Keyboard Shortcut**: `Ctrl + Shift + D` (Windows/Linux) or `Cmd + Shift + D` (Mac)

Press the shortcut again to close the panel.

## Features

### 📍 Level Control

**Jump to Level**
- Select any level from the dropdown (1-11)
- Click "Go" to load that level immediately
- Bypasses unlock requirements

**Quick Navigation**
- **Next Level**: Load the next level in sequence
- **Retry Level**: Restart the current level

### 🎮 Game State Modification

**Score Adjustment**
- Enter a specific score value and click "Set"
- Quick add: "+1k" button adds 1000 points instantly

**Moves Manipulation**
- Set exact number of moves remaining
- Quick add: "+10" button adds 10 moves

**Combo Control**
- Set combo multiplier directly
- Quick add: "+5" button adds 5 to combo

### ⚡ Power Tools

**God Mode** 🛡️
- Toggle infinite moves
- When enabled, moves counter becomes ∞
- Button turns green when active
- Perfect for testing level completion without move pressure

**Instant Win** ✅
- Immediately complete the current level
- Sets score to target and triggers victory screen
- Useful for testing level progression and completion rewards

**Unlock All Levels** 🔓
- Marks all levels as completed in your progress
- Unlocks the entire game for testing
- Saves completion data to Firebase

**Reset Progress** 🔄
- **WARNING**: Deletes ALL game progress
- Clears all completed levels, scores, and stats
- Cannot be undone
- Requires confirmation

### 🎲 Board Control

**Shuffle Board** 🔀
- Randomizes all gems on the board
- Creates a new board layout

**Clear Board** 🧹
- Removes all gems from the board
- Creates empty grid (for testing edge cases)

**Refill Board** 🎨
- Fills empty spaces with new random gems
- Useful after clearing or testing gravity

**Force Cascade** ⚡
- Creates a horizontal line of 5 matching gems on top row
- Triggers immediate cascade when matched
- Tests cascade logic and combo system

### 📊 Debug Info

Real-time display of internal game state:

- **Current Level**: Level number or "Menu"
- **Game State**: Playing, Paused, or Gem Selected
- **Selected Gem**: Row and column of selected gem
- **Cascade Depth**: Current cascade chain depth
- **Target Score**: Score needed to complete level

**Refresh Info** 🔄
- Manually updates debug info display

**Log to Console** 📝
- Dumps complete game state to browser console
- Includes all internal variables and state

**Debug Board** 🔍
- Runs comprehensive board diagnostics
- Shows visual board layout with emojis
- Displays internal board data table
- Checks DOM element order and consistency
- Validates gem type matches between DOM and state
- Previously a standalone button, now integrated into admin panel

### ⚡ Quick Actions

**Pause/Resume** ⏸️▶️
- Toggle game pause state
- Button updates text based on state

**Debug Mode** 🐛
- Toggles debug mode flag
- Can be extended for visual debug overlays
- Button turns green when active

## Usage Examples

### Testing Level 11 Boss Fight
```
1. Press Ctrl+Shift+D to open panel
2. Select "Level 11: Back To The Shire" from dropdown
3. Click "Go"
4. Enable God Mode for testing without move limits
5. Test boss mechanics
```

### Testing Cascade System
```
1. Load any level
2. Open admin panel
3. Click "Force Cascade"
4. Match the created line to trigger cascade
5. Watch combo counter and scoring
```

### Testing Level Progression
```
1. Open admin panel
2. Click "Unlock All Levels"
3. Jump to any level to test
4. Use "Next Level" to test transitions
```

### Testing Failure State
```
1. Load a level
2. Set Moves to 1
3. Make a move
4. Test game over screen and retry flow
```

### Testing Victory Conditions
```
1. Load a level
2. Set Score to target score (shown in debug info)
3. Make one match to trigger victory
4. OR click "Instant Win" to skip directly
```

## Technical Details

### Files
- **Script**: `/static/js/games/wavelength-gems/admin-panel.js`
- **Styles**: `/static/css/admin-panel.css`
- **Integration**: Loaded in `views/games/wavelength-gems.ejs`

### API Endpoints Used

**Save Progress**
```javascript
POST /api/games/wavelength-gems/save-progress
Body: { level, score, stars, completed }
```

**Reset Progress**
```javascript
POST /api/games/wavelength-gems/reset-progress
Body: {} (no parameters needed)
```

**Load Levels**
```javascript
GET /api/games/wavelength-gems/levels
```

### Global Functions

The admin panel adds these global functions that can be called from browser console:

```javascript
// Panel control
toggleAdminPanel()

// Level control
adminJumpToLevel()
adminLoadNextLevel()
adminRetryLevel()

// State modification
adminSetScore()
adminAddScore(amount)
adminSetMoves()
adminAddMoves(amount)
adminSetCombo()
adminAddCombo(amount)

// Power tools
adminToggleGodMode()
adminWinLevel()
adminUnlockAllLevels()
adminResetProgress()

// Board control
adminShuffleBoard()
adminClearBoard()
adminFillBoard()
adminCreateCascade()

// Debug
adminRefreshDebugInfo()
adminLogGameState()
adminPauseResume()
adminToggleDebugMode()
```

### State Management

The admin panel directly modifies the global `gameState` object:
```javascript
gameState.score       // Current score
gameState.moves       // Moves remaining
gameState.combo       // Combo multiplier
gameState.board       // 8x8 gem grid
gameState.isPaused    // Pause state
```

## Security Considerations

### Production Deployment

For production environments, consider:

1. **Remove admin panel** from production builds
2. **Add authentication** to admin endpoints
3. **Add role-based access** (admin-only features)
4. **Log admin actions** for audit trail

### Environment-Based Loading

Add conditional loading in EJS:
```ejs
<% if (process.env.NODE_ENV !== 'production') { %>
    <link rel="stylesheet" href="/css/admin-panel.css">
    <script src="/js/games/wavelength-gems/admin-panel.js"></script>
<% } %>
```

### Rate Limiting

The save/reset endpoints should have rate limiting to prevent abuse:
```javascript
// Add to gameApi.js
const rateLimit = require('express-rate-limit');

const adminLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10 // 10 requests per minute
});

router.post('/wavelength-gems/save-progress', adminLimiter, async (req, res) => {
    // ...
});
```

## Troubleshooting

### Panel Won't Open
- Check browser console for errors
- Verify `admin-panel.js` and `admin-panel.css` are loaded
- Try clicking on game canvas first to ensure focus

### Functions Not Working
- Open browser console and check for errors
- Verify you're in an active game (not on menu)
- Some functions require active game state

### Level Jump Not Working
- Ensure `loadLevel()` function exists in engine
- Check that level number is valid (1-11)
- Look for errors in browser console

### Progress Save Failing
- Verify you're logged in (authentication required)
- Check network tab for API errors
- Ensure Firebase connection is active

## Best Practices

### Testing Workflow

1. **Start Fresh**: Use "Reset Progress" before major testing
2. **Test Each Level**: Jump through all levels to verify themes
3. **Test Edge Cases**: Use extreme values (0 moves, huge scores)
4. **Test Cascades**: Force cascades to verify combo logic
5. **Test Victory/Defeat**: Use Instant Win and set moves to 0

### Development Workflow

1. Keep panel open while developing
2. Use "Log to Console" to inspect state changes
3. Test changes without reloading (modify state directly)
4. Use God Mode to focus on specific features

### QA Workflow

1. Unlock all levels first
2. Test each level systematically
3. Document issues with exact game state (use Log to Console)
4. Test edge cases (0 moves, max score, etc.)

## Future Enhancements

Potential additions to the admin panel:

- **Level Editor**: Create/modify levels in-browser
- **Replay System**: Record and replay moves
- **State Snapshots**: Save/load game state snapshots
- **Performance Monitor**: FPS, memory usage, render time
- **AI Testing**: Automated gameplay testing
- **Visual Debug Overlay**: Show match detection, cascade chains
- **Gem Picker**: Click to change gem types directly
- **Sound Control**: Mute/test individual sound effects
- **Analytics**: Track test sessions and issues

## Keyboard Shortcuts Summary

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Shift + D` | Toggle Admin Panel |
| (more can be added) | |

## Support

For issues or feature requests related to the admin panel:
1. Check browser console for errors
2. Review this documentation
3. Test with panel disabled to isolate issues
4. Submit detailed bug reports with console logs

---

**Version**: 1.1.0  
**Last Updated**: October 22, 2025  
**Status**: ✅ Production Ready (remove before public release)
