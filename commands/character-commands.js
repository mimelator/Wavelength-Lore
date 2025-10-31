/**
 * Character CLI Commands
 * 
 * Provides comprehensive CLI interface for character management including:
 * - CRUD operations (Create, Read, Update, Delete, List)
 * - CTA field management for Issue #80
 * - AI enhancement and avatar generation
 * - Publishing and validation workflows
 * - Character relationships and episode connections
 * 
 * GitHub Issue: #152 - Milestone 2.1.2: CLI CRUD Activities
 * Related Issue: #80 - Character CTA Enhancement Fields
 * 
 * Usage Examples:
 * - character create --name="Alex Sterling" --role=protagonist --description="A brave hero"
 * - character list --role=protagonist --published=true
 * - character update alex-sterling --cta-text="Follow Alex's journey"
 * - character delete alex-sterling --confirm
 * - character validate alex-sterling --check-cta
 */

const chalk = require('chalk');
const FirebaseCharacterService = require('../services/firebase-character-service');
const { validateCharacterData, validateCTACompleteness } = require('../utils/character-validator');

class CharacterCommands {
    constructor(cli) {
        this.cli = cli;
        this.characterService = new FirebaseCharacterService();
        
        console.log('👥 Character CLI Commands initialized');
    }

    /**
     * Main character command handler
     * Routes subcommands to appropriate methods
     */
    async handleCharacterCommands(args) {
        if (!args || args.length === 0) {
            return this.showCharacterHelp();
        }

        const subCommand = args[0].toLowerCase();
        const commandArgs = args.slice(1);

        try {
            switch (subCommand) {
                case 'create':
                case 'add':
                case 'new':
                    return await this.createCharacter(commandArgs);
                    
                case 'list':
                case 'ls':
                case 'all':
                    return await this.listCharacters(commandArgs);
                    
                case 'show':
                case 'get':
                case 'view':
                case 'details':
                    return await this.showCharacter(commandArgs);
                    
                case 'update':
                case 'edit':
                case 'modify':
                    return await this.updateCharacter(commandArgs);
                    
                case 'delete':
                case 'remove':
                case 'del':
                    return await this.deleteCharacter(commandArgs);
                    
                case 'publish':
                case 'unpublish':
                    return await this.publishCharacter(commandArgs, subCommand === 'publish');
                    
                case 'validate':
                case 'check':
                    return await this.validateCharacter(commandArgs);
                    
                case 'clone':
                case 'copy':
                case 'duplicate':
                    return await this.cloneCharacter(commandArgs);
                    
                case 'cta':
                    return await this.manageCTA(commandArgs);
                    
                case 'ai':
                case 'enhance':
                    return await this.enhanceWithAI(commandArgs);
                    
                case 'avatar':
                case 'image':
                    return await this.manageAvatar(commandArgs);
                    
                case 'help':
                case '?':
                default:
                    return this.showCharacterHelp();
            }
        } catch (error) {
            console.log(chalk.red('❌ Character command failed:'), error.message);
            if (error.stack && process.env.NODE_ENV === 'development') {
                console.log(chalk.gray(error.stack));
            }
        }
    }

