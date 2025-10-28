# Stripe Payment Integration - Complete Implementation Guide

## Overview
This document outlines the complete Stripe payment integration for the Wavelength Lore merchandise store, enabling customers to purchase custom merchandise with a full checkout flow.

## What Was Implemented

### 1. StripeCheckoutService (`/static/js/services/stripe-checkout-service.js`)
A comprehensive service that handles all Stripe-related operations:

**Key Methods:**
- `initializeStripe()` - Load Stripe library and public key
- `createElements()` - Create Stripe Elements instance with styling
- `mountPaymentElement(containerId)` - Mount Payment Element to DOM
- `createPaymentIntent(items, address, shipping)` - Create payment intent on server
- `confirmPayment(address)` - Submit payment to Stripe and backend
- `validateShippingForm()` - Validate shipping information before payment
- `getShippingAddressFromForm()` - Extract form data into address object

**Features:**
- Automatic Stripe.js loading from CDN
- Dynamic public key retrieval from server
- Professional appearance with custom theming
- Comprehensive error handling
- Shipping form validation
- Payment processing state management

### 2. Updated merchandise-store.ejs
Added:
- `<script src="https://js.stripe.com/v3/"></script>` - Stripe library reference
- `stripe-checkout-service.js` service loading
- Added `StripeCheckoutService` to required services list

### 3. Enhanced merchandise-store.js
Updated checkout modal and added new methods:

**New/Modified Methods:**
- `showCheckoutModal()` - Now async, displays order summary and initializes Stripe
- `initializeCheckout()` - Creates payment intent and mounts Payment Element
- `attachCheckoutFormHandler()` - Adds form submission listener
- `handleCheckoutSubmit()` - Processes payment with full error handling

**Flow:**
1. User adds items to cart
2. Clicks "Checkout" button
3. `showCheckoutModal()` renders form with order summary
4. `initializeCheckout()` creates payment intent and mounts Payment Element
5. User fills shipping info and payment details
6. Form submission triggers `handleCheckoutSubmit()`
7. Stripe confirms payment
8. Backend creates order via `/api/merchandise/confirm-payment`
9. User redirected to order confirmation page

### 4. Backend Endpoints (Already Implemented)
These endpoints were already in place:

**POST /api/merchandise/create-payment-intent**
- Creates Stripe PaymentIntent
- Calculates order total with tax and shipping
- Returns clientSecret for frontend

**POST /api/merchandise/confirm-payment**
- Confirms payment with Stripe
- Creates Printify order
- Stores order in database
- Returns orderId and paymentId

**POST /api/merchandise/stripe-webhook**
- Handles Stripe webhook events
- Confirms payment status

## How It Works - Step by Step

### 1. Initialization
```javascript
// When store loads, StripeCheckoutService is instantiated
this.stripeCheckoutService = new StripeCheckoutService();
// → Loads Stripe library and fetches public key
```

### 2. Checkout Flow
```javascript
// User clicks Checkout button
handleCheckout() → showCheckoutModal()
  ↓
// Modal renders with order summary and shipping form
showCheckoutModal() → initializeCheckout()
  ↓
// Create payment intent on server
createPaymentIntent(items, address, shipping)
  → POST /api/merchandise/create-payment-intent
  → Returns clientSecret and paymentIntentId
  ↓
// Mount Payment Element to form
createElements()
mountPaymentElement('payment-element')
  ↓
// User submits form
handleCheckoutSubmit()
  ↓
// Validate shipping info
validateShippingForm()
  ↓
// Confirm payment with Stripe
confirmPayment(address)
  → stripe.confirmPayment()
  → POST /api/merchandise/confirm-payment
  ↓
// Success: Create order and redirect
clearCart()
Reset Stripe service
Redirect to confirmation page
```

## API Contract

### Create Payment Intent
```
POST /api/merchandise/create-payment-intent
Body: {
  items: [{ id, title, price, quantity }],
  shippingAddress: { firstName, lastName, email, address1, address2, city, state, zip, country },
  shippingCost: 0
}
Response: {
  success: true,
  clientSecret: "pi_..._secret_...",
  paymentIntentId: "pi_...",
  orderTotal: { subtotal, taxAmount, shippingCost, total }
}
```

### Confirm Payment
```
POST /api/merchandise/confirm-payment
Body: {
  paymentIntentId: "pi_...",
  items: [...],
  shippingAddress: {...}
}
Response: {
  success: true,
  orderId: "printify_order_id",
  paymentId: "payment_intent_id",
  amount: 9999
}
```

## Key Features

### 1. Order Summary
Displays all items in cart with prices before payment

### 2. Shipping Form Validation
- First/Last name required
- Valid email required
- Complete address required
- ZIP code validation

### 3. Payment Element
- Pre-built Stripe Payment Element handles:
  - Card entry
  - 3D Secure authentication
  - Apple Pay / Google Pay
  - Local payment methods (regional support)

