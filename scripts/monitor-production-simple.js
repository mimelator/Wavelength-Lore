#!/usr/bin/env node

/**
 * Simple Production Monitor
 * Monitors production endpoints without AWS credentials
 */

const chalk = require('chalk');

class SimpleProductionMonitor {
  constructor() {
    this.productionUrl = 'https://wavelengthlore.com';
    this.startTime = Date.now();
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
    this.log('step', '🚀 Starting Simple Production Monitor');
    this.log('info', `Production URL: ${this.productionUrl}`);
    
    try {
      // Initial health check
      await this.testProductionHealth();
      
      // Monitor for changes every 30 seconds for 5 minutes
      await this.continuousMonitor(5 * 60 * 1000);
      
    } catch (error) {
      this.log('error', `Monitor failed: ${error.message}`);
      process.exit(1);
    }
  }
  
  async testProductionHealth() {
    this.log('step', '🏥 Testing Production Health');
    
    const endpoints = [
      { name: 'Homepage', path: '/', expected: 200 },
      { name: 'Merchandise', path: '/merchandise', expected: 200 },
      { name: 'Characters', path: '/characters', expected: 200 },
      { name: 'API Health', path: '/api/health', expected: 200 }
    ];
    
    const results = [];
    
    for (const endpoint of endpoints) {
      try {
        const url = `${this.productionUrl}${endpoint.path}`;
        const startTime = Date.now();
        
        const response = await fetch(url, { 
          method: 'GET',
          headers: {
            'User-Agent': 'Production-Monitor/1.0'
          }
        });
        
        const responseTime = Date.now() - startTime;
        
        if (response.ok) {
          this.log('success', `✅ ${endpoint.name}: ${response.status} (${responseTime}ms)`);
          results.push({ endpoint: endpoint.name, status: 'OK', code: response.status, time: responseTime });
        } else {
          this.log('error', `❌ ${endpoint.name}: ${response.status} (${responseTime}ms)`);
          results.push({ endpoint: endpoint.name, status: 'ERROR', code: response.status, time: responseTime });
        }
      } catch (error) {
        this.log('error', `❌ ${endpoint.name}: ${error.message}`);
        results.push({ endpoint: endpoint.name, status: 'FAILED', error: error.message });
      }
    }
    
    // Summary
    const healthy = results.filter(r => r.status === 'OK').length;
    const total = results.length;
    
    if (healthy === total) {
      this.log('success', `🎉 All ${total} endpoints healthy`);
    } else {
      this.log('warning', `⚠️ ${healthy}/${total} endpoints healthy`);
    }
    
    return results;
  }
  
  async continuousMonitor(duration) {
    this.log('step', `⏰ Continuous monitoring for ${duration / 1000}s`);
    
    const endTime = Date.now() + duration;
    let checkCount = 0;
    let lastResults = null;
    
    while (Date.now() < endTime) {
      try {
        checkCount++;
        this.log('info', `📊 Health check #${checkCount}`);
        
        const results = await this.testProductionHealth();
        
        // Compare with last results to detect changes
        if (lastResults) {
          const changes = this.detectChanges(lastResults, results);
          if (changes.length > 0) {
            this.log('warning', `🔄 Detected ${changes.length} status changes:`);
            changes.forEach(change => {
              this.log('warning', `  ${change.endpoint}: ${change.from} → ${change.to}`);
            });
          }
        }
        
        lastResults = results;
        
        // Wait 30 seconds before next check
        this.log('info', '⏳ Waiting 30s for next check...');
        await new Promise(resolve => setTimeout(resolve, 30000));
        
      } catch (error) {
        this.log('error', `Monitor error: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    }
    
    this.log('success', `✅ Monitoring complete after ${checkCount} checks`);
  }
  
  detectChanges(oldResults, newResults) {
    const changes = [];
    
    for (let i = 0; i < oldResults.length; i++) {
      const oldResult = oldResults[i];
      const newResult = newResults[i];
      
      if (oldResult.status !== newResult.status) {
        changes.push({
          endpoint: oldResult.endpoint,
          from: oldResult.status,
          to: newResult.status
        });
      }
    }
    
    return changes;
  }
}

if (require.main === module) {
  const monitor = new SimpleProductionMonitor();
  monitor.monitor().catch(error => {
    console.error('Monitor failed:', error);
    process.exit(1);
  });
}

module.exports = SimpleProductionMonitor;