    /**
     * Create new character
     */
    async createCharacter(args) {
        console.log(chalk.blue.bold('👥 CREATE CHARACTER'));
        console.log(chalk.gray('=' .repeat(40)));

        const options = this.parseCreateArgs(args);
        
        if (!options.name) {
            console.log(chalk.red('❌ Character name is required'));
            console.log(chalk.yellow('Usage: character create --name="Character Name" [options]'));
            return;
        }

        try {
            // Build character data from options
            const characterData = {
                name: options.name,
                title: options.title || options.name,
                role: options.role || 'supporting',
                description: options.description || '',
                backstory: options.backstory || '',
                traits: options.traits || [],
                
                // CTA Enhancement Fields (Issue #80)
                tagline: options.tagline || '',
                stakes: options.stakes || '',
                cta_text: options.ctaText || 'Learn More',
                cta_hook: options.ctaHook || '',
                power_statement: options.powerStatement || '',
                
                // Visual Assets
                image: options.image || '',
                
                // Metadata
                characterType: options.characterType || options.type || 'supporting',
                species: options.species || 'human',
                age: options.age || '',
                location: options.location || '',
                weapons: options.weapons || [],
                abilities: options.abilities || [],
                contentRating: options.contentRating || 'all-ages',
                
                // Publishing
                published: options.published !== false, // Default to true unless explicitly false
                
                // Additional metadata
                metadata: options.metadata || {}
            };

            // Validate character data
            console.log(chalk.yellow('📋 Validating character data...'));
            const validation = validateCharacterData(characterData);
            
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

            // Create character
            console.log(chalk.yellow('✨ Creating character...'));
            const characterId = await this.characterService.createCharacter(characterData);

            // Show success with character details
            console.log(chalk.green.bold('✅ Character created successfully!'));
            console.log(chalk.white(`📄 Character ID: ${characterId}`));
            console.log(chalk.white(`👤 Name: ${characterData.name}`));
            console.log(chalk.white(`🎭 Role: ${characterData.role}`));
            
            if (characterData.tagline) {
                console.log(chalk.white(`💭 Tagline: ${characterData.tagline}`));
            }
            
            // Show CTA completeness
            const ctaScore = validateCTACompleteness(characterData);
            console.log(chalk.cyan(`🎯 CTA Completeness: ${ctaScore.score}%`));
            
            if (ctaScore.score < 80) {
                console.log(chalk.yellow('💡 Consider adding more CTA fields for better engagement:'));
                ctaScore.missing.forEach(field => {
                    console.log(chalk.yellow(`   • ${field}`));
                });
            }

            console.log(chalk.cyan(`\n🔍 View details: character show ${characterId}`));

        } catch (error) {
            console.log(chalk.red('❌ Failed to create character:'), error.message);
        }
    }

    /**
     * List characters with filtering
     */
    async listCharacters(args) {
        console.log(chalk.blue.bold('👥 CHARACTER LIST'));
        console.log(chalk.gray('=' .repeat(40)));

        const options = this.parseListArgs(args);

        try {
            console.log(chalk.yellow('📋 Fetching characters...'));
            
            // Build filters
            const filters = {};
            if (options.role) filters.role = options.role;
            if (options.published !== undefined) filters.published = options.published;
            if (options.species) filters.species = options.species;
            if (options.characterType) filters.characterType = options.characterType;

            const characters = await this.characterService.getAllCharacters(filters);
            
            if (!characters || characters.length === 0) {
                console.log(chalk.yellow('📭 No characters found matching criteria'));
                console.log(chalk.gray('💡 Use "character create" to add your first character'));
                return;
            }

            // Sort characters (safely handle undefined fields)
            const sortBy = options.sortBy || 'name';
            characters.sort((a, b) => {
                if (sortBy === 'name') {
                    const aName = a.name || a.id || 'Unknown';
                    const bName = b.name || b.id || 'Unknown';
                    return aName.localeCompare(bName);
                }
                if (sortBy === 'role') {
                    const aRole = a.role || 'undefined';
                    const bRole = b.role || 'undefined';
                    return aRole.localeCompare(bRole);
                }
                if (sortBy === 'created') {
                    const aCreated = a.createdAt ? new Date(a.createdAt) : new Date(0);
                    const bCreated = b.createdAt ? new Date(b.createdAt) : new Date(0);
                    return bCreated - aCreated;
                }
                return 0;
            });

            // Display characters
            console.log(chalk.green(`📋 Found ${characters.length} character(s):`));
            console.log('');

            characters.forEach((character, index) => {
                const prefix = chalk.cyan(`${(index + 1).toString().padStart(2)}. `);
                const displayName = character.name || character.id || 'Unknown Character';
                const name = chalk.white.bold(displayName);
                const displayRole = character.role || 'no role';
                const role = this.getRoleIcon(displayRole) + chalk.gray(displayRole);
                const status = character.published ? chalk.green('📍 Published') : chalk.yellow('📝 Draft');
                
                console.log(`${prefix}${name} ${role}`);
                console.log(`    ${status} • ID: ${chalk.gray(character.id)}`);
                
                if (character.tagline) {
                    console.log(`    💭 ${chalk.italic(character.tagline)}`);
                }
                
                if (options.detailed) {
                    if (character.description) {
                        const desc = character.description.length > 100 ? 
                            character.description.substring(0, 100) + '...' : 
                            character.description;
                        console.log(`    📝 ${chalk.gray(desc)}`);
                    }
                    
                    // Show CTA score
                    const ctaScore = validateCTACompleteness(character);
                    const ctaColor = ctaScore.score >= 80 ? 'green' : ctaScore.score >= 50 ? 'yellow' : 'red';
                    console.log(`    🎯 CTA: ${chalk[ctaColor](ctaScore.score + '%')}`);
                }
                
                console.log('');
            });

            // Show summary stats
            const stats = this.calculateCharacterStats(characters);
            console.log(chalk.blue('📊 Summary:'));
            console.log(`   Total Characters: ${stats.total}`);
            console.log(`   Published: ${chalk.green(stats.published)}`);
            console.log(`   Drafts: ${chalk.yellow(stats.drafts)}`);
            console.log(`   Protagonists: ${stats.protagonists}`);
            console.log(`   Supporting: ${stats.supporting}`);

        } catch (error) {
            console.log(chalk.red('❌ Failed to list characters:'), error.message);
        }
    }

