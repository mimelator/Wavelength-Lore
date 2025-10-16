# Character Reference System

## Overview
This system provides automatic character linking throughout the Wavelength Lore website. It can be used in episode summaries, character descriptions, and any other content where character names are mentioned.

## Character List
The system includes the following characters:

- **Prince Andrew** (`andrew`) - The leader of Wavelength
- **Jewel** (`jewel`) - Prince Andrew's wife and mother of Alexandria and Eloquence
- **Alexandria** (`alex`) - Daughter of Prince Andrew and Jewel
- **Eloquence** (`eloquence`) - Son of Prince Andrew and Jewel
- **Daphne** (`daphne`) - The prodigy drummer who joins Wavelength
- **Lucky** (`lucky`) - The Leprechaun with golden advice
- **Yeti** (`yeti`) - The clumsy but caring nurse
- **Maurice** (`maurice`) - The Percussion Wizard (deceased)

## How to Use

### Automatic Character Linking
The system automatically converts character names in text to clickable links. For example:

**Input text:**
```
"Prince Andrew and Jewel formed the band Wavelength with their children Alexandria and Eloquence."
```

**Output:**
"[Prince Andrew](/character/andrew) and [Jewel](/character/jewel) formed the band Wavelength with their children [Alexandria](/character/alex) and [Eloquence](/character/eloquence)."

### Manual Character Links
You can also create manual character links using the helper function:

**In EJS templates:**
```html
<!-- Single character link -->
<%- characterLink('andrew') %>
<!-- Output: <a href="/character/andrew">Prince Andrew</a> -->

<!-- Character link with custom text -->
<%- characterLink('andrew', 'the Prince') %>
<!-- Output: <a href="/character/the Prince">Prince Andrew</a> -->
```

### Processing Text Content
For text content that may contain character names:

**In EJS templates:**
```html
<!-- Process summary text for character links -->
<p><%- linkifyCharacters(summary) %></p>

<!-- Process character description -->
<p><%- linkifyCharacters(character.description) %></p>
```

## Implementation

### Files Modified/Created:
1. **`helpers/character-helpers.js`** - Core character data and helper functions
2. **`views/partials/character-references.ejs`** - EJS partial with character reference functions
3. **`index.js`** - Updated to include character helpers in all templates
4. **`views/character.ejs`** - Updated to use character linking
5. **`views/episode.ejs`** - Updated to use character linking in summaries
6. **`static/css/styles.css`** - Added styles for character links

### Available Functions:
- `characterLink(id, customText)` - Generate a character link
- `linkifyCharacters(text)` - Automatically link character names in text
- `allCharacters` - Array of all characters with IDs, names, and URLs

## Usage Examples

### Episode Summary
```html
<section class="summary">
    <h2>Summary</h2>
    <p><%- linkifyCharacters(summary) %></p>
</section>
```

### Character Description
```html
<section class="character-description">
    <p><%- linkifyCharacters(character.description) %></p>
</section>
```

### Manual References
```html
<p>The leader of the band is <%- characterLink('andrew') %>, and the drummer is <%- characterLink('daphne', 'young Daphne') %>.</p>
```

## CSS Classes
The system includes styled CSS classes:
- `.character-link` - Basic character link styling
- `.character-connection-link` - Styled buttons for character connections
- `.character-connections` - Container for character connection sections

## Benefits
1. **Consistent Navigation** - Users can easily navigate between character pages
2. **Automatic Updates** - Character links are automatically generated and maintained
3. **SEO Friendly** - Improves internal linking and site structure
4. **User Experience** - Makes content more interactive and connected
5. **Maintainable** - Centralized character data makes updates easy