#!/usr/bin/env node

/**
 * Import Prompts Script
 * 
 * Intelligently imports prompts from content/prompts/ directory
 * and matches them to Wavelength content objects (lore, characters, locations).
 * 
 * Handles:
 * - Multiple versions (VERSION ONE, VERSION TWO)
 * - Scene-specific prompts (DEATH SCENE, etc.)
 * - Content type matching (characters, locations, lore items)
 * - ID extraction from filenames and content
 */

const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');

// Optional YAML support
let yaml = null;
try {
    yaml = require('js-yaml');
} catch (e) {
    // YAML not available, will skip yaml file
}

class PromptImporter {
    constructor() {
        this.promptsDir = path.join(__dirname, '../content/prompts');
        this.importedPrompts = {
            characters: new Map(),
            locations: new Map(),
            lore: new Map(),
            unmatched: []
        };
        
        // Content lookup helpers (will be loaded)
        this.loreHelper = null;
        this.characterHelper = null;
    }

    /**
     * Load content helpers
     */
    async loadHelpers() {
        try {
            this.loreHelper = require('../helpers/lore-helpers');
            this.characterHelper = require('../helpers/character-helpers');
        } catch (error) {
            console.log(chalk.yellow('⚠️  Some helpers not available (this is okay)'));
        }
    }

    /**
     * Extract content ID from filename
     */
    extractIdFromFilename(filePath) {
        const filename = path.basename(filePath, '.md');
        const dir = path.dirname(filePath);
        const relativePath = path.relative(this.promptsDir, dir);
        
        // Handle different directory structures
        if (relativePath.startsWith('wavelength/')) {
            // Character files: wavelength/daphne.md -> daphne
            return filename;
        } else if (relativePath.startsWith('locations/')) {
            // Location files: locations/shire-sanctuary.md -> locations-shire-sanctuary or shire-sanctuary
            return filename;
        } else if (relativePath.startsWith('lore/')) {
            // Lore files: lore/villains/goblin-king.md -> goblin-king
            const subPath = path.relative(path.join(this.promptsDir, 'lore'), dir);
            if (subPath && subPath !== '.') {
                return `${subPath.replace(/\//g, '-')}-${filename}`;
            }
            return filename;
        }
        
        return filename;
    }

    /**
     * Parse prompt file content intelligently
     */
    parsePromptFile(content, filePath) {
        const prompts = {
            default: [],
            versions: {},
            scenes: {}
        };

        // Split by common section markers
        const sections = content.split(/(?=^[A-Z][A-Z\s]+\s*$)/m).filter(s => s.trim());
        
        let currentSection = 'default';
        let currentVersion = null;
        let currentScene = null;

        sections.forEach(section => {
            const trimmed = section.trim();
            if (!trimmed) return;

            // Check for VERSION markers
            const versionMatch = trimmed.match(/^VERSION\s+(ONE|TWO|THREE|FOUR|1|2|3|4)/i);
            if (versionMatch) {
                const versionKey = versionMatch[1].toLowerCase().replace('one', '1').replace('two', '2').replace('three', '3').replace('four', '4');
                currentVersion = versionKey;
                currentSection = 'versions';
                const promptText = trimmed.replace(/^VERSION\s+[^\n]+\n*/i, '').trim();
                if (promptText) {
                    if (!prompts.versions[versionKey]) {
                        prompts.versions[versionKey] = [];
                    }
                    prompts.versions[versionKey].push(promptText);
                }
                return;
            }

            // Check for SCENE markers (DEATH SCENE, BATTLE SCENE, etc.)
            const sceneMatch = trimmed.match(/^([A-Z\s]+)\s+SCENE\s*$/i);
            if (sceneMatch) {
                currentScene = sceneMatch[1].trim().toLowerCase().replace(/\s+/g, '-');
                currentSection = 'scenes';
                return;
            }

            // Extract prompt text
            const promptText = trimmed.replace(/^(VERSION|SCENE|DEATH|BATTLE)[^\n]*\n*/i, '').trim();
            if (!promptText) return;

            if (currentSection === 'versions' && currentVersion) {
                if (!prompts.versions[currentVersion]) {
                    prompts.versions[currentVersion] = [];
                }
                prompts.versions[currentVersion].push(promptText);
            } else if (currentSection === 'scenes' && currentScene) {
                if (!prompts.scenes[currentScene]) {
                    prompts.scenes[currentScene] = [];
                }
                prompts.scenes[currentScene].push(promptText);
            } else {
                prompts.default.push(promptText);
            }
        });

        // If no sections found, treat entire content as default prompt
        if (prompts.default.length === 0 && 
            Object.keys(prompts.versions).length === 0 && 
            Object.keys(prompts.scenes).length === 0) {
            prompts.default.push(content.trim());
        }

        return prompts;
    }

