#!/usr/bin/env node

/**
 * Safe Script Runner
 * Wraps script execution with package.json protection
 */

const { spawn } = require('child_process');
const PackageProtector = require('./package-protector');

class SafeScriptRunner {
    constructor() {
        this.protector = new PackageProtector();
    }

    async runScript(command, args = []) {
        console.log(`🛡️ Starting protected execution: ${command} ${args.join(' ')}`);
        
        // Pre-execution protection
        try {
            this.protector.backup();
            this.protector.lock();
            
            const validation = this.protector.validate();
            if (!validation.valid) {
                throw new Error(`package.json invalid before execution: ${JSON.stringify(validation)}`);
            }
        } catch (error) {
            console.error('❌ Pre-execution protection failed:', error.message);
            return false;
        }

        // Execute command
        let success = false;
        try {
            await this.executeScript(command, args);
            success = true;
        } catch (error) {
            console.error('❌ Script execution failed:', error.message);
        }

        // Post-execution validation
        try {
            const postValidation = this.protector.validate();
            if (!postValidation.valid) {
                console.error('🚨 CORRUPTION DETECTED! Initiating recovery...');
                const recovered = this.protector.emergencyRecover();
                if (!recovered) {
                    throw new Error('Emergency recovery failed');
                }
            }
        } finally {
            this.protector.unlock();
        }

        return success;
    }

    executeScript(inputCommand, args) {
        return new Promise((resolve, reject) => {
            let command, commandArgs;
            
            // Detect if it's a shell command (npm, bash, etc.) or Node.js script
            if (inputCommand === 'npm' || inputCommand === 'bash' || inputCommand === 'sh' || !inputCommand.endsWith('.js')) {
                // Shell command
                command = inputCommand;
                commandArgs = args;
            } else {
                // Node.js script
                command = 'node';
                commandArgs = [inputCommand, ...args];
            }
            
            const child = spawn(command, commandArgs, {
                stdio: 'inherit',
                cwd: process.cwd(),
                shell: true // Enable shell for npm commands
            });

            child.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`Script exited with code ${code}`));
                }
            });

            child.on('error', reject);
        });
    }
}

// CLI Interface
if (require.main === module) {
    const runner = new SafeScriptRunner();
    const command = process.argv[2];
    const args = process.argv.slice(3);

    if (!command) {
        console.log(`
Safe Script Runner - Package.json Protection

Usage: node safe-script-runner.js <command> [args...]

Examples:
  node safe-script-runner.js npm run dev
  node safe-script-runner.js npm start
  node safe-script-runner.js ./test-runner.js all
  node safe-script-runner.js ../debug/test-admin-api.js
`);
        process.exit(1);
    }

    runner.runScript(command, args)
        .then(success => {
            console.log(success ? '✅ Script completed safely' : '❌ Script failed');
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ Safe runner error:', error.message);
            process.exit(1);
        });
}

module.exports = SafeScriptRunner;