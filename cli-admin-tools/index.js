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
            },
                        'chatbot': {
                name: 'Chatbot Admin',
                description: 'Interactive lore chatbot administration',
                script: 'chatbot-admin.js',
            },
            'aws': {
                name: 'AWS Manager',
                description: 'Clean room AWS infrastructure management',
                script: 'aws-admin.js',
            },
            'deploy': {
                name: 'Deployment Manager',
                description: 'Clean room deployment pipeline management',
                script: 'deploy-admin.js',
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
        console.log(chalk.white('  npm run cli:admin <tool> [options]'));
        console.log(chalk.white('  Example: npm run cli:admin sync'));
        console.log(chalk.white('  Example: npm run cli:admin cache --status'));
        console.log(chalk.white('  Example: npm run cli:admin chatbot health'));
        console.log(chalk.white('  Example: npm run cli:admin chatbot query "Who is Andrew?"'));
        console.log(chalk.white('  Example: npm run cli:admin aws cloudfront list'));
        console.log(chalk.white('  Example: npm run cli:admin aws apprunner status'));
        console.log(chalk.white('  Example: npm run cli:admin deploy deploy'));
        console.log(chalk.white('  Example: npm run cli:admin deploy monitor'));
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
                } else if (toolKey === 'aws') {
                    // Handle AWS subcommands
                    const service = args[0] || 'help';
                    const operation = args[1] || 'help';
                    const subArgs = args.slice(2);
                    
                    // Parse options
                    const options = {};
                    for (let i = 0; i < subArgs.length; i += 2) {
                        if (subArgs[i]?.startsWith('--')) {
                            const key = subArgs[i].substring(2);
                            const value = subArgs[i + 1];
                            options[key] = value;
                        }
                    }
                    
                    await toolInstance.handleCommand(service, operation, options);
                    
                } else if (toolKey === 'deploy') {
                    // Handle deployment subcommands
                    const operation = args[0] || 'help';
                    const subArgs = args.slice(1);
                    
                    // Parse options
                    const options = {};
                    for (let i = 0; i < subArgs.length; i += 2) {
                        if (subArgs[i]?.startsWith('--')) {
                            const key = subArgs[i].substring(2);
                            const value = subArgs[i + 1];
                            options[key] = value;
                        }
                    }
                    
                    await toolInstance.handleCommand(operation, options);
                    
                } else if (toolKey === 'chatbot') {
                    // Handle chatbot subcommands
                    const subCommand = args[0] || 'help';
                    const subArgs = args.slice(1);
                    
                    if (subCommand === 'health') {
                        await toolInstance.checkHealth();
                    } else if (subCommand === 'test') {
                        await toolInstance.runTests();
                    } else if (subCommand === 'chat') {
                        await toolInstance.startInteractiveChat();
                    } else if (subCommand === 'query') {
                        const question = subArgs.join(' ');
                        if (question) {
                            await toolInstance.sendQuery(question);
                        } else {
                            console.log(chalk.red('❌ Please provide a question'));
                            console.log(chalk.yellow('Example: npm run cli:admin chatbot query "Who is Andrew?"'));
                        }
                    } else if (subCommand === 'demo') {
                        // Demo mode with mock responses
                        console.log(chalk.cyan('🎭 WAVELENGTH CHATBOT DEMO MODE'));
                        console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
                        console.log(chalk.yellow('This is a demo mode showing how the chatbot interface works.'));
                        console.log(chalk.white('The actual chatbot API appears to be offline.\n'));
                        
                        const demoResponses = {
                            "who is andrew": "Andrew is a central character in Wavelength Lore, known for his adventures across the dimensional realms.",
                            "what is wavelength": "Wavelength Lore is an epic science fiction saga featuring interdimensional travel and complex character relationships.",
                            "season 1": "Season 1 introduces the core characters and establishes the foundational lore of the Wavelength universe."
                        };
                        
                        const question = subArgs.join(' ').toLowerCase();
                        const response = demoResponses[question] || "I'm a demo response! The real chatbot would have detailed lore information about that topic.";
                        
                        console.log(chalk.green(`💡 Demo Answer: ${response}`));
                        console.log(chalk.gray('⏱️  Demo response time: 50ms'));
                        console.log(chalk.yellow('\n💡 Once the chatbot API is configured, this will connect to the real lore database!'));
                    } else {
                        toolInstance.showHelp();
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