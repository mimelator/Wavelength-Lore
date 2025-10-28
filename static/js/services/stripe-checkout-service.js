/**
 * StripeCheckoutService
 * Handles Stripe Payment Element integration and payment processing
 */
class StripeCheckoutService {
  constructor() {
    this.stripe = null;
    this.elements = null;
    this.paymentElement = null;
    this.clientSecret = null;
    this.paymentIntentId = null;
    this.isProcessing = false;
    this.isReady = false;

    console.log('💳 StripeCheckoutService initializing...');
    this.initializeStripe();
  }

  /**
   * Initialize Stripe with public key
   */
  initializeStripe() {
    if (!window.Stripe) {
      console.error('❌ Stripe.js library not loaded');
      return;
    }

    // Use the public key from environment - in production this comes from server
    // For now, we'll load it via fetch from a configuration endpoint
    this.loadStripeConfig();
  }

  /**
   * Load Stripe configuration from server
   */
  async loadStripeConfig() {
    try {
      const response = await fetch('/api/merchandise/payment-health');
      const data = await response.json();

      if (data.stripePublicKey) {
        this.stripe = window.Stripe(data.stripePublicKey);
        this.isReady = true;
        console.log('✅ Stripe initialized with public key');
      } else {
        console.error('❌ Stripe public key not available from server');
      }
    } catch (error) {
      console.error('❌ Failed to load Stripe config:', error);
    }
  }

  /**
   * Wait for Stripe to be ready
   */
  async waitForReady() {
    if (this.isReady) return true;
    
    // Poll until ready or timeout
    for (let i = 0; i < 50; i++) {
      if (this.isReady) return true;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.error('❌ Stripe initialization timeout');
    return false;
  }

  /**
   * Create Stripe Elements instance
   */
  createElements() {
    if (!this.stripe) {
      console.error('❌ Stripe not initialized');
      return false;
    }

    if (!this.clientSecret) {
      console.error('❌ Client secret not available - call createPaymentIntent first');
      return false;
    }

    if (!this.elements) {
      this.elements = this.stripe.elements({
        clientSecret: this.clientSecret,
        appearance: {
          theme: 'flat',
          variables: {
            colorPrimary: '#667eea',
            colorBackground: '#ffffff',
            colorText: '#333333',
            colorDanger: '#dc3545',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            spacingUnit: '4px',
            borderRadius: '8px'
          }
        }
      });
      console.log('✅ Stripe Elements created with client secret');
    }

    return true;
  }

  /**
   * Mount Payment Element to DOM
   * @param {string} containerId - ID of element to mount to
   */
  mountPaymentElement(containerId) {
    if (!this.elements) {
      console.error('❌ Elements not created yet');
      return false;
    }

    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`❌ Container #${containerId} not found`);
      return false;
    }

    // Clear any existing content
    container.innerHTML = '';

