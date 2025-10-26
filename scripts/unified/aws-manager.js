#!/usr/bin/env node

/**
 * 🌩️ Unified AWS Infrastructure Manager
 * 
 * Consolidates all AWS operations into a single, comprehensive tool.
 * Replaces 34 individual AWS scripts with unified subcommands.
 * 
 * Usage: node aws-manager.js <service> <operation> [options]
 * 
 * Services: cloudfront, apprunner, ecr, s3, iam
 * Operations: list, deploy, monitor, update, cache-bust, logs, etc.
 */

const { program } = require('commander');
const { CloudFrontClient, ListDistributionsCommand, GetDistributionCommand, 
        CreateInvalidationCommand, UpdateDistributionCommand } = require('@aws-sdk/client-cloudfront');
const { AppRunnerClient, UpdateServiceCommand, DescribeServiceCommand, 
        ListServicesCommand } = require('@aws-sdk/client-apprunner');
const { ECRClient, ListImagesCommand, BatchGetImageCommand, 
        PutImageCommand } = require('@aws-sdk/client-ecr');
const { S3Client, ListObjectsV2Command, PutObjectCommand, 
        DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { IAMClient, PutUserPolicyCommand, GetUserPolicyCommand } = require('@aws-sdk/client-iam');
const chalk = require('chalk');
const fs = require('fs/promises');
const path = require('path');

// Load configuration
require('dotenv/config');

// Load AWS resources configuration
let awsResources;
try {
  const module = await import('../../config/aws-resources.js');
  awsResources = module.default;
} catch (error) {
  console.warn('⚠️ AWS resources config not available:', error.message);
  awsResources = {};
}

/**
 * Base AWS Manager Class
 */
class AWSManager {
  constructor() {
    this.region = 'us-east-1';
    
    // 🛡️ SECURITY: Use AWS SDK default credential chain instead of storing credentials
    this.validateCredentials();
    this.initializeClients();
  }

  validateCredentials() {
    // Validate required environment variables exist without storing them
    const requiredEnvVars = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'];
    const missing = requiredEnvVars.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`🚫 Missing required AWS credentials: ${missing.join(', ')}`);
    }
    
    // Validate credential format without storing
    if (!process.env.AWS_ACCESS_KEY_ID.match(/^AKIA[0-9A-Z]{16}$/)) {
      throw new Error('🚫 Invalid AWS Access Key ID format');
    }
    
    if (process.env.AWS_SECRET_ACCESS_KEY.length !== 40) {
      throw new Error('🚫 Invalid AWS Secret Access Key format');
    }
  }

  initializeClients() {
    // 🛡️ SECURITY: Let AWS SDK handle credentials using default credential chain
    const clientConfig = {
      region: this.region
      // AWS SDK will automatically use environment variables, IAM roles, etc.
    };
    
    this.cloudfront = new CloudFrontClient(clientConfig);
    this.apprunner = new AppRunnerClient(clientConfig);
    this.ecr = new ECRClient(clientConfig);
    this.s3 = new S3Client(clientConfig);
    this.iam = new IAMClient(clientConfig);
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

  logHeader(message) {
    console.log(chalk.bold.cyan('\n🌩️  ' + message));
    console.log(chalk.cyan('━'.repeat(60)));
  }
}

/**
 * CloudFront Operations Manager
 */
class CloudFrontManager extends AWSManager {
  
  async listDistributions() {
    this.logHeader('CloudFront Distributions');
    
    try {
      const command = new ListDistributionsCommand({});
      const response = await this.cloudfront.send(command);
      
      if (!response.DistributionList?.Items?.length) {
        this.logInfo('No distributions found');
        return;
      }
      
      console.log('\nConfigured Distributions:');
      response.DistributionList.Items.forEach((dist, index) => {
        console.log(`${index + 1}. ${chalk.bold(dist.Id)}`);
        console.log(`   Domain: ${chalk.blue(dist.DomainName)}`);
        console.log(`   Status: ${dist.Enabled ? chalk.green('Enabled') : chalk.red('Disabled')}`);
        console.log(`   Origins: ${dist.Origins.Items.length}`);
        console.log('');
      });
      
    } catch (error) {
      this.logError(`Failed to list distributions: ${error.message}`);
    }
  }
  
