/**
 * Lore CLI Commands
 * 
 * Comprehensive CLI interface for lore management including:
 * - CRUD operations (Create, Read, Update, Delete, List)
 * - Search and filtering capabilities
 * - Category and tag management
 * - Quality assessment and improvement suggestions
 * - Batch operations and publishing workflows
 * 
 * GitHub Issue: #152 - Milestone 2.1.2: CLI CRUD Activities
 * 
 * Usage Examples:
 * - lore create --title="The Shire" --category=locations --content="Description..."
 * - lore list --category=locations --importance=high
 * - lore search "magic system" --category=magic-system
 * - lore update shire-location --importance=critical
 * - lore quality-check shire-location
 * - lore categories
 * - lore tags --popular
 */

const chalk = require('chalk');
const FirebaseLoreService = require('../services/firebase-lore-service');
const { validateLoreData, assessLoreQuality, validateSearchParams } = require('../utils/lore-validator');

class LoreCommands {
    constructor(cli) {
        this.cli = cli;
        this.loreService = new FirebaseLoreService();
        
        console.log('📚 Lore CLI Commands initialized');
    }

    /**
     * Main lore command handler
     * Routes subcommands to appropriate methods
     */
    async handleLoreCommands(args) {
        if (!args || args.length === 0) {
            return this.showLoreHelp();
        }

        const subCommand = args[0].toLowerCase();
        const commandArgs = args.slice(1);

        try {
            switch (subCommand) {
                case 'create':
                case 'add':
                case 'new':
                    return await this.createLoreEntry(commandArgs);
                    
                case 'list':
                case 'ls':
                case 'all':
                    return await this.listLoreEntries(commandArgs);
                    
                case 'show':
                case 'get':
                case 'view':
                case 'details':
                    return await this.showLoreEntry(commandArgs);
                    
                case 'update':
                case 'edit':
                case 'modify':
                    return await this.updateLoreEntry(commandArgs);
                    
                case 'delete':
                case 'remove':
                case 'del':
                    return await this.deleteLoreEntry(commandArgs);
                    
                case 'search':
                case 'find':
                    return await this.searchLoreEntries(commandArgs);
                    
                case 'categories':
                case 'cats':
                    return await this.showCategories(commandArgs);
                    
                case 'tags':
                    return await this.showTags(commandArgs);
                    
                case 'publish':
                case 'unpublish':
                    return await this.publishLoreEntry(commandArgs, subCommand === 'publish');
                    
                case 'quality':
                case 'quality-check':
                case 'assess':
                    return await this.assessQuality(commandArgs);
                    
                case 'clone':
                case 'copy':
                case 'duplicate':
                    return await this.cloneLoreEntry(commandArgs);
                    
                case 'batch':
                case 'bulk':
                    return await this.batchOperations(commandArgs);
                    
                case 'stats':
                case 'statistics':
                    return await this.showStatistics(commandArgs);
                    
                case 'help':
                case '?':
                default:
                    return this.showLoreHelp();
            }
        } catch (error) {
            console.log(chalk.red('❌ Lore command failed:'), error.message);
            if (error.stack && process.env.NODE_ENV === 'development') {
                console.log(chalk.gray(error.stack));
            }
        }
    }

