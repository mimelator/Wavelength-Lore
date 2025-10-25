#!/usr/bin/env node

/**
 * Prompt Manager
 * Interactive CLI for managing prompts in Firebase
 */

const readline = require('readline');
const firebaseUtils = require('../helpers/firebase-utils');
const promptHelpers = require('../helpers/prompt-helpers');

class PromptManager {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  /**
   * Prompt user for input
   */
  question(query) {
    return new Promise(resolve => {
      this.rl.question(query, resolve);
    });
  }

  /**
   * List all prompts
   */
  async listPrompts(filter = {}) {
    console.log('\n📝 Prompts List');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const prompts = await promptHelpers.getAllPrompts();

    let filteredPrompts = prompts;

    // Apply filters
    if (filter.category) {
      filteredPrompts = filteredPrompts.filter(p => p.category === filter.category);
    }
    if (filter.character) {
      filteredPrompts = filteredPrompts.filter(p =>
        p.linkedCharacters && p.linkedCharacters.includes(filter.character)
      );
    }

    if (filteredPrompts.length === 0) {
      console.log('No prompts found.');
      return;
    }

    filteredPrompts.forEach((prompt, index) => {
      console.log(`${index + 1}. ${prompt.id}`);
      console.log(`   Title: ${prompt.title}`);
      console.log(`   Category: ${prompt.category}`);
      if (prompt.linkedCharacters.length > 0) {
        console.log(`   Characters: ${prompt.linkedCharacters.join(', ')}`);
      }
      if (prompt.linkedLore.length > 0) {
        console.log(`   Lore: ${prompt.linkedLore.join(', ')}`);
      }
      if (prompt.tags.length > 0) {
        console.log(`   Tags: ${prompt.tags.join(', ')}`);
      }
      console.log('');
    });

    console.log(`Total: ${filteredPrompts.length} prompts\n`);
  }

