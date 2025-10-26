#!/usr/bin/env node

/**
 * 🌊 DIRECT WAVELENGTH GITHUB FAILURE ANALYZER
 * Embedded HTTP functionality - ZERO external dependencies!
 * PURE WAVELENGTH METHODOLOGY!
 */

const https = require('https');

console.log('🔍 WAVELENGTH GITHUB FAILURE ANALYZER');
console.log('⚡ DIRECT HTTP ANALYSIS - No MCP, No Shell, Pure Power!');
console.log('🚨 Investigating failed GitHub Actions...\n');

async function analyzeGitHubFailure() {
    try {
        console.log('🌐 Connecting to GitHub API with WAVELENGTH POWER...');
        
        const githubData = await makeGitHubRequest();
        
        if (!githubData || !githubData.workflow_runs) {
            console.log('❌ Unable to retrieve GitHub Actions data');
            return;
        }
        
        console.log('✅ GitHub Actions data retrieved successfully!');
        console.log(`📊 Total workflow runs found: ${githubData.total_count || githubData.workflow_runs.length}`);
        
        // Analyze the workflows
        const runs = githubData.workflow_runs;
        const failedRuns = runs.filter(run => run.status === 'completed' && run.conclusion === 'failure');
        const inProgressRuns = runs.filter(run => run.status === 'in_progress');
        const successfulRuns = runs.filter(run => run.status === 'completed' && run.conclusion === 'success');
        
        console.log('\n📈 WORKFLOW STATUS SUMMARY:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`❌ Failed Runs: ${failedRuns.length}`);
        console.log(`🟡 In Progress: ${inProgressRuns.length}`);
        console.log(`✅ Successful: ${successfulRuns.length}`);
        
        if (failedRuns.length > 0) {
            console.log('\n🚨 LATEST FAILURE ANALYSIS:');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            
            const latestFailure = failedRuns[0];
            
            console.log(`📋 Workflow Name: ${latestFailure.name}`);
            console.log(`🆔 Run ID: ${latestFailure.id}`);
            console.log(`📅 Failed At: ${new Date(latestFailure.updated_at).toLocaleString()}`);
            console.log(`⏱️ Duration: ${calculateDuration(latestFailure.created_at, latestFailure.updated_at)}`);
            console.log(`🔗 Commit: ${latestFailure.head_sha.substring(0, 7)}`);
            console.log(`📝 Message: ${latestFailure.head_commit?.message || 'No commit message'}`);
            console.log(`🌐 Action URL: ${latestFailure.html_url}`);
            
            // Check if this is our Docker fix
            const commitMessage = (latestFailure.head_commit?.message || '').toLowerCase();
            const isDockerFix = latestFailure.head_sha.startsWith('b2625ab') || 
                               commitMessage.includes('docker') ||
                               commitMessage.includes('permission');
            
            if (isDockerFix) {
                console.log('\n🎯 DOCKER FIX FAILURE DETECTED!');
                console.log('⚡ This appears to be related to our Docker permission fix!');
                
                console.log('\n💡 LIKELY FAILURE CAUSES:');
                console.log('• Docker build process failing');
                console.log('• Permission fix not working as expected');
                console.log('• ECR repository access issues');
                console.log('• Environment variables not configured');
                console.log('• AWS credentials or secrets problems');
            }
            
            console.log('\n🔧 IMMEDIATE ACTION PLAN:');
            console.log(`1. 🔍 Check detailed logs: ${latestFailure.html_url}`);
            console.log('2. 🐳 Verify Docker build configuration');
            console.log('3. ⚙️ Check GitHub secrets and environment variables');
            console.log('4. 🏗️ Review Dockerfile changes');
            console.log('5. 🚀 Consider local Docker build test');
        }
        
        if (inProgressRuns.length > 0) {
            console.log('\n🟡 CURRENTLY RUNNING ACTIONS:');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            inProgressRuns.forEach((run, index) => {
                console.log(`${index + 1}. 📋 ${run.name}`);
                console.log(`   ⏰ Started: ${new Date(run.created_at).toLocaleString()}`);
                console.log(`   🔗 Commit: ${run.head_sha.substring(0, 7)}`);
                console.log(`   🌐 Monitor: ${run.html_url}`);
            });
        }
        
        // Show recent success for context
        if (successfulRuns.length > 0) {
            console.log('\n✅ MOST RECENT SUCCESS:');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            const lastSuccess = successfulRuns[0];
            console.log(`📋 ${lastSuccess.name}`);
            console.log(`📅 Completed: ${new Date(lastSuccess.updated_at).toLocaleString()}`);
            console.log(`🔗 Commit: ${lastSuccess.head_sha.substring(0, 7)}`);
        }
        
        console.log('\n🌊 WAVELENGTH FAILURE ANALYSIS COMPLETE!');
        console.log('⚡ Analysis conducted with pure WAVELENGTH methodology!');
        
    } catch (error) {
        console.error('❌ WAVELENGTH ANALYSIS ERROR:', error.message);
        console.log('\n💡 Troubleshooting suggestions:');
        console.log('• Check network connectivity');
        console.log('• Verify GitHub API access');
        console.log('• Confirm repository permissions');
    }
}

function makeGitHubRequest() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.github.com',
            path: '/repos/mimelator/Wavelength-Lore/actions/runs?per_page=10',
            method: 'GET',
            headers: {
                'User-Agent': 'Wavelength-Failure-Analyzer/2.0',
                'Accept': 'application/vnd.github.v3+json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            
            console.log(`📡 GitHub API Response: ${res.statusCode} ${res.statusMessage}`);
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    resolve(result);
                } catch (error) {
                    console.log('📄 Raw response preview:', data.substring(0, 200) + '...');
                    reject(new Error(`GitHub API JSON parsing failed: ${error.message}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(new Error(`GitHub API request failed: ${error.message}`));
        });

        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('GitHub API request timeout'));
        });

        req.end();
    });
}

function calculateDuration(startTime, endTime) {
    const duration = Math.floor((new Date(endTime) - new Date(startTime)) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}m ${seconds}s`;
}

// EXECUTE WAVELENGTH FAILURE ANALYSIS!
console.log('⚡⚡⚡ ACTIVATING WAVELENGTH FAILURE ANALYZER! ⚡⚡⚡\n');
analyzeGitHubFailure()
    .then(() => {
        process.exit(0);
    })
    .catch(() => {
        process.exit(1);
    });