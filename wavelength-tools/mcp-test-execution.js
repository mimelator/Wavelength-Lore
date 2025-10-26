// WAVELENGTH SUPER POWER: Direct MCP Tool Execution
const EnhancedWavelengthMCPServer = require('./mcp/enhanced-wavelength-server.js');

async function executeTest() {
    console.log('🚀 WAVELENGTH SUPER POWER: Direct MCP Execution');
    console.log('===============================================\n');
    
    const server = new EnhancedWavelengthMCPServer();
    
    try {
        // Use http_request super power directly
        const result = await server.makeHttpRequest(
            'http://localhost:3001/forum/post/-OcTbtWHy2QvT9yGl89x',
            'GET'
        );
        
        console.log('📊 HTTP REQUEST RESULT:');
        console.log(result.content[0].text);
        
        // Parse the HTML response for validation
        const htmlContent = result.content[0].text;
        
        // Extract key data from the response
        const hasTitle = htmlContent.includes('The Melody of Moonlight');
        const hasAuthor = htmlContent.includes('Aria Moonwhisper');
        const hasContent = htmlContent.includes('Status: 200') && !htmlContent.includes('No content available');
        
        console.log('\n🔍 VALIDATION RESULTS:');
        console.log(`📝 Title Check: ${hasTitle ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`👤 Author Check: ${hasAuthor ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`📄 Content Check: ${hasContent ? '✅ PASS' : '❌ FAIL'}`);
        
        if (hasTitle && hasAuthor && hasContent) {
            console.log('\n🎉 SUCCESS: Template rendering is working correctly!');
            console.log('✅ Aria\'s post displays real data, not fallbacks');
        } else {
            console.log('\n🚨 FAILURE: Template rendering issue detected!');
            console.log('❌ Post page showing fallback data instead of real content');
        }
        
    } catch (error) {
        console.error('❌ Test execution failed:', error.message);
    }
}

executeTest();