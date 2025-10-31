# 🛒 UNIFIED COMMERCE INTEGRATION STRATEGY

**Document:** Centralized Merch Store Architecture  
**Project:** WavelengthHub Commerce Integration  
**Date:** October 31, 2025  

---

## 🎯 COMMERCE PHILOSOPHY: ONE SHOP, MANY CREATORS

**You and your team** handle ALL commerce complexity centrally:
- **Single Stripe account** (yours) processes all payments
- **Single Printify account** (yours) handles all fulfillment  
- **LoreMasters focus on creativity**, not commerce operations
- **Unified shop experience** with cross-promotion opportunities

---

## 🏗️ INTEGRATION APPROACH: ENHANCE EXISTING STORE

### **RECOMMENDED: Single Enhanced Store (NO SHUTDOWN REQUIRED)**
```javascript
// Keep wavelengthlore.com/shop as THE store for everyone
const SINGLE_STORE_STRATEGY = {
  approach: 'Enhance existing wavelengthlore.com/shop to serve all LoreMasters',
  
  what_stays: [
    'Same domain: wavelengthlore.com/shop',
    'Same Stripe/Printify integrations',
    'All existing products and order history',
    'Zero downtime or migration risk'
  ],
  
  what_gets_added: [
    'LoreMaster product management via API',
    'Revenue splitting for new products',
    'Cross-promotion between creators',
    'LoreMaster dashboards in WavelengthHub'
  ],
  
  user_experience: [
    'Wavelength Lore users: No change in shopping experience',
    'New LoreMasters: Products appear in same unified store',
    'All customers: Discover products from all creators in one place',
    'Cross-promotion: Natural discovery of related creators'
  ]
};
```

### **Why This Approach is Superior**
```javascript
const WHY_SINGLE_STORE_WINS = {
  technical: [
    'No new store to build = 2-3 months saved',
    'Leverage proven payment processing',
    'Single codebase to maintain',
    'No data migration needed'
  ],
  
  business: [
    'Zero revenue disruption',
    'Customers already trust wavelengthlore.com',
    'SEO juice preserved',
    'Cross-selling opportunities maximized'
  ],
  
  user_experience: [
    'Familiar shopping experience',
    'Single cart across all creators',
    'Unified customer service',
    'Better discovery through browsing'
  ]
};
```

## 🚀 **IMPLEMENTATION: ENHANCE WITHOUT DISRUPTION**

### Phase 1: Multi-Tenant Enhancement (Weeks 1-4)
**ZERO DOWNTIME - Store stays live throughout enhancement**
```javascript
// Extend current merch store database schema
// Add to existing wavelengthlore.com database:

// New table for LoreMaster management
CREATE TABLE lore_masters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  site_slug VARCHAR(100) UNIQUE, -- 'wavelength-lore', 'artist-name', etc
  site_url VARCHAR(255),
  revenue_share DECIMAL(3,2) DEFAULT 0.65, -- 65% default
  stripe_connect_account VARCHAR(100), -- For automated payouts
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

// Extend existing products table
ALTER TABLE products ADD COLUMN lore_master_id UUID REFERENCES lore_masters(id);
ALTER TABLE products ADD COLUMN cross_promote BOOLEAN DEFAULT true;

// Add revenue tracking to orders
ALTER TABLE orders ADD COLUMN revenue_breakdown JSONB;
ALTER TABLE orders ADD COLUMN lore_master_payouts JSONB;

// Update existing Wavelength Lore products
UPDATE products SET lore_master_id = (
  SELECT id FROM lore_masters WHERE site_slug = 'wavelength-lore'
) WHERE lore_master_id IS NULL;
```

