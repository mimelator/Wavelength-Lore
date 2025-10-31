# 🔧 Stripe Tax Integration - Technical Implementation Plan

**Related**: Washington State Tax Compliance (GitHub Issue #150)  
**Document**: Technical specification for Stripe Tax API integration

## 📋 Implementation Summary

This document outlines the technical steps needed to integrate Stripe Tax API into the existing Wavelength merch store payment system, replacing hardcoded tax rates with dynamic, jurisdiction-specific tax calculation.

## 🎯 Implementation Phases

### Phase 1: Core Tax Service Updates
**File**: `services/stripe-payment-service.js`

#### Current Implementation
```javascript
// Existing synchronous tax calculation
calculateTaxRate(shippingAddress) {
  const taxRates = {
    'WA': 0.065,  // Fixed 6.5% rate
    // ... other states
  };
  return taxRates[state] || 0.07;
}

// Used in calculateOrderTotal()
const taxAmount = subtotal * taxRate;
```

#### Proposed Changes
```javascript
// New async Stripe Tax integration  
async calculateTaxWithStripe(lineItems, shippingAddress, shippingCost) {
  const calculation = await stripe.tax.calculations.create({
    currency: 'usd',
    line_items: formatLineItemsForStripe(lineItems, shippingCost),
    customer_details: {
      address: formatAddressForStripe(shippingAddress),
      address_source: 'shipping'
    }
  });
  return {
    taxAmount: calculation.tax_amount_exclusive / 100,
    calculation: calculation
  };
}

// Updated calculateOrderTotal() - now async
async calculateOrderTotal(lineItems, shippingAddress, shippingCost) {
  if (process.env.STRIPE_TAX_ENABLED === 'true') {
    return await this.calculateTaxWithStripe(...);
  } else {
    return this.calculateTaxRate(...); // Fallback
  }
}
```

#### Key Technical Changes
1. **Async Pattern**: `calculateOrderTotal()` becomes async due to Stripe API calls
2. **Fallback Logic**: Graceful degradation when Stripe Tax unavailable  
3. **Error Handling**: API failures fallback to simple calculation
4. **Address Validation**: Ensure address has required fields for tax calculation
5. **Line Item Formatting**: Convert cart items to Stripe Tax format

### Phase 2: Route Updates  
**File**: `routes/merchandise.js`

#### Payment Intent Creation Route
```javascript
// Current: Sync tax calculation
router.post('/create-payment-intent', async (req, res) => {
  const orderTotal = stripePaymentService.calculateOrderTotal(items, address, shipping);
  // ...
});

// Updated: Async tax calculation  
router.post('/create-payment-intent', async (req, res) => {
  const orderTotal = await stripePaymentService.calculateOrderTotal(items, address, shipping);
  // ...
});
```

#### Metadata Enhancement
Add tax method tracking to payment intent metadata:
```javascript
metadata: {
  // ... existing fields
  taxMethod: orderTotal.taxCalculation ? 'stripe_tax' : 'simple',
  taxJurisdictions: orderTotal.taxCalculation?.line_items?.length || 0
}
```

### Phase 3: Configuration Management

#### Environment Variables
**File**: `.env.example`
```bash
# Stripe Tax Configuration
STRIPE_TAX_ENABLED=false  # Set to true when ready for Stripe Tax
STRIPE_SECRET_KEY=sk_test_... # Must have tax permissions
```

#### Feature Flag Implementation
```javascript
class StripePaymentService {
  constructor() {
    this.taxEnabled = process.env.STRIPE_TAX_ENABLED === 'true';
    this.isTestMode = process.env.STRIPE_ENVIRONMENT === 'test';
  }
  
  async calculateOrderTotal(lineItems, shippingAddress, shippingCost) {
    if (this.taxEnabled && this.isValidTaxAddress(shippingAddress)) {
      try {
        return await this.calculateTaxWithStripe(lineItems, shippingAddress, shippingCost);
      } catch (error) {
        console.warn('Stripe Tax failed, using fallback:', error.message);
        return this.calculateTaxRateFallback(lineItems, shippingAddress, shippingCost);
      }
    }
    return this.calculateTaxRateFallback(lineItems, shippingAddress, shippingCost);
  }
}
```

### Phase 4: Product Tax Code Management

#### Tax Code Mapping
Create mapping for different product types:
```javascript
const TAX_CODES = {
  'apparel': 'txcd_20030000',      // Clothing
  'accessories': 'txcd_20020000',   // Accessories  
  'home-goods': 'txcd_30070000',   // Home & Garden
  'digital': 'txcd_10401100',      // Digital products
  'default': 'txcd_99999999'       // General merchandise
};

function getProductTaxCode(product) {
  const productType = extractProductType(product);
  return TAX_CODES[productType] || TAX_CODES.default;
}
```

#### Line Item Enhancement
```javascript
function formatLineItemsForStripe(cartItems, shippingCost) {
  const lineItems = cartItems.map((item, index) => ({
    amount: Math.round(item.price * item.quantity * 100),
    reference: `item_${index}`,
    tax_code: getProductTaxCode(item)
  }));
  
  if (shippingCost > 0) {
    lineItems.push({
      amount: Math.round(shippingCost * 100),
      reference: 'shipping',
      tax_code: 'txcd_92010001' // Shipping
    });
  }
  
  return lineItems;
}
```

## 🔄 Migration Strategy

### Development Phase
1. **Feature Flag Off**: Continue using simple tax calculation
2. **Stripe Tax Testing**: Test API integration with feature flag
3. **Validation**: Compare Stripe Tax vs simple calculation results
4. **Error Handling**: Verify fallback works correctly

### Staging Phase  
1. **Feature Flag On**: Enable Stripe Tax in staging environment
2. **Address Testing**: Test various Washington addresses
3. **Performance Testing**: Measure API response times
4. **Edge Case Testing**: Invalid addresses, API failures, etc.

### Production Rollout
1. **Gradual Rollout**: Enable for percentage of transactions initially  
2. **Monitoring**: Watch for errors, performance impacts
3. **Full Rollout**: Enable for all transactions once validated
4. **Simple Tax Removal**: Eventually remove fallback code

## 🚨 Error Handling Strategy

### API Failure Scenarios
```javascript
async calculateTaxWithStripe(lineItems, shippingAddress, shippingCost) {
  try {
    const calculation = await stripe.tax.calculations.create({...});
    return { success: true, taxAmount: calculation.tax_amount_exclusive / 100 };
  } catch (error) {
    console.error('Stripe Tax API error:', {
      message: error.message,
      code: error.code,
      address: shippingAddress
    });
    
    // Return fallback calculation
    return { 
      success: false, 
      error: error.message,
      fallbackUsed: true,
      taxAmount: this.calculateTaxRateFallback(shippingAddress) * subtotal 
    };
  }
}
```

### Address Validation
```javascript
isValidTaxAddress(address) {
  const required = ['city', 'state', 'country'];
  const hasPostal = address.zip || address.postal_code;
  
  return required.every(field => address[field]?.trim()?.length > 0) && hasPostal;
}
```

## 📊 Testing Strategy

### Unit Tests
- Tax calculation with various addresses
- Fallback behavior when API fails  
- Address validation logic
- Line item formatting

### Integration Tests
- End-to-end payment flow with Stripe Tax
- Webhook handling with tax metadata
- Performance under load

### Manual Testing Checklist
- [ ] Seattle, WA address (high local tax rate)
- [ ] Spokane, WA address (different jurisdiction)  
- [ ] Out-of-state address (ensure no WA tax)
- [ ] Invalid address (test fallback)
- [ ] API timeout scenario
- [ ] Mixed product types (different tax codes)

## 📈 Monitoring & Observability

### Logging Strategy
```javascript
// Log tax method used for each calculation
console.log('Tax calculation result:', {
  method: result.taxCalculation ? 'stripe_tax' : 'simple',
  amount: result.taxAmount,
  rate: result.taxRate,
  address: `${shippingAddress.city}, ${shippingAddress.state}`,
  timestamp: new Date().toISOString()
});
```

### Metrics to Track
- **Tax Method Distribution**: % using Stripe Tax vs fallback
- **API Response Times**: Stripe Tax API performance  
- **Error Rates**: Failed tax calculations
- **Tax Amount Variance**: Compare Stripe vs simple calculation when both available

### Alerting
- High error rate from Stripe Tax API
- Significant tax amount discrepancies  
- Increased payment failures (could indicate tax calculation issues)

## 🔧 Implementation Checklist

### Pre-Implementation
- [ ] Stripe Tax enabled in Dashboard
- [ ] Test API keys have tax calculation permissions
- [ ] Development environment configured
- [ ] Backup/rollback plan defined

### Code Changes
- [ ] Update `stripe-payment-service.js` with async tax calculation
- [ ] Modify `/create-payment-intent` route for async handling
- [ ] Add address validation helper methods
- [ ] Implement product tax code mapping
- [ ] Add comprehensive error handling

### Testing
- [ ] Unit tests for new tax calculation methods
- [ ] Integration tests for payment flow
- [ ] Manual testing with various WA addresses
- [ ] Performance testing under load
- [ ] Error scenario testing (API failures)

### Deployment
- [ ] Feature flag deployment (STRIPE_TAX_ENABLED=false initially)
- [ ] Staging environment validation
- [ ] Gradual production rollout
- [ ] Monitoring dashboard setup
- [ ] Documentation updates

---

**Ready for Implementation**: This plan provides the complete technical specification for integrating Stripe Tax API while maintaining system reliability through proper fallbacks and testing.