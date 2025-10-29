# NPC Boundaries - Quick Reference

## What is it?

System that rotates NPCs as visual separators between seasons on the home page.

## Where are the files?

| File | Purpose |
|------|---------|
| `config/npc-boundaries.js` | Configuration file - add/edit NPCs here |
| `routes/content.js` | Home route - imports and uses boundaries |
| `views/index.ejs` | Template - displays boundaries |
| `public/assets/npc-characters/` | Where images live |

## Current NPCs

```
✓ Sneaky Goblin (weight: 2x - appears most often)
✓ Arctic Hare (fp_elf_1.png)
✓ Leprechaun (fp_elf_2.png)
✓ Ice Dragon (fp_ice_dragon_1.png)
```

## To Add a New NPC

### 1. Put image in `/public/assets/npc-characters/`

Example: `my-creature.png`

### 2. Edit `config/npc-boundaries.js`

Find the `boundaries` array and add:

```javascript
{
  id: 'my-creature',
  path: '/assets/npc-characters/my-creature.png',
  name: 'My Creature',
  altText: 'My Creature - Wavelength Lore NPC',
  season: 'frozen-peace',  // or 'ice-blue-greed', etc
  description: 'This is what appears when you hover',
  weight: 1  // Higher = more frequent (default 1)
}
```

### 3. Restart Server

```bash
npm start
```

### 4. Refresh Home Page

Visit http://localhost:3001 and refresh a few times to see it appear.

## To Change Frequency

Edit `weight` in the config:

```javascript
weight: 1  // Normal frequency
weight: 2  // Twice as likely to appear
weight: 3  // 3x more likely
```

The Sneaky Goblin currently has `weight: 2` so it appears ~50% of the time.

## To Remove an NPC

Delete the entire object from the `boundaries` array in `config/npc-boundaries.js`.

## Testing

- Refresh home page 5-10 times
- Different NPCs should appear in season dividers
- Hover over NPCs to see descriptions
- Check console for any errors

## API Methods

Available in `npc-boundaries.js`:

```javascript
// Get random NPC
const npc = npcBoundaries.getRandomBoundary();

// Get all NPCs for a season
const frozenNPCs = npcBoundaries.getBoundariesBySeason('frozen-peace');

// Get all NPCs
const allNPCs = npcBoundaries.getAllBoundaries();

// Get specific NPC by ID
const npc = npcBoundaries.getBoundaryById('sneaky-goblin');
```

## Troubleshooting

**NPCs not showing?**
- Restart server
- Check image paths
- Check browser console for 404 errors

**Same NPC every time?**
- Refresh multiple times (randomness + weighting = some repetition)
- Check that other entries exist in config

**Descriptions not showing on hover?**
- Make sure `description` field is filled in config
- Check that `index.ejs` has `title="<%= seasonBoundaries[season].description %>"`

## Full Guide

For detailed info, see `docs/NPC_BOUNDARIES_GUIDE.md`
