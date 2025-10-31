# Publishing & Visibility System Analysis

## Current State: Inconsistent Visibility Model

### Problem Summary
The codebase uses **multiple conflicting fields** for visibility control:
- `published: true/false` (songs, lore, characters, episodes)
- `visible: true/false` (episodes, characters, lore)  
- `hidden: true/false` (episodes, characters, lore)
- `status: 'hidden' | 'published'` (episodes)

This creates **unreliable publishing workflows** where content may be visible when it shouldn't be, or hidden when it should be accessible to authorized users.

---

## Current Implementation by Content Type

### 1. **Songs (Radio Player)**

**Fields Used:**
- `song.published: boolean`

**Filtering Logic:**
```javascript
// routes/radioPlayer.js
if (includeUnpublished || song.published === true) {
    // Include song
}

// services/firebase-songs-service.js
async getPublishedSongs(seasonFilter, includeUnpublished = false) {
    if (includeUnpublished || song.published === true) {
        songs.push(song);
    }
}
```

**Content Creator Access:**
- Radio page: `getEnhancedPlaylist(null, isAdmin, true)`
- API endpoint: Checks `req.user.isContentCreator`
- Development: `?creator=true` query param override

**Issues:**
- ✅ Songs sync with episode visibility (line 73-74 in firebase-songs-service.js)
- ❌ No preview/staging mode for songs
- ❌ Only binary published/not-published

---

### 2. **Episodes (Home Page & Navigation)**

**Fields Used:**
- `episode.visible: boolean` (primary)
- `episode.hidden: boolean` (legacy)
- `episode.published: boolean` (CLI/backend)
- `episode.status: 'hidden' | 'published'` (state management)

**Filtering Logic:**
```javascript
// views/index.ejs
if (episodeData.visible === false && !isContentCreator) {
    return; // Skip hidden episodes
}

// routes/contentApi.js
.filter(ep => ep.visible !== false) // Only visible episodes

// helpers/episode-helpers.js
if (!showHidden) {
    return allEpisodes.filter(episode => !episode.hidden);
}
```

**Content Creator Access:**
- Home page: Checks `isContentCreator` variable (from middleware)
- Shows hidden episodes with 🔒 indicator
- Individual episode pages: Returns 404 if hidden and not creator

**Issues:**
- ❌ **Inconsistent field usage**: Some places check `visible`, others check `hidden`
- ❌ No preview mode for authorized users
- ❌ Dynamic linking doesn't filter by visibility

---

### 3. **Characters (Gallery & Navigation)**

**Fields Used:**
- `character.hidden: boolean` (primary)
- `character.visible: boolean` (legacy)
- `character.published: boolean` (CLI/backend)

**Filtering Logic:**
```javascript
// routes/content.js
if (character.hidden && !res.locals.isContentCreator) {
    return res.status(404).send('Character not found');
}

// helpers/character-helpers.js
if (!showHidden) {
    return allCharacters.filter(char => !char.hidden);
}
```

**Content Creator Access:**
- Gallery: `showHidden = res.locals.isContentCreator || false`
- Individual pages: 404 if hidden and not creator
- Shows hidden characters with badge in gallery

**Issues:**
- ❌ Uses `hidden` field while episodes use `visible`
- ❌ Dynamic linking includes hidden characters
- ❌ No episode-based visibility (characters introduced in unpublished episodes)

---

### 4. **Lore Objects (Gallery & Navigation)**

**Fields Used:**
- `loreItem.hidden: boolean` (primary)
- `loreItem.visible: boolean` (legacy)
- `loreItem.published: boolean` (CLI/backend)
- `loreItem.status: 'draft' | 'published'` (workflow)

**Filtering Logic:**
```javascript
// routes/content.js
if (loreItem.hidden && !res.locals.isContentCreator) {
    return res.status(404).send('Lore not found');
}

// helpers/lore-helpers.js
if (!showHidden) {
    return allLore.filter(loreItem => !loreItem.hidden);
}
```

**Content Creator Access:**
- Gallery: `showHidden = res.locals.isContentCreator || false`
- Individual pages: 404 if hidden and not creator
- Shows hidden lore with badge

**Issues:**
- ❌ Same inconsistencies as characters
- ❌ No episode-based visibility control
- ❌ Dynamic linking includes hidden lore

---

### 5. **Dynamic Linking (Navigation Text)**