    /**
     * Find matching content object for a prompt
     */
    async findMatchingContent(contentId, filePath) {
        const relativePath = path.relative(this.promptsDir, filePath);
        let contentType = null;
        let matchedItem = null;

        // Determine content type from directory structure
        if (relativePath.startsWith('wavelength/')) {
            contentType = 'character';
            // Try to find character
            try {
                matchedItem = this.characterHelper?.getCharacterByIdSync(contentId);
                if (!matchedItem) {
                    // Try variations
                    matchedItem = this.characterHelper?.getCharacterByIdSync(contentId.toLowerCase());
                }
            } catch (e) {
                // Helper not available
            }
        } else if (relativePath.startsWith('locations/')) {
            contentType = 'location';
            // Locations are usually in lore with "location" type
            try {
                // Try different ID formats
                const possibleIds = [
                    contentId,
                    `locations-${contentId}`,
                    contentId.replace(/-/g, ' '),
                    contentId.replace(/shire-/, '')
                ];
                
                for (const id of possibleIds) {
                    matchedItem = this.loreHelper?.getLoreByIdSync(id);
                    if (matchedItem && matchedItem.type === 'location' || matchedItem.type === 'place') {
                        break;
                    }
                }
            } catch (e) {
                // Helper not available
            }
        } else if (relativePath.startsWith('lore/')) {
            contentType = 'lore';
            // Try to find lore item
            try {
                matchedItem = this.loreHelper?.getLoreByIdSync(contentId);
                if (!matchedItem) {
                    // Try variations
                    const possibleIds = [
                        contentId,
                        contentId.replace(/-/g, ' '),
                        contentId.replace(/villains-/, ''),
                        contentId.replace(/lore-/, '')
                    ];
                    
                    for (const id of possibleIds) {
                        matchedItem = this.loreHelper?.getLoreByIdSync(id);
                        if (matchedItem) break;
                    }
                }
            } catch (e) {
                // Helper not available
            }
        }

        return {
            contentType,
            item: matchedItem,
            contentId,
            confidence: matchedItem ? 'high' : 'medium'
        };
    }

