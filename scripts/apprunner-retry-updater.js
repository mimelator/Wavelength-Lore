#!/usr/bin/env node

/**
 * App Runner Environment Update Retry Script
 * 
 * Monitors App Runner service status and retries environment updates
 * when the service is in a stable state that allows configuration changes.
 */

const { AppRunnerClient, DescribeServiceCommand } = require('@aws-sdk/client-apprunner');
const { spawn } = require('child_process');
const path = require('path');

// Load AWS configuration
const awsConfig = require('../config/aws-resources');

class AppRunnerRetryUpdater {
  constructor(serviceArn) {
    this.serviceArn = serviceArn;
    this.appRunnerClient = new AppRunnerClient({
      region: 'us-east-1',
      credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID,
        secretAccessKey: process.env.SECRET_ACCESS_KEY
      }
    });
    
    // Configuration
    this.maxRetries = 20;           // Maximum number of retry attempts
    this.baseRetryInterval = 30;    // Base retry interval in seconds
    this.maxRetryInterval = 300;    // Maximum retry interval in seconds (5 minutes)
    this.currentRetry = 0;
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
        operationId: response.Service.OperationId,
        updatedAt: response.Service.UpdatedAt
      };
    } catch (error) {
      throw new Error(`Failed to get service status: ${error.message}`);
    }
  }

  /**
   * Check if service is in a state that allows configuration updates
   */
  isServiceUpdateable(status) {
    const updateableStatuses = [
      'RUNNING',           // Service is running normally
      'CREATE_FAILED',     // Can retry updates on failed services
      'UPDATE_FAILED'      // Can retry updates on failed updates
    ];
    
    const nonUpdateableStatuses = [
      'OPERATION_IN_PROGRESS',  // Currently updating/deploying
      'PAUSED',                 // Service is paused
      'DELETED'                 // Service is deleted
    ];
    
    return updateableStatuses.includes(status);
  }

  /**
   * Calculate retry interval with exponential backoff
   */
  getRetryInterval() {
    const exponentialBackoff = Math.min(
      this.baseRetryInterval * Math.pow(2, this.currentRetry),
      this.maxRetryInterval
    );
    
    // Add some jitter (±25%) to avoid thundering herd
    const jitter = exponentialBackoff * 0.25 * (Math.random() - 0.5);
    return Math.round(exponentialBackoff + jitter);
  }

  /**
   * Run the apprunner-env-updater.js script
   */
  async runEnvUpdater() {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(__dirname, 'apprunner-env-updater.js');
      const child = spawn('node', [scriptPath, '--force'], {
        stdio: 'pipe',
        cwd: __dirname
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        process.stdout.write(output); // Real-time output
      });

      child.stderr.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        process.stderr.write(output); // Real-time errors
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, stdout, stderr });
        } else {
          reject(new Error(`Environment updater failed with exit code ${code}\nSTDOUT: ${stdout}\nSTDERR: ${stderr}`));
        }
      });

      child.on('error', (error) => {
        reject(new Error(`Failed to spawn environment updater: ${error.message}`));
      });
    });
  }

  /**
   * Sleep for specified number of seconds
   */
  sleep(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
  }

  /**
   * Format time duration
   */
  formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  }

  /**
   * Main retry loop
   */
  async execute() {
    console.log('🔄 App Runner Environment Update Retry Script');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📋 Service ARN: ${this.serviceArn}`);
    console.log(`🔧 Max Retries: ${this.maxRetries}`);
    console.log(`⏱️  Base Interval: ${this.baseRetryInterval}s`);
    console.log(`⏱️  Max Interval: ${this.maxRetryInterval}s`);
    console.log('');

    const startTime = Date.now();

    while (this.currentRetry < this.maxRetries) {
      try {
        this.currentRetry++;
        console.log(`🔍 Attempt ${this.currentRetry}/${this.maxRetries} - Checking service status...`);
        
        // Check service status
        const serviceInfo = await this.getServiceStatus();
        console.log(`📊 Service Status: ${serviceInfo.status}`);
        
        if (serviceInfo.operationId) {
          console.log(`🔄 Operation ID: ${serviceInfo.operationId}`);
        }

        // Check if service is updateable
        if (this.isServiceUpdateable(serviceInfo.status)) {
          console.log('✅ Service is ready for configuration updates!');
          console.log('🚀 Running environment updater...');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          
          try {
            await this.runEnvUpdater();
            
            const totalTime = Math.round((Date.now() - startTime) / 1000);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('✅ Environment update completed successfully!');
            console.log(`⏱️  Total time: ${this.formatDuration(totalTime)}`);
            console.log(`🔄 Attempts: ${this.currentRetry}`);
            console.log('');
            console.log('📝 Next Steps:');
            console.log('   1. Monitor App Runner console for deployment progress');
            console.log('   2. Test the application once deployment completes');
            console.log('   3. Check diagnostic endpoints: /diagnostic/firebase');
            
            return true;
            
          } catch (error) {
            console.error('❌ Environment update failed:', error.message);
            
            // If it's a service state error, continue retrying
            if (error.message.includes('OPERATION_IN_PROGRESS') || 
                error.message.includes('service is not in a valid state')) {
              console.log('⚠️  Service entered busy state during update, will retry...');
            } else {
              // For other errors, we might want to continue retrying
              console.log('⚠️  Update failed, will retry...');
            }
          }
        } else {
          console.log(`⏳ Service is busy (${serviceInfo.status}), waiting for stable state...`);
          
          // Provide helpful status explanations
          switch (serviceInfo.status) {
            case 'OPERATION_IN_PROGRESS':
              console.log('   📝 Service is currently updating or deploying');
              break;
            case 'PAUSED':
              console.log('   ⏸️  Service is paused - may need manual intervention');
              break;
            case 'CREATE_FAILED':
              console.log('   ❌ Service creation failed - will retry when possible');
              break;
            case 'UPDATE_FAILED':
              console.log('   ❌ Previous update failed - will retry');
              break;
          }
        }

        // Calculate and display retry timing
        if (this.currentRetry < this.maxRetries) {
          const retryInterval = this.getRetryInterval();
          console.log(`⏰ Retrying in ${this.formatDuration(retryInterval)}...`);
          console.log('');
          
          await this.sleep(retryInterval);
        }

      } catch (error) {
        console.error('❌ Error checking service status:', error.message);
        
        if (this.currentRetry < this.maxRetries) {
          const retryInterval = this.getRetryInterval();
          console.log(`⏰ Retrying in ${this.formatDuration(retryInterval)}...`);
          console.log('');
          
          await this.sleep(retryInterval);
        }
      }
    }

    // Max retries exceeded
    const totalTime = Math.round((Date.now() - startTime) / 1000);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('❌ Maximum retries exceeded');
    console.log(`⏱️  Total time: ${this.formatDuration(totalTime)}`);
    console.log(`🔄 Attempts: ${this.currentRetry}`);
    console.log('');
    console.log('🛠️  Manual Steps:');
    console.log('   1. Check App Runner console for service issues');
    console.log('   2. Wait for rollback to complete');
    console.log('   3. Run this script again or update manually');
    
    return false;
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('🔄 App Runner Environment Update Retry Script');
    console.log('');
    console.log('Usage: node apprunner-retry-updater.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --help      Show this help message');
    console.log('');
    console.log('This script will:');
    console.log('  1. Monitor App Runner service status');
    console.log('  2. Wait for the service to be in a stable state');
    console.log('  3. Automatically run the environment updater');
    console.log('  4. Retry with exponential backoff if needed');
    console.log('');
    console.log('Examples:');
    console.log('  node apprunner-retry-updater.js              # Run with default settings');
    return;
  }
  
  const serviceArn = awsConfig.appRunner.serviceArn;
  const retryUpdater = new AppRunnerRetryUpdater(serviceArn);
  
  const success = await retryUpdater.execute();
  process.exit(success ? 0 : 1);
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n⚠️  Received interrupt signal, exiting gracefully...');
  process.exit(1);
});

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = AppRunnerRetryUpdater;