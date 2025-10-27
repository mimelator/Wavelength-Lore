// Direct Firebase test to see what's actually stored
const firebaseAdminUtils = require('./helpers/firebase-admin-utils');

async function testFirebaseData() {
    console.log('🔥 Testing direct Firebase data...');
    
    try {
        // Get raw data from Firebase
        const rawData = await firebaseAdminUtils.fetchDataAsAdmin('lore/ice-blue-diamond');
        
        console.log('📊 Raw Firebase data for ice-blue-diamond:');
        console.log(JSON.stringify(rawData, null, 2));
        
        // Check if enhanced fields exist
        console.log('\n🎯 Enhanced field check:');
        console.log('  enhanced_title:', !!rawData?.enhanced_title);
        console.log('  tagline:', !!rawData?.tagline);
        console.log('  enhanced_description:', !!rawData?.enhanced_description);
        console.log('  cta_hook:', !!rawData?.cta_hook);
        console.log('  power_statement:', !!rawData?.power_statement);
        
        if (rawData?.enhanced_title) {
            console.log('\n✅ Enhanced title found:', rawData.enhanced_title.substring(0, 100) + '...');
        }
        
    } catch (error) {
        console.error('❌ Error fetching Firebase data:', error.message);
    }
}

testFirebaseData();