#!/usr/bin/env node

/**
 * AI Image Generation Demo & Setup
 * Demonstrates the AI image generation capabilities
 */

const fs = require('fs').promises;
const path = require('path');

class AIDemo {
  constructor() {
    this.envPath = path.join(__dirname, '../.env');
    this.examples = [
      {
        name: 'Character Portrait',
        command: 'character',
        args: ['Lucky', 'mischievous leprechaun with green hat and twinkling eyes'],
        description: 'Generate a character portrait for Lucky the leprechaun'
      },
      {
        name: 'Location Scene',
        command: 'location', 
        args: ['Emerald Grove', 'mystical forest with glowing trees and fairy lights'],
        description: 'Generate a mystical forest scene'
      },
      {
        name: 'Custom Generation',
        command: 'generate',
        args: ['magical crystal glowing with inner light'],
        description: 'Generate a magical object'
      },
      {
        name: 'Multiple Variations',
        command: 'variations',
        args: ['epic fantasy castle on mountaintop'],
        options: ['--count=3', '--style=fantasy-art'],
        description: 'Generate 3 variations of a fantasy castle'
      },
      {
        name: 'Complete Workflow',
        command: 'workflow',
        args: ['ancient spellbook with glowing runes', 'objects/magical-items'],
        options: ['--count=2', '--url-mode=relative'],
        description: 'Generate and upload magical item assets'
      }
    ];
  }

  async checkSetup() {
    console.log('🔍 Checking AI Image Generation Setup...\n');

    // Check if environment file exists
    try {
      const envContent = await fs.readFile(this.envPath, 'utf8');
      const hasApiKey = envContent.includes('AI_API_KEY') && !envContent.includes('AI_API_KEY=your_banana_api_key_here');
      
      if (hasApiKey) {
        console.log('✅ Environment configuration found');
        return true;
      } else {
        console.log('⚠️  AI_API_KEY not configured in .env file');
        return false;
      }
    } catch (error) {
      console.log('❌ .env file not found');
      return false;
    }
  }

  async showSetupInstructions() {
    console.log(`
🔧 AI Image Generation Setup Instructions:

1. Get API Key:
   • Visit: https://banana.dev
   • Sign up for an account
   • Get your API key from the dashboard

2. Configure Environment:
   • Copy the example: cp .env.ai.example .env.ai
   • Edit your .env file and add:
   
   AI_API_KEY=your_banana_api_key_here
   AI_API_ENDPOINT=https://api.banana.dev/start/v4/
   AI_MODEL_KEY=google/imagen

3. Test Setup:
   • Run: ./scripts/ai-image-generator.js --help
   • Try: ./scripts/ai-image-generator.js generate "test image" --steps=10

📚 Full Documentation: ../docs/scripts/AI_IMAGE_GENERATION_README.md
`);
  }

  showExamples() {
    console.log('🎨 AI Image Generation Examples:\n');

    this.examples.forEach((example, index) => {
      console.log(`${index + 1}. ${example.name}`);
      console.log(`   📝 ${example.description}`);
      
      let command = `./scripts/ai-image-generator.js ${example.command}`;
      
      if (example.args) {
        command += ` "${example.args.join('" "')}"`;
      }
      
      if (example.options) {
        command += ` ${example.options.join(' ')}`;
      }
      
      console.log(`   💻 ${command}`);
      console.log('');
    });
  }

  showWorkflowExamples() {
    console.log(`
🔄 Common Workflows:

📸 Character Development:
   • Generate initial concepts:
     ./scripts/ai-image-generator.js character "Aria" "elven archer with silver hair"
   
   • Create variations:
     ./scripts/ai-image-generator.js variations "Aria elven archer portrait" --count=5
   
   • Final character assets:
     ./scripts/ai-image-generator.js workflow "Aria final portrait" "characters/aria" --steps=60

🏞️  World Building:
   • Location concepts:
     ./scripts/ai-image-generator.js location "Sky City" "floating city in clouds"
   
   • Scene generation:
     ./scripts/ai-image-generator.js workflow "epic battle scene" "scenes/battles" --count=3

🎯 Asset Creation:
   • Generate episode assets:
     ./scripts/ai-image-generator.js workflow "mystical portal" "season2/episode5" --count=2
   
   • Object/item generation:
     ./scripts/ai-image-generator.js generate "legendary sword with flame enchantment"

🎨 Style Exploration:
   • Try different styles:
     ./scripts/ai-image-generator.js generate "dragon portrait" --style=anime
     ./scripts/ai-image-generator.js generate "dragon portrait" --style=oil-painting
     ./scripts/ai-image-generator.js generate "dragon portrait" --style=concept-art
`);
  }

  showAssetIntegration() {
    console.log(`
🔗 Asset Manager Integration:

The AI generator automatically works with the enhanced asset manager:

1. Generate images (saved to temp/ai-generated/)
2. Process and optimize (multiple sizes, formats)
3. Upload to asset structure (static/images/ai-generated/)
4. Generate appropriate URLs (relative/cdn/absolute)
5. Clean up temporary files

💡 Benefits:
   ✅ No manual file management
   ✅ Automatic optimization
   ✅ Consistent asset organization  
   ✅ Ready-to-use URLs
   ✅ Production-ready workflow

📊 Asset Structure:
   static/images/ai-generated/
   ├── characters/          # Character portraits
   ├── locations/           # Location scenes  
   ├── objects/            # Items and artifacts
   ├── scenes/             # Battle scenes, events
   └── concepts/           # General concepts
`);
  }

  async runDemo() {
    console.log('🎨 AI Image Generation Demo for Wavelength Lore\n');

    const isConfigured = await this.checkSetup();

    if (!isConfigured) {
      await this.showSetupInstructions();
      return;
    }

    this.showExamples();
    this.showWorkflowExamples();
    this.showAssetIntegration();

    console.log(`
🚀 Ready to Start!

Try your first AI generation:
  ./scripts/ai-image-generator.js character "YourCharacter" "description here"

Or explore the full documentation:
  ../docs/scripts/AI_IMAGE_GENERATION_README.md
`);
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🎨 AI Image Generation Demo

Usage: node ai-demo.js [command]

Commands:
  setup                    Show setup instructions
  examples                 Show usage examples
  workflows               Show common workflows
  integration             Show asset manager integration
  (no command)            Run full demo

Examples:
  node ai-demo.js                # Full demo
  node ai-demo.js setup         # Setup help only
  node ai-demo.js examples      # Examples only
`);
    process.exit(0);
  }

  const demo = new AIDemo();
  const command = args[0];

  switch (command) {
    case 'setup':
      await demo.showSetupInstructions();
      break;
    case 'examples':
      demo.showExamples();
      break;
    case 'workflows':
      demo.showWorkflowExamples();
      break;
    case 'integration':
      demo.showAssetIntegration();
      break;
    default:
      await demo.runDemo();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = AIDemo;