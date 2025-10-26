// Auto-Execute Wavelength Gems Test Suite
// This script will automatically run the comprehensive test suite when loaded

console.log('🎮 Auto-Executing Wavelength Gems Test Suite...');

// Wait for game to fully load, then execute tests
function autoExecuteTests() {
    // Check if game is loaded
    if (typeof runAllWavelengthGemsTests === 'function') {
        console.log('✅ Test suite functions detected - executing comprehensive tests...');
        
        // Execute comprehensive test suite
        setTimeout(() => {
            try {
                runAllWavelengthGemsTests();
            } catch (error) {
                console.error('❌ Error executing comprehensive tests:', error);
                
                // Fallback to individual tests
                console.log('🔄 Attempting individual test execution...');
                if (typeof WavelengthGemsMobileTests !== 'undefined') {
                    WavelengthGemsMobileTests.runAllTests();
                }
                if (typeof WavelengthGemsDesktopTests !== 'undefined') {
                    WavelengthGemsDesktopTests.runAllTests();
                }
                if (typeof WavelengthGemsGameMechanicsTests !== 'undefined') {
                    WavelengthGemsGameMechanicsTests.runAllTests();
                }
                if (typeof WavelengthGemsUIPolishTests !== 'undefined') {
                    WavelengthGemsUIPolishTests.runAllTests();
                }
            }
        }, 2000); // Wait 2 seconds for game initialization
        
    } else {
        console.log('⏳ Test suite not ready yet, retrying in 1 second...');
        setTimeout(autoExecuteTests, 1000);
    }
}

// Start auto-execution when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoExecuteTests);
} else {
    autoExecuteTests();
}