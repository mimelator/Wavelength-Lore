const puppeteer = require('puppeteer');
const chalk = require('chalk');

async function debugChatWidget() {
  console.log(chalk.blue('🔍 Debug: Analyzing Chat Widget'));
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log(chalk.gray('📍 Navigating to localhost chatbot widget...'));
    await page.goto('http://localhost:3001/chatbot/widget', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for page to fully load
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log(chalk.blue('🔍 Analyzing page structure...'));
    
    // Get all input and textarea elements
    const inputs = await page.evaluate(() => {
      const elements = [];
      
      // Get all inputs
      document.querySelectorAll('input').forEach((input, index) => {
        elements.push({
          type: 'input',
          index,
          tagName: input.tagName.toLowerCase(),
          type_attr: input.type,
          id: input.id,
          className: input.className,
          placeholder: input.placeholder,
          name: input.name,
          visible: window.getComputedStyle(input).display !== 'none'
        });
      });
      
      // Get all textareas
      document.querySelectorAll('textarea').forEach((textarea, index) => {
        elements.push({
          type: 'textarea',
          index,
          tagName: textarea.tagName.toLowerCase(),
          id: textarea.id,
          className: textarea.className,
          placeholder: textarea.placeholder,
          name: textarea.name,
          visible: window.getComputedStyle(textarea).display !== 'none'
        });
      });
      
      return elements;
    });
    
    console.log(chalk.green('✅ Found input elements:'));
    inputs.forEach(input => {
      const visibility = input.visible ? chalk.green('visible') : chalk.red('hidden');
      console.log(chalk.gray(`  ${input.type}[${input.index}]: ${input.tagName}`));
      console.log(chalk.gray(`    ID: ${input.id || 'none'}`));
      console.log(chalk.gray(`    Class: ${input.className || 'none'}`));
      console.log(chalk.gray(`    Placeholder: ${input.placeholder || 'none'}`));
      console.log(chalk.gray(`    Type: ${input.type_attr || 'text'}`));
      console.log(chalk.gray(`    Status: ${visibility}`));
      console.log('');
    });
    
    // Look for chat-related elements
    const chatElements = await page.evaluate(() => {
      const elements = [];
      
      // Common chat selectors
      const selectors = [
        '.chat-widget', '.chatbot', '.chat-container', '.chat-interface',
        '#chat', '.vip-chatbot-container', '.chatbot-frame',
        '[id*="chat"]', '[class*="chat"]', '[class*="bot"]'
      ];
      
      selectors.forEach(selector => {
        try {
          const els = document.querySelectorAll(selector);
          els.forEach((el, index) => {
            elements.push({
              selector,
              index,
              id: el.id,
              className: el.className,
              tagName: el.tagName.toLowerCase(),
              visible: window.getComputedStyle(el).display !== 'none',
              hasChildren: el.children.length > 0
            });
          });
        } catch (e) {
          // Invalid selector
        }
      });
      
      return elements;
    });
    
    console.log(chalk.blue('🤖 Found chat-related elements:'));
    chatElements.forEach(el => {
      const visibility = el.visible ? chalk.green('visible') : chalk.red('hidden');
      console.log(chalk.gray(`  ${el.selector}: ${el.tagName}`));
      console.log(chalk.gray(`    ID: ${el.id || 'none'}`));
      console.log(chalk.gray(`    Class: ${el.className || 'none'}`));
      console.log(chalk.gray(`    Children: ${el.hasChildren ? 'yes' : 'no'}`));
      console.log(chalk.gray(`    Status: ${visibility}`));
      console.log('');
    });
    
    // Wait for user to examine the page
    console.log(chalk.yellow('🔍 Browser window is open - examine the page manually'));
    console.log(chalk.gray('Press Enter to continue...'));
    
    // Keep browser open for manual inspection
    await new Promise(resolve => {
      process.stdin.once('data', () => resolve());
    });
    
  } catch (error) {
    console.error(chalk.red('❌ Debug failed:'), error.message);
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  debugChatWidget().catch(console.error);
}

module.exports = { debugChatWidget };