#!/usr/bin/env node

/**
 * Force App Runner Code Deployment
 * 
 * This script forces App Runner to pull and deploy the latest code from GitHub
 * when automatic deployments aren't working properly.
 */

const envHelper = require('./env-helper');
const { AppRunnerClient, DescribeServiceCommand, UpdateServiceCommand } = require('@aws-sdk/client-apprunner');

class AppRunnerCodeDeployer {
  constructor() {
    this.apprunner = new AppRunnerClient({
      region: 'us-east-1',
      credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID, // Use main AWS credentials like env-updater
        secretAccessKey: process.env.SECRET_ACCESS_KEY
      }
    });
    this.serviceArn = 'arn:aws:apprunner:us-east-1:170023515523:service/wavelength-lore-service/829c542fc95c419090494817f7046eaa';
  }

  async getServiceConfiguration() {
    console.log('🔍 Getting current App Runner service configuration...');
    
    try {
      const command = new DescribeServiceCommand({
        ServiceArn: this.serviceArn
      });
      
      const result = await this.apprunner.send(command);
      return result.Service;
    } catch (error) {
      throw new Error(`Failed to get service configuration: ${error.message}`);
    }
  }

  async forceSourceUpdate() {
    console.log('🚀 Force App Runner Code Deployment');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
      // Get current service configuration
      const service = await this.getServiceConfiguration();
      
      console.log(`📋 Service: ${service.ServiceName}`);
      console.log(`📊 Current Status: ${service.Status}`);
      console.log(`🔗 Source: ${service.SourceConfiguration.CodeRepository?.RepositoryUrl || 'ECR'}`);
      
      if (service.SourceConfiguration.CodeRepository) {
        console.log(`🌿 Branch: ${service.SourceConfiguration.CodeRepository.SourceCodeVersion.Value}`);
      }
      
      // Force deployment by updating the service (this triggers a redeploy)
      console.log('\n🔄 Forcing code redeploy by updating service configuration...');
      
      // If using CodeRepository, we can force it to pull latest
      if (service.SourceConfiguration.CodeRepository) {
        console.log('📡 Triggering GitHub source update...');
      }
      
      const updateCommand = new UpdateServiceCommand({
        ServiceArn: this.serviceArn,
        SourceConfiguration: service.SourceConfiguration
      });
      
      const updateResult = await this.apprunner.send(updateCommand);
      
      console.log('✅ Service update initiated successfully!');
      console.log(`📋 Operation ID: ${updateResult.OperationId}`);
      console.log(`🔄 Service Status: ${updateResult.Service.Status}`);
      
      console.log('\n📝 This should force App Runner to:');
      console.log('   1. Pull latest code from GitHub repository');
      console.log('   2. Rebuild the container with updated code');
      console.log('   3. Deploy the new container to production');
      console.log('   4. Show enhanced logging in production logs');
      
      console.log('\n🔍 Monitor the deployment:');
      console.log('   node apprunner-deploy-monitor.js --reason "Force code update"');
      
      return updateResult;
      
    } catch (error) {
      console.error(`❌ Failed to force code deployment: ${error.message}`);
      throw error;
    }
  }

  async checkSourceConfiguration() {
    console.log('🔍 Analyzing App Runner Source Configuration');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
      const service = await this.getServiceConfiguration();
      const source = service.SourceConfiguration;
      
      console.log(`📋 Service Name: ${service.ServiceName}`);
      console.log(`📊 Service Status: ${service.Status}`);
      console.log(`🔗 Service URL: ${service.ServiceUrl}`);
      console.log(`⏰ Created: ${service.CreatedAt}`);
      console.log(`🔄 Updated: ${service.UpdatedAt}`);
      
      if (source.ImageRepository) {
        console.log('\n📦 Source Type: Container Image (ECR)');
        console.log(`🖼️  Image: ${source.ImageRepository.ImageIdentifier}`);
        console.log(`🔧 Config: ${source.ImageRepository.ImageConfiguration?.Port || 'default'}`);
      }
      
      if (source.CodeRepository) {
        console.log('\n📦 Source Type: Code Repository (GitHub)');
        console.log(`🔗 Repository: ${source.CodeRepository.RepositoryUrl}`);
        console.log(`🌿 Branch/Tag: ${source.CodeRepository.SourceCodeVersion.Value}`);
        console.log(`📝 Type: ${source.CodeRepository.SourceCodeVersion.Type}`);
        
        if (source.CodeRepository.CodeConfiguration) {
          console.log(`⚙️  Runtime: ${source.CodeRepository.CodeConfiguration.ConfigurationSource}`);
          
          if (source.CodeRepository.CodeConfiguration.CodeConfigurationValues) {
            const config = source.CodeRepository.CodeConfiguration.CodeConfigurationValues;
            console.log(`🚀 Runtime: ${config.Runtime}`);
            console.log(`🔨 Build Command: ${config.BuildCommand || 'default'}`);
            console.log(`▶️  Start Command: ${config.StartCommand || 'default'}`);
          }
        }
      }
      
      if (source.AutoDeploymentsEnabled !== undefined) {
        console.log(`🔄 Auto Deployments: ${source.AutoDeploymentsEnabled ? '✅ ENABLED' : '❌ DISABLED'}`);
        
        if (!source.AutoDeploymentsEnabled) {
          console.log('⚠️  Auto deployments are DISABLED - this explains why new code isn\'t deploying!');
          console.log('   GitHub pushes won\'t trigger automatic deployments');
        }
      }
      
      console.log('\n🔧 Diagnosis:');
      if (source.AutoDeploymentsEnabled === false) {
        console.log('❌ Auto deployments are disabled - App Runner won\'t pull new code automatically');
        console.log('✅ Manual deployment needed to update code');
      } else if (source.CodeRepository) {
        console.log('✅ Auto deployments enabled but may need manual trigger');
        console.log('✅ Force deployment will pull latest code');
      } else {
        console.log('ℹ️  Using ECR images - check if latest image was pushed');
      }
      
    } catch (error) {
      console.error(`❌ Failed to analyze source configuration: ${error.message}`);
    }
  }
}

async function main() {
  const deployer = new AppRunnerCodeDeployer();
  const command = process.argv[2];
  
  try {
    switch (command) {
      case 'check':
      case 'analyze':
        await deployer.checkSourceConfiguration();
        break;
        
      case 'deploy':
      case 'force':
      default:
        await deployer.forceSourceUpdate();
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
🚀 App Runner Code Deployment Tool

Usage: node force-code-deploy.js [command]

Commands:
  deploy, force    Force App Runner to pull and deploy latest code (default)
  check, analyze   Analyze current App Runner source configuration
  
Examples:
  node force-code-deploy.js           # Force deploy latest code
  node force-code-deploy.js deploy    # Force deploy latest code  
  node force-code-deploy.js check     # Check source configuration

This tool helps when App Runner isn't automatically deploying new code from GitHub.
`);
    process.exit(0);
  }
  
  main();
}

module.exports = AppRunnerCodeDeployer;