**Current Behavior:**
```javascript
// helpers/disambiguation-helpers.js
const characters = characterHelpers.getAllCharactersSync(); // NO FILTERING
const lore = loreHelpers.getAllLoreSync(); // NO FILTERING
const episodes = episodeHelpers.getAllEpisodesSync(); // NO FILTERING

// Creates links for ALL items, including hidden ones
```

**Issues:**
- ❌ **No visibility filtering at all**
- ❌ Hidden content gets linked, breaking for public users
- ❌ Content creators see links to content they can access, but public users don't

---

## Proposed Unified Publishing System

### Core Concept: Three-Tier Visibility Model

```
1. DRAFT (default)
   - Not visible to anyone except content creators
   - Not linked in dynamic navigation
   - Not accessible via direct URL (404 for public)

2. PREVIEW (new!)
   - Visible to content creators
   - Visible to authorized preview users (e.g., beta testers)
   - Links work in navigation (for authorized users)
   - Not indexed by search engines
   - Shows "PREVIEW" badge

3. PUBLISHED
   - Visible to everyone
   - Indexed by search engines
   - Links work in navigation
   - Shows in galleries, radio, home page
```

---

### Unified Schema

**Single Source of Truth:**
```javascript
{
    // VISIBILITY (choose one field, use consistently)
    visibility: 'draft' | 'preview' | 'published',  // PRIMARY FIELD
    
    // METADATA (for workflow tracking)
    publishedAt: timestamp | null,
    previewEnabled: boolean,  // Allow preview access even if draft
    episodeIntroduced: 's5e1',  // Episode where content first appears
    
    // DEPRECATED (keep for migration, remove after)
    // published: boolean,  // Migrate to visibility
    // visible: boolean,    // Migrate to visibility
    // hidden: boolean,     // Migrate to visibility
    // status: string,      // Keep only for episode workflow state
}
```

---

### Visibility Rules

#### **1. Content Creator Access**
- Content creators see **ALL** content regardless of visibility
- Can toggle between visibility states
- Can enable preview mode for specific content

#### **2. Preview User Access** (New!)
- Users with `isPreviewUser` or `isBetaTester` flag
- Can see `visibility: 'preview'` content
- Can see `visibility: 'draft'` content if `previewEnabled: true`
- Cannot access `visibility: 'draft'` content by default

#### **3. Public User Access**
- Only see `visibility: 'published'` content
- Hidden content returns 404
- Links in navigation only work for published content

#### **4. Episode-Based Visibility** (New!)
- Content introduced in an episode inherits episode's visibility
- When episode becomes `published`, related lore can auto-publish
- CLI workflow: "Publish episode and all related content"

---

### Implementation Plan

#### **Phase 1: Add Unified Visibility Field**

1. **Update Schema:**
   ```javascript
   // Add to all content types
   visibility: 'draft' | 'preview' | 'published'
   previewEnabled: boolean
   episodeIntroduced: string | null
   ```

2. **Create Migration Helper:**
   ```javascript
   // utils/visibility-migration.js
   function migrateVisibility(item) {
       // Convert old fields to new visibility field
       if (item.visible === false || item.hidden === true || item.published === false) {
           return 'draft';
       }
       if (item.published === true) {
           return 'published';
       }
       return 'draft'; // Default
   }
   ```

#### **Phase 2: Update Filtering Logic**

1. **Create Unified Filter Function:**
   ```javascript
   // helpers/visibility-helpers.js
   function isVisibleToUser(item, user) {
       // Content creators see everything
       if (user?.isContentCreator) return true;
       
       // Preview users see preview content
       if (user?.isPreviewUser) {
           if (item.visibility === 'preview') return true;
           if (item.visibility === 'draft' && item.previewEnabled) return true;
       }
       
       // Public users only see published
       return item.visibility === 'published';
   }
   ```

2. **Update All Filters:**
   - Radio player: Use `isVisibleToUser(song, user)`
   - Home page: Use `isVisibleToUser(episode, user)`
   - Character gallery: Use `isVisibleToUser(character, user)`
   - Lore gallery: Use `isVisibleToUser(loreItem, user)`
   - Dynamic linking: Use `isVisibleToUser(item, user)` before creating links

#### **Phase 3: Update Dynamic Linking**

```javascript
// helpers/linking-utils.js
function linkifyItemMentions(text, items, linkType, user = null) {
    // Filter items by visibility FIRST
    const visibleItems = items.filter(item => 
        isVisibleToUser(item, user)
    );
    
    // Only create links for visible items
    // ... rest of linking logic
}
```

#### **Phase 4: Add Preview User Support**

