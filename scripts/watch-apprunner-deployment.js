#!/usr/bin/env node

/**
 * Watch App Runner deployment in real-time
 * Polls CloudWatch logs every 10 seconds for new entries
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
let lastSeenTimestamp = Date.now() - (5 * 60 * 1000); // Start from 5 minutes ago

async function fetchNewLogs() {
  try {
    const command = new FilterLogEventsCommand({
      logGroupName: LOG_GROUP,
      startTime: lastSeenTimestamp,
      limit: 100
    });

    const response = await client.send(command);

    if (response.events && response.events.length > 0) {
      response.events.forEach(event => {
        // Update last seen timestamp
        if (event.timestamp > lastSeenTimestamp) {
          lastSeenTimestamp = event.timestamp + 1;
        }

        const timestamp = new Date(event.timestamp).toLocaleTimeString();
        const message = event.message.trim();

        // Color code important messages
        if (message.includes('Container Starting') || message.includes('===')) {
          console.log(`\n🚀 [${timestamp}] ${message}`);
        } else if (message.includes('ERROR') || message.includes('Error') || message.includes('error')) {
          console.log(`\n❌ [${timestamp}] ${message}`);
        } else if (message.includes('started') || message.includes('Successfully') || message.includes('successfully')) {
          console.log(`✅ [${timestamp}] ${message}`);
        } else if (message.includes('Production mode') || message.includes('NODE_ENV')) {
          console.log(`\n🎯 [${timestamp}] ${message}`);
        } else if (message.includes('Starting')) {
          console.log(`⏳ [${timestamp}] ${message}`);
        } else {
          console.log(`   [${timestamp}] ${message}`);
        }
      });

      return response.events.length;
    }

    return 0;
  } catch (error) {
    if (!error.message.includes('ResourceNotFoundException')) {
      console.error(`\n⚠️  Error: ${error.message}`);
    }
    return 0;
  }
}

async function watchLogs() {
  console.log('👀 Watching App Runner Deployment Logs');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Log Group: ${LOG_GROUP}`);
  console.log('Checking for new logs every 10 seconds...');
  console.log('Press Ctrl+C to stop\n');

  let iterations = 0;
  const maxIterations = 60; // Watch for 10 minutes max

  const interval = setInterval(async () => {
    iterations++;

    const newLogs = await fetchNewLogs();

    if (newLogs === 0 && iterations % 6 === 0) {
      // Show heartbeat every minute
      console.log(`\n⏱️  [${new Date().toLocaleTimeString()}] Still watching... (no new logs yet)`);
    }

    if (iterations >= maxIterations) {
      console.log('\n\n⏰ Reached 10 minute timeout. Stopping watch.');
      clearInterval(interval);
      process.exit(0);
    }
  }, 10000); // Check every 10 seconds

  // Initial fetch
  const initialLogs = await fetchNewLogs();
  if (initialLogs === 0) {
    console.log('⏳ No recent logs yet. Waiting for deployment to start...\n');
  }
}

watchLogs();