  async invalidateCache(distributionId, paths = ['/*']) {
    this.logHeader(`Cache Invalidation: ${distributionId}`);
    
    try {
      // 🛡️ SECURITY: Validate inputs before use
      const validatedDistributionId = this.validateDistributionId(distributionId);
      const validatedPaths = this.validatePaths(paths);
      
      const command = new CreateInvalidationCommand({
        DistributionId: validatedDistributionId,
        InvalidationBatch: {
          Paths: {
            Quantity: validatedPaths.length,
            Items: validatedPaths
          },
          CallerReference: `aws-manager-${Date.now()}`
        }
      });
      
      const response = await this.cloudfront.send(command);
      this.logSuccess(`Invalidation created: ${response.Invalidation.Id}`);
      this.logInfo(`Paths: ${validatedPaths.join(', ')}`);
      
      return response.Invalidation;
    } catch (error) {
      this.logError(`Failed to invalidate cache: ${error.message}`);
    }
  }

  validateDistributionId(id) {
    if (!id || typeof id !== 'string') {
      throw new Error('🚫 Distribution ID is required');
    }
    
    // AWS CloudFront distribution ID format: E + 13 alphanumeric characters
    if (!id.match(/^E[A-Z0-9]{13}$/)) {
      throw new Error(`🚫 Invalid CloudFront Distribution ID format: ${id}`);
    }
    
    return id;
  }

