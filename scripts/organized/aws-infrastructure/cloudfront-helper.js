#!/usr/bin/env node

/**
 * CloudFront Distribution Helper
 * 
 * This script provides a unified interface to work with multiple CloudFront distributions.
 * It can list available distributions, show their details, and run operations on them.
 */

const { CloudFrontClient, ListDistributionsCommand, GetDistributionCommand } = require('@aws-sdk/client-cloudfront');
require('dotenv').config();
const awsResources = require('../config/aws-resources');
const chalk = require('chalk') || { green: (t) => t, yellow: (t) => t, blue: (t) => t, red: (t) => t, bold: (t) => t };

// Create CloudFront client
const cloudFrontClient = new CloudFrontClient({
  region: 'us-east-1', // CloudFront is global but API is in us-east-1
  credentials: {
    accessKeyId: process.env.aws_wavelength_dev_access_key_id || process.env.AWS_ACCESS_KEY_ID || process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.aws_wavelength_dev_secret_access_key || process.env.AWS_SECRET_ACCESS_KEY || process.env.SECRET_ACCESS_KEY
  }
});

// Get all configured distributions from aws-resources.js
function getConfiguredDistributions() {
  const distributions = [];
  
  // Add primary distribution
  if (awsResources.cloudFront.primary?.distributionId) {
    distributions.push({
      name: 'primary',
      id: awsResources.cloudFront.primary.distributionId,
      domain: awsResources.cloudFront.primary.distributionDomain,
      envVar: 'CLOUDFRONT_DISTRIBUTION_ID'
    });
  } else if (awsResources.cloudFront.distributionId) {
    distributions.push({
      name: 'primary',
      id: awsResources.cloudFront.distributionId,
      domain: awsResources.cloudFront.distributionDomain,
      envVar: 'CLOUDFRONT_DISTRIBUTION_ID'
    });
  }
  
  // Add gallery distribution
  if (awsResources.cloudFront.gallery?.distributionId) {
    distributions.push({
      name: 'gallery',
      id: awsResources.cloudFront.gallery.distributionId,
      domain: awsResources.cloudFront.gallery.distributionDomain,
      envVar: 'GALLERY_CLOUDFRONT_DISTRIBUTION_ID'
    });
  }
  
  return distributions;
}

// List all distributions configured in the application
async function listDistributions() {
  const distributions = getConfiguredDistributions();
  
  console.log(chalk.bold('\n📋 Configured CloudFront Distributions:'));
  
  if (distributions.length === 0) {
    console.log(chalk.yellow('⚠️ No distributions configured in aws-resources.js'));
    return;
  }
  
  for (const dist of distributions) {
    console.log(chalk.green(`\n🔶 ${dist.name.toUpperCase()} Distribution:`));
    console.log(`   ID: ${chalk.blue(dist.id)}`);
    console.log(`   Domain: ${dist.domain}`);
    console.log(`   Environment Variable: ${dist.envVar}`);
    
    try {
      // Get distribution details from AWS
      const command = new GetDistributionCommand({ Id: dist.id });
      const response = await cloudFrontClient.send(command);
      
      if (response.Distribution) {
        console.log(`   Status: ${chalk.green(response.Distribution.Status)}`);
        console.log(`   Last Modified: ${response.Distribution.LastModifiedTime}`);
        console.log(`   ARN: ${response.Distribution.ARN}`);
      }
    } catch (error) {
      console.log(`   Status: ${chalk.red('Error fetching details')} - ${error.message}`);
    }
  }
  
  console.log(chalk.bold('\n📝 Usage Examples:'));
  console.log('  Fix ORB errors:');
  console.log('    node scripts/fix-orb-errors.js primary');
  console.log('    node scripts/fix-orb-errors.js gallery');
  console.log('\n  Update distribution:');
  console.log('    node scripts/update-cloudfront-distribution.js primary');
  console.log('    node scripts/update-cloudfront-distribution.js gallery');
}

// Display usage information
function showHelp() {
  console.log(chalk.bold('\n☁️  CloudFront Distribution Helper'));
  console.log('\nUsage:');
  console.log('  node cloudfront-helper.js [command] [distribution]');
  console.log('\nCommands:');
  console.log('  list      - List all configured distributions');
  console.log('  details   - Show details for specific distribution');
  console.log('  run       - Run a script on a distribution');
  console.log('\nExamples:');
  console.log('  node cloudfront-helper.js list');
  console.log('  node cloudfront-helper.js details primary');
  console.log('  node cloudfront-helper.js details gallery');
  console.log('  node cloudfront-helper.js run fix-orb-errors primary');
  console.log('  node cloudfront-helper.js run update-cloudfront-distribution gallery');
}

