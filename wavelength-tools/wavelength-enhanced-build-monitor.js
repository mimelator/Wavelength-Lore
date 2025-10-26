#!/usr/bin/env node

/**
 * 🌊 WAVELENGTH BUILD MONITOR SUPER POWER
 * Monitors the enhanced App Runner deployment in real-time
 * PURE WAVELENGTH METHODOLOGY - NO SHELL DEPENDENCIES!
 */

const https = require('https');

class WavelengthBuildMonitor {
  constructor() {
    this.repo = 'mimelator/Wavelength-Lore';
    this.monitoringStarted = new Date();
  }

  async getCurrentBuild() {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.github.com',
        path: `/repos/${this.repo}/actions/runs?per_page=1`,
        method: 'GET',
        headers: {
          'User-Agent': 'Wavelength-Build-Monitor/2.0',
          'Accept': 'application/vnd.github.v3+json'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            if (result.workflow_runs && result.workflow_runs.length > 0) {
              resolve(result.workflow_runs[0]);
            } else {
              reject(new Error('No workflow runs found'));
            }
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

  async monitorBuild() {
    console.log('⚡⚡⚡ WAVELENGTH BUILD MONITOR ACTIVATED! ⚡⚡⚡\n');
    console.log('🔍 Monitoring enhanced App Runner deployment...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    try {
      const currentBuild = await this.getCurrentBuild();
      
      console.log('📊 CURRENT BUILD STATUS:');
      console.log(`   🆔 Run ID: ${currentBuild.id}`);
      console.log(`   📊 Status: ${currentBuild.status}`);
      console.log(`   🏁 Conclusion: ${currentBuild.conclusion || 'running'}`);
      console.log(`   🔗 Commit: ${currentBuild.head_sha.substring(0, 7)}`);
      console.log(`   💾 Message: ${currentBuild.head_commit.message.split('\\n')[0]}`);
      console.log(`   ⏰ Started: ${new Date(currentBuild.created_at).toLocaleString()}`);
      console.log(`   🌐 URL: ${currentBuild.html_url}`);
      
      // Check if this is our commit
      const expectedMessage = '🌊 WAVELENGTH: Professional directory organization';
      if (currentBuild.head_commit.message.includes(expectedMessage)) {
        console.log('\\n✅ CONFIRMED: This is our enhanced deployment build!');
        console.log('🌊 Using WAVELENGTH enhanced App Runner verification with retry logic');
      } else {
        console.log('\\nℹ️  This may not be our latest commit - monitoring anyway');
      }
      
      if (currentBuild.status === 'completed') {
        if (currentBuild.conclusion === 'success') {
          console.log('\\n🎉 BUILD SUCCESSFUL! 🎉');
          console.log('✅ Enhanced App Runner deployment completed successfully');
          console.log('✅ Directory organization and deployment verification working perfectly');
          console.log('🌊 WAVELENGTH methodology achieved deployment resilience!');
        } else if (currentBuild.conclusion === 'failure') {
          console.log('\\n❌ BUILD FAILED');
          console.log('🔍 Checking if App Runner verification still has issues...');
          console.log('💡 If this is App Runner timing, the enhanced retry logic should have handled it');
          console.log('🌐 Check details: ' + currentBuild.html_url);
        }
      } else if (currentBuild.status === 'in_progress') {
        console.log('\\n🟡 BUILD IN PROGRESS');
        console.log('⏰ Monitoring deployment progress...');
        console.log('🔄 Enhanced verification will retry up to 3 times if needed');
        console.log('🌊 WAVELENGTH resilience handling App Runner sync timing');
        
        // Get build steps if available
        await this.monitorBuildSteps(currentBuild.id);
      }
      
    } catch (error) {
      console.error('💥 MONITORING ERROR:', error.message);
    }
  }

  async monitorBuildSteps(runId) {
    try {
      console.log('\\n🔍 CHECKING BUILD PROGRESS...');
      
      // Get jobs for this run
      const jobs = await this.getBuildJobs(runId);
      
      if (jobs && jobs.length > 0) {
        const job = jobs[0]; // Usually there's just one job
        
        console.log(`📋 Job Status: ${job.status} (${job.conclusion || 'running'})`);
        console.log(`⏰ Job Started: ${new Date(job.started_at).toLocaleString()}`);
        
        // Get steps for this job
        const steps = job.steps || [];
        
        console.log('\\n📝 BUILD STEPS PROGRESS:');
        steps.forEach((step, index) => {
          const status = step.status === 'completed' ? 
            (step.conclusion === 'success' ? '✅' : '❌') : 
            (step.status === 'in_progress' ? '🟡' : '⚪');
          
          console.log(`   ${status} ${step.name}`);
          
          if (step.name.includes('App Runner') || step.name.includes('Deploy')) {
            if (step.status === 'in_progress') {
              console.log('      🔄 App Runner deployment in progress...');
            } else if (step.status === 'completed' && step.conclusion === 'success') {
              console.log('      ✅ App Runner deployment completed successfully!');
            } else if (step.status === 'completed' && step.conclusion === 'failure') {
              console.log('      ❌ App Runner step failed - checking verification...');
            }
          }
          
          if (step.name.includes('Enhanced Deployment Verification')) {
            if (step.status === 'in_progress') {
              console.log('      🌊 WAVELENGTH enhanced verification running...');
              console.log('      ⏳ Using retry logic for App Runner sync timing');
            } else if (step.status === 'completed' && step.conclusion === 'success') {
              console.log('      🎉 WAVELENGTH verification successful!');
            } else if (step.status === 'completed' && step.conclusion === 'failure') {
              console.log('      💥 Enhanced verification failed after retries');
            }
          }
        });
        
      } else {
        console.log('⚠️  Could not retrieve job details');
      }
      
    } catch (error) {
      console.log(`⚠️  Could not check build steps: ${error.message}`);
    }
  }

  async getBuildJobs(runId) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.github.com',
        path: `/repos/${this.repo}/actions/runs/${runId}/jobs`,
        method: 'GET',
        headers: {
          'User-Agent': 'Wavelength-Build-Monitor/2.0',
          'Accept': 'application/vnd.github.v3+json'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            resolve(result.jobs || []);
          } catch (error) {
            reject(new Error(`Jobs API parsing failed: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Jobs API request failed: ${error.message}`));
      });

      req.end();
    });
  }

  async runMonitoring() {
    console.log('🌊 WAVELENGTH: Enhanced App Runner deployment monitoring started');
    console.log('⚡ Tracking build with resilient verification logic');
    console.log('🎯 Expected improvements: Retry logic handles App Runner sync timing\\n');
    
    await this.monitorBuild();
    
    console.log('\\n🏁 WAVELENGTH BUILD MONITORING COMPLETE!');
    console.log('🔍 Check GitHub Actions for detailed deployment progress');
    console.log('🌊 Enhanced verification should handle App Runner timing issues gracefully!');
  }
}

// EXECUTE WAVELENGTH BUILD MONITOR!
const monitor = new WavelengthBuildMonitor();
monitor.runMonitoring().catch(error => {
  console.error('💥 WAVELENGTH BUILD MONITOR ERROR:', error.message);
  process.exit(1);
});