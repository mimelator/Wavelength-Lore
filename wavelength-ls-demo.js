#!/usr/bin/env node

/**
 * 🌊 WAVELENGTH CLI LS COMMAND DEMO
 * 
 * Demonstrates the ls command at different hierarchy levels
 */

const chalk = require('chalk');
const { WavelengthChatCLI } = require('./wavelength-chat-cli');
const loreHelpers = require('./helpers/lore-helpers');
const characterHelpers = require('./helpers/character-helpers');
const episodeHelpers = require('./helpers/episode-helpers');

class WavelengthLSDemo {
    constructor() {
        this.chatCLI = new WavelengthChatCLI();
    }

    async initialize() {
        console.log(chalk.magenta.bold('🌊 WAVELENGTH CLI LS COMMAND DEMO'));
        console.log(chalk.magenta('====================================='));
        console.log(chalk.yellow('Demonstrating ls at different hierarchy levels'));
        console.log('');

        try {
            console.log(chalk.gray('📚 Loading lore cache...'));
            await loreHelpers.initializeLoreCache();
            console.log(chalk.green('✅ Lore cache initialized'));
            
            console.log(chalk.gray('👥 Loading character cache...'));
            await characterHelpers.initializeCharacterCache();
            console.log(chalk.green('✅ Character cache initialized'));
            
            console.log(chalk.gray('📺 Loading episode cache...'));
            await episodeHelpers.initializeEpisodeCache();
            console.log(chalk.green('✅ Episode cache initialized'));
            
            console.log(chalk.green('✅ Content initialization complete\n'));
        } catch (error) {
            console.log(chalk.red('❌ Initialization error:', error.message));
        }
    }

    showRootLS() {
        console.log(chalk.cyan.bold('🎯 DEMO 1: ls at ROOT LEVEL (/)'));
        console.log(chalk.cyan('wavelength> pwd'));
        console.log(chalk.white('/'));
        console.log(chalk.cyan('wavelength> ls'));
        console.log('');
        console.log(chalk.blue('📁 Available sections:'));
        console.log(chalk.green('  📚 lore/') + chalk.gray('    - Places, things, concepts, and ideas'));
        console.log(chalk.green('  👥 characters/') + chalk.gray(' - Character profiles and details'));
        console.log(chalk.green('  📺 episodes/') + chalk.gray('   - Episode content and metadata'));
        console.log('');
    }

