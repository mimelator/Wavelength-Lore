#!/usr/bin/env node

/**
 * AWS App Runner Force Deployment Script
 * 
 * Forces a new deployment of the App Runner service to pick up latest code
 * and environment variables.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { AppRunnerClient, StartDeploymentCommand, DescribeServiceCommand } from '@aws-sdk/client-apprunner';

// ES modules compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file if not in production
if (process.env.NODE_ENV !== 'production') {
  try {
    const { default: dotenv } = await import('dotenv');

    // Check if .env file exists in the project root
    const envPath = path.resolve(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
      const result = dotenv.config({ path: envPath, override: false });
      if (result.error) {
        console.log('⚠️  Error loading .env file:', result.error.message);
      } else {
        console.log('✅ Loaded environment variables from .env file');
      }
    } else {
      console.log('ℹ️  No .env file found - using system environment variables');
    }
  } catch (error) {
    console.log('ℹ️  dotenv not available - using system environment variables');
  }
} else {
  // For production, ensure dotenv is loaded
  await import('dotenv/config');
}

// Load AWS resource configuration
let awsConfig;
try {
  const module = await import('../../config/aws-resources.js');
  awsConfig = module.default;
} catch (error) {
  console.warn('⚠️ AWS config not available:', error.message);
  awsConfig = { appRunner: { serviceArn: process.env.APPRUNNER_SERVICE_ARN } };
}

class AppRunnerDeploymentForcer {
  constructor(serviceArn) {
    this.serviceArn = serviceArn;
    
    // Try multiple credential sources in order of preference (prioritize dev credentials for deployments)
    const accessKeyId = process.env.aws_wavelength_dev_access_key_id || process.env.AWS_ACCESS_KEY_ADMIN || process.env.AWS_ACCESS_KEY_ID || process.env.ACCESS_KEY_ID;
    const secretAccessKey = process.env.aws_wavelength_dev_secret_access_key || process.env.AWS_SECRET_ACCESS_KEY_ADMIN || process.env.AWS_SECRET_ACCESS_KEY || process.env.SECRET_ACCESS_KEY;
    
    if (!accessKeyId || !secretAccessKey) {
      console.log('ℹ️  No explicit credentials found, using default AWS credential chain');
      // Let AWS SDK use default credential chain (IAM roles, profiles, etc.)
      this.appRunnerClient = new AppRunnerClient({
        region: 'us-east-1'
      });
    } else {
      console.log('✅ Using explicit AWS credentials from environment variables');
      this.appRunnerClient = new AppRunnerClient({
        region: 'us-east-1',
        credentials: {
          accessKeyId: accessKeyId,
          secretAccessKey: secretAccessKey
        }
      });
    }
  }

  /**
   * Get current service status
   */
  async getServiceStatus() {
    try {
      const command = new DescribeServiceCommand({
        ServiceArn: this.serviceArn
      });
      
      const response = await this.appRunnerClient.send(command);
      return {
        status: response.Service.Status,
        serviceName: response.Service.ServiceName,
        serviceUrl: response.Service.ServiceUrl,
        sourceConfiguration: response.Service.SourceConfiguration,
        createdAt: response.Service.CreatedAt,
        updatedAt: response.Service.UpdatedAt
      };
    } catch (error) {
      throw new Error(`Failed to get service status: ${error.message}`);
    }
  }

  /**
   * Force a new deployment
   */
  async forceDeployment() {
    try {
      console.log('🚀 Starting forced deployment...');
      
      const command = new StartDeploymentCommand({
        ServiceArn: this.serviceArn
      });
      
      const response = await this.appRunnerClient.send(command);
      return {
        operationId: response.OperationId,
        deploymentId: response.DeploymentId
      };
    } catch (error) {
      throw new Error(`Failed to start deployment: ${error.message}`);
    }
  }

  /**
   * Check if service can be deployed
   */
  canDeploy(status) {
    const deployableStatuses = [
      'RUNNING',
      'CREATE_FAILED',
      'UPDATE_FAILED'
    ];
    
    return deployableStatuses.includes(status);
  }

  /**
   * Main execution method
   */
  async execute(options = {}) {
    try {
      console.log('🚀 AWS App Runner Force Deployment');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📋 Service ARN: ${this.serviceArn}`);
      console.log('');

      // Get current service status
      console.log('🔍 Checking current service status...');
      const serviceInfo = await this.getServiceStatus();
      
      console.log(`📊 Service: ${serviceInfo.serviceName}`);
      console.log(`🌐 URL: ${serviceInfo.serviceUrl}`);
      console.log(`📊 Status: ${serviceInfo.status}`);
      console.log(`⏰ Last Updated: ${serviceInfo.updatedAt}`);
      
      // Check if we can deploy
      if (!this.canDeploy(serviceInfo.status)) {
        console.log('');
        console.log(`⚠️  Cannot deploy - service is in ${serviceInfo.status} state`);
        console.log('   Service must be in RUNNING, CREATE_FAILED, or UPDATE_FAILED state');
        
        if (serviceInfo.status === 'OPERATION_IN_PROGRESS') {
          console.log('   📝 Wait for current operation to complete, then try again');
        }
        
        return false;
      }

      // Confirm deployment unless --force flag is used
      if (!options.force) {
        console.log('');
        console.log('⚠️  This will trigger a new deployment of your App Runner service.');
        console.log('   - Latest code from GitHub will be deployed');
        console.log('   - Environment variables will be refreshed');
        console.log('   - Service will be briefly unavailable during deployment');
        console.log('');
        console.log('   Use --force flag to skip this confirmation.');
        console.log('❌ Deployment cancelled. Use --force flag to proceed.');
        return false;
      }

      // Force deployment
      console.log('');
      console.log('🚀 Forcing new deployment...');
      const deploymentInfo = await this.forceDeployment();
      
      console.log('✅ Deployment started successfully!');
      console.log(`📋 Operation ID: ${deploymentInfo.operationId}`);
      if (deploymentInfo.deploymentId) {
        console.log(`🔄 Deployment ID: ${deploymentInfo.deploymentId}`);
      }
      
      console.log('');
      console.log('📝 What happens next:');
      console.log('   1. 🔄 App Runner pulls latest code from GitHub');
      console.log('   2. 🏗️  New container image is built');
      console.log('   3. 🚀 New deployment is rolled out');
      console.log('   4. 🌐 Service becomes available with latest changes');
      console.log('');
      console.log('⏱️  Typical deployment time: 3-8 minutes');
      console.log('');
      console.log('🔍 Monitor progress:');
      console.log(`   - AWS Console: App Runner > ${serviceInfo.serviceName}`);
      console.log(`   - Service URL: ${serviceInfo.serviceUrl}`);
      console.log('   - Check /diagnostic/health when deployment completes');
      
      return true;
      
    } catch (error) {
      console.error('❌ Error:', error.message);
      throw error;
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const serviceArn = awsConfig.appRunner.serviceArn;
  
  const options = {
    force: args.includes('--force')
  };
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('🚀 AWS App Runner Force Deployment Script');
    console.log('');
    console.log('Usage: node apprunner-force-deploy.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --force     Skip confirmation and start deployment immediately');
    console.log('  --help      Show this help message');
    console.log('');
    console.log('This script will:');
    console.log('  1. Check if the service can be deployed');
    console.log('  2. Force App Runner to pull latest code from GitHub');
    console.log('  3. Build and deploy new container image');
    console.log('  4. Roll out the deployment');
    console.log('');
    console.log('Examples:');
    console.log('  node apprunner-force-deploy.js                # Preview deployment');
    console.log('  node apprunner-force-deploy.js --force        # Force deployment');
    console.log('');
    console.log('Use this when:');
    console.log('  - Environment variables were updated but service needs restart');
    console.log('  - New code was pushed but auto-deploy is disabled');
    console.log('  - You need to pick up latest changes immediately');
    return;
  }
  
  const deploymentForcer = new AppRunnerDeploymentForcer(serviceArn);
  const success = await deploymentForcer.execute(options);
  
  process.exit(success ? 0 : 1);
}

// Run if called directly - ES modules check
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  });
}

export default AppRunnerDeploymentForcer;