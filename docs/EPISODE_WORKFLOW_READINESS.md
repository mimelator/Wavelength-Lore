# Episode Workflow Readiness Assessment: s5e1 "Mystic Druids"

## ✅ What You CAN Do Right Now

### 1. **Episode Creation & Editing** ✅
```bash
# Create new episode (hidden by default)
wavelength> episodes create "Mystic Druids" --season=5 --episode=1

# Edit existing episode interactively
wavelength> episodes edit s5e1 --interactive
```

**Available Text Fields:**
- ✅ Title
- ✅ Description  
- ✅ Keywords (comma-separated)
- ✅ Characters (comma-separated IDs)
- ✅ YouTube Link
- ✅ Published/Hidden status

### 2. **Image Management** ✅
```bash
# From interactive edit menu (option 8):
# - Add image URLs
# - Remove images
# - Preview all images
# - Validate image accessibility
# - Upload image files from disk
# - Generate AI images (option 9 → option 9)
```

**Image Operations:**
- ✅ Add/remove images from gallery
- ✅ Upload local image files to S3
- ✅ Generate AI images from prompts
- ✅ Preview images in browser
- ✅ Validate image URLs
- ✅ Set primary image

### 3. **Hidden/Visibility Management** ✅
- ✅ Episodes created with `published: false` stay hidden
- ✅ Can toggle visibility in interactive edit (option 6: Published)
- ✅ Hidden episodes only visible to content creators
- ✅ Public users won't see until `published: true`

---

## ⚠️ What's PARTIALLY Available

### 4. **Song/Music Attachment** ⚠️
**Status:** Song upload exists but NOT integrated into episode editing workflow

**What Exists:**
- ✅ `cli/steps/song-upload.js` - Song upload step exists
- ✅ `services/firebase-songs-service.js` - Songs service fully functional
- ✅ Songs can be created independently: `songs create "Title" --episode=s5e1`

**What's Missing:**
- ❌ No direct "Attach Song" option in `episodes edit --interactive` menu
- ❌ Song upload step is part of episode creation pipeline but not episode editing

**Workaround:**
```bash
# Option 1: Create song separately and link to episode
wavelength> songs create "Mystic Druids Song" --episode=s5e1 --duration="3:45"

# Option 2: Use the episode creation pipeline for initial song upload
npm run episode:create  # Then choose "Continue Existing Episode" → s5e1 → Step 2
```

---

## ❌ What's NOT Available

### 5. **Episode-Specific Story Text Fields** ❌
**Missing Fields:**
- ❌ `story` field (full episode narrative text)
- ❌ `summary` field
- ❌ `transcript` field
- ❌ Multi-paragraph text editing in CLI

**What You Can Do:**
- ✅ Edit `description` field (but it's single-line input)
- ⚠️ Use web UI (`/edit-content/episode/s5e1`) for rich text editing

### 6. **Integrated Workflow** ❌
**Missing:**
- ❌ No unified "Episode Editor" that combines all steps
- ❌ Song upload requires switching between CLI tools
- ❌ Asset extraction exists but not in main edit workflow
- ❌ Lore registration exists but not in main edit workflow

---

## 🎯 Recommendation: What to Build Next

### Priority 1: Add Song Attachment to Episode Edit Menu
**Quick Win:** Add option 11 "🎵 Attach/Upload Song" to `interactiveEpisodeEdit()` menu
- Integrate `SongUploadStep` into episode editing
- Allow selecting existing song or uploading new one
- Link song to episode automatically

### Priority 2: Add Story/Text Fields
**Medium Effort:** Add multi-line text editing support
- Add `story` field to editable fields
- Use file-based input for long text (like prompts)
- Store in episode data model

### Priority 3: Create Unified Episode Editor
**Long Term:** Build `episodes edit s5e1 --full` workflow
- Combine all steps: metadata → images → song → assets → lore
- Guided workflow similar to creation pipeline
- Progress tracking within edit session

---

## ✅ Current Workflow Summary

**To work on s5e1 "Mystic Druids" RIGHT NOW:**

1. **Create/Edit Episode:**
   ```bash
   wavelength> episodes edit s5e1 --interactive
   ```
   - Edit title, description, keywords, characters
   - Manage images (upload, AI generate, preview)
   - Toggle visibility (keep `published: false`)

2. **Attach Song (Workaround):**
   ```bash
   wavelength> songs create "Mystic Druids" --episode=s5e1 --duration="3:45"
   # Or use: npm run episode:create → Continue Existing → s5e1 → Step 2
   ```

3. **Add Images:**
   - From edit menu: Option 8 → Upload or generate images
   - Images automatically stored in S3
   - Gallery persists to Firebase on save

4. **Iterate:**
   - Edit metadata anytime
   - Add more images as needed
   - Keep `published: false` until ready

---

## ✅ Conclusion

**YOU CAN START WORKING ON s5e1 NOW** with these limitations:
- ✅ Core episode editing works
- ✅ Image management works  
- ✅ Hidden/published status works
- ⚠️ Song attachment requires workaround
- ❌ No `story` field in CLI (use web UI or wait)

**Recommendation:** Start iterating now! The song attachment can be handled via workaround, and `story` field can be added to web UI or later CLI enhancement.

