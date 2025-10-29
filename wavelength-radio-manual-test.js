#!/usr/bin/env node

/**
 * 🌊 WAVELENGTH RADIO WIDGET MANUAL TEST GUIDE
 * 
 * Simple manual testing instructions for radio widget functionality
 */

const chalk = require('chalk');
const https = require('https');

console.log(chalk.magenta.bold('🌊 WAVELENGTH RADIO WIDGET MANUAL TEST GUIDE'));
console.log(chalk.magenta('==============================================='));
console.log('');

console.log(chalk.blue.bold('📋 TEST CHECKLIST:'));
console.log('');

console.log(chalk.green('1. Homepage Test (/):'));
console.log('   ✓ Open http://localhost:3001/');
console.log('   ✓ Scroll to footer - should see mini radio player widget');
console.log('   ✓ Open browser console (F12) - should see no JavaScript errors');
console.log('   ✓ Widget should be functional (play/pause buttons work)');
console.log('');

console.log(chalk.yellow('2. Radio Page Test (/radio):'));
console.log('   ✓ Open http://localhost:3001/radio');
console.log('   ✓ Should NOT see mini radio player in footer');
console.log('   ✓ Open browser console (F12) - should see debug message:');
console.log('     "Radio widget container not found; skipping initialization"');
console.log('   ✓ Should see no JavaScript errors about duplicate declarations');
console.log('');

console.log(chalk.blue('3. Episode Page Test (/episode/1):'));
console.log('   ✓ Open http://localhost:3001/episode/1 (if exists)');
console.log('   ✓ Scroll to footer - should see mini radio player widget');
console.log('   ✓ Open browser console (F12) - should see no JavaScript errors');
console.log('   ✓ Widget should be functional');
console.log('');

console.log(chalk.cyan.bold('🔍 WHAT TO LOOK FOR:'));
console.log('');

console.log(chalk.green('✅ SUCCESS INDICATORS:'));
console.log('   • Mini radio widget appears in footer on homepage and episode pages');
console.log('   • NO mini radio widget on /radio page');
console.log('   • Console shows "skipping initialization" message on /radio page');
console.log('   • No JavaScript errors about "levelUpAnimationStyle already declared"');
console.log('   • Play/pause buttons work on widget when present');
console.log('');

console.log(chalk.red('❌ FAILURE INDICATORS:'));
console.log('   • JavaScript errors in console about duplicate declarations');
console.log('   • Mini radio widget appears on /radio page (should not)');
console.log('   • No debug message about skipping initialization on /radio page');
console.log('   • Widget non-functional (buttons don\'t respond)');
console.log('');

console.log(chalk.blue.bold('🛠️ QUICK SERVER CHECK:'));

// Quick server health check
const checkServer = () => {
    return new Promise((resolve) => {
        const req = require('http').request({
            hostname: 'localhost',
            port: 3001,
            path: '/',
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
        console.log('');
        console.log(chalk.blue.bold('🚀 START MANUAL TESTING:'));
        console.log(chalk.blue('1. Open http://localhost:3001/ in your browser'));
        console.log(chalk.blue('2. Follow the checklist above'));
        console.log(chalk.blue('3. Report any failures you observe'));
    } else {
        console.log(chalk.red('❌ Server is not running on http://localhost:3001'));
        console.log(chalk.yellow('Please start the server with: node app.js'));
    }
    console.log('');
    console.log(chalk.magenta('🌊 WAVELENGTH TESTING READY!'));
});