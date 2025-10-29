#!/usr/bin/env node
/**
 * WAVELENGTH ROUTE 53 DNS AUTOMATION
 * =================================
 * 
 * Automatically adds AWS SES DNS records to Route 53
 */

const { Route53Client, ListHostedZonesCommand, ChangeResourceRecordSetsCommand } = require('@aws-sdk/client-route-53');
const { SESClient, GetIdentityVerificationAttributesCommand, GetIdentityDkimAttributesCommand } = require('@aws-sdk/client-ses');

class Route53DNSAutomation {
  constructor() {
    this.route53Client = new Route53Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });

    this.sesClient = new SESClient({
      region: process.env.AWS_SES_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });

    this.domain = 'wavelengthlore.com';
    this.mailFromDomain = 'mail.wavelengthlore.com';
    this.hostedZoneId = null;
    this.recordsToCreate = [];
  }

  async runAutomation() {
    console.log('🌊 WAVELENGTH ROUTE 53 DNS AUTOMATION');
    console.log('====================================');
    console.log('');

    try {
      await this.findHostedZone();
      await this.getSESRecords();
      await this.createDNSRecords();
      console.log('✅ Route 53 DNS automation completed successfully!');
    } catch (error) {
      console.error('❌ Automation failed:', error.message);
      console.log('');
      this.provideManualInstructions();
    }
  }

  async findHostedZone() {
    console.log('🔍 FINDING ROUTE 53 HOSTED ZONE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
      const command = new ListHostedZonesCommand({});
      const result = await this.route53Client.send(command);

      const hostedZone = result.HostedZones.find(zone => 
        zone.Name === `${this.domain}.` || zone.Name === this.domain
      );

      if (hostedZone) {
        this.hostedZoneId = hostedZone.Id.replace('/hostedzone/', '');
        console.log(`✅ Found hosted zone: ${hostedZone.Name}`);
        console.log(`🆔 Zone ID: ${this.hostedZoneId}`);
      } else {
        throw new Error(`Hosted zone for ${this.domain} not found in Route 53`);
      }
    } catch (error) {
      throw new Error(`Failed to find hosted zone: ${error.message}`);
    }

    console.log('');
  }

  async getSESRecords() {
    console.log('🔍 RETRIEVING SES DNS RECORDS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
      // Get domain verification token
      const verificationCommand = new GetIdentityVerificationAttributesCommand({
        Identities: [this.domain]
      });
      const verificationResult = await this.sesClient.send(verificationCommand);

      if (verificationResult.VerificationAttributes[this.domain]) {
        const token = verificationResult.VerificationAttributes[this.domain].VerificationToken;
        if (token) {
          console.log('✅ Found domain verification token');
          this.addRecord('TXT', `_amazonses.${this.domain}`, token, 'Domain Verification');
        }
      }

      // Get DKIM tokens
      const dkimCommand = new GetIdentityDkimAttributesCommand({
        Identities: [this.domain]
      });
      const dkimResult = await this.sesClient.send(dkimCommand);

      if (dkimResult.DkimAttributes[this.domain]) {
        const dkimTokens = dkimResult.DkimAttributes[this.domain].DkimTokens;
        if (dkimTokens && dkimTokens.length > 0) {
          console.log(`✅ Found ${dkimTokens.length} DKIM tokens`);
          dkimTokens.forEach((token, index) => {
            this.addRecord('CNAME', `${token}._domainkey.${this.domain}`, `${token}.dkim.amazonses.com`, `DKIM ${index + 1}`);
          });
        }
      }

      // Add MAIL FROM records
      console.log('✅ Adding MAIL FROM domain records');
      this.addRecord('MX', this.mailFromDomain, '10 feedback-smtp.us-east-1.amazonses.com', 'MAIL FROM MX');
      this.addRecord('TXT', this.mailFromDomain, '"v=spf1 include:amazonses.com ~all"', 'SPF Record');

      console.log(`📝 Total records to create: ${this.recordsToCreate.length}`);
    } catch (error) {
      throw new Error(`Failed to retrieve SES records: ${error.message}`);
    }

    console.log('');
  }

  addRecord(type, name, value, description) {
    this.recordsToCreate.push({
      type,
      name: name.endsWith('.') ? name : `${name}.`,
      value,
      description
    });
  }

  async createDNSRecords() {
    console.log('🚀 CREATING DNS RECORDS IN ROUTE 53');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (this.recordsToCreate.length === 0) {
      console.log('⚠️  No records to create');
      return;
    }

    const changes = this.recordsToCreate.map(record => ({
      Action: 'UPSERT',
      ResourceRecordSet: {
        Name: record.name,
        Type: record.type,
        TTL: 300,
        ResourceRecords: [{
          Value: record.type === 'TXT' ? `"${record.value.replace(/"/g, '')}"` : record.value
        }]
      }
    }));

    try {
      const command = new ChangeResourceRecordSetsCommand({
        HostedZoneId: this.hostedZoneId,
        ChangeBatch: {
          Comment: `Wavelength Lore AWS SES Configuration - ${new Date().toISOString()}`,
          Changes: changes
        }
      });

      console.log('📝 Records to be created:');
      this.recordsToCreate.forEach(record => {
        console.log(`   ${record.description}: ${record.type} ${record.name} → ${record.value}`);
      });

      console.log('');
      const result = await this.route53Client.send(command);
      
      console.log('✅ DNS records created successfully!');
      console.log(`🆔 Change ID: ${result.ChangeInfo.Id}`);
      console.log(`📊 Status: ${result.ChangeInfo.Status}`);
      
      if (result.ChangeInfo.Status === 'PENDING') {
        console.log('⏰ DNS propagation in progress (can take up to 5 minutes)');
      }

    } catch (error) {
      if (error.name === 'InvalidChangeBatch') {
        console.error('❌ Invalid DNS record format:', error.message);
        console.log('🔧 This might happen if records already exist or have formatting issues');
      } else {
        throw error;
      }
    }

    console.log('');
  }

  provideManualInstructions() {
    console.log('📋 MANUAL ROUTE 53 SETUP');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('If automation failed, add these records manually in Route 53:');
    console.log('');
    console.log('1. Go to Route 53 Console');
    console.log('2. Select your hosted zone for wavelengthlore.com');
    console.log('3. Click "Create record" for each of these:');
    console.log('');
    
    if (this.recordsToCreate.length > 0) {
      this.recordsToCreate.forEach((record, index) => {
        console.log(`Record ${index + 1} - ${record.description}:`);
        console.log(`   Type: ${record.type}`);
        console.log(`   Name: ${record.name.replace('.', '')}`);
        console.log(`   Value: ${record.value}`);
        console.log('');
      });
    } else {
      console.log('⚠️  Complete AWS SES wizard first to get DNS records');
    }
  }
}

