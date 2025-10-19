#!/usr/bin/env node

/**
 * Production Port Configuration Diagnostic
 * Diagnoses and fixes port configuration issues in production
 */

const { AppRunnerClient, DescribeServiceCommand, UpdateServiceCommand } = require('@aws-sdk/client-apprunner');

// Load AWS resource configuration
const awsConfig = require('../config/aws-resources');

class ProductionPortDiagnostic {
  constructor(serviceArn) {
    this.serviceArn = serviceArn || awsConfig.appRunner.serviceArn;
    this.appRunnerClient = new AppRunnerClient({
      region: 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ADMIN || process.env.ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_ADMIN || process.env.SECRET_ACCESS_KEY
      }
    });
  }

  /**
   * Get current service configuration
   */
  async getCurrentServiceConfig() {
    try {
      const command = new DescribeServiceCommand({
        ServiceArn: this.serviceArn
      });
      
      const response = await this.appRunnerClient.send(command);
      return response.Service;
    } catch (error) {
      throw new Error(`Failed to get service configuration: ${error.message}`);
    }
  }

  /**
   * Analyze port configuration issues
   */
  analyzePortConfiguration(envVars) {
    console.log('🔍 Analyzing Port Configuration');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const portVars = {
      PORT: envVars.PORT,
      NODE_PORT: envVars.NODE_PORT,
      NGINX_PORT: envVars.NGINX_PORT
    };

    console.log('\n📊 Current Environment Variables:');
    Object.entries(portVars).forEach(([key, value]) => {
      const status = value ? '✅' : '❌';
      console.log(`  ${status} ${key}: ${value || 'NOT SET'}`);
    });

    console.log('\n🔧 Port Configuration Analysis:');
    
    // Check the priority order from index.js
    const nodeJsPort = portVars.NODE_PORT || portVars.PORT || 3001;
    const nginxPort = portVars.NGINX_PORT || 8080;
    
    console.log(`  📱 Node.js will run on: ${nodeJsPort}`);
    console.log(`  🌐 Nginx listens on: ${nginxPort}`);
    console.log(`  🔗 Nginx proxies to: localhost:3001`);

    // Identify issues
    const issues = [];
    const recommendations = [];

    if (nodeJsPort != 3001) {
      issues.push(`❌ Node.js running on port ${nodeJsPort} instead of 3001`);
      recommendations.push('Set NODE_PORT=3001 or remove PORT variable');
    }

    if (portVars.PORT && portVars.PORT !== '3001') {
      issues.push(`⚠️  PORT=${portVars.PORT} conflicts with NODE_PORT configuration`);
      recommendations.push('Remove PORT environment variable to avoid conflicts');
    }

    if (!portVars.NODE_PORT) {
      issues.push('❌ NODE_PORT is not set');
      recommendations.push('Set NODE_PORT=3001');
    }

    if (nodeJsPort === nginxPort) {
      issues.push('❌ Port conflict: Node.js and Nginx trying to use same port');
      recommendations.push('Fix port configuration to avoid conflicts');
    }

    console.log('\n🚨 Issues Found:');
    if (issues.length === 0) {
      console.log('  ✅ No configuration issues detected');
    } else {
      issues.forEach(issue => console.log(`  ${issue}`));
    }

    console.log('\n💡 Recommendations:');
    if (recommendations.length === 0) {
      console.log('  ✅ Configuration looks correct');
    } else {
      recommendations.forEach(rec => console.log(`  • ${rec}`));
    }

    return {
      issues: issues.length > 0,
      nodeJsPort,
      nginxPort,
      recommendations,
      shouldRemovePORT: portVars.PORT && portVars.PORT !== '3001',
      shouldSetNodePort: !portVars.NODE_PORT || portVars.NODE_PORT !== '3001'
    };
  }

  /**
   * Fix port configuration
   */
  async fixPortConfiguration(analysis, currentService) {
    if (!analysis.issues) {
      console.log('\n✅ No fixes needed - configuration is correct');
      return false;
    }

    console.log('\n🔧 Applying Port Configuration Fixes');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const currentEnvVars = currentService.SourceConfiguration?.ImageRepository?.ImageConfiguration?.RuntimeEnvironmentVariables || {};
    const newEnvVars = { ...currentEnvVars };

    let changes = [];

    // Remove PORT if it conflicts
    if (analysis.shouldRemovePORT) {
      delete newEnvVars.PORT;
      changes.push('❌ Removed conflicting PORT variable');
    }

    // Set NODE_PORT to 3001
    if (analysis.shouldSetNodePort) {
      newEnvVars.NODE_PORT = '3001';
      changes.push('✅ Set NODE_PORT=3001');
    }

    // Ensure NGINX_PORT is set
    if (!newEnvVars.NGINX_PORT) {
      newEnvVars.NGINX_PORT = '8080';
      changes.push('✅ Set NGINX_PORT=8080');
    }

    console.log('\n📝 Changes to Apply:');
    changes.forEach(change => console.log(`  ${change}`));

    // Update the service
    const updateParams = {
      ServiceArn: this.serviceArn,
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

    console.log('\n🚀 Updating App Runner service...');
    const command = new UpdateServiceCommand(updateParams);
    const response = await this.appRunnerClient.send(command);

    console.log('✅ Port configuration updated successfully!');
    console.log(`📋 Operation ID: ${response.OperationId}`);

    return true;
  }

  /**
   * Main execution method
   */
  async execute(options = {}) {
    try {
      // Load environment variables
      const { initScriptEnv } = require('./utils/env-loader');
      initScriptEnv(['AWS_ACCESS_KEY_ADMIN', 'AWS_SECRET_ACCESS_KEY_ADMIN']);

      console.log('🔍 Production Port Configuration Diagnostic');
      console.log('═══════════════════════════════════════════════════════════════');

      // Get current service configuration
      console.log('📡 Getting current service configuration...');
      const currentService = await this.getCurrentServiceConfig();
      const envVars = currentService.SourceConfiguration?.ImageRepository?.ImageConfiguration?.RuntimeEnvironmentVariables || {};

      console.log(`✅ Service: ${currentService.ServiceName}`);
      console.log(`📊 Status: ${currentService.Status}`);

      // Analyze port configuration
      const analysis = this.analyzePortConfiguration(envVars);

      // Fix if requested and needed
      if (options.fix && analysis.issues) {
        const fixed = await this.fixPortConfiguration(analysis, currentService);
        if (fixed) {
          console.log('\n🎉 Configuration fixed! Deployment will start automatically.');
          console.log('   Monitor deployment with: node apprunner-deploy-monitor.js');
        }
      } else if (analysis.issues && !options.fix) {
        console.log('\n⚠️  Issues found but --fix not specified');
        console.log('   Run with --fix to apply recommended changes');
        console.log('   Example: node production-port-diagnostic.js --fix');
      }

      console.log('\n📋 Expected Result After Fix:');
      console.log('   • Node.js app runs on port 3001 (internal)');
      console.log('   • Nginx listens on port 8080 (external)');
      console.log('   • Nginx proxies 8080 → 3001');
      console.log('   • No more 502 Bad Gateway errors');

      return analysis;
    } catch (error) {
      console.error('\n❌ Diagnostic error:', error.message);
      throw error;
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  // Use centralized config instead of hardcoded ARN
  const awsConfig = require('../config/aws-resources');

  if (args.includes('--help') || args.includes('-h')) {
    console.log('🔍 Production Port Configuration Diagnostic');
    console.log('');
    console.log('Usage: node production-port-diagnostic.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --fix        Apply recommended fixes automatically');
    console.log('  --help       Show this help message');
    console.log('');
    console.log('Examples:');
    console.log('  node production-port-diagnostic.js           # Diagnose only');
    console.log('  node production-port-diagnostic.js --fix     # Diagnose and fix');
    return;
  }

  const options = {
    fix: args.includes('--fix')
  };

  const diagnostic = new ProductionPortDiagnostic();

  try {
    const result = await diagnostic.execute(options);
    process.exit(result.issues && !options.fix ? 1 : 0);
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = ProductionPortDiagnostic;