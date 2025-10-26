#!/usr/bin/env node

/**
 * 🌊⚡ WAVELENGTH SESSION STATUS ⚡🌊
 * 
 * MISSION: Show current session state and available actions
 * USAGE: node session-status.js
 */

const fs = require('fs');
const path = require('path');

console.log('🌊⚡ WAVELENGTH SESSION STATUS ⚡🌊\n');

// Load session data
const sessionFile = '.wavelength-session.json';
if (!fs.existsSync(sessionFile)) {
  console.log('❌ No active WAVELENGTH session found!');
  console.log('🚀 Start a new session: node start-wavelength-session.js\n');
  process.exit(1);
}

const sessionData = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));

console.log('📊 CURRENT SESSION INFO:');
console.log(`   🎯 Session ID: ${sessionData.sessionId}`);
console.log(`   ⏰ Started: ${new Date(sessionData.startTime).toLocaleString()}`);
console.log(`   🎪 Focus: ${sessionData.currentFocus}`);

const uptime = new Date() - new Date(sessionData.startTime);
const hours = Math.floor(uptime / (1000 * 60 * 60));
const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
console.log(`   ⌛ Uptime: ${hours}h ${minutes}m`);

console.log('\n🧠 AI CAPABILITIES:');
console.log(`   🔥 Super Powers: ${sessionData.capabilities.totalSuperPowers}`);
console.log(`   ⚡ Level 10 Tools: ${sessionData.capabilities.level10Powers}`);
console.log(`   📚 Learning Entries: ${sessionData.capabilities.learningHistory}`);

console.log('\n🏆 SESSION ACHIEVEMENTS:');
if (sessionData.achievements && sessionData.achievements.length > 0) {
  sessionData.achievements.forEach((achievement, index) => {
    console.log(`   ${index + 1}. ${achievement}`);
  });
} else {
  console.log('   📝 No achievements recorded yet');
}

console.log('\n⚡ PROJECT STATUS:');
console.log(`   📁 Git: ${sessionData.projectState.gitStatus}`);
console.log(`   🏗️ Build: ${sessionData.projectState.buildStatus}`);
console.log(`   🚀 Deploy: ${sessionData.projectState.lastDeployment}`);
console.log(`   ⚙️ Config: ${sessionData.projectState.configHealth}`);

if (sessionData.projectState.criticalIssues && sessionData.projectState.criticalIssues.length > 0) {
  console.log('\n🚨 CRITICAL ISSUES:');
  sessionData.projectState.criticalIssues.forEach((issue, index) => {
    console.log(`   ${index + 1}. ${issue}`);
  });
} else {
  console.log('\n✅ No critical issues detected');
}

console.log('\n🚀 QUICK ACTIONS AVAILABLE:');
sessionData.quickActions.slice(0, 3).forEach((action, index) => {
  console.log(`\n   ${index + 1}. 🎯 ${action.name}`);
  console.log(`      ${action.description}`);
  console.log(`      💻 ${action.command}`);
});

console.log('\n🌊 WAVELENGTH SESSION ACTIVE AND READY! ⚡');