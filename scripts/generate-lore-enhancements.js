#!/usr/bin/env node

/**
 * Enhanced Lore CTA Generator for Wavelength Lore
 * 
 * Generates compelling CTAs and dramatic enhancements for lore entries
 * using the Wavelength AI Chatbot, following GitHub Issue #55 requirements
 */

const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
const { WavelengthChatCLI } = require('../wavelength-chat-cli');

console.log('🌊 WAVELENGTH LORE ENHANCEMENT GENERATOR');
console.log('=========================================');
console.log('🎯 Implementing GitHub Issue #55: CTA Lore Item Enhancement');
console.log('📝 Target: Ice Blue Diamond and other lore entries');
console.log('');

// Initialize the chat CLI
const chatCLI = new WavelengthChatCLI();

// Load lore data
const lorePath = path.join(__dirname, '../content/lore/wavelength-lore.yaml');
let loreData;

try {
    const loreContent = fs.readFileSync(lorePath, 'utf8');
    loreData = yaml.load(loreContent);
    console.log('✅ Loaded lore data successfully');
} catch (error) {
    console.error('❌ Error loading lore data:', error.message);
    process.exit(1);
}

/**
 * Generate enhanced lore content using AI
 */
async function generateLoreEnhancement(loreEntry) {
    const prompt = `You are enhancing lore entries for the Wavelength animated series to make them more dramatic and engaging with compelling CTAs.

LORE ENTRY TO ENHANCE:
Title: ${loreEntry.title}
Type: ${loreEntry.type}
Current Description: ${loreEntry.description}

ENHANCEMENT REQUIREMENTS (Based on GitHub Issue #55):

1. DRAMATIC TAGLINE: Create a compelling tagline that defines the item's terrifying power or central role
2. ENHANCED DESCRIPTION: Rewrite to emphasize stakes, corruption, and consequences
3. CTA HOOK: Add a hook that makes users want to learn more about how this affects the story
4. POWER FACTS: If applicable, describe the destructive powers it grants

EXAMPLE TRANSFORMATION (from Issue #55):
- Old Title: "Ice Blue Diamond" 
- New Title: "The Ice Blue Diamond: The Relic of Infinite Greed"
- New Tagline: "This diamond is a weapon of devastating corruption. Its power is the core of the Goblin King's dark sorcery."

Please provide ONLY the enhanced content in this EXACT format:

ENHANCED_TITLE: [Enhanced title with dramatic elements]
TAGLINE: [Compelling tagline about power/danger]
DESCRIPTION: [Rewritten description emphasizing stakes and corruption]
CTA_HOOK: [Question or hook that drives engagement]
POWER_STATEMENT: [Statement about what destructive power this grants]

Keep responses concise and dramatic. Focus on making this feel like a central weapon/element in the battle between Wavelength and evil forces.`;

    try {
        console.log(`🤖 Generating enhancement for: ${loreEntry.title}`);
        const response = await chatCLI.askChatbot(prompt);
        
        if (response && response.success && response.response) {
            return parseLoreEnhancement(response.response);
        } else {
            console.log(`⚠️  No response for ${loreEntry.title}: ${response?.error || 'Unknown error'}`);
            return null;
        }
    } catch (error) {
        console.error(`❌ Error generating enhancement for ${loreEntry.title}:`, error.message);
        return null;
    }
}

/**
 * Parse the AI response into structured enhancement data
 */
function parseLoreEnhancement(response) {
    const enhancement = {};
    
    const lines = response.split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        
        if (trimmed.startsWith('ENHANCED_TITLE:')) {
            enhancement.enhanced_title = trimmed.replace('ENHANCED_TITLE:', '').trim();
        } else if (trimmed.startsWith('TAGLINE:')) {
            enhancement.tagline = trimmed.replace('TAGLINE:', '').trim();
        } else if (trimmed.startsWith('DESCRIPTION:')) {
            enhancement.enhanced_description = trimmed.replace('DESCRIPTION:', '').trim();
        } else if (trimmed.startsWith('CTA_HOOK:')) {
            enhancement.cta_hook = trimmed.replace('CTA_HOOK:', '').trim();
        } else if (trimmed.startsWith('POWER_STATEMENT:')) {
            enhancement.power_statement = trimmed.replace('POWER_STATEMENT:', '').trim();
        }
    }
    
    return enhancement;
}

/**
 * Apply enhancement to lore entry
 */
function applyLoreEnhancement(loreEntry, enhancement) {
    if (!enhancement) return loreEntry;
    
    const enhanced = { ...loreEntry };
    
    // Add enhancement fields
    if (enhancement.enhanced_title) {
        enhanced.enhanced_title = enhancement.enhanced_title;
    }
    if (enhancement.tagline) {
        enhanced.tagline = enhancement.tagline;
    }
    if (enhancement.enhanced_description) {
        enhanced.enhanced_description = enhancement.enhanced_description;
    }
    if (enhancement.cta_hook) {
        enhanced.cta_hook = enhancement.cta_hook;
    }
    if (enhancement.power_statement) {
        enhanced.power_statement = enhancement.power_statement;
    }
    
    return enhanced;
}

/**
 * Main execution function
 */
async function enhanceLoreEntries() {
    console.log('🎯 Starting lore enhancement process...\n');
    
    let enhancedCount = 0;
    const processedLore = { ...loreData };
    
    // Process each lore category
    for (const [category, entries] of Object.entries(loreData)) {
        if (Array.isArray(entries)) {
            console.log(`📂 Processing ${category} category (${entries.length} entries)`);
            
            for (let i = 0; i < entries.length; i++) {
                const entry = entries[i];
                
                // Skip if already enhanced or if it's a simple entry
                if (entry.enhanced_title || entry.tagline) {
                    console.log(`⏭️  Skipping ${entry.title} (already enhanced)`);
                    continue;
                }
                
                // Generate enhancement
                const enhancement = await generateLoreEnhancement(entry);
                
                if (enhancement) {
                    processedLore[category][i] = applyLoreEnhancement(entry, enhancement);
                    enhancedCount++;
                    console.log(`✅ Enhanced: ${entry.title}`);
                    
                    // Add delay to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 2000));
                } else {
                    console.log(`❌ Failed to enhance: ${entry.title}`);
                }
            }
        }
    }
    
    if (enhancedCount > 0) {
        // Save enhanced lore data
        const enhancedYaml = yaml.dump(processedLore, { 
            lineWidth: -1,
            noRefs: true,
            sortKeys: false
        });
        
        fs.writeFileSync(lorePath, enhancedYaml, 'utf8');
        console.log(`\n✅ Successfully enhanced ${enhancedCount} lore entries!`);
        console.log(`📁 Updated: ${lorePath}`);
    } else {
        console.log('\n⚠️  No lore entries were enhanced.');
    }
}

// Run the enhancement process
enhanceLoreEntries().catch(error => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
});