    try {
      this.paymentElement = this.elements.create('payment');
      this.paymentElement.mount(`#${containerId}`);
      console.log(`✅ Payment Element mounted to #${containerId}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to mount payment element:', error);
      return false;
    }
  }

  /**
   * Create payment intent on server
   * @param {Array} items - Cart items
   * @param {Object} shippingAddress - Shipping address
   * @param {number} shippingCost - Calculated shipping cost
   * @returns {Promise<Object>} Response with clientSecret and paymentIntentId
   */
  async createPaymentIntent(items, shippingAddress, shippingCost = 0) {
    try {
      console.log('🔑 Creating payment intent...');

      const response = await fetch('/api/merchandise/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items,
          shippingAddress,
          shippingCost
        })
      });

      const data = await response.json();

      if (!data.success) {
        console.error('❌ Payment intent creation failed:', data.error);
        return { success: false, error: data.error };
      }

      this.clientSecret = data.clientSecret;
      this.paymentIntentId = data.paymentIntentId;

      console.log('✅ Payment intent created:', {
        paymentIntentId: this.paymentIntentId,
        orderTotal: data.orderTotal
      });

      return {
        success: true,
        clientSecret: data.clientSecret,
        paymentIntentId: data.paymentIntentId,
        orderTotal: data.orderTotal
      };
    } catch (error) {
      console.error('❌ Error creating payment intent:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Confirm payment and submit to Stripe
   * @param {Object} shippingAddress - Shipping address for confirmation
   * @returns {Promise<Object>} Payment result
   */
  async confirmPayment(shippingAddress) {
    if (!this.stripe) {
      return { success: false, error: 'Stripe not initialized' };
    }

    this.isProcessing = true;

    try {
      console.log('💳 Confirming payment with Stripe...');

      // Submit the payment form to Stripe
      const { error } = await this.stripe.confirmPayment({
        elements: this.elements,
        confirmParams: {
          return_url: `${window.location.origin}/merchandise?order_confirmation=true`,
          receipt_email: shippingAddress.email
        },
        redirect: 'if_required'
      });

      if (error) {
        console.error('❌ Payment confirmation failed:', error.message);
        this.isProcessing = false;
        return { success: false, error: error.message };
      }

      console.log('✅ Payment submitted successfully');

      // If we get here without redirect, payment was successful (already captured)
      // Now confirm with our backend
      return await this.confirmPaymentWithBackend();
    } catch (error) {
      console.error('❌ Error confirming payment:', error);
      this.isProcessing = false;
      return { success: false, error: error.message };
    }
  }

  /**
   * Confirm payment with our backend after Stripe confirmation
   * @returns {Promise<Object>} Backend confirmation result
   */
  async confirmPaymentWithBackend() {
    try {
      console.log('✅ Confirming payment with backend...');

      const response = await fetch('/api/merchandise/confirm-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentIntentId: this.paymentIntentId,
          items: window.merchandiseStore?.cart || [],
          shippingAddress: this.getShippingAddressFromForm()
        })
      });

      const data = await response.json();

      if (!data.success) {
        console.error('❌ Backend confirmation failed:', data.error);
        this.isProcessing = false;
        return { success: false, error: data.error };
      }

      console.log('✅ Payment confirmed with backend:', {
        orderId: data.orderId,
        paymentId: data.paymentId
      });

      this.isProcessing = false;
      return {
        success: true,
        orderId: data.orderId,
        paymentId: data.paymentId,
        amount: data.amount
      };
    } catch (error) {
      console.error('❌ Error confirming with backend:', error);
      this.isProcessing = false;
      return { success: false, error: error.message };
    }
  }

  /**
   * Extract shipping address from form
   * @returns {Object} Shipping address
   */
  getShippingAddressFromForm() {
    return {
      firstName: document.getElementById('first-name')?.value || '',
      lastName: document.getElementById('last-name')?.value || '',
      email: document.getElementById('email')?.value || '',
      address1: document.getElementById('address1')?.value || '',
      address2: document.getElementById('address2')?.value || '',
      city: document.getElementById('city')?.value || '',
      state: document.getElementById('state')?.value || '',
      zip: document.getElementById('zip')?.value || '',
      country: document.getElementById('country')?.value || 'US'
    };
  }

  /**
   * Validate shipping form before payment
   * @returns {Object} Validation result
   */
  validateShippingForm() {
    const errors = [];

    const firstName = document.getElementById('first-name')?.value?.trim();
    const lastName = document.getElementById('last-name')?.value?.trim();
    const email = document.getElementById('email')?.value?.trim();
    const address1 = document.getElementById('address1')?.value?.trim();
    const city = document.getElementById('city')?.value?.trim();
    const state = document.getElementById('state')?.value?.trim();
    const zip = document.getElementById('zip')?.value?.trim();

    if (!firstName) errors.push('First name is required');
    if (!lastName) errors.push('Last name is required');
    if (!email) errors.push('Email is required');
    if (!email.includes('@')) errors.push('Valid email is required');
    if (!address1) errors.push('Address is required');
    if (!city) errors.push('City is required');
    if (!state) errors.push('State is required');
    if (!zip) errors.push('ZIP code is required');

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get current payment status
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      initialized: !!this.stripe,
      elementsCreated: !!this.elements,
      paymentElementMounted: !!this.paymentElement,
      hasClientSecret: !!this.clientSecret,
      isProcessing: this.isProcessing
    };
  }

  /**
   * Reset for new checkout
   */
  reset() {
    this.clientSecret = null;
    this.paymentIntentId = null;
    this.isProcessing = false;
    this.paymentElement = null;
    this.elements = null;
    console.log('🔄 Stripe checkout service reset');
  }
}

// Export for browser
if (typeof window !== 'undefined') {
  window.StripeCheckoutService = StripeCheckoutService;
}