    /**
     * Show detailed character information
     */
    async showCharacter(args) {
        if (!args || args.length === 0) {
            console.log(chalk.red('❌ Character ID is required'));
            console.log(chalk.yellow('Usage: character show <character-id>'));
            return;
        }

        const characterId = args[0];
        console.log(chalk.blue.bold(`👥 CHARACTER DETAILS: ${characterId.toUpperCase()}`));
        console.log(chalk.gray('=' .repeat(50)));

        try {
            const character = await this.characterService.getCharacterById(characterId);
            
            if (!character) {
                console.log(chalk.red(`❌ Character '${characterId}' not found`));
                console.log(chalk.yellow('💡 Use "character list" to see available characters'));
                return;
            }

            // Basic Information
            console.log(chalk.green.bold('📋 BASIC INFORMATION'));
            console.log(chalk.white(`Name: ${character.name}`));
            console.log(chalk.white(`ID: ${character.id}`));
            console.log(chalk.white(`Title: ${character.title || character.name}`));
            console.log(chalk.white(`Role: ${this.getRoleIcon(character.role)}${character.role}`));
            
            const status = character.published ? 
                chalk.green('📍 Published') : 
                chalk.yellow('📝 Draft');
            console.log(chalk.white(`Status: ${status}`));

            // Description & Story
            if (character.description || character.backstory) {
                console.log(chalk.green.bold('\n📖 STORY & DESCRIPTION'));
                if (character.description) {
                    console.log(chalk.white(`Description: ${character.description}`));
                }
                if (character.backstory) {
                    console.log(chalk.white(`Backstory: ${character.backstory}`));
                }
            }

            // CTA Enhancement Fields (Issue #80)
            console.log(chalk.green.bold('\n🎯 CTA ENHANCEMENT FIELDS'));
            const ctaFields = {
                'Tagline': character.tagline,
                'Stakes': character.stakes,
                'CTA Text': character.cta_text,
                'CTA Hook': character.cta_hook,
                'Power Statement': character.power_statement
            };

            let hasAnyCTA = false;
            Object.entries(ctaFields).forEach(([label, value]) => {
                if (value) {
                    console.log(chalk.white(`${label}: ${value}`));
                    hasAnyCTA = true;
                } else {
                    console.log(chalk.gray(`${label}: (not set)`));
                }
            });

            // Show CTA completeness score
            const ctaScore = validateCTACompleteness(character);
            const ctaColor = ctaScore.score >= 80 ? 'green' : ctaScore.score >= 50 ? 'yellow' : 'red';
            console.log(chalk[ctaColor](`\nCTA Completeness: ${ctaScore.score}%`));
            
            if (ctaScore.score < 100) {
                console.log(chalk.yellow('Missing CTA fields:'));
                ctaScore.missing.forEach(field => {
                    console.log(chalk.yellow(`   • ${field}`));
                });
            }

            // Character Metadata
            if (character.metadata) {
                console.log(chalk.green.bold('\n🔍 CHARACTER METADATA'));
                const meta = character.metadata;
                if (meta.species) console.log(chalk.white(`Species: ${meta.species}`));
                if (meta.age) console.log(chalk.white(`Age: ${meta.age}`));
                if (meta.location) console.log(chalk.white(`Location: ${meta.location}`));
                if (meta.characterType) console.log(chalk.white(`Type: ${meta.characterType}`));
                if (meta.contentRating) console.log(chalk.white(`Content Rating: ${meta.contentRating}`));
            }

            // Traits, Abilities, Equipment
            if (character.traits && character.traits.length > 0) {
                console.log(chalk.green.bold('\n🎭 TRAITS'));
                character.traits.forEach(trait => {
                    console.log(chalk.white(`• ${trait}`));
                });
            }

            if (character.metadata?.abilities && character.metadata.abilities.length > 0) {
                console.log(chalk.green.bold('\n⚡ ABILITIES'));
                character.metadata.abilities.forEach(ability => {
                    console.log(chalk.white(`• ${ability}`));
                });
            }

            if (character.metadata?.weapons && character.metadata.weapons.length > 0) {
                console.log(chalk.green.bold('\n⚔️  WEAPONS'));
                character.metadata.weapons.forEach(weapon => {
                    console.log(chalk.white(`• ${weapon}`));
                });
            }

            // Visual Assets
            console.log(chalk.green.bold('\n🎨 VISUAL ASSETS'));
            if (character.image) {
                console.log(chalk.white(`Primary Image: ${character.image}`));
            } else {
                console.log(chalk.gray('Primary Image: (not set)'));
            }
            
            if (character.avatarGallery && character.avatarGallery.length > 0) {
                console.log(chalk.white(`Avatar Gallery: ${character.avatarGallery.length} image(s)`));
            }

            // Episodes & Relationships
            if (character.episodes && character.episodes.length > 0) {
                console.log(chalk.green.bold('\n📺 EPISODE APPEARANCES'));
                character.episodes.forEach(episodeId => {
                    console.log(chalk.white(`• ${episodeId}`));
                });
            }

            if (character.relationships && Object.keys(character.relationships).length > 0) {
                console.log(chalk.green.bold('\n👥 RELATIONSHIPS'));
                Object.entries(character.relationships).forEach(([charId, relationship]) => {
                    console.log(chalk.white(`• ${charId}: ${relationship}`));
                });
            }

            // Timestamps
            console.log(chalk.green.bold('\n⏰ TIMELINE'));
            if (character.createdAt) {
                console.log(chalk.white(`Created: ${new Date(character.createdAt).toLocaleString()}`));
            }
            if (character.updatedAt) {
                console.log(chalk.white(`Updated: ${new Date(character.updatedAt).toLocaleString()}`));
            }
            if (character.publishedAt) {
                console.log(chalk.white(`Published: ${new Date(character.publishedAt).toLocaleString()}`));
            }

            // Management Actions
            console.log(chalk.blue.bold('\n🔧 MANAGEMENT ACTIONS'));
            console.log(chalk.cyan(`character update ${characterId} --field=value`));
            console.log(chalk.cyan(`character cta ${characterId} --enhance`));
            console.log(chalk.cyan(`character validate ${characterId}`));
            console.log(chalk.cyan(`character ai ${characterId} --enhance`));

        } catch (error) {
            console.log(chalk.red('❌ Failed to show character:'), error.message);
        }
    }

