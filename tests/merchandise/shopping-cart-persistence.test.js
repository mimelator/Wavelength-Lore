#!/usr/bin/env node

/**
 * Shopping Cart Persistence Test
 * TDD: Write test first, then implement cart persistence feature
 */

const assert = require('assert');

// Mock DOM environment
global.document = {
  getElementById: () => ({ innerHTML: '' }),
  createElement: () => ({ classList: { add: () => {}, remove: () => {} } }),
  body: { appendChild: () => {} },
  addEventListener: () => {},
  querySelectorAll: () => []
};
global.window = { location: { hostname: 'localhost' } };
global.localStorage = {
  data: {},
  getItem: function(key) { return this.data[key] || null; },
  setItem: function(key, value) { this.data[key] = value; },
  removeItem: function(key) { delete this.data[key]; }
};

const MerchandiseStore = require('../../static/js/components/merchandise-store.js');

function runTests() {
  console.log('🧪 Running Shopping Cart Persistence Tests...');
  
  // Test 1: Load cart from localStorage on initialization
  try {
    localStorage.data = {};
    const cartData = [{ productId: 'test1', variantId: 'var1', quantity: 2, price: 1999 }];
    localStorage.setItem('merchandise-cart', JSON.stringify(cartData));
    
    const store = new MerchandiseStore();
    assert.deepEqual(store.cart, cartData);
    console.log('✅ Test 1 PASSED: Cart loaded from localStorage on init');
  } catch (error) {
    console.log('❌ Test 1 FAILED:', error.message);
  }
  
  // Test 2: Save cart when items added
  try {
    localStorage.data = {};
    const store = new MerchandiseStore();
    const mockProduct = { id: 'test1', variants: [{ id: 'var1', price: 1999 }] };
    store.products = [mockProduct];
    
    store.addToCart('test1', 'var1', 1);
    
    const saved = JSON.parse(localStorage.getItem('merchandise-cart'));
    assert.equal(saved.length, 1);
    console.log('✅ Test 2 PASSED: Cart saves to localStorage');
  } catch (error) {
    console.log('❌ Test 2 FAILED:', error.message);
  }
  
  console.log('\n📊 TDD Red Phase: Tests show cart persistence needs implementation');
}

runTests();