    /**
     * Create new lore entry
     */
    async createLoreEntry(args) {
        console.log(chalk.blue.bold('📚 CREATE LORE ENTRY'));
        console.log(chalk.gray('=' .repeat(40)));

        const options = this.parseCreateArgs(args);
        
        if (!options.title) {
            console.log(chalk.red('❌ Lore entry title is required'));
            console.log(chalk.yellow('Usage: lore create --title="Entry Title" [options]'));
            return;
        }

        try {
            // Build lore data from options
            const loreData = {
                title: options.title,
                summary: options.summary || '',
                content: options.content || '',
                category: options.category || 'general',
                subcategory: options.subcategory || '',
                tags: options.tags || [],
                keywords: options.keywords || [],
                contentType: options.contentType || options.type || 'entry',
                importance: options.importance || 'medium',
                spoilerLevel: options.spoilerLevel || 0,
                
                // Relationships
                relatedCharacters: options.relatedCharacters || [],
                relatedEpisodes: options.relatedEpisodes || [],
                relatedEntries: options.relatedEntries || [],
                
                // Visual assets
                primaryImage: options.primaryImage || options.image || '',
                images: options.images || [],
                
                // Publishing
                published: options.published !== false,
                status: options.status || 'draft',
                author: options.author || 'cli-user',
                
                // Additional metadata
                metadata: options.metadata || {}
            };

            // Validate lore data
            console.log(chalk.yellow('📋 Validating lore data...'));
            const validation = validateLoreData(loreData);
            
            if (!validation.isValid) {
                console.log(chalk.red('❌ Validation failed:'));
                validation.errors.forEach(error => {
                    console.log(chalk.red(`   • ${error}`));
                });
                return;
            }

            if (validation.warnings && validation.warnings.length > 0) {
                console.log(chalk.yellow('⚠️  Warnings:'));
                validation.warnings.forEach(warning => {
                    console.log(chalk.yellow(`   • ${warning}`));
                });
            }

            // Create lore entry
            console.log(chalk.yellow('✨ Creating lore entry...'));
            const loreId = await this.loreService.createLoreEntry(loreData);

            // Show success with entry details
            console.log(chalk.green.bold('✅ Lore entry created successfully!'));
            console.log(chalk.white(`📄 Entry ID: ${loreId}`));
            console.log(chalk.white(`📚 Title: ${loreData.title}`));
            console.log(chalk.white(`📂 Category: ${loreData.category}`));
            console.log(chalk.white(`🎯 Importance: ${loreData.importance}`));
            
            if (loreData.tags.length > 0) {
                console.log(chalk.white(`🏷️  Tags: ${loreData.tags.join(', ')}`));
            }
            
            // Show quality assessment
            const quality = assessLoreQuality(loreData);
            const qualityColor = quality.level === 'excellent' ? 'green' : 
                               quality.level === 'good' ? 'cyan' :
                               quality.level === 'fair' ? 'yellow' : 'red';
            console.log(chalk[qualityColor](`📊 Quality: ${quality.level} (${quality.score}%)`));
            
            if (quality.suggestions.length > 0 && quality.score < 75) {
                console.log(chalk.yellow('💡 Improvement suggestions:'));
                quality.suggestions.slice(0, 3).forEach(suggestion => {
                    console.log(chalk.yellow(`   • ${suggestion}`));
                });
            }

            console.log(chalk.cyan(`\n🔍 View details: lore show ${loreId}`));

        } catch (error) {
            console.log(chalk.red('❌ Failed to create lore entry:'), error.message);
        }
    }