// Add dry-run functionality
class Route53DNSDryRun extends Route53DNSAutomation {
  async createDNSRecords() {
    console.log('🔍 DRY RUN - DNS RECORDS THAT WOULD BE CREATED');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (this.recordsToCreate.length === 0) {
      console.log('⚠️  No records to create');
      return;
    }

    console.log(`🎯 Target Hosted Zone: ${this.hostedZoneId}`);
    console.log('');
    console.log('📝 Records that would be created:');
    
    this.recordsToCreate.forEach((record, index) => {
      console.log(`${index + 1}. ${record.description}`);
      console.log(`   Type: ${record.type}`);
      console.log(`   Name: ${record.name}`);
      console.log(`   Value: ${record.value}`);
      console.log(`   TTL: 300`);
      console.log('');
    });

    console.log('✅ Dry run completed - no changes made');
    console.log('🚀 To apply changes, run without --dry-run flag');
  }
}

// Main execution
async function main() {
  require('dotenv').config();
  
  const isDryRun = process.argv.includes('--dry-run');
  const AutomationClass = isDryRun ? Route53DNSDryRun : Route53DNSAutomation;
  
  console.log(isDryRun ? '🔍 DRY RUN MODE - No changes will be made' : '🚀 LIVE MODE - DNS records will be created');
  console.log('');
  
  const automation = new AutomationClass();
  await automation.runAutomation();
}

// Execute if run directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Route 53 automation failed:', error);
    process.exit(1);
  });
}

module.exports = { Route53DNSAutomation, Route53DNSDryRun };