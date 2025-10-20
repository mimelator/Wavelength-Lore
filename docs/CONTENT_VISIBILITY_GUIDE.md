# Content Visibility System Guide

## Overview

The Content Visibility System allows content creators to prepare Episodes, Characters, and Lore objects privately before revealing them to the public. All new content is **hidden by default** until explicitly revealed.

## Key Features

### 🔒 Hidden by Default
- All newly created Episodes, Characters, and Lore are hidden
- Hidden content is only visible to users with `content_manager` role or higher
- Public users cannot see hidden content in any listing or search

### 👁️ Visibility Control
- **Content Creators** can toggle visibility with a single click
- **Real-time Updates** - visibility changes are immediate
- **Visual Indicators** - clear badges show current visibility status

### 🎯 Role-Based Filtering
- **Public Users**: See only visible content
- **Content Creators** (`content_manager`, `admin`, `super_admin`): See all content with visibility indicators

## How It Works

### Data Structure

Each content object now includes a `visible` field:

```javascript
{
  id: "episode1",
  title: "My Lucky Charm",
  description: "Episode description",
  visible: false, // Default for new content
  // ... other fields
}
```

**Visibility Field Behavior:**
- `visible: true` - Content is visible to everyone
- `visible: false` - Content is hidden (only visible to content creators)
- `visible: undefined` or missing - Treated as **visible** (backwards compatibility with existing content)

## Creating Content with Visibility Control

### During Creation

When using the [Create Content](/create) interface:

1. Fill in all required fields
2. Check the **"👁️ Make visible immediately"** checkbox to publish right away
3. Leave unchecked (default) to keep content hidden

**Default Behavior:**
- ☑️ Checkbox **unchecked** → Content hidden (recommended for drafts)
- ✅ Checkbox **checked** → Content visible immediately

### After Creation

You'll be redirected to the edit page where you can:
- Add more details (images, keywords, relationships)
- Toggle visibility when ready to publish
- Continue editing without affecting public view

## Managing Visibility

### Toggle Visibility on Edit Page

1. Navigate to the content's edit page
2. Look for the visibility badge in the header:
   - **👁️ VISIBLE** - Content is public
   - **🔒 HIDDEN** - Content is private
3. Click the visibility button:
   - **🔓 Hide Content** - Makes visible content hidden
   - **🔒 Reveal Content** - Makes hidden content visible
4. Changes are immediate (no save required)

### Visual Indicators

**In Edit Page Header:**
```
✏️ Edit Episode [EPISODE]  [👁️ VISIBLE]  or  [🔒 HIDDEN]
```

**Visibility Button States:**
- **Orange** button (🔓 Hide Content) - Currently visible
- **Gray** button (🔒 Reveal Content) - Currently hidden

### API Endpoints

#### Toggle Episode Visibility
```http
PUT /api/content/episode/:seasonNumber/:episodeNumber/visibility
Authorization: Bearer <Firebase ID Token>
Content-Type: application/json

{
  "visible": true
}
```

#### Toggle Character Visibility
```http
PUT /api/content/character/:characterId/visibility
Authorization: Bearer <Firebase ID Token>
Content-Type: application/json

{
  "visible": false
}
```

#### Toggle Lore Visibility
```http
PUT /api/content/lore/:loreId/visibility
Authorization: Bearer <Firebase ID Token>
Content-Type: application/json

{
  "visible": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Episode revealed successfully",
  "visible": true,
  "timestamp": "2025-10-20T15:30:00.000Z"
}
```

## Content Filtering

### How Filtering Works

The system uses helper functions to automatically filter content based on user role:

```javascript
// Public users - hidden content filtered out
const characters = getAllCharacters(false); 
// Returns only visible characters

// Content creators - all content visible
const characters = getAllCharacters(true);
// Returns all characters including hidden ones
```

### Helper Function Parameters

All content helper functions now accept a `showHidden` parameter:

**Character Helpers:**
- `getAllCharacters(showHidden)` - Async version
- `getAllCharactersSync(showHidden)` - Sync version

**Lore Helpers:**
- `getAllLore(showHidden)` - Async version
- `getAllLoreSync(showHidden)` - Sync version

**Episode Helpers:**
- `getAllEpisodes(showHidden)` - Async version
- `getAllEpisodesSync(showHidden)` - Sync version

### Middleware Integration

The middleware automatically determines visibility based on user authentication:

```javascript
// In config/middleware.js
const showHidden = res.locals.isContentCreator;

res.locals.allCharacters = characterHelpers.getAllCharactersSync(showHidden);
res.locals.allLore = loreHelpers.getAllLoreSync(showHidden);
res.locals.allEpisodes = episodeHelpers.getAllEpisodesSync(showHidden);
```

## Use Cases

### 1. **Draft Mode**
Create content without publishing:
```
1. Create new character via /create
2. Leave "Make visible immediately" unchecked
3. Add all details and images
4. Test links and references
5. Reveal when ready to publish
```

### 2. **Seasonal Releases**
Prepare multiple episodes in advance:
```
1. Create all episodes for Season 5 (hidden)
2. Add all content, images, audio
3. Test everything internally
4. Reveal episodes one by one on schedule
```

### 3. **Content Review**
Collaborate before publishing:
```
1. Create content (hidden by default)
2. Share edit page URL with team
3. Gather feedback and make changes
4. Reveal only after approval
```

