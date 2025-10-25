/**
 * API Validation Test - Tests actual API endpoints, not just UI
 * This addresses the critical testing failure where UI tests passed but APIs were broken
 */

// Using built-in fetch (Node.js 18+)

async function testMerchandiseAPIs() {
    console.log('🔬 API Validation Test - Testing Actual Endpoints');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const baseUrl = 'http://localhost:3001';
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer dev-bypass'
    };
    
    let allPassed = true;
    
    // Test 1: Product Types API
    console.log('🧪 Test 1: Product Types API');
    try {
        const response = await fetch(`${baseUrl}/api/merchandise/product-types`);
        const data = await response.json();
        
        if (response.ok && data.success) {
            console.log(`✅ Product Types: ${data.allProducts?.length || 0} products loaded`);
        } else {
            console.log(`❌ Product Types: ${response.status} - ${data.error || 'Unknown error'}`);
            allPassed = false;
        }
    } catch (error) {
        console.log(`❌ Product Types: Network error - ${error.message}`);
        allPassed = false;
    }
    
    // Test 2: Gallery Images API
    console.log('🧪 Test 2: Gallery Images API');
    try {
        const response = await fetch(`${baseUrl}/api/merchandise/gallery-images`, { headers });
        const data = await response.json();
        
        if (response.ok && data.success) {
            console.log(`✅ Gallery Images: ${data.images?.length || 0} images loaded`);
        } else {
            console.log(`❌ Gallery Images: ${response.status} - ${data.error || 'Unknown error'}`);
            allPassed = false;
        }
    } catch (error) {
        console.log(`❌ Gallery Images: Network error - ${error.message}`);
        allPassed = false;
    }
    
    // Test 3: Product Creation API (the critical one that was failing)
    console.log('🧪 Test 3: Product Creation API');
    try {
        const testPayload = {
            imageId: 'test-image-id',
            imageUrl: 'https://example.com/test.jpg',
            imageTitle: 'Test Image',
            productType: 'premium-tshirt',
            productOptions: {
                borderConfig: { type: 'solid', color: '#000000', width: 15 },
                defaultVariant: { size: 'M', color: 'Black' }
            }
        };
        
        const response = await fetch(`${baseUrl}/api/merchandise/create-product`, {
            method: 'POST',
            headers,
            body: JSON.stringify(testPayload)
        });
        
        const contentType = response.headers.get('content-type');
        console.log(`📡 Response Content-Type: ${contentType}`);
        
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            
            if (response.ok && data.success) {
                console.log(`✅ Product Creation: Success - Product ID ${data.product?.id || 'unknown'}`);
            } else {
                console.log(`❌ Product Creation: ${response.status} - ${data.error || 'Unknown error'}`);
                allPassed = false;
            }
        } else {
            const text = await response.text();
            console.log(`❌ Product Creation: Returned HTML instead of JSON`);
            console.log(`📄 Response preview: ${text.substring(0, 200)}...`);
            allPassed = false;
        }
    } catch (error) {
        console.log(`❌ Product Creation: Network error - ${error.message}`);
        allPassed = false;
    }
    
    // Test 4: Border Preview API
    console.log('🧪 Test 4: Border Preview API');
    try {
        const borderPayload = {
            sourceImageUrl: 'https://example.com/test.jpg',
            borderConfig: { type: 'solid', color: '#000000', width: 15 }
        };
        
        const response = await fetch(`${baseUrl}/api/merchandise/border-preview`, {
            method: 'POST',
            headers,
            body: JSON.stringify(borderPayload)
        });
        
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            
            if (response.ok && data.success) {
                console.log(`✅ Border Preview: Success - Generated preview URL`);
            } else {
                console.log(`❌ Border Preview: ${response.status} - ${data.error || 'Unknown error'}`);
                allPassed = false;
            }
        } else {
            console.log(`❌ Border Preview: Returned HTML instead of JSON`);
            allPassed = false;
        }
    } catch (error) {
        console.log(`❌ Border Preview: Network error - ${error.message}`);
        allPassed = false;
    }
    
    console.log('\n📊 API Validation Results:');
    console.log(`🎯 Overall Result: ${allPassed ? 'ALL APIS WORKING' : 'API FAILURES DETECTED'}`);
    
    if (!allPassed) {
        console.log('\n🚨 CRITICAL: API endpoints are broken - UI tests were misleading');
        console.log('💡 This explains why borders had no effect and product creation failed');
    }
    
    return allPassed;
}

testMerchandiseAPIs()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('API test failed:', error);
        process.exit(1);
    });