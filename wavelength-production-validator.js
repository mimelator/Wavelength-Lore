#!/usr/bin/env node

/**
 * 🌊 WAVELENGTH PRODUCTION READINESS VALIDATOR
 * 
 * Validates all systems are ready for soft launch
 */

const chalk = require('chalk');
const https = require('https');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '.env') });

class ProductionValidator {
    constructor() {
        this.checks = [];
        this.passed = 0;
        this.failed = 0;
    }

    async validate() {
        console.log(chalk.magenta.bold('🌊 WAVELENGTH PRODUCTION READINESS CHECK'));
        console.log(chalk.magenta('=========================================='));
        console.log('');

        await this.checkEnvironmentVariables();
        await this.checkStripeKeys();
        await this.checkDomainSSL();
        await this.checkEmailConfiguration();
        await this.checkDatabaseConnection();
        await this.checkPrintifyIntegration();
        
        this.showResults();
    }

    check(name, condition, message) {
        const status = condition ? '✅' : '❌';
        const color = condition ? chalk.green : chalk.red;
        
        console.log(`${status} ${color(name)}`);
        if (message) {
            console.log(`   ${chalk.gray(message)}`);
        }
        
        if (condition) {
            this.passed++;
        } else {
            this.failed++;
        }
        
        return condition;
    }

    async checkEnvironmentVariables() {
        console.log(chalk.blue.bold('🔧 ENVIRONMENT VARIABLES'));
        
        this.check(
            'NODE_ENV', 
            process.env.NODE_ENV, 
            process.env.NODE_ENV ? `Set to: ${process.env.NODE_ENV}` : 'NODE_ENV not set'
        );
        
        console.log('');
    }

    async checkStripeKeys() {
        console.log(chalk.blue.bold('💳 STRIPE CONFIGURATION'));
        
        const hasSecretKey = this.check(
            'Stripe Secret Key',
            process.env.STRIPE_SECRET_KEY,
            process.env.STRIPE_SECRET_KEY ? 
                `Key type: ${process.env.STRIPE_SECRET_KEY.startsWith('sk_live_') ? 'LIVE' : 'TEST'}` :
                'STRIPE_SECRET_KEY not found in environment'
        );

        const hasPublicKey = this.check(
            'Stripe Publishable Key',
            process.env.STRIPE_PUBLISHABLE_KEY,
            process.env.STRIPE_PUBLISHABLE_KEY ? 
                `Key type: ${process.env.STRIPE_PUBLISHABLE_KEY.startsWith('pk_live_') ? 'LIVE' : 'TEST'}` :
                'STRIPE_PUBLISHABLE_KEY not found in environment'
        );

        this.check(
            'Stripe Environment',
            process.env.STRIPE_ENVIRONMENT,
            process.env.STRIPE_ENVIRONMENT ? 
                `Mode: ${process.env.STRIPE_ENVIRONMENT.toUpperCase()}` :
                'STRIPE_ENVIRONMENT not set (defaults to test)'
        );

        this.check(
            'Webhook Secret',
            process.env.STRIPE_WEBHOOK_SECRET,
            process.env.STRIPE_WEBHOOK_SECRET ? 'Configured' : 'Not configured - webhooks will fail'
        );

        // Production readiness check
        const isLiveMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_') && 
                          process.env.STRIPE_PUBLISHABLE_KEY?.startsWith('pk_live_');
        
        this.check(
            'Production Mode',
            isLiveMode,
            isLiveMode ? 'Using LIVE Stripe keys' : 'Using TEST keys - not ready for real purchases'
        );

        console.log('');
    }

    async checkDomainSSL() {
        console.log(chalk.blue.bold('🌐 DOMAIN & SSL'));
        
        try {
            const statusCode = await this.checkHttps('https://wavelengthlore.com');
            this.check(
                'Domain SSL Certificate',
                statusCode === 200 || statusCode === 401,
                `HTTPS request returned: ${statusCode}`
            );

            const merchStatusCode = await this.checkHttps('https://wavelengthlore.com/merchandise');
            this.check(
                'Merchandise Store SSL',
                merchStatusCode === 401, // Expected - requires auth
                `Merchandise endpoint: ${merchStatusCode} (401 expected - requires authentication)`
            );

        } catch (error) {
            this.check(
                'Domain Accessibility',
                false,
                `Failed to connect: ${error.message}`
            );
        }

        console.log('');
    }

