# 📋 Forum Category Management Guide

This comprehensive guide covers how to add, modify, or remove forum categories in the Wavelength Lore community forum.

## 📚 Overview

The forum uses multiple category definitions across different parts of the application. When adding a new category, you need to update several files to ensure consistency across the entire system.

## 🎯 Quick Reference: Current Categories

| ID | Title | Description | Icon | Color |
|----|-------|-------------|------|-------|
| `general` | General Discussion | Talk about Wavelength episodes, characters, and music | 🎵 | #4a47a3 |
| `lore` | Lore & Theories | Dive deep into Wavelength lore, analyze episodes, and share theories | 📜 | #6a4c93 |
| `episodes` | Episode Discussions | Discuss specific episodes, favorite moments, and episode reviews | 🎬 | #e74c3c |
| `fanart` | Fan Creations | Share fan art, music covers, and creative works inspired by Wavelength | 🎨 | #9b59b6 |

## ➕ Adding a New Forum Category

### Step 1: Choose Category Properties

Before adding a category, decide on:
- **ID**: Short, lowercase identifier (e.g., `music`, `theories`, `news`)
- **Title**: Display name (e.g., "Music Discussion", "Fan Theories", "Community News")
- **Description**: Brief explanation of the category's purpose
- **Icon**: Emoji or icon identifier
- **Color**: Hex color code for theming

### Step 2: Backend Routes (`routes/forum.js`)

**Location 1: Category Name Mapping**
```javascript
// Line ~38: Update categoryNames object
const categoryNames = {
    'general': 'General Discussion',
    'lore': 'Lore & Theories',
    'episodes': 'Episode Discussions',
    'fanart': 'Fan Creations',
    'yourcategory': 'Your Category Name'  // ← ADD THIS
};
```

**Location 2: API Categories Endpoint**
```javascript
// Line ~246: Update categories object in /api/categories route
categories: {
    // ... existing categories ...
    yourcategory: {
        id: 'yourcategory',
        title: 'Your Category Name',
        description: 'Description of your category',
        color: '#your-color',
        icon: '🎯',
        iconSvg: '/icons/your-icon.svg'
    }
}
```

### Step 3: Frontend Templates

**Location 1: Create Post Page** (`views/forum/create-post-page.ejs`)
```html
<!-- Line ~88: Add option to category select -->
<option value="yourcategory" <%= defaultCategory === 'yourcategory' ? 'selected' : '' %>>🎯 Your Category Name</option>
```

**Location 2: Popular Posts Page** (`views/forum/popular.ejs`)
```html
<!-- Line ~171: Add to filter dropdown -->
<option value="yourcategory">🎯 Your Category Name</option>
```

```javascript
// Line ~445: Add to categoryIcons object
'yourcategory': '🎯',

// Line ~452: Add to categoryNames object  
'yourcategory': 'Your Category Name',
```

**Location 3: User Profile Page** (`static/js/user-profile.js`)
```html
<!-- Line ~93: Add to favorite category select -->
<option value="yourcategory" ${userData.favoriteCategory === 'yourcategory' ? 'selected' : ''}>🎯 Your Category Name</option>
```

**Location 4: Search Page** (`views/forum/search.ejs`)
```html
<!-- Add to category filter dropdown if present -->
<option value="yourcategory">🎯 Your Category Name</option>
```

**Location 5: Recent Posts Page** (`views/forum/recent.ejs`)
```html
<!-- Add to category filter dropdown if present -->
<option value="yourcategory">🎯 Your Category Name</option>
```

### Step 4: Firebase Database Rules

Update **ALL** Firebase rules files to include the new category:

**Files to Update:**
- `config/firebase-database-rules.json`
- `config/firebase-database-rules-enhanced.json`
- `config/firebase-database-rules-delete-enabled.json`

```json
// Line ~42: Update category validation rule
".validate": "newData.isString() && (newData.val() == 'general' || newData.val() == 'lore' || newData.val() == 'episodes' || newData.val() == 'fanart' || newData.val() == 'yourcategory')"
```

### Step 5: Frontend JavaScript Files

**Location 1: Admin Panel** (`static/js/admin.js`)
```javascript
// Line ~397: Update category filter if needed
if (categoryFilter && categoryFilter !== 'all') {
    // Ensure 'yourcategory' is handled properly
}
```

**Location 2: Forum JavaScript** (`static/js/forum.js`)
No specific updates needed - categories are loaded dynamically from the API.

### Step 6: CSS Styling (Optional)

If your category needs special styling, add CSS rules:

**File: `static/css/forum.css` (or relevant CSS file)**
```css
/* Category-specific styling */
.category-yourcategory {
    background-color: #your-color;
    /* Add specific styles */
}

.category-badge.yourcategory {
    background-color: #your-color;
    color: white;
}
```

