#!/usr/bin/env node

/**
 * 🚀 Unified Deployment Manager
 * 
 * Consolidates all deployment operations into a comprehensive, reliable tool.
 * Replaces 10 individual deployment scripts with unified deployment workflows.
 * 
 * Usage: node deployment-manager.js <operation> [options]
 * 
 * Operations: deploy, rollback, monitor, verify, pipeline, optimize
 */

const { program } = require('commander');
const { spawn } = require('child_process');
const { AppRunnerClient, UpdateServiceCommand, DescribeServiceCommand, 
        ListOperationsCommand } = require('@aws-sdk/client-apprunner');
const { ECRClient, DescribeRepositoriesCommand, ListImagesCommand } = require('@aws-sdk/client-ecr');
const { CloudFrontClient, CreateInvalidationCommand } = require('@aws-sdk/client-cloudfront');
const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');

// 🛡️ SECURITY: Input Validator
class InputValidator {
    static validateCommand(command) {
        const allowedCommands = ['docker', 'aws', 'git', 'npm'];
        if (!allowedCommands.includes(command)) {
            throw new Error(`🚫 Unauthorized command: ${command}`);
        }
        return command;
    }
    
    static validateAction(action) {
        const allowedActions = ['build', 'push', 'deploy', 'update', 'list', 'status', 'rollback', 'tag'];
        if (!allowedActions.includes(action)) {
            throw new Error(`🚫 Unauthorized action: ${action}`);
        }
        return action;
    }
    
