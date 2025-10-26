#!/usr/bin/env node

/**
 * 🌊⚡ WAVELENGTH DOCKER BUILD DIAGNOSTIC TEST ⚡🌊
 * 
 * MISSION: Test and fix Docker build startup script issue
 * ISSUE: /usr/local/bin/docker-entrypoint.sh: exec: line 11: /app/start.sh: not found
 * 
 * TDD METHODOLOGY - TEST FIRST!
 */

const fs = require('fs');
const path = require('path');

console.log('🧪⚡ WAVELENGTH DOCKER BUILD DIAGNOSTIC TEST ⚡🧪\n');

class DockerBuildDiagnostic {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      issues: []
    };
  }

  runTest(testName, condition, errorMessage) {
    console.log(`🔍 Testing: ${testName}`);
    
    if (condition) {
      console.log(`   ✅ PASS: ${testName}`);
      this.testResults.passed++;
      return true;
    } else {
      console.log(`   ❌ FAIL: ${testName}`);
      console.log(`   💥 Issue: ${errorMessage}`);
      this.testResults.failed++;
      this.testResults.issues.push({ test: testName, error: errorMessage });
      return false;
    }
  }

  async runDiagnostics() {
    console.log('🔍 DIAGNOSING DOCKER BUILD ISSUE...\n');
    
    // Test 1: Check if docker-start.sh exists
    const dockerStartExists = fs.existsSync('docker-start.sh');
    this.runTest(
      'Docker startup script exists',
      dockerStartExists,
      'docker-start.sh not found in root directory'
    );

    // Test 2: Check if script is executable
    if (dockerStartExists) {
      try {
        const stats = fs.statSync('docker-start.sh');
        const isExecutable = !!(stats.mode & parseInt('111', 8));
        this.runTest(
          'Docker startup script is executable',
          isExecutable,
          'docker-start.sh lacks execute permissions'
        );
      } catch (error) {
        this.runTest('Docker startup script permissions', false, error.message);
      }
    }

    // Test 3: Check Dockerfile COPY command
    const dockerfileExists = fs.existsSync('Dockerfile');
    this.runTest(
      'Dockerfile exists',
      dockerfileExists,
      'Dockerfile not found'
    );

    if (dockerfileExists) {
      const dockerfileContent = fs.readFileSync('Dockerfile', 'utf8');
      
      // Test 4: Check if Dockerfile copies the script correctly
      const copyCommandExists = dockerfileContent.includes('COPY --chown=appuser:nodejs docker-start.sh /app/start.sh');
      this.runTest(
        'Dockerfile copies startup script correctly',
        copyCommandExists,
        'Dockerfile does not copy docker-start.sh to /app/start.sh'
      );

      // Test 5: Check if CMD points to correct script
      const cmdCorrect = dockerfileContent.includes('CMD ["/app/start.sh"]');
      this.runTest(
        'Dockerfile CMD points to correct script',
        cmdCorrect,
        'Dockerfile CMD does not point to /app/start.sh'
      );

      // Test 6: Check if script permissions are set
      const chmodExists = dockerfileContent.includes('chmod +x /app/start.sh');
      this.runTest(
        'Dockerfile sets execute permissions',
        chmodExists,
        'Dockerfile does not set execute permissions on /app/start.sh'
      );
    }

    console.log('\n📊 DIAGNOSTIC RESULTS:');
    console.log(`   ✅ Tests Passed: ${this.testResults.passed}`);
    console.log(`   ❌ Tests Failed: ${this.testResults.failed}`);
    
    if (this.testResults.issues.length > 0) {
      console.log('\n🚨 IDENTIFIED ISSUES:');
      this.testResults.issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue.test}: ${issue.error}`);
      });
    }

    return this.testResults;
  }

  generateFixRecommendations() {
    console.log('\n🔧 WAVELENGTH SUPER POWER FIX RECOMMENDATIONS:\n');
    
    if (this.testResults.issues.length === 0) {
      console.log('✅ No issues detected - Docker build should work correctly!');
      return;
    }

    console.log('🎯 ISSUES TO FIX:');
    this.testResults.issues.forEach((issue, index) => {
      console.log(`\n${index + 1}. **${issue.test}**`);
      console.log(`   Problem: ${issue.error}`);
      
      // Provide specific fix recommendations
      switch (issue.test) {
        case 'Docker startup script exists':
          console.log('   Fix: Ensure docker-start.sh exists in project root');
          break;
        case 'Docker startup script is executable':
          console.log('   Fix: Run chmod +x docker-start.sh');
          break;
        case 'Dockerfile copies startup script correctly':
          console.log('   Fix: Ensure Dockerfile has: COPY --chown=appuser:nodejs docker-start.sh /app/start.sh');
          break;
        case 'Dockerfile CMD points to correct script':
          console.log('   Fix: Ensure Dockerfile has: CMD ["/app/start.sh"]');
          break;
        case 'Dockerfile sets execute permissions':
          console.log('   Fix: Ensure Dockerfile has: RUN chmod +x /app/start.sh');
          break;
      }
    });

    console.log('\n🌊 RECOMMENDED ACTION: Use WAVELENGTH Docker Path Fixer tool');
    console.log('💻 Command: node wavelength-tools/wavelength-docker-path-fixer.js');
  }
}

// EXECUTE DIAGNOSTIC TEST
async function runDiagnostic() {
  const diagnostic = new DockerBuildDiagnostic();
  const results = await diagnostic.runDiagnostics();
  diagnostic.generateFixRecommendations();
  
  console.log('\n🌊⚡ DOCKER BUILD DIAGNOSTIC COMPLETE! ⚡🌊');
  
  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

runDiagnostic().catch(error => {
  console.error('💥 Diagnostic error:', error.message);
  process.exit(1);
});