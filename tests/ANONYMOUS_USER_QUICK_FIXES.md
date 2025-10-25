# Anonymous User Test Suite - Quick Fixes

## Overview

This document provides copy-paste code fixes for the 4 failing tests in the anonymous user test suite.

## Fix 1: Merchandise Store Authentication (CRITICAL)

**Issue**: Merchandise store accessible without authentication  
**File**: `routes/merchandise.js`  
**Priority**: 🔴 CRITICAL

### Solution

Add authentication middleware to merchandise routes:

```javascript
// At the top of routes/merchandise.js, add:
const { ensureAuthenticated } = require('../middleware/auth');

// Then wrap the main merchandise route:
router.get('/', ensureAuthenticated, async (req, res) => {
  // existing code...
});
```

### Full Example

```javascript
const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');

// Merchandise store page - REQUIRES AUTHENTICATION
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    res.render('merchandise-store', {
      title: 'Merchandise Store',
      // ... rest of render options
    });
  } catch (error) {
    console.error('Error loading merchandise store:', error);
    res.status(500).send('Error loading merchandise store');
  }
});

// All other routes should also require authentication
router.post('/create-product', ensureAuthenticated, async (req, res) => {
  // existing code...
});

router.delete('/products/:productId', ensureAuthenticated, async (req, res) => {
  // existing code...
});

module.exports = router;
```

## Fix 2: Hide Edit Buttons from Anonymous Users

**Issue**: Edit buttons visible on character/lore pages  
**Files**: `views/character.ejs`, `views/lore.ejs`  
**Priority**: 🟡 MEDIUM

### Solution

Wrap edit buttons in conditional rendering:

```ejs
<!-- In views/character.ejs -->
<% if (locals.isContentCreator) { %>
  <button class="edit-btn" onclick="editCharacter()">
    <i class="fas fa-edit"></i> Edit Character
  </button>
<% } %>

<!-- In views/lore.ejs -->
<% if (locals.isContentCreator) { %>
  <button class="edit-btn" onclick="editLore()">
    <i class="fas fa-edit"></i> Edit Lore
  </button>
<% } %>
```

### Alternative: CSS-Based Hiding

If you prefer to keep the HTML but hide with CSS:

```css
/* In static/css/styles.css */
body:not(.authenticated) .edit-btn,
body:not(.authenticated) .admin-control,
body:not(.authenticated) [data-requires-auth] {
  display: none !important;
}
```

Then add class to body in `views/partials/head.ejs`:

```ejs
<body class="<%= locals.user ? 'authenticated' : '' %>">
```

## Fix 3: Hide Admin Links from Anonymous Users

**Issue**: Admin navigation links visible to anonymous users  
**File**: `views/partials/header.ejs` (or wherever navigation is)  
**Priority**: 🟡 MEDIUM

### Solution

Wrap admin links in conditional rendering:

```ejs
<!-- In views/partials/header.ejs -->
<nav>
  <a href="/">Home</a>
  <a href="/characters">Characters</a>
  <a href="/lore">Lore</a>
  <a href="/about">About</a>
  
  <!-- Admin links - only show to admin users -->
  <% if (locals.userGroups && locals.userGroups.includes('admin')) { %>
    <a href="/admin" class="admin-link">
      <i class="fas fa-cog"></i> Admin
    </a>
  <% } %>
  
  <!-- Content creator links - only show to content creators -->
  <% if (locals.isContentCreator) { %>
    <a href="/create-content" class="creator-link">
      <i class="fas fa-plus"></i> Create
    </a>
  <% } %>
  
  <!-- User-specific links -->
  <% if (locals.user) { %>
    <a href="/user-gallery">My Gallery</a>
    <a href="/merchandise">Store</a>
    <a href="/logout">Logout</a>
  <% } else { %>
    <a href="/login">Login</a>
  <% } %>
</nav>
```

## Fix 4: Navigation Test Timeout

**Issue**: Navigation test times out  
**File**: `tests/anonymous-user-suite.test.js`  
**Priority**: 🟢 LOW

### Solution

Increase timeout or improve wait conditions:

```javascript
async testNavigation() {
  console.log('\n🧭 TEST: Navigation works for anonymous users');
  
  try {
    await this.page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0', timeout: TIMEOUT });
    
    const navLinks = await this.page.$$('nav a, header a');
    if (navLinks.length === 0) {
      throw new Error('No navigation links found');
    }
    
    const charactersLink = await this.page.$('a[href*="/characters"]');
    if (charactersLink) {
      await Promise.all([
        this.page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }),
        charactersLink.click()
      ]);
      
      const url = this.page.url();
      if (!url.includes('/characters')) {
        throw new Error('Navigation did not work correctly');
      }
    }
    
    console.log('✅ Navigation working for anonymous users');
    this.results.passed.push('Navigation works for anonymous users');
    return true;
  } catch (error) {
    console.error('❌ Navigation test failed:', error.message);
    this.results.failed.push({
      test: 'Navigation works for anonymous users',
      error: error.message
    });
    return false;
  }
}
```

## Verification

After applying fixes, run the test suite:

```bash
node tests/anonymous-user-suite.test.js
```

Expected output:
```
✅ PASSED: 16
❌ FAILED: 0
Pass Rate: 100.0% (16/16)
```

## Testing Individual Fixes

### Test Merchandise Authentication

```bash
# Start server
npm start

# In another terminal, test manually
curl -I http://localhost:3001/merchandise
# Should return: 302 Found (redirect to login)
# Or: 401 Unauthorized
```

### Test Edit Button Visibility

1. Open browser in incognito mode
2. Navigate to `http://localhost:3001/characters`
3. Click on any character
4. Verify no edit buttons are visible

### Test Admin Link Visibility

1. Open browser in incognito mode
2. Navigate to `http://localhost:3001/`
3. Check navigation menu
4. Verify no admin links are visible

## Rollback Plan

If fixes cause issues, revert with:

```bash
git checkout HEAD -- routes/merchandise.js
git checkout HEAD -- views/character.ejs
git checkout HEAD -- views/lore.ejs
git checkout HEAD -- views/partials/header.ejs
```

## Additional Considerations

### Development Bypass

Remember that `localhost:3001` triggers development bypass in `middleware/auth.js`. To test true anonymous behavior:

```bash
# Option 1: Test against production
TEST_URL=https://wavelengthlore.com node tests/anonymous-user-suite.test.js

# Option 2: Temporarily disable dev bypass
# Edit middleware/auth.js:
const isDevelopmentBypass = (req) => {
  return false; // Temporarily disable
};
```

### Middleware Order

Ensure authentication middleware is applied BEFORE route handlers:

```javascript
// Correct order in app.js
app.use(firebaseAuth); // Authentication middleware
app.use('/merchandise', merchandiseRoutes); // Protected routes
```

### Error Handling

Add proper error handling for authentication failures:

```javascript
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    // Route logic
  } catch (error) {
    console.error('Error:', error);
    if (error.message.includes('authentication')) {
      return res.redirect('/login');
    }
    res.status(500).send('Server error');
  }
});
```

## Support

If fixes don't resolve issues:

1. Check server logs for errors
2. Verify middleware is loaded correctly
3. Test with browser dev tools open
4. Check `res.locals` values in templates
5. Review authentication middleware configuration

## Success Criteria

All fixes are successful when:
- ✅ Merchandise store redirects to login for anonymous users
- ✅ Edit buttons not visible on character/lore pages
- ✅ Admin links not visible in navigation
- ✅ Navigation test completes without timeout
- ✅ Test suite shows 16/16 passing (100%)
