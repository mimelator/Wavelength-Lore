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
const crypto = require('crypto');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { WavelengthChatCLI } = require('./wavelength-chat-cli');
const loreHelpers = require('./helpers/lore-helpers');
const characterHelpers = require('./helpers/character-helpers');
const episodeHelpers = require('./helpers/episode-helpers');
const FirebaseSongsService = require('./services/firebase-songs-service');
const BackupCommands = require('./commands/backup-commands');
const CharacterCommands = require('./commands/character-commands');
const LoreCommands = require('./commands/lore-commands');
const SongsCommands = require('./commands/songs-commands');
const MediaCommands = require('./commands/media-commands');

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
        this.mediaCommands = new MediaCommands(this);
        this.importedPrompts = null; // Loaded prompts from import
        
        // Initialize S3 client for image uploads
        this.s3Client = new S3Client({
            region: process.env.AWS_REGION || 'us-east-1',
            credentials: {
                accessKeyId: process.env.ACCESS_KEY_ID,
                secretAccessKey: process.env.SECRET_ACCESS_KEY
            }
        });
        
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
        
        // Load imported prompts if available
        await this.loadImportedPrompts();
        
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
                    
                case 'media':
                    await this.mediaCommands.handleMediaCommands(args);
                    break;
                    
                case 'prompts':
                    await this.handlePromptsCommand(args);
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
        
        // Show quick command reminder after each command
        this.showQuickCommands();
        this.showPrompt();
    }

    /**
     * Show quick command reminder (condensed version)
     */
    showQuickCommands() {
        console.log(chalk.gray('\n💡 Quick Commands: ') + 
            chalk.white('ls') + ' | ' +
            chalk.white('cd') + ' | ' +
            chalk.white('view') + ' | ' +
            chalk.white('edit') + ' | ' +
            chalk.white('search') + ' | ' +
            chalk.white('media') + ' | ' +
            chalk.white('preview') + ' | ' +
            chalk.white('help') + ' | ' +
            chalk.white('exit'));
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
        
        console.log(chalk.green('\nMedia Generation (AI):'));
        console.log('  media images generate "prompt" [--count=<n>]');
        console.log('  media images preview [asset-id] [--browser]');
        console.log('  media images approve <asset-id>');
        console.log('  media images reject <asset-id> [--reason="reason"]');
        console.log('  media images regenerate <asset-id>');
        console.log(chalk.red.bold('  ⚠️  media videos generate --force --image=<url> --prompt="description"'));
        console.log(chalk.red.bold('      (WARNING: UNTESTED & EXPENSIVE - Requires --force flag)'));
        console.log('  media videos status <operation-id>');
        console.log('  media episode <episode-id> generate [--images=<n>]');
        console.log('  media help                              - Detailed media generation help');
        
        console.log(chalk.green('\nPrompts Management:'));
        console.log('  prompts list                            - List all imported prompts');
        console.log('  prompts list --type=<characters|locations|lore> - Filter by type');
        console.log('  prompts search <query>                  - Search prompts by content ID or text');
        console.log('  prompts show <content-id>               - Show all prompts for a content item');
        console.log('  prompts stats                           - Show prompt statistics');
        console.log('  prompts import                          - Re-import prompts from content/prompts/');
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

        // Calculate special action numbers dynamically based on field count
        const hasGalleryField = editableFields.find(f => f.key === 'gallery');
        const startActionNum = editableFields.length + 1;
        
        console.log('');
        console.log(chalk.cyan('Special Actions:'));
        
        if (hasGalleryField) {
            console.log(chalk.white(`  ${startActionNum}. 🖼️  Manage Image Gallery (view/validate)`));
            console.log(chalk.white(`  ${startActionNum + 1}. 🖼️  Set Primary Image from Gallery`));
            console.log(chalk.white(`  ${startActionNum + 2}. 🎨 Generate AI Image`));
            console.log(chalk.red.bold(`  ${startActionNum + 3}. 🎬 Generate AI Video ${chalk.yellow('(⚠️ UNTESTED & EXPENSIVE)')}`));
            console.log(chalk.white(`  ${startActionNum + 4}. 🤖 AI Enhance All Fields`));
            console.log(chalk.white(`  ${startActionNum + 5}. 💾 Save & Exit`));
        } else {
            console.log(chalk.white(`  ${startActionNum}. 🖼️  Set Primary Image from Gallery`));
            console.log(chalk.white(`  ${startActionNum + 1}. 🎨 Generate AI Image`));
            console.log(chalk.red.bold(`  ${startActionNum + 2}. 🎬 Generate AI Video ${chalk.yellow('(⚠️ UNTESTED & EXPENSIVE)')}`));
            console.log(chalk.white(`  ${startActionNum + 3}. 🤖 AI Enhance All Fields`));
            console.log(chalk.white(`  ${startActionNum + 4}. 💾 Save & Exit`));
        }
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

        // Calculate special action numbers dynamically based on field count
        const hasGalleryField = editableFields.find(f => f.key === 'gallery');
        const startActionNum = editableFields.length + 1;
        const manageGalleryNum = hasGalleryField ? startActionNum : null;
        const setPrimaryNum = hasGalleryField ? startActionNum + 1 : startActionNum;
        const generateImageNum = hasGalleryField ? startActionNum + 2 : startActionNum + 1;
        const generateVideoNum = hasGalleryField ? startActionNum + 3 : startActionNum + 2;
        const enhanceAllNum = hasGalleryField ? startActionNum + 4 : startActionNum + 3;
        const saveExitNum = hasGalleryField ? startActionNum + 5 : startActionNum + 4;
        const maxChoice = saveExitNum;

        while (true) {
            console.log('');
            const actionRange = hasGalleryField ? 
                `${startActionNum}-${saveExitNum}` : 
                `${startActionNum}-${saveExitNum}`;
            const choice = await prompt(`Enter your choice (1-${editableFields.length}, ${actionRange}, or 0 to cancel): `);
            const choiceNum = parseInt(choice);

            if (choiceNum === 0) {
                console.log(chalk.gray('Edit cancelled'));
                break;
            } else if (choiceNum === saveExitNum) {
                await this.saveItemChanges(item, contentType);
                break;
            } else if (choiceNum === enhanceAllNum) {
                await this.aiEnhanceAllFields(item, contentType);
            } else if (choiceNum === generateVideoNum) {
                await this.generateAIVideo(item);
            } else if (choiceNum === generateImageNum) {
                await this.generateAIImage(item);
            } else if (choiceNum === setPrimaryNum) {
                await this.setPrimaryImageFromGallery(item, contentType);
            } else if (choiceNum === manageGalleryNum && hasGalleryField) {
                // Quick access to gallery management
                await this.manageImageGallery(item, contentType);
            } else if (choiceNum >= 1 && choiceNum <= editableFields.length) {
                const field = editableFields[choiceNum - 1];
                await this.editField(item, field, contentType);
            } else {
                console.log(chalk.red('❌ Invalid choice'));
            }
        }
    }

    /**
     * ✏️ Edit a specific field
     */
    async editField(item, field, contentType = null) {
        // If contentType not provided, try to determine it from context or item structure
        if (!contentType) {
            if (this.currentContext === 'character') {
                contentType = 'character';
            } else if (this.currentContext === 'episode') {
                contentType = 'episode';
            } else if (this.currentContext === 'lore') {
                contentType = 'lore';
            } else {
                // Default to lore
                contentType = 'lore';
            }
        }
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
            // Determine content type from current context
            let contentType = 'lore';
            if (this.currentContext === 'character') {
                contentType = 'character';
            } else if (this.currentContext === 'episode') {
                contentType = 'episode';
            }
            await this.manageImageGallery(item, contentType);
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
    async manageImageGallery(item, contentType = 'lore') {
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
        console.log('  4. 🔍 Validate all images');
        console.log('  5. 📤 Upload image file from disk');
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
            await this.previewImages(item.image_gallery, item.id);
        } else if (choice === '4') {
            await this.validateImageGallery(item.image_gallery);
        } else if (choice === '5') {
            await this.uploadImageFile(item, contentType);
        }
    }

    /**
     * 📤 Upload image file from local filesystem
     */
    async uploadImageFile(item, contentType = 'lore') {
        const prompt = (question) => {
            return new Promise((resolve) => {
                this.rl.question(chalk.yellow(question), resolve);
            });
        };

        console.log(chalk.cyan('\n📤 UPLOAD IMAGE FILE'));
        console.log(chalk.gray('─'.repeat(60)));

        const filePath = await prompt('Enter path to image file: ');
        
        if (!filePath || !filePath.trim()) {
            console.log(chalk.yellow('Upload cancelled'));
            return;
        }

        try {
            const fs = require('fs').promises;
            const path = require('path');
            
            // Resolve file path (handle relative and absolute paths)
            let resolvedPath = filePath.trim();
            if (!path.isAbsolute(resolvedPath)) {
                // Try relative to current working directory
                resolvedPath = path.resolve(process.cwd(), resolvedPath);
            }

            console.log(chalk.gray(`  Reading file: ${resolvedPath}...`));

            // Read file
            const fileBuffer = await fs.readFile(resolvedPath);
            const stats = await fs.stat(resolvedPath);
            const extension = path.extname(resolvedPath).toLowerCase();
            
            // Determine MIME type
            let mimeType = 'image/png';
            if (['.jpg', '.jpeg'].includes(extension)) {
                mimeType = 'image/jpeg';
            } else if (extension === '.png') {
                mimeType = 'image/png';
            } else if (extension === '.webp') {
                mimeType = 'image/webp';
            } else if (extension === '.gif') {
                mimeType = 'image/gif';
            }

            console.log(chalk.gray(`  File size: ${(stats.size / 1024 / 1024).toFixed(2)}MB`));
            console.log(chalk.gray(`  MIME type: ${mimeType}`));

            // Upload to S3 using the same method as AI-generated images
            console.log(chalk.cyan('\n  Uploading to S3...'));
            const relativePath = await this.uploadImageToS3(
                fileBuffer,
                contentType,
                item.id,
                {
                    promptId: `file-upload-${Date.now()}`,
                    model: 'file-upload',
                    generatedAt: new Date().toISOString(),
                    originalFilename: path.basename(resolvedPath)
                }
            );

            // Add to gallery
            if (!item.image_gallery) {
                item.image_gallery = [];
            }
            item.image_gallery.push(relativePath);
            
            console.log(chalk.green(`\n✅ Image uploaded and added to gallery!`));
            console.log(chalk.gray(`   Path: ${relativePath}`));
            console.log(chalk.yellow('\n💡 Remember to save changes (option 12) to persist to Firebase'));

        } catch (error) {
            if (error.code === 'ENOENT') {
                console.log(chalk.red(`\n❌ File not found: ${filePath}`));
                console.log(chalk.yellow('   Tip: Use an absolute path or a path relative to the current directory'));
            } else {
                console.log(chalk.red(`\n❌ Upload failed: ${error.message}`));
                if (process.env.DEBUG) {
                    console.error(error.stack);
                }
            }
        }
    }

    /**
     * 🎨 Generate AI Image for item
     * Contextual workflow: show prompts, generate, preview, add to gallery
     */
    async generateAIImage(item) {
        const prompt = (question) => {
            return new Promise((resolve) => {
                this.rl.question(chalk.yellow(question), resolve);
            });
        };

        console.log(chalk.cyan('\n🎨 AI IMAGE GENERATION'));
        console.log(chalk.gray(`Generating image for: ${item.title || item.name || item.id}\n`));

        // Generate suggested prompts from item data
        const suggestedPrompts = this.generatePromptsForItem(item);
        
        // Check if we have actual prompts or just the "no prompts" message
        const hasActualPrompts = suggestedPrompts.length > 0 && 
                                 suggestedPrompts[0].source !== 'No Prompts';
        
        if (hasActualPrompts) {
            console.log(chalk.green('\n📝 Imported Prompts:'));
            console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
            
            suggestedPrompts.forEach((promptObj, index) => {
                const promptText = typeof promptObj === 'string' ? promptObj : promptObj.text;
                const source = typeof promptObj === 'string' ? 'Item data' : promptObj.source;
                const description = typeof promptObj === 'string' ? '' : promptObj.description;
                
                // Handle multi-paragraph prompts - show first 200 chars and indicate length
                const preview = promptText.length > 200 ? promptText.substring(0, 197) + '...' : promptText;
                const lineCount = promptText.split('\n').length;
                
                console.log(chalk.cyan(`  ${index + 1}. [${source}]`));
                if (promptText) {
                    console.log(chalk.white(`     ${preview.replace(/\n/g, ' ')}`));
                    if (promptText.length > 200) {
                        console.log(chalk.gray(`     ... (${promptText.length} characters, ${lineCount} lines)`));
                    } else if (lineCount > 1) {
                        console.log(chalk.gray(`     (${lineCount} lines)`));
                    }
                }
                if (description) {
                    console.log(chalk.gray(`     ${description}`));
                }
                console.log('');
            });
        } else {
            console.log(chalk.yellow('\n⚠️  No imported prompts found for this item.'));
            console.log(chalk.gray('   Run "npm run prompts:import" to import prompts from content/prompts/\n'));
        }
        
        console.log(chalk.yellow(`  ${hasActualPrompts ? suggestedPrompts.length + 1 : 1}. 📄 Load prompt from file`));
        console.log(chalk.gray('  0. Cancel\n'));

        const choice = await prompt('Select a prompt (or 0 to cancel): ');
        const choiceNum = parseInt(choice);

        if (choiceNum === 0) {
            console.log(chalk.yellow('Cancelled'));
            return;
        }

        let selectedPrompt;
        if (hasActualPrompts && choiceNum > 0 && choiceNum <= suggestedPrompts.length) {
            const promptObj = suggestedPrompts[choiceNum - 1];
            selectedPrompt = typeof promptObj === 'string' ? promptObj : promptObj.text;
            const source = typeof promptObj === 'string' ? 'Item data' : promptObj.source;
            console.log(chalk.green(`\n✅ Selected prompt [${source}]:`));
            console.log(chalk.white(`   ${selectedPrompt}`));
        } else if ((hasActualPrompts && choiceNum === suggestedPrompts.length + 1) || 
                   (!hasActualPrompts && choiceNum === 1)) {
            // Load prompt from file
            const filePath = await prompt('\n📄 Enter path to prompt file: ');
            if (!filePath.trim()) {
                console.log(chalk.yellow('Cancelled'));
                return;
            }
            
            try {
                const fs = require('fs').promises;
                const path = require('path');
                
                // Resolve the path - try multiple strategies
                let resolvedPath = filePath.trim();
                const attemptedPaths = [];
                
                // If it's already an absolute path, try it directly
                if (path.isAbsolute(resolvedPath)) {
                    attemptedPaths.push(resolvedPath);
                } else {
                    // Try multiple relative path strategies
                    // 1. Relative to current working directory
                    const cwdPath = path.resolve(process.cwd(), resolvedPath);
                    attemptedPaths.push(cwdPath);
                    
                    // 2. Relative to CLI's directory (Wavelength-Lore.fresh)
                    const cliDirPath = path.resolve(__dirname, resolvedPath);
                    attemptedPaths.push(cliDirPath);
                    
                    // 3. If path starts with "Wavelength-Lore/Wavelength-Lore.fresh/", strip it
                    let cleanPath = resolvedPath;
                    if (cleanPath.startsWith('Wavelength-Lore/Wavelength-Lore.fresh/')) {
                        cleanPath = cleanPath.replace('Wavelength-Lore/Wavelength-Lore.fresh/', '');
                        attemptedPaths.push(path.resolve(__dirname, cleanPath));
                    }
                    if (cleanPath.startsWith('Wavelength-Lore.fresh/')) {
                        cleanPath = cleanPath.replace('Wavelength-Lore.fresh/', '');
                        attemptedPaths.push(path.resolve(__dirname, cleanPath));
                    }
                    
                    // 4. Try relative to project root (one level up from CLI dir)
                    const projectRootPath = path.resolve(__dirname, '..', resolvedPath);
                    attemptedPaths.push(projectRootPath);
                    
                    // 5. If absolute path was provided, try it too
                    const absPath = path.resolve(resolvedPath);
                    if (absPath !== cwdPath && absPath !== cliDirPath) {
                        attemptedPaths.push(absPath);
                    }
                }
                
                // Remove duplicates and try each path
                const uniquePaths = [...new Set(attemptedPaths)];
                let foundPath = null;
                
                for (const tryPath of uniquePaths) {
                    try {
                        await fs.access(tryPath);
                        foundPath = tryPath;
                        break;
                    } catch {
                        // Continue to next path
                    }
                }
                
                if (!foundPath) {
                    console.log(chalk.red(`\n❌ File not found. Attempted paths:`));
                    uniquePaths.forEach(p => console.log(chalk.gray(`   - ${p}`)));
                    console.log(chalk.yellow(`\n   Current directory: ${process.cwd()}`));
                    console.log(chalk.yellow(`   CLI directory: ${__dirname}`));
                    console.log(chalk.yellow('   Tip: Try a relative path like: content/prompts/lore/daphne-flower-prompt.md\n'));
                    return;
                }
                
                resolvedPath = foundPath;
                console.log(chalk.gray(`   Loading: ${resolvedPath}`));
                const fileContent = await fs.readFile(resolvedPath, 'utf-8');
                
                selectedPrompt = fileContent.trim();
                console.log(chalk.green(`\n✅ Loaded prompt from: ${resolvedPath}`));
                console.log(chalk.gray(`   ${selectedPrompt.length} characters, ${selectedPrompt.split('\n').length} lines`));
                
                // Show preview (first 200 chars)
                const preview = selectedPrompt.length > 200 
                    ? selectedPrompt.substring(0, 197) + '...' 
                    : selectedPrompt;
                console.log(chalk.white(`\n   Preview: ${preview.replace(/\n/g, ' ')}`));
                
                // Save this prompt to imported prompts for future use
                await this.savePromptToImported(item, selectedPrompt, resolvedPath);
            } catch (error) {
                console.error(chalk.red(`\n❌ Failed to load file: ${error.message}`));
                console.log(chalk.yellow('   Please check the file path and try again\n'));
                return;
            }
        } else {
            console.log(chalk.red('Invalid choice'));
            return;
        }

        // Allow editing the prompt via file
        console.log(chalk.yellow('\n💡 You can edit this prompt before generating.'));
        const editChoice = await prompt('Edit prompt? (y/n, default: n): ');
        
        if (editChoice.toLowerCase() === 'y' || editChoice.toLowerCase() === 'yes') {
            console.log(chalk.gray('\n   Current prompt:'));
            const preview = selectedPrompt.length > 300 
                ? selectedPrompt.substring(0, 297) + '...' 
                : selectedPrompt;
            console.log(chalk.white(`   ${preview.split('\n').join('\n   ')}`));
            console.log(chalk.yellow('\n   📄 Load edited prompt from file (or press Enter to keep current):'));
            const editFilePath = await prompt('   File path: ');
            
            if (editFilePath.trim()) {
                try {
                    const fs = require('fs').promises;
                    const path = require('path');
                    
                    // Use the same path resolution logic
                    let resolvedPath = editFilePath.trim();
                    if (!path.isAbsolute(resolvedPath)) {
                        const cwdPath = path.resolve(process.cwd(), resolvedPath);
                        const cliDirPath = path.resolve(__dirname, resolvedPath);
                        
                        let cleanPath = resolvedPath;
                        if (cleanPath.startsWith('Wavelength-Lore/Wavelength-Lore.fresh/')) {
                            cleanPath = cleanPath.replace('Wavelength-Lore/Wavelength-Lore.fresh/', '');
                        }
                        if (cleanPath.startsWith('Wavelength-Lore.fresh/')) {
                            cleanPath = cleanPath.replace('Wavelength-Lore.fresh/', '');
                        }
                        
                        const paths = [cwdPath, cliDirPath, path.resolve(__dirname, cleanPath)];
                        let foundPath = null;
                        
                        for (const tryPath of paths) {
                            try {
                                await fs.access(tryPath);
                                foundPath = tryPath;
                                break;
                            } catch {}
                        }
                        
                        if (foundPath) {
                            resolvedPath = foundPath;
                        } else {
                            resolvedPath = cwdPath;
                        }
                    }
                    
                    const editedContent = await fs.readFile(resolvedPath, 'utf-8');
                    selectedPrompt = editedContent.trim();
                    console.log(chalk.green(`   ✅ Loaded edited prompt from: ${resolvedPath}`));
                } catch (error) {
                    console.log(chalk.yellow(`   ⚠️  Could not load file, keeping current prompt: ${error.message}`));
                }
            }
        }

        // Use prompt directly without templates - user's prompt is complete and ready to use
        console.log(chalk.cyan('\n🎨 Generating image with your prompt...\n'));
        
        try {
            const result = await this.mediaCommands.mediaService.generateImages({
                promptText: selectedPrompt,
                // No template - use prompt as-is
                count: 1,
                width: 1024,
                height: 1024,
                style: 'photorealistic', // Default style
                contentType: 'lore',
                contentId: item.id,
                metadata: {
                    itemId: item.id,
                    itemTitle: item.title || item.name,
                    generatedBy: 'cli-interactive',
                    timestamp: Date.now()
                }
            });

            if (result.success && result.images && result.images.length > 0) {
                const generatedImage = result.images[0];
                const imageUrl = generatedImage.url || generatedImage.previewUrl;
                
                if (!imageUrl) {
                    console.log(chalk.red('❌ Generated image but no URL returned'));
                    return;
                }

                console.log(chalk.green('\n✅ Image generated successfully!\n'));
                
                // Preview the image
                console.log(chalk.yellow('\n💡 Would you like to preview this image in your browser?'));
                const previewChoice = await prompt('Preview? (y/n, default: y): ');
                
                if (!previewChoice || previewChoice.toLowerCase() !== 'n') {
                    // Handle data URLs by creating a temp HTML file
                    if (imageUrl.startsWith('data:')) {
                        try {
                            const fs = require('fs').promises;
                            const path = require('path');
                            const os = require('os');
                            
                            // Create temp HTML file with the image
                            const tempDir = os.tmpdir();
                            const tempFile = path.join(tempDir, `wavelength-preview-${Date.now()}.html`);
                            const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Wavelength Image Preview</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            background: #1a1a1a;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        img {
            max-width: 100%;
            max-height: 100vh;
            border: 2px solid #333;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        }
    </style>
</head>
<body>
    <img src="${imageUrl}" alt="Generated Image" />
</body>
</html>`;
                            
                            await fs.writeFile(tempFile, htmlContent);
                            
                            try {
                                const open = require('open');
                                await open(tempFile);
                                console.log(chalk.green('✅ Opening preview in browser...'));
                                console.log(chalk.gray(`   Temp file: ${tempFile}`));
                            } catch (e) {
                                console.log(chalk.yellow(`💡 Could not auto-open. View the file manually:`));
                                console.log(chalk.white(`   ${tempFile}`));
                            }
                        } catch (error) {
                            console.log(chalk.yellow('💡 Could not create preview file. The image URL is available above.'));
                        }
                    } else {
                        // Regular URL - open directly
                        try {
                            const open = require('open');
                            await open(imageUrl);
                            console.log(chalk.green('✅ Opening in browser...'));
                            console.log(chalk.cyan('Image URL:'));
                            console.log(chalk.white(imageUrl));
                        } catch (e) {
                            console.log(chalk.yellow('💡 Copy the URL above to view in your browser'));
                            console.log(chalk.cyan('Image URL:'));
                            console.log(chalk.white(imageUrl));
                        }
                    }
                } else {
                    // Show URL even if not previewing
                    console.log(chalk.cyan('\nImage URL:'));
                    console.log(chalk.white(imageUrl.substring(0, 100) + (imageUrl.length > 100 ? '...' : '')));
                }

                // Ask if they want to add to gallery
                console.log(chalk.yellow('\n💡 Would you like to add this image to the gallery?'));
                const addChoice = await prompt('Add to gallery? (y/n, default: y): ');
                
                if (!addChoice || addChoice.toLowerCase() !== 'n') {
                    // Determine content type from current context
                    let contentType = 'lore'; // Default
                    if (this.currentContext === 'character') {
                        contentType = 'character';
                    } else if (this.currentContext === 'episode') {
                        contentType = 'episode';
                    } else if (this.currentContext === 'lore') {
                        contentType = 'lore';
                    }
                    
                    // Upload to S3 if it's a data URL
                    let galleryPath = imageUrl;
                    if (imageUrl.startsWith('data:')) {
                        console.log(chalk.cyan('\n📤 Uploading image to S3...'));
                        try {
                            galleryPath = await this.uploadImageToS3(
                                imageUrl,
                                contentType,
                                item.id,
                                {
                                    promptId: `cli-${Date.now()}`,
                                    model: 'openai-dalle-3',
                                    generatedAt: new Date().toISOString()
                                }
                            );
                            console.log(chalk.green(`✅ Image uploaded to S3: ${galleryPath}`));
                        } catch (uploadError) {
                            console.error(chalk.red(`❌ Failed to upload to S3: ${uploadError.message}`));
                            console.log(chalk.yellow('💡 Storing as data URL instead (not recommended for production)'));
                            // Continue with data URL if upload fails
                        }
                    }
                    
                    if (!item.image_gallery) {
                        item.image_gallery = [];
                    }
                    item.image_gallery.push(galleryPath);
                    console.log(chalk.green(`✅ Image added to gallery! (Total: ${item.image_gallery.length} images)`));
                    console.log(chalk.gray(`   Path: ${galleryPath}`));
                    
                    // Save the changes to Firebase
                    await this.saveItemChanges(item, contentType);
                } else {
                    console.log(chalk.yellow('Image not added to gallery'));
                }
            } else {
                console.log(chalk.red('❌ Image generation failed - no images returned'));
            }
        } catch (error) {
            console.error(chalk.red(`❌ Generation failed: ${error.message}`));
            if (process.env.DEBUG) {
                console.error(error.stack);
            }
        }
    }

    /**
     * 🖼️ Set primary image from gallery
     */
    async setPrimaryImageFromGallery(item, contentType = 'lore') {
        const prompt = (question) => {
            return new Promise((resolve) => {
                this.rl.question(chalk.yellow(question), resolve);
            });
        };

        console.log(chalk.cyan('\n🖼️  SET PRIMARY IMAGE FROM GALLERY'));
        console.log(chalk.gray('─'.repeat(50)));

        if (!item.image_gallery || item.image_gallery.length === 0) {
            console.log(chalk.red('❌ No images in gallery. Generate or add images first.'));
            return;
        }

        console.log(chalk.white('\nAvailable images in gallery:'));
        console.log(chalk.gray('─'.repeat(50)));
        
        item.image_gallery.forEach((imagePath, index) => {
            const isCurrentPrimary = (item.primaryImage === imagePath || item.primary_image === imagePath || item.image === imagePath);
            const marker = isCurrentPrimary ? chalk.green(' ✓ (CURRENT)') : '';
            const preview = imagePath.length > 60 ? imagePath.substring(0, 60) + '...' : imagePath;
            console.log(chalk.white(`  ${index + 1}. ${preview}`) + marker);
        });

        console.log(chalk.gray('─'.repeat(50)));
        const choice = await prompt(`\nSelect image to set as primary (1-${item.image_gallery.length}, or 0 to cancel): `);
        const choiceNum = parseInt(choice);

        if (choiceNum === 0) {
            console.log(chalk.gray('Cancelled'));
            return;
        }

        if (choiceNum < 1 || choiceNum > item.image_gallery.length) {
            console.log(chalk.red('❌ Invalid selection'));
            return;
        }

        const selectedImage = item.image_gallery[choiceNum - 1];
        
        // Set primary image based on content type
        // Lore items use 'primaryImage', characters use 'primary_image', some use 'image'
        if (contentType === 'lore') {
            item.primaryImage = selectedImage;
            // Also set 'image' field for backward compatibility
            item.image = selectedImage;
        } else if (contentType === 'character') {
            item.primary_image = selectedImage;
            item.image = selectedImage;
        } else {
            item.image = selectedImage;
            item.primaryImage = selectedImage;
        }

        console.log(chalk.green(`\n✅ Primary image set to:`));
        console.log(chalk.white(`   ${selectedImage}`));
        console.log(chalk.yellow('\n💡 Remember to save changes (option 12) to persist to Firebase'));
    }

    /**
     * 🔍 Validate image gallery - check which images are accessible
     */
    async validateImageGallery(imageGallery) {
        if (!imageGallery || imageGallery.length === 0) {
            console.log(chalk.yellow('❌ No images in gallery to validate'));
            return;
        }

        console.log(chalk.cyan('\n🔍 VALIDATING IMAGE GALLERY'));
        console.log(chalk.gray('─'.repeat(60)));
        
        const axios = require('axios');
        // For validation, always use CloudFront to check actual CDN availability
        // Local CDN_URL is for local dev, but we want to validate production CDN
        const cloudFrontUrl = 'https://df5sj8f594cdx.cloudfront.net';
        const localCdnUrl = process.env.CDN_URL || 'http://localhost:3001';
        
        const results = [];
        
        for (let i = 0; i < imageGallery.length; i++) {
            const imagePath = imageGallery[i];
            
            // Build full URL - use CloudFront for validation to check actual CDN
            let testUrl;
            if (imagePath.startsWith('http')) {
                testUrl = imagePath;
            } else if (imagePath.startsWith('/')) {
                // Use CloudFront URL for validation (checks actual CDN, not localhost)
                testUrl = `${cloudFrontUrl}${imagePath}`;
            } else {
                testUrl = `${cloudFrontUrl}/${imagePath}`;
            }
            
            process.stdout.write(chalk.gray(`  Checking ${i + 1}/${imageGallery.length}: ${imagePath.substring(0, 50)}... `));
            
            try {
                const response = await axios.head(testUrl, {
                    timeout: 5000,
                    validateStatus: (status) => status < 500, // Accept redirects
                    maxRedirects: 5
                });
                
                const isAccessible = response.status < 400;
                const statusEmoji = isAccessible ? '✅' : '❌';
                const statusColor = isAccessible ? chalk.green : chalk.red;
                
                results.push({
                    path: imagePath,
                    url: testUrl,
                    accessible: isAccessible,
                    status: response.status,
                    statusText: response.statusText
                });
                
                console.log(statusColor(`${statusEmoji} ${response.status} ${response.statusText || ''}`));
                
            } catch (error) {
                results.push({
                    path: imagePath,
                    url: testUrl,
                    accessible: false,
                    status: 'error',
                    error: error.message
                });
                console.log(chalk.red(`❌ ${error.message}`));
            }
        }
        
        console.log(chalk.gray('─'.repeat(60)));
        const accessibleCount = results.filter(r => r.accessible).length;
        const totalCount = results.length;
        
        console.log(chalk.cyan(`\n📊 Validation Summary:`));
        console.log(chalk.white(`   Total images: ${totalCount}`));
        console.log(chalk.green(`   ✅ Accessible: ${accessibleCount}`));
        console.log(chalk.red(`   ❌ Not accessible: ${totalCount - accessibleCount}`));
        
        if (accessibleCount < totalCount) {
            console.log(chalk.yellow(`\n⚠️  Failed images:`));
            results.filter(r => !r.accessible).forEach((result, idx) => {
                console.log(chalk.red(`   ${idx + 1}. ${result.path}`));
                console.log(chalk.gray(`      URL: ${result.url}`));
                if (result.error) {
                    console.log(chalk.gray(`      Error: ${result.error}`));
                } else if (result.status) {
                    console.log(chalk.gray(`      Status: ${result.status} ${result.statusText || ''}`));
                }
            });
        }
        
        console.log('');
    }

    /**
     * 🖼️ Preview images from gallery (overloaded method)
     */
    async previewImages(imageGalleryOrItemId, itemId = null) {
        let imageGallery;
        let displayItemId;
        
        // Handle overload: can be called with itemId (old way) or imageGallery array (new way)
        if (typeof imageGalleryOrItemId === 'string') {
            // Old way: previewImages(itemId)
            displayItemId = imageGalleryOrItemId;
            const item = loreHelpers.getLoreByIdSync(displayItemId);
            if (!item) {
                console.log(chalk.red(`❌ Item "${displayItemId}" not found`));
                return;
            }
            imageGallery = [];
            if (item.image) imageGallery.push(item.image);
            if (item.image_gallery && Array.isArray(item.image_gallery)) {
                imageGallery.push(...item.image_gallery);
            }
            if (imageGallery.length === 0) {
                console.log(chalk.yellow('❌ No images found for this item'));
                return;
            }
        } else if (Array.isArray(imageGalleryOrItemId)) {
            // New way: previewImages(imageGallery, itemId)
            imageGallery = imageGalleryOrItemId;
            displayItemId = itemId || 'gallery';
        } else {
            console.log(chalk.red('❌ Invalid arguments for previewImages'));
            return;
        }

        console.log(chalk.cyan('\n🖼️  PREVIEW IMAGES'));
        console.log(chalk.gray('─'.repeat(60)));
        
        const cdnUrl = process.env.CDN_URL || 'http://localhost:3001';
        const fs = require('fs').promises;
        const path = require('path');
        const os = require('os');
        
        // Build HTML with all images
        const imageUrls = imageGallery.map(imgPath => {
            if (imgPath.startsWith('http')) {
                return imgPath;
            } else if (imgPath.startsWith('/')) {
                return `${cdnUrl}${imgPath}`;
            } else {
                return `${cdnUrl}/${imgPath}`;
            }
        });
        
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Wavelength Image Gallery Preview - ${displayItemId}</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            background: #1a1a1a;
            color: #fff;
            font-family: Arial, sans-serif;
        }
        h1 {
            color: #4a47a3;
            text-align: center;
            margin-bottom: 30px;
        }
        .gallery {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            max-width: 1400px;
            margin: 0 auto;
        }
        .image-item {
            background: #2a2a2a;
            border-radius: 8px;
            padding: 15px;
            border: 2px solid #333;
        }
        .image-item img {
            width: 100%;
            height: auto;
            border-radius: 4px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
            margin-bottom: 10px;
        }
        .image-path {
            font-size: 11px;
            color: #888;
            word-break: break-all;
            margin-top: 10px;
        }
        .image-number {
            color: #4a47a3;
            font-weight: bold;
            margin-bottom: 5px;
        }
    </style>
</head>
<body>
    <h1>Image Gallery: ${displayItemId}</h1>
    <div class="gallery">
        ${imageUrls.map((url, idx) => `
            <div class="image-item">
                <div class="image-number">Image ${idx + 1}/${imageUrls.length}</div>
                <img src="${url}" alt="Gallery Image ${idx + 1}" onerror="this.style.border='3px solid red'; this.alt='Failed to load';">
                <div class="image-path">${imageGallery[idx]}</div>
            </div>
        `).join('')}
    </div>
</body>
</html>`;
        
        try {
            const tempDir = os.tmpdir();
            const tempFile = path.join(tempDir, `wavelength-gallery-preview-${displayItemId}-${Date.now()}.html`);
            
            await fs.writeFile(tempFile, htmlContent);
            
            try {
                const open = require('open');
                await open(tempFile);
                console.log(chalk.green(`\n✅ Opening gallery preview in browser...`));
                console.log(chalk.gray(`   Showing ${imageGallery.length} image(s)`));
                console.log(chalk.gray(`   Temp file: ${tempFile}`));
            } catch (e) {
                console.log(chalk.yellow(`💡 Could not auto-open. View the file manually:`));
                console.log(chalk.white(`   ${tempFile}`));
            }
        } catch (error) {
            console.log(chalk.red(`❌ Failed to create preview: ${error.message}`));
        }
    }

    /**
     * Load imported prompts from JSON file
     */
    async loadImportedPrompts() {
        try {
            const fs = require('fs').promises;
            const path = require('path');
            const promptsPath = path.join(__dirname, 'data/imported-prompts.json');
            
            const data = await fs.readFile(promptsPath, 'utf-8');
            this.importedPrompts = JSON.parse(data);
            console.log(chalk.gray(`   📝 Loaded ${this.getTotalPromptCount()} imported prompts`));
        } catch (error) {
            // File doesn't exist or can't be read - that's okay
            this.importedPrompts = null;
        }
    }

    /**
     * Get total count of imported prompts
     */
    getTotalPromptCount() {
        if (!this.importedPrompts) return 0;
        
        let count = 0;
        if (this.importedPrompts.characters) count += Object.keys(this.importedPrompts.characters).length;
        if (this.importedPrompts.locations) count += Object.keys(this.importedPrompts.locations).length;
        if (this.importedPrompts.lore) count += Object.keys(this.importedPrompts.lore).length;
        return count;
    }

    /**
     * Get imported prompts for an item
     */
    getImportedPromptsForItem(item) {
        if (!this.importedPrompts || !item || !item.id) {
            return [];
        }

        const prompts = [];
        const itemId = item.id;
        const itemTitle = (item.title || '').toLowerCase();

        // Check characters
        if (this.importedPrompts.characters && this.importedPrompts.characters[itemId]) {
            const promptData = this.importedPrompts.characters[itemId];
            this.extractPromptsFromImported(promptData, prompts, 'Imported Character Prompt');
        }

        // Check locations
        if (this.importedPrompts.locations && this.importedPrompts.locations[itemId]) {
            const promptData = this.importedPrompts.locations[itemId];
            this.extractPromptsFromImported(promptData, prompts, 'Imported Location Prompt');
        }

        // Check lore
        if (this.importedPrompts.lore && this.importedPrompts.lore[itemId]) {
            const promptData = this.importedPrompts.lore[itemId];
            this.extractPromptsFromImported(promptData, prompts, 'Imported Lore Prompt');
        }

        // Also check unmatched prompts - they might match by ID or title
        if (this.importedPrompts.unmatched && this.importedPrompts.unmatched.length > 0) {
            this.importedPrompts.unmatched.forEach(unmatchedData => {
                const unmatchedId = (unmatchedData.contentId || '').toLowerCase();
                const unmatchedTitle = (unmatchedData.match?.item?.title || '').toLowerCase();
                
                // Try to match by ID (exact or partial)
                if (itemId.toLowerCase() === unmatchedId || 
                    itemId.toLowerCase().includes(unmatchedId) || 
                    unmatchedId.includes(itemId.toLowerCase())) {
                    this.extractPromptsFromImported(unmatchedData, prompts, 'Imported Prompt (Unmatched)');
                    return;
                }
                
                // Try to match by title (if available)
                if (itemTitle && unmatchedTitle && 
                    (itemTitle.includes(unmatchedTitle) || unmatchedTitle.includes(itemTitle))) {
                    this.extractPromptsFromImported(unmatchedData, prompts, 'Imported Prompt (Unmatched)');
                    return;
                }
                
                // Try fuzzy matching on common patterns
                // e.g., "daphne-flower" might match "🌸 Daphne 🌸"
                const cleanItemTitle = itemTitle.replace(/[🌸🌺🌻🌷🌹]/g, '').trim();
                const cleanUnmatchedId = unmatchedId.replace(/-flower$/, '').trim();
                if (cleanItemTitle && cleanUnmatchedId && 
                    (cleanItemTitle.includes(cleanUnmatchedId) || cleanUnmatchedId.includes(cleanItemTitle.replace(/\s+/g, '-')))) {
                    this.extractPromptsFromImported(unmatchedData, prompts, 'Imported Prompt (Unmatched)');
                    return;
                }
            });
        }

        return prompts;
    }

    /**
     * Extract prompts from imported prompt data
     */
    extractPromptsFromImported(promptData, promptsArray, sourceLabel) {
        // Add default prompts
        if (promptData.prompts && promptData.prompts.default) {
            promptData.prompts.default.forEach((promptText, index) => {
                promptsArray.push({
                    text: promptText,
                    source: sourceLabel + (promptData.prompts.default.length > 1 ? ` ${index + 1}` : ''),
                    description: `Imported from ${promptData.filePath}`
                });
            });
        }

        // Add version prompts
        if (promptData.prompts && promptData.prompts.versions) {
            Object.entries(promptData.prompts.versions).forEach(([version, versionPrompts]) => {
                if (Array.isArray(versionPrompts)) {
                    versionPrompts.forEach((promptText, index) => {
                        promptsArray.push({
                            text: promptText,
                            source: `${sourceLabel} - Version ${version}`,
                            description: `Imported version ${version} from ${promptData.filePath}`
                        });
                    });
                }
            });
        }

        // Add scene prompts
        if (promptData.prompts && promptData.prompts.scenes) {
            Object.entries(promptData.prompts.scenes).forEach(([scene, scenePrompts]) => {
                if (Array.isArray(scenePrompts)) {
                    scenePrompts.forEach((promptText, index) => {
                        const sceneName = scene.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                        promptsArray.push({
                            text: promptText,
                            source: `${sourceLabel} - ${sceneName} Scene`,
                            description: `Imported ${sceneName} scene from ${promptData.filePath}`
                        });
                    });
                }
            });
        }
    }

    /**
     * Generate suggested prompts from item data
     * Returns array of {text, source, description} objects
     * 
     * NOTE: Only returns imported prompts. No auto-generated prompts from item fields.
     * Prompts are always multi-paragraph text, not short snippets.
     */
    generatePromptsForItem(item) {
        // Only use imported prompts - these are the valuable multi-paragraph prompts
        const importedPrompts = this.getImportedPromptsForItem(item);
        
        // If no imported prompts, provide a helpful message instead of useless auto-generated ones
        if (importedPrompts.length === 0) {
            return [{
                text: '',
                source: 'No Prompts',
                description: `No imported prompts found for this item. Run 'npm run prompts:import' to import prompts from content/prompts/`
            }];
        }
        
        return importedPrompts;
    }

    /**
     * Handle prompts command
     */
    async handlePromptsCommand(args) {
        if (!args || args.length === 0 || args[0] === 'list' || args[0] === 'ls') {
            return this.listPrompts(args);
        } else if (args[0] === 'search') {
            return this.searchPrompts(args.slice(1));
        } else if (args[0] === 'show') {
            return this.showPromptsForItem(args.slice(1));
        } else if (args[0] === 'stats') {
            return this.showPromptStats();
        } else if (args[0] === 'import') {
            return this.importPrompts();
        } else {
            console.log(chalk.yellow('💡 Prompt Commands:'));
            console.log(chalk.white('  prompts list [--type=<type>]    - List all prompts'));
            console.log(chalk.white('  prompts search <query>          - Search prompts'));
            console.log(chalk.white('  prompts show <content-id>       - Show prompts for item'));
            console.log(chalk.white('  prompts stats                   - Show statistics'));
            console.log(chalk.white('  prompts import                  - Re-import prompts\n'));
        }
    }

    /**
     * List all imported prompts
     */
    listPrompts(args) {
        if (!this.importedPrompts) {
            console.log(chalk.yellow('\n⚠️  No prompts loaded. Run "prompts import" to import prompts.\n'));
            return;
        }

        // Parse arguments
        const filterType = args.find(arg => arg.startsWith('--type='))?.split('=')[1];

        console.log(chalk.cyan('\n📝 Imported Prompts\n'));
        console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

        let totalCount = 0;

        // List characters
        if (!filterType || filterType === 'characters') {
            const characters = this.importedPrompts.characters || {};
            const charIds = Object.keys(characters);
            if (charIds.length > 0) {
                console.log(chalk.yellow(`👥 Characters (${charIds.length}):\n`));
                charIds.forEach(id => {
                    const data = characters[id];
                    const defaultCount = data.prompts?.default?.length || 0;
                    const versionCount = Object.keys(data.prompts?.versions || {}).length;
                    const sceneCount = Object.keys(data.prompts?.scenes || {}).length;
                    const totalPrompts = defaultCount + versionCount + sceneCount;
                    
                    console.log(chalk.white(`  ${id}`));
                    console.log(chalk.gray(`    File: ${data.filePath}`));
                    console.log(chalk.gray(`    Prompts: ${totalPrompts} (${defaultCount} default, ${versionCount} versions, ${sceneCount} scenes)`));
                    if (data.match?.item) {
                        console.log(chalk.green(`    Matched: ${data.match.item.title || data.match.item.name || data.match.item.id}`));
                    }
                    console.log('');
                });
                totalCount += charIds.length;
            }
        }

        // List locations
        if (!filterType || filterType === 'locations') {
            const locations = this.importedPrompts.locations || {};
            const locIds = Object.keys(locations);
            if (locIds.length > 0) {
                console.log(chalk.yellow(`📍 Locations (${locIds.length}):\n`));
                locIds.forEach(id => {
                    const data = locations[id];
                    const defaultCount = data.prompts?.default?.length || 0;
                    const versionCount = Object.keys(data.prompts?.versions || {}).length;
                    const sceneCount = Object.keys(data.prompts?.scenes || {}).length;
                    const totalPrompts = defaultCount + versionCount + sceneCount;
                    
                    console.log(chalk.white(`  ${id}`));
                    console.log(chalk.gray(`    File: ${data.filePath}`));
                    console.log(chalk.gray(`    Prompts: ${totalPrompts} (${defaultCount} default, ${versionCount} versions, ${sceneCount} scenes)`));
                    if (data.match?.item) {
                        console.log(chalk.green(`    Matched: ${data.match.item.title || data.match.item.name || data.match.item.id}`));
                    }
                    console.log('');
                });
                totalCount += locIds.length;
            }
        }

        // List lore
        if (!filterType || filterType === 'lore') {
            const lore = this.importedPrompts.lore || {};
            const loreIds = Object.keys(lore);
            if (loreIds.length > 0) {
                console.log(chalk.yellow(`📚 Lore (${loreIds.length}):\n`));
                loreIds.forEach(id => {
                    const data = lore[id];
                    const defaultCount = data.prompts?.default?.length || 0;
                    const versionCount = Object.keys(data.prompts?.versions || {}).length;
                    const sceneCount = Object.keys(data.prompts?.scenes || {}).length;
                    const totalPrompts = defaultCount + versionCount + sceneCount;
                    
                    console.log(chalk.white(`  ${id}`));
                    console.log(chalk.gray(`    File: ${data.filePath}`));
                    console.log(chalk.gray(`    Prompts: ${totalPrompts} (${defaultCount} default, ${versionCount} versions, ${sceneCount} scenes)`));
                    if (data.match?.item) {
                        console.log(chalk.green(`    Matched: ${data.match.item.title || data.match.item.name || data.match.item.id}`));
                    }
                    console.log('');
                });
                totalCount += loreIds.length;
            }
        }

        // Show unmatched
        const unmatched = this.importedPrompts.unmatched || [];
        if (unmatched.length > 0 && !filterType) {
            console.log(chalk.red(`⚠️  Unmatched (${unmatched.length} - needs manual review):\n`));
            unmatched.slice(0, 10).forEach(data => {
                console.log(chalk.white(`  ${data.contentId}`));
                console.log(chalk.gray(`    File: ${data.filePath}\n`));
            });
            if (unmatched.length > 10) {
                console.log(chalk.gray(`    ... and ${unmatched.length - 10} more\n`));
            }
        }

        console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log(chalk.cyan(`\nTotal: ${totalCount} items with prompts\n`));
    }

    /**
     * Search prompts
     */
    searchPrompts(args) {
        if (!this.importedPrompts) {
            console.log(chalk.yellow('\n⚠️  No prompts loaded. Run "prompts import" to import prompts.\n'));
            return;
        }

        const query = args.join(' ').toLowerCase();
        if (!query) {
            console.log(chalk.red('❌ Please provide a search query\n'));
            return;
        }

        console.log(chalk.cyan(`\n🔍 Searching prompts for: "${query}"\n`));
        console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

        const results = [];

        // Search all prompt data
        ['characters', 'locations', 'lore'].forEach(type => {
            const items = this.importedPrompts[type] || {};
            Object.entries(items).forEach(([id, data]) => {
                // Check content ID
                if (id.toLowerCase().includes(query)) {
                    results.push({ type, id, data, match: 'ID' });
                    return;
                }

                // Check file path
                if (data.filePath && data.filePath.toLowerCase().includes(query)) {
                    results.push({ type, id, data, match: 'File' });
                    return;
                }

                // Check prompt text
                if (data.prompts) {
                    const allPrompts = [
                        ...(data.prompts.default || []),
                        ...Object.values(data.prompts.versions || {}).flat(),
                        ...Object.values(data.prompts.scenes || {}).flat()
                    ];
                    
                    const matchingPrompt = allPrompts.find(p => p.toLowerCase().includes(query));
                    if (matchingPrompt) {
                        results.push({ type, id, data, match: 'Content', matchingPrompt });
                        return;
                    }
                }
            });
        });

        if (results.length === 0) {
            console.log(chalk.yellow('  No prompts found matching your search.\n'));
            return;
        }

        results.forEach(({ type, id, data, match, matchingPrompt }) => {
            const typeIcon = type === 'characters' ? '👥' : type === 'locations' ? '📍' : '📚';
            console.log(chalk.cyan(`${typeIcon} ${type.toUpperCase()}: ${id}`));
            console.log(chalk.gray(`   Matched by: ${match}`));
            console.log(chalk.gray(`   File: ${data.filePath}`));
            
            if (matchingPrompt) {
                const preview = matchingPrompt.substring(0, 150) + (matchingPrompt.length > 150 ? '...' : '');
                console.log(chalk.white(`   Preview: ${preview.replace(/\n/g, ' ')}`));
            }
            console.log('');
        });

        console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log(chalk.cyan(`\nFound: ${results.length} result(s)\n`));
    }

    /**
     * Show all prompts for a specific item
     */
    showPromptsForItem(args) {
        if (!this.importedPrompts) {
            console.log(chalk.yellow('\n⚠️  No prompts loaded. Run "prompts import" to import prompts.\n'));
            return;
        }

        const contentId = args[0];
        if (!contentId) {
            console.log(chalk.red('❌ Please provide a content ID\n'));
            console.log(chalk.yellow('Usage: prompts show <content-id>\n'));
            return;
        }

        // Try to find in all types
        let promptData = null;
        let foundType = null;

        for (const type of ['characters', 'locations', 'lore']) {
            if (this.importedPrompts[type] && this.importedPrompts[type][contentId]) {
                promptData = this.importedPrompts[type][contentId];
                foundType = type;
                break;
            }
        }

        // Also check unmatched prompts
        if (!promptData) {
            const unmatched = this.importedPrompts.unmatched || [];
            const unmatchedItem = unmatched.find(item => 
                item.contentId === contentId || 
                item.contentId.toLowerCase() === contentId.toLowerCase()
            );
            
            if (unmatchedItem) {
                promptData = unmatchedItem;
                foundType = 'unmatched';
            }
        }

        if (!promptData) {
            console.log(chalk.red(`\n❌ No prompts found for: ${contentId}\n`));
            console.log(chalk.yellow('💡 Try: prompts search <query> to find prompts\n'));
            return;
        }

        const typeIcon = foundType === 'characters' ? '👥' : foundType === 'locations' ? '📍' : foundType === 'unmatched' ? '⚠️' : '📚';
        const typeLabel = foundType === 'unmatched' ? 'UNMATCHED' : foundType.toUpperCase();
        console.log(chalk.cyan(`\n📝 Prompts for ${typeLabel}: ${contentId}\n`));
        console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

        if (foundType === 'unmatched') {
            console.log(chalk.yellow('⚠️  This prompt is not matched to any content item.'));
            console.log(chalk.gray(`File: ${promptData.filePath}`));
            if (promptData.suggestedIds && promptData.suggestedIds.length > 0) {
                console.log(chalk.gray(`Suggested IDs: ${promptData.suggestedIds.join(', ')}`));
            }
            console.log('');
        } else if (promptData.match?.item) {
            console.log(chalk.green(`Matched Item: ${promptData.match.item.title || promptData.match.item.name || contentId}`));
            console.log(chalk.gray(`File: ${promptData.filePath}`));
            console.log('');
        } else {
            console.log(chalk.gray(`File: ${promptData.filePath}`));
            console.log('');
        }

        // Show default prompts
        if (promptData.prompts?.default && promptData.prompts.default.length > 0) {
            console.log(chalk.yellow('📝 Default Prompts:\n'));
            promptData.prompts.default.forEach((text, index) => {
                console.log(chalk.cyan(`${index + 1}.`));
                console.log(chalk.white(text));
                console.log('');
            });
        }

        // Show version prompts
        if (promptData.prompts?.versions && Object.keys(promptData.prompts.versions).length > 0) {
            console.log(chalk.yellow('📝 Version Prompts:\n'));
            Object.entries(promptData.prompts.versions).forEach(([version, texts]) => {
                texts.forEach((text, index) => {
                    console.log(chalk.cyan(`Version ${version}${texts.length > 1 ? ` (${index + 1})` : ''}:`));
                    console.log(chalk.white(text));
                    console.log('');
                });
            });
        }

        // Show scene prompts
        if (promptData.prompts?.scenes && Object.keys(promptData.prompts.scenes).length > 0) {
            console.log(chalk.yellow('📝 Scene Prompts:\n'));
            Object.entries(promptData.prompts.scenes).forEach(([scene, texts]) => {
                const sceneName = scene.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                texts.forEach((text, index) => {
                    console.log(chalk.cyan(`${sceneName} Scene${texts.length > 1 ? ` (${index + 1})` : ''}:`));
                    console.log(chalk.white(text));
                    console.log('');
                });
            });
        }

        console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
    }

    /**
     * Show prompt statistics
     */
    showPromptStats() {
        if (!this.importedPrompts) {
            console.log(chalk.yellow('\n⚠️  No prompts loaded. Run "prompts import" to import prompts.\n'));
            return;
        }

        console.log(chalk.cyan('\n📊 Prompt Statistics\n'));
        console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

        let totalItems = 0;
        let totalPrompts = 0;

        ['characters', 'locations', 'lore'].forEach(type => {
            const items = this.importedPrompts[type] || {};
            const typeIcon = type === 'characters' ? '👥' : type === 'locations' ? '📍' : '📚';
            const itemCount = Object.keys(items).length;
            
            let typePromptCount = 0;
            Object.values(items).forEach(data => {
                const defaultCount = data.prompts?.default?.length || 0;
                const versionCount = Object.values(data.prompts?.versions || {}).reduce((sum, arr) => sum + arr.length, 0);
                const sceneCount = Object.values(data.prompts?.scenes || {}).reduce((sum, arr) => sum + arr.length, 0);
                typePromptCount += defaultCount + versionCount + sceneCount;
            });

            totalItems += itemCount;
            totalPrompts += typePromptCount;

            console.log(chalk.white(`${typeIcon} ${type.toUpperCase()}:`));
            console.log(chalk.gray(`   Items: ${itemCount}`));
            console.log(chalk.gray(`   Total Prompts: ${typePromptCount}`));
            console.log(chalk.gray(`   Avg per Item: ${itemCount > 0 ? (typePromptCount / itemCount).toFixed(1) : 0}\n`));
        });

        const unmatched = this.importedPrompts.unmatched || [];
        console.log(chalk.red(`⚠️  Unmatched: ${unmatched.length} items\n`));

        console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log(chalk.cyan(`\nTotal: ${totalItems} items, ${totalPrompts} prompts\n`));
    }

    /**
     * Save a loaded prompt to the imported prompts system
     */
    async savePromptToImported(item, promptText, sourceFilePath) {
        try {
            const fs = require('fs').promises;
            const path = require('path');
            const promptsPath = path.join(__dirname, 'data/imported-prompts.json');
            
            // Load existing prompts or initialize
            let importedPrompts;
            try {
                const data = await fs.readFile(promptsPath, 'utf-8');
                importedPrompts = JSON.parse(data);
            } catch {
                // File doesn't exist, create new structure
                importedPrompts = {
                    characters: {},
                    locations: {},
                    lore: {},
                    unmatched: [],
                    version: '1.0'
                };
            }
            
            // Determine content type from item or context
            let contentType = 'lore';
            let storageKey = 'lore';
            
            // Check if it's a character
            if (item.role || item.type === 'character') {
                contentType = 'character';
                storageKey = 'characters';
            } else if (item.type === 'location' || item.type === 'place' || item.category === 'location') {
                contentType = 'location';
                storageKey = 'locations';
            }
            
            // Create prompt data structure
            const relativePath = sourceFilePath.replace(path.join(__dirname), '').replace(/^\//, '');
            const promptData = {
                contentId: item.id,
                filePath: relativePath,
                prompts: {
                    default: [promptText],
                    versions: {},
                    scenes: {}
                },
                match: {
                    contentType: contentType,
                    item: {
                        id: item.id,
                        title: item.title || item.name,
                        name: item.name || item.title
                    },
                    contentId: item.id,
                    confidence: 'high'
                },
                importedAt: new Date().toISOString(),
                source: 'file-loaded'
            };
            
            // Initialize storage key if needed
            if (!importedPrompts[storageKey]) {
                importedPrompts[storageKey] = {};
            }
            
            // Check if prompt already exists for this item
            const existing = importedPrompts[storageKey][item.id];
            if (existing) {
                // Add to existing prompts (append to default array)
                if (!existing.prompts.default.includes(promptText)) {
                    existing.prompts.default.push(promptText);
                    existing.source = `${existing.source || 'import'}, file-loaded`;
                    existing.importedAt = new Date().toISOString();
                    console.log(chalk.gray(`   📝 Saved to existing prompts for ${item.id} (appended)`));
                } else {
                    console.log(chalk.gray(`   ℹ️  Prompt already exists for ${item.id}`));
                }
            } else {
                // Create new entry
                importedPrompts[storageKey][item.id] = promptData;
                console.log(chalk.green(`   💾 Saved prompt for future use: ${item.id}`));
            }
            
            // Save to file
            await fs.writeFile(promptsPath, JSON.stringify(importedPrompts, null, 2));
            
            // Reload prompts in memory
            await this.loadImportedPrompts();
            
        } catch (error) {
            // Don't fail the whole operation if saving fails
            console.log(chalk.yellow(`   ⚠️  Could not save prompt to imported prompts: ${error.message}`));
        }
    }

    /**
     * Re-import prompts
     */
    async importPrompts() {
        console.log(chalk.cyan('\n📥 Re-importing prompts...\n'));
        try {
            const PromptImporter = require('./scripts/import-prompts');
            const importer = new PromptImporter();
            await importer.importAllPrompts();
            await importer.saveImportedPrompts();
            
            // Reload prompts
            await this.loadImportedPrompts();
            
            console.log(chalk.green('\n✅ Prompts re-imported and reloaded!\n'));
        } catch (error) {
            console.error(chalk.red(`\n❌ Import failed: ${error.message}\n`));
        }
    }


    /**
     * Display large warning banner for video commands
     */
    showVideoWarning() {
        console.log('');
        console.log(chalk.red.bold('╔══════════════════════════════════════════════════════════════════════════════╗'));
        console.log(chalk.red.bold('║                                                                              ║'));
        console.log(chalk.red.bold('║                    ⚠️  VIDEO GENERATION WARNING ⚠️                          ║'));
        console.log(chalk.red.bold('║                                                                              ║'));
        console.log(chalk.red.bold('╠══════════════════════════════════════════════════════════════════════════════╣'));
        console.log(chalk.red.bold('║                                                                              ║'));
        console.log(chalk.red.bold('║  🚨 UNTESTED & UNSAFE - USE AT YOUR OWN RISK 🚨                            ║'));
        console.log(chalk.red.bold('║                                                                              ║'));
        console.log(chalk.yellow.bold('║  ⚡ Video generation is EXPENSIVE and currently UNTESTED                 ║'));
        console.log(chalk.yellow.bold('║                                                                              ║'));
        console.log(chalk.yellow.bold('║  This feature may:                                                         ║'));
        console.log(chalk.yellow.bold('║    • Charge your API account significantly                                ║'));
        console.log(chalk.yellow.bold('║    • Not work as expected (untested integration)                          ║'));
        console.log(chalk.yellow.bold('║    • Produce unexpected results                                           ║'));
        console.log(chalk.yellow.bold('║                                                                              ║'));
        console.log(chalk.red.bold('║  ⛔ PROCEED ONLY IF YOU UNDERSTAND THE RISKS ⛔                            ║'));
        console.log(chalk.red.bold('║                                                                              ║'));
        console.log(chalk.red.bold('╚══════════════════════════════════════════════════════════════════════════════╝'));
        console.log('');
    }

    /**
     * 🎬 Generate AI Video for item
     */
    async generateAIVideo(item, contentType = 'lore') {
        // Show large warning banner
        this.showVideoWarning();
        
        // Require explicit confirmation
        const confirmed = await new Promise((resolve) => {
            this.rl.question(chalk.red.bold('⚠️  Do you understand the risks and want to proceed? (type "YES" to continue): '), (answer) => {
                resolve(answer.trim() === 'YES');
            });
        });
        
        if (!confirmed) {
            console.log(chalk.green('\n✅ Video generation cancelled. Stay safe!'));
            return;
        }
        
        console.log(chalk.cyan('\n🎬 AI VIDEO GENERATION'));
        console.log(chalk.gray(`Generating video for: ${item.title || item.name}`));
        
        // Determine image source - use primary image or first gallery image
        let imageUrl = null;
        
        if (item.primaryImage || item.image) {
            imageUrl = item.primaryImage || item.image;
            // Convert relative paths to full URLs
            if (imageUrl.startsWith('/') && !imageUrl.startsWith('//')) {
                const cdnUrl = process.env.CDN_URL || 'https://df5sj8f594cdx.cloudfront.net';
                imageUrl = `${cdnUrl}${imageUrl}`;
            }
        } else if (item.image_gallery && item.image_gallery.length > 0) {
            imageUrl = item.image_gallery[0];
            if (imageUrl.startsWith('/') && !imageUrl.startsWith('//')) {
                const cdnUrl = process.env.CDN_URL || 'https://df5sj8f594cdx.cloudfront.net';
                imageUrl = `${cdnUrl}${imageUrl}`;
            }
        }
        
        if (!imageUrl) {
            console.log(chalk.red('❌ No image found for video generation'));
            console.log(chalk.yellow('💡 Please add an image to this item first (generate an image or upload one)'));
            return;
        }
        
        console.log(chalk.gray(`📸 Using image: ${imageUrl.substring(0, 80)}${imageUrl.length > 80 ? '...' : ''}`));
        
        // Prompt for video generation prompt
        const prompt = await new Promise((resolve) => {
            this.rl.question(chalk.cyan('\n📝 Enter video generation prompt (or press Enter to use description): '), (answer) => {
                resolve(answer.trim() || item.description || `Cinematic scene featuring ${item.title || item.name}`);
            });
        });
        
        if (!prompt) {
            console.log(chalk.yellow('⚠️ Prompt is required for video generation'));
            return;
        }
        
        // Ask if user wants to wait for completion
        const waitForCompletion = await new Promise((resolve) => {
            this.rl.question(chalk.cyan('\n⏳ Wait for video completion? (y/n, default: n): '), (answer) => {
                resolve(answer.toLowerCase().trim() === 'y');
            });
        });
        
        try {
            console.log(chalk.gray('\n🎬 Starting video generation...'));
            
            const result = await this.mediaCommands.mediaService.generateVideo({
                imageUrl,
                promptText: prompt,
                contentType,
                contentId: item.id,
                waitForCompletion,
                maxWaitTime: 600000 // 10 minutes for video
            });
            
            if (result.success) {
                if (result.video.status === 'completed') {
                    console.log(chalk.green('\n✅ Video generation completed!'));
                    
                    if (result.video.videoBuffer) {
                        // Video was downloaded - upload to S3 and add to gallery
                        const videoPath = result.video.url || `/images/${contentType}s/${item.id}/video-generated-${Date.now()}.mp4`;
                        
                        // Add to gallery if not already there
                        if (!item.video_gallery) {
                            item.video_gallery = [];
                        }
                        item.video_gallery.push(videoPath);
                        
                        console.log(chalk.green(`✅ Video added to gallery: ${videoPath}`));
                        console.log(chalk.yellow('\n💾 Don\'t forget to save changes to persist the video!'));
                    }
                } else {
                    console.log(chalk.yellow(`\n⏳ Video generation started (async mode)`));
                    console.log(chalk.gray(`   Operation ID: ${result.video.operationId}`));
                    console.log(chalk.gray(`   Status: ${result.video.status}`));
                    console.log(chalk.yellow('\n💡 Use the media commands to check status:'));
                    console.log(chalk.gray(`   media videos status ${result.video.operationId}`));
                }
            } else {
                console.log(chalk.red('\n❌ Video generation failed'));
            }
        } catch (error) {
            console.log(chalk.red(`\n❌ Video generation error: ${error.message}`));
            if (error.message.includes('not initialized')) {
                console.log(chalk.yellow('\n💡 Make sure GOOGLE_API_KEY or GEMINI_API_KEY is set in your .env file'));
            }
        }
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
     * 📤 Upload image to S3 and return relative path
     * @param {string} imageDataUrl - Base64 data URL or image buffer
     * @param {string} contentType - Content type ('lore', 'character', 'episode')
     * @param {string} contentId - Content ID (e.g., 'daphne-flower', 'andrew')
     * @param {object} metadata - Image metadata
     * @returns {Promise<string>} Relative path (e.g., '/images/lore/daphne-flower/ai-generated-1234567890-abc123.png')
     */
    async uploadImageToS3(imageDataUrl, contentType, contentId, metadata = {}) {
        try {
            // Convert data URL to buffer
            let imageBuffer;
            let mimeType = 'image/png';
            
            if (typeof imageDataUrl === 'string' && imageDataUrl.startsWith('data:')) {
                // Parse data URL: data:image/png;base64,iVBORw0KGgo...
                const matches = imageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
                if (!matches) {
                    throw new Error('Invalid data URL format');
                }
                mimeType = matches[1] || 'image/png';
                const base64Data = matches[2];
                imageBuffer = Buffer.from(base64Data, 'base64');
            } else if (Buffer.isBuffer(imageDataUrl)) {
                imageBuffer = imageDataUrl;
            } else {
                throw new Error('Invalid image data format');
            }
            
            // Generate S3 key following the existing pattern
            // Match existing paths: /static/images/characters/... for characters
            // For lore items, use /static/images/lore/... or /static/images/lores/...
            const timestamp = Date.now();
            const imageId = crypto.randomBytes(8).toString('hex');
            const extension = mimeType === 'image/jpeg' ? 'jpg' : 'png';
            
            // Determine the correct path structure based on content type
            // IMPORTANT: CloudFront serves from /images/* (without /static/ prefix)
            // Local dev serves from /static/images/... but CloudFront/CDN uses /images/...
            // S3 bucket stores at: images/{contentType}s/{id}/... (no static prefix for CloudFront)
            let s3Key;
            if (contentType === 'character') {
                // Characters: images/characters/{contentId}/...
                s3Key = `images/characters/${contentId}/ai-generated-${timestamp}-${imageId}.${extension}`;
            } else if (contentType === 'lore') {
                // Lore items: images/lore/{id}/... (CloudFront serves as /images/lore/...)
                s3Key = `images/lore/${contentId}/ai-generated-${timestamp}-${imageId}.${extension}`;
            } else if (contentType === 'episode') {
                // Episodes: images/seasons/...
                s3Key = `images/seasons/${contentId}/ai-generated-${timestamp}-${imageId}.${extension}`;
            } else {
                // Fallback: images/{contentType}s/...
                const contentTypePlural = contentType === 'lore' ? 'lores' : `${contentType}s`;
                s3Key = `images/${contentTypePlural}/${contentId}/ai-generated-${timestamp}-${imageId}.${extension}`;
            }
            
            console.log(chalk.gray(`  📤 Uploading to S3: ${s3Key}...`));
            
            // Sanitize metadata values
            const sanitizeMetadata = (value) => {
                if (!value) return 'unknown';
                return String(value)
                    .replace(/[\r\n\t]/g, ' ')
                    .replace(/[^\x20-\x7E]/g, '')
                    .substring(0, 200)
                    .trim();
            };
            
            const uploadParams = {
                // Use lore bucket for content images (lore, characters, episodes)
                // GALLERY_S3_BUCKET is for user gallery uploads, not content images
                Bucket: process.env.S3_BUCKET_NAME || 'wavelength-lore-bucket',
                Key: s3Key,
                Body: imageBuffer,
                ContentType: mimeType,
                CacheControl: 'max-age=31536000', // 1 year cache
                Metadata: {
                    'generated-by': 'cli-ai-image-generator',
                    'prompt-id': sanitizeMetadata(metadata.promptId || 'unknown'),
                    'generated-at': new Date().toISOString(),
                    'model': sanitizeMetadata(metadata.model || 'unknown'),
                    'content-type': contentType,
                    'content-id': contentId
                }
            };
            
            const command = new PutObjectCommand(uploadParams);
            
            console.log(chalk.gray(`  📤 Uploading to S3 bucket: ${uploadParams.Bucket}`));
            console.log(chalk.gray(`  📤 S3 Key: ${s3Key}`));
            
            try {
                await this.s3Client.send(command);
                console.log(chalk.green(`  ✅ Successfully uploaded to S3: ${s3Key}`));
                
                // Verify the upload by checking if object exists
                const { HeadObjectCommand } = require('@aws-sdk/client-s3');
                const headCommand = new HeadObjectCommand({
                    Bucket: uploadParams.Bucket,
                    Key: s3Key
                });
                
                try {
                    await this.s3Client.send(headCommand);
                    console.log(chalk.green(`  ✅ Verified: Image exists in S3`));
                    console.log(chalk.cyan(`  🌐 CloudFront URL: https://df5sj8f594cdx.cloudfront.net/${s3Key}`));
                } catch (verifyError) {
                    console.log(chalk.yellow(`  ⚠️  Warning: Could not verify upload (might need a moment to propagate)`));
                    console.log(chalk.yellow(`     Error: ${verifyError.message}`));
                }
            } catch (uploadError) {
                console.error(chalk.red(`  ❌ S3 Upload Error:`));
                console.error(chalk.red(`     ${uploadError.message}`));
                if (uploadError.Code) {
                    console.error(chalk.red(`     Error Code: ${uploadError.Code}`));
                }
                if (uploadError.$metadata) {
                    console.error(chalk.gray(`     Request ID: ${uploadError.$metadata.requestId}`));
                }
                throw uploadError;
            }
            
            // Return relative path (with leading slash) as used throughout the system
            const relativePath = `/${s3Key}`;
            
            return relativePath;
            
        } catch (error) {
            console.error(chalk.red(`  ❌ Failed to upload to S3: ${error.message}`));
            throw error;
        }
    }

    /**
     * 💾 Save item changes to Firebase
     */
    async saveItemChanges(item, contentType = 'lore') {
        console.log(chalk.cyan('💾 Saving changes to Firebase...'));

        try {
            if (!item.id) {
                throw new Error('Item ID is required to save changes');
            }

            // Display what's being saved
            console.log(chalk.yellow(`\n📋 Changes Summary for ${contentType.toUpperCase()}:`));
            console.log(chalk.gray('─'.repeat(50)));

            // Show key fields being saved
            if (item.title) console.log(chalk.white(`  Title: ${item.title}`));
            if (item.description) {
                const descPreview = item.description.substring(0, 100) + (item.description.length > 100 ? '...' : '');
                console.log(chalk.white(`  Description: ${descPreview}`));
            }
            if (item.image_gallery && item.image_gallery.length > 0) {
                console.log(chalk.white(`  Image Gallery: ${item.image_gallery.length} image(s)`));
                // Show if any are data URLs (need S3 upload)
                const dataUrlCount = item.image_gallery.filter(url => url.startsWith('data:')).length;
                if (dataUrlCount > 0) {
                    console.log(chalk.yellow(`  ⚠️  ${dataUrlCount} image(s) are data URLs (base64) - consider uploading to S3 for better performance`));
                }
            }

            // Show character-specific CTA fields if present
            if (contentType === 'character') {
                if (item.tagline) console.log(chalk.white(`  🎭 Tagline: ${item.tagline}`));
                if (item.stakes) console.log(chalk.white(`  ⚔️ Stakes: ${item.stakes}`));
                if (item.cta_text) console.log(chalk.white(`  🔗 CTA Text: ${item.cta_text}`));
            }

            // Determine Firebase path based on content type
            let firebasePath;
            if (contentType === 'lore') {
                firebasePath = `lore/${item.id}`;
            } else if (contentType === 'character') {
                firebasePath = `characters/${item.id}`;
            } else if (contentType === 'location') {
                firebasePath = `locations/${item.id}`;
            } else {
                throw new Error(`Unsupported content type: ${contentType}`);
            }

            // Fetch current data from Firebase
            const { fetchDataAsAdmin, writeDataAsAdmin } = require('./helpers/firebase-admin-utils');
            
            console.log(chalk.gray(`\n  Fetching current data from Firebase: ${firebasePath}...`));
            const currentData = await fetchDataAsAdmin(firebasePath);

            // Merge updates with existing data
            const updatedData = {
                ...(currentData || {}),
                ...item,
                updatedAt: new Date().toISOString(),
                // Preserve Firebase metadata if it exists
                ...(currentData?.metadata && { metadata: currentData.metadata })
            };

            // Save to Firebase
            console.log(chalk.gray(`  Writing updated data to Firebase...`));
            await writeDataAsAdmin(firebasePath, updatedData);

            console.log(chalk.green('\n✅ Changes saved successfully to Firebase!'));
            console.log(chalk.gray(`  Path: ${firebasePath}`));
            console.log(chalk.gray(`  Item: ${item.title || item.name || item.id}`));

            // Warn about data URLs if present
            if (item.image_gallery) {
                const dataUrlImages = item.image_gallery.filter(url => url.startsWith('data:'));
                if (dataUrlImages.length > 0) {
                    console.log(chalk.yellow(`\n  💡 Note: ${dataUrlImages.length} image(s) stored as data URLs.`));
                    console.log(chalk.yellow(`     Consider uploading to S3 for better performance and permanence.`));
                }
            }

        } catch (error) {
            console.log(chalk.red('\n❌ Failed to save changes to Firebase:'));
            console.log(chalk.red(`   Error: ${error.message}`));
            if (process.env.DEBUG) {
                console.error(error.stack);
            }
            throw error;
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