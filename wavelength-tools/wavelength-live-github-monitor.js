#!/usr/bin/env node

/**
 * 🌊 WAVELENGTH LIVE GITHUB ACTIONS MONITOR
 * Real-time monitoring with PURE WAVELENGTH SUPER POWERS!
 * NO SHELL DEPENDENCIES - MAXIMUM POWER LEVEL!
 */

const https = require('https');

class WavelengthLiveMonitor {
  constructor() {
    this.repo = 'mimelator/Wavelength-Lore';
    this.commitSha = '34140e4'; // Our Docker fix commit
    this.monitorInterval = 10000; // 10 seconds
    this.maxChecks = 60; // Monitor for 10 minutes max
    this.checkCount = 0;
  }

  async fetchGitHubActions() {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.github.com',
        path: `/repos/${this.repo}/actions/runs?per_page=10`,
        method: 'GET',
        headers: {
          'User-Agent': 'Wavelength-Live-Monitor/2.0',
          'Accept': 'application/vnd.github.v3+json'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
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

  formatTime(isoString) {
    return new Date(isoString).toLocaleTimeString();
  }

  formatDuration(startTime, endTime = new Date()) {
    const duration = Math.floor((new Date(endTime) - new Date(startTime)) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}m ${seconds}s`;
  }

  getStatusEmoji(status, conclusion) {
    if (status === 'in_progress') return '🟡';
    if (status === 'queued') return '⏳';
    if (status === 'completed') {
      switch (conclusion) {
        case 'success': return '✅';
        case 'failure': return '❌';
        case 'cancelled': return '⏹️';
        default: return '🔄';
      }
    }
    return '📊';
  }

  async monitorDockerFix() {
    this.checkCount++;
    console.log(`\n🔍 WAVELENGTH MONITOR CHECK #${this.checkCount}`);
    console.log(`⏰ Time: ${new Date().toLocaleTimeString()}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
      const data = await this.fetchGitHubActions();
      
      if (!data.workflow_runs || data.workflow_runs.length === 0) {
        console.log('❌ No workflow runs found');
        return false;
      }

      // Find our Docker fix commit run
      const dockerFixRun = data.workflow_runs.find(run => 
        run.head_sha.startsWith(this.commitSha)
      );

      if (!dockerFixRun) {
        console.log('🔍 Searching for Docker fix commit...');
        console.log(`   Looking for commit: ${this.commitSha}`);
        console.log('   Recent commits:');
        data.workflow_runs.slice(0, 3).forEach(run => {
          console.log(`   • ${run.head_sha.substring(0, 7)} - ${run.status} ${run.conclusion || ''}`);
        });
        return false; // Keep monitoring
      }

      // Found our Docker fix run!
      const status = this.getStatusEmoji(dockerFixRun.status, dockerFixRun.conclusion);
      const duration = this.formatDuration(dockerFixRun.created_at, dockerFixRun.updated_at);
      
      console.log('🎯 DOCKER FIX RUN FOUND!');
      console.log(`📋 Workflow: ${dockerFixRun.name}`);
      console.log(`🆔 Run ID: ${dockerFixRun.id}`);
      console.log(`📊 Status: ${status} ${dockerFixRun.status.toUpperCase()}`);
      if (dockerFixRun.conclusion) {
        console.log(`🏁 Conclusion: ${dockerFixRun.conclusion.toUpperCase()}`);
      }
      console.log(`⏰ Started: ${this.formatTime(dockerFixRun.created_at)}`);
      console.log(`⏱️ Duration: ${duration}`);
      console.log(`🌐 URL: ${dockerFixRun.html_url}`);
      console.log(`🔗 Commit: ${dockerFixRun.head_sha.substring(0, 7)}`);

      // Check if completed
      if (dockerFixRun.status === 'completed') {
        console.log('\n🎉 DOCKER FIX DEPLOYMENT COMPLETED!');
        
        if (dockerFixRun.conclusion === 'success') {
          console.log('✅ SUCCESS! Docker permission fix worked!');
          console.log('🚀 CI/CD pipeline should now be fully operational!');
          console.log('🌊 WAVELENGTH SUPER POWERS saved the day!');
          return true; // Stop monitoring
        } else if (dockerFixRun.conclusion === 'failure') {
          console.log('❌ FAILURE: Docker fix needs investigation');
          console.log(`🔍 Check logs: ${dockerFixRun.html_url}`);
          console.log('💡 The permission fix may need additional tweaks');
          return true; // Stop monitoring, but with failure
        }
      } else if (dockerFixRun.status === 'in_progress') {
        console.log('🔄 Docker fix deployment in progress...');
        console.log('⚡ WAVELENGTH monitoring continues...');
      } else if (dockerFixRun.status === 'queued') {
        console.log('⏳ Docker fix queued for execution...');
      }

      return false; // Continue monitoring

    } catch (error) {
      console.error(`❌ Monitoring error: ${error.message}`);
      return false; // Continue monitoring despite errors
    }
  }

  async startLiveMonitoring() {
    console.log('🌊 WAVELENGTH LIVE GITHUB ACTIONS MONITOR');
    console.log('⚡ REAL-TIME DOCKER FIX DEPLOYMENT TRACKING!');
    console.log('🚀 Using PURE WAVELENGTH SUPER POWERS!\n');
    
    console.log(`📋 Monitoring Details:`);
    console.log(`   Repository: ${this.repo}`);
    console.log(`   Docker Fix Commit: ${this.commitSha}`);
    console.log(`   Check Interval: ${this.monitorInterval/1000}s`);
    console.log(`   Max Duration: ${this.maxChecks * this.monitorInterval/1000/60}m`);

    const monitor = async () => {
      const shouldStop = await this.monitorDockerFix();
      
      if (shouldStop) {
        console.log('\n🏁 WAVELENGTH MONITORING COMPLETE!');
        console.log('🌊 Docker fix deployment monitoring finished!');
        process.exit(0);
      }

      if (this.checkCount >= this.maxChecks) {
        console.log('\n⏰ MONITORING TIMEOUT REACHED');
        console.log('💡 GitHub Actions may be experiencing delays');
        console.log('🔍 Check GitHub manually for latest status');
        process.exit(0);
      }

      // Schedule next check
      setTimeout(monitor, this.monitorInterval);
    };

    // Start monitoring immediately
    await monitor();
  }
}

// ACTIVATE WAVELENGTH LIVE MONITORING!
console.log('⚡⚡⚡ ACTIVATING WAVELENGTH LIVE MONITOR! ⚡⚡⚡\n');

const monitor = new WavelengthLiveMonitor();
monitor.startLiveMonitoring().catch(error => {
  console.error('💥 WAVELENGTH MONITORING ERROR:', error.message);
  process.exit(1);
});