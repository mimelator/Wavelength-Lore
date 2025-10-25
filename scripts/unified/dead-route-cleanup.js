#!/usr/bin/env node

/**
 * 🧹 Dead Route Cleanup Script
 * 
 * Analyzes dead routes found by maintenance analyzer and provides
 * automated cleanup with safety checks and backup generation.
 * 
 * Usage: node dead-route-cleanup.js [options]
 */

const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');
const MaintenanceAnalyzer = require('./maintenance-analyzer');

class DeadRouteCleanup {
    constructor() {
        this.projectRoot = process.cwd();
        this.routesDir = path.join(this.projectRoot, 'routes');
        this.backupDir = path.join(this.projectRoot, 'backup/routes');
        this.deadRoutes = [];
        this.cleanupActions = [];
    }

    async analyze() {
        console.log(chalk.cyan('🔍 Analyzing dead routes...'));
        
        const analyzer = new MaintenanceAnalyzer();
        const results = await analyzer.analyze({ quiet: true });
        
        this.deadRoutes = results.issues.deadRoutes;
        console.log(`Found ${this.deadRoutes.length} dead routes`);
        
        return this.deadRoutes;
    }

    async categorizeRoutes() {
        const categories = {
            api: [],
            admin: [], 
            debug: [],
            testing: [],
            legacy: [],
            missing_templates: []
        };

        this.deadRoutes.forEach(route => {
            const routePath = route.route;
            
            if (routePath.includes('/api/') || routePath.endsWith('.json')) {
                categories.api.push(route);
            } else if (routePath.includes('/admin')) {
                categories.admin.push(route);
            } else if (routePath.includes('/debug') || routePath.includes('/test')) {
                categories.debug.push(route);
            } else if (routePath.includes('/health') || routePath.includes('/status')) {
                categories.testing.push(route);
            } else {
                // Check if it might need a template
                categories.missing_templates.push(route);
            }
        });

        return categories;
    }

    async generateCleanupPlan(categories) {
        const plan = {
            safeToDelete: [...categories.debug, ...categories.testing],
            needsReview: [...categories.admin, ...categories.legacy],
            needsTemplates: categories.missing_templates,
            keepAsApi: categories.api
        };

        console.log(chalk.yellow('\n📋 Cleanup Plan:'));
        console.log(`  Safe to delete: ${plan.safeToDelete.length}`);
        console.log(`  Needs review: ${plan.needsReview.length}`);
        console.log(`  Needs templates: ${plan.needsTemplates.length}`);
        console.log(`  Keep as API: ${plan.keepAsApi.length}`);

        return plan;
    }

    async createBackup() {
        console.log(chalk.blue('💾 Creating backup...'));
        
        await fs.mkdir(this.backupDir, { recursive: true });
        
        const routeFiles = await fs.readdir(this.routesDir);
        
        for (const file of routeFiles) {
            if (file.endsWith('.js')) {
                const sourcePath = path.join(this.routesDir, file);
                const backupPath = path.join(this.backupDir, `${file}.backup`);
                await fs.copyFile(sourcePath, backupPath);
            }
        }
        
        console.log(chalk.green(`✓ Backup created in ${this.backupDir}`));
    }

    async cleanupSafeRoutes(safeRoutes, dryRun = true) {
        console.log(chalk.yellow(`\n🧹 ${dryRun ? 'DRY RUN: ' : ''}Cleaning safe routes...`));

        const routesByFile = new Map();
        
        // Group routes by file
        safeRoutes.forEach(route => {
            if (!routesByFile.has(route.file)) {
                routesByFile.set(route.file, []);
            }
            routesByFile.get(route.file).push(route);
        });

        for (const [fileName, routes] of routesByFile) {
            const filePath = path.join(this.routesDir, fileName);
            
            try {
                let content = await fs.readFile(filePath, 'utf8');
                let modified = false;

                for (const route of routes) {
                    const routePattern = this.createRoutePattern(route);
                    
                    if (content.match(routePattern)) {
                        console.log(`  ${dryRun ? 'Would remove' : 'Removing'}: ${route.route} from ${fileName}`);
                        
                        if (!dryRun) {
                            content = content.replace(routePattern, '');
                            modified = true;
                        }
                    }
                }

                if (modified && !dryRun) {
                    await fs.writeFile(filePath, content);
                    console.log(chalk.green(`✓ Updated ${fileName}`));
                }
                
            } catch (error) {
                console.log(chalk.red(`✗ Error processing ${fileName}: ${error.message}`));
            }
        }
    }

