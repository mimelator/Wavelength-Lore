#!/usr/bin/env node

/**
 * Wavelength Deployment Manager
 * Comprehensive deployment workflow with asset sync, cache busting, and deployment
 */

const { execSync, spawn } = require('child_process');
const path = require('path');

// ANSI color codes for beautiful output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

class DeploymentManager {
  constructor() {
    this.startTime = Date.now();
  }

  log(message, color = 'white') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  success(message) {
    this.log(`✅ ${message}`, 'green');
  }

  error(message) {
    this.log(`❌ ${message}`, 'red');
  }

  warn(message) {
    this.log(`⚠️  ${message}`, 'yellow');
  }

  info(message) {
    this.log(`ℹ️  ${message}`, 'blue');
  }

  step(message) {
    this.log(`\n🚀 ${message}`, 'cyan');
    this.log('━'.repeat(50), 'cyan');
  }

  async runCommand(command, description) {
    this.info(`Running: ${command}`);
    try {
      const output = execSync(command, { 
        stdio: 'inherit',
        cwd: path.resolve(__dirname, '..')
      });
      this.success(`${description} completed successfully`);
      return true;
    } catch (error) {
      this.error(`${description} failed: ${error.message}`);
      return false;
    }
  }

  async syncAssets() {
    this.step('Syncing Assets to S3');
    return await this.runCommand('npm run deploy:assets', 'Asset synchronization');
  }

  async bustLocalCache() {
    this.step('Busting Local Application Cache');
    return await this.runCommand('npm run cache:local', 'Local cache busting');
  }

  async bustCDNCache() {
    this.step('Invalidating CDN Cache');
    return await this.runCommand('npm run cache:cdn', 'CDN cache invalidation');
  }

  async forceDeployment() {
    this.step('Triggering Production Deployment');
    const success = await this.runCommand('node scripts/apprunner-force-deploy.js --force', 'Production deployment');
    
    // Run post-deployment tasks if successful
    if (success) {
      this.info('Running post-deployment tasks...');
      await this.runCommand('node scripts/post-deploy-hook.js', 'Post-deployment tasks');
    }
    
    return success;
  }

  async checkDeploymentStatus() {
    this.step('Checking Deployment Status');
    return await this.runCommand('npm run deploy:status', 'Status check');
  }

  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  }

  /**
   * Full deployment workflow
   */
  async deployFull() {
    this.log('\n🌟 WAVELENGTH FULL DEPLOYMENT WORKFLOW 🌟', 'magenta');
    this.log('==========================================', 'magenta');
    
    const steps = [
      { name: 'Asset Sync', fn: () => this.syncAssets() },
      { name: 'CDN Cache Bust', fn: () => this.bustCDNCache() },
      { name: 'Production Deploy', fn: () => this.forceDeployment() },
      { name: 'Status Check', fn: () => this.checkDeploymentStatus() }
    ];

    let failedSteps = 0;
    for (const step of steps) {
      const success = await step.fn();
      if (!success) {
        failedSteps++;
        this.warn(`Step "${step.name}" failed but continuing...`);
      }
    }

    const duration = this.formatDuration(Date.now() - this.startTime);
    
    if (failedSteps === 0) {
      this.log(`\n🎉 DEPLOYMENT COMPLETED SUCCESSFULLY! 🎉`, 'green');
      this.log(`⏱️  Total time: ${duration}`, 'green');
    } else {
      this.log(`\n⚠️  DEPLOYMENT COMPLETED WITH ${failedSteps} ISSUES`, 'yellow');
      this.log(`⏱️  Total time: ${duration}`, 'yellow');
    }
  }

  /**
   * Quick deployment (no asset sync)
   */
  async deployQuick() {
    this.log('\n⚡ WAVELENGTH QUICK DEPLOYMENT ⚡', 'cyan');
    this.log('==================================', 'cyan');
    
    const steps = [
      { name: 'Local Cache Bust', fn: () => this.bustLocalCache() },
      { name: 'Production Deploy', fn: () => this.forceDeployment() }
    ];

    let failedSteps = 0;
    for (const step of steps) {
      const success = await step.fn();
      if (!success) {
        failedSteps++;
      }
    }

    const duration = this.formatDuration(Date.now() - this.startTime);
    
    if (failedSteps === 0) {
      this.success(`Quick deployment completed in ${duration}`);
    } else {
      this.warn(`Quick deployment completed with issues in ${duration}`);
    }
  }

  /**
   * Cache management only
   */
  async manageCaches(type = 'all') {
    this.log(`\n🧹 CACHE MANAGEMENT: ${type.toUpperCase()} 🧹`, 'yellow');
    this.log('==============================', 'yellow');
    
    const cacheCommands = {
      local: 'npm run cache:local',
      cdn: 'npm run cache:cdn', 
      all: 'npm run cache:all',
      characters: 'npm run cache:characters',
      lore: 'npm run cache:lore'
    };

    const command = cacheCommands[type] || cacheCommands.all;
    const success = await this.runCommand(command, `${type} cache management`);
    
    const duration = this.formatDuration(Date.now() - this.startTime);
    
    if (success) {
      this.success(`Cache management completed in ${duration}`);
    } else {
      this.error(`Cache management failed in ${duration}`);
    }
  }

  showHelp() {
    this.log('\n📋 Wavelength Deployment Manager', 'cyan');
    this.log('================================', 'cyan');
    this.log('');
    this.log('Usage: node scripts/deploy-manager.js [command]', 'white');
    this.log('');
    this.log('Commands:', 'yellow');
    this.log('  full        Full deployment (assets + CDN cache + deploy)', 'white');
    this.log('  quick       Quick deployment (local cache + deploy)', 'white');
    this.log('  assets      Sync assets to S3 only', 'white');
    this.log('  cache       Manage caches [local|cdn|all|characters|lore]', 'white');
    this.log('  status      Check current deployment status', 'white');
    this.log('  help        Show this help message', 'white');
    this.log('');
    this.log('Examples:', 'green');
    this.log('  node scripts/deploy-manager.js full', 'white');
    this.log('  node scripts/deploy-manager.js quick', 'white');
    this.log('  node scripts/deploy-manager.js cache local', 'white');
    this.log('  node scripts/deploy-manager.js cache characters', 'white');
    this.log('');
    this.log('NPM Shortcuts:', 'magenta');
    this.log('  npm run deploy:full     # Same as: node scripts/deploy-manager.js full', 'white');
    this.log('  npm run deploy:quick    # Same as: node scripts/deploy-manager.js quick', 'white');
    this.log('  npm run cache:all       # Bust all caches', 'white');
    this.log('  npm run deploy:assets   # Sync assets only', 'white');
    this.log('');
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const manager = new DeploymentManager();
  
  const command = args[0] || 'help';
  const subcommand = args[1];
  
  try {
    switch (command) {
      case 'full':
        await manager.deployFull();
        break;
        
      case 'quick':
        await manager.deployQuick();
        break;
        
      case 'assets':
        await manager.syncAssets();
        break;
        
      case 'cache':
        await manager.manageCaches(subcommand);
        break;
        
      case 'status':
        await manager.checkDeploymentStatus();
        break;
        
      case 'help':
      case '--help':
      case '-h':
      default:
        manager.showHelp();
        break;
    }
  } catch (error) {
    manager.error(`Deployment manager failed: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = DeploymentManager;