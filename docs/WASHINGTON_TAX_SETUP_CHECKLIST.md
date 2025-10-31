# 📋 Washington State Tax Setup Checklist

**GitHub Issue #150**: Tax Config Implementation Checklist  
**Purpose**: Step-by-step guide for enabling Washington state tax compliance

## 🎯 Business Prerequisites

### Sales Threshold Assessment
- [ ] **Calculate Current Sales Volume**
  - Review total gross sales for current calendar year
  - Include all marketplace and direct sales
  - Check if approaching $100,000 threshold

- [ ] **Determine Registration Requirement**
  - [ ] Sales exceed $100K → Must register immediately  
  - [ ] Physical presence in WA → Must register regardless of sales
  - [ ] Sales under $100K → Monitor threshold, prepare for registration

### Tax Registration (If Required)
- [ ] **Register with Washington State Department of Revenue**
  - Visit: https://dor.wa.gov/
  - Complete sales tax registration
  - Obtain Washington state tax registration number

- [ ] **Add Registration to Stripe Dashboard**
  - Go to: https://dashboard.stripe.com/tax/registrations  
  - Add Washington state registration
  - Input registration number and effective date

## 🔧 Technical Setup

### Stripe Dashboard Configuration
- [ ] **Enable Stripe Tax**
  - Navigate to: https://dashboard.stripe.com/tax/settings
  - Enable Stripe Tax for your account
  - Verify tax calculation is active

- [ ] **Configure Business Address**  
  - Set origin address in tax settings
  - If WA-based business, set Washington as origin state
  - This affects tax nexus determination

- [ ] **Review Tax Settings**
  - Confirm USD currency support
  - Verify supported countries include United States  
  - Check that Washington is in supported states list

### Environment Configuration
- [ ] **Update Environment Variables**
```bash
# Add to production .env file
STRIPE_TAX_ENABLED=true

# Verify existing Stripe keys have tax permissions
STRIPE_SECRET_KEY=sk_live_... # Must include tax:read and tax:write scopes  
STRIPE_PUBLISHABLE_KEY=pk_live_...
```

- [ ] **Test Environment Setup**  
```bash
# Add to development/staging .env  
STRIPE_TAX_ENABLED=true
STRIPE_SECRET_KEY=sk_test_... # Test keys with tax permissions
```

### Code Deployment
- [ ] **Deploy Tax Integration Code**
  - Deploy updated `stripe-payment-service.js` with Stripe Tax integration
  - Update merchandise routes with async tax calculation
  - Ensure fallback tax calculation remains for reliability

- [ ] **Verify Feature Flag**
  - Confirm `STRIPE_TAX_ENABLED` can be toggled without code deployment
  - Test both enabled and disabled states
  - Verify fallback works when disabled

## 🧪 Testing & Validation

### Development Testing
- [ ] **Test Washington Addresses**
  - Seattle, WA (high local tax rate areas)
  - Spokane, WA (different tax jurisdiction) 
  - Bellingham, WA (border city)
  - Rural WA addresses

- [ ] **Test Non-Washington Addresses**
  - Verify no WA tax applied to out-of-state orders
  - Test Oregon (no sales tax state)
  - Test California (different tax system)

- [ ] **Error Scenarios**
  - Invalid/incomplete addresses  
  - Stripe Tax API timeout/failure
  - Verify fallback tax calculation works

### Staging Environment
- [ ] **Enable Stripe Tax in Staging**
  - Set `STRIPE_TAX_ENABLED=true` in staging environment
  - Use Stripe test keys with tax permissions
  - Process test orders with various addresses

- [ ] **Validate Tax Calculations**
  - Compare Stripe Tax vs manual tax rate lookups
  - Verify tax amounts are reasonable for WA addresses
  - Check tax breakdown in payment metadata

### Production Validation  
- [ ] **Gradual Rollout Plan**
  - Plan for percentage-based rollout (10% → 50% → 100%)
  - Define rollback criteria and procedure
  - Set up monitoring alerts for tax calculation errors

## 📊 Monitoring Setup

### Stripe Dashboard Monitoring
- [ ] **Tax Reports Access**
  - Navigate to: https://dashboard.stripe.com/tax/reports
  - Verify Washington tax reporting is available
  - Test export functionality for tax filing

- [ ] **Threshold Monitoring**
  - Check: https://dashboard.stripe.com/tax/thresholds
  - Set up alerts for approaching registration thresholds in other states
  - Review monthly to track sales volume vs tax obligations

### Application Monitoring
- [ ] **Tax Calculation Logging**
  - Verify logs show tax method used (stripe_tax vs simple)
  - Monitor error rates for Stripe Tax API calls
  - Track response times for tax calculations

- [ ] **Payment Success Rates**
  - Monitor for any payment failures related to tax calculation
  - Alert on increased cart abandonment during checkout
  - Track conversion rates after tax integration

## 🚀 Go-Live Process

### Pre-Launch
- [ ] **Final Business Review**
  - Confirm registration status is current
  - Verify tax settings match business requirements  
  - Review legal compliance with business team

- [ ] **Technical Sign-Off**
  - All tests pass in staging environment
  - Monitoring and alerting configured
  - Rollback procedure documented and tested

### Launch Day
- [ ] **Enable Stripe Tax**
  - Set `STRIPE_TAX_ENABLED=true` in production
  - Monitor first transactions for correct tax calculation
  - Verify tax amounts appear reasonable in order confirmations

- [ ] **Monitor Initial Transactions**
  - Watch for any tax calculation errors in logs
  - Check customer feedback for unexpected tax amounts
  - Verify order completion rates remain stable

### Post-Launch
- [ ] **First Week Monitoring**
  - Daily review of tax calculation performance
  - Monitor customer support tickets for tax-related issues
  - Validate tax reporting data in Stripe Dashboard

- [ ] **Monthly Review**
  - Export tax transaction data for accounting review
  - Check threshold monitoring for other states
  - Review and optimize tax code assignments if needed

## 🆘 Troubleshooting

### Common Issues & Solutions

**Issue: "Stripe Tax calculation failed"**
- Check Stripe Dashboard for Tax service status
- Verify API keys have tax permissions
- Ensure STRIPE_TAX_ENABLED=true in environment

**Issue: "Invalid address for tax calculation"**  
- Verify address has city, state, country, zip/postal code
- Check address format matches Stripe Tax requirements
- Fallback tax calculation should still work

**Issue: "Tax amount seems incorrect"**
- Verify customer address is in correct tax jurisdiction
- Check Stripe Tax Dashboard for applied rates breakdown
- Compare with Washington DOR tax rate lookup tools

### Emergency Procedures
- [ ] **Disable Stripe Tax**: Set `STRIPE_TAX_ENABLED=false` to revert to simple calculation
- [ ] **Monitor Impact**: Check order completion rates and customer feedback  
- [ ] **Support Escalation**: Contact Stripe Support for Tax service issues

---

## 📞 Support Resources

- **Stripe Tax Support**: https://support.stripe.com/ (mention "Tax" in subject)
- **Washington DOR**: https://dor.wa.gov/ (for registration questions)  
- **Tax Registration Guide**: https://stripe.com/guides/sales-tax-registration-process-us
- **Stripe Tax Documentation**: https://docs.stripe.com/tax

**Status**: ✅ Ready for implementation when business requirements are confirmed