    createRoutePattern(route) {
        // Create regex pattern to match the route definition
        const escapedPath = route.route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const method = route.method.toLowerCase();
        
        // Match router.get('/path', ...) with possible multi-line content
        return new RegExp(
            `router\\.${method}\\s*\\(\\s*['"\`]${escapedPath}['"\`][\\s\\S]*?\\}\\s*\\);?\\s*`,
            'gm'
        );
    }

    async generateTemplateStubs(needsTemplates, dryRun = true) {
        console.log(chalk.yellow(`\n📄 ${dryRun ? 'DRY RUN: ' : ''}Generating template stubs...`));

        const viewsDir = path.join(this.projectRoot, 'views');
        
        for (const route of needsTemplates.slice(0, 10)) { // Limit to first 10
            const templateName = this.routeToTemplateName(route.route);
            const templatePath = path.join(viewsDir, `${templateName}.ejs`);
            
            if (templateName && !await this.fileExists(templatePath)) {
                const content = this.generateTemplateContent(route);
                
                console.log(`  ${dryRun ? 'Would create' : 'Creating'}: ${templateName}.ejs`);
                
                if (!dryRun) {
                    await fs.writeFile(templatePath, content);
                }
            }
        }
    }

    routeToTemplateName(routePath) {
        // Convert route path to template name
        return routePath
            .replace(/^\/+|\/+$/g, '') // Remove leading/trailing slashes
            .replace(/\//g, '-')       // Replace slashes with dashes
            .replace(/:/g, '')         // Remove parameter indicators
            .replace(/[^a-zA-Z0-9-]/g, '') // Remove special chars
            .toLowerCase();
    }

    generateTemplateContent(route) {
        const title = this.routeToTitle(route.route);
        
        return `<%- include('partials/header', { 
    title: '${title}',
    description: '${title} page',
    canonicalUrl: process.env.CANONICAL_URL + '${route.route}'
}) %>

<div class="container">
    <div class="row justify-content-center">
        <div class="col-lg-8">
            <h1>${title}</h1>
            <p>This page is under construction.</p>
            
            <!-- TODO: Add page content -->
            
            <div class="alert alert-info">
                <strong>Note:</strong> This template was auto-generated by the maintenance script.
                Please customize the content as needed.
            </div>
        </div>
    </div>
</div>

<%- include('partials/footer') %>`;
    }

    routeToTitle(routePath) {
        return routePath
            .replace(/^\/+|\/+$/g, '')
            .replace(/\//g, ' / ')
            .replace(/-/g, ' ')
            .replace(/:/g, '')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ') || 'Page';
    }

    async generateReport(categories, plan) {
        const reportPath = path.join(this.projectRoot, 'dead-routes-report.md');
        
        const report = `# 🧹 Dead Routes Cleanup Report

**Generated**: ${new Date().toISOString()}
**Total Dead Routes**: ${this.deadRoutes.length}

## 📊 Categorization

### Safe to Delete (${plan.safeToDelete.length})
Debug and testing routes that can be safely removed:
${plan.safeToDelete.map(r => `- ${r.route} (${r.file})`).join('\n') || 'None'}

### Needs Review (${plan.needsReview.length})
Admin and legacy routes requiring manual review:
${plan.needsReview.map(r => `- ${r.route} (${r.file})`).join('\n') || 'None'}

### Needs Templates (${plan.needsTemplates.length})
Routes that might need template creation:
${plan.needsTemplates.map(r => `- ${r.route} (${r.file}) → ${this.routeToTemplateName(r.route)}.ejs`).join('\n') || 'None'}

### Keep as API (${plan.keepAsApi.length})
Routes that should remain as API endpoints:
${plan.keepAsApi.map(r => `- ${r.route} (${r.file})`).join('\n') || 'None'}

## 🛠️ Recommended Actions

1. **Run cleanup for safe routes:**
   \`\`\`bash
   node scripts/unified/dead-route-cleanup.js --cleanup --confirm
   \`\`\`

2. **Generate template stubs:**
   \`\`\`bash
   node scripts/unified/dead-route-cleanup.js --generate-templates --confirm
   \`\`\`

3. **Manual review required for:**
   ${plan.needsReview.map(r => `   - ${r.route}`).join('\n') || '   None'}

## ⚠️ Important Notes

- Always run with \`--dry-run\` first to preview changes
- Backups are created automatically in \`backup/routes/\`
- Test thoroughly after cleanup
- Some routes may be intentionally unused (future features)

---
*Generated by Dead Route Cleanup Script*`;

        await fs.writeFile(reportPath, report);
        console.log(chalk.green(`✓ Report generated: ${reportPath}`));
    }

    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }
}

// CLI Interface
program
    .name('dead-route-cleanup')
    .description('Clean up dead routes found by maintenance analyzer');

program
    .command('analyze')
    .description('Analyze dead routes and generate cleanup plan')
    .action(async () => {
        try {
            const cleanup = new DeadRouteCleanup();
            
            await cleanup.analyze();
            const categories = await cleanup.categorizeRoutes();
            const plan = await cleanup.generateCleanupPlan(categories);
            await cleanup.generateReport(categories, plan);
            
            console.log(chalk.green('\n✅ Analysis complete! Check dead-routes-report.md'));
            
        } catch (error) {
            console.error(chalk.red(`Analysis failed: ${error.message}`));
            process.exit(1);
        }
    });

program
    .command('cleanup')
    .description('Clean up safe-to-delete routes')
    .option('--dry-run', 'Preview changes without modifying files', true)
    .option('--confirm', 'Actually perform the cleanup')
    .action(async (options) => {
        try {
            const cleanup = new DeadRouteCleanup();
            
            if (!options.confirm) {
                console.log(chalk.yellow('🔍 DRY RUN mode - no files will be modified'));
                console.log('Add --confirm to actually perform cleanup\n');
            } else {
                await cleanup.createBackup();
            }
            
            await cleanup.analyze();
            const categories = await cleanup.categorizeRoutes();
            const plan = await cleanup.generateCleanupPlan(categories);
            
            await cleanup.cleanupSafeRoutes(plan.safeToDelete, !options.confirm);
            
            if (options.confirm) {
                console.log(chalk.green('\n✅ Cleanup complete!'));
            } else {
                console.log(chalk.yellow('\n💡 Add --confirm to apply these changes'));
            }
            
        } catch (error) {
            console.error(chalk.red(`Cleanup failed: ${error.message}`));
            process.exit(1);
        }
    });

program
    .command('generate-templates')
    .description('Generate template stubs for routes missing templates')
    .option('--dry-run', 'Preview changes without creating files', true)
    .option('--confirm', 'Actually create the templates')
    .action(async (options) => {
        try {
            const cleanup = new DeadRouteCleanup();
            
            await cleanup.analyze();
            const categories = await cleanup.categorizeRoutes();
            const plan = await cleanup.generateCleanupPlan(categories);
            
            await cleanup.generateTemplateStubs(plan.needsTemplates, !options.confirm);
            
            if (options.confirm) {
                console.log(chalk.green('\n✅ Template generation complete!'));
            } else {
                console.log(chalk.yellow('\n💡 Add --confirm to create these templates'));
            }
            
        } catch (error) {
            console.error(chalk.red(`Template generation failed: ${error.message}`));
            process.exit(1);
        }
    });

if (require.main === module) {
    program.parse();
}

module.exports = DeadRouteCleanup;