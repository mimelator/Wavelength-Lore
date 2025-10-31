# 🏛️ Washington State Tax Compliance for Wavelength Merch Store

**GitHub Issue #150**: Tax Config for Washington State  
**Reference**: [Stripe Tax - Washington State Documentation](https://docs.stripe.com/tax/supported-countries/united-states/washington)

## 📋 Overview

This document outlines the requirements and implementation plan for enabling proper Washington state tax collection on the Wavelength merchandise store, replacing the current simple tax calculation with Stripe Tax for full compliance.

## 🎯 Current State Analysis

### What We Have Now
- ✅ **Stripe Payment Processing**: Fully implemented with payment intents, webhooks, and order management
- ✅ **Basic Tax Calculation**: Simple hardcoded tax rates (6.5% for WA) in `calculateTaxRate()`  
- ✅ **Tax Collection Infrastructure**: Orders collect and store tax amounts
- ✅ **Washington Rate**: Currently using 6.5% base rate for Washington state

### What We Need
- 🚫 **Accurate Local Rates**: Current system doesn't account for local jurisdiction taxes
- 🚫 **Automatic Tax Updates**: Rates are hardcoded and don't update with tax law changes  
- 🚫 **Tax Registration Tracking**: No system to track when we hit registration thresholds
- 🚫 **Compliance Reporting**: No automated tax reporting for Washington state filings
- 🚫 **Product-Specific Tax Codes**: All products treated as general merchandise

## 🏛️ Washington State Tax Requirements

### Registration Threshold
**Remote Seller Threshold**: Must register when sales exceed **$100,000 USD** in previous or current calendar year
- Includes ALL gross sales (including marketplace sales)
- If physical presence in WA (origin address), must register regardless of sales volume

### Tax Types Supported by Stripe Tax
1. **Sales Tax**: Standard state and local sales tax rates
2. **Seller Use Tax**: For use tax obligations
3. **Admissions Tax**: For entertainment/recreational activities (many local jurisdictions)

### Local Jurisdiction Complexity
Washington has multiple local tax jurisdictions with varying rates:
- **State Rate**: Base sales tax rate
- **Local Rates**: City, county, and special district taxes
- **Combined Rates**: Can vary significantly by exact location
- **Real-Time Updates**: Rates change periodically and need automatic updates

## 🔧 Technical Implementation Plan

### Phase 1: Stripe Tax Integration
Replace current `calculateTaxRate()` method with Stripe Tax API calls:

```javascript
// Current: Simple hardcoded rates
calculateTaxRate(shippingAddress) {
  return taxRates[state] || 0.07;
}

// Proposed: Stripe Tax API integration
async calculateTaxWithStripe(lineItems, shippingAddress) {
  const calculation = await stripe.tax.calculations.create({
    currency: 'usd',
    line_items: lineItems,
    customer_details: { address: shippingAddress }
  });
  return calculation.tax_amount_exclusive / 100;
}
```

### Phase 2: Product Tax Code Mapping
Update products with appropriate tax codes:
- **General Merchandise**: `txcd_99999999` (current default)
- **Apparel**: `txcd_20030000` 
- **Accessories**: `txcd_20020000`
- **Digital Products**: May have different treatment

### Phase 3: Tax Registration Management
- **Threshold Monitoring**: Track sales volume approaching $100K threshold
- **Registration Tracking**: Record tax registrations in Stripe Dashboard
- **Compliance Alerts**: Automated notifications when thresholds are approached

### Phase 4: Reporting & Filing
- **Export Integration**: Use Stripe's transaction data exports
- **Location Reports**: Generate Washington-specific reports
- **Filing Partners**: Optional integration with Taxually/Marosa/HOST for automated filing

## 📁 Files That Need Updates

### Core Payment Service
- `services/stripe-payment-service.js`
  - Replace `calculateTaxRate()` with `calculateTaxWithStripe()`
  - Add address validation for tax calculation
  - Handle Stripe Tax API errors with fallback

### Route Updates
- `routes/merchandise.js`  
  - Update `/create-payment-intent` endpoint to use async tax calculation
  - Add tax method tracking in payment metadata

### Configuration
- `.env.example` 
  - Add `STRIPE_TAX_ENABLED=true` configuration
  - Document Stripe Tax setup requirements

### New Services (Optional)
- `services/tax-compliance-service.js`
  - Threshold monitoring
  - Registration management  
  - Compliance reporting helpers

## 🚀 Setup Requirements

### Stripe Dashboard Configuration
1. **Enable Stripe Tax**: https://dashboard.stripe.com/tax/settings
2. **Configure Origin Address**: Set Washington state as business location if applicable
3. **Tax Registration**: Add Washington state tax registration when threshold reached
4. **Webhook Events**: Ensure tax-related events are configured

### Environment Variables
```bash
# Enable Stripe Tax API usage
STRIPE_TAX_ENABLED=true

# Existing Stripe keys (already configured)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Washington State Registration Process
1. **Monitor Thresholds**: Use Stripe's threshold monitoring tool
2. **Register with DOR**: https://dor.wa.gov/ when threshold exceeded  
3. **Add to Stripe**: Record registration in Stripe Dashboard
4. **Enable Collection**: Tax collection automatically starts

## 📊 Benefits of Stripe Tax Integration

### Accuracy
- **Real-Time Rates**: Always current with latest tax law changes
- **Local Jurisdiction Support**: Accurate down to street-level precision  
- **Product-Specific**: Proper tax codes for different merchandise types

### Compliance
- **Automatic Updates**: No manual rate updates needed
- **Threshold Monitoring**: Built-in sales tracking for registration requirements
- **Audit Trail**: Complete transaction records for tax filings

### Operations
- **Reduced Maintenance**: No manual tax rate management
- **Error Reduction**: Eliminates hardcoded rate mistakes
- **Reporting**: Automated exports for tax filing

## ⚠️ Implementation Considerations

### Fallback Strategy
- Keep simple tax calculation as fallback for API failures
- Graceful degradation when Stripe Tax is unavailable
- Clear logging of which tax method was used per transaction

### Testing Strategy  
- Test with various Washington addresses (different cities/counties)
- Verify tax calculations against known rates
- Test fallback behavior with API errors

### Performance
- Cache tax calculations for identical line items + addresses
- Monitor API response times
- Consider batch calculations for multiple items

## 📋 Pre-Implementation Checklist

### Business Requirements
- [ ] Confirm current sales volume vs $100K threshold
- [ ] Determine if physical presence in Washington exists
- [ ] Review product catalog for proper tax code classification
- [ ] Plan for tax registration timing if threshold approaches

### Technical Prerequisites  
- [ ] Verify Stripe Tax is enabled in Dashboard
- [ ] Test Stripe Tax API in development environment
- [ ] Plan rollback strategy if issues arise
- [ ] Set up monitoring for tax calculation errors

### Documentation
- [ ] Update deployment guides with tax configuration steps
- [ ] Document tax rate testing procedures  
- [ ] Create troubleshooting guide for tax calculation issues
- [ ] Update customer support materials about tax collection

## 🔗 Resources

- **Stripe Tax Documentation**: https://docs.stripe.com/tax
- **Washington State Specific**: https://docs.stripe.com/tax/supported-countries/united-states/washington
- **Washington DOR**: https://dor.wa.gov/
- **Tax Registration Guide**: https://stripe.com/guides/sales-tax-registration-process-us
- **Stripe Dashboard Tax Settings**: https://dashboard.stripe.com/tax/settings
- **Threshold Monitoring**: https://dashboard.stripe.com/tax/thresholds

---

**Next Steps**: Review this compliance plan and approve before beginning implementation of Stripe Tax integration.