    /**
     * List lore entries with filtering
     */
    async listLoreEntries(args) {
        console.log(chalk.blue.bold('📚 LORE ENTRIES'));
        console.log(chalk.gray('=' .repeat(40)));

        const options = this.parseListArgs(args);

        try {
            console.log(chalk.yellow('📋 Fetching lore entries...'));
            
            // Build filters
            const filters = {};
            if (options.category) filters.category = options.category;
            if (options.published !== undefined) filters.published = options.published;
            if (options.status) filters.status = options.status;
            if (options.importance) filters.importance = options.importance;
            if (options.contentType) filters.contentType = options.contentType;
            if (options.tag) filters.tag = options.tag;
            if (options.search) filters.search = options.search;
            if (options.sortBy) filters.sortBy = options.sortBy;

            const entries = await this.loreService.getAllLoreEntries(filters);
            
            if (!entries || entries.length === 0) {
                console.log(chalk.yellow('📭 No lore entries found matching criteria'));
                console.log(chalk.gray('💡 Use "lore create" to add your first entry'));
                return;
            }

            // Apply limit if specified
            const displayEntries = options.limit ? entries.slice(0, options.limit) : entries;

            // Display entries
            console.log(chalk.green(`📋 Found ${entries.length} lore entr${entries.length === 1 ? 'y' : 'ies'}:`));
            if (options.limit && entries.length > options.limit) {
                console.log(chalk.gray(`Showing first ${options.limit} entries`));
            }
            console.log('');

            displayEntries.forEach((entry, index) => {
                const prefix = chalk.cyan(`${(index + 1).toString().padStart(2)}. `);
                const title = chalk.white.bold(entry.title || entry.id || 'Untitled');
                const category = this.getCategoryIcon(entry.category) + chalk.gray(entry.category || 'general');
                const importance = this.getImportanceIcon(entry.importance);
                const status = entry.published ? chalk.green('📍 Published') : chalk.yellow('📝 Draft');
                
                console.log(`${prefix}${title} ${category} ${importance}`);
                console.log(`    ${status} • ID: ${chalk.gray(entry.id)}`);
                
                if (entry.summary) {
                    const summary = entry.summary.length > 80 ? 
                        entry.summary.substring(0, 80) + '...' : 
                        entry.summary;
                    console.log(`    📝 ${chalk.italic.gray(summary)}`);
                }
                
                if (entry.tags && entry.tags.length > 0) {
                    const tagDisplay = entry.tags.slice(0, 3).join(', ');
                    const moreCount = entry.tags.length > 3 ? ` +${entry.tags.length - 3}` : '';
                    console.log(`    🏷️  ${chalk.cyan(tagDisplay)}${chalk.gray(moreCount)}`);
                }
                
                if (options.detailed) {
                    // Show quality score
                    const quality = assessLoreQuality(entry);
                    const qualityColor = quality.level === 'excellent' ? 'green' : 
                                       quality.level === 'good' ? 'cyan' :
                                       quality.level === 'fair' ? 'yellow' : 'red';
                    console.log(`    📊 Quality: ${chalk[qualityColor](quality.level + ' (' + quality.score + '%)')}`);
                    
                    // Show reading info
                    if (entry.wordCount) {
                        console.log(`    📖 ${entry.wordCount} words • ${entry.readingTime || 1} min read`);
                    }
                    
                    // Show relationships
                    const relationships = [];
                    if (entry.relatedCharacters && entry.relatedCharacters.length > 0) {
                        relationships.push(`${entry.relatedCharacters.length} characters`);
                    }
                    if (entry.relatedEpisodes && entry.relatedEpisodes.length > 0) {
                        relationships.push(`${entry.relatedEpisodes.length} episodes`);
                    }
                    if (entry.relatedEntries && entry.relatedEntries.length > 0) {
                        relationships.push(`${entry.relatedEntries.length} entries`);
                    }
                    if (relationships.length > 0) {
                        console.log(`    🔗 Links: ${chalk.cyan(relationships.join(', '))}`);
                    }
                }
                
                console.log('');
            });

            // Show summary stats
            console.log(chalk.blue('📊 Summary:'));
            const stats = this.calculateLoreStats(entries);
            console.log(`   Total Entries: ${stats.total}`);
            console.log(`   Published: ${chalk.green(stats.published)}`);
            console.log(`   Drafts: ${chalk.yellow(stats.drafts)}`);
            console.log(`   Categories: ${stats.categories}`);
            console.log(`   Total Tags: ${stats.totalTags}`);

        } catch (error) {
            console.log(chalk.red('❌ Failed to list lore entries:'), error.message);
        }
    }