### 4. **Spoiler Prevention**
Keep future content private:
```
1. Create character that appears in future episodes
2. Keep hidden until episode releases
3. Reveal character when episode goes live
```

## Best Practices

### ✅ Do's

1. **Create Hidden First**
   - Always create content as hidden initially
   - Add all details before revealing
   - Test links and references while hidden

2. **Use Descriptive Titles**
   - Make it easy to identify content in internal lists
   - Remember hidden content won't be searchable publicly

3. **Batch Revelations**
   - Prepare multiple items
   - Reveal them all at once during scheduled releases

4. **Clear Communication**
   - Use visibility badges to track publication status
   - Coordinate with team on reveal timing

### ❌ Don'ts

1. **Don't Reveal Too Early**
   - Double-check all content is complete
   - Verify images and links work
   - Ensure descriptions are finalized

2. **Don't Forget Existing Content**
   - Existing content without `visible` field is treated as visible
   - Update old content if it needs to be hidden

3. **Don't Mix References**
   - Avoid linking visible content to hidden content
   - Hidden references won't work for public users

## Backwards Compatibility

### Existing Content

All existing content created before the visibility system:
- **Does not have** a `visible` field
- **Is treated as visible** (visible: undefined → visible to all)
- **Can be hidden** by editing and toggling visibility

### Migration

No migration required! The system handles backwards compatibility:

```javascript
// Filtering logic
if (!showHidden) {
  return allContent.filter(item => item.visible !== false);
}
// Items without 'visible' field pass the filter (visible !== false)
```

## Security

### Access Control

**Visibility Toggle Endpoints:**
- ✅ Protected by `requireGroup('content_manager')` middleware
- ✅ Requires Firebase authentication
- ✅ Validates ID token on every request
- ✅ Automatically clears caches after changes

**Content Filtering:**
- ✅ Applied at helper function level
- ✅ Based on server-side user role detection
- ✅ Cannot be bypassed client-side
- ✅ Works for both sync and async operations

### Permissions Required

To manage visibility, users must have one of:
- `content_manager` role
- `admin` role
- `super_admin` role

## Troubleshooting

### Content Not Appearing

**Problem:** Created content doesn't show up in lists

**Solutions:**
1. Check if you're signed in with content creator role
2. Verify content visibility status on edit page
3. Clear browser cache and refresh
4. Check if content is assigned to correct category

### Visibility Toggle Not Working

**Problem:** Button doesn't change content visibility

**Solutions:**
1. Ensure you're signed in via Forum
2. Check browser console for errors
3. Verify you have `content_manager` role or higher
4. Check Firebase authentication token is valid

### Public Users See Hidden Content

**Problem:** Hidden content appears in public view

**Solutions:**
1. Clear server caches (content creators have cache clear permission)
2. Verify `visible: false` is set in database
3. Check middleware is correctly detecting user role
4. Restart server to reload helper functions

### Existing Content Disappeared

**Problem:** Old content no longer visible

**Solutions:**
1. Check if someone toggled visibility to hidden
2. Verify database connection is working
3. Check if `visible` field was accidentally set to `false`
4. Review recent edit history in Firebase

## Technical Implementation

### Files Modified

1. **routes/contentApi.js**
   - Added `visible` field to POST endpoints (default: false)
   - Added PUT `/visibility` endpoints for all content types
   - Automatic cache clearing after visibility changes

2. **helpers/character-helpers.js**
   - Updated `getAllCharacters(showHidden)`
   - Updated `getAllCharactersSync(showHidden)`
   - Added filtering logic

3. **helpers/lore-helpers.js**
   - Updated `getAllLore(showHidden)`
   - Updated `getAllLoreSync(showHidden)`
   - Added filtering logic

4. **helpers/episode-helpers.js**
   - Updated `getAllEpisodes(showHidden)`
   - Updated `getAllEpisodesSync(showHidden)`
   - Added filtering logic

5. **config/middleware.js**
   - Added visibility parameter to helper function calls
   - Based on `res.locals.isContentCreator`

6. **views/edit-content.ejs**
   - Added visibility badge in header
   - Added visibility toggle button
   - Added `toggleVisibility()` JavaScript function

7. **views/create-content.ejs**
   - Added visibility checkbox for each content type
   - Updated form submissions to include `visible` field
   - Added helper text explaining default behavior

## Future Enhancements

Potential features for future versions:

- [ ] **Bulk Visibility Operations** - Toggle multiple items at once
- [ ] **Scheduled Reveals** - Auto-reveal content at specific date/time
- [ ] **Visibility History** - Track who changed visibility and when
- [ ] **Preview Mode** - Share hidden content via special preview links
- [ ] **Draft Warnings** - Alert when editing visible content
- [ ] **Visibility Dashboard** - Overview of all hidden content
- [ ] **Role-Based Previews** - Different visibility for different roles
- [ ] **Visibility Templates** - Save visibility preferences for bulk operations

## Support

For questions or issues with the visibility system:

1. Check this documentation first
2. Review the troubleshooting section
3. Check browser console for JavaScript errors
4. Verify Firebase authentication is working
5. Contact the development team with specific error messages

---

**Last Updated:** October 20, 2025  
**System Version:** 1.0  
**Requires:** content_manager role or higher
