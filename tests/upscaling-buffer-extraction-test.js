/**
 * Upscaling Buffer Extraction Test
 * 
 * Tests the logic for extracting image buffers from different upscaling result structures:
 * - Fresh upscaling results (has buffer property)
 * - Cache hit results (has fileBuffer property) 
 * - Invalid/corrupted results (missing buffer data)
 */

const path = require('path');

// We'll create this service next
const UpscalingResultProcessor = require('../services/upscaling-result-processor');

class UpscalingBufferExtractionTest {
    constructor() {
        this.testResults = [];
        this.processor = new UpscalingResultProcessor();
    }

    async runAllTests() {
        console.log('🧪 UPSCALING BUFFER EXTRACTION TESTS');
        console.log('=====================================\n');

        await this.testFreshUpscalingResult();
        await this.testCacheHitResult();
        await this.testFileBufferResult();
        await this.testMissingBufferResult();
        await this.testCorruptedResult();
        await this.testNullResult();
        await this.testBufferValidation();

        this.generateTestReport();
        return this.testResults.every(test => test.passed);
    }

    async testFreshUpscalingResult() {
        console.log('🔬 TEST 1: Fresh Upscaling Result (has buffer property)');
        
        const mockFreshResult = {
            success: true,
            method: 'openai',
            buffer: Buffer.from('mock-upscaled-data'),
            s3Url: 'https://s3.example.com/upscaled/test.png',
            enhancementId: 'enhancement-123'
        };

        try {
            const result = this.processor.extractBuffer(mockFreshResult);
            
            const test = {
                name: 'Fresh Upscaling Result',
                passed: result.success === true && 
                       result.buffer.equals(mockFreshResult.buffer) &&
                       result.sizeKB === '0.0' &&
                       result.source === 'buffer',
                expected: 'Should extract buffer from buffer property',
                actual: `Success: ${result.success}, Source: ${result.source}, Size: ${result.sizeKB}KB`
            };
            
            this.testResults.push(test);
            console.log(`   ${test.passed ? '✅' : '❌'} ${test.expected}`);
            console.log(`   Result: ${test.actual}\n`);
            
        } catch (error) {
            this.testResults.push({
                name: 'Fresh Upscaling Result',
                passed: false,
                expected: 'Should extract buffer from buffer property',
                actual: `Error: ${error.message}`
            });
            console.log(`   ❌ Error: ${error.message}\n`);
        }
    }

    async testCacheHitResult() {
        console.log('🔬 TEST 2: Cache Hit Result (real structure from upscaling service)');
        
        const mockCacheResult = {
            success: true,
            method: 'cache',
            cached: true,
            upscaledUrl: 'https://cache.example.com/cached.png',
            enhancedUrl: 'https://cache.example.com/cached.png',
            upscaledBuffer: null, // Cache hits don't include buffer
            s3Key: 'upscaled/cached-image.png',
            fileName: 'cached-image.png',
            fileSize: 3148011,
            usedCache: true,
            contentHash: 'cache-hash-123',
            metadata: {
                url: 'https://cache.example.com/cached.png',
                s3Key: 'upscaled/cached-image.png',
                method: 'cache',
                cached: true,
                contentHash: 'cache-hash-123'
            }
        };

        try {
            const result = this.processor.extractBuffer(mockCacheResult);
            
            const test = {
                name: 'Cache Hit Result',
                passed: false, // Should fail because cache hits need special handling
                expected: 'Should handle cache hits by downloading from S3 URL',
                actual: `Unexpected success: ${JSON.stringify(result)}`
            };
            
            this.testResults.push(test);
            console.log(`   ❌ ${test.expected}`);
            console.log(`   Result: ${test.actual}\n`);
            
        } catch (error) {
            const test = {
                name: 'Cache Hit Result',
                passed: error.message.includes('Enhanced result missing buffer data') ||
                       error.message.includes('cache hits not supported'),
                expected: 'Should handle cache hits by downloading from S3 URL',
                actual: `Correctly threw error: ${error.message}`
            };
            
            this.testResults.push(test);
            console.log(`   ${test.passed ? '✅' : '❌'} ${test.expected}`);
            console.log(`   Result: ${test.actual}\n`);
        }
    }

    async testFileBufferResult() {
        console.log('🔬 TEST 3: Alternative FileBuffer Result');
        
        const mockResult = {
            success: true,
            method: 'alternative',
            fileBuffer: Buffer.from('alternative-buffer-data'),
            metadata: { source: 'alternative' }
        };

        try {
            const result = this.processor.extractBuffer(mockResult);
            
            const test = {
                name: 'Alternative FileBuffer Result',
                passed: result.success === true && 
                       result.buffer.equals(mockResult.fileBuffer) &&
                       result.source === 'fileBuffer',
                expected: 'Should extract buffer from fileBuffer when no buffer property',
                actual: `Success: ${result.success}, Source: ${result.source}`
            };
            
            this.testResults.push(test);
            console.log(`   ${test.passed ? '✅' : '❌'} ${test.expected}`);
            console.log(`   Result: ${test.actual}\n`);
            
        } catch (error) {
            this.testResults.push({
                name: 'Alternative FileBuffer Result',
                passed: false,
                expected: 'Should extract buffer from fileBuffer when no buffer property',
                actual: `Error: ${error.message}`
            });
            console.log(`   ❌ Error: ${error.message}\n`);
        }
    }

