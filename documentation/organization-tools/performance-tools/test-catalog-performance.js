#!/usr/bin/env node

/**
 * Catalog Performance Comparison Test
 * Compares old vs optimized catalog performance
 */

const http = require('http');

async function testEndpoint(url, description) {
  const startTime = Date.now();
  
  return new Promise((resolve, reject) => {
    const request = http.get(url, (response) => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        const endTime = Date.now();
        const loadTime = endTime - startTime;
        
        resolve({
          url,
          description,
          loadTime,
          statusCode: response.statusCode,
          contentLength: data.length,
          success: response.statusCode === 200
        });
      });
    });
    
    request.on('error', reject);
    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function runPerformanceComparison() {
  console.log('🚀 CATALOG PERFORMANCE COMPARISON TEST');
  console.log('=====================================\n');
  
  const tests = [
    {
      url: 'http://localhost:3001/admin/vendor-catalog',
      description: 'Original Vendor Catalog (Full Load)'
    },
    {
      url: 'http://localhost:3001/admin/vendor-catalog-optimized',
      description: 'Optimized Vendor Catalog (Page Load)'
    },
    {
      url: 'http://localhost:3001/admin/vendor-catalog-optimized/api?page=1&limit=20',
      description: 'Optimized API (First 20 Products)'
    },
    {
      url: 'http://localhost:3001/admin/enhanced-vendor-catalog',
      description: 'Enhanced Vendor Catalog (Static Data)'
    }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      console.log(`⏱️ Testing: ${test.description}...`);
      const result = await testEndpoint(test.url, test.description);
      results.push(result);
      
      console.log(`   ✅ ${result.loadTime}ms (${(result.contentLength / 1024).toFixed(1)}KB)`);
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      results.push({
        ...test,
        loadTime: -1,
        success: false,
        error: error.message
      });
    }
  }
  
  console.log('\n📊 PERFORMANCE COMPARISON RESULTS:');
  console.log('==================================');
  
  const successfulResults = results.filter(r => r.success);
  
  if (successfulResults.length > 0) {
    // Sort by load time
    successfulResults.sort((a, b) => a.loadTime - b.loadTime);
    
    console.log('\n🏆 RANKING (Fastest to Slowest):');
    successfulResults.forEach((result, index) => {
      const rank = index + 1;
      const emoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '📊';
      console.log(`${emoji} ${rank}. ${result.description}`);
      console.log(`     Load Time: ${result.loadTime}ms`);
      console.log(`     Content Size: ${(result.contentLength / 1024).toFixed(1)}KB`);
      
      if (rank > 1) {
        const fastest = successfulResults[0];
        const improvement = ((result.loadTime - fastest.loadTime) / fastest.loadTime * 100).toFixed(1);
        console.log(`     Performance: ${improvement}% slower than fastest`);
      }
      console.log();
    });
    
    // Calculate improvements
    const original = results.find(r => r.url.includes('/admin/vendor-catalog') && !r.url.includes('optimized'));
    const optimized = results.find(r => r.url.includes('/admin/vendor-catalog-optimized/api'));
    
    if (original && optimized && original.success && optimized.success) {
      const improvement = ((original.loadTime - optimized.loadTime) / original.loadTime * 100).toFixed(1);
      const speedup = (original.loadTime / optimized.loadTime).toFixed(1);
      
      console.log('🎯 OPTIMIZATION IMPACT:');
      console.log(`   Original Catalog: ${original.loadTime}ms`);
      console.log(`   Optimized API: ${optimized.loadTime}ms`);
      console.log(`   Improvement: ${improvement}% faster`);
      console.log(`   Speed Multiplier: ${speedup}x faster`);
      console.log();
    }
  }
  
  // Performance recommendations
  console.log('💡 PERFORMANCE RECOMMENDATIONS:');
  console.log('===============================');
  console.log('✅ Use optimized catalog API for production');
  console.log('✅ Implement lazy loading for images');
  console.log('✅ Add pagination to limit data transfer');
  console.log('✅ Cache frequently accessed data');
  console.log('✅ Separate admin and user code paths');
  console.log();
  
  console.log('🔧 NEXT STEPS:');
  console.log('==============');
  console.log('1. Replace slow catalog with optimized version');
  console.log('2. Implement user product optimizer for customer-facing pages');
  console.log('3. Add performance monitoring to track improvements');
  console.log('4. Consider CDN caching for static assets');
  
  return results;
}

// Run the test
if (require.main === module) {
  runPerformanceComparison()
    .then(() => {
      console.log('\n✅ Performance comparison completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Performance test failed:', error.message);
      process.exit(1);
    });
}

module.exports = { runPerformanceComparison };