### Step 7: Deploy Firebase Rules

After updating the rules files:

1. **Test the rules locally** (if using Firebase emulator)
2. **Deploy to Firebase:**
   ```bash
   firebase deploy --only database
   ```
3. **Verify in Firebase Console** that rules are updated

### Step 8: Testing Checklist

After adding a category, test:

- [ ] **Create Post**: Can select the new category when creating posts
- [ ] **Category Page**: `/forum/category/yourcategory` loads correctly
- [ ] **API Endpoint**: `/forum/api/categories` includes the new category
- [ ] **Filtering**: Posts can be filtered by the new category
- [ ] **User Profiles**: New category appears in favorite category dropdown
- [ ] **Search**: Category filter includes the new option
- [ ] **Firebase Rules**: Posts can be created with the new category
- [ ] **Visual**: Category displays with correct icon and color

## ✏️ Modifying Existing Categories

To modify an existing category:

1. **Change Display Properties**: Update title, description, icon, or color in `routes/forum.js`
2. **Update Templates**: Modify display text in all EJS templates
3. **Update JavaScript**: Change any hardcoded references in JS files
4. **Test Thoroughly**: Ensure all existing posts still display correctly

## ❌ Removing Categories

**⚠️ Warning**: Removing categories requires careful consideration of existing posts.

### Safe Removal Process:

1. **Backup Data**: Export all posts from the category
2. **Migrate Posts**: Move posts to another category or mark as archived
3. **Update Database**: Remove category references from Firebase
4. **Update Code**: Remove from all files listed above
5. **Deploy Rules**: Update Firebase rules to reject the old category
6. **Test**: Ensure no broken links or references remain

### Files to Update When Removing:
- All locations listed in "Adding a New Forum Category" section
- Any hardcoded references in the codebase
- Documentation and help files

## 🔧 Advanced Configuration

### Dynamic Categories

For dynamic category management, consider:

1. **Database-Driven Categories**: Store categories in Firebase instead of hardcoding
2. **Admin Interface**: Create an admin panel for category management
3. **Category Permissions**: Implement role-based category access
4. **Category Analytics**: Track post counts and activity per category

### SEO Considerations

When adding categories:

1. **URL Structure**: Category URLs follow `/forum/category/{id}` pattern
2. **Meta Tags**: Add category-specific meta descriptions
3. **Sitemap**: Include category pages in sitemap.xml
4. **Breadcrumbs**: Ensure proper breadcrumb navigation

## 📝 Example: Adding "Music" Category

Here's a complete example of adding a "Music" category:

### 1. Properties
- **ID**: `music`
- **Title**: "Music Discussion"
- **Description**: "Discuss Wavelength songs, covers, and musical theories"
- **Icon**: 🎼
- **Color**: #f39c12

### 2. Code Changes

**routes/forum.js:**
```javascript
const categoryNames = {
    'general': 'General Discussion',
    'lore': 'Lore & Theories', 
    'episodes': 'Episode Discussions',
    'fanart': 'Fan Creations',
    'music': 'Music Discussion'
};

// In API endpoint:
music: {
    id: 'music',
    title: 'Music Discussion',
    description: 'Discuss Wavelength songs, covers, and musical theories',
    color: '#f39c12',
    icon: '🎼',
    iconSvg: '/icons/music-icon.svg'
}
```

**Templates (add to all category dropdowns):**
```html
<option value="music">🎼 Music Discussion</option>
```

**Firebase Rules:**
```json
".validate": "newData.isString() && (newData.val() == 'general' || newData.val() == 'lore' || newData.val() == 'episodes' || newData.val() == 'fanart' || newData.val() == 'music')"
```

## 🚀 Deployment

After making all changes:

1. **Test Locally**: Verify all functionality works
2. **Commit Changes**: Use git to track all file changes
3. **Deploy Firebase Rules**: `firebase deploy --only database`
4. **Deploy Application**: Use your normal deployment process
5. **Test Production**: Verify category works in production environment

## 📞 Troubleshooting

### Common Issues:

1. **Category Not Appearing**: Check all template files are updated
2. **Firebase Errors**: Verify database rules include the new category
3. **Broken Links**: Ensure category ID is consistent across all files
4. **Styling Issues**: Check CSS classes are properly defined

### Debug Steps:

1. Check browser console for JavaScript errors
2. Verify Firebase rules in the Firebase Console
3. Test API endpoint `/forum/api/categories` directly
4. Check server logs for any error messages

---

*This guide covers all current implementation details as of the latest forum version. Always test changes in a development environment before deploying to production.*