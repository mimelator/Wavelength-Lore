# Product Variants & Checkout Flow - Complete Guide

## What Are Product Variants?

**Variants** are different options or configurations of the same product. Instead of each size/color being a separate product, they are displayed as selectable options within a single product.

### Examples of Variants

| Product | Variant Types | Examples |
|---------|--------------|----------|
| **T-Shirt** | Size, Color, Fit | Black/XS/Regular, Blue/M/Slim, White/L/Regular |
| **Hoodie** | Size, Color, Style | Navy/M/Pullover, Black/XL/Zip-up |
| **Tote Bag** | Size, Color | Black/Standard, Red/Large |
| **Mug** | Size, Color | 11oz/White, 15oz/Black |
| **Sweatpants** | Size, Color, Length | M/Black/Standard, L/Gray/Petite |

---

## How Variants Are Displayed

### Product Card Layout

When you view a product with multiple variants, you'll see:

```
┌─────────────────────────────────────────┐
│                                         │
│    [Product Mockup Image]               │
│                                         │
├─────────────────────────────────────────┤
│ T-Shirt (AOP)                           │
│ 8 variants available                    │
│ Price range: $19.95 - $21.95            │
│                                         │
│ Available Options:                      │
│ ┌──────────────┐  ┌──────────────┐    │
│ │ Black        │  │ Size: M      │    │
│ │ $19.95   🛒  │  │ $19.95   🛒  │    │
│ └──────────────┘  └──────────────┘    │
│ ┌──────────────┐  ┌──────────────┐    │
│ │ White        │  │ Regular Fit  │    │
│ │ $19.95   🛒  │  │ $19.95   🛒  │    │
│ └──────────────┘  └──────────────┘    │
│ ┌──────────────┐                      │
│ │ +4 more      │                      │
│ └──────────────┘                      │
└─────────────────────────────────────────┘
```

### Variant Chip Components

Each variant is displayed as a "chip" with:
- **Variant Name**: What makes this variant unique (e.g., "Black", "Size M", "Pullover")
- **Variant Price**: Cost of this specific variant (may vary based on size/complexity)
- **Add Button (🛒)**: Click to add this specific variant to cart

---

## User Interaction Flow

### Step 1: View Available Variants

When you browse products, you immediately see:
- How many variants are available
- Price range (if variants have different prices)
- First 3 variants displayed as chips
- "+X more" indicator if additional variants exist

### Step 2: Select a Variant

**To add a specific variant to your cart**:

```
1. Identify the variant you want
   Example: "Black T-Shirt, Size M"

2. Look for that variant chip
   Shows: "Black", price, 🛒 button
   OR: "Size M", price, 🛒 button

3. Click the 🛒 button on that chip

4. Variant added to cart
   Success message: "Added to cart!"
```

### Step 3: View in Cart

After adding to cart, the variant appears with:
- Product name + variant details
- Price for that variant
- Quantity (adjustable)
- Remove button

**Example Cart Display**:
```
Your Cart
────────────────────────────────
T-Shirt (Black, Size M)
$19.95 × 1
[+] [-] [X]
────────────────────────────────
```

### Step 4: Add Different Variant of Same Product

You can add multiple variants of the same product:

```
1. Add "T-Shirt, Black, Size M" → Added to cart
   Cart shows: T-Shirt (Black, M) x1

2. Return to product list

3. Add "T-Shirt, Blue, Size L" → Added to cart
   Cart now shows:
   - T-Shirt (Black, M) x1 - $19.95
   - T-Shirt (Blue, L) x1 - $19.95

4. Both variants appear as SEPARATE line items
```

### Step 5: Adjust Quantities

For each variant in your cart:
- Click **+** to increase quantity
- Click **-** to decrease quantity
- Click **[X]** to remove entirely

```
T-Shirt (Blue, L) x1
Click + → T-Shirt (Blue, L) x2
Click + → T-Shirt (Blue, L) x3
Click - → T-Shirt (Blue, L) x2
Click - → T-Shirt (Blue, L) x1
Click [X] → Item removed from cart
```

---

## Cart Organization with Variants

### Single Product, Single Variant (Simple Case)

```
Cart:
T-Shirt (Black, Size M) × 3
────────────────────────────
Total: $59.85
```

### Single Product, Multiple Variants

```
Cart:
T-Shirt (Black, Size M) × 1     $19.95
T-Shirt (White, Size L) × 2     $39.90
T-Shirt (Blue, Size XL) × 1     $21.95
────────────────────────────────
Subtotal:                        $81.80
Tax:                             $6.54
────────────────────────────────
Total:                           $88.34
```

**Key Point**: Each variant is a separate line item with its own quantity and subtotal.

### Multiple Products, Multiple Variants