    /**
     * Import all prompts from directory
     */
    async importAllPrompts() {
        console.log(chalk.cyan('\n📥 Importing Prompts from content/prompts/\n'));
        
        await this.loadHelpers();

        // Find all markdown files
        const files = await this.findPromptFiles(this.promptsDir);
        console.log(chalk.gray(`Found ${files.length} prompt files\n`));

        // Also check for prompts.yaml if it exists
        const yamlPath = path.join(this.promptsDir, 'prompts.yaml');
        try {
            const yamlExists = await fs.access(yamlPath).then(() => true).catch(() => false);
            if (yamlExists && yaml) {
                console.log(chalk.cyan('📄 Also importing from prompts.yaml...\n'));
                await this.importYamlPrompts(yamlPath);
            }
        } catch (e) {
            // Skip if YAML not available or file doesn't exist
        }

        let imported = 0;
        let matched = 0;
        let unmatched = 0;

        for (const filePath of files) {
            try {
                const content = await fs.readFile(filePath, 'utf-8');
                const contentId = this.extractIdFromFilename(filePath);
                const parsedPrompts = this.parsePromptFile(content, filePath);
                const match = await this.findMatchingContent(contentId, filePath);

                const promptData = {
                    contentId,
                    filePath: path.relative(this.promptsDir, filePath),
                    prompts: parsedPrompts,
                    match: match,
                    importedAt: new Date().toISOString()
                };

                if (match.item) {
                    // Store with content object reference
                    const storageKey = `${match.contentType}s`;
                    if (!this.importedPrompts[storageKey]) {
                        this.importedPrompts[storageKey] = new Map();
                    }
                    this.importedPrompts[storageKey].set(match.item.id, promptData);
                    matched++;
                    console.log(chalk.green(`✅ ${match.contentType}: ${match.item.id || contentId} (matched)`));
                } else {
                    // Store as unmatched for manual review
                    this.importedPrompts.unmatched.push({
                        ...promptData,
                        suggestedIds: [contentId, match.contentId]
                    });
                    unmatched++;
                    console.log(chalk.yellow(`⚠️  ${match.contentType || 'unknown'}: ${contentId} (unmatched - manual review needed)`));
                }

                imported++;
            } catch (error) {
                console.error(chalk.red(`❌ Error importing ${filePath}: ${error.message}`));
            }
        }

        console.log(chalk.cyan(`\n📊 Import Summary:`));
        console.log(chalk.green(`   ✅ Imported: ${imported} files`));
        console.log(chalk.green(`   ✅ Matched: ${matched} files`));
        console.log(chalk.yellow(`   ⚠️  Unmatched: ${unmatched} files (needs manual review)\n`));

        return this.importedPrompts;
    }

    /**
     * Recursively find all markdown files
     */
    async findPromptFiles(dir) {
        const files = [];
        
        async function scanDir(currentDir) {
            const entries = await fs.readdir(currentDir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(currentDir, entry.name);
                
                if (entry.isDirectory()) {
                    await scanDir(fullPath);
                } else if (entry.isFile() && entry.name.endsWith('.md')) {
                    files.push(fullPath);
                }
            }
        }

        await scanDir(dir);
        return files;
    }

    /**
     * Import prompts from YAML file (if available)
     */
    async importYamlPrompts(yamlPath) {
        if (!yaml) {
            console.log(chalk.yellow('⚠️  js-yaml not available, skipping YAML import'));
            return;
        }

        try {
            const yamlContent = await fs.readFile(yamlPath, 'utf-8');
            const prompts = yaml.load(yamlContent);
            
            if (Array.isArray(prompts)) {
                for (const promptEntry of prompts) {
                    if (promptEntry.id && promptEntry.content) {
                        const contentId = promptEntry.id;
                        const promptText = promptEntry.content.trim();
                        
                        // Try to match to content
                        const match = await this.findMatchingContent(contentId, yamlPath);
                        
                        const promptData = {
                            contentId,
                            filePath: 'prompts.yaml',
                            prompts: {
                                default: [promptText],
                                versions: {},
                                scenes: {}
                            },
                            match: match,
                            importedAt: new Date().toISOString(),
                            source: 'yaml'
                        };

                        if (match.item) {
                            const storageKey = `${match.contentType}s`;
                            if (!this.importedPrompts[storageKey]) {
                                this.importedPrompts[storageKey] = new Map();
                            }
                            // Merge with existing or create new
                            const existing = this.importedPrompts[storageKey].get(match.item.id);
                            if (existing) {
                                // Merge prompts
                                existing.prompts.default.push(...promptData.prompts.default);
                                existing.source = `${existing.source || 'markdown'}, yaml`;
                            } else {
                                this.importedPrompts[storageKey].set(match.item.id, promptData);
                            }
                            console.log(chalk.green(`   ✅ ${match.contentType}: ${match.item.id} (from YAML)`));
                        } else {
                            this.importedPrompts.unmatched.push(promptData);
                            console.log(chalk.yellow(`   ⚠️  ${contentId} (unmatched from YAML)`));
                        }
                    }
                }
            }
        } catch (error) {
            console.log(chalk.yellow(`⚠️  Could not import YAML prompts: ${error.message}`));
        }
    }

