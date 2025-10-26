#!/usr/bin/env node

/**
 * 🌊 PURE WAVELENGTH GITHUB MONITOR EXECUTION
 * Embedding and executing GitHub Actions monitoring directly
 * ZERO external dependencies - MAXIMUM WAVELENGTH POWER!
 */

const https = require('https');

console.log('🌊 WAVELENGTH SUPER TOOLS - GitHub Actions Monitor');
console.log('⚡ PURE WAVELENGTH EXECUTION - No shell commands!');
console.log('🚀 Monitoring our Docker fix deployment...\n');

// PURE WAVELENGTH GitHub Actions Monitor Class (embedded)
class WavelengthGitHubMonitor {
  constructor(repo = 'mimelator/Wavelength-Lore') {
    this.repo = repo;
  }

  async fetchActionRuns() {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.github.com',
        path: `/repos/${this.repo}/actions/runs?per_page=5`,
        method: 'GET',
        headers: {
          'User-Agent': 'Wavelength-Super-Tools/2.0',
          'Accept': 'application/vnd.github.v3+json'
        }
      };

      console.log('🔍 Connecting to GitHub API with WAVELENGTH POWERS...');
      
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            resolve(result);
          } catch (error) {
            reject(new Error(`GitHub API parsing failed: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`GitHub API request failed: ${error.message}`));
      });

      req.end();
    });
  }

  formatDuration(startTime, endTime = new Date()) {
    const duration = Math.floor((new Date(endTime) - new Date(startTime)) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}m ${seconds}s`;
  }

  formatStatus(status, conclusion) {
    if (status === 'in_progress') return '🟡 IN PROGRESS';
    if (status === 'queued') return '⏳ QUEUED';
    if (status === 'completed') {
      switch (conclusion) {
        case 'success': return '✅ SUCCESS';
        case 'failure': return '❌ FAILED';
        case 'cancelled': return '⏹️ CANCELLED';
        case 'skipped': return '⏭️ SKIPPED';
        default: return '🔄 COMPLETED';
      }
    }
    return `📊 ${status.toUpperCase()}`;
  }

  async displayActionStatus() {
    try {
      console.log(`🔍 GitHub Action Monitor for ${this.repo}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      const data = await this.fetchActionRuns();
      
      if (!data.workflow_runs || data.workflow_runs.length === 0) {
        console.log('❌ No GitHub Actions found for this repository');
        return null;
      }

      const latestRun = data.workflow_runs[0];
      const startTime = new Date(latestRun.created_at);
      
      console.log(`📋 Latest Action: ${latestRun.name || 'Unnamed Workflow'}`);
      console.log(`🆔 Run ID: ${latestRun.id}`);
      console.log(`📊 Status: ${this.formatStatus(latestRun.status, latestRun.conclusion)}`);
      console.log(`⏰ Started: ${startTime.toLocaleString()}`);
      console.log(`⏱️ Duration: ${this.formatDuration(latestRun.created_at, latestRun.updated_at)}`);
      console.log(`🌐 URL: ${latestRun.html_url}`);
      console.log(`🔗 Commit: ${latestRun.head_sha.substring(0, 7)} - ${latestRun.head_commit?.message || 'No message'}`);
      
      // Special check for our Docker fix commit
      const isDockerFix = latestRun.head_sha.startsWith('b2625ab') || 
                         latestRun.head_commit?.message?.toLowerCase().includes('docker') ||
                         latestRun.head_commit?.message?.toLowerCase().includes('permission');
      
      if (isDockerFix) {
        console.log('\n🎯 DOCKER FIX DEPLOYMENT DETECTED!');
        console.log('⚡ This run includes our critical Docker permission fix!');
        
        if (latestRun.conclusion === 'success') {
          console.log('🎉 SUCCESS! Docker permission fix deployed successfully!');
          console.log('✅ CI/CD pipeline should now work correctly!');
        } else if (latestRun.status === 'in_progress') {
          console.log('🔄 Docker fix deployment in progress...');
        } else if (latestRun.conclusion === 'failure') {
          console.log('❌ Docker fix deployment failed - needs investigation');
        }
      }
      
      if (latestRun.conclusion === 'failure') {
        console.log(`\n❌ Failure Details:`);
        console.log(`🔍 Check the action logs: ${latestRun.html_url}`);
        console.log(`💡 Common issues: Docker build failures, permission errors, dependency issues`);
      }
      
      // Show recent runs for context
      if (data.workflow_runs.length > 1) {
        console.log('\n📊 Recent Runs:');
        data.workflow_runs.slice(0, 3).forEach((run, i) => {
          const status = this.formatStatus(run.status, run.conclusion);
          const shortSha = run.head_sha.substring(0, 7);
          const timeAgo = this.formatDuration(run.created_at, new Date());
          console.log(`  ${i + 1}. ${status} - ${shortSha} (${timeAgo} ago)`);
        });
      }
      
      return latestRun;
      
    } catch (error) {
      console.error(`❌ Error fetching GitHub Action status: ${error.message}`);
      console.log('💡 Check network connectivity and repository access');
      return null;
    }
  }
}

// EXECUTE WITH PURE WAVELENGTH POWER!
async function executeWavelengthMonitoring() {
  try {
    const monitor = new WavelengthGitHubMonitor();
    const result = await monitor.displayActionStatus();
    
    console.log('\n🌊 WAVELENGTH SUPER TOOLS EXECUTION COMPLETE!');
    console.log('⚡ GitHub Actions monitored using PURE WAVELENGTH METHODOLOGY!');
    console.log('🚀 No shell commands, no external scripts - PURE POWER!');
    
    if (result) {
      console.log('\n🎯 NEXT STEPS:');
      if (result.status === 'in_progress') {
        console.log('• Monitor deployment progress at GitHub Actions tab');
        console.log('• Docker fix should resolve previous build failures');
      } else if (result.conclusion === 'success') {
        console.log('• ✅ Deployment successful - production should be updated');
        console.log('• Verify production site is running latest version');
      } else if (result.conclusion === 'failure') {
        console.log('• ❌ Check action logs for specific error details');
        console.log('• Docker permission fix may need additional changes');
      }
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('💥 WAVELENGTH MONITORING ERROR:', error.message);
    console.log('🔧 Troubleshooting: Check network, API access, and repository permissions');
    process.exit(1);
  }
}

// ACTIVATE MAXIMUM WAVELENGTH POWER!
console.log('⚡⚡⚡ ACTIVATING WAVELENGTH SUPER POWERS! ⚡⚡⚡\n');
executeWavelengthMonitoring();