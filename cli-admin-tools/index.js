#!/usr/bin/env node
/**
 * 🌊 WAVELENGTH CLI ADMIN TOOLKIT
 * ===============================
 * Pristine, isolated admin tools for CLI admin mode
 * Completely separate from existing scripts to ensure reliability
 */

const chalk = require('chalk');
const path = require('path');
const fs = require('fs');

class WavelengthAdminToolkit {
    constructor() {
        this.toolsDir = __dirname;
        this.tools = {
            'sync': {
                name: 'Sync Assets',
                description: 'Sync static assets and images',
                script: 'sync-assets.js',
                icon: '📄'
            },
            'cache': {
                name: 'Cache Bust',
                description: 'Invalidate CloudFront cache',
                script: 'cache-bust.js', 
                icon: '🔄'
            },
            'status': {
                name: 'Deployment Status',
                description: 'Check deployment and build status',
                script: 'deployment-status.js',
                icon: '📊'
            }
        };
    }

    /**
     * 🎯 Show admin toolkit menu
     */
    showMenu() {
        console.log(chalk.cyan('🌊 WAVELENGTH ADMIN TOOLKIT'));
        console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log(chalk.white('Available Admin Tools:\n'));
        
        Object.entries(this.tools).forEach(([key, tool]) => {
            console.log(chalk.white(`  ${tool.icon} ${chalk.bold(tool.name)} (${key})`));
            console.log(chalk.gray(`     ${tool.description}`));
            console.log('');
        });
        
        console.log(chalk.yellow('Usage:'));
        console.log(chalk.white('  node cli-admin-tools/index.js <tool> [options]'));
        console.log(chalk.white('  Example: node cli-admin-tools/index.js sync'));
        console.log(chalk.white('  Example: node cli-admin-tools/index.js cache --status'));
        console.log('');
        
        console.log(chalk.green('🌟 Pristine Tools - Isolated & Reliable'));
    }

    /**
     * 🚀 Execute admin tool
     */
    async executeTool(toolKey, args = []) {
        const tool = this.tools[toolKey];
        
        if (!tool) {
            console.error(chalk.red(`❌ Unknown tool: ${toolKey}`));
            console.log(chalk.yellow('Available tools:'), Object.keys(this.tools).join(', '));
            return false;
        }
        
        const toolPath = path.join(this.toolsDir, tool.script);
        
        if (!fs.existsSync(toolPath)) {
            console.error(chalk.red(`❌ Tool script not found: ${tool.script}`));
            return false;
        }
        
        console.log(chalk.cyan(`🚀 Executing: ${tool.name}`));
        console.log(chalk.gray(`   Script: ${tool.script}`));
        
        try {
            // Dynamic require and execute
            const ToolClass = require(toolPath);
            
            // Handle different tool patterns
            if (typeof ToolClass === 'function') {
                const toolInstance = new ToolClass();
                
                // Execute appropriate method based on tool and args
                if (toolKey === 'sync') {
                    if (args.includes('--status')) {
                        const status = toolInstance.getStatus();
                        console.log(chalk.cyan('📄 SYNC ASSETS STATUS:'));
                        console.log(chalk.white(`Status: ${status.status}`));
                        console.log(chalk.white(`Last Sync: ${status.lastSync}`));
                    } else {
                        await toolInstance.sync();
                    }
                } else if (toolKey === 'cache') {
                    if (args.includes('--status') || args.includes('--recent')) {
                        const recent = toolInstance.getRecentInvalidations();
                        console.log(chalk.cyan('🔄 RECENT CACHE INVALIDATIONS:'));
                        if (recent.length === 0) {
                            console.log(chalk.yellow('No recent invalidations'));
                        } else {
                            recent.forEach((inv, i) => {
                                console.log(chalk.white(`${i + 1}. ${inv.invalidationId} - ${new Date(inv.timestamp).toLocaleString()}`));
                            });
                        }
                    } else {
                        const scenario = args.find(arg => !arg.startsWith('--')) || 'all';
                        await toolInstance.smartBust(scenario);
                    }
                } else if (toolKey === 'status') {
                    if (args.includes('--quick') || args.includes('-q')) {
                        await toolInstance.quickCheck();
                    } else {
                        await toolInstance.getStatus();
                    }
                }
            }
            
            return true;
            
        } catch (error) {
            console.error(chalk.red('❌ Tool execution failed:'), error.message);
            return false;
        }
    }

    /**
     * 📊 Get toolkit status
     */
    getToolkitStatus() {
        console.log(chalk.cyan('🌊 ADMIN TOOLKIT STATUS:'));
        console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        
        Object.entries(this.tools).forEach(([key, tool]) => {
            const toolPath = path.join(this.toolsDir, tool.script);
            const exists = fs.existsSync(toolPath);
            const status = exists ? '✅' : '❌';
            
            console.log(`  ${status} ${tool.name} (${key})`);
            if (!exists) {
                console.log(chalk.red(`     Missing: ${tool.script}`));
            }
        });
        
        console.log('');
        console.log(chalk.green('🌟 Pristine Admin Tools - Ready for Use'));
    }
}

// CLI execution
if (require.main === module) {
    const toolkit = new WavelengthAdminToolkit();
    
    const args = process.argv.slice(2);
    
    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
        toolkit.showMenu();
    } else if (args.includes('--status')) {
        toolkit.getToolkitStatus();
    } else {
        const toolKey = args[0];
        const toolArgs = args.slice(1);
        
        toolkit.executeTool(toolKey, toolArgs).then(success => {
            process.exit(success ? 0 : 1);
        });
    }
}

module.exports = WavelengthAdminToolkit;