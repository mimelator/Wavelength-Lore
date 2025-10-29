#!/usr/bin/env node
/**
 * WAVELENGTH EMAIL TEMPLATE DEBUGGER
 * ==================================
 * 
 * Debug email template generation to see actual content
 */

const emailService = require('../services/email-service');

// Generate test order data
const testOrderData = {
  orderId: `DEBUG-${Date.now()}`,
  paymentId: `pi_debug_${Date.now()}`,
  amount: 59.98,
  customerData: {
    firstName: 'Debug',
    lastName: 'Customer',
    email: 'debug@wavelengthlore.com',
    address: '123 Debug Street',
    city: 'Debug City',
    state: 'DC',
    zip: '12345',
    country: 'US'
  },
  shippingAddress: {
    firstName: 'Debug',
    lastName: 'Customer',
    address1: '123 Debug Street',
    city: 'Debug City',
    state: 'DC',
    zip: '12345',
    country: 'US'
  },
  items: [
    {
      title: 'Wavelength Debug T-Shirt',
      price: 29.99,
      quantity: 2,
      selectedSize: 'L',
      selectedColor: 'Debug Blue',
      image: 'https://wavelengthlore.com/images/previews/generic-product-preview.svg'
    }
  ],
  subtotal: 59.98,
  tax: 4.80,
  total: 64.78,
  status: 'confirmed',
  createdAt: new Date().toISOString()
};

console.log('🌊 WAVELENGTH EMAIL TEMPLATE DEBUGGER');
console.log('=====================================');
console.log('');
console.log('📊 Test Order Data:');
console.log(`Order ID: ${testOrderData.orderId}`);
console.log(`Total: $${testOrderData.total.toFixed(2)}`);
console.log('');

// Generate email content
const emailContent = emailService.generateOrderConfirmationEmail(testOrderData);

console.log('📄 Generated Email Content (first 500 chars):');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(emailContent.substring(0, 500));
console.log('...[truncated]');
console.log('');

// Check for specific elements
const searchElements = [
  'Order Confirmed!',
  testOrderData.orderId,
  testOrderData.customerData.firstName,
  testOrderData.customerData.email,
  testOrderData.items[0].title,
  testOrderData.total.toFixed(2),
  '$64.78',
  '64.78'
];

console.log('🔍 Element Search Results:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
for (const element of searchElements) {
  const found = emailContent.includes(element);
  console.log(`${found ? '✅' : '❌'} "${element}": ${found ? 'FOUND' : 'NOT FOUND'}`);
}

console.log('');
console.log('💾 Full email content saved to debug-email.html');

// Save full content to file for inspection
const fs = require('fs');
fs.writeFileSync('./debug-email.html', emailContent);

console.log('🌊 Debug complete!');