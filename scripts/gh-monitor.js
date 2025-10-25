#!/usr/bin/env node

/**
 * GitHub Actions Deployment Monitor
 * Easy-to-use tool for monitoring GitHub Actions workflows and deployments
 */

const { execSync } = require('child_process');
const fs = require('fs');

// ANSI color codes for better output
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

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function execCommand(command, silent = false) {
  try {
    const result = execSync(command, { 
      encoding: 'utf8',
      stdio: silent ? 'pipe' : 'inherit'
    });
    return result.trim();
  } catch (error) {
    if (!silent) {
      console.error(`${colorize('❌ Error running command:', 'red')} ${command}`);
      console.error(error.message);
    }
    return null;
  }
}

function showUsage() {
  console.log(`
${colorize('🚀 GitHub Actions Deployment Monitor', 'cyan')}
${colorize('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan')}

${colorize('Usage:', 'yellow')} npm run gh:monitor [command]

${colorize('Commands:', 'yellow')}
  ${colorize('list', 'green')}        - List recent workflow runs
  ${colorize('status', 'green')}      - Show current deployment status
  ${colorize('watch', 'green')}       - Watch the latest running workflow
  ${colorize('logs', 'green')}        - Show logs for latest workflow
  ${colorize('jobs', 'green')}        - Show job details for latest workflow
  ${colorize('compare', 'green')}     - Compare with deployment status
  ${colorize('full', 'green')}        - Full deployment dashboard

${colorize('Examples:', 'yellow')}
  npm run gh:monitor list
  npm run gh:monitor status
  npm run gh:monitor watch
  npm run gh:monitor logs
`);
}

function listWorkflows() {
  console.log(`\n${colorize('📋 Recent Workflow Runs', 'cyan')}`);
  console.log(colorize('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan'));
  
  execCommand('gh run list --limit 5');
}

function showCurrentStatus() {
  console.log(`\n${colorize('📊 Current Deployment Status', 'cyan')}`);
  console.log(colorize('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan'));
  
  // Get latest workflow run
  const latestRun = execCommand('gh run list --limit 1 --json id,status,conclusion,workflowName,createdAt', true);
  
  if (latestRun) {
    try {
      const runs = JSON.parse(latestRun);
      if (runs.length > 0) {
        const run = runs[0];
        const status = run.status === 'in_progress' ? colorize(run.status, 'yellow') : 
                      run.conclusion === 'success' ? colorize(run.conclusion, 'green') :
                      run.conclusion === 'failure' ? colorize(run.conclusion, 'red') :
                      colorize(run.status, 'blue');
        
        console.log(`${colorize('Workflow:', 'white')} ${run.workflowName}`);
        console.log(`${colorize('ID:', 'white')} ${run.id}`);
        console.log(`${colorize('Status:', 'white')} ${status}`);
        console.log(`${colorize('Started:', 'white')} ${new Date(run.createdAt).toLocaleString()}`);
        
        if (run.status === 'in_progress') {
          console.log(`\n${colorize('🔍 Getting job details...', 'yellow')}`);
          execCommand(`gh run view ${run.id}`);
        }
      }
    } catch (error) {
      console.error('Error parsing workflow data:', error.message);
    }
  }
}

function watchLatestWorkflow() {
  console.log(`\n${colorize('👀 Watching Latest Workflow', 'cyan')}`);
  console.log(colorize('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan'));
  
  // Get latest workflow run ID
  const latestRun = execCommand('gh run list --limit 1 --json id', true);
  
  if (latestRun) {
    try {
      const runs = JSON.parse(latestRun);
      if (runs.length > 0) {
        const runId = runs[0].id;
        console.log(`${colorize('Watching workflow:', 'white')} ${runId}`);
        console.log(`${colorize('Press Ctrl+C to stop watching', 'yellow')}\n`);
        
        execCommand(`gh run watch ${runId}`);
      }
    } catch (error) {
      console.error('Error getting workflow ID:', error.message);
    }
  }
}

