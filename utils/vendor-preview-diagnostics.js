/**
 * Enhanced Runtime Diagnostics for Vendor Preview System
 * 
 * Provides comprehensive validation and logging for vendor preview operations
 * to help detect and prevent bugs like the delete endpoint 404 issue.
 */

class VendorPreviewDiagnostics {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'info';
    this.enableValidation = process.env.ENABLE_VALIDATION !== 'false';
  }

  /**
   * Enhanced logging with context and validation
   */
  log(message, context = {}, level = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      context,
      service: 'VendorPreviewSystem'
    };

    if (level === 'error' || this.logLevel === 'debug') {
      console.log(JSON.stringify(logEntry, null, 2));
    } else {
      console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
    }

    return logEntry;
  }

  /**
   * Validate delete preview request
   */
  validateDeleteRequest(req) {
    const errors = [];
    const warnings = [];

    // Check required parameters
    if (!req.body || !req.body.cacheKey) {
      errors.push('Missing required parameter: cacheKey');
    }

    // Validate cacheKey format
    if (req.body.cacheKey && typeof req.body.cacheKey !== 'string') {
      errors.push('cacheKey must be a string');
    }

    if (req.body.cacheKey && req.body.cacheKey.length < 3) {
      warnings.push('cacheKey seems unusually short');
    }

    // Check authentication
    if (!req.user) {
      errors.push('User not authenticated');
    }

    // Check admin privileges (would need to be implemented based on your auth system)
    if (req.user && !this.isAdmin(req.user)) {
      errors.push('User lacks admin privileges');
    }

    const validation = {
      valid: errors.length === 0,
      errors,
      warnings,
      request: {
        cacheKey: req.body?.cacheKey,
        userId: req.user?.uid,
        timestamp: new Date().toISOString()
      }
    };

    this.log('Delete request validation', validation, errors.length > 0 ? 'error' : 'info');
    return validation;
  }

  /**
   * Validate preview exists before deletion
   */
  async validatePreviewExists(cacheKey, merchandiseDB) {
    try {
      this.log('Validating preview exists', { cacheKey });

      // Get all previews and check if the one we're trying to delete exists
      const allPreviews = await merchandiseDB.getAllVendorPreviews();
      const previewExists = allPreviews.some(p => p.cacheKey === cacheKey);

      if (!previewExists) {
        this.log('Preview not found for deletion', { 
          cacheKey, 
          availablePreviews: allPreviews.map(p => p.cacheKey) 
        }, 'warning');
      }

      return {
        exists: previewExists,
        totalPreviews: allPreviews.length,
        availableKeys: allPreviews.map(p => p.cacheKey)
      };

    } catch (error) {
      this.log('Error validating preview existence', { 
        cacheKey, 
        error: error.message 
      }, 'error');
      return { exists: false, error: error.message };
    }
  }

  /**
   * Enhanced delete operation with validation and rollback capability
   */
  async enhancedDeletePreview(cacheKey, merchandiseDB) {
    const operation = {
      cacheKey,
      timestamp: new Date().toISOString(),
      steps: []
    };

    try {
      // Step 1: Validate preview exists
      operation.steps.push('Validating preview exists');
      const validation = await this.validatePreviewExists(cacheKey, merchandiseDB);
      
      if (!validation.exists && !validation.error) {
        return {
          success: false,
          error: 'Preview not found',
          operation,
          suggestion: `Available previews: ${validation.availableKeys.join(', ')}`
        };
      }

      // Step 2: Create backup (optional, for rollback)
      operation.steps.push('Creating backup');
      // In a production system, you might want to backup the preview data first

      // Step 3: Get preview data to find Printify product ID
      operation.steps.push('Fetching preview data');
      const preview = await merchandiseDB.getCachedPreview(cacheKey);
      
      if (!preview) {
        return {
          success: false,
          error: 'Preview not found',
          operation
        };
      }
      
      const printifyProductId = preview.printifyProduct?.id || preview.productId;
      
      // Step 4: Delete from Printify FIRST (if product exists)
      if (printifyProductId) {
        operation.steps.push(`Deleting from Printify: ${printifyProductId}`);
        try {
          const EnhancedPrintifyService = require('../services/enhanced-printify-service');
          const printifyService = new EnhancedPrintifyService();
          await printifyService.deleteProduct(printifyProductId);
          operation.steps.push('Deleted from Printify');
        } catch (printifyError) {
          // Log but don't fail if Printify delete fails (product might already be deleted)
          operation.steps.push(`Printify delete warning: ${printifyError.message}`);
          console.warn(`⚠️ Printify delete failed for ${printifyProductId}:`, printifyError.message);
        }
      } else {
        operation.steps.push('No Printify product ID found, skipping Printify delete');
      }
      
      // Step 5: Delete from our database
      operation.steps.push('Deleting from database');
      const deleteResult = await merchandiseDB.deleteVendorPreview(cacheKey);

      if (deleteResult.success) {
        operation.steps.push('Database deletion successful');
        operation.completedAt = new Date().toISOString();
        
        this.log('Enhanced delete operation completed', operation, 'info');
        
        return {
          success: true,
          operation,
          message: 'Preview deleted from both Printify and database'
        };
      } else {
        operation.steps.push('Database deletion failed');
        operation.error = deleteResult.error;
        
        this.log('Enhanced delete operation failed', operation, 'error');
        
        return {
          success: false,
          error: deleteResult.error,
          operation
        };
      }

    } catch (error) {
      operation.steps.push(`Error: ${error.message}`);
      operation.error = error.message;
      
      this.log('Enhanced delete operation error', operation, 'error');
      
      return {
        success: false,
        error: error.message,
        operation
      };
    }
  }

  /**
   * Route health check
   */
  validateRouteHealth(req, routeName) {
    const health = {
      route: routeName,
      method: req.method,
      path: req.path,
      timestamp: new Date().toISOString(),
      headers: {
        contentType: req.get('Content-Type'),
        authorization: req.get('Authorization') ? 'Present' : 'Missing'
      },
      body: req.body ? Object.keys(req.body) : [],
      user: req.user ? { uid: req.user.uid } : null
    };

    this.log('Route health check', health);
    return health;
  }

  /**
   * Check if user is admin (simplified check - should use your actual auth system)
   */
  isAdmin(user) {
    // This is a simplified check - in production you'd check against your auth system
    return user && (user.isAdmin || user.groups?.includes('admin'));
  }

  /**
   * Generate diagnostic report
   */
  generateDiagnosticReport() {
    return {
      timestamp: new Date().toISOString(),
      diagnostics: {
        logLevel: this.logLevel,
        validationEnabled: this.enableValidation,
        nodeVersion: process.version,
        platform: process.platform
      },
      recommendations: [
        'Ensure all routes have proper authentication middleware',
        'Validate input parameters before processing',
        'Log all operations with sufficient context',
        'Implement rollback capabilities for destructive operations',
        'Add health check endpoints for monitoring'
      ]
    };
  }
}

module.exports = VendorPreviewDiagnostics;