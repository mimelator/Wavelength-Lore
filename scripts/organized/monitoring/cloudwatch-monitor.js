#!/usr/bin/env node

/**
 * CloudWatch Logs Monitor for App Runner
 * Enhanced debugging and monitoring tool for Wavelength Lore deployments
 */

const { CloudWatchLogsClient, DescribeLogGroupsCommand, DescribeLogStreamsCommand, GetLogEventsCommand } = require('@aws-sdk/client-cloudwatch-logs');
const { AppRunnerClient, DescribeServiceCommand } = require('@aws-sdk/client-apprunner');
const awsConfig = require('../config/aws-resources');

class CloudWatchMonitor {
  constructor() {
    this.region = 'us-east-1';
    this.logsClient = new CloudWatchLogsClient({ region: this.region });
    this.appRunnerClient = new AppRunnerClient({ region: this.region });
    this.serviceArn = awsConfig.appRunner.serviceArn;
    this.serviceId = this.extractServiceId(this.serviceArn);
    
    this.logGroups = {
      application: `/aws/apprunner/wavelength-lore-service/${this.serviceId}/application`,
      service: `/aws/apprunner/wavelength-lore-service/${this.serviceId}/service`
    };
  }

  /**
   * Extract service ID from ARN
   */
  extractServiceId(arn) {
    const parts = arn.split('/');
    return parts[parts.length - 1];
  }

  /**
   * Get log streams for a log group
   */
  async getLogStreams(logGroupName, limit = 5) {
    try {
      const command = new DescribeLogStreamsCommand({
        logGroupName,
        orderBy: 'LastEventTime',
        descending: true,
        limit
      });
      
      const response = await this.logsClient.send(command);
      return response.logStreams || [];
    } catch (error) {
      if (error.name === 'ResourceNotFoundException') {
        console.log(`❌ Log group not found: ${logGroupName}`);
        return [];
      }
      throw error;
    }
  }

  /**
   * Get log events from a stream
   */
  async getLogEvents(logGroupName, logStreamName, options = {}) {
    try {
      const command = new GetLogEventsCommand({
        logGroupName,
        logStreamName,
        startTime: options.startTime,
        endTime: options.endTime,
        limit: options.limit || 100,
        startFromHead: options.startFromHead || false
      });
      
      const response = await this.logsClient.send(command);
      return response.events || [];
    } catch (error) {
      console.error(`Error getting logs: ${error.message}`);
      return [];
    }
  }

  /**
   * Format timestamp for display
   */
  formatTimestamp(timestamp) {
    return new Date(timestamp).toISOString().replace('T', ' ').substring(0, 19);
  }

  /**
   * Colorize log messages based on content
   */
  colorizeLog(message) {
    // Error patterns
    if (/error|fail|exception|crash|fatal/i.test(message)) {
      return `\x1b[31m${message}\x1b[0m`; // Red
    }
    
    // Warning patterns
    if (/warn|warning|⚠️/i.test(message)) {
      return `\x1b[33m${message}\x1b[0m`; // Yellow
    }
    
    // Success patterns
    if (/success|✅|started|ready|initialized/i.test(message)) {
      return `\x1b[32m${message}\x1b[0m`; // Green
    }
    
    // Info patterns
    if (/info|🚀|📝|🔧|🔥/i.test(message)) {
      return `\x1b[36m${message}\x1b[0m`; // Cyan
    }
    
    // Deployment patterns
    if (/deployment|deploy|apprunner|health check/i.test(message)) {
      return `\x1b[35m${message}\x1b[0m`; // Magenta
    }
    
    return message; // Default color
  }

  /**
   * Display logs in a formatted way
   */
  displayLogs(events, logType) {
    console.log(`\n📊 ${logType} Logs (${events.length} events)`);
    console.log('━'.repeat(80));
    
    events.forEach(event => {
      const timestamp = this.formatTimestamp(event.timestamp);
      const message = this.colorizeLog(event.message.trim());
      console.log(`${timestamp} | ${message}`);
    });
  }

  /**
   * Get recent application logs
   */
  async getApplicationLogs(minutes = 30, limit = 100) {
    console.log('🔍 Fetching recent application logs...');
    
    const streams = await this.getLogStreams(this.logGroups.application, 3);
    if (streams.length === 0) {
      console.log('❌ No application log streams found');
      return;
    }

    const startTime = Date.now() - (minutes * 60 * 1000);
    let allEvents = [];

    for (const stream of streams) {
      const events = await this.getLogEvents(
        this.logGroups.application, 
        stream.logStreamName,
        { startTime, limit: limit / streams.length }
      );
      allEvents = allEvents.concat(events);
    }

    // Sort by timestamp
    allEvents.sort((a, b) => a.timestamp - b.timestamp);
    
    this.displayLogs(allEvents, 'Application');
    
    return allEvents;
  }

  /**
   * Get recent service logs (deployment events)
   */
  async getServiceLogs(minutes = 60, limit = 50) {
    console.log('🔍 Fetching recent service/deployment logs...');
    
    const streams = await this.getLogStreams(this.logGroups.service, 2);
    if (streams.length === 0) {
      console.log('❌ No service log streams found');
      return;
    }

    const startTime = Date.now() - (minutes * 60 * 1000);
    let allEvents = [];

    for (const stream of streams) {
      const events = await this.getLogEvents(
        this.logGroups.service,
        stream.logStreamName,
        { startTime, limit: limit / streams.length }
      );
      allEvents = allEvents.concat(events);
    }

    // Sort by timestamp
    allEvents.sort((a, b) => a.timestamp - b.timestamp);
    
    this.displayLogs(allEvents, 'Service/Deployment');
    
    return allEvents;
  }