### Enhanced Product Management
```javascript
// Enhanced product creation with LoreMaster support
// File: /existing/merch-store/services/product-service.js

class EnhancedProductService {
  async createProduct(productData, loreMasterId) {
    // Validate LoreMaster permissions
    const loreMaster = await this.validateLoreMaster(loreMasterId);
    
    // Create product with LoreMaster association
    const product = await this.db.products.create({
      ...productData,
      lore_master_id: loreMasterId,
      // Your existing product creation logic
    });
    
    // Create in Printify (using your existing integration)
    const printifyProduct = await this.printify.createProduct({
      ...product,
      title: `${loreMaster.name} - ${product.title}`,
      tags: [...product.tags, loreMaster.site_slug]
    });
    
    // Update with Printify ID
    return this.db.products.update(product.id, {
      printify_product_id: printifyProduct.id
    });
  }
  
  async getProductsByLoreMaster(loreMasterId, includeOthers = false) {
    let query = this.db.products.where({ lore_master_id: loreMasterId });
    
    if (includeOthers) {
      // Include cross-promotion products from other LoreMasters
      query = query.orWhere({ 
        cross_promote: true,
        is_active: true 
      });
    }
    
    return query.orderBy('created_at', 'desc');
  }
}
```

### Revenue Splitting Integration
```javascript
// Enhanced order processing with automatic revenue splits
// File: /existing/merch-store/services/order-service.js

class EnhancedOrderService {
  async processOrder(orderData) {
    // Your existing order creation logic
    const order = await this.createOrder(orderData);
    
    // Calculate revenue splits for each item
    const revenueBreakdown = await this.calculateRevenueSplits(order.items);
    
    // Process payment through your existing Stripe integration
    const payment = await this.stripe.paymentIntents.create({
      amount: order.total * 100,
      currency: 'usd',
      metadata: {
        order_id: order.id,
        revenue_splits: JSON.stringify(revenueBreakdown)
      }
    });
    
    // Update order with revenue tracking
    await this.db.orders.update(order.id, {
      stripe_payment_intent: payment.id,
      revenue_breakdown: revenueBreakdown
    });
    
    return order;
  }
  
  async calculateRevenueSplits(orderItems) {
    const breakdown = [];
    
    for (const item of orderItems) {
      const product = await this.db.products.findById(item.product_id);
      const loreMaster = await this.db.lore_masters.findById(product.lore_master_id);
      
      const itemTotal = item.price * item.quantity;
      
      breakdown.push({
        product_id: item.product_id,
        lore_master_id: product.lore_master_id,
        lore_master_name: loreMaster.name,
        item_total: itemTotal,
        splits: {
          lore_master: itemTotal * loreMaster.revenue_share, // 65%
          platform: itemTotal * 0.20, // 20%
          fulfillment: itemTotal * 0.15 // 15%
        }
      });
    }
    
    return breakdown;
  }
  
  // Weekly automated payouts to LoreMasters
  async processWeeklyPayouts() {
    const payoutData = await this.calculateWeeklyEarnings();
    
    for (const loreMaster of payoutData) {
      if (loreMaster.earnings > 25) { // $25 minimum payout
        await this.stripe.transfers.create({
          amount: Math.round(loreMaster.earnings * 100),
          currency: 'usd',
          destination: loreMaster.stripe_connect_account,
          description: `Weekly earnings for ${loreMaster.name}`,
          metadata: {
            lore_master_id: loreMaster.id,
            period: loreMaster.period
          }
        });
        
        // Record payout in database
        await this.recordPayout(loreMaster);
      }
    }
  }
}
```

---

## 🏗️ **DATA FLOW ARCHITECTURE**

### **Commerce API = Shared Product Catalog Hub**
```javascript
const DATA_FLOW = {
  commerce_api_database: {
    role: 'Single source of truth for ALL products',
    serves: [
      'wavelengthlore.com/shop (enhanced existing store)',
      'LoreMaster sites (product showcases)', 
      'Admin dashboards (revenue tracking)',
      'Mobile apps (future)',
      'Third-party integrations (future)'
    ]
  },
  
  enhanced_store: {
    gets_data_from: 'Commerce API',
    no_local_products: true,
    handles: ['Shopping cart', 'Checkout', 'Order fulfillment'],
    displays: 'Products from Commerce API with LoreMaster filtering'
  },
  
  loremaster_sites: {
    gets_data_from: 'Commerce API', 
    shows: ['Their own products', 'Cross-promotion products'],
    checkout: 'Redirects to wavelengthlore.com/shop with SSO'
  }
};
```

