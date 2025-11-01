# 🌊 Tour System Debugging Guide

## Issue: Tour Restarting on Every Visit

**Problem**: The welcome tour was starting on every homepage visit, even for users who had completed it.

**Root Cause**: Multiple script inclusions were causing the tour initialization to run multiple times, potentially bypassing the localStorage completion check.

## Fixed Issues

### 1. Duplicate Script Loading
- **Problem**: `wavelength-site-tour.js` was loaded in multiple places:
  - `views/partials/footer.ejs` (global)
  - `views/games/wavelength-gems.ejs` (duplicate)
  - `views/radio-player.ejs` (duplicate)
  
- **Fix**: Removed duplicate script tags, now only loads globally in footer.

### 2. Initialization Race Condition
- **Problem**: Tour initialization had two code paths without proper guards
- **Fix**: Unified initialization with `initializeAndStartTour()` function and double-initialization prevention

### 3. Enhanced Logging
- **Added**: Console logging to track tour initialization and completion checks
- **Added**: `checkTourStatus()` method for debugging

## Debugging Commands

Use these commands in the browser console on https://wavelengthlore.com/:

### Check Current Tour Status
```javascript
window.wavelengthSiteTour.checkTourStatus()
```

### Reset Tour (for testing)
```javascript
window.wavelengthSiteTour.resetTourState()
```

### Manual Tour Start (bypass completion check)
```javascript
window.wavelengthSiteTour.startMainSiteTour(true)
```

### Check localStorage Directly
```javascript
console.log('Tour completed:', localStorage.getItem('wavelength_site_tour_completed'));
```

## Testing the Fix

1. **First Visit Test**:
   - Clear localStorage: `localStorage.clear()`
   - Visit homepage - tour should start automatically
   - Complete tour - it should set `wavelength_site_tour_completed = 'true'`

2. **Return Visit Test**:
   - Refresh homepage - tour should NOT auto-start
   - Should show "Want a refresher? Replay Tour" notification

3. **Console Verification**:
   - Check for "First time visitor detected" or "Returning visitor detected" logs
   - Verify no duplicate initialization messages

## Implementation Details

### Tour Completion Check
```javascript
const tourCompleted = !forceStart && localStorage.getItem('wavelength_site_tour_completed') === 'true';
```

### Initialization Guard
```javascript
if (window.wavelengthSiteTour) return; // Prevent double initialization
```

### Auto-Start Conditions
- Homepage (`/`) or lore page (`/lore`) 
- Tour not completed
- Not forced skip

## Related Files
- `/static/js/wavelength-site-tour.js` - Main tour system
- `/views/partials/footer.ejs` - Global script loading
- `/views/games/wavelength-gems.ejs` - Removed duplicate script
- `/views/radio-player.ejs` - Removed duplicate script