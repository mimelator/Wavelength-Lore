/**
 * Step 7: Lore Registration
 * 
 * Registers characters, locations, and lore items associated with an episode.
 * Lore items are hidden until the episode is published.
 * 
 * GitHub Issue: #132 - Milestone 3.2: Lore & Character Registration
 */

const chalk = require('chalk');
const FirebaseCharacterService = require('../../services/firebase-character-service');
const FirebaseLoreService = require('../../services/firebase-lore-service');
const FirebaseEpisodeService = require('../../services/firebase-episode-service');

class LoreRegistrationStep {
    constructor(stateManager, rl) {
        this.stateManager = stateManager;
        this.rl = rl;
        this.characterService = new FirebaseCharacterService();
        this.loreService = new FirebaseLoreService();
        this.episodeService = new FirebaseEpisodeService();
    }

    /**
     * Execute Step 7: Lore Registration
     */
    async execute(episode) {
        console.log(chalk.yellow('\nStep 7 of 10: Lore Registration'));
        console.log(chalk.gray('='.repeat(50)));
        console.log(chalk.cyan(`Episode: ${episode.id} - ${episode.title || 'Untitled'}`));
        console.log(chalk.gray('\nRegister characters, locations, and lore items for this episode.'));
        console.log(chalk.gray('All registered lore will be hidden until the episode is published.\n'));

        try {
            // Get episode images for asset selection
            const episodeImages = await this.getEpisodeImages(episode);
            
            const registeredLore = {
                characters: [],
                locations: [],
                items: []
            };

            let continueRegistration = true;

            while (continueRegistration) {
                console.log(chalk.blue.bold('\n📚 LORE REGISTRATION MENU'));
                console.log(chalk.gray('─'.repeat(50)));
                console.log('1. 👥 Register Character');
                console.log('2. 📍 Register Location');
                console.log('3. 🎁 Register Item/Concept');
                console.log('4. 📊 View Lore Summary');
                console.log('5. ✅ Complete Registration');
                console.log('0. ⏭️  Skip (complete later)');
                console.log(chalk.gray('─'.repeat(50)));

                const choice = await this.promptUser('Select option (0-5): ');

                switch (choice.trim()) {
                    case '1':
                        const character = await this.registerCharacter(episode, episodeImages);
                        if (character) {
                            registeredLore.characters.push(character);
                        }
                        break;

                    case '2':
                        const location = await this.registerLocation(episode, episodeImages);
                        if (location) {
                            registeredLore.locations.push(location);
                        }
                        break;

                    case '3':
                        const item = await this.registerItem(episode, episodeImages);
                        if (item) {
                            registeredLore.items.push(item);
                        }
                        break;

                    case '4':
                        await this.viewLoreSummary(episode, registeredLore);
                        break;

                    case '5':
                        continueRegistration = false;
                        break;

                    case '0':
                        console.log(chalk.yellow('\n⏭️  Skipping lore registration. You can complete this later.'));
                        return {
                            completed: false,
                            skipped: true,
                            registeredLore
                        };

                    default:
                        console.log(chalk.red('❌ Invalid option. Please try again.'));
                }
            }

            // Save registered lore to episode state
            if (registeredLore.characters.length > 0 || 
                registeredLore.locations.length > 0 || 
                registeredLore.items.length > 0) {
                
                await this.stateManager.updateEpisodeStep(episode.id, 7, {
                    completed: true,
                    completedAt: new Date().toISOString(),
                    registeredLore
                });

                console.log(chalk.green('\n✅ Lore registration complete!'));
                console.log(chalk.gray(`   Characters: ${registeredLore.characters.length}`));
                console.log(chalk.gray(`   Locations: ${registeredLore.locations.length}`));
                console.log(chalk.gray(`   Items: ${registeredLore.items.length}`));
                console.log(chalk.yellow('\n💡 All lore is hidden until the episode is published.'));
            } else {
                console.log(chalk.yellow('\n⚠️  No lore registered. Step marked as incomplete.'));
                return {
                    completed: false,
                    registeredLore: {}
                };
            }

            return {
                completed: true,
                registeredLore
            };

        } catch (error) {
            console.error(chalk.red(`❌ Lore registration failed: ${error.message}`));
            throw error;
        }
    }

