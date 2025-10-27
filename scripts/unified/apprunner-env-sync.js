#!/usr/bin/env node

/**
 * WAVELENGTH App Runner Environment Sync
 * Clean npm CLI admin tool for synchronizing environment variables to AWS App Runner
 * 
 * Usage:
 *   npm run admin:env-sync           # Preview changes
 *   npm run admin:env-sync -- --apply  # Apply changes
 *   npm run admin:env-sync -- --help    # Show help
 */

const { AppRunnerClient, DescribeServiceCommand, UpdateServiceCommand } = require('@aws-sdk/client-apprunner');
const fs = require('fs').promises;
const path = require('path');

// Load environment variables from .env files before anything else
function loadEnvFiles() {
  const projectRoot = path.resolve(__dirname, '../../');
  const envFiles = [
    path.join(projectRoot, '.env'),
    path.join(projectRoot, '.env.production')
  ];
  
  for (const envFile of envFiles) {
    try {
      const content = require('fs').readFileSync(envFile, 'utf8');
      content.split('\n').forEach(line => {
        line = line.trim();
        if (!line || line.startsWith('#')) return;
        
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          let value = match[2].trim();
          
          // Remove surrounding quotes
          if ((value.startsWith('"') && value.endsWith('"')) ||
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          
          // Only set if not already in process.env
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      });
    } catch (error) {
      // File doesn't exist or can't be read - that's okay
    }
  }
}

// Load environment variables immediately
loadEnvFiles();

class AppRunnerEnvSync {
  constructor() {
    this.serviceArn = process.env.APPRUNNER_SERVICE_ARN;
    this.region = process.env.AWS_REGION || 'us-east-1';
    
    if (!this.serviceArn) {
      throw new Error('APPRUNNER_SERVICE_ARN environment variable is required');
    }

    this.appRunnerClient = new AppRunnerClient({
      region: this.region,
      credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID,
        secretAccessKey: process.env.SECRET_ACCESS_KEY
      }
    });

    // Production environment variables whitelist
    this.productionVars = [
      // Core Application
      'NODE_ENV',
      'PORT',
      'SITE_URL',
      'CDN_URL',
      'VERSION',
      'DEPLOYMENT_TIMESTAMP',

      // Firebase Configuration
      'API_KEY',
      'AUTH_DOMAIN', 
      'DATABASE_URL',
      'PROJECT_ID',
      'STORAGE_BUCKET',
      'MESSAGING_SENDER_ID',
      'APP_ID',
      'MEASUREMENT_ID',
      'FIREBASE_SERVICE_ACCOUNT',

      // AWS Configuration
      'ACCESS_KEY_ID',
      'SECRET_ACCESS_KEY',
      'AWS_ACCOUNT_ID',
      'AWS_REGION',
      'APPRUNNER_SERVICE_ARN',

      // Gallery & Storage
      'GALLERY_S3_BUCKET',
      'GALLERY_CDN_URL',
      'CLOUDFRONT_DISTRIBUTION_ID',
      'GALLERY_CLOUDFRONT_DISTRIBUTION_ID',

      // External APIs
      'YOUTUBE_API_KEY',
      'OPENAI_API_KEY',
      'GEMINI_API_KEY',
      'GOOGLE_API_KEY',
      'AI_MODEL_KEY',
      'AI_PROVIDER',
      'VIDEO_MODEL_KEY',

      // VIP Features
      'CHATBOT_JWT_SECRET',
      'CHATBOT_API_URL',

      // Merchandise (Printify & Stripe)
      'PRINTIFY_API_TOKEN',
      'PRINTIFY_SHOP_ID',
      'PRINTIFY_API_URL',
      'PRINTIFY_ENVIRONMENT',
      'PRINTIFY_MOCK_MODE',
      'STRIPE_SECRET_KEY',
      'STRIPE_PUBLISHABLE_KEY',
      'STRIPE_ENVIRONMENT',

      // Security & Admin
      'ADMIN_SECRET_KEY',
      'ADMIN_ALLOWED_IPS',
      'RATE_LIMIT_WINDOW',
      'RATE_LIMIT_MAX_REQUESTS',
      'SANITIZATION_ENABLED',
      'PROFANITY_FILTER_ENABLED',

      // File Uploads
      'FORUM_ATTACHMENTS_BUCKET',
      'MAX_FILE_SIZE',
      'MAX_FILES_PER_POST',
      'ALLOWED_FILE_TYPES',

      // Backup Configuration
      'ENABLE_BACKUPS',
      'BACKUP_S3_BUCKET',
      'BACKUP_S3_REGION',
      'BACKUP_RETENTION_DAYS',
      'BACKUP_COMPRESSION',
      'BACKUP_ENCRYPTION',
      'BACKUP_ENCRYPTION_KEY',
      'BACKUP_DAILY_TIME',
      'BACKUP_WEEKLY_TIME',
      'BACKUP_TEMP_DIR',

      // Contact & Support
      'CONTACT_EMAIL'
    ];
  }

  /**
   * Load and parse environment files
   */
  async loadEnvironmentVariables() {
    // Look for .env files in the project root (3 levels up from scripts/unified/)
    const projectRoot = path.resolve(__dirname, '../../');
    const envFiles = [
      path.join(projectRoot, '.env'),
      path.join(projectRoot, '.env.production')
    ];

    const envVars = {};

    for (const envFile of envFiles) {
      try {
        const content = await fs.readFile(envFile, 'utf8');
        const fileVars = this.parseEnvContent(content);
        Object.assign(envVars, fileVars);
        console.log(`✅ Loaded ${Object.keys(fileVars).length} variables from ${path.basename(envFile)}`);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          console.warn(`⚠️  Warning: Could not read ${path.basename(envFile)}: ${error.message}`);
        }
      }
    }

    return envVars;
  }

  /**
   * Parse environment file content
   */
  parseEnvContent(content) {
    const envVars = {};
    
    content.split('\n').forEach(line => {
      line = line.trim();
      
      // Skip empty lines and comments
      if (!line || line.startsWith('#')) return;
      
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        
        // Remove surrounding quotes
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        
        envVars[key] = value;
      }
    });

    return envVars;
  }

  /**
   * Filter environment variables for production deployment
   */
  filterForProduction(envVars) {
    const filtered = {};
    
    this.productionVars.forEach(varName => {
      if (envVars[varName] !== undefined) {
        filtered[varName] = envVars[varName];
      }
    });

    return filtered;
  }

  /**
   * Get current App Runner service configuration
   */
  async getCurrentServiceConfig() {
    const command = new DescribeServiceCommand({
      ServiceArn: this.serviceArn
    });
    
    const response = await this.appRunnerClient.send(command);
    return response.Service;
  }

  /**
   * Compare current and new environment variables
   */
  compareEnvironments(current, target) {
    const changes = {
      added: [],
      modified: [],
      removed: [],
      unchanged: []
    };

    // Check additions and modifications
    Object.entries(target).forEach(([key, value]) => {
      if (!(key in current)) {
        changes.added.push({ key, value });
      } else if (current[key] !== value) {
        changes.modified.push({ 
          key, 
          oldValue: current[key], 
          newValue: value 
        });
      } else {
        changes.unchanged.push({ key, value });
      }
    });

    // Check removals
    Object.keys(current).forEach(key => {
      if (!(key in target)) {
        changes.removed.push({ key, value: current[key] });
      }
    });

    return changes;
  }

  /**
   * Display changes summary
   */
  displayChanges(changes) {
    console.log('\n🔍 Environment Variables Changes:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (changes.added.length > 0) {
      console.log(`\n✅ Added (${changes.added.length}):`);
      changes.added.forEach(({ key, value }) => {
        console.log(`   + ${key} = ${this.maskValue(key, value)}`);
      });
    }

    if (changes.modified.length > 0) {
      console.log(`\n🔄 Modified (${changes.modified.length}):`);
      changes.modified.forEach(({ key, oldValue, newValue }) => {
        console.log(`   ~ ${key}: ${this.maskValue(key, oldValue)} → ${this.maskValue(key, newValue)}`);
      });
    }

    if (changes.removed.length > 0) {
      console.log(`\n❌ Removed (${changes.removed.length}):`);
      changes.removed.forEach(({ key, value }) => {
        console.log(`   - ${key} = ${this.maskValue(key, value)}`);
      });
    }

    console.log(`\n📊 Total Changes: ${changes.added.length + changes.modified.length + changes.removed.length}`);
    console.log(`📊 Unchanged: ${changes.unchanged.length}`);

    return changes.added.length + changes.modified.length + changes.removed.length > 0;
  }

  /**
   * Mask sensitive values for display
   */
  maskValue(key, value) {
    const sensitivePatterns = ['KEY', 'SECRET', 'PASSWORD', 'TOKEN'];
    const isSensitive = sensitivePatterns.some(pattern => 
      key.toUpperCase().includes(pattern)
    );

    if (isSensitive && value && value.length > 8) {
      return `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
    }

    return value;
  }

  /**
   * Update App Runner service with new environment variables
   */
  async updateService(envVars) {
    const currentService = await this.getCurrentServiceConfig();
    
    const updateParams = {
      ServiceArn: this.serviceArn,
      SourceConfiguration: {
        ImageRepository: currentService.SourceConfiguration.ImageRepository,
        AutoDeploymentsEnabled: currentService.SourceConfiguration.AutoDeploymentsEnabled
      }
    };

    // Update environment variables and port
    const currentImageConfig = currentService.SourceConfiguration.ImageRepository.ImageConfiguration;
    const targetPort = envVars.PORT || currentImageConfig.Port || "8080";

    updateParams.SourceConfiguration.ImageRepository.ImageConfiguration = {
      ...currentImageConfig,
      Port: targetPort,
      RuntimeEnvironmentVariables: envVars
    };

    console.log('\n🚀 Updating App Runner service...');
    console.log(`📋 Service: ${this.serviceArn}`);
    console.log(`🔧 Variables: ${Object.keys(envVars).length}`);
    console.log(`🔌 Port: ${targetPort}`);

    const command = new UpdateServiceCommand(updateParams);
    const response = await this.appRunnerClient.send(command);

    return response;
  }

  /**
   * Main sync operation
   */
  async sync(options = {}) {
    try {
      console.log('🌊 WAVELENGTH App Runner Environment Sync');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // Load environment variables
      console.log('📖 Loading environment variables...');
      const allEnvVars = await this.loadEnvironmentVariables();
      
      // Filter for production
      console.log('🔍 Filtering for production deployment...');
      const productionEnvVars = this.filterForProduction(allEnvVars);
      console.log(`✅ Selected ${Object.keys(productionEnvVars).length} production variables`);

      // Get current service configuration
      console.log('🔍 Checking current App Runner configuration...');
      const currentService = await this.getCurrentServiceConfig();
      const currentEnvVars = currentService.SourceConfiguration?.ImageRepository?.ImageConfiguration?.RuntimeEnvironmentVariables || {};
      
      // Compare configurations
      const changes = this.compareEnvironments(currentEnvVars, productionEnvVars);
      const hasChanges = this.displayChanges(changes);

      if (!hasChanges) {
        console.log('\n✅ Environment variables are already synchronized!');
        return { success: true, updated: false };
      }

      // Apply changes if requested
      if (options.apply) {
        const updateResponse = await this.updateService(productionEnvVars);
        
        console.log('\n✅ Service update initiated successfully!');
        console.log(`📋 Operation ID: ${updateResponse.OperationId}`);
        console.log(`🔄 Status: ${updateResponse.Service.Status}`);
        
        console.log('\n📝 Next Steps:');
        console.log('   • Monitor deployment in AWS App Runner console');
        console.log('   • Verify application starts correctly');
        console.log('   • Test critical functionality');
        
        return { success: true, updated: true, operationId: updateResponse.OperationId };
      } else {
        console.log('\n💡 To apply these changes, run:');
        console.log('   npm run admin:env-sync -- --apply');
        
        return { success: true, updated: false, hasChanges: true };
      }

    } catch (error) {
      console.error(`\n❌ Error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}

/**
 * CLI Interface
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('🌊 WAVELENGTH App Runner Environment Sync');
    console.log('');
    console.log('Synchronizes environment variables from .env files to AWS App Runner');
    console.log('');
    console.log('Usage:');
    console.log('  npm run admin:env-sync           # Preview changes');
    console.log('  npm run admin:env-sync -- --apply  # Apply changes');
    console.log('  npm run admin:env-sync -- --help   # Show this help');
    console.log('');
    console.log('Environment Variables Required:');
    console.log('  APPRUNNER_SERVICE_ARN    # AWS App Runner service ARN');
    console.log('  ACCESS_KEY_ID           # AWS access key');
    console.log('  SECRET_ACCESS_KEY       # AWS secret key');
    console.log('  AWS_REGION              # AWS region (default: us-east-1)');
    console.log('');
    console.log('Files Used:');
    console.log('  .env                    # Base environment variables');
    console.log('  .env.production         # Production overrides');
    return;
  }

  const options = {
    apply: args.includes('--apply')
  };

  try {
    const sync = new AppRunnerEnvSync();
    const result = await sync.sync(options);
    
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error(`❌ Fatal error: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = AppRunnerEnvSync;