    /**
     * Show detailed lore entry information
     */
    async showLoreEntry(args) {
        if (!args || args.length === 0) {
            console.log(chalk.red('❌ Lore entry ID is required'));
            console.log(chalk.yellow('Usage: lore show <entry-id>'));
            return;
        }

        const entryId = args[0];
        console.log(chalk.blue.bold(`📚 LORE ENTRY: ${entryId.toUpperCase()}`));
        console.log(chalk.gray('=' .repeat(50)));

        try {
            const entry = await this.loreService.getLoreEntryById(entryId);
            
            if (!entry) {
                console.log(chalk.red(`❌ Lore entry '${entryId}' not found`));
                console.log(chalk.yellow('💡 Use "lore list" to see available entries'));
                return;
            }

            // Basic Information
            console.log(chalk.green.bold('📋 BASIC INFORMATION'));
            console.log(chalk.white(`Title: ${entry.title || 'Untitled'}`));
            console.log(chalk.white(`ID: ${entry.id}`));
            console.log(chalk.white(`Category: ${this.getCategoryIcon(entry.category)}${entry.category || 'general'}`));
            if (entry.subcategory) {
                console.log(chalk.white(`Subcategory: ${entry.subcategory}`));
            }
            console.log(chalk.white(`Type: ${entry.contentType || 'entry'}`));
            console.log(chalk.white(`Importance: ${this.getImportanceIcon(entry.importance)}${entry.importance || 'medium'}`));
            
            const status = entry.published ? 
                chalk.green('📍 Published') : 
                chalk.yellow('📝 Draft');
            console.log(chalk.white(`Status: ${status} (${entry.status || 'draft'})`));

            if (entry.spoilerLevel > 0) {
                console.log(chalk.red(`⚠️  Spoiler Level: ${entry.spoilerLevel}/5`));
            }

            // Summary & Content
            if (entry.summary) {
                console.log(chalk.green.bold('\n📝 SUMMARY'));
                console.log(chalk.white(entry.summary));
            }

            if (entry.content) {
                console.log(chalk.green.bold('\n📖 CONTENT'));
                const contentPreview = entry.content.length > 500 ? 
                    entry.content.substring(0, 500) + '...' : 
                    entry.content;
                console.log(chalk.white(contentPreview));
                
                if (entry.content.length > 500) {
                    console.log(chalk.gray(`\n(${entry.content.length} total characters - showing preview)`));
                }
            }

            // Tags and Keywords
            if (entry.tags && entry.tags.length > 0) {
                console.log(chalk.green.bold('\n🏷️  TAGS'));
                console.log(chalk.cyan(entry.tags.join(', ')));
            }

            if (entry.keywords && entry.keywords.length > 0) {
                console.log(chalk.green.bold('\n🔍 KEYWORDS'));
                console.log(chalk.gray(entry.keywords.join(', ')));
            }

            // Relationships
            const hasRelationships = (entry.relatedCharacters && entry.relatedCharacters.length > 0) ||
                                   (entry.relatedEpisodes && entry.relatedEpisodes.length > 0) ||
                                   (entry.relatedEntries && entry.relatedEntries.length > 0);

            if (hasRelationships) {
                console.log(chalk.green.bold('\n🔗 RELATIONSHIPS'));
                
                if (entry.relatedCharacters && entry.relatedCharacters.length > 0) {
                    console.log(chalk.white(`Characters: ${entry.relatedCharacters.join(', ')}`));
                }
                
                if (entry.relatedEpisodes && entry.relatedEpisodes.length > 0) {
                    console.log(chalk.white(`Episodes: ${entry.relatedEpisodes.join(', ')}`));
                }
                
                if (entry.relatedEntries && entry.relatedEntries.length > 0) {
                    console.log(chalk.white(`Related Entries: ${entry.relatedEntries.join(', ')}`));
                }
            }

            // Visual Assets
            if (entry.primaryImage || (entry.images && entry.images.length > 0)) {
                console.log(chalk.green.bold('\n🎨 VISUAL ASSETS'));
                if (entry.primaryImage) {
                    console.log(chalk.white(`Primary Image: ${entry.primaryImage}`));
                }
                if (entry.images && entry.images.length > 0) {
                    console.log(chalk.white(`Additional Images: ${entry.images.length} image(s)`));
                }
            }

            // Quality Assessment
            console.log(chalk.green.bold('\n📊 QUALITY ASSESSMENT'));
            const quality = assessLoreQuality(entry);
            const qualityColor = quality.level === 'excellent' ? 'green' : 
                               quality.level === 'good' ? 'cyan' :
                               quality.level === 'fair' ? 'yellow' : 'red';
            console.log(chalk[qualityColor](`Quality Level: ${quality.level} (${quality.score}%)`));
            
            if (quality.suggestions.length > 0) {
                console.log(chalk.yellow('\n💡 Improvement Suggestions:'));
                quality.suggestions.forEach(suggestion => {
                    console.log(chalk.yellow(`   • ${suggestion}`));
                });
            }

            // Content Metrics
            if (entry.wordCount || entry.readingTime) {
                console.log(chalk.green.bold('\n📖 CONTENT METRICS'));
                if (entry.wordCount) {
                    console.log(chalk.white(`Word Count: ${entry.wordCount}`));
                }
                if (entry.readingTime) {
                    console.log(chalk.white(`Reading Time: ~${entry.readingTime} minute(s)`));
                }
            }

            // Author and Timestamps
            console.log(chalk.green.bold('\n👤 AUTHORSHIP & TIMELINE'));
            if (entry.author) {
                console.log(chalk.white(`Author: ${entry.author}`));
            }
            if (entry.editors && entry.editors.length > 0) {
                console.log(chalk.white(`Editors: ${entry.editors.join(', ')}`));
            }
            if (entry.createdAt) {
                console.log(chalk.white(`Created: ${new Date(entry.createdAt).toLocaleString()}`));
            }
            if (entry.updatedAt) {
                console.log(chalk.white(`Updated: ${new Date(entry.updatedAt).toLocaleString()}`));
            }
            if (entry.publishedAt) {
                console.log(chalk.white(`Published: ${new Date(entry.publishedAt).toLocaleString()}`));
            }

            // Management Actions
            console.log(chalk.blue.bold('\n🔧 MANAGEMENT ACTIONS'));
            console.log(chalk.cyan(`lore update ${entryId} --field=value`));
            console.log(chalk.cyan(`lore quality ${entryId}`));
            console.log(chalk.cyan(`lore clone ${entryId} --title="New Title"`));
            if (!entry.published) {
                console.log(chalk.cyan(`lore publish ${entryId}`));
            }

        } catch (error) {
            console.log(chalk.red('❌ Failed to show lore entry:'), error.message);
        }
    }

