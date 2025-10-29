#!/usr/bin/env node
/**
 * WAVELENGTH PRODUCTION EMAIL CONFIGURATOR
 * =======================================
 * 
 * Interactive setup for production email services
 * Supports SendGrid and AWS SES configuration
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

class EmailConfigurator {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    this.envPath = path.join(__dirname, '../.env');
    this.envProductionPath = path.join(__dirname, '../.env.production');
  }

  /**
   * Run the email configuration wizard
   */
  async configure() {
    console.log('🌊 WAVELENGTH EMAIL CONFIGURATION WIZARD');
    console.log('========================================');
    console.log('');
    
    try {
      const provider = await this.selectEmailProvider();
      const config = await this.configureProvider(provider);
      await this.saveConfiguration(config);
      await this.testConfiguration();
      
      console.log('');
      console.log('✅ Email configuration completed successfully!');
      console.log('');
      console.log('Next steps:');
      console.log('1. Run: node wavelength-tools/wavelength-email-test-suite.js');
      console.log('2. Test a real order to verify email delivery');
      console.log('3. Monitor email delivery in production');
      
    } catch (error) {
      console.error('❌ Configuration failed:', error.message);
    } finally {
      this.rl.close();
    }
  }

  /**
   * Let user select email provider
   */
  async selectEmailProvider() {
    console.log('📧 Select your email service provider:');
    console.log('1. SendGrid (Recommended - Easy setup, reliable)');
    console.log('2. AWS SES (AWS users - Cost effective, scalable)');
    console.log('3. Console (Development only - No real emails)');
    console.log('');
    
    const choice = await this.question('Enter your choice (1-3): ');
    
    switch (choice.trim()) {
      case '1':
        return 'sendgrid';
      case '2':
        return 'ses';
      case '3':
        return 'console';
      default:
        throw new Error('Invalid choice. Please run the configurator again.');
    }
  }

  /**
   * Configure specific email provider
   */
  async configureProvider(provider) {
    const config = {
      EMAIL_PROVIDER: provider,
      FROM_EMAIL: await this.question('Enter your from email address (e.g., orders@wavelengthlore.com): '),
      SUPPORT_EMAIL: await this.question('Enter your support email address (e.g., support@wavelengthlore.com): ')
    };

    if (provider === 'sendgrid') {
      return await this.configureSendGrid(config);
    } else if (provider === 'ses') {
      return await this.configureAwsSes(config);
    }

    return config;
  }

  /**
   * Configure SendGrid
   */
  async configureSendGrid(config) {
    console.log('');
    console.log('📧 SENDGRID CONFIGURATION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. Go to https://app.sendgrid.com/settings/api_keys');
    console.log('2. Create a new API key with "Full Access" permissions');
    console.log('3. Copy the API key and paste it below');
    console.log('');

    config.SENDGRID_API_KEY = await this.question('Enter your SendGrid API key: ');

    if (!config.SENDGRID_API_KEY || !config.SENDGRID_API_KEY.startsWith('SG.')) {
      throw new Error('Invalid SendGrid API key format');
    }

    console.log('✅ SendGrid configuration completed');
    return config;
  }

  /**
   * Configure AWS SES
   */
  async configureAwsSes(config) {
    console.log('');
    console.log('📧 AWS SES CONFIGURATION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. Make sure your AWS credentials are configured');
    console.log('2. Verify your domain/email in AWS SES console');
    console.log('3. Move out of SES sandbox if needed');
    console.log('');

    config.AWS_SES_REGION = await this.question('Enter AWS SES region (default: us-east-1): ') || 'us-east-1';

    // Check if AWS credentials are already configured
    if (!process.env.AWS_ACCESS_KEY_ID) {
      config.AWS_ACCESS_KEY_ID = await this.question('Enter AWS Access Key ID: ');
      config.AWS_SECRET_ACCESS_KEY = await this.question('Enter AWS Secret Access Key: ');
    } else {
      console.log('✅ Using existing AWS credentials from environment');
    }

    console.log('✅ AWS SES configuration completed');
    return config;
  }

  /**
   * Save configuration to environment files
   */
  async saveConfiguration(config) {
    console.log('');
    console.log('💾 Saving configuration...');

    // Update .env file
    await this.updateEnvFile(this.envPath, config);
    
    // Update .env.production file
    const productionConfig = {
      EMAIL_PROVIDER: config.EMAIL_PROVIDER,
      FROM_EMAIL: config.FROM_EMAIL,
      SUPPORT_EMAIL: config.SUPPORT_EMAIL
    };

    if (config.AWS_SES_REGION) {
      productionConfig.AWS_SES_REGION = config.AWS_SES_REGION;
    }

    await this.updateEnvFile(this.envProductionPath, productionConfig);

    console.log('✅ Configuration saved to .env and .env.production');
  }

  /**
   * Update environment file with new values
   */
  async updateEnvFile(filePath, config) {
    let envContent = '';
    
    if (fs.existsSync(filePath)) {
      envContent = fs.readFileSync(filePath, 'utf8');
    }

    // Update or add each config value
    for (const [key, value] of Object.entries(config)) {
      if (!value) continue;
      
      const regex = new RegExp(`^${key}=.*$`, 'm');
      const newLine = `${key}=${value}`;
      
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, newLine);
      } else {
        envContent += `\n${newLine}`;
      }
    }

    fs.writeFileSync(filePath, envContent);
  }

  /**
   * Test the configuration
   */
  async testConfiguration() {
    console.log('');
    const shouldTest = await this.question('Would you like to test the email configuration now? (y/n): ');
    
    if (shouldTest.toLowerCase().startsWith('y')) {
      console.log('🧪 Running email test...');
      
      try {
        // Reload environment
        require('dotenv').config();
        
        const EmailTestSuite = require('./wavelength-email-test-suite');
        const testSuite = new EmailTestSuite();
        
        await testSuite.runAllTests();
      } catch (error) {
        console.error('❌ Email test failed:', error.message);
        console.log('You can run the test manually later with:');
        console.log('node wavelength-tools/wavelength-email-test-suite.js');
      }
    }
  }

  /**
   * Prompt user for input
   */
  question(prompt) {
    return new Promise((resolve) => {
      this.rl.question(prompt, resolve);
    });
  }
}

// Run the configurator
async function main() {
  const configurator = new EmailConfigurator();
  await configurator.configure();
}

// Execute if run directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Email configuration failed:', error);
    process.exit(1);
  });
}

module.exports = EmailConfigurator;