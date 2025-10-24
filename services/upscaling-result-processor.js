/**
 * Upscaling Result Processor Service
 * 
 * Handles the complex logic for extracting image buffers from different 
 * upscaling result structures. This centralizes the logic for:
 * - Fresh upscaling results (has buffer property)
 * - Cache hit results (has fileBuffer property)
 * - Error handling for missing/corrupted buffer data
 * - Size calculations and metadata extraction
 * 
 * This service prevents code duplication between test scripts, UI code,
 * and runtime processing while ensuring consistent behavior.
 */

class UpscalingResultProcessor {
    constructor() {
        this.supportedMethods = ['openai', 'sharp', 'replicate', 'cache', 'openai-edit'];
    }

    /**
     * Extract image buffer from upscaling result with comprehensive error handling
     * @param {Object} enhancedResult - Result from upscaling service
     * @returns {Object} Standardized buffer extraction result
     */
    extractBuffer(enhancedResult) {
        // Input validation
        if (!enhancedResult) {
            throw new Error('Enhanced result is null or undefined - cannot extract buffer');
        }

        if (!enhancedResult.success) {
            throw new Error(`Enhanced result indicates failure: ${enhancedResult.error || 'unknown error'}`);
        }

        console.log('🔍 BUFFER EXTRACTION: Analyzing upscaling result structure...');
        console.log(`   Method: ${enhancedResult.method || 'unknown'}`);
        console.log(`   Has buffer property: ${!!enhancedResult.buffer}`);
        console.log(`   Has fileBuffer property: ${!!enhancedResult.fileBuffer}`);
        console.log(`   Cached result: ${!!enhancedResult.cached}`);

        let finalBuffer = null;
        let bufferSource = 'unknown';

        // Strategy 1: Check for direct buffer property (fresh upscaling results)
        if (enhancedResult.buffer && Buffer.isBuffer(enhancedResult.buffer)) {
            finalBuffer = enhancedResult.buffer;
            bufferSource = 'buffer';
            console.log('   ✅ Using buffer property (fresh upscaling result)');
        }
        // Strategy 2: Check for fileBuffer property (cache hit results)
        else if (enhancedResult.fileBuffer && Buffer.isBuffer(enhancedResult.fileBuffer)) {
            finalBuffer = enhancedResult.fileBuffer;
            bufferSource = 'fileBuffer';
            console.log('   ✅ Using fileBuffer property (cache hit result)');
        }
        // Strategy 3: Check for upscaledBuffer property (some cache implementations)
        else if (enhancedResult.upscaledBuffer && Buffer.isBuffer(enhancedResult.upscaledBuffer)) {
            finalBuffer = enhancedResult.upscaledBuffer;
            bufferSource = 'upscaledBuffer';
            console.log('   ✅ Using upscaledBuffer property (cache result)');
        }
        // Strategy 4: Cache hit with null buffer - need to download from URL
        else if (enhancedResult.cached && enhancedResult.upscaledBuffer === null && enhancedResult.enhancedUrl) {
            throw new Error('Cache hit detected but buffer is null - image must be downloaded from S3 URL. This operation requires network access which is not supported in this synchronous context.');
        }
        // Strategy 3: Handle special cases
        else if (enhancedResult.buffer === null) {
            throw new Error('Enhanced result has null buffer - image data is corrupted');
        }
        else if (enhancedResult.fileBuffer === null) {
            throw new Error('Enhanced result has null fileBuffer - cached image data is corrupted');
        }
        // Strategy 4: No valid buffer found
        else {
            console.error('❌ BUFFER EXTRACTION FAILED:');
            console.error('   Available properties:', Object.keys(enhancedResult));
            console.error('   Buffer type:', typeof enhancedResult.buffer);
            console.error('   FileBuffer type:', typeof enhancedResult.fileBuffer);
            
            throw new Error('Enhanced result missing buffer data - cannot create product');
        }

        // Calculate size metrics
        const sizeBytes = finalBuffer.length;
        const sizeKB = (sizeBytes / 1024).toFixed(1);
        
        console.log(`   📊 Buffer extracted successfully:`);
        console.log(`      Source: ${bufferSource}`);
        console.log(`      Size: ${sizeKB} KB (${sizeBytes} bytes)`);

        // Return standardized result
        return {
            success: true,
            buffer: finalBuffer,
            sizeBytes: sizeBytes,
            sizeKB: sizeKB,
            source: bufferSource,
            method: enhancedResult.method || 'unknown',
            cached: enhancedResult.cached || false,
            metadata: this.extractMetadata(enhancedResult)
        };
    }

    /**
     * Extract relevant metadata from upscaling result
     * @param {Object} enhancedResult - Original upscaling result
     * @returns {Object} Standardized metadata
     */
    extractMetadata(enhancedResult) {
        const metadata = {
            method: enhancedResult.method || 'unknown',
            cached: enhancedResult.cached || false,
            s3Url: enhancedResult.s3Url || enhancedResult.enhancedUrl || null,
            s3Key: enhancedResult.s3Key || null,
            enhancementId: enhancedResult.enhancementId || null,
            processingTime: enhancedResult.processingTime || null,
            contentHash: enhancedResult.contentHash || null
        };

        // Add method-specific metadata
        if (enhancedResult.metadata) {
            metadata.originalMetadata = enhancedResult.metadata;
        }

        // Validate critical metadata
        const criticalFields = ['s3Url', 's3Key'];
        const missingCritical = criticalFields.filter(field => !metadata[field]);
        
        if (missingCritical.length > 0) {
            console.warn(`⚠️ Missing critical metadata: ${missingCritical.join(', ')}`);
        }

        return metadata;
    }