    /**
     * Search lore entries
     */
    async searchLoreEntries(args) {
        if (!args || args.length === 0) {
            console.log(chalk.red('❌ Search query is required'));
            console.log(chalk.yellow('Usage: lore search "search terms" [options]'));
            return;
        }

        const query = args[0];
        const options = this.parseSearchArgs(args.slice(1));

        console.log(chalk.blue.bold(`🔍 SEARCH RESULTS: "${query}"`));
        console.log(chalk.gray('=' .repeat(50)));

        try {
            console.log(chalk.yellow('🔍 Searching lore entries...'));
            
            const searchOptions = {
                ...options,
                limit: options.limit || 50
            };

            const results = await this.loreService.searchLoreEntries(query, searchOptions);
            
            if (!results || results.length === 0) {
                console.log(chalk.yellow(`📭 No entries found for "${query}"`));
                console.log(chalk.gray('💡 Try different search terms or check spelling'));
                return;
            }

            console.log(chalk.green(`🎯 Found ${results.length} relevant entr${results.length === 1 ? 'y' : 'ies'}:`));
            console.log('');

            results.forEach((entry, index) => {
                const prefix = chalk.cyan(`${(index + 1).toString().padStart(2)}. `);
                const title = chalk.white.bold(entry.title || entry.id);
                const relevance = entry.relevanceScore ? chalk.magenta(`[${entry.relevanceScore}]`) : '';
                const category = this.getCategoryIcon(entry.category) + chalk.gray(entry.category);
                
                console.log(`${prefix}${title} ${relevance} ${category}`);
                console.log(`    ID: ${chalk.gray(entry.id)} • ${entry.published ? chalk.green('Published') : chalk.yellow('Draft')}`);
                
                if (entry.summary) {
                    const summary = entry.summary.length > 100 ? 
                        entry.summary.substring(0, 100) + '...' : 
                        entry.summary;
                    console.log(`    📝 ${chalk.italic.gray(summary)}`);
                }
                
                console.log('');
            });

            // Show search tips
            console.log(chalk.blue('💡 Search Tips:'));
            console.log(chalk.gray('   • Use quotes for exact phrases: "magic system"'));
            console.log(chalk.gray('   • Filter by category: --category=locations'));
            console.log(chalk.gray('   • Filter by importance: --importance=high'));
            console.log(chalk.gray('   • Combine with other filters for precise results'));

        } catch (error) {
            console.log(chalk.red('❌ Failed to search lore entries:'), error.message);
        }
    }