    async checkEmailConfiguration() {
        console.log(chalk.blue.bold('📧 EMAIL CONFIGURATION'));
        
        this.check(
            'Email Provider',
            process.env.EMAIL_PROVIDER,
            process.env.EMAIL_PROVIDER ? 
                `Provider: ${process.env.EMAIL_PROVIDER.toUpperCase()}` :
                'EMAIL_PROVIDER not set - emails will use console mode'
        );

        this.check(
            'From Email',
            process.env.FROM_EMAIL,
            process.env.FROM_EMAIL || 'FROM_EMAIL not configured'
        );

        this.check(
            'Support Email',
            process.env.SUPPORT_EMAIL,
            process.env.SUPPORT_EMAIL || 'SUPPORT_EMAIL not configured'
        );

        // Provider-specific checks
        if (process.env.EMAIL_PROVIDER === 'sendgrid') {
            this.check(
                'SendGrid API Key',
                process.env.SENDGRID_API_KEY,
                process.env.SENDGRID_API_KEY ? 'Configured' : 'SENDGRID_API_KEY missing'
            );
        } else if (process.env.EMAIL_PROVIDER === 'ses') {
            this.check(
                'AWS SES Region',
                process.env.AWS_SES_REGION,
                process.env.AWS_SES_REGION || 'AWS_SES_REGION not set'
            );
        }

        console.log('');
    }

    async checkDatabaseConnection() {
        console.log(chalk.blue.bold('🗄️  DATABASE'));
        
        try {
            // Check if Firebase is configured
            const hasFirebaseConfig = process.env.FIREBASE_PROJECT_ID || 
                                    process.env.FIREBASE_PRIVATE_KEY ||
                                    process.env.FIREBASE_CLIENT_EMAIL;
            
            this.check(
                'Firebase Configuration',
                hasFirebaseConfig,
                hasFirebaseConfig ? 'Firebase environment variables found' : 'Firebase not configured'
            );

        } catch (error) {
            this.check(
                'Database Connection',
                false,
                `Database check failed: ${error.message}`
            );
        }

        console.log('');
    }

    async checkPrintifyIntegration() {
        console.log(chalk.blue.bold('🖨️  PRINTIFY INTEGRATION'));
        
        this.check(
            'Printify API Token',
            process.env.PRINTIFY_API_TOKEN,
            process.env.PRINTIFY_API_TOKEN ? 'Configured' : 'PRINTIFY_API_TOKEN missing'
        );

        this.check(
            'Printify Shop ID',
            process.env.PRINTIFY_SHOP_ID,
            process.env.PRINTIFY_SHOP_ID ? `Shop ID: ${process.env.PRINTIFY_SHOP_ID}` : 'PRINTIFY_SHOP_ID missing'
        );

        console.log('');
    }

    async checkHttps(url) {
        return new Promise((resolve, reject) => {
            const request = https.request(url, { method: 'HEAD' }, (response) => {
                resolve(response.statusCode);
            });
            
            request.on('error', reject);
            request.setTimeout(5000, () => {
                request.destroy();
                reject(new Error('Request timeout'));
            });
            
            request.end();
        });
    }

    showResults() {
        console.log(chalk.blue.bold('📊 VALIDATION RESULTS'));
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        const total = this.passed + this.failed;
        const percentage = Math.round((this.passed / total) * 100);
        
        console.log(`✅ ${chalk.green.bold(`Passed: ${this.passed}`)}`);
        console.log(`❌ ${chalk.red.bold(`Failed: ${this.failed}`)}`);
        console.log(`📈 ${chalk.blue.bold(`Success Rate: ${percentage}%`)}`);
        console.log('');

        if (this.failed === 0) {
            console.log(chalk.green.bold('🎉 ALL SYSTEMS GO! Ready for production deployment!'));
            console.log(chalk.green('Your Wavelength Merch Store is ready for soft launch! 🚀'));
        } else if (percentage >= 80) {
            console.log(chalk.yellow.bold('⚠️  MOSTLY READY - Minor issues to address'));
            console.log(chalk.yellow('Fix the failed checks above before going live.'));
        } else {
            console.log(chalk.red.bold('❌ NOT READY - Major configuration issues'));
            console.log(chalk.red('Address failed checks before attempting production deployment.'));
        }

        console.log('');
        console.log(chalk.blue.bold('📋 NEXT STEPS:'));
        
        if (process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')) {
            console.log(chalk.yellow('1. 🔑 Get Stripe LIVE keys from dashboard'));
            console.log(chalk.yellow('2. 🌍 Update production environment variables'));
        }
        
        if (!process.env.EMAIL_PROVIDER || process.env.EMAIL_PROVIDER === 'console') {
            console.log(chalk.yellow('3. 📧 Configure production email provider'));
        }
        
        if (!process.env.STRIPE_WEBHOOK_SECRET) {
            console.log(chalk.yellow('4. 🔗 Setup Stripe webhooks'));
        }
        
        console.log(chalk.cyan('5. 🧪 Run test purchase with real card'));
        console.log(chalk.green('6. 🎉 Celebrate successful soft launch!'));
        
        console.log('');
        console.log(chalk.magenta('🌊 WAVELENGTH PRODUCTION VALIDATION COMPLETE!'));
    }
}

// Run validation if called directly
if (require.main === module) {
    const validator = new ProductionValidator();
    validator.validate().catch(console.error);
}

module.exports = ProductionValidator;