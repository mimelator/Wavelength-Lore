#!/usr/bin/env node

/**
 * 🔍 Comprehensive Maintenance Analyzer
 * 
 * Analyzes pages, routes, links, and content to identify:
 * - Orphaned pages (no routes)
 * - Dead routes (no pages)  
 * - Missing links between content
 * - Broken internal references
 * - Unreachable content
 * 
 * Usage: node maintenance-analyzer.js [options]
 */

const { program } = require('commander');
const fs = require('fs').promises;
const path = require('path');
const glob = require('glob');
const chalk = require('chalk');

class MaintenanceAnalyzer {
    constructor() {
        this.results = {
            routes: new Map(),
            pages: new Map(), 
            content: new Map(),
            links: new Map(),
            issues: {
                orphanedPages: [],
                deadRoutes: [],
                brokenLinks: [],
                unreachableContent: [],
                missingRoutes: [],
                duplicateRoutes: []
            },
            stats: {
                totalRoutes: 0,
                totalPages: 0,
                totalContent: 0,
                totalLinks: 0,
                healthScore: 0
            }
        };
        
        this.projectRoot = process.cwd();
        this.routesDir = path.join(this.projectRoot, 'routes');
        this.viewsDir = path.join(this.projectRoot, 'views');
        this.contentDir = path.join(this.projectRoot, 'content');
        this.staticDir = path.join(this.projectRoot, 'static');
    }

    // 🎯 Main analysis orchestrator
    async analyze(options = {}) {
        this.logStep('🔍 Starting Comprehensive Maintenance Analysis');
        
        try {
            // Phase 1: Discovery
            await this.discoverRoutes();
            await this.discoverPages();
            await this.discoverContent();
            await this.discoverLinks();
            
            // Phase 2: Analysis
            await this.analyzeRoutePageConnections();
            await this.analyzeContentReachability();
            await this.analyzeLinkIntegrity();
            await this.analyzeRouteDuplication();
            
            // Phase 3: Reporting
            this.calculateHealthScore();
            await this.generateReport(options);
            
            return this.results;
            
        } catch (error) {
            this.logError(`Analysis failed: ${error.message}`);
            throw error;
        }
    }

    // 📍 Route Discovery
    async discoverRoutes() {
        this.logInfo('Discovering routes...');
        
        const routeFiles = await glob('*.js', { cwd: this.routesDir });
        
        for (const file of routeFiles) {
            const filePath = path.join(this.routesDir, file);
            const content = await fs.readFile(filePath, 'utf8');
            
            // Extract route definitions
            const routes = this.extractRouteDefinitions(content, file);
            routes.forEach(route => {
                this.results.routes.set(route.path, {
                    ...route,
                    file,
                    filePath
                });
            });
        }
        
        // Check main app.js for route mounting
        const appFile = path.join(this.projectRoot, 'app.js');
        if (await this.fileExists(appFile)) {
            const appContent = await fs.readFile(appFile, 'utf8');
            await this.extractMountedRoutes(appContent);
        }
        
        this.results.stats.totalRoutes = this.results.routes.size;
        this.logSuccess(`Found ${this.results.stats.totalRoutes} route definitions`);
    }