  /**
   * View a single prompt
   */
  async viewPrompt(id) {
    console.log(`\n📄 Viewing Prompt: ${id}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const prompt = await promptHelpers.getPromptById(id);

    if (!prompt) {
      console.log(`❌ Prompt '${id}' not found.\n`);
      return;
    }

    console.log(`ID: ${prompt.id}`);
    console.log(`Title: ${prompt.title}`);
    console.log(`Category: ${prompt.category}`);
    console.log(`Version: ${prompt.version}`);
    console.log(`Active: ${prompt.isActive}`);
    console.log(`\nKeywords: ${prompt.keywords.join(', ')}`);
    console.log(`Tags: ${prompt.tags.join(', ')}`);
    console.log(`\nLinked Characters: ${prompt.linkedCharacters.join(', ') || 'none'}`);
    console.log(`Linked Episodes: ${prompt.linkedEpisodes.join(', ') || 'none'}`);
    console.log(`Linked Lore: ${prompt.linkedLore.join(', ') || 'none'}`);
    console.log(`\nContent:\n${'-'.repeat(60)}`);
    console.log(prompt.content);
    console.log(`${'-'.repeat(60)}\n`);
    console.log(`Created: ${prompt.createdAt}`);
    console.log(`Updated: ${prompt.updatedAt}\n`);
  }

  /**
   * Create a new prompt
   */
  async createPrompt() {
    console.log('\n📝 Create New Prompt');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const id = await this.question('Prompt ID (e.g., andrew-golden-hour): ');

    // Check if ID already exists
    const existing = await promptHelpers.getPromptById(id);
    if (existing) {
      console.log(`❌ Prompt '${id}' already exists.\n`);
      return;
    }

    const title = await this.question('Title: ');
    const category = await this.question('Category (character/location/scene/villain/general): ');
    const keywords = await this.question('Keywords (comma-separated): ');
    const tags = await this.question('Tags (comma-separated): ');
    const linkedCharacters = await this.question('Linked Characters (comma-separated IDs): ');
    const linkedEpisodes = await this.question('Linked Episodes (comma-separated IDs): ');
    const linkedLore = await this.question('Linked Lore (comma-separated IDs): ');

    console.log('\nEnter prompt content (end with a line containing only "END"):');
    const contentLines = [];
    let line;
    while ((line = await this.question('')) !== 'END') {
      contentLines.push(line);
    }
    const content = contentLines.join('\n');

    const prompt = {
      id,
      title,
      keywords: keywords.split(',').map(k => k.trim()).filter(k => k),
      content,
      linkedCharacters: linkedCharacters.split(',').map(c => c.trim()).filter(c => c),
      linkedEpisodes: linkedEpisodes.split(',').map(e => e.trim()).filter(e => e),
      linkedLore: linkedLore.split(',').map(l => l.trim()).filter(l => l),
      category: category || 'general',
      tags: tags.split(',').map(t => t.trim()).filter(t => t),
      version: 1,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const confirm = await this.question('\nCreate this prompt? (y/n): ');
    if (confirm.toLowerCase() === 'y') {
      await firebaseUtils.writeToFirebase(`prompts/${id}`, prompt);
      console.log(`✅ Prompt '${id}' created successfully!\n`);
      promptHelpers.clearPromptCache();
    } else {
      console.log('❌ Cancelled.\n');
    }
  }

  /**
   * Update an existing prompt
   */
  async updatePrompt(id) {
    console.log(`\n✏️  Update Prompt: ${id}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const prompt = await promptHelpers.getPromptById(id);

    if (!prompt) {
      console.log(`❌ Prompt '${id}' not found.\n`);
      return;
    }

    console.log('Current values shown in [brackets]. Press Enter to keep current value.\n');

    const title = await this.question(`Title [${prompt.title}]: `);
    const category = await this.question(`Category [${prompt.category}]: `);
    const keywords = await this.question(`Keywords [${prompt.keywords.join(', ')}]: `);
    const tags = await this.question(`Tags [${prompt.tags.join(', ')}]: `);
    const linkedCharacters = await this.question(`Linked Characters [${prompt.linkedCharacters.join(', ')}]: `);
    const linkedEpisodes = await this.question(`Linked Episodes [${prompt.linkedEpisodes.join(', ')}]: `);
    const linkedLore = await this.question(`Linked Lore [${prompt.linkedLore.join(', ')}]: `);

    const updateContent = await this.question('Update content? (y/n): ');
    let content = prompt.content;
    if (updateContent.toLowerCase() === 'y') {
      console.log('\nEnter new content (end with a line containing only "END"):');
      const contentLines = [];
      let line;
      while ((line = await this.question('')) !== 'END') {
        contentLines.push(line);
      }
      content = contentLines.join('\n');
    }

    const updated = {
      ...prompt,
      title: title || prompt.title,
      category: category || prompt.category,
      keywords: keywords ? keywords.split(',').map(k => k.trim()).filter(k => k) : prompt.keywords,
      tags: tags ? tags.split(',').map(t => t.trim()).filter(t => t) : prompt.tags,
      linkedCharacters: linkedCharacters ? linkedCharacters.split(',').map(c => c.trim()).filter(c => c) : prompt.linkedCharacters,
      linkedEpisodes: linkedEpisodes ? linkedEpisodes.split(',').map(e => e.trim()).filter(e => e) : prompt.linkedEpisodes,
      linkedLore: linkedLore ? linkedLore.split(',').map(l => l.trim()).filter(l => l) : prompt.linkedLore,
      content,
      version: prompt.version + 1,
      updatedAt: new Date().toISOString()
    };

    const confirm = await this.question('\nSave changes? (y/n): ');
    if (confirm.toLowerCase() === 'y') {
      await firebaseUtils.writeToFirebase(`prompts/${id}`, updated);
      console.log(`✅ Prompt '${id}' updated successfully!\n`);
      promptHelpers.clearPromptCache();
    } else {
      console.log('❌ Cancelled.\n');
    }
  }

  /**
   * Delete a prompt (soft delete)
   */
  async deletePrompt(id) {
    console.log(`\n🗑️  Delete Prompt: ${id}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const prompt = await promptHelpers.getPromptById(id);

    if (!prompt) {
      console.log(`❌ Prompt '${id}' not found.\n`);
      return;
    }

    console.log(`Title: ${prompt.title}`);
    console.log(`Category: ${prompt.category}\n`);

    const confirm = await this.question('Are you sure you want to delete this prompt? (y/n): ');
    if (confirm.toLowerCase() === 'y') {
      const updated = {
        ...prompt,
        isActive: false,
        updatedAt: new Date().toISOString()
      };

      await firebaseUtils.writeToFirebase(`prompts/${id}`, updated);
      console.log(`✅ Prompt '${id}' deleted (soft delete).\n`);
      promptHelpers.clearPromptCache();
    } else {
      console.log('❌ Cancelled.\n');
    }
  }

  /**
   * Search prompts
   */
  async searchPrompts(query) {
    console.log(`\n🔍 Search Results for "${query}"`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const results = await promptHelpers.searchPrompts(query);

    if (results.length === 0) {
      console.log('No results found.\n');
      return;
    }

    results.forEach((prompt, index) => {
      console.log(`${index + 1}. ${prompt.id} - ${prompt.title}`);
      console.log(`   Category: ${prompt.category}`);
      console.log(`   Preview: ${prompt.content.substring(0, 100)}...`);
      console.log('');
    });

    console.log(`Found ${results.length} results.\n`);
  }

  /**
   * Show main menu
   */
  async showMenu() {
    console.log('\n📝 Prompt Manager - Main Menu');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. List all prompts');
    console.log('2. View prompt');
    console.log('3. Create prompt');
    console.log('4. Update prompt');
    console.log('5. Delete prompt');
    console.log('6. Search prompts');
    console.log('7. List by category');
    console.log('8. List by character');
    console.log('0. Exit');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const choice = await this.question('Choose an option: ');

    switch (choice) {
      case '1':
        await this.listPrompts();
        break;
      case '2':
        const viewId = await this.question('Enter prompt ID: ');
        await this.viewPrompt(viewId);
        break;
      case '3':
        await this.createPrompt();
        break;
      case '4':
        const updateId = await this.question('Enter prompt ID: ');
        await this.updatePrompt(updateId);
        break;
      case '5':
        const deleteId = await this.question('Enter prompt ID: ');
        await this.deletePrompt(deleteId);
        break;
      case '6':
        const query = await this.question('Enter search query: ');
        await this.searchPrompts(query);
        break;
      case '7':
        const category = await this.question('Enter category: ');
        await this.listPrompts({ category });
        break;
      case '8':
        const character = await this.question('Enter character ID: ');
        await this.listPrompts({ character });
        break;
      case '0':
        console.log('\nGoodbye!\n');
        this.rl.close();
        return false;
      default:
        console.log('\n❌ Invalid option.\n');
    }

    return true;
  }

  /**
   * Main execution
   */
  async execute() {
    try {
      console.log('📝 Prompt Manager');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      // Initialize Firebase
      firebaseUtils.initializeFirebase('prompt-manager');
      await promptHelpers.initializePromptCache();

      console.log('✅ Connected to Firebase\n');

      // Main menu loop
      let continueLoop = true;
      while (continueLoop) {
        continueLoop = await this.showMenu();
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
    } finally {
      this.rl.close();
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
📝 Prompt Manager - Interactive CLI for managing prompts

Usage: node prompt-manager.js [command] [options]

Commands:
  (no command)        Interactive mode
  list                List all prompts
  view <id>           View a specific prompt
  search <query>      Search prompts

Options:
  --help, -h          Show this help message

Examples:
  node prompt-manager.js                        # Interactive mode
  node prompt-manager.js list                   # List all prompts
  node prompt-manager.js view andrew-golden-hour
  node prompt-manager.js search "golden hour"
`);
    process.exit(0);
  }

  const manager = new PromptManager();

  // Handle non-interactive commands
  const command = args[0];
  if (command === 'list') {
    firebaseUtils.initializeFirebase('prompt-manager');
    await promptHelpers.initializePromptCache();
    await manager.listPrompts();
    manager.rl.close();
    process.exit(0);
  } else if (command === 'view' && args[1]) {
    firebaseUtils.initializeFirebase('prompt-manager');
    await promptHelpers.initializePromptCache();
    await manager.viewPrompt(args[1]);
    manager.rl.close();
    process.exit(0);
  } else if (command === 'search' && args[1]) {
    firebaseUtils.initializeFirebase('prompt-manager');
    await promptHelpers.initializePromptCache();
    await manager.searchPrompts(args[1]);
    manager.rl.close();
    process.exit(0);
  }

  // Interactive mode
  await manager.execute();
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = PromptManager;
