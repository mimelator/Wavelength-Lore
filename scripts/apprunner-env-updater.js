#!/usr/bin/env node

/**
 * AWS App Runner Environment Updater
 * Updates App Runner service configuration with environment variables from .env file
 */

const envHelper = require('./env-helper');
const { AppRunnerClient, DescribeServiceCommand, UpdateServiceCommand } = require('@aws-sdk/client-apprunner');
const fs = require('fs').promises;
const path = require('path');

class AppRunnerEnvUpdater {
  constructor(serviceArn) {
    this.serviceArn = serviceArn;
    this.appRunnerClient = new AppRunnerClient({
      region: 'us-east-1', // Extract from ARN
      credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID, // Use main AWS credentials
        secretAccessKey: process.env.SECRET_ACCESS_KEY
      }
    });
  }

  /**
   * Parse environment variables from .env file
   */
  async parseEnvFile() {
    try {
      const envPath = path.join(__dirname, '../.env');
      const envContent = await fs.readFile(envPath, 'utf8');
      
      const envVars = {};
      const lines = envContent.split('\n');
      
      for (const line of lines) {
        // Skip comments and empty lines
        if (line.trim() === '' || line.trim().startsWith('#')) {
          continue;
        }
        
        // Parse KEY=VALUE or KEY="VALUE"
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          let value = match[2].trim();
          
          // Remove quotes if present
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          
          envVars[key] = value;
        }
      }
      
      return envVars;
    } catch (error) {
      throw new Error(`Failed to parse .env file: ${error.message}`);
    }
  }

  /**
   * Filter environment variables for production use
   */
  filterProductionEnvVars(envVars) {
    // Define which variables should be deployed to production
    const productionVarNames = [
      // Firebase Configuration
      'API_KEY',
      'AUTH_DOMAIN', 
      'DATABASE_URL',
      'PROJECT_ID',
      'STORAGE_BUCKET',
      'MESSAGING_SENDER_ID',
      'APP_ID',
      'MEASUREMENT_ID',
      
      // AWS Configuration
      'ACCESS_KEY_ID',
      'SECRET_ACCESS_KEY',
      
      // YouTube API
      'YOUTUBE_API_KEY',
      
      // CDN Configuration
      'CDN_URL',
      
      // Security Configuration
      'RATE_LIMIT_WINDOW',
      'RATE_LIMIT_MAX_REQUESTS',
      'SANITIZATION_ENABLED',
      'PROFANITY_FILTER_ENABLED',
      
      // Application Configuration
      'VERSION',
      'SITE_URL',
      'PORT'
    ];

    const productionEnvVars = {};
    
    productionVarNames.forEach(varName => {
      if (envVars[varName] !== undefined) {
        productionEnvVars[varName] = envVars[varName];
      }
    });

    // Convert to App Runner format
    const appRunnerEnvVars = Object.entries(productionEnvVars).map(([name, value]) => ({
      Name: name,
      Value: value
    }));

    return appRunnerEnvVars;
  }

  /**
   * Get current service configuration
   */
  async getCurrentServiceConfig() {
    try {
      const command = new DescribeServiceCommand({
        ServiceArn: this.serviceArn
      });
      
      const response = await this.appRunnerClient.send(command);
      return response.Service;
    } catch (error) {
      throw new Error(`Failed to get service configuration: ${error.message}`);
    }
  }

  /**
   * Update service configuration
   */
  async updateServiceConfiguration(newEnvVars) {
    try {
      const currentService = await this.getCurrentServiceConfig();
      
      // Prepare the update configuration
      const updateParams = {
        ServiceArn: this.serviceArn,
        SourceConfiguration: {
          ImageRepository: currentService.SourceConfiguration.ImageRepository,
          AutoDeploymentsEnabled: currentService.SourceConfiguration.AutoDeploymentsEnabled
        }
      };

      // Update environment variables if we have new ones
      if (newEnvVars && newEnvVars.length > 0) {
        updateParams.SourceConfiguration.ImageRepository.ImageConfiguration = {
          ...currentService.SourceConfiguration.ImageRepository.ImageConfiguration,
          RuntimeEnvironmentVariables: newEnvVars.reduce((acc, env) => {
            acc[env.Name] = env.Value;
            return acc;
          }, {})
        };
      }

      console.log('🔄 Updating App Runner service configuration...');
      console.log(`📋 Service ARN: ${this.serviceArn}`);
      console.log(`🔧 Environment Variables: ${newEnvVars.length} variables`);
      
      const command = new UpdateServiceCommand(updateParams);
      const response = await this.appRunnerClient.send(command);
      
      return response;
    } catch (error) {
      throw new Error(`Failed to update service configuration: ${error.message}`);
    }
  }

  /**
   * Compare current and new environment variables
   */
  compareEnvironmentVariables(currentVars, newVars) {
    const current = currentVars || {};
    const newVarsMap = {};
    
    newVars.forEach(env => {
      newVarsMap[env.Name] = env.Value;
    });

    const changes = {
      added: [],
      modified: [],
      removed: [],
      unchanged: []
    };

    // Check for added and modified variables
    Object.entries(newVarsMap).forEach(([name, value]) => {
      if (!(name in current)) {
        changes.added.push({ name, value });
      } else if (current[name] !== value) {
        changes.modified.push({ 
          name, 
          oldValue: current[name], 
          newValue: value 
        });
      } else {
        changes.unchanged.push({ name, value });
      }
    });

    // Check for removed variables
    Object.keys(current).forEach(name => {
      if (!(name in newVarsMap)) {
        changes.removed.push({ name, value: current[name] });
      }
    });

    return changes;
  }

  /**
   * Display changes summary
   */
  displayChangesSummary(changes) {
    console.log('\n📊 Environment Variables Changes Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (changes.added.length > 0) {
      console.log(`\n✅ Added (${changes.added.length}):`);
      changes.added.forEach(({ name, value }) => {
        const maskedValue = this.maskSensitiveValue(name, value);
        console.log(`   + ${name} = ${maskedValue}`);
      });
    }

    if (changes.modified.length > 0) {
      console.log(`\n🔄 Modified (${changes.modified.length}):`);
      changes.modified.forEach(({ name, oldValue, newValue }) => {
        const maskedOld = this.maskSensitiveValue(name, oldValue);
        const maskedNew = this.maskSensitiveValue(name, newValue);
        console.log(`   ~ ${name}: ${maskedOld} → ${maskedNew}`);
      });
    }

    if (changes.removed.length > 0) {
      console.log(`\n❌ Removed (${changes.removed.length}):`);
      changes.removed.forEach(({ name, value }) => {
        const maskedValue = this.maskSensitiveValue(name, value);
        console.log(`   - ${name} = ${maskedValue}`);
      });
    }

    if (changes.unchanged.length > 0) {
      console.log(`\n✓ Unchanged (${changes.unchanged.length}):`);
      changes.unchanged.forEach(({ name }) => {
        console.log(`   = ${name}`);
      });
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const totalChanges = changes.added.length + changes.modified.length + changes.removed.length;
    console.log(`📈 Total Changes: ${totalChanges}`);
    
    return totalChanges > 0;
  }

  /**
   * Mask sensitive values for display
   */
  maskSensitiveValue(name, value) {
    const sensitiveKeywords = ['KEY', 'SECRET', 'PASSWORD', 'TOKEN', 'API'];
    const isSensitive = sensitiveKeywords.some(keyword => 
      name.toUpperCase().includes(keyword)
    );
    
    if (isSensitive && value && value.length > 8) {
      return `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
    }
    
    return value;
  }

  /**
   * Main execution method
   */
  async execute(options = {}) {
    try {
      console.log('🚀 AWS App Runner Environment Updater');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // Parse .env file
      console.log('📖 Reading .env file...');
      const envVars = await this.parseEnvFile();
      console.log(`✅ Parsed ${Object.keys(envVars).length} environment variables`);
      
      // Filter for production
      console.log('🔍 Filtering variables for production...');
      const productionEnvVars = this.filterProductionEnvVars(envVars);
      console.log(`✅ Selected ${productionEnvVars.length} variables for production`);
      
      // Get current service configuration
      console.log('🔍 Getting current service configuration...');
      const currentService = await this.getCurrentServiceConfig();
      const currentEnvVars = currentService.SourceConfiguration?.ImageRepository?.ImageConfiguration?.RuntimeEnvironmentVariables || {};
      console.log(`✅ Current service has ${Object.keys(currentEnvVars).length} environment variables`);
      
      // Compare changes
      const changes = this.compareEnvironmentVariables(currentEnvVars, productionEnvVars);
      const hasChanges = this.displayChangesSummary(changes);
      
      if (!hasChanges) {
        console.log('✅ No changes detected. Service is up to date!');
        return;
      }
      
      // Confirm update unless --force flag is used
      if (!options.force) {
        console.log('\n⚠️  This will update your production App Runner service.');
        console.log('   Use --force flag to skip this confirmation.');
        
        // In a real implementation, you'd want to use readline for user input
        // For now, we'll require the --force flag
        console.log('❌ Update cancelled. Use --force flag to proceed.');
        return;
      }
      
      // Update service
      console.log('\n🔄 Updating App Runner service...');
      const updateResponse = await this.updateServiceConfiguration(productionEnvVars);
      
      console.log('✅ Service update initiated successfully!');
      console.log(`📋 Operation ID: ${updateResponse.OperationId}`);
      console.log(`🔄 Service Status: ${updateResponse.Service.Status}`);
      
      console.log('\n📝 Next Steps:');
      console.log('   1. Monitor the deployment in AWS App Runner console');
      console.log('   2. Verify the application starts correctly');
      console.log('   3. Test critical functionality');
      console.log(`   4. Check service logs for any issues`);
      
    } catch (error) {
      console.error('❌ Error:', error.message);
      throw error;
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const serviceArn = 'arn:aws:apprunner:us-east-1:170023515523:service/wavelength-lore-service/829c542fc95c419090494817f7046eaa';
  
  const options = {
    force: args.includes('--force'),
    dryRun: args.includes('--dry-run')
  };
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('🛠️  AWS App Runner Environment Updater');
    console.log('');
    console.log('Usage: node apprunner-env-updater.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --force     Skip confirmation and apply changes immediately');
    console.log('  --dry-run   Show what would be changed without applying');
    console.log('  --help      Show this help message');
    console.log('');
    console.log('Examples:');
    console.log('  node apprunner-env-updater.js                # Preview changes');
    console.log('  node apprunner-env-updater.js --force        # Apply changes');
    console.log('  node apprunner-env-updater.js --dry-run      # Show changes only');
    return;
  }
  
  const updater = new AppRunnerEnvUpdater(serviceArn);
  await updater.execute(options);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = AppRunnerEnvUpdater;