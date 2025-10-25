#!/usr/bin/env node

/**
 * Quick CDN Switch Utility
 * Switches between localhost and CloudFront CDN configurations
 */

const fs = require('fs');
const path = require('path');

const ENV_FILE = '.env';
const LOCALHOST_CDN = 'http://localhost:3001';
const CLOUDFRONT_CDN = 'https://df5sj8f594cdx.cloudfront.net';

function updateCDNUrl(newUrl, description) {
    console.log(`🔧 Switching CDN to: ${description}`);
    console.log(`📡 New CDN URL: ${newUrl}`);
    
    let envContent = fs.readFileSync(ENV_FILE, 'utf8');
    
    // Replace the CDN_URL line
    const cdnRegex = /^CDN_URL=.*$/m;
    if (cdnRegex.test(envContent)) {
        envContent = envContent.replace(cdnRegex, `CDN_URL=${newUrl}`);
    } else {
        // Add CDN_URL if it doesn't exist
        envContent += `\nCDN_URL=${newUrl}\n`;
    }
    
    fs.writeFileSync(ENV_FILE, envContent);
    console.log('✅ .env file updated');
    
    return newUrl;
}

function getCurrentCDN() {
    const envContent = fs.readFileSync(ENV_FILE, 'utf8');
    const match = envContent.match(/^CDN_URL=(.*)$/m);
    return match ? match[1].trim() : 'Not set';
}

function showCurrentStatus() {
    const currentCDN = getCurrentCDN();
    console.log('📊 CURRENT CDN STATUS:');
    console.log(`   Current CDN: ${currentCDN}`);
    
    if (currentCDN.includes('localhost')) {
        console.log('   Status: 🏠 Localhost (Development mode)');
        console.log('   Images: ✅ Will work perfectly');
        console.log('   Modals: ✅ Will work perfectly');
    } else if (currentCDN.includes('cloudfront')) {
        console.log('   Status: ☁️  CloudFront (Production mode)');
        console.log('   Images: ❌ Currently broken (needs configuration)');
        console.log('   Modals: ❌ Currently broken (needs configuration)');
    } else {
        console.log('   Status: ⚠️  Unknown configuration');
    }
    console.log('');
}

function main() {
    console.log('🌐 CDN CONFIGURATION SWITCHER');
    console.log('=============================');
    console.log('');
    
    showCurrentStatus();
    
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('📋 USAGE:');
        console.log('   node scripts/switch-cdn.js localhost    # Switch to localhost');
        console.log('   node scripts/switch-cdn.js cloudfront   # Switch to CloudFront');
        console.log('   node scripts/switch-cdn.js status       # Show current status');
        console.log('');
        console.log('💡 RECOMMENDATIONS:');
        console.log('   • Use localhost for development and immediate functionality');
        console.log('   • Use CloudFront after adding the required cache behaviors');
        return;
    }
    
    const command = args[0].toLowerCase();
    
    switch (command) {
        case 'localhost':
        case 'local':
            updateCDNUrl(LOCALHOST_CDN, 'Localhost (Development)');
            console.log('');
            console.log('🎉 CDN switched to localhost!');
            console.log('');
            console.log('🔄 Next steps:');
            console.log('   1. Restart your server: pkill -f "node.*index.js" && node index.js');
            console.log('   2. Test functionality: node scripts/test-cdn-paths.js');
            console.log('   3. Check map modal: http://localhost:3001/map');
            break;
            
        case 'cloudfront':
        case 'cloud':
        case 'cf':
            updateCDNUrl(CLOUDFRONT_CDN, 'CloudFront (Production)');
            console.log('');
            console.log('☁️  CDN switched to CloudFront!');
            console.log('');
            console.log('⚠️  IMPORTANT: CloudFront needs configuration first');
            console.log('   Run: node scripts/cloudfront-commands.js');
            console.log('   Or use AWS Console to add cache behaviors');
            console.log('');
            console.log('🧪 Test after CloudFront configuration:');
            console.log('   node scripts/test-cdn-paths.js');
            break;
            
        case 'status':
            // Status already shown above
            break;
            
        default:
            console.log(`❌ Unknown command: ${command}`);
            console.log('   Valid commands: localhost, cloudfront, status');
    }
}

main();