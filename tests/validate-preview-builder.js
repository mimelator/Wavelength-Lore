const axios = require('axios');

async function validatePreviewBuilder() {
    console.log('🧪 Validating Preview Builder Fix...');
    
    try {
        // First test: Check if vendor previews endpoint works
        console.log('📡 Testing vendor previews API...');
        const previewsResponse = await axios.get('http://localhost:3001/api/merchandise/vendor-previews');
        console.log('✅ Vendor previews API response:', previewsResponse.status);
        console.log('📋 Found previews count:', previewsResponse.data.previews ? previewsResponse.data.previews.length : 0);
        
        // Second test: Check a specific vendor preview if any exist
        if (previewsResponse.data.previews && previewsResponse.data.previews.length > 0) {
            const firstPreview = previewsResponse.data.previews[0];
            console.log('🔍 Testing first preview:', firstPreview.productId);
            
            const singlePreviewResponse = await axios.get(`http://localhost:3001/api/merchandise/vendor-preview/${firstPreview.productId}`);
            console.log('✅ Single preview API response:', singlePreviewResponse.status);
            
            if (singlePreviewResponse.data.buffer || singlePreviewResponse.data.upscaledBuffer) {
                console.log('✅ Buffer returned successfully from cache');
                const bufferData = singlePreviewResponse.data.buffer || singlePreviewResponse.data.upscaledBuffer;
                console.log(`📊 Buffer size: ${bufferData.length} bytes`);
                console.log('🎯 Cache buffer fix is working!');
                return true;
            } else {
                console.log('❌ No buffer in preview response');
                console.log('📋 Response keys:', Object.keys(singlePreviewResponse.data));
                console.log('📋 Product keys:', Object.keys(singlePreviewResponse.data.product || {}));
                console.log('🔍 Full response data:', JSON.stringify(singlePreviewResponse.data, null, 2));
                return false;
            }
        } else {
            console.log('⚠️ No existing previews to test cache fix with');
            console.log('✅ But vendor previews API is working');
            return true;
        }
        
    } catch (error) {
        console.error('❌ Preview builder validation failed:', error.message);
        if (error.response) {
            console.error('📋 Error response:', error.response.status, error.response.data);
        }
        return false;
    }
}

async function main() {
    const isValid = await validatePreviewBuilder();
    process.exit(isValid ? 0 : 1);
}

main().catch(console.error);