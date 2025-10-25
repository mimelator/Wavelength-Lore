#!/usr/bin/env node

require('dotenv').config();
const { AppRunnerClient, DescribeServiceCommand, StartDeploymentCommand } = require('@aws-sdk/client-apprunner');
const awsConfig = require('../config/aws-resources');

const client = new AppRunnerClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY
  }
});

async function triggerDeployment() {
  try {
    console.log('🔍 Checking App Runner Service Status...\n');
    
    const describeCommand = new DescribeServiceCommand({
      ServiceArn: awsConfig.appRunner.serviceArn
    });
    
    const response = await client.send(describeCommand);
    const service = response.Service;
    
    console.log(`📊 Service: ${service.ServiceName}`);
    console.log(`   Status: ${service.Status}`);
    console.log(`   Last Updated: ${service.UpdatedAt}`);
    console.log(`   Environment Variables: ${Object.keys(service.SourceConfiguration?.ImageRepository?.ImageConfiguration?.RuntimeEnvironmentVariables || {}).length}`);
    
    console.log('\n⚠️  The environment variables are configured but not being passed to the container.');
    console.log('This usually means the service needs to be redeployed.\n');
    
    console.log('🚀 Triggering new deployment...');
    
    const deployCommand = new StartDeploymentCommand({
      ServiceArn: awsConfig.appRunner.serviceArn
    });
    
    const deployResponse = await client.send(deployCommand);
    
    console.log('✅ Deployment triggered successfully!');
    console.log(`   Operation ID: ${deployResponse.OperationId}`);
    console.log(`\n📝 Monitor deployment:`);
    console.log(`   AWS Console → App Runner → ${service.ServiceName} → Activity`);
    console.log(`   Or run: node scripts/apprunner-deploy-monitor.js`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('AccessDenied') || error.message.includes('UnauthorizedException')) {
      console.log('\n💡 Your IAM user needs apprunner:StartDeployment permission.');
      console.log('   Add this to your IAM policy in AWS Console.');
    }
    process.exit(1);
  }
}

if (process.argv.includes('--force')) {
  triggerDeployment();
} else {
  console.log('🔄 App Runner Deployment Trigger');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('This will trigger a new deployment of your App Runner service.');
  console.log('This is needed to apply environment variable changes.\n');
  console.log('Run with --force to proceed:');
  console.log('  node scripts/trigger-apprunner-deployment.js --force\n');
}
