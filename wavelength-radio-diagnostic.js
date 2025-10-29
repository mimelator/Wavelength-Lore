#!/usr/bin/env node

/**
 * 🌊 WAVELENGTH RADIO WIDGET DIAGNOSTIC TEST
 * 
 * Simple test to check what's happening with radio widget initialization
 */

const chalk = require('chalk');

console.log(chalk.magenta.bold('🌊 WAVELENGTH RADIO WIDGET DIAGNOSTIC'));
console.log(chalk.magenta('======================================'));
console.log('');

console.log(chalk.blue.bold('🔍 MANUAL DIAGNOSTIC STEPS:'));
console.log('');

console.log(chalk.green('1. Open a browser and navigate to:'));
console.log('   http://localhost:3001/characters');
console.log('');

console.log(chalk.green('2. Open Developer Tools (F12) and go to Console tab'));
console.log('');

console.log(chalk.green('3. Look for these diagnostic messages:'));
console.log(chalk.cyan('   🔍 Radio player detection: fullPlayer=false, miniPlayer=true, isMiniPlayer=true'));
console.log(chalk.cyan('   🎵 Initializing mini radio player'));
console.log('');

console.log(chalk.green('4. Check for errors:'));
console.log(chalk.red('   ❌ BAD: "Cannot read properties of null (reading \'addEventListener\')"'));
console.log(chalk.red('   ❌ BAD: "Radio player: No audio element found"'));
console.log(chalk.green('   ✅ GOOD: No errors, just the detection and initialization messages'));
console.log('');

console.log(chalk.green('5. Test widget functionality:'));
console.log('   • Scroll to bottom of page to see mini radio widget');
console.log('   • Click play button - should work without errors');
console.log('   • Volume slider should be functional');
console.log('');

console.log(chalk.blue.bold('🛠️ IF THERE ARE STILL ERRORS:'));
console.log('');

console.log(chalk.yellow('A. Check if widget container exists:'));
console.log('   In browser console, type:');
console.log(chalk.cyan('   document.querySelector("[data-wavelength-radio-widget]")'));
console.log('   Should return the widget element, not null');
console.log('');

console.log(chalk.yellow('B. Check if audio element exists:'));
console.log('   In browser console, type:');
console.log(chalk.cyan('   document.getElementById("globalRadioAudio")'));
console.log('   Should return the audio element, not null');
console.log('');

console.log(chalk.yellow('C. Check if scripts are loading:'));
console.log('   In Network tab, verify these files load successfully:');
console.log('   • radio-player.js');
console.log('   • radio-player-init.js');
console.log('');

// Quick server check
const checkServer = () => {
    return new Promise((resolve) => {
        const req = require('http').request({
            hostname: 'localhost',
            port: 3001,
            path: '/characters',
            method: 'HEAD',
            timeout: 3000
        }, (res) => {
            resolve(res.statusCode === 200);
        });

        req.on('error', () => resolve(false));
        req.on('timeout', () => {
            req.destroy();
            resolve(false);
        });
        req.end();
    });
};

checkServer().then(isRunning => {
    if (isRunning) {
        console.log(chalk.green('✅ Server is running on http://localhost:3001'));
        console.log(chalk.blue('🚀 Ready for diagnostic testing!'));
    } else {
        console.log(chalk.red('❌ Server is not running on http://localhost:3001'));
        console.log(chalk.yellow('Please start the server with: node app.js'));
    }
    console.log('');
    console.log(chalk.magenta('🌊 Open http://localhost:3001/characters and follow steps above'));
});