    /**
     * Update character fields
     */
    async updateCharacter(args) {
        if (!args || args.length === 0) {
            console.log(chalk.red('❌ Character ID is required'));
            console.log(chalk.yellow('Usage: character update <character-id> [--field=value]'));
            return;
        }

        const characterId = args[0];
        const options = this.parseUpdateArgs(args.slice(1));

        console.log(chalk.blue.bold(`👥 UPDATE CHARACTER: ${characterId.toUpperCase()}`));
        console.log(chalk.gray('=' .repeat(50)));

        try {
            // Verify character exists
            const existingCharacter = await this.characterService.getCharacterById(characterId);
            if (!existingCharacter) {
                console.log(chalk.red(`❌ Character '${characterId}' not found`));
                return;
            }

            if (Object.keys(options).length === 0) {
                console.log(chalk.yellow('⚠️  No updates specified'));
                console.log(chalk.yellow('Available update options:'));
                console.log(chalk.white('   --name="New Name"'));
                console.log(chalk.white('   --description="New description"'));
                console.log(chalk.white('   --tagline="Character tagline"'));
                console.log(chalk.white('   --cta-text="Call to action text"'));
                console.log(chalk.white('   --stakes="What\'s at stake"'));
                console.log(chalk.white('   --role=protagonist|supporting|antagonist'));
                return;
            }

            // Validate updates
            console.log(chalk.yellow('📋 Validating updates...'));
            const validation = validateCharacterData(options, true); // Partial validation
            
            if (!validation.isValid) {
                console.log(chalk.red('❌ Validation failed:'));
                validation.errors.forEach(error => {
                    console.log(chalk.red(`   • ${error}`));
                });
                return;
            }

            // Apply updates
            console.log(chalk.yellow('✏️  Updating character...'));
            await this.characterService.updateCharacter(characterId, options);

            console.log(chalk.green.bold('✅ Character updated successfully!'));
            
            // Show what was updated
            console.log(chalk.white('📝 Updated fields:'));
            Object.entries(options).forEach(([field, value]) => {
                console.log(chalk.white(`   ${field}: ${value}`));
            });

            // Show updated CTA score if CTA fields were modified
            const ctaFields = ['tagline', 'stakes', 'cta_text', 'ctaText', 'cta_hook', 'ctaHook', 'power_statement', 'powerStatement'];
            const updatedCTAFields = Object.keys(options).some(field => ctaFields.includes(field));
            
            if (updatedCTAFields) {
                const updatedCharacter = await this.characterService.getCharacterById(characterId);
                const ctaScore = validateCTACompleteness(updatedCharacter);
                console.log(chalk.cyan(`🎯 New CTA Completeness: ${ctaScore.score}%`));
            }

            console.log(chalk.cyan(`\n🔍 View updated character: character show ${characterId}`));

        } catch (error) {
            console.log(chalk.red('❌ Failed to update character:'), error.message);
        }
    }

