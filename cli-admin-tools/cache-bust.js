#!/usr/bin/env node
/**
 * 🌊 WAVELENGTH CLI ADMIN - PRISTINE CACHE BUST
 * ==============================================
 * Clean, isolated CloudFront cache invalidation tool for CLI admin mode
 * Completely separate from existing scripts to ensure reliability
 */

const { CloudFrontClient, CreateInvalidationCommand } = require('@aws-sdk/client-cloudfront');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

class WavelengthCacheBust {
    constructor() {
        this.cloudfront = new CloudFrontClient({ region: 'us-east-1' });
        this.distributionId = process.env.CLOUDFRONT_DISTRIBUTION_ID || 'E1EXAMPLE123456';
        this.rootDir = process.cwd();
    }

    /**
     * 🚀 Main cache invalidation execution
     */
    async bustCache(paths = ['/*']) {
        console.log(chalk.cyan('🌊 WAVELENGTH ADMIN: Cache Bust'));
        console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        
        try {
            // Validate AWS configuration
            await this.validateAwsConfig();
            
            // Create invalidation
            const result = await this.createInvalidation(paths);
            
            // Log invalidation details
            await this.logInvalidation(result);
            
            console.log(chalk.green('✅ Cache invalidation completed successfully!'));
            return result;
            
        } catch (error) {
            console.error(chalk.red('❌ Cache bust failed:'), error.message);
            
            // Log detailed error for debugging
            if (error.name === 'CredentialsProviderError') {
                console.log(chalk.yellow('💡 Tip: Ensure AWS credentials are configured'));
            } else if (error.name === 'AccessDenied') {
                console.log(chalk.yellow('💡 Tip: Check CloudFront permissions'));
            }
            
            return null;
        }
    }

    /**
     * ⚙️ Validate AWS configuration
     */
    async validateAwsConfig() {
        console.log(chalk.yellow('⚙️ Validating AWS configuration...'));
        
        if (!this.distributionId || this.distributionId === 'E1EXAMPLE123456') {
            throw new Error('CloudFront Distribution ID not configured. Set CLOUDFRONT_DISTRIBUTION_ID environment variable.');
        }
        
        console.log(chalk.green(`✓ Distribution ID: ${this.distributionId}`));
    }

    /**
     * 🔄 Create CloudFront invalidation
     */
    async createInvalidation(paths) {
        console.log(chalk.yellow('🔄 Creating CloudFront invalidation...'));
        console.log(chalk.white(`   Paths: ${paths.join(', ')}`));
        
        const params = {
            DistributionId: this.distributionId,
            InvalidationBatch: {
                Paths: {
                    Quantity: paths.length,
                    Items: paths
                },
                CallerReference: `wavelength-cli-${Date.now()}`
            }
        };
        
        const command = new CreateInvalidationCommand(params);
        const result = await this.cloudfront.send(command);
        
        console.log(chalk.green(`✓ Invalidation created: ${result.Invalidation.Id}`));
        console.log(chalk.green(`✓ Status: ${result.Invalidation.Status}`));
        
        return result;
    }

    /**
     * 📝 Log invalidation for tracking
     */
    async logInvalidation(result) {
        console.log(chalk.yellow('📝 Logging invalidation details...'));
        
        const logEntry = {
            timestamp: new Date().toISOString(),
            invalidationId: result.Invalidation.Id,
            distributionId: this.distributionId,
            status: result.Invalidation.Status,
            paths: result.Invalidation.InvalidationBatch.Paths.Items,
            callerReference: result.Invalidation.InvalidationBatch.CallerReference,
            createdBy: 'wavelength-cli-admin'
        };
        
        // Create log file
        const logPath = path.join(this.rootDir, '.wavelength-cache-bust.log');
        const logLine = JSON.stringify(logEntry) + '\n';
        
        fs.appendFileSync(logPath, logLine);
        
        console.log(chalk.green('✓ Invalidation logged'));
    }

    /**
     * 📊 Get recent invalidations
     */
    getRecentInvalidations(limit = 5) {
        const logPath = path.join(this.rootDir, '.wavelength-cache-bust.log');
        
        if (!fs.existsSync(logPath)) {
            return [];
        }
        
        const lines = fs.readFileSync(logPath, 'utf8')
            .trim()
            .split('\n')
            .filter(line => line.length > 0);
        
        return lines
            .slice(-limit)
            .map(line => JSON.parse(line))
            .reverse();
    }

    /**
     * 🎯 Smart cache bust for common scenarios
     */
    async smartBust(scenario = 'all') {
        console.log(chalk.cyan(`🎯 Smart cache bust: ${scenario}`));
        
        const scenarios = {
            'all': ['/*'],
            'assets': ['/styles.css', '/app.js', '/images/*'],
            'pages': ['/', '/lore/*', '/episodes/*'],
            'api': ['/api/*'],
            'lore': ['/lore/*', '/api/lore/*']
        };
        
        const paths = scenarios[scenario] || scenarios['all'];
        return await this.bustCache(paths);
    }
}

// CLI execution
if (require.main === module) {
    const cacheBust = new WavelengthCacheBust();
    
    const args = process.argv.slice(2);
    
    if (args.includes('--status') || args.includes('--recent')) {
        console.log(chalk.cyan('🌊 WAVELENGTH RECENT INVALIDATIONS:'));
        console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        
        const recent = cacheBust.getRecentInvalidations();
        if (recent.length === 0) {
            console.log(chalk.yellow('No recent invalidations found'));
        } else {
            recent.forEach((inv, i) => {
                console.log(chalk.white(`${i + 1}. ${inv.invalidationId}`));
                console.log(chalk.gray(`   ${new Date(inv.timestamp).toLocaleString()}`));
                console.log(chalk.gray(`   Status: ${inv.status}`));
                console.log(chalk.gray(`   Paths: ${inv.paths.join(', ')}`));
                console.log('');
            });
        }
    } else {
        // Parse scenario or custom paths
        const scenario = args.find(arg => !arg.startsWith('--')) || 'all';
        
        if (['all', 'assets', 'pages', 'api', 'lore'].includes(scenario)) {
            cacheBust.smartBust(scenario).then(result => {
                process.exit(result ? 0 : 1);
            });
        } else {
            // Custom paths
            const customPaths = args.filter(arg => !arg.startsWith('--'));
            cacheBust.bustCache(customPaths.length > 0 ? customPaths : ['/*']).then(result => {
                process.exit(result ? 0 : 1);
            });
        }
    }
}

module.exports = WavelengthCacheBust;