#!/usr/bin/env node

/**
 * Deployment Tracker
 * Tracks deployment history and compares versions
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DeploymentTracker {
  constructor() {
    this.versionPath = path.join(__dirname, '../version.json');
    this.historyPath = path.join(__dirname, '../deployment-history.json');
  }

  /**
   * Get current deployment info
   */
  getCurrentDeployment() {
    try {
      if (fs.existsSync(this.versionPath)) {
        return JSON.parse(fs.readFileSync(this.versionPath, 'utf8'));
      }
    } catch (error) {
      console.error('❌ Error reading version.json:', error.message);
    }
    return null;
  }

  /**
   * Get deployment history
   */
  getDeploymentHistory() {
    try {
      if (fs.existsSync(this.historyPath)) {
        return JSON.parse(fs.readFileSync(this.historyPath, 'utf8'));
      }
    } catch (error) {
      console.error('⚠️  Error reading deployment history:', error.message);
    }
    return { deployments: [] };
  }

  /**
   * Record a deployment
   */
  recordDeployment(deploymentInfo) {
    try {
      const history = this.getDeploymentHistory();
      
      const deployment = {
        ...deploymentInfo,
        recordedAt: new Date().toISOString(),
        id: `${deploymentInfo.buildNumber}-${deploymentInfo.commitShort}`
      };

      // Don't duplicate entries
      const existingIndex = history.deployments.findIndex(d => d.id === deployment.id);
      if (existingIndex >= 0) {
        history.deployments[existingIndex] = deployment;
      } else {
        history.deployments.unshift(deployment); // Add to beginning
      }

      // Keep only last 50 deployments
      history.deployments = history.deployments.slice(0, 50);
      
      fs.writeFileSync(this.historyPath, JSON.stringify(history, null, 2));
      return true;
    } catch (error) {
      console.error('❌ Error recording deployment:', error.message);
      return false;
    }
  }

  /**
   * Compare current deployment with production
   */
  async compareWithProduction() {
    try {
      console.log('🔍 Comparing local build with production...');
      
      const localDeployment = this.getCurrentDeployment();
      if (!localDeployment) {
        console.log('❌ No local version.json found');
        return;
      }

      // Fetch production deployment info
      const productionUrl = process.env.SITE_URL || 'https://vh9x3gevev.us-east-1.awsapprunner.com';
      const axios = require('axios');
      
      try {
        const response = await axios.get(`${productionUrl}/api/deployment/status`, { 
          timeout: 10000,
          headers: { 'User-Agent': 'Deployment-Tracker' }
        });
        
        const prodDeployment = response.data.deployment;
        
        console.log('\n📊 Deployment Comparison:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        console.log(`\n🏠 Local Build:`);
        console.log(`   Version: v${localDeployment.version}`);
        console.log(`   Build: #${localDeployment.buildNumber}`);
        console.log(`   Commit: ${localDeployment.commitShort} (${localDeployment.commitHash})`);
        console.log(`   Built: ${new Date(localDeployment.buildDate).toLocaleString()}`);
        
        console.log(`\n🌐 Production Build:`);
        console.log(`   Version: v${prodDeployment.version}`);
        console.log(`   Build: #${prodDeployment.buildNumber}`);
        console.log(`   Commit: ${prodDeployment.commitShort} (${prodDeployment.commitHash})`);
        console.log(`   Built: ${new Date(prodDeployment.buildDate).toLocaleString()}`);
        console.log(`   Uptime: ${prodDeployment.uptimeFormatted}`);
        
        // Comparison
        const isSameCommit = localDeployment.commitHash === prodDeployment.commitHash;
        const isNewerBuild = parseInt(localDeployment.buildNumber) > parseInt(prodDeployment.buildNumber);
        
        console.log(`\n📈 Status:`);
        if (isSameCommit) {
          console.log('   ✅ Local and production are on the same commit');
        } else if (isNewerBuild) {
          console.log('   🆕 Local build is newer than production');
          console.log(`   📋 Commits ahead: ${parseInt(localDeployment.buildNumber) - parseInt(prodDeployment.buildNumber)}`);
        } else {
          console.log('   ⚠️  Production is ahead of local build');
        }
        
        // GitHub links
        console.log(`\n🔗 GitHub Links:`);
        console.log(`   Local Commit: https://github.com/mimelator/Wavelength-Lore/commit/${localDeployment.commitHash}`);
        console.log(`   Prod Commit: https://github.com/mimelator/Wavelength-Lore/commit/${prodDeployment.commitHash}`);
        
        if (!isSameCommit) {
          console.log(`   Compare: https://github.com/mimelator/Wavelength-Lore/compare/${prodDeployment.commitHash}...${localDeployment.commitHash}`);
        }
        
      } catch (prodError) {
        console.log(`❌ Could not fetch production deployment info: ${prodError.message}`);
      }
      
    } catch (error) {
      console.error('❌ Error comparing deployments:', error.message);
    }
  }

  /**
   * Show deployment history
   */
  showHistory(limit = 10) {
    const history = this.getDeploymentHistory();
    
    if (history.deployments.length === 0) {
      console.log('📝 No deployment history found');
      return;
    }
    
    console.log(`\n📋 Recent Deployments (last ${Math.min(limit, history.deployments.length)}):`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    history.deployments.slice(0, limit).forEach((deployment, index) => {
      const date = new Date(deployment.buildDate).toLocaleString();
      console.log(`\n${index + 1}. Build #${deployment.buildNumber} (${deployment.commitShort})`);
      console.log(`   Version: v${deployment.version}`);
      console.log(`   Date: ${date}`);
      console.log(`   Status: ${deployment.deploymentStatus || 'unknown'}`);
      if (deployment.deploymentWorkflowId) {
        console.log(`   Workflow: ${deployment.deploymentWorkflowId}`);
      }
    });
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const tracker = new DeploymentTracker();
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('📊 Wavelength Lore Deployment Tracker');
    console.log('');
    console.log('Usage: node deployment-tracker.js [command] [options]');
    console.log('');
    console.log('Commands:');
    console.log('  record          Record current deployment');
    console.log('  compare         Compare local with production');
    console.log('  history         Show deployment history');
    console.log('  status          Show current deployment info');
    console.log('');
    console.log('Options:');
    console.log('  --limit N       Limit history results (default: 10)');
    console.log('  --help          Show this help message');
    return;
  }
  
  const command = args[0] || 'status';
  const limit = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) || 10 : 10;
  
  switch (command) {
    case 'record':
      const current = tracker.getCurrentDeployment();
      if (current) {
        const success = tracker.recordDeployment(current);
        console.log(success ? '✅ Deployment recorded' : '❌ Failed to record deployment');
      } else {
        console.log('❌ No current deployment info found');
      }
      break;
      
    case 'compare':
      await tracker.compareWithProduction();
      break;
      
    case 'history':
      tracker.showHistory(limit);
      break;
      
    case 'status':
    default:
      const deployment = tracker.getCurrentDeployment();
      if (deployment) {
        console.log('🚀 Current Deployment Info:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Version: v${deployment.version}`);
        console.log(`Build: #${deployment.buildNumber}`);
        console.log(`Commit: ${deployment.commitShort} (${deployment.commitHash})`);
        console.log(`Built: ${new Date(deployment.buildDate).toLocaleString()}`);
        console.log(`Environment: ${deployment.environment || 'unknown'}`);
        if (deployment.deploymentWorkflowId) {
          console.log(`Workflow: ${deployment.deploymentWorkflowId}`);
        }
        console.log(`\n🔗 GitHub: https://github.com/mimelator/Wavelength-Lore/commit/${deployment.commitHash}`);
      } else {
        console.log('❌ No deployment info found');
      }
      break;
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = DeploymentTracker;