#!/usr/bin/env node

/**
 * WAVELENGTH Duplicate Add to Cart Debugger
 * 
 * Diagnoses why add-to-cart events are firing twice
 */

console.log('🔍 WAVELENGTH: Debugging duplicate add-to-cart events...');

const fs = require('fs');
const path = require('path');

// Check for duplicate event listener setup patterns
console.log('\n📋 Test 1: Event Listener Duplication Patterns');

try {
  // Check merchandise-store.js for multiple setupEventListeners calls
  const storePath = path.join(__dirname, 'static/js/components/merchandise-store.js');
  const storeContent = fs.readFileSync(storePath, 'utf8');
  
  // Count how many times setupEventListeners is called
  const setupCallsPattern = /setupEventListeners\(/g;
  const setupCalls = storeContent.match(setupCallsPattern) || [];
  
  console.log(`📊 setupEventListeners() called ${setupCalls.length} times in store`);
  
  // Look for specific patterns that might cause duplication
  const renderPattern = /render\(\)[^}]*setupEventListeners/gs;
  const renderSetupMatches = storeContent.match(renderPattern) || [];
  
  const updateUIPattern = /updateCartUI\(\)[^}]*setupEventListeners/gs;
  const updateUIMatches = storeContent.match(updateUIPattern) || [];
  
  console.log(`🔄 setupEventListeners in render(): ${renderSetupMatches.length} matches`);
  console.log(`🔄 setupEventListeners in updateCartUI(): ${updateUIMatches.length} matches`);
  
  // Check if render() calls setupEventListeners directly
  const mainRenderMatch = storeContent.match(/render\(\)\s*{[^}]*}/gs);
  if (mainRenderMatch) {
    const hasDirectSetup = mainRenderMatch[0].includes('setupEventListeners');
    console.log(`🎯 render() directly calls setupEventListeners: ${hasDirectSetup}`);
  }
  
} catch (error) {
  console.log('❌ Error analyzing store patterns:', error.message);
}

// Check for add-to-cart button duplication
console.log('\n📋 Test 2: Add-to-Cart Button Event Setup');

try {
  // Check if product card renderer sets up duplicate listeners
  const productCardPath = path.join(__dirname, 'static/js/components/merchandise-product-card-renderer.js');
  
  if (fs.existsSync(productCardPath)) {
    const productCardContent = fs.readFileSync(productCardPath, 'utf8');
    
    const addToCartPattern = /add.*to.*cart/gi;
    const addToCartMatches = productCardContent.match(addToCartPattern) || [];
    
    console.log(`🛒 "add to cart" references in product card: ${addToCartMatches.length}`);
    
    // Check for event listener setup in product card renderer
    const hasEventSetup = productCardContent.includes('addEventListener') || 
                         productCardContent.includes('setupEventListeners');
    
    console.log(`🎧 Product card has event listeners: ${hasEventSetup}`);
  }
  
  // Check main store for add-to-cart handling
  const storePath = path.join(__dirname, 'static/js/components/merchandise-store.js');
  const storeContent = fs.readFileSync(storePath, 'utf8');
  
  const addToCartHandlers = storeContent.match(/handleAddToCart|addToCart/g) || [];
  console.log(`🛒 Add to cart handlers in store: ${addToCartHandlers.length}`);
  
  // Check for event bus listeners
  const eventBusListeners = storeContent.match(/eventBus\.on.*cart\.add/g) || [];
  console.log(`📡 Event bus cart.add listeners: ${eventBusListeners.length}`);
  
} catch (error) {
  console.log('❌ Error analyzing add-to-cart setup:', error.message);
}

// Check for cart update event patterns
console.log('\n📋 Test 3: Cart Update Event Patterns');

try {
  const storePath = path.join(__dirname, 'static/js/components/merchandise-store.js');
  const storeContent = fs.readFileSync(storePath, 'utf8');
  
  // Look for cart.updated event handling
  const cartUpdatedPattern = /eventBus\.on\s*\(\s*['"]cart\.updated['"][^}]*}/gs;
  const cartUpdatedHandlers = storeContent.match(cartUpdatedPattern) || [];
  
  console.log(`📊 cart.updated event handlers: ${cartUpdatedHandlers.length}`);
  
  if (cartUpdatedHandlers.length > 0) {
    cartUpdatedHandlers.forEach((handler, i) => {
      const callsUpdateCartUI = handler.includes('updateCartUI');
      const callsRender = handler.includes('render()');
      console.log(`   Handler ${i+1}: calls updateCartUI=${callsUpdateCartUI}, calls render=${callsRender}`);
    });
  }
  
  // Check if updateCartUI is called multiple times per cart update
  const updateCartUIPattern = /updateCartUI\(\)/g;
  const updateCartUICalls = storeContent.match(updateCartUIPattern) || [];
  console.log(`🔄 updateCartUI() called ${updateCartUICalls.length} times total in store`);
  
} catch (error) {
  console.log('❌ Error analyzing cart update patterns:', error.message);
}

console.log('\n🎯 LIKELY CAUSES OF DUPLICATE EVENTS:');
console.log('1. setupEventListeners() called multiple times on same elements');
console.log('2. Event listeners not removed before re-adding');
console.log('3. render() and updateCartUI() both setting up listeners');
console.log('4. Event bubbling causing double triggers');

console.log('\n💡 SOLUTIONS TO TRY:');
console.log('1. Remove existing event listeners before adding new ones');
console.log('2. Use event.preventDefault() and event.stopPropagation()'); 
console.log('3. Add debouncing to prevent rapid double-clicks');
console.log('4. Ensure setupEventListeners() is only called once per render cycle');

console.log('\n🌊 WAVELENGTH duplicate event debugging complete!');