```
Cart:
T-Shirt (Black, M) × 1          $19.95
T-Shirt (White, L) × 1          $19.95
Hoodie (Navy, M) × 2            $69.90
Hoodie (Black, XL) × 1          $34.95
Mug (11oz, White) × 3           $38.85
────────────────────────────────
Subtotal:                        $183.60
Tax:                             $14.69
────────────────────────────────
Total:                           $198.29
```

---

## Checkout with Variants

### Order Summary Shows All Variants

When you proceed to checkout, the order summary displays each variant:

```
CHECKOUT MODAL
══════════════════════════════════════
Order Summary

T-Shirt (Black, Size M) - $19.95 × 1
T-Shirt (White, Size L) - $19.95 × 2
Hoodie (Navy, Size M) - $34.95 × 1
Mug (White, 11oz) - $12.95 × 1

────────────────────────────────────
Subtotal:                    $112.75
Tax:                           $9.02
Shipping:                       $0.00
────────────────────────────────────
Total:                       $121.77

[Continue to Shipping Form]
```

### Variant Information Preserved

At checkout, the system preserves:
- **Variant Name/Details**: "Black", "Size M", "Pullover", etc.
- **Variant Price**: Correct price for that specific variant
- **Quantity**: How many of this variant
- **Customization**: Any effects/borders applied to custom products

---

## Real-World Scenarios

### Scenario 1: Buying for Different People

**Situation**: Buying gifts for family members with different sizes

```
User's Intent:
- Mom: T-Shirt, White, Small
- Dad: T-Shirt, Black, Large
- Sister: T-Shirt, Blue, Medium

User's Actions:
1. Click 🛒 on "White, Size S" → Added to cart
2. Click 🛒 on "Black, Size L" → Added to cart
3. Click 🛒 on "Blue, Size M" → Added to cart

Cart Now Shows:
- T-Shirt (White, S) × 1
- T-Shirt (Black, L) × 1
- T-Shirt (Blue, M) × 1

Checkout:
- Order summary shows all 3 with correct variants
- Shipping address filled once (ships to one person)
- OR: User notes "Ship separately" in special instructions

Order Confirmation:
- 3 T-Shirts with correct variants
- Can be split across 3 shipments if requested
```

### Scenario 2: Buying Multiples of Different Variants

**Situation**: Ordering merchandise for a team in different sizes

```
User's Intent:
- 2 Small T-Shirts (Black)
- 3 Medium T-Shirts (Blue)
- 2 Large T-Shirts (Black)

User's Actions:
1. Click 🛒 on "Black, Size S" → Added
2. Click + twice → Black, S now qty: 3 (user adjusted)
3. Click + → Black, S qty: 4 (accidental)
4. Click - → Black, S qty: 2 (fixed)
5. Click 🛒 on "Blue, Size M" → Added
6. Click + twice → Blue, M qty: 3
7. Click 🛒 on "Black, Size L" → Added
8. Click + → Black, L qty: 2

Cart Display:
T-Shirt (Black, S) × 2     $39.90
T-Shirt (Blue, M) × 3      $59.85
T-Shirt (Black, L) × 2     $39.90
─────────────────────────────
Total:                      $139.65

Order Confirmation:
✓ 2 Black Small T-Shirts
✓ 3 Blue Medium T-Shirts
✓ 2 Black Large T-Shirts
✓ Total: 7 T-Shirts with correct sizes/colors
```

### Scenario 3: Custom Products with Variant Selection

**Situation**: Creating custom designs and then choosing different variants

```
User's Actions:
1. Create custom Tote Bag with blur effect
   → Custom Tote with effects created
2. Product card shows variants available: Black, Red, Navy
3. Add "Black" variant → Cart shows "Custom Tote (Black, with effects)"
4. Add "Red" variant → Cart shows "Custom Tote (Red, with effects)"
5. Increase Red quantity to 2

Cart Display:
Custom Tote Bag with Blur Effect (Black) × 1    $19.95
Custom Tote Bag with Blur Effect (Red) × 2      $39.90
─────────────────────────────────────────────────
Subtotal:                                        $59.85
Tax:                                             $4.79
─────────────────────────────────────────────────
Total:                                           $64.64

Order Shows:
✓ 1 Custom Tote (Black) - Effects: Blur
✓ 2 Custom Totes (Red) - Effects: Blur
✓ All customizations preserved with correct variants
```

---

## Variant Pricing

### Standard Pricing

Most variants cost the same:
- Black T-Shirt: $19.95
- White T-Shirt: $19.95
- Blue T-Shirt: $19.95

### Premium Variant Pricing

Some variants cost more (e.g., larger sizes):
- Hoodie Size S: $29.95
- Hoodie Size M: $29.95
- Hoodie Size XXL: $34.95 (Premium size)