### **Enhanced Store Product Display Logic**
```javascript
// wavelengthlore.com/shop/routes/products.js
// Gets ALL product data from Commerce API

app.get('/shop', async (req, res) => {
  // Fetch all active products from Commerce API
  const allProducts = await commerceAPI.getProducts({
    active: true,
    include_cross_sell: true
  });
  
  // Group by LoreMaster for display
  const productsByLoreMaster = groupBy(allProducts, 'lore_master_name');
  
  res.render('shop/index', {
    featuredProducts: allProducts.slice(0, 8),
    wavelengthLoreProducts: productsByLoreMaster['Wavelength Lore'] || [],
    otherLoreMasters: Object.entries(productsByLoreMaster)
      .filter(([name]) => name !== 'Wavelength Lore'),
    crossPromotionProducts: allProducts.filter(p => p.cross_promote)
  });
});

app.get('/shop/loremaster/:slug', async (req, res) => {
  // Show products from specific LoreMaster
  const products = await commerceAPI.getProductsByLoreMaster(req.params.slug);
  const loreMaster = await commerceAPI.getLoreMaster(req.params.slug);
  
  res.render('shop/loremaster', {
    loreMaster,
    products,
    crossSellProducts: await commerceAPI.getCrossSellProducts(req.params.slug)
  });
});
```

---

## 🔗 INTEGRATION WITH WAVELENGTHHUB

### Cross-Site Product Discovery
```javascript
// LoreMaster sites show products from Commerce API
// File: /wavelength-hub/components/ProductShowcase.tsx

export function ProductShowcase({ loreMasterId, showCrossSell = true }) {
  const [products, setProducts] = useState([]);
  
  useEffect(() => {
    // Fetch products directly from Commerce API
    fetch(`https://commerce-api.wavelengthhub.com/api/products`, {
      headers: {
        'Authorization': `Bearer ${ssoToken}`,
        'X-LoreMaster-ID': loreMasterId
      }
    })
    .then(res => res.json())
    .then(data => {
      // Commerce API returns products for this LoreMaster + cross-sell
      setProducts(data.products);
    });
  }, [loreMasterId, showCrossSell]);
  
  return (
    <div className="product-grid">
      {products.map(product => (
        <ProductCard 
          key={product.id}
          product={product}
          // All purchases go through enhanced wavelengthlore.com store
          buyUrl={`https://wavelengthlore.com/shop/product/${product.slug}?utm_source=${loreMasterId}`}
          isCrossSell={product.lore_master_id !== loreMasterId}
        />
      ))}
    </div>
  );
}
```

### LoreMaster Product Management Interface
```javascript
// LoreMasters manage products via Commerce API
// File: /wavelength-hub/pages/dashboard/products.tsx