    /**
     * Save imported prompts to JSON file for CLI use
     */
    async saveImportedPrompts(outputPath = null) {
        if (!outputPath) {
            outputPath = path.join(__dirname, '../data/imported-prompts.json');
        }

        // Convert Maps to objects for JSON serialization
        const serializable = {
            characters: Object.fromEntries(this.importedPrompts.characters),
            locations: Object.fromEntries(this.importedPrompts.locations),
            lore: Object.fromEntries(this.importedPrompts.lore),
            unmatched: this.importedPrompts.unmatched,
            importedAt: new Date().toISOString(),
            version: '1.0'
        };

        // Ensure directory exists
        const dir = path.dirname(outputPath);
        await fs.mkdir(dir, { recursive: true });

        await fs.writeFile(outputPath, JSON.stringify(serializable, null, 2));
        console.log(chalk.green(`\n💾 Saved imported prompts to: ${outputPath}`));
        
        return outputPath;
    }

    /**
     * Generate report of imported prompts
     */
    generateReport() {
        console.log(chalk.cyan('\n📋 Import Report\n'));
        console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

        // Characters
        if (this.importedPrompts.characters.size > 0) {
            console.log(chalk.yellow(`👥 Characters (${this.importedPrompts.characters.size}):`));
            for (const [id, data] of this.importedPrompts.characters.entries()) {
                const versions = Object.keys(data.prompts.versions).length;
                const scenes = Object.keys(data.prompts.scenes).length;
                const defaults = data.prompts.default.length;
                console.log(chalk.white(`   ${id}: ${defaults} default, ${versions} versions, ${scenes} scenes`));
            }
            console.log('');
        }

        // Locations
        if (this.importedPrompts.locations.size > 0) {
            console.log(chalk.yellow(`📍 Locations (${this.importedPrompts.locations.size}):`));
            for (const [id, data] of this.importedPrompts.locations.entries()) {
                const versions = Object.keys(data.prompts.versions).length;
                const scenes = Object.keys(data.prompts.scenes).length;
                const defaults = data.prompts.default.length;
                console.log(chalk.white(`   ${id}: ${defaults} default, ${versions} versions, ${scenes} scenes`));
            }
            console.log('');
        }

        // Lore
        if (this.importedPrompts.lore.size > 0) {
            console.log(chalk.yellow(`📚 Lore (${this.importedPrompts.lore.size}):`));
            for (const [id, data] of this.importedPrompts.lore.entries()) {
                const versions = Object.keys(data.prompts.versions).length;
                const scenes = Object.keys(data.prompts.scenes).length;
                const defaults = data.prompts.default.length;
                console.log(chalk.white(`   ${id}: ${defaults} default, ${versions} versions, ${scenes} scenes`));
            }
            console.log('');
        }

        // Unmatched
        if (this.importedPrompts.unmatched.length > 0) {
            console.log(chalk.red(`⚠️  Unmatched (${this.importedPrompts.unmatched.length} - needs manual review):`));
            for (const data of this.importedPrompts.unmatched) {
                console.log(chalk.white(`   ${data.contentId} (from ${data.filePath})`));
            }
            console.log('');
        }
    }
}

// Main execution
async function main() {
    const importer = new PromptImporter();
    
    try {
        await importer.importAllPrompts();
        importer.generateReport();
        
        // Save to JSON
        const outputPath = await importer.saveImportedPrompts();
        
        console.log(chalk.green('\n✅ Prompt import complete!'));
        console.log(chalk.yellow('\n💡 Next steps:'));
        console.log(chalk.gray('   1. Review unmatched prompts and manually match them'));
        console.log(chalk.gray('   2. Use prompts in CLI: edit an item → Generate AI Image'));
        console.log(chalk.gray('   3. Prompts will appear in suggested prompts list\n'));
        
    } catch (error) {
        console.error(chalk.red(`\n❌ Import failed: ${error.message}`));
        if (process.env.DEBUG) {
            console.error(error.stack);
        }
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = PromptImporter;

