#!/usr/bin/env node

/**
 * Tail App Runner CloudWatch logs in real-time
 * Shows the latest logs from the application
 */

require('dotenv').config();
const { CloudWatchLogsClient, FilterLogEventsCommand } = require('@aws-sdk/client-cloudwatch-logs');
const awsConfig = require('../config/aws-resources');

const client = new CloudWatchLogsClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.aws_wavelength_dev_access_key_id,
    secretAccessKey: process.env.aws_wavelength_dev_secret_access_key
  }
});

// Extract service ID from ARN to build log group name
const serviceId = awsConfig.appRunner.serviceArn.split('/').pop();
const LOG_GROUP = `/aws/apprunner/wavelength-lore-service/${serviceId}/application`;

async function tailLogs() {
  try {
    console.log('📋 Tailing App Runner Logs');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`Log Group: ${LOG_GROUP}\n`);

    // Get logs from the last 10 minutes
    const startTime = Date.now() - (10 * 60 * 1000);

    const command = new FilterLogEventsCommand({
      logGroupName: LOG_GROUP,
      startTime: startTime,
      limit: 100
    });

    console.log('Fetching recent logs...\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const response = await client.send(command);

    if (!response.events || response.events.length === 0) {
      console.log('⚠️  No recent logs found in the last 10 minutes.');
      console.log('\nPossible reasons:');
      console.log('  1. Container hasn\'t started yet');
      console.log('  2. Deployment is still pulling the image');
      console.log('  3. Container is failing before it can log');
      return;
    }

    console.log(`📊 Found ${response.events.length} log entries:\n`);

    response.events.forEach(event => {
      const timestamp = new Date(event.timestamp).toLocaleTimeString();
      const message = event.message.trim();

      // Highlight important messages
      if (message.includes('Container Starting') || message.includes('===')) {
        console.log(`\n🚀 [${timestamp}] ${message}`);
      } else if (message.includes('ERROR') || message.includes('Error')) {
        console.log(`\n❌ [${timestamp}] ${message}`);
      } else if (message.includes('started') || message.includes('Successfully')) {
        console.log(`\n✅ [${timestamp}] ${message}`);
      } else if (message.includes('Production mode')) {
        console.log(`\n🎯 [${timestamp}] ${message}`);
      } else {
        console.log(`   [${timestamp}] ${message}`);
      }
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Show summary
    const hasContainerStart = response.events.some(e => e.message.includes('Container Starting'));
    const hasNginxStart = response.events.some(e => e.message.includes('Nginx started'));
    const hasNodeStart = response.events.some(e => e.message.includes('Server started') || e.message.includes('Production mode'));
    const hasErrors = response.events.some(e => e.message.includes('ERROR') || e.message.includes('Error'));

    console.log('📊 Status Summary:');
    console.log(`   Container startup: ${hasContainerStart ? '✅ Started' : '❌ Not detected'}`);
    console.log(`   Nginx: ${hasNginxStart ? '✅ Running' : '⚠️  Not detected'}`);
    console.log(`   Node.js app: ${hasNodeStart ? '✅ Running' : '⚠️  Not detected'}`);
    console.log(`   Errors: ${hasErrors ? '❌ Errors found!' : '✅ No errors'}`);

  } catch (error) {
    console.error('❌ Error fetching logs:', error.message);

    if (error.message.includes('ResourceNotFoundException')) {
      console.error('\n⚠️  Log group not found or no permissions to access it.');
      console.error('The log group name might be incorrect or logs may not exist yet.');
    }

    process.exit(1);
  }
}

tailLogs();
