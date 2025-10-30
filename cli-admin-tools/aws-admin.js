#!/usr/bin/env node

/**
 * 🌊 WAVELENGTH CLI ADMIN - PRISTINE AWS MANAGER
 * =============================================
 * Clean room implementation of AWS management functionality
 * Completely isolated from external scripts for maximum reliability
 * 
 * Provides: CloudFront, App Runner, ECR, S3, and IAM operations
 */

const { CloudFrontClient, ListDistributionsCommand, GetDistributionCommand, 
        CreateInvalidationCommand } = require('@aws-sdk/client-cloudfront');
const { AppRunnerClient, UpdateServiceCommand, DescribeServiceCommand, 
        ListServicesCommand, StartDeploymentCommand } = require('@aws-sdk/client-apprunner');
const { ECRClient, DescribeRepositoriesCommand, DescribeImagesCommand, 
        ListImagesCommand, BatchGetImageCommand } = require('@aws-sdk/client-ecr');
const { S3Client, ListObjectsV2Command, PutObjectCommand, 
        DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { IAMClient, ListUsersCommand, GetUserCommand } = require('@aws-sdk/client-iam');
const { CloudWatchLogsClient, DescribeLogGroupsCommand, DescribeLogStreamsCommand, 
        GetLogEventsCommand, FilterLogEventsCommand } = require('@aws-sdk/client-cloudwatch-logs');
const chalk = require('chalk');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

class WavelengthAWSAdmin {
  constructor() {
    this.region = process.env.AWS_REGION || 'us-east-1';
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
    
    this.cloudfront = new CloudFrontClient(clientConfig);
    this.apprunner = new AppRunnerClient(clientConfig);
    this.ecr = new ECRClient(clientConfig);
    this.s3 = new S3Client(clientConfig);
    this.iam = new IAMClient(clientConfig);
    this.cloudwatchlogs = new CloudWatchLogsClient(clientConfig);
    
    this.logInfo(`Using wavelength-dev user: arn:aws:iam::170023515523:user/wavelength-dev`);
  }

  /**
   * 🎨 Logging utilities
   */
  logHeader(message) {
    console.log(chalk.cyan(`\n🌊 ${message}`));
    console.log(chalk.gray('━'.repeat(60)));
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
   * ☁️ CLOUDFRONT OPERATIONS
   */
  async cloudfrontList() {
    this.logHeader('CloudFront Distributions');
    
    try {
      const command = new ListDistributionsCommand({});
      const response = await this.cloudfront.send(command);
      
      if (!response.DistributionList?.Items?.length) {
        this.logInfo('No CloudFront distributions found');
        return;
      }
      
      console.log('\n📊 Active Distributions:');
      response.DistributionList.Items.forEach((dist, index) => {
        console.log(`${index + 1}. ${chalk.bold(dist.Id)}`);
        console.log(`   🌐 Domain: ${chalk.blue(dist.DomainName)}`);
        console.log(`   📊 Status: ${dist.Enabled ? chalk.green('Enabled') : chalk.red('Disabled')}`);
        console.log(`   🎯 Origins: ${dist.Origins.Items.length}`);
        console.log('');
      });
      
    } catch (error) {
      this.logError(`Failed to list distributions: ${error.message}`);
    }
  }

  async cloudfrontInvalidate(distributionId, paths = ['/*']) {
    this.logHeader(`CloudFront Cache Invalidation`);
    
    try {
      if (!distributionId) {
        distributionId = process.env.CLOUDFRONT_DISTRIBUTION_ID;
        if (!distributionId) {
          this.logError('Distribution ID required. Set CLOUDFRONT_DISTRIBUTION_ID or provide --id');
          return;
        }
      }

      console.log(`🎯 Target: ${distributionId}`);
      console.log(`📁 Paths: ${paths.join(', ')}`);
      
      const command = new CreateInvalidationCommand({
        DistributionId: distributionId,
        InvalidationBatch: {
          Paths: {
            Quantity: paths.length,
            Items: paths
          },
          CallerReference: `wavelength-admin-${Date.now()}`
        }
      });
      
      const response = await this.cloudfront.send(command);
      
      this.logSuccess(`Invalidation created: ${response.Invalidation.Id}`);
      this.logInfo(`Status: ${response.Invalidation.Status}`);
      
    } catch (error) {
      this.logError(`Cache invalidation failed: ${error.message}`);
    }
  }

  /**
   * 🏃 APP RUNNER OPERATIONS
   */
  async apprunnerList() {
    this.logHeader('App Runner Services');
    
    try {
      const command = new ListServicesCommand({});
      const response = await this.apprunner.send(command);
      
      if (!response.ServiceSummaryList?.length) {
        this.logInfo('No App Runner services found');
        return;
      }
      
      console.log('\n🏃 Active Services:');
      response.ServiceSummaryList.forEach((service, index) => {
        console.log(`${index + 1}. ${chalk.bold(service.ServiceName)}`);
        console.log(`   🆔 ARN: ${chalk.blue(service.ServiceArn)}`);
        console.log(`   📊 Status: ${this.formatStatus(service.Status)}`);
        console.log(`   🕐 Created: ${new Date(service.CreatedAt).toLocaleString()}`);
        console.log('');
      });
      
    } catch (error) {
      this.logError(`Failed to list App Runner services: ${error.message}`);
    }
  }

  async apprunnerStatus(serviceArn) {
    this.logHeader('App Runner Service Status');
    
    try {
      if (!serviceArn) {
        serviceArn = process.env.APPRUNNER_SERVICE_ARN;
        if (!serviceArn) {
          this.logError('Service ARN required. Set APPRUNNER_SERVICE_ARN or provide --arn');
          return;
        }
      }

      const command = new DescribeServiceCommand({ ServiceArn: serviceArn });
      const response = await this.apprunner.send(command);
      const service = response.Service;
      
      console.log(`🏷️  Name: ${chalk.bold(service.ServiceName)}`);
      console.log(`📊 Status: ${this.formatStatus(service.Status)}`);
      console.log(`🌐 URL: ${chalk.blue(service.ServiceUrl || 'Not available')}`);
      console.log(`🕐 Created: ${new Date(service.CreatedAt).toLocaleString()}`);
      console.log(`🔄 Updated: ${new Date(service.UpdatedAt).toLocaleString()}`);
      
      if (service.SourceConfiguration?.ImageRepository) {
        console.log(`🐳 Image: ${service.SourceConfiguration.ImageRepository.ImageIdentifier}`);
      }
      
    } catch (error) {
      this.logError(`Failed to get service status: ${error.message}`);
    }
  }

  async apprunnerDeploy(serviceArn) {
    this.logHeader('App Runner Deployment');
    
    try {
      if (!serviceArn) {
        serviceArn = process.env.APPRUNNER_SERVICE_ARN;
        if (!serviceArn) {
          this.logError('Service ARN required. Set APPRUNNER_SERVICE_ARN or provide --arn');
          return;
        }
      }

      const command = new StartDeploymentCommand({ ServiceArn: serviceArn });
      const response = await this.apprunner.send(command);
      
      this.logSuccess(`Deployment started: ${response.OperationId}`);
      this.logInfo('Check status with: npm run cli:admin aws apprunner status');
      
    } catch (error) {
      this.logError(`Deployment failed: ${error.message}`);
    }
  }

  /**
   * 🐳 ECR OPERATIONS
   */
  async ecrList(repositoryName) {
    this.logHeader('ECR Repository Images');
    
    try {
      if (!repositoryName) {
        repositoryName = process.env.ECR_REPOSITORY_NAME || 'wavelength-lore';
      }

      // First get repository info
      const repoCommand = new DescribeRepositoriesCommand({
        repositoryNames: [repositoryName]
      });
      const repoResponse = await this.ecr.send(repoCommand);
      const repository = repoResponse.repositories[0];
      
      console.log(`📦 Repository: ${chalk.bold(repository.repositoryName)}`);
      console.log(`🌐 URI: ${chalk.blue(repository.repositoryUri)}`);
      console.log(`🕐 Created: ${new Date(repository.createdAt).toLocaleString()}`);
      
      // Get images
      const imagesCommand = new DescribeImagesCommand({
        repositoryName: repositoryName,
        maxResults: 10
      });
      const imagesResponse = await this.ecr.send(imagesCommand);
      
      if (!imagesResponse.imageDetails?.length) {
        this.logInfo('No images found in repository');
        return;
      }
      
      console.log('\n🐳 Images:');
      imagesResponse.imageDetails
        .sort((a, b) => new Date(b.imagePushedAt) - new Date(a.imagePushedAt))
        .forEach((image, index) => {
          const tag = image.imageTags?.[0] || 'untagged';
          const size = Math.round(image.imageSizeInBytes / 1024 / 1024);
          console.log(`${index + 1}. ${chalk.bold(tag)}`);
          console.log(`   📊 Size: ${size} MB`);
          console.log(`   🕐 Pushed: ${new Date(image.imagePushedAt).toLocaleString()}`);
          console.log(`   🔍 Digest: ${image.imageDigest.substring(0, 20)}...`);
          console.log('');
        });
      
    } catch (error) {
      this.logError(`Failed to list ECR images: ${error.message}`);
    }
  }

  /**
   * 🪣 S3 OPERATIONS
   */
  async s3List(bucketName, prefix = '') {
    this.logHeader('S3 Bucket Contents');
    
    try {
      if (!bucketName) {
        bucketName = process.env.S3_BUCKET_NAME || process.env.BACKUP_S3_BUCKET;
        if (!bucketName) {
          this.logError('Bucket name required. Set S3_BUCKET_NAME or provide --bucket');
          return;
        }
      }

      console.log(`🪣 Bucket: ${chalk.bold(bucketName)}`);
      if (prefix) console.log(`📁 Prefix: ${prefix}`);
      
      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: prefix,
        MaxKeys: 20
      });
      
      const response = await this.s3.send(command);
      
      if (!response.Contents?.length) {
        this.logInfo('No objects found');
        return;
      }
      
      console.log(`\n📂 Objects (${response.Contents.length}):`);
      response.Contents.forEach((obj, index) => {
        const size = Math.round(obj.Size / 1024);
        console.log(`${index + 1}. ${chalk.bold(obj.Key)}`);
        console.log(`   📊 Size: ${size} KB`);
        console.log(`   🕐 Modified: ${new Date(obj.LastModified).toLocaleString()}`);
        console.log('');
      });
      
    } catch (error) {
      this.logError(`Failed to list S3 objects: ${error.message}`);
    }
  }

  /**
   * 👤 IAM OPERATIONS
   */
  async iamInfo() {
    this.logHeader('IAM User Information');
    
    try {
      const command = new ListUsersCommand({ MaxItems: 10 });
      const response = await this.iam.send(command);
      
      if (!response.Users?.length) {
        this.logInfo('No IAM users found');
        return;
      }
      
      console.log('\n👥 IAM Users:');
      response.Users.forEach((user, index) => {
        console.log(`${index + 1}. ${chalk.bold(user.UserName)}`);
        console.log(`   🆔 User ID: ${user.UserId}`);
        console.log(`   🕐 Created: ${new Date(user.CreateDate).toLocaleString()}`);
        if (user.PasswordLastUsed) {
          console.log(`   🔐 Last Login: ${new Date(user.PasswordLastUsed).toLocaleString()}`);
        }
        console.log('');
      });
      
    } catch (error) {
      this.logError(`Failed to get IAM info: ${error.message}`);
    }
  }

  /**
   * 📊 CLOUDWATCH LOGS OPERATIONS
   */
  async logsListGroups() {
    this.logHeader('CloudWatch Log Groups');
    
    try {
      const command = new DescribeLogGroupsCommand({ limit: 20 });
      const response = await this.cloudwatchlogs.send(command);
      
      if (!response.logGroups?.length) {
        this.logInfo('No log groups found');
        return;
      }
      
      console.log('\n📊 Log Groups:');
      response.logGroups
        .sort((a, b) => (b.creationTime || 0) - (a.creationTime || 0))
        .forEach((group, index) => {
          console.log(`${index + 1}. ${chalk.bold(group.logGroupName)}`);
          if (group.logGroupName.includes('apprunner')) {
            console.log(`   🏃 ${chalk.green('App Runner Service Log')}`);
          }
          if (group.storedBytes) {
            const sizeMB = Math.round(group.storedBytes / 1024 / 1024);
            console.log(`   📊 Size: ${sizeMB} MB`);
          }
          if (group.creationTime) {
            console.log(`   🕐 Created: ${new Date(group.creationTime).toLocaleString()}`);
          }
          if (group.retentionInDays) {
            console.log(`   ⏰ Retention: ${group.retentionInDays} days`);
          }
          console.log('');
        });
      
    } catch (error) {
      this.logError(`Failed to list log groups: ${error.message}`);
    }
  }

  async logsGet(logGroupName, lines = 50, follow = false) {
    this.logHeader(`CloudWatch Logs - Latest ${lines} lines`);
    
    try {
      if (!logGroupName) {
        // Try to find AppRunner log group automatically
        const groupsCommand = new DescribeLogGroupsCommand({});
        const groupsResponse = await this.cloudwatchlogs.send(groupsCommand);
        
        const apprunnerGroup = groupsResponse.logGroups?.find(group => 
          group.logGroupName.includes('apprunner') || 
          group.logGroupName.includes('wavelength')
        );
        
        if (apprunnerGroup) {
          logGroupName = apprunnerGroup.logGroupName;
          this.logInfo(`Auto-detected log group: ${logGroupName}`);
        } else {
          this.logError('Log group name required. Use --group option or set APPRUNNER_LOG_GROUP_NAME');
          this.logInfo('Available groups:');
          await this.logsListGroups();
          return;
        }
      }

      console.log(`📊 Log Group: ${chalk.bold(logGroupName)}`);
      console.log(`📄 Lines: ${lines}`);
      
      // Get the most recent log stream
      const streamsCommand = new DescribeLogStreamsCommand({
        logGroupName: logGroupName,
        orderBy: 'LastEventTime',
        descending: true,
        limit: 5
      });
      
      const streamsResponse = await this.cloudwatchlogs.send(streamsCommand);
      
      if (!streamsResponse.logStreams?.length) {
        this.logWarning('No log streams found in this group');
        return;
      }

      console.log(`🔍 Using stream: ${chalk.blue(streamsResponse.logStreams[0].logStreamName)}`);
      console.log(chalk.gray('━'.repeat(80)));
      
      // Get recent log events
      const endTime = Date.now();
      const startTime = endTime - (24 * 60 * 60 * 1000); // Last 24 hours
      
      const eventsCommand = new FilterLogEventsCommand({
        logGroupName: logGroupName,
        startTime: startTime,
        endTime: endTime,
        limit: lines
      });
      
      const eventsResponse = await this.cloudwatchlogs.send(eventsCommand);
      
      if (!eventsResponse.events?.length) {
        this.logWarning('No recent log events found');
        return;
      }

      // Display logs with colors and formatting
      console.log('\n📋 Recent Logs:\n');
      
      eventsResponse.events
        .sort((a, b) => a.timestamp - b.timestamp)
        .forEach((event, index) => {
          const timestamp = new Date(event.timestamp).toLocaleString();
          const message = event.message.trim();
          
          // Color code log messages
          let coloredMessage = message;
          if (message.includes('ERROR') || message.includes('❌')) {
            coloredMessage = chalk.red(message);
          } else if (message.includes('WARN') || message.includes('⚠️')) {
            coloredMessage = chalk.yellow(message);
          } else if (message.includes('INFO') || message.includes('✅')) {
            coloredMessage = chalk.green(message);
          } else if (message.includes('DEBUG')) {
            coloredMessage = chalk.gray(message);
          }
          
          console.log(`${chalk.gray(timestamp)} ${coloredMessage}`);
        });
      
      console.log(`\n${chalk.gray('━'.repeat(80))}`);
      this.logSuccess(`Displayed ${eventsResponse.events.length} log entries`);
      
      if (follow) {
        this.logInfo('Follow mode not yet implemented. Use --no-follow for one-time fetch.');
      }
      
    } catch (error) {
      this.logError(`Failed to get logs: ${error.message}`);
      
      if (error.name === 'ResourceNotFoundException') {
        this.logInfo('Log group not found. Available groups:');
        await this.logsListGroups();
      }
    }
  }

  async logsSearch(logGroupName, searchTerm, hours = 24) {
    this.logHeader(`CloudWatch Logs Search - "${searchTerm}"`);
    
    try {
      if (!logGroupName) {
        // Try to find AppRunner log group automatically
        const groupsCommand = new DescribeLogGroupsCommand({});
        const groupsResponse = await this.cloudwatchlogs.send(groupsCommand);
        
        const apprunnerGroup = groupsResponse.logGroups?.find(group => 
          group.logGroupName.includes('apprunner') || 
          group.logGroupName.includes('wavelength')
        );
        
        if (apprunnerGroup) {
          logGroupName = apprunnerGroup.logGroupName;
          this.logInfo(`Auto-detected log group: ${logGroupName}`);
        } else {
          this.logError('Log group name required. Use --group option');
          return;
        }
      }

      console.log(`🔍 Searching in: ${chalk.bold(logGroupName)}`);
      console.log(`🎯 Term: "${chalk.yellow(searchTerm)}"`);
      console.log(`⏰ Time window: ${hours} hours`);
      
      const endTime = Date.now();
      const startTime = endTime - (hours * 60 * 60 * 1000);
      
      const command = new FilterLogEventsCommand({
        logGroupName: logGroupName,
        filterPattern: searchTerm,
        startTime: startTime,
        endTime: endTime,
        limit: 100
      });
      
      const response = await this.cloudwatchlogs.send(command);
      
      if (!response.events?.length) {
        this.logWarning(`No matches found for "${searchTerm}"`);
        return;
      }

      console.log(chalk.gray('━'.repeat(80)));
      console.log(`\n📋 Found ${response.events.length} matches:\n`);
      
      response.events
        .sort((a, b) => b.timestamp - a.timestamp) // Most recent first
        .forEach((event, index) => {
          const timestamp = new Date(event.timestamp).toLocaleString();
          const message = event.message.trim();
          
          // Highlight search term
          const highlightedMessage = message.replace(
            new RegExp(searchTerm, 'gi'),
            chalk.bgYellow.black(searchTerm)
          );
          
          console.log(`${index + 1}. ${chalk.gray(timestamp)}`);
          console.log(`   ${highlightedMessage}`);
          console.log('');
        });
      
      this.logSuccess(`Found ${response.events.length} matching log entries`);
      
    } catch (error) {
      this.logError(`Log search failed: ${error.message}`);
    }
  }

  /**
   * 🎯 Utility methods
   */
  formatStatus(status) {
    const statusColors = {
      'RUNNING': chalk.green(status),
      'CREATE_FAILED': chalk.red(status),
      'DELETE_FAILED': chalk.red(status),
      'OPERATION_IN_PROGRESS': chalk.yellow(status),
      'PAUSED': chalk.yellow(status),
      'DELETED': chalk.gray(status)
    };
    
    return statusColors[status] || chalk.blue(status);
  }

  /**
   * 📋 Main command handler
   */
  async handleCommand(service, operation, options = {}) {
    try {
      switch (service) {
        case 'cloudfront':
          await this.handleCloudFront(operation, options);
          break;
        case 'apprunner':
          await this.handleAppRunner(operation, options);
          break;
        case 'ecr':
          await this.handleECR(operation, options);
          break;
        case 's3':
          await this.handleS3(operation, options);
          break;
        case 'iam':
          await this.handleIAM(operation, options);
          break;
        case 'logs':
        case 'cloudwatch':
          await this.handleLogs(operation, options);
          break;
        default:
          this.showHelp();
      }
    } catch (error) {
      this.logError(`Command failed: ${error.message}`);
    }
  }

  async handleCloudFront(operation, options) {
    switch (operation) {
      case 'list':
        await this.cloudfrontList();
        break;
      case 'invalidate':
      case 'cache-bust':
        const paths = options.paths ? options.paths.split(',').map(p => p.trim()) : ['/*'];
        await this.cloudfrontInvalidate(options.id, paths);
        break;
      default:
        this.logError(`Unknown CloudFront operation: ${operation}`);
        this.showCloudFrontHelp();
    }
  }

  async handleAppRunner(operation, options) {
    switch (operation) {
      case 'list':
        await this.apprunnerList();
        break;
      case 'status':
        await this.apprunnerStatus(options.arn);
        break;
      case 'deploy':
        await this.apprunnerDeploy(options.arn);
        break;
      default:
        this.logError(`Unknown App Runner operation: ${operation}`);
        this.showAppRunnerHelp();
    }
  }

  async handleECR(operation, options) {
    switch (operation) {
      case 'list':
        await this.ecrList(options.repo);
        break;
      default:
        this.logError(`Unknown ECR operation: ${operation}`);
        this.showECRHelp();
    }
  }

  async handleS3(operation, options) {
    switch (operation) {
      case 'list':
        await this.s3List(options.bucket, options.prefix);
        break;
      default:
        this.logError(`Unknown S3 operation: ${operation}`);
        this.showS3Help();
    }
  }

  async handleIAM(operation, options) {
    switch (operation) {
      case 'info':
        await this.iamInfo();
        break;
      default:
        this.logError(`Unknown IAM operation: ${operation}`);
        this.showIAMHelp();
    }
  }

  async handleLogs(operation, options) {
    switch (operation) {
      case 'list':
      case 'groups':
        await this.logsListGroups();
        break;
      case 'get':
      case 'tail':
      case 'latest':
        const lines = parseInt(options.lines) || 50;
        const follow = options.follow === 'true';
        await this.logsGet(options.group, lines, follow);
        break;
      case 'search':
        if (!options.term) {
          this.logError('Search term required. Use --term "search text"');
          return;
        }
        const hours = parseInt(options.hours) || 24;
        await this.logsSearch(options.group, options.term, hours);
        break;
      default:
        this.logError(`Unknown logs operation: ${operation}`);
        this.showLogsHelp();
    }
  }

  /**
   * 📚 Help methods
   */
  showHelp() {
    console.log(chalk.cyan('\n🌊 WAVELENGTH AWS ADMIN TOOL'));
    console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log('\nUsage: npm run cli:admin aws <service> <operation> [options]\n');
    
    console.log(chalk.bold('Services:'));
    console.log('  cloudfront    - CloudFront distribution management');
    console.log('  apprunner     - App Runner service operations');
    console.log('  ecr           - ECR repository and image management');
    console.log('  s3            - S3 bucket operations');
    console.log('  iam           - IAM user information');
    console.log('  logs          - CloudWatch Logs (AppRunner application logs)');
    console.log('');
    
    console.log(chalk.bold('Examples:'));
    console.log('  npm run cli:admin aws cloudfront list');
    console.log('  npm run cli:admin aws apprunner status');
    console.log('  npm run cli:admin aws ecr list');
    console.log('  npm run cli:admin aws s3 list');
    console.log('  npm run cli:admin aws logs get --lines 100');
    console.log('  npm run cli:admin aws logs search --term "ERROR"');
    console.log('');
  }

  showCloudFrontHelp() {
    console.log(chalk.bold('\nCloudFront Operations:'));
    console.log('  list                    - List all distributions');
    console.log('  invalidate --paths "/*" - Invalidate cache paths');
  }

  showAppRunnerHelp() {
    console.log(chalk.bold('\nApp Runner Operations:'));
    console.log('  list           - List all services');
    console.log('  status         - Get service status');
    console.log('  deploy         - Start new deployment');
  }

  showECRHelp() {
    console.log(chalk.bold('\nECR Operations:'));
    console.log('  list --repo <name>  - List repository images');
  }

  showS3Help() {
    console.log(chalk.bold('\nS3 Operations:'));
    console.log('  list --bucket <name> --prefix <prefix>  - List bucket objects');
  }

  showIAMHelp() {
    console.log(chalk.bold('\nIAM Operations:'));
    console.log('  info  - Show IAM user information');
  }

  showLogsHelp() {
    console.log(chalk.bold('\nCloudWatch Logs Operations:'));
    console.log('  list                                 - List all log groups');
    console.log('  get --lines 50 --group <name>       - Get latest N log lines');
    console.log('  search --term "ERROR" --hours 24    - Search logs for term');
    console.log('');
    console.log(chalk.bold('Examples:'));
    console.log('  npm run cli:admin aws logs list');
    console.log('  npm run cli:admin aws logs get --lines 100');
    console.log('  npm run cli:admin aws logs search --term "Apply effects"');
    console.log('  npm run cli:admin aws logs search --term "❌" --hours 6');
  }
}

/**
 * 🚀 Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === 'help') {
    const aws = new WavelengthAWSAdmin();
    aws.showHelp();
    return;
  }
  
  const [service, operation, ...optionArgs] = args;
  const options = {};
  
  // Parse simple options
  for (let i = 0; i < optionArgs.length; i += 2) {
    if (optionArgs[i]?.startsWith('--')) {
      const key = optionArgs[i].substring(2);
      const value = optionArgs[i + 1];
      options[key] = value;
    }
  }
  
  const aws = new WavelengthAWSAdmin();
  await aws.handleCommand(service, operation, options);
}

// Export for use as module
module.exports = WavelengthAWSAdmin;

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error(chalk.red('❌ Fatal error:'), error.message);
    process.exit(1);
  });
}