#!/usr/bin/env node
/**
 * WAVELENGTH AWS SES SETUP ASSISTANT
 * ==================================
 * 
 * Guides you through AWS SES verification and configuration
 */

const { SESClient, GetIdentityVerificationAttributesCommand, VerifyEmailIdentityCommand, GetSendQuotaCommand } = require('@aws-sdk/client-ses');

class AWSSESSetupAssistant {
  constructor() {
    this.sesClient = new SESClient({
      region: process.env.AWS_SES_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });
    
    this.fromEmail = process.env.FROM_EMAIL || 'orders@wavelengthlore.com';
    this.supportEmail = process.env.SUPPORT_EMAIL || 'support@wavelengthlore.com';
  }

  async runSetup() {
    console.log('🌊 WAVELENGTH AWS SES SETUP ASSISTANT');
    console.log('====================================');
    console.log('');

    try {
      await this.checkSESConnection();
      await this.checkCurrentQuota();
      await this.checkEmailVerificationStatus();
      await this.provideSESSetupSteps();
      await this.verifyEmailsIfNeeded();
    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      this.provideTroubleshootingSteps();
    }
  }

  async checkSESConnection() {
    console.log('🔍 CHECKING AWS SES CONNECTION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
      const command = new GetSendQuotaCommand({});
      const result = await this.sesClient.send(command);
      
      console.log('✅ Successfully connected to AWS SES');
      console.log(`📧 Daily Send Quota: ${result.Max24HourSend}`);
      console.log(`📈 Current Usage: ${result.SentLast24Hours}`);
      console.log(`⚡ Send Rate: ${result.MaxSendRate} emails per second`);
      console.log('');
      
      return true;
    } catch (error) {
      console.error('❌ Failed to connect to AWS SES:', error.message);
      throw error;
    }
  }

  async checkCurrentQuota() {
    console.log('🔍 CHECKING SES SANDBOX STATUS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
      const command = new GetSendQuotaCommand({});
      const result = await this.sesClient.send(command);
      
      if (result.Max24HourSend <= 200) {
        console.log('⚠️  Your account is in SES SANDBOX MODE');
        console.log('📝 This means you can only send emails to verified addresses');
        console.log('🎯 To send to any email address, request production access');
        console.log('');
      } else {
        console.log('✅ Your account has production access');
        console.log('📧 You can send emails to any address');
        console.log('');
      }
    } catch (error) {
      console.warn('⚠️  Could not check sandbox status:', error.message);
    }
  }

  async checkEmailVerificationStatus() {
    console.log('🔍 CHECKING EMAIL VERIFICATION STATUS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const emailsToCheck = [this.fromEmail];
    if (this.supportEmail !== this.fromEmail) {
      emailsToCheck.push(this.supportEmail);
    }

    try {
      const command = new GetIdentityVerificationAttributesCommand({
        Identities: emailsToCheck
      });

      const result = await this.sesClient.send(command);

      for (const email of emailsToCheck) {
        if (result.VerificationAttributes[email]) {
          const status = result.VerificationAttributes[email].VerificationStatus;
          const statusIcon = status === 'Success' ? '✅' : status === 'Pending' ? '⏳' : '❌';
          console.log(`${statusIcon} ${email}: ${status}`);
        } else {
          console.log(`❌ ${email}: Not added to SES`);
        }
      }

      console.log('');
      return result.VerificationAttributes;
    } catch (error) {
      console.error('❌ Failed to check verification status:', error.message);
      return {};
    }
  }

  async provideSESSetupSteps() {
    console.log('📋 AWS SES SETUP STEPS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━');

    console.log('**STEP 1: AWS SES Console Setup**');
    console.log('1. Open AWS SES Console: https://console.aws.amazon.com/ses/');
    console.log('2. Make sure you\'re in the correct region: us-east-1');
    console.log('3. Navigate to "Verified identities" in the left sidebar');
    console.log('');

    console.log('**STEP 2: Verify Email Addresses**');
    console.log('1. Click "Create identity"');
    console.log('2. Choose "Email address"');
    console.log(`3. Enter: ${this.fromEmail}`);
    console.log('4. Click "Create identity"');
    console.log('5. Check your email and click the verification link');
    console.log('');

    if (this.supportEmail !== this.fromEmail) {
      console.log('**STEP 3: Verify Support Email**');
      console.log(`Repeat the same process for: ${this.supportEmail}`);
      console.log('');
    }

    console.log('**STEP 4: Request Production Access (Optional)**');
    console.log('1. In SES Console, go to "Account dashboard"');
    console.log('2. Find "Request production access" section');
    console.log('3. Click "Request production access"');
    console.log('4. Fill out the form explaining your use case');
    console.log('5. AWS typically approves within 24-48 hours');
    console.log('');
  }

  async verifyEmailsIfNeeded() {
    console.log('🔧 AUTOMATED EMAIL VERIFICATION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const question = (prompt) => new Promise((resolve) => {
      rl.question(prompt, resolve);
    });

    try {
      const shouldVerify = await question('Would you like me to send verification emails now? (y/n): ');
      
      if (shouldVerify.toLowerCase().startsWith('y')) {
        console.log('📧 Sending verification emails...');
        
        const emailsToVerify = [this.fromEmail];
        if (this.supportEmail !== this.fromEmail) {
          emailsToVerify.push(this.supportEmail);
        }

        for (const email of emailsToVerify) {
          try {
            const command = new VerifyEmailIdentityCommand({ EmailAddress: email });
            await this.sesClient.send(command);
            console.log(`✅ Verification email sent to: ${email}`);
          } catch (error) {
            console.error(`❌ Failed to send verification to ${email}:`, error.message);
          }
        }

        console.log('');
        console.log('📬 Check your email inbox(es) and click the verification links!');
        console.log('⏰ Verification typically takes 1-2 minutes after clicking the link');
      }
    } catch (error) {
      console.error('❌ Error in verification process:', error.message);
    } finally {
      rl.close();
    }

    console.log('');
  }

  provideTroubleshootingSteps() {
    console.log('');
    console.log('🔧 TROUBLESHOOTING STEPS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('**If you see permission errors:**');
    console.log('1. Check that your AWS credentials have SES permissions');
    console.log('2. Try attaching the "AmazonSESFullAccess" policy to your user');
    console.log('3. Make sure you\'re in the correct AWS region');
    console.log('');
    console.log('**If emails don\'t arrive:**');
    console.log('1. Check your spam/junk folder');
    console.log('2. Wait 5-10 minutes (AWS can be slow)');
    console.log('3. Try a different email address');
    console.log('');
    console.log('**Alternative: Use SendGrid instead**');
    console.log('• Run: npm run wavelength:configure-email');
    console.log('• Choose SendGrid (much easier setup)');
    console.log('• No email verification required');
  }
}

// Run the setup assistant
async function main() {
  require('dotenv').config();
  const assistant = new AWSSESSetupAssistant();
  await assistant.runSetup();
}

// Execute if run directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Setup assistant failed:', error);
    process.exit(1);
  });
}

module.exports = AWSSESSetupAssistant;