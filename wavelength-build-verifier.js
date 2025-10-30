#!/usr/bin/env node

/**
 * 🌊 WAVELENGTH Build Verification & Deployment Tracker
 * 
 * Complete pipeline verification tool that tracks:
 * GitHub Commit → ECR Image → App Runner Deployment → Live Site
 * 
 * Usage:
 *   npm run verify:build              # Full verification
 *   npm run verify:build -- --commit <hash>  # Verify specific commit
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const chalk = require('chalk');

// Load environment for AWS credentials
require('dotenv').config();

class WavelengthBuildVerifier {
    constructor() {
        this.serviceArn = process.env.APPRUNNER_SERVICE_ARN;
        this.ecrRepo = 'wavelength-lore';
        this.registry = '170023515523.dkr.ecr.us-east-1.amazonaws.com';
        this.awsRegion = 'us-east-1';
        
        if (!this.serviceArn) {
            throw new Error('APPRUNNER_SERVICE_ARN environment variable required');
        }
    }

    /**
     * Get current local git information
     */
    getLocalGitInfo() {
        try {
            const commit = execSync('git rev-parse HEAD').toString().trim();
            const shortCommit = commit.substring(0, 7);
            const message = execSync('git log -1 --format="%s"').toString().trim();
            const author = execSync('git log -1 --format="%an"').toString().trim();
            const date = execSync('git log -1 --format="%cd" --date=iso').toString().trim();
            
            return {
                commit,
                shortCommit,
                message,
                author,
                date
            };
        } catch (error) {
            throw new Error(`Failed to get git info: ${error.message}`);
        }
    }

    /**
     * Get local version.json information
     */
    getLocalVersion() {
        try {
            const versionPath = path.join(process.cwd(), 'version.json');
            if (fs.existsSync(versionPath)) {
                return JSON.parse(fs.readFileSync(versionPath, 'utf8'));
            }
            return null;
        } catch (error) {
            console.log(chalk.yellow('⚠️ Could not read version.json'));
            return null;
        }
    }

    /**
     * List ECR images for the repository
     */
    async getECRImages(targetCommit = null) {
        try {
            const command = targetCommit 
                ? `aws ecr describe-images --repository-name ${this.ecrRepo} --image-ids imageTag=${targetCommit}`
                : `aws ecr describe-images --repository-name ${this.ecrRepo} --query 'imageDetails[0:10]'`;
            
            const result = execSync(command + ' --output json', { 
                env: {
                    ...process.env,
                    AWS_ACCESS_KEY_ID: process.env.aws_wavelength_dev_access_key_id || process.env.AWS_ACCESS_KEY_ID,
                    AWS_SECRET_ACCESS_KEY: process.env.aws_wavelength_dev_secret_access_key || process.env.AWS_SECRET_ACCESS_KEY,
                    AWS_DEFAULT_REGION: this.awsRegion
                }
            }).toString();
            
            const data = JSON.parse(result);
            return targetCommit ? data.imageDetails : data;
        } catch (error) {
            if (error.message.includes('ImageNotFound')) {
                return targetCommit ? null : [];
            }
            throw new Error(`Failed to get ECR images: ${error.message}`);
        }
    }

    /**
     * Get App Runner service information
     */
    async getAppRunnerInfo() {
        try {
            const result = execSync(`aws apprunner describe-service --service-arn "${this.serviceArn}" --output json`, {
                env: {
                    ...process.env,
                    AWS_ACCESS_KEY_ID: process.env.aws_wavelength_dev_access_key_id || process.env.AWS_ACCESS_KEY_ID,
                    AWS_SECRET_ACCESS_KEY: process.env.aws_wavelength_dev_secret_access_key || process.env.AWS_SECRET_ACCESS_KEY,
                    AWS_DEFAULT_REGION: this.awsRegion
                }
            }).toString();
            
            const data = JSON.parse(result);
            return data.Service;
        } catch (error) {
            throw new Error(`Failed to get App Runner info: ${error.message}`);
        }
    }

    /**
     * Test live deployment API
     */
    async testLiveDeployment() {
        return new Promise((resolve, reject) => {
            // Try direct App Runner URL first
            const req = https.request({
                hostname: 'vh9x3gevev.us-east-1.awsapprunner.com',
                path: '/api/deployment/status',
                method: 'GET',
                timeout: 10000,
                headers: {
                    'User-Agent': 'Wavelength-Build-Verifier'
                }
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const result = JSON.parse(data);
                        resolve(result.deployment || result);
                    } catch (err) {
                        reject(new Error('Invalid JSON response from deployment API'));
                    }
                });
            });
            
            req.on('error', err => {
                // Try production domain as fallback
                const fallbackReq = https.request({
                    hostname: 'wavelengthlore.com',
                    path: '/api/deployment/status',
                    method: 'GET',
                    timeout: 10000,
                    headers: {
                        'User-Agent': 'Wavelength-Build-Verifier'
                    }
                }, (res) => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => {
                        try {
                            const result = JSON.parse(data);
                            resolve(result.deployment || result);
                        } catch (err) {
                            reject(new Error('Failed to reach both App Runner and production domains'));
                        }
                    });
                });
                
                fallbackReq.on('error', () => reject(err));
                fallbackReq.end();
            });
            
            req.end();
        });
    }

    /**
     * Extract image tag from ECR image identifier
     */
    extractImageTag(imageIdentifier) {
        const parts = imageIdentifier.split(':');
        return parts[parts.length - 1];
    }

    /**
     * Format date for display
     */
    formatDate(dateString) {
        try {
            return new Date(dateString).toLocaleString();
        } catch {
            return dateString;
        }
    }

    /**
     * Main verification process
     */
    async verify(targetCommit = null) {
        console.log(chalk.blue.bold('🌊 WAVELENGTH BUILD VERIFICATION'));
        console.log(chalk.gray('━'.repeat(60)));
        console.log('');

        try {
            // Step 1: Get local information
            console.log(chalk.yellow('📂 Step 1: Local Repository Information'));
            console.log(chalk.gray('━'.repeat(40)));
            
            const gitInfo = this.getLocalGitInfo();
            const localVersion = this.getLocalVersion();
            
            console.log(`📍 Current Commit: ${chalk.white(gitInfo.shortCommit)} (${gitInfo.commit})`);
            console.log(`📝 Message: ${chalk.white(gitInfo.message)}`);
            console.log(`👤 Author: ${chalk.white(gitInfo.author)}`);
            console.log(`📅 Date: ${chalk.white(this.formatDate(gitInfo.date))}`);
            
            if (localVersion) {
                console.log(`📦 Version: ${chalk.white(localVersion.version)}`);
                console.log(`🔢 Build: ${chalk.white(localVersion.buildNumber)}`);
            }
            
            const checkCommit = targetCommit || gitInfo.commit;
            const checkShortCommit = checkCommit.substring(0, 7);
            console.log('');

            // Step 2: Check ECR images
            console.log(chalk.yellow('🐳 Step 2: ECR Image Verification'));
            console.log(chalk.gray('━'.repeat(40)));
            
            const allImages = await this.getECRImages();
            const targetImage = await this.getECRImages(checkShortCommit);
            
            console.log(`🔍 Checking for image tagged: ${chalk.white(checkShortCommit)}`);
            
            if (targetImage && targetImage.length > 0) {
                const image = targetImage[0];
                console.log(chalk.green(`✅ Image found in ECR`));
                console.log(`📦 Tags: ${chalk.white(image.imageTags?.join(', ') || 'No tags')}`);
                console.log(`📅 Pushed: ${chalk.white(this.formatDate(image.imagePushedAt))}`);
                console.log(`📊 Size: ${chalk.white(Math.round(image.imageSizeInBytes / 1024 / 1024))} MB`);
            } else {
                console.log(chalk.red(`❌ No ECR image found for commit ${checkShortCommit}`));
                console.log(chalk.gray('💡 Available images:'));
                allImages.slice(0, 5).forEach(img => {
                    const tags = img.imageTags?.join(', ') || 'No tags';
                    const date = this.formatDate(img.imagePushedAt);
                    console.log(chalk.gray(`   • ${tags} (${date})`));
                });
            }
            console.log('');

            // Step 3: Check App Runner
            console.log(chalk.yellow('🚀 Step 3: App Runner Service Status'));
            console.log(chalk.gray('━'.repeat(40)));
            
            const appRunnerInfo = await this.getAppRunnerInfo();
            const currentImage = appRunnerInfo.SourceConfiguration.ImageRepository.ImageIdentifier;
            const currentTag = this.extractImageTag(currentImage);
            
            console.log(`📊 Status: ${chalk.white(appRunnerInfo.Status)}`);
            console.log(`🐳 Current Image: ${chalk.white(currentTag)}`);
            console.log(`📅 Last Updated: ${chalk.white(this.formatDate(appRunnerInfo.UpdatedAt))}`);
            console.log(`🌐 Service URL: ${chalk.white(appRunnerInfo.ServiceUrl)}`);
            
            // Check if App Runner is using the target commit
            const isUsingTargetCommit = currentTag === checkShortCommit || 
                                      currentTag === `v${localVersion?.version}-manual` ||
                                      currentTag.startsWith(checkShortCommit);
            
            if (isUsingTargetCommit) {
                console.log(chalk.green(`✅ App Runner is using target commit image`));
            } else {
                console.log(chalk.yellow(`⚠️ App Runner is using different image: ${currentTag}`));
                console.log(chalk.gray(`   Expected: ${checkShortCommit}`));
            }
            console.log('');

            // Step 4: Test live deployment
            console.log(chalk.yellow('🌐 Step 4: Live Deployment Verification'));
            console.log(chalk.gray('━'.repeat(40)));
            
            try {
                const liveDeployment = await this.testLiveDeployment();
                
                console.log(`📦 Live Version: ${chalk.white(liveDeployment.version || 'unknown')}`);
                console.log(`🔗 Live Commit: ${chalk.white(liveDeployment.commitShort || 'unknown')}`);
                console.log(`📅 Build Date: ${chalk.white(this.formatDate(liveDeployment.buildDate))}`);
                console.log(`🔢 Build Number: ${chalk.white(liveDeployment.buildNumber || 'unknown')}`);
                console.log(`🌍 Environment: ${chalk.white(liveDeployment.nodeEnv || 'unknown')}`);
                console.log(`⏱️ Uptime: ${chalk.white(liveDeployment.uptimeFormatted || 'unknown')}`);

                // Check if live deployment matches target
                const liveCommitMatches = liveDeployment.commitShort === checkShortCommit ||
                                        liveDeployment.commitHash === checkCommit;
                
                if (liveCommitMatches) {
                    console.log(chalk.green(`✅ Live deployment matches target commit`));
                } else {
                    console.log(chalk.yellow(`⚠️ Live deployment commit differs`));
                    console.log(chalk.gray(`   Live: ${liveDeployment.commitShort}`));
                    console.log(chalk.gray(`   Expected: ${checkShortCommit}`));
                }
                
            } catch (error) {
                console.log(chalk.red(`❌ Failed to verify live deployment: ${error.message}`));
            }
            console.log('');

            // Step 5: Summary
            console.log(chalk.cyan('📋 VERIFICATION SUMMARY'));
            console.log(chalk.gray('━'.repeat(60)));
            
            const hasECRImage = targetImage && targetImage.length > 0;
            const appRunnerRunning = appRunnerInfo.Status === 'RUNNING';
            
            console.log(`🔍 Target Commit: ${chalk.white(checkShortCommit)}`);
            console.log(`🐳 ECR Image: ${hasECRImage ? chalk.green('✅ Available') : chalk.red('❌ Missing')}`);
            console.log(`🚀 App Runner: ${appRunnerRunning ? chalk.green('✅ Running') : chalk.yellow('⚠️ ' + appRunnerInfo.Status)}`);
            console.log(`🎯 Image Match: ${isUsingTargetCommit ? chalk.green('✅ Correct') : chalk.yellow('⚠️ Different')}`);
            
            if (hasECRImage && appRunnerRunning && isUsingTargetCommit) {
                console.log('');
                console.log(chalk.green.bold('🎉 VERIFICATION PASSED: Deployment pipeline is correctly aligned!'));
            } else {
                console.log('');
                console.log(chalk.yellow.bold('⚠️ VERIFICATION ISSUES: Some components are misaligned'));
                console.log('');
                console.log(chalk.gray('💡 Recommended actions:'));
                if (!hasECRImage) {
                    console.log(chalk.gray('   • Run: npm run deploy (to build & push ECR image)'));
                }
                if (!isUsingTargetCommit) {
                    console.log(chalk.gray('   • Check if App Runner deployment is in progress'));
                    console.log(chalk.gray('   • Wait for deployment to complete'));
                }
            }
            
        } catch (error) {
            console.error(chalk.red('❌ Verification failed:'), error.message);
            process.exit(1);
        }
    }
}

