#!/usr/bin/env node

/**
 * 🌊 WAVELENGTH CLI ADMIN - PRISTINE DEPLOYMENT MANAGER
 * ====================================================
 * Clean room implementation of deployment management functionality
 * Completely isolated from external scripts for maximum reliability
 * 
 * Operations: deploy, rollback, monitor, verify, status
 */

const { AppRunnerClient, UpdateServiceCommand, DescribeServiceCommand, 
        ListOperationsCommand, StartDeploymentCommand } = require('@aws-sdk/client-apprunner');
const { ECRClient, DescribeRepositoriesCommand, DescribeImagesCommand, 
        BatchGetImageCommand } = require('@aws-sdk/client-ecr');
const { CloudFrontClient, CreateInvalidationCommand, 
        GetInvalidationCommand } = require('@aws-sdk/client-cloudfront');
const { spawn } = require('child_process');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

class WavelengthDeploymentManager {
  constructor() {
    this.region = process.env.AWS_REGION || 'us-east-1';
    this.deploymentId = `wavelength-${Date.now()}`;
    this.startTime = Date.now();
    this.validateAndInitialize();
  }

  /**
   * 🛡️ Validate credentials and initialize AWS clients
   */
  validateAndInitialize() {
    // Use specific wavelength-dev user credentials
    const requiredVars = ['aws_wavelength_dev_access_key_id', 'aws_wavelength_dev_secret_access_key'];
    const missing = requiredVars.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`❌ Missing wavelength-dev AWS credentials: ${missing.join(', ')}`);
    }

    // Initialize AWS clients with wavelength-dev user credentials
    const clientConfig = { 
      region: this.region,
      credentials: {
        accessKeyId: process.env.aws_wavelength_dev_access_key_id,
        secretAccessKey: process.env.aws_wavelength_dev_secret_access_key
      }
    };
    
    this.apprunner = new AppRunnerClient(clientConfig);
    this.ecr = new ECRClient(clientConfig);
    this.cloudfront = new CloudFrontClient(clientConfig);
    
    this.logInfo(`Using wavelength-dev user: arn:aws:iam::170023515523:user/wavelength-dev`);
  }

  /**
   * 🎨 Logging utilities
   */
  logHeader(message) {
    console.log(chalk.cyan(`\n🚀 ${message}`));
    console.log(chalk.gray('━'.repeat(60)));
  }

  logStep(message) {
    console.log(chalk.blue(`📋 ${message}`));
  }

  logSuccess(message) {
    console.log(chalk.green('✅'), message);
  }

  logError(message) {
    console.log(chalk.red('❌'), message);
  }

  logInfo(message) {
    console.log(chalk.blue('ℹ️ '), message);
  }

  logWarning(message) {
    console.log(chalk.yellow('⚠️ '), message);
  }

  /**
   * ⏱️ Get deployment duration
   */
  getDuration() {
    const duration = Math.round((Date.now() - this.startTime) / 1000);
    return `${duration}s`;
  }

  /**
   * 🐳 Execute shell commands safely
   */
  async execCommand(command, args = [], description = '') {
    return new Promise((resolve, reject) => {
      if (description) {
        this.logStep(description);
      }

      const process = spawn(command, args, {
        stdio: ['inherit', 'pipe', 'pipe'],
        cwd: process.cwd()
      });

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr, code });
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr || stdout}`));
        }
      });

      process.on('error', (error) => {
        reject(new Error(`Command execution failed: ${error.message}`));
      });
    });
  }

  /**
   * 🔍 DEPLOYMENT VERIFICATION
   */
  async verifyPrerequisites() {
    this.logStep('Validating Prerequisites');
    
    // Check Docker
    try {
      await this.execCommand('docker', ['--version'], 'Checking Docker availability');
      this.logSuccess('Docker is available');
    } catch (error) {
      throw new Error('Docker is not available or not running');
    }

    // Check AWS credentials
    try {
      const command = new DescribeServiceCommand({ 
        ServiceArn: process.env.APPRUNNER_SERVICE_ARN 
      });
      await this.apprunner.send(command);
      this.logSuccess('AWS credentials verified');
    } catch (error) {
      throw new Error(`AWS access failed: ${error.message}`);
    }

    // Check repository exists
    try {
      const repoName = process.env.ECR_REPOSITORY_NAME || 'wavelength-lore';
      const command = new DescribeRepositoriesCommand({
        repositoryNames: [repoName]
      });
      await this.ecr.send(command);
      this.logSuccess('ECR repository accessible');
    } catch (error) {
      throw new Error(`ECR repository not accessible: ${error.message}`);
    }
  }

  /**
   * 🐳 DOCKER OPERATIONS
   */
  async buildDockerImage(tag = null) {
    this.logStep('Building Docker Image');
    
    const imageTag = tag || `v${new Date().toISOString().slice(0, 10).replace(/-/g, '.')}-${Date.now()}`;
    const repoUri = process.env.ECR_REPOSITORY_URI;
    
    if (!repoUri) {
      throw new Error('ECR_REPOSITORY_URI not configured in environment');
    }

    const fullImageName = `${repoUri}:${imageTag}`;
    
    try {
      await this.execCommand('docker', [
        'build', 
        '-t', fullImageName,
        '.'
      ], `Building image: ${fullImageName}`);
      
      this.imageTag = imageTag;
      this.fullImageName = fullImageName;
      this.logSuccess(`Docker image built: ${imageTag}`);
      
    } catch (error) {
      throw new Error(`Docker build failed: ${error.message}`);
    }
  }

  async pushToECR() {
    this.logStep('Pushing to ECR');
    
    if (!this.fullImageName) {
      throw new Error('No image built to push');
    }

    try {
      // Login to ECR
      const accountId = process.env.AWS_ACCOUNT_ID || '170023515523';
      await this.execCommand('aws', [
        'ecr', 'get-login-password',
        '--region', this.region
      ], 'Getting ECR login token');

      // Push image
      await this.execCommand('docker', [
        'push', this.fullImageName
      ], `Pushing image: ${this.fullImageName}`);
      
      this.logSuccess(`Image pushed to ECR: ${this.imageTag}`);
      
    } catch (error) {
      throw new Error(`ECR push failed: ${error.message}`);
    }
  }

  /**
   * 🏃 APP RUNNER OPERATIONS
   */
  async deployToAppRunner() {
    this.logStep('Deploying to App Runner');
    
    const serviceArn = process.env.APPRUNNER_SERVICE_ARN;
    if (!serviceArn) {
      throw new Error('APPRUNNER_SERVICE_ARN not configured');
    }

    try {
      const command = new StartDeploymentCommand({
        ServiceArn: serviceArn
      });
      
      const response = await this.apprunner.send(command);
      this.operationId = response.OperationId;
      
      this.logSuccess(`Deployment started: ${this.operationId}`);
      return serviceArn;
      
    } catch (error) {
      throw new Error(`App Runner deployment failed: ${error.message}`);
    }
  }

  async monitorDeployment(serviceArn, maxWaitTime = 600000) { // 10 minutes
    this.logStep('Monitoring Deployment Progress');
    
    const startTime = Date.now();
    let attempts = 0;
    const maxAttempts = maxWaitTime / 10000; // Check every 10 seconds
    
    while (attempts < maxAttempts) {
      try {
        const command = new DescribeServiceCommand({ ServiceArn: serviceArn });
        const response = await this.apprunner.send(command);
        const service = response.Service;
        
        console.log(`📊 Status: ${this.formatStatus(service.Status)} (${attempts + 1}/${Math.floor(maxAttempts)})`);
        
        if (service.Status === 'RUNNING') {
          this.logSuccess(`Service is running after ${Math.round((Date.now() - startTime) / 1000)}s`);
          return;
        }
        
        if (service.Status === 'CREATE_FAILED' || service.Status === 'UPDATE_FAILED') {
          throw new Error(`Deployment failed with status: ${service.Status}`);
        }
        
        // Wait 10 seconds before next check
        await new Promise(resolve => setTimeout(resolve, 10000));
        attempts++;
        
      } catch (error) {
        throw new Error(`Monitoring failed: ${error.message}`);
      }
    }
    
    throw new Error(`Deployment monitoring timed out after ${maxWaitTime / 1000}s`);
  }

  /**
   * ☁️ CLOUDFRONT OPERATIONS
   */
  async invalidateCloudFrontCache() {
    this.logStep('Invalidating CloudFront Cache');
    
    const distributionId = process.env.CLOUDFRONT_DISTRIBUTION_ID;
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
          CallerReference: `wavelength-deploy-${Date.now()}`
        }
      });
      
      const response = await this.cloudfront.send(command);
      this.logSuccess(`Cache invalidation created: ${response.Invalidation.Id}`);
      
    } catch (error) {
      this.logWarning(`Cache invalidation failed: ${error.message}`);
    }
  }

  /**
   * 🔄 ROLLBACK OPERATIONS
   */
  async rollbackDeployment() {
    this.logHeader('Deployment Rollback');
    
    try {
      // Get previous image from ECR
      const previousImage = await this.getPreviousImage();
      
      if (!previousImage) {
        throw new Error('No previous image found for rollback');
      }
      
      this.logInfo(`Rolling back to: ${previousImage}`);
      
      // Update App Runner to use previous image
      const serviceArn = process.env.APPRUNNER_SERVICE_ARN;
      const command = new UpdateServiceCommand({
        ServiceArn: serviceArn,
        SourceConfiguration: {
          ImageRepository: {
            ImageIdentifier: previousImage,
            ImageConfiguration: {
              Port: process.env.NGINX_PORT || '8080'
            }
          }
        }
      });
      
      await this.apprunner.send(command);
      this.logSuccess('Rollback initiated');
      
      // Monitor rollback
      await this.monitorDeployment(serviceArn);
      
      this.logSuccess(`Rollback completed in ${this.getDuration()}`);
      
    } catch (error) {
      this.logError(`Rollback failed: ${error.message}`);
      throw error;
    }
  }

  async getPreviousImage() {
    const repoName = process.env.ECR_REPOSITORY_NAME || 'wavelength-lore';
    
    try {
      const command = new DescribeImagesCommand({
        repositoryName: repoName,
        maxResults: 5
      });
      const response = await this.ecr.send(command);
      
      if (response.imageDetails && response.imageDetails.length > 1) {
        // Get second most recent image (first is current)
        const images = response.imageDetails
          .sort((a, b) => new Date(b.imagePushedAt) - new Date(a.imagePushedAt));
        
        const previousImage = images[1];
        const repoUri = process.env.ECR_REPOSITORY_URI;
        const tag = previousImage.imageTags?.[0] || previousImage.imageDigest;
        
        return `${repoUri}:${tag}`;
      }
      
      return null;
      
    } catch (error) {
      throw new Error(`Failed to get previous image: ${error.message}`);
    }
  }

  /**
   * 📊 MONITORING OPERATIONS
   */
  async monitorPipeline() {
    this.logHeader('Pipeline Monitoring');
    
    try {
      // Get App Runner service status
      await this.getAppRunnerStatus();
      
      // Get recent deployments
      await this.getRecentDeployments();
      
      // Get ECR images
      await this.getECRImages();
      
    } catch (error) {
      this.logError(`Monitoring failed: ${error.message}`);
    }
  }

  async getAppRunnerStatus() {
    const serviceArn = process.env.APPRUNNER_SERVICE_ARN;
    
    try {
      const command = new DescribeServiceCommand({ ServiceArn: serviceArn });
      const response = await this.apprunner.send(command);
      const service = response.Service;
      
      console.log('\n🏃 App Runner Service:');
      console.log(`   Name: ${chalk.bold(service.ServiceName)}`);
      console.log(`   Status: ${this.formatStatus(service.Status)}`);
      console.log(`   URL: ${chalk.blue(service.ServiceUrl || 'Not available')}`);
      console.log(`   Updated: ${new Date(service.UpdatedAt).toLocaleString()}`);
      
    } catch (error) {
      this.logError(`Failed to get App Runner status: ${error.message}`);
    }
  }

  async getRecentDeployments() {
    const serviceArn = process.env.APPRUNNER_SERVICE_ARN;
    
    try {
      const command = new ListOperationsCommand({ 
        ServiceArn: serviceArn,
        MaxResults: 5
      });
      const response = await this.apprunner.send(command);
      
      if (response.OperationSummaryList && response.OperationSummaryList.length > 0) {
        console.log('\n📋 Recent Operations:');
        response.OperationSummaryList.forEach((op, index) => {
          console.log(`   ${index + 1}. ${op.Type} - ${this.formatStatus(op.Status)}`);
          console.log(`      Started: ${new Date(op.StartedAt).toLocaleString()}`);
          if (op.EndedAt) {
            console.log(`      Ended: ${new Date(op.EndedAt).toLocaleString()}`);
          }
        });
      }
      
    } catch (error) {
      this.logWarning(`Could not get recent deployments: ${error.message}`);
    }
  }

  async getECRImages() {
    const repoName = process.env.ECR_REPOSITORY_NAME || 'wavelength-lore';
    
    try {
      const command = new DescribeImagesCommand({
        repositoryName: repoName,
        maxResults: 3
      });
      const response = await this.ecr.send(command);
      
      if (response.imageDetails && response.imageDetails.length > 0) {
        console.log('\n🐳 Recent Images:');
        response.imageDetails
          .sort((a, b) => new Date(b.imagePushedAt) - new Date(a.imagePushedAt))
          .forEach((image, index) => {
            const tag = image.imageTags?.[0] || 'untagged';
            const size = Math.round(image.imageSizeInBytes / 1024 / 1024);
            console.log(`   ${index + 1}. ${tag} (${size} MB)`);
            console.log(`      Pushed: ${new Date(image.imagePushedAt).toLocaleString()}`);
          });
      }
      
    } catch (error) {
      this.logWarning(`Could not get ECR images: ${error.message}`);
    }
  }

  /**
   * ✅ VERIFICATION OPERATIONS
   */
  async verifyDeployment() {
    this.logHeader('Deployment Verification');
    
    try {
      // Check App Runner service health
      await this.verifyAppRunnerHealth();
      
      // Check service URL responsiveness
      await this.verifyServiceURL();
      
      this.logSuccess('Deployment verification completed');
      
    } catch (error) {
      this.logError(`Verification failed: ${error.message}`);
      throw error;
    }
  }

  async verifyAppRunnerHealth() {
    const serviceArn = process.env.APPRUNNER_SERVICE_ARN;
    
    try {
      const command = new DescribeServiceCommand({ ServiceArn: serviceArn });
      const response = await this.apprunner.send(command);
      const service = response.Service;
      
      if (service.Status !== 'RUNNING') {
        throw new Error(`Service not running: ${service.Status}`);
      }
      
      this.logSuccess('App Runner service is healthy');
      return service.ServiceUrl;
      
    } catch (error) {
      throw new Error(`App Runner health check failed: ${error.message}`);
    }
  }

  async verifyServiceURL() {
    const serviceArn = process.env.APPRUNNER_SERVICE_ARN;
    
    try {
      const command = new DescribeServiceCommand({ ServiceArn: serviceArn });
      const response = await this.apprunner.send(command);
      const serviceUrl = response.Service.ServiceUrl;
      
      if (!serviceUrl) {
        this.logWarning('Service URL not available yet');
        return;
      }
      
      // Simple HTTP check using curl
      await this.execCommand('curl', [
        '-f', '-s', '-o', '/dev/null',
        '-w', '%{http_code}',
        `https://${serviceUrl}`
      ], `Testing service URL: ${serviceUrl}`);
      
      this.logSuccess(`Service URL is responsive: ${serviceUrl}`);
      
    } catch (error) {
      this.logWarning(`Service URL test failed: ${error.message}`);
    }
  }

  /**
   * 🎯 Utility methods
   */
  formatStatus(status) {
    const statusColors = {
      'RUNNING': chalk.green(status),
      'CREATE_FAILED': chalk.red(status),
      'UPDATE_FAILED': chalk.red(status),
      'DELETE_FAILED': chalk.red(status),
      'OPERATION_IN_PROGRESS': chalk.yellow(status),
      'PAUSED': chalk.yellow(status),
      'DELETED': chalk.gray(status)
    };
    
    return statusColors[status] || chalk.blue(status);
  }

  /**
   * 📋 MAIN DEPLOYMENT WORKFLOW
   */
  async deploy(options = {}) {
    this.logHeader('Wavelength Application Deployment');
    
    try {
      // Pre-deployment validation
      await this.verifyPrerequisites();
      
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
      
      this.logSuccess(`🎉 Deployment completed successfully in ${this.getDuration()}`);
      return { 
        success: true, 
        deploymentId: this.deploymentId,
        imageTag: this.imageTag,
        duration: this.getDuration()
      };
      
    } catch (error) {
      this.logError(`💥 Deployment failed after ${this.getDuration()}: ${error.message}`);
      throw error;
    }
  }

  /**
   * 📋 Main command handler
   */
  async handleCommand(operation, options = {}) {
    try {
      switch (operation) {
        case 'deploy':
          return await this.deploy(options);
        case 'rollback':
          return await this.rollbackDeployment();
        case 'monitor':
          return await this.monitorPipeline();
        case 'verify':
          return await this.verifyDeployment();
        case 'status':
          return await this.getAppRunnerStatus();
        default:
          this.showHelp();
      }
    } catch (error) {
      this.logError(`Command failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * 📚 Help
   */
  showHelp() {
    console.log(chalk.cyan('\n🚀 WAVELENGTH DEPLOYMENT MANAGER'));
    console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log('\nUsage: npm run cli:admin deploy <operation> [options]\n');
    
    console.log(chalk.bold('Operations:'));
    console.log('  deploy     - Full deployment pipeline (build, push, deploy)');
    console.log('  rollback   - Rollback to previous version');
    console.log('  monitor    - Monitor pipeline status and history');
    console.log('  verify     - Verify current deployment health');
    console.log('  status     - Get App Runner service status');
    console.log('');
    
    console.log(chalk.bold('Deploy Options:'));
    console.log('  --tag <version>        - Specify image tag');
    console.log('  --no-cache-invalidation - Skip CloudFront cache invalidation');
    console.log('');
    
    console.log(chalk.bold('Examples:'));
    console.log('  npm run cli:admin deploy deploy');
    console.log('  npm run cli:admin deploy deploy --tag v1.2.3');
    console.log('  npm run cli:admin deploy rollback');
    console.log('  npm run cli:admin deploy monitor');
    console.log('  npm run cli:admin deploy verify');
    console.log('');
  }
}

// Export for use as module
module.exports = WavelengthDeploymentManager;

// Run if called directly
if (require.main === module) {
  async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0 || args[0] === 'help') {
      const manager = new WavelengthDeploymentManager();
      manager.showHelp();
      return;
    }
    
    const [operation, ...optionArgs] = args;
    const options = {};
    
    // Parse simple options
    for (let i = 0; i < optionArgs.length; i += 2) {
      if (optionArgs[i]?.startsWith('--')) {
        const key = optionArgs[i].substring(2);
        const value = optionArgs[i + 1];
        options[key] = value;
      }
    }
    
    const manager = new WavelengthDeploymentManager();
    await manager.handleCommand(operation, options);
  }

  main().catch(error => {
    console.error(chalk.red('❌ Fatal error:'), error.message);
    process.exit(1);
  });
}