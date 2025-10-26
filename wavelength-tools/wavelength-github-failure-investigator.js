#!/usr/bin/env node

/**
 * 🌊 PURE WAVELENGTH GITHUB FAILURE INVESTIGATOR
 * Using our Enhanced MCP Server http_request tool - NO SHELL SHACKLES!
 */

const { spawn } = require('child_process');

async function investigateGitHubFailureWithWavelengthPowers() {
    console.log('🔍 WAVELENGTH GITHUB FAILURE INVESTIGATION');
    console.log('⚡ Using PURE MCP HTTP_REQUEST TOOL - Zero Shell Dependencies!');
    console.log('🚨 Analyzing failed GitHub Action with WAVELENGTH INTELLIGENCE!\n');

    // PURE MCP JSON-RPC request using http_request super tool!
    const mcpRequest = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": "http_request",
            "arguments": {
                "url": "https://api.github.com/repos/mimelator/Wavelength-Lore/actions/runs?per_page=10",
                "method": "GET",
                "headers": {
                    "Accept": "application/vnd.github.v3+json",
                    "User-Agent": "Wavelength-Failure-Investigator/2.0"
                }
            }
        }
    };

    return new Promise((resolve, reject) => {
        // Launch Enhanced MCP Server with MAXIMUM FAILURE ANALYSIS POWER!
        console.log('🚀 Activating Enhanced MCP Server for failure analysis...');
        
        const mcpServer = spawn('node', ['mcp/enhanced-wavelength-server.js'], {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let responseData = '';
        let errorData = '';
        let mcpReady = false;

        mcpServer.stdout.on('data', (data) => {
            const output = data.toString();
            responseData += output;
            
            if (output.includes('Enhanced Wavelength MCP Server running')) {
                mcpReady = true;
                console.log('✅ MCP Server activated - analyzing GitHub failures...');
            }
        });

        mcpServer.stderr.on('data', (data) => {
            errorData += data.toString();
        });

        mcpServer.on('close', (code) => {
            console.log('\n🔍 WAVELENGTH FAILURE ANALYSIS RESULTS:');
            
            // Parse the MCP response for GitHub data
            try {
                const lines = responseData.split('\n');
                let githubData = null;
                
                for (const line of lines) {
                    if (line.includes('"workflow_runs"') || line.includes('"total_count"')) {
                        try {
                            githubData = JSON.parse(line);
                            break;
                        } catch (e) {
                            // Try to extract JSON from MCP response format
                            const jsonMatch = line.match(/\{.*"workflow_runs".*\}/);
                            if (jsonMatch) {
                                githubData = JSON.parse(jsonMatch[0]);
                                break;
                            }
                        }
                    }
                }
                
                if (githubData && githubData.workflow_runs) {
                    console.log('✅ GitHub Action data retrieved with WAVELENGTH POWERS!');
                    analyzeFailedActions(githubData.workflow_runs);
                } else {
                    console.log('📊 Raw MCP Response Analysis:');
                    console.log(responseData);
                    
                    // Manual analysis of response
                    if (responseData.includes('Status Code: 200')) {
                        console.log('✅ GitHub API responded successfully');
                    }
                    if (responseData.includes('workflow_runs')) {
                        console.log('✅ Workflow data detected in response');
                    }
                }
                
            } catch (parseError) {
                console.log('📄 Full MCP Response:');
                console.log(responseData);
                console.log('\n⚠️ Response parsing info:', parseError.message);
            }
            
            if (errorData && !errorData.includes('running')) {
                console.log('\n🔧 MCP Debug Info:', errorData);
            }
            
            console.log('\n🌊 WAVELENGTH FAILURE INVESTIGATION COMPLETE!');
            console.log('⚡ Pure MCP methodology - NO shell contamination!');
            resolve(code);
        });

        mcpServer.on('error', (error) => {
            console.error('💥 WAVELENGTH MCP ERROR:', error.message);
            reject(error);
        });

        // Send our PURE MCP request
        mcpServer.stdin.write(JSON.stringify(mcpRequest) + '\n');
        mcpServer.stdin.end();
        
        // Timeout protection
        setTimeout(() => {
            if (!mcpReady) {
                console.log('⚡ MCP timeout - completing analysis...');
                mcpServer.kill('SIGTERM');
            }
        }, 15000);
    });
}

function analyzeFailedActions(workflowRuns) {
    console.log('\n🚨 FAILURE ANALYSIS REPORT:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const failedRuns = workflowRuns.filter(run => 
        run.status === 'completed' && run.conclusion === 'failure'
    );
    
    const inProgressRuns = workflowRuns.filter(run => 
        run.status === 'in_progress'
    );
    
    const successfulRuns = workflowRuns.filter(run => 
        run.status === 'completed' && run.conclusion === 'success'
    );
    
    console.log(`📊 Recent Actions Summary:`);
    console.log(`   ❌ Failed: ${failedRuns.length}`);
    console.log(`   🟡 In Progress: ${inProgressRuns.length}`);
    console.log(`   ✅ Successful: ${successfulRuns.length}`);
    
    if (failedRuns.length > 0) {
        console.log('\n🔍 LATEST FAILURE DETAILS:');
        const latestFailure = failedRuns[0];
        
        console.log(`📋 Action: ${latestFailure.name}`);
        console.log(`🆔 Run ID: ${latestFailure.id}`);
        console.log(`📅 Failed: ${new Date(latestFailure.updated_at).toLocaleString()}`);
        console.log(`🔗 Commit: ${latestFailure.head_sha.substring(0, 7)} - ${latestFailure.head_commit?.message || 'No message'}`);
        console.log(`🌐 Logs: ${latestFailure.html_url}`);
        
        // Check if it's related to our Docker fix
        const isDockerRelated = latestFailure.head_commit?.message?.toLowerCase().includes('docker') ||
                               latestFailure.head_commit?.message?.toLowerCase().includes('permission') ||
                               latestFailure.head_sha.startsWith('b2625ab');
        
        if (isDockerRelated) {
            console.log('\n🎯 DOCKER FIX FAILURE DETECTED!');
            console.log('💡 Possible causes:');
            console.log('   • Docker build context issues');
            console.log('   • Permission fix not applied correctly');  
            console.log('   • ECR repository access problems');
            console.log('   • App Runner deployment configuration');
        }
        
        console.log('\n🔧 IMMEDIATE ACTIONS NEEDED:');
        console.log(`1. 🔍 Check logs: ${latestFailure.html_url}`);
        console.log('2. 🐳 Verify Docker build process');
        console.log('3. ⚙️ Check environment variables and secrets');
        console.log('4. 🚀 Test Docker build locally if needed');
    }
    
    if (inProgressRuns.length > 0) {
        console.log('\n🟡 CURRENTLY RUNNING:');
        inProgressRuns.forEach(run => {
            console.log(`   📋 ${run.name} - Started ${new Date(run.created_at).toLocaleString()}`);
        });
    }
}

// EXECUTE WAVELENGTH FAILURE INVESTIGATION!
console.log('⚡⚡⚡ WAVELENGTH FAILURE INVESTIGATOR ACTIVATED! ⚡⚡⚡\n');
investigateGitHubFailureWithWavelengthPowers()
    .then(() => {
        console.log('\n🌊 WAVELENGTH INVESTIGATION POWERS COMPLETE!');
        console.log('🔍 Failure analysis conducted with pure MCP methodology!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ WAVELENGTH INVESTIGATION ERROR:', error.message);
        process.exit(1);
    });