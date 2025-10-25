#!/usr/bin/env node

/**
 * GitHub Action Monitor - Monitor the status of the most recent GitHub Action
 * Usage: node github-action-monitor.js [--watch] [--repo owner/repo]
 */

const https = require('https');

class GitHubActionMonitor {
  constructor(repo = 'mimelator/Wavelength-Lore') {
    this.repo = repo;
    this.apiUrl = `https://api.github.com/repos/${repo}/actions/runs`;
  }

  async fetchActionRuns() {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.github.com',
        path: `/repos/${this.repo}/actions/runs?per_page=5`,
        method: 'GET',
        headers: {
          'User-Agent': 'Wavelength-Lore-Monitor',
          'Accept': 'application/vnd.github.v3+json'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            resolve(result);
          } catch (error) {
            reject(new Error(`Failed to parse GitHub API response: ${error.message}`));
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
    const statusMap = {
      'queued': '⏳ QUEUED',
      'in_progress': '🟡 IN PROGRESS',
      'completed': conclusion === 'success' ? '✅ SUCCESS' : 
                   conclusion === 'failure' ? '❌ FAILED' :
                   conclusion === 'cancelled' ? '⏹️ CANCELLED' :
                   conclusion === 'skipped' ? '⏭️ SKIPPED' : '❓ COMPLETED'
    };
    return statusMap[status] || `❓ ${status.toUpperCase()}`;
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
      const endTime = latestRun.updated_at ? new Date(latestRun.updated_at) : new Date();
      
      console.log(`📋 Latest Action: ${latestRun.name || 'Unnamed Workflow'}`);
      console.log(`🆔 Run ID: ${latestRun.id}`);
      console.log(`📊 Status: ${this.formatStatus(latestRun.status, latestRun.conclusion)}`);
      console.log(`⏰ Started: ${startTime.toLocaleString()}`);
      console.log(`⏱️ Duration: ${this.formatDuration(latestRun.created_at, latestRun.updated_at)}`);
      console.log(`🌐 URL: ${latestRun.html_url}`);
      console.log(`🔗 Commit: ${latestRun.head_sha.substring(0, 7)} - ${latestRun.head_commit?.message || 'No message'}`);
      
      if (latestRun.conclusion === 'failure') {
        console.log(`❌ Failure Details: Check the action logs at ${latestRun.html_url}`);
      }
      
      return latestRun;
      
    } catch (error) {
      console.error(`❌ Error fetching GitHub Action status: ${error.message}`);
      return null;
    }
  }

  async watchActions() {
    console.log(`👀 Watching GitHub Actions for ${this.repo}...`);
    console.log('Press Ctrl+C to stop monitoring\n');
    
    let lastRunId = null;
    let lastStatus = null;
    
    const checkStatus = async () => {
      try {
        const latestRun = await this.displayActionStatus();
        
        if (latestRun) {
          // Check if this is a new run or status change
          if (lastRunId !== latestRun.id || lastStatus !== latestRun.status) {
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            
            lastRunId = latestRun.id;
            lastStatus = latestRun.status;
            
            // If completed, we can stop watching
            if (latestRun.status === 'completed') {
              console.log(`\n🎉 Action completed with status: ${this.formatStatus(latestRun.status, latestRun.conclusion)}`);
              return true; // Stop watching
            }
          } else {
            process.stdout.write('.');
          }
        }
        
        return false; // Continue watching
      } catch (error) {
        console.error(`❌ Error during watch: ${error.message}`);
        return false;
      }
    };
    
    // Initial check
    const completed = await checkStatus();
    if (completed) return;
    
    // Poll every 30 seconds
    const interval = setInterval(async () => {
      const completed = await checkStatus();
      if (completed) {
        clearInterval(interval);
      }
    }, 30000);
    
    // Handle Ctrl+C gracefully
    process.on('SIGINT', () => {
      console.log('\n\n👋 Monitoring stopped by user');
      clearInterval(interval);
      process.exit(0);
    });
  }
}

async function main() {
  const args = process.argv.slice(2);
  const watch = args.includes('--watch');
  const repoIndex = args.indexOf('--repo');
  const repo = repoIndex !== -1 && args[repoIndex + 1] ? args[repoIndex + 1] : 'mimelator/Wavelength-Lore';
  
  const monitor = new GitHubActionMonitor(repo);
  
  if (watch) {
    await monitor.watchActions();
  } else {
    await monitor.displayActionStatus();
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error(`❌ Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = GitHubActionMonitor;