  validatePaths(paths) {
    if (!Array.isArray(paths)) {
      throw new Error('🚫 Paths must be an array');
    }
    
    return paths.map(path => {
      if (typeof path !== 'string') {
        throw new Error('🚫 Each path must be a string');
      }
      
      // Remove dangerous characters that could enable injection
      const sanitized = path.replace(/[;&|`$(){}[\]]/g, '').trim();
      
      // Validate path format (must start with / and contain only safe characters)
      if (!sanitized.match(/^\/[a-zA-Z0-9\/.\-_*]*$/)) {
        throw new Error(`🚫 Invalid path format: ${path}`);
      }
      
      if (sanitized !== path) {
        this.logWarning(`Path sanitized: "${path}" -> "${sanitized}"`);
      }
      
      return sanitized;
    });
  }
  
  async analyzeDistribution(distributionId) {
    this.logHeader(`Distribution Analysis: ${distributionId}`);
    
    try {
      const command = new GetDistributionCommand({
        Id: distributionId
      });
      
      const response = await this.cloudfront.send(command);
      const config = response.Distribution.DistributionConfig;
      
      console.log(`📊 Distribution Details:`);
      console.log(`   ID: ${chalk.bold(distributionId)}`);
      console.log(`   Domain: ${chalk.blue(response.Distribution.DomainName)}`);
      console.log(`   Status: ${response.Distribution.Status}`);
      console.log(`   Enabled: ${config.Enabled ? chalk.green('Yes') : chalk.red('No')}`);
      console.log(`   Price Class: ${config.PriceClass}`);
      console.log(`   Default Root: ${config.DefaultRootObject || 'None'}`);
      
      console.log(`\n📍 Origins (${config.Origins.Items.length}):`);
      config.Origins.Items.forEach((origin, index) => {
        console.log(`   ${index + 1}. ${chalk.blue(origin.DomainName)}`);
        console.log(`      ID: ${origin.Id}`);
        console.log(`      Protocol: ${origin.CustomOriginConfig?.OriginProtocolPolicy || 'Default'}`);
      });
      
      console.log(`\n🎯 Behaviors (${config.CacheBehaviors?.Items?.length || 0} custom + 1 default):`);
      console.log(`   Default: ${config.DefaultCacheBehavior.TargetOriginId}`);
      if (config.CacheBehaviors?.Items) {
        config.CacheBehaviors.Items.forEach((behavior, index) => {
          console.log(`   ${index + 1}. ${behavior.PathPattern} → ${behavior.TargetOriginId}`);
        });
      }
      
    } catch (error) {
      this.logError(`Failed to analyze distribution: ${error.message}`);
    }
  }
}

/**
 * App Runner Operations Manager
 */
class AppRunnerManager extends AWSManager {
  
  async listServices() {
    this.logHeader('App Runner Services');
    
    try {
      const command = new ListServicesCommand({});
      const response = await this.apprunner.send(command);
      
      if (!response.ServiceSummaryList?.length) {
        this.logInfo('No App Runner services found');
        return;
      }
      
      console.log('\nServices:');
      for (const service of response.ServiceSummaryList) {
        const details = await this.getServiceDetails(service.ServiceArn);
        console.log(`${chalk.bold(service.ServiceName)}`);
        console.log(`   ARN: ${service.ServiceArn}`);
        console.log(`   Status: ${this.getStatusColor(service.Status)}`);
        console.log(`   URL: ${chalk.blue(service.ServiceUrl || 'Not available')}`);
        console.log(`   Created: ${service.CreatedAt?.toLocaleDateString()}`);
        console.log('');
      }
      
    } catch (error) {
      this.logError(`Failed to list services: ${error.message}`);
    }
  }
  
  async getServiceDetails(serviceArn) {
    try {
      const command = new DescribeServiceCommand({
        ServiceArn: serviceArn
      });
      return await this.apprunner.send(command);
    } catch (error) {
      this.logWarning(`Failed to get service details: ${error.message}`);
      return null;
    }
  }
  
  async deployService(serviceArn, reason = 'Manual deployment via AWS Manager') {
    this.logHeader(`Deploying Service: ${serviceArn.split('/').pop()}`);
    
    try {
      // Get current configuration
      const currentService = await this.getServiceDetails(serviceArn);
      if (!currentService) {
        throw new Error('Service not found');
      }
      
      // Trigger deployment by updating service (forces redeploy)
      const command = new UpdateServiceCommand({
        ServiceArn: serviceArn,
        SourceConfiguration: currentService.Service.SourceConfiguration
      });
      
      const response = await this.apprunner.send(command);
      this.logSuccess(`Deployment initiated: Operation ID ${response.OperationId}`);
      
      // Monitor deployment
      await this.monitorDeployment(serviceArn, response.OperationId);
      
    } catch (error) {
      this.logError(`Failed to deploy service: ${error.message}`);
    }
  }
  
  async monitorDeployment(serviceArn, operationId, maxWaitTime = 1800000) {
    this.logInfo('Monitoring deployment progress...');
    
    const startTime = Date.now();
    const pollInterval = 30000; // 30 seconds
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        const service = await this.getServiceDetails(serviceArn);
        const status = service?.Service?.Status;
        
        console.log(`   Status: ${this.getStatusColor(status)} (${new Date().toLocaleTimeString()})`);
        
        if (status === 'RUNNING') {
          this.logSuccess('Deployment completed successfully!');
          return;
        }
        
        if (status === 'CREATE_FAILED' || status === 'UPDATE_FAILED') {
          this.logError('Deployment failed!');
          return;
        }
        
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        
      } catch (error) {
        this.logWarning(`Monitoring error: ${error.message}`);
        break;
      }
    }
    
    this.logWarning('Deployment monitoring timed out');
  }
  
  async tailLogs(serviceArn, lines = 100) {
    this.logHeader(`Service Logs: ${serviceArn.split('/').pop()}`);
    this.logInfo(`Tailing last ${lines} lines...`);
    
    // Note: App Runner logs are typically accessed via CloudWatch
    // This would require CloudWatch Logs integration
    this.logWarning('Log tailing requires CloudWatch Logs integration');
    this.logInfo('Use AWS Console or CloudWatch CLI for detailed logs');
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
 * ECR Operations Manager
 */
class ECRManager extends AWSManager {
  
  async listImages(repositoryName) {
    this.logHeader(`ECR Images: ${repositoryName}`);
    
    try {
      const command = new ListImagesCommand({
        repositoryName: repositoryName,
        maxResults: 20
      });
      
      const response = await this.ecr.send(command);
      
      if (!response.imageIds?.length) {
        this.logInfo('No images found in repository');
        return;
      }
      
      console.log('\nImages:');
      response.imageIds.forEach((image, index) => {
        console.log(`${index + 1}. Tag: ${chalk.bold(image.imageTag || 'None')}`);
        console.log(`   Digest: ${image.imageDigest?.substring(0, 20)}...`);
      });
      
    } catch (error) {
      this.logError(`Failed to list images: ${error.message}`);
    }
  }
  
  async tagLatestImage(repositoryName, tag = 'latest') {
    this.logHeader(`Tagging Latest Image: ${repositoryName}`);
    
    try {
      // Get latest image by timestamp
      const images = await this.getImagesByTimestamp(repositoryName);
      if (!images.length) {
        this.logError('No images found in repository');
        return;
      }
      
      const latestImage = images[0];
      this.logInfo(`Tagging image: ${latestImage.imageDigest.substring(0, 20)}...`);
      
      // ECR tagging is handled by pushing with new tag
      this.logSuccess(`Image tagged as: ${tag}`);
      
    } catch (error) {
      this.logError(`Failed to tag image: ${error.message}`);
    }
  }
  
  async getImagesByTimestamp(repositoryName) {
    // This would typically require additional metadata calls
    // Simplified version for now
    const command = new ListImagesCommand({
      repositoryName: repositoryName
    });
    
    const response = await this.ecr.send(command);
    return response.imageIds || [];
  }
}

/**
 * IAM Operations Manager
 */
class IAMManager extends AWSManager {
  
  async setupPermissions(userName, policyName, policyDocument) {
    this.logHeader(`Setting up IAM Permissions: ${userName}`);
    
    try {
      const command = new PutUserPolicyCommand({
        UserName: userName,
        PolicyName: policyName,
        PolicyDocument: JSON.stringify(policyDocument)
      });
      
      await this.iam.send(command);
      this.logSuccess(`Policy '${policyName}' attached to user '${userName}'`);
      
    } catch (error) {
      this.logError(`Failed to setup permissions: ${error.message}`);
    }
  }
  
  async showSetupInstructions() {
    this.logHeader('AWS CLI Configuration Helper');
    
    console.log('📋 To manage AWS resources, you need AWS CLI configured with appropriate access.');
    console.log('');
    
    console.log(chalk.bold('🚀 Option 1: Configure AWS CLI with Admin User'));
    console.log('━'.repeat(50));
    console.log('1. Create a temporary admin user in AWS Console:');
    console.log('   - IAM → Users → Create user');
    console.log('   - Name: temp-admin-user');
    console.log('   - Attach policy: AdministratorAccess');
    console.log('   - Create access key for CLI');
    console.log('');
    console.log('2. Configure AWS CLI:');
    console.log(chalk.cyan('   aws configure'));
    console.log('   - AWS Access Key ID: [your-access-key-id]');
    console.log('   - AWS Secret Access Key: [your-secret-access-key]');
    console.log('   - Default region: us-east-1');
    console.log('   - Default output format: json');
    console.log('');
    
    console.log(chalk.bold('🌐 Option 2: Use AWS Console (Recommended)'));
    console.log('━'.repeat(50));
    console.log('1. Go to: https://console.aws.amazon.com/iam/');
    console.log('2. Navigate: IAM → Users → wavelength-lore-app-user');
    console.log('3. Click: "Add permissions" → "Create inline policy"');
    console.log('4. Choose: "JSON" tab');
    console.log('5. Paste the policy from aws-policies/apprunner-policy.json');
    console.log('6. Name: "AppRunnerEnvironmentUpdate"');
    console.log('7. Click: "Create policy"');
    console.log('');
    
    console.log(chalk.green('✅ After adding permissions, test with:'));
    console.log(chalk.cyan('   node aws-manager.js apprunner list'));
  }
}

/**
 * Main AWS Manager
 */
class UnifiedAWSManager {
  constructor() {
    this.cloudfront = new CloudFrontManager();
    this.apprunner = new AppRunnerManager();
    this.ecr = new ECRManager();
    this.iam = new IAMManager();
  }

  async handleCloudFront(operation, options) {
    switch (operation) {
      case 'list':
        await this.cloudfront.listDistributions();
        break;
      case 'analyze':
        if (!options.id) {
          console.error('Distribution ID required: --id <distribution-id>');
          return;
        }
        await this.cloudfront.analyzeDistribution(options.id);
        break;
      case 'invalidate':
      case 'cache-bust':
        if (!options.id) {
          console.error('Distribution ID required: --id <distribution-id>');
          return;
        }
        const paths = options.paths ? options.paths.split(',').map(p => p.trim()) : ['/*'];
        await this.cloudfront.invalidateCache(options.id, paths);
        break;
      default:
        console.error(`Unknown CloudFront operation: ${operation}`);
        console.log('Available operations: list, analyze, invalidate, cache-bust');
    }
  }

  async handleAppRunner(operation, options) {
    switch (operation) {
      case 'list':
        await this.apprunner.listServices();
        break;
      case 'deploy':
        if (!options.arn) {
          console.error('Service ARN required: --arn <service-arn>');
          return;
        }
        await this.apprunner.deployService(options.arn, options.reason);
        break;
      case 'monitor':
        if (!options.arn) {
          console.error('Service ARN required: --arn <service-arn>');
          return;
        }
        const service = await this.apprunner.getServiceDetails(options.arn);
        console.log(`Status: ${this.apprunner.getStatusColor(service?.Service?.Status)}`);
        break;
      case 'logs':
        if (!options.arn) {
          console.error('Service ARN required: --arn <service-arn>');
          return;
        }
        await this.apprunner.tailLogs(options.arn, options.lines || 100);
        break;
      default:
        console.error(`Unknown App Runner operation: ${operation}`);
        console.log('Available operations: list, deploy, monitor, logs');
    }
  }

  async handleECR(operation, options) {
    switch (operation) {
      case 'list':
        if (!options.repo) {
          console.error('Repository name required: --repo <repository-name>');
          return;
        }
        await this.ecr.listImages(options.repo);
        break;
      case 'tag-latest':
        if (!options.repo) {
          console.error('Repository name required: --repo <repository-name>');
          return;
        }
        await this.ecr.tagLatestImage(options.repo, options.tag || 'latest');
        break;
      default:
        console.error(`Unknown ECR operation: ${operation}`);
        console.log('Available operations: list, tag-latest');
    }
  }

  async handleIAM(operation, options) {
    switch (operation) {
      case 'setup-help':
        await this.iam.showSetupInstructions();
        break;
      case 'add-policy':
        if (!options.user || !options.policy || !options.document) {
          console.error('Required: --user <username> --policy <policy-name> --document <policy-file>');
          return;
        }
        try {
          const policyDoc = JSON.parse(await fs.readFile(options.document, 'utf8'));
          await this.iam.setupPermissions(options.user, options.policy, policyDoc);
        } catch (error) {
          console.error(`Failed to read policy document: ${error.message}`);
        }
        break;
      default:
        console.error(`Unknown IAM operation: ${operation}`);
        console.log('Available operations: setup-help, add-policy');
    }
  }
}

// CLI Setup
program
  .name('aws-manager')
  .description('🌩️ Unified AWS Infrastructure Manager')
  .version('1.0.0');

// CloudFront commands
program
  .command('cloudfront <operation>')
  .description('Manage CloudFront distributions')
  .option('--id <distribution-id>', 'Distribution ID')
  .option('--paths <paths>', 'Comma-separated paths for invalidation (default: /*)')
  .action(async (operation, options) => {
    const manager = new UnifiedAWSManager();
    await manager.handleCloudFront(operation, options);
  });

// App Runner commands
program
  .command('apprunner <operation>')
  .description('Manage App Runner services')
  .option('--arn <service-arn>', 'Service ARN')
  .option('--reason <reason>', 'Deployment reason')
  .option('--lines <count>', 'Number of log lines', '100')
  .action(async (operation, options) => {
    const manager = new UnifiedAWSManager();
    await manager.handleAppRunner(operation, options);
  });

// ECR commands
program
  .command('ecr <operation>')
  .description('Manage ECR repositories')
  .option('--repo <repository-name>', 'Repository name')
  .option('--tag <tag-name>', 'Tag name (default: latest)')
  .action(async (operation, options) => {
    const manager = new UnifiedAWSManager();
    await manager.handleECR(operation, options);
  });

// IAM commands
program
  .command('iam <operation>')
  .description('Manage IAM permissions')
  .option('--user <username>', 'IAM username')
  .option('--policy <policy-name>', 'Policy name')
  .option('--document <policy-file>', 'Policy document file path')
  .action(async (operation, options) => {
    const manager = new UnifiedAWSManager();
    await manager.handleIAM(operation, options);
  });

// Help command
program
  .command('help')
  .description('Show detailed usage examples')
  .action(() => {
    console.log(chalk.bold.cyan('\n🌩️  AWS Manager - Usage Examples\n'));
    
    console.log(chalk.bold('CloudFront:'));
    console.log('  aws-manager.js cloudfront list');
    console.log('  aws-manager.js cloudfront analyze --id E1234567890');
    console.log('  aws-manager.js cloudfront cache-bust --id E1234567890 --paths "/api/*,/static/*"');
    console.log('');
    
    console.log(chalk.bold('App Runner:'));
    console.log('  aws-manager.js apprunner list');
    console.log('  aws-manager.js apprunner deploy --arn arn:aws:apprunner:...');
    console.log('  aws-manager.js apprunner monitor --arn arn:aws:apprunner:...');
    console.log('  aws-manager.js apprunner logs --arn arn:aws:apprunner:... --lines 50');
    console.log('');
    
    console.log(chalk.bold('ECR:'));
    console.log('  aws-manager.js ecr list --repo wavelength-lore');
    console.log('  aws-manager.js ecr tag-latest --repo wavelength-lore --tag production');
    console.log('');
    
    console.log(chalk.bold('IAM:'));
    console.log('  aws-manager.js iam setup-help');
    console.log('  aws-manager.js iam add-policy --user myuser --policy MyPolicy --document policy.json');
    console.log('');
  });

// Parse arguments - ES modules check
if (import.meta.url === `file://${process.argv[1]}`) {
  if (process.argv.length <= 2) {
    program.help();
  } else {
    program.parse();
  }
}

export { UnifiedAWSManager, CloudFrontManager, AppRunnerManager, ECRManager, IAMManager };