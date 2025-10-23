/**
 * Centralized Validation Helper Functions
 * 
 * Purpose: Provide reusable validation logic to eliminate code duplication
 * and ensure consistent validation patterns across the application.
 * 
 * Security Compliance: Addresses checklist requirements for:
 * - Sufficient validation
 * - Code reuse (avoiding reinventing the wheel)
 * - Robust error handling
 */

const crypto = require('crypto');

class ValidationHelpers {
    
    /**
     * Validate environment variables for secrets exposure
     */
    static validateEnvironment() {
        const sensitiveVars = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'PRINTIFY_API_TOKEN', 'OPENAI_API_KEY'];
        const exposedSecrets = sensitiveVars.filter(varName => process.env[varName]);
        
        if (exposedSecrets.length > 0) {
            console.log(`⚠️ Environment variables detected (${process.env.NODE_ENV === 'development' ? 'acceptable for localhost' : 'WARNING for production'}): [`, exposedSecrets.map(s => `'${s}'`).join(', '), ']');
        }
        
        return {
            hasSecrets: exposedSecrets.length > 0,
            exposedSecrets,
            isSecure: process.env.NODE_ENV === 'development' || exposedSecrets.length === 0
        };
    }
    
    /**
     * Validate required service endpoints
     */
    static validateRequiredServices(services = []) {
        const validationResults = {};
        
        for (const service of services) {
            switch (service) {
                case 'firebase':
                    validationResults.firebase = {
                        available: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY || !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
                        required: true
                    };
                    break;
                case 'aws':
                    validationResults.aws = {
                        available: !!process.env.AWS_ACCESS_KEY_ID && !!process.env.AWS_SECRET_ACCESS_KEY,
                        required: true
                    };
                    break;
                case 'openai':
                    validationResults.openai = {
                        available: !!process.env.OPENAI_API_KEY,
                        required: false
                    };
                    break;
                case 'printify':
                    validationResults.printify = {
                        available: !!process.env.PRINTIFY_API_TOKEN,
                        required: false
                    };
                    break;
            }
        }
        
        const missingRequired = Object.entries(validationResults)
            .filter(([service, config]) => config.required && !config.available)
            .map(([service]) => service);
            
        return {
            services: validationResults,
            missingRequired,
            isValid: missingRequired.length === 0
        };
    }
    
    /**
     * Validate API response structure
     */
    static validateAPIResponse(response, requiredFields = [], context = 'API Response') {
        const errors = [];
        const warnings = [];
        
        if (!response) {
            errors.push(`${context}: Response is null or undefined`);
            return { isValid: false, errors, warnings };
        }
        
        if (typeof response !== 'object') {
            errors.push(`${context}: Response is not an object`);
            return { isValid: false, errors, warnings };
        }
        
        // Check required fields
        for (const field of requiredFields) {
            if (response[field] === undefined || response[field] === null) {
                errors.push(`${context}: Missing required field '${field}'`);
            }
        }
        
        // Check for success field if present
        if ('success' in response && response.success !== true) {
            warnings.push(`${context}: Success field is not true (${response.success})`);
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
    
    /**
     * Validate image enhancement result
     */
    static validateEnhancementResult(result, context = 'Enhancement Result') {
        const requiredFields = ['success', 'method'];
        const optionalFields = ['upscaledBuffer', 'enhancedUrl', 's3Key', 'metadata'];
        
        const validation = this.validateAPIResponse(result, requiredFields, context);
        
        if (!validation.isValid) {
            return validation;
        }
        
        // Additional enhancement-specific validation
        if (result.success) {
            if (!result.upscaledBuffer && !result.enhancedUrl) {
                validation.errors.push(`${context}: Success=true but no upscaledBuffer or enhancedUrl provided`);
            }
            
            if (result.upscaledBuffer && !Buffer.isBuffer(result.upscaledBuffer)) {
                validation.errors.push(`${context}: upscaledBuffer is not a valid Buffer`);
            }
            
            if (result.enhancedUrl && typeof result.enhancedUrl !== 'string') {
                validation.errors.push(`${context}: enhancedUrl is not a string`);
            }
        }
        
        return {
            isValid: validation.errors.length === 0,
            errors: validation.errors,
            warnings: validation.warnings
        };
    }
    
    /**
     * Validate cache data integrity
     */
    static validateCacheData(cacheData, context = 'Cache Data') {
        const requiredFields = ['contentHash'];
        const validation = this.validateAPIResponse(cacheData, requiredFields, context);
        
        if (!validation.isValid) {
            return validation;
        }
        
        // Validate timestamp fields
        ['createdAt', 'lastUsedAt'].forEach(field => {
            if (cacheData[field]) {
                const timestamp = new Date(cacheData[field]);
                if (isNaN(timestamp.getTime())) {
                    validation.errors.push(`${context}: Invalid timestamp in field '${field}'`);
                }
            }
        });
        
        // Check for URL/S3Key consistency
        const hasUrl = !!cacheData.enhancedUrl || !!cacheData.enhancedImageUrl;
        const hasS3Key = !!cacheData.s3Key;
        
        if (hasUrl && !hasS3Key) {
            validation.warnings.push(`${context}: Has enhanced URL but missing S3 key`);
        }
        if (hasS3Key && !hasUrl) {
            validation.warnings.push(`${context}: Has S3 key but missing enhanced URL`);
        }
        
        return {
            isValid: validation.errors.length === 0,
            errors: validation.errors,
            warnings: validation.warnings,
            hasValidStorageLocation: hasUrl && hasS3Key
        };
    }
    
    /**
     * Validate repeat-run safety
     */
    static validateRepeatRunSafety(operationResults, context = 'Repeat Run Safety') {
        const errors = [];
        const warnings = [];
        
        // Check if operations are idempotent
        const duplicateOperations = operationResults.filter(op => 
            op.operation === 'gallery_image_added' && op.success
        );
        
        if (duplicateOperations.length > 1) {
            warnings.push(`${context}: Multiple gallery image additions detected - check deduplication`);
        }
        
        // Check for stateful operations that might fail on repeat
        const statefulOps = operationResults.filter(op => 
            ['database_write', 'file_creation'].includes(op.operation)
        );
        
        for (const op of statefulOps) {
            if (!op.success) {
                errors.push(`${context}: Stateful operation '${op.operation}' failed - repeat run may have issues`);
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            isRepeatSafe: errors.length === 0 && warnings.length === 0
        };
    }
    
    /**
     * Generate validation report
     */
    static generateValidationReport(validations, context = 'Validation Report') {
        const allErrors = [];
        const allWarnings = [];
        let totalChecks = 0;
        let passedChecks = 0;
        
        for (const [checkName, result] of Object.entries(validations)) {
            totalChecks++;
            if (result.isValid) {
                passedChecks++;
            }
            
            if (result.errors) {
                allErrors.push(...result.errors.map(e => `${checkName}: ${e}`));
            }
            if (result.warnings) {
                allWarnings.push(...result.warnings.map(w => `${checkName}: ${w}`));
            }
        }
        
        const overallValid = allErrors.length === 0;
        const successRate = totalChecks > 0 ? (passedChecks / totalChecks * 100).toFixed(1) : 0;
        
        return {
            context,
            timestamp: new Date().toISOString(),
            isValid: overallValid,
            successRate: `${successRate}%`,
            totalChecks,
            passedChecks,
            failedChecks: totalChecks - passedChecks,
            errors: allErrors,
            warnings: allWarnings,
            summary: {
                status: overallValid ? 'PASSED' : 'FAILED',
                errorCount: allErrors.length,
                warningCount: allWarnings.length
            }
        };
    }
    
    /**
     * Hash content for consistency checking
     */
    static generateContentHash(content) {
        if (Buffer.isBuffer(content)) {
            return crypto.createHash('sha256').update(content).digest('hex');
        } else if (typeof content === 'string') {
            return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
        } else {
            return crypto.createHash('sha256').update(JSON.stringify(content), 'utf8').digest('hex');
        }
    }
    
    /**
     * Validate URL accessibility
     */
    static async validateURLAccessibility(url, context = 'URL Check') {
        try {
            const response = await fetch(url, { 
                method: 'HEAD',
                timeout: 10000,
                headers: {
                    'User-Agent': 'ValidationHelpers-URLCheck'
                }
            });
            
            return {
                isValid: response.ok,
                status: response.status,
                contentType: response.headers.get('content-type'),
                contentLength: response.headers.get('content-length'),
                errors: response.ok ? [] : [`${context}: HTTP ${response.status} - ${response.statusText}`],
                warnings: []
            };
        } catch (error) {
            return {
                isValid: false,
                status: null,
                errors: [`${context}: ${error.message}`],
                warnings: []
            };
        }
    }
}

module.exports = ValidationHelpers;