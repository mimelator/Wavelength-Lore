#!/usr/bin/env node

// Check command line arguments first, before loading any modules
const args = process.argv.slice(2);

// Show help if requested
if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🔍 Production Validation Suite

Usage: node production_validation.js [options]

Options:
  --quick                 Run quick validation (fewer routes, faster timeouts)
  --full                  Run full validation (all routes, comprehensive checks)
  --skip-images          Skip image checking (faster)
  --skip-static          Skip static resource checking
  --skip-routes          Skip route link checking
  --skip-audio           Skip audio file checking
  --skip-vendor          Skip vendor compatibility checking
  --help, -h             Show this help message

Examples:
  node production_validation.js           # Standard validation
  node production_validation.js --quick   # Quick validation for CI/CD
  node production_validation.js --full    # Comprehensive validation

This suite runs:
  🖼️  Image Checker (check_broken_images.js --prod)
  📁 Static Resource Checker (check_static_resources.js --prod) 
  🔗 Route Link Checker (check_route_links.js --prod)
  🎵 Audio File Checker (check_audio_files.js --prod)
  🛍️  Vendor Compatibility Checker (vendor-compatibility-check.js)
`);
    process.exit(0);
}

const { spawn } = require('child_process');
const path = require('path');

// Configuration
const isQuick = args.includes('--quick');
const isFull = args.includes('--full');
const skipImages = args.includes('--skip-images');
const skipStatic = args.includes('--skip-static');
const skipRoutes = args.includes('--skip-routes');
const skipAudio = args.includes('--skip-audio');
const skipVendor = args.includes('--skip-vendor');

const PROD_URL = 'https://wavelengthlore.com';

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

const log = (message, color = 'reset') => {
    console.log(`${colors[color]}${message}${colors.reset}`);
};

const runChecker = (scriptName, description) => {
    return new Promise((resolve, reject) => {
        log(`\n${'='.repeat(60)}`, 'cyan');
        log(`🚀 Running ${description}`, 'bright');
        log(`${'='.repeat(60)}`, 'cyan');
        
        const scriptPath = path.join(__dirname, scriptName);
        const startTime = Date.now();
        
        let output = '';
        let errorOutput = '';
        
        const child = spawn('node', [scriptPath, '--prod'], {
            stdio: ['pipe', 'pipe', 'pipe']
        });
        
        child.stdout.on('data', (data) => {
            const text = data.toString();
            output += text;
            process.stdout.write(text);
        });
        
        child.stderr.on('data', (data) => {
            const text = data.toString();
            errorOutput += text;
            process.stderr.write(text);
        });
        
        child.on('close', (code) => {
            const duration = ((Date.now() - startTime) / 1000).toFixed(1);
            
            if (code === 0) {
                log(`\n✅ ${description} completed successfully in ${duration}s`, 'green');
                resolve({
                    success: true,
                    output,
                    duration: parseFloat(duration),
                    results: parseResults(output, scriptName)
                });
            } else {
                log(`\n❌ ${description} failed with exit code ${code} after ${duration}s`, 'red');
                resolve({
                    success: false,
                    output,
                    errorOutput,
                    duration: parseFloat(duration),
                    exitCode: code
                });
            }
        });
        
        child.on('error', (error) => {
            log(`\n💥 Failed to start ${description}: ${error.message}`, 'red');
            reject(error);
        });
        
        // Set timeout based on mode
        const timeout = isQuick ? 60000 : isFull ? 300000 : 120000; // 1min, 5min, 2min
        setTimeout(() => {
            child.kill('SIGTERM');
            setTimeout(() => child.kill('SIGKILL'), 5000);
            resolve({
                success: false,
                output,
                errorOutput,
                duration: timeout / 1000,
                timeout: true
            });
        }, timeout);
    });
};

const parseResults = (output, scriptName) => {
    const results = {
        totalChecked: 0,
        totalBroken: 0,
        successRate: 0,
        issues: []
    };
    
    try {
        if (scriptName.includes('images')) {
            // Parse image checker results
            const successMatch = output.match(/Overall: (\d+)\/(\d+) images working/);
            if (successMatch) {
                const working = parseInt(successMatch[1]);
                const total = parseInt(successMatch[2]);
                results.totalChecked = total;
                results.totalBroken = total - working;
                results.successRate = total > 0 ? Math.round((working / total) * 100) : 100;
            }
            
            // Extract broken image categories
            const brokenMatches = output.match(/❌ (\w+) - (\d+) broken:/g);
            if (brokenMatches) {
                brokenMatches.forEach(match => {
                    const [, category, count] = match.match(/❌ (\w+) - (\d+) broken:/);
                    results.issues.push(`${category}: ${count} broken images`);
                });
            }
        } else if (scriptName.includes('static')) {
            // Parse static resource checker results
            const successMatch = output.match(/Overall: (\d+)\/(\d+) static resources working/);
            if (successMatch) {
                const working = parseInt(successMatch[1]);
                const total = parseInt(successMatch[2]);
                results.totalChecked = total;
                results.totalBroken = total - working;
                results.successRate = total > 0 ? Math.round((working / total) * 100) : 100;
            }
            
            // Extract broken resource categories
            const brokenMatches = output.match(/❌ (\w+): \d+\/\d+ working \((\d+) broken\)/g);
            if (brokenMatches) {
                brokenMatches.forEach(match => {
                    const [, category, count] = match.match(/❌ (\w+): \d+\/\d+ working \((\d+) broken\)/);
                    results.issues.push(`${category}: ${count} broken resources`);
                });
            }
        } else if (scriptName.includes('route')) {
            // Parse route checker results
            const successMatch = output.match(/Overall: (\d+)\/(\d+) routes working/);
            if (successMatch) {
                const working = parseInt(successMatch[1]);
                const total = parseInt(successMatch[2]);
                results.totalChecked = total;
                results.totalBroken = total - working;
                results.successRate = total > 0 ? Math.round((working / total) * 100) : 100;
            }
            
            // Extract broken routes
            const brokenRouteMatches = output.match(/❌ ([^\n]+)/g);
            if (brokenRouteMatches) {
                brokenRouteMatches.slice(0, 5).forEach(match => { // Limit to first 5
                    const route = match.replace('❌ ', '').trim();
                    if (route.startsWith('/')) {
                        results.issues.push(`Broken route: ${route}`);
                    }
                });
            }
        } else if (scriptName.includes('audio')) {
            // Parse audio file checker results
            const successMatch = output.match(/Overall: (\d+)\/(\d+) audio files working/);
            if (successMatch) {
                const working = parseInt(successMatch[1]);
                const total = parseInt(successMatch[2]);
                results.totalChecked = total;
                results.totalBroken = total - working;
                results.successRate = total > 0 ? Math.round((working / total) * 100) : 100;
            }
            
            // Extract broken audio files (from issues)
            const brokenAudioMatches = output.match(/Season \d+, Episode \d+.*❌ ([^\n]+)/g);
            if (brokenAudioMatches) {
                brokenAudioMatches.slice(0, 5).forEach(match => { // Limit to first 5
                    const parts = match.split('❌ ');
                    if (parts.length > 1) {
                        const episode = parts[0].trim();
                        const error = parts[1].trim();
                        results.issues.push(`${episode}: ${error}`);
                    }
                });
            }
        } else if (scriptName.includes('vendor')) {
            // Parse vendor compatibility results
            const statusMatch = output.match(/Result: (\w+) - (.+)/);
            if (statusMatch) {
                const [, status, message] = statusMatch;
                results.totalChecked = 1;
                results.totalBroken = status === 'OK' ? 0 : 1;
                results.successRate = status === 'OK' ? 100 : status === 'WARNING' ? 75 : 0;
                if (status !== 'OK') {
                    results.issues.push(message);
                }
            }
        }
    } catch (error) {
        console.error('Error parsing results:', error.message);
    }
    
    return results;
};

const main = async () => {
    const startTime = Date.now();
    
    log('🎯 Production Validation Suite Starting...', 'bright');
    log(`🌐 Target: ${PROD_URL}`, 'cyan');
    log(`⚡ Mode: ${isQuick ? 'Quick' : isFull ? 'Full' : 'Standard'}`, 'cyan');
    log(`📊 Checks: ${[
        !skipImages ? '🖼️ Images' : null,
        !skipStatic ? '📁 Static' : null, 
        !skipRoutes ? '🔗 Routes' : null,
        !skipAudio ? '🎵 Audio' : null,
        !skipVendor ? '🛍️ Vendor' : null
    ].filter(Boolean).join(', ')}`, 'cyan');
    
    const results = {};
    const checkers = [];
    
    if (!skipImages) {
        checkers.push({
            script: 'check_broken_images.js',
            name: 'Image Checker',
            key: 'images'
        });
    }
    
    if (!skipStatic) {
        checkers.push({
            script: 'check_static_resources.js', 
            name: 'Static Resource Checker',
            key: 'static'
        });
    }
    
    if (!skipRoutes) {
        checkers.push({
            script: 'check_route_links.js',
            name: 'Route Link Checker', 
            key: 'routes'
        });
    }
    
    if (!skipAudio) {
        checkers.push({
            script: 'check_audio_files.js',
            name: 'Audio File Checker',
            key: 'audio'
        });
    }
    
    if (!skipVendor) {
        checkers.push({
            script: 'vendor-compatibility-check.js',
            name: 'Vendor Compatibility Checker',
            key: 'vendor'
        });
    }
    
    // Run all checkers
    for (const checker of checkers) {
        try {
            results[checker.key] = await runChecker(checker.script, checker.name);
        } catch (error) {
            results[checker.key] = {
                success: false,
                error: error.message
            };
        }
    }
    
    // Generate summary report
    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    log(`\n${'='.repeat(80)}`, 'bright');
    log('📊 PRODUCTION VALIDATION SUMMARY REPORT', 'bright');
    log(`${'='.repeat(80)}`, 'bright');
    
    log(`\n🌐 Production URL: ${PROD_URL}`, 'cyan');
    log(`⏱️  Total Duration: ${totalDuration}s`, 'cyan');
    log(`📅 Validation Time: ${new Date().toISOString()}`, 'cyan');
    
    let overallSuccess = true;
    let totalChecked = 0;
    let totalBroken = 0;
    
    log('\n📋 Individual Results:', 'bright');
    
    for (const [key, result] of Object.entries(results)) {
        const checkerName = checkers.find(c => c.key === key)?.name || key;
        
        if (result.success) {
            const rate = result.results?.successRate || 0;
            const status = rate === 100 ? '✅' : rate >= 90 ? '⚠️' : '❌';
            log(`  ${status} ${checkerName}: ${rate}% success (${result.duration}s)`, 
                rate === 100 ? 'green' : rate >= 90 ? 'yellow' : 'red');
            
            if (result.results) {
                totalChecked += result.results.totalChecked;
                totalBroken += result.results.totalBroken;
                
                if (result.results.totalBroken > 0) {
                    overallSuccess = false;
                    log(`    Issues: ${result.results.issues.join(', ')}`, 'red');
                }
            }
        } else {
            overallSuccess = false;
            const reason = result.timeout ? 'timeout' : 
                          result.error ? result.error : 
                          `exit code ${result.exitCode}`;
            log(`  ❌ ${checkerName}: Failed (${reason})`, 'red');
        }
    }
    
    // Overall status
    const overallRate = totalChecked > 0 ? Math.round(((totalChecked - totalBroken) / totalChecked) * 100) : 100;
    
    log('\n🎯 Overall Status:', 'bright');
    log(`   📊 Total Items Checked: ${totalChecked}`, 'cyan');
    log(`   ✅ Working: ${totalChecked - totalBroken}`, 'green');
    log(`   ❌ Broken: ${totalBroken}`, totalBroken > 0 ? 'red' : 'green');
    log(`   📈 Success Rate: ${overallRate}%`, overallRate === 100 ? 'green' : overallRate >= 90 ? 'yellow' : 'red');
    
    if (overallSuccess && totalBroken === 0) {
        log('\n🎉 PRODUCTION VALIDATION PASSED!', 'green');
        log('   All systems are working correctly in production.', 'green');
    } else if (overallRate >= 90) {
        log('\n⚠️  PRODUCTION VALIDATION: MINOR ISSUES', 'yellow');
        log('   Most systems working, but some issues detected.', 'yellow');
    } else {
        log('\n🚨 PRODUCTION VALIDATION FAILED!', 'red');
        log('   Critical issues detected in production.', 'red');
    }
    
    // Exit code based on results
    const exitCode = overallSuccess && totalBroken === 0 ? 0 : 
                     overallRate >= 90 ? 1 : 2;
    
    log(`\n📊 Validation completed in ${totalDuration}s`, 'cyan');
    log(`${'='.repeat(80)}`, 'bright');
    
    process.exit(exitCode);
};

// Handle interrupts gracefully
process.on('SIGINT', () => {
    log('\n\n⚠️  Production validation interrupted by user', 'yellow');
    process.exit(130);
});

process.on('SIGTERM', () => {
    log('\n\n⚠️  Production validation terminated', 'yellow');
    process.exit(143);
});

main().catch(error => {
    log(`\n💥 Production validation suite failed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
});