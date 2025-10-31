# Prompt Import Script

This script intelligently imports prompts from the `content/prompts/` directory and matches them to Wavelength content objects.

## Usage

```bash
npm run prompts:import
# or
node scripts/import-prompts.js
```

## What It Does

1. **Scans all markdown files** in `content/prompts/` recursively
2. **Parses prompt files** intelligently:
   - Extracts `VERSION ONE`, `VERSION TWO`, etc.
   - Extracts scene-specific prompts (`DEATH SCENE`, `BATTLE SCENE`, etc.)
   - Extracts default prompts
3. **Matches prompts to content**:
   - Characters: from `wavelength/*.md` files
   - Locations: from `locations/*.md` files  
   - Lore: from `lore/**/*.md` files
4. **Imports from YAML**: Also reads `prompts.yaml` if present
5. **Saves to JSON**: Creates `data/imported-prompts.json` for CLI use

## Output

The script generates:
- **`data/imported-prompts.json`**: Structured JSON file with all imported prompts
- **Console report**: Shows matched/unmatched prompts with counts

## Using Imported Prompts in CLI

Once imported, prompts automatically appear when you:
1. Navigate to a lore/character item: `cd lore daphne-flower`
2. Edit the item: `edit`
3. Generate AI image: Select option `9. 🎨 Generate AI Image`
4. **Your imported prompts will appear first** in the suggested prompts list!

## Prompt Structure

Each prompt file can contain:
- **Default prompts**: Just plain text
- **Versioned prompts**: Marked with `VERSION ONE`, `VERSION TWO`, etc.
- **Scene prompts**: Marked with `SCENE NAME SCENE` (e.g., `DEATH SCENE`)

### Example Structure:

```markdown
VERSION ONE
A detailed description of the character...

VERSION TWO
An improved version with more details...

DEATH SCENE
A dramatic death scene description...
```

## Matching Logic

The script tries to match prompts to content using:
1. **Filename extraction**: `daphne.md` → looks for content ID `daphne`
2. **Content type detection**: Based on directory structure:
   - `wavelength/` → characters
   - `locations/` → locations (in lore collection)
   - `lore/` → lore items
3. **Fuzzy matching**: Tries variations of IDs and titles

## Unmatched Prompts

If prompts don't match automatically, they're saved to the `unmatched` section in the JSON file. You can:
1. Review the unmatched prompts in the console output
2. Check `data/imported-prompts.json` for details
3. Manually match them later by editing the JSON or fixing content IDs

## File Format

The generated JSON structure:
```json
{
  "characters": {
    "alex": {
      "contentId": "alex",
      "filePath": "wavelength/alex.md",
      "prompts": {
        "default": ["prompt text..."],
        "versions": {
          "1": ["version 1 prompt..."],
          "2": ["version 2 prompt..."]
        },
        "scenes": {
          "death": ["death scene prompt..."]
        }
      },
      "match": {
        "contentType": "character",
        "item": { /* matched content object */ },
        "confidence": "high"
      }
    }
  },
  "locations": { /* ... */ },
  "lore": { /* ... */ },
  "unmatched": [ /* prompts that couldn't be matched */ ]
}
```

## Tips

- **Import regularly**: Re-run after adding new prompt files
- **Review unmatched**: Check unmatched prompts and fix IDs if needed
- **Prioritized in CLI**: Imported prompts appear first in AI generation suggestions
- **Multiple versions**: All versions are preserved and available

