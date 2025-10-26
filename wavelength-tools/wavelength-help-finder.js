#!/usr/bin/env node
/**
 * 🌊⚡ WAVELENGTH HELP FINDER ⚡🌊
 * USAGE: node wavelength-tools/wavelength-help-finder.js [issue]
 */

const issue = process.argv[2] || '';

console.log('🆘 WAVELENGTH HELP FINDER\n');

const solutions = {
  'build-failure': 'node wavelength-tools/wavelength-enhanced-build-monitor.js',
  'docker-error': 'node wavelength-tools/wavelength-docker-build-validator.js',
  'config-missing': 'node wavelength-tools/wavelength-config-discovery.js',
  'test-failing': 'node scripts/unified/test-runner.js health --url https://wavelengthlore.com',
  'session-broken': 'node start-wavelength-session.js'
};

if (!issue) {
  console.log('🚨 COMMON ISSUES & SOLUTIONS:');
  Object.keys(solutions).forEach(problem => {
    console.log(`   🔧 ${problem}: ${solutions[problem]}`);
  });
} else {
  const solution = solutions[issue] || solutions[`${issue}-error`] || solutions[`${issue}-failure`];
  if (solution) {
    console.log(`🎯 SOLUTION FOR: ${issue}`);
    console.log(`💻 RUN: ${solution}`);
  } else {
    console.log(`❌ No solution found for: ${issue}`);
    console.log('💡 Try: build-failure, docker-error, config-missing, test-failing, session-broken');
  }
}