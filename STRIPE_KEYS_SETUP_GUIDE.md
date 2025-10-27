# 🔑 STRIPE API KEYS SETUP GUIDE

## STEP-BY-STEP INSTRUCTIONS

### 1. GET YOUR STRIPE KEYS

**Login to Stripe Dashboard:**
- Go to: https://dashboard.stripe.com
- Use your Stripe account credentials

**Navigate to API Keys:**
- Left sidebar → "Developers" 
- Click "API keys"

**Copy Test Keys (for development):**
```
Publishable Key: pk_test_51Abc123... (click "Reveal test key")
Secret Key: sk_test_51Abc123... (click "Reveal test key")
```

### 2. ADD TO ENVIRONMENT FILE

**Create/Update .env file:**
```bash
# Stripe Payment Processing (TEST KEYS)
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
STRIPE_ENVIRONMENT=test
```

**Replace YOUR_SECRET_KEY_HERE with your actual keys!**

### 3. WEBHOOK ENDPOINT SETUP

**Create Webhook Endpoint:**
- In Stripe Dashboard: Developers → Webhooks
- Click "Add endpoint"
- URL: `https://your-domain.com/api/webhook/stripe`
- Events to send: `payment_intent.succeeded`, `payment_intent.payment_failed`
- Copy the "Signing secret" (starts with `whsec_`)

### 4. SECURITY NOTES

⚠️ **CRITICAL SECURITY:**
- Never commit API keys to git
- Add `.env` to `.gitignore`
- Use test keys for development
- Switch to live keys only for production

✅ **TEST KEYS ARE SAFE:**
- Test keys can't process real payments
- Safe to use during development
- No real money involved

### 5. VERIFICATION

**Test your keys work:**
```bash
node -e "
const stripe = require('stripe')('sk_test_YOUR_SECRET_KEY');
stripe.customers.list({limit: 1}).then(customers => {
  console.log('✅ Stripe connection successful!');
}).catch(err => {
  console.log('❌ Stripe connection failed:', err.message);
});
"
```

### 6. NEXT STEPS

Once keys are set up:
1. Install Stripe: `npm install stripe @stripe/stripe-js`
2. Implement payment processing (see PAYMENT_PROCESSING_RESEARCH.md)
3. Test with Stripe test cards
4. Deploy to production with live keys

---

🌊 **WAVELENGTH PAYMENT INTEGRATION READY!**