# Prompt CRUD UI Implementation

## Overview

Complete CRUD (Create, Read, Update, Delete) operations for AI Generation Prompts have been implemented in the content edit pages. This allows content managers to manage prompts directly from the character, episode, and lore edit interfaces.

## Features

### 1. **View Prompt Details**
- Click the "👁️ View" button on any linked prompt
- Shows full prompt content, metadata, and relationships
- Displays:
  - Full prompt text
  - Category and tags
  - Keywords
  - Linked characters, episodes, and lore
  - Creation and update timestamps
  - Version number

### 2. **Create New Prompts**
- Click "➕ Create New Prompt" button in the prompts section
- Modal form with fields:
  - Title (required)
  - Prompt Content (required) - The full AI generation prompt text
  - Category (dropdown): general, character, location, scene, villain
  - Keywords (comma-separated)
  - Tags (comma-separated)
- Automatically links the new prompt to the current content being edited
- Auto-generates ID from title (slugified)

### 3. **Edit Existing Prompts**
- Click "✏️ Edit" button on any linked prompt
- Opens same modal as create, pre-populated with existing data
- Save updates to Firebase with version tracking
- Maintains existing relationships

### 4. **Delete Prompts**
- Click "🗑️ Delete" button on any linked prompt
- Confirmation dialog before permanent deletion
- Hard delete removes prompt from database completely
- Automatically removes from all content relationships

### 5. **Link/Unlink Prompts**
- **Link**: Search and click prompts from "Add Existing Prompt" section
- **Unlink**: Click "Unlink" button to remove relationship (keeps prompt, just removes link)
- Search by title, keywords, or tags
- Browse all available prompts

## UI Components

### Prompt Card Display
Each linked prompt shows:
```
┌─────────────────────────────────────────────────────────┐
│ Title                                                    │
│ [Category] [Tag1] [Tag2] [Tag3]                        │
│                                                          │
│ [👁️ View] [✏️ Edit] [Unlink] [🗑️ Delete]             │
└─────────────────────────────────────────────────────────┘
```

### Modal Windows
Two modals implemented:
1. **Create/Edit Modal** - Form for creating or editing prompts
2. **View Modal** - Read-only detailed view of prompt

## API Endpoints

### GET /api/prompts
- Fetch all prompts
- Filters: category, character, episode, lore, tag, search
- Returns: Array of prompt objects

### GET /api/prompts/:id
- Fetch single prompt by ID
- Returns: Prompt object or 404

### POST /api/prompts
- Create new prompt
- Requires: admin or moderator role
- Body: title, content, category, keywords, tags, etc.
- Returns: Created prompt object

### PUT /api/prompts/:id
- Update existing prompt
- Requires: admin or moderator role
- Body: Fields to update
- Returns: Updated prompt object with incremented version

### DELETE /api/prompts/:id?hard=true
- Delete prompt (hard delete by default in UI)
- Requires: admin role
- Query param `hard=true` for permanent deletion
- Returns: Success message

### POST /api/prompts/:id/link
- Add content links to prompt
- Body: `{ contentType, contentId }`
- Automatically called when linking from edit UI

### POST /api/prompts/:id/unlink
- Remove single content link from prompt
- Body: `{ contentType, contentId }`
- Used by "Unlink" button

## Data Structure

```javascript
{
  id: "andrew-golden-hour",
  title: "Andrew at Golden Hour",
  content: "A hyper-detailed, photorealistic spring forest...",
  keywords: ["andrew", "shire", "golden hour", "performance"],
  linkedCharacters: ["andrew"],
  linkedEpisodes: [],
  linkedLore: ["the-shire"],
  category: "character",
  tags: ["performance", "magical"],
  version: 1,
  isActive: true,
  createdAt: "2025-10-20T...",
  updatedAt: "2025-10-20T...",
  createdBy: "user_uid"
}
```

## Access & Permissions

- **View**: All content_manager, admin, super_admin users
- **Create/Edit**: admin or moderator role required
- **Delete**: admin role required
- Authentication via Firebase ID token

## User Experience Flow

### Creating a Prompt
1. Navigate to edit page (e.g., `/edit/character/andrew`)
2. Scroll to "AI Generation Prompts" section
3. Click "➕ Create New Prompt"
4. Fill in title and prompt content (required)
5. Optionally add category, keywords, tags
6. Click "💾 Save Prompt"
7. Prompt automatically linked to current content
8. Modal closes and UI refreshes

### Editing a Prompt
1. Find prompt in linked prompts list
2. Click "✏️ Edit" button
3. Modify fields in modal
4. Click "💾 Save Prompt"
5. Version number increments
6. UI refreshes with updated data

### Viewing Details
1. Click "👁️ View" on any prompt
2. See full content and metadata
3. Click "Close" to return

### Deleting a Prompt
1. Click "🗑️ Delete" button
2. Confirm in dialog
3. Prompt permanently removed
4. UI refreshes to reflect deletion

## Technical Implementation

### Files Modified
- `views/edit-content.ejs` - Added modal HTML and JavaScript functions
- `routes/promptApi.js` - Added `/unlink` endpoint
- `app.js` - Mounted prompt API routes at `/api/prompts`

### Key Functions
```javascript
// In edit-content.ejs
showCreatePromptModal()  // Open create modal
editPrompt(promptId)     // Load prompt for editing
viewPrompt(promptId)     // Show prompt details
deletePrompt(promptId)   // Delete prompt
linkPrompt(promptId)     // Link to current content
unlinkPrompt(promptId)   // Unlink from current content
```

### Styling
- Consistent with existing edit UI
- Modal overlays with backdrop
- Button colors:
  - Create: Green (#4CAF50)
  - View: Teal (#17a2b8)
  - Edit: Yellow (#ffc107)
  - Delete: Red (#dc3545)
  - Unlink: Red (#dc3545)

## Testing URLs

- Character edit: `http://localhost:3001/edit/character/andrew`
- Episode edit: `http://localhost:3001/edit/episode/2/2`
- Lore edit: `http://localhost:3001/edit/lore/the-shire`

## Future Enhancements

Potential improvements:
1. Bulk operations (link multiple prompts at once)
2. Prompt templates/presets
3. Rich text editor for prompt content
4. Image preview from generated content
5. Prompt versioning history viewer
6. Duplicate prompt functionality
7. Export/import prompts
8. Prompt usage analytics (which prompts linked to most content)

## Caching

The prompt helper system includes caching:
- Prompts cached on first load
- Cache cleared automatically on create/update/delete
- Manual cache clear via `/api/cache/bust` endpoint

## Error Handling

- Form validation on required fields
- Authentication checks before operations
- User-friendly error messages
- Console logging for debugging
- Automatic rollback on failures

## Security

- Firebase authentication required
- Role-based access control (RBAC)
- CSRF protection via Firebase ID tokens
- Input sanitization on server
- Admin-only delete operations

---

**Status**: ✅ Fully Implemented and Ready for Use

**Last Updated**: October 20, 2025
