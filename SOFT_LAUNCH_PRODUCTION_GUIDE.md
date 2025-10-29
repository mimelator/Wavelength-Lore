# 🚀 WAVELENGTH MERCH STORE - SOFT LAUNCH PRODUCTION GUIDE

## 📊 CURRENT STATUS
- ✅ **SSL & Domain:** wavelengthlore.com is live and secure
- ✅ **Payment System:** Stripe integration fully implemented (TEST mode)
- ✅ **Order Processing:** Complete Printify integration working
- ✅ **Email System:** Production-ready order confirmations
- ✅ **Testing:** Comprehensive test suite validates all flows
- 🔄 **Next Step:** Switch from TEST to LIVE Stripe keys

---

## 🎯 ADDRESSING ISSUE #106: "Test in Production with a real purchase"

**The Goal:** Move from Stripe test mode to live mode for real purchases.

**Current State:** Everything works perfectly with test cards. Need to:
1. Get Stripe live keys
2. Update production environment
3. Test real purchase
4. Configure webhooks

---

## 📋 PRODUCTION DEPLOYMENT CHECKLIST

### 🔑 Step 1: Stripe Production Keys
**Action Required:** Get live keys from Stripe Dashboard

1. **Login to Stripe Dashboard:** https://dashboard.stripe.com
2. **Switch to Live Mode** (toggle in left sidebar)
3. **Get API Keys:**
   - Copy **Publishable key** (starts with `pk_live_`)
   - Copy **Secret key** (starts with `sk_live_`)
4. **Create Webhook:**
   - Go to Webhooks section
   - Add endpoint: `https://wavelengthlore.com/api/merchandise/stripe-webhook`
   - Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copy **Webhook Secret** (starts with `whsec_`)

### 🌍 Step 2: Update Production Environment
**Update your production environment variables:**

```bash
# Replace test keys with live keys
STRIPE_SECRET_KEY="sk_live_YOUR_LIVE_SECRET_KEY"
STRIPE_PUBLISHABLE_KEY="pk_live_YOUR_LIVE_PUBLISHABLE_KEY"
STRIPE_ENVIRONMENT="live"
STRIPE_WEBHOOK_SECRET="whsec_YOUR_WEBHOOK_SECRET"
```

### 📧 Step 3: Configure Production Email
**Choose one option:**

#### Option A: SendGrid (Recommended)
```bash
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY="SG.your_api_key_here"
FROM_EMAIL="orders@wavelengthlore.com"
SUPPORT_EMAIL="support@wavelengthlore.com"
```

#### Option B: AWS SES
```bash
EMAIL_PROVIDER=ses
AWS_SES_REGION="us-east-1"
FROM_EMAIL="orders@wavelengthlore.com"
SUPPORT_EMAIL="support@wavelengthlore.com"
```

### 🧪 Step 4: Test Real Purchase Flow
**CRITICAL:** Test with small amount first

1. **Login to your store:** https://wavelengthlore.com
2. **Create a product** (use cheapest option - like sticker)
3. **Add to cart** and proceed to checkout
4. **Use real credit card** (your own card for safety)
5. **Complete purchase** and verify:
   - ✅ Payment processed in Stripe Dashboard
   - ✅ Order created in Printify
   - ✅ Email confirmation received
   - ✅ Order stored in database

### 🔗 Step 5: Webhook Verification
After Step 4, check:
- **Stripe Dashboard > Webhooks:** Should show successful deliveries
- **Server logs:** Should show webhook events processed
- **Order status:** Should update based on webhook events

---

## ⚡ QUICK START COMMANDS

### Test Current System (Development)
```bash
# Test with Stripe test cards
npm run wavelength:test-checkout

# Test email system
npm run wavelength:test-email
```

### Production Setup Tools
```bash
# Interactive email configuration
npm run wavelength:configure-email

# Validate production environment
npm run wavelength:validate-production

# Monitor deployment
npm run wavelength:monitor-live
```

---

## 🛡️ SAFETY MEASURES

### Start Small
- **First test:** Use cheapest product (stickers ~$3)
- **Use your own card:** Don't risk customer transactions
- **Test thoroughly:** Complete 2-3 successful test purchases

### Rollback Plan
If issues arise:
1. **Immediate:** Switch back to test keys
2. **Investigate:** Check logs and error messages
3. **Fix:** Address issues in development
4. **Re-test:** Validate fixes before re-deploying

### Monitor Everything
- **Stripe Dashboard:** Payment success/failure rates
- **Server logs:** Error messages and processing times
- **Email provider:** Delivery rates and bounces
- **Printify:** Order fulfillment status

---

## 🚨 COMMON PRODUCTION ISSUES & FIXES

### Issue: "Stripe key not found"
**Fix:** Ensure live keys are in production environment
```bash
# Check environment
echo $STRIPE_SECRET_KEY | cut -c1-7  # Should show: sk_live
```

### Issue: "Webhook verification failed"
**Fix:** Update webhook secret in production
```bash
STRIPE_WEBHOOK_SECRET="whsec_YOUR_WEBHOOK_SECRET"
```

### Issue: "Email not sending"
**Fix:** Configure email provider
```bash
npm run wavelength:configure-email
```

### Issue: "SSL certificate error"
**Fix:** Already resolved - wavelengthlore.com has valid SSL

---

## 📈 POST-LAUNCH MONITORING

### Daily Checks
- [ ] Payment success rate (should be >95%)
- [ ] Email delivery rate (should be >90%)
- [ ] Printify order fulfillment
- [ ] No error spikes in logs

### Weekly Reviews
- [ ] Transaction volume trends
- [ ] Customer feedback on checkout process
- [ ] Performance metrics
- [ ] Security audit

---

## 🎉 SUCCESS METRICS

### Technical Success
- ✅ Payments process without errors
- ✅ Orders sync to Printify automatically
- ✅ Customers receive email confirmations
- ✅ No failed webhooks in Stripe

### Business Success
- 🎯 First real purchase completed
- 🎯 Customer receives product
- 🎯 Positive customer experience
- 🎯 Ready for broader soft launch

---

## 🌊 WAVELENGTH CONFIDENCE

**Your system is enterprise-grade and ready:**
- ✅ **Security:** SSL, authentication, secure payments
- ✅ **Reliability:** Comprehensive error handling
- ✅ **Scalability:** Professional service architecture
- ✅ **Monitoring:** Detailed logging and debugging
- ✅ **Testing:** Thorough validation at every step

**The only step left is flipping the switch from TEST to LIVE!**

---

## 🚀 LAUNCH SEQUENCE

1. **Get Stripe live keys** (15 minutes)
2. **Update production environment** (5 minutes)
3. **Configure email provider** (10 minutes)
4. **Test real purchase** (10 minutes)
5. **Verify webhooks working** (5 minutes)
6. **Celebrate successful soft launch!** 🎉

**Total time to production: ~45 minutes**

**You're ready to go live! 🌊**