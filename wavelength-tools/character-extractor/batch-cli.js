#!/usr/bin/env node

/**
 * 🎭 BATCH CHARACTER EXTRACTOR CLI
 *
 * Extract multiple characters using a CSV config file
 */

const path = require('path');
const fs = require('fs');
const { program } = require('commander');
const BatchExtractor = require('./batch-extractor');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

/**
 * Parse command line arguments
 */
function parseArguments() {
  program
    .version('1.0.0')
    .description('🎭 Extract multiple characters from a CSV config file')
    .requiredOption('-c, --config <path>', 'Path to CSV config file')
    .option('--manifest <path>', 'Save results to manifest file (default: batch-manifest.json)')
    .option('--silent', 'Suppress verbose output')
    .option('--sample-config', 'Create a sample config file')
    .parse(process.argv);

  return program.opts();
}

/**
 * Create a sample CSV config file
 */
function createSampleConfig() {
  const samplePath = path.join(process.cwd(), 'character-extractions.csv');

  const sampleContent = `# Wavelength Character Extraction Config
# Format: imagePath,description,characterId,outputName,crop
# crop: true/false or 1/0

# Focal characters (no crop needed)
public/upscaled-images/upscaled-4fdbYxJHjEP4xksk9sgFE3lgYUs2-1761592747982.jpg,elf character singing,focal-elf-1,focal_elf_1.png,false
public/upscaled-images/upscaled-4fdbYxJHjEP4xksk9sgFE3lgYUs2-1761593535934.jpg,elf with guitar,elf-guitarist,elf_guitarist.png,false

# Background characters (use crop)
IceBlueGreed-19.png,goblin peeking from tree right side,sneaky-goblin,sneaky_goblin.png,true

# Multiple characters from same scene
party_scene.jpg,elf on the left,left-elf,left_elf.png,true
party_scene.jpg,dwarf on the right,right-dwarf,right_dwarf.png,true
`;

  fs.writeFileSync(samplePath, sampleContent);
  console.log(`\n✅ Sample config created: ${samplePath}`);
  console.log(`\n📝 Format: imagePath,description,characterId,outputName,crop`);
  console.log(`\n   Edit the file and run:`);
  console.log(`   npm run wavelength:extract-batch -- --config=${samplePath}`);
  process.exit(0);
}

/**
 * Main CLI execution
 */
async function main() {
  try {
    const options = parseArguments();

    // Create sample if requested
    if (options.sampleConfig) {
      createSampleConfig();
    }

    // Validate config file
    if (!fs.existsSync(options.config)) {
      console.error(`\n❌ ERROR: Config file not found`);
      console.error(`   Path: ${options.config}`);
      console.error(`   Current directory: ${process.cwd()}`);
      console.error(`\n💡 Create a sample config with:`);
      console.error(`   npm run wavelength:extract-batch -- --sample-config`);
      process.exit(1);
    }

    // Create batch extractor
    const batchExtractor = new BatchExtractor(!options.silent);

    // Load and process config
    const configs = batchExtractor.loadConfigFromCSV(options.config);

    if (configs.length === 0) {
      console.error(`\n❌ No valid extraction configs found in: ${options.config}`);
      process.exit(1);
    }

    // Process batch
    const results = await batchExtractor.processBatch(configs);

    // Save manifest
    const manifestPath = options.manifest || path.join(process.cwd(), 'batch-manifest.json');
    batchExtractor.saveManifest(manifestPath);

    // Print summary
    batchExtractor.printSummary();

    // Exit with appropriate code
    process.exit(results.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error(`\n❌ FATAL ERROR: ${error.message}`);
    process.exit(1);
  }
}

// Run CLI
if (require.main === module) {
  main();
}

module.exports = { parseArguments, createSampleConfig };
