#!/usr/bin/env node

/**
 * Update App Runner to use specific ECR image tag
 * Forces App Runner to pull a fresh image by changing from 'latest' to specific commit tag
 */

const envHelper = require('./env-helper');
const { AppRunnerClient, DescribeServiceCommand, UpdateServiceCommand } = require('@aws-sdk/client-apprunner');

// Load AWS resource configuration
const awsConfig = require('../config/aws-resources');

class ECRTagUpdater {
  constructor() {
    this.apprunner = new AppRunnerClient({
      region: awsConfig.aws.region,
      credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID,
        secretAccessKey: process.env.SECRET_ACCESS_KEY
      }
    });
    this.serviceArn = awsConfig.appRunner.serviceArn;
  }

  async getCurrentService() {
    const command = new DescribeServiceCommand({
      ServiceArn: this.serviceArn
    });
    
    const result = await this.apprunner.send(command);
    return result.Service;
  }

  async updateImageTag(newTag) {
    console.log('🚀 App Runner ECR Image Tag Updater');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
      // Get current service configuration
      console.log('🔍 Getting current service configuration...');
      const service = await this.getCurrentService();
      
      const currentImage = service.SourceConfiguration.ImageRepository.ImageIdentifier;
      console.log(`📋 Current Image: ${currentImage}`);
      
      // Extract repository URL without tag
      const [repository, currentTag] = currentImage.split(':');
      const newImage = `${repository}:${newTag}`;
      
      console.log(`🔄 Updating from tag: ${currentTag} → ${newTag}`);
      console.log(`🖼️  New Image: ${newImage}`);
      
      if (currentTag === newTag) {
        console.log('⚠️  Service is already using the requested tag!');
        console.log('   This might explain why redeployments aren\'t working.');
        console.log('   App Runner may be caching the image with this tag.');
        return;
      }
      
      // Update the service with new image tag
      const updateCommand = new UpdateServiceCommand({
        ServiceArn: this.serviceArn,
        SourceConfiguration: {
          ImageRepository: {
            ImageIdentifier: newImage,
            ImageRepositoryType: service.SourceConfiguration.ImageRepository.ImageRepositoryType,
            ImageConfiguration: service.SourceConfiguration.ImageRepository.ImageConfiguration
          },
          AutoDeploymentsEnabled: service.SourceConfiguration.AutoDeploymentsEnabled
        }
      });
      
      console.log('\n🔄 Updating App Runner service...');
      const updateResult = await this.apprunner.send(updateCommand);
      
      console.log('✅ Service update initiated successfully!');
      console.log(`📋 Operation ID: ${updateResult.OperationId}`);
      console.log(`🔄 Service Status: ${updateResult.Service.Status}`);
      
      console.log('\n📝 This should force App Runner to:');
      console.log('   1. Pull the fresh ECR image with the specified tag');
      console.log('   2. Deploy the enhanced logging code');
      console.log('   3. Show proper port configuration (NODE_PORT=3001)');
      console.log('   4. Display enhanced debugging output in logs');
      
      console.log('\n🔍 Monitor the deployment:');
      console.log('   node apprunner-deploy-monitor.js --reason "Force specific ECR tag"');
      
    } catch (error) {
      console.error(`❌ Failed to update image tag: ${error.message}`);
      
      if (error.message.includes('PassRole')) {
        console.log('\n💡 Alternative approach:');
        console.log('   Update the image tag manually in AWS Console:');
        console.log('   1. Go to AWS App Runner console');
        console.log('   2. Select wavelength-lore-service');
        console.log('   3. Click "Deploy" → "Configure"');
        console.log(`   4. Update image to: ${awsConfig.ecr.repositoryUri}:${newTag}`);
        console.log('   5. Deploy the updated configuration');
      }
      
      throw error;
    }
  }

  async showAvailableTags() {
    console.log('🏷️  Available ECR Image Tags');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Based on recent GitHub Actions:');
    console.log('   📌 latest      - Always points to most recent build');
    console.log('   📌 3e2582f9    - Specific commit with enhanced logging');
    console.log('   📌 6dc9634     - Previous commit');
    console.log('\n💡 Recommendation: Use commit-specific tag to force fresh pull');
  }
}

async function main() {
  const updater = new AppRunnerImageUpdater();
  const command = process.argv[2];
  const tag = process.argv[3];
  
  try {
    switch (command) {
      case 'tags':
      case 'list':
        await updater.showAvailableTags();
        break;
        
      case 'update':
        if (!tag) {
          console.log('❌ Please specify a tag to update to');
          console.log('Usage: node update-ecr-tag.js update <tag>');
          console.log('Example: node update-ecr-tag.js update 3e2582f9');
          process.exit(1);
        }
        await updater.updateImageTag(tag);
        break;
        
      case 'status':
      default:
        const service = await updater.getCurrentService();
        console.log('📊 Current App Runner ECR Configuration');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`🖼️  Current Image: ${service.SourceConfiguration.ImageRepository.ImageIdentifier}`);
        console.log(`📊 Service Status: ${service.Status}`);
        console.log(`🔄 Auto Deploy: ${service.SourceConfiguration.AutoDeploymentsEnabled ? 'Enabled' : 'Disabled'}`);
        
        const [, currentTag] = service.SourceConfiguration.ImageRepository.ImageIdentifier.split(':');
        console.log(`\n🏷️  Current Tag: ${currentTag}`);
        
        if (currentTag === 'latest') {
          console.log('⚠️  Using "latest" tag - may be cached!');
          console.log('💡 Try switching to specific commit tag: 3e2582f9');
        }
        break;
    }
  } catch (error) {
    console.error(`❌ Operation failed: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`
🏷️  App Runner ECR Image Tag Updater

Usage: node update-ecr-tag.js [command] [tag]

Commands:
  status          Show current ECR image configuration (default)
  update <tag>    Update App Runner to use specific ECR image tag
  tags, list      Show available ECR image tags
  
Examples:
  node update-ecr-tag.js                    # Show current status
  node update-ecr-tag.js update 3e2582f9    # Force use of commit-specific tag
  node update-ecr-tag.js update latest      # Switch back to latest
  node update-ecr-tag.js tags               # Show available tags

This tool helps force App Runner to pull fresh ECR images when 'latest' tag caching causes deployment issues.
`);
    process.exit(0);
  }
  
  main();
}

module.exports = AppRunnerImageUpdater;