// Get details for a specific distribution
async function getDistributionDetails(name) {
  const distributions = getConfiguredDistributions();
  const dist = distributions.find(d => d.name === name);
  
  if (!dist) {
    console.log(chalk.red(`⚠️ Distribution "${name}" not found in configuration`));
    console.log('Available distributions:');
    distributions.forEach(d => console.log(`- ${d.name}`));
    return;
  }
  
  console.log(chalk.bold(`\n🔍 Details for ${name.toUpperCase()} Distribution:`));
  console.log(`ID: ${chalk.blue(dist.id)}`);
  
  try {
    // Get distribution details from AWS
    const command = new GetDistributionCommand({ Id: dist.id });
    const response = await cloudFrontClient.send(command);
    
    if (response.Distribution) {
      const d = response.Distribution;
      console.log(`Status: ${chalk.green(d.Status)}`);
      console.log(`Domain Name: ${d.DomainName}`);
      console.log(`ARN: ${d.ARN}`);
      console.log(`Last Modified: ${d.LastModifiedTime}`);
      console.log(`Enabled: ${d.DistributionConfig.Enabled}`);
      
      if (d.DistributionConfig.Aliases && d.DistributionConfig.Aliases.Quantity > 0) {
        console.log('Aliases:');
        d.DistributionConfig.Aliases.Items.forEach(alias => console.log(`- ${alias}`));
      }
      
      console.log('\nOrigins:');
      d.DistributionConfig.Origins.Items.forEach(origin => {
        console.log(`- ${origin.Id} (${origin.DomainName})`);
      });
      
      // Check for response headers policy
      if (d.DistributionConfig.DefaultCacheBehavior.ResponseHeadersPolicyId) {
        console.log(`\nResponse Headers Policy: ${d.DistributionConfig.DefaultCacheBehavior.ResponseHeadersPolicyId}`);
      } else {
        console.log('\nNo Response Headers Policy configured');
      }
    }
  } catch (error) {
    console.log(chalk.red(`⚠️ Error fetching distribution details: ${error.message}`));
  }
}

// Run a script on a specific distribution
async function runScript(scriptName, distributionName) {
  const distributions = getConfiguredDistributions();
  const dist = distributions.find(d => d.name === distributionName);
  
  if (!dist) {
    console.log(chalk.red(`⚠️ Distribution "${distributionName}" not found in configuration`));
    console.log('Available distributions:');
    distributions.forEach(d => console.log(`- ${d.name}`));
    return;
  }
  
  console.log(chalk.bold(`\n🚀 Running ${scriptName} on ${distributionName.toUpperCase()} Distribution`));
  
  // Run the script
  try {
    const script = require(`./${scriptName}.js`);
    
    // Set environment variable temporarily for the script
    const originalDistId = process.env[dist.envVar];
    process.env[dist.envVar] = dist.id;
    
    // Run the script
    await script(dist.id);
    
    // Restore original environment variable
    process.env[dist.envVar] = originalDistId;
  } catch (error) {
    console.log(chalk.red(`⚠️ Error running script: ${error.message}`));
  }
}

// Main function
async function main() {
  const command = process.argv[2] || 'help';
  const arg1 = process.argv[3];
  const arg2 = process.argv[4];
  
  switch (command) {
    case 'list':
      await listDistributions();
      break;
    case 'details':
      if (!arg1) {
        console.log(chalk.yellow('⚠️ Please specify a distribution name (primary or gallery)'));
        return;
      }
      await getDistributionDetails(arg1);
      break;
    case 'run':
      if (!arg1 || !arg2) {
        console.log(chalk.yellow('⚠️ Please specify a script and distribution name'));
        console.log('Example: node cloudfront-helper.js run fix-orb-errors primary');
        return;
      }
      await runScript(arg1, arg2);
      break;
    case 'help':
    default:
      showHelp();
      break;
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  getConfiguredDistributions,
  listDistributions,
  getDistributionDetails,
  runScript
};