**In Cart**:
```
Hoodie (S, Black) × 1     $29.95
Hoodie (XXL, Black) × 1   $34.95
─────────────────────────
Total:                    $64.90
```

The system automatically applies the correct price per variant.

---

## Technical Details

### How Variants Work Behind the Scenes

**Product Structure**:
```javascript
{
  id: "shirt-001",
  title: "T-Shirt (AOP)",
  variants: [
    {
      id: "var-black-m",
      title: "Black, Size M",
      price: 1995, // in cents: $19.95
      color: "Black",
      size: "M"
    },
    {
      id: "var-blue-l",
      title: "Blue, Size L",
      price: 1995,
      color: "Blue",
      size: "L"
    },
    // ... more variants
  ]
}
```

**Cart Item with Variant**:
```javascript
{
  productId: "shirt-001",
  variantId: "var-black-m",
  title: "T-Shirt (AOP)",
  quantity: 2,
  price: 19.95,
  variant: {
    color: "Black",
    size: "M"
  }
}
```

**Order Item**:
```javascript
{
  productId: "shirt-001",
  productTitle: "T-Shirt (AOP)",
  variantId: "var-black-m",
  variantTitle: "Black, Size M",
  quantity: 2,
  unitPrice: 19.95,
  totalPrice: 39.90
}
```

### Cart Management

- Each **unique variant** = separate cart line item
- **Quantities** are tracked per variant
- **Prices** are variant-specific
- **Customizations** are stored per variant

---

## Key Concepts

### Variant vs. Product
- **Product**: Generic item (e.g., "T-Shirt (AOP)")
- **Variant**: Specific configuration (e.g., "T-Shirt, Black, Size M")

### Variant ID
- Unique identifier for each variant
- Prevents mixing up different sizes/colors
- Used to track specific variant through checkout

### Variant Display
- **Chip**: Interactive UI element showing one variant
- **"+X more"**: Indicates additional variants exist
- Can expand to see all available variants

### Cart Line Item
- One variant with a quantity
- Multiple line items = multiple variants in cart
- Each line item has independent quantity controls

---

## Common Questions

### Q: Can I add the same variant twice?
**A**: No. If you add "Black T-Shirt, Size M" twice, the quantity increases to 2 (not two separate items).

### Q: Can I add different variants of the same product?
**A**: Yes! Each variant is treated as a unique line item. You can add Size M and Size L to the same cart.

### Q: Do variants have different prices?
**A**: Usually not, but some do (e.g., larger sizes may cost more). The system automatically applies the correct price.

### Q: Are variants preserved during checkout?
**A**: Absolutely. Each variant's details (size, color, etc.) are preserved all the way through order confirmation and fulfillment.

### Q: Can I apply custom effects to a specific variant?
**A**: When you create a custom product, all variants inherit the same customization. You can create multiple products with different customizations if needed.

### Q: What happens if I add variants then remove some?
**A**: Only the removed variants are deleted. Other variants stay in cart with correct quantities and prices.

---

## Troubleshooting Variants

### Variant Not Showing
**Problem**: Expected variant doesn't appear on product card

**Solutions**:
1. Click "+X more" to expand full variant list
2. Refresh page if variant recently added
3. Check if product is still loading (processing)

### Wrong Variant Added
**Problem**: Added wrong size/color to cart

**Solution**:
1. Click [X] button to remove from cart
2. Add correct variant

### Variant Price Incorrect
**Problem**: Cart shows different price than expected

**Possible Causes**:
- Different variant has different price (intentional)
- Tax added at checkout (not in preview)
- Quantity calculation error (check quantity)

**Solution**:
1. Verify variant matches what you intended
2. Check if premium pricing applies (e.g., XXL size)
3. Verify quantity is correct

### Variants Not Showing in Order Confirmation
**Problem**: Order confirmation doesn't show variant details

**Expected Behavior**:
- Variant details SHOULD appear in confirmation
- If missing, order may still be correct (backend processes variant IDs)

**Verification**:
1. Check order details page
2. Check Printify dashboard for correct variant
3. Contact support if details are missing

---

## Summary

**Variants enable customers to**:
- Select specific sizes, colors, and options
- Add multiple configurations to one cart
- Maintain independent quantities per variant
- See exact pricing per variant
- Preserve all selections through checkout

**The system handles**:
- Display of available variants (chips, "+X more")
- Unique identification of each variant
- Separate cart line items per variant
- Independent quantity management
- Correct pricing per variant
- Preservation of variant details through order

**User Experience Benefits**:
- Intuitive variant selection
- Easy to compare variants
- Can build complex orders
- Clear pricing visibility
- Variants preserved through entire checkout flow

---

**Ready to test variants?** See `CHECKOUT_TESTING_GUIDE.md` for Scenario 3+ which cover variant testing in detail! 🛍️
