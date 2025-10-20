# Prompt Management System

## Overview

The Prompt Management System allows you to manage AI generation prompts that are linked to Episodes, Characters, and Lore items in the Wavelength universe. Prompts are stored in Firebase and cached for performance, following the same pattern as other content types.

## Data Model

### Prompt Object Structure

```javascript
{
  id: string,                    // Unique identifier (e.g., 'andrew-golden-hour')
  title: string,                 // Human-readable title (e.g., 'Andrew at Golden Hour')
  keywords: string[],            // Array of searchable keywords
  content: string,               // The markdown/text content of the prompt

  // Relationships (many-to-many)
  linkedCharacters: string[],    // Array of character IDs (e.g., ['andrew', 'jewel'])
  linkedEpisodes: string[],      // Array of episode IDs (e.g., ['my-lucky-charm'])
  linkedLore: string[],          // Array of lore IDs (e.g., ['the-shire'])

  // Metadata
  category: string,              // 'character' | 'location' | 'scene' | 'villain' | 'general'
  tags: string[],                // Additional tags for organization
  version: number,               // Version number for tracking changes
  isActive: boolean,             // Soft delete flag (default: true)

  // Timestamps
  createdAt: string,             // ISO timestamp
  updatedAt: string              // ISO timestamp
}
```

## Firebase Schema

### Database Structure

```
wavelength-lore/
  prompts/
    {promptId}/
      id: "andrew-golden-hour"
      title: "Andrew at Golden Hour"
      keywords: ["andrew", "shire", "golden hour", "performance"]
      content: "A hyper-detailed, photorealistic..."
      linkedCharacters: ["andrew"]
      linkedEpisodes: ["my-lucky-charm"]
      linkedLore: ["the-shire"]
      category: "character"
      tags: ["performance", "magical"]
      version: 1
      isActive: true
      createdAt: "2025-01-15T10:30:00Z"
      updatedAt: "2025-01-15T10:30:00Z"
```

## Usage Examples

### Async API (Recommended)

```javascript
const promptHelpers = require('./helpers/prompt-helpers');

// Get a specific prompt
const prompt = await promptHelpers.getPromptById('andrew-golden-hour');

// Get all prompts for a character
const andrewPrompts = await promptHelpers.getPromptsByCharacter('andrew');

// Get all prompts for an episode
const episodePrompts = await promptHelpers.getPromptsByEpisode('my-lucky-charm');

// Get all prompts for a lore item
const shirePrompts = await promptHelpers.getPromptsByLore('the-shire');

// Get prompts by category
const characterPrompts = await promptHelpers.getPromptsByCategory('character');
const locationPrompts = await promptHelpers.getPromptsByCategory('location');

// Search prompts
const results = await promptHelpers.searchPrompts('golden hour');

// Get prompts by tag
const magicalPrompts = await promptHelpers.getPromptsByTag('magical');

// Get all categories and tags
const categories = await promptHelpers.getPromptCategories();
const tags = await promptHelpers.getPromptTags();

// Generate a link to a prompt
const link = await promptHelpers.generatePromptLink('andrew-golden-hour');
// Returns: <a href="/prompt/andrew-golden-hour" class="prompt-link">Andrew at Golden Hour</a>
```

### Sync API (For EJS Templates)

```javascript
// In EJS templates or routes
const prompt = promptHelpers.getPromptByIdSync('andrew-golden-hour');
const characterPrompts = promptHelpers.getPromptsByCharacterSync('andrew');
const episodePrompts = promptHelpers.getPromptsByEpisodeSync('my-lucky-charm');
const lorePrompts = promptHelpers.getPromptsByLoreSync('the-shire');
const categoryPrompts = promptHelpers.getPromptsByCategorySync('character');
const searchResults = promptHelpers.searchPromptsSync('golden hour');
```

### EJS Template Usage

```ejs
<!-- Display prompts for a character -->
<% const characterPrompts = getPromptsByCharacterSync('andrew') %>
<% if (characterPrompts.length > 0) { %>
  <h3>AI Generation Prompts</h3>
  <ul>
    <% characterPrompts.forEach(prompt => { %>
      <li>
        <a href="<%= prompt.url %>"><%= prompt.title %></a>
        <p><%= prompt.content.substring(0, 100) %>...</p>
      </li>
    <% }) %>
  </ul>
<% } %>
```

## Categories

The system supports the following prompt categories:

- **character**: Character-specific prompts (portraits, poses, expressions)
- **location**: Location/setting prompts (scenes, environments)
- **scene**: Scene prompts (events, moments)
- **villain**: Villain-specific prompts
- **general**: General/uncategorized prompts

## File Organization

### Content Directory Structure

