# Prompt Management Scripts

This document describes the scripts available for managing AI generation prompts in the Wavelength Lore system.

## Overview

The prompt management system includes two main scripts:

1. **prompt-importer.js** - Import markdown files into Firebase
2. **prompt-manager.js** - Interactive CLI for managing prompts

## prompt-importer.js

Import markdown prompt files from `content/prompts/` into Firebase.

### Usage

```bash
# Preview import without writing to Firebase
node scripts/prompt-importer.js --dry-run

# Import new prompts (skip existing)
node scripts/prompt-importer.js

# Import and overwrite existing prompts
node scripts/prompt-importer.js --overwrite

# Show help
node scripts/prompt-importer.js --help
```

### Options

| Option | Description |
|--------|-------------|
| `--dry-run` | Preview import without writing to Firebase |
| `--overwrite` | Overwrite existing prompts (default: skip) |
| `--help`, `-h` | Show help message |

### What It Does

The importer automatically:

1. **Scans Directory Structure**
   - Recursively finds all `.md` files in `content/prompts/`
   - Skips workspace files and non-markdown files

2. **Extracts Metadata**
   - **ID**: Generated from filename (e.g., `andrew.md` → `andrew`)
   - **Title**: Human-readable title from filename (e.g., `golden-hour.md` → `Golden Hour`)
   - **Category**: Determined from directory path:
     - `characters/` or `wavelength/` → `character`
     - `locations/` → `location`
     - `lore/villains/` → `villain`
     - `scenes/` → `scene`
     - Default → `general`

3. **Links to Objects**
   - **Characters**: Detects character names in filename/path
   - **Lore**: Links based on path (e.g., `shire` → `the-shire`)
   - **Episodes**: (Currently manual - will be enhanced)

4. **Extracts Keywords**
   - From filename
   - From common terms in content (e.g., "golden hour", "photorealistic")
   - Character types (e.g., "half-elf", "leprechaun")
   - Musical instruments (e.g., "guitar", "harp", "drums")

5. **Extracts Tags**
   - Scene types (performance, battle, dramatic)
   - Visual styles (magical, realistic)
   - Locations (shire, ice-castle)

6. **Version Detection**
   - Detects "VERSION ONE", "VERSION TWO", etc. in content
   - Sets version number accordingly

### Example Output

```
📝 Prompt Importer
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Source: /path/to/content/prompts

🔍 Scanning for markdown files...
Found 18 markdown files

📖 Parsing markdown files...
Parsed 18 valid prompts

📤 Importing prompts to Firebase
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Imported: characters-andrew - Andrew
✅ Imported: characters-jewel - Jewel
✅ Imported: locations-shire-sanctuary - Shire Sanctuary
⏭️  Skipping lore-goblin-king (already exists)
...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Import Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total files processed: 18
Successfully imported: 17
Skipped (existing):    1
Errors:                0
```

## prompt-manager.js

Interactive CLI for creating, viewing, updating, and deleting prompts.

### Usage

```bash
# Interactive mode
node scripts/prompt-manager.js

# Non-interactive commands
node scripts/prompt-manager.js list
node scripts/prompt-manager.js view andrew-golden-hour
node scripts/prompt-manager.js search "golden hour"

# Show help
node scripts/prompt-manager.js --help
```

### Interactive Mode

The interactive mode provides a menu-driven interface:

```
📝 Prompt Manager - Main Menu
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. List all prompts
2. View prompt
3. Create prompt
4. Update prompt
5. Delete prompt
6. Search prompts
7. List by category
8. List by character
0. Exit
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Menu Options

#### 1. List All Prompts

Displays all prompts with their metadata:

```
📝 Prompts List
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. andrew-golden-hour
   Title: Andrew at Golden Hour
   Category: character
   Characters: andrew
   Lore: the-shire
   Tags: performance, magical

2. shire-sanctuary
   Title: Shire Sanctuary
   Category: location
   Lore: the-shire
   Tags: performance, magical

Total: 2 prompts
```

#### 2. View Prompt

View detailed information about a specific prompt:

```
📄 Viewing Prompt: andrew-golden-hour
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ID: andrew-golden-hour
Title: Andrew at Golden Hour
Category: character
Version: 1
Active: true

Keywords: andrew, golden hour, performance
Tags: performance, magical

Linked Characters: andrew
Linked Episodes: none
Linked Lore: the-shire

Content:
------------------------------------------------------------
A hyper-detailed, photorealistic spring forest at golden hour
transforms into a surreal open field...
------------------------------------------------------------

Created: 2025-01-15T10:30:00Z
Updated: 2025-01-15T10:30:00Z
```

#### 3. Create Prompt

Interactive prompt creation:

```
📝 Create New Prompt
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Prompt ID (e.g., andrew-golden-hour): new-prompt-id
Title: My New Prompt
Category (character/location/scene/villain/general): character
Keywords (comma-separated): andrew, performance, concert
Tags (comma-separated): magical, realistic
Linked Characters (comma-separated IDs): andrew
Linked Episodes (comma-separated IDs):
Linked Lore (comma-separated IDs): the-shire

Enter prompt content (end with a line containing only "END"):
> This is my prompt content...
> It can span multiple lines...
> END

