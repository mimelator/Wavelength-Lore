# Episode Ordering Fix

## Problem

Episodes were being displayed in **alphabetical order** instead of **chronological order** on the homepage and in the episode helpers. This caused Season 1 to display as:
- ❌ episode1, episode10, episode11, episode2, episode3...

Instead of:
- ✅ episode1, episode2, episode3, episode4... episode10, episode11

## Root Cause

JavaScript's `Object.keys()` and `for...in` loops do not guarantee order when iterating over object properties. When episode keys are strings like `"episode1"`, `"episode10"`, etc., they are sorted **lexicographically** (alphabetically) rather than numerically.

## Solution

Added explicit numeric sorting in two key locations:

### 1. Homepage View (`views/index.ejs`)

**Before:**
```ejs
<% for (var episode in videos[season].episodes) { %>
```

**After:**
```ejs
<% 
// Sort episodes numerically by episode number
const episodeKeys = Object.keys(videos[season].episodes).sort((a, b) => {
    const numA = parseInt(a.replace('episode', ''));
    const numB = parseInt(b.replace('episode', ''));
    return numA - numB;
});
episodeKeys.forEach(episode => { 
%>
```

### 2. Episode Helper (`helpers/episode-helpers.js`)

Added sorting to the `fetchEpisodesFromDatabase()` function:

```javascript
// Sort episodes by season and episode number
allEpisodes.sort((a, b) => {
  // Extract numeric values from season and episode IDs
  const seasonA = parseInt(a.season.replace('season', ''));
  const seasonB = parseInt(b.season.replace('season', ''));
  
  if (seasonA !== seasonB) {
    return seasonA - seasonB;
  }
  
  const episodeA = parseInt(a.episode.replace('episode', ''));
  const episodeB = parseInt(b.episode.replace('episode', ''));
  return episodeA - episodeB;
});
```

## Impact

### Fixed Locations:
- ✅ **Homepage carousel** - All seasons now display episodes in correct order
- ✅ **Episode helper cache** - All functions using `getAllEpisodesSync()` get sorted episodes
- ✅ **Search results** - Episodes appear in chronological order
- ✅ **Any route using episode helpers** - Guaranteed sorted order

### Verified:
- Season 1: Episodes 1-11 in correct order
- Season 2: Episodes 1-7 in correct order  
- Season 3: Episodes 1-7 in correct order
- Season 4: Episodes 1-8 in correct order

Total: **33 episodes across 4 seasons**, all properly ordered

## Testing

Run verification script:
```bash
node debug/verify-episode-sorting.js
```

Test homepage display:
```bash
node debug/test-homepage-episode-order.js
```

## Files Modified

1. `views/index.ejs` - Added sorting logic for episode display
2. `helpers/episode-helpers.js` - Added sorting to episode fetch function

## Debug Scripts Created

1. `debug/check-episode-order.js` - Check raw Firebase order
2. `debug/verify-episode-sorting.js` - Verify helper function sorting
3. `debug/test-homepage-episode-order.js` - Simulate homepage display

## Date

2025-10-20
