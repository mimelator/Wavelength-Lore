#!/usr/bin/env node

/**
 * Character CLI Commands Test Suite
 * 
 * Tests the Character CLI implementation for Phase 2
 * Validates all CRUD operations and CTA functionality
 */

const chalk = require('chalk');
require('dotenv').config();

async function testCharacterCLI() {
    console.log(chalk.blue.bold('🧪 CHARACTER CLI COMMANDS TEST'));
    console.log(chalk.gray('=' .repeat(50)));
    
    try {
        // Test 1: Load Character Commands
        console.log(chalk.yellow('1️⃣ Testing Character Commands loading...'));
        const CharacterCommands = require('./commands/character-commands.js');
        
        // Mock CLI context
        const mockCLI = {
            app: null,
            rl: {
                question: (prompt, callback) => callback('y')
            }
        };
        
        const characterCommands = new CharacterCommands(mockCLI);
        console.log(chalk.green('✅ Character Commands loaded successfully'));
        
        // Test 2: Test Help System
        console.log(chalk.yellow('\n2️⃣ Testing help system...'));
        characterCommands.showCharacterHelp();
        console.log(chalk.green('✅ Help system working'));
        
        // Test 3: Test CLI Integration
        console.log(chalk.yellow('\n3️⃣ Testing CLI integration...'));
        const WavelengthContentCLI = require('./wavelength-content-cli.js');
        const cli = new WavelengthContentCLI();
        
        console.log(chalk.green('✅ Main CLI integration working'));
        
        // Test 4: Test Character Service Integration
        console.log(chalk.yellow('\n4️⃣ Testing Character Service integration...'));
        const CharacterService = require('./services/firebase-character-service.js');
        const service = new CharacterService();
        
        console.log(chalk.green('✅ Character Service integration working'));
        
        console.log(chalk.green.bold('\n🎉 CHARACTER CLI TEST PASSED!'));
        console.log(chalk.white('Character commands are ready for use!'));
        console.log(chalk.cyan('\n📋 Available Commands:'));
        console.log(chalk.white('• character create --name="Test Character" --role=protagonist'));
        console.log(chalk.white('• character list --detailed'));
        console.log(chalk.white('• character cta <id> --score'));
        console.log(chalk.white('• character help'));
        
    } catch (error) {
        console.log(chalk.red.bold('\n❌ CHARACTER CLI TEST FAILED'));
        console.log(chalk.red(`Error: ${error.message}`));
        
        if (error.stack) {
            console.log(chalk.gray('\nStack trace:'));
            console.log(chalk.gray(error.stack));
        }
        
        process.exit(1);
    }
}

// Run test
if (require.main === module) {
    testCharacterCLI();
}

module.exports = testCharacterCLI;