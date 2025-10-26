#!/usr/bin/env node

/**
 * 🌊⚡ WAVELENGTH SESSION STARTUP LAUNCHER ⚡🌊
 * 
 * MISSION: Single command to start friction-free WAVELENGTH sessions
 * USAGE: node start-wavelength-session.js
 * 
 * This is your ONE-CLICK session starter!
 */

console.log('🌊⚡ LAUNCHING WAVELENGTH SESSION ENVIRONMENT ⚡🌊\n');

const { spawn } = require('child_process');
const path = require('path');

// Launch the comprehensive session startup
const startupProcess = spawn('node', [
  path.join(__dirname, 'wavelength-tools', 'wavelength-session-startup.js')
], {
  stdio: 'inherit',
  cwd: __dirname,
  env: { ...process.env, FORCE_COLOR: '1' }
});

startupProcess.on('close', (code) => {
  if (code === 0) {
    console.log('\n🏁 WAVELENGTH SESSION ENVIRONMENT LAUNCHED SUCCESSFULLY!');
    console.log('🚀 Ready for maximum velocity development!');
  } else {
    console.log(`\n💥 Session startup exited with code ${code}`);
    process.exit(code);
  }
});

startupProcess.on('error', (error) => {
  console.error('💥 Failed to start WAVELENGTH session:', error.message);
  process.exit(1);
});