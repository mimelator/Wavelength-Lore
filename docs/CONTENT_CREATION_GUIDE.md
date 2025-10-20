# Content Creation Guide

## Overview

The Content Creation feature provides an easy-to-use interface for Content Creators to add new Episodes, Characters, and Lore objects to Wavelength. This feature is restricted to users with the `content_manager` role or higher.

## Access Requirements

**Required Roles:**
- `content_manager`
- `admin`
- `super_admin`

Users with these roles will see a **✨ Create Content** link in the navigation bar after signing in via the Forum.

## Features

### 1. **Easy Content Type Selection**
- Visual cards for selecting Episode, Character, or Lore creation
- Shows current episode counts per season for easy reference
- Clear descriptions for each content type

### 2. **Smart Episode Creation**
- Season selector (1-4) with episode count display
- Automatic suggestion of next episode number
- Required fields: Title, Description
- Optional fields: Keywords, YouTube Link, Audio URL, Image URL
- Keyword management with add/remove functionality
- Duplicate prevention (checks if episode already exists)

### 3. **Character Creation**
- ID validation (lowercase with hyphens only, e.g., "goblin-king")
- Required fields: Character ID, Name/Title, Description
- Optional fields: Primary Image URL
- Duplicate prevention (checks if character ID already exists)
- Automatic integration with character helpers and cache

### 4. **Lore Creation**
- ID validation (lowercase with hyphens only, e.g., "ice-fortress")
- Required fields: Lore ID, Title, Category, Description
- Categories: Place/Location, Thing/Object, Concept/Idea, Event, Group/Organization, Other
- Optional fields: Primary Image URL
- Duplicate prevention (checks if lore ID already exists)
- Automatic integration with lore helpers and cache

## How to Use

### Creating a New Episode

1. Navigate to **Create Content** from the navigation bar
2. Click the **Episode** card
3. Select the season number (displays current episode count)
4. Enter the episode number (suggested number shown)
5. Fill in required fields:
   - **Title**: Episode name (e.g., "My Lucky Charm")
   - **Description**: Brief episode description
6. Add optional fields:
   - **Keywords**: Click "Add" to add keywords (removes duplicates)
   - **YouTube Link**: Full YouTube URL
   - **Audio File URL**: Path to audio file (e.g., `/images/seasons/season1/episodes/episode1/audio.mp3`)
   - **Primary Image URL**: Path to episode image
7. Click **✨ Create Episode**
8. Upon success, you'll be redirected to the edit page to add more details

### Creating a New Character

1. Navigate to **Create Content** from the navigation bar
2. Click the **Character** card
3. Enter the character ID:
   - Must be lowercase
   - Use hyphens for spaces (e.g., "goblin-king" not "Goblin King")
   - Only letters, numbers, and hyphens allowed
4. Fill in required fields:
   - **Name/Title**: Display name (e.g., "Goblin King")
   - **Description**: Character biography and details
5. Add optional field:
   - **Primary Image URL**: Path to character image
6. Click **✨ Create Character**
7. Upon success, you'll be redirected to the edit page to add more details

### Creating a New Lore Object

1. Navigate to **Create Content** from the navigation bar
2. Click the **Lore** card
3. Enter the lore ID:
   - Must be lowercase
   - Use hyphens for spaces (e.g., "ice-fortress" not "Ice Fortress")
   - Only letters, numbers, and hyphens allowed
4. Fill in required fields:
   - **Title**: Lore object name (e.g., "The Ice Fortress")
   - **Category**: Select appropriate category
   - **Description**: Detailed lore description
5. Add optional field:
   - **Primary Image URL**: Path to lore image
6. Click **✨ Create Lore**
7. Upon success, you'll be redirected to the edit page to add more details

## API Endpoints

### POST /api/content/episode
Create a new episode

**Headers:**
```
Authorization: Bearer <Firebase ID Token>
Content-Type: application/json
```

**Body:**
```json
{
  "seasonNumber": "1",
  "episodeNumber": "12",
  "data": {
    "title": "Episode Title",
    "description": "Episode description",
    "keywords": ["keyword1", "keyword2"],
    "youtubeLink": "https://youtu.be/...",
    "audio": "/path/to/audio.mp3",
    "image": "/path/to/image.webp",
    "carouselImages": []
  }
}
```