    /**
     * Register a new character
     */
    async registerCharacter(episode, episodeImages) {
        console.log(chalk.blue.bold('\n👥 CHARACTER REGISTRATION'));
        console.log(chalk.gray('─'.repeat(50)));

        try {
            const name = await this.promptUser(chalk.yellow('Character Name: '));
            if (!name || !name.trim()) {
                console.log(chalk.yellow('⚠️  Registration cancelled.'));
                return null;
            }

            const title = await this.promptUser(chalk.yellow('Character Title/Role (optional): ')) || name;
            const description = await this.promptUser(chalk.yellow('Description: ')) || '';
            const role = await this.promptUser(chalk.yellow('Role (main/supporting/npc, default: supporting): ')) || 'supporting';

            // Select portrait from episode images
            let portraitImage = '';
            if (episodeImages && episodeImages.length > 0) {
                console.log(chalk.cyan('\n📸 Select portrait image from episode:'));
                episodeImages.forEach((img, idx) => {
                    console.log(chalk.gray(`  ${idx + 1}. ${img}`));
                });
                console.log(chalk.gray(`  ${episodeImages.length + 1}. Skip (no portrait)`));
                
                const imageChoice = await this.promptUser(chalk.yellow(`Select image (1-${episodeImages.length + 1}): `));
                const imageIdx = parseInt(imageChoice) - 1;
                
                if (imageIdx >= 0 && imageIdx < episodeImages.length) {
                    portraitImage = episodeImages[imageIdx];
                }
            }

            // Relationship mapping (optional)
            const relationships = await this.collectRelationships();

            // Generate character ID
            const characterId = this.generateId(name);

            // Create character data
            const characterData = {
                id: characterId,
                name: name.trim(),
                title: title.trim(),
                description: description.trim(),
                role: role.trim().toLowerCase(),
                image: portraitImage,
                episodes: [episode.id],
                relationships: relationships,
                published: false, // Hidden until episode is published
                episodeIntroduced: episode.id
            };

            // Create character in Firebase
            const createdId = await this.characterService.createCharacter(characterData);

            console.log(chalk.green(`\n✅ Character "${name}" registered successfully!`));
            console.log(chalk.gray(`   ID: ${createdId}`));
            console.log(chalk.gray(`   Status: Hidden (will be visible when episode is published)`));

            return {
                id: createdId,
                name: name.trim(),
                type: 'character'
            };

        } catch (error) {
            console.error(chalk.red(`❌ Character registration failed: ${error.message}`));
            return null;
        }
    }

    /**
     * Register a new location
     */
    async registerLocation(episode, episodeImages) {
        console.log(chalk.blue.bold('\n📍 LOCATION REGISTRATION'));
        console.log(chalk.gray('─'.repeat(50)));

        try {
            const name = await this.promptUser(chalk.yellow('Location Name: '));
            if (!name || !name.trim()) {
                console.log(chalk.yellow('⚠️  Registration cancelled.'));
                return null;
            }

            const description = await this.promptUser(chalk.yellow('Description: ')) || '';
            const category = await this.promptUser(chalk.yellow('Category (place/location/landmark, default: place): ')) || 'place';

            // Select image from episode
            let locationImage = '';
            if (episodeImages && episodeImages.length > 0) {
                console.log(chalk.cyan('\n📸 Select location image from episode:'));
                episodeImages.forEach((img, idx) => {
                    console.log(chalk.gray(`  ${idx + 1}. ${img}`));
                });
                console.log(chalk.gray(`  ${episodeImages.length + 1}. Skip (no image)`));
                
                const imageChoice = await this.promptUser(chalk.yellow(`Select image (1-${episodeImages.length + 1}): `));
                const imageIdx = parseInt(imageChoice) - 1;
                
                if (imageIdx >= 0 && imageIdx < episodeImages.length) {
                    locationImage = episodeImages[imageIdx];
                }
            }

            // Generate lore ID
            const loreId = this.generateId(name);

            // Create lore entry for location
            const loreData = {
                id: loreId,
                title: name.trim(),
                description: description.trim(),
                category: category.trim().toLowerCase(),
                contentType: 'location',
                primaryImage: locationImage,
                relatedEpisodes: [episode.id],
                published: false, // Hidden until episode is published
                visible: false
            };

            // Create location in Firebase
            const createdId = await this.loreService.createLoreEntry(loreData);

            console.log(chalk.green(`\n✅ Location "${name}" registered successfully!`));
            console.log(chalk.gray(`   ID: ${createdId}`));
            console.log(chalk.gray(`   Status: Hidden (will be visible when episode is published)`));

            return {
                id: createdId,
                name: name.trim(),
                type: 'location'
            };

        } catch (error) {
            console.error(chalk.red(`❌ Location registration failed: ${error.message}`));
            return null;
        }
    }

