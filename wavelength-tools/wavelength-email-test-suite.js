#!/usr/bin/env node
/**
 * WAVELENGTH EMAIL TEST SUITE
 * ===========================
 * 
 * Comprehensive testing system for production email configuration
 * Tests all email providers and order confirmation functionality
 */

const emailService = require('../services/email-service');
const OrderEmailService = require('../services/order-email-service');

class EmailTestSuite {
  constructor() {
    this.testEmail = process.env.TEST_EMAIL || 'test@wavelengthlore.com';
    this.results = {
      passed: 0,
      failed: 0,
      details: []
    };
  }

  /**
   * Run all email tests
   */
  async runAllTests() {
    console.log('🌊 WAVELENGTH EMAIL TEST SUITE');
    console.log('===============================');
    console.log(`📧 Testing email delivery to: ${this.testEmail}`);
    console.log(`🔧 Email provider: ${process.env.EMAIL_PROVIDER || 'console'}`);
    console.log('');

    // Test 1: Basic email service configuration
    await this.testEmailServiceConfiguration();

    // Test 2: Order confirmation email template
    await this.testOrderConfirmationTemplate();

    // Test 3: Email delivery (if not console mode)
    if (process.env.EMAIL_PROVIDER !== 'console') {
      await this.testEmailDelivery();
    }

    // Test 4: Order email service
    await this.testOrderEmailService();

    // Test 5: Complete order flow simulation
    await this.testCompleteOrderFlow();

    this.printResults();
  }

  /**
   * Test email service configuration
   */
  async testEmailServiceConfiguration() {
    console.log('🔍 Test 1: Email Service Configuration');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
      const provider = process.env.EMAIL_PROVIDER || 'console';
      const fromEmail = process.env.FROM_EMAIL || 'orders@wavelengthlore.com';
      const supportEmail = process.env.SUPPORT_EMAIL || 'support@wavelengthlore.com';

      console.log(`✅ Provider: ${provider}`);
      console.log(`✅ From Email: ${fromEmail}`);
      console.log(`✅ Support Email: ${supportEmail}`);

      // Check provider-specific configuration
      if (provider === 'sendgrid') {
        if (process.env.SENDGRID_API_KEY) {
          console.log('✅ SendGrid API Key: Configured');
        } else {
          throw new Error('SendGrid API key not configured');
        }
      }

      if (provider === 'ses') {
        if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
          console.log('✅ AWS SES Credentials: Configured');
          console.log(`✅ AWS SES Region: ${process.env.AWS_SES_REGION || 'us-east-1'}`);
        } else {
          throw new Error('AWS SES credentials not configured');
        }
      }