    extractRouteDefinitions(content, fileName) {
        const routes = [];
        
        // Match router.get, router.post, etc.
        const routeRegex = /router\.(get|post|put|delete|use)\s*\(\s*['"`]([^'"`]+)['"`]/g;
        let match;
        
        while ((match = routeRegex.exec(content)) !== null) {
            routes.push({
                method: match[1].toUpperCase(),
                path: match[2],
                type: 'endpoint',
                source: fileName
            });
        }
        
        // Match app.use for middleware mounting
        const mountRegex = /app\.use\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*(\w+)/g;
        while ((match = mountRegex.exec(content)) !== null) {
            routes.push({
                method: 'USE',
                path: match[1],
                type: 'mount',
                source: fileName,
                middleware: match[2]
            });
        }
        
        return routes;
    }

    async extractMountedRoutes(appContent) {
        // Find route mounting patterns in app.js
        const mountPatterns = [
            /app\.use\s*\(\s*['"`]([^'"`]*?)['"`]\s*,\s*(\w+Routes?)/g,
            /app\.use\s*\(\s*(\w+Routes?)\s*\)/g
        ];
        
        for (const pattern of mountPatterns) {
            let match;
            while ((match = pattern.exec(appContent)) !== null) {
                const basePath = match[1] || '/';
                const routerName = match[2] || match[1];
                
                // Update routes with mount path
                this.results.routes.forEach((route, routePath) => {
                    if (route.source.includes(routerName.toLowerCase())) {
                        const fullPath = path.posix.join(basePath, routePath);
                        this.results.routes.delete(routePath);
                        this.results.routes.set(fullPath, {
                            ...route,
                            mountPath: basePath,
                            fullPath
                        });
                    }
                });
            }
        }
    }

    // 📄 Page Discovery  
    async discoverPages() {
        this.logInfo('Discovering pages...');
        
        const ejsFiles = await glob('**/*.ejs', { cwd: this.viewsDir });
        const htmlFiles = await glob('**/*.html', { cwd: this.viewsDir });
        const allFiles = [...ejsFiles, ...htmlFiles];
        
        for (const file of allFiles) {
            const filePath = path.join(this.viewsDir, file);
            const relativePath = file.replace(/\.(ejs|html)$/, '');
            
            // Skip partials and components
            if (file.includes('/partials/') || file.includes('/components/')) {
                continue;
            }
            
            const content = await fs.readFile(filePath, 'utf8');
            const links = this.extractPageLinks(content);
            
            this.results.pages.set(relativePath, {
                file,
                filePath,
                type: path.extname(file).slice(1),
                links,
                referencedBy: []
            });
        }
        
        this.results.stats.totalPages = this.results.pages.size;
        this.logSuccess(`Found ${this.results.stats.totalPages} page templates`);
    }

    extractPageLinks(content) {
        const links = new Set();
        
        // Extract href links
        const hrefRegex = /href\s*=\s*['"`]([^'"`]+)['"`]/g;
        let match;
        while ((match = hrefRegex.exec(content)) !== null) {
            const url = match[1];
            if (url.startsWith('/') && !url.startsWith('//') && !url.includes('http')) {
                links.add(url);
            }
        }
        
        // Extract action links
        const actionRegex = /action\s*=\s*['"`]([^'"`]+)['"`]/g;
        while ((match = actionRegex.exec(content)) !== null) {
            const url = match[1];
            if (url.startsWith('/') && !url.startsWith('//')) {
                links.add(url);
            }
        }
        
        return Array.from(links);
    }

    // 📚 Content Discovery
    async discoverContent() {
        this.logInfo('Discovering content...');
        
        const contentTypes = ['characters', 'lore', 'games', 'maps', 'seasons'];
        
        for (const type of contentTypes) {
            const typeDir = path.join(this.contentDir, type);
            
            if (await this.fileExists(typeDir)) {
                const files = await glob('**/*.json', { cwd: typeDir });
                
                for (const file of files) {
                    const filePath = path.join(typeDir, file);
                    
                    try {
                        const content = JSON.parse(await fs.readFile(filePath, 'utf8'));
                        const contentId = file.replace('.json', '');
                        
                        this.results.content.set(`${type}/${contentId}`, {
                            type,
                            id: contentId,
                            file,
                            filePath,
                            data: content,
                            referencedBy: [],
                            hasRoute: false,
                            hasPage: false
                        });
                    } catch (error) {
                        this.logWarning(`Invalid JSON in ${filePath}: ${error.message}`);
                    }
                }
            }
        }
        
        this.results.stats.totalContent = this.results.content.size;
        this.logSuccess(`Found ${this.results.stats.totalContent} content items`);
    }

    // 🔗 Link Discovery
    async discoverLinks() {
        this.logInfo('Analyzing link relationships...');
        
        // Analyze cross-references in content
        this.results.content.forEach((content, contentKey) => {
            if (content.data && typeof content.data === 'object') {
                this.findContentReferences(content.data, contentKey);
            }
        });
        
        // Analyze page-to-content relationships
        this.results.pages.forEach((page, pageKey) => {
            page.links.forEach(link => {
                // Check if link points to content
                const contentMatch = this.findContentByUrl(link);
                if (contentMatch) {
                    contentMatch.referencedBy.push(`page:${pageKey}`);
                }
            });
        });
        
        this.results.stats.totalLinks = Array.from(this.results.pages.values())
            .reduce((total, page) => total + page.links.length, 0);
            
        this.logSuccess(`Analyzed ${this.results.stats.totalLinks} internal links`);
    }

    findContentReferences(obj, sourceKey, path = '') {
        if (!obj || typeof obj !== 'object') return;
        
        Object.entries(obj).forEach(([key, value]) => {
            const currentPath = path ? `${path}.${key}` : key;
            
            if (typeof value === 'string') {
                // Look for content references
                const references = this.extractContentReferences(value);
                references.forEach(ref => {
                    const targetContent = this.results.content.get(ref);
                    if (targetContent) {
                        targetContent.referencedBy.push(`${sourceKey}:${currentPath}`);
                    }
                });
            } else if (Array.isArray(value)) {
                value.forEach((item, index) => {
                    this.findContentReferences(item, sourceKey, `${currentPath}[${index}]`);
                });
            } else if (typeof value === 'object') {
                this.findContentReferences(value, sourceKey, currentPath);
            }
        });
    }

    extractContentReferences(text) {
        const references = [];
        
        // Look for patterns like "characters/john-doe" or "lore/episode-1"
        const refRegex = /(characters|lore|games|maps|seasons)\/([a-zA-Z0-9-_]+)/g;
        let match;
        
        while ((match = refRegex.exec(text)) !== null) {
            references.push(`${match[1]}/${match[2]}`);
        }
        
        return references;
    }

    findContentByUrl(url) {
        // Try to match URL to content
        const urlPath = url.replace(/^\/+|\/+$/g, ''); // Remove leading/trailing slashes
        
        // Direct match
        if (this.results.content.has(urlPath)) {
            return this.results.content.get(urlPath);
        }
        
        // Pattern matching for common routes
        const patterns = [
            { regex: /^character\/(.+)/, type: 'characters' },
            { regex: /^lore\/(.+)/, type: 'lore' },
            { regex: /^episode\/(.+)/, type: 'lore' },
            { regex: /^game\/(.+)/, type: 'games' },
            { regex: /^map\/(.+)/, type: 'maps' }
        ];
        
        for (const pattern of patterns) {
            const match = urlPath.match(pattern.regex);
            if (match) {
                const contentKey = `${pattern.type}/${match[1]}`;
                if (this.results.content.has(contentKey)) {
                    return this.results.content.get(contentKey);
                }
            }
        }
        
        return null;
    }

    // 🔍 Analysis Methods
    async analyzeRoutePageConnections() {
        this.logInfo('Analyzing route-page connections...');
        
        // Find orphaned pages (pages without routes)
        this.results.pages.forEach((page, pageKey) => {
            const matchingRoute = this.findRouteForPage(pageKey);
            if (!matchingRoute) {
                this.results.issues.orphanedPages.push({
                    page: pageKey,
                    file: page.file,
                    recommendation: `Create route for /${pageKey} or remove unused template`
                });
            }
        });
        
        // Find dead routes (routes without pages)
        this.results.routes.forEach((route, routePath) => {
            if (route.method === 'GET' && route.type === 'endpoint') {
                const matchingPage = this.findPageForRoute(routePath);
                if (!matchingPage && !this.isApiRoute(routePath)) {
                    this.results.issues.deadRoutes.push({
                        route: routePath,
                        method: route.method,
                        file: route.file,
                        recommendation: `Create template or remove unused route`
                    });
                }
            }
        });
    }

    findRouteForPage(pageKey) {
        // Look for exact matches
        const exactMatches = [
            `/${pageKey}`,
            pageKey,
            `/${pageKey}/`,
            `/views/${pageKey}`
        ];
        
        for (const match of exactMatches) {
            if (this.results.routes.has(match)) {
                return this.results.routes.get(match);
            }
        }
        
        // Look for parameterized routes
        for (const [routePath, route] of this.results.routes) {
            if (this.routeMatchesPage(routePath, pageKey)) {
                return route;
            }
        }
        
        return null;
    }

    findPageForRoute(routePath) {
        // Convert route to page patterns
        const pagePatterns = [
            routePath.replace(/^\/+/, ''), // Remove leading slash
            routePath.replace(/^\/+/, '').replace(/\//g, '-'), // Convert slashes to dashes
            routePath.replace(/:\w+/g, 'dynamic'), // Replace parameters
        ];
        
        for (const pattern of pagePatterns) {
            if (this.results.pages.has(pattern)) {
                return this.results.pages.get(pattern);
            }
        }
        
        return null;
    }

    routeMatchesPage(routePath, pageKey) {
        // Remove parameters and normalize
        const normalizedRoute = routePath
            .replace(/:\w+/g, '*')
            .replace(/^\/+|\/+$/g, '')
            .toLowerCase();
            
        const normalizedPage = pageKey
            .replace(/^\/+|\/+$/g, '')
            .toLowerCase();
            
        return normalizedRoute === normalizedPage ||
               normalizedRoute.includes(normalizedPage) ||
               normalizedPage.includes(normalizedRoute);
    }

    isApiRoute(routePath) {
        return routePath.includes('/api/') || 
               routePath.includes('/admin/') ||
               routePath.endsWith('.json') ||
               routePath.includes('/download') ||
               routePath.includes('/upload');
    }

    async analyzeContentReachability() {
        this.logInfo('Analyzing content reachability...');
        
        this.results.content.forEach((content, contentKey) => {
            // Check if content has a route
            const hasRoute = this.findRouteForContent(contentKey);
            content.hasRoute = !!hasRoute;
            
            // Check if content has references
            const hasReferences = content.referencedBy.length > 0;
            
            // If content has no route and no references, it's unreachable
            if (!hasRoute && !hasReferences) {
                this.results.issues.unreachableContent.push({
                    content: contentKey,
                    type: content.type,
                    file: content.file,
                    recommendation: `Create route /${contentKey} or add references from other content`
                });
            }
        });
    }

    findRouteForContent(contentKey) {
        const [type, id] = contentKey.split('/');
        
        // Common route patterns for content
        const routePatterns = [
            `/${contentKey}`,
            `/${type}/${id}`,
            `/${type.slice(0, -1)}/${id}`, // Singular form
            `/content/${contentKey}`,
            `/view/${contentKey}`
        ];
        
        for (const pattern of routePatterns) {
            if (this.results.routes.has(pattern)) {
                return this.results.routes.get(pattern);
            }
        }
        
        // Check for parameterized routes
        for (const [routePath] of this.results.routes) {
            if (routePath.includes(':id') || routePath.includes(':slug')) {
                const baseRoute = routePath.replace(/:\w+.*$/, '');
                if (baseRoute === `/${type}` || baseRoute === `/${type.slice(0, -1)}`) {
                    return this.results.routes.get(routePath);
                }
            }
        }
        
        return null;
    }

    async analyzeLinkIntegrity() {
        this.logInfo('Analyzing link integrity...');
        
        this.results.pages.forEach((page, pageKey) => {
            page.links.forEach(link => {
                if (!this.isValidInternalLink(link)) {
                    this.results.issues.brokenLinks.push({
                        source: `page:${pageKey}`,
                        link,
                        file: page.file,
                        recommendation: `Fix broken link or remove reference`
                    });
                }
            });
        });
    }

    isValidInternalLink(link) {
        // Remove query params and fragments
        const cleanLink = link.split('?')[0].split('#')[0];
        
        // Check if route exists
        if (this.results.routes.has(cleanLink)) {
            return true;
        }
        
        // Check if it matches a parameterized route
        for (const routePath of this.results.routes.keys()) {
            if (this.linkMatchesRoute(cleanLink, routePath)) {
                return true;
            }
        }
        
        // Check if it's a static file
        return this.isStaticFile(cleanLink);
    }

    linkMatchesRoute(link, routePath) {
        // Convert parameterized route to regex
        const routeRegex = routePath.replace(/:\w+/g, '[^/]+');
        const regex = new RegExp(`^${routeRegex}$`);
        return regex.test(link);
    }

    async isStaticFile(link) {
        try {
            const staticPath = path.join(this.staticDir, link.replace(/^\//, ''));
            const stats = await fs.stat(staticPath);
            return stats.isFile();
        } catch {
            return false;
        }
    }

    async analyzeRouteDuplication() {
        this.logInfo('Analyzing route duplication...');
        
        const routeGroups = new Map();
        
        this.results.routes.forEach((route, routePath) => {
            const key = `${route.method}:${routePath}`;
            
            if (!routeGroups.has(key)) {
                routeGroups.set(key, []);
            }
            
            routeGroups.get(key).push({
                ...route,
                path: routePath
            });
        });
        
        routeGroups.forEach((routes, routeKey) => {
            if (routes.length > 1) {
                this.results.issues.duplicateRoutes.push({
                    route: routeKey,
                    duplicates: routes,
                    recommendation: `Consolidate duplicate route definitions`
                });
            }
        });
    }

    // 📊 Health Score Calculation
    calculateHealthScore() {
        const issues = this.results.issues;
        const stats = this.results.stats;
        
        const totalIssues = Object.values(issues).reduce((sum, arr) => sum + arr.length, 0);
        const totalItems = stats.totalRoutes + stats.totalPages + stats.totalContent;
        
        // Health score: 100% - (issue ratio * 100)
        const issueRatio = totalItems > 0 ? totalIssues / totalItems : 0;
        this.results.stats.healthScore = Math.max(0, 100 - (issueRatio * 100));
        
        this.logInfo(`Health Score: ${this.results.stats.healthScore.toFixed(1)}%`);
    }

    // 📋 Report Generation
    async generateReport(options = {}) {
        this.logStep('📋 Generating Maintenance Report');
        
        const reportPath = options.output || path.join(this.projectRoot, 'maintenance-report.md');
        const report = this.buildReportContent();
        
        await fs.writeFile(reportPath, report);
        this.logSuccess(`Report generated: ${reportPath}`);
        
        if (!options.quiet) {
            this.displaySummary();
        }
    }

    buildReportContent() {
        const { stats, issues } = this.results;
        const timestamp = new Date().toISOString();
        
        return `# 🔍 Wavelength Lore Maintenance Report

**Generated**: ${timestamp}  
**Health Score**: ${stats.healthScore.toFixed(1)}% ${this.getHealthEmoji(stats.healthScore)}

## 📊 Overview

| Metric | Count |
|--------|-------|
| Total Routes | ${stats.totalRoutes} |
| Total Pages | ${stats.totalPages} |
| Total Content | ${stats.totalContent} |
| Total Links | ${stats.totalLinks} |

## 🚨 Issues Found

### Orphaned Pages (${issues.orphanedPages.length})
${this.formatIssueList(issues.orphanedPages, 'page')}

### Dead Routes (${issues.deadRoutes.length})
${this.formatIssueList(issues.deadRoutes, 'route')}

### Unreachable Content (${issues.unreachableContent.length})
${this.formatIssueList(issues.unreachableContent, 'content')}

### Broken Links (${issues.brokenLinks.length})
${this.formatIssueList(issues.brokenLinks, 'link')}

### Duplicate Routes (${issues.duplicateRoutes.length})
${this.formatIssueList(issues.duplicateRoutes, 'route')}

## 🔧 Mitigation Recommendations

### High Priority
${this.generatePriorityRecommendations('high')}

### Medium Priority
${this.generatePriorityRecommendations('medium')}

### Low Priority
${this.generatePriorityRecommendations('low')}

## 📈 Next Steps

1. **Address Critical Issues**: Fix orphaned pages and dead routes first
2. **Content Audit**: Review unreachable content for relevance
3. **Link Cleanup**: Validate and fix broken internal links
4. **Route Optimization**: Remove duplicate route definitions
5. **Regular Maintenance**: Run this analyzer weekly

## 🛠️ Scripts to Run

\`\`\`bash
# Fix orphaned pages
${this.generateFixScripts('orphaned')}

# Clean up dead routes
${this.generateFixScripts('dead')}

# Content cleanup
${this.generateFixScripts('content')}
\`\`\`

---
*Generated by Wavelength Lore Maintenance Analyzer*`;
    }

    formatIssueList(issues, type) {
        if (issues.length === 0) {
            return 'None found ✅\n';
        }
        
        return issues.map(issue => {
            const item = issue[type] || issue.page || issue.route || issue.content || issue.link;
            return `- **${item}** - ${issue.recommendation}`;
        }).join('\n') + '\n';
    }

    generatePriorityRecommendations(priority) {
        const recommendations = {
            high: [
                'Fix all orphaned pages by creating routes or removing templates',
                'Remove dead routes that serve no purpose',
                'Create routes for unreachable content that should be accessible'
            ],
            medium: [
                'Fix broken internal links',
                'Consolidate duplicate route definitions',
                'Review content references for accuracy'
            ],
            low: [
                'Optimize route organization',
                'Add missing meta information to content',
                'Improve internal linking structure'
            ]
        };
        
        return recommendations[priority]?.map(rec => `- ${rec}`).join('\n') + '\n' || 'None\n';
    }

    generateFixScripts(type) {
        const scripts = {
            orphaned: '# node scripts/fix-orphaned-pages.js',
            dead: '# node scripts/cleanup-dead-routes.js', 
            content: '# node scripts/audit-content.js'
        };
        
        return scripts[type] || '# No automated fix available';
    }

    getHealthEmoji(score) {
        if (score >= 90) return '🟢';
        if (score >= 70) return '🟡';
        return '🔴';
    }

    displaySummary() {
        const { stats, issues } = this.results;
        const totalIssues = Object.values(issues).reduce((sum, arr) => sum + arr.length, 0);
        
        console.log('\n' + chalk.cyan('━'.repeat(60)));
        console.log(chalk.cyan.bold('   📋 MAINTENANCE ANALYSIS SUMMARY'));
        console.log(chalk.cyan('━'.repeat(60)));
        
        console.log(`\n${chalk.white('Health Score:')} ${this.getHealthColor(stats.healthScore)}${stats.healthScore.toFixed(1)}%${chalk.reset()}`);
        
        console.log(`\n${chalk.white('Discovery:')}`);
        console.log(`  Routes: ${chalk.green(stats.totalRoutes)}`);
        console.log(`  Pages: ${chalk.green(stats.totalPages)}`);
        console.log(`  Content: ${chalk.green(stats.totalContent)}`);
        console.log(`  Links: ${chalk.green(stats.totalLinks)}`);
        
        console.log(`\n${chalk.white('Issues Found:')}`);
        console.log(`  Orphaned Pages: ${this.getIssueColor(issues.orphanedPages.length)}`);
        console.log(`  Dead Routes: ${this.getIssueColor(issues.deadRoutes.length)}`);
        console.log(`  Unreachable Content: ${this.getIssueColor(issues.unreachableContent.length)}`);
        console.log(`  Broken Links: ${this.getIssueColor(issues.brokenLinks.length)}`);
        console.log(`  Duplicate Routes: ${this.getIssueColor(issues.duplicateRoutes.length)}`);
        console.log(`  ${chalk.white('Total Issues:')} ${this.getTotalIssueColor(totalIssues)}`);
        
        if (totalIssues > 0) {
            console.log(`\n${chalk.yellow('⚠️  Action Required!')}`);
            console.log(`   See maintenance-report.md for detailed recommendations`);
        } else {
            console.log(`\n${chalk.green('✅ All systems healthy!')}`);
        }
        
        console.log(chalk.cyan('━'.repeat(60)) + '\n');
    }

    getHealthColor(score) {
        if (score >= 90) return chalk.green;
        if (score >= 70) return chalk.yellow;
        return chalk.red;
    }

    getIssueColor(count) {
        const color = count === 0 ? chalk.green : count <= 5 ? chalk.yellow : chalk.red;
        return color(count);
    }

    getTotalIssueColor(count) {
        if (count === 0) return chalk.green(count);
        if (count <= 10) return chalk.yellow(count);
        return chalk.red(count);
    }

    // 🛠️ Utility Methods
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    logStep(message) {
        console.log(`\n${chalk.cyan.bold(message)}`);
    }

    logInfo(message) {
        console.log(`${chalk.blue('ℹ')} ${message}`);
    }

    logSuccess(message) {
        console.log(`${chalk.green('✓')} ${message}`);
    }

    logWarning(message) {
        console.log(`${chalk.yellow('⚠')} ${message}`);
    }

    logError(message) {
        console.log(`${chalk.red('✗')} ${message}`);
    }
}

// 🚀 CLI Interface
program
    .name('maintenance-analyzer')
    .description('Comprehensive maintenance analysis for Wavelength Lore')
    .version('1.0.0');

program
    .command('analyze')
    .description('Run comprehensive maintenance analysis')
    .option('-o, --output <path>', 'Output report path', 'maintenance-report.md')
    .option('-q, --quiet', 'Suppress console output')
    .option('--json', 'Output results as JSON')
    .action(async (options) => {
        try {
            const analyzer = new MaintenanceAnalyzer();
            const results = await analyzer.analyze(options);
            
            if (options.json) {
                const jsonPath = options.output.replace(/\.md$/, '.json');
                await fs.writeFile(jsonPath, JSON.stringify(results, null, 2));
                console.log(`JSON results: ${jsonPath}`);
            }
            
            process.exit(results.stats.healthScore >= 90 ? 0 : 1);
            
        } catch (error) {
            console.error(chalk.red(`Analysis failed: ${error.message}`));
            process.exit(1);
        }
    });

program
    .command('check')
    .description('Quick health check')
    .action(async () => {
        try {
            const analyzer = new MaintenanceAnalyzer();
            const results = await analyzer.analyze({ quiet: false });
            
            const score = results.stats.healthScore;
            console.log(`\nHealth Score: ${score.toFixed(1)}%`);
            
            process.exit(score >= 70 ? 0 : 1);
            
        } catch (error) {
            console.error(chalk.red(`Health check failed: ${error.message}`));
            process.exit(1);
        }
    });

// Run if called directly
if (require.main === module) {
    program.parse();
}

module.exports = MaintenanceAnalyzer;