### POST /api/content/character
Create a new character

**Headers:**
```
Authorization: Bearer <Firebase ID Token>
Content-Type: application/json
```

**Body:**
```json
{
  "characterId": "character-id",
  "data": {
    "title": "Character Name",
    "description": "Character description",
    "primary_image": "/path/to/image.webp",
    "image_gallery": [],
    "episodes": []
  }
}
```

### POST /api/content/lore
Create a new lore object

**Headers:**
```
Authorization: Bearer <Firebase ID Token>
Content-Type: application/json
```

**Body:**
```json
{
  "loreId": "lore-id",
  "data": {
    "title": "Lore Title",
    "description": "Lore description",
    "category": "place",
    "primary_image": "/path/to/image.webp",
    "image_gallery": [],
    "related_episodes": [],
    "related_characters": []
  }
}
```

## Validation & Error Handling

### Episode Validation
- ✅ Season number required (1-4)
- ✅ Episode number required (positive integer)
- ✅ Title and description required
- ❌ Duplicate episode check (prevents overwriting)

### Character Validation
- ✅ Character ID format: `[a-z0-9-]+`
- ✅ Title and description required
- ❌ Duplicate character ID check (prevents overwriting)

### Lore Validation
- ✅ Lore ID format: `[a-z0-9-]+`
- ✅ Title, category, and description required
- ❌ Duplicate lore ID check (prevents overwriting)

## Navigation

**Where to Find Create Content:**

1. **Navigation Bar**: After signing in with appropriate role, **✨ Create Content** appears in header
2. **Edit Pages**: **✨ Create New** button appears in the edit header for quick access
3. **Direct URL**: `/create`

## Cache Management

All content creation operations automatically clear relevant caches:
- **Episodes**: Clears episode cache after creation
- **Characters**: Clears character cache after creation
- **Lore**: Clears lore cache after creation

This ensures newly created content appears immediately in all listings and links.

## Best Practices

### Episode IDs
- Use sequential numbering within seasons
- Check suggested next episode number
- Verify episode doesn't already exist before creating

### Character IDs
- Use descriptive, memorable IDs
- Examples: `goblin-king`, `lucky`, `wavelength`, `misery`
- Avoid numbers unless part of the name

### Lore IDs
- Use clear, descriptive IDs
- Examples: `ice-fortress`, `goblin-rule`, `summer-solstice-bazaar`
- Match the content/concept name

### Content Organization
1. Create basic content via Create page
2. Review auto-redirect to edit page
3. Add detailed information (images, galleries, relationships)
4. Save and verify on live page

## Troubleshooting

### "Access Denied" Error
- Verify you're signed in via Forum
- Check your user role includes `content_manager`, `admin`, or `super_admin`
- Try refreshing the page after signing in

### "Already Exists" Error
- The ID/episode number is already taken
- For episodes: Choose a different episode number
- For characters/lore: Choose a different ID or edit the existing entry

### ID Format Error
- Character/Lore IDs must be lowercase
- Use hyphens instead of spaces
- Only letters, numbers, and hyphens allowed
- Examples: ✅ `goblin-king` ❌ `Goblin King` ❌ `goblin_king`

### Redirect Not Working
- Check browser console for errors
- Verify Firebase authentication is active
- Ensure ID token is valid

## Security

- All endpoints require `content_manager` role or higher
- Firebase authentication required
- ID token validation on every request
- Input sanitization on all fields
- Duplicate prevention to avoid data loss

## Files Modified

- `/routes/contentApi.js` - Added POST endpoints for creation
- `/routes/contentEdit.js` - Added `/create` route
- `/views/create-content.ejs` - New creation UI
- `/views/partials/header.ejs` - Added Create Content navigation link
- `/views/edit-content.ejs` - Added Create New button

## Future Enhancements

- [ ] Bulk episode creation
- [ ] Template-based creation (copy from existing)
- [ ] Image upload during creation (currently URL only)
- [ ] Auto-generate ID from title
- [ ] Preview before creation
- [ ] Draft mode (save without publishing)
