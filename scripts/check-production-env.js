#!/usr/bin/env node

/**
 * Quick Production Environment Check
 * Check current environment variables in production to diagnose port issues
 */

const AppRunnerEnvUpdater = require('./apprunner-env-updater');

async function main() {
  try {
    require('dotenv').config();
    
    console.log('🔍 Checking Production Environment Variables');
    console.log('═══════════════════════════════════════════════════════════════');
    
    const serviceArn = 'arn:aws:apprunner:us-east-1:170023515523:service/wavelength-lore-service/829c542fc95c419090494817f7046eaa';
    const updater = new AppRunnerEnvUpdater(serviceArn);
    
    // Get current service configuration
    const currentService = await updater.getCurrentServiceConfig();
    const envVars = currentService.SourceConfiguration?.ImageRepository?.ImageConfiguration?.RuntimeEnvironmentVariables || {};
    
    console.log(`📊 Service: ${currentService.ServiceName}`);
    console.log(`🔄 Status: ${currentService.Status}`);
    console.log(`🌐 URL: ${currentService.ServiceUrl}`);
    
    console.log('\n🔍 Port-Related Environment Variables:');
    const portVars = ['PORT', 'NODE_PORT', 'NGINX_PORT'];
    
    portVars.forEach(varName => {
      const value = envVars[varName];
      const status = value ? '✅' : '❌';
      console.log(`  ${status} ${varName}: ${value || 'NOT SET'}`);
    });
    
    // Analyze the configuration
    console.log('\n🔧 Configuration Analysis:');
    const nodePort = envVars.NODE_PORT || envVars.PORT || '3001';
    const nginxPort = envVars.NGINX_PORT || '8080';
    
    console.log(`  📱 Node.js will run on: ${nodePort}`);
    console.log(`  🌐 Nginx listens on: ${nginxPort}`);
    console.log(`  🔗 Nginx expects Node.js on: 3001`);
    
    // Identify the problem
    console.log('\n🚨 Issue Analysis:');
    if (envVars.PORT && envVars.PORT !== '3001') {
      console.log(`  ❌ PROBLEM: PORT=${envVars.PORT} overrides NODE_PORT`);
      console.log(`  💡 SOLUTION: Remove PORT variable or set PORT=3001`);
    }
    
    if (!envVars.NODE_PORT) {
      console.log(`  ❌ PROBLEM: NODE_PORT is not set`);
      console.log(`  💡 SOLUTION: Set NODE_PORT=3001`);
    } else if (envVars.NODE_PORT !== '3001') {
      console.log(`  ❌ PROBLEM: NODE_PORT=${envVars.NODE_PORT} should be 3001`);
      console.log(`  💡 SOLUTION: Set NODE_PORT=3001`);
    }
    
    if (nodePort !== '3001') {
      console.log(`  ❌ CRITICAL: Node.js will run on ${nodePort}, but Nginx expects 3001`);
      console.log(`  🔥 RESULT: This causes 502 Bad Gateway errors`);
    } else {
      console.log(`  ✅ Port configuration should be correct`);
    }
    
    // Show the fix
    console.log('\n🔧 Recommended Fix:');
    if (envVars.PORT && envVars.PORT !== '3001') {
      console.log('  1. Remove the PORT environment variable');
      console.log('  2. Ensure NODE_PORT=3001');
      console.log('  3. Redeploy the service');
      
      console.log('\n💡 Quick Fix Command:');
      console.log('   Run: node scripts/production-port-fix.js');
    } else {
      console.log('  ✅ Configuration appears correct');
      console.log('  🤔 Check if there are other issues (Docker, Nginx config, etc.)');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();