    /**
     * Validate that an upscaling result has the minimum required properties
     * @param {Object} enhancedResult - Result to validate
     * @returns {Object} Validation result with details
     */
    validateResult(enhancedResult) {
        const validation = {
            isValid: true,
            errors: [],
            warnings: [],
            details: {}
        };

        // Check if result exists
        if (!enhancedResult) {
            validation.isValid = false;
            validation.errors.push('Result is null or undefined');
            return validation;
        }

        // Check success flag
        if (!enhancedResult.success) {
            validation.isValid = false;
            validation.errors.push(`Result indicates failure: ${enhancedResult.error || 'unknown error'}`);
        }

        // Check for buffer data
        const hasBuffer = enhancedResult.buffer && Buffer.isBuffer(enhancedResult.buffer);
        const hasFileBuffer = enhancedResult.fileBuffer && Buffer.isBuffer(enhancedResult.fileBuffer);
        
        if (!hasBuffer && !hasFileBuffer) {
            validation.isValid = false;
            validation.errors.push('No valid buffer data found (checked buffer and fileBuffer properties)');
        }

        // Check method
        if (!enhancedResult.method) {
            validation.warnings.push('Method not specified');
        } else if (!this.supportedMethods.includes(enhancedResult.method)) {
            validation.warnings.push(`Unknown method: ${enhancedResult.method}`);
        }

        // Check S3 URL
        if (!enhancedResult.s3Url && !enhancedResult.enhancedUrl) {
            validation.warnings.push('No S3 URL found');
        }

        // Add details for debugging
        validation.details = {
            hasBuffer: hasBuffer,
            hasFileBuffer: hasFileBuffer,
            method: enhancedResult.method || 'unknown',
            cached: enhancedResult.cached || false,
            bufferSize: hasBuffer ? enhancedResult.buffer.length : (hasFileBuffer ? enhancedResult.fileBuffer.length : 0)
        };

        return validation;
    }

    /**
     * Create a standardized error message for buffer extraction failures
     * @param {Object} enhancedResult - The failed result
     * @param {string} context - Context where the error occurred
     * @returns {string} Formatted error message
     */
    createErrorMessage(enhancedResult, context = 'product creation') {
        const baseMessage = `Cannot proceed with ${context} - upscaling result is invalid`;
        
        if (!enhancedResult) {
            return `${baseMessage}: result is null or undefined`;
        }

        if (!enhancedResult.success) {
            return `${baseMessage}: upscaling failed with error: ${enhancedResult.error || 'unknown error'}`;
        }

        const hasBuffer = enhancedResult.buffer && Buffer.isBuffer(enhancedResult.buffer);
        const hasFileBuffer = enhancedResult.fileBuffer && Buffer.isBuffer(enhancedResult.fileBuffer);

        if (!hasBuffer && !hasFileBuffer) {
            return `${baseMessage}: no valid buffer data found (method: ${enhancedResult.method || 'unknown'})`;
        }

        return `${baseMessage}: unknown validation error`;
    }

    /**
     * Log detailed diagnostic information about an upscaling result
     * @param {Object} enhancedResult - Result to diagnose
     * @param {string} context - Context for the diagnosis
     */
    logDiagnostics(enhancedResult, context = 'Buffer Extraction') {
        console.log(`🔍 ${context.toUpperCase()} DIAGNOSTICS:`);
        console.log(`==========================================`);
        
        if (!enhancedResult) {
            console.log('❌ Result: null or undefined');
            return;
        }

        console.log(`📊 Basic Properties:`);
        console.log(`   Success: ${enhancedResult.success}`);
        console.log(`   Method: ${enhancedResult.method || 'unknown'}`);
        console.log(`   Cached: ${enhancedResult.cached || false}`);
        
        console.log(`📦 Buffer Analysis:`);
        console.log(`   Has buffer: ${!!enhancedResult.buffer}`);
        console.log(`   Buffer is Buffer: ${Buffer.isBuffer(enhancedResult.buffer)}`);
        console.log(`   Has fileBuffer: ${!!enhancedResult.fileBuffer}`);
        console.log(`   FileBuffer is Buffer: ${Buffer.isBuffer(enhancedResult.fileBuffer)}`);
        
        if (enhancedResult.buffer && Buffer.isBuffer(enhancedResult.buffer)) {
            console.log(`   Buffer size: ${(enhancedResult.buffer.length / 1024).toFixed(1)} KB`);
        }
        
        if (enhancedResult.fileBuffer && Buffer.isBuffer(enhancedResult.fileBuffer)) {
            console.log(`   FileBuffer size: ${(enhancedResult.fileBuffer.length / 1024).toFixed(1)} KB`);
        }

        console.log(`🌐 URLs:`);
        console.log(`   S3 URL: ${enhancedResult.s3Url || 'not available'}`);
        console.log(`   Enhanced URL: ${enhancedResult.enhancedUrl || 'not available'}`);
        console.log(`   S3 Key: ${enhancedResult.s3Key || 'not available'}`);

        console.log(`🔧 Metadata:`);
        console.log(`   Enhancement ID: ${enhancedResult.enhancementId || 'not available'}`);
        console.log(`   Content Hash: ${enhancedResult.contentHash || 'not available'}`);
        console.log(`   Processing Time: ${enhancedResult.processingTime || 'not available'}`);
        
        const validation = this.validateResult(enhancedResult);
        console.log(`✅ Validation: ${validation.isValid ? 'PASSED' : 'FAILED'}`);
        
        if (validation.errors.length > 0) {
            console.log(`❌ Errors: ${validation.errors.join(', ')}`);
        }
        
        if (validation.warnings.length > 0) {
            console.log(`⚠️ Warnings: ${validation.warnings.join(', ')}`);
        }
        
        console.log(`==========================================\n`);
    }
}

module.exports = UpscalingResultProcessor;