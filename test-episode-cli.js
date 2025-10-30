/**
 * Simple test to verify Episode Creation Pipeline Firebase connection
 */

require('dotenv').config();
const EpisodeStateManager = require('./cli/utils/episode-state-manager');

async function testFirebaseConnection() {
    console.log('🧪 Testing Episode Creation Pipeline Firebase Connection...');
    console.log('━'.repeat(50));
    
    try {
        // Initialize the state manager
        console.log('🔄 Initializing Episode State Manager...');
        const stateManager = new EpisodeStateManager();
        
        // Test basic connection
        console.log('🔄 Testing Firebase connection...');
        const allEpisodes = await stateManager.getAllEpisodes();
        console.log(`✅ Firebase connection successful! Found ${allEpisodes.length} existing episodes.`);
        
        // Test episode ID generation
        const testId = stateManager.generateEpisodeId(1, 1);
        console.log(`✅ Episode ID generation works: ${testId}`);
        
        // Test step initialization
        const stepStatus = stateManager.initializeStepStatus();
        console.log(`✅ Step status initialization works: ${Object.keys(stepStatus).length} steps`);
        
        console.log('\n🎉 All tests passed! Episode Creation Pipeline is ready!');
        console.log('━'.repeat(50));
        console.log('✅ Firebase Admin SDK: Connected');
        console.log('✅ Realtime Database: Accessible');
        console.log('✅ Episode State Manager: Ready');
        console.log('✅ CLI Framework: Ready');
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

testFirebaseConnection();