    /**
     * Register a new item/concept
     */
    async registerItem(episode, episodeImages) {
        console.log(chalk.blue.bold('\n🎁 ITEM/CONCEPT REGISTRATION'));
        console.log(chalk.gray('─'.repeat(50)));

        try {
            const name = await this.promptUser(chalk.yellow('Item/Concept Name: '));
            if (!name || !name.trim()) {
                console.log(chalk.yellow('⚠️  Registration cancelled.'));
                return null;
            }

            const description = await this.promptUser(chalk.yellow('Description: ')) || '';
            const contentType = await this.promptUser(chalk.yellow('Type (item/concept/artifact, default: item): ')) || 'item';
            const category = await this.promptUser(chalk.yellow('Category (default: general): ')) || 'general';

            // Select image from episode
            let itemImage = '';
            if (episodeImages && episodeImages.length > 0) {
                console.log(chalk.cyan('\n📸 Select item image from episode:'));
                episodeImages.forEach((img, idx) => {
                    console.log(chalk.gray(`  ${idx + 1}. ${img}`));
                });
                console.log(chalk.gray(`  ${episodeImages.length + 1}. Skip (no image)`));
                
                const imageChoice = await this.promptUser(chalk.yellow(`Select image (1-${episodeImages.length + 1}): `));
                const imageIdx = parseInt(imageChoice) - 1;
                
                if (imageIdx >= 0 && imageIdx < episodeImages.length) {
                    itemImage = episodeImages[imageIdx];
                }
            }

            // Generate lore ID
            const loreId = this.generateId(name);

            // Create lore entry for item
            const loreData = {
                id: loreId,
                title: name.trim(),
                description: description.trim(),
                category: category.trim().toLowerCase(),
                contentType: contentType.trim().toLowerCase(),
                primaryImage: itemImage,
                relatedEpisodes: [episode.id],
                published: false, // Hidden until episode is published
                visible: false
            };

            // Create item in Firebase
            const createdId = await this.loreService.createLoreEntry(loreData);

            console.log(chalk.green(`\n✅ Item/Concept "${name}" registered successfully!`));
            console.log(chalk.gray(`   ID: ${createdId}`));
            console.log(chalk.gray(`   Status: Hidden (will be visible when episode is published)`));

            return {
                id: createdId,
                name: name.trim(),
                type: 'item'
            };

        } catch (error) {
            console.error(chalk.red(`❌ Item registration failed: ${error.message}`));
            return null;
        }
    }

    /**
     * Collect relationship information (optional)
     */
    async collectRelationships() {
        const relationships = {
            allies: [],
            enemies: [],
            locations: []
        };

        console.log(chalk.cyan('\n🔗 Relationships (optional, press Enter to skip)'));
        
        const alliesInput = await this.promptUser(chalk.yellow('Allies (comma-separated character IDs): '));
        if (alliesInput && alliesInput.trim()) {
            relationships.allies = alliesInput.split(',').map(id => id.trim()).filter(Boolean);
        }

        const enemiesInput = await this.promptUser(chalk.yellow('Enemies (comma-separated character IDs): '));
        if (enemiesInput && enemiesInput.trim()) {
            relationships.enemies = enemiesInput.split(',').map(id => id.trim()).filter(Boolean);
        }

        const locationsInput = await this.promptUser(chalk.yellow('Locations (comma-separated location IDs): '));
        if (locationsInput && locationsInput.trim()) {
            relationships.locations = locationsInput.split(',').map(id => id.trim()).filter(Boolean);
        }

        return relationships;
    }

    /**
     * View summary of registered lore
     */
    async viewLoreSummary(episode, registeredLore) {
        console.log(chalk.blue.bold('\n📊 LORE SUMMARY'));
        console.log(chalk.gray('='.repeat(50)));
        console.log(chalk.cyan(`Episode: ${episode.id} - ${episode.title || 'Untitled'}\n`));

        if (registeredLore.characters.length > 0) {
            console.log(chalk.green(`👥 Characters (${registeredLore.characters.length}):`));
            registeredLore.characters.forEach(char => {
                console.log(chalk.white(`   • ${char.name} (${char.id})`));
            });
            console.log();
        }

        if (registeredLore.locations.length > 0) {
            console.log(chalk.green(`📍 Locations (${registeredLore.locations.length}):`));
            registeredLore.locations.forEach(loc => {
                console.log(chalk.white(`   • ${loc.name} (${loc.id})`));
            });
            console.log();
        }

        if (registeredLore.items.length > 0) {
            console.log(chalk.green(`🎁 Items (${registeredLore.items.length}):`));
            registeredLore.items.forEach(item => {
                console.log(chalk.white(`   • ${item.name} (${item.id})`));
            });
            console.log();
        }

        if (registeredLore.characters.length === 0 && 
            registeredLore.locations.length === 0 && 
            registeredLore.items.length === 0) {
            console.log(chalk.yellow('⚠️  No lore registered yet.'));
        } else {
            console.log(chalk.yellow('💡 All lore is hidden until the episode is published.'));
        }
    }

    /**
     * Get episode images for asset selection
     */
    async getEpisodeImages(episode) {
        try {
            // Get full episode data
            const fullEpisode = await this.episodeService.getEpisodeById(episode.id);
            
            if (!fullEpisode) {
                return [];
            }

            // Collect images from various episode fields
            const images = [];
            
            if (fullEpisode.images && Array.isArray(fullEpisode.images)) {
                images.push(...fullEpisode.images);
            }
            
            if (fullEpisode.approvedImages && Array.isArray(fullEpisode.approvedImages)) {
                images.push(...fullEpisode.approvedImages);
            }
            
            if (fullEpisode.carouselImages && Array.isArray(fullEpisode.carouselImages)) {
                images.push(...fullEpisode.carouselImages);
            }

            // Deduplicate
            return [...new Set(images)];
            
        } catch (error) {
            console.log(chalk.yellow(`⚠️  Could not load episode images: ${error.message}`));
            return [];
        }
    }

    /**
     * Generate ID from name (lowercase, hyphens)
     */
    generateId(name) {
        return name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }

    /**
     * Prompt user for input
     */
    promptUser(question) {
        return new Promise((resolve) => {
            this.rl.question(question, (answer) => {
                resolve(answer);
            });
        });
    }
}

module.exports = LoreRegistrationStep;

