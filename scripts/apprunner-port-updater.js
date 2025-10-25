#!/usr/bin/env node

/**
 * AWS App Runner Port Configuration Updater
 * Updates App Runner service ImageConfiguration port to match PORT environment variable
 */

const { AppRunnerClient, DescribeServiceCommand, UpdateServiceCommand } = require('@aws-sdk/client-apprunner');
require('dotenv').config();

const SERVICE_ARN = process.env.APPRUNNER_SERVICE_ARN;
const TARGET_PORT = process.env.PORT || "8080";

class AppRunnerPortUpdater {
  constructor() {
    this.appRunnerClient = new AppRunnerClient({
      region: 'us-east-1',
      credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID,
        secretAccessKey: process.env.SECRET_ACCESS_KEY
      }
    });
  }

  async getCurrentConfig() {
    console.log('🔍 Getting current service configuration...');
    const command = new DescribeServiceCommand({
      ServiceArn: SERVICE_ARN
    });
    
    const response = await this.appRunnerClient.send(command);
    return response.Service;
  }

  async updateServicePort() {
    try {
      console.log('🚀 AWS App Runner Port Configuration Updater');
      console.log('━'.repeat(50));
      
      const service = await this.getCurrentConfig();
      const currentConfig = service.SourceConfiguration.ImageRepository.ImageConfiguration;
      const currentPort = currentConfig.Port;
      
      console.log(`📊 Current Configuration:`);
      console.log(`   Current Port: ${currentPort}`);
      console.log(`   Target Port:  ${TARGET_PORT}`);
      
      if (currentPort === TARGET_PORT) {
        console.log(`✅ Port is already correctly set to ${TARGET_PORT}`);
        return;
      }
      
      console.log(`🔄 Updating service port from ${currentPort} to ${TARGET_PORT}...`);
      
      // Build the update configuration
      const updateConfig = {
        ServiceArn: SERVICE_ARN,
        SourceConfiguration: {
          ImageRepository: {
            ImageIdentifier: service.SourceConfiguration.ImageRepository.ImageIdentifier,
            ImageConfiguration: {
              ...currentConfig,
              Port: TARGET_PORT,
              RuntimeEnvironmentVariables: {
                ...currentConfig.RuntimeEnvironmentVariables,
                PORT: TARGET_PORT,
                NODE_PORT: "3001",
                NGINX_PORT: TARGET_PORT
              }
            },
            ImageRepositoryType: service.SourceConfiguration.ImageRepository.ImageRepositoryType
          },
          AutoDeploymentsEnabled: service.SourceConfiguration.AutoDeploymentsEnabled
        }
      };
      
      const updateCommand = new UpdateServiceCommand(updateConfig);
      const updateResponse = await this.appRunnerClient.send(updateCommand);
      
      console.log(`✅ Service port update initiated successfully!`);
      console.log(`📋 Operation ID: ${updateResponse.OperationId}`);
      console.log(`🔄 Service Status: ${updateResponse.Service.Status}`);
      
      console.log('\n📝 Configuration Updated:');
      console.log(`   🔌 App Runner Port: ${currentPort} → ${TARGET_PORT}`);
      console.log(`   🌐 Environment PORT: ${TARGET_PORT}`);
      console.log(`   📡 Node.js Port: 3001 (internal)`);
      console.log(`   🌍 Nginx Port: ${TARGET_PORT} (external)`);
      
      console.log('\n📝 Next Steps:');
      console.log('   1. Monitor the deployment in AWS App Runner console');
      console.log('   2. Health checks will now target the correct port');
      console.log('   3. Verify application accessibility');
      console.log('   4. Check service logs for startup confirmation');
      
    } catch (error) {
      console.error('❌ Error updating App Runner service port:', error.message);
      if (error.Code) {
        console.error(`   Code: ${error.Code}`);
      }
      process.exit(1);
    }
  }
}

// CLI execution
if (require.main === module) {
  const updater = new AppRunnerPortUpdater();
  updater.updateServicePort();
}

module.exports = AppRunnerPortUpdater;