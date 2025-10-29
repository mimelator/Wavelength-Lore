#!/usr/bin/env node

/**
 * 🌊 WAVELENGTH AI Assistant Controller
 * Enables/disables the VIP AI Assistant in production
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function showStatus() {
  const isEnabled = process.env.ENABLE_AI_ASSISTANT === 'true';
  console.log('🌊 WAVELENGTH AI ASSISTANT STATUS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🤖 AI Assistant: ${isEnabled ? '✅ ENABLED' : '❌ DISABLED (default)'}`);
  console.log(`📊 Environment Variable: ENABLE_AI_ASSISTANT=${process.env.ENABLE_AI_ASSISTANT || 'undefined'}`);
  console.log('');
  
  if (isEnabled) {
    console.log('ℹ️  When enabled:');
    console.log('   • AI Assistant icon visible to VIP users');
    console.log('   • /chatbot/* routes function normally');
    console.log('   • Status endpoint reports "operational"');
  } else {
    console.log('ℹ️  When disabled (default):');
    console.log('   • AI Assistant icon hidden from all users');
    console.log('   • /chatbot/* routes return 503 maintenance message');
    console.log('   • Status endpoint reports "disabled"');
  }
  console.log('');
}

function showInstructions() {
  console.log('🛠️  PRODUCTION DEPLOYMENT INSTRUCTIONS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('📋 To ENABLE AI Assistant in production:');
  console.log('   1. Set environment variable: ENABLE_AI_ASSISTANT=true');
  console.log('   2. Restart the application');
  console.log('   3. Verify with: curl https://wavelengthlore.com/chatbot/status');
  console.log('');
  console.log('📋 To DISABLE AI Assistant in production:');
  console.log('   1. Remove the ENABLE_AI_ASSISTANT variable (default is disabled)');
  console.log('   2. Restart the application');
  console.log('   3. Verify with: curl https://wavelengthlore.com/chatbot/status');
  console.log('');
  console.log('🔧 App Runner Environment Variables:');
  console.log('   • AWS Console → App Runner → wavelength-lore-service');
  console.log('   • Configuration → Environment variables');
  console.log('   • Add: ENABLE_AI_ASSISTANT = true (to enable)');
  console.log('   • Deploy new configuration');
  console.log('');
}

function promptAction() {
  rl.question('Choose action: (s)tatus, (i)nstructions, (q)uit: ', (answer) => {
    switch (answer.toLowerCase()) {
      case 's':
      case 'status':
        showStatus();
        promptAction();
        break;
      case 'i':
      case 'instructions':
        showInstructions();
        promptAction();
        break;
      case 'q':
      case 'quit':
        console.log('🌊 WAVELENGTH AI Assistant Controller closed.');
        rl.close();
        break;
      default:
        console.log('Invalid option. Please choose (s)tatus, (i)nstructions, or (q)uit.');
        promptAction();
        break;
    }
  });
}

console.log('🌊 WAVELENGTH AI ASSISTANT CONTROLLER');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('This tool helps manage the VIP AI Assistant feature.');
console.log('');

showStatus();
promptAction();