    showLoreLS() {
        console.log(chalk.cyan.bold('🎯 DEMO 2: ls at LORE LEVEL (/lore/)'));
        console.log(chalk.cyan('wavelength> cd lore/'));
        console.log(chalk.white('📍 Changed to: /lore/'));
        console.log(chalk.cyan('wavelength> ls'));
        console.log('');
        
        const allLore = loreHelpers.getAllLoreSync();
        console.log(chalk.blue('📁 Available sections:'));
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
                const statusIcon = item.visibility === 'hidden' ? '🔒' : '👁️';
                console.log(chalk.white(`    ${statusIcon} ${item.id}`) + chalk.gray(` - ${item.title}`));
            });
        });
        console.log('');
    }

    showLoreTypeLS() {
        console.log(chalk.cyan.bold('🎯 DEMO 3: ls at LORE TYPE LEVEL (/lore/item/)'));
        console.log(chalk.cyan('wavelength> cd item/'));
        console.log(chalk.white('📍 Changed to: /lore/item/'));
        console.log(chalk.cyan('wavelength> ls'));
        console.log('');
        
        const allLore = loreHelpers.getAllLoreSync();
        const itemLore = allLore.filter(item => item.type === 'item');
        
        console.log(chalk.blue('📁 Available items:'));
        console.log(chalk.gray(`  Found ${itemLore.length} items in this category:`));
        console.log('');
        
        itemLore.forEach((item, index) => {
            const statusIcon = item.visibility === 'hidden' ? '🔒' : '👁️';
            const number = `${index + 1}.`.padEnd(3);
            console.log(chalk.white(`  ${number}${statusIcon} ${item.id}`) + chalk.gray(` - ${item.title}`));
            
            if (item.description) {
                const preview = item.description.length > 80 
                    ? item.description.substring(0, 80) + '...'
                    : item.description;
                console.log(chalk.gray(`      ${preview}`));
            }
            console.log('');
        });
    }

    showEpisodesLS() {
        console.log(chalk.cyan.bold('🎯 DEMO 4: ls at EPISODES LEVEL (/episodes/)'));
        console.log(chalk.cyan('wavelength> cd /episodes/'));
        console.log(chalk.white('📍 Changed to: /episodes/'));
        console.log(chalk.cyan('wavelength> ls'));
        console.log('');
        
        const allEpisodes = episodeHelpers.getAllEpisodesSync();
        
        console.log(chalk.blue('📁 Available episodes:'));
        console.log(chalk.gray(`  Found ${allEpisodes.length} episodes across seasons:`));
        console.log('');
        
        // Group by season
        const episodesBySeason = {};
        allEpisodes.forEach(episode => {
            const season = `Season ${episode.season}`;
            if (!episodesBySeason[season]) episodesBySeason[season] = [];
            episodesBySeason[season].push(episode);
        });
        
        Object.keys(episodesBySeason).sort().forEach(season => {
            const episodes = episodesBySeason[season];
            console.log(chalk.yellow(`\n  📂 ${season}/ (${episodes.length} episodes)`));
            
            episodes.slice(0, 3).forEach(episode => {
                const statusIcon = episode.visibility === 'hidden' ? '🔒' : '📺';
                console.log(chalk.white(`    ${statusIcon} S${episode.season}E${episode.episode}`) + 
                           chalk.gray(` - ${episode.title}`));
            });
            
            if (episodes.length > 3) {
                console.log(chalk.gray(`    ... and ${episodes.length - 3} more episodes`));
            }
        });
        console.log('');
    }

    showCharactersLS() {
        console.log(chalk.cyan.bold('🎯 DEMO 5: ls at CHARACTERS LEVEL (/characters/)'));
        console.log(chalk.cyan('wavelength> cd /characters/'));
        console.log(chalk.white('📍 Changed to: /characters/'));
        console.log(chalk.cyan('wavelength> ls'));
        console.log('');
        
        const allCharacters = characterHelpers.getAllCharactersSync();
        
        console.log(chalk.blue('📁 Available characters:'));
        console.log(chalk.gray(`  Found ${allCharacters.length} characters:`));
        console.log('');
        
        allCharacters.slice(0, 8).forEach((character, index) => {
            const statusIcon = character.visibility === 'hidden' ? '🔒' : '👤';
            const number = `${index + 1}.`.padEnd(3);
            console.log(chalk.white(`  ${number}${statusIcon} ${character.id}`) + 
                       chalk.gray(` - ${character.name || character.title || 'Unnamed Character'}`));
            
            if (character.description) {
                const preview = character.description.length > 60 
                    ? character.description.substring(0, 60) + '...'
                    : character.description;
                console.log(chalk.gray(`      ${preview}`));
            }
        });
        
        if (allCharacters.length > 8) {
            console.log(chalk.gray(`  ... and ${allCharacters.length - 8} more characters`));
        }
        console.log('');
    }

    showUsageTips() {
        console.log(chalk.magenta.bold('🎯 LS COMMAND USAGE TIPS:'));
        console.log(chalk.yellow('• ls') + chalk.gray(' - List contents of current directory'));
        console.log(chalk.yellow('• dir') + chalk.gray(' - Alternative to ls (same functionality)'));
        console.log(chalk.yellow('• ls -a') + chalk.gray(' - Show all items including hidden ones'));
        console.log(chalk.yellow('• ls -l') + chalk.gray(' - Long format with detailed information'));
        console.log('');
        console.log(chalk.blue('Navigation between levels:'));
        console.log(chalk.yellow('• cd lore/') + chalk.gray(' - Enter lore section'));
        console.log(chalk.yellow('• cd item/') + chalk.gray(' - Enter specific lore type'));
        console.log(chalk.yellow('• cd ..') + chalk.gray(' - Go up one level'));
        console.log(chalk.yellow('• cd /') + chalk.gray(' - Go to root'));
        console.log('');
    }

    async run() {
        await this.initialize();
        
        this.showRootLS();
        this.showLoreLS();
        this.showLoreTypeLS();
        this.showEpisodesLS();
        this.showCharactersLS();
        this.showUsageTips();
        
        console.log(chalk.green.bold('🎉 DEMO COMPLETE!'));
        console.log(chalk.green('Try running: npm run cli to experience this interactively!'));
    }
}

// Run the demo
const demo = new WavelengthLSDemo();
demo.run().catch(console.error);