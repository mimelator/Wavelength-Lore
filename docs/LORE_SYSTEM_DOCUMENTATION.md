# Wavelength Lore System Documentation

## Overview
The Lore System provides dynamic linking and reference management for **places, things, concepts, and ideas** throughout the Wavelength universe. It mirrors the Character Reference System functionality, offering Firebase integration, intelligent caching, and automatic content linking.

## 🌟 **What is Lore?**
Lore encompasses all non-character elements of the Wavelength universe:
- **Places**: The Shire, Ice Castle, locations, realms
- **Things**: Magical items, instruments, artifacts
- **Concepts**: Music Magic, Wavelength (the band), philosophies
- **Ideas**: Theories, beliefs, abstract concepts

## 🔥 **Key Features**

### **Dynamic Firebase Integration**
- Real-time data from Firebase `lore/` path
- Automatic category detection (places, things, concepts, ideas)
- 5-minute intelligent caching for performance
- Graceful fallback if database unavailable

### **Automatic Lore Linking**
- Scans text for lore mentions and creates clickable links
- Works in episode summaries, character descriptions, any content
- Combines seamlessly with character linking
- Type-aware styling with color-coded badges

### **Comprehensive Gallery System**
- `/lore` - Main lore gallery with type filtering
- `/lore/{id}` - Individual lore pages with rich content
- Navigation between related lore items
- Responsive image galleries

### **Forum Integration**
- **Create Post Button**: Each lore page includes a "Create a Post about this Lore" button
- **Type-Based Styling**: Button colors match lore type (green for places, purple for concepts, etc.)
- **Smart Prepopulation**: Forum create page auto-fills with lore name, ID, and type
- **Community Discussion**: Enables community discussion about specific lore elements

## 🎯 **Usage Examples**

### **Automatic Lore Linking in Templates**
```html
<!-- Episode summaries with both character and lore linking -->
<section class="summary">
    <h2>Summary</h2>
    <p><%- linkifyLore(linkifyCharacters(summary)) %></p>
</section>

<!-- Character descriptions with lore references -->
<section class="character-description">
    <p><%- linkifyLore(linkifyCharacters(character.description)) %></p>
</section>
```

### **Manual Lore Links**
```html
<!-- Single lore link -->
<%- loreLink('the-shire') %>
<!-- Output: <a href="/lore/the-shire">The Shire</a> -->

<!-- Lore link with custom text -->
<%- loreLink('ice-castle', 'the frozen fortress') %>
<!-- Output: <a href="/lore/ice-castle">the frozen fortress</a> -->
```

### **Processing Text Content**
```html
<!-- Automatic lore detection and linking -->
<p><%- linkifyLore(description) %></p>

<!-- Combined character and lore processing -->
<p><%- linkifyLore(linkifyCharacters(content)) %></p>
```

## 🗂️ **Database Structure**
Expected Firebase structure at `lore/`:
```javascript
{
  "lore": {
    "places": [
      {
        "id": "the-shire",
        "title": "The Shire",
        "description": "A peaceful realm where music flourishes...",
        "type": "place",
        "image": "https://...",
        "image_gallery": ["https://...", "https://..."]
      }
    ],
    "concepts": [
      {
        "id": "music-magic",
        "title": "Music Magic",
        "description": "The mystical power that flows through melodies...",
        "type": "concept",
        "image": "https://..."
      }
    ]
    // ... other categories
  }
}
```

## 🔧 **API Reference**

### **Async Functions (Recommended)**
```javascript
// Get all lore from database
const lore = await loreHelpers.getAllLore();

// Get specific lore item
const loreItem = await loreHelpers.getLoreById('the-shire');

// Get lore by type
const places = await loreHelpers.getLoreByType('place');

// Generate lore link
const link = await loreHelpers.generateLoreLink('ice-castle', 'custom text');

// Process text with lore links
const processed = await loreHelpers.linkifyLoreMentions(text);
```

### **Sync Functions (Template Compatible)**
```javascript
// For EJS templates (immediate access)
const lore = loreHelpers.getAllLoreSync();
const link = loreHelpers.generateLoreLinkSync('the-shire');
const processed = loreHelpers.linkifyLoreMentionsSync(text);
const places = loreHelpers.getLoreByTypeSync('place');
```

### **Template Variables Available**
```javascript
// Available in all EJS templates via middleware
allLore           // Array of all lore items
loreLink()        // Generate lore link function
linkifyLore()     // Process text for lore links
loreHelpers       // Full helper object

// Async versions for routes
getAllLoreAsync()
loreLinkAsync()
linkifyLoreAsync()
```

## 🎨 **Visual Features**

### **Type-Coded Styling**
- **Places**: Green gradient badges and links
- **Things/Objects**: Orange gradient styling  
- **Concepts**: Purple gradient theming
- **Ideas**: Blue gradient appearance

### **Lore Gallery Features**
- Grid-based responsive layout
- Hover effects with image scaling
- Type badges on gallery items
- Search-friendly organization

### **Individual Lore Pages**
- Hero banner with background image
- Type badge prominently displayed
- Related lore connections section
- Image gallery carousel (if available)
- Navigation to previous/next lore items

## 🚀 **Integration with Character System**

### **Seamless Combining**
```html
<!-- Characters and lore together -->
<p><%- linkifyLore(linkifyCharacters(content)) %></p>
```

