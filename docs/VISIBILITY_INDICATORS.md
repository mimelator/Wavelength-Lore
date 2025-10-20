# Visibility Indicators Implementation

## Overview

Visual indicators have been added to all content galleries so content creators can easily see which items are hidden from the public while browsing.

---

## What Was Added

### 1. **Character Gallery** (`views/character-gallery.ejs`)

**Visual Indicators:**
- 🔒 **"HIDDEN" badge** in top-right corner of hidden character cards
- **Dashed yellow border** around hidden character cards
- **Reduced opacity** (70%) for hidden items
- **Full opacity on hover** for better visibility

**CSS Classes:**
- `.visibility-indicator` - The badge showing lock icon and "HIDDEN" text
- `.hidden-content` - Applied to gallery items that are hidden
- Dashed border with `#f1c40f` (yellow) color

**Conditional Rendering:**
```ejs
<% if (isContentCreator && hero.visible === false) { %>
    <div class="visibility-indicator" title="This character is hidden from public view">
        🔒 <span>HIDDEN</span>
    </div>
<% } %>
```

---

### 2. **Lore Gallery** (`views/lore-gallery.ejs`)

**Visual Indicators:**
- 🔒 **"HIDDEN" badge** in top-right corner of hidden lore cards
- **Dashed yellow border** around hidden lore cards
- **Reduced opacity** (70%) for hidden items
- **Full opacity on hover** for better visibility

**CSS Classes:**
- `.visibility-indicator` - The badge showing lock icon and "HIDDEN" text
- `.hidden-content` - Applied to gallery items that are hidden
- Dashed border with `#f1c40f` (yellow) color

**Conditional Rendering:**
```ejs
<% if (isContentCreator && loreItem.visible === false) { %>
    <div class="visibility-indicator" title="This lore is hidden from public view">
        🔒 <span>HIDDEN</span>
    </div>
<% } %>
```

---

### 3. **Episode Carousels** (`views/index.ejs`)

**Visual Indicators:**
- 🔒 **"HIDDEN" badge** in top-right corner of hidden episode slides
- **Dashed yellow border** around episode images
- **Reduced opacity** (70%) for hidden episodes
- **Full opacity on hover** for better visibility

**CSS Classes:**
- `.episode-visibility-indicator` - The badge for episode carousels
- `.hidden-episode` - Applied to carousel slides that are hidden
- Dashed border on episode images

**Conditional Rendering:**
```ejs
<div class="<%= videos[season].episodes[episode].visible === false ? 'hidden-episode' : '' %>">
    <% if (isContentCreator && videos[season].episodes[episode].visible === false) { %>
        <div class="episode-visibility-indicator" title="This episode is hidden from public view">
            🔒 <span>HIDDEN</span>
        </div>
    <% } %>
    <!-- Episode content -->
</div>
```

---

## Design Specifications

### Badge Styling

```css
.visibility-indicator {
    position: absolute;
    top: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.8);
    color: #f1c40f;              /* Yellow text */
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: bold;
    z-index: 10;
    display: flex;
    align-items: center;
    gap: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}
```

### Hidden Item Styling

```css
.gallery-item.hidden-content {
    opacity: 0.7;                 /* Slightly transparent */
    border: 2px dashed #f1c40f;   /* Yellow dashed border */
}

.gallery-item.hidden-content:hover {
    opacity: 1;                   /* Full opacity on hover */
}
```

### Episode-Specific Styling

```css
.carousel .hidden-episode img {
    border: 2px dashed #f1c40f;   /* Border on image only */
}
```

---

## Behavior

### For Content Creators (Logged In)

✅ **See ALL content** (both visible and hidden)  
✅ **Hidden items show 🔒 badge** in top-right corner  
✅ **Hidden items have dashed yellow border**  
✅ **Hidden items slightly transparent** (easier to distinguish)  
✅ **Hover reveals full opacity**  
✅ **Click to edit** and toggle visibility  

### For Public Users (Not Logged In)

