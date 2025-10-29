#!/usr/bin/env node

/**
 * 🎭 WAVELENGTH CHARACTER EXTRACTOR CLI
 *
 * Command-line interface for extracting transparent character PNGs
 */

const path = require('path');
const fs = require('fs');
const { program } = require('commander');
const CharacterExtractor = require('./CharacterExtractor');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

/**
 * Parse command line arguments
 */
function parseArguments() {
  program
    .version('1.0.0')
    .description('🎭 Extract transparent character PNGs from gallery images')
    .requiredOption('-i, --image <path>', 'Path to source image (PNG or JPG)')
    .requiredOption('-d, --description <text>', 'What character/object to extract (e.g., "goblin with crown")')
    .option('-o, --output <filename>', 'Output filename (default: extracted-character.png)')
    .option('-c, --character-id <id>', 'Character identifier for naming (default: extracted-character)')
    .option('--crop', 'Crop to character region before background removal (for background characters)')
    .option('--silent', 'Suppress verbose output')
    .option('--help-example', 'Show usage examples')
    .parse(process.argv);

  return program.opts();
}

/**
 * Show usage examples
 */
function showExamples() {
  console.log(`
🎭 WAVELENGTH CHARACTER EXTRACTOR - EXAMPLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BASIC USAGE (Main focal character):
  npm run wavelength:extract-character -- \\
    --image=/path/to/image.png \\
    --description="goblin with crown"

FOCAL CHARACTER WITH CUSTOM OUTPUT:
  npm run wavelength:extract-character -- \\
    --image=./gallery/characters/goblin.png \\
    --description="goblin face" \\
    --output=goblin_face.png \\
    --character-id=goblin-king

BACKGROUND CHARACTER (with --crop flag):
  npm run wavelength:extract-character -- \\
    --image=./scene.png \\
    --description="wizard in the background" \\
    --crop \\
    --output=wizard_background.png \\
    --character-id=bg-wizard

CROP MODE EXAMPLES:
  # Extract character from left side of image
  npm run wavelength:extract-character -- \\
    --image=./gallery/party_scene.png \\
    --description="elf on the left" \\
    --crop \\
    --character-id=left-elf

  # Extract character from right side of image
  npm run wavelength:extract-character -- \\
    --image=./gallery/party_scene.png \\
    --description="dwarf on the right" \\
    --crop \\
    --character-id=right-dwarf

MULTIPLE CHARACTERS (sequential):
  npm run wavelength:extract-character -- \\
    --image=./characters/goblin.png \\
    --description="goblin" \\
    --character-id=goblin-1

  npm run wavelength:extract-character -- \\
    --image=./characters/wizard.png \\
    --description="wizard with staff" \\
    --crop \\
    --character-id=wizard-1

SILENT MODE (no verbose output):
  npm run wavelength:extract-character -- \\
    --image=image.png \\
    --description="character" \\
    --crop \\
    --silent

GETTING HELP:
  npm run wavelength:extract-character -- --help

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
}

/**
 * Main CLI execution
 */
async function main() {
  try {
    const options = parseArguments();

    // Show examples if requested
    if (options.helpExample) {
      showExamples();
      process.exit(0);
    }

    // Resolve image path (handle both absolute and relative)
    let imagePath = options.image;
    if (!path.isAbsolute(imagePath)) {
      imagePath = path.resolve(process.cwd(), imagePath);
    }

    // Validate that image exists before proceeding
    if (!fs.existsSync(imagePath)) {
      console.error(`\n❌ ERROR: Image file not found`);
      console.error(`   Path: ${imagePath}`);
      console.error(`   Current directory: ${process.cwd()}`);
      process.exit(1);
    }

    // Set defaults
    const outputFilename = options.output || 'extracted-character.png';
    const characterId = options.characterId || 'extracted-character';

    // Create extractor instance
    const extractor = new CharacterExtractor({
      verbose: !options.silent
    });

    // Run extraction
    const result = await extractor.extractCharacter({
      imagePath,
      description: options.description,
      outputFilename,
      characterId,
      crop: options.crop || false
    });

    // Exit with appropriate code
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error(`\n❌ FATAL ERROR: ${error.message}`);
    process.exit(1);
  }
}

// Run CLI
if (require.main === module) {
  main();
}

module.exports = { parseArguments, showExamples };
