#!/usr/bin/env node

/**
 * Comprehensive Deployment Monitor
 * Monitors App Runner deployment, Firebase updates, and CDN cache status
 */

const { AppRunnerClient, DescribeServiceCommand } = require('@aws-sdk/client-apprunner');
const { CloudFrontClient, CreateInvalidationCommand, GetInvalidationCommand } = require('@aws-sdk/client-cloudfront');
const axios = require('axios');
require('dotenv').config();

class DeploymentMonitor {
  constructor() {
    this.appRunnerClient = new AppRunnerClient({
      region: 'us-east-1',
      credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID,
        secretAccessKey: process.env.SECRET_ACCESS_KEY
      }
    });
    
    this.cloudFrontClient = new CloudFrontClient({
      region: 'us-east-1',
      credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID,
        secretAccessKey: process.env.SECRET_ACCESS_KEY
      }
    });
    
    this.serviceArn = process.env.APPRUNNER_SERVICE_ARN || 'arn:aws:apprunner:us-east-1:170023515523:service/wavelength-lore-service/829c542fc95c419090494817f7046eaa';
    this.distributionId = process.env.CLOUDFRONT_DISTRIBUTION_ID;
    this.siteUrl = process.env.SITE_URL || 'https://8z7bz9qgwb.us-east-1.awsapprunner.com';
  }

  // Monitor App Runner deployment status
  async monitorAppRunnerDeployment(maxWaitMinutes = 15) {
    console.log('🔍 Monitoring App Runner deployment...');
    const startTime = Date.now();
    const maxWaitTime = maxWaitMinutes * 60 * 1000;
    
    let lastStatus = '';
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        const command = new DescribeServiceCommand({ ServiceArn: this.serviceArn });
        const response = await this.appRunnerClient.send(command);
        const service = response.Service;
        
        const status = service.Status;
        const operationId = service.OperationId;
        
        if (status !== lastStatus) {
          console.log(`📊 App Runner Status: ${status} (Operation: ${operationId})`);
          lastStatus = status;
        }
        
        // Check for completion
        if (status === 'RUNNING') {
          console.log('✅ App Runner deployment completed successfully!');
          console.log(`🌐 Service URL: ${service.ServiceUrl}`);
          return {
            success: true,
            status: 'RUNNING',
            serviceUrl: service.ServiceUrl,
            operationId
          };
        }
        
        // Check for failure
        if (status === 'PAUSED') {
          console.log('❌ App Runner deployment failed!');
          return {
            success: false,
            status: 'PAUSED',
            operationId
          };
        }
        
        // Wait before next check
        await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds
        
      } catch (error) {
        console.error('Error checking App Runner status:', error.message);
        await new Promise(resolve => setTimeout(resolve, 60000)); // 1 minute on error
      }
    }
    
    console.log(`⏰ Timeout reached after ${maxWaitMinutes} minutes`);
    return {
      success: false,
      status: 'TIMEOUT',
      message: `Deployment monitoring timed out after ${maxWaitMinutes} minutes`
    };
  }

  // Test application health
  async testApplicationHealth(retries = 3) {
    console.log('\n🏥 Testing application health...');
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`📡 Health check attempt ${attempt}/${retries}...`);
        
        const response = await axios.get(`${this.siteUrl}/health`, {
          timeout: 30000,
          headers: {
            'User-Agent': 'Deployment-Monitor/1.0'
          }
        });
        
        if (response.status === 200) {
          console.log('✅ Application health check passed!');
          console.log(`📊 Response time: ${response.headers['x-response-time'] || 'N/A'}`);
          
          // Test image optimization endpoint
          const imageTest = await this.testImageOptimization();
          
          return {
            success: true,
            status: response.status,
            responseTime: response.headers['x-response-time'],
            imageOptimization: imageTest
          };
        }
        
      } catch (error) {
        console.log(`❌ Health check attempt ${attempt} failed: ${error.message}`);
        
        if (attempt < retries) {
          console.log('⏱️  Waiting 30 seconds before retry...');
          await new Promise(resolve => setTimeout(resolve, 30000));
        }
      }
    }
    
    return {
      success: false,
      message: `Health check failed after ${retries} attempts`
    };
  }

  // Test optimized image loading
  async testImageOptimization() {
    try {
      console.log('🖼️  Testing WebP image optimization...');
      
      // Test a few sample WebP images
      const testImages = [
        '/static/images/wavelength-og-default.webp',
        '/static/images/seasons/season1/image.webp',
        '/static/images/characters/goblinking/image.webp'
      ];
      
      let successCount = 0;
      const results = [];
      
      for (const imagePath of testImages) {
        try {
          const imageUrl = `${this.siteUrl}${imagePath}`;
          const response = await axios.head(imageUrl, { timeout: 10000 });
          
          if (response.status === 200) {
            successCount++;
            const contentType = response.headers['content-type'];
            const contentLength = response.headers['content-length'];
            
            results.push({
              path: imagePath,
              status: 'success',
              contentType,
              size: contentLength ? parseInt(contentLength) : null
            });
            
            console.log(`  ✅ ${imagePath} - ${contentType} (${contentLength} bytes)`);
          }
          
        } catch (error) {
          results.push({
            path: imagePath,
            status: 'error',
            error: error.message
          });
          console.log(`  ❌ ${imagePath} - ${error.message}`);
        }
      }
      
      const successRate = (successCount / testImages.length) * 100;
      console.log(`📊 WebP optimization test: ${successCount}/${testImages.length} images loaded (${successRate.toFixed(1)}%)`);
      
      return {
        success: successRate >= 100,
        successRate,
        results
      };
      
    } catch (error) {
      console.error('Error testing image optimization:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Invalidate CloudFront cache
  async invalidateCloudFrontCache() {
    if (!this.distributionId) {
      console.log('⚠️  CloudFront distribution ID not configured, skipping cache invalidation');
      return { success: false, message: 'No distribution ID configured' };
    }
    
    console.log('\n🔄 Invalidating CloudFront cache...');
    
    try {
      const invalidationParams = {
        DistributionId: this.distributionId,
        InvalidationBatch: {
          Paths: {
            Quantity: 2,
            Items: [
              '/static/images/*',
              '/*'
            ]
          },
          CallerReference: `deployment-${Date.now()}`
        }
      };
      
      const command = new CreateInvalidationCommand(invalidationParams);
      const response = await this.cloudFrontClient.send(command);
      
      const invalidationId = response.Invalidation.Id;
      console.log(`✅ Cache invalidation initiated: ${invalidationId}`);
      
      // Monitor invalidation progress
      return await this.monitorCacheInvalidation(invalidationId);
      
    } catch (error) {
      console.error('❌ Error invalidating CloudFront cache:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Monitor cache invalidation progress
  async monitorCacheInvalidation(invalidationId, maxWaitMinutes = 10) {
    console.log(`🔍 Monitoring cache invalidation ${invalidationId}...`);
    const startTime = Date.now();
    const maxWaitTime = maxWaitMinutes * 60 * 1000;
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        const command = new GetInvalidationCommand({
          DistributionId: this.distributionId,
          Id: invalidationId
        });
        
        const response = await this.cloudFrontClient.send(command);
        const status = response.Invalidation.Status;
        
        console.log(`📊 Cache invalidation status: ${status}`);
        
        if (status === 'Completed') {
          console.log('✅ Cache invalidation completed!');
          return {
            success: true,
            status: 'Completed',
            invalidationId
          };
        }
        
        await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds
        
      } catch (error) {
        console.error('Error checking invalidation status:', error.message);
        break;
      }
    }
    
    return {
      success: false,
      status: 'TIMEOUT',
      message: `Cache invalidation monitoring timed out after ${maxWaitMinutes} minutes`
    };
  }

  // Comprehensive deployment monitoring
  async monitorDeployment() {
    console.log('🚀 Starting comprehensive deployment monitoring...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const deploymentResults = {
      appRunner: null,
      health: null,
      cache: null,
      startTime: new Date().toISOString(),
      endTime: null
    };
    
    try {
      // 1. Monitor App Runner deployment
      deploymentResults.appRunner = await this.monitorAppRunnerDeployment();
      
      if (!deploymentResults.appRunner.success) {
        console.log('❌ App Runner deployment failed, stopping monitoring');
        return deploymentResults;
      }
      
      // 2. Test application health
      deploymentResults.health = await this.testApplicationHealth();
      
      // 3. Invalidate cache (regardless of health check result)
      deploymentResults.cache = await this.invalidateCloudFrontCache();
      
      deploymentResults.endTime = new Date().toISOString();
      
      // Final summary
      this.printDeploymentSummary(deploymentResults);
      
      return deploymentResults;
      
    } catch (error) {
      console.error('❌ Error during deployment monitoring:', error);
      deploymentResults.error = error.message;
      deploymentResults.endTime = new Date().toISOString();
      return deploymentResults;
    }
  }

  // Print deployment summary
  printDeploymentSummary(results) {
    console.log('\n📊 Deployment Summary');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log(`🕐 Start Time: ${results.startTime}`);
    console.log(`🕐 End Time: ${results.endTime}`);
    
    // App Runner
    const appRunnerStatus = results.appRunner?.success ? '✅' : '❌';
    console.log(`${appRunnerStatus} App Runner: ${results.appRunner?.status || 'ERROR'}`);
    
    // Health Check
    const healthStatus = results.health?.success ? '✅' : '❌';
    console.log(`${healthStatus} Health Check: ${results.health?.success ? 'PASSED' : 'FAILED'}`);
    
    // Image Optimization
    if (results.health?.imageOptimization) {
      const imgStatus = results.health.imageOptimization.success ? '✅' : '⚠️';
      console.log(`${imgStatus} WebP Images: ${results.health.imageOptimization.successRate?.toFixed(1) || 0}% loaded`);
    }
    
    // Cache Invalidation
    const cacheStatus = results.cache?.success ? '✅' : (results.cache ? '❌' : '⚠️');
    console.log(`${cacheStatus} Cache Invalidation: ${results.cache?.status || 'SKIPPED'}`);
    
    // Overall Status
    const overallSuccess = results.appRunner?.success && results.health?.success;
    const overallStatus = overallSuccess ? '🎉 DEPLOYMENT SUCCESSFUL' : '⚠️ DEPLOYMENT ISSUES DETECTED';
    
    console.log('\n' + overallStatus);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (overallSuccess) {
      console.log('🚀 Your optimized site is now live with WebP images!');
      console.log(`🌐 Visit: ${this.siteUrl}`);
    } else {
      console.log('⚠️  Please check the issues above and verify deployment manually');
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const monitor = new DeploymentMonitor();
  
  if (args.includes('--app-runner-only')) {
    console.log('🔍 Monitoring App Runner deployment only...');
    await monitor.monitorAppRunnerDeployment();
  } else if (args.includes('--health-only')) {
    console.log('🏥 Testing application health only...');
    await monitor.testApplicationHealth();
  } else if (args.includes('--cache-only')) {
    console.log('🔄 Invalidating cache only...');
    await monitor.invalidateCloudFrontCache();
  } else {
    // Full monitoring
    await monitor.monitorDeployment();
  }
}

// Export for use in other scripts
module.exports = DeploymentMonitor;

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}