    /**
     * Delete character (with confirmation)
     */
    async deleteCharacter(args) {
        if (!args || args.length === 0) {
            console.log(chalk.red('❌ Character ID is required'));
            console.log(chalk.yellow('Usage: character delete <character-id> [--confirm] [--hard]'));
            return;
        }

        const characterId = args[0];
        const options = this.parseDeleteArgs(args.slice(1));

        console.log(chalk.red.bold(`🗑️  DELETE CHARACTER: ${characterId.toUpperCase()}`));
        console.log(chalk.gray('=' .repeat(50)));

        try {
            // Verify character exists
            const character = await this.characterService.getCharacterById(characterId);
            if (!character) {
                console.log(chalk.red(`❌ Character '${characterId}' not found`));
                return;
            }

            // Show character info
            console.log(chalk.white(`Character: ${character.name}`));
            console.log(chalk.white(`Role: ${character.role}`));
            console.log(chalk.white(`Published: ${character.published ? 'Yes' : 'No'}`));
            
            const deleteType = options.hard ? 'PERMANENT DELETE' : 'soft delete';
            console.log(chalk.red(`Delete Type: ${deleteType}`));

            // Confirmation check
            if (!options.confirm) {
                console.log(chalk.yellow('\n⚠️  DELETION REQUIRES CONFIRMATION'));
                console.log(chalk.yellow('This action cannot be easily undone!'));
                console.log(chalk.white('Add --confirm flag to proceed:'));
                console.log(chalk.cyan(`character delete ${characterId} --confirm ${options.hard ? '--hard' : ''}`));
                return;
            }

            // Perform deletion
            console.log(chalk.yellow(`🗑️  Deleting character...`));
            await this.characterService.deleteCharacter(characterId, options.hard);

            console.log(chalk.green.bold('✅ Character deleted successfully!'));
            
            if (!options.hard) {
                console.log(chalk.yellow('💡 Character was soft-deleted and can be restored from Firebase'));
            } else {
                console.log(chalk.red('💀 Character was permanently deleted'));
            }

        } catch (error) {
            console.log(chalk.red('❌ Failed to delete character:'), error.message);
        }
    }

    /**
     * Manage CTA fields specifically
     */
    async manageCTA(args) {
        if (!args || args.length === 0) {
            console.log(chalk.red('❌ Character ID is required'));
            console.log(chalk.yellow('Usage: character cta <character-id> [--enhance|--score|--set-field=value]'));
            return;
        }

        const characterId = args[0];
        const options = this.parseCTAArgs(args.slice(1));

        console.log(chalk.blue.bold(`🎯 CTA MANAGEMENT: ${characterId.toUpperCase()}`));
        console.log(chalk.gray('=' .repeat(50)));

        try {
            const character = await this.characterService.getCharacterById(characterId);
            if (!character) {
                console.log(chalk.red(`❌ Character '${characterId}' not found`));
                return;
            }

            // Show current CTA status
            const ctaScore = validateCTACompleteness(character);
            console.log(chalk.white(`Character: ${character.name}`));
            console.log(chalk.white(`Current CTA Score: ${ctaScore.score}%`));

            if (options.score) {
                // Just show score details
                console.log(chalk.green.bold('\n📊 CTA FIELD STATUS'));
                const fields = {
                    'tagline': character.tagline,
                    'stakes': character.stakes, 
                    'cta_text': character.cta_text,
                    'cta_hook': character.cta_hook,
                    'power_statement': character.power_statement
                };

                Object.entries(fields).forEach(([field, value]) => {
                    const status = value ? chalk.green('✅') : chalk.red('❌');
                    const display = value ? value : '(not set)';
                    console.log(`${status} ${field}: ${display}`);
                });

                if (ctaScore.missing.length > 0) {
                    console.log(chalk.yellow('\n🎯 To improve CTA score, add:'));
                    ctaScore.missing.forEach(field => {
                        console.log(chalk.yellow(`   • ${field}`));
                    });
                }

                return;
            }

            // Apply CTA field updates
            const updates = {};
            if (options.tagline) updates.tagline = options.tagline;
            if (options.stakes) updates.stakes = options.stakes;
            if (options.ctaText) updates.cta_text = options.ctaText;
            if (options.ctaHook) updates.cta_hook = options.ctaHook;
            if (options.powerStatement) updates.power_statement = options.powerStatement;

            if (Object.keys(updates).length > 0) {
                console.log(chalk.yellow('🎯 Updating CTA fields...'));
                await this.characterService.updateCharacter(characterId, updates);

                console.log(chalk.green.bold('✅ CTA fields updated!'));
                
                // Show new score
                const updatedCharacter = await this.characterService.getCharacterById(characterId);
                const newScore = validateCTACompleteness(updatedCharacter);
                console.log(chalk.cyan(`🎯 New CTA Score: ${newScore.score}% (improved by ${newScore.score - ctaScore.score}%)`));
            }

            if (options.enhance) {
                console.log(chalk.yellow('🤖 AI CTA Enhancement coming soon...'));
                console.log(chalk.gray('This will use AI to suggest improved CTA fields'));
            }

        } catch (error) {
            console.log(chalk.red('❌ Failed to manage CTA:'), error.message);
        }
    }

