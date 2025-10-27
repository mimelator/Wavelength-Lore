

const fs = require('fs/promises');
const path = require('path');
const yaml = require('js-yaml');

// Paths to the data files and directories
const INPUT_JSON_PATH = path.join(__dirname, '../videos-updated.json');
const OUTPUT_DIR_PATH = path.join(__dirname, '../yaml-output');

class WavelengthYamlMerger {
  constructor() {
    this.updatedCount = 0;
  }

  /**
   * Reads and parses the unified videos-updated.json file.
   */
  async readUpdatedJsonData() {
    console.log(`\n📂 Reading updated JSON data from: ${INPUT_JSON_PATH}`);
    try {
      const data = await fs.readFile(INPUT_JSON_PATH, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`❌ Error reading or parsing ${INPUT_JSON_PATH}. Did you run 'lore-import.js' first?`);
      console.error(error.message);
      process.exit(1);
    }
  }

  /**
   * Writes individual season objects back into separate YAML files.
   */
  async writeSeasonYaml(updatedData) {
    console.log('🔄 Starting conversion to YAML files...');
    this.updatedCount = 0;

    // 1. Ensure the output directory exists
    try {
      await fs.mkdir(OUTPUT_DIR_PATH, { recursive: true });
      console.log(`   ✅ Output directory ensured: ${OUTPUT_DIR_PATH}`);
    } catch (error) {
      console.error(`   ❌ Failed to create output directory: ${OUTPUT_DIR_PATH}`, error.message);
      process.exit(1);
    }

    // 2. Iterate through each season key in the updated data
    for (const seasonKey in updatedData) {
      if (updatedData.hasOwnProperty(seasonKey)) {
        const seasonData = updatedData[seasonKey];
        const outputFilename = `${seasonKey}.yaml`;
        const outputPath = path.join(OUTPUT_DIR_PATH, outputFilename);

        try {
          // Dump the season object to a YAML string
          // Note: { indent: 2 } is used for readable YAML formatting
          const yamlString = yaml.dump(seasonData, { indent: 2, lineWidth: -1 });

          // Write the YAML string to the new file
          await fs.writeFile(outputPath, yamlString, 'utf8');
          
          this.updatedCount++;
          console.log(`   ✅ Successfully wrote: ${outputFilename}`);

        } catch (error) {
          console.error(`   ❌ Error writing YAML file for ${outputFilename}:`, error.message);
        }
      }
    }
  }

  /**
   * Main execution function.
   */
  async runMerge() {
    console.log('🌊 WAVELENGTH LORE YAML MERGER (JSON $\rightarrow$ YAML Files)');
    console.log('===========================================================');

    // 1. Read the updated data from JSON
    const updatedData = await this.readUpdatedJsonData();

    // 2. Write individual season YAML files
    await this.writeSeasonYaml(updatedData);

    console.log(`\n🎉 Merge complete! ${this.updatedCount} season YAML files created/updated in: ${OUTPUT_DIR_PATH}`);
  }
}

// CLI execution for the merger
async function main() {
  const merger = new WavelengthYamlMerger();
  await merger.runMerge();
}

if (require.main === module) {
  main().catch(console.error);
}

// --- END OF FILE lore-yaml-merge.js ---