/**
 * Defensive Programming Utilities
 * Prevents runtime crashes from null/undefined values
 */

const InputValidator = require('./input-validator');

class DefensiveWrappers {
  /**
   * Safe string splitting with validation
   * Prevents "Cannot read properties of undefined (reading 'split')" errors
   */
  static safeSplit(value, delimiter = 'x', context = 'unknown') {
    if (!value) {
      console.warn(`⚠️ ${context}: Cannot split null/undefined value`);
      return [];
    }
    
    if (typeof value !== 'string') {
      console.warn(`⚠️ ${context}: Cannot split non-string value:`, typeof value, value);
      return [];
    }
    
    if (!value.includes(delimiter)) {
      console.warn(`⚠️ ${context}: Value does not contain delimiter '${delimiter}':`, value);
      return [value]; // Return original as single element
    }
    
    return value.split(delimiter);
  }

  /**
   * Safe dimension parsing from string or object
   */
  static safeParseDimensions(dimensions, context = 'unknown') {
    // Handle object format {width: 1024, height: 1024}
    if (dimensions && typeof dimensions === 'object' && dimensions.width && dimensions.height) {
      return {
        width: parseInt(dimensions.width),
        height: parseInt(dimensions.height),
        string: `${dimensions.width}x${dimensions.height}`
      };
    }
    
    // Handle string format "1024x1024"
    if (dimensions && typeof dimensions === 'string') {
      const parts = this.safeSplit(dimensions, 'x', context);
      if (parts.length >= 2) {
        return {
          width: parseInt(parts[0]),
          height: parseInt(parts[1]),
          string: dimensions
        };
      }
    }
    
    console.warn(`⚠️ ${context}: Invalid dimensions format, using defaults:`, dimensions);
    return {
      width: 1024,
      height: 1024,
      string: '1024x1024'
    };
  }

  /**
   * Safe buffer validation with detailed logging
   */
  static safeValidateBuffer(buffer, context = 'unknown') {
    if (!buffer) {
      console.error(`🚨 ${context}: Buffer is null/undefined`);
      return { valid: false, error: 'Buffer is null/undefined' };
    }
    
    if (!Buffer.isBuffer(buffer)) {
      console.error(`🚨 ${context}: Value is not a Buffer:`, typeof buffer);
      return { valid: false, error: 'Value is not a Buffer' };
    }
    
    if (buffer.length === 0) {
      console.error(`🚨 ${context}: Buffer is empty`);
      return { valid: false, error: 'Buffer is empty' };
    }
    
    console.log(`✅ ${context}: Buffer validation passed (${buffer.length} bytes)`);
    return { valid: true, size: buffer.length };
  }

  /**
   * Safe property access with fallbacks
   */
  static safeGet(obj, path, defaultValue = null, context = 'unknown') {
    if (!obj || typeof obj !== 'object') {
      console.warn(`⚠️ ${context}: Cannot access property '${path}' on null/non-object`);
      return defaultValue;
    }
    
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current === null || current === undefined || !(key in current)) {
        console.warn(`⚠️ ${context}: Property '${path}' not found, using default:`, defaultValue);
        return defaultValue;
      }
      current = current[key];
    }
    
    return current;
  }

  /**
   * Method execution wrapper with error boundaries
   */
  static async safeExecute(fn, context = 'unknown', fallback = null) {
    try {
      console.log(`🔧 ${context}: Starting safe execution`);
      const result = await fn();
      console.log(`✅ ${context}: Safe execution completed successfully`);
      return result;
    } catch (error) {
      console.error(`🚨 ${context}: Safe execution failed:`, error.message);
      console.error(`📊 ${context}: Error stack:`, error.stack);
      
      if (fallback !== null) {
        console.log(`🔄 ${context}: Using fallback value:`, fallback);
        return fallback;
      }
      
      throw error; // Re-throw if no fallback
    }
  }
}

module.exports = DefensiveWrappers;