    /**
     * Show lore categories
     */
    async showCategories(args) {
        console.log(chalk.blue.bold('📂 LORE CATEGORIES'));
        console.log(chalk.gray('=' .repeat(40)));

        try {
            console.log(chalk.yellow('📋 Loading categories...'));
            const categories = await this.loreService.getLoreCategories();
            
            if (!categories || categories.length === 0) {
                console.log(chalk.yellow('📭 No categories found'));
                return;
            }

            console.log(chalk.green(`📂 Found ${categories.length} categories:`));
            console.log('');

            categories.forEach((category, index) => {
                const prefix = chalk.cyan(`${(index + 1).toString().padStart(2)}. `);
                const icon = this.getCategoryIcon(category.id);
                const name = chalk.white.bold(category.name || category.id);
                const count = chalk.gray(`(${category.count || 0} entries)`);
                
                console.log(`${prefix}${icon}${name} ${count}`);
                console.log(`    ID: ${chalk.gray(category.id)}`);
                console.log('');
            });

            // Show usage tips
            console.log(chalk.blue('💡 Usage:'));
            console.log(chalk.gray('   lore list --category=world-building'));
            console.log(chalk.gray('   lore create --category=locations --title="New Place"'));

        } catch (error) {
            console.log(chalk.red('❌ Failed to show categories:'), error.message);
        }
    }

    /**
     * Show popular tags
     */
    async showTags(args) {
        const options = this.parseTagsArgs(args);
        
        console.log(chalk.blue.bold('🏷️  LORE TAGS'));
        console.log(chalk.gray('=' .repeat(40)));

        try {
            console.log(chalk.yellow('📋 Loading tags...'));
            const limit = options.popular ? (options.limit || 20) : 100;
            const tags = await this.loreService.getPopularTags(limit);
            
            if (!tags || tags.length === 0) {
                console.log(chalk.yellow('📭 No tags found'));
                return;
            }

            const title = options.popular ? 'Most Popular Tags' : 'All Tags';
            console.log(chalk.green(`🏷️  ${title} (${tags.length}):`));
            console.log('');

            tags.forEach((tagData, index) => {
                const prefix = chalk.cyan(`${(index + 1).toString().padStart(2)}. `);
                const tag = chalk.white.bold(tagData.tag);
                const count = chalk.gray(`(${tagData.count} uses)`);
                
                console.log(`${prefix}${tag} ${count}`);
            });

            // Show usage tips
            console.log(chalk.blue('\n💡 Usage:'));
            console.log(chalk.gray('   lore list --tag=magic'));
            console.log(chalk.gray('   lore search "keyword" --tag=specific-tag'));

        } catch (error) {
            console.log(chalk.red('❌ Failed to show tags:'), error.message);
        }
    }

