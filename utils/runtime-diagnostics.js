/**
 * Enhanced Runtime Diagnostics
 * Comprehensive logging and validation to catch bugs early
 */

const InputValidator = require('./input-validator');

class RuntimeDiagnostics {
  constructor(serviceName = 'unknown') {
    this.serviceName = serviceName;
    this.diagnosticId = `diag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Enhanced parameter validation with detailed diagnostics
   */
  validateMethodParameters(methodName, params, expectedSchema) {
    const context = `${this.serviceName}.${methodName}`;
    console.log(`🔍 DIAGNOSTIC [${this.diagnosticId}]: Parameter validation for ${context}`);
    
    const diagnostics = {
      method: methodName,
      service: this.serviceName,
      diagnosticId: this.diagnosticId,
      timestamp: new Date().toISOString(),
      parameters: {},
      validation: {
        passed: 0,
        failed: 0,
        warnings: 0,
        errors: []
      }
    };

    // Analyze each parameter
    for (const [paramName, expectedType] of Object.entries(expectedSchema)) {
      const paramValue = params[paramName];
      const actualType = this.getDetailedType(paramValue);
      
      diagnostics.parameters[paramName] = {
        expected: expectedType,
        actual: actualType,
        value: this.getSafeValueRepresentation(paramValue),
        valid: this.validateType(paramValue, expectedType)
      };

      if (diagnostics.parameters[paramName].valid) {
        diagnostics.validation.passed++;
        console.log(`   ✅ ${paramName}: ${actualType} (expected ${expectedType})`);
      } else {
        diagnostics.validation.failed++;
        diagnostics.validation.errors.push(`${paramName}: expected ${expectedType}, got ${actualType}`);
        console.log(`   ❌ ${paramName}: ${actualType} (expected ${expectedType})`);
      }

      // Special diagnostics for common bug patterns
      if (paramName === 'fileName' && (!paramValue || !paramValue.includes('.'))) {
        diagnostics.validation.warnings++;
        console.log(`   ⚠️  WARNING: ${paramName} lacks file extension - may cause format detection issues`);
      }

      if (expectedType === 'array' && paramValue !== null && paramValue !== undefined && !Array.isArray(paramValue)) {
        diagnostics.validation.warnings++;
        console.log(`   ⚠️  WARNING: ${paramName} is not an array - .slice() will fail`);
      }
    }

    // Log final diagnostic summary
    console.log(`📊 DIAGNOSTIC SUMMARY [${this.diagnosticId}]:`);
    console.log(`   Passed: ${diagnostics.validation.passed}`);
    console.log(`   Failed: ${diagnostics.validation.failed}`);
    console.log(`   Warnings: ${diagnostics.validation.warnings}`);
    
    if (diagnostics.validation.errors.length > 0) {
      console.log(`   Errors: ${diagnostics.validation.errors.join(', ')}`);
    }

    return diagnostics;
  }

  /**
   * Detailed type analysis for better debugging
   */
  getDetailedType(value) {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (Array.isArray(value)) return `array[${value.length}]`;
    if (Buffer.isBuffer(value)) return `Buffer[${value.length}]`;
    if (typeof value === 'object') return `object{${Object.keys(value).length}}`;
    if (typeof value === 'string') return `string[${value.length}]`;
    return typeof value;
  }

  /**
   * Safe value representation for logging (prevent buffer dumps)
   */
  getSafeValueRepresentation(value) {
    if (value === null || value === undefined) return value;
    if (Buffer.isBuffer(value)) return `<Buffer ${value.length} bytes>`;
    if (Array.isArray(value)) return `<Array ${value.length} items>`;
    if (typeof value === 'object') return `<Object ${Object.keys(value).length} keys>`;
    if (typeof value === 'string' && value.length > 100) return `<String ${value.length} chars>`;
    return value;
  }

  /**
   * Type validation with detailed checks
   */
  validateType(value, expectedType) {
    switch (expectedType) {
      case 'buffer':
        return Buffer.isBuffer(value);
      case 'string':
        return typeof value === 'string' && value.length > 0;
      case 'string?':
        return value === null || value === undefined || (typeof value === 'string');
      case 'array':
        return Array.isArray(value);
      case 'object':
        return value !== null && typeof value === 'object' && !Array.isArray(value);
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      default:
        return typeof value === expectedType;
    }
  }

  /**
   * Cache response validation with enhanced diagnostics
   */
  validateCacheResponse(response, context = 'cache-response') {
    console.log(`🔍 CACHE DIAGNOSTIC [${this.diagnosticId}]: Validating ${context}`);
    
    const diagnostics = {
      context,
      timestamp: new Date().toISOString(),
      response: this.getSafeValueRepresentation(response),
      validation: {
        hasBuffer: false,
        hasUrl: false,
        needsDownload: false,
        signatureValid: false,
        warnings: [],
        errors: []
      }
    };

    if (!response) {
      diagnostics.validation.errors.push('Response is null/undefined');
      console.log(`   ❌ Response is null/undefined`);
      return diagnostics;
    }

    // Check buffer availability
    diagnostics.validation.hasBuffer = !!(response.upscaledBuffer || response.imageBuffer) && 
                                     Buffer.isBuffer(response.upscaledBuffer || response.imageBuffer);
    
    // Check URL availability  
    diagnostics.validation.hasUrl = !!(response.upscaledUrl || response.enhancedUrl);
    
    // Determine if download is needed
    diagnostics.validation.needsDownload = !diagnostics.validation.hasBuffer && diagnostics.validation.hasUrl;
    
    // Signature validation
    diagnostics.validation.signatureValid = response.success === true && 
                                          (diagnostics.validation.hasBuffer || diagnostics.validation.hasUrl);

    console.log(`   📊 Buffer Available: ${diagnostics.validation.hasBuffer}`);
    console.log(`   📊 URL Available: ${diagnostics.validation.hasUrl}`);
    console.log(`   📊 Needs Download: ${diagnostics.validation.needsDownload}`);
    console.log(`   📊 Signature Valid: ${diagnostics.validation.signatureValid}`);

    // Add warnings for potential issues
    if (diagnostics.validation.needsDownload) {
      diagnostics.validation.warnings.push('Cache hit requires buffer download');
      console.log(`   ⚠️  WARNING: Cache hit requires buffer download from ${response.upscaledUrl || response.enhancedUrl}`);
    }

    if (!diagnostics.validation.signatureValid) {
      diagnostics.validation.errors.push('Invalid response signature');
      console.log(`   ❌ Invalid response signature`);
    }

    return diagnostics;
  }

  /**
   * Enhanced error boundary with diagnostics
   */
  static wrapMethodWithDiagnostics(instance, methodName, parameterSchema) {
    const originalMethod = instance[methodName];
    const diagnostics = new RuntimeDiagnostics(instance.constructor.name);
    
    instance[methodName] = async function(...args) {
      try {
        // Pre-execution diagnostics
        const paramMap = {};
        const paramNames = this.getParameterNames ? this.getParameterNames(methodName) : ['param1', 'param2', 'param3'];
        args.forEach((arg, index) => {
          paramMap[paramNames[index] || `param${index + 1}`] = arg;
        });

        const preExecutionDiagnostics = diagnostics.validateMethodParameters(methodName, paramMap, parameterSchema);
        
        // Execute original method
        const result = await originalMethod.apply(this, args);
        
        // Post-execution diagnostics
        if (result && typeof result === 'object') {
          diagnostics.validateCacheResponse(result, `${methodName}-result`);
        }
        
        console.log(`✅ DIAGNOSTIC [${diagnostics.diagnosticId}]: ${methodName} completed successfully`);
        return result;
        
      } catch (error) {
        console.log(`🚨 DIAGNOSTIC [${diagnostics.diagnosticId}]: ${methodName} failed with error: ${error.message}`);
        console.log(`📊 Error context:`, {
          method: methodName,
          service: instance.constructor.name,
          args: args.map(arg => diagnostics.getSafeValueRepresentation(arg))
        });
        throw error;
      }
    };
  }
}

module.exports = RuntimeDiagnostics;