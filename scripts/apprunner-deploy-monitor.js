#!/usr/bin/env node

/**
 * AWS App Runner Deployment Monitor
 * Forces a redeploy and monitors the deployment status until completion
 */

const { AppRunnerClient, UpdateServiceCommand, DescribeServiceCommand } = require('@aws-sdk/client-apprunner');
const fs = require('fs').promises;
const path = require('path');

class AppRunnerDeploymentMonitor {
  constructor(serviceArn) {
    this.serviceArn = serviceArn;
    this.appRunnerClient = new AppRunnerClient({
      region: 'us-east-1',
      credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID,
        secretAccessKey: process.env.SECRET_ACCESS_KEY
      }
    });
    this.pollInterval = 30000; // 30 seconds
    this.maxWaitTime = 1800000; // 30 minutes
  }

  /**
   * Get current service configuration and status
   */
  async getServiceStatus() {
    try {
      const command = new DescribeServiceCommand({
        ServiceArn: this.serviceArn
      });
      
      const response = await this.appRunnerClient.send(command);
      return response.Service;
    } catch (error) {
      throw new Error(`Failed to get service status: ${error.message}`);
    }
  }

  /**
   * Force a redeploy by triggering an update
   */
  async forceRedeploy(reason = 'Manual redeploy triggered') {
    try {
      console.log('🚀 Forcing App Runner Service Redeploy');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      const currentService = await this.getServiceStatus();
      
      console.log(`📋 Service: ${currentService.ServiceName}`);
      console.log(`🔗 ARN: ${this.serviceArn}`);
      console.log(`📊 Current Status: ${currentService.Status}`);
      console.log(`💬 Reason: ${reason}`);
      
      // If service is already updating, we'll just monitor it
      if (currentService.Status === 'OPERATION_IN_PROGRESS') {
        console.log('⚠️  Service is already updating. Monitoring existing deployment...');
        return { isNewDeployment: false, service: currentService };
      }
      
      // Force update by updating the service configuration
      // We'll update a harmless setting to trigger redeploy
      const updateParams = {
        ServiceArn: this.serviceArn,
        SourceConfiguration: {
          ImageRepository: {
            ...currentService.SourceConfiguration.ImageRepository,
            // Force update by ensuring auto deployments are enabled
            ImageConfiguration: {
              ...currentService.SourceConfiguration.ImageRepository.ImageConfiguration,
              // Add a timestamp to force update (this will be ignored but triggers redeploy)
              StartCommand: currentService.SourceConfiguration.ImageRepository.ImageConfiguration.StartCommand || ''
            }
          },
          AutoDeploymentsEnabled: true // Ensure auto deployments are enabled
        }
      };

      console.log('\n🔄 Triggering redeploy...');
      const command = new UpdateServiceCommand(updateParams);
      const response = await this.appRunnerClient.send(command);
      
      console.log(`✅ Redeploy initiated successfully!`);
      console.log(`📋 Operation ID: ${response.OperationId}`);
      
      return { isNewDeployment: true, operationId: response.OperationId, service: response.Service };
    } catch (error) {
      throw new Error(`Failed to force redeploy: ${error.message}`);
    }
  }

  /**
   * Monitor deployment progress
   */
  async monitorDeployment(startTime = Date.now()) {
    const elapsedTime = Date.now() - startTime;
    
    if (elapsedTime > this.maxWaitTime) {
      throw new Error('Deployment monitoring timed out after 30 minutes');
    }

    try {
      const service = await this.getServiceStatus();
      const status = service.Status;
      const timestamp = new Date().toLocaleTimeString();
      
      // Clear line and update status
      process.stdout.write(`\r⏱️  [${timestamp}] Status: ${this.formatStatus(status)} (${Math.floor(elapsedTime / 1000)}s elapsed)`);
      
      switch (status) {
        case 'RUNNING':
          console.log('\n✅ Deployment completed successfully!');
          return { success: true, status, service, elapsedTime };
          
        case 'CREATE_FAILED':
        case 'UPDATE_FAILED':
        case 'DELETE_FAILED':
          console.log(`\n❌ Deployment failed with status: ${status}`);
          return { success: false, status, service, elapsedTime };
          
        case 'OPERATION_IN_PROGRESS':
          // Continue monitoring
          await this.sleep(this.pollInterval);
          return this.monitorDeployment(startTime);
          
        case 'PAUSED':
          console.log('\n⏸️  Service is paused. Manual intervention may be required.');
          return { success: false, status, service, elapsedTime };
          
        default:
          // Continue monitoring for unknown statuses
          await this.sleep(this.pollInterval);
          return this.monitorDeployment(startTime);
      }
    } catch (error) {
      console.log(`\n❌ Error monitoring deployment: ${error.message}`);
      throw error;
    }
  }

  /**
   * Format status for display
   */
  formatStatus(status) {
    const statusEmojis = {
      'RUNNING': '🟢 RUNNING',
      'OPERATION_IN_PROGRESS': '🟡 DEPLOYING',
      'CREATE_FAILED': '🔴 CREATE_FAILED', 
      'UPDATE_FAILED': '🔴 UPDATE_FAILED',
      'DELETE_FAILED': '🔴 DELETE_FAILED',
      'PAUSED': '⏸️  PAUSED'
    };
    
    return statusEmojis[status] || `🔄 ${status}`;
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get service health information
   */
  async getServiceHealth(service) {
    const health = {
      serviceUrl: service.ServiceUrl,
      status: service.Status,
      createdAt: service.CreatedAt,
      updatedAt: service.UpdatedAt,
      cpu: service.InstanceConfiguration?.Cpu,
      memory: service.InstanceConfiguration?.Memory,
      autoScaling: {
        minSize: service.AutoScalingConfigurationSummary?.MinSize,
        maxSize: service.AutoScalingConfigurationSummary?.MaxSize
      }
    };

    return health;
  }

  /**
   * Test service connectivity
   */
  async testServiceConnectivity(serviceUrl, maxRetries = 3) {
    console.log(`\n🔍 Testing service connectivity...`);
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`   Attempt ${attempt}/${maxRetries}: Testing ${serviceUrl}`);
        
        // Use curl to test the service
        const { spawn } = require('child_process');
        const curlResult = await new Promise((resolve, reject) => {
          const curl = spawn('curl', [
            '-s', '-o', '/dev/null', '-w', '%{http_code}',
            '--max-time', '30',
            serviceUrl
          ]);
          
          let output = '';
          curl.stdout.on('data', (data) => {
            output += data.toString();
          });
          
          curl.on('close', (code) => {
            resolve({ code, httpStatus: parseInt(output) });
          });
          
          curl.on('error', reject);
        });
        
        if (curlResult.httpStatus === 200) {
          console.log(`   ✅ Service is responding (HTTP ${curlResult.httpStatus})`);
          return true;
        } else if (curlResult.httpStatus >= 400) {
          console.log(`   ⚠️  Service responded but with error (HTTP ${curlResult.httpStatus})`);
        } else {
          console.log(`   ❌ Service not responding (HTTP ${curlResult.httpStatus})`);
        }
        
        if (attempt < maxRetries) {
          console.log(`   ⏳ Waiting 10 seconds before retry...`);
          await this.sleep(10000);
        }
      } catch (error) {
        console.log(`   ❌ Connection test failed: ${error.message}`);
        if (attempt < maxRetries) {
          console.log(`   ⏳ Waiting 10 seconds before retry...`);
          await this.sleep(10000);
        }
      }
    }
    
    return false;
  }

  /**
   * Display deployment summary
   */
  async displayDeploymentSummary(result) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Deployment Summary');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const health = await this.getServiceHealth(result.service);
    
    console.log(`🎯 Final Status: ${this.formatStatus(result.status)}`);
    console.log(`⏱️  Total Time: ${Math.floor(result.elapsedTime / 1000)} seconds`);
    console.log(`🌐 Service URL: ${health.serviceUrl}`);
    console.log(`💾 CPU/Memory: ${health.cpu}/${health.memory}`);
    console.log(`📈 Auto Scaling: ${health.autoScaling.minSize}-${health.autoScaling.maxSize} instances`);
    
    if (result.success) {
      console.log('\n🎉 Deployment completed successfully!');
      
      // Test connectivity
      const isConnected = await this.testServiceConnectivity(health.serviceUrl);
      
      if (isConnected) {
        console.log('\n✅ Service is healthy and responding to requests');
      } else {
        console.log('\n⚠️  Service deployed but may not be fully ready yet');
        console.log('   Try accessing the service URL in a few minutes');
      }
      
      console.log('\n📝 Next Steps:');
      console.log(`   1. Visit your service: ${health.serviceUrl}`);
      console.log(`   2. Check application logs in AWS CloudWatch`);
      console.log(`   3. Monitor service metrics in AWS Console`);
      console.log(`   4. Test critical functionality`);
    } else {
      console.log('\n❌ Deployment failed');
      console.log('\n🔧 Troubleshooting Steps:');
      console.log('   1. Check AWS App Runner service logs');
      console.log('   2. Verify Docker container builds successfully');
      console.log('   3. Check environment variables configuration');
      console.log('   4. Review service settings in AWS Console');
    }
  }

  /**
   * Main execution method
   */
  async execute(options = {}) {
    try {
      // Load environment variables
      require('dotenv').config();
      
      const reason = options.reason || 'Manual redeploy via deployment monitor';
      
      // Force redeploy
      const deployResult = await this.forceRedeploy(reason);
      
      if (!deployResult.isNewDeployment) {
        console.log('\n📊 Monitoring existing deployment...');
      }
      
      console.log('\n🔄 Monitoring deployment progress...');
      console.log('   (Press Ctrl+C to stop monitoring, deployment will continue)');
      console.log('');
      
      // Monitor the deployment
      const result = await this.monitorDeployment();
      
      // Display summary
      await this.displayDeploymentSummary(result);
      
      return result;
    } catch (error) {
      console.error('\n❌ Deployment monitor error:', error.message);
      throw error;
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const serviceArn = 'arn:aws:apprunner:us-east-1:170023515523:service/wavelength-lore-service/829c542fc95c419090494817f7046eaa';
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('🚀 AWS App Runner Deployment Monitor');
    console.log('');
    console.log('Usage: node apprunner-deploy-monitor.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --reason "text"  Custom reason for deployment');
    console.log('  --help           Show this help message');
    console.log('');
    console.log('Examples:');
    console.log('  node apprunner-deploy-monitor.js');
    console.log('  node apprunner-deploy-monitor.js --reason "Fix production bug"');
    return;
  }
  
  const reasonIndex = args.indexOf('--reason');
  const reason = reasonIndex !== -1 && args[reasonIndex + 1] ? args[reasonIndex + 1] : undefined;
  
  const options = { reason };
  
  const monitor = new AppRunnerDeploymentMonitor(serviceArn);
  
  // Handle Ctrl+C gracefully
  process.on('SIGINT', () => {
    console.log('\n\n⚠️  Monitoring stopped by user. Deployment will continue in AWS.');
    console.log('   Check AWS App Runner console for deployment status.');
    process.exit(0);
  });
  
  try {
    const result = await monitor.execute(options);
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = AppRunnerDeploymentMonitor;