#!/usr/bin/env node

/**
 * Bulk CloudFront Operations
 * 
 * This script performs operations on all configured CloudFront distributions at once.
 * Useful for maintenance tasks that need to be applied to all distributions.
 */

const { getConfiguredDistributions } = require('./cloudfront-helper');

// Import required scripts
const fixOrbErrors = require('./fix-orb-errors');
const CloudFrontCacheBuster = require('./cloudfront-cache-bust');

// Process command line arguments
const args = process.argv.slice(2);
const command = args[0] || 'help';

// Show help message
function showHelp() {
  console.log('\n🛠️  Bulk CloudFront Operations');
  console.log('\nThis script performs operations on all CloudFront distributions at once.');
  console.log('\nUsage:');
  console.log('  node bulk-cloudfront-ops.js [command] [options]');
  console.log('\nCommands:');
  console.log('  fix-orb        Fix ERR_BLOCKED_BY_ORB errors on all distributions');
  console.log('  invalidate     Invalidate cache on all distributions');
  console.log('  help           Show this help message');
  console.log('\nOptions for invalidate:');
  console.log('  --paths <paths>  Comma-separated paths to invalidate (default: /*)\n');
}

// Fix ORB errors on all distributions
async function fixAllOrbErrors() {
  const distributions = getConfiguredDistributions();
  
  console.log('\n🔧 Fixing ORB errors on all CloudFront distributions...\n');
  
  for (const dist of distributions) {
    console.log(`\n🔍 Processing ${dist.name.toUpperCase()} distribution (${dist.id})...`);
    
    try {
      // Store original env variable
      const originalDistId = process.env[dist.envVar];
      
      // Set distribution ID in environment
      process.env[dist.envVar] = dist.id;
      
      // Fix ORB errors
      await fixOrbErrors();
      
      // Restore original env variable
      process.env[dist.envVar] = originalDistId;
      
      console.log(`✅ Successfully processed ${dist.name} distribution\n`);
    } catch (error) {
      console.error(`❌ Error processing ${dist.name} distribution: ${error.message}\n`);
    }
  }
  
  console.log('\n🎉 Finished processing all distributions!');
}

// Invalidate cache on all distributions
async function invalidateAllCaches() {
  const distributions = getConfiguredDistributions();
  
  // Parse paths
  let paths = ['/*'];
  const pathsIndex = args.indexOf('--paths');
  if (pathsIndex !== -1 && args[pathsIndex + 1]) {
    paths = args[pathsIndex + 1].split(',').map(p => p.trim());
  }
  
  console.log('\n🔄 Invalidating cache on all CloudFront distributions...');
  console.log(`🎯 Paths: ${paths.join(', ')}\n`);
  
  for (const dist of distributions) {
    console.log(`\n🔍 Processing ${dist.name.toUpperCase()} distribution (${dist.id})...`);
    
    try {
      const cacheBuster = new CloudFrontCacheBuster(dist.name);
      await cacheBuster.invalidateCache(paths);
      
      console.log(`✅ Successfully invalidated cache for ${dist.name} distribution\n`);
    } catch (error) {
      console.error(`❌ Error invalidating cache for ${dist.name} distribution: ${error.message}\n`);
    }
  }
  
  console.log('\n🎉 Finished invalidating all distributions!');
}

// Main function
async function main() {
  switch (command) {
    case 'fix-orb':
      await fixAllOrbErrors();
      break;
    case 'invalidate':
      await invalidateAllCaches();
      break;
    case 'help':
    default:
      showHelp();
      break;
  }
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
}