function showLatestLogs() {
  console.log(`\n${colorize('📝 Latest Workflow Logs', 'cyan')}`);
  console.log(colorize('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan'));
  
  // Get latest workflow run ID
  const latestRun = execCommand('gh run list --limit 1 --json id', true);
  
  if (latestRun) {
    try {
      const runs = JSON.parse(latestRun);
      if (runs.length > 0) {
        const runId = runs[0].id;
        console.log(`${colorize('Showing logs for workflow:', 'white')} ${runId}\n`);
        
        execCommand(`gh run view ${runId} --log`);
      }
    } catch (error) {
      console.error('Error getting workflow ID:', error.message);
    }
  }
}

function showJobDetails() {
  console.log(`\n${colorize('🔧 Job Details', 'cyan')}`);
  console.log(colorize('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan'));
  
  // Get latest workflow run
  const latestRun = execCommand('gh run list --limit 1 --json id,jobs', true);
  
  if (latestRun) {
    try {
      const runs = JSON.parse(latestRun);
      if (runs.length > 0) {
        const run = runs[0];
        console.log(`${colorize('Workflow ID:', 'white')} ${run.id}\n`);
        
        // Get job details
        execCommand(`gh run view ${run.id}`);
        
        // If there are jobs, show detailed view of the first one
        const jobsData = execCommand(`gh api repos/:owner/:repo/actions/runs/${run.id}/jobs --jq '.jobs[0].id'`, true);
        if (jobsData) {
          console.log(`\n${colorize('📋 Detailed Job View:', 'yellow')}`);
          execCommand(`gh run view --job=${jobsData.trim()}`);
        }
      }
    } catch (error) {
      console.error('Error getting job details:', error.message);
    }
  }
}

function compareWithDeployment() {
  console.log(`\n${colorize('🔄 Deployment Comparison', 'cyan')}`);
  console.log(colorize('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan'));
  
  console.log(`${colorize('GitHub Actions Status:', 'yellow')}`);
  execCommand('gh run list --limit 1');
  
  console.log(`\n${colorize('Deployment Status:', 'yellow')}`);
  execCommand('npm run deploy:compare');
}

function fullDashboard() {
  console.log(`\n${colorize('🚀 Full Deployment Dashboard', 'cyan')}`);
  console.log(colorize('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan'));
  
  // Show current status
  showCurrentStatus();
  
  console.log(`\n${colorize('📋 Recent Workflows:', 'yellow')}`);
  execCommand('gh run list --limit 3');
  
  console.log(`\n${colorize('🏭 Production Status:', 'yellow')}`);
  execCommand('npm run deploy:status');
  
  console.log(`\n${colorize('🔄 Comparison:', 'yellow')}`);
  execCommand('npm run deploy:compare');
  
  // Show git status
  console.log(`\n${colorize('📝 Git Status:', 'yellow')}`);
  execCommand('git log --oneline -3');
}

function main() {
  const command = process.argv[2];
  
  // Check if gh CLI is available
  const ghAvailable = execCommand('which gh', true);
  if (!ghAvailable) {
    console.error(`${colorize('❌ Error:', 'red')} GitHub CLI (gh) is not installed or not in PATH`);
    console.error(`${colorize('Install with:', 'yellow')} brew install gh`);
    process.exit(1);
  }
  
  switch (command) {
    case 'list':
      listWorkflows();
      break;
    case 'status':
      showCurrentStatus();
      break;
    case 'watch':
      watchLatestWorkflow();
      break;
    case 'logs':
      showLatestLogs();
      break;
    case 'jobs':
      showJobDetails();
      break;
    case 'compare':
      compareWithDeployment();
      break;
    case 'full':
    case 'dashboard':
      fullDashboard();
      break;
    case 'help':
    case '--help':
    case '-h':
    default:
      showUsage();
      break;
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };