#!/usr/bin/env node

/**
 * Production Build Monitor
 * Monitors deployment pipeline from commit to production
 */

const { AppRunnerClient, DescribeServiceCommand, ListOperationsCommand } = require('@aws-sdk/client-apprunner');
const chalk = require('chalk');
const awsResources = require('../config/aws-resources');

class ProductionBuildMonitor {
  constructor() {
    this.credentials = {
      accessKeyId: process.env.aws_wavelength_dev_access_key_id || process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.aws_wavelength_dev_secret_access_key || process.env.AWS_SECRET_ACCESS_KEY
    };
    
    this.apprunner = new AppRunnerClient({
      region: 'us-east-1',
      credentials: this.credentials
    });
    
    this.serviceArn = awsResources.appRunner.serviceArn;
    this.productionUrl = 'https://wavelengthlore.com';
  }
  
  log(level, message) {
    const timestamp = new Date().toISOString();
    const colors = {
      info: chalk.blue,
      success: chalk.green,
      warning: chalk.yellow,
      error: chalk.red,
      step: chalk.cyan
    };
    
    console.log(`${chalk.gray(timestamp)} ${colors[level]('●')} ${message}`);
  }
  
  async monitor() {
    this.log('step', '🚀 Starting Production Build Monitor');
    this.log('info', `Service ARN: ${this.serviceArn}`);
    this.log('info', `Production URL: ${this.productionUrl}`);
    
    try {
      await this.checkServiceStatus();
      await this.monitorOperations();
      await this.testProductionHealth();
      await this.continuousMonitor(5 * 60 * 1000);
    } catch (error) {
      this.log('error', `Monitor failed: ${error.message}`);
      process.exit(1);
    }
  }
  
  async checkServiceStatus() {
    this.log('step', '📊 Checking App Runner Service Status');
    
    const command = new DescribeServiceCommand({
      ServiceArn: this.serviceArn
    });
    
    const response = await this.apprunner.send(command);
    const service = response.Service;
    
    this.log('info', `Status: ${service.Status}`);
    this.log('info', `Source: ${service.SourceConfiguration.ImageRepository?.ImageUri || 'Code'}`);
    this.log('info', `Created: ${service.CreatedAt}`);
    this.log('info', `Updated: ${service.UpdatedAt}`);
    
    if (service.Status === 'RUNNING') {
      this.log('success', '✅ Service is running');
    } else {
      this.log('warning', `⚠️ Service status: ${service.Status}`);
    }
    
    return service;
  }
  
  async monitorOperations() {
    this.log('step', '🔄 Checking Recent Operations');
    
    const command = new ListOperationsCommand({
      ServiceArn: this.serviceArn,
      MaxResults: 10
    });
    
    const response = await this.apprunner.send(command);
    const operations = response.OperationSummaryList || [];
    
    if (operations.length === 0) {
      this.log('info', 'No recent operations found');
      return;
    }
    
    this.log('info', `Found ${operations.length} recent operations:`);
    
    operations.forEach((op, index) => {
      const status = op.Status;
      const type = op.Type;
      const time = op.StartedAt;
      
      const statusColor = {
        'SUCCEEDED': 'success',
        'FAILED': 'error', 
        'IN_PROGRESS': 'warning',
        'PENDING': 'info'
      }[status] || 'info';
      
      this.log(statusColor, `  ${index + 1}. ${type} - ${status} (${time})`);
      
      if (status === 'IN_PROGRESS') {
        this.log('warning', '🚧 Deployment in progress - will monitor');
      }
    });
  }
  
  async testProductionHealth() {
    this.log('step', '🏥 Testing Production Health');
    
    const endpoints = [
      { name: 'Homepage', path: '/' },
      { name: 'Merchandise', path: '/merchandise' },
      { name: 'API Health', path: '/api/health' }
    ];
    
    for (const endpoint of endpoints) {
      try {
        const url = `${this.productionUrl}${endpoint.path}`;
        const response = await fetch(url, { 
          method: 'GET'
        });
        
        if (response.ok) {
          this.log('success', `✅ ${endpoint.name}: ${response.status}`);
        } else {
          this.log('error', `❌ ${endpoint.name}: ${response.status}`);
        }
      } catch (error) {
        this.log('error', `❌ ${endpoint.name}: ${error.message}`);
      }
    }
  }
  
  async continuousMonitor(duration) {
    this.log('step', `⏰ Continuous monitoring for ${duration / 1000}s`);
    
    const endTime = Date.now() + duration;
    let lastOperationId = null;
    
    while (Date.now() < endTime) {
      try {
        const command = new ListOperationsCommand({
          ServiceArn: this.serviceArn,
          MaxResults: 1
        });
        
        const response = await this.apprunner.send(command);
        const operations = response.OperationSummaryList || [];
        
        if (operations.length > 0) {
          const latestOp = operations[0];
          
          if (latestOp.Id !== lastOperationId) {
            lastOperationId = latestOp.Id;
            this.log('warning', `🆕 New operation detected: ${latestOp.Type} - ${latestOp.Status}`);
            
            if (latestOp.Status === 'IN_PROGRESS') {
              await this.monitorDeployment(latestOp.Id);
            }
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 30000));
        
      } catch (error) {
        this.log('error', `Monitor error: ${error.message}`);
      }
    }
    
    this.log('success', '✅ Monitoring complete');
  }
  
  async monitorDeployment(operationId) {
    this.log('step', `🚀 Monitoring deployment: ${operationId}`);
    
    const maxWait = 20 * 60 * 1000;
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWait) {
      try {
        const command = new DescribeServiceCommand({
          ServiceArn: this.serviceArn
        });
        
        const response = await this.apprunner.send(command);
        const status = response.Service.Status;
        
        this.log('info', `Deployment status: ${status}`);
        
        if (status === 'RUNNING') {
          this.log('success', '🎉 Deployment completed successfully!');
          await new Promise(resolve => setTimeout(resolve, 30000));
          await this.testProductionHealth();
          break;
        } else if (status === 'OPERATION_IN_PROGRESS') {
          this.log('info', '⏳ Deployment in progress...');
        } else {
          this.log('error', `❌ Unexpected status: ${status}`);
          break;
        }
        
        await new Promise(resolve => setTimeout(resolve, 30000));
        
      } catch (error) {
        this.log('error', `Deployment monitor error: ${error.message}`);
        break;
      }
    }
  }
}

if (require.main === module) {
  const monitor = new ProductionBuildMonitor();
  monitor.monitor().catch(error => {
    console.error('Monitor failed:', error);
    process.exit(1);
  });
}

module.exports = ProductionBuildMonitor;