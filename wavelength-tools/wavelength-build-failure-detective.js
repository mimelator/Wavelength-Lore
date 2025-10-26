#!/usr/bin/env node

/**
 * 🌊 WAVELENGTH BUILD FAILURE INVESTIGATOR
 * Deep dive analysis with PURE WAVELENGTH SUPER POWERS!
 */

const https = require('https');

class WavelengthFailureInvestigator {
  constructor() {
    this.repo = 'mimelator/Wavelength-Lore';
    this.commitSha = '34140e4';
  }

  async fetchFailureDetails() {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.github.com',
        path: `/repos/${this.repo}/actions/runs?per_page=10`,
        method: 'GET',
        headers: {
          'User-Agent': 'Wavelength-Failure-Detective/2.0',
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

  async fetchJobDetails(runId) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.github.com',
        path: `/repos/${this.repo}/actions/runs/${runId}/jobs`,
        method: 'GET',
        headers: {
          'User-Agent': 'Wavelength-Job-Detective/2.0',
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
            reject(new Error(`Job details parsing failed: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Job details request failed: ${error.message}`));
      });

      req.end();
    });
  }

  async investigateFailure() {
    console.log('🔍 WAVELENGTH BUILD FAILURE INVESTIGATION');
    console.log('⚡ DEEP DIVE ANALYSIS WITH SUPER POWERS!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    try {
      const data = await this.fetchFailureDetails();
      
      if (!data.workflow_runs || data.workflow_runs.length === 0) {
        console.log('❌ No workflow runs found');
        return;
      }

      // Find our Docker fix run
      const dockerFixRun = data.workflow_runs.find(run => 
        run.head_sha.startsWith(this.commitSha)
      );

      if (!dockerFixRun) {
        console.log('🔍 Docker fix run not found, checking recent failures...');
        const failedRuns = data.workflow_runs.filter(run => 
          run.status === 'completed' && run.conclusion === 'failure'
        );
        
        if (failedRuns.length > 0) {
          console.log('❌ Recent failed runs:');
          failedRuns.slice(0, 3).forEach((run, i) => {
            console.log(`${i+1}. ${run.head_sha.substring(0, 7)} - ${run.name}`);
            console.log(`   Failed: ${new Date(run.updated_at).toLocaleString()}`);
            console.log(`   URL: ${run.html_url}`);
          });
        }
        return;
      }

      console.log('🎯 DOCKER FIX RUN ANALYSIS:');
      console.log(`📋 Workflow: ${dockerFixRun.name}`);
      console.log(`🆔 Run ID: ${dockerFixRun.id}`);
      console.log(`📊 Status: ${dockerFixRun.status} | ${dockerFixRun.conclusion || 'pending'}`);
      console.log(`⏰ Started: ${new Date(dockerFixRun.created_at).toLocaleString()}`);
      console.log(`🏁 Completed: ${new Date(dockerFixRun.updated_at).toLocaleString()}`);
      console.log(`🌐 URL: ${dockerFixRun.html_url}`);
      console.log(`🔗 Commit: ${dockerFixRun.head_sha}`);

      if (dockerFixRun.conclusion === 'failure') {
        console.log('\n❌ FAILURE CONFIRMED - Analyzing job details...');
        
        try {
          const jobData = await this.fetchJobDetails(dockerFixRun.id);
          
          if (jobData.jobs && jobData.jobs.length > 0) {
            console.log('\n🔍 JOB FAILURE ANALYSIS:');
            
            jobData.jobs.forEach((job, i) => {
              console.log(`\nJob ${i+1}: ${job.name}`);
              console.log(`Status: ${job.status} | Conclusion: ${job.conclusion || 'pending'}`);
              console.log(`Started: ${new Date(job.started_at).toLocaleString()}`);
              if (job.completed_at) {
                console.log(`Completed: ${new Date(job.completed_at).toLocaleString()}`);
              }
              
              if (job.conclusion === 'failure') {
                console.log('🚨 FAILED JOB DETECTED!');
                console.log(`🔗 Logs: ${job.html_url}`);
                
                // Analyze common failure patterns
                if (job.name.toLowerCase().includes('build')) {
                  console.log('\n💡 LIKELY DOCKER BUILD FAILURE:');
                  console.log('• Check for Docker permission issues');
                  console.log('• Verify Dockerfile syntax and layer ordering');
                  console.log('• Check if start.sh creation still failing');
                  console.log('• Validate sudoers configuration');
                }
                
                if (job.name.toLowerCase().includes('deploy')) {
                  console.log('\n💡 LIKELY DEPLOYMENT FAILURE:');
                  console.log('• Check AWS credentials and permissions');
                  console.log('• Verify ECR repository access');
                  console.log('• Check App Runner configuration');
                }
              }
            });
          }
        } catch (jobError) {
          console.log(`⚠️ Could not fetch job details: ${jobError.message}`);
        }

        console.log('\n🛠️ IMMEDIATE ACTIONS NEEDED:');
        console.log('1. 🔍 Check the GitHub Actions logs for specific error messages');
        console.log('2. 🐳 Verify our Docker permission fix is correctly applied');  
        console.log('3. 🔧 Check if there are syntax errors in our enhanced Dockerfile');
        console.log('4. ⚙️ Validate environment variables and secrets');
        
        console.log('\n🌊 WAVELENGTH DIAGNOSIS RECOMMENDATIONS:');
        console.log('• Docker layer ordering: Ensure scripts created before USER switch');
        console.log('• Permission fix: Verify /etc/sudoers.d/appuser is correctly configured');
        console.log('• Startup script: Check start.sh has proper permissions and syntax');
        console.log('• Build context: Ensure all required files are in Docker context');

      } else if (dockerFixRun.status === 'in_progress') {
        console.log('🔄 Build still in progress...');
      } else if (dockerFixRun.conclusion === 'success') {
        console.log('✅ Build actually succeeded!');
      }

    } catch (error) {
      console.error(`❌ Investigation error: ${error.message}`);
    }
  }
}

// EXECUTE WAVELENGTH FAILURE INVESTIGATION!
console.log('⚡⚡⚡ ACTIVATING WAVELENGTH FAILURE DETECTIVE! ⚡⚡⚡\n');

const investigator = new WavelengthFailureInvestigator();
investigator.investigateFailure().then(() => {
  console.log('\n🏁 WAVELENGTH INVESTIGATION COMPLETE!');
  console.log('🌊 Check the analysis above for failure details and next steps!');
}).catch(error => {
  console.error('💥 INVESTIGATION ERROR:', error.message);
  process.exit(1);
});