    /**
     * Show lore help information
     */
    showLoreHelp() {
        console.log(chalk.blue.bold('📚 LORE CLI COMMANDS'));
        console.log(chalk.gray('=' .repeat(50)));
        console.log(chalk.white('Comprehensive lore management for the Wavelength universe'));
        console.log('');

        console.log(chalk.green.bold('📝 CREATE & MANAGE'));
        console.log(chalk.white('lore create --title="Title" [options]       Create new lore entry'));
        console.log(chalk.white('lore list [--category=type] [--detailed]    List all entries'));
        console.log(chalk.white('lore show <id>                             Show entry details'));
        console.log(chalk.white('lore update <id> --field=value             Update entry'));
        console.log(chalk.white('lore delete <id> --confirm [--hard]        Delete entry'));
        console.log('');

        console.log(chalk.green.bold('🔍 SEARCH & DISCOVER'));
        console.log(chalk.white('lore search "query" [options]              Search entries'));
        console.log(chalk.white('lore categories                            Show all categories'));
        console.log(chalk.white('lore tags [--popular] [--limit=20]         Show popular tags'));
        console.log(chalk.white('lore stats                                 Show statistics'));
        console.log('');

        console.log(chalk.green.bold('📊 QUALITY & WORKFLOW'));
        console.log(chalk.white('lore quality <id>                          Quality assessment'));
        console.log(chalk.white('lore publish <id>                          Publish entry'));
        console.log(chalk.white('lore unpublish <id>                        Unpublish entry'));
        console.log(chalk.white('lore clone <id> --title="New Title"        Clone entry'));
        console.log('');

        console.log(chalk.green.bold('⚡ BATCH OPERATIONS'));
        console.log(chalk.white('lore batch --operation=publish --category=locations'));
        console.log(chalk.white('lore batch --operation=tag --add="new-tag" --category=magic'));
        console.log('');

        console.log(chalk.yellow.bold('📋 CREATE OPTIONS'));
        console.log(chalk.gray('--title="Title"           Entry title (required)'));
        console.log(chalk.gray('--summary="Summary"       Brief description'));
        console.log(chalk.gray('--content="Content"       Detailed content'));
        console.log(chalk.gray('--category=locations      Content category'));
        console.log(chalk.gray('--importance=high         Importance level'));
        console.log(chalk.gray('--tags=tag1,tag2          Comma-separated tags'));
        console.log(chalk.gray('--type=location           Content type'));
        console.log(chalk.gray('--spoiler-level=2         Spoiler rating (0-5)'));
        console.log('');

        console.log(chalk.yellow.bold('🔍 SEARCH OPTIONS'));
        console.log(chalk.gray('--category=magic-system   Filter by category'));
        console.log(chalk.gray('--importance=critical     Filter by importance'));
        console.log(chalk.gray('--published=true          Show only published'));
        console.log(chalk.gray('--tag=specific-tag        Filter by tag'));
        console.log(chalk.gray('--limit=10                Limit results'));
        console.log('');

        console.log(chalk.cyan.bold('💡 EXAMPLES'));
        console.log(chalk.gray('lore create --title="The Shire" --category=locations --importance=high'));
        console.log(chalk.gray('lore search "magic system" --category=magic-system'));
        console.log(chalk.gray('lore list --category=locations --published=true --detailed'));
        console.log(chalk.gray('lore update shire-location --importance=critical --tags=important,canon'));
        console.log('');

        console.log(chalk.blue('🔗 Related: GitHub Issue #152 - CLI CRUD Implementation'));
    }

    // === Helper Methods ===