### **Example Output**
**Input text:**
```
"Prince Andrew learned Music Magic in The Shire and visited the Ice Castle with Jewel."
```

**Processed output:**
```html
<a href="/character/andrew" class="character-link">Prince Andrew</a> learned 
<a href="/lore/music-magic" class="lore-link">Music Magic</a> in 
<a href="/lore/the-shire" class="lore-link">The Shire</a> and visited the 
<a href="/lore/ice-castle" class="lore-link">Ice Castle</a> with 
<a href="/character/jewel" class="character-link">Jewel</a>.
```

## 📁 **Implementation Files**

### **Core Files Created**
1. **`helpers/lore-helpers.js`** - Main lore system with Firebase integration
2. **`views/lore.ejs`** - Individual lore page template  
3. **`views/lore-gallery.ejs`** - Lore gallery with type filtering
4. **`static/css/lore_styles.css`** - Lore-specific styling
5. **`test-lore-system.js`** - Comprehensive test suite

### **Modified Files**
1. **`index.js`** - Added lore routes and middleware
2. **`views/partials/header.ejs`** - Added lore gallery navigation
3. **`views/episode.ejs`** - Added lore linking to summaries
4. **`views/character.ejs`** - Added lore linking to descriptions
5. **`static/css/styles.css`** - Added lore link styling
6. **`views/lore.ejs`** - Added forum integration section with type-based button styling
7. **`routes/forum.js`** - Added lore parameter support for forum post creation
8. **`views/forum/create-post-page.ejs`** - Added lore prepopulation for post creation

## 🗣️ **Forum Integration Details**

### **Lore-to-Forum Flow**
1. **Button Placement**: "Create a Post about this Lore" button on each lore page
2. **Parameter Passing**: `loreName`, `loreId`, and `loreType` passed to forum
3. **Smart Prepopulation**: Title, tags, and content auto-filled based on lore
4. **Type-Based Styling**: Button colors match lore type categories

### **Forum Route Enhancement**
```javascript
// Enhanced forum create route supports lore parameters
router.get('/create', (req, res) => {
  const loreName = req.query.loreName || '';
  const loreId = req.query.loreId || '';
  const loreType = req.query.loreType || '';
  
  // Generate lore-specific suggested content
  if (loreName && loreType) {
    suggestedTitle = `Lore Discussion: ${loreName} (${loreType})`;
  }
});
```

### **CSS Button Styling**
```css
/* Type-based lore forum button colors */
.lore-forum-btn.lore-type-place { background-color: #2e7b32; }
.lore-forum-btn.lore-type-concept { background-color: #7b1fa2; }
.lore-forum-btn.lore-type-thing { background-color: #f57c00; }
.lore-forum-btn.lore-type-idea { background-color: #1976d2; }
```

## 🔄 **Routes Added**

### **Lore Pages**
- **`GET /lore`** - Lore gallery page
- **`GET /lore/:loreId`** - Individual lore page

### **Navigation Integration**
- Added "Lore Gallery" to main navigation
- Lore items have previous/next navigation
- Type-based filtering and organization

## 🎯 **Benefits**

### **For Content Creators**
- **Automatic Updates**: Add lore to database, appears everywhere instantly
- **Rich Linking**: Places, concepts become discoverable and navigable  
- **Type Organization**: Clear categorization of lore elements
- **Visual Appeal**: Professional presentation with type-coded styling

### **For Users**
- **World Building**: Deep exploration of Wavelength universe
- **Easy Discovery**: Click any lore mention to learn more
- **Visual Clarity**: Type badges help understand lore categories
- **Seamless Navigation**: Smooth browsing between related content

### **For Developers**
- **Maintainable**: Centralized lore data management
- **Scalable**: Easy to add new lore types and categories
- **Performance**: Intelligent caching reduces database load
- **Flexible**: Both sync and async APIs available

## 🔧 **Usage Workflow**

### **Adding New Lore**
1. Add lore item to Firebase `lore/{category}/` array
2. Include: `id`, `title`, `description`, `type`, `image`
3. System automatically detects and links mentions
4. Appears in gallery and navigation immediately

### **Template Integration**
```html
<!-- Simple lore linking -->
<%- linkifyLore(content) %>

<!-- Combined with characters -->
<%- linkifyLore(linkifyCharacters(content)) %>

<!-- Manual lore references -->
Learn more about <%- loreLink('music-magic') %> and <%- loreLink('the-shire') %>.
```

### **Styling Customization**
```css
/* Customize lore link appearance */
.lore-link {
    color: #6a4c93;
    border-bottom: 1px dotted #6a4c93;
}

/* Type-specific badge colors */
.type-place { background: linear-gradient(135deg, #4CAF50, #2E7D32); }
.type-concept { background: linear-gradient(135deg, #9C27B0, #4A148C); }
```

## 🧪 **Testing**
Run the lore system test:
```bash
node test-lore-system.js
```

Tests include:
- Async/sync function compatibility
- Link generation and text processing  
- Type filtering and categorization
- Combined character + lore processing
- Cache management and fallback handling

## 🌟 **Future Enhancements**
- **Search functionality** within lore gallery
- **Advanced filtering** by multiple types
- **Lore relationships** between items
- **Timeline integration** for historical lore
- **Interactive maps** for location-based lore

The Lore System provides a comprehensive foundation for building rich, interconnected content that makes the Wavelength universe feel alive and explorable!