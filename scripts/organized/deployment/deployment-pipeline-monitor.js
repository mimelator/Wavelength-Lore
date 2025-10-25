#!/usr/bin/env node

/**
 * Complete Deployment Pipeline Monitor
 * 
 * This script provides end-to-end monitoring of the complete deployment pipeline:
 * 1. GitHub Actions (CI/CD build and test)
 * 2. AWS App Runner (production deployment)
 * 
 * Usage: node deployment-pipeline-monitor.js [--reason "deployment reason"] [--repo owner/repo]
 */

const { spawn } = require('child_process');
const path = require('path');

class DeploymentPipelineMonitor {
  constructor(options = {}) {
    this.repo = options.repo || 'mimelator/Wavelength-Lore';
    this.reason = options.reason || 'Complete pipeline monitoring';
    this.scriptsDir = __dirname;
  }

  async runScript(scriptName, args = []) {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(this.scriptsDir, scriptName);
      console.log(`🚀 Starting ${scriptName}...`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      const child = spawn('node', [scriptPath, ...args], {
        stdio: 'inherit',
        cwd: this.scriptsDir
      });

      child.on('close', (code) => {
        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`✅ ${scriptName} completed with exit code: ${code}\n`);
        
        if (code === 0) {
          resolve(code);
        } else {
          reject(new Error(`${scriptName} failed with exit code ${code}`));
        }
      });

      child.on('error', (error) => {
        reject(new Error(`Failed to start ${scriptName}: ${error.message}`));
      });
    });
  }

  async monitorPipeline() {
    console.log(`🔍 Complete Deployment Pipeline Monitor`);
    console.log(`📦 Repository: ${this.repo}`);
    console.log(`📝 Reason: ${this.reason}`);
    console.log(`⏰ Started: ${new Date().toLocaleString()}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    try {
      // Phase 1: Monitor GitHub Actions CI/CD
      console.log(`📊 PHASE 1: GitHub Actions CI/CD Monitoring`);
      console.log(`🔗 Repository: ${this.repo}`);
      console.log(`📋 Monitoring build, test, and deployment phases...\n`);
      
      const githubArgs = ['--watch'];
      if (this.repo !== 'mimelator/Wavelength-Lore') {
        githubArgs.push('--repo', this.repo);
      }
      
      await this.runScript('github-action-monitor.js', githubArgs);

      // Brief pause between phases
      console.log(`⏸️  Waiting 10 seconds before App Runner monitoring...\n`);
      await this.sleep(10000);

      // Phase 2: Monitor App Runner Deployment
      console.log(`📊 PHASE 2: AWS App Runner Deployment Monitoring`);
      console.log(`🚀 Monitoring production deployment and health checks...\n`);
      
      const appRunnerArgs = ['--reason', `Post-CI deployment: ${this.reason}`];
      await this.runScript('apprunner-deploy-monitor.js', appRunnerArgs);

      // Pipeline completion
      console.log(`🎉 DEPLOYMENT PIPELINE COMPLETE!`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`✅ GitHub Actions: Completed successfully`);
      console.log(`✅ App Runner: Deployment verified`);
      console.log(`⏰ Total pipeline time: ${this.formatDuration(this.startTime)}`);
      console.log(`🌐 Production URL: https://wavelengthlore.com`);
      console.log(`📋 Pipeline reason: ${this.reason}\n`);

      // Final health check suggestion
      console.log(`🔍 Recommended next steps:`);
      console.log(`   1. Test production functionality: https://wavelengthlore.com`);
      console.log(`   2. Check production logs for any issues`);
      console.log(`   3. Verify forum and search functionality`);
      console.log(`   4. Monitor error rates and performance metrics\n`);

    } catch (error) {
      console.error(`❌ DEPLOYMENT PIPELINE FAILED!`);
      console.error(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.error(`💥 Error: ${error.message}`);
      console.error(`⏰ Failed after: ${this.formatDuration(this.startTime)}`);
      console.error(`🔧 Troubleshooting:`);
      console.error(`   1. Check GitHub Actions logs: https://github.com/${this.repo}/actions`);
      console.error(`   2. Review AWS App Runner service status`);
      console.error(`   3. Run individual monitoring scripts for detailed analysis`);
      console.error(`   4. Check production environment variables and configuration\n`);
      
      process.exit(1);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  formatDuration(startTime) {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}m ${seconds}s`;
  }

  async start() {
    this.startTime = Date.now();
    
    // Handle Ctrl+C gracefully
    process.on('SIGINT', () => {
      console.log(`\n\n⚠️  Pipeline monitoring interrupted by user`);
      console.log(`⏰ Monitored for: ${this.formatDuration(this.startTime)}`);
      console.log(`📝 Note: Deployments may continue running in the background`);
      console.log(`🔍 Check individual monitoring scripts for current status\n`);
      process.exit(0);
    });

    await this.monitorPipeline();
  }
}

async function main() {
  const args = process.argv.slice(2);
  const options = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--reason':
        options.reason = args[++i];
        break;
      case '--repo':
        options.repo = args[++i];
        break;
      case '--help':
      case '-h':
        console.log(`
🔍 Complete Deployment Pipeline Monitor

Usage: node deployment-pipeline-monitor.js [options]

Options:
  --reason "message"    Deployment reason/description
  --repo owner/repo     GitHub repository to monitor (default: mimelator/Wavelength-Lore)
  --help, -h           Show this help message

Examples:
  node deployment-pipeline-monitor.js
  node deployment-pipeline-monitor.js --reason "Fix production bug"
  node deployment-pipeline-monitor.js --repo owner/repo --reason "New feature deployment"

Pipeline Phases:
  1. GitHub Actions CI/CD monitoring (build, test, deploy)
  2. AWS App Runner deployment monitoring (production deployment)
  3. Health check verification and completion summary
`);
        process.exit(0);
        break;
    }
  }

  const monitor = new DeploymentPipelineMonitor(options);
  await monitor.start();
}

if (require.main === module) {
  main().catch(error => {
    console.error(`❌ Fatal pipeline error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = DeploymentPipelineMonitor;