// CLI handling
async function main() {
    const args = process.argv.slice(2);
    let targetCommit = null;
    
    // Parse arguments
    const commitIndex = args.indexOf('--commit');
    if (commitIndex !== -1 && args[commitIndex + 1]) {
        targetCommit = args[commitIndex + 1];
    }
    
    const showHelp = args.includes('--help') || args.includes('-h');
    
    if (showHelp) {
        console.log(chalk.blue('🌊 WAVELENGTH Build Verification Tool'));
        console.log('');
        console.log(chalk.white('USAGE:'));
        console.log(chalk.gray('  npm run verify:build                    # Verify current commit'));
        console.log(chalk.gray('  npm run verify:build -- --commit <hash> # Verify specific commit'));
        console.log('');
        console.log(chalk.white('DESCRIPTION:'));
        console.log(chalk.gray('  Tracks deployment pipeline from GitHub commit to live site:'));
        console.log(chalk.gray('  1. Local git information'));
        console.log(chalk.gray('  2. ECR image availability'));
        console.log(chalk.gray('  3. App Runner deployment status'));
        console.log(chalk.gray('  4. Live site verification'));
        process.exit(0);
    }
    
    try {
        const verifier = new WavelengthBuildVerifier();
        await verifier.verify(targetCommit);
    } catch (error) {
        console.error(chalk.red('❌ Fatal error:'), error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = WavelengthBuildVerifier;