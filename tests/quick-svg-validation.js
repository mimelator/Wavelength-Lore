#!/usr/bin/env node

/**
 * Quick SVG Structure Validation
 * Simple test to validate SVG structure without browser automation
 */

const http = require('http');

async function validateSVGStructure() {
    console.log('🔍 QUICK SVG STRUCTURE VALIDATION');
    console.log('='.repeat(50));

    try {
        // Get the map page HTML
        const response = await makeHttpRequest('http://localhost:3001/map');
        
        console.log('📊 SVG Structure Analysis:');
        
        // Check for our key fixes
        const checks = {
            'Fixed CSS dimensions': response.includes('width: 1024px') && response.includes('height: 1024px'),
            'Coordinate validation': response.includes('validateCoordinateSystem'),
            'Click debugging': response.includes('Click event details'),
            'Pointer events fix': response.includes('pointer-events: all'),
            'Enhanced hover states': response.includes('hover:stroke-red-500'),
        };
        
        Object.entries(checks).forEach(([check, passed]) => {
            console.log(`   ${passed ? '✅' : '❌'} ${check}`);
        });
        
        // Count click targets
        const clickTargetMatches = response.match(/data-location="/g);
        const clickTargetCount = clickTargetMatches ? clickTargetMatches.length : 0;
        console.log(`   📍 Click targets found: ${clickTargetCount}`);
        
        // Check for specific locations
        const locations = ['ice-fortress', 'the-shire', 'goblin-king-lair'];
        console.log('\\n🎯 Location Targets:');
        
        locations.forEach(location => {
            const hasTarget = response.includes(`data-location="${location}"`);
            const targetCount = (response.match(new RegExp(`data-location="${location}"`, 'g')) || []).length;
            console.log(`   ${hasTarget ? '✅' : '❌'} ${location}: ${targetCount} target(s)`);
        });
        
        // Check if click targets are at the end (highest z-index)
        const svgEndSection = response.substring(response.lastIndexOf('CLICKABLE OVERLAYS'));
        const hasEndTargets = svgEndSection.includes('ice-fortress') && 
                            svgEndSection.includes('the-shire') && 
                            svgEndSection.includes('goblin-king-lair');
        
        console.log(`\\n📋 Z-Index Positioning:`);
        console.log(`   ${hasEndTargets ? '✅' : '❌'} Click targets at SVG end (highest z-index)`);
        
        console.log('\\n🎉 VALIDATION SUMMARY:');
        const passedChecks = Object.values(checks).filter(Boolean).length;
        const totalChecks = Object.keys(checks).length;
        
        console.log(`   Passed: ${passedChecks}/${totalChecks} structural checks`);
        console.log(`   Click targets: ${clickTargetCount} found`);
        
        if (passedChecks === totalChecks && hasEndTargets) {
            console.log('   🚀 SVG structure looks good - ready for manual testing!');
            console.log('\\n📝 Manual Test Steps:');
            console.log('   1. Visit http://localhost:3001/map in browser');
            console.log('   2. Open browser developer console');
            console.log('   3. Click on map locations (ice-fortress, the-shire, goblin-king-lair)');
            console.log('   4. Look for "showMapDisambiguationModal called" logs');
            console.log('   5. Verify disambiguation modal appears');
        } else {
            console.log('   ⚠️  Some structural issues detected - check above');
        }
        
    } catch (error) {
        console.error('❌ Validation failed:', error.message);
    }
}

function makeHttpRequest(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

if (require.main === module) {
    validateSVGStructure().catch(console.error);
}

module.exports = { validateSVGStructure };