```
content/prompts/
├── characters/           # Character-specific prompts
│   ├── andrew.md
│   ├── jewel.md
│   ├── alex.md
│   ├── eloquence.md
│   ├── daphne.md
│   ├── lucky.md
│   ├── maurice.md
│   └── yeti.md
├── locations/           # Location-based prompts
│   ├── shire-sanctuary.md
│   ├── shire-evening-amphitheater.md
│   ├── shire-wooden-amphitheater.md
│   ├── ruins-of-the-shire.md
│   └── icefortress.md
├── lore/               # Lore/villain prompts
│   └── villains/
│       └── goblin-king.md
└── scenes/             # General scene prompts
    └── (future scenes)
```

## API Reference

### Core Functions

#### `getPromptById(id)` / `getPromptByIdSync(id)`
Get a single prompt by its ID.

**Parameters:**
- `id` (string): Prompt ID

**Returns:** Promise<Prompt> or Prompt (sync) or null if not found

#### `getPromptsByCharacter(characterId)` / `getPromptsByCharacterSync(characterId)`
Get all prompts linked to a specific character.

**Parameters:**
- `characterId` (string): Character ID

**Returns:** Promise<Prompt[]> or Prompt[] (sync)

#### `getPromptsByEpisode(episodeId)` / `getPromptsByEpisodeSync(episodeId)`
Get all prompts linked to a specific episode.

**Parameters:**
- `episodeId` (string): Episode ID

**Returns:** Promise<Prompt[]> or Prompt[] (sync)

#### `getPromptsByLore(loreId)` / `getPromptsByLoreSync(loreId)`
Get all prompts linked to a specific lore item.

**Parameters:**
- `loreId` (string): Lore ID

**Returns:** Promise<Prompt[]> or Prompt[] (sync)

#### `getPromptsByCategory(category)` / `getPromptsByCategorySync(category)`
Get all prompts in a specific category.

**Parameters:**
- `category` (string): Category name

**Returns:** Promise<Prompt[]> or Prompt[] (sync)

#### `getPromptsByTag(tag)` / `getPromptsByTagSync(tag)`
Get all prompts with a specific tag.

**Parameters:**
- `tag` (string): Tag name

**Returns:** Promise<Prompt[]> or Prompt[] (sync)

#### `searchPrompts(query)` / `searchPromptsSync(query)`
Search prompts by keywords, tags, title, or content.

**Parameters:**
- `query` (string): Search query

**Returns:** Promise<Prompt[]> or Prompt[] (sync)

#### `getAllPrompts()` / `getAllPromptsSync()`
Get all active prompts.

**Returns:** Promise<Prompt[]> or Prompt[] (sync)

#### `getPromptCategories()` / `getPromptCategoriesSync()`
Get list of all unique categories.

**Returns:** Promise<string[]> or string[] (sync)

#### `getPromptTags()` / `getPromptTagsSync()`
Get list of all unique tags.

**Returns:** Promise<string[]> or string[] (sync)

#### `generatePromptLink(id, customText)` / `generatePromptLinkSync(id, customText)`
Generate HTML link to a prompt.

**Parameters:**
- `id` (string): Prompt ID
- `customText` (string, optional): Custom link text

**Returns:** Promise<string> or string (sync) - HTML link element

### Cache Management

#### `initializePromptCache()`
Initialize the prompt cache with data from Firebase.

**Returns:** Promise<void>

#### `clearPromptCache()`
Clear the prompt cache (useful for testing or forced refresh).

**Returns:** void

## Integration with Existing Objects

### In Character Pages

```javascript
// routes/content.js - Character route
router.get('/character/:id', async (req, res) => {
  const character = await characterHelpers.getCharacterById(req.params.id);
  const prompts = await promptHelpers.getPromptsByCharacter(req.params.id);

  res.render('character', { character, prompts });
});
```

### In Episode Pages

```javascript
// routes/content.js - Episode route
router.get('/season/:season/episode/:episode', async (req, res) => {
  const episode = await episodeHelpers.getEpisodeById(episodeId);
  const prompts = await promptHelpers.getPromptsByEpisode(episodeId);

  res.render('episode', { episode, prompts });
});
```

### In Lore Pages

```javascript
// routes/content.js - Lore route
router.get('/lore/:id', async (req, res) => {
  const lore = await loreHelpers.getLoreById(req.params.id);
  const prompts = await promptHelpers.getPromptsByLore(req.params.id);

  res.render('lore', { lore, prompts });
});
```

## Best Practices

1. **Use Async Functions**: Prefer async versions (`getPromptById`) over sync versions in routes and controllers
2. **Cache Management**: The system automatically caches prompts. Use `clearPromptCache()` only when needed
3. **Soft Deletes**: Use `isActive: false` instead of deleting prompts to maintain referential integrity
4. **Version Tracking**: Increment `version` number when updating prompt content
5. **Keywords**: Include comprehensive keywords for better search functionality
6. **Tags**: Use tags for organization and filtering (e.g., 'performance', 'magical', 'battle')

## Next Steps

See [PROMPT_SCRIPTS.md](./PROMPT_SCRIPTS.md) for information about:
- Importing existing markdown files to Firebase
- Managing prompts via CLI
- Validating prompt data
- Batch operations
