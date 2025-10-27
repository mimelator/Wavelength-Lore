#!/usr/bin/env node

/**
 * 🌊 WAVELENGTH STRIPE PAYMENT INTEGRATION TEST
 * 
 * Test script to verify Stripe payment service is working correctly
 * Tests: Connection, payment intent creation, order calculations
 */

require('dotenv').config();
const stripePaymentService = require('./services/stripe-payment-service');

async function runStripeTests() {
  console.log('🌊 WAVELENGTH STRIPE INTEGRATION TEST\n');
  console.log('═'.repeat(50));

  // Test 1: Health Check
  console.log('\n🔍 TEST 1: Stripe Connection Health Check');
  try {
    const health = await stripePaymentService.healthCheck();
    if (health.success) {
      console.log('✅ Stripe connection successful');
      console.log(`   Mode: ${health.testMode ? 'TEST' : 'LIVE'}`);
    } else {
      console.log('❌ Stripe connection failed:', health.error);
      return;
    }
  } catch (error) {
    console.log('❌ Health check error:', error.message);
    return;
  }

  // Test 2: Order Total Calculation
  console.log('\n🧮 TEST 2: Order Total Calculation');
  const testItems = [
    { price: 25.99, quantity: 1, name: "Wavelength T-Shirt" },
    { price: 15.50, quantity: 2, name: "Wavelength Sticker Pack" }
  ];
  
  const testAddress = {
    state: 'CA',
    country: 'US'
  };

  try {
    const orderTotal = stripePaymentService.calculateOrderTotal(testItems, testAddress, 5.99);
    console.log('✅ Order calculation successful:');
    console.log(`   Subtotal: $${orderTotal.subtotal}`);
    console.log(`   Tax (${(orderTotal.taxRate * 100).toFixed(1)}%): $${orderTotal.taxAmount}`);
    console.log(`   Shipping: $${orderTotal.shippingCost}`);
    console.log(`   Total: $${orderTotal.total}`);
  } catch (error) {
    console.log('❌ Order calculation failed:', error.message);
  }

  // Test 3: Payment Intent Creation
  console.log('\n💳 TEST 3: Payment Intent Creation');
  try {
    const paymentIntent = await stripePaymentService.createPaymentIntent(
      29.99, 
      'usd',
      { test: 'true', orderId: 'test-' + Date.now() }
    );
    
    if (paymentIntent.success) {
      console.log('✅ Payment intent created successfully:');
      console.log(`   Amount: $${paymentIntent.amount}`);
      console.log(`   Payment Intent ID: ${paymentIntent.paymentIntentId}`);
      console.log(`   Client Secret: ${paymentIntent.clientSecret?.substring(0, 30)}...`);
    } else {
      console.log('❌ Payment intent creation failed:', paymentIntent.error);
    }
  } catch (error) {
    console.log('❌ Payment intent test error:', error.message);
  }

  // Test 4: Test Cards Information
  console.log('\n🃏 TEST 4: Available Test Cards');
  const testCards = stripePaymentService.getTestCards();
  if (testCards.success) {
    console.log('✅ Test cards available:');
    console.log(`   Success: ${testCards.success}`);
    console.log(`   Declined: ${testCards.declined}`);
    console.log(`   Requires Auth: ${testCards.requiresAuth}`);
    console.log(`   Insufficient Funds: ${testCards.insufficientFunds}`);
  } else {
    console.log('ℹ️ Test cards not available (live mode)');
  }

  // Test 5: Environment Check
  console.log('\n⚙️ TEST 5: Environment Configuration');
  console.log('✅ Environment variables:');
  console.log(`   STRIPE_SECRET_KEY: ${process.env.STRIPE_SECRET_KEY ? '✓ Set' : '❌ Missing'}`);
  console.log(`   STRIPE_PUBLISHABLE_KEY: ${process.env.STRIPE_PUBLISHABLE_KEY ? '✓ Set' : '❌ Missing'}`);
  console.log(`   STRIPE_ENVIRONMENT: ${process.env.STRIPE_ENVIRONMENT || 'Not set'}`);
  console.log(`   STRIPE_WEBHOOK_SECRET: ${process.env.STRIPE_WEBHOOK_SECRET ? '✓ Set' : '⚠️ Optional (not set)'}`);

  console.log('\n═'.repeat(50));
  console.log('🌊 STRIPE INTEGRATION TEST COMPLETE!');
  console.log('\n🚀 NEXT STEPS:');
  console.log('   1. Test frontend checkout flow');
  console.log('   2. Use test card: 4242424242424242');
  console.log('   3. Check order creation in browser');
  console.log('   4. Verify Printify integration');
}

// Run tests
if (require.main === module) {
  runStripeTests().catch(console.error);
}

module.exports = { runStripeTests };