#!/usr/bin/env node
/**
 * Admin Routes Validation Test
 * 
 * Tests to detect missing views and validate admin route integrity
 */

const fs = require('fs');
const path = require('path');

class AdminRoutesValidator {
    constructor() {
        this.viewsDir = path.join(__dirname, '..', 'views');
        this.routesDir = path.join(__dirname, '..', 'routes');
        this.errors = [];
        this.warnings = [];
    }

    logError(message) {
        this.errors.push(message);
        console.error('❌', message);
    }

    logWarning(message) {
        this.warnings.push(message);
        console.warn('⚠️', message);
    }

    logSuccess(message) {
        console.log('✅', message);
    }

    async validateViewExists(viewPath, routeFile, lineContext) {
        const fullViewPath = path.join(this.viewsDir, viewPath);
        const ejsPath = fullViewPath.endsWith('.ejs') ? fullViewPath : `${fullViewPath}.ejs`;
        
        if (!fs.existsSync(ejsPath)) {
            this.logError(`Missing view file: ${viewPath} (referenced in ${routeFile}) - Expected: ${ejsPath}`);
            return false;
        } else {
            this.logSuccess(`View exists: ${viewPath}`);
            return true;
        }
    }

    async scanRouteFileForViews(routeFile) {
        const filePath = path.join(this.routesDir, routeFile);
        
        if (!fs.existsSync(filePath)) {
            this.logWarning(`Route file not found: ${routeFile}`);
            return;
        }

        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        
        // Patterns to match render calls
        const renderPatterns = [
            /res\.render\(['"`]([^'"`]+)['"`]/g,
            /\.render\(['"`]([^'"`]+)['"`]/g,
            /render\(\s*['"`]([^'"`]+)['"`]/g,
            /adminErrorHandler\.safeRender\(\s*\w+\s*,\s*['"`]([^'"`]+)['"`]/g,
            /\.safeRender\(\s*\w+\s*,\s*['"`]([^'"`]+)['"`]/g
        ];

        console.log(`\n🔍 Scanning ${routeFile} for view references...`);
        
        let foundViews = 0;
        lines.forEach((line, index) => {
            renderPatterns.forEach(pattern => {
                let match;
                while ((match = pattern.exec(line)) !== null) {
                    const viewPath = match[1];
                    foundViews++;
                    console.log(`  Line ${index + 1}: ${viewPath}`);
                    this.validateViewExists(viewPath, routeFile, `Line ${index + 1}: ${line.trim()}`);
                }
            });
        });

        if (foundViews === 0) {
            this.logWarning(`No view render calls found in ${routeFile}`);
        }
    }

    async validateErrorViewExists() {
        console.log('\n🎯 CRITICAL: Validating error view exists...');
        const errorViewExists = await this.validateViewExists('error', 'SYSTEM_REQUIREMENT', 'Error handling');
        
        if (!errorViewExists) {
            this.logError('CRITICAL: Missing error.ejs view - This will cause crashes when errors occur!');
        }
        
        return errorViewExists;
    }

    async validateAdminViews() {
        console.log('\n📂 Validating admin-specific views...');
        
        const adminViews = [
            'admin/global-cache-manager',
            'admin/vendor-preview-catalog', 
            'admin/vendor-research',
            'admin/vendor-preview-generator',
            'admin/vendor-comparison-view'
        ];

        let allExist = true;
        for (const view of adminViews) {
            const exists = await this.validateViewExists(view, 'admin-vendor-research.js', 'Admin route');
            if (!exists) {
                allExist = false;
            }
        }

        return allExist;
    }

    async validateRouteFiles() {
        console.log('\n🛣️ Scanning route files for view references...');
        
        const routeFiles = [
            'admin-vendor-research.js',
            'admin-vendor-catalog.js', 
            'admin.js'
        ];

        for (const file of routeFiles) {
            await this.scanRouteFileForViews(file);
        }
    }

    async runValidation() {
        console.log('🧪 ADMIN ROUTES VALIDATION TEST');
        console.log('============================================================');
        console.log('Purpose: Detect missing view files that cause admin route crashes');
        console.log('Target Issue: res.render() calls to non-existent views\n');

        // Test critical system views first
        await this.validateErrorViewExists();
        
        // Test admin-specific views
        await this.validateAdminViews();
        
        // Scan all route files
        await this.validateRouteFiles();

        // Report results
        console.log('\n📊 VALIDATION RESULTS');
        console.log('============================================================');
        console.log(`✅ Successful validations: ${this.errors.length === 0 ? 'All passed' : 'Some failed'}`);
        console.log(`❌ Errors found: ${this.errors.length}`);
        console.log(`⚠️ Warnings: ${this.warnings.length}`);

        if (this.errors.length > 0) {
            console.log('\n🚨 CRITICAL ERRORS FOUND:');
            this.errors.forEach(error => console.log(`  • ${error}`));
        }

        if (this.warnings.length > 0) {
            console.log('\n⚠️ WARNINGS:');
            this.warnings.forEach(warning => console.log(`  • ${warning}`));
        }

        return this.errors.length === 0;
    }
}

// Run the validation
if (require.main === module) {
    const validator = new AdminRoutesValidator();
    validator.runValidation().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('❌ Validation failed:', error);
        process.exit(1);
    });
}

module.exports = AdminRoutesValidator;