    parseCreateArgs(args) {
        const options = {};
        
        args.forEach(arg => {
            if (arg.startsWith('--')) {
                const [key, ...valueParts] = arg.substring(2).split('=');
                const value = valueParts.join('=').replace(/^["']|["']$/g, '');
                
                switch (key.toLowerCase()) {
                    case 'title':
                        options.title = value;
                        break;
                    case 'summary':
                        options.summary = value;
                        break;
                    case 'content':
                        options.content = value;
                        break;
                    case 'category':
                        options.category = value;
                        break;
                    case 'subcategory':
                        options.subcategory = value;
                        break;
                    case 'type':
                    case 'content-type':
                        options.contentType = value;
                        break;
                    case 'importance':
                        options.importance = value;
                        break;
                    case 'spoiler-level':
                        options.spoilerLevel = parseInt(value) || 0;
                        break;
                    case 'tags':
                        options.tags = value.split(',').map(t => t.trim());
                        break;
                    case 'keywords':
                        options.keywords = value.split(',').map(k => k.trim());
                        break;
                    case 'image':
                    case 'primary-image':
                        options.primaryImage = value;
                        break;
                    case 'published':
                        options.published = value.toLowerCase() !== 'false';
                        break;
                    case 'status':
                        options.status = value;
                        break;
                    case 'author':
                        options.author = value;
                        break;
                }
            }
        });
        
        return options;
    }

    parseListArgs(args) {
        const options = {};
        
        args.forEach(arg => {
            if (arg.startsWith('--')) {
                const [key, ...valueParts] = arg.substring(2).split('=');
                const value = valueParts.join('=');
                
                switch (key.toLowerCase()) {
                    case 'category':
                        options.category = value;
                        break;
                    case 'published':
                        options.published = value.toLowerCase() === 'true';
                        break;
                    case 'status':
                        options.status = value;
                        break;
                    case 'importance':
                        options.importance = value;
                        break;
                    case 'type':
                    case 'content-type':
                        options.contentType = value;
                        break;
                    case 'tag':
                        options.tag = value;
                        break;
                    case 'search':
                        options.search = value;
                        break;
                    case 'sort-by':
                    case 'sortby':
                    case 'sort':
                        options.sortBy = value;
                        break;
                    case 'limit':
                        options.limit = parseInt(value) || undefined;
                        break;
                    case 'detailed':
                    case 'detail':
                        options.detailed = true;
                        break;
                }
            }
        });
        
        return options;
    }

    parseSearchArgs(args) {
        const options = {};
        
        args.forEach(arg => {
            if (arg.startsWith('--')) {
                const [key, ...valueParts] = arg.substring(2).split('=');
                const value = valueParts.join('=');
                
                switch (key.toLowerCase()) {
                    case 'category':
                        options.category = value;
                        break;
                    case 'importance':
                        options.importance = value;
                        break;
                    case 'type':
                        options.contentType = value;
                        break;
                    case 'tag':
                        options.tag = value;
                        break;
                    case 'published':
                        options.published = value.toLowerCase() === 'true';
                        break;
                    case 'limit':
                        options.limit = parseInt(value) || 50;
                        break;
                }
            }
        });
        
        return options;
    }

    parseTagsArgs(args) {
        const options = {};
        
        args.forEach(arg => {
            if (arg === '--popular') {
                options.popular = true;
            } else if (arg.startsWith('--limit=')) {
                options.limit = parseInt(arg.split('=')[1]) || 20;
            }
        });
        
        return options;
    }

    getCategoryIcon(category) {
        const icons = {
            'world-building': '🌍 ',
            'character-lore': '👤 ',
            'music-theory': '🎵 ',
            'magic-system': '✨ ',
            'locations': '📍 ',
            'events': '📅 ',
            'artifacts': '🏺 ',
            'concepts': '💡 ',
            'history': '📜 ',
            'general': '📚 '
        };
        
        return icons[category] || '📄 ';
    }

    getImportanceIcon(importance) {
        const icons = {
            'critical': '🔴 ',
            'high': '🟠 ',
            'medium': '🟡 ',
            'low': '🟢 '
        };
        
        return icons[importance] || '⚪ ';
    }

    calculateLoreStats(entries) {
        const stats = {
            total: entries.length,
            published: entries.filter(e => e.published).length,
            drafts: entries.filter(e => !e.published).length,
            categories: new Set(entries.map(e => e.category)).size,
            totalTags: entries.reduce((sum, e) => sum + (e.tags ? e.tags.length : 0), 0)
        };
        
        return stats;
    }

    // Additional methods would go here for update, delete, publish, quality assessment, etc.
    // These follow similar patterns to the character commands

}

module.exports = LoreCommands;