❌ **Do NOT see hidden content** at all  
✅ **Only see visible items**  
✅ **No badges or indicators** (they don't exist in the list)  

---

## User Experience

### Content Creator Workflow

1. **Browse galleries** as normal
2. **Spot hidden items** by the 🔒 badge and dashed border
3. **Easily distinguish** draft/hidden content from published content
4. **Click item** to edit
5. **Toggle visibility** when ready to publish
6. **Badge disappears** once item is revealed (on next page load)

### Visual Cues

| Element | Visible Content | Hidden Content |
|---------|----------------|----------------|
| Border | Solid | Dashed (yellow) |
| Opacity | 100% | 70% |
| Badge | None | 🔒 HIDDEN |
| Hover | Normal | Full opacity |

---

## Technical Implementation

### Conditional Rendering Logic

The indicators only show when:
1. `isContentCreator === true` (user has content_manager role or higher)
2. AND `item.visible === false` (content is hidden)

```ejs
<% if (isContentCreator && item.visible === false) { %>
    <!-- Show indicator -->
<% } %>
```

### CSS Positioning

The badge uses **absolute positioning** within **relatively positioned** gallery items:

```css
.gallery-item {
    position: relative;  /* Creates positioning context */
}

.visibility-indicator {
    position: absolute;  /* Positioned within gallery item */
    top: 10px;
    right: 10px;
    z-index: 10;         /* Above image */
}
```

---

## Color Scheme

- **Badge Background**: `rgba(0, 0, 0, 0.8)` - Semi-transparent black
- **Badge Text**: `#f1c40f` - Yellow (warning color)
- **Border**: `#f1c40f` - Yellow dashed
- **Shadow**: `rgba(0, 0, 0, 0.3)` - Subtle drop shadow

Yellow was chosen for:
- ⚠️ **Warning/attention** color
- 🎨 **High contrast** against dark backgrounds
- 🔍 **Easily noticeable** without being jarring

---

## Browser Compatibility

✅ **Modern Flexbox** (all modern browsers)  
✅ **CSS Positioning** (universal support)  
✅ **RGBA Colors** (all modern browsers)  
✅ **Hover States** (desktop and touch)  

---

## Performance Impact

**Minimal** - The indicators are:
- Pure CSS (no JavaScript required)
- Conditionally rendered (only for content creators)
- Simple DOM elements (no heavy assets)
- No impact on carousel performance

---

## Testing Checklist

- [x] Character gallery shows indicators for hidden characters
- [x] Lore gallery shows indicators for hidden lore
- [x] Episode carousels show indicators for hidden episodes
- [x] Indicators only visible to content creators
- [x] Public users don't see hidden content at all
- [x] Badge positioned correctly on all screen sizes
- [x] Dashed border visible on all items
- [x] Opacity transition smooth
- [x] Hover effect works correctly
- [x] No layout shift when badge appears

---

## Examples

### Character Gallery - Hidden Character

```
┌─────────────────────────┐
│ 🔒 HIDDEN          [Card]│
│                          │
│    [Character Image]     │
│                          │
│    Alexandria            │
│    ─────────────         │ ← Dashed yellow border
│        Hero              │
└─────────────────────────┘
```

### Lore Gallery - Hidden Lore

```
┌─────────────────────────┐
│ 🔒 HIDDEN          [Card]│
│                          │
│    [Lore Image]          │
│                          │
│    🌸 Daphne 🌸          │
│    ─────────────         │ ← Dashed yellow border
│       nature             │
└─────────────────────────┘
```

### Episode Carousel - Hidden Episode

```
┌─────────────────────────┐
│ 🔒 HIDDEN       [Slide]  │
│                          │
│  Season 5, Episode 1     │
│                          │
│  [Episode Image]         │ ← Dashed yellow border
│                          │
│  Episode Title           │
│  Description text...     │
└─────────────────────────┘
```

---

## Future Enhancements

Potential improvements for future versions:

- [ ] **Filter toggle** - Button to show/hide hidden content
- [ ] **Count badge** - Show "X hidden items" in gallery header
- [ ] **Bulk operations** - Select multiple hidden items and reveal all
- [ ] **Sorting options** - Sort by visibility status
- [ ] **Color coding** - Different colors for draft, review, scheduled
- [ ] **Tooltips** - Show who hid the item and when
- [ ] **Quick toggle** - Toggle visibility directly from gallery (no edit page)
- [ ] **Status history** - Show visibility change timeline

---

## Accessibility

- **Color contrast** meets WCAG AA standards
- **Hover tooltips** provide additional context
- **Screen readers** can read "HIDDEN" text
- **Keyboard navigation** works with all interactive elements
- **Visual cues** combined with text for clarity

---

## Summary

The visibility indicator system provides content creators with:

✅ **Clear visual feedback** on content status  
✅ **Easy identification** of hidden items  
✅ **Consistent design** across all galleries  
✅ **Non-intrusive** appearance  
✅ **Professional** aesthetics  

**Total Files Modified**: 3
- `views/character-gallery.ejs`
- `views/lore-gallery.ejs`
- `views/index.ejs`

**Lines of Code Added**: ~150 lines (CSS + HTML)

**Impact**: Content creators can now easily manage and identify hidden content across the entire platform!

---

**Implementation Complete**: October 20, 2025  
**Status**: ✅ Ready for Production
