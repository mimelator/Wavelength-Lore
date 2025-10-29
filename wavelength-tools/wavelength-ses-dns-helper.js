#!/usr/bin/env node
/**
 * WAVELENGTH AWS SES DNS CONFIGURATION HELPER
 * ==========================================
 * 
 * Helps configure DNS records for AWS SES domain verification
 */

const { SESClient, GetIdentityDkimAttributesCommand, GetIdentityVerificationAttributesCommand, GetIdentityMailFromDomainAttributesCommand } = require('@aws-sdk/client-ses');

class SESDNSConfigHelper {
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
  }

  async runDNSSetup() {
    console.log('🌊 WAVELENGTH AWS SES DNS CONFIGURATION HELPER');
    console.log('==============================================');
    console.log('');
    console.log(`🌐 Domain: ${this.domain}`);
    console.log(`📧 MAIL FROM Domain: ${this.mailFromDomain}`);
    console.log('');

    try {
      await this.checkDomainStatus();
      await this.getDKIMRecords();
      await this.getMailFromRecords();
      await this.provideDNSInstructions();
      await this.createDNSScript();
    } catch (error) {
      console.error('❌ DNS setup helper failed:', error.message);
      this.provideManualInstructions();
    }
  }

  async checkDomainStatus() {
    console.log('🔍 CHECKING DOMAIN STATUS IN AWS SES');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
      const command = new GetIdentityVerificationAttributesCommand({
        Identities: [this.domain]
      });

      const result = await this.sesClient.send(command);
      
      if (result.VerificationAttributes[this.domain]) {
        const status = result.VerificationAttributes[this.domain].VerificationStatus;
        const token = result.VerificationAttributes[this.domain].VerificationToken;
        
        console.log(`📊 Domain Status: ${status}`);
        if (token) {
          console.log(`🔑 Verification Token: ${token}`);
        }
      } else {
        console.log('⚠️  Domain not found in SES. Please complete the AWS wizard first.');
        return false;
      }
      
      console.log('');
      return true;
    } catch (error) {
      console.log('⚠️  Could not check domain status. Proceeding with manual instructions.');
      console.log('');
      return false;
    }
  }

  async getDKIMRecords() {
    console.log('🔍 RETRIEVING DKIM RECORDS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
      const command = new GetIdentityDkimAttributesCommand({
        Identities: [this.domain]
      });

      const result = await this.sesClient.send(command);
      
      if (result.DkimAttributes[this.domain]) {
        const dkimTokens = result.DkimAttributes[this.domain].DkimTokens;
        const dkimEnabled = result.DkimAttributes[this.domain].DkimEnabled;
        
        console.log(`📧 DKIM Enabled: ${dkimEnabled}`);
        
        if (dkimTokens && dkimTokens.length > 0) {
          console.log('📝 DKIM CNAME Records to add:');
          dkimTokens.forEach((token, index) => {
            console.log(`${index + 1}. ${token}._domainkey.${this.domain} → ${token}.dkim.amazonses.com`);
          });
          
          this.dkimTokens = dkimTokens;
        } else {
          console.log('⚠️  No DKIM tokens found. Complete AWS wizard first.');
        }
      } else {
        console.log('⚠️  Domain not configured for DKIM yet.');
      }
      
      console.log('');
    } catch (error) {
      console.log('⚠️  Could not retrieve DKIM records:', error.message);
      console.log('');
    }
  }

  async getMailFromRecords() {
    console.log('🔍 CHECKING MAIL FROM DOMAIN CONFIGURATION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
      const command = new GetIdentityMailFromDomainAttributesCommand({
        Identities: [this.domain]
      });

      const result = await this.sesClient.send(command);
      
      if (result.MailFromDomainAttributes[this.domain]) {
        const mailFromDomain = result.MailFromDomainAttributes[this.domain].MailFromDomain;
        const status = result.MailFromDomainAttributes[this.domain].MailFromDomainStatus;
        
        console.log(`📧 MAIL FROM Domain: ${mailFromDomain}`);
        console.log(`📊 Status: ${status}`);
        
        this.actualMailFromDomain = mailFromDomain;
      } else {
        console.log(`📧 Using default MAIL FROM: ${this.mailFromDomain}`);
        this.actualMailFromDomain = this.mailFromDomain;
      }
      
      console.log('');
    } catch (error) {
      console.log('⚠️  Could not check MAIL FROM configuration');
      console.log('');
    }
  }

  async provideDNSInstructions() {
    console.log('📋 DNS RECORDS TO ADD');
    console.log('━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('Add these records to your DNS provider (where you manage wavelengthlore.com):');
    console.log('');

    // Domain verification record
    console.log('**1. DOMAIN VERIFICATION (TXT Record)**');
    console.log('After completing AWS wizard, you\'ll get a verification token. Add:');
    console.log(`Type: TXT`);
    console.log(`Name: _amazonses.${this.domain}`);
    console.log(`Value: [verification-token-from-aws]`);
    console.log('');

    // DKIM records
    console.log('**2. DKIM AUTHENTICATION (CNAME Records)**');
    if (this.dkimTokens && this.dkimTokens.length > 0) {
      this.dkimTokens.forEach((token, index) => {
        console.log(`DKIM Record ${index + 1}:`);
        console.log(`Type: CNAME`);
        console.log(`Name: ${token}._domainkey`);
        console.log(`Value: ${token}.dkim.amazonses.com`);
        console.log('');
      });
    } else {
      console.log('You\'ll get 3 DKIM CNAME records from AWS after wizard completion.');
      console.log('They will look like:');
      console.log(`Type: CNAME`);
      console.log(`Name: [token1]._domainkey`);
      console.log(`Value: [token1].dkim.amazonses.com`);
      console.log('(Plus 2 more similar records)');
      console.log('');
    }

    // MAIL FROM MX record
    console.log('**3. MAIL FROM DOMAIN (MX Record)**');
    console.log(`Type: MX`);
    console.log(`Name: ${this.actualMailFromDomain || this.mailFromDomain}`);
    console.log(`Value: 10 feedback-smtp.us-east-1.amazonses.com`);
    console.log('');

    // SPF record
    console.log('**4. SPF RECORD (TXT Record)**');
    console.log(`Type: TXT`);
    console.log(`Name: ${this.actualMailFromDomain || this.mailFromDomain}`);
    console.log(`Value: "v=spf1 include:amazonses.com ~all"`);
    console.log('');
  }

  async createDNSScript() {
    console.log('🤖 DNS AUTOMATION SCRIPT');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    const script = `#!/bin/bash
# WAVELENGTH AWS SES DNS Configuration Script
# ==========================================
# 
# This script helps you configure DNS records for AWS SES
# Replace [YOUR-TOKEN] with actual values from AWS Console

echo "🌊 Configuring DNS for Wavelength Lore AWS SES"
echo "=============================================="

# Check if running in dry-run mode
if [ "$1" = "--dry-run" ]; then
    echo "🔍 DRY RUN MODE - No changes will be made"
    DRY_RUN=true
else
    DRY_RUN=false
fi

# Domain verification TXT record
echo "📝 Adding domain verification record..."
if [ "$DRY_RUN" = false ]; then
    # Add your DNS provider's CLI command here, for example:
    # aws route53 change-resource-record-sets --hosted-zone-id YOUR_ZONE_ID --change-batch file://verification-record.json
    echo "⚠️  Manual step: Add TXT record _amazonses.${this.domain} with verification token"
else
    echo "Would add: TXT _amazonses.${this.domain} [verification-token]"
fi

# DKIM CNAME records
echo "🔐 Adding DKIM records..."
${this.dkimTokens ? this.dkimTokens.map((token, i) => `
if [ "$DRY_RUN" = false ]; then
    echo "⚠️  Manual step: Add CNAME ${token}._domainkey → ${token}.dkim.amazonses.com"
else
    echo "Would add: CNAME ${token}._domainkey → ${token}.dkim.amazonses.com"
fi`).join('') : `
echo "⚠️  Get DKIM tokens from AWS Console first"
`}

# MAIL FROM MX record
echo "📧 Adding MAIL FROM MX record..."
if [ "$DRY_RUN" = false ]; then
    echo "⚠️  Manual step: Add MX ${this.actualMailFromDomain || this.mailFromDomain} → 10 feedback-smtp.us-east-1.amazonses.com"
else
    echo "Would add: MX ${this.actualMailFromDomain || this.mailFromDomain} → 10 feedback-smtp.us-east-1.amazonses.com"
fi

# SPF TXT record
echo "🛡️  Adding SPF record..."
if [ "$DRY_RUN" = false ]; then
    echo "⚠️  Manual step: Add TXT ${this.actualMailFromDomain || this.mailFromDomain} → 'v=spf1 include:amazonses.com ~all'"
else
    echo "Would add: TXT ${this.actualMailFromDomain || this.mailFromDomain} → 'v=spf1 include:amazonses.com ~all'"
fi

echo "✅ DNS configuration steps completed!"
echo "⏰ DNS propagation can take up to 48 hours"
echo "🧪 Test your setup with: npm run wavelength:test-email"
`;

    require('fs').writeFileSync('./wavelength-ses-dns-setup.sh', script);
    console.log('✅ Created DNS setup script: wavelength-ses-dns-setup.sh');
    console.log('📝 Run with: chmod +x wavelength-ses-dns-setup.sh && ./wavelength-ses-dns-setup.sh --dry-run');
    console.log('');
  }

  provideManualInstructions() {
    console.log('');
    console.log('📋 MANUAL DNS SETUP INSTRUCTIONS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('1. Complete the AWS SES wizard at:');
    console.log('   https://us-east-1.console.aws.amazon.com/ses/home#/onboarding-wizard');
    console.log('');
    console.log('2. After completion, go to:');
    console.log('   SES Console → Verified identities → wavelengthlore.com');
    console.log('');
    console.log('3. Copy the DNS records from the AWS console');
    console.log('');
    console.log('4. Add them to your DNS provider');
    console.log('');
    console.log('5. Wait for DNS propagation (up to 48 hours)');
    console.log('');
    console.log('6. Test with: npm run wavelength:test-email');
  }
}

// Run the DNS configuration helper
async function main() {
  require('dotenv').config();
  const helper = new SESDNSConfigHelper();
  await helper.runDNSSetup();
}

// Execute if run directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ DNS helper failed:', error);
    process.exit(1);
  });
}

module.exports = SESDNSConfigHelper;