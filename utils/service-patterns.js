/**
 * Service Response Standardization
 * Ensures all service methods return consistent formats
 */

const TypeContracts = require('./type-contracts');
const DefensiveWrappers = require('./defensive-wrappers');

class ServiceResponse {
  constructor(success = false, data = null, error = null, metadata = {}) {
    this.success = success;
    this.data = data;
    this.error = error;
    this.metadata = metadata;
    this.timestamp = Date.now();
  }

  /**
   * Create successful response with validation
   */
  static success(data, metadata = {}) {
    return new ServiceResponse(true, data, null, metadata);
  }

  /**
   * Create error response with validation
   */
  static error(error, metadata = {}) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new ServiceResponse(false, null, errorMessage, metadata);
  }

  /**
   * Validate response meets contract requirements
   */
  validate(contractType = null) {
    if (contractType && TypeContracts[contractType]) {
      return TypeContracts[`validate${contractType}`](this.data, 'ServiceResponse');
    }
    
    return { valid: true, errors: [] };
  }
}

/**
 * Enhanced Service Base Class
 * Provides standard patterns for all services
 */
class EnhancedServiceBase {
  constructor(serviceName) {
    this.serviceName = serviceName;
  }

  /**
   * Standard method wrapper with validation and logging
   */
  async executeWithValidation(methodName, fn, params = {}) {
    const context = `${this.serviceName}.${methodName}`;
    
    try {
      console.log(`🔧 ${context}: Starting execution with params:`, Object.keys(params));
      
      // Parameter validation
      const paramValidation = this.validateParameters(params, methodName);
      if (!paramValidation.valid) {
        throw new Error(`Parameter validation failed: ${paramValidation.errors.join(', ')}`);
      }
      
      // Execute with defensive wrapper
      const result = await DefensiveWrappers.safeExecute(fn, context);
      
      // Result validation
      const resultValidation = this.validateResult(result, methodName);
      if (!resultValidation.valid) {
        console.warn(`⚠️ ${context}: Result validation warnings:`, resultValidation.errors);
      }
      
      console.log(`✅ ${context}: Execution completed successfully`);
      return ServiceResponse.success(result, { method: methodName, context });
      
    } catch (error) {
      console.error(`🚨 ${context}: Execution failed:`, error.message);
      return ServiceResponse.error(error, { method: methodName, context });
    }
  }

  /**
   * Override in subclasses for method-specific parameter validation
   */
  validateParameters(params, methodName) {
    return { valid: true, errors: [] };
  }

  /**
   * Override in subclasses for method-specific result validation
   */
  validateResult(result, methodName) {
    return { valid: true, errors: [] };
  }

  /**
   * Standard buffer download with validation
   */
  async downloadImageBufferSafely(url, context = 'downloadImageBuffer') {
    if (!url || typeof url !== 'string') {
      throw new Error(`Invalid URL provided: ${url}`);
    }

    try {
      const axios = require('axios');
      console.log(`📥 ${context}: Downloading image from ${url}`);
      
      const response = await axios.get(url, { 
        responseType: 'arraybuffer',
        timeout: 30000, // 30 second timeout
        maxContentLength: 50 * 1024 * 1024 // 50MB max
      });
      
      const buffer = Buffer.from(response.data);
      const validation = DefensiveWrappers.safeValidateBuffer(buffer, context);
      
      if (!validation.valid) {
        throw new Error(`Downloaded buffer validation failed: ${validation.error}`);
      }
      
      console.log(`✅ ${context}: Successfully downloaded ${validation.size} bytes`);
      return buffer;
      
    } catch (error) {
      console.error(`🚨 ${context}: Download failed:`, error.message);
      throw new Error(`Failed to download image from URL: ${error.message}`);
    }
  }
}

module.exports = { ServiceResponse, EnhancedServiceBase };