      this.recordResult('Email Service Configuration', true);
    } catch (error) {
      console.error(`❌ Configuration Error: ${error.message}`);
      this.recordResult('Email Service Configuration', false, error.message);
    }

    console.log('');
  }

  /**
   * Test order confirmation email template
   */
  async testOrderConfirmationTemplate() {
    console.log('🔍 Test 2: Order Confirmation Template');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
      const testOrderData = this.generateTestOrderData();
      const emailContent = emailService.generateOrderConfirmationEmail(testOrderData);

      // Verify email content contains essential elements
      const requiredElements = [
        'Order Confirmed!',
        testOrderData.orderId,
        testOrderData.customerData.firstName,
        testOrderData.shippingAddress.firstName, // Use shipping address for email template
        testOrderData.items[0].title,
        testOrderData.total.toFixed(2)
      ];

      for (const element of requiredElements) {
        if (!emailContent.includes(element)) {
          throw new Error(`Missing required element: ${element}`);
        }
      }

      console.log('✅ Email template generated successfully');
      console.log('✅ All required order elements present');
      console.log(`✅ Email size: ${(emailContent.length / 1024).toFixed(1)}KB`);

      this.recordResult('Order Confirmation Template', true);
    } catch (error) {
      console.error(`❌ Template Error: ${error.message}`);
      this.recordResult('Order Confirmation Template', false, error.message);
    }

    console.log('');
  }

  /**
   * Test actual email delivery
   */
  async testEmailDelivery() {
    console.log('🔍 Test 3: Email Delivery');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
      const testOrderData = this.generateTestOrderData();
      
      console.log(`📧 Sending test email to: ${this.testEmail}`);
      
      await emailService.sendOrderConfirmation(testOrderData, this.testEmail);
      
      console.log('✅ Email sent successfully');
      console.log('📧 Check your email inbox for the test order confirmation');
      
      this.recordResult('Email Delivery', true);
    } catch (error) {
      console.error(`❌ Delivery Error: ${error.message}`);
      this.recordResult('Email Delivery', false, error.message);
    }

    console.log('');
  }

  /**
   * Test order email service (nodemailer-based)
   */
  async testOrderEmailService() {
    console.log('🔍 Test 4: Order Email Service');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
      const orderEmailService = new OrderEmailService();
      const testOrderData = this.generateTestOrderData();

      // Test HTML generation
      const htmlContent = orderEmailService.generateOrderConfirmationHTML(testOrderData);
      const textContent = orderEmailService.generateOrderConfirmationText(testOrderData);

      console.log('✅ HTML email template generated');
      console.log('✅ Text email template generated');
      console.log(`✅ HTML size: ${(htmlContent.length / 1024).toFixed(1)}KB`);
      console.log(`✅ Text size: ${(textContent.length / 1024).toFixed(1)}KB`);

      // Test email sending (only if transporter is available)
      if (process.env.EMAIL_PROVIDER !== 'console') {
        console.log(`📧 Sending test via OrderEmailService to: ${this.testEmail}`);
        const result = await orderEmailService.sendOrderConfirmation({
          ...testOrderData,
          customerData: { ...testOrderData.customerData, email: this.testEmail }
        });

        if (result.success) {
          console.log('✅ OrderEmailService delivery successful');
        } else {
          throw new Error(result.error);
        }
      } else {
        console.log('ℹ️  Skipping OrderEmailService delivery test (console mode)');
      }

      this.recordResult('Order Email Service', true);
    } catch (error) {
      console.error(`❌ OrderEmailService Error: ${error.message}`);
      this.recordResult('Order Email Service', false, error.message);
    }

    console.log('');
  }

  /**
   * Test complete order flow simulation
   */
  async testCompleteOrderFlow() {
    console.log('🔍 Test 5: Complete Order Flow Simulation');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
      const testOrderData = this.generateTestOrderData();
      
      console.log('🛒 Simulating complete order flow...');
      console.log(`📦 Order ID: ${testOrderData.orderId}`);
      console.log(`💰 Total: $${testOrderData.total.toFixed(2)}`);
      console.log(`📧 Customer: ${testOrderData.customerData.email}`);
      console.log(`📍 Shipping to: ${testOrderData.shippingAddress.city}, ${testOrderData.shippingAddress.state}`);

      // Simulate the order confirmation process
      if (process.env.EMAIL_PROVIDER !== 'console') {
        await emailService.sendOrderConfirmation(testOrderData, this.testEmail);
        console.log('✅ Order confirmation email sent');
      }

      console.log('✅ Order flow simulation completed');

      this.recordResult('Complete Order Flow', true);
    } catch (error) {
      console.error(`❌ Order Flow Error: ${error.message}`);
      this.recordResult('Complete Order Flow', false, error.message);
    }

    console.log('');
  }

  /**
   * Generate test order data
   */
  generateTestOrderData() {
    const orderId = `TEST-${Date.now()}`;
    
    return {
      orderId: orderId,
      paymentId: `pi_test_${Date.now()}`,
      amount: 59.98,
      customerData: {
        firstName: 'Test',
        lastName: 'Customer',
        email: this.testEmail,
        address: '123 Test Street',
        city: 'Test City',
        state: 'TC',
        zip: '12345',
        country: 'US'
      },
      shippingAddress: {
        firstName: 'Test',
        lastName: 'Customer',
        address1: '123 Test Street',
        city: 'Test City',
        state: 'TC',
        zip: '12345',
        country: 'US'
      },
      items: [
        {
          title: 'Wavelength Lore Premium T-Shirt',
          price: 29.99,
          quantity: 2,
          selectedSize: 'L',
          selectedColor: 'Cosmic Blue',
          image: 'https://wavelengthlore.com/images/previews/generic-product-preview.svg'
        }
      ],
      subtotal: 59.98,
      tax: 4.80,
      total: 64.78,
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Record test result
   */
  recordResult(testName, passed, error = null) {
    if (passed) {
      this.results.passed++;
    } else {
      this.results.failed++;
    }
    
    this.results.details.push({
      test: testName,
      passed: passed,
      error: error,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Print test results summary
   */
  printResults() {
    console.log('📊 WAVELENGTH EMAIL TEST RESULTS');
    console.log('================================');
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📈 Success Rate: ${((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1)}%`);
    
    if (this.results.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      console.log('━━━━━━━━━━━━━━━');
      this.results.details
        .filter(result => !result.passed)
        .forEach(result => {
          console.log(`• ${result.test}: ${result.error}`);
        });
    }

    console.log('\n🌊 Email testing complete!');
    
    if (process.env.EMAIL_PROVIDER !== 'console') {
      console.log(`📧 Check ${this.testEmail} for test emails`);
    }
  }
}

// Run the test suite
async function main() {
  const testSuite = new EmailTestSuite();
  await testSuite.runAllTests();
}

// Execute if run directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = EmailTestSuite;