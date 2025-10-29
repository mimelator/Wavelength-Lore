#!/usr/bin/env node
/**
 * WAVELENGTH AWS SES VERIFICATION CHECKER
 * ======================================
 * 
 * Checks the status of your AWS SES domain and DNS configuration
 */

const { SESClient, GetIdentityVerificationAttributesCommand, GetIdentityDkimAttributesCommand } = require('@aws-sdk/client-ses');
const dns = require('dns').promises;

class SESVerificationChecker {
  constructor() {
    this.sesClient = new SESClient({
      region: process.env.AWS_SES_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });
    
    this.domain = 'wavelengthlore.com';
    this.mailFromDomain = 'mail.wavelengthlore.com';
    this.checks = [];
  }

  async runVerification() {
    console.log('🌊 WAVELENGTH AWS SES VERIFICATION CHECKER');
    console.log('==========================================');
    console.log('');

    await this.checkAWSSESStatus();
    await this.checkDNSRecords();
    await this.generateReport();
    await this.provideNextSteps();
  }

  async checkAWSSESStatus() {
    console.log('🔍 CHECKING AWS SES STATUS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
      // Check domain verification
      const verificationCommand = new GetIdentityVerificationAttributesCommand({
        Identities: [this.domain]
      });
      const verificationResult = await this.sesClient.send(verificationCommand);

      if (verificationResult.VerificationAttributes[this.domain]) {
        const status = verificationResult.VerificationAttributes[this.domain].VerificationStatus;
        const token = verificationResult.VerificationAttributes[this.domain].VerificationToken;
        
        console.log(`📊 Domain Verification: ${status}`);
        this.domainVerificationToken = token;
        this.addCheck('Domain in SES', status === 'Success', `Domain ${this.domain} verification status: ${status}`);
      } else {
        console.log('❌ Domain not found in AWS SES');
        this.addCheck('Domain in SES', false, 'Domain not added to AWS SES yet');
      }

      // Check DKIM
      const dkimCommand = new GetIdentityDkimAttributesCommand({
        Identities: [this.domain]
      });
      const dkimResult = await this.sesClient.send(dkimCommand);

      if (dkimResult.DkimAttributes[this.domain]) {
        const dkimEnabled = dkimResult.DkimAttributes[this.domain].DkimEnabled;
        const dkimTokens = dkimResult.DkimAttributes[this.domain].DkimTokens;
        
        console.log(`🔐 DKIM Enabled: ${dkimEnabled}`);
        this.dkimTokens = dkimTokens;
        this.addCheck('DKIM Configuration', dkimEnabled, `DKIM is ${dkimEnabled ? 'enabled' : 'disabled'}`);
      } else {
        this.addCheck('DKIM Configuration', false, 'DKIM not configured');
      }

    } catch (error) {
      console.error('❌ Failed to check AWS SES status:', error.message);
      this.addCheck('AWS SES Connection', false, `Connection failed: ${error.message}`);
    }

    console.log('');
  }

  async checkDNSRecords() {
    console.log('🔍 CHECKING DNS RECORDS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━');

    // Check domain verification TXT record
    if (this.domainVerificationToken) {
      await this.checkTXTRecord(`_amazonses.${this.domain}`, this.domainVerificationToken, 'Domain Verification');
    }

    // Check DKIM CNAME records
    if (this.dkimTokens && this.dkimTokens.length > 0) {
      for (const token of this.dkimTokens) {
        await this.checkCNAMERecord(
          `${token}._domainkey.${this.domain}`,
          `${token}.dkim.amazonses.com`,
          `DKIM Token ${token.substring(0, 8)}...`
        );
      }
    }

    // Check MAIL FROM MX record
    await this.checkMXRecord(this.mailFromDomain, 'feedback-smtp.us-east-1.amazonses.com', 'MAIL FROM MX');

    // Check SPF TXT record
    await this.checkTXTRecord(this.mailFromDomain, 'v=spf1 include:amazonses.com', 'SPF Record');

    console.log('');
  }