    static sanitizeParameters(parameters) {
        if (!Array.isArray(parameters)) {
            parameters = parameters.toString().split(' ').filter(p => p.trim());
        }
        
        // Remove shell metacharacters that could enable injection
        return parameters.map(param => {
            const original = param;
            const sanitized = param
                .replace(/[;&|`$(){}]/g, '')
                .replace(/\.\./g, '')  // Prevent directory traversal
                .trim();
            
            if (sanitized !== original) {
                console.warn(chalk.yellow(`⚠️  Parameter sanitized: "${original}" -> "${sanitized}"`));
            }
            return sanitized;
        }).filter(p => p.length > 0);
    }
    
    static validateImageTag(tag) {
        // Docker tag validation
        const tagRegex = /^[a-zA-Z0-9._-]+$/;
        if (!tagRegex.test(tag)) {
            throw new Error(`🚫 Invalid Docker tag format: ${tag}`);
        }
        return tag;
    }
}

// Configuration
require('dotenv').config();
const awsResources = require('../../config/aws-resources');

const CONFIG = {
  AWS_REGION: 'us-east-1',
  ECR_REPOSITORY: 'wavelength-lore',
  DEPLOYMENT_TIMEOUT: 1800000, // 30 minutes
  HEALTH_CHECK_RETRIES: 10,
  HEALTH_CHECK_DELAY: 30000 // 30 seconds
};

/**
 * Base Deployment Manager Class
 */
class BaseDeploymentManager {
  constructor() {
    this.startTime = Date.now();
    this.deploymentId = `deploy-${Date.now()}`;
    this.credentials = {
      accessKeyId: process.env.aws_wavelength_dev_access_key_id || 
                   process.env.AWS_ACCESS_KEY_ID || 
                   process.env.ACCESS_KEY_ID,
      secretAccessKey: process.env.aws_wavelength_dev_secret_access_key || 
                       process.env.AWS_SECRET_ACCESS_KEY || 
                       process.env.SECRET_ACCESS_KEY
    };
    
    this.initializeClients();
  }

  initializeClients() {
    this.apprunner = new AppRunnerClient({
      region: CONFIG.AWS_REGION,
      credentials: this.credentials
    });
    
    this.ecr = new ECRClient({
      region: CONFIG.AWS_REGION,
      credentials: this.credentials
    });
    
    this.cloudfront = new CloudFrontClient({
      region: CONFIG.AWS_REGION,
      credentials: this.credentials
    });
  }

  logInfo(message) {
    console.log(chalk.blue('ℹ️ '), message);
  }

  logSuccess(message) {
    console.log(chalk.green('✅'), message);
  }

  logWarning(message) {
    console.log(chalk.yellow('⚠️ '), message);
  }

  logError(message) {
    console.log(chalk.red('❌'), message);
  }

  logStep(message) {
    console.log(chalk.bold.cyan(`\n🚀 ${message}`));
    console.log(chalk.cyan('━'.repeat(60)));
  }

  logHeader(message) {
    console.log(chalk.bold.magenta(`\n🎯 ${message}`));
    console.log(chalk.magenta('━'.repeat(60)));
    console.log(`   Deployment ID: ${chalk.cyan(this.deploymentId)}`);
    console.log(`   Started: ${chalk.gray(new Date().toLocaleString())}`);
    console.log('');
  }

  async execCommand(commandArray, description) {
    this.logInfo(`🔐 Executing: ${description}`);
    
    try {
      // 🛡️ SECURITY: Validate and sanitize command
      if (!Array.isArray(commandArray)) {
        commandArray = commandArray.split(' ');
      }
      
      const [baseCommand, ...args] = commandArray;
      
      // Validate command
      InputValidator.validateCommand(baseCommand);
      
      // Sanitize arguments
      const sanitizedArgs = InputValidator.sanitizeParameters(args);
      
      this.logInfo(`Command: ${baseCommand} ${sanitizedArgs.join(' ')}`);
      
      // Execute using spawn instead of execSync for security
      return new Promise((resolve, reject) => {
        const child = spawn(baseCommand, sanitizedArgs, {
          stdio: ['pipe', 'pipe', 'pipe'],
          env: { ...process.env, NODE_ENV: 'production' }
        });
        
        let output = '';
        let errorOutput = '';
        
        child.stdout.on('data', (data) => {
          const chunk = data.toString();
          output += chunk;
          if (chunk.trim()) {
            console.log(chalk.gray(chunk.trim()));
          }
        });
        
        child.stderr.on('data', (data) => {
          const chunk = data.toString();
          errorOutput += chunk;
          console.log(chalk.yellow(chunk.trim()));
        });
        
        child.on('close', (code) => {
          if (code === 0) {
            resolve(output);
          } else {
            this.logError(`Command failed with exit code ${code}`);
            reject(new Error(`Command failed: ${errorOutput || 'Unknown error'}`));
          }
        });
        
        child.on('error', (error) => {
          this.logError(`Command execution failed: ${error.message}`);
          reject(error);
        });
      });
      
    } catch (error) {
      this.logError(`🚫 Command validation failed: ${error.message}`);
      throw error;
    }
  }

  getDuration() {
    const duration = Date.now() - this.startTime;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }
}

/**
 * Application Deployment Manager
 */
class ApplicationDeploymentManager extends BaseDeploymentManager {
  
  async deployApplication(options = {}) {
    this.logHeader('Application Deployment');
    
    try {
      // Pre-deployment validation
      await this.validatePrerequisites();
      
      // Build and tag Docker image
      await this.buildDockerImage(options.tag);
      
      // Push to ECR
      await this.pushToECR();
      
      // Update App Runner service
      const serviceArn = await this.deployToAppRunner();
      
      // Monitor deployment
      await this.monitorDeployment(serviceArn);
      
      // Post-deployment verification
      await this.verifyDeployment();
      
      // Cache invalidation
      if (options.invalidateCache !== false) {
        await this.invalidateCloudFrontCache();
      }
      
      this.logSuccess(`Deployment completed in ${this.getDuration()}`);
      return { success: true, deploymentId: this.deploymentId };
      
    } catch (error) {
      this.logError(`Deployment failed: ${error.message}`);
      await this.handleDeploymentFailure(error);
      throw error;
    }
  }
  
  async validatePrerequisites() {
    this.logStep('Validating Prerequisites');
    
    // Check Docker
    try {
      await this.execCommand(['docker', '--version'], 'Checking Docker availability');
      this.logSuccess('Docker is available');
    } catch (error) {
      throw new Error('Docker is not available or not running');
    }
    
    // Check AWS credentials
    if (!this.credentials.accessKeyId || !this.credentials.secretAccessKey) {
      throw new Error('AWS credentials not found. Please configure environment variables.');
    }
    this.logSuccess('AWS credentials configured');
    
    // Check ECR repository
    try {
      const command = await this.ecr.send(new DescribeRepositoriesCommand({
        repositoryNames: [CONFIG.ECR_REPOSITORY]
      }));
      this.logSuccess(`ECR repository '${CONFIG.ECR_REPOSITORY}' exists`);
    } catch (error) {
      throw new Error(`ECR repository '${CONFIG.ECR_REPOSITORY}' not found`);
    }
    
    // Check for required files
    const requiredFiles = ['Dockerfile', 'package.json'];
    for (const file of requiredFiles) {
      try {
        await fs.access(file);
        this.logSuccess(`Required file '${file}' found`);
      } catch (error) {
        throw new Error(`Required file '${file}' not found`);
      }
    }
  }
  
  async buildDockerImage(tag = 'latest') {
    this.logStep('Building Docker Image');
    
    const imageTag = `${CONFIG.ECR_REPOSITORY}:${tag}`;
    const ecrUri = `${process.env.AWS_ACCOUNT_ID}.dkr.ecr.${CONFIG.AWS_REGION}.amazonaws.com/${imageTag}`;
    
    // 🛡️ Validate Docker tag before use
    InputValidator.validateImageTag(tag);
    
    // Build image
    await this.execCommand(
      ['docker', 'build', '-t', imageTag, '.'],
      'Building Docker image'
    );
    
    // Tag for ECR
    await this.execCommand(
      ['docker', 'tag', imageTag, ecrUri],
      'Tagging image for ECR'
    );
    
    this.imageUri = ecrUri;
    this.logSuccess(`Docker image built: ${imageTag}`);
  }
  
  async pushToECR() {
    this.logStep('Pushing to ECR');
    
    // Login to ECR using secure method
    try {
      // Get ECR password securely
      const ecrPassword = await this.execCommand(
        ['aws', 'ecr', 'get-login-password', '--region', CONFIG.AWS_REGION],
        'Getting ECR login password'
      );
      
      // Login to Docker registry
      const dockerLoginProcess = spawn('docker', [
        'login',
        '--username', 'AWS',
        '--password-stdin',
        `${process.env.AWS_ACCOUNT_ID}.dkr.ecr.${CONFIG.AWS_REGION}.amazonaws.com`
      ]);
      
      dockerLoginProcess.stdin.write(ecrPassword.trim());
      dockerLoginProcess.stdin.end();
      
      await new Promise((resolve, reject) => {
        dockerLoginProcess.on('close', (code) => {
          if (code === 0) {
            this.logSuccess('ECR login successful');
            resolve();
          } else {
            reject(new Error(`ECR login failed with exit code ${code}`));
          }
        });
      });
    } catch (error) {
      throw new Error(`ECR login failed: ${error.message}`);
    }
    
    // Push image
    await this.execCommand(
      ['docker', 'push', this.imageUri],
      'Pushing image to ECR'
    );
    
    this.logSuccess(`Image pushed to ECR: ${this.imageUri}`);
  }
  
  async deployToAppRunner() {
    this.logStep('Deploying to App Runner');
    
    const serviceArn = awsResources.apprunner?.serviceArn;
    if (!serviceArn) {
      throw new Error('App Runner service ARN not configured in aws-resources.js');
    }
    
    try {
      // Get current service configuration
      const describeCommand = new DescribeServiceCommand({
        ServiceArn: serviceArn
      });
      
      const currentService = await this.apprunner.send(describeCommand);
      const config = currentService.Service.SourceConfiguration;
      
      // Update with new image URI
      config.ImageRepository.ImageUri = this.imageUri;
      
      // Trigger deployment
      const updateCommand = new UpdateServiceCommand({
        ServiceArn: serviceArn,
        SourceConfiguration: config
      });
      
      const response = await this.apprunner.send(updateCommand);
      
      this.logSuccess(`App Runner deployment initiated: ${response.OperationId}`);
      this.operationId = response.OperationId;
      
      return serviceArn;
      
    } catch (error) {
      throw new Error(`App Runner deployment failed: ${error.message}`);
    }
  }
  
  async monitorDeployment(serviceArn) {
    this.logStep('Monitoring Deployment Progress');
    
    const startTime = Date.now();
    const pollInterval = 30000; // 30 seconds
    
    while (Date.now() - startTime < CONFIG.DEPLOYMENT_TIMEOUT) {
      try {
        const command = new DescribeServiceCommand({
          ServiceArn: serviceArn
        });
        
        const response = await this.apprunner.send(command);
        const status = response.Service.Status;
        
        console.log(`   Status: ${this.getStatusColor(status)} (${new Date().toLocaleTimeString()})`);
        
        if (status === 'RUNNING') {
          this.logSuccess('Deployment completed successfully!');
          this.serviceUrl = response.Service.ServiceUrl;
          return;
        }
        
        if (status.includes('FAILED')) {
          throw new Error(`Deployment failed with status: ${status}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        
      } catch (error) {
        throw new Error(`Deployment monitoring failed: ${error.message}`);
      }
    }
    
    throw new Error('Deployment monitoring timed out');
  }
  
  async verifyDeployment() {
    this.logStep('Verifying Deployment');
    
    if (!this.serviceUrl) {
      throw new Error('Service URL not available for verification');
    }
    
    const axios = require('axios');
    let attempts = 0;
    const maxAttempts = CONFIG.HEALTH_CHECK_RETRIES;
    
    while (attempts < maxAttempts) {
      try {
        attempts++;
        this.logInfo(`Health check attempt ${attempts}/${maxAttempts}`);
        
        const response = await axios.get(this.serviceUrl, {
          timeout: 10000,
          validateStatus: (status) => status < 500
        });
        
        if (response.status === 200) {
          this.logSuccess(`Deployment verification successful (${response.status})`);
          return;
        }
        
        if (attempts < maxAttempts) {
          this.logWarning(`Health check failed (${response.status}), retrying in ${CONFIG.HEALTH_CHECK_DELAY/1000}s...`);
          await new Promise(resolve => setTimeout(resolve, CONFIG.HEALTH_CHECK_DELAY));
        } else {
          throw new Error(`Health check failed after ${maxAttempts} attempts (${response.status})`);
        }
        
      } catch (error) {
        if (attempts >= maxAttempts) {
          throw new Error(`Deployment verification failed: ${error.message}`);
        }
        
        this.logWarning(`Health check error, retrying: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, CONFIG.HEALTH_CHECK_DELAY));
      }
    }
  }
  
  async invalidateCloudFrontCache() {
    this.logStep('Invalidating CloudFront Cache');
    
    const distributionId = awsResources.cloudFront?.primary?.distributionId || 
                          awsResources.cloudFront?.distributionId;
    
    if (!distributionId) {
      this.logWarning('No CloudFront distribution configured, skipping cache invalidation');
      return;
    }
    
    try {
      const command = new CreateInvalidationCommand({
        DistributionId: distributionId,
        InvalidationBatch: {
          Paths: {
            Quantity: 1,
            Items: ['/*']
          },
          CallerReference: `deployment-${this.deploymentId}`
        }
      });
      
      const response = await this.cloudfront.send(command);
      this.logSuccess(`Cache invalidation created: ${response.Invalidation.Id}`);
      
    } catch (error) {
      this.logWarning(`Cache invalidation failed: ${error.message}`);
    }
  }
  
  async handleDeploymentFailure(error) {
    this.logStep('Handling Deployment Failure');
    
    // Log detailed error information
    console.log(chalk.red('\n💥 Deployment Failed'));
    console.log(chalk.red('━'.repeat(40)));
    console.log(chalk.red(`Error: ${error.message}`));
    console.log(chalk.red(`Duration: ${this.getDuration()}`));
    console.log(chalk.red(`Deployment ID: ${this.deploymentId}`));
    
    // Attempt cleanup
    try {
      if (this.imageUri) {
        this.logInfo('Cleaning up Docker images...');
        await this.execCommand(['docker', 'system', 'prune', '-f'], 'Cleaning up Docker system');
      }
    } catch (cleanupError) {
      this.logWarning(`Cleanup failed: ${cleanupError.message}`);
    }
  }
  
  getStatusColor(status) {
    const colors = {
      'RUNNING': chalk.green(status),
      'CREATING': chalk.yellow(status),
      'UPDATING': chalk.yellow(status),
      'DELETING': chalk.red(status),
      'CREATE_FAILED': chalk.red(status),
      'UPDATE_FAILED': chalk.red(status),
      'DELETE_FAILED': chalk.red(status)
    };
    return colors[status] || chalk.gray(status);
  }
}

/**
 * Rollback Manager
 */
class RollbackManager extends BaseDeploymentManager {
  
  async rollbackDeployment(options = {}) {
    this.logHeader('Deployment Rollback');
    
    try {
      // Find previous stable version
      const previousVersion = await this.findPreviousVersion();
      
      // Rollback to previous version
      await this.deployPreviousVersion(previousVersion);
      
      // Verify rollback
      await this.verifyRollback();
      
      this.logSuccess(`Rollback completed in ${this.getDuration()}`);
      return { success: true, rolledBackTo: previousVersion };
      
    } catch (error) {
      this.logError(`Rollback failed: ${error.message}`);
      throw error;
    }
  }
  
  async findPreviousVersion() {
    this.logStep('Finding Previous Stable Version');
    
    try {
      const command = new ListImagesCommand({
        repositoryName: CONFIG.ECR_REPOSITORY,
        maxResults: 10
      });
      
      const response = await this.ecr.send(command);
      const images = response.imageIds || [];
      
      if (images.length < 2) {
        throw new Error('No previous version available for rollback');
      }
      
      // Return the second most recent (assuming first is current failing version)
      const previousImage = images[1];
      this.logSuccess(`Previous version found: ${previousImage.imageTag || 'latest'}`);
      
      return previousImage;
      
    } catch (error) {
      throw new Error(`Failed to find previous version: ${error.message}`);
    }
  }
  
  async deployPreviousVersion(previousVersion) {
    this.logStep('Deploying Previous Version');
    
    const serviceArn = awsResources.apprunner?.serviceArn;
    if (!serviceArn) {
      throw new Error('App Runner service ARN not configured');
    }
    
    try {
      // Build image URI for previous version
      const imageUri = `${process.env.AWS_ACCOUNT_ID}.dkr.ecr.${CONFIG.AWS_REGION}.amazonaws.com/${CONFIG.ECR_REPOSITORY}:${previousVersion.imageTag || 'latest'}`;
      
      // Get current service configuration
      const describeCommand = new DescribeServiceCommand({
        ServiceArn: serviceArn
      });
      
      const currentService = await this.apprunner.send(describeCommand);
      const config = currentService.Service.SourceConfiguration;
      
      // Update with previous image URI
      config.ImageRepository.ImageUri = imageUri;
      
      // Trigger rollback deployment
      const updateCommand = new UpdateServiceCommand({
        ServiceArn: serviceArn,
        SourceConfiguration: config
      });
      
      const response = await this.apprunner.send(updateCommand);
      this.logSuccess(`Rollback deployment initiated: ${response.OperationId}`);
      
      // Monitor rollback
      await this.monitorRollback(serviceArn);
      
    } catch (error) {
      throw new Error(`Rollback deployment failed: ${error.message}`);
    }
  }
  
  async monitorRollback(serviceArn) {
    const appDeployment = new ApplicationDeploymentManager();
    await appDeployment.monitorDeployment(serviceArn);
  }
  
  async verifyRollback() {
    const appDeployment = new ApplicationDeploymentManager();
    await appDeployment.verifyDeployment();
  }
}

/**
 * Pipeline Monitor
 */
class PipelineMonitor extends BaseDeploymentManager {
  
  async monitorPipeline(options = {}) {
    this.logHeader('Pipeline Monitoring');
    
    const serviceArn = awsResources.apprunner?.serviceArn;
    if (!serviceArn) {
      throw new Error('App Runner service ARN not configured');
    }
    
    try {
      // Get recent operations
      await this.listRecentOperations(serviceArn);
      
      // Monitor current status
      await this.getCurrentStatus(serviceArn);
      
      // Show deployment history
      if (options.history) {
        await this.showDeploymentHistory();
      }
      
    } catch (error) {
      this.logError(`Pipeline monitoring failed: ${error.message}`);
    }
  }
  
  async listRecentOperations(serviceArn) {
    this.logStep('Recent Operations');
    
    try {
      const command = new ListOperationsCommand({
        ServiceArn: serviceArn,
        MaxResults: 10
      });
      
      const response = await this.apprunner.send(command);
      const operations = response.OperationSummaryList || [];
      
      if (operations.length === 0) {
        this.logInfo('No recent operations found');
        return;
      }
      
      console.log('\nRecent Operations:');
      operations.forEach((op, index) => {
        console.log(`${index + 1}. ${chalk.bold(op.Type)}`);
        console.log(`   ID: ${op.Id}`);
        console.log(`   Status: ${this.getStatusColor(op.Status)}`);
        console.log(`   Started: ${op.StartedAt?.toLocaleString()}`);
        if (op.EndedAt) {
          console.log(`   Ended: ${op.EndedAt.toLocaleString()}`);
        }
        console.log('');
      });
      
    } catch (error) {
      this.logWarning(`Failed to list operations: ${error.message}`);
    }
  }
  
  async getCurrentStatus(serviceArn) {
    this.logStep('Current Service Status');
    
    try {
      const command = new DescribeServiceCommand({
        ServiceArn: serviceArn
      });
      
      const response = await this.apprunner.send(command);
      const service = response.Service;
      
      console.log(`Service: ${chalk.bold(service.ServiceName)}`);
      console.log(`Status: ${this.getStatusColor(service.Status)}`);
      console.log(`URL: ${chalk.blue(service.ServiceUrl)}`);
      console.log(`Created: ${service.CreatedAt?.toLocaleString()}`);
      console.log(`Updated: ${service.UpdatedAt?.toLocaleString()}`);
      
    } catch (error) {
      this.logError(`Failed to get service status: ${error.message}`);
    }
  }
  
  async showDeploymentHistory() {
    this.logStep('Deployment History');
    
    try {
      const command = new ListImagesCommand({
        repositoryName: CONFIG.ECR_REPOSITORY,
        maxResults: 20
      });
      
      const response = await this.ecr.send(command);
      const images = response.imageIds || [];
      
      if (images.length === 0) {
        this.logInfo('No deployment history found');
        return;
      }
      
      console.log('\nDeployment History (ECR Images):');
      images.forEach((image, index) => {
        console.log(`${index + 1}. Tag: ${chalk.bold(image.imageTag || 'latest')}`);
        console.log(`   Digest: ${image.imageDigest?.substring(0, 20)}...`);
      });
      
    } catch (error) {
      this.logWarning(`Failed to show deployment history: ${error.message}`);
    }
  }
}

/**
 * Main Unified Deployment Manager
 */
class UnifiedDeploymentManager {
  constructor() {
    this.appDeployment = new ApplicationDeploymentManager();
    this.rollbackManager = new RollbackManager();
    this.pipelineMonitor = new PipelineMonitor();
  }

  async handleOperation(operation, options) {
    switch (operation) {
      case 'deploy':
        return await this.appDeployment.deployApplication(options);
      case 'rollback':
        return await this.rollbackManager.rollbackDeployment(options);
      case 'monitor':
        return await this.pipelineMonitor.monitorPipeline(options);
      case 'verify':
        return await this.verifyCurrentDeployment();
      default:
        console.error(`Unknown operation: ${operation}`);
        return null;
    }
  }

  async verifyCurrentDeployment() {
    const appDeployment = new ApplicationDeploymentManager();
    appDeployment.serviceUrl = awsResources.apprunner?.serviceUrl;
    await appDeployment.verifyDeployment();
  }
}

// CLI Setup
program
  .name('deployment-manager')
  .description('🚀 Unified Deployment Manager')
  .version('1.0.0');

program
  .command('deploy')
  .description('Deploy application to production')
  .option('--tag <tag>', 'Docker image tag', 'latest')
  .option('--no-cache-invalidation', 'Skip CloudFront cache invalidation')
  .action(async (options) => {
    const manager = new UnifiedDeploymentManager();
    await manager.handleOperation('deploy', options);
  });

program
  .command('rollback')
  .description('Rollback to previous deployment')
  .action(async (options) => {
    const manager = new UnifiedDeploymentManager();
    await manager.handleOperation('rollback', options);
  });

program
  .command('monitor')
  .description('Monitor deployment pipeline')
  .option('--history', 'Show deployment history')
  .action(async (options) => {
    const manager = new UnifiedDeploymentManager();
    await manager.handleOperation('monitor', options);
  });

program
  .command('verify')
  .description('Verify current deployment health')
  .action(async (options) => {
    const manager = new UnifiedDeploymentManager();
    await manager.handleOperation('verify', options);
  });

// Help command
program
  .command('help')
  .description('Show detailed usage examples')
  .action(() => {
    console.log(chalk.bold.cyan('\n🚀 Deployment Manager - Usage Examples\n'));
    
    console.log(chalk.bold('Deployment:'));
    console.log('  deployment-manager.js deploy');
    console.log('  deployment-manager.js deploy --tag v1.2.3');
    console.log('  deployment-manager.js deploy --no-cache-invalidation');
    console.log('');
    
    console.log(chalk.bold('Rollback:'));
    console.log('  deployment-manager.js rollback');
    console.log('');
    
    console.log(chalk.bold('Monitoring:'));
    console.log('  deployment-manager.js monitor');
    console.log('  deployment-manager.js monitor --history');
    console.log('');
    
    console.log(chalk.bold('Verification:'));
    console.log('  deployment-manager.js verify');
    console.log('');
  });

// Parse arguments
if (process.argv.length <= 2) {
  program.help();
} else {
  program.parse();
}

module.exports = { UnifiedDeploymentManager, ApplicationDeploymentManager, RollbackManager, PipelineMonitor };