    /**
     * Validate character data and structure
     */
    async validateCharacter(args) {
        if (!args || args.length === 0) {
            console.log(chalk.red('❌ Character ID is required'));
            console.log(chalk.yellow('Usage: character validate <character-id> [--check-cta] [--detailed]'));
            return;
        }

        const characterId = args[0];
        const options = this.parseValidateArgs(args.slice(1));

        console.log(chalk.blue.bold(`✅ VALIDATE CHARACTER: ${characterId.toUpperCase()}`));
        console.log(chalk.gray('=' .repeat(50)));

        try {
            const character = await this.characterService.getCharacterById(characterId);
            if (!character) {
                console.log(chalk.red(`❌ Character '${characterId}' not found`));
                return;
            }

            // Validate character data structure
            console.log(chalk.yellow('📋 Validating character data...'));
            const validation = validateCharacterData(character);

            // Show validation results
            if (validation.isValid) {
                console.log(chalk.green('✅ Character data is valid'));
            } else {
                console.log(chalk.red('❌ Character data has errors:'));
                validation.errors.forEach(error => {
                    console.log(chalk.red(`   • ${error}`));
                });
            }

            if (validation.warnings && validation.warnings.length > 0) {
                console.log(chalk.yellow('⚠️  Warnings:'));
                validation.warnings.forEach(warning => {
                    console.log(chalk.yellow(`   • ${warning}`));
                });
            }

            // CTA validation
            if (options.checkCta || options.detailed) {
                console.log(chalk.yellow('\n🎯 Validating CTA fields...'));
                const ctaScore = validateCTACompleteness(character);
                
                const scoreColor = ctaScore.score >= 80 ? 'green' : ctaScore.score >= 50 ? 'yellow' : 'red';
                console.log(chalk[scoreColor](`CTA Completeness: ${ctaScore.score}%`));
                
                if (options.detailed) {
                    console.log(chalk.white('\nCTA Field Details:'));
                    const ctaFields = {
                        'Tagline': character.tagline,
                        'Stakes': character.stakes,
                        'CTA Text': character.cta_text,
                        'CTA Hook': character.cta_hook,
                        'Power Statement': character.power_statement
                    };

                    Object.entries(ctaFields).forEach(([field, value]) => {
                        const status = value ? chalk.green('✅') : chalk.gray('⭕');
                        const display = value || '(not set)';
                        console.log(`   ${status} ${field}: ${display}`);
                    });
                }
            }

            // Additional validation checks
            if (options.detailed) {
                console.log(chalk.yellow('\n🔍 Additional checks...'));
                
                // Check for required assets
                if (!character.image) {
                    console.log(chalk.yellow('⚠️  No primary image set'));
                }
                
                // Check episode connections
                if (character.episodes && character.episodes.length > 0) {
                    console.log(chalk.green(`✅ Connected to ${character.episodes.length} episode(s)`));
                } else {
                    console.log(chalk.yellow('⚠️  No episode connections'));
                }
                
                // Check publication status
                if (character.published) {
                    console.log(chalk.green('✅ Published character'));
                } else {
                    console.log(chalk.yellow('📝 Draft character'));
                }
            }

            // Summary
            console.log(chalk.blue.bold('\n📊 VALIDATION SUMMARY'));
            const overallStatus = validation.isValid && ctaScore.score >= 50;
            if (overallStatus) {
                console.log(chalk.green('✅ Character is ready for use'));
            } else {
                console.log(chalk.yellow('⚠️  Character needs attention'));
                console.log(chalk.gray('Fix validation errors and improve CTA score'));
            }

        } catch (error) {
            console.log(chalk.red('❌ Failed to validate character:'), error.message);
        }
    }