  async checkTXTRecord(name, expectedValue, description) {
    try {
      const records = await dns.resolveTxt(name);
      const found = records.some(record => 
        record.join('').includes(expectedValue) || 
        expectedValue.includes(record.join(''))
      );
      
      if (found) {
        console.log(`✅ ${description}: Found`);
        this.addCheck(description, true, `TXT record found for ${name}`);
      } else {
        console.log(`❌ ${description}: Not found or incorrect`);
        this.addCheck(description, false, `TXT record missing or incorrect for ${name}`);
      }
    } catch (error) {
      console.log(`❌ ${description}: DNS lookup failed`);
      this.addCheck(description, false, `DNS lookup failed for ${name}: ${error.code}`);
    }
  }

  async checkCNAMERecord(name, expectedValue, description) {
    try {
      const records = await dns.resolveCname(name);
      const found = records.includes(expectedValue);
      
      if (found) {
        console.log(`✅ ${description}: Correct`);
        this.addCheck(description, true, `CNAME record correct for ${name}`);
      } else {
        console.log(`❌ ${description}: Incorrect (found: ${records.join(', ')})`);
        this.addCheck(description, false, `CNAME record incorrect for ${name}`);
      }
    } catch (error) {
      console.log(`❌ ${description}: Not found`);
      this.addCheck(description, false, `CNAME record missing for ${name}`);
    }
  }

  async checkMXRecord(name, expectedValue, description) {
    try {
      const records = await dns.resolveMx(name);
      const found = records.some(record => record.exchange === expectedValue);
      
      if (found) {
        console.log(`✅ ${description}: Correct`);
        this.addCheck(description, true, `MX record correct for ${name}`);
      } else {
        console.log(`❌ ${description}: Not found`);
        this.addCheck(description, false, `MX record missing for ${name}`);
      }
    } catch (error) {
      console.log(`❌ ${description}: DNS lookup failed`);
      this.addCheck(description, false, `MX record lookup failed for ${name}`);
    }
  }

  addCheck(name, passed, message) {
    this.checks.push({ name, passed, message });
  }

  async generateReport() {
    console.log('📊 VERIFICATION REPORT');
    console.log('━━━━━━━━━━━━━━━━━━━━━━');

    const passed = this.checks.filter(check => check.passed).length;
    const total = this.checks.length;
    const percentage = Math.round((passed / total) * 100);

    console.log(`✅ Passed: ${passed}/${total} (${percentage}%)`);
    console.log('');

    console.log('📋 DETAILED RESULTS:');
    this.checks.forEach(check => {
      const icon = check.passed ? '✅' : '❌';
      console.log(`${icon} ${check.name}: ${check.message}`);
    });

    console.log('');
  }

  async provideNextSteps() {
    console.log('🎯 NEXT STEPS');
    console.log('━━━━━━━━━━━━━');

    const failedChecks = this.checks.filter(check => !check.passed);

    if (failedChecks.length === 0) {
      console.log('🎉 All checks passed! Your AWS SES is ready to use.');
      console.log('');
      console.log('🧪 Test your email system:');
      console.log('   npm run wavelength:test-email');
      console.log('');
      console.log('🚀 Deploy to production with SES enabled!');
    } else {
      console.log('⚠️  Some checks failed. Here\'s what to do:');
      console.log('');

      failedChecks.forEach((check, index) => {
        console.log(`${index + 1}. ${check.name}: ${check.message}`);
      });

      console.log('');
      console.log('🔧 Common solutions:');
      console.log('• Wait for DNS propagation (up to 48 hours)');
      console.log('• Double-check DNS records in your provider');
      console.log('• Verify domain setup in AWS SES Console');
      console.log('• Run this checker again: node wavelength-tools/wavelength-ses-verification-checker.js');
    }
  }
}

// Run the verification checker
async function main() {
  require('dotenv').config();
  const checker = new SESVerificationChecker();
  await checker.runVerification();
}

// Execute if run directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Verification checker failed:', error);
    process.exit(1);
  });
}

module.exports = SESVerificationChecker;