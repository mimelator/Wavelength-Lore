/**
 * Service Response Contract
 * 
 * Standardized response format for all services to prevent interface mismatches
 */

class ServiceResponse {
    constructor(success = false, method = 'unknown') {
        this.success = success;
        this.method = method;
        this.cached = false;
        this.data = null;
        this.metadata = {};
        this.errors = [];
        this.warnings = [];
        this.timestamp = new Date().toISOString();
    }
    
    /**
     * Create a successful response
     */
    static success(method, data, metadata = {}) {
        const response = new ServiceResponse(true, method);
        response.data = data;
        response.metadata = metadata;
        return response;
    }
    
    /**
     * Create a cached response
     */
    static cached(method, data, metadata = {}) {
        const response = ServiceResponse.success(method, data, metadata);
        response.cached = true;
        response.method = 'cache';
        return response;
    }
    
    /**
     * Create an error response
     */
    static error(method, errors, metadata = {}) {
        const response = new ServiceResponse(false, method);
        response.errors = Array.isArray(errors) ? errors : [errors];
        response.metadata = metadata;
        return response;
    }
    
    /**
     * Add warning to response
     */
    addWarning(warning) {
        this.warnings.push(warning);
        return this;
    }
    
    /**
     * Add error to response
     */
    addError(error) {
        this.errors.push(error);
        this.success = false;
        return this;
    }
    
    /**
     * Validate response structure
     */
    validate() {
        const errors = [];
        
        if (typeof this.success !== 'boolean') {
            errors.push('success must be boolean');
        }
        
        if (typeof this.method !== 'string') {
            errors.push('method must be string');
        }
        
        if (typeof this.cached !== 'boolean') {
            errors.push('cached must be boolean');
        }
        
        if (!Array.isArray(this.errors)) {
            errors.push('errors must be array');
        }
        
        if (!Array.isArray(this.warnings)) {
            errors.push('warnings must be array');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    
    /**
     * Convert to legacy format for backward compatibility
     */
    toLegacyFormat() {
        const legacy = {
            success: this.success,
            method: this.method,
            cached: this.cached,
            ...this.data
        };
        
        // Add metadata fields to top level for compatibility
        if (this.metadata) {
            Object.assign(legacy, this.metadata);
        }
        
        return legacy;
    }
}

/**
 * Parameter Validation Helper
 */
class ParameterValidator {
    
    /**
     * Validate function parameters
     */
    static validate(params, schema, functionName = 'function') {
        const errors = [];
        
        for (const [paramName, paramSchema] of Object.entries(schema)) {
            const value = params[paramName];
            const result = this.validateParameter(value, paramSchema, paramName);
            
            if (!result.isValid) {
                errors.push(...result.errors.map(e => `${functionName}.${paramName}: ${e}`));
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    
    /**
     * Validate single parameter
     */
    static validateParameter(value, schema, paramName) {
        const errors = [];
        
        // Check required
        if (schema.required && (value === undefined || value === null)) {
            errors.push(`is required but got ${value}`);
            return { isValid: false, errors };
        }
        
        // Skip type checking if optional and not provided
        if (!schema.required && (value === undefined || value === null)) {
            return { isValid: true, errors: [] };
        }
        
        // Check type
        if (schema.type) {
            if (!this.checkType(value, schema.type)) {
                errors.push(`expected ${schema.type} but got ${typeof value}`);
            }
        }
        
        // Check Buffer specifically
        if (schema.type === 'Buffer' && !Buffer.isBuffer(value)) {
            errors.push(`expected Buffer but got ${typeof value}`);
        }
        
        // Check object properties
        if (schema.type === 'object' && schema.properties) {
            for (const [propName, propSchema] of Object.entries(schema.properties)) {
                const propResult = this.validateParameter(value[propName], propSchema, `${paramName}.${propName}`);
                if (!propResult.isValid) {
                    errors.push(...propResult.errors);
                }
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    
    /**
     * Check type compatibility
     */
    static checkType(value, expectedType) {
        switch (expectedType) {
            case 'Buffer': return Buffer.isBuffer(value);
            case 'object': return typeof value === 'object' && value !== null && !Array.isArray(value);
            case 'array': return Array.isArray(value);
            default: return typeof value === expectedType;
        }
    }
}

module.exports = {
    ServiceResponse,
    ParameterValidator
};