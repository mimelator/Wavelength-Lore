#!/usr/bin/env node
/**
 * 🌊 WAVELENGTH CLI ADMIN - PRISTINE DEPLOYMENT STATUS 
 * ====================================================
 * Clean, isolated deployment monitoring tool for CLI admin mode
 * Completely separate from existing scripts to ensure reliability
 */

const { AppRunnerClient, DescribeServiceCommand, ListServicesCommand } = require('@aws-sdk/client-apprunner');
const { ECRClient, DescribeRepositoriesCommand, DescribeImagesCommand } = require('@aws-sdk/client-ecr');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

class WavelengthDeploymentStatus {
    constructor() {
        this.appRunner = new AppRunnerClient({ region: 'us-east-1' });
        this.ecr = new ECRClient({ region: 'us-east-1' });
        this.serviceName = process.env.APPRUNNER_SERVICE_NAME || 'wavelength-lore';
        this.ecrRepository = process.env.ECR_REPOSITORY_NAME || 'wavelength-lore';
        this.rootDir = process.cwd();
    }

    /**
     * 🚀 Get comprehensive deployment status
     */
    async getStatus() {
        console.log(chalk.cyan('🌊 WAVELENGTH ADMIN: Deployment Status'));
        console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        
        try {
            const status = {};
            
            // Get App Runner status
            status.appRunner = await this.getAppRunnerStatus();
            
            // Get ECR status
            status.ecr = await this.getECRStatus();
            
            // Get local build info
            status.local = await this.getLocalStatus();
            
            // Display comprehensive status
            await this.displayStatus(status);
            
            return status;
            
        } catch (error) {
            console.error(chalk.red('❌ Status check failed:'), error.message);
            return null;
        }
    }

    /**
     * 🏃 Get App Runner service status
     */
    async getAppRunnerStatus() {
        console.log(chalk.yellow('🏃 Checking App Runner status...'));
        
        try {
            // Use the full ARN from environment if available
            const serviceArn = process.env.APPRUNNER_SERVICE_ARN || 
                `arn:aws:apprunner:us-east-1:${process.env.AWS_ACCOUNT_ID || '123456789012'}:service/${this.serviceName}`;
            
            if (!process.env.APPRUNNER_SERVICE_ARN) {
                return {
                    status: 'Unknown',
                    message: 'Service ARN required for detailed status',
                    serviceName: this.serviceName
                };
            }
            
            const command = new DescribeServiceCommand({
                ServiceArn: serviceArn
            });
            
            const result = await this.appRunner.send(command);
            const service = result.Service;
            
            return {
                status: service.Status,
                message: `Service is ${service.Status.toLowerCase()}`,
                serviceName: service.ServiceName,
                serviceUrl: service.ServiceUrl,
                createdAt: service.CreatedAt,
                updatedAt: service.UpdatedAt,
                source: service.SourceConfiguration?.ImageRepository?.ImageIdentifier || 'Not available'
            };
            
        } catch (error) {
            return {
                status: 'Error',
                message: error.message,
                serviceName: this.serviceName
            };
        }
    }

    /**
     * 🐳 Get ECR repository status
     */
    async getECRStatus() {
        console.log(chalk.yellow('🐳 Checking ECR repository status...'));
        
        try {
            // Check if repository exists
            const repoCommand = new DescribeRepositoriesCommand({
                repositoryNames: [this.ecrRepository]
            });
            
            const repoResult = await this.ecr.send(repoCommand);
            const repository = repoResult.repositories[0];
            
            // Get recent images
            const imagesCommand = new DescribeImagesCommand({
                repositoryName: this.ecrRepository,
                maxResults: 5
            });
            
            const imagesResult = await this.ecr.send(imagesCommand);
            
            return {
                status: 'Active',
                repository: repository.repositoryName,
                uri: repository.repositoryUri,
                imageCount: imagesResult.imageDetails.length,
                recentImages: imagesResult.imageDetails
                    .sort((a, b) => new Date(b.imagePushedAt) - new Date(a.imagePushedAt))
                    .slice(0, 3)
                    .map(img => ({
                        tag: img.imageTags?.[0] || 'untagged',
                        pushedAt: img.imagePushedAt,
                        size: Math.round(img.imageSizeInBytes / 1024 / 1024) + 'MB'
                    }))
            };
            
        } catch (error) {
            return {
                status: 'Error',
                message: error.message,
                repository: this.ecrRepository
            };
        }
    }

