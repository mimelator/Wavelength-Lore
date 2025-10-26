#!/usr/bin/env node

/**
 * 🌊⚡ WAVELENGTH DOCKER BUILD VALIDATOR ⚡🌊
 * 
 * MISSION: Validate Docker build will succeed before pushing
 * TDD METHODOLOGY - TEST THE BUILD!
 */

const fs = require('fs');
const { spawn } = require('child_process');

console.log('🧪⚡ WAVELENGTH DOCKER BUILD VALIDATOR ⚡🧪\n');

class DockerBuildValidator {
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

  async validateBuildContext() {
    console.log('🔍 VALIDATING DOCKER BUILD CONTEXT...\n');
    
    // Test 1: Check if docker/docker-start.sh exists
    const dockerStartExists = fs.existsSync('docker/docker-start.sh');
    this.runTest(
      'Docker startup script exists at docker/docker-start.sh',
      dockerStartExists,
      'docker/docker-start.sh not found'
    );

    // Test 2: Check script permissions
    if (dockerStartExists) {
      try {
        const stats = fs.statSync('docker/docker-start.sh');
        const isExecutable = !!(stats.mode & parseInt('111', 8));
        this.runTest(
          'Docker startup script has execute permissions',
          isExecutable,
          'docker/docker-start.sh lacks execute permissions'
        );
      } catch (error) {
        this.runTest('Docker startup script permissions check', false, error.message);
      }
    }

    // Test 3: Validate Dockerfile COPY command
    const dockerfileContent = fs.readFileSync('Dockerfile', 'utf8');
    const correctCopyCommand = dockerfileContent.includes('COPY --chown=appuser:nodejs docker/docker-start.sh /app/start.sh');
    this.runTest(
      'Dockerfile uses correct COPY path',
      correctCopyCommand,
      'Dockerfile should copy docker/docker-start.sh to /app/start.sh'
    );

    // Test 4: Check all required files exist for build context
    const requiredFiles = [
      'package.json',
      'index.js',
      'app.js',
      'docker/docker-start.sh'
    ];

    let allFilesExist = true;
    const missingFiles = [];
    
    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        allFilesExist = false;
        missingFiles.push(file);
      }
    }

    this.runTest(
      'All required build files exist',
      allFilesExist,
      `Missing files: ${missingFiles.join(', ')}`
    );

    // Test 5: Validate script content
    if (dockerStartExists) {
      const scriptContent = fs.readFileSync('docker/docker-start.sh', 'utf8');
      const hasShebang = scriptContent.startsWith('#!/bin/bash');
      this.runTest(
        'Docker startup script has valid shebang',
        hasShebang,
        'Script should start with #!/bin/bash'
      );
    }

    console.log('\n📊 VALIDATION RESULTS:');
    console.log(`   ✅ Tests Passed: ${this.testResults.passed}`);
    console.log(`   ❌ Tests Failed: ${this.testResults.failed}`);
    
    if (this.testResults.issues.length > 0) {
      console.log('\n🚨 REMAINING ISSUES:');
      this.testResults.issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue.test}: ${issue.error}`);
      });
      
      console.log('\n🔧 BUILD STATUS: ❌ WILL FAIL');
      console.log('💡 Fix the issues above before building');
    } else {
      console.log('\n🔧 BUILD STATUS: ✅ READY TO BUILD');
      console.log('🚀 Docker build should succeed with current configuration');
    }

    return this.testResults.failed === 0;
  }
}

// EXECUTE VALIDATION
async function validateBuild() {
  const validator = new DockerBuildValidator();
  const isValid = await validator.validateBuildContext();
  
  console.log('\n🌊⚡ DOCKER BUILD VALIDATION COMPLETE! ⚡🌊');
  
  if (isValid) {
    console.log('✅ Ready for Docker build - all validations passed!');
    process.exit(0);
  } else {
    console.log('❌ Docker build will fail - fix issues first');
    process.exit(1);
  }
}

validateBuild().catch(error => {
  console.error('💥 Validation error:', error.message);
  process.exit(1);
});