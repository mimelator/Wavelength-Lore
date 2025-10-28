# Checkout Testing Guide - Quick Start

## Overview
This guide walks you through testing the complete checkout flow with a Tote Bag product, from design creation to successful payment.

## Prerequisites
- Server running on port 3001
- Authenticated user account
- Gallery images available for selection

## Step 1: Create a Custom Tote Bag

### 1.1 Navigate to Merchandise Store
- Go to `http://localhost:3001/merchandise`
- Wait for store to load completely

### 1.2 Select a Gallery Image
- Browse to "Design Your Custom Products" section
- Click on a gallery image you want to customize
- Click "Create Custom Tote Bag (AOP)"

### 1.3 Customize the Design
- The customization modal opens with preview
- **Add Effects** (Optional):
  - Check "Blur" effect
  - Adjust blur amount with slider
- **Add Border** (Optional):
  - Check "Add Border"
  - Choose border color (e.g., #FF5733)
- **Click "Update Preview"** to see changes
- **Review the preview** to ensure it looks good

### 1.4 Create the Product
- Click **"Create as Tote Bag (AOP)"** button
- Observe loading modal with product details
- Wait for "✨ Product mockup generated! Check it out below"
- The newly created product appears in your products list

## Step 2: View the Product

### 2.1 Locate the Product
- Scroll down to see your newly created product
- Product card shows:
  - Product mockup image
  - "Tote Bag (AOP)" title
  - Price (e.g., $19.95)
  - "Add to Cart" button

### 2.2 Review Product Details
- Hover over product to see more info
- Click product to view full details (optional)

## Step 2.5: VARIANTS - Select Size, Color, and Options

### 2.5.1 Understanding Product Variants
Each product type comes with multiple variants (sizes, colors, options):

| Product Type | Available Variants |
|---|---|
| T-Shirt | Sizes: XS, S, M, L, XL, XXL<br/>Colors: 20+ options<br/>Fits: Regular, Slim |
| Hoodie | Sizes: XS, S, M, L, XL, XXL<br/>Colors: 15+ options<br/>Style: Pullover, Zip-up |
| Tote Bag | Sizes: Standard, Large<br/>Colors: 10+ options |
| Mug | Sizes: 11oz, 15oz<br/>Options: White, Black |

### 2.5.2 Viewing Available Variants
When you view a product card, variants are displayed inline:

**Visual Layout**:
```
┌─────────────────────────────────────┐
│     Product Mockup Image            │
├─────────────────────────────────────┤
│ Tote Bag (AOP)                      │
│ $19.95 - 2 variants available       │
│                                     │
│ Available Options:                  │
│ ┌──────────────┐  ┌──────────────┐ │
│ │ Black        │  │ Navy Blue    │ │
│ │ $19.95   🛒  │  │ $19.95   🛒  │ │
│ └──────────────┘  └──────────────┘ │
│ ┌──────────────┐                   │
│ │ +1 more      │                   │
│ └──────────────┘                   │
└─────────────────────────────────────┘
```

**What You'll See**:
- **Variant Chips**: Small cards showing each variant option
- **Variant Name**: Title (e.g., "Black", "Size: L", "Regular Fit")
- **Variant Price**: Price for that specific variant (may vary)
- **Add Button**: 🛒 icon to add that specific variant to cart

### 2.5.3 How to Select and Add a Variant to Cart

**Option 1: Direct Add from Product Card**
1. On product card, find the variant you want
   - Example: Click on "Black" variant for a T-Shirt
2. Look at the variant chip
   - Shows variant name
   - Shows variant price
3. Click the 🛒 button on the variant chip
4. Variant is added to cart with that selection
5. You'll see: "Added to cart!" success message
6. Cart counter increases

**Example Scenario - T-Shirt with Different Sizes**:
```
Available Options:
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Size: M  │  │ Size: L  │  │ Size: XL │
│ $19.95   │  │ $19.95   │  │ $21.95   │
│ 🛒      │  │ 🛒      │  │ 🛒      │
└──────────┘  └──────────┘  └──────────┘

If you click 🛒 on "Size: L":
→ T-Shirt (Size L) added to cart at $19.95
```

### 2.5.4 Multiple Variants Scenario

**If Product Has More Than 3 Variants**:
- First 3 variants shown as chips
- "+X more" chip appears (e.g., "+2 more")
- Click "+X more" to expand and see all variants
- Then click 🛒 on your desired variant

**Example - T-Shirt with 8 Colors**:
```
Available Options:
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Black    │  │ White    │  │ Navy     │
│ $19.95   │  │ $19.95   │  │ $19.95   │
│ 🛒      │  │ 🛒      │  │ 🛒      │
└──────────┘  └──────────┘  └──────────┘
┌──────────┐
│ +5 more  │  ← Click to see Red, Blue, Green, etc.
└──────────┘
```

### 2.5.5 Variant Selection in Cart
After adding to cart, you can:
1. View selected variant in cart
   - Shows variant name in cart item
   - Shows variant price
   - Shows quantity (adjustable)
2. Remove the variant
   - Click delete/trash icon
   - Item removed from cart
3. Adjust quantity
   - Click +/- buttons
   - Changes quantity for that specific variant
4. Add different variant
   - Go back to product card
   - Add different variant (e.g., Size XL instead of L)
   - Both variants appear in cart as separate line items

**Cart Display Example**:
```
Your Cart:
┌────────────────────────────────┐
│ T-Shirt (Black, Size M)        │
│ $19.95 x 1         [+] [-] [X] │
├────────────────────────────────┤
│ T-Shirt (White, Size L)        │
│ $19.95 x 2         [+] [-] [X] │
├────────────────────────────────┤
│ Mug (15oz, Black)              │
│ $12.95 x 1         [+] [-] [X] │
└────────────────────────────────┘
Total: $62.85
```

### 2.5.6 Common Variant Selections

**Scenario 1: Different Colors of Same Product**
```
User wants: 2 black tote bags + 1 red tote bag
Steps:
1. Add "Black Tote Bag" to cart (qty: 2)
2. Go back to product card
3. Add "Red Tote Bag" to cart (qty: 1)
4. Cart shows both variants separately
5. Order total: 3 tote bags with different colors
```

**Scenario 2: Multiple Sizes for Resale/Gifts**
```
User wants: Small, Medium, Large t-shirts (different sizes)
Steps:
1. Add "Size S" T-Shirt → cart
2. Add "Size M" T-Shirt → cart
3. Add "Size L" T-Shirt → cart
4. Adjust quantities for each
5. Cart shows 3 line items (one per size)
6. At checkout, each size listed in order
```

**Scenario 3: Same Item, Different Variants**
```
User wants: Black hoodie (M), Navy hoodie (L), Black hoodie (L)
Steps:
1. Add "Black Hoodie (M)" to cart
2. Add "Navy Hoodie (L)" to cart
3. Go back and add "Black Hoodie (L)" to cart
4. Cart shows 3 separate items
5. All variants preserved through checkout
```

## Step 3: Add to Cart (Basic Flow - Without Variants)

### 3.1 Add Product to Cart
- Click the "Add to Cart" button on the product card
- A modal may appear asking for quantity/variant
- Select quantity (default 1)
- Click "Add to Cart"
- Observe success message: "Added to cart!"

### 3.2 View Cart
- Click the **Cart button** (🛒) in the top right
- Cart dropdown/modal opens showing:
  - Your Tote Bag product with price
  - Quantity selector
  - **Total: $19.95** (or adjusted price)
  - **Checkout button** (💳)

## Step 4: Proceed to Checkout

### 4.1 Open Checkout Modal
- Click the **"Checkout"** button in cart
- Large checkout modal opens with:
  - Order Summary section
  - Shipping Information form
  - Payment Information section (Stripe Payment Element)

### 4.2 Review Order Summary with Variants
The order summary shows all items including their variant selections:

**Single Item with Variant**:
```
Order Summary
Tote Bag (AOP) - Black, Standard - $19.95 x 1
────────────────────────────────────
Subtotal: $19.95
Tax: $1.60
Shipping: $0.00
────────────────────────────────────
Total: $21.55
```

**Multiple Items with Different Variants**:
```
Order Summary
T-Shirt - Black, Size M, Regular Fit - $19.95 x 1
Hoodie - Navy, Size L, Pullover - $34.95 x 1
Mug - Black, 15oz - $12.95 x 2
────────────────────────────────────
Subtotal: $112.75
Tax: $9.02
Shipping: $0.00
────────────────────────────────────
Total: $121.77
```

**What Variant Info Appears**:
- Product title: "Tote Bag (AOP)"
- Variant details: "Black, Standard" (color, size, etc.)
- Price per unit: "$19.95"
- Quantity: "x 1"
- Total line item: Product + variants shown

**Verify in Checkout Modal**:
- Each cart item appears with its specific variants
- Prices reflect variant selection (some variants may cost more)
- Quantities are correct
- Total is calculated correctly
- Variant selections match what you chose in the cart

## Step 5: Fill Shipping Information

### 5.1 Enter Personal Information
| Field | Test Value |
|-------|-----------|
| First Name | John |
| Last Name | Doe |
| Email | john@example.com |

### 5.2 Enter Address
| Field | Test Value |
|-------|-----------|
| Address Line 1 | 123 Main Street |
| Address Line 2 | (leave blank) |
| City | San Francisco |
| State | CA |
| ZIP Code | 94102 |
| Country | United States |

### 5.3 Verify Form Layout
- All fields should be visible and properly styled
- Fields should have proper focus states when clicked

## Step 6: Enter Payment Information

### 6.1 Wait for Stripe Payment Element
- Payment Element should load below shipping form
- Shows card entry field with Stripe styling
- "Place Order" button enabled

### 6.2 Enter Test Card Number
Use one of Stripe's test cards:

**Successful Payment:**
- Card Number: `4242 4242 4242 4242`
- Expiration: `12/25` (any future date)
- CVC: `123` (any 3 digits)
- Name: Any name

**Card Declined (for negative testing):**
- Card Number: `4000 0000 0000 0002`
- Expiration: `12/25`
- CVC: `123`

**3D Secure (for testing additional auth):**
- Card Number: `4000 0025 0000 3155`
- Expiration: `12/25`
- CVC: `123`

## Step 7: Submit Payment

### 7.1 Review Before Submitting
- ✓ Shipping form fully filled
- ✓ All fields have valid values
- ✓ Card details entered
- ✓ Order total is correct ($19.95)

### 7.2 Click "Place Order"
- Button should show loading state:
  - Text changes to show spinner
  - Button becomes disabled
  - Cannot double-click

### 7.3 Watch for Payment Processing
- Browser console shows:
  ```
  💳 Processing payment...
  💳 Confirming payment with Stripe...
  ✅ Payment submitted successfully
  ✅ Confirming payment with backend...
  ```
- Modal stays open while processing

## Step 8: Order Confirmation

### 8.1 Success Indicators
After successful payment:
- ✅ Green success message: "Order placed successfully! Order ID: [orderId]"
- Modal closes
- Cart is cleared
- Page redirects to: `/merchandise?order_confirmation=[orderId]`

### 8.2 Order Confirmation Page
- Displays order details
- Shows order ID
- Lists product(s) ordered
- Shows shipping address
- Displays order total

## Step 9: Verify Backend Processing

### 9.1 Check Server Logs
Look for these log entries:
```
✅ Confirming payment and creating order
🔑 Creating payment intent for checkout
✅ Printify API response status: 200
✅ Customized product stored
✅ Product added to products array for immediate display
```

### 9.2 Verify Database
- Order should be stored in Firebase
- User's order history updated
- Product linked to order

## Troubleshooting

### Issue: Stripe Payment Element Not Appearing
**Symptoms**: Empty div below shipping form

**Solutions**:
1. Check browser console for errors
2. Verify Stripe public key loaded:
   ```javascript
   window.merchandiseStore.stripeCheckoutService.stripe
   ```
3. Check network tab for `/api/merchandise/payment-health` request
4. Ensure Stripe.js library loaded from CDN

### Issue: Form Validation Error
**Symptoms**: Error message above submit button

**Solutions**:
1. Fill all required fields (all except Address Line 2)
2. Use valid email format
3. Ensure ZIP code is 5 digits
4. Try again after fixing errors

### Issue: Payment Declined
**Symptoms**: Error message "Card declined"

**Solutions**:
1. Use valid test card number
2. Use future expiration date
3. Use any 3-digit CVC
4. Try different test card

### Issue: Payment Succeeded but Order Not Created
**Symptoms**: Success message but no order in database

**Solutions**:
1. Check server logs for errors
2. Verify Printify API connection
3. Check network tab for `/confirm-payment` response
4. Contact backend support

## Advanced Testing Scenarios

### Scenario 1: Multiple Products in Cart
1. Create 2 different custom products (e.g., Tote + T-Shirt)
2. Add both to cart
3. Checkout with both items
4. Verify order total includes both products

### Scenario 2: Edit Existing Product
1. After creating product, click "Edit" button
2. Modify customization (change effects/border)
3. Regenerate preview
4. Click "Update Product"
5. Verify changes reflected in product card

### Scenario 3: Single Product, Multiple Variants in Cart
**Objective**: Test adding the same product with different variants

**Steps**:
1. Locate a product card with variants (e.g., T-Shirt)
2. Add "Black, Size M" variant to cart → Success message
3. Cart shows: "T-Shirt (Black, M) x1"
4. Go back to product list
5. Add "Blue, Size L" variant to cart → Success message
6. Cart shows:
   ```
   T-Shirt (Black, M) x1 - $19.95
   T-Shirt (Blue, L) x1 - $19.95
   ────────────────────────────
   Total: $43.90 (with tax)
   ```
7. Proceed to checkout
8. Order summary shows BOTH variants separately
9. Pay and complete order
10. **Verify**: Order contains both items with correct variants

**Expected Result**:
- Two separate line items in cart
- Both variants preserved through checkout
- Both variants appear in final order
- Total calculated correctly for both items

### Scenario 4: Variant Quantity Management
**Objective**: Test adjusting quantities for different variants

**Steps**:
1. Add "Black Tote Bag" to cart (qty: 1)
2. Add "Red Tote Bag" to cart (qty: 1)
3. In cart, increase Black Tote to qty: 2
   - Click + button twice
   - Cart shows "Black Tote (qty: 2)"
4. Increase Red Tote to qty: 3
5. Cart displays:
   ```
   Black Tote Bag x 2 - $39.90
   Red Tote Bag x 3 - $59.85
   ────────────────────────────
   Total: $107.79 (with tax)
   ```
6. Checkout and complete order
7. **Verify**: Order reflects correct quantities per variant

**Expected Result**:
- Each variant maintains independent quantity
- Total calculation correct
- Order confirmation shows 2 black + 3 red = 5 total items

### Scenario 5: Removing Variants from Cart
**Objective**: Test removing specific variants while keeping others

**Steps**:
1. Add 3 different variants to cart:
   - Hoodie (Black, M) x1
   - Hoodie (Navy, L) x1
   - T-Shirt (White, M) x1
2. Cart shows 3 items
3. Remove the Navy Hoodie by clicking X/Delete button
4. Cart now shows:
   - Hoodie (Black, M) x1
   - T-Shirt (White, M) x1
5. Verify total updated (no longer includes Navy Hoodie)
6. Checkout and complete
7. **Verify**: Order only includes 2 items (Black Hoodie + T-Shirt)

**Expected Result**:
- Variant removed completely from cart
- Other variants unaffected
- Total recalculated correctly
- Order reflects removal

### Scenario 6: Same Product, Same Variant, Multiple Quantities
**Objective**: Test quantity handling for single variant

**Steps**:
1. Add "Black T-Shirt, Size M" to cart once
2. Cart shows: "Black T-Shirt (Size M) x1 - $19.95"
3. Increase quantity to 5
   - Click + button 4 times
   - OR click quantity field, type "5"
4. Cart shows: "Black T-Shirt (Size M) x5 - $99.75"
5. Reduce quantity to 3
6. Cart shows: "Black T-Shirt (Size M) x3 - $59.85"
7. Checkout with qty: 3
8. **Verify**: Order shows 3 of the same item with same variant

**Expected Result**:
- Single line item in cart
- Quantity adjustable up/down
- Total adjusts with quantity
- Order correctly shows qty: 3

### Scenario 7: Mixed Items with Custom Customization and Variants
**Objective**: Test complex order with custom designs + variants

**Steps**:
1. Create custom Tote Bag design with effects
   - Add blur effect
   - Add red border
2. Product created: "Custom Tote Bag with Effects"
3. Add variant 1: "Black" color x2
4. Add variant 2: "White" color x1
5. Create NEW custom T-Shirt design with different effects
   - Add glow effect
   - Blue border
6. Product created: "Custom T-Shirt with Effects"
7. Add to cart: "Blue, Size L" x1
8. Cart now contains:
   ```
   Custom Tote (Black) with Effects - $19.95 x 2
   Custom Tote (White) with Effects - $19.95 x 1
   Custom T-Shirt (Blue, L) with Effects - $29.95 x 1
   ────────────────────────────────────────────
   Subtotal: $139.80
   Tax: $11.18
   ────────────────────────────────────────────
   Total: $150.98
   ```
9. Checkout and complete order
10. **Verify**: Order shows all items with:
    - Customization details (effects applied)
    - Variant selections (color, size)
    - Correct quantities
    - Correct pricing per item

**Expected Result**:
- Multiple custom products with variants
- All customizations preserved
- All variants preserved
- Complex total calculated correctly
- Order confirmation reflects full complexity

### Scenario 8: Variant Price Differences
**Objective**: Test products where variants have different prices

**Steps**:
1. Find product with price-different variants (e.g., Hoodie):
   - Size S: $29.95
   - Size M: $29.95
   - Size XL: $34.95 (premium size)
2. Add Size S to cart
3. Cart shows: "$29.95"
4. Add Size XL to cart
5. Cart now shows:
   ```
   Hoodie (S) - $29.95 x1
   Hoodie (XL) - $34.95 x1
   ────────────────────────
   Subtotal: $64.90
   ```
6. Notice XL costs more
7. Checkout and verify order reflects different prices
8. **Verify**: Premium variant pricing applied correctly

**Expected Result**:
- Variants with different prices handled correctly
- Cart total reflects variant pricing differences
- Order confirms variant-specific pricing

### Scenario 9: Failed Payment with Variants - Retry
**Objective**: Ensure variants persist if payment fails

**Steps**:
1. Add multiple variants to cart:
   - T-Shirt (Red, M) x2
   - T-Shirt (Blue, L) x1
2. Proceed to checkout
3. Fill shipping info
4. Enter card that declines: `4000 0000 0000 0002`
5. Click "Place Order"
6. See error: "Card declined"
7. Cart should still contain both variants
8. Retry with valid card: `4242 4242 4242 4242`
9. Complete payment successfully
10. **Verify**:
    - Cart variants preserved after failed attempt
    - Order created with correct variants
    - No duplicate items added

**Expected Result**:
- Failed payment doesn't clear cart
- Variants remain in cart for retry
- Successful retry creates order with original variants
- No duplicates created

### Scenario 10: Failed Payment Recovery - Already Completed
**Objective**: Test payment succeeded but order creation failed

**Steps**:
1. Add variants: "Mug (15oz) x1"
2. Start checkout
3. Enter valid payment card
4. If order creation fails (rare):
   - Payment was confirmed with Stripe
   - Backend couldn't create Printify order
5. User sees error: "Payment succeeded but order creation failed"
6. User should NOT retry payment (already charged)
7. Contact support with payment ID
8. **Verify**: Error message is clear about situation

**Expected Result**:
- If this occurs, error message clearly states payment succeeded
- User advised not to re-attempt payment
- Payment ID provided for support tracking
- Variants preserved for manual order creation if needed

## Key URLs During Testing

| Step | URL |
|------|-----|
| Start | `http://localhost:3001/merchandise` |
| Checkout | Same page (modal overlay) |
| Success | `http://localhost:3001/merchandise?order_confirmation=[id]` |

## Success Checklist

- [ ] Created custom Tote Bag with effects
- [ ] Product appears in products list
- [ ] Added product to cart
- [ ] Cart shows correct total
- [ ] Checkout modal opens
- [ ] Order summary displays correctly
- [ ] Shipping form accepts all data
- [ ] Stripe Payment Element loads
- [ ] Payment processes successfully
- [ ] Order confirmation page displays
- [ ] Order stored in database
- [ ] Server logs show successful processing

## Performance Notes

- Page load: Should complete in <3 seconds
- Customization modal: Should open immediately
- Product creation: May take 5-10 seconds (Printify API)
- Checkout modal: Should open instantly
- Payment processing: Should complete in 2-5 seconds

## Next Steps After Testing

1. **Test with Real Products**: Repeat with different product types
2. **Test with Variations**: Create products with different variants
3. **Test Error Scenarios**: Try declined cards, invalid data
4. **Monitor Orders**: Check Printify dashboard for order status
5. **User Testing**: Have others test the full flow
6. **Performance Testing**: Load test with concurrent users

---

**Ready to test?** Start with Step 1 above! 🎉
