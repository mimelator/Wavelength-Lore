/**
 * 🌊 WAVELENGTH STRIPE PAYMENT SERVICE
 * 
 * Real payment processing integration replacing mock functionality
 * Features: Payment intents, tax calculation, error handling, test mode support
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class StripePaymentService {
  constructor() {
    this.isTestMode = process.env.STRIPE_ENVIRONMENT === 'test';
    console.log(`🔑 Stripe Payment Service initialized in ${this.isTestMode ? 'TEST' : 'LIVE'} mode`);
  }

  /**
   * Create a payment intent for checkout
   * @param {number} amount - Amount in dollars (will be converted to cents)
   * @param {string} currency - Currency code (default: 'usd')
   * @param {object} metadata - Additional order information
   * @returns {object} Payment intent with client secret
   */
  async createPaymentIntent(amount, currency = 'usd', metadata = {}) {
    try {
      const amountInCents = Math.round(amount * 100);
      
      console.log(`💳 Creating payment intent: $${amount} (${amountInCents} cents)`);
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: currency.toLowerCase(),
        automatic_payment_methods: { enabled: true },
        metadata: {
          ...metadata,
          wavelength_order: 'true',
          environment: this.isTestMode ? 'test' : 'live'
        }
      });

      return {
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: amount,
        amountInCents: amountInCents
      };
    } catch (error) {
      console.error('❌ Stripe payment intent creation failed:', error);
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  }

  /**
   * Retrieve and confirm payment status
   * @param {string} paymentIntentId - Stripe payment intent ID
   * @returns {object} Payment confirmation result
   */
  async confirmPayment(paymentIntentId) {
    try {
      console.log(`🔍 Confirming payment intent: ${paymentIntentId}`);
      
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      const result = {
        success: paymentIntent.status === 'succeeded',
        paymentId: paymentIntent.id,
        amount: paymentIntent.amount / 100, // Convert back to dollars
        status: paymentIntent.status,
        currency: paymentIntent.currency
      };

      if (paymentIntent.status === 'succeeded') {
        console.log(`✅ Payment confirmed: ${paymentIntent.id}, $${result.amount}`);
      } else {
        console.log(`⏳ Payment status: ${paymentIntent.status}`);
      }

      return result;
    } catch (error) {
      console.error('❌ Payment confirmation failed:', error);
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  }

  /**
   * Calculate total order amount including tax and shipping
   * @param {array} lineItems - Cart items with prices
   * @param {object} shippingAddress - Shipping address for tax calculation
   * @param {number} shippingCost - Shipping cost in dollars
   * @returns {object} Order total breakdown
   */
  calculateOrderTotal(lineItems, shippingAddress, shippingCost = 0) {
    try {
      // Calculate subtotal
      const subtotal = lineItems.reduce((total, item) => {
        const itemPrice = typeof item.price === 'string' ? 
          parseFloat(item.price.replace('$', '')) : item.price;
        const quantity = item.quantity || 1;
        return total + (itemPrice * quantity);
      }, 0);

      // Simple tax calculation (8% - replace with Stripe Tax for production)
      const taxRate = this.calculateTaxRate(shippingAddress);
      const taxAmount = subtotal * taxRate;
      
      const total = subtotal + taxAmount + shippingCost;

      console.log(`📊 Order total calculation: Subtotal: $${subtotal.toFixed(2)}, Tax: $${taxAmount.toFixed(2)}, Shipping: $${shippingCost.toFixed(2)}, Total: $${total.toFixed(2)}`);

      return {
        subtotal: Math.round(subtotal * 100) / 100,
        taxAmount: Math.round(taxAmount * 100) / 100,
        taxRate: taxRate,
        shippingCost: shippingCost,
        total: Math.round(total * 100) / 100
      };
    } catch (error) {
      console.error('❌ Order total calculation failed:', error);
      throw new Error('Failed to calculate order total');
    }
  }

  /**
   * Simple tax rate calculation (replace with Stripe Tax for production)
   * @param {object} shippingAddress - Address for tax calculation
   * @returns {number} Tax rate as decimal (e.g., 0.08 for 8%)
   */
  calculateTaxRate(shippingAddress) {
    // Simplified tax calculation - in production, use Stripe Tax
    const state = shippingAddress?.state?.toUpperCase();
    
    // Basic US state tax rates (simplified)
    const taxRates = {
      'CA': 0.0825, // California
      'NY': 0.08,   // New York
      'TX': 0.0625, // Texas
      'FL': 0.06,   // Florida
      'WA': 0.065,  // Washington
      'OR': 0.0,    // Oregon (no sales tax)
    };

    return taxRates[state] || 0.07; // Default 7% for other states
  }

  /**
   * Process a complete payment (for backward compatibility)
   * @param {string} paymentToken - Payment method or intent ID
   * @param {array} lineItems - Cart items
   * @param {object} shippingAddress - Shipping address
   * @param {number} shippingCost - Shipping cost
   * @returns {object} Payment processing result
   */
  async processPayment(paymentToken, lineItems, shippingAddress, shippingCost = 0) {
    try {
      console.log('🌊 Processing Wavelength payment:', { 
        paymentToken: paymentToken?.substring(0, 20) + '...',
        itemCount: lineItems?.length || 0,
        shippingCost 
      });

      // If paymentToken looks like a payment intent ID, confirm it
      if (paymentToken && paymentToken.startsWith('pi_')) {
        return await this.confirmPayment(paymentToken);
      }

      // Calculate order total
      const orderTotal = this.calculateOrderTotal(lineItems, shippingAddress, shippingCost);
      
      // Create payment intent for the total amount
      const paymentIntent = await this.createPaymentIntent(
        orderTotal.total,
        'usd',
        {
          itemCount: lineItems?.length || 0,
          subtotal: orderTotal.subtotal.toString(),
          taxAmount: orderTotal.taxAmount.toString(),
          shippingCost: orderTotal.shippingCost.toString()
        }
      );

      if (!paymentIntent.success) {
        return paymentIntent; // Return error
      }

      return {
        success: true,
        paymentId: paymentIntent.paymentIntentId,
        amount: orderTotal.total,
        clientSecret: paymentIntent.clientSecret,
        orderTotal: orderTotal,
        requiresAction: true // Frontend needs to complete payment
      };

    } catch (error) {
      console.error('❌ Payment processing failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get test card numbers for development
   * @returns {object} Test card information
   */
  getTestCards() {
    if (!this.isTestMode) {
      return { error: 'Test cards only available in test mode' };
    }

    return {
      success: '4242424242424242',
      declined: '4000000000000002',
      requiresAuth: '4000002500003155',
      insufficientFunds: '4000000000009995',
      expiry: '12/34',
      cvc: '123'
    };
  }

  /**
   * Health check for Stripe connection
   * @returns {object} Connection status
   */
  async healthCheck() {
    try {
      // Try to list payment methods (limited to 1 for efficiency)
      await stripe.paymentMethods.list({ limit: 1 });
      
      return {
        success: true,
        message: `Stripe ${this.isTestMode ? 'test' : 'live'} connection OK`,
        testMode: this.isTestMode
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        testMode: this.isTestMode
      };
    }
  }

  /**
   * Verify webhook signature and parse event
   * @param {string} payload - Raw webhook payload
   * @param {string} signature - Stripe signature header
   * @returns {object} Verified webhook event
   */
  verifyWebhookSignature(payload, signature) {
    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      
      if (!webhookSecret) {
        console.warn('⚠️ STRIPE_WEBHOOK_SECRET not configured - webhook verification disabled');
        return { 
          success: true, 
          event: JSON.parse(payload),
          verified: false 
        };
      }

      // Verify webhook signature
      const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      
      console.log(`✅ Webhook signature verified: ${event.type}`);
      
      return {
        success: true,
        event: event,
        verified: true
      };
    } catch (error) {
      console.error('❌ Webhook signature verification failed:', error.message);
      return {
        success: false,
        error: error.message,
        verified: false
      };
    }
  }

  /**
   * Process webhook event and return action to take
   * @param {object} event - Stripe webhook event
   * @returns {object} Processing result with actions
   */
  processWebhookEvent(event) {
    try {
      const { type, data } = event;
      const paymentIntent = data.object;

      console.log(`🔔 Processing webhook: ${type} for ${paymentIntent.id}`);

      const result = {
        success: true,
        eventType: type,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        status: paymentIntent.status,
        actions: []
      };

      // Determine what actions to take based on event type
      switch (type) {
        case 'payment_intent.succeeded':
          result.actions.push('update_order_status_paid');
          result.actions.push('send_confirmation_email');
          result.actions.push('trigger_fulfillment');
          console.log(`💰 Payment succeeded: ${paymentIntent.id}, $${result.amount}`);
          break;

        case 'payment_intent.payment_failed':
          result.actions.push('update_order_status_failed');
          result.actions.push('send_failure_email');
          result.actions.push('release_inventory');
          console.log(`❌ Payment failed: ${paymentIntent.id}, reason: ${paymentIntent.last_payment_error?.message || 'Unknown'}`);
          break;

        case 'payment_intent.canceled':
          result.actions.push('update_order_status_canceled');
          result.actions.push('release_inventory');
          console.log(`🚫 Payment canceled: ${paymentIntent.id}`);
          break;

        case 'payment_intent.requires_action':
          result.actions.push('update_order_status_pending');
          result.actions.push('send_action_required_email');
          console.log(`🔐 Payment requires action: ${paymentIntent.id}`);
          break;

        default:
          console.log(`ℹ️ Unhandled webhook event: ${type}`);
          result.actions.push('log_event');
          break;
      }

      return result;
    } catch (error) {
      console.error('❌ Webhook event processing failed:', error);
      return {
        success: false,
        error: error.message,
        eventType: event?.type || 'unknown'
      };
    }
  }

  /**
   * Create a refund for a payment
   * @param {string} paymentIntentId - Payment intent to refund
   * @param {number} amount - Amount to refund (optional, full refund if not specified)
   * @param {string} reason - Reason for refund
   * @returns {object} Refund result
   */
  async createRefund(paymentIntentId, amount = null, reason = 'requested_by_customer') {
    try {
      console.log(`💸 Creating refund for payment: ${paymentIntentId}`);

      const refundData = {
        payment_intent: paymentIntentId,
        reason: reason
      };

      if (amount) {
        refundData.amount = Math.round(amount * 100); // Convert to cents
      }

      const refund = await stripe.refunds.create(refundData);

      console.log(`✅ Refund created: ${refund.id}, amount: $${refund.amount / 100}`);

      return {
        success: true,
        refundId: refund.id,
        amount: refund.amount / 100,
        status: refund.status
      };
    } catch (error) {
      console.error('❌ Refund creation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
const stripePaymentService = new StripePaymentService();
module.exports = stripePaymentService;