export default function ProductsDashboard({ loreMaster }) {
  const [products, setProducts] = useState([]);
  
  const createProduct = async (productData) => {
    // API call directly to Commerce API (not enhanced store)
    const response = await fetch('https://commerce-api.wavelengthhub.com/api/products', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ssoToken}`
      },
      body: JSON.stringify({
        ...productData,
        lore_master_id: loreMaster.id
      })
    });
    
    if (response.ok) {
      // Product now appears in Commerce API
      // Enhanced store will show it immediately
      fetchProducts();
    }
  };
  
  return (
    <div className="products-dashboard">
      <h2>Your Products</h2>
      
      {/* Simple product creation form */}
      <ProductCreationForm onSubmit={createProduct} />
      
      {/* Products list with edit/disable options */}
      <ProductsList 
        products={products}
        onEdit={editProduct}
        onToggle={toggleProductStatus}
      />
      
      {/* Revenue analytics */}
      <RevenueChart loreMasterId={loreMaster.id} />
    </div>
  );
}
```

---

## 💰 REVENUE & ANALYTICS INTEGRATION

### Centralized Revenue Dashboard (For You)
```javascript
// Admin dashboard showing all LoreMaster revenue
// File: /existing/merch-store/admin/revenue-dashboard.js

class RevenueDashboard {
  async getDashboardData(timeframe = '30d') {
    return {
      totalRevenue: await this.getTotalRevenue(timeframe),
      platformEarnings: await this.getPlatformEarnings(timeframe),
      loreMasterEarnings: await this.getLoreMasterEarnings(timeframe),
      topProducts: await this.getTopProducts(timeframe),
      loreMasterBreakdown: await this.getLoreMasterBreakdown(timeframe),
      crossPromotionStats: await this.getCrossPromotionStats(timeframe)
    };
  }
  
  async getLoreMasterBreakdown(timeframe) {
    return this.db.query(`
      SELECT 
        lm.name,
        lm.site_slug,
        COUNT(DISTINCT p.id) as product_count,
        COUNT(DISTINCT o.id) as order_count,
        SUM(rb.splits->>'lore_master')::decimal as earnings,
        AVG(rb.splits->>'lore_master')::decimal as avg_order_value
      FROM lore_masters lm
      LEFT JOIN products p ON p.lore_master_id = lm.id
      LEFT JOIN order_items oi ON oi.product_id = p.id
      LEFT JOIN orders o ON o.id = oi.order_id
      LEFT JOIN json_array_elements(o.revenue_breakdown) rb ON rb.lore_master_id = lm.id
      WHERE o.created_at >= NOW() - INTERVAL '${timeframe}'
      GROUP BY lm.id, lm.name, lm.site_slug
      ORDER BY earnings DESC
    `);
  }
}
```

### LoreMaster Revenue Dashboard
```javascript
// Simple revenue view for each LoreMaster
// File: /wavelength-hub/components/RevenueDashboard.tsx

export function RevenueDashboard({ loreMasterId }) {
  const [stats, setStats] = useState({});
  
  useEffect(() => {
    fetch(`/api/revenue/loremaster/${loreMasterId}`)
      .then(res => res.json())
      .then(setStats);
  }, [loreMasterId]);
  
  return (
    <div className="revenue-dashboard">
      <div className="stats-grid">
        <StatCard 
          title="This Month's Earnings" 
          value={stats.monthlyEarnings} 
          format="currency"
        />
        <StatCard 
          title="Total Products" 
          value={stats.productCount} 
        />
        <StatCard 
          title="Orders This Month" 
          value={stats.monthlyOrders} 
        />
        <StatCard 
          title="Average Order Value" 
          value={stats.avgOrderValue} 
          format="currency"
        />
      </div>
      
      {/* Simple earnings chart */}
      <EarningsChart data={stats.earningsHistory} />
      
      {/* Next payout info */}
      <PayoutInfo nextPayout={stats.nextPayout} />
    </div>
  );
}
```

---

## 🚀 IMPLEMENTATION TIMELINE

### **Week 1-2: Database & API Enhancement**
- Add LoreMaster tables to existing merch store database
- Enhance product and order APIs for multi-tenant support  
- Set up Stripe Connect for automated LoreMaster payouts

### **Week 3-4: LoreMaster Interface**
- Build product management interface in WavelengthHub
- Create revenue dashboard for LoreMasters
- Test revenue splitting with sample orders

### **Week 5-6: Cross-Site Integration**
- Add product showcases to LoreMaster sites
- Implement cross-promotion features
- Set up automated weekly payouts

### **Week 7-8: Testing & Launch**
- Test with early adopter LoreMasters
- Validate revenue splitting accuracy  
- Launch enhanced store with multi-tenant support

---

## ✅ **WHY THIS APPROACH WINS**

**🚀 Faster to Market**
- Enhance existing store vs building from scratch (weeks vs months)
- Leverage your proven Stripe/Printify integrations
- No migration risk for current Wavelength Lore revenue

**💰 Simplified Operations**  
- You handle ALL payment processing centrally
- LoreMasters get simple product management + revenue dashboards
- Automated payouts via Stripe Connect

**🔄 Cross-Promotion Built-In**
- All LoreMaster products in one store = natural discovery
- Customers can find related creators easily
- Higher average order values through bundling

**📊 Better Analytics**
- Centralized revenue tracking across all LoreMasters  
- Easy to optimize pricing and promotion strategies
- Clear visibility into platform performance

This approach gives you **maximum leverage of existing infrastructure** while providing LoreMasters with a **simple, professional commerce experience** they couldn't build themselves.

Ready to start enhancing the existing merch store?