Create this prompt? (y/n): y
✅ Prompt 'new-prompt-id' created successfully!
```

#### 4. Update Prompt

Update existing prompt with current values shown:

```
✏️  Update Prompt: andrew-golden-hour
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Current values shown in [brackets]. Press Enter to keep current value.

Title [Andrew at Golden Hour]:
Category [character]:
Keywords [andrew, golden hour]: andrew, golden hour, spring
Tags [performance, magical]:
Linked Characters [andrew]:
Linked Episodes []: my-lucky-charm
Linked Lore [the-shire]:

Update content? (y/n): n

Save changes? (y/n): y
✅ Prompt 'andrew-golden-hour' updated successfully!
```

#### 5. Delete Prompt

Soft delete (sets `isActive: false`):

```
🗑️  Delete Prompt: andrew-golden-hour
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Title: Andrew at Golden Hour
Category: character

Are you sure you want to delete this prompt? (y/n): y
✅ Prompt 'andrew-golden-hour' deleted (soft delete).
```

#### 6. Search Prompts

Search by keywords, tags, title, or content:

```
🔍 Search Results for "golden hour"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. andrew-golden-hour - Andrew at Golden Hour
   Category: character
   Preview: A hyper-detailed, photorealistic spring forest at golden hour...

Found 1 results.
```

#### 7. List by Category

Filter prompts by category:

```
Enter category: character

(Shows all character prompts)
```

#### 8. List by Character

Filter prompts by linked character:

```
Enter character ID: andrew

(Shows all prompts linked to Andrew)
```

### Non-Interactive Commands

#### List All Prompts

```bash
node scripts/prompt-manager.js list
```

#### View Specific Prompt

```bash
node scripts/prompt-manager.js view andrew-golden-hour
```

#### Search Prompts

```bash
node scripts/prompt-manager.js search "golden hour"
```

## Workflow Examples

### Initial Import

```bash
# 1. Preview what will be imported
node scripts/prompt-importer.js --dry-run

# 2. Import prompts
node scripts/prompt-importer.js

# 3. Verify import
node scripts/prompt-manager.js list
```

### Adding New Prompts

**Option 1: Add markdown file and import**

```bash
# 1. Create new markdown file
echo "My new prompt content" > content/prompts/characters/new-character.md

# 2. Import it
node scripts/prompt-importer.js

# 3. Verify
node scripts/prompt-manager.js view characters-new-character
```

**Option 2: Use interactive manager**

```bash
# 1. Launch manager
node scripts/prompt-manager.js

# 2. Choose option 3 (Create prompt)
# 3. Follow prompts to enter data
```

### Updating Prompts

**Option 1: Update markdown and re-import**

```bash
# 1. Edit markdown file
vim content/prompts/characters/andrew.md

# 2. Re-import with overwrite
node scripts/prompt-importer.js --overwrite

# 3. Verify changes
node scripts/prompt-manager.js view characters-andrew
```

**Option 2: Use interactive manager**

```bash
# 1. Launch manager
node scripts/prompt-manager.js

# 2. Choose option 4 (Update prompt)
# 3. Enter prompt ID
# 4. Update fields as needed
```

### Linking Prompts to Objects

After import, you may want to add links to episodes or additional characters:

```bash
# 1. Launch manager
node scripts/prompt-manager.js

# 2. Choose option 4 (Update prompt)
# 3. Enter prompt ID: andrew-golden-hour
# 4. Add linked episodes: my-lucky-charm
# 5. Save changes
```

### Searching and Filtering

```bash
# Search by keyword
node scripts/prompt-manager.js search "performance"

# List by category
node scripts/prompt-manager.js list
# Then choose option 7 and enter category

# List by character
node scripts/prompt-manager.js list
# Then choose option 8 and enter character ID
```

## Best Practices

1. **Use Dry Run First**: Always preview imports with `--dry-run` before actual import
2. **Consistent Naming**: Use kebab-case for IDs (e.g., `andrew-golden-hour`)
3. **Descriptive Titles**: Make titles human-readable and descriptive
4. **Comprehensive Keywords**: Add keywords that users might search for
5. **Link Objects**: Connect prompts to related characters, episodes, and lore
6. **Version Tracking**: When updating content significantly, increment version
7. **Soft Deletes**: Use delete function (sets `isActive: false`) rather than hard deleting

## Troubleshooting

### Import Issues

**Problem**: Prompts not importing

```bash
# Check Firebase connection
node scripts/prompt-importer.js --dry-run

# Verify file structure
ls -R content/prompts/
```

**Problem**: Wrong metadata extracted

- Check directory structure matches expected pattern
- Verify filename format
- Update importer logic if needed

### Manager Issues

**Problem**: Can't connect to Firebase

```bash
# Check .env file has correct credentials
cat .env | grep FIREBASE

# Test Firebase connection
node -e "require('./helpers/firebase-utils').initializeFirebase('test')"
```

**Problem**: Changes not showing up

```bash
# Clear cache and reload
node -e "require('./helpers/prompt-helpers').clearPromptCache()"
```

## See Also

- [PROMPT_SYSTEM.md](./PROMPT_SYSTEM.md) - Complete system documentation
- [helpers/prompt-helpers.js](../helpers/prompt-helpers.js) - API reference
- [config/database.js](../config/database.js) - Database configuration
