#!/usr/bin/env node

/**
 * Post-Deployment Hook
 * Automatically records deployments and performs post-deploy tasks
 */

const DeploymentTracker = require('./deployment-tracker');

async function runPostDeploymentTasks() {
  console.log('🔄 Running post-deployment tasks...');
  
  const tracker = new DeploymentTracker();
  
  // Auto-record new deployments
  const recorded = tracker.autoRecordIfNew();
  
  // Show current status
  const current = tracker.getCurrentDeployment();
  if (current) {
    console.log('\n📊 Current Deployment:');
    console.log(`   Version: v${current.version}`);
    console.log(`   Build: #${current.buildNumber}`);
    console.log(`   Commit: ${current.commitShort}`);
    
    if (recorded) {
      console.log('   Status: ✅ Recorded to history');
    } else {
      console.log('   Status: ℹ️  Already in history');
    }
  }
  
  console.log('\n🎉 Post-deployment tasks completed!');
}

if (require.main === module) {
  runPostDeploymentTasks().catch(error => {
    console.error('❌ Post-deployment hook failed:', error.message);
    process.exit(1);
  });
}

module.exports = runPostDeploymentTasks;