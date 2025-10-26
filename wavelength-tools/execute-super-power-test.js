// WAVELENGTH SUPER POWER: Direct Node Execution
const { spawn } = require('child_process');

console.log('🚀 EXECUTING WAVELENGTH SUPER POWER TEST...\n');

const child = spawn('node', ['test-aria-post-super-power.js'], {
    stdio: 'inherit',
    cwd: process.cwd()
});

child.on('close', (code) => {
    console.log(`\n✅ Test completed with exit code: ${code}`);
    process.exit(code);
});

child.on('error', (error) => {
    console.error('❌ Execution error:', error.message);
    process.exit(1);
});