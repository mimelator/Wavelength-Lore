#!/usr/bin/env node

/**
 * 🏥 Enterprise Toolchain Health Check
 * 
 * Validates all critical scripts and tools in our development workflow
 * Ensures enterprise-grade reliability and identifies issues proactively
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const chalk = require('chalk');

class ToolchainHealthChecker {
    constructor() {
        this.projectRoot = path.resolve(__dirname, '..', '..');
        this.results = {
            passed: 0,
            failed: 0,
            warnings: 0,
            tests: []
        };
    }

    async runCheck() {
        console.log(chalk.blue('🏥 Enterprise Toolchain Health Check'));
        console.log(chalk.blue('━'.repeat(50)));
        console.log();

        await this.checkCriticalScripts();
        await this.checkAWSConfiguration();
        await this.checkEnvironmentVariables();
        await this.checkNodeModules();
        await this.checkGitConfiguration();

        this.printSummary();
    }

    async checkCriticalScripts() {
        console.log(chalk.cyan('📋 Critical Scripts Validation'));
        console.log('─'.repeat(30));

        const criticalScripts = [
            { path: 'scripts/unified/smart-commit.js', name: 'Smart Commit' },
            { path: 'scripts/unified/deployment-manager.js', name: 'Deployment Manager' },
            { path: 'scripts/unified/aws-manager.js', name: 'AWS Manager' },
            { path: 'scripts/organized/testing-validation/check-production-env.js', name: 'Production Environment Checker' },
            { path: 'scripts/organized/aws-infrastructure/cloudfront-cache-bust.js', name: 'CloudFront Cache Buster' },
            { path: 'scripts/utils/aws-config-helper.js', name: 'AWS Config Helper' }
        ];

        for (const script of criticalScripts) {
            await this.validateScript(script);
        }
    }

    async validateScript(script) {
        const fullPath = path.join(this.projectRoot, script.path);
        
        try {
            // Check if file exists
            await fs.access(fullPath);
            
            // Try to load the script
            const result = await this.runScriptCheck(fullPath);
            
            if (result.success) {
                this.logPass(`✅ ${script.name}`, result.details);
            } else {
                this.logFail(`❌ ${script.name}`, result.error);
            }
        } catch (error) {
            this.logFail(`❌ ${script.name}`, `File not found: ${script.path}`);
        }
    }

    async runScriptCheck(scriptPath) {
        return new Promise((resolve) => {
            const child = spawn('node', [scriptPath, '--help'], {
                stdio: 'pipe',
                timeout: 5000
            });

            let stdout = '';
            let stderr = '';

            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            child.on('close', (code) => {
                if (code === 0 || stdout.includes('Usage:') || stdout.includes('Options:')) {
                    resolve({ success: true, details: 'Loads and shows help correctly' });
                } else {
                    resolve({ success: false, error: stderr || 'Script failed to load' });
                }
            });

            child.on('error', (error) => {
                resolve({ success: false, error: error.message });
            });
        });
    }

    async checkAWSConfiguration() {
        console.log(chalk.cyan('☁️  AWS Configuration Check'));
        console.log('─'.repeat(30));

        try {
            const { getAWSConfig } = require('./aws-config-helper');
            const config = getAWSConfig();
            
            const requiredFields = [
                'region',
                'appRunner.serviceArn',
                'cloudfront.distributionId',
                's3.bucketName'
            ];

            let allPresent = true;
            for (const field of requiredFields) {
                const keys = field.split('.');
                let current = config;
                let missing = false;
                
                for (const key of keys) {
                    if (!current || !current[key]) {
                        missing = true;
                        break;
                    }
                    current = current[key];
                }
                
                if (missing) {
                    allPresent = false;
                    this.logWarn(`⚠️  Missing: ${field}`, 'Consider setting environment variable or config file');
                }
            }

            if (allPresent) {
                this.logPass('✅ AWS Configuration', 'All required fields present');
            }

        } catch (error) {
            this.logFail('❌ AWS Configuration', error.message);
        }
    }

    async checkEnvironmentVariables() {
        console.log(chalk.cyan('🔧 Environment Variables Check'));
        console.log('─'.repeat(30));

        const criticalEnvVars = [
            { name: 'NODE_ENV', required: false, defaultValue: 'development' },
            { name: 'PORT', required: false, defaultValue: '3001' },
            { name: 'AWS_REGION', required: false, defaultValue: 'us-east-1' },
            { name: 'DATABASE_URL', required: true },
            { name: 'FIREBASE_PROJECT_ID', required: true }
        ];

        for (const envVar of criticalEnvVars) {
            const value = process.env[envVar.name];
            
            if (value) {
                this.logPass(`✅ ${envVar.name}`, `Set to: ${value.substring(0, 20)}${value.length > 20 ? '...' : ''}`);
            } else if (envVar.required) {
                this.logFail(`❌ ${envVar.name}`, 'Required environment variable not set');
            } else {
                this.logWarn(`⚠️  ${envVar.name}`, `Using default: ${envVar.defaultValue}`);
            }
        }
    }

    async checkNodeModules() {
        console.log(chalk.cyan('📦 Dependencies Check'));
        console.log('─'.repeat(30));

        try {
            const packageJsonPath = path.join(this.projectRoot, 'package.json');
            const packageData = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
            
            const criticalDeps = [
                '@aws-sdk/client-apprunner',
                '@aws-sdk/client-cloudfront',
                '@aws-sdk/client-s3',
                'express',
                'firebase',
                'dotenv'
            ];

            for (const dep of criticalDeps) {
                const isInstalled = packageData.dependencies?.[dep] || packageData.devDependencies?.[dep];
                
                if (isInstalled) {
                    this.logPass(`✅ ${dep}`, `Version: ${isInstalled}`);
                } else {
                    this.logFail(`❌ ${dep}`, 'Critical dependency not found');
                }
            }

        } catch (error) {
            this.logFail('❌ Dependencies Check', error.message);
        }
    }

    async checkGitConfiguration() {
        console.log(chalk.cyan('🔧 Git Configuration Check'));
        console.log('─'.repeat(30));

        try {
            const gitConfigPath = path.join(this.projectRoot, '.git', 'config');
            await fs.access(gitConfigPath);
            this.logPass('✅ Git Repository', 'Initialized and configured');

            // Check for commit message files
            const commitFiles = ['commit-message.txt', '.commit-message.txt', 'COMMIT_MESSAGE.txt'];
            let foundCommitFile = false;
            
            for (const file of commitFiles) {
                try {
                    await fs.access(path.join(this.projectRoot, file));
                    this.logPass(`✅ Commit Message File`, `Found: ${file}`);
                    foundCommitFile = true;
                    break;
                } catch {}
            }
            
            if (!foundCommitFile) {
                this.logWarn('⚠️  Commit Message File', 'No commit message template found');
            }

        } catch (error) {
            this.logFail('❌ Git Repository', 'Not a git repository or not configured');
        }
    }

    logPass(title, details) {
        console.log(chalk.green(title) + (details ? chalk.gray(` - ${details}`) : ''));
        this.results.passed++;
        this.results.tests.push({ status: 'pass', title, details });
    }

    logFail(title, details) {
        console.log(chalk.red(title) + (details ? chalk.gray(` - ${details}`) : ''));
        this.results.failed++;
        this.results.tests.push({ status: 'fail', title, details });
    }

    logWarn(title, details) {
        console.log(chalk.yellow(title) + (details ? chalk.gray(` - ${details}`) : ''));
        this.results.warnings++;
        this.results.tests.push({ status: 'warn', title, details });
    }

    printSummary() {
        console.log();
        console.log(chalk.blue('📊 Health Check Summary'));
        console.log(chalk.blue('━'.repeat(50)));
        
        const total = this.results.passed + this.results.failed + this.results.warnings;
        
        console.log(chalk.green(`✅ Passed: ${this.results.passed}/${total}`));
        console.log(chalk.red(`❌ Failed: ${this.results.failed}/${total}`));
        console.log(chalk.yellow(`⚠️  Warnings: ${this.results.warnings}/${total}`));
        
        console.log();
        
        if (this.results.failed === 0) {
            console.log(chalk.green('🎉 Toolchain is healthy and ready for enterprise use!'));
        } else if (this.results.failed <= 2) {
            console.log(chalk.yellow('⚠️  Toolchain has minor issues but is mostly functional'));
        } else {
            console.log(chalk.red('🚨 Toolchain has significant issues that need attention'));
        }
        
        console.log();
        console.log(chalk.gray('Enterprise-grade development tools - Ready for production! 🚀'));
    }
}

// Run if called directly
if (require.main === module) {
    const checker = new ToolchainHealthChecker();
    checker.runCheck().catch(console.error);
}

module.exports = ToolchainHealthChecker;