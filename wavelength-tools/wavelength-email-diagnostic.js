#!/usr/bin/env node
/**
 * WAVELENGTH EMAIL VERIFICATION & DIAGNOSTIC TOOL
 * ==============================================
 * 
 * Diagnoses and fixes email configuration issues
 */

const https = require('https');

class EmailVerificationTool {
  constructor() {
    this.issues = [];
    this.solutions = [];
  }

  async runDiagnostics() {
    console.log('🌊 WAVELENGTH EMAIL DIAGNOSTIC TOOL');
    console.log('===================================');
    console.log('');

    await this.checkCurrentConfiguration();
    await this.checkAWSSESStatus();
    await this.provideSolutions();
  }

  checkCurrentConfiguration() {
    console.log('🔍 CHECKING CURRENT EMAIL CONFIGURATION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const provider = process.env.EMAIL_PROVIDER;
    const fromEmail = process.env.FROM_EMAIL;
    const supportEmail = process.env.SUPPORT_EMAIL;
    const awsRegion = process.env.AWS_SES_REGION;
    const awsAccessKey = process.env.AWS_ACCESS_KEY_ID;
    const awsSecretKey = process.env.AWS_SECRET_ACCESS_KEY;

    console.log(`📧 Email Provider: ${provider || 'NOT SET'}`);
    console.log(`📮 From Email: ${fromEmail || 'NOT SET'}`);
    console.log(`🆘 Support Email: ${supportEmail || 'NOT SET'}`);
    console.log(`🌍 AWS SES Region: ${awsRegion || 'NOT SET'}`);
    console.log(`🔑 AWS Access Key: ${awsAccessKey ? 'SET' : 'NOT SET'}`);
    console.log(`🗝️  AWS Secret Key: ${awsSecretKey ? 'SET' : 'NOT SET'}`);
    console.log('');

    // Check for issues
    if (provider === 'ses') {
      if (!awsAccessKey || !awsSecretKey) {
        this.issues.push('AWS SES credentials missing');
      }
      if (!fromEmail) {
        this.issues.push('FROM_EMAIL not configured');
      }
    }
  }

  async checkAWSSESStatus() {
    console.log('🔍 CHECKING AWS SES STATUS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const fromEmail = process.env.FROM_EMAIL;
    
    if (!fromEmail) {
      console.log('❌ No FROM_EMAIL configured');
      return;
    }

    console.log(`📧 Checking verification status for: ${fromEmail}`);
    
    try {
      // Try to check SES verification status
      const { SESClient, GetIdentityVerificationAttributesCommand } = require('@aws-sdk/client-ses');
      
      const sesClient = new SESClient({
        region: process.env.AWS_SES_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        }
      });

      const command = new GetIdentityVerificationAttributesCommand({
        Identities: [fromEmail]
      });

      const result = await sesClient.send(command);
      
      if (result.VerificationAttributes[fromEmail]) {
        const status = result.VerificationAttributes[fromEmail].VerificationStatus;
        console.log(`✅ Email found in SES: ${status}`);
        
        if (status !== 'Success') {
          this.issues.push(`Email ${fromEmail} verification status: ${status}`);
          this.solutions.push('Verify your email address in AWS SES Console');
        }
      } else {
        console.log(`❌ Email ${fromEmail} not found in AWS SES`);
        this.issues.push(`Email ${fromEmail} not added to AWS SES`);
        this.solutions.push('Add and verify your email address in AWS SES Console');
      }

    } catch (error) {
      console.log(`❌ Error checking SES status: ${error.message}`);
      this.issues.push('Cannot connect to AWS SES - check credentials');
    }

    console.log('');
  }

  async provideSolutions() {
    console.log('💡 SOLUTIONS & RECOMMENDATIONS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (this.issues.length === 0) {
      console.log('✅ No issues found with email configuration!');
      return;
    }

    console.log('❌ ISSUES FOUND:');
    this.issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`);
    });

    console.log('');
    console.log('🔧 RECOMMENDED SOLUTIONS:');
    console.log('');

    console.log('**OPTION 1: Fix AWS SES (Current Setup)**');
    console.log('1. Go to AWS SES Console: https://console.aws.amazon.com/ses/');
    console.log('2. Navigate to "Verified identities"');
    console.log(`3. Click "Create identity" and add: ${process.env.FROM_EMAIL}`);
    console.log('4. Check your email and click the verification link');
    console.log('5. Wait for status to change to "Verified"');
    console.log('6. Test again with: npm run wavelength:test-email');
    console.log('');

    console.log('**OPTION 2: Switch to SendGrid (Easier)**');
    console.log('1. Create account at: https://sendgrid.com');
    console.log('2. Generate API key with "Full Access"');
    console.log('3. Run: npm run wavelength:configure-email');
    console.log('4. Choose SendGrid and enter your API key');
    console.log('5. No email verification needed!');
    console.log('');

    console.log('**OPTION 3: Use Console Mode (Development)**');
    console.log('1. Set EMAIL_PROVIDER=console in .env');
    console.log('2. Emails will be logged to console (no real delivery)');
    console.log('3. Perfect for development and testing');
    console.log('');

    console.log('🎯 QUICK FIXES:');
    console.log('━━━━━━━━━━━━━━');
    console.log('• For immediate testing: npm run wavelength:configure-email');
    console.log('• Switch to console mode for development');
    console.log('• Use SendGrid for production (no verification needed)');
    console.log('• Fix AWS SES verification for current setup');
  }
}

// Run the diagnostic tool
async function main() {
  require('dotenv').config();
  const tool = new EmailVerificationTool();
  await tool.runDiagnostics();
}

// Execute if run directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Diagnostic failed:', error);
    process.exit(1);
  });
}

module.exports = EmailVerificationTool;