  /**
   * Tail logs in real-time (simplified version)
   */
  async tailLogs(logType = 'app', minutes = 5) {
    const logGroup = logType === 'service' ? this.logGroups.service : this.logGroups.application;
    console.log(`🔄 Tailing ${logType} logs from: ${logGroup}`);
    
    const streams = await this.getLogStreams(logGroup, 1);
    if (streams.length === 0) {
      console.log(`❌ No ${logType} log streams found`);
      return;
    }

    const stream = streams[0];
    const startTime = Date.now() - (minutes * 60 * 1000);
    
    console.log(`📡 Monitoring stream: ${stream.logStreamName}`);
    console.log('━'.repeat(80));

    let nextToken = null;
    const intervalMs = 2000; // Poll every 2 seconds

    const pollLogs = async () => {
      try {
        const events = await this.getLogEvents(logGroup, stream.logStreamName, {
          startTime,
          limit: 50,
          nextToken
        });

        events.forEach(event => {
          if (!nextToken || event.timestamp > Date.now() - intervalMs) {
            const timestamp = this.formatTimestamp(event.timestamp);
            const message = this.colorizeLog(event.message.trim());
            console.log(`${timestamp} | ${message}`);
          }
        });

        // Continue polling
        setTimeout(pollLogs, intervalMs);
      } catch (error) {
        console.error(`❌ Error polling logs: ${error.message}`);
      }
    };

    await pollLogs();
  }

  /**
   * Search for error patterns in logs
   */
  async searchErrors(minutes = 60) {
    console.log('🔍 Searching for errors in recent logs...');
    
    const appEvents = await this.getApplicationLogs(minutes, 200);
    const serviceEvents = await this.getServiceLogs(minutes, 100);
    
    const allEvents = [...(appEvents || []), ...(serviceEvents || [])];
    
    const errorPatterns = [
      /error/i,
      /fail/i,
      /exception/i,
      /crash/i,
      /fatal/i,
      /health check failed/i,
      /deployment.*failed/i,
      /invalid/i,
      /timeout/i
    ];

    const errors = allEvents.filter(event => 
      errorPatterns.some(pattern => pattern.test(event.message))
    );

    if (errors.length === 0) {
      console.log('✅ No errors found in recent logs');
      return;
    }

    console.log(`\n🚨 Found ${errors.length} potential errors:`);
    console.log('━'.repeat(80));
    
    errors.forEach(event => {
      const timestamp = this.formatTimestamp(event.timestamp);
      const message = this.colorizeLog(event.message.trim());
      console.log(`${timestamp} | ${message}`);
    });
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
      const service = response.Service;
      
      console.log('\n📊 App Runner Service Status:');
      console.log('━'.repeat(50));
      console.log(`🏷️  Name: ${service.ServiceName}`);
      console.log(`📋 Status: ${service.Status}`);
      console.log(`🔗 URL: ${service.ServiceUrl}`);
      console.log(`📦 Image: ${service.SourceConfiguration?.ImageRepository?.ImageIdentifier}`);
      console.log(`🚪 Port: ${service.SourceConfiguration?.ImageRepository?.ImageConfiguration?.Port || 'Not set'}`);
      console.log(`🔄 Auto Deploy: ${service.SourceConfiguration?.AutoDeploymentsEnabled ? 'Enabled' : 'Disabled'}`);
      
      return service;
    } catch (error) {
      console.error(`❌ Error getting service status: ${error.message}`);
    }
  }

  /**
   * Display comprehensive monitoring dashboard
   */
  async dashboard() {
    console.log('🎯 Wavelength Lore CloudWatch Monitor Dashboard');
    console.log('═'.repeat(80));
    
    // Service status
    await this.getServiceStatus();
    
    // Recent errors
    await this.searchErrors(30);
    
    // Recent service logs (deployment events)
    await this.getServiceLogs(30, 20);
    
    // Recent application logs
    await this.getApplicationLogs(15, 30);
    
    console.log('\n📝 Available Commands:');
    console.log('  npm run logs:app     - Show application logs');
    console.log('  npm run logs:service - Show deployment logs');
    console.log('  npm run logs:errors  - Search for errors');
    console.log('  npm run logs:tail    - Tail live logs');
    console.log('  npm run logs:watch   - Full monitoring dashboard');
  }

  /**
   * Watch mode - continuous monitoring
   */
  async watch() {
    console.log('👁️  Starting continuous monitoring...');
    console.log('Press Ctrl+C to stop');
    console.log('━'.repeat(80));
    
    const runDashboard = async () => {
      console.clear();
      await this.dashboard();
      console.log(`\n🔄 Last updated: ${new Date().toLocaleTimeString()}`);
      console.log('Refreshing in 30 seconds...');
    };
    
    await runDashboard();
    setInterval(runDashboard, 30000); // Refresh every 30 seconds
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'dashboard';
  
  const monitor = new CloudWatchMonitor();
  
  try {
    switch (command) {
      case 'app':
      case 'application':
        await monitor.getApplicationLogs(30, 100);
        break;
        
      case 'service':
      case 'deploy':
      case 'deployment':
        await monitor.getServiceLogs(60, 50);
        break;
        
      case 'tail':
        const logType = args[1] || 'app';
        await monitor.tailLogs(logType, 10);
        break;
        
      case 'errors':
      case 'error':
        await monitor.searchErrors(60);
        break;
        
      case 'watch':
      case 'monitor':
        await monitor.watch();
        break;
        
      case 'status':
        await monitor.getServiceStatus();
        break;
        
      case 'dashboard':
      default:
        await monitor.dashboard();
        break;
    }
  } catch (error) {
    console.error('❌ Monitor error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = CloudWatchMonitor;