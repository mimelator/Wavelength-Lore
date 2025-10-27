#!/usr/bin/env node

/**
 * WAVELENGTH CHATBOT INTERACTIVE CLI
 * =================================
 * 
 * Interactive command-line interface for chatting with the Wavelength Chatbot.
 * Perfect for testing responses and evaluating content quality before using
 * it for schema enhancement.
 */

const https = require('https');
const readline = require('readline');
require('dotenv').config();

class WavelengthChatCLI {
  constructor() {
    this.chatbotUrl = 'us-central1-wavelength-lore.cloudfunctions.net';
    this.apiKey = process.env.CHATBOT_API_KEY;
    this.conversationHistory = [];
    this.rl = null;
  }

  /**
   * Send a question to the chatbot and get response
   */
  async askChatbot(message) {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({ 
        message: message,
        conversationHistory: this.conversationHistory
      });
      
      const options = {
        hostname: this.chatbotUrl,
        port: 443,
        path: '/legacy/chat',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'X-API-Key': this.apiKey
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            
            if (response.success) {
              const cleanedResponse = this.cleanHTMLLinks(response.response);
              
              resolve({
                success: true,
                response: cleanedResponse,
                metadata: response.metadata || {},
                usage: response.usage || {}
              });
            } else {
              resolve({
                success: false,
                error: response.error || 'Unknown error'
              });
            }
          } catch (error) {
            resolve({
              success: false,
              error: `JSON Parse Error: ${error.message}`
            });
          }
        });
      });

      req.on('error', (error) => {
        resolve({
          success: false,
          error: `Request Error: ${error.message}`
        });
      });

      req.setTimeout(30000, () => {
        req.destroy();
        resolve({
          success: false,
          error: 'Request timeout (30s)'
        });
      });

      req.write(postData);
      req.end();
    });
  }

  /**
   * Clean HTML links from response
   */
  cleanHTMLLinks(response) {
    if (!response) return '';
    
    // Remove HTML links but keep the text content
    let cleaned = response.replace(/<a[^>]*>([^<]+)<\/a>/g, '$1');
    
    // Remove any remaining HTML tags
    cleaned = cleaned.replace(/<[^>]*>/g, '');
    
    // Clean up extra whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
  }

  /**
   * Display response with metadata
   */
  displayResponse(result, showMetadata = false) {
    if (result.success) {
      console.log('\n🤖 Wavelength Chatbot:');
      console.log('─'.repeat(60));
      console.log(result.response);
      
      if (showMetadata && (result.usage || result.metadata)) {
        console.log('\n📊 Response Metadata:');
        if (result.usage && result.usage.totalTokens) {
          console.log(`   🧠 Tokens: ${result.usage.totalTokens}`);
        }
        if (result.metadata && result.metadata.processingTimeMs) {
          console.log(`   ⏱️  Time: ${result.metadata.processingTimeMs}ms`);
        }
        if (result.metadata && result.metadata.linksAdded) {
          console.log(`   🔗 Links: ${result.metadata.linksAdded}`);
        }
      }
    } else {
      console.log(`\n❌ Error: ${result.error}`);
    }
  }

  /**
   * Start interactive chat session
   */
  async startInteractiveChat() {
    console.log('🌊 WAVELENGTH CHATBOT INTERACTIVE CLI');
    console.log('====================================');
    console.log('💡 Ask questions about Wavelength Lore characters, episodes, and stories!');
    console.log('📝 Type your questions and press Enter. Type "exit" or "quit" to end.');
    console.log('🔧 Commands: "/help", "/history", "/clear", "/metadata on/off"');
    console.log('');

    // Test connection first
    console.log('🔍 Testing connection...');
    const testResult = await this.askChatbot('Hello');
    
    if (!testResult.success) {
      console.error(`❌ Connection failed: ${testResult.error}`);
      console.log('Please check your internet connection and try again.');
      return;
    }
    
    console.log('✅ Connected to Wavelength Chatbot!');
    console.log('');

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '🌊 You: '
    });

    let showMetadata = false;

    this.rl.prompt();

    this.rl.on('line', async (input) => {
      const message = input.trim();
      
      if (!message) {
        this.rl.prompt();
        return;
      }

      // Handle commands
      if (message.startsWith('/')) {
        await this.handleCommand(message, showMetadata);
        if (message === '/metadata on') showMetadata = true;
        if (message === '/metadata off') showMetadata = false;
        this.rl.prompt();
        return;
      }

      // Handle exit commands
      if (message.toLowerCase() === 'exit' || message.toLowerCase() === 'quit') {
        console.log('\n👋 Thanks for chatting with the Wavelength Chatbot!');
        console.log('🎯 Ready to use authentic content in schema enhancement? Run:');
        console.log('   node scripts/unified/firebase-schema-enhancer.js --use-authentic-content --dry-run');
        this.rl.close();
        return;
      }

      // Send message to chatbot
      console.log('\n🤔 Thinking...');
      const result = await this.askChatbot(message);
      
      // Update conversation history for context
      if (result.success) {
        this.conversationHistory.push(
          { role: 'user', content: message },
          { role: 'assistant', content: result.response }
        );
        
        // Keep only last 10 exchanges to manage token usage
        if (this.conversationHistory.length > 20) {
          this.conversationHistory = this.conversationHistory.slice(-20);
        }
      }
      
      this.displayResponse(result, showMetadata);
      console.log('');
      this.rl.prompt();
    });

    this.rl.on('close', () => {
      console.log('\nGoodbye!');
      process.exit(0);
    });
  }

  /**
   * Handle CLI commands
   */
  async handleCommand(command, showMetadata) {
    const cmd = command.toLowerCase();
    
    switch (cmd) {
      case '/help':
        console.log('\n🔧 Available Commands:');
        console.log('─'.repeat(40));
        console.log('/help        - Show this help');
        console.log('/history     - Show conversation history');
        console.log('/clear       - Clear conversation history');
        console.log('/metadata on - Show response metadata');
        console.log('/metadata off- Hide response metadata');
        console.log('/test        - Test specific CTA prompts');
        console.log('/examples    - Show example questions');
        console.log('exit/quit    - End chat session');
        break;

      case '/history':
        console.log('\n📚 Conversation History:');
        console.log('─'.repeat(40));
        if (this.conversationHistory.length === 0) {
          console.log('No conversation history yet.');
        } else {
          this.conversationHistory.forEach((msg, i) => {
            const role = msg.role === 'user' ? '👤 You' : '🤖 Bot';
            const content = msg.content.substring(0, 100) + (msg.content.length > 100 ? '...' : '');
            console.log(`${i + 1}. ${role}: ${content}`);
          });
        }
        break;

      case '/clear':
        this.conversationHistory = [];
        console.log('\n🧹 Conversation history cleared!');
        break;

      case '/metadata on':
        console.log('\n📊 Metadata display enabled');
        break;

      case '/metadata off':
        console.log('\n📊 Metadata display disabled');
        break;

      case '/test':
        await this.runCTATests();
        break;

      case '/examples':
        console.log('\n💡 Example Questions:');
        console.log('─'.repeat(40));
        console.log('• Who is Andrew in Wavelength?');
        console.log('• Tell me about Season 1 Episode 3');
        console.log('• What is the Ice Fortress?');
        console.log('• Describe the Goblin King');
        console.log('• What happens in the Battle of the Shire?');
        console.log('• Generate a tagline for Jewel');
        console.log('• Create a cliffhanger for "My Lucky Charm"');
        console.log('• What are the stakes for Daphne?');
        break;

      default:
        console.log(`\n❓ Unknown command: ${command}`);
        console.log('Type "/help" for available commands.');
    }
  }

  /**
   * Test CTA-specific prompts
   */
  async runCTATests() {
    console.log('\n🧪 Testing CTA-Style Prompts:');
    console.log('─'.repeat(50));
    
    const ctaTests = [
      {
        name: 'Character Tagline',
        prompt: 'Generate a compelling tagline (5-8 words max) for Andrew. Make it mysterious and character-specific. Return only the tagline.'
      },
      {
        name: 'Episode Cliffhanger', 
        prompt: 'What cliffhanger in "My Lucky Charm" would leave viewers wanting more? Write 1-2 compelling sentences.'
      },
      {
        name: 'Lore Hook',
        prompt: 'Create an intriguing hook about the Ice Fortress that makes readers curious. 1-2 sentences focusing on mystery.'
      }
    ];

    for (const test of ctaTests) {
      console.log(`\n🎯 ${test.name}:`);
      console.log(`📝 Prompt: ${test.prompt}`);
      console.log('🤔 Asking...');
      
      const result = await this.askChatbot(test.prompt);
      
      if (result.success) {
        console.log(`✅ Response: ${result.response}`);
        if (result.usage && result.usage.totalTokens) {
          console.log(`🧠 Tokens: ${result.usage.totalTokens}`);
        }
      } else {
        console.log(`❌ Error: ${result.error}`);
      }
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n🎉 CTA tests complete!');
  }

  /**
   * Run a batch of test questions (non-interactive mode)
   */
  async runBatchTest(questions) {
    console.log('🌊 WAVELENGTH CHATBOT BATCH TEST');
    console.log('================================');
    
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      console.log(`\n[${i + 1}/${questions.length}] 🤔 "${question}"`);
      
      const result = await this.askChatbot(question);
      this.displayResponse(result, true);
      
      // Rate limiting delay
      if (i < questions.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
}

// CLI execution
async function main() {
  const chatCLI = new WavelengthChatCLI();
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('🌊 WAVELENGTH CHATBOT INTERACTIVE CLI');
    console.log('====================================');
    console.log('');
    console.log('Usage:');
    console.log('  node wavelength-chat-cli.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --interactive, -i    Start interactive chat (default)');
    console.log('  --batch "q1" "q2"    Run batch questions');
    console.log('  --help, -h           Show this help');
    console.log('');
    console.log('Interactive Commands:');
    console.log('  /help               Show available commands');
    console.log('  /test               Test CTA-style prompts');
    console.log('  /examples           Show example questions');
    console.log('  /metadata on/off    Toggle response metadata');
    console.log('  exit/quit           End session');
    console.log('');
    console.log('Examples:');
    console.log('  node wavelength-chat-cli.js');
    console.log('  node wavelength-chat-cli.js --batch "Who is Andrew?" "Tell me about Season 1"');
    return;
  }
  
  if (args.includes('--batch')) {
    const batchIndex = args.indexOf('--batch');
    const questions = args.slice(batchIndex + 1);
    
    if (questions.length === 0) {
      console.log('❌ No questions provided for batch mode');
      console.log('Usage: node wavelength-chat-cli.js --batch "question 1" "question 2"');
      return;
    }
    
    await chatCLI.runBatchTest(questions);
  } else {
    // Default to interactive mode
    await chatCLI.startInteractiveChat();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { WavelengthChatCLI };