    /**
     * 📁 Get local build status
     */
    async getLocalStatus() {
        console.log(chalk.yellow('📁 Checking local build status...'));
        
        const status = {
            dockerfileExists: fs.existsSync(path.join(this.rootDir, 'Dockerfile')),
            packageJsonExists: fs.existsSync(path.join(this.rootDir, 'package.json')),
            nodeModulesExists: fs.existsSync(path.join(this.rootDir, 'node_modules')),
            gitStatus: 'Unknown'
        };
        
        // Get git status if available
        try {
            const { execSync } = require('child_process');
            const gitOutput = execSync('git status --porcelain', { cwd: this.rootDir, encoding: 'utf8' });
            status.gitStatus = gitOutput.trim().length === 0 ? 'Clean' : 'Modified';
            
            // Get current branch and commit
            const branch = execSync('git branch --show-current', { cwd: this.rootDir, encoding: 'utf8' }).trim();
            const commit = execSync('git rev-parse --short HEAD', { cwd: this.rootDir, encoding: 'utf8' }).trim();
            
            status.branch = branch;
            status.commit = commit;
            
        } catch (error) {
            status.gitStatus = 'Error';
        }
        
        // Get package.json version
        if (status.packageJsonExists) {
            try {
                const packageJson = JSON.parse(fs.readFileSync(path.join(this.rootDir, 'package.json'), 'utf8'));
                status.version = packageJson.version;
            } catch (error) {
                status.version = 'Unknown';
            }
        }
        
        return status;
    }

    /**
     * 📊 Display comprehensive status
     */
    async displayStatus(status) {
        console.log(chalk.green('✓ Status check completed\n'));
        
        // Local Status
        console.log(chalk.cyan('📁 LOCAL STATUS:'));
        console.log(chalk.white(`   Version: ${status.local.version || 'Unknown'}`));
        console.log(chalk.white(`   Branch: ${status.local.branch || 'Unknown'}`));
        console.log(chalk.white(`   Commit: ${status.local.commit || 'Unknown'}`));
        console.log(chalk.white(`   Git Status: ${status.local.gitStatus}`));
        console.log(chalk.white(`   Docker: ${status.local.dockerfileExists ? '✓' : '❌'}`));
        console.log(chalk.white(`   Dependencies: ${status.local.nodeModulesExists ? '✓' : '❌'}`));
        console.log('');
        
        // ECR Status
        console.log(chalk.cyan('🐳 ECR CONFIGURATION:'));
        if (status.ecr.status === 'Active') {
            console.log(chalk.white(`   Repository: ${status.ecr.repository}`));
            console.log(chalk.white(`   URI: ${status.ecr.uri}`));
            console.log(chalk.white(`   Images: ${status.ecr.imageCount} total`));
            console.log(chalk.white(`   Recent Images:`));
            status.ecr.recentImages.forEach((img, index) => {
                const isLatest = img.tag === 'latest';
                const tagDisplay = isLatest ? chalk.yellow(img.tag) : chalk.green(img.tag);
                const timeAgo = this.getTimeAgo(img.pushedAt);
                console.log(chalk.gray(`     ${index === 0 ? '→' : '•'} ${tagDisplay} (${img.size}) - ${timeAgo}`));
                if (index === 0) {
                    console.log(chalk.gray(`       Latest push: ${new Date(img.pushedAt).toLocaleString()}`));
                }
            });
            
            // Show ECR connection info
            console.log(chalk.white(`   Region: us-east-1`));
            console.log(chalk.white(`   Registry: ${status.ecr.uri.split('/')[0]}`));
        } else {
            console.log(chalk.red(`   Status: ${status.ecr.status}`));
            console.log(chalk.red(`   Message: ${status.ecr.message}`));
        }
        console.log('');
        
        // App Runner Status
        console.log(chalk.cyan('🏃 APP RUNNER STATUS:'));
        console.log(chalk.white(`   Service: ${status.appRunner.serviceName || 'wavelength-lore-service'}`));
        console.log(chalk.white(`   Status: ${status.appRunner.status}`));
        if (status.appRunner.serviceUrl) {
            console.log(chalk.white(`   URL: https://${status.appRunner.serviceUrl}`));
        }
        if (status.appRunner.source && status.appRunner.source !== 'Not available') {
            console.log(chalk.white(`   Current Image: ${status.appRunner.source}`));
            
            // Parse ECR image details from source
            const imageMatch = status.appRunner.source.match(/wavelength-lore:(.+)$/);
            if (imageMatch) {
                const imageTag = imageMatch[1];
                console.log(chalk.gray(`   Image Tag: ${imageTag}`));
                
                // Check if it's using latest (rollback indicator)
                if (imageTag === 'latest') {
                    console.log(chalk.red('   ⚠️  WARNING: Using :latest tag (possible rollback)'));
                } else {
                    console.log(chalk.green('   ✅ Using specific version tag'));
                }
            }
        }
        if (status.appRunner.updatedAt) {
            console.log(chalk.gray(`   Last Updated: ${new Date(status.appRunner.updatedAt).toLocaleString()}`));
        }
        if (status.appRunner.message) {
            console.log(chalk.gray(`   Message: ${status.appRunner.message}`));
        }
        console.log('');
        
        // Overall Health - Check critical components
        const localHealthy = status.local.dockerfileExists && status.local.nodeModulesExists;
        const ecrHealthy = status.ecr.status !== 'Error';
        const appRunnerHealthy = status.appRunner.status === 'RUNNING';
        
        // Check deployment synchronization
        let deploymentSync = 'Unknown';
        if (status.local.commit && status.appRunner.source) {
            const imageMatch = status.appRunner.source.match(/wavelength-lore:(.+)$/);
            if (imageMatch) {
                const imageTag = imageMatch[1];
                // Check if App Runner is using latest commit or version
                if (imageTag.includes(status.local.commit) || imageTag.startsWith('v')) {
                    deploymentSync = 'Synchronized';
                } else if (imageTag === 'latest') {
                    deploymentSync = 'Rollback detected';
                } else {
                    deploymentSync = 'Out of sync';
                }
            }
        }
        
        const isHealthy = localHealthy && ecrHealthy && appRunnerHealthy;
        
        console.log(chalk.cyan('🌊 DEPLOYMENT STATUS SUMMARY:'));
        console.log(chalk.white(`   Local Environment: ${localHealthy ? '✅' : '❌'}`));
        console.log(chalk.white(`   ECR Repository: ${ecrHealthy ? '✅' : '❌'}`));
        console.log(chalk.white(`   App Runner Service: ${appRunnerHealthy ? '✅' : '❌'}`));
        console.log(chalk.white(`   Deployment Sync: ${deploymentSync === 'Synchronized' ? '✅' : 
                                                      deploymentSync === 'Rollback detected' ? '🔄' : 
                                                      deploymentSync === 'Out of sync' ? '⚠️' : '❓'} ${deploymentSync}`));
        console.log('');
        
        if (isHealthy && deploymentSync === 'Synchronized') {
            console.log(chalk.green('   🚀 OPTIMAL - All systems operational and synchronized'));
        } else if (isHealthy) {
            console.log(chalk.yellow('   ⚠️ HEALTHY - Systems running but may need sync'));
        } else {
            console.log(chalk.red('   🔧 ATTENTION NEEDED - Critical issues detected'));
            if (!localHealthy) console.log(chalk.red('      • Local environment issues detected'));
            if (!ecrHealthy) console.log(chalk.red('      • ECR repository issues detected'));  
            if (!appRunnerHealthy) console.log(chalk.red('      • App Runner service not running'));
        }
        
        if (deploymentSync === 'Rollback detected') {
            console.log(chalk.yellow('   💡 TIP: App Runner may have rolled back due to health check failures'));
        } else if (deploymentSync === 'Out of sync') {
            console.log(chalk.yellow('   💡 TIP: Consider deploying latest changes to synchronize'));
        }
    }

