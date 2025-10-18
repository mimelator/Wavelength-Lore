#!/usr/bin/env node

/**
 * Production Port Fix
 * Forces correct port configuration and redeploys
 */

const AppRunnerEnvUpdater = require('./apprunner-env-updater');
const AppRunnerDeploymentMonitor = require('./apprunner-deploy-monitor');

async function main() {
  try {
    require('dotenv').config();
    
    console.log('🔧 Production Port Configuration Fix');
    console.log('═══════════════════════════════════════════════════════════════');
    
    const serviceArn = 'arn:aws:apprunner:us-east-1:170023515523:service/wavelength-lore-service/829c542fc95c419090494817f7046eaa';
    const updater = new AppRunnerEnvUpdater(serviceArn);
    
    // Get current service configuration
    console.log('📡 Getting current service configuration...');
    const currentService = await updater.getCurrentServiceConfig();
    const envVars = currentService.SourceConfiguration?.ImageRepository?.ImageConfiguration?.RuntimeEnvironmentVariables || {};
    
    console.log(`📊 Service: ${currentService.ServiceName}`);
    console.log(`🔄 Status: ${currentService.Status}`);
    
    // Check current port configuration
    console.log('\n🔍 Current Port Configuration:');
    console.log(`  PORT: ${envVars.PORT || 'NOT SET'}`);
    console.log(`  NODE_PORT: ${envVars.NODE_PORT || 'NOT SET'}`);
    console.log(`  NGINX_PORT: ${envVars.NGINX_PORT || 'NOT SET'}`);
    
    // Create the correct configuration
    const newEnvVars = { ...envVars };
    let changes = [];
    
    // Explicitly set PORT to 3001 to override App Runner's automatic PORT=8080
    if (newEnvVars.PORT !== '3001') {
      newEnvVars.PORT = '3001';
      changes.push('✅ Set PORT=3001 (override App Runner default)');
    }
    
    // Ensure NODE_PORT is set
    if (newEnvVars.NODE_PORT !== '3001') {
      newEnvVars.NODE_PORT = '3001';
      changes.push('✅ Set NODE_PORT=3001');
    }
    
    // Ensure NGINX_PORT is set
    if (newEnvVars.NGINX_PORT !== '8080') {
      newEnvVars.NGINX_PORT = '8080';
      changes.push('✅ Set NGINX_PORT=8080');
    }
    
    if (changes.length === 0) {
      console.log('\n✅ Port configuration already correct');
      console.log('🤔 The issue might be elsewhere. Check:');
      console.log('   • Docker container startup logs');
      console.log('   • Nginx configuration generation');
      console.log('   • Application startup process');
      return;
    }
    
    console.log('\n📝 Changes to Apply:');
    changes.forEach(change => console.log(`  ${change}`));
    
    // Apply the fix
    console.log('\n🚀 Applying port configuration fix...');
    
    const updateParams = {
      ServiceArn: serviceArn,
      SourceConfiguration: {
        ImageRepository: {
          ...currentService.SourceConfiguration.ImageRepository,
          ImageConfiguration: {
            ...currentService.SourceConfiguration.ImageRepository.ImageConfiguration,
            RuntimeEnvironmentVariables: newEnvVars
          }
        },
        AutoDeploymentsEnabled: currentService.SourceConfiguration.AutoDeploymentsEnabled
      }
    };
    
    const { AppRunnerClient, UpdateServiceCommand } = require('@aws-sdk/client-apprunner');
    const appRunnerClient = new AppRunnerClient({
      region: 'us-east-1',
      credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID,
        secretAccessKey: process.env.SECRET_ACCESS_KEY
      }
    });
    
    const command = new UpdateServiceCommand(updateParams);
    const response = await appRunnerClient.send(command);
    
    console.log('✅ Port configuration updated successfully!');
    console.log(`📋 Operation ID: ${response.OperationId}`);
    
    // Monitor the deployment
    console.log('\n🔄 Monitoring deployment...');
    const monitor = new AppRunnerDeploymentMonitor(serviceArn);
    const result = await monitor.monitorDeployment();
    
    if (result.success) {
      console.log('\n🎉 Port fix deployed successfully!');
      console.log('✅ Node.js should now run on port 3001');
      console.log('✅ Nginx should proxy correctly from 8080 to 3001');
      console.log('✅ 502 Bad Gateway errors should be resolved');
    } else {
      console.log('\n❌ Deployment failed');
      console.log('🔧 Check service logs for details');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();