1. **Update Authentication Middleware:**
   ```javascript
   // middleware/auth.js
   res.locals.isPreviewUser = req.user?.isPreviewUser || false;
   res.locals.isBetaTester = req.user?.isBetaTester || false;
   ```

2. **Update API Endpoints:**
   ```javascript
   // routes/radioPlayer.js
   const canPreview = isAdmin || req.user?.isPreviewUser;
   const playlist = await getEnhancedPlaylist(season, canPreview, true);
   ```

#### **Phase 5: Episode-Based Visibility**

1. **Update Lore Registration (Step 7):**
   ```javascript
   // cli/steps/lore-registration.js
   const characterData = {
       visibility: 'draft',
       episodeIntroduced: episode.id,
       previewEnabled: false,  // Can enable per-item
       // When episode publishes, can auto-publish related content
   };
   ```

2. **Create Bulk Visibility Update:**
   ```javascript
   // commands/episodes-commands.js
   async publishEpisodeWithContent(episodeId) {
       // Publish episode
       await this.episodeService.updateEpisode(episodeId, {
           visibility: 'published',
           publishedAt: Date.now()
       });
       
       // Find all content introduced in this episode
       const relatedContent = await this.findContentByEpisode(episodeId);
       
       // Optionally publish related content
       for (const item of relatedContent) {
           await this.updateContentVisibility(item.id, 'published');
       }
   }
   ```

---

### Migration Strategy

1. **Add new fields without breaking existing code:**
   - Keep old fields (`published`, `visible`, `hidden`)
   - Add new `visibility` field
   - Migrate data gradually

2. **Update code to use new field, with fallback:**
   ```javascript
   function getVisibility(item) {
       // Prefer new field
       if (item.visibility) return item.visibility;
       
       // Fallback to old fields
       if (item.visible === false || item.hidden === true) return 'draft';
       if (item.published === true) return 'published';
       
       return 'draft'; // Default
   }
   ```

3. **After all code updated, remove old fields:**
   - Run migration script to convert all old fields to `visibility`
   - Remove old field checks
   - Update database schema

---

### Benefits of Unified System

1. ✅ **Consistent Behavior**: All content types use same visibility logic
2. ✅ **Preview Mode**: Allow authorized users to preview content before publish
3. ✅ **Episode Integration**: Content visibility tied to episode publishing
4. ✅ **Dynamic Linking**: Only links to content visible to current user
5. ✅ **Clear Workflow**: Draft → Preview → Published pipeline
6. ✅ **Authorized Access**: Content creators and preview users can access everything
7. ✅ **Reliable Publishing**: No more "is it published or visible or hidden?" confusion

---

## Files That Need Updates

### Priority 1 (Core Filtering)
- `helpers/visibility-helpers.js` (NEW)
- `helpers/character-helpers.js`
- `helpers/lore-helpers.js`
- `helpers/episode-helpers.js`
- `helpers/linking-utils.js`
- `routes/contentApi.js`
- `routes/radioPlayer.js`

### Priority 2 (UI/Templates)
- `views/index.ejs`
- `views/character-gallery.ejs`
- `views/lore-gallery.ejs`
- `routes/content.js`

### Priority 3 (CLI/Backend)
- `cli/steps/lore-registration.js`
- `services/firebase-character-service.js`
- `services/firebase-lore-service.js`
- `services/firebase-episode-service.js`
- `services/firebase-songs-service.js`
- `commands/episodes-commands.js`

### Priority 4 (Migration)
- `utils/visibility-migration.js` (NEW)
- Migration scripts for existing data

---

## Questions to Resolve

1. **Preview User Access Level:**
   - Should preview users see ALL preview content, or per-item grants?
   - Should preview access expire (time-limited preview links)?

2. **Auto-Publish on Episode Publish:**
   - Should related content auto-publish, or require manual approval?
   - Should there be a "Publish episode + related content" CLI command?

3. **Backward Compatibility:**
   - How long to keep old fields?
   - Should migration be automatic or manual?

4. **Search Engine Indexing:**
   - Should preview content be blocked from search engines (noindex meta tag)?
   - Should draft content be blocked from crawlers?

---

## Next Steps

1. **Review and approve this proposal**
2. **Create `helpers/visibility-helpers.js` with unified logic**
3. **Update one content type as proof-of-concept (start with characters)**
4. **Add preview user support to authentication**
5. **Update dynamic linking to respect visibility**
6. **Create migration script for existing data**
7. **Update all content types to use unified system**

