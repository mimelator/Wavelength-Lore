/**
 * Enhanced Admin Route Error Handler
 * 
 * Provides comprehensive error handling, logging, and diagnostics for admin routes
 */

const path = require('path');
const fs = require('fs');

class AdminRouteErrorHandler {
    constructor() {
        this.logPrefix = '🚨 ADMIN_ROUTE_ERROR';
        this.diagnosticsEnabled = process.env.NODE_ENV !== 'production';
    }

    /**
     * Validate that a view exists before attempting to render
     */
    validateViewExists(viewName, viewsDir = null) {
        const baseViewsDir = viewsDir || path.join(__dirname, '..', 'views');
        const viewPath = path.join(baseViewsDir, `${viewName}.ejs`);
        
        const exists = fs.existsSync(viewPath);
        
        if (!exists) {
            console.error(`${this.logPrefix}: Missing view file: ${viewName}`);
            console.error(`  Expected path: ${viewPath}`);
            console.error(`  Views directory: ${baseViewsDir}`);
            
            if (this.diagnosticsEnabled) {
                this.logViewDiagnostics(baseViewsDir, viewName);
            }
        }
        
        return exists;
    }

    /**
     * Log detailed diagnostics about view availability
     */
    logViewDiagnostics(viewsDir, missingView) {
        try {
            console.error(`${this.logPrefix}: DIAGNOSTICS for missing view: ${missingView}`);
            
            // Check if views directory exists
            if (!fs.existsSync(viewsDir)) {
                console.error(`  ❌ Views directory does not exist: ${viewsDir}`);
                return;
            }
            
            // List available views
            const availableViews = this.getAvailableViews(viewsDir);
            console.error(`  📁 Available views in ${viewsDir}:`);
            availableViews.slice(0, 10).forEach(view => {
                console.error(`    • ${view}`);
            });
            
            if (availableViews.length > 10) {
                console.error(`    ... and ${availableViews.length - 10} more`);
            }
            
            // Check for similar named views
            const similarViews = availableViews.filter(view => 
                view.toLowerCase().includes(missingView.toLowerCase()) ||
                missingView.toLowerCase().includes(view.toLowerCase())
            );
            
            if (similarViews.length > 0) {
                console.error(`  🔍 Similar views found:`);
                similarViews.forEach(view => {
                    console.error(`    • ${view}`);
                });
            }
            
        } catch (diagError) {
            console.error(`${this.logPrefix}: Failed to run diagnostics:`, diagError.message);
        }
    }

    /**
     * Get list of available view files
     */
    getAvailableViews(viewsDir, prefix = '') {
        const views = [];
        
        try {
            const items = fs.readdirSync(viewsDir);
            
            for (const item of items) {
                const itemPath = path.join(viewsDir, item);
                const stat = fs.statSync(itemPath);
                
                if (stat.isDirectory()) {
                    // Recursively get views from subdirectories
                    const subViews = this.getAvailableViews(itemPath, `${prefix}${item}/`);
                    views.push(...subViews);
                } else if (item.endsWith('.ejs')) {
                    const viewName = `${prefix}${item.replace('.ejs', '')}`;
                    views.push(viewName);
                }
            }
        } catch (error) {
            console.error(`${this.logPrefix}: Error scanning views directory:`, error.message);
        }
        
        return views;
    }

    /**
     * Enhanced error response with fallback handling
     */
    handleRouteError(res, error, context = {}) {
        const {
            operation = 'unknown_operation',
            route = 'unknown_route',
            statusCode = 500,
            userMessage = 'An error occurred',
            additionalData = {}
        } = context;

        // Log comprehensive error details
        console.error(`${this.logPrefix}: Route error in ${route}:${operation}`);
        console.error(`  Error: ${error.message}`);
        console.error(`  Stack: ${error.stack}`);
        
        if (this.diagnosticsEnabled) {
            console.error(`  Context:`, {
                route,
                operation,
                statusCode,
                userMessage,
                additionalData,
                timestamp: new Date().toISOString()
            });
        }

        // Try to render error view, with fallback
        if (this.validateViewExists('error')) {
            try {
                res.status(statusCode).render('error', {
                    title: 'Error',
                    message: userMessage,
                    error: this.diagnosticsEnabled ? error : {},
                    context: {
                        route,
                        operation,
                        timestamp: new Date().toISOString()
                    }
                });
                return;
            } catch (renderError) {
                console.error(`${this.logPrefix}: Failed to render error view:`, renderError.message);
            }
        }

        // Fallback to JSON response if view rendering fails
        res.status(statusCode).json({
            success: false,
            error: userMessage,
            operation,
            route,
            timestamp: new Date().toISOString(),
            ...(this.diagnosticsEnabled && { 
                debug: {
                    originalError: error.message,
                    stack: error.stack
                }
            })
        });
    }

    /**
     * Safe render wrapper that validates views before rendering
     */
    safeRender(res, viewName, data = {}, fallbackResponse = null) {
        if (!this.validateViewExists(viewName)) {
            const error = new Error(`View not found: ${viewName}`);
            
            if (fallbackResponse) {
                console.warn(`${this.logPrefix}: Using fallback for missing view: ${viewName}`);
                return fallbackResponse(res, error);
            } else {
                return this.handleRouteError(res, error, {
                    operation: 'view_render',
                    route: 'unknown',
                    userMessage: 'Page not available',
                    additionalData: { viewName }
                });
            }
        }

        try {
            res.render(viewName, data);
        } catch (renderError) {
            console.error(`${this.logPrefix}: Render error for view ${viewName}:`, renderError.message);
            
            if (fallbackResponse) {
                return fallbackResponse(res, renderError);
            } else {
                return this.handleRouteError(res, renderError, {
                    operation: 'view_render',
                    route: 'unknown',
                    userMessage: 'Failed to load page',
                    additionalData: { viewName }
                });
            }
        }
    }

    /**
     * Create middleware for Express routes
     */
    createMiddleware() {
        const handler = this;
        
        return {
            // Attach handler to request object
            attachHandler: (req, res, next) => {
                req.adminErrorHandler = handler;
                next();
            },
            
            // Global error handler for admin routes
            globalErrorHandler: (error, req, res, next) => {
                handler.handleRouteError(res, error, {
                    route: req.route?.path || req.path,
                    operation: req.method,
                    statusCode: error.statusCode || 500,
                    userMessage: 'Admin operation failed'
                });
            }
        };
    }
}

module.exports = AdminRouteErrorHandler;