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
const { glob } = require('glob');
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
        
        // Parse actual route implementations to find template usage
        await this.parseRouteImplementations();
        
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
        
        // Smart route analysis with actual template detection
        this.results.routes.forEach((route, routePath) => {
            if (route.method === 'GET' && route.type === 'endpoint') {
                const routeCategory = this.categorizeRoute(routePath, route);
                const actualTemplate = route.rendersTemplate || null;
                const hasValidTemplate = actualTemplate && this.results.pages.has(actualTemplate);
                
                // Only flag as dead if it should have a template but doesn't
                if (routeCategory.needsTemplate && !hasValidTemplate) {
                    this.results.issues.deadRoutes.push({
                        route: routePath,
                        method: route.method,
                        file: route.file,
                        category: routeCategory.type,
                        priority: routeCategory.priority,
                        actualTemplate: actualTemplate,
                        recommendation: actualTemplate 
                            ? `Template '${actualTemplate}' not found for route`
                            : routeCategory.recommendation
                    });
                }
                
                // Store route analysis data
                route.category = routeCategory.type;
                route.needsTemplate = routeCategory.needsTemplate;
                route.hasValidTemplate = hasValidTemplate;
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

    // 🎯 Smart Route Categorization
    categorizeRoute(routePath, route) {
        // File responses (should not have templates)
        if (this.isFileResponse(routePath)) {
            return {
                type: 'file-response',
                needsTemplate: false,
                priority: 'info',
                recommendation: 'File response route - no template needed'
            };
        }
        
        // API endpoints (should return JSON)
        if (this.isApiEndpoint(routePath)) {
            return {
                type: 'api-endpoint',
                needsTemplate: false,
                priority: 'info',
                recommendation: 'API endpoint - returns JSON, no template needed'
            };
        }
        
        // Debug/Test routes (safe to remove in production)
        if (this.isDebugRoute(routePath)) {
            return {
                type: 'debug-test',
                needsTemplate: false,
                priority: 'low',
                recommendation: 'Debug/test route - consider removing for production'
            };
        }
        
        // Admin/Management routes (might be API or need templates)
        if (this.isAdminRoute(routePath)) {
            return {
                type: 'admin-management',
                needsTemplate: this.adminRouteShouldHaveTemplate(routePath),
                priority: 'medium',
                recommendation: this.adminRouteShouldHaveTemplate(routePath) 
                    ? 'Admin route needs template for web interface'
                    : 'Admin API route - returns JSON, no template needed'
            };
        }
        
        // Health/Status routes (should return JSON)
        if (this.isHealthRoute(routePath)) {
            return {
                type: 'health-status',
                needsTemplate: false,
                priority: 'info',
                recommendation: 'Health/status route - returns JSON, no template needed'
            };
        }
        
        // Authentication routes (usually need templates)
        if (this.isAuthRoute(routePath)) {
            return {
                type: 'authentication',
                needsTemplate: !routePath.includes('/callback'),
                priority: 'high',
                recommendation: routePath.includes('/callback') 
                    ? 'Auth callback - redirects, no template needed'
                    : 'Authentication route needs template for user interface'
            };
        }
        
        // Content routes (definitely need templates)
        if (this.isContentRoute(routePath)) {
            return {
                type: 'content-page',
                needsTemplate: true,
                priority: 'high',
                recommendation: 'Content route needs template - user-facing page'
            };
        }
        
        // Game/Interactive routes (might be API or templates)
        if (this.isGameRoute(routePath)) {
            return {
                type: 'game-interactive',
                needsTemplate: this.gameRouteShouldHaveTemplate(routePath),
                priority: 'medium',
                recommendation: this.gameRouteShouldHaveTemplate(routePath)
                    ? 'Game route needs template for user interface'
                    : 'Game API route - returns JSON, no template needed'
            };
        }
        
        // E-commerce routes (mixed - some API, some templates)
        if (this.isEcommerceRoute(routePath)) {
            return {
                type: 'ecommerce',
                needsTemplate: this.ecommerceRouteShouldHaveTemplate(routePath),
                priority: 'medium',
                recommendation: this.ecommerceRouteShouldHaveTemplate(routePath)
                    ? 'E-commerce route needs template for customer interface'
                    : 'E-commerce API route - returns JSON, no template needed'
            };
        }
        
        // Default: User-facing routes (probably need templates)
        return {
            type: 'user-facing',
            needsTemplate: true,
            priority: 'high',
            recommendation: 'User-facing route needs template'
        };
    }

    // Route type detection methods
    isFileResponse(routePath) {
        return routePath.match(/\.(xml|txt|json|css|js|ico|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/i) ||
               routePath.includes('sitemap') ||
               routePath.includes('robots');
    }

    isApiEndpoint(routePath) {
        return routePath.includes('/api/') ||
               routePath.endsWith('.json') ||
               routePath.match(/(stats|metrics|data|export|import)$/i) ||
               routePath.includes('/catalog/list') ||
               routePath.includes('/current-user-groups') ||
               routePath.includes('/admob-config');
    }

    isDebugRoute(routePath) {
        return routePath.includes('/debug') ||
               routePath.includes('/test') ||
               routePath.includes('test-') ||
               routePath.includes('/sanitize') ||
               routePath.includes('enhancement-');
    }

    isAdminRoute(routePath) {
        return routePath.includes('/admin') ||
               routePath.includes('/vendor') ||
               routePath.includes('/permissions') ||
               routePath.includes('/hierarchy') ||
               routePath.includes('/compatibility');
    }

    adminRouteShouldHaveTemplate(routePath) {
        // Admin routes that typically need web interfaces
        return routePath.match(/\/(admin|vendor-catalog|compatibility-tests)$/i) ||
               routePath.includes('/admin/') && !routePath.includes('/api/');
    }

    isHealthRoute(routePath) {
        return routePath.match(/\/(health|status|firebase)$/i);
    }

    isAuthRoute(routePath) {
        return routePath.match(/\/(login|logout|auth|access)/) ||
               routePath.includes('/callback');
    }

    isContentRoute(routePath) {
        return routePath.match(/\/(character|episode|lore|season)/) ||
               routePath.includes('/characters') ||
               routePath.includes('/edit/');
    }

    isGameRoute(routePath) {
        return routePath.includes('wavelength-gems') ||
               routePath.includes('leaderboard') ||
               routePath.includes('user-stats') ||
               routePath.includes('level-progress') ||
               routePath.match(/^\/:[^\/]+$/); // /:gameId patterns
    }

    gameRouteShouldHaveTemplate(routePath) {
        // Game routes that need user interfaces
        return routePath.includes('/leaderboard') ||
               routePath.match(/^\/:[^\/]+$/); // Main game pages
    }

    isEcommerceRoute(routePath) {
        return routePath.includes('/product') ||
               routePath.includes('/order') ||
               routePath.includes('/catalog') ||
               routePath.includes('/border') ||
               routePath.includes('/preview');
    }

    ecommerceRouteShouldHaveTemplate(routePath) {
        // E-commerce routes that need customer-facing pages
        return !routePath.includes('/api/') && 
               !routePath.includes('/stats') &&
               !routePath.includes('/list') &&
               (routePath.includes('/catalog') ||
                routePath.includes('/product/') ||
                routePath.includes('/order/'));
    }

    isApiRoute(routePath) {
        // Legacy method - now uses categorizeRoute
        const category = this.categorizeRoute(routePath, {});
        return !category.needsTemplate;
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
        
        // Categorize routes for better reporting
        const routeCategories = this.categorizeAllRoutes();
        
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

## 🎯 Route Analysis

### Route Categories
| Category | Count | Need Templates | Status |
|----------|-------|----------------|---------|
| **Content Pages** | ${routeCategories.content.length} | ${routeCategories.content.filter(r => r.needsTemplate).length} | ${routeCategories.content.filter(r => r.needsTemplate).length > 0 ? '⚠️ Action Needed' : '✅ Good'} |
| **API Endpoints** | ${routeCategories.api.length} | 0 | ✅ No Templates Needed |
| **Authentication** | ${routeCategories.auth.length} | ${routeCategories.auth.filter(r => r.needsTemplate).length} | ${routeCategories.auth.filter(r => r.needsTemplate).length > 0 ? '⚠️ Action Needed' : '✅ Good'} |
| **Admin/Management** | ${routeCategories.admin.length} | ${routeCategories.admin.filter(r => r.needsTemplate).length} | ${routeCategories.admin.filter(r => r.needsTemplate).length > 0 ? '💡 Consider' : '✅ Good'} |
| **E-commerce** | ${routeCategories.ecommerce.length} | ${routeCategories.ecommerce.filter(r => r.needsTemplate).length} | ${routeCategories.ecommerce.filter(r => r.needsTemplate).length > 0 ? '💡 Consider' : '✅ Good'} |
| **Games/Interactive** | ${routeCategories.games.length} | ${routeCategories.games.filter(r => r.needsTemplate).length} | ${routeCategories.games.filter(r => r.needsTemplate).length > 0 ? '💡 Consider' : '✅ Good'} |
| **Debug/Test** | ${routeCategories.debug.length} | 0 | 🧹 Safe to Clean |
| **File Responses** | ${routeCategories.files.length} | 0 | ✅ No Templates Needed |
| **Health/Status** | ${routeCategories.health.length} | 0 | ✅ No Templates Needed |

## 🚨 Issues Found

### Orphaned Pages (${issues.orphanedPages.length})
${this.formatIssueList(issues.orphanedPages, 'page')}

### Routes Needing Templates
${this.formatRoutesByPriority(issues.deadRoutes)}

### Unreachable Content (${issues.unreachableContent.length})
${this.formatIssueList(issues.unreachableContent, 'content')}

### Broken Links (${issues.brokenLinks.length})
${this.formatIssueList(issues.brokenLinks, 'link')}

### Duplicate Routes (${issues.duplicateRoutes.length})
${this.formatIssueList(issues.duplicateRoutes, 'route')}

## 🔧 Smart Recommendations

### 🎯 High Priority (User-Facing Content)
${this.generateSmartRecommendations('high')}

### 💡 Medium Priority (Admin/Business Features)
${this.generateSmartRecommendations('medium')}

### 🧹 Low Priority (Cleanup)
${this.generateSmartRecommendations('low')}

### ℹ️ No Action Needed
${this.generateSmartRecommendations('info')}

## 📈 Next Steps

1. **Create Content Templates**: Focus on character, lore, and episode pages
2. **Review Admin Interfaces**: Decide which admin routes need web UIs
3. **Clean Debug Routes**: Remove test/debug routes for production
4. **Validate APIs**: Ensure API routes return proper JSON responses
5. **Regular Maintenance**: Run this analyzer weekly

## 🛠️ Commands to Run

\`\`\`bash
# Create templates for high-priority routes
node scripts/unified/maintenance-analyzer.js generate-templates --priority=high

# Clean up debug routes safely  
node scripts/unified/maintenance-analyzer.js cleanup --category=debug --dry-run

# Full analysis with smart categorization
node scripts/unified/maintenance-analyzer.js analyze --smart
\`\`\`

---
*Generated by Enhanced Wavelength Lore Maintenance Analyzer v2.0*`;
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
        
        const healthColor = this.getHealthColor(stats.healthScore);
        console.log(`\n${chalk.white('Health Score:')} ${healthColor(stats.healthScore.toFixed(1) + '%')}`);
        
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

    // 📊 Enhanced Reporting Methods
    categorizeAllRoutes() {
        const categories = {
            content: [],
            api: [],
            auth: [],
            admin: [],
            ecommerce: [],
            games: [],
            debug: [],
            files: [],
            health: []
        };

        this.results.routes.forEach((route, routePath) => {
            const category = this.categorizeRoute(routePath, route);
            
            switch (category.type) {
                case 'content-page':
                    categories.content.push({ ...route, path: routePath, needsTemplate: category.needsTemplate });
                    break;
                case 'api-endpoint':
                    categories.api.push({ ...route, path: routePath, needsTemplate: category.needsTemplate });
                    break;
                case 'authentication':
                    categories.auth.push({ ...route, path: routePath, needsTemplate: category.needsTemplate });
                    break;
                case 'admin-management':
                    categories.admin.push({ ...route, path: routePath, needsTemplate: category.needsTemplate });
                    break;
                case 'ecommerce':
                    categories.ecommerce.push({ ...route, path: routePath, needsTemplate: category.needsTemplate });
                    break;
                case 'game-interactive':
                    categories.games.push({ ...route, path: routePath, needsTemplate: category.needsTemplate });
                    break;
                case 'debug-test':
                    categories.debug.push({ ...route, path: routePath, needsTemplate: category.needsTemplate });
                    break;
                case 'file-response':
                    categories.files.push({ ...route, path: routePath, needsTemplate: category.needsTemplate });
                    break;
                case 'health-status':
                    categories.health.push({ ...route, path: routePath, needsTemplate: category.needsTemplate });
                    break;
            }
        });

        return categories;
    }

    formatRoutesByPriority(deadRoutes) {
        const byPriority = {
            high: deadRoutes.filter(r => r.priority === 'high'),
            medium: deadRoutes.filter(r => r.priority === 'medium'),
            low: deadRoutes.filter(r => r.priority === 'low'),
            info: deadRoutes.filter(r => r.priority === 'info')
        };

        let output = '';
        
        if (byPriority.high.length > 0) {
            output += `\n#### 🎯 High Priority - Needs Templates (${byPriority.high.length})\n`;
            output += byPriority.high.map(r => `- **${r.route}** (${r.category}) - ${r.recommendation}`).join('\n') + '\n';
        }

        if (byPriority.medium.length > 0) {
            output += `\n#### 💡 Medium Priority - Consider Templates (${byPriority.medium.length})\n`;
            output += byPriority.medium.map(r => `- **${r.route}** (${r.category}) - ${r.recommendation}`).join('\n') + '\n';
        }

        if (byPriority.low.length > 0) {
            output += `\n#### 🧹 Low Priority - Safe to Clean (${byPriority.low.length})\n`;
            output += byPriority.low.map(r => `- **${r.route}** (${r.category}) - ${r.recommendation}`).join('\n') + '\n';
        }

        if (byPriority.info.length > 0) {
            output += `\n#### ℹ️ Info - No Action Needed (${byPriority.info.length})\n`;
            output += `These routes are working as intended (APIs, file responses, etc.)\n`;
        }

        return output || 'None found ✅\n';
    }

    generateSmartRecommendations(priority) {
        const deadRoutes = this.results.issues.deadRoutes || [];
        const routesForPriority = deadRoutes.filter(r => r.priority === priority);

        if (routesForPriority.length === 0) {
            return 'None\n';
        }

        const recommendations = new Set();
        
        routesForPriority.forEach(route => {
            switch (route.category) {
                case 'content-page':
                    recommendations.add('Create character, episode, and lore page templates');
                    break;
                case 'authentication':
                    recommendations.add('Create login/logout page templates');
                    break;
                case 'admin-management':
                    recommendations.add('Build admin web interfaces or convert to API-only');
                    break;
                case 'ecommerce':
                    recommendations.add('Create product catalog and checkout page templates');
                    break;
                case 'game-interactive':
                    recommendations.add('Build game leaderboard and stats page templates');
                    break;
                case 'debug-test':
                    recommendations.add('Remove debug/test routes from production');
                    break;
                default:
                    recommendations.add(`Review ${route.category} routes for necessity`);
            }
        });

        return Array.from(recommendations).map(rec => `- ${rec}`).join('\n') + '\n';
    }

    // � Parse Route Implementations 
    async parseRouteImplementations() {
        this.logInfo('Parsing route implementations for template usage...');
        
        const routeFiles = await glob('*.js', { cwd: this.routesDir });
        
        for (const file of routeFiles) {
            const filePath = path.join(this.routesDir, file);
            const content = await fs.readFile(filePath, 'utf8');
            
            // Extract res.render() calls with their corresponding routes
            await this.extractTemplateUsage(content, file);
        }
        
        this.logSuccess(`Parsed ${routeFiles.length} route files for template usage`);
    }

    async extractTemplateUsage(content, fileName) {
        // Match route definitions with their handlers
        const routeBlocks = this.extractRouteBlocks(content);
        
        routeBlocks.forEach(block => {
            // Find res.render() calls in each route block
            const renderMatches = block.handler.match(/res\.render\s*\(\s*['"`]([^'"`]+)['"`]/g);
            
            if (renderMatches) {
                renderMatches.forEach(match => {
                    const templateMatch = match.match(/res\.render\s*\(\s*['"`]([^'"`]+)['"`]/);
                    if (templateMatch) {
                        const templateName = templateMatch[1];
                        
                        // Find the corresponding route in our results
                        const routeKey = this.normalizeRoutePath(block.path);
                        if (this.results.routes.has(routeKey)) {
                            const route = this.results.routes.get(routeKey);
                            route.rendersTemplate = templateName;
                        }
                    }
                });
            }
            
            // Also check for res.json(), res.send(), etc. to confirm API routes
            if (block.handler.match(/res\.(json|send|sendFile|redirect)\s*\(/)) {
                const routeKey = this.normalizeRoutePath(block.path);
                if (this.results.routes.has(routeKey)) {
                    const route = this.results.routes.get(routeKey);
                    route.isApiResponse = true;
                }
            }
        });
    }

    extractRouteBlocks(content) {
        const blocks = [];
        
        // Match router.method('/path', handler) patterns
        const routeRegex = /router\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*(?:async\s+)?\([^)]*\)\s*=>\s*\{([\s\S]*?)\n\}\s*\)/g;
        let match;
        
        while ((match = routeRegex.exec(content)) !== null) {
            blocks.push({
                method: match[1].toUpperCase(),
                path: match[2],
                handler: match[3]
            });
        }
        
        // Also match function-style handlers
        const functionRouteRegex = /router\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*(?:async\s+)?function[^{]*\{([\s\S]*?)\n\}\s*\)/g;
        while ((match = functionRouteRegex.exec(content)) !== null) {
            blocks.push({
                method: match[1].toUpperCase(),
                path: match[2],
                handler: match[3]
            });
        }
        
        return blocks;
    }

    normalizeRoutePath(path) {
        // Normalize route paths to match how they're stored in results
        return path.startsWith('/') ? path : `/${path}`;
    }

    // �🛠️ Utility Methods
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