    /**
     * Show character help information
     */
    showCharacterHelp() {
        console.log(chalk.blue.bold('👥 CHARACTER CLI COMMANDS'));
        console.log(chalk.gray('=' .repeat(50)));
        console.log(chalk.white('Comprehensive character management with CTA enhancement'));
        console.log('');

        console.log(chalk.green.bold('📝 CREATE & MANAGE'));
        console.log(chalk.white('character create --name="Name" [options]    Create new character'));
        console.log(chalk.white('character list [--role=type] [--detailed]   List all characters'));
        console.log(chalk.white('character show <id>                        Show character details'));
        console.log(chalk.white('character update <id> --field=value        Update character'));
        console.log(chalk.white('character delete <id> --confirm [--hard]   Delete character'));
        console.log('');

        console.log(chalk.green.bold('🎯 CTA ENHANCEMENT (Issue #80)'));
        console.log(chalk.white('character cta <id> --score                 Show CTA completeness'));
        console.log(chalk.white('character cta <id> --tagline="..."         Set tagline'));
        console.log(chalk.white('character cta <id> --stakes="..."          Set stakes'));
        console.log(chalk.white('character cta <id> --cta-text="..."        Set CTA text'));
        console.log('');

        console.log(chalk.green.bold('✅ VALIDATION & QUALITY'));
        console.log(chalk.white('character validate <id> [--check-cta]      Validate character'));
        console.log(chalk.white('character clone <id> --name="New Name"     Clone character'));
        console.log(chalk.white('character publish <id>                     Publish character'));
        console.log(chalk.white('character unpublish <id>                   Unpublish character'));
        console.log('');

        console.log(chalk.green.bold('🤖 AI ENHANCEMENT (Coming Soon)'));
        console.log(chalk.white('character ai <id> --enhance                AI enhance character'));
        console.log(chalk.white('character avatar <id> --generate           Generate avatar'));
        console.log('');

        console.log(chalk.yellow.bold('📋 CREATE OPTIONS'));
        console.log(chalk.gray('--name="Name"              Character name (required)'));
        console.log(chalk.gray('--role=protagonist|supporting|antagonist   Character role'));
        console.log(chalk.gray('--description="..."        Character description'));
        console.log(chalk.gray('--tagline="..."           Character tagline'));
        console.log(chalk.gray('--stakes="..."            What\'s at stake'));
        console.log(chalk.gray('--cta-text="..."          Call to action text'));
        console.log(chalk.gray('--species=human           Character species'));
        console.log(chalk.gray('--age="25"                Character age'));
        console.log('');

        console.log(chalk.cyan.bold('💡 EXAMPLES'));
        console.log(chalk.gray('character create --name="Alex Sterling" --role=protagonist --tagline="Hero of the realm"'));
        console.log(chalk.gray('character list --role=protagonist --detailed'));
        console.log(chalk.gray('character cta alex-sterling --stakes="The fate of the kingdom"'));
        console.log(chalk.gray('character update alex-sterling --description="A brave warrior"'));
        console.log('');

        console.log(chalk.blue('🔗 Related: GitHub Issue #152 (CLI CRUD) & #80 (CTA Enhancement)'));
    }

    // === Helper Methods ===

