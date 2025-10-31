# Visibility System Testing Guide

## ✅ Core Tests Passed

The automated test script confirms the unified visibility system is working correctly:
- ✅ Visibility state detection
- ✅ Public user filtering (only published)
- ✅ Content creator access (all content)
- ✅ Preview user access (preview + published)
- ✅ Draft with preview enabled
- ✅ Backward compatibility with old fields

---

## Manual Testing Checklist

### 1. Character Gallery (`/characters`)

**Test as Public User (logged out):**
- [ ] Only see published characters
- [ ] Hidden/draft characters do not appear
- [ ] No "HIDDEN" badges visible

**Test as Content Creator (logged in):**
- [ ] See all characters (published, preview, draft)
- [ ] Hidden/draft characters show "🔒 HIDDEN" badge
- [ ] Can click on hidden characters and view them

**Test as Preview User (if configured):**
- [ ] See published characters
- [ ] See preview characters (if any)
- [ ] See draft characters with `previewEnabled: true`
- [ ] Do NOT see regular draft characters

---

### 2. Individual Character Pages (`/character/{id}`)

**Test as Public User:**
- [ ] Can access published characters: `/character/{published-id}`
- [ ] Gets 404 for draft/preview characters: `/character/{draft-id}`

**Test as Content Creator:**
- [ ] Can access all characters (published, preview, draft)
- [ ] Page loads without 404 errors

**Test as Preview User:**
- [ ] Can access published characters
- [ ] Can access preview characters
- [ ] Can access draft characters with `previewEnabled: true`
- [ ] Gets 404 for regular draft characters

---

### 3. Dynamic Linking in Content

**Test in Character Descriptions:**

1. Create/edit a character with description that mentions:
   - A published character name
   - A draft character name (if you have one)

2. View the character page and check:
   - [ ] Published character name is linked (clickable)
   - [ ] Draft character name is **NOT** linked (plain text) for public users
   - [ ] Draft character name **IS** linked for content creators

**Test in Episode Descriptions:**

1. View an episode page with character mentions
2. Check dynamic linking:
   - [ ] Only published characters get links (public users)
   - [ ] All characters get links (content creators)

---

### 4. Character Navigation

**Test Previous/Next Navigation:**

1. Navigate to a published character
2. Check navigation arrows:
   - [ ] Only navigate to other visible characters (public)
   - [ ] Navigate through all characters including hidden (content creator)

---

### 5. Backward Compatibility

**Test with Old Field Structure:**

Characters in Firebase may still use old fields:
- `published: true/false`
- `visible: true/false`
- `hidden: true/false`

These should still work:
- [ ] Character with `published: true` is visible to public
- [ ] Character with `hidden: true` is hidden from public
- [ ] Character with `visible: false` is hidden from public

---

### 6. Preview User Configuration

**To Test Preview User Access:**

1. **In Firebase Console:**
   - Go to `forum/users/{userId}`
   - Add to user data:
     ```json
     {
       "isPreviewUser": true,
       "groups": ["preview_user"]
     }
     ```

2. **Or add to groups array:**
   ```json
   {
     "groups": ["preview_user", "beta_tester"]
   }
   ```

3. **Create a preview character:**
   - Set `visibility: "preview"` in Firebase
   - Or set `visibility: "draft"` with `previewEnabled: true`

4. **Test access:**
   - Log in as preview user
   - Should see preview characters in gallery
   - Should be able to view preview character pages

---

## Quick Test Scenarios

### Scenario 1: New Draft Character
1. Create a character in Firebase with `visibility: "draft"`
2. **As public user:** Should not appear in gallery or be accessible
3. **As content creator:** Should appear with 🔒 badge and be accessible

### Scenario 2: Preview Character
1. Create a character with `visibility: "preview"`
2. **As public user:** Should not appear
3. **As preview user:** Should appear and be accessible
4. **As content creator:** Should appear and be accessible

### Scenario 3: Draft with Preview Enabled
1. Create character with:
   ```json
   {
     "visibility": "draft",
     "previewEnabled": true
   }
   ```
2. **As public user:** Should not appear
3. **As preview user:** Should appear and be accessible
4. **As content creator:** Should appear and be accessible

### Scenario 4: Legacy Character Migration
1. Find character using old fields: `published: false, hidden: true`
2. Verify it's treated as `visibility: "draft"`
3. Should behave same as new draft characters

---

## Troubleshooting

### Characters Not Filtering Correctly

**Check:**
1. Character cache may need refresh
2. Verify `res.locals.isContentCreator` is set correctly
3. Check browser cache (hard refresh: Cmd+Shift+R)

### Dynamic Links Include Hidden Characters

**Check:**
1. Verify `linkifyCharacterMentionsSync` is receiving user object
2. Check middleware is setting up linking functions correctly
3. Verify visibility helpers are imported correctly

### Preview Users Can't Access Preview Content

**Check:**
1. User has `isPreviewUser: true` or `groups: ["preview_user"]`
2. Character has `visibility: "preview"` or `visibility: "draft"` with `previewEnabled: true`
3. Middleware is setting `res.locals.isPreviewUser` correctly

---

## Test Results Log

Use this to track your testing:

```
Date: ___________
Tester: ___________

Gallery (Public): [ ] Pass [ ] Fail
Gallery (Creator): [ ] Pass [ ] Fail
Individual Pages (Public): [ ] Pass [ ] Fail
Individual Pages (Creator): [ ] Pass [ ] Fail
Dynamic Linking (Public): [ ] Pass [ ] Fail
Dynamic Linking (Creator): [ ] Pass [ ] Fail
Backward Compatibility: [ ] Pass [ ] Fail
Preview User Access: [ ] Pass [ ] Fail

Notes:
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

---

## Next Steps After Testing

Once character visibility is confirmed working:

1. ✅ Characters - **DONE** (currently testing)
2. ⏳ Lore objects - Update to unified system
3. ⏳ Episodes - Update to unified system
4. ⏳ Songs/Radio - Update to unified system
5. ⏳ Home page - Update episode filtering
6. ⏳ Step 7 - Update lore registration to use `visibility` field