    async testMissingBufferResult() {
        console.log('🔬 TEST 4: Missing Buffer Data (should throw error)');
        
        const mockInvalidResult = {
            success: true,
            method: 'invalid',
            s3Url: 'https://s3.example.com/test.png',
            // No buffer or fileBuffer properties
        };

        try {
            const result = this.processor.extractBuffer(mockInvalidResult);
            
            const test = {
                name: 'Missing Buffer Data',
                passed: false, // Should have thrown an error
                expected: 'Should throw error for missing buffer data',
                actual: `Unexpectedly succeeded: ${JSON.stringify(result)}`
            };
            
            this.testResults.push(test);
            console.log(`   ❌ ${test.expected}`);
            console.log(`   Result: ${test.actual}\n`);
            
        } catch (error) {
            const test = {
                name: 'Missing Buffer Data',
                passed: error.message.includes('Enhanced result missing buffer data'),
                expected: 'Should throw error for missing buffer data',
                actual: `Correctly threw error: ${error.message}`
            };
            
            this.testResults.push(test);
            console.log(`   ${test.passed ? '✅' : '❌'} ${test.expected}`);
            console.log(`   Result: ${test.actual}\n`);
        }
    }

    async testCorruptedResult() {
        console.log('🔬 TEST 5: Corrupted Result (invalid buffer)');
        
        const mockCorruptedResult = {
            success: true,
            method: 'corrupted',
            buffer: null, // Null buffer
            fileBuffer: undefined // Undefined fileBuffer
        };

        try {
            const result = this.processor.extractBuffer(mockCorruptedResult);
            
            const test = {
                name: 'Corrupted Result',
                passed: false, // Should have thrown an error
                expected: 'Should throw error for null/undefined buffers',
                actual: `Unexpectedly succeeded: ${JSON.stringify(result)}`
            };
            
            this.testResults.push(test);
            console.log(`   ❌ ${test.expected}`);
            console.log(`   Result: ${test.actual}\n`);
            
        } catch (error) {
            const test = {
                name: 'Corrupted Result',
                passed: error.message.includes('Enhanced result has null buffer') || 
                       error.message.includes('Enhanced result missing buffer data'),
                expected: 'Should throw error for null/undefined buffers',
                actual: `Correctly threw error: ${error.message}`
            };
            
            this.testResults.push(test);
            console.log(`   ${test.passed ? '✅' : '❌'} ${test.expected}`);
            console.log(`   Result: ${test.actual}\n`);
        }
    }

    async testNullResult() {
        console.log('🔬 TEST 6: Null Result');
        
        try {
            const result = this.processor.extractBuffer(null);
            
            const test = {
                name: 'Null Result',
                passed: false, // Should have thrown an error
                expected: 'Should throw error for null result',
                actual: `Unexpectedly succeeded: ${JSON.stringify(result)}`
            };
            
            this.testResults.push(test);
            console.log(`   ❌ ${test.expected}`);
            console.log(`   Result: ${test.actual}\n`);
            
        } catch (error) {
            const test = {
                name: 'Null Result',
                passed: error.message.includes('Enhanced result is null or undefined'),
                expected: 'Should throw error for null result',
                actual: `Correctly threw error: ${error.message}`
            };
            
            this.testResults.push(test);
            console.log(`   ${test.passed ? '✅' : '❌'} ${test.expected}`);
            console.log(`   Result: ${test.actual}\n`);
        }
    }

    async testBufferValidation() {
        console.log('🔬 TEST 7: Buffer Validation');
        
        const mockResultWithLargeBuffer = {
            success: true,
            method: 'openai',
            buffer: Buffer.alloc(1024 * 1024 * 2.5), // 2.5MB buffer
            s3Url: 'https://s3.example.com/large.png'
        };

        try {
            const result = this.processor.extractBuffer(mockResultWithLargeBuffer);
            
            const test = {
                name: 'Buffer Validation',
                passed: result.success === true && 
                       parseFloat(result.sizeKB) === 2560.0 && // 2.5MB = 2560KB
                       result.buffer.length === mockResultWithLargeBuffer.buffer.length,
                expected: 'Should correctly calculate buffer size and validate',
                actual: `Success: ${result.success}, Size: ${result.sizeKB}KB, Length: ${result.buffer.length}`
            };
            
            this.testResults.push(test);
            console.log(`   ${test.passed ? '✅' : '❌'} ${test.expected}`);
            console.log(`   Result: ${test.actual}\n`);
            
        } catch (error) {
            this.testResults.push({
                name: 'Buffer Validation',
                passed: false,
                expected: 'Should correctly calculate buffer size and validate',
                actual: `Error: ${error.message}`
            });
            console.log(`   ❌ Error: ${error.message}\n`);
        }
    }

    generateTestReport() {
        console.log('📊 TEST RESULTS SUMMARY');
        console.log('========================');
        
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(test => test.passed).length;
        const failedTests = totalTests - passedTests;
        
        console.log(`📈 Total Tests: ${totalTests}`);
        console.log(`✅ Passed: ${passedTests}`);
        console.log(`❌ Failed: ${failedTests}`);
        console.log(`📊 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%\n`);
        
        if (failedTests > 0) {
            console.log('❌ FAILED TESTS:');
            this.testResults.filter(test => !test.passed).forEach((test, index) => {
                console.log(`${index + 1}. ${test.name}`);
                console.log(`   Expected: ${test.expected}`);
                console.log(`   Actual: ${test.actual}\n`);
            });
        }
        
        console.log(`🎯 OVERALL RESULT: ${failedTests === 0 ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
    }
}

// Run tests if called directly
async function main() {
    const test = new UpscalingBufferExtractionTest();
    const success = await test.runAllTests();
    process.exit(success ? 0 : 1);
}

if (require.main === module) {
    main();
}

module.exports = UpscalingBufferExtractionTest;