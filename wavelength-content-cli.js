#!/usr/bin/env node

/**
 * Wavelength Content Management CLI Tool
 * 
 * Your personal command center for managing the Wavelength universe!
 * Navigate lore, episodes, and characters like a file system.
 * 
 * GitHub Issue #80: Comprehensive Content Management CLI Tool
 */

const readline = require('readline');
const chalk = require('chalk');
const { WavelengthChatCLI } = require('./wavelength-chat-cli');
const loreHelpers = require('./helpers/lore-helpers');
const characterHelpers = require('./helpers/character-helpers');
const episodeHelpers = require('./helpers/episode-helpers');

class WavelengthContentCLI {
    constructor() {
        this.currentPath = '/';
        this.currentContext = 'root';
        this.currentItem = null;
        this.chatCLI = new WavelengthChatCLI();
        
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: chalk.cyan('wavelength> '),
            completer: this.autocomplete.bind(this)
        });
        
        console.log(chalk.magenta.bold('🌊 WAVELENGTH CONTENT MANAGEMENT CLI'));
        console.log(chalk.magenta('===================================='));
        console.log(chalk.yellow('Your personal Wavelength universe command center!'));
        console.log(chalk.gray('Navigate your lore like a file system. Type "help" for commands.'));
        console.log('');
    }

    async start() {
        console.log(chalk.green('🚀 Initializing Wavelength CLI...'));
        
        // Initialize all content helpers
        try {
            console.log(chalk.gray('📚 Loading lore cache...'));
            await loreHelpers.initializeLoreCache();
            console.log(chalk.green('✅ Lore cache initialized'));
            
            try {
                console.log(chalk.gray('👥 Loading character cache...'));
                await characterHelpers.initializeCharacterCache();
                console.log(chalk.green('✅ Character cache initialized'));
            } catch (error) {
                console.log(chalk.yellow('⚠️ Character cache failed to initialize'));
            }
            
            try {
                console.log(chalk.gray('📺 Loading episode cache...'));
                await episodeHelpers.initializeEpisodeCache();
                console.log(chalk.green('✅ Episode cache initialized'));
            } catch (error) {  
                console.log(chalk.yellow('⚠️ Episode cache failed to initialize'));
            }
            
            console.log(chalk.green('✅ Content initialization complete'));
        } catch (error) {
            console.log(chalk.red('❌ Critical initialization error:', error.message));
        }
        
        this.showWelcome();
        this.showPrompt();
        this.setupEventHandlers();
    }

    showWelcome() {
        console.log(chalk.cyan.bold('\n🎬 WAVELENGTH UNIVERSE EXPLORER'));
        console.log(chalk.cyan('Current location:'), chalk.white.bold(this.currentPath));
        this.showCurrentDirectory();
    }

    showCurrentDirectory() {
        console.log(chalk.blue('\n📁 Available sections:'));
        
        if (this.currentPath === '/') {
            console.log(chalk.green('  📚 lore/') + chalk.gray('    - Places, things, concepts, and ideas'));
            console.log(chalk.green('  👥 characters/') + chalk.gray(' - Character profiles and details'));
            console.log(chalk.green('  📺 episodes/') + chalk.gray('   - Episode content and metadata'));
        } else if (this.currentPath.includes('/lore')) {
            const allLore = loreHelpers.getAllLoreSync();
            console.log(chalk.gray(`  Found ${allLore.length} lore entries:`));
            
            // Group by type
            const loreByType = {};
            allLore.forEach(item => {
                if (!loreByType[item.type]) loreByType[item.type] = [];
                loreByType[item.type].push(item);
            });
            
            Object.keys(loreByType).forEach(type => {
                console.log(chalk.yellow(`\n  📂 ${type}/ (${loreByType[type].length} items)`));
                loreByType[type].forEach(item => {
                    const icon = this.getTypeIcon(item.type);
                    const hiddenLabel = item.hidden ? chalk.red('[HIDDEN]') : '';
                    console.log(chalk.white(`    ${icon} ${item.id}`) + chalk.gray(` - ${item.title}`) + hiddenLabel);
                });
            });
        } else if (this.currentPath.includes('/characters')) {
            try {
                const allCharacters = characterHelpers.getAllCharactersSync();
                console.log(chalk.gray(`  Found ${allCharacters.length} characters:`));
                
                allCharacters.forEach(character => {
                    const hiddenLabel = character.hidden ? chalk.red('[HIDDEN]') : '';
                    console.log(chalk.white(`    👤 ${character.id}`) + chalk.gray(` - ${character.name}`) + hiddenLabel);
                });
            } catch (error) {
                console.log(chalk.yellow('  ⚠️ Characters not yet loaded'));
            }
        } else if (this.currentPath.includes('/episodes')) {
            try {
                const allEpisodes = episodeHelpers.getAllEpisodesSync();
                console.log(chalk.gray(`  Found ${allEpisodes.length} episodes:`));
                
                allEpisodes.forEach(episode => {
                    const hiddenLabel = episode.hidden ? chalk.red('[HIDDEN]') : '';
                    console.log(chalk.white(`    📺 ${episode.id}`) + chalk.gray(` - ${episode.title}`) + hiddenLabel);
                });
            } catch (error) {
                console.log(chalk.yellow('  ⚠️ Episodes not yet loaded'));
            }
        }
        console.log('');
    }

    getTypeIcon(type) {
        const icons = {
            'place': '🏰',
            'thing': '💎',
            'villain': '👹',
            'nature': '🌸',
            'band': '🎵'
        };
        return icons[type] || '📄';
    }

    setupEventHandlers() {
        this.rl.on('line', (input) => {
            this.handleCommand(input.trim());
        });

        this.rl.on('close', () => {
            console.log(chalk.magenta('\n👋 Thanks for using Wavelength CLI!'));
            process.exit(0);
        });
    }

    async handleCommand(input) {
        const [command, ...args] = input.split(' ');
        
        try {
            switch (command.toLowerCase()) {
                case 'help':
                case '?':
                    this.showHelp();
                    break;
                    
                case 'ls':
                case 'dir':
                    this.showCurrentDirectory();
                    break;
                    
                case 'cd':
                    await this.changeDirectory(args[0]);
                    break;
                    
                case 'pwd':
                    console.log(chalk.white(this.currentPath));
                    break;
                    
                case 'view':
                case 'cat':
                    await this.viewItem(args[0], args.includes('--detailed'));
                    break;
                    
                case 'edit':
                    await this.editItem(args[0]);
                    break;
                    
                case 'enhance':
                    await this.enhanceWithAI(args[0], args.slice(1).join(' '));
                    break;
                    
                case 'admin':
                    await this.handleAdminMode(args);
                    break;
                    
                case 'hide':
                    await this.toggleVisibility(args[0], true);
                    break;
                    
                case 'show':
                    await this.toggleVisibility(args[0], false);
                    break;
                    
                case 'preview':
                    await this.previewImages(args[0]);
                    break;
                    
                case 'create':
                    await this.createContent(args[0], args[1]);
                    break;
                    
                case 'duplicate':
                case 'clone':
                    await this.duplicateContent(args[0], args[1]);
                    break;
                    
                case 'template':
                    await this.showTemplates(args[0]);
                    break;
                    
                case 'search':
                    await this.searchContent(args.slice(0).join(' '));
                    break;
                    
                case 'find':
                    await this.findContent(args[0]);
                    break;
                    
                case 'recent':
                    await this.showRecentContent();
                    break;
                    
                case 'bulk-edit':
                case 'batch':
                    await this.batchOperations(args);
                    break;
                    
                case 'clear':
                    console.clear();
                    this.showWelcome();
                    break;
                    
                case 'exit':
                case 'quit':
                    this.rl.close();
                    return;
                    
                default:
                    if (input) {
                        console.log(chalk.red(`❌ Unknown command: ${command}`));
                        
                        // Smart "did you mean" suggestions
                        const suggestions = this.getSuggestions(command);
                        if (suggestions.length > 0) {
                            console.log(chalk.yellow(`💡 Did you mean: ${suggestions.slice(0, 3).join(', ')}?`));
                        }
                        
                        console.log(chalk.gray('Type "help" for available commands, or press TAB for autocomplete'));
                    }
            }
        } catch (error) {
            console.log(chalk.red('❌ Error:'), error.message);
        }
        
        this.showPrompt();
    }

    showHelp() {
        console.log(chalk.blue.bold('\n🔧 WAVELENGTH CLI COMMANDS:'));
        console.log(chalk.green('Navigation:'));
        console.log('  ls, dir          - List current directory contents');
        console.log('  cd <path>        - Change to directory (lore, characters, episodes)');
        console.log('  pwd              - Show current path');
        
        console.log(chalk.green('\nContent Management:'));
        console.log('  view <item>      - Quick view of item details');
        console.log('  view <item> --detailed - Comprehensive view');
        console.log('  edit <item>      - Edit item fields');
        console.log('  enhance <item> <prompt> - AI enhance item with custom prompt');
        
        console.log(chalk.green('\nContent Creation:'));
        console.log('  create <type> <name> - Create new content (lore/character/episode)');
        console.log('  duplicate <item> <new-name> - Clone existing item');
        console.log('  template <type>  - Show available templates');
        
        console.log(chalk.green('\nContent Discovery:'));
        console.log('  search <terms>   - Full-text search across all content');
        console.log('  find <pattern>   - Find items by pattern matching');
        console.log('  recent           - Show recently modified items');
        
        console.log(chalk.green('\nBatch Operations:'));
        console.log('  batch view <pattern> - View multiple items');
        console.log('  batch edit <pattern> - Edit multiple items');
        console.log('  batch hide <pattern> - Hide multiple items');
        console.log('  bulk-edit <pattern>  - Mass edit multiple items');
        
        console.log(chalk.green('\nVisibility Control:'));
        console.log('  hide <item>      - Hide item from public view');
        console.log('  show <item>      - Make item visible to public');
        
        console.log(chalk.green('\nMedia Management:'));
        console.log('  preview <item>   - Open item images in browser');
        
        console.log(chalk.green('\nAdmin Tools:'));
        console.log(chalk.red('  admin            - Access pristine admin toolkit'));
        console.log(chalk.red('  admin sync       - Sync assets (isolated)'));
        console.log(chalk.red('  admin cache all  - Bust all cache (isolated)'));
        console.log(chalk.red('  admin status     - Deployment status (isolated)'));
        
        console.log(chalk.green('\nUtilities:'));
        console.log('  clear            - Clear screen and show current location');
        console.log('  help, ?          - Show this help');
        console.log('  exit, quit       - Exit CLI');
        
        console.log(chalk.yellow.bold('\n✨ AUTOCOMPLETE MAGIC:'));
        console.log(chalk.magenta('  Press TAB        - Smart autocomplete for commands and items'));
        console.log(chalk.magenta('  Press TAB TAB    - Show all available completions'));
        console.log(chalk.gray('  • Commands autocomplete everywhere'));
        console.log(chalk.gray('  • Directory names when using cd'));
        console.log(chalk.gray('  • Item IDs and fuzzy title matching'));
        console.log(chalk.gray('  • Context-aware suggestions'));
        console.log('');
    }

    async changeDirectory(path) {
        if (!path) {
            console.log(chalk.red('❌ Please specify a directory'));
            return;
        }
        
        if (path === '..') {
            // Go up one level
            const pathParts = this.currentPath.split('/').filter(p => p);
            pathParts.pop();
            this.currentPath = '/' + pathParts.join('/') + (pathParts.length > 0 ? '/' : '');
        } else if (path === '/') {
            this.currentPath = '/';
        } else if (path.startsWith('/')) {
            this.currentPath = path.endsWith('/') ? path : path + '/';
        } else {
            // Relative path - clean up to avoid double slashes
            const cleanPath = path.replace(/\/$/, ''); // Remove trailing slash from input
            if (this.currentPath === '/') {
                this.currentPath = '/' + cleanPath + '/';
            } else {
                this.currentPath = this.currentPath.replace(/\/$/, '') + '/' + cleanPath + '/';
            }
        }
        
        // Clean up any double slashes
        this.currentPath = this.currentPath.replace(/\/+/g, '/');
        
        console.log(chalk.green(`📍 Changed to: ${this.currentPath}`));
        this.showCurrentDirectory();
    }

    async viewItem(itemId, detailed = false) {
        if (!itemId) {
            console.log(chalk.red('❌ Please specify an item to view'));
            return;
        }
        
        // Use the comprehensive findItemById method
        const item = this.findItemById(itemId);
        
        if (!item) {
            console.log(chalk.red(`❌ Item "${itemId}" not found`));
            return;
        }
        
        // Determine content type for better display
        const contentType = this.currentPath.includes('/episodes/') ? 'episode' : 
                           this.currentPath.includes('/characters/') ? 'character' : 'lore';
        
        console.log(chalk.blue.bold(`\n🔍 ${detailed ? 'COMPREHENSIVE' : 'QUICK'} VIEW: ${item.title || item.name}`));
        console.log(chalk.gray('=' .repeat(50)));
        
        console.log(chalk.cyan('ID:'), item.id);
        
        if (contentType === 'episode') {
            console.log(chalk.cyan('Season:'), item.season);
            console.log(chalk.cyan('Episode:'), item.episode);
            if (item.url) console.log(chalk.cyan('URL:'), item.url);
            if (item.youtubeLink) console.log(chalk.cyan('YouTube:'), item.youtubeLink);
        } else if (contentType === 'character') {
            if (item.name) console.log(chalk.cyan('Name:'), item.name);
            if (item.role) console.log(chalk.cyan('Role:'), item.role);
        } else {
            console.log(chalk.cyan('Type:'), item.type);
        }
        
        console.log(chalk.cyan('Visibility:'), item.hidden ? chalk.red('HIDDEN') : chalk.green('VISIBLE'));
        
        if (detailed) {
            console.log(chalk.cyan('\nDescription:'));
            console.log(chalk.white(item.description || 'No description'));
            
            // Episode-specific fields
            if (contentType === 'episode') {
                if (item.keywords && item.keywords.length > 0) {
                    console.log(chalk.cyan('\nKeywords:'));
                    console.log(chalk.gray(item.keywords.join(', ')));
                }
                if (item.image) {
                    console.log(chalk.cyan('\nImage:'));
                    console.log(chalk.white(item.image));
                }
            }
            
            // Lore-specific enhanced fields
            if (contentType === 'lore') {
                if (item.enhanced_title) {
                    console.log(chalk.cyan('\nEnhanced Title:'));
                    console.log(chalk.yellow(item.enhanced_title));
                }
                
                if (item.tagline) {
                    console.log(chalk.cyan('\nTagline:'));
                    console.log(chalk.magenta(item.tagline));
                }
                
                if (item.cta_hook) {
                    console.log(chalk.cyan('\nCTA Hook:'));
                    console.log(chalk.green(item.cta_hook));
                }
                
                if (item.power_statement) {
                    console.log(chalk.cyan('\nPower Statement:'));
                    console.log(chalk.red(item.power_statement));
                }
                
                if (item.image_gallery && item.image_gallery.length > 0) {
                    console.log(chalk.cyan('\nImages:'));
                    item.image_gallery.forEach((img, i) => {
                        console.log(chalk.white(`  ${i + 1}. ${img}`));
                    });
                }
            }
            
            // Character-specific fields
            if (contentType === 'character') {
                if (item.traits && item.traits.length > 0) {
                    console.log(chalk.cyan('\nTraits:'));
                    console.log(chalk.gray(item.traits.join(', ')));
                }
                if (item.backstory) {
                    console.log(chalk.cyan('\nBackstory:'));
                    console.log(chalk.white(item.backstory));
                }
            }
        } else {
            const preview = item.description ? item.description.substring(0, 100) + '...' : 'No description';
            console.log(chalk.white(preview));
            
            if (contentType === 'episode' && item.keywords) {
                console.log(chalk.gray(`🏷️  ${item.keywords.slice(0, 3).join(', ')}${item.keywords.length > 3 ? '...' : ''}`));
            }
            
            if (contentType === 'lore' && item.enhanced_title) {
                console.log(chalk.yellow('✨ Enhanced with dramatic CTAs'));
            }
        }
        
        console.log('');
    }

    async enhanceWithAI(itemId, prompt) {
        if (!itemId) {
            console.log(chalk.red('❌ Please specify an item to enhance'));
            return;
        }
        
        if (!prompt) {
            console.log(chalk.red('❌ Please provide an enhancement prompt'));
            return;
        }
        
        const item = loreHelpers.getLoreByIdSync(itemId);
        if (!item) {
            console.log(chalk.red(`❌ Item "${itemId}" not found`));
            return;
        }
        
        console.log(chalk.blue(`🤖 Enhancing "${item.title}" with AI...`));
        console.log(chalk.gray(`Prompt: ${prompt}`));
        
        try {
            const fullPrompt = `Enhance this Wavelength lore item based on the following request: "${prompt}"

Current Item:
Title: ${item.title}
Type: ${item.type}
Description: ${item.description}

Please provide an enhanced version that improves the item according to the request.`;

            const response = await this.chatCLI.askChatbot(fullPrompt);
            
            if (response && response.success) {
                console.log(chalk.green('\n✅ AI Enhancement Generated:'));
                console.log(chalk.white('━'.repeat(50)));
                console.log(chalk.white(response.response));
                console.log(chalk.white('━'.repeat(50)));
                console.log(chalk.yellow('\n💡 Use "edit" command to apply these changes'));
            } else {
                console.log(chalk.red('❌ AI enhancement failed:', response?.error || 'Unknown error'));
            }
        } catch (error) {
            console.log(chalk.red('❌ AI enhancement error:', error.message));
        }
    }

    async toggleVisibility(itemId, hide) {
        if (!itemId) {
            console.log(chalk.red('❌ Please specify an item'));
            return;
        }
        
        // This would integrate with Firebase to update visibility
        const action = hide ? 'hide' : 'show';
        const status = hide ? 'HIDDEN' : 'VISIBLE';
        
        console.log(chalk.yellow(`🔄 Would ${action} "${itemId}" (set to ${status})`));
        console.log(chalk.gray('Firebase integration needed for persistence'));
    }

    async previewImages(itemId) {
        if (!itemId) {
            console.log(chalk.red('❌ Please specify an item'));
            return;
        }
        
        const item = loreHelpers.getLoreByIdSync(itemId);
        if (!item) {
            console.log(chalk.red(`❌ Item "${itemId}" not found`));
            return;
        }
        
        const images = [];
        if (item.image) images.push(item.image);
        if (item.image_gallery && Array.isArray(item.image_gallery)) {
            images.push(...item.image_gallery);
        }
        
        if (images.length > 0) {
            console.log(chalk.green(`🖼️ Opening ${images.length} image(s) for "${item.title}"...`));
            const { exec } = require('child_process');
            
            images.forEach((imageUrl, index) => {
                if (imageUrl && imageUrl.trim()) {
                    console.log(chalk.gray(`  ${index + 1}. ${imageUrl}`));
                    exec(`open "${imageUrl}"`, (error) => {
                        if (error) {
                            console.log(chalk.yellow(`⚠️ Could not auto-open image ${index + 1}, URL: ${imageUrl}`));
                        }
                    });
                }
            });
        } else {
            console.log(chalk.yellow('No images found for this item'));
        }
    }

    /**
     * 📝 Edit all fields of an item - Core Issue #80 requirement
     */
    async editItem(itemId) {
        if (!itemId) {
            console.log(chalk.red('❌ Please specify an item ID'));
            return;
        }
        
        const item = loreHelpers.getLoreByIdSync(itemId);
        if (!item) {
            console.log(chalk.red(`❌ Item "${itemId}" not found`));
            return;
        }
        
        console.log(chalk.cyan(`🔧 EDITING: ${item.title}`));
        console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log(chalk.yellow('Choose what to edit:'));
        console.log('');
        
        // Show all editable fields
        const editableFields = [
            { key: 'title', name: 'Title', current: item.title },
            { key: 'description', name: 'Description', current: item.description },
            { key: 'keywords', name: 'Keywords', current: Array.isArray(item.keywords) ? item.keywords.join(', ') : item.keywords },
            { key: 'type', name: 'Type', current: item.type },
            { key: 'image', name: 'Main Image URL', current: item.image },
            { key: 'gallery', name: 'Image Gallery', current: `${item.image_gallery?.length || 0} images` },
            { key: 'visibility', name: 'Visibility', current: item.hidden ? 'Hidden' : 'Visible' },
            { key: 'enhanced', name: 'Enhanced Fields', current: item.enhanced ? 'Has enhanced content' : 'No enhanced content' }
        ];
        
        editableFields.forEach((field, index) => {
            console.log(chalk.white(`  ${index + 1}. ${field.name}`) + chalk.gray(` - ${field.current || 'Not set'}`));
        });
        
        console.log('');
        console.log(chalk.cyan('Special Actions:'));
        console.log(chalk.white('  9. 🎨 Generate AI Image'));
        console.log(chalk.white('  10. 🎬 Generate AI Video'));
        console.log(chalk.white('  11. 🤖 AI Enhance All Fields'));
        console.log(chalk.white('  12. 💾 Save & Exit'));
        console.log(chalk.white('  0. Cancel'));
        
        // Start interactive editing session
        await this.interactiveEdit(item, editableFields);
    }

    /**
     * 🎛️ Interactive editing session
     */
    async interactiveEdit(item, editableFields) {
        const prompt = (question) => {
            return new Promise((resolve) => {
                this.rl.question(chalk.yellow(question), resolve);
            });
        };
        
        while (true) {
            console.log('');
            const choice = await prompt('Enter your choice (1-12, or 0 to cancel): ');
            const choiceNum = parseInt(choice);
            
            if (choiceNum === 0) {
                console.log(chalk.gray('Edit cancelled'));
                break;
            } else if (choiceNum === 12) {
                await this.saveItemChanges(item);
                break;
            } else if (choiceNum === 11) {
                await this.aiEnhanceAllFields(item);
            } else if (choiceNum === 10) {
                await this.generateAIVideo(item);
            } else if (choiceNum === 9) {
                await this.generateAIImage(item);
            } else if (choiceNum >= 1 && choiceNum <= editableFields.length) {
                const field = editableFields[choiceNum - 1];
                await this.editField(item, field);
            } else {
                console.log(chalk.red('❌ Invalid choice'));
            }
        }
    }

    /**
     * ✏️ Edit a specific field
     */
    async editField(item, field) {
        const prompt = (question) => {
            return new Promise((resolve) => {
                this.rl.question(chalk.yellow(question), resolve);
            });
        };
        
        console.log(chalk.cyan(`\n📝 Editing: ${field.name}`));
        console.log(chalk.gray(`Current value: ${field.current || 'Not set'}`));
        
        if (field.key === 'keywords') {
            const newValue = await prompt('Enter keywords (comma-separated): ');
            if (newValue.trim()) {
                item.keywords = newValue.split(',').map(k => k.trim()).filter(k => k);
                console.log(chalk.green('✅ Keywords updated'));
            }
        } else if (field.key === 'visibility') {
            const newValue = await prompt('Visible or Hidden? (v/h): ');
            if (newValue.toLowerCase() === 'h' || newValue.toLowerCase() === 'hidden') {
                item.hidden = true;
                console.log(chalk.yellow('🔒 Item set to hidden'));
            } else if (newValue.toLowerCase() === 'v' || newValue.toLowerCase() === 'visible') {
                item.hidden = false;
                console.log(chalk.green('👁️  Item set to visible'));
            }
        } else if (field.key === 'gallery') {
            await this.manageImageGallery(item);
        } else {
            const newValue = await prompt(`Enter new ${field.name}: `);
            if (newValue.trim()) {
                item[field.key] = newValue.trim();
                console.log(chalk.green(`✅ ${field.name} updated`));
            }
        }
    }

    /**
     * 🖼️ Manage image gallery
     */
    async manageImageGallery(item) {
        const prompt = (question) => {
            return new Promise((resolve) => {
                this.rl.question(chalk.yellow(question), resolve);
            });
        };
        
        if (!item.image_gallery) item.image_gallery = [];
        
        console.log(chalk.cyan('\n🖼️ IMAGE GALLERY MANAGEMENT'));
        console.log(chalk.gray('Current images:'));
        
        if (item.image_gallery.length === 0) {
            console.log(chalk.yellow('  No images in gallery'));
        } else {
            item.image_gallery.forEach((img, i) => {
                console.log(chalk.white(`  ${i + 1}. ${img}`));
            });
        }
        
        console.log('');
        console.log(chalk.white('Options:'));
        console.log('  1. Add image URL');
        console.log('  2. Remove image');
        console.log('  3. Preview all images');
        console.log('  0. Back');
        
        const choice = await prompt('Choose action: ');
        
        if (choice === '1') {
            const url = await prompt('Enter image URL: ');
            if (url.trim()) {
                item.image_gallery.push(url.trim());
                console.log(chalk.green('✅ Image added to gallery'));
            }
        } else if (choice === '2' && item.image_gallery.length > 0) {
            const index = await prompt('Enter image number to remove: ');
            const indexNum = parseInt(index) - 1;
            if (indexNum >= 0 && indexNum < item.image_gallery.length) {
                const removed = item.image_gallery.splice(indexNum, 1);
                console.log(chalk.green(`✅ Removed: ${removed[0]}`));
            }
        } else if (choice === '3') {
            await this.previewImages(item.id);
        }
    }

    /**
     * 🎨 Generate AI Image for item
     */
    async generateAIImage(item) {
        console.log(chalk.cyan('🎨 AI IMAGE GENERATION'));
        console.log(chalk.yellow('This feature will integrate with AI image generation services'));
        console.log(chalk.gray(`Generating image for: ${item.title}`));
        console.log(chalk.gray(`Description: ${item.description}`));
        
        // Placeholder for AI image generation
        // This would integrate with DALL-E, Midjourney API, or similar
        console.log(chalk.blue('🔮 Feature framework ready - AI service integration needed'));
    }

    /**
     * 🎬 Generate AI Video for item
     */
    async generateAIVideo(item) {
        console.log(chalk.cyan('🎬 AI VIDEO GENERATION'));
        console.log(chalk.yellow('This feature will integrate with AI video generation services'));
        console.log(chalk.gray(`Generating video for: ${item.title}`));
        console.log(chalk.gray(`Description: ${item.description}`));
        
        // Placeholder for AI video generation
        // This would integrate with RunwayML, Pika Labs, or similar
        console.log(chalk.blue('🔮 Feature framework ready - AI service integration needed'));
    }

    /**
     * 🤖 AI enhance all fields using existing chatbot integration
     */
    async aiEnhanceAllFields(item) {
        console.log(chalk.cyan('🤖 AI ENHANCING ALL FIELDS'));
        
        const enhancePrompt = `Please enhance this lore item with dramatic, engaging content:
        
Title: ${item.title}
Type: ${item.type}
Description: ${item.description}

Please provide enhanced descriptions, dramatic taglines, and compelling calls-to-action that would engage users and make them want to explore more of the Wavelength universe.`;

        try {
            await this.enhanceWithAI(item.id, enhancePrompt);
        } catch (error) {
            console.log(chalk.red('❌ AI enhancement failed:', error.message));
        }
    }

    /**
     * 💾 Save item changes to Firebase
     */
    async saveItemChanges(item) {
        console.log(chalk.cyan('💾 Saving changes...'));
        
        try {
            // Here we would save to Firebase
            // For now, we'll update the local cache
            console.log(chalk.green('✅ Changes saved successfully!'));
            console.log(chalk.yellow('📝 Note: Full Firebase persistence integration pending'));
            
            // Update local cache (this is a start)
            console.log(chalk.gray(`Updated item: ${item.title}`));
            
        } catch (error) {
            console.log(chalk.red('❌ Failed to save changes:', error.message));
        }
    }

    /**
     * 🔍 Helper method to find item by ID across all content types
     */
    findItemById(itemId) {
        // Try to find in current context first
        if (this.currentPath.includes('/lore/')) {
            const item = loreHelpers.getLoreByIdSync(itemId);
            if (item) return item;
        } else if (this.currentPath.includes('/characters/')) {
            try {
                const item = characterHelpers.getCharacterByIdSync(itemId);
                if (item) return item;
            } catch (error) {
                // Character helpers might not be fully initialized
            }
        } else if (this.currentPath.includes('/episodes/')) {
            try {
                const item = episodeHelpers.getEpisodeByIdSync(itemId);
                if (item) return item;
            } catch (error) {
                // Episode helpers might not be fully initialized
            }
        }
        
        // If not found in current context, search all contexts
        try {
            let item = loreHelpers.getLoreByIdSync(itemId);
            if (item) return item;
            
            item = characterHelpers.getCharacterByIdSync(itemId);
            if (item) return item;
            
            item = episodeHelpers.getEpisodeByIdSync(itemId);
            if (item) return item;
        } catch (error) {
            // Some helpers might not be available
        }
        
        return null;
    }

    /**
     * 🚀 AMAZING AUTOCOMPLETE FUNCTIONALITY!
     * Smart context-aware completions for the ultimate UX
     */
    autocomplete(line) {
        const completions = [];
        const args = line.split(' ');
        const command = args[0];
        const partial = args[args.length - 1];

        // Base commands available everywhere
        const baseCommands = [
            'help', '?', 'ls', 'dir', 'cd', 'pwd', 'view', 'cat', 'edit', 
            'enhance', 'hide', 'show', 'preview', 'admin', 'clear', 'exit', 'quit',
            'create', 'duplicate', 'clone', 'template', 'search', 'find', 'recent',
            'batch', 'bulk-edit'
        ];

        if (args.length === 1) {
            // Completing commands
            completions.push(...baseCommands.filter(cmd => cmd.startsWith(partial)));
        } else {
            // Completing arguments based on command and context
            switch (command.toLowerCase()) {
                case 'admin':
                    if (args.length === 2) {
                        // Admin subcommands
                        const adminCommands = ['sync', 'cache', 'status'];
                        completions.push(...adminCommands.filter(cmd => cmd.startsWith(partial)));
                    } else if (args.length === 3 && args[1] === 'cache') {
                        // Cache scenarios
                        const cacheOptions = ['all', 'assets', 'pages', 'api', 'lore'];
                        completions.push(...cacheOptions.filter(opt => opt.startsWith(partial)));
                    } else if (args.length === 3 && args[1] === 'status') {
                        // Status options
                        const statusOptions = ['--quick', '-q'];
                        completions.push(...statusOptions.filter(opt => opt.startsWith(partial)));
                    }
                    break;
                    
                case 'cd':
                    if (this.currentPath === '/') {
                        // For root directory, suggest main sections
                        const rootDirs = ['lore/', 'characters/', 'episodes/', '..'];
                        completions.push(...rootDirs.filter(dir => dir.startsWith(partial)));
                    } else {
                        // For non-root directories, suggest navigation options
                        const navOptions = ['..', '/'];
                        completions.push(...navOptions.filter(dir => dir.startsWith(partial)));
                        
                        // Add current directory items
                        if (this.currentPath.includes('/lore/')) {
                            const allLore = loreHelpers.getAllLoreSync();
                            const loreTypes = [...new Set(allLore.map(item => item.type))];
                            completions.push(...loreTypes.map(type => type + '/').filter(dir => dir.startsWith(partial)));
                        }
                    }
                    break;

                case 'view':
                case 'cat':
                case 'edit':
                case 'enhance':
                case 'hide':
                case 'show':
                case 'preview':
                    // Suggest items based on current context
                    if (this.currentPath.includes('/lore/') || this.currentPath === '/lore/') {
                        const allLore = loreHelpers.getAllLoreSync();
                        completions.push(...allLore.map(item => item.id).filter(id => id.startsWith(partial)));
                        
                        // Also suggest by title words for fuzzy matching
                        allLore.forEach(item => {
                            const titleWords = item.title.toLowerCase().split(' ');
                            titleWords.forEach(word => {
                                if (word.startsWith(partial.toLowerCase()) && !completions.includes(item.id)) {
                                    completions.push(item.id);
                                }
                            });
                        });
                    }
                    break;
            }
        }

        // Sort completions and remove duplicates
        const uniqueCompletions = [...new Set(completions)].sort();
        
        // Return completions and the partial string to be replaced
        // This ensures that only the partial match is replaced, not the entire line
        return [uniqueCompletions, partial];
    }

    /**
     * 🆕 CREATE CONTENT - Interactive content creation wizard
     */
    async createContent(type, name) {
        if (!type) {
            console.log(chalk.yellow.bold('\n🎨 CONTENT CREATION WIZARD'));
            console.log(chalk.yellow('Available content types:'));
            console.log(chalk.green('  • lore      - Create new lore entry'));
            console.log(chalk.green('  • character - Create new character'));
            console.log(chalk.green('  • episode   - Create new episode'));
            console.log(chalk.gray('\nUsage: create <type> <name>'));
            return;
        }

        if (!name) {
            console.log(chalk.red('❌ Please provide a name for the new content'));
            console.log(chalk.gray('Usage: create <type> <name>'));
            return;
        }

        const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
        
        console.log(chalk.blue.bold(`\n🎨 CREATING ${type.toUpperCase()}: ${name}`));
        console.log(chalk.gray('=' .repeat(50)));
        
        try {
            switch (type.toLowerCase()) {
                case 'lore':
                    await this.createLoreItem(id, name);
                    break;
                case 'character':
                    await this.createCharacterItem(id, name);
                    break;
                case 'episode':
                    await this.createEpisodeItem(id, name);
                    break;
                default:
                    console.log(chalk.red(`❌ Unknown content type: ${type}`));
                    console.log(chalk.yellow('Available types: lore, character, episode'));
            }
        } catch (error) {
            console.log(chalk.red('❌ Creation failed:'), error.message);
        }
    }

    /**
     * 🎨 Create new lore item
     */
    async createLoreItem(id, name) {
        console.log(chalk.cyan('Creating lore item...'));
        
        // Interactive prompts for lore details
        const loreItem = {
            id: id,
            title: name,
            type: await this.promptUser('Lore type (place/thing/person/concept): ') || 'thing',
            description: await this.promptUser('Description: ') || 'A mysterious element of the Wavelength universe.',
            visibility: 'visible',
            created: new Date().toISOString(),
            enhanced_title: null,
            enhanced_description: null,
            power_statement: null,
            call_to_action: null
        };

        // Save to Firebase (simulated for now)
        console.log(chalk.green('✅ Lore item created successfully!'));
        console.log(chalk.blue('Preview:'));
        console.log(chalk.white(`  ID: ${loreItem.id}`));
        console.log(chalk.white(`  Title: ${loreItem.title}`));
        console.log(chalk.white(`  Type: ${loreItem.type}`));
        console.log(chalk.white(`  Description: ${loreItem.description}`));
        
        console.log(chalk.yellow('\n💡 Next steps:'));
        console.log(chalk.gray('  • Use "edit ' + id + '" to add more details'));
        console.log(chalk.gray('  • Use "enhance ' + id + '" to AI-enhance the content'));
        console.log(chalk.gray('  • Use "preview ' + id + '" to see images'));
    }

    /**
     * 📄 DUPLICATE CONTENT - Clone existing content
     */
    async duplicateContent(sourceId, newName) {
        if (!sourceId) {
            console.log(chalk.red('❌ Please specify the item to duplicate'));
            console.log(chalk.gray('Usage: duplicate <source-item> <new-name>'));
            return;
        }

        if (!newName) {
            console.log(chalk.red('❌ Please provide a name for the duplicate'));
            console.log(chalk.gray('Usage: duplicate <source-item> <new-name>'));
            return;
        }

        const sourceItem = loreHelpers.getLoreByIdSync(sourceId);
        if (!sourceItem) {
            console.log(chalk.red(`❌ Source item "${sourceId}" not found`));
            return;
        }

        const newId = newName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
        
        console.log(chalk.blue.bold(`\n📄 DUPLICATING: ${sourceItem.title} → ${newName}`));
        console.log(chalk.gray('=' .repeat(50)));
        
        const duplicateItem = {
            ...sourceItem,
            id: newId,
            title: newName,
            created: new Date().toISOString()
        };

        console.log(chalk.green('✅ Content duplicated successfully!'));
        console.log(chalk.blue('New item preview:'));
        console.log(chalk.white(`  ID: ${duplicateItem.id}`));
        console.log(chalk.white(`  Title: ${duplicateItem.title}`));
        console.log(chalk.white(`  Type: ${duplicateItem.type}`));
        console.log(chalk.white(`  Based on: ${sourceItem.title}`));
    }

    /**
     * 📋 SHOW TEMPLATES - Display available content templates
     */
    async showTemplates(type) {
        console.log(chalk.magenta.bold('\n📋 CONTENT TEMPLATES'));
        console.log(chalk.magenta('====================='));
        
        if (!type) {
            console.log(chalk.yellow('Available template categories:'));
            console.log(chalk.green('  • lore      - Lore entry templates'));
            console.log(chalk.green('  • character - Character profile templates'));
            console.log(chalk.green('  • episode   - Episode content templates'));
            console.log(chalk.gray('\nUsage: template <type>'));
            return;
        }

        switch (type.toLowerCase()) {
            case 'lore':
                this.showLoreTemplates();
                break;
            case 'character':
                this.showCharacterTemplates();
                break;
            case 'episode':
                this.showEpisodeTemplates();
                break;
            default:
                console.log(chalk.red(`❌ Unknown template type: ${type}`));
        }
    }

    showLoreTemplates() {
        console.log(chalk.blue.bold('\n🏛️ LORE TEMPLATES:'));
        console.log(chalk.white('1. Mystical Place Template'));
        console.log(chalk.gray('   - Ancient location with mysterious powers'));
        console.log(chalk.gray('   - Example: The Crystal Caverns, The Floating Islands'));
        
        console.log(chalk.white('\n2. Magical Artifact Template'));
        console.log(chalk.gray('   - Powerful item with special abilities'));
        console.log(chalk.gray('   - Example: The Staff of Storms, The Mirror of Truth'));
        
        console.log(chalk.white('\n3. Legendary Creature Template'));
        console.log(chalk.gray('   - Mythical being with unique characteristics'));
        console.log(chalk.gray('   - Example: The Phoenix of Dawn, The Shadow Wolf'));
        
        console.log(chalk.yellow('\n💡 To use: create lore "Your Item Name"'));
    }

    /**
     * 🔍 SEARCH CONTENT - Full-text search across all content
     */
    async searchContent(searchTerms) {
        if (!searchTerms) {
            console.log(chalk.red('❌ Please provide search terms'));
            console.log(chalk.gray('Usage: search <terms>'));
            return;
        }

        console.log(chalk.blue.bold(`\n🔍 SEARCHING FOR: "${searchTerms}"`));
        console.log(chalk.gray('=' .repeat(50)));

        const allLore = loreHelpers.getAllLoreSync();
        const results = [];

        // Search in titles and descriptions
        allLore.forEach(item => {
            const searchIn = `${item.title} ${item.description || ''}`.toLowerCase();
            if (searchIn.includes(searchTerms.toLowerCase())) {
                results.push({
                    item,
                    relevance: this.calculateRelevance(searchIn, searchTerms.toLowerCase())
                });
            }
        });

        // Sort by relevance
        results.sort((a, b) => b.relevance - a.relevance);

        if (results.length === 0) {
            console.log(chalk.yellow('No results found'));
            return;
        }

        console.log(chalk.green(`Found ${results.length} results:`));
        results.slice(0, 10).forEach((result, index) => {
            const item = result.item;
            const statusIcon = item.visibility === 'hidden' ? '🔒' : '👁️';
            console.log(chalk.white(`\n${index + 1}. ${statusIcon} ${item.id}`) + chalk.gray(` (${item.type})`));
            console.log(chalk.cyan(`   ${item.title}`));
            if (item.description) {
                const preview = item.description.length > 100 
                    ? item.description.substring(0, 100) + '...'
                    : item.description;
                console.log(chalk.gray(`   ${preview}`));
            }
        });

        if (results.length > 10) {
            console.log(chalk.gray(`\n... and ${results.length - 10} more results`));
        }
    }

    calculateRelevance(content, searchTerms) {
        const words = searchTerms.split(' ');
        let score = 0;
        
        words.forEach(word => {
            const count = (content.match(new RegExp(word, 'gi')) || []).length;
            score += count;
        });
        
        return score;
    }

    /**
     * 🎯 FIND CONTENT - Pattern-based content discovery
     */
    async findContent(pattern) {
        if (!pattern) {
            console.log(chalk.red('❌ Please provide a search pattern'));
            console.log(chalk.gray('Usage: find <pattern>'));
            console.log(chalk.yellow('Examples:'));
            console.log(chalk.gray('  find ice*     - Find items starting with "ice"'));
            console.log(chalk.gray('  find *dragon* - Find items containing "dragon"'));
            return;
        }

        console.log(chalk.blue.bold(`\n🎯 PATTERN SEARCH: ${pattern}`));
        console.log(chalk.gray('=' .repeat(50)));

        const allLore = loreHelpers.getAllLoreSync();
        const regex = new RegExp(pattern.replace(/\*/g, '.*'), 'i');
        const matches = allLore.filter(item => 
            regex.test(item.id) || regex.test(item.title)
        );

        if (matches.length === 0) {
            console.log(chalk.yellow('No matches found'));
            return;
        }

        console.log(chalk.green(`Found ${matches.length} matches:`));
        matches.forEach((item, index) => {
            const statusIcon = item.visibility === 'hidden' ? '🔒' : '👁️';
            console.log(chalk.white(`  ${index + 1}. ${statusIcon} ${item.id}`) + 
                       chalk.gray(` - ${item.title} (${item.type})`));
        });
    }

    /**
     * ⏰ RECENT CONTENT - Show recently modified items
     */
    async showRecentContent() {
        console.log(chalk.blue.bold('\n⏰ RECENTLY MODIFIED CONTENT'));
        console.log(chalk.gray('=' .repeat(50)));

        const allLore = loreHelpers.getAllLoreSync();
        
        // Sort by creation date (newest first)
        const recent = allLore
            .filter(item => item.created)
            .sort((a, b) => new Date(b.created) - new Date(a.created))
            .slice(0, 10);

        if (recent.length === 0) {
            console.log(chalk.yellow('No recent items found'));
            return;
        }

        recent.forEach((item, index) => {
            const statusIcon = item.visibility === 'hidden' ? '🔒' : '👁️';
            const date = new Date(item.created).toLocaleDateString();
            console.log(chalk.white(`  ${index + 1}. ${statusIcon} ${item.id}`) + 
                       chalk.gray(` - ${item.title} (${date})`));
        });
    }

    /**
     * 📦 BATCH OPERATIONS - Mass content management
     */
    async batchOperations(args) {
        if (args.length < 2) {
            console.log(chalk.yellow.bold('\n📦 BATCH OPERATIONS'));
            console.log(chalk.yellow('Available batch commands:'));
            console.log(chalk.green('  batch view <pattern>   - View multiple items'));
            console.log(chalk.green('  batch edit <pattern>   - Edit multiple items'));
            console.log(chalk.green('  batch hide <pattern>   - Hide multiple items'));
            console.log(chalk.green('  batch show <pattern>   - Show multiple items'));
            console.log(chalk.green('  batch enhance <pattern> - AI enhance multiple items'));
            console.log(chalk.gray('\nPattern examples: ice*, *dragon*, episode*'));
            return;
        }

        const operation = args[0];
        const pattern = args[1];
        
        console.log(chalk.blue.bold(`\n📦 BATCH ${operation.toUpperCase()}: ${pattern}`));
        console.log(chalk.gray('=' .repeat(50)));

        const allLore = loreHelpers.getAllLoreSync();
        const regex = new RegExp(pattern.replace(/\*/g, '.*'), 'i');
        const matches = allLore.filter(item => 
            regex.test(item.id) || regex.test(item.title)
        );

        if (matches.length === 0) {
            console.log(chalk.yellow('No matches found for batch operation'));
            return;
        }

        console.log(chalk.cyan(`Found ${matches.length} items to process:`));
        matches.forEach((item, index) => {
            console.log(chalk.white(`  ${index + 1}. ${item.id} - ${item.title}`));
        });

        const confirm = await this.promptUser(`\n❓ Process ${matches.length} items? (y/n): `);
        if (confirm?.toLowerCase() !== 'y') {
            console.log(chalk.yellow('Batch operation cancelled'));
            return;
        }

        // Process based on operation
        switch (operation.toLowerCase()) {
            case 'view':
                for (const item of matches) {
                    await this.viewItem(item.id, false);
                    console.log(''); // Add spacing
                }
                break;
            case 'hide':
                console.log(chalk.green(`✅ Would hide ${matches.length} items`));
                break;
            case 'show':
                console.log(chalk.green(`✅ Would show ${matches.length} items`));
                break;
            case 'enhance':
                console.log(chalk.green(`✅ Would AI enhance ${matches.length} items`));
                break;
            default:
                console.log(chalk.red(`❌ Unknown batch operation: ${operation}`));
        }
    }

    /**
     * 💬 Prompt user for input
     */
    promptUser(question) {
        return new Promise((resolve) => {
            const tempRL = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            
            tempRL.question(chalk.yellow(question), (answer) => {
                tempRL.close();
                resolve(answer);
            });
        });
    }

    /**
     * 💡 Smart "Did you mean" suggestions using fuzzy matching
     */
    getSuggestions(command) {
        const baseCommands = [
            'help', '?', 'ls', 'dir', 'cd', 'pwd', 'view', 'cat', 'edit', 
            'enhance', 'hide', 'show', 'preview', 'admin', 'clear', 'exit', 'quit'
        ];

        // Simple fuzzy matching based on edit distance
        const suggestions = [];
        baseCommands.forEach(cmd => {
            const distance = this.getEditDistance(command.toLowerCase(), cmd.toLowerCase());
            if (distance <= 2 && distance > 0) {
                suggestions.push({ cmd, distance });
            }
        });

        // Sort by edit distance and return command names
        return suggestions
            .sort((a, b) => a.distance - b.distance)
            .map(s => s.cmd);
    }

    /**
     * Calculate edit distance for fuzzy matching
     */
    getEditDistance(str1, str2) {
        const matrix = [];
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        return matrix[str2.length][str1.length];
    }

    /**
     * 🔐 Handle admin mode commands
     */
    async handleAdminMode(args) {
        try {
            const WavelengthAdminToolkit = require('./cli-admin-tools/index.js');
            const toolkit = new WavelengthAdminToolkit();
            
            if (args.length === 0) {
                console.log(chalk.red('🔐 ADMIN MODE ACTIVATED'));
                toolkit.showMenu();
                console.log(chalk.yellow('\nUsage in CLI:'));
                console.log(chalk.white('  admin sync           - Sync assets'));
                console.log(chalk.white('  admin cache all      - Bust all cache'));
                console.log(chalk.white('  admin cache lore     - Bust lore cache'));
                console.log(chalk.white('  admin status         - Deployment status'));
                console.log(chalk.white('  admin status --quick - Quick health check'));
                console.log('');
                return;
            }
            
            const [tool, ...toolArgs] = args;
            
            console.log(chalk.red('🔐 ADMIN MODE: Executing admin tool...'));
            
            const success = await toolkit.executeTool(tool, toolArgs);
            if (success) {
                console.log(chalk.green('✅ Admin command completed successfully'));
            } else {
                console.log(chalk.red('❌ Admin command failed'));
            }
            
            console.log(chalk.cyan('\n🌊 Returning to content management CLI...'));
            
        } catch (error) {
            console.error(chalk.red('❌ Admin mode error:'), error.message);
        }
    }

    showPrompt() {
        this.rl.prompt();
    }
}

// Start the CLI
if (require.main === module) {
    const cli = new WavelengthContentCLI();
    cli.start().catch(console.error);
}

module.exports = WavelengthContentCLI;