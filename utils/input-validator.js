/**
 * Universal Input Validator
 * Prevents null/undefined crashes and validates data structures
 */
class InputValidator {
    /**
     * Validate image object has required properties
     */
    static validateImageObject(image, context = 'unknown') {
        if (!image) {
            console.warn(`⚠️ ${context}: Image object is null/undefined`);
            return false;
        }
        
        // Check for name OR title (gallery API uses title)
        const hasName = image.name || image.title || image.id;
        const hasUrl = image.url;
        
        if (!hasName || !hasUrl) {
            const missingFields = [];
            if (!hasName) missingFields.push('name/title');
            if (!hasUrl) missingFields.push('url');
            
            console.warn(`⚠️ ${context}: Missing fields: ${missingFields.join(', ')}`);
            console.warn(`⚠️ Available fields:`, Object.keys(image));
            console.warn(`⚠️ Image object:`, image);
            return false;
        }
        
        return true;
    }
    
    /**
     * Get string property from object with validation
     */
    static getStringProperty(obj, property, defaultValue = null, context = 'unknown') {
        if (!obj || typeof obj !== 'object') {
            console.warn(`⚠️ ${context}: Object is null/undefined when getting ${property}`);
            return defaultValue;
        }
        
        let value = obj[property];
        
        // Special handling for name property - fallback to title if needed
        if (property === 'name' && !value && obj.title) {
            value = obj.title;
        }
        
        if (value === null || value === undefined) {
            return defaultValue;
        }
        
        let result = String(value).trim();
        
        // Special handling for filename properties - ensure extension exists
        if (property === 'name' && result && !result.includes('.')) {
            result = `${result}.png`; // Default to PNG for extensionless filenames
        }
        
        return result;
    }
    
    /**
     * Validate API response structure
     */
    static validateApiResponse(response, expectedFields = [], context = 'API') {
        if (!response) {
            throw new Error(`${context}: Response is null/undefined`);
        }
        
        if (!response.data) {
            console.warn(`⚠️ ${context}: Response missing data field`);
            return false;
        }
        
        const missing = expectedFields.filter(field => !(field in response.data));
        if (missing.length > 0) {
            console.warn(`⚠️ ${context}: Missing expected fields: ${missing.join(', ')}`);
            return false;
        }
        
        return true;
    }
    
    /**
     * Filter and validate image array
     */
    static filterValidImages(images, context = 'unknown') {
        if (!Array.isArray(images)) {
            console.warn(`⚠️ ${context}: Expected array, got ${typeof images}`);
            return [];
        }
        
        return images.filter((image, index) => {
            try {
                const isValid = this.validateImageObject(image, `${context}[${index}]`);
                if (!isValid) {
                    console.warn(`⚠️ Skipping invalid image at index ${index}`);
                }
                return isValid;
            } catch (error) {
                console.warn(`⚠️ ${context}[${index}]: ${error.message}`);
                console.warn(`⚠️ Skipping problematic image at index ${index}`);
                return false;
            }
        });
    }
}

module.exports = InputValidator;