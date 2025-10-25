/**
 * Find Current Providers - Check what's actually available now
 */

require('dotenv').config();

const PRINTIFY_API_BASE = 'https://api.printify.com/v1';
const PRINTIFY_TOKEN = process.env.PRINTIFY_API_TOKEN;

async function makeRequest(endpoint) {
  const response = await fetch(`${PRINTIFY_API_BASE}${endpoint}`, {
    headers: { 'Authorization': `Bearer ${PRINTIFY_TOKEN}` }
  });
  return { response, data: response.ok ? await response.json() : null };
}

async function findCurrentProviders() {
  console.log('🔍 Finding currently available providers for Blueprint 5...\n');
  
  // Get all providers for Blueprint 5 (your existing product blueprint)
  const { data: providers } = await makeRequest('/catalog/blueprints/5/print_providers.json');
  
  console.log(`Found ${providers.length} providers for Blueprint 5:`);
  
  const workingProviders = [];
  
  for (const provider of providers) {
    console.log(`\n📋 Testing: ${provider.title} (ID: ${provider.id})`);
    console.log(`   Location: ${provider.location}`);
    
    // Test variants for this provider
    const { response, data: variants } = await makeRequest(
      `/catalog/blueprints/5/print_providers/${provider.id}/variants.json`
    );
    
    console.log(`   Variants: ${response.status} - ${variants?.length || 0} available`);
    
    if (variants?.length > 0) {
      console.log(`   ✅ WORKING! Sample: ${variants[0].title} - $${variants[0].price/100}`);
      workingProviders.push({
        id: provider.id,
        title: provider.title,
        location: provider.location,
        variantCount: variants.length,
        sampleVariant: variants[0]
      });
    } else {
      console.log(`   ❌ No variants available`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n📊 Results for Blueprint 5:`);
  console.log(`   Total providers: ${providers.length}`);
  console.log(`   Working providers: ${workingProviders.length}`);
  
  if (workingProviders.length > 0) {
    console.log(`\n🎉 Working providers found:`);
    workingProviders.forEach((provider, i) => {
      console.log(`   ${i + 1}. ${provider.title} (${provider.location}) - ${provider.variantCount} variants`);
    });
    
    console.log(`\n💡 Use these provider IDs for Blueprint 5:`);
    workingProviders.forEach(provider => {
      console.log(`   Blueprint: 5, Provider: ${provider.id} (${provider.title})`);
    });
  } else {
    console.log(`\n❌ No working providers found for Blueprint 5`);
    console.log(`   This explains why your validation was failing!`);
  }
  
  return workingProviders;
}

findCurrentProviders().catch(console.error);