    /**
     * ⏰ Get human-readable time ago
     */
    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - new Date(date);
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffDays > 0) return `${diffDays}d ago`;
        if (diffHours > 0) return `${diffHours}h ago`;
        if (diffMins > 0) return `${diffMins}m ago`;
        return 'just now';
    }

    /**
     * 🎯 Quick health check
     */
    async quickCheck() {
        const status = await this.getLocalStatus();
        
        console.log(chalk.cyan('🌊 WAVELENGTH QUICK CHECK:'));
        console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        
        const checks = [
            { name: 'Dockerfile', status: status.dockerfileExists },
            { name: 'Dependencies', status: status.nodeModulesExists },
            { name: 'Git Clean', status: status.gitStatus === 'Clean' },
            { name: 'Package.json', status: status.packageJsonExists }
        ];
        
        checks.forEach(check => {
            const icon = check.status ? '✅' : '❌';
            console.log(`   ${icon} ${check.name}`);
        });
        
        const allGood = checks.every(check => check.status);
        console.log('');
        console.log(allGood ? chalk.green('🚀 Ready to deploy!') : 
                             chalk.yellow('⚠️ Issues need attention'));
        
        return allGood;
    }
}

// CLI execution
if (require.main === module) {
    const deploymentStatus = new WavelengthDeploymentStatus();
    
    const args = process.argv.slice(2);
    
    if (args.includes('--quick') || args.includes('-q')) {
        deploymentStatus.quickCheck().then(healthy => {
            process.exit(healthy ? 0 : 1);
        });
    } else {
        deploymentStatus.getStatus().then(status => {
            process.exit(status ? 0 : 1);
        });
    }
}

module.exports = WavelengthDeploymentStatus;