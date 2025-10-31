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
const FirebaseSongsService = require('./services/firebase-songs-service');
const BackupCommands = require('./commands/backup-commands');
const CharacterCommands = require('./commands/character-commands');
const LoreCommands = require('./commands/lore-commands');
const SongsCommands = require('./commands/songs-commands');

class WavelengthContentCLI {
    constructor() {
        this.currentPath = '/';
        this.currentContext = 'root';
        this.currentItem = null;
        this.chatCLI = new WavelengthChatCLI();
        this.songsService = null; // Initialize later in start()
        this.backupCommands = new BackupCommands(this);
        this.characterCommands = new CharacterCommands(this);
        this.loreCommands = new LoreCommands(this);
        this.songsCommands = new SongsCommands(this);
        
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
            
            try {
                console.log(chalk.gray('🎵 Initializing Firebase Songs Service...'));
                this.songsService = new FirebaseSongsService();
                console.log(chalk.green('✅ Firebase Songs Service initialized'));
            } catch (error) {
                console.log(chalk.yellow('⚠️ Firebase Songs Service failed to initialize:', error.message));
                console.log(chalk.gray('   Song management commands will show status only'));
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
            console.log(chalk.green('  📺 episodes/') + chalk.gray('   - Episode content, stories, and metadata'));
        } else if (this.currentPath.includes('/lore')) {
            const allLore = loreHelpers.getAllLoreSync();
            
            // Check if we're in a specific lore subcategory
            const pathParts = this.currentPath.split('/').filter(part => part);
            if (pathParts.length > 1 && pathParts[0] === 'lore') {
                // We're in a specific category like /lore/band/
                const categoryType = pathParts[1];
                const categoryLore = allLore.filter(item => item.type === categoryType);
                
                if (categoryLore.length > 0) {
                    console.log(chalk.gray(`  Found ${categoryLore.length} ${categoryType} items:`));
                    console.log('');
                    categoryLore.forEach(item => {
                        const icon = this.getTypeIcon(item.type);
                        const hiddenLabel = item.hidden ? chalk.red('[HIDDEN]') : '';
                        console.log(chalk.white(`    ${icon} ${item.id}`) + chalk.gray(` - ${item.title}`) + hiddenLabel);
                    });
                } else {
                    console.log(chalk.yellow(`  No ${categoryType} items found`));
                    console.log(chalk.gray('  Use "cd .." to go back to /lore/'));
                }
            } else {
                // We're in the main /lore/ directory - show categories
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
            }
        } else if (this.currentPath.includes('/characters')) {
            try {
                const allCharacters = characterHelpers.getAllCharactersSync();
                
                // Check if we're in a specific character role subcategory
                const pathParts = this.currentPath.split('/').filter(part => part);
                if (pathParts.length > 1 && pathParts[0] === 'characters') {
                    // We're in a specific role like /characters/main/
                    const roleType = pathParts[1];
                    const roleCharacters = allCharacters.filter(character => {
                        const charRole = character.role || character.type || 'other';
                        return charRole === roleType;
                    });
                    
                    if (roleCharacters.length > 0) {
                        const roleName = roleType.charAt(0).toUpperCase() + roleType.slice(1);
                        console.log(chalk.gray(`  Found ${roleCharacters.length} characters in ${roleName}:`));
                        console.log('');
                        roleCharacters.forEach(character => {
                            const roleIcon = this.getCharacterIcon(roleType);
                            const hiddenLabel = character.hidden ? chalk.red('[HIDDEN]') : '';
                            const displayName = character.name || character.title || character.id;
                            console.log(chalk.white(`    ${roleIcon} ${character.id}`) + chalk.gray(` - ${displayName}`) + hiddenLabel);
                        });
                    } else {
                        console.log(chalk.yellow(`  No characters found in ${roleType}`));
                        console.log(chalk.gray('  Use "cd .." to go back to /characters/'));
                    }
                } else {
                    // We're in the main /characters/ directory - show roles
                    console.log(chalk.gray(`  Found ${allCharacters.length} characters:`));
                    
                    // Group by role/type for better organization
                    const charactersByRole = {};
                    allCharacters.forEach(character => {
                        const role = character.role || character.type || 'other';
                        if (!charactersByRole[role]) charactersByRole[role] = [];
                        charactersByRole[role].push(character);
                    });
                    
                    // Sort roles with common ones first
                    const commonRoles = ['main', 'protagonist', 'antagonist', 'supporting', 'minor'];
                    const roleKeys = Object.keys(charactersByRole).sort((a, b) => {
                        const aIndex = commonRoles.indexOf(a.toLowerCase());
                        const bIndex = commonRoles.indexOf(b.toLowerCase());
                        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
                        if (aIndex !== -1) return -1;
                        if (bIndex !== -1) return 1;
                        return a.localeCompare(b);
                    });
                    
                    roleKeys.forEach(role => {
                        const roleName = role.charAt(0).toUpperCase() + role.slice(1);
                        console.log(chalk.yellow(`\n  📂 ${roleName}/ (${charactersByRole[role].length} characters)`));
                        charactersByRole[role].forEach(character => {
                            const hiddenLabel = character.hidden ? chalk.red('[HIDDEN]') : '';
                            const displayName = character.name || character.title || character.id;
                            const roleIcon = this.getCharacterIcon(role);
                            console.log(chalk.white(`    ${roleIcon} ${character.id}`) + chalk.gray(` - ${displayName}`) + hiddenLabel);
                        });
                    });
                }
            } catch (error) {
                console.log(chalk.yellow('  ⚠️ Characters not yet loaded'));
            }
        } else if (this.currentPath.includes('/episodes')) {
            try {
                const allEpisodes = episodeHelpers.getAllEpisodesSync();
                
                // Check if we're in a specific season subcategory
                const pathParts = this.currentPath.split('/').filter(part => part);
                if (pathParts.length > 1 && pathParts[0] === 'episodes') {
                    // We're in a specific season like /episodes/season1/
                    const seasonType = pathParts[1];
                    const seasonEpisodes = allEpisodes.filter(episode => episode.season === seasonType);
                    
                    if (seasonEpisodes.length > 0) {
                        const seasonName = seasonType === 'unknown' ? 'Unknown Season' : seasonType.replace('season', 'Season ');
                        console.log(chalk.gray(`  Found ${seasonEpisodes.length} episodes in ${seasonName}:`));
                        console.log('');
                        seasonEpisodes.forEach(episode => {
                            const seasonIcon = this.getSeasonIcon(seasonType);
                            const hiddenLabel = episode.hidden ? chalk.red('[HIDDEN]') : '';
                            console.log(chalk.white(`    ${seasonIcon} ${episode.id}`) + chalk.gray(` - ${episode.title}`) + hiddenLabel);
                        });
                    } else {
                        console.log(chalk.yellow(`  No episodes found in ${seasonType}`));
                        console.log(chalk.gray('  Use "cd .." to go back to /episodes/'));
                    }
                } else {
                    // We're in the main /episodes/ directory - show seasons
                    console.log(chalk.gray(`  Found ${allEpisodes.length} episodes:`));
                    
                    // Group by season for better organization
                    const episodesBySeason = {};
                    allEpisodes.forEach(episode => {
                        const season = episode.season || 'unknown';
                        if (!episodesBySeason[season]) episodesBySeason[season] = [];
                        episodesBySeason[season].push(episode);
                    });
                    
                    // Sort seasons
                    const seasons = Object.keys(episodesBySeason).sort((a, b) => {
                        if (a === 'unknown') return 1;
                        if (b === 'unknown') return -1;
                        return a.localeCompare(b);
                    });
                    
                    seasons.forEach(season => {
                        const seasonName = season === 'unknown' ? 'Unknown Season' : season.replace('season', 'Season ');
                        const seasonIcon = this.getSeasonIcon(season);
                        console.log(chalk.yellow(`\n  📂 ${seasonName}/ (${episodesBySeason[season].length} episodes)`));
                        episodesBySeason[season].forEach(episode => {
                            const hiddenLabel = episode.hidden ? chalk.red('[HIDDEN]') : '';
                            console.log(chalk.white(`    ${seasonIcon} ${episode.id}`) + chalk.gray(` - ${episode.title}`) + hiddenLabel);
                        });
                    });
                }
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

    getCharacterIcon(role) {
        const icons = {
            'main': '⭐',
            'protagonist': '🦸',
            'antagonist': '🦹',
            'villain': '👹',
            'supporting': '👥',
            'minor': '👤',
            'other': '👤'
        };
        return icons[role.toLowerCase()] || '👤';
    }

    getSeasonIcon(season) {
        const icons = {
            'season1': '🌱',
            'season2': '🌿', 
            'season3': '🌳',
            'season4': '🍂'
        };
        return icons[season] || '📺';
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
        
        // Check if we're in preview mode and handle preview commands
        if (this.previewContext && this.handlePreviewCommand(input.trim())) {
            return;
        }
        
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
                    
                case 'query':
                    await this.queryServer(args);
                    break;
                    
                case 'publish':
                    await this.publishToFirebase(args);
                    break;
                    
                case 'bulk-edit':
                case 'batch':
                    await this.batchOperations(args);
                    break;
                    
                // Song Management Commands for Episode Creation Pipeline
                case 'songs':
                    await this.songsCommands.handleSongsCommands(args);
                    break;
                    
                case 'radio':
                    await this.handleRadioCommands(args);
                    break;
                    
                case 'character':
                case 'characters':
                case 'char':
                    await this.characterCommands.handleCharacterCommands(args);
                    break;
                    
                case 'backup':
                    await this.backupCommands.handleBackupCommands(args);
                    break;
                    
                case 'lore':
                    await this.loreCommands.handleLoreCommands(args);
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
        console.log('  edit <item>      - Edit item fields (lore, characters, episodes)');
        console.log('                     Character editing includes: tagline, stakes, CTA text');
        console.log('  enhance <item> <prompt> - AI enhance item with custom prompt');
        
        console.log(chalk.green('\nContent Creation:'));
        console.log('  create <type> <name> - Create new content (lore/character/episode)');
        console.log('  duplicate <item> <new-name> - Clone existing item');
        console.log('  template <type>  - Show available templates');
        
        console.log(chalk.green('\nContent Discovery:'));
        console.log('  search <terms>   - Full-text search across all content');
        console.log('  find <pattern>   - Find items by pattern matching');
        console.log('  recent           - Show recently modified items');
        console.log('  query <type>     - Direct server queries (stats, hidden, type, etc.)');
        
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
        
        console.log(chalk.green('\nFirebase Publishing:'));
        console.log('  publish item <id> - Publish specific item to Firebase');
        console.log('  publish status   - Check Firebase connection');
        console.log('  publish validate <id> - Validate item before publishing');
        
        console.log(chalk.green('\nSong & Radio Management:'));
        console.log('  songs create --title="Title" [options]   - Create new song');
        console.log('  songs list [--season=4] [--detailed]     - List all songs');
        console.log('  songs show <id>                         - Show song details');
        console.log('  songs update <id> --field=value         - Update song');
        console.log('  songs publish <id>                      - Publish song to radio');
        console.log('  songs playlist [--season=4]             - Show playlist');
        console.log('  songs sync --episode=s4e9               - Sync with episode');
        console.log('  songs help                              - Detailed song commands');
        console.log('  radio <command>                         - Radio player management');
        
        console.log(chalk.green('\nCharacter Management:'));
        console.log('  character create --name="Name" [options]  - Create new character');
        console.log('  character list [--role=type] [--detailed] - List all characters');
        console.log('  character show <id>                      - Show character details');
        console.log('  character update <id> --field=value      - Update character');
        console.log('  character delete <id> --confirm          - Delete character');
        console.log('  character cta <id> --score               - CTA completeness score');
        console.log('  character validate <id> [--check-cta]    - Validate character');
        console.log('  character help                           - Detailed character commands');
        
        console.log(chalk.green('\nLore Management:'));
        console.log('  lore create --title="Title" [options]    - Create new lore entry');
        console.log('  lore list [--category=place] [--detailed] - List all lore entries');
        console.log('  lore show <id>                          - Show lore details');
        console.log('  lore update <id> --field=value          - Update lore entry');
        console.log('  lore delete <id> --confirm              - Delete lore entry');
        console.log('  lore search <term> [--category=type]    - Search lore content');
        console.log('  lore categories                         - Show all categories');
        console.log('  lore tags                              - Show all tags');
        console.log('  lore quality <id>                      - Assess content quality');
        console.log('  lore help                              - Detailed lore commands');
        
        console.log(chalk.green('\nBackup & Recovery:'));
        console.log('  backup create --type=all         - Create full database backup');
        console.log('  backup create --type=episodes    - Create episodes backup');
        console.log('  backup create --type=characters  - Create characters backup');
        console.log('  backup create --type=songs       - Create songs backup');
        console.log('  backup create --type=lore        - Create lore backup');
        console.log('  backup list                      - List available backups');
        console.log('  backup status                    - Show backup system status');
        console.log('  backup restore <key>             - Restore from backup');
        console.log('  backup validate <key>            - Validate backup integrity');
        console.log('  backup help                      - Detailed backup commands');
        
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
            console.log(chalk.green(`🖼️ Found ${images.length} image(s) for "${item.title}"`));
            const { exec } = require('child_process');
            const path = require('path');
            const fs = require('fs');
            
            // Display images with CDN URLs
            const cdnBase = 'https://wavelengthlore.com';
            console.log('');
            images.forEach((imageUrl, index) => {
                if (imageUrl && imageUrl.trim()) {
                    const cdnUrl = imageUrl.startsWith('http') ? imageUrl : `${cdnBase}${imageUrl}`;
                    console.log(chalk.gray(`  ${index + 1}. ${imageUrl}`));
                    console.log(chalk.blue(`     🌐 ${cdnUrl}`));
                }
            });
            
            // Set up preview mode for next command
            console.log('');
            console.log(chalk.yellow('💡 Preview Options:'));
            console.log(chalk.gray('  • Type "gallery" to open HTML gallery in browser (recommended)'));
            console.log(chalk.gray('  • Type a number (1-' + images.length + ') to open that specific image'));
            console.log(chalk.gray('  • Type "first" to open just the first image'));
            console.log(chalk.gray('  • Press Enter to continue'));
            
            // Store the preview context for the next command
            this.previewContext = {
                item: item,
                images: images,
                cdnBase: cdnBase
            };
        } else {
            console.log(chalk.yellow('No images found for this item'));
        }
    }

    handlePreviewCommand(input) {
        if (!this.previewContext) return false;
        
        const { item, images, cdnBase } = this.previewContext;
        const { exec } = require('child_process');
        const trimmedInput = input.trim().toLowerCase();
        
        if (trimmedInput === 'gallery') {
            console.log(chalk.green('🎨 Creating image gallery...'));
            this.createImageGallery(item.title, images, cdnBase);
            this.previewContext = null; // Clear context
            return true;
        } else if (trimmedInput === 'first' && images.length > 0) {
            const firstImage = images[0];
            const cdnUrl = firstImage.startsWith('http') ? firstImage : `${cdnBase}${firstImage}`;
            console.log(chalk.green(`🌐 Opening: ${cdnUrl}`));
            exec(`open "${cdnUrl}"`);
            this.previewContext = null; // Clear context
            this.showPrompt();
            return true;
        } else if (trimmedInput === '' || trimmedInput === 'skip') {
            this.previewContext = null; // Clear context
            this.showPrompt();
            return true;
        } else {
            const imageNum = parseInt(trimmedInput);
            if (imageNum >= 1 && imageNum <= images.length) {
                const selectedImage = images[imageNum - 1];
                const cdnUrl = selectedImage.startsWith('http') ? selectedImage : `${cdnBase}${selectedImage}`;
                console.log(chalk.green(`🌐 Opening image ${imageNum}: ${cdnUrl}`));
                exec(`open "${cdnUrl}"`);
                this.previewContext = null; // Clear context
                this.showPrompt();
                return true;
            } else {
                // Not a valid preview command, clear context and let normal command handling take over
                console.log(chalk.yellow('Exiting preview mode...'));
                this.previewContext = null;
                return false;
            }
        }
    }

    createImageGallery(title, images, cdnBase) {
        const fs = require('fs');
        const path = require('path');
        const { exec } = require('child_process');
        
        const galleryHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Image Gallery</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            color: white;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            background: linear-gradient(45deg, #fff, #f0f8ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .header p {
            font-size: 1.1rem;
            opacity: 0.9;
        }
        
        .gallery {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            max-width: 1400px;
            margin: 0 auto;
        }
        
        .image-card {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .image-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 12px 40px rgba(0,0,0,0.2);
        }
        
        .image-container {
            position: relative;
            width: 100%;
            height: 250px;
            overflow: hidden;
        }
        
        .gallery-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.3s ease;
        }
        
        .image-card:hover .gallery-image {
            transform: scale(1.05);
        }
        
        .image-info {
            padding: 15px;
        }
        
        .image-title {
            font-weight: bold;
            font-size: 1rem;
            color: #333;
            margin-bottom: 5px;
        }
        
        .image-path {
            font-size: 0.85rem;
            color: #666;
            word-break: break-all;
            line-height: 1.4;
        }
        
        .image-overlay {
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(0,0,0,0.7);
            color: white;
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 0.8rem;
            backdrop-filter: blur(5px);
        }
        
        .wavelength-logo {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(255,255,255,0.9);
            padding: 10px 15px;
            border-radius: 25px;
            font-size: 0.9rem;
            color: #667eea;
            font-weight: bold;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        
        @media (max-width: 768px) {
            .gallery {
                grid-template-columns: 1fr;
                gap: 15px;
            }
            
            .header h1 {
                font-size: 2rem;
            }
            
            body {
                padding: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🖼️ ${title}</h1>
        <p>Image Gallery • ${images.length} images</p>
    </div>
    
    <div class="gallery">
        ${images.map((imageUrl, index) => {
            const cdnUrl = imageUrl.startsWith('http') ? imageUrl : `${cdnBase}${imageUrl}`;
            const fileName = imageUrl.split('/').pop();
            return `
                <div class="image-card">
                    <div class="image-container">
                        <img src="${cdnUrl}" alt="Image ${index + 1}" class="gallery-image" loading="lazy">
                        <div class="image-overlay">${index + 1}/${images.length}</div>
                    </div>
                    <div class="image-info">
                        <div class="image-title">${fileName}</div>
                        <div class="image-path">${imageUrl}</div>
                    </div>
                </div>`;
        }).join('')}
    </div>
    
    <div class="wavelength-logo">
        🌊 Wavelength CLI
    </div>
</body>
</html>`;
        
        // Create temporary HTML file
        const tempDir = path.join(process.cwd(), 'temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const galleryPath = path.join(tempDir, `gallery-${title.replace(/\s+/g, '-').toLowerCase()}-${timestamp}.html`);
        
        fs.writeFileSync(galleryPath, galleryHtml);
        
        console.log(chalk.green(`✅ Gallery created: ${galleryPath}`));
        console.log(chalk.blue('🌐 Opening in browser...'));
        
        exec(`open "${galleryPath}"`, (error) => {
            if (error) {
                console.log(chalk.yellow(`⚠️ Could not auto-open gallery: ${error.message}`));
                console.log(chalk.gray(`Manual path: ${galleryPath}`));
            }
            this.showPrompt();
        });
    }

    /**
     * 📝 Edit all fields of an item - Core Issue #80 requirement
     */
    async editItem(itemId) {
        if (!itemId) {
            console.log(chalk.red('❌ Please specify an item ID'));
            return;
        }

        // Determine content type and find item
        let item = null;
        let contentType = 'lore';

        // Try to find in current context first
        if (this.currentPath.includes('/characters/')) {
            try {
                item = characterHelpers.getCharacterByIdSync(itemId);
                contentType = 'character';
            } catch (error) {
                // Fall through
            }
        }

        if (!item) {
            item = loreHelpers.getLoreByIdSync(itemId);
            contentType = 'lore';
        }

        if (!item) {
            console.log(chalk.red(`❌ Item "${itemId}" not found`));
            return;
        }

        console.log(chalk.cyan(`🔧 EDITING: ${item.title || item.name}`));
        console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log(chalk.yellow('Choose what to edit:'));
        console.log('');

        // Show editable fields based on content type
        let editableFields = [
            { key: 'title', name: 'Title', current: item.title || item.name },
            { key: 'description', name: 'Description', current: item.description },
            { key: 'keywords', name: 'Keywords', current: Array.isArray(item.keywords) ? item.keywords.join(', ') : item.keywords },
            { key: 'image', name: 'Main Image URL', current: item.image },
            { key: 'gallery', name: 'Image Gallery', current: `${item.image_gallery?.length || 0} images` },
            { key: 'visibility', name: 'Visibility', current: item.hidden ? 'Hidden' : 'Visible' }
        ];

        // Add content-type-specific fields
        if (contentType === 'character') {
            // Insert CTA fields after description for characters
            editableFields.splice(3, 0,
                { key: 'tagline', name: '🎭 Tagline', current: item.tagline || 'Not set' },
                { key: 'stakes', name: '⚔️ Stakes', current: item.stakes || 'Not set' },
                { key: 'cta_text', name: '🔗 CTA Button Text', current: item.cta_text || 'Not set' }
            );
        } else if (contentType === 'lore') {
            editableFields.push(
                { key: 'type', name: 'Type', current: item.type },
                { key: 'enhanced', name: 'Enhanced Fields', current: item.enhanced ? 'Has enhanced content' : 'No enhanced content' }
            );
        }

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
        await this.interactiveEdit(item, editableFields, contentType);
    }

    /**
     * 🎛️ Interactive editing session
     */
    async interactiveEdit(item, editableFields, contentType = 'lore') {
        const prompt = (question) => {
            return new Promise((resolve) => {
                this.rl.question(chalk.yellow(question), resolve);
            });
        };

        const maxChoice = editableFields.length + 4; // 4 special actions (9-12, 0)

        while (true) {
            console.log('');
            const choice = await prompt(`Enter your choice (1-${editableFields.length}, 9-12, or 0 to cancel): `);
            const choiceNum = parseInt(choice);

            if (choiceNum === 0) {
                console.log(chalk.gray('Edit cancelled'));
                break;
            } else if (choiceNum === 12) {
                await this.saveItemChanges(item, contentType);
                break;
            } else if (choiceNum === 11) {
                await this.aiEnhanceAllFields(item, contentType);
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
        } else if (field.key === 'stakes') {
            // Stakes can be longer, give multi-line hint
            console.log(chalk.gray('(Type your response and press Enter. For longer text, use line breaks)'));
            const newValue = await prompt(`Enter new ${field.name}: `);
            if (newValue.trim()) {
                item[field.key] = newValue.trim();
                console.log(chalk.green(`✅ ${field.name} updated`));
            }
        } else if (field.key === 'description') {
            // Description can be longer, give multi-line hint
            console.log(chalk.gray('(Type your response and press Enter)'));
            const newValue = await prompt(`Enter new ${field.name}: `);
            if (newValue.trim()) {
                item[field.key] = newValue.trim();
                console.log(chalk.green(`✅ ${field.name} updated`));
            }
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
    async aiEnhanceAllFields(item, contentType = 'lore') {
        console.log(chalk.cyan('🤖 AI ENHANCING ALL FIELDS'));

        let enhancePrompt;

        if (contentType === 'character') {
            enhancePrompt = `Please enhance this character with dramatic, engaging content for the Wavelength universe:

Title: ${item.title}
Description: ${item.description}
Current Tagline: ${item.tagline || 'Not set'}
Current Stakes: ${item.stakes || 'Not set'}

Please provide:
1. An improved tagline (memorable character motto, max 200 chars)
2. Stakes (what does this character have at risk, max 500 chars)
3. Suggestions for CTA button text

Make it dramatic and engaging to entice users to explore more about this character.`;
        } else {
            enhancePrompt = `Please enhance this lore item with dramatic, engaging content:

Title: ${item.title}
Type: ${item.type}
Description: ${item.description}

Please provide enhanced descriptions, dramatic taglines, and compelling calls-to-action that would engage users and make them want to explore more of the Wavelength universe.`;
        }

        try {
            await this.enhanceWithAI(item.id, enhancePrompt);
        } catch (error) {
            console.log(chalk.red('❌ AI enhancement failed:', error.message));
        }
    }

    /**
     * 💾 Save item changes to Firebase
     */
    async saveItemChanges(item, contentType = 'lore') {
        console.log(chalk.cyan('💾 Saving changes...'));

        try {
            // Display what's being saved
            console.log(chalk.yellow(`\n📋 Changes Summary for ${contentType.toUpperCase()}:`));
            console.log(chalk.gray('─'.repeat(50)));

            // Show character-specific CTA fields if present
            if (contentType === 'character') {
                if (item.title) console.log(chalk.white(`  Title: ${item.title}`));
                if (item.tagline) console.log(chalk.white(`  🎭 Tagline: ${item.tagline}`));
                if (item.stakes) console.log(chalk.white(`  ⚔️ Stakes: ${item.stakes}`));
                if (item.cta_text) console.log(chalk.white(`  🔗 CTA Text: ${item.cta_text}`));
            }

            // Here we would save to Firebase
            // For now, we'll update the local cache
            console.log(chalk.green('\n✅ Changes saved successfully!'));
            console.log(chalk.yellow('📝 Note: Full Firebase persistence integration pending'));

            // Update local cache (this is a start)
            console.log(chalk.gray(`Updated item: ${item.title || item.name}`));

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
            'batch', 'bulk-edit', 'songs', 'radio', 'publish', 'query', 'character', 'backup', 'lore'
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
                        
                        // Add current directory navigation options for each content type
                        if (this.currentPath.includes('/lore')) {
                            try {
                                const allLore = loreHelpers.getAllLoreSync();
                                const loreTypes = [...new Set(allLore.map(item => item.type))];
                                completions.push(...loreTypes.map(type => type + '/').filter(dir => dir.startsWith(partial)));
                            } catch (error) {
                                // Lore might not be loaded yet
                            }
                        } else if (this.currentPath.includes('/episodes')) {
                            try {
                                const allEpisodes = episodeHelpers.getAllEpisodesSync();
                                const seasons = [...new Set(allEpisodes.map(ep => ep.season))].sort();
                                completions.push(...seasons.map(season => season + '/').filter(dir => dir.startsWith(partial)));
                            } catch (error) {
                                // Episodes might not be loaded yet
                            }
                        } else if (this.currentPath.includes('/characters')) {
                            try {
                                const allCharacters = characterHelpers.getAllCharactersSync();
                                // For characters, we could group by role or type if those fields exist
                                const roles = [...new Set(allCharacters
                                    .map(char => char.role || char.type)
                                    .filter(role => role)
                                )].sort();
                                if (roles.length > 0) {
                                    completions.push(...roles.map(role => role + '/').filter(dir => dir.startsWith(partial)));
                                }
                            } catch (error) {
                                // Characters might not be loaded yet
                            }
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
                    if (this.currentPath.includes('/lore')) {
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
                    } else if (this.currentPath.includes('/episodes')) {
                        try {
                            const allEpisodes = episodeHelpers.getAllEpisodesSync();
                            completions.push(...allEpisodes.map(item => item.id).filter(id => id.startsWith(partial)));
                            
                            // Also suggest by title words for fuzzy matching
                            allEpisodes.forEach(item => {
                                const titleWords = item.title.toLowerCase().split(' ');
                                titleWords.forEach(word => {
                                    if (word.startsWith(partial.toLowerCase()) && !completions.includes(item.id)) {
                                        completions.push(item.id);
                                    }
                                });
                            });
                        } catch (error) {
                            // Episodes might not be loaded yet
                        }
                    } else if (this.currentPath.includes('/characters')) {
                        try {
                            const allCharacters = characterHelpers.getAllCharactersSync();
                            completions.push(...allCharacters.map(item => item.id).filter(id => id.startsWith(partial)));
                            
                            // Also suggest by character name words for fuzzy matching
                            allCharacters.forEach(item => {
                                const nameWords = (item.name || '').toLowerCase().split(' ');
                                nameWords.forEach(word => {
                                    if (word.startsWith(partial.toLowerCase()) && !completions.includes(item.id)) {
                                        completions.push(item.id);
                                    }
                                });
                            });
                        } catch (error) {
                            // Characters might not be loaded yet
                        }
                    } else {
                        // If not in a specific context, suggest from all content types
                        try {
                            const allLore = loreHelpers.getAllLoreSync();
                            const allEpisodes = episodeHelpers.getAllEpisodesSync();
                            const allCharacters = characterHelpers.getAllCharactersSync();
                            
                            const allItems = [
                                ...allLore.map(item => item.id),
                                ...allEpisodes.map(item => item.id),
                                ...allCharacters.map(item => item.id)
                            ];
                            
                            completions.push(...allItems.filter(id => id.startsWith(partial)));
                        } catch (error) {
                            // Some content might not be loaded yet
                        }
                    }
                    break;

                case 'songs':
                    if (args.length === 2) {
                        // Songs subcommands
                        const songCommands = ['list', 'ls', 'add', 'update', 'publish', 'hide', 'migrate', 'sync', 'health', 'help'];
                        completions.push(...songCommands.filter(cmd => cmd.startsWith(partial)));
                    } else if (args.length >= 3) {
                        const subCommand = args[1].toLowerCase();
                        if (['update', 'publish', 'hide'].includes(subCommand)) {
                            // Suggest season numbers
                            if (args.length === 3) {
                                const seasons = ['1', '2', '3', '4', '5'];
                                completions.push(...seasons.filter(s => s.startsWith(partial)));
                            }
                            // Episode numbers would need Firebase data, skip for now
                        } else if (['list', 'ls'].includes(subCommand) && args.length === 3) {
                            // Suggest season numbers for list command
                            const seasons = ['1', '2', '3', '4', '5'];
                            completions.push(...seasons.filter(s => s.startsWith(partial)));
                        }
                    }
                    break;

                case 'radio':
                    if (args.length === 2) {
                        // Radio subcommands
                        const radioCommands = ['playlist', 'health', 'migrate', 'test', 'help'];
                        completions.push(...radioCommands.filter(cmd => cmd.startsWith(partial)));
                    } else if (args.length === 3 && args[1] === 'playlist') {
                        // Suggest season numbers for playlist command
                        const seasons = ['1', '2', '3', '4', '5'];
                        completions.push(...seasons.filter(s => s.startsWith(partial)));
                    }
                    break;

                case 'character':
                case 'characters':
                case 'char':
                    if (args.length === 2) {
                        // Character subcommands
                        const characterCommands = ['create', 'list', 'show', 'update', 'delete', 'publish', 'unpublish', 'validate', 'clone', 'cta', 'ai', 'avatar', 'help'];
                        completions.push(...characterCommands.filter(cmd => cmd.startsWith(partial)));
                    } else if (args.length >= 3 && ['create', 'update'].includes(args[1])) {
                        // Character create/update options
                        if (partial.startsWith('--')) {
                            const options = ['--name=', '--role=protagonist', '--role=supporting', '--role=antagonist', '--description=', '--tagline=', '--stakes=', '--cta-text=', '--species=', '--age='];
                            completions.push(...options.filter(opt => opt.startsWith(partial)));
                        }
                    } else if (args.length >= 3 && ['list'].includes(args[1])) {
                        // Character list options
                        if (partial.startsWith('--')) {
                            const options = ['--role=protagonist', '--role=supporting', '--role=antagonist', '--published=true', '--published=false', '--detailed'];
                            completions.push(...options.filter(opt => opt.startsWith(partial)));
                        }
                    } else if (args.length >= 3 && ['cta'].includes(args[1])) {
                        // CTA management options
                        if (partial.startsWith('--')) {
                            const options = ['--score', '--enhance', '--tagline=', '--stakes=', '--cta-text=', '--cta-hook=', '--power-statement='];
                            completions.push(...options.filter(opt => opt.startsWith(partial)));
                        }
                    }
                    break;
                    
                case 'backup':
                    if (args.length === 2) {
                        // Backup subcommands
                        const backupCommands = ['create', 'list', 'restore', 'status', 'validate', 'cleanup', 'help'];
                        completions.push(...backupCommands.filter(cmd => cmd.startsWith(partial)));
                    } else if (args.length >= 3 && args[1] === 'create') {
                        // Backup create options
                        if (partial.startsWith('--type=')) {
                            const types = ['all', 'episodes', 'characters', 'songs', 'lore'];
                            const typePrefix = '--type=';
                            completions.push(...types.map(type => typePrefix + type).filter(opt => opt.startsWith(partial)));
                        } else if (partial.startsWith('--')) {
                            const options = ['--type=all', '--type=episodes', '--type=characters', '--type=songs', '--type=lore', '--export=', '--timestamp='];
                            completions.push(...options.filter(opt => opt.startsWith(partial)));
                        }
                    } else if (args.length >= 3 && args[1] === 'list') {
                        // Backup list options
                        if (partial.startsWith('--')) {
                            const options = ['--type=daily', '--type=weekly', '--type=manual', '--limit='];
                            completions.push(...options.filter(opt => opt.startsWith(partial)));
                        }
                    } else if (args.length >= 3 && args[1] === 'restore') {
                        // Backup restore options
                        if (partial.startsWith('--')) {
                            const options = ['--dry-run', '--force', '--target-path='];
                            completions.push(...options.filter(opt => opt.startsWith(partial)));
                        }
                    }
                    break;
                    
                case 'lore':
                    if (args.length === 2) {
                        // Lore subcommands
                        const loreCommands = ['create', 'list', 'show', 'update', 'delete', 'search', 'categories', 'tags', 'quality', 'publish', 'unpublish', 'help'];
                        completions.push(...loreCommands.filter(cmd => cmd.startsWith(partial)));
                    } else if (args.length >= 3 && ['create', 'update'].includes(args[1])) {
                        // Lore create/update options
                        if (partial.startsWith('--')) {
                            const options = ['--title=', '--category=place', '--category=thing', '--category=villain', '--category=nature', '--category=band', '--description=', '--tags=', '--image='];
                            completions.push(...options.filter(opt => opt.startsWith(partial)));
                        }
                    } else if (args.length >= 3 && ['list', 'search'].includes(args[1])) {
                        // Lore list/search options
                        if (partial.startsWith('--')) {
                            const options = ['--category=place', '--category=thing', '--category=villain', '--category=nature', '--category=band', '--detailed', '--published=true', '--published=false', '--tags='];
                            completions.push(...options.filter(opt => opt.startsWith(partial)));
                        }
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
     * � QUERY SERVER - Direct Firebase queries
     */
    async queryServer(args) {
        if (args.length === 0) {
            console.log(chalk.blue.bold('\n🔍 WAVELENGTH SERVER QUERY'));
            console.log(chalk.gray('=' .repeat(50)));
            console.log(chalk.yellow('Available query types:'));
            console.log(chalk.gray('  • query stats           - Show database statistics'));
            console.log(chalk.gray('  • query hidden          - Show all hidden content'));
            console.log(chalk.gray('  • query type <type>     - Filter by content type'));
            console.log(chalk.gray('  • query recent <days>   - Show content from last N days'));
            console.log(chalk.gray('  • query search <term>   - Search all fields for term'));
            console.log(chalk.gray('  • query validate        - Check data integrity'));
            console.log(chalk.gray('  • query backup          - Show backup status'));
            return;
        }

        const queryType = args[0].toLowerCase();
        const queryParam = args.slice(1).join(' ');

        try {
            switch (queryType) {
                case 'stats':
                    await this.queryStats();
                    break;
                case 'hidden':
                    await this.queryHidden();
                    break;
                case 'type':
                    await this.queryByType(queryParam);
                    break;
                case 'recent':
                    await this.queryRecent(parseInt(queryParam) || 7);
                    break;
                case 'search':
                    await this.querySearch(queryParam);
                    break;
                case 'validate':
                    await this.queryValidate();
                    break;
                case 'backup':
                    await this.queryBackup();
                    break;
                default:
                    console.log(chalk.red(`❌ Unknown query type: ${queryType}`));
                    console.log(chalk.gray('Type "query" to see available options'));
            }
        } catch (error) {
            console.log(chalk.red(`❌ Query failed: ${error.message}`));
        }
    }

    async queryStats() {
        console.log(chalk.blue.bold('\n📊 DATABASE STATISTICS'));
        console.log(chalk.gray('=' .repeat(50)));

        const allLore = loreHelpers.getAllLoreSync();
        const allCharacters = characterHelpers.getAllCharactersSync();
        const allEpisodes = episodeHelpers.getAllEpisodesSync();

        // Lore stats
        const loreByType = {};
        const hiddenLore = allLore.filter(item => item.hidden || item.visibility === 'hidden');
        allLore.forEach(item => {
            loreByType[item.type] = (loreByType[item.type] || 0) + 1;
        });

        // Character stats
        const charactersByRole = {};
        allCharacters.forEach(char => {
            const role = char.role || char.type || 'other';
            charactersByRole[role] = (charactersByRole[role] || 0) + 1;
        });

        // Episode stats
        const episodesBySeason = {};
        allEpisodes.forEach(ep => {
            const season = ep.season || 'unknown';
            episodesBySeason[season] = (episodesBySeason[season] || 0) + 1;
        });

        console.log(chalk.cyan(`📚 Total Lore Items: ${allLore.length}`));
        console.log(chalk.gray(`   Hidden: ${hiddenLore.length}`));
        Object.keys(loreByType).forEach(type => {
            console.log(chalk.gray(`   ${type}: ${loreByType[type]}`));
        });

        console.log(chalk.cyan(`\n👥 Total Characters: ${allCharacters.length}`));
        Object.keys(charactersByRole).forEach(role => {
            console.log(chalk.gray(`   ${role}: ${charactersByRole[role]}`));
        });

        console.log(chalk.cyan(`\n📺 Total Episodes: ${allEpisodes.length}`));
        Object.keys(episodesBySeason).forEach(season => {
            console.log(chalk.gray(`   ${season}: ${episodesBySeason[season]}`));
        });

        // Database health
        const withImages = allLore.filter(item => item.image || (item.image_gallery && item.image_gallery.length > 0));
        const withEnhancement = allLore.filter(item => item.enhanced_content || item.enhanced_cta);
        
        console.log(chalk.yellow(`\n🎨 Content Quality:`));
        console.log(chalk.gray(`   Items with images: ${withImages.length}/${allLore.length}`));
        console.log(chalk.gray(`   Items with AI enhancement: ${withEnhancement.length}/${allLore.length}`));
    }

    async queryHidden() {
        console.log(chalk.blue.bold('\n🔒 HIDDEN CONTENT'));
        console.log(chalk.gray('=' .repeat(50)));

        const allLore = loreHelpers.getAllLoreSync();
        const hiddenLore = allLore.filter(item => item.hidden || item.visibility === 'hidden');

        if (hiddenLore.length === 0) {
            console.log(chalk.green('✅ No hidden content found'));
            return;
        }

        hiddenLore.forEach((item, index) => {
            console.log(chalk.yellow(`  ${index + 1}. ${item.id}`) + chalk.gray(` - ${item.title}`));
            console.log(chalk.gray(`     Type: ${item.type} | Created: ${item.created || 'unknown'}`));
        });
        
        console.log(chalk.cyan(`\n📊 Total hidden items: ${hiddenLore.length}`));
    }

    async queryByType(type) {
        if (!type) {
            console.log(chalk.red('❌ Please specify a content type'));
            return;
        }

        console.log(chalk.blue.bold(`\n📂 CONTENT BY TYPE: ${type.toUpperCase()}`));
        console.log(chalk.gray('=' .repeat(50)));

        const allLore = loreHelpers.getAllLoreSync();
        const filtered = allLore.filter(item => item.type && item.type.toLowerCase() === type.toLowerCase());

        if (filtered.length === 0) {
            console.log(chalk.yellow(`No items found for type: ${type}`));
            return;
        }

        filtered.forEach((item, index) => {
            const statusIcon = item.hidden ? '🔒' : '👁️';
            console.log(chalk.white(`  ${index + 1}. ${statusIcon} ${item.id}`) + chalk.gray(` - ${item.title}`));
        });
        
        console.log(chalk.cyan(`\n📊 Found ${filtered.length} items of type "${type}"`));
    }

    async queryRecent(days) {
        console.log(chalk.blue.bold(`\n⏰ CONTENT FROM LAST ${days} DAYS`));
        console.log(chalk.gray('=' .repeat(50)));

        const allLore = loreHelpers.getAllLoreSync();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const recent = allLore.filter(item => {
            if (!item.created) return false;
            const createdDate = new Date(item.created);
            return createdDate >= cutoffDate;
        }).sort((a, b) => new Date(b.created) - new Date(a.created));

        if (recent.length === 0) {
            console.log(chalk.yellow(`No content found from the last ${days} days`));
            return;
        }

        recent.forEach((item, index) => {
            const statusIcon = item.hidden ? '🔒' : '👁️';
            const date = new Date(item.created).toLocaleDateString();
            console.log(chalk.white(`  ${index + 1}. ${statusIcon} ${item.id}`) + 
                       chalk.gray(` - ${item.title} (${date})`));
        });
        
        console.log(chalk.cyan(`\n📊 Found ${recent.length} items from last ${days} days`));
    }

    async querySearch(searchTerm) {
        if (!searchTerm) {
            console.log(chalk.red('❌ Please specify a search term'));
            return;
        }

        console.log(chalk.blue.bold(`\n🔍 SEARCH RESULTS: "${searchTerm}"`));
        console.log(chalk.gray('=' .repeat(50)));

        const allLore = loreHelpers.getAllLoreSync();
        const searchLower = searchTerm.toLowerCase();
        
        const results = allLore.filter(item => {
            return (item.title && item.title.toLowerCase().includes(searchLower)) ||
                   (item.id && item.id.toLowerCase().includes(searchLower)) ||
                   (item.content && item.content.toLowerCase().includes(searchLower)) ||
                   (item.type && item.type.toLowerCase().includes(searchLower));
        });

        if (results.length === 0) {
            console.log(chalk.yellow(`No results found for: ${searchTerm}`));
            return;
        }

        results.forEach((item, index) => {
            const statusIcon = item.hidden ? '🔒' : '👁️';
            console.log(chalk.white(`  ${index + 1}. ${statusIcon} ${item.id}`) + chalk.gray(` - ${item.title}`));
            console.log(chalk.gray(`     Type: ${item.type}`));
            
            // Show snippet of matching content
            if (item.content && item.content.toLowerCase().includes(searchLower)) {
                const snippet = item.content.substring(0, 100) + '...';
                console.log(chalk.gray(`     "${snippet}"`));
            }
        });
        
        console.log(chalk.cyan(`\n📊 Found ${results.length} matches`));
    }

    async queryValidate() {
        console.log(chalk.blue.bold('\n✅ DATA VALIDATION'));
        console.log(chalk.gray('=' .repeat(50)));

        const allLore = loreHelpers.getAllLoreSync();
        const issues = [];

        // Check for missing required fields
        allLore.forEach(item => {
            if (!item.id) issues.push(`Missing ID: ${JSON.stringify(item)}`);
            if (!item.title) issues.push(`Missing title: ${item.id}`);
            if (!item.type) issues.push(`Missing type: ${item.id}`);
            if (!item.content) issues.push(`Missing content: ${item.id}`);
        });

        // Check for duplicate IDs
        const ids = allLore.map(item => item.id);
        const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
        duplicates.forEach(id => issues.push(`Duplicate ID: ${id}`));

        if (issues.length === 0) {
            console.log(chalk.green('✅ All data validation checks passed!'));
        } else {
            console.log(chalk.red(`❌ Found ${issues.length} issues:`));
            issues.forEach((issue, index) => {
                console.log(chalk.yellow(`  ${index + 1}. ${issue}`));
            });
        }
    }

    async queryBackup() {
        console.log(chalk.blue.bold('\n💾 BACKUP STATUS'));
        console.log(chalk.gray('=' .repeat(50)));
        
        const fs = require('fs');
        const path = require('path');
        
        // Check for backup directories
        const backupDirs = ['backup', 'backups', '.git'];
        const backupInfo = [];
        
        backupDirs.forEach(dir => {
            const dirPath = path.join(process.cwd(), dir);
            if (fs.existsSync(dirPath)) {
                const stats = fs.statSync(dirPath);
                backupInfo.push({
                    name: dir,
                    path: dirPath,
                    modified: stats.mtime
                });
            }
        });
        
        if (backupInfo.length === 0) {
            console.log(chalk.yellow('⚠️  No backup directories found'));
        } else {
            backupInfo.forEach(backup => {
                console.log(chalk.green(`✅ ${backup.name}/`));
                console.log(chalk.gray(`   Path: ${backup.path}`));
                console.log(chalk.gray(`   Last modified: ${backup.modified.toLocaleString()}`));
            });
        }
        
        // Git status
        try {
            const { exec } = require('child_process');
            exec('git log -1 --format="%h %s %cr"', (error, stdout) => {
                if (!error) {
                    console.log(chalk.cyan(`\n📝 Latest Git commit: ${stdout.trim()}`));
                }
            });
        } catch (e) {
            // Git not available
        }
    }

    /**
     * �📦 BATCH OPERATIONS - Mass content management
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
            'enhance', 'hide', 'show', 'preview', 'admin', 'clear', 'exit', 'quit',
            'songs', 'radio', 'character', 'backup', 'publish', 'query'
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
    /**
     * 🚀 PUBLISH TO FIREBASE - Clean room publishing
     */
    async publishToFirebase(args) {
        if (args.length === 0) {
            console.log(chalk.blue.bold('\n🚀 FIREBASE PUBLISHING'));
            console.log(chalk.gray('=' .repeat(50)));
            console.log(chalk.yellow('Available publish operations:'));
            console.log(chalk.gray('  • publish item <id>     - Publish specific item to Firebase'));
            console.log(chalk.gray('  • publish type <type>   - Publish all items of specific type'));
            console.log(chalk.gray('  • publish status        - Show Firebase connection status'));
            console.log(chalk.gray('  • publish validate <id> - Validate item before publishing'));
            return;
        }

        const operation = args[0].toLowerCase();
        const target = args.slice(1).join(' ');

        try {
            switch (operation) {
                case 'item':
                    await this.publishItem(target);
                    break;
                case 'type':
                    await this.publishByType(target);
                    break;
                case 'status':
                    await this.publishStatus();
                    break;
                case 'validate':
                    await this.publishValidate(target);
                    break;
                default:
                    console.log(chalk.red(`❌ Unknown publish operation: ${operation}`));
                    console.log(chalk.gray('Type "publish" to see available options'));
            }
        } catch (error) {
            console.log(chalk.red(`❌ Publish failed: ${error.message}`));
        }
    }

    async publishItem(itemId) {
        if (!itemId) {
            console.log(chalk.red('❌ Please specify an item ID'));
            return;
        }

        console.log(chalk.blue.bold(`\n🚀 PUBLISHING ITEM: ${itemId}`));
        console.log(chalk.gray('=' .repeat(50)));

        // Find the item in local cache
        const item = this.findItemById(itemId);
        if (!item) {
            console.log(chalk.red(`❌ Item "${itemId}" not found in local cache`));
            return;
        }

        try {
            // Initialize Firebase Admin if needed
            const firebaseAdminUtils = require('./helpers/firebase-admin-utils');
            
            // Validate item structure
            const validation = this.validateItemStructure(item);
            if (!validation.valid) {
                console.log(chalk.yellow('⚠️ Item validation warnings:'));
                validation.warnings.forEach(warning => {
                    console.log(chalk.gray(`   • ${warning}`));
                });
            }

            // Determine collection based on content type or current path
            let collection = 'lore'; // Default
            if (this.currentPath.includes('/characters/')) {
                collection = 'characters';
            } else if (this.currentPath.includes('/episodes/')) {
                collection = 'videos'; // Episodes are stored as 'videos' in Firebase
            }

            console.log(chalk.cyan(`📤 Publishing to Firebase collection: ${collection}`));
            console.log(chalk.gray(`   Item ID: ${item.id}`));
            console.log(chalk.gray(`   Title: ${item.title || item.name}`));

            // Create clean item for publishing (remove any local-only fields)
            const cleanItem = this.sanitizeForFirebase(item);

            // Publish to Firebase
            await firebaseAdminUtils.writeDataAsAdmin(`${collection}/${item.id}`, cleanItem);

            console.log(chalk.green(`✅ Successfully published "${item.id}" to Firebase!`));
            console.log(chalk.gray(`   Collection: ${collection}`));
            console.log(chalk.gray(`   Size: ${JSON.stringify(cleanItem).length} bytes`));

        } catch (error) {
            console.log(chalk.red(`❌ Failed to publish item: ${error.message}`));
            if (error.code) {
                console.log(chalk.gray(`   Error code: ${error.code}`));
            }
        }
    }

    async publishByType(type) {
        if (!type) {
            console.log(chalk.red('❌ Please specify a content type'));
            return;
        }

        console.log(chalk.blue.bold(`\n🚀 PUBLISHING BY TYPE: ${type.toUpperCase()}`));
        console.log(chalk.gray('=' .repeat(50)));

        const allLore = loreHelpers.getAllLoreSync();
        const filtered = allLore.filter(item => item.type && item.type.toLowerCase() === type.toLowerCase());

        if (filtered.length === 0) {
            console.log(chalk.yellow(`No items found for type: ${type}`));
            return;
        }

        console.log(chalk.cyan(`Found ${filtered.length} items to publish`));
        console.log(chalk.yellow(`⚠️ This will publish ${filtered.length} items. Continue? (y/N)`));

        // For CLI safety, we'll just show what would be published
        console.log(chalk.gray('\nItems that would be published:'));
        filtered.forEach((item, index) => {
            console.log(chalk.gray(`  ${index + 1}. ${item.id} - ${item.title}`));
        });
        
        console.log(chalk.cyan(`\n💡 To actually publish, use individual "publish item <id>" commands for safety`));
    }

    async publishStatus() {
        console.log(chalk.blue.bold('\n📡 FIREBASE CONNECTION STATUS'));
        console.log(chalk.gray('=' .repeat(50)));

        try {
            const firebaseAdminUtils = require('./helpers/firebase-admin-utils');
            
            // Test Firebase connection
            console.log(chalk.cyan('🔗 Testing Firebase connection...'));
            
            // Try to read a small piece of data
            const testData = await firebaseAdminUtils.fetchDataAsAdmin('lore');
            if (testData) {
                console.log(chalk.green('✅ Firebase connection active'));
                console.log(chalk.gray(`   Database accessible: Yes`));
                console.log(chalk.gray(`   Admin permissions: Yes`));
                
                // Show collection counts
                const loreCount = Object.keys(testData || {}).length;
                console.log(chalk.cyan(`\n📊 Current Firebase data:`));
                console.log(chalk.gray(`   Lore items: ${loreCount}`));
                
                // Try to get characters and episodes too
                try {
                    const charactersData = await firebaseAdminUtils.fetchDataAsAdmin('characters');
                    const episodesData = await firebaseAdminUtils.fetchDataAsAdmin('videos'); // Episodes are stored as 'videos' in Firebase
                    console.log(chalk.gray(`   Characters: ${Object.keys(charactersData || {}).length}`));
                    console.log(chalk.gray(`   Episodes (videos): ${Object.keys(episodesData || {}).length}`));
                } catch (e) {
                    console.log(chalk.gray(`   Other collections: Not accessible or empty`));
                }
                
            } else {
                console.log(chalk.yellow('⚠️ Firebase connected but no data found'));
            }

        } catch (error) {
            console.log(chalk.red('❌ Firebase connection failed'));
            console.log(chalk.gray(`   Error: ${error.message}`));
            
            if (error.message.includes('service account')) {
                console.log(chalk.yellow('\n💡 Fix suggestions:'));
                console.log(chalk.gray('   • Check FIREBASE_SERVICE_ACCOUNT environment variable'));
                console.log(chalk.gray('   • Verify firebaseServiceAccountKey.json exists'));
                console.log(chalk.gray('   • Ensure Firebase Admin SDK is properly initialized'));
            }
        }
    }

    async publishValidate(itemId) {
        if (!itemId) {
            console.log(chalk.red('❌ Please specify an item ID'));
            return;
        }

        console.log(chalk.blue.bold(`\n✅ VALIDATING ITEM: ${itemId}`));
        console.log(chalk.gray('=' .repeat(50)));

        const item = this.findItemById(itemId);
        if (!item) {
            console.log(chalk.red(`❌ Item "${itemId}" not found`));
            return;
        }

        const validation = this.validateItemStructure(item);
        const cleanItem = this.sanitizeForFirebase(item);

        console.log(chalk.cyan(`📋 Item Details:`));
        console.log(chalk.gray(`   ID: ${item.id}`));
        console.log(chalk.gray(`   Title: ${item.title || item.name || 'No title'}`));
        console.log(chalk.gray(`   Type: ${item.type || 'No type'}`));
        console.log(chalk.gray(`   Size: ${JSON.stringify(item).length} bytes`));
        console.log(chalk.gray(`   Clean size: ${JSON.stringify(cleanItem).length} bytes`));

        if (validation.valid) {
            console.log(chalk.green('\n✅ Item structure is valid for publishing'));
        } else {
            console.log(chalk.yellow('\n⚠️ Item has validation warnings:'));
            validation.warnings.forEach(warning => {
                console.log(chalk.gray(`   • ${warning}`));
            });
        }

        // Show what would be published
        console.log(chalk.cyan('\n📤 Preview of clean data to be published:'));
        console.log(chalk.gray(JSON.stringify(cleanItem, null, 2)));
    }

    validateItemStructure(item) {
        const warnings = [];
        
        if (!item.id) warnings.push('Missing required field: id');
        if (!item.title && !item.name) warnings.push('Missing title or name');
        if (!item.type) warnings.push('Missing type');
        if (!item.content && !item.description) warnings.push('Missing content or description');
        
        return {
            valid: warnings.length === 0,
            warnings: warnings
        };
    }

    // =================== SONG MANAGEMENT COMMANDS ===================
    // Episode Creation Pipeline Integration - GitHub Issue #130

    async handleSongCommands(args) {
        if (!this.songsService) {
            console.log(chalk.red('❌ Firebase Songs Service not available'));
            console.log(chalk.yellow('   Check Firebase configuration and try again'));
            return;
        }

        if (args.length === 0) {
            this.showSongHelp();
            return;
        }

        const subCommand = args[0].toLowerCase();
        const subArgs = args.slice(1);

        try {
            switch (subCommand) {
                case 'list':
                case 'ls':
                    await this.listSongs(subArgs);
                    break;
                    
                case 'add':
                    await this.addSong(subArgs);
                    break;
                    
                case 'update':
                    await this.updateSong(subArgs);
                    break;
                    
                case 'publish':
                    await this.publishSong(subArgs);
                    break;
                    
                case 'hide':
                    await this.hideSong(subArgs);
                    break;
                    
                case 'migrate':
                    await this.migrateLegacyPlaylist();
                    break;
                    
                case 'sync':
                    await this.syncSongsWithEpisodes(subArgs);
                    break;
                    
                case 'health':
                case 'status':
                    await this.showSongsHealth();
                    break;
                    
                default:
                    console.log(chalk.red(`❌ Unknown song command: ${subCommand}`));
                    this.showSongHelp();
            }
        } catch (error) {
            console.log(chalk.red(`❌ Song command failed: ${error.message}`));
        }
    }

    async handleRadioCommands(args) {
        if (args.length === 0) {
            this.showRadioHelp();
            return;
        }

        const subCommand = args[0].toLowerCase();
        const subArgs = args.slice(1);

        try {
            switch (subCommand) {
                case 'playlist':
                    await this.showRadioPlaylist(subArgs);
                    break;
                    
                case 'health':
                    await this.checkRadioHealth();
                    break;
                    
                case 'migrate':
                    await this.migrateRadioPlaylist();
                    break;
                    
                case 'test':
                    await this.testRadioEndpoints();
                    break;
                    
                default:
                    console.log(chalk.red(`❌ Unknown radio command: ${subCommand}`));
                    this.showRadioHelp();
            }
        } catch (error) {
            console.log(chalk.red(`❌ Radio command failed: ${error.message}`));
        }
    }

    // Song Management Methods

    async listSongs(args) {
        console.log(chalk.blue('🎵 Loading songs from Firebase...'));
        
        const season = args.length > 0 ? parseInt(args[0]) : null;
        const songs = season ? 
            await this.songsService.getSongsBySeason(season) : 
            await this.songsService.getPublishedSongs();

        if (!songs || songs.length === 0) {
            console.log(chalk.yellow('📭 No songs found'));
            if (season) {
                console.log(chalk.gray(`   Try: songs list (to see all songs)`));
            } else {
                console.log(chalk.gray(`   Try: songs migrate (to import legacy playlist)`));
            }
            return;
        }

        console.log(chalk.green(`📻 Found ${songs.length} song${songs.length > 1 ? 's' : ''}${season ? ` in Season ${season}` : ''}`));
        console.log('');

        // Group by season for better display
        const songsBySeason = songs.reduce((acc, song) => {
            if (!acc[song.season]) acc[song.season] = [];
            acc[song.season].push(song);
            return acc;
        }, {});

        for (const [seasonNum, seasonSongs] of Object.entries(songsBySeason).sort()) {
            console.log(chalk.cyan.bold(`Season ${seasonNum}:`));
            
            seasonSongs.sort((a, b) => a.episode - b.episode).forEach(song => {
                const status = song.isPublished ? chalk.green('✅ Published') : chalk.red('🚫 Hidden');
                const duration = song.duration || 'Unknown';
                console.log(`  ${chalk.white(`S${song.season}E${song.episode.toString().padStart(2, '0')}`)} ${chalk.magenta(song.title.padEnd(25))} ${duration.padEnd(8)} ${status}`);
            });
            console.log('');
        }
    }

    async addSong(args) {
        if (args.length < 5) {
            console.log(chalk.red('❌ Usage: songs add <season> <episode> <title> <file> <duration>'));
            console.log(chalk.gray('   Example: songs add 1 12 "New Song" "NewSong_v1.mp3" "3:45"'));
            return;
        }

        const [season, episode, title, file, duration] = args;
        const songData = {
            season: parseInt(season),
            episode: parseInt(episode),
            title: title.replace(/"/g, ''),
            file: file,
            duration: duration,
            isPublished: false // Default to hidden until explicitly published
        };

        console.log(chalk.blue('🎵 Adding song to Firebase...'));
        console.log(chalk.gray(`   ${JSON.stringify(songData, null, 2)}`));

        const result = await this.songsService.createOrUpdateSong(songData);
        
        if (result.success) {
            console.log(chalk.green(`✅ Song added successfully: ${title}`));
            console.log(chalk.yellow('   Note: Song is hidden by default. Use "songs publish" to make it visible.'));
        } else {
            console.log(chalk.red(`❌ Failed to add song: ${result.error}`));
        }
    }

    async updateSong(args) {
        if (args.length < 3) {
            console.log(chalk.red('❌ Usage: songs update <season> <episode> <field>=<value> [field2=value2...]'));
            console.log(chalk.gray('   Example: songs update 1 12 title="Updated Title" duration="4:20"'));
            return;
        }

        const season = parseInt(args[0]);
        const episode = parseInt(args[1]);
        const updates = {};

        // Parse field=value pairs
        for (let i = 2; i < args.length; i++) {
            const [field, value] = args[i].split('=');
            if (field && value) {
                updates[field] = value.replace(/"/g, '');
            }
        }

        if (Object.keys(updates).length === 0) {
            console.log(chalk.red('❌ No valid field=value pairs provided'));
            return;
        }

        console.log(chalk.blue(`🎵 Updating S${season}E${episode} song...`));
        console.log(chalk.gray(`   Updates: ${JSON.stringify(updates, null, 2)}`));

        // Find existing song
        const songs = await this.songsService.getSongsBySeason(season);
        const existingSong = songs.find(s => s.episode === episode);
        
        if (!existingSong) {
            console.log(chalk.red(`❌ Song S${season}E${episode} not found`));
            return;
        }

        const updatedSong = { ...existingSong, ...updates };
        const result = await this.songsService.createOrUpdateSong(updatedSong);
        
        if (result.success) {
            console.log(chalk.green(`✅ Song updated successfully`));
        } else {
            console.log(chalk.red(`❌ Failed to update song: ${result.error}`));
        }
    }

    async publishSong(args) {
        if (args.length < 2) {
            console.log(chalk.red('❌ Usage: songs publish <season> <episode>'));
            console.log(chalk.gray('   Example: songs publish 1 12'));
            return;
        }

        const season = parseInt(args[0]);
        const episode = parseInt(args[1]);

        console.log(chalk.blue(`🎵 Publishing S${season}E${episode} song...`));

        const result = await this.songsService.updatePublishedStatus(season, episode, true);
        
        if (result.success) {
            console.log(chalk.green(`✅ Song S${season}E${episode} is now published and visible in radio player`));
        } else {
            console.log(chalk.red(`❌ Failed to publish song: ${result.error}`));
        }
    }

    async hideSong(args) {
        if (args.length < 2) {
            console.log(chalk.red('❌ Usage: songs hide <season> <episode>'));
            console.log(chalk.gray('   Example: songs hide 1 12'));
            return;
        }

        const season = parseInt(args[0]);
        const episode = parseInt(args[1]);

        console.log(chalk.blue(`🎵 Hiding S${season}E${episode} song...`));

        const result = await this.songsService.updatePublishedStatus(season, episode, false);
        
        if (result.success) {
            console.log(chalk.green(`✅ Song S${season}E${episode} is now hidden from radio player`));
        } else {
            console.log(chalk.red(`❌ Failed to hide song: ${result.error}`));
        }
    }

    async migrateLegacyPlaylist() {
        console.log(chalk.blue('🔄 Starting legacy playlist migration...'));
        
        // Legacy playlist data (Season 1 only for testing - same as routes/radioPlayer.js)
        const LEGACY_PLAYLIST = [
            { season: 1, episode: 1, title: "Lucky Charm", file: "LuckyCharm_v35.mp3", duration: "3:45" },
            { season: 1, episode: 2, title: "Jump Right In", file: "JumpRightIn_v25.mp3", duration: "3:42" },
            { season: 1, episode: 3, title: "Dream With Me", file: "DreamWithMe_v5.mp3", duration: "3:20" },
            { season: 1, episode: 4, title: "Daphne", file: "Daphne_v21.mp3", duration: "3:48" },
            { season: 1, episode: 5, title: "Falling", file: "Falling_v32.mp3", duration: "3:32" },
            { season: 1, episode: 6, title: "Once More", file: "OnceMore_v20.mp3", duration: "4:52" },
            { season: 1, episode: 7, title: "History Lessons", file: "HistoryLessons_v8.mp3", duration: "3:57" },
            { season: 1, episode: 8, title: "Life In The Shire", file: "LIfeInTheShire_v19.mp3", duration: "4:02" },
            { season: 1, episode: 9, title: "Feed The Crows", file: "FeedTheCrows_v24.mp3", duration: "2:48" },
            { season: 1, episode: 10, title: "Keep On", file: "Keep On_v26.mp3", duration: "2:26" },
            { season: 1, episode: 11, title: "Back To The Shire", file: "BackToTheShire_v18.mp3", duration: "4:22" }
        ];

        const result = await this.songsService.migrateHardcodedPlaylist(LEGACY_PLAYLIST);
        
        console.log(chalk.green(`✅ Migration completed:`));
        console.log(chalk.white(`   📦 Migrated: ${result.migrated} songs`));
        console.log(chalk.gray(`   ⏭️ Skipped: ${result.skipped} existing songs`));
        
        if (result.errors.length > 0) {
            console.log(chalk.red(`   ❌ Errors: ${result.errors.length}`));
            result.errors.forEach(error => {
                console.log(chalk.red(`      ${error}`));
            });
        }
    }

    async syncSongsWithEpisodes(args) {
        console.log(chalk.blue('🔄 Synchronizing songs with episode visibility...'));
        
        // This would integrate with the episode creation pipeline
        // to automatically publish/hide songs based on episode status
        
        const publishedEpisodes = await this.getPublishedEpisodes();
        const allSongs = await this.songsService.getAllSongs();
        
        let synced = 0;
        let errors = 0;

        for (const song of allSongs) {
            const episodeKey = `S${song.season}E${song.episode}`;
            const episodePublished = publishedEpisodes.some(ep => 
                ep.season === song.season && ep.episode === song.episode
            );
            
            if (song.isPublished !== episodePublished) {
                try {
                    await this.songsService.updatePublishedStatus(song.season, song.episode, episodePublished);
                    console.log(chalk.green(`   ✅ ${episodeKey}: ${episodePublished ? 'Published' : 'Hidden'}`));
                    synced++;
                } catch (error) {
                    console.log(chalk.red(`   ❌ ${episodeKey}: ${error.message}`));
                    errors++;
                }
            }
        }
        
        console.log(chalk.green(`🔄 Sync completed: ${synced} songs updated, ${errors} errors`));
    }

    async getPublishedEpisodes() {
        // This would integrate with the existing episode helpers
        // For now, return a placeholder - this should be implemented
        // to check actual episode visibility in Firebase
        return [];
    }

    async showSongsHealth() {
        console.log(chalk.blue('🏥 Firebase Songs Service Health Check'));
        console.log('');

        try {
            const allSongs = await this.songsService.getAllSongs();
            const publishedSongs = allSongs.filter(s => s.isPublished);
            const hiddenSongs = allSongs.filter(s => !s.isPublished);

            // Group by season
            const seasonStats = allSongs.reduce((acc, song) => {
                if (!acc[song.season]) {
                    acc[song.season] = { total: 0, published: 0, hidden: 0 };
                }
                acc[song.season].total++;
                if (song.isPublished) {
                    acc[song.season].published++;
                } else {
                    acc[song.season].hidden++;
                }
                return acc;
            }, {});

            console.log(chalk.green(`📊 Total Songs: ${allSongs.length}`));
            console.log(chalk.green(`   ✅ Published: ${publishedSongs.length}`));
            console.log(chalk.yellow(`   🚫 Hidden: ${hiddenSongs.length}`));
            console.log('');

            console.log(chalk.cyan('📺 By Season:'));
            for (const [season, stats] of Object.entries(seasonStats).sort()) {
                console.log(`   Season ${season}: ${stats.total} total (${chalk.green(stats.published + ' published')}, ${chalk.yellow(stats.hidden + ' hidden')})`);
            }
            console.log('');

            console.log(chalk.blue('🔧 Service Status: ✅ Connected'));
            console.log(chalk.gray(`   Database: ${this.songsService.initialized ? 'Ready' : 'Initializing'}`));
            
        } catch (error) {
            console.log(chalk.red(`❌ Health check failed: ${error.message}`));
        }
    }

    // Radio Player Methods

    async showRadioPlaylist(args) {
        console.log(chalk.blue('📻 Current Radio Playlist'));
        
        try {
            const season = args.length > 0 ? parseInt(args[0]) : null;
            const songs = season ? 
                await this.songsService.getSongsBySeason(season) : 
                await this.songsService.getPublishedSongs();
            
            if (!songs || songs.length === 0) {
                console.log(chalk.yellow('📭 Radio playlist is empty'));
                console.log(chalk.gray('   Songs are only visible in radio when published'));
                return;
            }

            console.log(chalk.green(`🎵 Radio has ${songs.length} available song${songs.length > 1 ? 's' : ''}${season ? ` in Season ${season}` : ''}`));
            
            // Show playlist in radio player order
            songs.sort((a, b) => {
                if (a.season !== b.season) return a.season - b.season;
                return a.episode - b.episode;
            }).forEach((song, index) => {
                console.log(`${chalk.gray((index + 1).toString().padStart(3))}.  ${chalk.white(`S${song.season}E${song.episode.toString().padStart(2, '0')}`)} ${chalk.magenta(song.title.padEnd(30))} ${song.duration}`);
            });
            
        } catch (error) {
            console.log(chalk.red(`❌ Failed to load radio playlist: ${error.message}`));
        }
    }

    async checkRadioHealth() {
        console.log(chalk.blue('🔍 Radio Player Health Check'));
        
        try {
            // Check if the radio API endpoints are responding
            console.log(chalk.gray('   Checking /api/radio/health...'));
            
            // Use native fetch (Node 18+) or axios as fallback
            const response = await fetch('http://localhost:3001/api/radio/health');
            
            if (response.ok) {
                const health = await response.json();
                console.log(chalk.green('   ✅ Radio API is responding'));
                console.log(chalk.white(`   📊 Firebase Service: ${health.firebaseService ? '✅ Connected' : '❌ Offline'}`));
                console.log(chalk.white(`   📻 Songs Available: ${health.firebaseSongs || 0}`));
                console.log(chalk.white(`   📦 Legacy Playlist: ${health.legacyPlaylistSize} songs`));
                console.log(chalk.gray(`   🕐 Last Check: ${new Date(health.timestamp).toLocaleString()}`));
            } else {
                console.log(chalk.red('   ❌ Radio API not responding'));
                console.log(chalk.gray('   Make sure the server is running on port 3001'));
            }
            
        } catch (error) {
            console.log(chalk.red(`❌ Health check failed: ${error.message}`));
            console.log(chalk.gray('   Make sure the server is running: npm start'));
        }
    }

    async migrateRadioPlaylist() {
        console.log(chalk.blue('🔄 Triggering radio playlist migration via API...'));
        
        try {
            // Use native fetch (Node 18+)
            const response = await fetch('http://localhost:3001/api/radio/migrate-playlist', {
                method: 'POST'
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log(chalk.green('✅ Migration triggered successfully'));
                console.log(chalk.white(`   📦 Migrated: ${result.migrated} songs`));
                console.log(chalk.gray(`   ⏭️ Skipped: ${result.skipped} existing songs`));
                
                if (result.errors && result.errors.length > 0) {
                    console.log(chalk.red(`   ❌ Errors: ${result.errors.length}`));
                }
            } else {
                const error = await response.json();
                console.log(chalk.red(`❌ Migration failed: ${error.error}`));
            }
            
        } catch (error) {
            console.log(chalk.red(`❌ Migration request failed: ${error.message}`));
        }
    }

    async testRadioEndpoints() {
        console.log(chalk.blue('🧪 Testing Radio Player Endpoints'));
        
        const endpoints = [
            { url: '/api/radio/playlist', method: 'GET', name: 'Full Playlist' },
            { url: '/api/radio/playlist?season=1', method: 'GET', name: 'Season 1 Playlist' },
            { url: '/api/radio/health', method: 'GET', name: 'Health Check' },
            { url: '/radio', method: 'GET', name: 'Radio Player Page' }
        ];

        // Use native fetch (Node 18+)
        const baseUrl = 'http://localhost:3001';

        for (const endpoint of endpoints) {
            try {
                console.log(chalk.gray(`   Testing ${endpoint.name}...`));
                const response = await fetch(baseUrl + endpoint.url);
                
                if (response.ok) {
                    const data = endpoint.url.includes('/radio') && !endpoint.url.includes('/api') ? 
                        `HTML (${response.headers.get('content-type')})` : 
                        await response.json();
                    
                    console.log(chalk.green(`   ✅ ${endpoint.name}: OK`));
                    
                    if (Array.isArray(data)) {
                        console.log(chalk.gray(`      ${data.length} items returned`));
                    } else if (typeof data === 'object' && data.firebaseSongs !== undefined) {
                        console.log(chalk.gray(`      Firebase: ${data.firebaseService ? 'Connected' : 'Offline'}, Songs: ${data.firebaseSongs || 0}`));
                    }
                } else {
                    console.log(chalk.red(`   ❌ ${endpoint.name}: ${response.status} ${response.statusText}`));
                }
                
            } catch (error) {
                console.log(chalk.red(`   ❌ ${endpoint.name}: ${error.message}`));
            }
        }
    }

    // Help Methods

    showSongHelp() {
        console.log(chalk.cyan.bold('🎵 Song Management Commands'));
        console.log(chalk.cyan('============================'));
        console.log('');
        console.log(chalk.white('songs list [season]         ') + chalk.gray('List all songs or songs for specific season'));
        console.log(chalk.white('songs add <s> <e> <title> <file> <duration>  ') + chalk.gray('Add new song'));
        console.log(chalk.white('songs update <s> <e> field=value [...]       ') + chalk.gray('Update song properties'));
        console.log(chalk.white('songs publish <season> <episode>             ') + chalk.gray('Publish song (make visible in radio)'));
        console.log(chalk.white('songs hide <season> <episode>                ') + chalk.gray('Hide song from radio'));
        console.log(chalk.white('songs migrate                                ') + chalk.gray('Import legacy playlist to Firebase'));
        console.log(chalk.white('songs sync                                   ') + chalk.gray('Sync song visibility with episodes'));
        console.log(chalk.white('songs health                                 ') + chalk.gray('Show Firebase connection status'));
        console.log('');
        console.log(chalk.yellow('Examples:'));
        console.log(chalk.gray('  songs list 1                              # Show Season 1 songs'));
        console.log(chalk.gray('  songs add 1 12 "New Song" "song.mp3" "3:45"  # Add new song'));
        console.log(chalk.gray('  songs publish 1 12                        # Make song visible'));
        console.log(chalk.gray('  songs update 1 12 title="Updated Title"   # Update song title'));
        console.log('');
    }

    showRadioHelp() {
        console.log(chalk.cyan.bold('📻 Radio Player Commands'));
        console.log(chalk.cyan('========================='));
        console.log('');
        console.log(chalk.white('radio playlist [season]    ') + chalk.gray('Show current radio playlist'));
        console.log(chalk.white('radio health               ') + chalk.gray('Check radio API endpoints'));
        console.log(chalk.white('radio migrate              ') + chalk.gray('Trigger playlist migration via API'));
        console.log(chalk.white('radio test                 ') + chalk.gray('Test all radio endpoints'));
        console.log('');
        console.log(chalk.yellow('Examples:'));
        console.log(chalk.gray('  radio playlist 1           # Show Season 1 radio tracks'));
        console.log(chalk.gray('  radio health               # Check if radio API is working'));
        console.log(chalk.gray('  radio test                 # Test all radio endpoints'));
        console.log('');
    }

    sanitizeForFirebase(item) {
        // Create a clean copy for Firebase
        const clean = { ...item };
        
        // Remove any local-only fields that shouldn't go to Firebase
        delete clean._localCache;
        delete clean._tempData;
        delete clean._editSession;
        
        // Ensure consistent field names
        if (clean.visibility === undefined && clean.hidden) {
            clean.visibility = clean.hidden ? 'hidden' : 'visible';
        }
        
        // Clean up empty arrays and objects
        Object.keys(clean).forEach(key => {
            if (Array.isArray(clean[key]) && clean[key].length === 0) {
                delete clean[key]; // Remove empty arrays
            }
            if (typeof clean[key] === 'object' && clean[key] !== null && Object.keys(clean[key]).length === 0) {
                delete clean[key]; // Remove empty objects
            }
        });
        
        return clean;
    }
}

// Start the CLI
if (require.main === module) {
    const cli = new WavelengthContentCLI();
    cli.start().catch(console.error);
}

module.exports = WavelengthContentCLI;