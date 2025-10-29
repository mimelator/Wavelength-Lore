# NPC Visual Boundaries System Guide

## Overview

The NPC Visual Boundaries system manages rotating NPCs used as visual separators between seasons and episodes on the Wavelength Lore home page. This system creates visual interest and showcases the extracted NPC collection throughout the site.

## How It Works

### Current Setup

- **4 NPCs available** for visual boundaries
- **Weighted random selection** - each page load gets a different combination
- **Season-specific**: Each season divider displays a randomly selected NPC
- **Hover tooltips**: Visitors can hover over NPCs to see descriptions

### Current NPCs in Rotation

| NPC ID | Name | Image | Season | Weight | Description |
|--------|------|-------|--------|--------|-------------|
| `sneaky-goblin` | Sneaky Goblin | sneaky-goblin.png | Ice Blue Greed | 2x | A goblin peeking from behind a tree |
| `winter-elf-rabbit` | Arctic Hare | fp_elf_1.png | Frozen Peace | 1x | A magical arctic rabbit |
| `leprechaun` | Magical Leprechaun | fp_elf_2.png | Frozen Peace | 1x | A mischievous leprechaun |
| `ice-dragon-large` | Ice Dragon | fp_ice_dragon_1.png | Frozen Peace | 1x | A magnificent ice dragon |

**Weight Explanation**: The Sneaky Goblin has weight 2, meaning it appears twice as frequently as other NPCs (50% vs ~16.7% each).

## File Structure

```
wavelength-dev/
├── config/
│   └── npc-boundaries.js          ← Configuration file
├── routes/
│   └── content.js                 ← Home page route (imports config)
├── views/
│   └── index.ejs                  ← Home page template (uses boundaries)
└── public/
    └── assets/npc-characters/     ← All NPC images
        ├── sneaky-goblin.png
        ├── fp_elf_1.png
        ├── fp_elf_2.png
        └── fp_ice_dragon_1.png
```

## Adding a New NPC Boundary

### Step 1: Prepare the NPC Image

Ensure the transparent PNG is in `/public/assets/npc-characters/` with a descriptive filename.

### Step 2: Update the Configuration File

Edit `config/npc-boundaries.js` and add a new entry to the `boundaries` array:

```javascript
{
  id: 'unique-identifier',
  path: '/assets/npc-characters/filename.png',
  name: 'Display Name',
  altText: 'Descriptive alt text for accessibility',
  season: 'ice-blue-greed', // or 'frozen-peace', etc.
  description: 'Hover tooltip text visible to users',
  weight: 1 // Higher = more frequent selection (default: 1)
}
```

### Step 3: Verify

Refresh the home page (`http://localhost:3001`) multiple times. You should see your new NPC appearing in the season dividers.

### Example: Adding a Goblin King Border

```javascript
{
  id: 'goblin-king',
  path: '/assets/npc-characters/bots_creature_7.png',
  name: 'Goblin King',
  altText: 'Goblin King - Wavelength Lore NPC',
  season: 'battle-of-shire',
  description: 'Majestic goblin king with crown and armor',
  weight: 2
}
```

## Configuration Methods

The `npc-boundaries.js` module exports several helper methods:

### `getRandomBoundary()`
Returns a single random NPC respecting weight distribution.

```javascript
const randomNPC = npcBoundaries.getRandomBoundary();
// Returns: { id: 'sneaky-goblin', path: '/assets/...', ... }
```

### `getBoundariesBySeason(season)`
Get all NPCs available for a specific season.

```javascript
const frozenPeaceNPCs = npcBoundaries.getBoundariesBySeason('frozen-peace');
// Returns array of 3 NPCs (leprechaun, arctic-hare, ice-dragon)
```

### `getAllBoundaries()`
Get complete list of all configured boundaries.

```javascript
const allNPCs = npcBoundaries.getAllBoundaries();
```

### `getBoundaryById(id)`
Get a specific NPC by its ID.

```javascript
const sneaky = npcBoundaries.getBoundaryById('sneaky-goblin');
```

## How the Home Page Works

### Route Handler (`routes/content.js`)

When a user visits the home page:

1. The route handler loads video data from Firebase
2. **For each season**, it calls `npcBoundaries.getRandomBoundary()`
3. Results are stored in `seasonBoundaries` object keyed by season
4. This object is passed to the template as `seasonBoundaries`

```javascript
const seasonBoundaries = {};
for (const season in videos) {
  seasonBoundaries[season] = npcBoundaries.getRandomBoundary();
}

res.render('index', {
  seasonBoundaries: seasonBoundaries, // Passed to template
  // ... other data
});
```

