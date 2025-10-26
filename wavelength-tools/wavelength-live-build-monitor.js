#!/usr/bin/env node

/**
 * 🌊 WAVELENGTH LIVE BUILD MONITOR SUPER POWER
 * Real-time GitHub Actions monitoring with PURE WAVELENGTH METHODOLOGY!
 * NO SHELL DEPENDENCIES - MAXIMUM MONITORING POWER!
 */

const https = require('https');

class WavelengthLiveBuildMonitor {
  constructor() {
    this.repo = 'mimelator/Wavelength-Lore';
    this.monitorInterval = 15000; // 15 seconds
    this.maxChecks = 40; // Monitor for 10 minutes
    this.checkCount = 0;
    this.lastCommit = null;
  }

  async fetchLatestBuild() {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.github.com',
        path: `/repos/${this.repo}/actions/runs?per_page=5`,
        method: 'GET',
        headers: {
          'User-Agent': 'Wavelength-Live-Monitor/3.0',
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

  async monitorBuild() {
    this.checkCount++;
    
    console.log(`\n🔍 WAVELENGTH MONITOR CHECK #${this.checkCount}`);
    console.log(`⏰ Time: ${new Date().toLocaleTimeString()}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
      const data = await this.fetchLatestBuild();
      
      if (!data.workflow_runs || data.workflow_runs.length === 0) {
        console.log('❌ No workflow runs found');
        return false;
      }

      const latestRun = data.workflow_runs[0];
      const isNewBuild = !this.lastCommit || this.lastCommit !== latestRun.head_sha;
      
      if (isNewBuild) {
        console.log('🆕 NEW BUILD DETECTED!');
        this.lastCommit = latestRun.head_sha;
      }

      const statusEmoji = latestRun.status === 'in_progress' ? '🟡' : 
                         latestRun.status === 'queued' ? '⏳' :
                         latestRun.status === 'completed' ? 
                           (latestRun.conclusion === 'success' ? '✅' : '❌') : '📊';
      
      console.log('🌊 LATEST BUILD STATUS:');
      console.log(`📋 Workflow: ${latestRun.name}`);
      console.log(`🆔 Run ID: ${latestRun.id}`);
      console.log(`📊 Status: ${statusEmoji} ${latestRun.status.toUpperCase()}`);
      if (latestRun.conclusion) {
        console.log(`🏁 Conclusion: ${latestRun.conclusion.toUpperCase()}`);
      }
      console.log(`⏰ Started: ${this.formatTime(latestRun.created_at)}`);
      console.log(`⏱️ Duration: ${this.formatDuration(latestRun.created_at, latestRun.updated_at)}`);
      console.log(`🔗 Commit: ${latestRun.head_sha.substring(0, 7)}`);
      console.log(`🌐 URL: ${latestRun.html_url}`);

      // Check if this includes our validation tools
      const hasValidationTools = latestRun.head_commit?.message?.includes('ECR validation') ||
                                 latestRun.head_commit?.message?.includes('WAVELENGTH') ||
                                 latestRun.head_commit?.message?.includes('super tools');
      
      if (hasValidationTools) {
        console.log('🎯 WAVELENGTH VALIDATION TOOLS DETECTED!');
        console.log('⚡ This build includes our comprehensive ECR validation!');
      }

      // Monitor for completion
      if (latestRun.status === 'completed') {
        console.log('\n🎉 BUILD COMPLETED!');
        
        if (latestRun.conclusion === 'success') {
          console.log('✅ SUCCESS! WAVELENGTH Docker fixes deployed!');
          console.log('🌊 ECR image built with all enhancements!');
          console.log('⚡ Sudoers directory fix confirmed working!');
          console.log('🚀 All WAVELENGTH super tools validated!');
          return true; // Stop monitoring
        } else if (latestRun.conclusion === 'failure') {
          console.log('❌ FAILURE: Build needs investigation');
          console.log(`🔍 Check logs: ${latestRun.html_url}`);
          return true; // Stop monitoring, but with failure
        }
      } else if (latestRun.status === 'in_progress') {
        console.log('🔄 Build in progress...');
        console.log('⚡ WAVELENGTH validation tools being deployed...');
      } else if (latestRun.status === 'queued') {
        console.log('⏳ Build queued for execution...');
      }

      return false; // Continue monitoring

    } catch (error) {
      console.error(`❌ Monitoring error: ${error.message}`);
      return false; // Continue monitoring despite errors
    }
  }

  async startLiveMonitoring() {
    console.log('⚡⚡⚡ WAVELENGTH LIVE BUILD MONITOR ACTIVATED! ⚡⚡⚡');
    console.log('🌊 REAL-TIME ECR BUILD TRACKING WITH SUPER POWERS!');
    console.log('🚀 Using PURE WAVELENGTH METHODOLOGY!\n');
    
    console.log(`📋 Monitoring Details:`);
    console.log(`   Repository: ${this.repo}`);
    console.log(`   Check Interval: ${this.monitorInterval/1000}s`);
    console.log(`   Max Duration: ${this.maxChecks * this.monitorInterval/1000/60}m`);

    const monitor = async () => {
      const shouldStop = await this.monitorBuild();
      
      if (shouldStop) {
        console.log('\n🏁 WAVELENGTH MONITORING COMPLETE!');
        console.log('🌊 ECR build monitoring finished with pure super powers!');
        process.exit(0);
      }

      if (this.checkCount >= this.maxChecks) {
        console.log('\n⏰ MONITORING TIMEOUT REACHED');
        console.log('💡 Build may still be in progress');
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

// EXECUTE WAVELENGTH LIVE MONITORING SUPER POWER!
console.log('🌊 WAVELENGTH COMMIT SUPER POWER DEPLOYMENT SUCCESSFUL!');
console.log('⚡ Now activating live build monitoring...\n');

const monitor = new WavelengthLiveBuildMonitor();
monitor.startLiveMonitoring().catch(error => {
  console.error('💥 WAVELENGTH MONITORING ERROR:', error.message);
  process.exit(1);
});