### 4. Error Handling
- Form validation errors displayed above submit button
- Network errors handled gracefully
- Payment failures show user-friendly messages
- Server errors returned to user

### 5. Loading States
- Submit button disabled during processing
- Loading spinner displayed
- User cannot double-submit

## Testing the Checkout Flow

### 1. Create a Custom Product
- Navigate to Merchandise Store
- Select a gallery image
- Choose product type (e.g., Tote Bag)
- Apply customizations (effects, borders)
- Click "Create Product"

### 2. Add to Cart
- Click the cart icon on the product
- Choose quantity and variant
- Click "Add to Cart"

### 3. Proceed to Checkout
- Click "Checkout" button in cart
- Order summary displays
- Enter shipping information:
  - First Name: John
  - Last Name: Doe
  - Email: john@example.com
  - Address: 123 Main St
  - City: San Francisco
  - State: CA
  - ZIP: 94102
  - Country: United States

### 4. Enter Test Payment Info
Use Stripe test card numbers:
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **3D Secure**: 4000 0025 0000 3155

Any future expiration date and any 3-digit CVC

### 5. Complete Payment
- Fill all fields
- Click "Place Order"
- Observe payment processing
- On success, redirected to order confirmation

## Variations Support

The checkout system supports all product variations:
- **T-Shirts**: Different sizes (XS-XXL), colors, fits
- **Hoodies**: Sizes, colors, pull-over/zip options
- **Tote Bags**: Print area options
- **Mugs**: Size options (11oz, 15oz)
- **Other Products**: Various variant combinations

When user selects a product, they can choose from available variations, and the order will include the selected variant details.

## Order Confirmation

After successful payment:
1. Backend creates Printify order with product details
2. Printify begins fulfillment process
3. User redirected to: `/merchandise?order_confirmation={orderId}`
4. Order details stored in Firebase database
5. User can track order status via Printify

## Security Features

1. **PCI Compliance**: Payment card data never touches backend (Stripe handles it)
2. **HTTPS Only**: All API calls use secure HTTPS
3. **Server-side Validation**: Shipping address validated on backend
4. **Payment Intent**: Stripe PaymentIntent confirms customer identity
5. **Webhook Verification**: Backend verifies Stripe webhook signatures

## Environment Configuration

The service automatically loads Stripe public key from:
```
GET /api/merchandise/payment-health
Response: { stripePublicKey: "pk_test_..." }
```

In production, set environment variable:
```
STRIPE_PUBLIC_KEY=pk_live_...
```

## Error Scenarios

### 1. Stripe Not Loaded
- Service logs error
- User sees "Failed to initialize payment form"
- Check browser console for specific error

### 2. Network Error
- API request fails
- User sees error message
- Can retry checkout

### 3. Payment Declined
- Stripe returns error
- User sees: "Card declined" or specific error
- User can try different card

### 4. Order Creation Failed
- Rare scenario: Payment succeeded but order creation failed
- Backend logs error for manual handling
- User notified to contact support

## Future Enhancements

1. **Shipping Cost Calculation**
   - Integrate with shipping provider API
   - Dynamic rates based on address
   - Multiple shipping options

2. **Discount Codes**
   - Apply coupon/promo codes
   - Calculate discount before payment

3. **Save Payment Methods**
   - Let customers save cards for faster checkout
   - Stripe Customer API integration

4. **Order Tracking**
   - Real-time order status
   - Integration with Printify status updates
   - Email notifications

5. **Multi-Currency Support**
   - Support international customers
   - Currency selection in checkout
   - Stripe multi-currency support

## Files Modified

1. `/views/merchandise-store.ejs`
   - Added Stripe.js library
   - Added StripeCheckoutService load
   - Updated required services check

2. `/static/js/components/merchandise-store.js`
   - Initialize StripeCheckoutService in constructor
   - Rewrote showCheckoutModal() with Stripe integration
   - Added initializeCheckout()
   - Added attachCheckoutFormHandler()
   - Added handleCheckoutSubmit()

3. **NEW** `/static/js/services/stripe-checkout-service.js`
   - Complete Stripe integration service

## Debugging

Enable debug logging in browser console:
```javascript
window.merchandiseStore.stripeCheckoutService.getStatus()
// Returns: { initialized, elementsCreated, paymentElementMounted, hasClientSecret, isProcessing }
```

Watch network tab for:
- `/api/merchandise/create-payment-intent` request/response
- `/api/merchandise/confirm-payment` request/response
- Stripe API calls (will show in browser's fetch monitoring)

## Support

For issues:
1. Check browser console for error messages
2. Check network tab for failed requests
3. Verify Stripe public key is being loaded
4. Test with Stripe test cards
5. Check backend logs for server-side errors

---

**Status**: ✅ Complete and Ready for Testing
**Next Steps**: Test with Tote Bag product and various payment scenarios