### Template Rendering (`views/index.ejs`)

For each season loop, the template displays:

```ejs
<div class="season-divider" title="<%= seasonBoundaries[season].description %>">
  <img src="<%= seasonBoundaries[season].path %>"
       alt="<%= seasonBoundaries[season].altText %>"
       class="npc-image">
</div>
```

Features:
- **Title attribute**: Shows description on hover
- **Responsive**: Different heights on mobile (80px) vs desktop (120px)
- **Transform effect**: Scales up and lifts on hover (1.1x scale, -5px Y translation)
- **Drop shadow**: Professional shadow effect for visual depth

## Styling

The CSS for season dividers is in `views/index.ejs` (lines 95-123):

```css
.season-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 1.5rem 0;
  padding: 1rem 0;
}

.season-divider .npc-image {
  max-height: 120px;
  width: auto;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
  transition: transform 0.3s ease;
}

.season-divider .npc-image:hover {
  transform: scale(1.1) translateY(-5px);
}
```

To customize:
- **Size**: Change `max-height: 120px` (desktop) or `max-height: 80px` (mobile)
- **Shadow**: Adjust `drop-shadow()` parameters
- **Hover effect**: Modify `scale()` and `translateY()` values

## Testing

### Manual Testing

1. **Refresh multiple times**: Each page load should show different NPCs (with some repetition due to weighting)
2. **Check all seasons**: Verify each season divider has an NPC
3. **Hover testing**: Verify descriptions appear in tooltips
4. **Mobile testing**: Check responsive sizing and spacing

### Browser DevTools

1. Open DevTools (F12)
2. Go to Console
3. Try these commands:

```javascript
// Get the current NPC boundaries for this page load
console.log('Season boundaries:', window.seasonBoundaries);

// Or inspect the HTML directly:
// Right-click season divider → Inspect → Check src and alt text
```

## Troubleshooting

### NPCs Not Appearing

**Problem**: Season dividers show empty or broken images

**Solutions**:
1. Verify image files exist in `public/assets/npc-characters/`
2. Check browser console for 404 errors
3. Verify paths in `npc-boundaries.js` are correct
4. Restart server with `npm start`

### Same NPC Appearing Every Time

**Problem**: Not seeing variety in NPC selection

**Solutions**:
1. This is normal - with 4 NPCs and weighted distribution, some repetition is expected
2. Refresh 10+ times to see the variety
3. Increase weight for less-frequent NPCs:
   ```javascript
   weight: 3 // Now selected 3x more often
   ```

### NPC Descriptions Not Showing

**Problem**: Hover tooltips not appearing

**Solutions**:
1. Check that `title` attribute is set in `index.ejs`
2. Verify description field is set in `npc-boundaries.js`
3. Ensure CSS isn't hiding the title (it shouldn't)

## Performance Considerations

- **No database calls**: Configuration is static JavaScript
- **Lightweight**: Each NPC entry is ~150 bytes
- **Fast random selection**: Weighted array is pre-calculated
- **No latency impact**: Random selection happens in milliseconds

## Future Enhancements

Possible improvements to consider:

1. **Seasonal rotation**: Change NPCs based on real calendar season
2. **User preferences**: Let users pin favorite NPCs
3. **Analytics**: Track which NPCs are most-viewed
4. **Dynamic loading**: Load NPCs list from API instead of hardcoded config
5. **Animated NPCs**: Use animated GIFs or WebP formats
6. **NPC interaction**: Click to learn more about specific NPCs

## Maintenance Checklist

When adding new NPCs:

- [ ] Image file is transparent PNG, optimized (<100KB)
- [ ] Image is in `/public/assets/npc-characters/`
- [ ] Entry added to `config/npc-boundaries.js`
- [ ] All fields filled (id, path, name, altText, season, description, weight)
- [ ] Weight assigned based on desired frequency
- [ ] Server restarted
- [ ] Home page tested in browser
- [ ] Descriptions are accurate and user-friendly
- [ ] Alt text is descriptive for accessibility

## Related Files

- **NPC Gallery**: `/public/npc-gallery.html` - Interactive showcase of all NPCs
- **Extracted NPCs**: `/public/assets/npc-characters/` - All available NPC images
- **Character Extractor**: `wavelength-tools/character-extractor/` - Tool for creating NPCs

## Questions?

Refer to:
1. This guide for setup and maintenance
2. `config/npc-boundaries.js` comments for API usage
3. `routes/content.js` for route handler implementation
4. `views/index.ejs` for template implementation