    parseCreateArgs(args) {
        const options = {};
        
        args.forEach(arg => {
            if (arg.startsWith('--')) {
                const [key, ...valueParts] = arg.substring(2).split('=');
                const value = valueParts.join('=').replace(/^["']|["']$/g, ''); // Remove quotes
                
                switch (key.toLowerCase()) {
                    case 'name':
                        options.name = value;
                        break;
                    case 'title':
                        options.title = value;
                        break;
                    case 'role':
                        options.role = value.toLowerCase();
                        break;
                    case 'description':
                    case 'desc':
                        options.description = value;
                        break;
                    case 'backstory':
                        options.backstory = value;
                        break;
                    case 'tagline':
                        options.tagline = value;
                        break;
                    case 'stakes':
                        options.stakes = value;
                        break;
                    case 'cta-text':
                    case 'ctatext':
                        options.ctaText = value;
                        break;
                    case 'cta-hook':
                    case 'ctahook':
                        options.ctaHook = value;
                        break;
                    case 'power-statement':
                    case 'powerstatement':
                        options.powerStatement = value;
                        break;
                    case 'species':
                        options.species = value;
                        break;
                    case 'age':
                        options.age = value;
                        break;
                    case 'location':
                        options.location = value;
                        break;
                    case 'character-type':
                    case 'charactertype':
                    case 'type':
                        options.characterType = value;
                        break;
                    case 'image':
                        options.image = value;
                        break;
                    case 'published':
                        options.published = value.toLowerCase() !== 'false';
                        break;
                    case 'traits':
                        options.traits = value.split(',').map(t => t.trim());
                        break;
                    case 'abilities':
                        options.abilities = value.split(',').map(a => a.trim());
                        break;
                    case 'weapons':
                        options.weapons = value.split(',').map(w => w.trim());
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
                    case 'role':
                        options.role = value;
                        break;
                    case 'published':
                        options.published = value.toLowerCase() === 'true';
                        break;
                    case 'species':
                        options.species = value;
                        break;
                    case 'character-type':
                    case 'charactertype':
                    case 'type':
                        options.characterType = value;
                        break;
                    case 'sort-by':
                    case 'sortby':
                    case 'sort':
                        options.sortBy = value;
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

    parseUpdateArgs(args) {
        const options = {};
        
        args.forEach(arg => {
            if (arg.startsWith('--')) {
                const [key, ...valueParts] = arg.substring(2).split('=');
                const value = valueParts.join('=').replace(/^["']|["']$/g, '');
                
                // Convert kebab-case to camelCase for some fields
                const fieldMap = {
                    'cta-text': 'cta_text',
                    'cta-hook': 'cta_hook', 
                    'power-statement': 'power_statement'
                };
                
                const fieldName = fieldMap[key.toLowerCase()] || key.toLowerCase();
                options[fieldName] = value;
            }
        });
        
        return options;
    }

    parseDeleteArgs(args) {
        const options = {};
        
        args.forEach(arg => {
            if (arg === '--confirm') {
                options.confirm = true;
            } else if (arg === '--hard') {
                options.hard = true;
            }
        });
        
        return options;
    }

    parseCTAArgs(args) {
        const options = {};
        
        args.forEach(arg => {
            if (arg === '--score') {
                options.score = true;
            } else if (arg === '--enhance') {
                options.enhance = true;
            } else if (arg.startsWith('--')) {
                const [key, ...valueParts] = arg.substring(2).split('=');
                const value = valueParts.join('=').replace(/^["']|["']$/g, '');
                
                switch (key.toLowerCase()) {
                    case 'tagline':
                        options.tagline = value;
                        break;
                    case 'stakes':
                        options.stakes = value;
                        break;
                    case 'cta-text':
                    case 'ctatext':
                        options.ctaText = value;
                        break;
                    case 'cta-hook':
                    case 'ctahook':
                        options.ctaHook = value;
                        break;
                    case 'power-statement':
                    case 'powerstatement':
                        options.powerStatement = value;
                        break;
                }
            }
        });
        
        return options;
    }

    parseValidateArgs(args) {
        const options = {};
        
        args.forEach(arg => {
            if (arg === '--check-cta' || arg === '--cta') {
                options.checkCta = true;
            } else if (arg === '--detailed' || arg === '--detail') {
                options.detailed = true;
            }
        });
        
        return options;
    }

    getRoleIcon(role) {
        const icons = {
            'protagonist': '🦸 ',
            'antagonist': '🦹 ',
            'supporting': '👤 ',
            'background': '👥 ',
            'villain': '😈 ',
            'hero': '⭐ '
        };
        
        return icons[role.toLowerCase()] || '👤 ';
    }

    calculateCharacterStats(characters) {
        return {
            total: characters.length,
            published: characters.filter(c => c.published).length,
            drafts: characters.filter(c => !c.published).length,
            protagonists: characters.filter(c => c.role === 'protagonist').length,
            supporting: characters.filter(c => c.role === 'supporting').length,
            antagonists: characters.filter(c => c.role === 'antagonist').length
        };
    }
}

module.exports = CharacterCommands;