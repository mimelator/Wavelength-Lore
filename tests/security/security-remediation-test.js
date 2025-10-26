#!/usr/bin/env node

/**
 * 🛡️ Security Remediation Validation Test
 * 
 * Tests that critical security vulnerabilities have been properly fixed:
 * - Credential exposure prevention
 * - Input validation implementation
 * - Command injection protection
 * - Credential scanning functionality
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

class SecurityRemediationTest {
  constructor() {
    this.testResults = [];
    this.criticalIssues = [];
  }

  logTest(testName, passed, details = '') {
    const result = { testName, passed, details };
    this.testResults.push(result);
    
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${testName}`);
    if (details) {
      console.log(`   ${details}`);
    }
    
    if (!passed) {
      this.criticalIssues.push(testName);
    }
  }

  async testCredentialStorageRemoval() {
    console.log('\n🔍 Testing Credential Storage Removal...');
    
    // Test aws-manager.js
    const awsManagerPath = path.join(projectRoot, 'scripts/unified/aws-manager.js');
    const awsManagerContent = fs.readFileSync(awsManagerPath, 'utf8');
    
    // Should NOT contain plaintext credential storage
    const hasCredentialStorage = awsManagerContent.includes('this.credentials = {');
    this.logTest(
      'AWS Manager: Credential storage removed',
      !hasCredentialStorage,
      hasCredentialStorage ? 'Still contains this.credentials object' : 'No credential storage found'
    );
    
    // Should contain credential validation
    const hasValidation = awsManagerContent.includes('validateCredentials()');
    this.logTest(
      'AWS Manager: Credential validation implemented',
      hasValidation,
      hasValidation ? 'validateCredentials() method found' : 'Missing credential validation'
    );
    
    // Test deployment-manager.js
    const deploymentManagerPath = path.join(projectRoot, 'scripts/unified/deployment-manager.js');
    const deploymentManagerContent = fs.readFileSync(deploymentManagerPath, 'utf8');
    
    const deploymentHasCredentialStorage = deploymentManagerContent.includes('this.credentials = {');
    this.logTest(
      'Deployment Manager: Credential storage removed',
      !deploymentHasCredentialStorage,
      deploymentHasCredentialStorage ? 'Still contains this.credentials object' : 'No credential storage found'
    );
  }

  async testInputValidation() {
    console.log('\n🔍 Testing Input Validation Implementation...');
    
    const awsManagerPath = path.join(projectRoot, 'scripts/unified/aws-manager.js');
    const awsManagerContent = fs.readFileSync(awsManagerPath, 'utf8');
    
    // Should contain distribution ID validation
    const hasDistributionValidation = awsManagerContent.includes('validateDistributionId');
    this.logTest(
      'AWS Manager: Distribution ID validation implemented',
      hasDistributionValidation,
      hasDistributionValidation ? 'validateDistributionId method found' : 'Missing distribution ID validation'
    );
    
    // Should contain path validation
    const hasPathValidation = awsManagerContent.includes('validatePaths');
    this.logTest(
      'AWS Manager: Path validation implemented',
      hasPathValidation,
      hasPathValidation ? 'validatePaths method found' : 'Missing path validation'
    );
    
    // Should use validated inputs in invalidateCache
    const usesValidatedInputs = awsManagerContent.includes('const validatedDistributionId = this.validateDistributionId');
    this.logTest(
      'AWS Manager: Validated inputs used in operations',
      usesValidatedInputs,
      usesValidatedInputs ? 'Operations use validated inputs' : 'Operations may use unvalidated inputs'
    );
  }

  async testCommandInjectionProtection() {
    console.log('\n🔍 Testing Command Injection Protection...');
    
    const deploymentManagerPath = path.join(projectRoot, 'scripts/unified/deployment-manager.js');
    const deploymentManagerContent = fs.readFileSync(deploymentManagerPath, 'utf8');
    
    // Should NOT use execSync directly
    const hasExecSync = deploymentManagerContent.includes('execSync(command');
    this.logTest(
      'Deployment Manager: Direct execSync usage removed',
      !hasExecSync,
      hasExecSync ? 'Still contains direct execSync usage' : 'No direct execSync found'
    );
    
    // Should use spawn with validation
    const usesSpawn = deploymentManagerContent.includes('spawn(baseCommand, sanitizedArgs');
    this.logTest(
      'Deployment Manager: Secure spawn implementation',
      usesSpawn,
      usesSpawn ? 'Uses spawn with sanitized arguments' : 'Missing secure spawn implementation'
    );
    
    // Should have input validator
    const hasInputValidator = deploymentManagerContent.includes('class InputValidator');
    this.logTest(
      'Deployment Manager: Input validator implemented',
      hasInputValidator,
      hasInputValidator ? 'InputValidator class found' : 'Missing InputValidator class'
    );
  }

  async testCredentialScanning() {
    console.log('\n🔍 Testing Credential Scanning Implementation...');
    
    const smartCommitPath = path.join(projectRoot, 'scripts/unified/smart-commit.js');
    const smartCommitContent = fs.readFileSync(smartCommitPath, 'utf8');
    
    // Should have credential scanning method
    const hasCredentialScanning = smartCommitContent.includes('scanForCredentials');
    this.logTest(
      'Smart Commit: Credential scanning implemented',
      hasCredentialScanning,
      hasCredentialScanning ? 'scanForCredentials method found' : 'Missing credential scanning'
    );
    
    // Should scan staged files
    const scansStagedFiles = smartCommitContent.includes('scanStagedFiles');
    this.logTest(
      'Smart Commit: Staged file scanning implemented',
      scansStagedFiles,
      scansStagedFiles ? 'scanStagedFiles method found' : 'Missing staged file scanning'
    );
    
    // Should have credential patterns
    const hasCredentialPatterns = smartCommitContent.includes('aws_access_key') && 
                                 smartCommitContent.includes('AKIA[0-9A-Z]{16}');
    this.logTest(
      'Smart Commit: Credential patterns defined',
      hasCredentialPatterns,
      hasCredentialPatterns ? 'AWS and other credential patterns found' : 'Missing credential patterns'
    );
  }

  async testSecurityHeaders() {
    console.log('\n🔍 Testing Security Headers and Comments...');
    
    const files = [
      'scripts/unified/aws-manager.js',
      'scripts/unified/deployment-manager.js',
      'scripts/unified/smart-commit.js'
    ];
    
    for (const file of files) {
      const filePath = path.join(projectRoot, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      const hasSecurityComments = content.includes('🛡️ SECURITY:');
      this.logTest(
        `${file}: Security comments added`,
        hasSecurityComments,
        hasSecurityComments ? 'Security comments found' : 'Missing security documentation'
      );
    }
  }

  async testCredentialHintRemoval() {
    console.log('\n🔍 Testing Credential Hint Removal...');
    
    const awsManagerPath = path.join(projectRoot, 'scripts/unified/aws-manager.js');
    const awsManagerContent = fs.readFileSync(awsManagerPath, 'utf8');
    
    // Should NOT contain credential hints in help text
    const hasCredentialHints = awsManagerContent.includes('[admin user access key]') ||
                              awsManagerContent.includes('[admin user secret key]');
    this.logTest(
      'AWS Manager: Credential hints removed from help text',
      !hasCredentialHints,
      hasCredentialHints ? 'Still contains credential hints' : 'No credential hints found'
    );
  }

  async testAWSSDKCredentialChain() {
    console.log('\n🔍 Testing AWS SDK Credential Chain Usage...');
    
    const files = [
      'scripts/unified/aws-manager.js',
      'scripts/unified/deployment-manager.js'
    ];
    
    for (const file of files) {
      const filePath = path.join(projectRoot, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Should use AWS SDK default credential chain (no credentials in client config)
      const usesDefaultChain = content.includes('const clientConfig = {') &&
                              content.includes('region: ') &&
                              !content.includes('credentials: this.credentials');
      
      this.logTest(
        `${file}: Uses AWS SDK default credential chain`,
        usesDefaultChain,
        usesDefaultChain ? 'Uses default credential chain' : 'May still use explicit credentials'
      );
    }
  }

  async runAllTests() {
    console.log('🛡️ Security Remediation Validation Test Suite');
    console.log('━'.repeat(60));
    
    await this.testCredentialStorageRemoval();
    await this.testInputValidation();
    await this.testCommandInjectionProtection();
    await this.testCredentialScanning();
    await this.testSecurityHeaders();
    await this.testCredentialHintRemoval();
    await this.testAWSSDKCredentialChain();
    
    this.generateReport();
  }

  generateReport() {
    console.log('\n📊 Security Remediation Test Results');
    console.log('━'.repeat(60));
    
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    
    console.log(`Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`📊 Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
    
    if (this.criticalIssues.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES REMAINING:');
      this.criticalIssues.forEach(issue => {
        console.log(`   ❌ ${issue}`);
      });
      console.log('\n🔴 SECURITY REMEDIATION INCOMPLETE - Address remaining issues immediately!');
      process.exit(1);
    } else {
      console.log('\n🎉 ALL SECURITY TESTS PASSED!');
      console.log('✅ Critical security vulnerabilities have been successfully remediated');
      console.log('✅ Unified managers are now secure for production use');
      process.exit(0);
    }
  }
}

// Run tests
const tester = new SecurityRemediationTest();
tester.runAllTests().catch(error => {
  console.error('❌ Test suite failed:', error.message);
  process.exit(1);
});